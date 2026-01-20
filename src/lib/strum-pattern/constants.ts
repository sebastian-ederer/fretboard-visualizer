/**
 * Strum Pattern Builder constants and presets
 */

import type { Beat, StrumPatternPreset, Subdivision } from './types';

// Audio scheduling constants (matching metronome)
export const SCHEDULE_AHEAD = 0.1; // Schedule audio 100ms ahead
export const LOOKAHEAD = 25; // Check scheduler every 25ms

// Default values
export const DEFAULT_SUBDIVISION: Subdivision = 2; // 8th notes
export const DEFAULT_STRUM_VOLUME = 0.7;
export const DEFAULT_BEATS_COUNT = 4;

// Strum type cycle order for click-to-change
export const STRUM_CYCLE = ['down', 'up', 'muted', 'rest'] as const;

// Subdivision options
export const SUBDIVISION_OPTIONS: { value: Subdivision; label: string; shortLabel: string; symbol: string }[] = [
	{ value: 1, label: 'Quarter notes', shortLabel: '1/4', symbol: '♩' },
	{ value: 2, label: '8th notes', shortLabel: '1/8', symbol: '♪' },
	{ value: 3, label: 'Triplets', shortLabel: '3', symbol: '♪³' },
	{ value: 4, label: '16th notes', shortLabel: '1/16', symbol: '♬' }
];

// Helper to create a beat with default strums
function createBeat(subdivision: Subdivision, strums: Array<{ type: string; velocity: number }>): Beat {
	return {
		subdivision,
		strums: strums.map((s) => ({ type: s.type as Beat['strums'][0]['type'], velocity: s.velocity }))
	};
}

// Built-in pattern presets
export const PATTERN_PRESETS: StrumPatternPreset[] = [
	{
		id: 'basic-down',
		name: 'Basic Down',
		category: 'basic',
		description: 'Simple downstrokes on each beat',
		beats: [
			createBeat(1, [{ type: 'down-accent', velocity: 0.9 }]),
			createBeat(1, [{ type: 'down', velocity: 0.7 }]),
			createBeat(1, [{ type: 'down', velocity: 0.7 }]),
			createBeat(1, [{ type: 'down', velocity: 0.7 }])
		],
		chordProgression: []
	},
	{
		id: 'basic-down-up',
		name: 'Basic Down-Up',
		category: 'basic',
		description: 'Alternating down and up strokes',
		beats: [
			createBeat(2, [
				{ type: 'down-accent', velocity: 0.9 },
				{ type: 'up', velocity: 0.6 }
			]),
			createBeat(2, [
				{ type: 'down', velocity: 0.7 },
				{ type: 'up', velocity: 0.6 }
			]),
			createBeat(2, [
				{ type: 'down', velocity: 0.7 },
				{ type: 'up', velocity: 0.6 }
			]),
			createBeat(2, [
				{ type: 'down', velocity: 0.7 },
				{ type: 'up', velocity: 0.6 }
			])
		],
		chordProgression: []
	},
	{
		id: 'folk',
		name: 'Folk Pattern',
		category: 'folk',
		description: 'Classic folk/country strumming pattern',
		beats: [
			createBeat(2, [
				{ type: 'down-accent', velocity: 0.9 },
				{ type: 'rest', velocity: 0 }
			]),
			createBeat(2, [
				{ type: 'down', velocity: 0.6 },
				{ type: 'up', velocity: 0.5 }
			]),
			createBeat(2, [
				{ type: 'rest', velocity: 0 },
				{ type: 'up', velocity: 0.7 }
			]),
			createBeat(2, [
				{ type: 'down', velocity: 0.6 },
				{ type: 'up', velocity: 0.5 }
			])
		],
		chordProgression: []
	},
	{
		id: 'rock',
		name: 'Rock Pattern',
		category: 'rock',
		description: 'Driving rock rhythm with accents',
		beats: [
			createBeat(2, [
				{ type: 'down-accent', velocity: 1.0 },
				{ type: 'muted', velocity: 0.4 }
			]),
			createBeat(2, [
				{ type: 'down', velocity: 0.8 },
				{ type: 'muted', velocity: 0.4 }
			]),
			createBeat(2, [
				{ type: 'down-accent', velocity: 0.9 },
				{ type: 'muted', velocity: 0.4 }
			]),
			createBeat(2, [
				{ type: 'down', velocity: 0.8 },
				{ type: 'up', velocity: 0.6 }
			])
		],
		chordProgression: []
	},
	{
		id: 'ballad',
		name: 'Ballad Pattern',
		category: 'ballad',
		description: 'Gentle pattern for slow songs',
		beats: [
			createBeat(4, [
				{ type: 'down-accent', velocity: 0.8 },
				{ type: 'rest', velocity: 0 },
				{ type: 'up', velocity: 0.4 },
				{ type: 'rest', velocity: 0 }
			]),
			createBeat(4, [
				{ type: 'rest', velocity: 0 },
				{ type: 'up', velocity: 0.5 },
				{ type: 'down', velocity: 0.6 },
				{ type: 'up', velocity: 0.4 }
			]),
			createBeat(4, [
				{ type: 'down', velocity: 0.7 },
				{ type: 'rest', velocity: 0 },
				{ type: 'up', velocity: 0.4 },
				{ type: 'rest', velocity: 0 }
			]),
			createBeat(4, [
				{ type: 'rest', velocity: 0 },
				{ type: 'up', velocity: 0.5 },
				{ type: 'down', velocity: 0.6 },
				{ type: 'up', velocity: 0.5 }
			])
		],
		chordProgression: []
	},
	{
		id: 'island',
		name: 'Island Strum',
		category: 'folk',
		description: 'Reggae/island style with offbeat emphasis',
		beats: [
			createBeat(2, [
				{ type: 'muted', velocity: 0.3 },
				{ type: 'down-accent', velocity: 0.9 }
			]),
			createBeat(2, [
				{ type: 'muted', velocity: 0.3 },
				{ type: 'down', velocity: 0.8 }
			]),
			createBeat(2, [
				{ type: 'muted', velocity: 0.3 },
				{ type: 'down-accent', velocity: 0.9 }
			]),
			createBeat(2, [
				{ type: 'muted', velocity: 0.3 },
				{ type: 'down', velocity: 0.8 }
			])
		],
		chordProgression: []
	}
];

// Common chord progressions for quick setup
export const COMMON_PROGRESSIONS = [
	{ name: 'I-V-vi-IV', chords: ['C', 'G', 'Am', 'F'] },
	{ name: 'I-IV-V-I', chords: ['G', 'C', 'D', 'G'] },
	{ name: 'ii-V-I', chords: ['Dm', 'G', 'C'] },
	{ name: 'I-vi-IV-V', chords: ['C', 'Am', 'F', 'G'] },
	{ name: '12-Bar Blues', chords: ['A', 'A', 'A', 'A', 'D', 'D', 'A', 'A', 'E', 'D', 'A', 'E'] }
];

// Create default empty pattern
export function createDefaultPattern(): StrumPatternPreset {
	return {
		id: 'custom',
		name: 'Custom Pattern',
		category: 'custom',
		beats: Array.from({ length: DEFAULT_BEATS_COUNT }, (_, i) =>
			createBeat(DEFAULT_SUBDIVISION, [
				{ type: i === 0 ? 'down-accent' : 'down', velocity: i === 0 ? 0.9 : 0.7 },
				{ type: 'up', velocity: 0.6 }
			])
		),
		chordProgression: []
	};
}
