import type { ActiveShape } from './types';
import {
	FRET_COUNT,
	OPEN_FRET_WIDTH,
	FRET_WIDTH,
	STRING_LABEL_WIDTH,
	STRING_ROW_HEIGHT,
	SHAPE_LABEL_Y_OFFSET,
	PENTATONIC_SHAPES,
	SCALE_INTERVALS,
	SHAPE_BORDER_COLORS
} from './constants';
import { createLRUCache } from './cache-utils';
import { getNoteIndex, getRootFret } from './music-utils';

// Memoization caches for shape calculations (24 entries handles all key/mode combinations)
const pentatonicShapeCache = createLRUCache<ActiveShape[]>(24);
const threeNPSShapeCache = createLRUCache<ActiveShape[]>(24);

/**
 * Calculate all pentatonic shapes for a given key (memoized)
 */
export function calculatePentatonicShapes(
	key: string,
	isMajor: boolean,
	stringBaseNotes: number[]
): ActiveShape[] {
	const cacheKey = `${key}-${isMajor}-${stringBaseNotes.join(',')}`;
	const cached = pentatonicShapeCache.get(cacheKey);
	if (cached) return cached;

	const rootFret = getRootFret(key, stringBaseNotes);
	const result: ActiveShape[] = [];

	// For major, use relative minor position (3 semitones down)
	const effectiveRootFret = isMajor ? (rootFret - 3 + 12) % 12 : rootFret;

	PENTATONIC_SHAPES.forEach((shape, index) => {
		for (let octave = -1; octave <= 2; octave++) {
			const startFret = effectiveRootFret + shape.startOffset + octave * 12;
			const maxFret = startFret + Math.max(...shape.path.map((p) => p[0]));
			const minFret = startFret + Math.min(...shape.path.map((p) => p[0]));

			if (maxFret >= 0 && minFret <= FRET_COUNT) {
				result.push({
					name: shape.name,
					startFret: startFret,
					colorIndex: index % SHAPE_BORDER_COLORS.length,
					path: shape.path
				});
			}
		}
	});

	result.sort((a, b) => a.startFret - b.startFret);
	pentatonicShapeCache.set(cacheKey, result);
	return result;
}

/**
 * Calculate 3NPS (Three Notes Per String) shapes for a given key and shape number.
 *
 * 3NPS is a guitar scale system where each string plays exactly 3 notes of the scale.
 * This creates consistent picking patterns and enables efficient position shifts.
 *
 * The algorithm works in 4 phases:
 *
 * **Phase 1: Calculate raw note positions**
 * For each string (0=high E, 5=low E), we calculate 3 consecutive scale degrees.
 * The starting degree shifts by 3 for each string going down (because standard tuning
 * is mostly 4ths = 5 frets, and 3 notes span about 4-5 frets).
 * Formula: stringOffset = (5 - stringIndex) * 3
 *
 * **Phase 2: Octave adjustment**
 * Notes are initially calculated as fret 0-11 positions. We adjust them to form
 * a continuous playable shape by:
 * - Starting from the low E string (index 5)
 * - Keeping each string's notes within a reasonable range of the previous string
 * - Range: [referenceFret - 3, referenceFret + 8] allows for position shifts
 * - Reference updates to the middle note of each string as we go up
 *
 * **Phase 3: Generate shape outline path**
 * Creates a polygon path by tracing:
 * - Right edge: highest fret on each string, bottom to top
 * - Left edge: lowest fret on each string, top to bottom
 * Path coordinates are relative to minFret for reusability across octaves.
 *
 * **Phase 4: Repeat for octaves**
 * The same shape pattern repeats every 12 frets. We generate instances
 * at octave offsets -1, 0, 1, 2 that are visible on the fretboard.
 *
 * @param key - Root note of the scale (e.g., "C", "G#")
 * @param shapeNumber - Shape position 1-7 (each starts on a different scale degree)
 * @param isMajor - True for major scale, false for natural minor
 * @param stringBaseNotes - Array of semitone values for open strings [high E, B, G, D, A, low E]
 * @returns Array of ActiveShape objects for rendering, sorted by position
 */
