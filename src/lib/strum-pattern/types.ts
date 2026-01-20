/**
 * Strum Pattern Builder types
 */

// Strum direction for visual and audio
export type StrumDirection = 'down' | 'up' | 'none';

// All possible strum types
export type StrumType =
	| 'down' // Regular downstroke (D)
	| 'up' // Regular upstroke (U)
	| 'down-accent' // Accented downstroke
	| 'up-accent' // Accented upstroke
	| 'muted' // Muted/ghost strum (X)
	| 'rest'; // Rest/pause (silence)

// Subdivisions per beat
export type Subdivision = 1 | 2 | 3 | 4; // 1=quarter, 2=eighth, 3=triplet, 4=16th

// Individual strum event within a beat
export interface StrumEvent {
	type: StrumType;
	velocity: number; // 0.0 - 1.0 for dynamics
}

// A single beat containing subdivided strums
export interface Beat {
	subdivision: Subdivision;
	strums: StrumEvent[]; // Array length matches subdivision
}

// Chord assignment to beats
export interface ChordSlot {
	beatIndex: number; // Which beat this chord starts on
	chord: string; // Chord name (e.g., "Am", "G", "Cmaj7")
	duration: number; // How many beats this chord lasts
}

// Complete strum pattern
export interface StrumPattern {
	id: string;
	name: string;
	beats: Beat[];
	chordProgression: ChordSlot[];
}

// Pattern preset with metadata
export interface StrumPatternPreset extends StrumPattern {
	category: 'basic' | 'folk' | 'rock' | 'ballad' | 'custom';
	description?: string;
	// Key and mode settings (saved with custom patterns)
	selectedKey?: string;
	isMajor?: boolean;
}

// Store state
export interface StrumPatternState {
	// Current pattern being edited
	currentPattern: StrumPattern;

	// Playback state
	isPlaying: boolean;
	currentBeat: number; // Which beat is currently playing (0-indexed)
	currentSubdivision: number; // Which subdivision within the beat
	currentChordSlotIndex: number | null; // Which chord slot is currently playing
	loopEnabled: boolean;

	// Chord selection
	selectedChordIndex: number | null; // Which chord slot is selected for editing
	customChordInput: string; // Text input for custom chord names

	// Chord library - saved chords for reuse
	chordLibrary: string[];

	// Pattern presets
	savedPatterns: Record<string, StrumPatternPreset>;
	selectedPresetName: string;

	// Drag and drop state
	showChordDropZones: boolean; // Visual indicators for drag-drop
	draggedChord: string | null; // Currently being dragged from Circle of Fifths
	draggedChordSlotIndex: number | null; // Index of chord being reordered in timeline

	// Audio settings
	strumVolume: number; // 0-1 volume for strum sounds

	// Loading state
	isLoaded: boolean;
}

// Helper to get direction from strum type
export function getStrumDirection(type: StrumType): StrumDirection {
	switch (type) {
		case 'down':
		case 'down-accent':
			return 'down';
		case 'up':
		case 'up-accent':
			return 'up';
		case 'muted':
			return 'down'; // Muted strums are typically down
		case 'rest':
			return 'none';
	}
}

// Helper to check if strum is accented
export function isAccented(type: StrumType): boolean {
	return type === 'down-accent' || type === 'up-accent';
}

// Helper to check if strum is muted
export function isMuted(type: StrumType): boolean {
	return type === 'muted';
}

// Helper to get display symbol for strum type
export function getStrumSymbol(type: StrumType): string {
	switch (type) {
		case 'down':
			return 'D';
		case 'up':
			return 'U';
		case 'down-accent':
			return 'D';
		case 'up-accent':
			return 'U';
		case 'muted':
			return 'X';
		case 'rest':
			return '–';
	}
}
