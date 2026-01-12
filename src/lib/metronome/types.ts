export type ClickSound = 'classic' | 'wood' | 'digital' | 'hihat';

export interface MetronomeState {
	isPlaying: boolean;
	tempo: number; // 40-240 BPM
	beatsPerMeasure: number; // 1-12
	beatUnit: number; // 4, 8, etc.
	volume: number; // 0-1
	accentFirstBeat: boolean;
	clickSound: ClickSound;
	currentBeat: number; // For visual indicator (0-indexed)

	// Auto tempo increase
	autoTempoEnabled: boolean;
	autoTempoIncrement: number; // BPM to add
	autoTempoBars: number; // After how many bars
	autoTempoMaxBpm: number; // Maximum tempo limit
	currentBar: number; // Current bar count (for auto tempo)

	// Count-in
	countInEnabled: boolean;
	isCountingIn: boolean; // Currently in count-in phase
}

export interface MetronomeSettings {
	tempo: number;
	beatsPerMeasure: number;
	beatUnit: number;
	volume: number;
	accentFirstBeat: boolean;
	clickSound: ClickSound;

	// Auto tempo increase
	autoTempoEnabled: boolean;
	autoTempoIncrement: number;
	autoTempoBars: number;
	autoTempoMaxBpm: number;

	// Count-in
	countInEnabled: boolean;
}
