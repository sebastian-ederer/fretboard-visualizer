import type { ClickSound } from './types';

export const MIN_TEMPO = 40;
export const MAX_TEMPO = 240;
export const DEFAULT_TEMPO = 120;

export const TAP_TEMPO_WINDOW = 4; // Number of taps to average
export const TAP_TIMEOUT = 2000; // Reset after 2s of no taps

export const METRONOME_STORAGE_KEY = 'fretboard-metronome-state';

// Auto tempo defaults
export const DEFAULT_AUTO_TEMPO_INCREMENT = 5; // BPM
export const DEFAULT_AUTO_TEMPO_BARS = 8;
export const DEFAULT_AUTO_TEMPO_MAX_BPM = 180;

export const CLICK_SOUNDS: { value: ClickSound; label: string }[] = [
	{ value: 'classic', label: 'Classic' },
	{ value: 'wood', label: 'Wood Block' },
	{ value: 'digital', label: 'Digital' },
	{ value: 'hihat', label: 'Hi-Hat' }
];

export const TIME_SIGNATURES = [
	{ beats: 2, unit: 4, label: '2/4' },
	{ beats: 3, unit: 4, label: '3/4' },
	{ beats: 4, unit: 4, label: '4/4' },
	{ beats: 5, unit: 4, label: '5/4' },
	{ beats: 6, unit: 4, label: '6/4' },
	{ beats: 7, unit: 4, label: '7/4' },
	{ beats: 6, unit: 8, label: '6/8' },
	{ beats: 9, unit: 8, label: '9/8' },
	{ beats: 12, unit: 8, label: '12/8' }
];

// Audio frequencies for different click sounds
export const SOUND_FREQUENCIES = {
	classic: { accent: 1000, normal: 800 },
	wood: { accent: 400, normal: 350 },
	digital: { accent: 1500, normal: 1200 },
	hihat: { accent: 8000, normal: 6000 }
} as const;
