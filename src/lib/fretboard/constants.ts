import type { ScaleInterval, Shape, ShapePattern } from './types';

// Fretboard layout
export const FRET_COUNT = 24;
export const STRING_COUNT = 6;

// Layout dimensions (pixels)
export const OPEN_FRET_WIDTH = 32;
export const FRET_WIDTH = 56;
export const STRING_ROW_HEIGHT = 40;
export const STRING_LABEL_WIDTH = 40;
export const STRING_THICKNESS_BASE = 1;
export const STRING_THICKNESS_INCREMENT = 0.4;

// Fret markers
export const SINGLE_DOT_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
export const DOUBLE_DOT_FRETS = [12, 24];

// Chromatic scales
export const CHROMATIC_SCALE_SHARP = [
	'C',
	'C#',
	'D',
	'D#',
	'E',
	'F',
	'F#',
	'G',
	'G#',
	'A',
	'A#',
	'B'
];
export const CHROMATIC_SCALE_FLAT = [
	'C',
	'Db',
	'D',
	'Eb',
	'E',
	'F',
	'Gb',
	'G',
	'Ab',
	'A',
	'Bb',
	'B'
];

// Interval names (semitones from root)
export const INTERVAL_NAMES = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

// Tuning presets (high to low string, as displayed)
export const TUNING_PRESETS: Record<string, string[]> = {
	standard: ['E', 'B', 'G', 'D', 'A', 'E'],
	'drop-d': ['E', 'B', 'G', 'D', 'A', 'D'],
	dadgad: ['D', 'A', 'G', 'D', 'A', 'D'],
	'open-g': ['D', 'B', 'G', 'D', 'G', 'D'],
	'open-d': ['D', 'A', 'F#', 'D', 'A', 'D'],
	'open-e': ['E', 'B', 'G#', 'E', 'B', 'E'],
	'half-step-down': ['D#', 'A#', 'F#', 'C#', 'G#', 'D#'],
	'full-step-down': ['D', 'A', 'F', 'C', 'G', 'D'],
	'drop-c': ['D', 'A', 'F', 'C', 'G', 'C']
};

export const TUNING_PRESET_NAMES: Record<string, string> = {
	standard: 'Standard (EADGBE)',
	'drop-d': 'Drop D',
	dadgad: 'DADGAD',
	'open-g': 'Open G',
	'open-d': 'Open D',
	'open-e': 'Open E',
	'half-step-down': 'Half Step Down',
	'full-step-down': 'Full Step Down',
	'drop-c': 'Drop C',
	custom: 'Custom'
};

// Scale options for UI
export const SCALE_OPTIONS = [
	'pentatonic',
	'blues',
	'ionian',
	'dorian',
	'phrygian',
	'lydian',
	'mixolydian',
	'aeolian',
	'locrian',
	'melodic-minor',
	'diatonic'
];

export const REMOVE_SCALE_OPTIONS = [
	'blues',
	'ionian',
	'dorian',
	'phrygian',
	'lydian',
	'mixolydian',
	'aeolian',
	'locrian',
	'melodic-minor'
];

export const THREE_NPS_OPTIONS = ['1', '2', '3', '4', '5', '6', '7'];

// Scale intervals (semitones from root)
export const SCALE_INTERVALS: Record<string, ScaleInterval> = {
	pentatonic: {
		major: [0, 2, 4, 7, 9],
		minor: [0, 3, 5, 7, 10]
	},
	blues: {
		major: [0, 2, 3, 4, 7, 9],
		minor: [0, 3, 5, 6, 7, 10]
	},
	ionian: {
		major: [0, 2, 4, 5, 7, 9, 11],
		minor: [0, 2, 3, 5, 7, 8, 10]
	},
	lydian: {
		major: [0, 2, 4, 6, 7, 9, 11],
		minor: [0, 2, 3, 5, 6, 7, 9, 10]
	},
	mixolydian: {
		major: [0, 2, 4, 5, 7, 9, 10],
		minor: [0, 2, 3, 5, 7, 9, 10]
	},
	dorian: {
		major: [0, 2, 4, 5, 7, 9, 11],
		minor: [0, 2, 3, 5, 7, 9, 10]
	},
	aeolian: {
		major: [0, 2, 4, 5, 7, 9, 11],
		minor: [0, 2, 3, 5, 7, 8, 10]
	},
	phrygian: {
		major: [0, 1, 4, 5, 7, 8, 10],
		minor: [0, 1, 3, 5, 7, 8, 10]
	},
	locrian: {
		major: [0, 1, 3, 5, 6, 8, 10],
		minor: [0, 1, 3, 5, 6, 7, 8, 10]
	},
	'melodic-minor': {
		major: [0, 2, 4, 5, 7, 9, 11],
		minor: [0, 2, 3, 5, 7, 9, 10, 11]
	},
	diatonic: {
		major: [0, 2, 4, 5, 7, 9, 11],
		minor: [0, 2, 3, 5, 7, 8, 10]
	},
	'3nps': {
		major: [0, 2, 4, 5, 7, 9, 11],
		minor: [0, 2, 3, 5, 7, 8, 10]
	}
};

