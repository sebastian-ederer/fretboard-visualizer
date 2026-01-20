/**
 * Strum Pattern Builder store
 * Manages pattern state and playback synchronized with metronome tempo
 */

import * as Tone from 'tone';
import { metronomeStore } from '$lib/metronome';
import { fretboardStore } from '$lib/fretboard';
import { getBeatInterval } from '$lib/metronome/audio';
import { scheduleStrum, playStrumPreview, initializeAudio } from './audio';
import { loadState, saveState, savePatternsToStorage, exportPatternsToFile, importPatternsFromFile } from './storage';
import { deepClone } from '$lib/utils';
import {
	SCHEDULE_AHEAD,
	LOOKAHEAD,
	PATTERN_PRESETS,
	STRUM_CYCLE,
	createDefaultPattern
} from './constants';
import type { StrumPatternState, StrumPattern, StrumPatternPreset, Beat, StrumEvent, StrumType, Subdivision, ChordSlot } from './types';

function createStrumPatternStore() {
	const state = $state<StrumPatternState & { isAudioLoading: boolean }>({
		currentPattern: createDefaultPattern(),
		isPlaying: false,
		isAudioLoading: false,
		currentBeat: 0,
		currentSubdivision: 0,
		currentChordSlotIndex: null,
		loopEnabled: true,
		selectedChordIndex: null,
		customChordInput: '',
		chordLibrary: [],
		savedPatterns: {},
		selectedPresetName: '',
		showChordDropZones: false,
		draggedChord: null,
		draggedChordSlotIndex: null,
		strumVolume: 0.7,
		isLoaded: false
	});

	// Scheduler state (not reactive)
	let nextNoteTime = 0;
	let schedulerTimer: number | null = null;
	let schedulerBeat = 0;
	let schedulerSubdivision = 0;

	// Read tempo from metronome store
	const tempo = $derived(metronomeStore.state.tempo);
	const beatsPerMeasure = $derived(metronomeStore.state.beatsPerMeasure);
	const beatUnit = $derived(metronomeStore.state.beatUnit);

	// Get current chord for a beat
	const currentChord = $derived.by(() => {
		const progression = state.currentPattern.chordProgression;
		for (const slot of progression) {
			if (
				state.currentBeat >= slot.beatIndex &&
				state.currentBeat < slot.beatIndex + slot.duration
			) {
				return slot.chord;
			}
		}
		return null;
	});

	// Helper to get chord for a specific beat
	function getChordForBeat(beatIndex: number): { chord: string; slotIndex: number } | null {
		const progression = state.currentPattern.chordProgression;
		for (let i = 0; i < progression.length; i++) {
			const slot = progression[i];
			if (beatIndex >= slot.beatIndex && beatIndex < slot.beatIndex + slot.duration) {
				return { chord: slot.chord, slotIndex: i };
			}
		}
		return null;
	}

	function scheduler() {
		const currentTime = Tone.now();
		const beatInterval = getBeatInterval(tempo, beatUnit);
		const currentBeatData = state.currentPattern.beats[schedulerBeat];

		if (!currentBeatData) return;

		const subdivInterval = beatInterval / currentBeatData.subdivision;

		while (nextNoteTime < currentTime + SCHEDULE_AHEAD) {
			const strum = currentBeatData.strums[schedulerSubdivision];

			// Get the current chord for this beat
			const chordInfo = getChordForBeat(schedulerBeat);
			const chordName = chordInfo?.chord ?? null;

			if (strum && strum.type !== 'rest') {
				scheduleStrum(nextNoteTime, strum.type, strum.velocity, state.strumVolume, chordName);
			}

			// Capture values for visual update
			const beatToShow = schedulerBeat;
			const subdivToShow = schedulerSubdivision;
			const chordSlotToShow = chordInfo?.slotIndex ?? null;

			// Schedule visual update synchronized with audio
			const delay = (nextNoteTime - currentTime) * 1000;
			setTimeout(() => {
				state.currentBeat = beatToShow;
				state.currentSubdivision = subdivToShow;
				state.currentChordSlotIndex = chordSlotToShow;
			}, Math.max(0, delay));

			// Advance to next subdivision
			schedulerSubdivision++;
			if (schedulerSubdivision >= currentBeatData.subdivision) {
				schedulerSubdivision = 0;
				schedulerBeat++;

				// Loop or stop at end of pattern
				if (schedulerBeat >= state.currentPattern.beats.length) {
					if (state.loopEnabled) {
						schedulerBeat = 0;
					} else {
						// Stop playback after pattern completes
						setTimeout(() => stop(), delay);
						return;
					}
				}
			}

			nextNoteTime += subdivInterval;
		}

		schedulerTimer = window.setTimeout(scheduler, LOOKAHEAD);
	}

	async function start() {
		if (state.isPlaying || state.isAudioLoading) return;

		state.isAudioLoading = true;

		try {
			// Ensure Tone.js audio context is started (requires user gesture)
			if (Tone.getContext().state !== 'running') {
				await Tone.start();
			}

			// Initialize audio system (loads samples, creates synths)
			await initializeAudio();

			nextNoteTime = Tone.now();
			schedulerBeat = 0;
			schedulerSubdivision = 0;
			state.currentBeat = 0;
			state.currentSubdivision = 0;
			state.isPlaying = true;

			// Start metronome in muted mode (visual only)
			metronomeStore.startMuted();

			scheduler();
		} catch (error) {
			// Ensure state is consistent on error
			state.isPlaying = false;
			console.error('Failed to start strum pattern playback:', error);
		} finally {
			state.isAudioLoading = false;
		}
	}

	function stop() {
		if (!state.isPlaying) return;

		state.isPlaying = false;
		schedulerBeat = 0;
		schedulerSubdivision = 0;
		state.currentBeat = 0;
		state.currentSubdivision = 0;
		state.currentChordSlotIndex = null;

		// Stop the metronome visual sync
		metronomeStore.stop();

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

	// Pattern editing
	function setStrumAtPosition(beatIndex: number, subdivIndex: number, strumType: StrumType, velocity: number = 0.7) {
		const beat = state.currentPattern.beats[beatIndex];
		if (!beat || subdivIndex >= beat.strums.length) return;

		beat.strums[subdivIndex] = { type: strumType, velocity };
		saveCurrentState();
	}

	function cycleStrumAtPosition(beatIndex: number, subdivIndex: number) {
		const beat = state.currentPattern.beats[beatIndex];
		if (!beat || subdivIndex >= beat.strums.length) return;

		const currentType = beat.strums[subdivIndex].type;
		// Map accent types to their base type for cycling
		const mappedType = currentType.replace('-accent', '') as (typeof STRUM_CYCLE)[number];
		const currentIndex = STRUM_CYCLE.indexOf(mappedType);
		const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % STRUM_CYCLE.length;
		const nextType = STRUM_CYCLE[nextIndex];

		// Determine velocity based on type
		const velocity = nextType === 'rest' ? 0 : 0.7;

		beat.strums[subdivIndex] = { type: nextType, velocity };

		// Play preview sound
		if (nextType !== 'rest') {
			playStrumPreview(nextType, state.strumVolume * 0.5);
		}

		saveCurrentState();
	}

	function setSubdivision(beatIndex: number, subdivision: Subdivision) {
		const beat = state.currentPattern.beats[beatIndex];
		if (!beat) return;

		const oldSubdiv = beat.subdivision;
		const newStrums: StrumEvent[] = [];

		// Resize strums array, preserving what we can
		for (let i = 0; i < subdivision; i++) {
			if (i < beat.strums.length) {
				newStrums.push(beat.strums[i]);
			} else {
				// Fill new subdivisions with rests
				newStrums.push({ type: 'rest', velocity: 0 });
			}
		}

		beat.subdivision = subdivision;
		beat.strums = newStrums;
		saveCurrentState();
	}

	function setAllSubdivisions(subdivision: Subdivision) {
		state.currentPattern.beats.forEach((_, i) => {
			setSubdivision(i, subdivision);
		});
	}

	function clearBeat(beatIndex: number) {
		const beat = state.currentPattern.beats[beatIndex];
		if (!beat) return;

		beat.strums = beat.strums.map(() => ({ type: 'rest' as StrumType, velocity: 0 }));
		saveCurrentState();
	}

	function resetPattern() {
		state.currentPattern = createDefaultPattern();
		saveCurrentState();
	}

	// Chord management
	function addChord(chord: string, beatIndex: number, duration: number = 1) {
		// Remove any overlapping chords
		state.currentPattern.chordProgression = state.currentPattern.chordProgression.filter(
			(slot) => !(beatIndex >= slot.beatIndex && beatIndex < slot.beatIndex + slot.duration)
		);

		// Add new chord
		state.currentPattern.chordProgression.push({
			beatIndex,
			chord,
			duration
		});

		// Sort by beat index
		state.currentPattern.chordProgression.sort((a, b) => a.beatIndex - b.beatIndex);
		saveCurrentState();
	}

	function removeChord(slotIndex: number) {
		state.currentPattern.chordProgression.splice(slotIndex, 1);
		saveCurrentState();
	}

	function handleChordDrop(chord: string, targetBeatIndex: number) {
		addChord(chord, targetBeatIndex, 1);
		state.showChordDropZones = false;
		state.draggedChord = null;
	}

	function setCustomChordInput(value: string) {
		state.customChordInput = value;
	}

	function addCustomChord(beatIndex: number) {
		if (!state.customChordInput.trim()) return;
		addChord(state.customChordInput.trim(), beatIndex);
		state.customChordInput = '';
	}

	// Move chord to a new beat position (for reordering)
	function moveChord(fromSlotIndex: number, toBeatIndex: number) {
		const slot = state.currentPattern.chordProgression[fromSlotIndex];
		if (!slot) return;

		const chord = slot.chord;
		const duration = slot.duration;

		// Remove from old position
		state.currentPattern.chordProgression.splice(fromSlotIndex, 1);

		// Check if target beat already has a chord
		const existingIndex = state.currentPattern.chordProgression.findIndex(
			(s) => toBeatIndex >= s.beatIndex && toBeatIndex < s.beatIndex + s.duration
		);

		if (existingIndex !== -1) {
			// Swap positions - move existing chord to old position
			const existingSlot = state.currentPattern.chordProgression[existingIndex];
			existingSlot.beatIndex = slot.beatIndex;
		}

		// Add chord at new position
		state.currentPattern.chordProgression.push({
			beatIndex: toBeatIndex,
			chord,
			duration
		});

		// Sort by beat index
		state.currentPattern.chordProgression.sort((a, b) => a.beatIndex - b.beatIndex);
		saveCurrentState();
	}

	// Set dragged chord slot for reordering
	function setDraggedChordSlot(slotIndex: number | null) {
		state.draggedChordSlotIndex = slotIndex;
		state.showChordDropZones = slotIndex !== null;
	}

	// Chord library management
	function addToChordLibrary(chord: string) {
		const trimmed = chord.trim();
		if (!trimmed || state.chordLibrary.includes(trimmed)) return;
		state.chordLibrary.push(trimmed);
		saveCurrentState();
	}

	function removeFromChordLibrary(chord: string) {
		const index = state.chordLibrary.indexOf(chord);
		if (index !== -1) {
			state.chordLibrary.splice(index, 1);
			saveCurrentState();
		}
	}

	function addChordToLibraryFromInput() {
		if (!state.customChordInput.trim()) return;
		addToChordLibrary(state.customChordInput.trim());
		state.customChordInput = '';
	}

	// Beat count management
	function addBeat() {
		// Prevent exceeding max beats
		if (state.currentPattern.beats.length >= 32) return;

		const currentSubdiv = state.currentPattern.beats[0]?.subdivision ?? 2;
		const newBeat: Beat = {
			subdivision: currentSubdiv,
			strums: Array.from({ length: currentSubdiv }, () => ({ type: 'rest' as StrumType, velocity: 0 }))
		};
		state.currentPattern.beats.push(newBeat);
		saveCurrentState();
	}

	function removeBeat() {
		if (state.currentPattern.beats.length <= 1) return;

		const lastBeatIndex = state.currentPattern.beats.length - 1;
		state.currentPattern.beats.pop();

		// Remove any chords that were on the removed beat
		state.currentPattern.chordProgression = state.currentPattern.chordProgression.filter(
			(slot) => slot.beatIndex < lastBeatIndex
		);

		// Adjust duration of chords that extended past the new end
		state.currentPattern.chordProgression.forEach((slot) => {
			if (slot.beatIndex + slot.duration > state.currentPattern.beats.length) {
				slot.duration = state.currentPattern.beats.length - slot.beatIndex;
			}
		});

		saveCurrentState();
	}

	const MIN_BEATS = 1;
	const MAX_BEATS = 32;

	function setBeatCount(count: number) {
		// Validate bounds
		if (!Number.isInteger(count)) return;
		const targetCount = Math.max(MIN_BEATS, Math.min(MAX_BEATS, count));

		const currentCount = state.currentPattern.beats.length;
		if (targetCount === currentCount) return;

		if (targetCount > currentCount) {
			// Add beats
			for (let i = currentCount; i < targetCount; i++) {
				addBeat();
			}
		} else {
			// Remove beats
			for (let i = currentCount; i > targetCount; i--) {
				removeBeat();
			}
		}
	}

	// Preset management
	function loadPreset(presetId: string) {
		// Check built-in presets first
		const builtIn = PATTERN_PRESETS.find((p) => p.id === presetId);
		if (builtIn) {
			state.currentPattern = deepClone(builtIn);
			state.selectedPresetName = builtIn.name;
			saveCurrentState();
			return;
		}

		// Check saved patterns
		const saved = state.savedPatterns[presetId];
		if (saved) {
			state.currentPattern = deepClone(saved);
			state.selectedPresetName = saved.name;
			// Restore key and mode settings if saved with the pattern
			if (saved.selectedKey !== undefined) {
				fretboardStore.state.selectedKey = saved.selectedKey;
			}
			if (saved.isMajor !== undefined) {
				fretboardStore.state.isMajor = saved.isMajor;
			}
			saveCurrentState();
		}
	}

	function savePattern(name: string) {
		const pattern: StrumPatternPreset = {
			...state.currentPattern,
			id: name.toLowerCase().replace(/\s+/g, '-'),
			name,
			category: 'custom',
			// Save current key and mode settings
			selectedKey: fretboardStore.state.selectedKey,
			isMajor: fretboardStore.state.isMajor
		};

		state.savedPatterns[pattern.id] = pattern;
		state.selectedPresetName = name;
		savePatternsToStorage(state.savedPatterns);
		saveCurrentState();
	}

	function deletePattern(patternId: string) {
		delete state.savedPatterns[patternId];
		state.savedPatterns = { ...state.savedPatterns }; // Trigger reactivity
		savePatternsToStorage(state.savedPatterns);
	}

	// Volume
	function setStrumVolume(volume: number) {
		state.strumVolume = Math.max(0, Math.min(1, volume));
		saveCurrentState();
	}

	// Export/Import patterns
	function exportPatterns() {
		exportPatternsToFile(state.savedPatterns);
	}

	function importPatterns(file: File): Promise<{ success: boolean; error?: string }> {
		return new Promise((resolve) => {
			importPatternsFromFile(
				file,
				(patterns) => {
					// Merge imported patterns with existing ones
					state.savedPatterns = { ...state.savedPatterns, ...patterns };
					savePatternsToStorage(state.savedPatterns);
					saveCurrentState();
					resolve({ success: true });
				},
				(error) => {
					resolve({ success: false, error });
				}
			);
		});
	}

	// Persistence
	function saveCurrentState() {
		saveState({
			currentPattern: state.currentPattern as StrumPatternPreset,
			savedPatterns: state.savedPatterns,
			strumVolume: state.strumVolume,
			loopEnabled: state.loopEnabled,
			chordLibrary: state.chordLibrary
		});
	}

	function initialize() {
		if (state.isLoaded) return;

		const loaded = loadState();
		state.currentPattern = loaded.currentPattern;
		state.savedPatterns = loaded.savedPatterns;
		state.strumVolume = loaded.strumVolume;
		state.loopEnabled = loaded.loopEnabled;
		state.chordLibrary = loaded.chordLibrary ?? [];
		state.isLoaded = true;

		// Audio is initialized lazily on first user interaction (play/preview)
		// to avoid browser autoplay restrictions
	}

	return {
		state,
		// Derived
		get tempo() { return tempo; },
		get beatsPerMeasure() { return beatsPerMeasure; },
		get currentChord() { return currentChord; },
		// Playback
		initialize,
		start,
		stop,
		toggle,
		// Pattern editing
		setStrumAtPosition,
		cycleStrumAtPosition,
		setSubdivision,
		setAllSubdivisions,
		clearBeat,
		resetPattern,
		// Beat count management
		addBeat,
		removeBeat,
		setBeatCount,
		// Chord management
		addChord,
		removeChord,
		handleChordDrop,
		setCustomChordInput,
		addCustomChord,
		moveChord,
		setDraggedChordSlot,
		// Chord library
		addToChordLibrary,
		removeFromChordLibrary,
		addChordToLibraryFromInput,
		// Presets
		loadPreset,
		savePattern,
		deletePattern,
		// Settings
		setStrumVolume,
		// Export/Import
		exportPatterns,
		importPatterns
	};
}

export const strumPatternStore = createStrumPatternStore();