export function calculate3NPSShapes(
	key: string,
	shapeNumber: number,
	isMajor: boolean,
	stringBaseNotes: number[]
): ActiveShape[] {
	if (shapeNumber < 1 || shapeNumber > 7) return [];

	const cacheKey = `${key}-${shapeNumber}-${isMajor}-${stringBaseNotes.join(',')}`;
	const cached = threeNPSShapeCache.get(cacheKey);
	if (cached) return cached;

	const keyIndex = getNoteIndex(key);
	const intervals = SCALE_INTERVALS['3nps'][isMajor ? 'major' : 'minor'];
	const startDegree = shapeNumber - 1; // Convert 1-based to 0-based

	// Phase 1: Calculate raw note positions for each string
	const stringNotes: { fret: number; stringIndex: number }[][] = [];

	for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
		const stringBase = stringBaseNotes[stringIndex];
		const notesOnString: { fret: number; stringIndex: number }[] = [];
		// Offset increases by 3 for each string going down (towards bass)
		const stringOffset = (5 - stringIndex) * 3;

		for (let noteIdx = 0; noteIdx < 3; noteIdx++) {
			const degree = (startDegree + stringOffset + noteIdx) % 7;
			const semitones = intervals[degree];
			const noteIndex = (keyIndex + semitones) % 12;
			const baseFret = (noteIndex - stringBase + 12) % 12;
			notesOnString.push({ fret: baseFret, stringIndex });
		}

		stringNotes.push(notesOnString);
	}

	// Phase 2: Adjust octaves to form continuous shape (start from low E, work up)
	let referenceFret = stringNotes[5]?.[0]?.fret || 0;
	const adjustedNotes: { fret: number; stringIndex: number }[][] = [];

	for (let stringIndex = 5; stringIndex >= 0; stringIndex--) {
		const notes = stringNotes[stringIndex];
		const adjusted: { fret: number; stringIndex: number }[] = [];

		for (const note of notes) {
			let fret = note.fret;
			// Shift up octave if too far left of reference
			while (fret < referenceFret - 3) fret += 12;
			// Shift down octave if too far right of reference
			while (fret > referenceFret + 8) fret -= 12;
			adjusted.push({ fret, stringIndex: note.stringIndex });
		}

		adjusted.sort((a, b) => a.fret - b.fret);
		adjustedNotes[stringIndex] = adjusted;

		// Update reference to middle note for next string
		if (adjusted.length > 0) {
			referenceFret = adjusted[Math.floor(adjusted.length / 2)].fret;
		}
	}

	// Phase 3: Build shape outline path
	const allFrets = adjustedNotes.flat().map((n) => n.fret);
	const minFret = Math.min(...allFrets);
	const maxFret = Math.max(...allFrets);

	const simplePath: [number, number][] = [];

	// Right edge: trace highest fret on each string (low E → high E)
	for (let stringIndex = 5; stringIndex >= 0; stringIndex--) {
		const notes = adjustedNotes[stringIndex];
		if (notes && notes.length > 0) {
			const rightmost = notes[notes.length - 1];
			simplePath.push([rightmost.fret - minFret, stringIndex]);
		}
	}

	// Left edge: trace lowest fret on each string (high E → low E)
	for (let stringIndex = 0; stringIndex <= 5; stringIndex++) {
		const notes = adjustedNotes[stringIndex];
		if (notes && notes.length > 0) {
			const leftmost = notes[0];
			// Skip if same as rightmost (single-note edge)
			if (notes.length > 1 || stringIndex === 0) {
				simplePath.push([leftmost.fret - minFret, stringIndex]);
			}
		}
	}

	// Phase 4: Generate shapes at each visible octave
	const result: ActiveShape[] = [];

	for (let octave = -1; octave <= 2; octave++) {
		const startFret = minFret + octave * 12;
		const endFret = startFret + (maxFret - minFret);

		if (endFret >= 0 && startFret <= FRET_COUNT) {
			result.push({
				name: String(shapeNumber),
				startFret: startFret,
				colorIndex: (shapeNumber - 1) % SHAPE_BORDER_COLORS.length,
				path: simplePath
			});
		}
	}

	threeNPSShapeCache.set(cacheKey, result);
	return result;
}

/**
 * Get X position for a specific fret (center of fret cell)
 */
