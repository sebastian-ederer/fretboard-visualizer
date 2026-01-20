import {
	CHROMATIC_SCALE_SHARP,
	CHROMATIC_SCALE_FLAT,
	INTERVAL_NAMES,
	SCALE_INTERVALS,
	FRET_COUNT
} from './constants';

/**
 * Create a unique key for a fret position (used for state lookups)
 */
export function createFretKey(stringIndex: number, fretIndex: number): string {
	return `${stringIndex}-${fretIndex}`;
}

/**
 * Get the chromatic scale based on notation preference
 */
export function getChromaticScale(useFlats: boolean): string[] {
	return useFlats ? CHROMATIC_SCALE_FLAT : CHROMATIC_SCALE_SHARP;
}

/**
 * Get the chromatic index of a note (works with both sharp and flat notation)
 */
export function getNoteIndex(note: string): number {
	let idx = CHROMATIC_SCALE_SHARP.indexOf(note);
	if (idx === -1) {
		idx = CHROMATIC_SCALE_FLAT.indexOf(note);
	}
	return idx;
}

/**
 * Convert a note to the current notation (sharp or flat)
 */
export function getDisplayNote(note: string, useFlats: boolean): string {
	const idx = getNoteIndex(note);
	if (idx === -1) return note;
	return getChromaticScale(useFlats)[idx];
}

/**
 * Calculate base note indices from string names
 */
export function getStringBaseNotes(tuning: string[]): number[] {
	return tuning.map((note) => getNoteIndex(note));
}

/**
 * Get the note name at a specific string and fret position
 */
export function getNoteName(
	stringIndex: number,
	fretIndex: number,
	stringBaseNotes: number[],
	useFlats: boolean
): string {
	const noteIndex = (stringBaseNotes[stringIndex] + fretIndex) % 12;
	return getChromaticScale(useFlats)[noteIndex];
}

/**
 * Get the interval name for a note relative to the root key
 */
export function getIntervalName(
	stringIndex: number,
	fretIndex: number,
	stringBaseNotes: number[],
	selectedKey: string
): string {
	const noteIndex = (stringBaseNotes[stringIndex] + fretIndex) % 12;
	const rootIndex = getNoteIndex(selectedKey);
	const interval = (noteIndex - rootIndex + 12) % 12;
	return INTERVAL_NAMES[interval];
}

/**
 * Get the display text for a note (either note name or interval)
 */
export function getNoteDisplay(
	stringIndex: number,
	fretIndex: number,
	stringBaseNotes: number[],
	selectedKey: string,
	showIntervals: boolean,
	useFlats: boolean
): string {
	if (showIntervals) {
		return getIntervalName(stringIndex, fretIndex, stringBaseNotes, selectedKey);
	}
	return getNoteName(stringIndex, fretIndex, stringBaseNotes, useFlats);
}

/**
 * Get the scale notes for a given key, mode, and scale type
 */
export function getScaleNotes(key: string, isMajor: boolean, scale: string): Set<number> {
	const keyIndex = getNoteIndex(key);
	const intervals = SCALE_INTERVALS[scale]?.[isMajor ? 'major' : 'minor'] || [];
	return new Set(intervals.map((interval) => (keyIndex + interval) % 12));
}

/**
 * Get all fret positions where scale notes appear on a string
 * @param stringBase - The base note index of the string (0-11)
 * @param scaleNotes - Set of note indices in the scale
 * @returns Array of fret positions
 */
export function getScaleFrets(stringBase: number, scaleNotes: Set<number>): number[] {
	const frets: number[] = [];
	for (const note of scaleNotes) {
		const baseFret = (note - stringBase + 12) % 12;
		for (let fret = baseFret; fret <= FRET_COUNT; fret += 12) {
			frets.push(fret);
		}
	}
	return frets;
}

/**
 * Get the root fret position on the low E string
 */
export function getRootFret(key: string, stringBaseNotes: number[]): number {
	const keyIndex = getNoteIndex(key);
	const lowEBase = stringBaseNotes[5]; // Low E string is index 5
	return (keyIndex - lowEBase + 12) % 12;
}

/**
 * Get the display name for a pentatonic shape based on major/minor mode.
 *
 * The pentatonic shapes are defined based on the minor pentatonic pattern
 * (which is the standard CAGED-based numbering). When displaying in major mode,
 * we need to convert because the relative major starts from a different position.
 *
 * The mapping is based on the relative major/minor relationship:
 * - Minor shape 1 starts on the root, which is the 6th degree of relative major → Major shape 5
 * - Minor shape 2 → Major shape 1
 * - Minor shape 3 → Major shape 2
 * - Minor shape 4 → Major shape 3
 * - Minor shape 5 → Major shape 4
 *
 * Formula: majorNum = ((minorNum + 3) % 5) + 1
 * This adds 3 (shifts by 3 positions in the cycle), wraps with mod 5, then adds 1 for 1-based indexing.
 *
 * @param minorShapeName - Shape number as string ("1" through "5")
 * @param appliedIsMajor - Whether the current mode is major
 * @returns The display shape number for the current mode
 */
export function getPentatonicShapeDisplayName(minorShapeName: string, appliedIsMajor: boolean): string {
	const minorNum = parseInt(minorShapeName);
	if (isNaN(minorNum) || minorNum < 1 || minorNum > 5) return minorShapeName;

	if (appliedIsMajor) {
		const majorNum = ((minorNum + 3) % 5) + 1;
		return majorNum.toString();
	}
	return minorShapeName;
}

/**
 * Check if a note at a given position is the root note of the selected key
 */
export function isRootNote(
	stringIndex: number,
	fretIndex: number,
	stringBaseNotes: number[],
	selectedKey: string
): boolean {
	const noteIndex = (stringBaseNotes[stringIndex] + fretIndex) % 12;
	const rootIndex = getNoteIndex(selectedKey);
	return noteIndex === rootIndex;
}

/**
 * Get the notes of a chord (triad) based on root and quality
 * @param root - The root note of the chord
 * @param quality - 'major', 'minor', or 'dim'
 * @returns Set of note indices (0-11)
 */
export function getChordNotes(root: string, quality: 'major' | 'minor' | 'dim'): Set<number> {
	const rootIndex = getNoteIndex(root);
	if (rootIndex === -1) return new Set();

	// Intervals for each chord quality (in semitones from root)
	const intervals: Record<string, number[]> = {
		major: [0, 4, 7], // root, major 3rd, perfect 5th
		minor: [0, 3, 7], // root, minor 3rd, perfect 5th
		dim: [0, 3, 6] // root, minor 3rd, diminished 5th
	};

	const chordIntervals = intervals[quality] || intervals.major;
	return new Set(chordIntervals.map((interval) => (rootIndex + interval) % 12));
}
