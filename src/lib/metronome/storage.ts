import {
	METRONOME_STORAGE_KEY,
	DEFAULT_TEMPO,
	DEFAULT_AUTO_TEMPO_INCREMENT,
	DEFAULT_AUTO_TEMPO_BARS,
	DEFAULT_AUTO_TEMPO_MAX_BPM
} from './constants';
import type { MetronomeSettings, ClickSound } from './types';

const DEFAULT_SETTINGS: MetronomeSettings = {
	tempo: DEFAULT_TEMPO,
	beatsPerMeasure: 4,
	beatUnit: 4,
	volume: 0.7,
	accentFirstBeat: true,
	clickSound: 'classic',
	autoTempoEnabled: false,
	autoTempoIncrement: DEFAULT_AUTO_TEMPO_INCREMENT,
	autoTempoBars: DEFAULT_AUTO_TEMPO_BARS,
	autoTempoMaxBpm: DEFAULT_AUTO_TEMPO_MAX_BPM,
	countInEnabled: false
};

export function loadMetronomeSettings(): MetronomeSettings {
	if (typeof localStorage === 'undefined') {
		return DEFAULT_SETTINGS;
	}

	try {
		const saved = localStorage.getItem(METRONOME_STORAGE_KEY);
		if (!saved) return DEFAULT_SETTINGS;

		const parsed = JSON.parse(saved);
		return {
			tempo: typeof parsed.tempo === 'number' ? parsed.tempo : DEFAULT_SETTINGS.tempo,
			beatsPerMeasure:
				typeof parsed.beatsPerMeasure === 'number'
					? parsed.beatsPerMeasure
					: DEFAULT_SETTINGS.beatsPerMeasure,
			beatUnit: typeof parsed.beatUnit === 'number' ? parsed.beatUnit : DEFAULT_SETTINGS.beatUnit,
			volume: typeof parsed.volume === 'number' ? parsed.volume : DEFAULT_SETTINGS.volume,
			accentFirstBeat:
				typeof parsed.accentFirstBeat === 'boolean'
					? parsed.accentFirstBeat
					: DEFAULT_SETTINGS.accentFirstBeat,
			clickSound: isValidClickSound(parsed.clickSound)
				? parsed.clickSound
				: DEFAULT_SETTINGS.clickSound,
			autoTempoEnabled:
				typeof parsed.autoTempoEnabled === 'boolean'
					? parsed.autoTempoEnabled
					: DEFAULT_SETTINGS.autoTempoEnabled,
			autoTempoIncrement:
				typeof parsed.autoTempoIncrement === 'number'
					? parsed.autoTempoIncrement
					: DEFAULT_SETTINGS.autoTempoIncrement,
			autoTempoBars:
				typeof parsed.autoTempoBars === 'number'
					? parsed.autoTempoBars
					: DEFAULT_SETTINGS.autoTempoBars,
			autoTempoMaxBpm:
				typeof parsed.autoTempoMaxBpm === 'number'
					? parsed.autoTempoMaxBpm
					: DEFAULT_SETTINGS.autoTempoMaxBpm,
			countInEnabled:
				typeof parsed.countInEnabled === 'boolean'
					? parsed.countInEnabled
					: DEFAULT_SETTINGS.countInEnabled
		};
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export function saveMetronomeSettings(settings: MetronomeSettings): void {
	if (typeof localStorage === 'undefined') return;

	try {
		localStorage.setItem(METRONOME_STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Ignore storage errors
	}
}

function isValidClickSound(value: unknown): value is ClickSound {
	return (
		typeof value === 'string' && ['classic', 'wood', 'digital', 'hihat'].includes(value)
	);
}
