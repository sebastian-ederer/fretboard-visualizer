/**
 * Chord parsing and frequency calculation utilities
 */

// Note names with their semitone offsets from C
const NOTE_NAMES: Record<string, number> = {
	C: 0,
	'C#': 1,
	Db: 1,
	D: 2,
	'D#': 3,
	Eb: 3,
	E: 4,
	F: 5,
	'F#': 6,
	Gb: 6,
	G: 7,
	'G#': 8,
	Ab: 8,
	A: 9,
	'A#': 10,
	Bb: 10,
	B: 11
};

// Chord formulas as semitone intervals from root
// Format: [intervals from root]
const CHORD_FORMULAS: Record<string, number[]> = {
	// Major chords
	major: [0, 4, 7],
	maj: [0, 4, 7],
	M: [0, 4, 7],
	'': [0, 4, 7], // Default major

	// Minor chords
	minor: [0, 3, 7],
	min: [0, 3, 7],
	m: [0, 3, 7],
	'-': [0, 3, 7],

	// Seventh chords
	'7': [0, 4, 7, 10], // Dominant 7th
	maj7: [0, 4, 7, 11], // Major 7th
	M7: [0, 4, 7, 11],
	m7: [0, 3, 7, 10], // Minor 7th
	min7: [0, 3, 7, 10],
	'-7': [0, 3, 7, 10],
	mmaj7: [0, 3, 7, 11], // Minor major 7th
	mM7: [0, 3, 7, 11],
	dim7: [0, 3, 6, 9], // Diminished 7th
	'°7': [0, 3, 6, 9],
	m7b5: [0, 3, 6, 10], // Half-diminished 7th
	'ø7': [0, 3, 6, 10],

	// Suspended chords
	sus2: [0, 2, 7],
	sus4: [0, 5, 7],
	sus: [0, 5, 7], // sus4 by default
	'7sus4': [0, 5, 7, 10],
	'7sus2': [0, 2, 7, 10],

	// Augmented and diminished
	aug: [0, 4, 8],
	'+': [0, 4, 8],
	dim: [0, 3, 6],
	'°': [0, 3, 6],

	// Added tone chords
	add9: [0, 4, 7, 14],
	add11: [0, 4, 7, 17],
	'6': [0, 4, 7, 9],
	m6: [0, 3, 7, 9],

	// Extended chords
	'9': [0, 4, 7, 10, 14],
	maj9: [0, 4, 7, 11, 14],
	m9: [0, 3, 7, 10, 14],
	'11': [0, 4, 7, 10, 14, 17],
	'13': [0, 4, 7, 10, 14, 21],

	// Power chord
	'5': [0, 7]
};

// Reference frequency for A4
const A4_FREQUENCY = 440;
const A4_MIDI = 69;

/**
 * Convert a MIDI note number to frequency
 */
export function midiToFrequency(midi: number): number {
	return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / 12);
}

/**
 * Get the semitone offset for a note name (e.g., "C" = 0, "G" = 7)
 */
function getNoteOffset(noteName: string): number | null {
	// Try exact match first
	if (NOTE_NAMES[noteName] !== undefined) {
		return NOTE_NAMES[noteName];
	}

	// Try with first letter capitalized
	const normalized = noteName.charAt(0).toUpperCase() + noteName.slice(1);
	if (NOTE_NAMES[normalized] !== undefined) {
		return NOTE_NAMES[normalized];
	}

	return null;
}

/**
 * Parse a chord name and return its component notes as semitone offsets from C
 * Returns null if the chord cannot be parsed
 */
export function parseChord(chordName: string): { root: number; intervals: number[] } | null {
	if (!chordName || chordName.trim() === '') return null;

	const trimmed = chordName.trim();

	// Extract root note (1-2 characters)
	let rootNote = '';
	let quality = '';

	// First character is always the root
	rootNote = trimmed.charAt(0).toUpperCase();

	// Check for sharp or flat
	if (trimmed.length > 1) {
		const second = trimmed.charAt(1);
		if (second === '#' || second === 'b') {
			rootNote += second;
			quality = trimmed.slice(2);
		} else {
			quality = trimmed.slice(1);
		}
	}

	const rootOffset = getNoteOffset(rootNote);
	if (rootOffset === null) return null;

	// Find the chord quality
	let intervals: number[] | null = null;

	// Try to match the quality, from longest to shortest
	const qualityKeys = Object.keys(CHORD_FORMULAS).sort((a, b) => b.length - a.length);

	for (const key of qualityKeys) {
		if (quality === key || (quality === '' && key === '')) {
			intervals = CHORD_FORMULAS[key];
			break;
		}
	}

	// If no match found, try treating it as major
	if (!intervals) {
		intervals = CHORD_FORMULAS['major'];
	}

	return {
		root: rootOffset,
		intervals
	};
}

/**
 * Get the frequencies for a chord in a specific octave range
 * Returns an array of frequencies suitable for guitar-like voicing
 */
export function getChordFrequencies(
	chordName: string,
	baseOctave: number = 3
): number[] {
	const parsed = parseChord(chordName);
	if (!parsed) {
		// Return a default Am chord if parsing fails
		return getChordFrequencies('Am', baseOctave);
	}

	const { root, intervals } = parsed;

	// Create voicing: bass note + chord tones spread across octaves
	const frequencies: number[] = [];

	// Bass note (one octave below)
	const baseMidi = 12 * (baseOctave - 1) + 12 + root; // C of baseOctave-1 + root
	frequencies.push(midiToFrequency(baseMidi));

	// Main chord tones in base octave and above
	intervals.forEach((interval, i) => {
		const midi = 12 * baseOctave + 12 + root + interval;
		frequencies.push(midiToFrequency(midi));
	});

	// If we have fewer than 6 notes, add octaves
	while (frequencies.length < 6) {
		const interval = intervals[frequencies.length % intervals.length];
		const octaveOffset = Math.floor(frequencies.length / intervals.length);
		const midi = 12 * (baseOctave + octaveOffset) + 12 + root + interval;
		frequencies.push(midiToFrequency(midi));
	}

	// Sort from low to high (like guitar strings low to high when strummed down)
	return frequencies.slice(0, 6).sort((a, b) => a - b);
}

/**
 * Get a human-readable description of a chord
 */
export function getChordDescription(chordName: string): string {
	const parsed = parseChord(chordName);
	if (!parsed) return 'Unknown chord';

	const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const rootName = noteNames[parsed.root];

	return `${rootName} chord with intervals: ${parsed.intervals.join(', ')} semitones`;
}
