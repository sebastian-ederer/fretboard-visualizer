import {
	CHROMATIC_SCALE_SHARP,
	CHROMATIC_SCALE_FLAT,
	INTERVAL_NAMES,
	SCALE_INTERVALS
} from './constants';

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
 * Get the root fret position on the low E string
 */
export function getRootFret(key: string, stringBaseNotes: number[]): number {
	const keyIndex = getNoteIndex(key);
	const lowEBase = stringBaseNotes[5]; // Low E string is index 5
	return (keyIndex - lowEBase + 12) % 12;
}

/**
 * Get the display name for a pentatonic shape based on major/minor mode
 * Minor shapes 1-5 map to Major shapes 5,1,2,3,4 respectively
 */
export function getPentatonicShapeDisplayName(minorShapeName: string, appliedIsMajor: boolean): string {
	const minorNum = parseInt(minorShapeName);
	if (isNaN(minorNum) || minorNum < 1 || minorNum > 5) return minorShapeName;

	if (appliedIsMajor) {
		// Convert minor shape number to major: ((n + 3) % 5) + 1
		const majorNum = ((minorNum + 3) % 5) + 1;
		return majorNum.toString();
	}
	return minorShapeName;
}