export function getFretX(fret: number): number {
	// Center of open fret: STRING_LABEL_WIDTH + OPEN_FRET_WIDTH/2
	if (fret === 0) return STRING_LABEL_WIDTH + OPEN_FRET_WIDTH / 2;
	// Center of regular fret: STRING_LABEL_WIDTH + OPEN_FRET_WIDTH + (fret-1)*FRET_WIDTH + FRET_WIDTH/2
	if (fret > 0) return STRING_LABEL_WIDTH + OPEN_FRET_WIDTH - FRET_WIDTH / 2 + fret * FRET_WIDTH;
	// Negative frets (for shapes extending past nut)
	return STRING_LABEL_WIDTH + OPEN_FRET_WIDTH / 2 + fret * FRET_WIDTH;
}

/**
 * Get Y position for a specific string (center of string row)
 * The 28px offset accounts for: fret numbers row (12px) + margin (12px) + half padding adjustment (4px)
 */
export function getStringY(stringIndex: number): number {
	const topOffset = 28;
	return topOffset + stringIndex * STRING_ROW_HEIGHT + STRING_ROW_HEIGHT / 2;
}

/**
 * Generate SVG path for a shape
 */
export function generateShapePath(shape: ActiveShape): string {
	if (!shape.path) return '';

	const points: { x: number; y: number }[] = [];

	for (const [fretOffset, stringIdx] of shape.path) {
		const fret = shape.startFret + fretOffset;
		const clampedFret = Math.max(0, Math.min(FRET_COUNT, fret));
		points.push({ x: getFretX(clampedFret), y: getStringY(stringIdx) });
	}

	if (points.length < 3) return '';

	return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';
}

/**
 * Check if shape overlaps with visible fretboard
 */
export function isShapeVisible(shape: ActiveShape): boolean {
	if (shape.path) {
		const frets = shape.path.map((p) => shape.startFret + p[0]);
		const minFret = Math.min(...frets);
		const maxFret = Math.max(...frets);
		return maxFret >= 0 && minFret <= FRET_COUNT;
	} else if (shape.endFret !== undefined) {
		return shape.endFret >= 0 && shape.startFret <= FRET_COUNT;
	}
	return false;
}

/**
 * Check if shape label should be visible
 */
export function isShapeLabelVisible(shape: ActiveShape): boolean {
	if (shape.path) {
		const frets = shape.path.map((p) => shape.startFret + p[0]);
		const minFret = Math.min(...frets);
		const maxFret = Math.max(...frets);
		const centerFret = (minFret + maxFret) / 2;
		return centerFret >= 0 && centerFret <= FRET_COUNT;
	} else if (shape.endFret !== undefined) {
		const centerFret = (shape.startFret + shape.endFret) / 2;
		return centerFret >= 0 && centerFret <= FRET_COUNT;
	}
	return false;
}

/**
 * Get center position for shape label
 */
export function getShapeLabelPosition(shape: ActiveShape): { x: number; y: number } {
	if (shape.path) {
		const frets = shape.path.map((p) => shape.startFret + p[0]);
		const minFret = Math.max(0, Math.min(...frets));
		const maxFret = Math.min(FRET_COUNT, Math.max(...frets));
		return {
			x: (getFretX(minFret) + getFretX(maxFret)) / 2,
			y: SHAPE_LABEL_Y_OFFSET
		};
	} else if (shape.endFret !== undefined) {
		// For rectangle shapes - calculate position using constants
		let left = STRING_LABEL_WIDTH;
		for (let i = 0; i < shape.startFret; i++) {
			left += i === 0 ? OPEN_FRET_WIDTH : FRET_WIDTH;
		}
		let width = 0;
		for (let i = shape.startFret; i <= shape.endFret; i++) {
			width += i === 0 ? OPEN_FRET_WIDTH : FRET_WIDTH;
		}
		return {
			x: left + width / 2,
			y: SHAPE_LABEL_Y_OFFSET
		};
	}
	return { x: 0, y: 0 };
}

/**
 * Check if a note is within any active 3NPS shape
 */
export function isNoteIn3NPSShape(
	stringIndex: number,
	fretIndex: number,
	active3NPSShapes: ActiveShape[]
): boolean {
	if (active3NPSShapes.length === 0) return false;

	for (const shape of active3NPSShapes) {
		if (!shape.path) continue;

		const stringPoints = shape.path.filter(([_, strIdx]) => strIdx === stringIndex);
		if (stringPoints.length === 0) continue;

		const frets = stringPoints.map(([fretOffset]) => shape.startFret + fretOffset);
		const minFret = Math.min(...frets);
		const maxFret = Math.max(...frets);

		if (fretIndex >= minFret && fretIndex <= maxFret) {
			return true;
		}
	}

	return false;
}
