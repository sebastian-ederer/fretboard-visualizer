// Fretboard state and configuration types

export interface HistoryState {
	selectedFrets: Record<string, string>;
	selectedKey: string;
	isMajor: boolean;
	appliedIsMajor: boolean;
	selectedScale: string;
	selectedColor: string;
	customColor: string;
	showShapeBoxes: boolean;
	show3NPSShapeBoxes: boolean;
	selected3NPSShape: number;
	showIntervals: boolean;
	useFlats: boolean;
	eraseSelectedColorOnly: boolean;
	lastAppliedScale: string | null;
	scaleToRemove: string;
	strings: string[];
	selectedTuningPreset: string;
}

export interface Preset extends HistoryState {}

export interface ShapePattern {
	name: string;
	startOffset: number; // Semitones from root where shape starts
	path: [number, number][]; // [fretOffset, stringIndex] - the path through the shape
}

export interface Shape {
	name: string;
	startOffset: number;
	span: number;
}

export interface ActiveShape {
	name: string;
	startFret: number;
	colorIndex: number;
	path?: [number, number][]; // For pentatonic - array of [fretOffset, stringIndex]
	endFret?: number; // For rectangle-based shapes
}

export interface ScaleInterval {
	major: number[];
	minor: number[];
}