// Pentatonic shape patterns (path-based)
export const PENTATONIC_SHAPES: ShapePattern[] = [
	{
		name: '1',
		startOffset: 0,
		path: [
			[0, 5],
			[3, 5],
			[2, 4],
			[2, 3],
			[2, 2],
			[3, 1],
			[3, 0],
			[0, 0],
			[0, 1],
			[0, 2],
			[0, 3],
			[0, 4]
		]
	},
	{
		name: '2',
		startOffset: 2,
		path: [
			[1, 5],
			[3, 5],
			[3, 4],
			[3, 3],
			[2, 2],
			[3, 1],
			[3, 0],
			[1, 0],
			[1, 1],
			[0, 2],
			[0, 3],
			[0, 4]
		]
	},
	{
		name: '3',
		startOffset: 5,
		path: [
			[0, 5],
			[2, 5],
			[2, 4],
			[2, 3],
			[2, 2],
			[3, 1],
			[2, 0],
			[0, 0],
			[0, 1],
			[-1, 2],
			[0, 3],
			[0, 4]
		]
	},
	{
		name: '4',
		startOffset: 7,
		path: [
			[0, 5],
			[3, 5],
			[3, 4],
			[2, 3],
			[2, 2],
			[3, 1],
			[3, 0],
			[0, 0],
			[1, 1],
			[0, 2],
			[0, 3],
			[0, 4]
		]
	},
	{
		name: '5',
		startOffset: 10,
		path: [
			[0, 5],
			[2, 5],
			[2, 4],
			[2, 3],
			[2, 2],
			[2, 1],
			[2, 0],
			[0, 0],
			[0, 1],
			[-1, 2],
			[-1, 3],
			[0, 4]
		]
	}
];

// Rectangle-based scale shapes
export const SCALE_SHAPES: Record<string, Shape[]> = {
	diatonic: [
		{ name: '1', startOffset: 0, span: 3 },
		{ name: '2', startOffset: 2, span: 3 },
		{ name: '3', startOffset: 4, span: 2 },
		{ name: '4', startOffset: 5, span: 3 },
		{ name: '5', startOffset: 7, span: 3 },
		{ name: '6', startOffset: 9, span: 2 },
		{ name: '7', startOffset: 11, span: 3 }
	],
	'3nps': [
		{ name: '1', startOffset: 0, span: 4 },
		{ name: '2', startOffset: 2, span: 4 },
		{ name: '3', startOffset: 4, span: 3 },
		{ name: '4', startOffset: 5, span: 4 },
		{ name: '5', startOffset: 7, span: 4 },
		{ name: '6', startOffset: 9, span: 3 },
		{ name: '7', startOffset: 11, span: 4 }
	]
};

// Shape colors (fill)
export const SHAPE_COLORS = [
	'rgba(168, 85, 247, 0.4)', // Purple
	'rgba(59, 130, 246, 0.4)', // Blue
	'rgba(34, 197, 94, 0.4)', // Green
	'rgba(234, 179, 8, 0.4)', // Yellow
	'rgba(249, 115, 22, 0.4)', // Orange
	'rgba(239, 68, 68, 0.4)', // Red
	'rgba(236, 72, 153, 0.4)' // Pink
];

// Shape border colors
export const SHAPE_BORDER_COLORS = [
	'rgba(168, 85, 247, 0.9)',
	'rgba(59, 130, 246, 0.9)',
	'rgba(34, 197, 94, 0.9)',
	'rgba(234, 179, 8, 0.9)',
	'rgba(249, 115, 22, 0.9)',
	'rgba(239, 68, 68, 0.9)',
	'rgba(236, 72, 153, 0.9)'
];

// 3NPS shape colors (single values, all shapes use same color)
export const THREE_NPS_FILL_COLOR = 'rgba(255, 255, 255, 0.5)';
export const THREE_NPS_BORDER_COLOR = 'rgba(255, 255, 255, 0.9)';

// Preset note colors
export const PRESET_COLORS = [
	'#a855f7', // Purple
	'#3b82f6', // Blue
	'#22c55e', // Green
	'#eab308', // Yellow
	'#f97316', // Orange
	'#ef4444' // Red
];

// Storage keys
export const STORAGE_KEY = 'fretboard-visualizer-state';
export const PRESETS_KEY = 'fretboard-visualizer-presets';
export const HISTORY_KEY = 'fretboard-visualizer-history';

// History configuration
export const MAX_HISTORY_SIZE = 50;
export const HISTORY_DEBOUNCE_MS = 300;
