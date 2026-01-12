import { loadMetronomeSettings, saveMetronomeSettings } from './storage';
import { getAudioContext, scheduleClick, getBeatInterval } from './audio';
import {
	MIN_TEMPO,
	MAX_TEMPO,
	TAP_TEMPO_WINDOW,
	TAP_TIMEOUT,
	DEFAULT_AUTO_TEMPO_INCREMENT,
	DEFAULT_AUTO_TEMPO_BARS,
	DEFAULT_AUTO_TEMPO_MAX_BPM
} from './constants';
import type { MetronomeState, ClickSound } from './types';

function createMetronomeStore() {
	const state = $state<MetronomeState>({
		isPlaying: false,
		tempo: 120,
		beatsPerMeasure: 4,
		beatUnit: 4,
		volume: 0.7,
		accentFirstBeat: true,
		clickSound: 'classic',
		currentBeat: 0,
		// Auto tempo
		autoTempoEnabled: false,
		autoTempoIncrement: DEFAULT_AUTO_TEMPO_INCREMENT,
		autoTempoBars: DEFAULT_AUTO_TEMPO_BARS,
		autoTempoMaxBpm: DEFAULT_AUTO_TEMPO_MAX_BPM,
		currentBar: 0,
		// Count-in
		countInEnabled: false,
		isCountingIn: false
	});

	// Scheduler state (not reactive)
	let nextNoteTime = 0;
	let schedulerTimer: number | null = null;
	let schedulerBeat = 0; // Internal beat counter for scheduling (separate from visual)
	let tapTimes: number[] = [];
	let isInitialized = false;

	// Schedule ahead time (in seconds)
	const SCHEDULE_AHEAD = 0.1;
	const LOOKAHEAD = 25; // How often to call scheduler (ms)

	function scheduler() {
		const ctx = getAudioContext();

		while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
			// Use internal counter for accent check
			const isAccent = state.accentFirstBeat && schedulerBeat === 0;
			scheduleClick(nextNoteTime, isAccent, state.clickSound, state.volume);

			// Capture the beat that's playing for visual update
			const beatToShow = schedulerBeat;
			const isLastBeatOfBar = schedulerBeat === state.beatsPerMeasure - 1;

			// Schedule visual update synchronized with audio
			const delay = (nextNoteTime - ctx.currentTime) * 1000;
			setTimeout(() => {
				// Show the beat that's actually playing
				state.currentBeat = beatToShow;

				// Handle bar completion after the last beat plays
				if (isLastBeatOfBar) {
					if (state.isCountingIn) {
						// Count-in complete, start actual playback
						state.isCountingIn = false;
						state.currentBar = 0;
					} else {
						// Regular bar complete
						state.currentBar++;

						// Auto tempo increase
						if (
							state.autoTempoEnabled &&
							state.currentBar > 0 &&
							state.currentBar % state.autoTempoBars === 0 &&
							state.tempo < state.autoTempoMaxBpm
						) {
							const newTempo = Math.min(
								state.tempo + state.autoTempoIncrement,
								state.autoTempoMaxBpm
							);
							state.tempo = newTempo;
						}
					}
				}
			}, Math.max(0, delay));

			// Advance internal counter and time for next beat
			schedulerBeat = (schedulerBeat + 1) % state.beatsPerMeasure;
			nextNoteTime += getBeatInterval(state.tempo, state.beatUnit);
		}

		schedulerTimer = window.setTimeout(scheduler, LOOKAHEAD);
	}

	function start() {
		if (state.isPlaying) return;

		const ctx = getAudioContext();
		nextNoteTime = ctx.currentTime;
		schedulerBeat = 0;
		state.currentBeat = 0;
		state.currentBar = 0;
		state.isPlaying = true;

		// Start count-in if enabled
		if (state.countInEnabled) {
			state.isCountingIn = true;
		}

		scheduler();
	}

	function stop() {
		if (!state.isPlaying) return;

		state.isPlaying = false;
		schedulerBeat = 0;
		state.currentBeat = 0;
		state.currentBar = 0;
		state.isCountingIn = false;

		if (schedulerTimer !== null) {
			clearTimeout(schedulerTimer);
			schedulerTimer = null;
		}
	}

	function toggle() {
		if (state.isPlaying) {
			stop();
		} else {
			start();
		}
	}

	function setTempo(bpm: number) {
		state.tempo = Math.max(MIN_TEMPO, Math.min(MAX_TEMPO, Math.round(bpm)));
		saveSettings();
	}

	function adjustTempo(delta: number) {
		setTempo(state.tempo + delta);
	}

	function tapTempo() {
		const now = performance.now();

		// Reset if too much time has passed
		if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > TAP_TIMEOUT) {
			tapTimes = [];
		}

		tapTimes.push(now);

		// Keep only the last N taps
		if (tapTimes.length > TAP_TEMPO_WINDOW) {
			tapTimes = tapTimes.slice(-TAP_TEMPO_WINDOW);
		}

		// Calculate tempo from tap intervals
		if (tapTimes.length >= 2) {
			const intervals: number[] = [];
			for (let i = 1; i < tapTimes.length; i++) {
				intervals.push(tapTimes[i] - tapTimes[i - 1]);
			}
			const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
			const bpm = 60000 / avgInterval;
			setTempo(bpm);
		}
	}

	function setTimeSignature(beats: number, unit: number) {
		state.beatsPerMeasure = beats;
		state.beatUnit = unit;
		state.currentBeat = 0;
		saveSettings();
	}

	function setVolume(vol: number) {
		state.volume = Math.max(0, Math.min(1, vol));
		saveSettings();
	}

	function setClickSound(sound: ClickSound) {
		state.clickSound = sound;
		saveSettings();
	}

	function setAccentFirstBeat(accent: boolean) {
		state.accentFirstBeat = accent;
		saveSettings();
	}

	// Auto tempo setters
	function setAutoTempoEnabled(enabled: boolean) {
		stop(); // Stop metronome to reset bar count
		state.autoTempoEnabled = enabled;
		saveSettings();
	}

	function setAutoTempoIncrement(increment: number) {
		state.autoTempoIncrement = Math.max(1, Math.min(20, increment));
		saveSettings();
	}

	function setAutoTempoBars(bars: number) {
		state.autoTempoBars = Math.max(1, Math.min(32, bars));
		saveSettings();
	}

	function setAutoTempoMaxBpm(maxBpm: number) {
		state.autoTempoMaxBpm = Math.max(MIN_TEMPO, Math.min(MAX_TEMPO, maxBpm));
		saveSettings();
	}

	// Count-in setter
	function setCountInEnabled(enabled: boolean) {
		state.countInEnabled = enabled;
		saveSettings();
	}

	function saveSettings() {
		saveMetronomeSettings({
			tempo: state.tempo,
			beatsPerMeasure: state.beatsPerMeasure,
			beatUnit: state.beatUnit,
			volume: state.volume,
			accentFirstBeat: state.accentFirstBeat,
			clickSound: state.clickSound,
			autoTempoEnabled: state.autoTempoEnabled,
			autoTempoIncrement: state.autoTempoIncrement,
			autoTempoBars: state.autoTempoBars,
			autoTempoMaxBpm: state.autoTempoMaxBpm,
			countInEnabled: state.countInEnabled
		});
	}

	function initialize() {
		if (isInitialized) return;

		const settings = loadMetronomeSettings();
		state.tempo = settings.tempo;
		state.beatsPerMeasure = settings.beatsPerMeasure;
		state.beatUnit = settings.beatUnit;
		state.volume = settings.volume;
		state.accentFirstBeat = settings.accentFirstBeat;
		state.clickSound = settings.clickSound;
		state.autoTempoEnabled = settings.autoTempoEnabled;
		state.autoTempoIncrement = settings.autoTempoIncrement;
		state.autoTempoBars = settings.autoTempoBars;
		state.autoTempoMaxBpm = settings.autoTempoMaxBpm;
		state.countInEnabled = settings.countInEnabled;

		isInitialized = true;
	}

	return {
		state,
		initialize,
		start,
		stop,
		toggle,
		setTempo,
		adjustTempo,
		tapTempo,
		setTimeSignature,
		setVolume,
		setClickSound,
		setAccentFirstBeat,
		setAutoTempoEnabled,
		setAutoTempoIncrement,
		setAutoTempoBars,
		setAutoTempoMaxBpm,
		setCountInEnabled
	};
}

export const metronomeStore = createMetronomeStore();
