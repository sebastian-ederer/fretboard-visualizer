import { browser } from '$app/environment';
import type { ActiveShape, HistoryState, Preset } from './types';
import {
	FRET_COUNT,
	TUNING_PRESETS,
	PRESET_COLORS,
	MAX_HISTORY_SIZE,
	HISTORY_DEBOUNCE_MS
} from './constants';
import {
	getStringBaseNotes,
	getNoteIndex,
	getScaleNotes,
	getChromaticScale,
	transposeNotes
} from './music-utils';
import { calculatePentatonicShapes, calculate3NPSShapes } from './shape-utils';
import { loadState, saveState, loadPresets, savePresets, loadHistory, saveHistory } from './storage';

// Create a singleton store for the fretboard state
function createFretboardStore() {
	// Core state
	let selectedFrets = $state<Record<string, string>>({});
	let strings = $state<string[]>(['E', 'B', 'G', 'D', 'A', 'E']);
	let selectedTuningPreset = $state('standard');

	// Scale settings
	let selectedKey = $state('C');
	let previousKey = $state('C');
	let isMajor = $state(true);
	let previousIsMajor = $state(true);
	let appliedIsMajor = $state(true);
	let selectedScale = $state('pentatonic');
	let lastAppliedScale = $state<string | null>(null);
	let scaleToRemove = $state('ionian');

	// Display settings
	let showIntervals = $state(false);
	let useFlats = $state(false);
	let eraseSelectedColorOnly = $state(false);

	// Color settings
	let selectedColor = $state(PRESET_COLORS[0]);
	let customColor = $state('#ffffff');

	// Shape settings
	let showShapeBoxes = $state(true);
	let show3NPSShapeBoxes = $state(true);
	let selected3NPSShape = $state(1);
	let activeShapes = $state<ActiveShape[]>([]);
	let active3NPSShapes = $state<ActiveShape[]>([]);

	// Painting state
	let isPainting = $state(false);
	let paintMode = $state<'add' | 'remove'>('add');

	// UI state
	let settingsOpen = $state(true);

	// Preset management
	let savedPresets = $state<Record<string, Preset>>({});
	let presetName = $state('');
	let selectedPresetName = $state('');

	// History state
	let historyStack = $state<HistoryState[]>([]);
	let redoStack = $state<HistoryState[]>([]);
	let isUndoRedoAction = $state(false);
	let historyDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Loading state
	let isLoaded = $state(false);

	// Derived state
	const chromaticScale = $derived(getChromaticScale(useFlats));
	const stringBaseNotes = $derived(getStringBaseNotes(strings));

	// Capture current state
	function captureState(): HistoryState {
		return {
			selectedFrets: { ...selectedFrets },
			selectedKey,
			isMajor,
			appliedIsMajor,
			selectedScale,
			selectedColor,
			customColor,
			showShapeBoxes,
			show3NPSShapeBoxes,
			selected3NPSShape,
			showIntervals,
			useFlats,
			eraseSelectedColorOnly,
			lastAppliedScale,
			scaleToRemove,
			strings: [...strings],
			selectedTuningPreset
		};
	}

	// Push to history
	function pushHistory(immediate = false) {
		if (isUndoRedoAction || !isLoaded) return;

		if (historyDebounceTimer) {
			clearTimeout(historyDebounceTimer);
		}

		const doSave = () => {
			const currentState = captureState();

			if (historyStack.length > 0) {
				const lastState = historyStack[historyStack.length - 1];
				if (JSON.stringify(currentState) === JSON.stringify(lastState)) {
					return;
				}
			}

			historyStack = [...historyStack, currentState].slice(-MAX_HISTORY_SIZE);
			redoStack = [];
			saveHistory(historyStack, redoStack);
		};

		if (immediate) {
			doSave();
		} else {
			historyDebounceTimer = setTimeout(doSave, HISTORY_DEBOUNCE_MS);
		}
	}

	// Restore state from snapshot
	function restoreState(state: HistoryState) {
		selectedFrets = { ...state.selectedFrets };
		selectedKey = state.selectedKey;
		previousKey = state.selectedKey;
		isMajor = state.isMajor;
		previousIsMajor = state.isMajor;
		appliedIsMajor = state.appliedIsMajor ?? state.isMajor;
		selectedScale = state.selectedScale;
		selectedColor = state.selectedColor;
		customColor = state.customColor;
		showShapeBoxes = state.showShapeBoxes;
		show3NPSShapeBoxes = state.show3NPSShapeBoxes;
		selected3NPSShape = state.selected3NPSShape;
		showIntervals = state.showIntervals;
		useFlats = state.useFlats ?? false;
		eraseSelectedColorOnly = state.eraseSelectedColorOnly;
		lastAppliedScale = state.lastAppliedScale;
		scaleToRemove = state.scaleToRemove;
		strings = state.strings ? [...state.strings] : ['E', 'B', 'G', 'D', 'A', 'E'];
		selectedTuningPreset = state.selectedTuningPreset || 'standard';

		recalculateShapes();
	}

	// Recalculate shapes based on current state
	function recalculateShapes() {
		if (selectedTuningPreset === 'standard') {
			activeShapes = calculatePentatonicShapes(selectedKey, isMajor, stringBaseNotes);
			if (show3NPSShapeBoxes) {
				active3NPSShapes = calculate3NPSShapes(selectedKey, selected3NPSShape, isMajor, stringBaseNotes);
			} else {
				active3NPSShapes = [];
			}
		} else {
			activeShapes = [];
			active3NPSShapes = [];
		}
	}

	// Undo/Redo
	function undo() {
		if (historyStack.length <= 1) return;
		isUndoRedoAction = true;

		const currentState = historyStack[historyStack.length - 1];
		redoStack = [...redoStack, currentState];
		historyStack = historyStack.slice(0, -1);

		const previousState = historyStack[historyStack.length - 1];
		restoreState(previousState);
		saveHistory(historyStack, redoStack);

		isUndoRedoAction = false;
	}

	function redo() {
		if (redoStack.length === 0) return;
		isUndoRedoAction = true;

		const nextState = redoStack[redoStack.length - 1];
		redoStack = redoStack.slice(0, -1);
		historyStack = [...historyStack, nextState];

		restoreState(nextState);
		saveHistory(historyStack, redoStack);

		isUndoRedoAction = false;
	}

	function canUndo() {
		return historyStack.length > 1;
	}

	function canRedo() {
		return redoStack.length > 0;
	}

	// Tuning functions
	function applyTuningPreset(presetKey: string) {
		if (TUNING_PRESETS[presetKey]) {
			selectedTuningPreset = presetKey;
			strings = [...TUNING_PRESETS[presetKey]];
			pushHistory(true);
		}
	}

	function changeStringTuning(stringIndex: number, direction: number) {
		const currentNote = strings[stringIndex];
		const currentIdx = getNoteIndex(currentNote);
		const newIdx = (currentIdx + direction + 12) % 12;
		strings[stringIndex] = chromaticScale[newIdx];
		strings = [...strings];
		selectedTuningPreset = 'custom';
		pushHistory(true);
	}

	// Apply scale to fretboard
	function applyScale() {
		const scaleNotes = getScaleNotes(selectedKey, isMajor, selectedScale);
		const shouldLayer = selectedScale === 'pentatonic' || lastAppliedScale === 'pentatonic';

		if (!shouldLayer) {
			selectedFrets = {};
		}

		recalculateShapes();

		for (let stringIndex = 0; stringIndex < strings.length; stringIndex++) {
			for (let fretIndex = 0; fretIndex <= FRET_COUNT; fretIndex++) {
				const noteIndex = (stringBaseNotes[stringIndex] + fretIndex) % 12;
				if (scaleNotes.has(noteIndex)) {
					const key = `${stringIndex}-${fretIndex}`;
					if (!selectedFrets[key]) {
						selectedFrets[key] = selectedColor;
					}
				}
			}
		}

		lastAppliedScale = shouldLayer ? 'pentatonic' : selectedScale;
		appliedIsMajor = isMajor;
		pushHistory(true);
	}

	// Remove scale notes
	function removeScaleNotes() {
		const pentatonicNotes = getScaleNotes(selectedKey, isMajor, 'pentatonic');
		const scaleNotes = getScaleNotes(selectedKey, isMajor, scaleToRemove);

		const extraNotes = new Set<number>();
		for (const note of scaleNotes) {
			if (!pentatonicNotes.has(note)) {
				extraNotes.add(note);
			}
		}

		for (let stringIndex = 0; stringIndex < strings.length; stringIndex++) {
			for (let fretIndex = 0; fretIndex <= FRET_COUNT; fretIndex++) {
				const noteIndex = (stringBaseNotes[stringIndex] + fretIndex) % 12;
				if (extraNotes.has(noteIndex)) {
					delete selectedFrets[`${stringIndex}-${fretIndex}`];
				}
			}
		}

		selectedFrets = { ...selectedFrets };
		pushHistory(true);
	}

	// Clear functions
	function clearAll() {
		selectedFrets = {};
		lastAppliedScale = null;
		recalculateShapes();
		pushHistory(true);
	}

	function clearString(stringIndex: number) {
		for (let i = 0; i <= FRET_COUNT; i++) {
			delete selectedFrets[`${stringIndex}-${i}`];
		}
		pushHistory(true);
	}

	function selectString(stringIndex: number) {
		for (let i = 0; i <= FRET_COUNT; i++) {
			selectedFrets[`${stringIndex}-${i}`] = selectedColor;
		}
		pushHistory(true);
	}

	// Painting functions
	function isSelected(stringIndex: number, fretIndex: number): boolean {
		return !!selectedFrets[`${stringIndex}-${fretIndex}`];
	}

	function getNoteColor(stringIndex: number, fretIndex: number): string {
		return selectedFrets[`${stringIndex}-${fretIndex}`] || selectedColor;
	}

	function startPainting(stringIndex: number, fretIndex: number) {
		isPainting = true;
		paintMode = isSelected(stringIndex, fretIndex) ? 'remove' : 'add';
		applyPaint(stringIndex, fretIndex);
	}

	function stopPainting() {
		if (isPainting) {
			pushHistory(true);
		}
		isPainting = false;
	}

	function applyPaint(stringIndex: number, fretIndex: number) {
		const key = `${stringIndex}-${fretIndex}`;
		if (paintMode === 'add') {
			selectedFrets[key] = selectedColor;
		} else {
			if (!eraseSelectedColorOnly || selectedFrets[key] === selectedColor) {
				delete selectedFrets[key];
			}
		}
	}

	function handlePaintOver(stringIndex: number, fretIndex: number) {
		if (isPainting) {
			applyPaint(stringIndex, fretIndex);
		}
	}

	// Preset functions
	function savePreset() {
		if (!presetName.trim()) return;

		const preset: Preset = captureState();
		savedPresets[presetName.trim()] = preset;
		savedPresets = { ...savedPresets };
		savePresets(savedPresets);

		selectedPresetName = presetName.trim();
		presetName = '';
	}

	function loadPreset() {
		if (!selectedPresetName || !savedPresets[selectedPresetName]) return;
		restoreState(savedPresets[selectedPresetName]);
		pushHistory(true);
	}

	function deletePreset() {
		if (!selectedPresetName || !savedPresets[selectedPresetName]) return;
		delete savedPresets[selectedPresetName];
		savedPresets = { ...savedPresets };
		savePresets(savedPresets);
		selectedPresetName = '';
	}

	// Initialize store
	function initialize() {
		// Load saved state
		const saved = loadState();
		if (saved) {
			if (saved.selectedFrets) selectedFrets = saved.selectedFrets;
			if (saved.selectedKey) {
				selectedKey = saved.selectedKey;
				previousKey = saved.selectedKey;
			}
			if (saved.isMajor !== undefined) {
				isMajor = saved.isMajor;
				previousIsMajor = saved.isMajor;
			}
			if (saved.appliedIsMajor !== undefined) {
				appliedIsMajor = saved.appliedIsMajor;
			}
			if (saved.selectedScale) selectedScale = saved.selectedScale;
			if (saved.selectedColor) selectedColor = saved.selectedColor;
			if (saved.customColor) customColor = saved.customColor;
			if (saved.showShapeBoxes !== undefined) showShapeBoxes = saved.showShapeBoxes;
			if (saved.show3NPSShapeBoxes !== undefined) show3NPSShapeBoxes = saved.show3NPSShapeBoxes;
			if (saved.selected3NPSShape !== undefined) selected3NPSShape = saved.selected3NPSShape;
			if (saved.showIntervals !== undefined) showIntervals = saved.showIntervals;
			if (saved.useFlats !== undefined) useFlats = saved.useFlats;
			if (saved.eraseSelectedColorOnly !== undefined) eraseSelectedColorOnly = saved.eraseSelectedColorOnly;
			if (saved.lastAppliedScale !== undefined) lastAppliedScale = saved.lastAppliedScale;
			if (saved.scaleToRemove) scaleToRemove = saved.scaleToRemove;
			if (saved.strings) strings = saved.strings;
			if (saved.selectedTuningPreset) selectedTuningPreset = saved.selectedTuningPreset;
		}

		// Load presets
		savedPresets = loadPresets();

		// Load history
		const { history, redo } = loadHistory();
		historyStack = history;
		redoStack = redo;

		isLoaded = true;

		// Calculate initial shapes
		recalculateShapes();

		// Save initial state if history is empty
		if (historyStack.length === 0) {
			historyStack = [captureState()];
			saveHistory(historyStack, redoStack);
		}
	}

	// Auto-save effect (call this from component)
	function setupAutoSave() {
		$effect(() => {
			if (!isLoaded) return;
			saveState(captureState());
		});
	}

	return {
		// State getters (using getters for reactivity)
		get selectedFrets() { return selectedFrets; },
		get strings() { return strings; },
		get selectedTuningPreset() { return selectedTuningPreset; },
		get selectedKey() { return selectedKey; },
		get isMajor() { return isMajor; },
		get appliedIsMajor() { return appliedIsMajor; },
		get selectedScale() { return selectedScale; },
		get lastAppliedScale() { return lastAppliedScale; },
		get scaleToRemove() { return scaleToRemove; },
		get showIntervals() { return showIntervals; },
		get useFlats() { return useFlats; },
		get eraseSelectedColorOnly() { return eraseSelectedColorOnly; },
		get selectedColor() { return selectedColor; },
		get customColor() { return customColor; },
		get showShapeBoxes() { return showShapeBoxes; },
		get show3NPSShapeBoxes() { return show3NPSShapeBoxes; },
		get selected3NPSShape() { return selected3NPSShape; },
		get activeShapes() { return activeShapes; },
		get active3NPSShapes() { return active3NPSShapes; },
		get isPainting() { return isPainting; },
		get paintMode() { return paintMode; },
		get settingsOpen() { return settingsOpen; },
		get savedPresets() { return savedPresets; },
		get presetName() { return presetName; },
		get selectedPresetName() { return selectedPresetName; },
		get isLoaded() { return isLoaded; },
		get chromaticScale() { return chromaticScale; },
		get stringBaseNotes() { return stringBaseNotes; },

		// State setters
		set selectedKey(v: string) { selectedKey = v; },
		set previousKey(v: string) { previousKey = v; },
		set isMajor(v: boolean) { isMajor = v; },
		set previousIsMajor(v: boolean) { previousIsMajor = v; },
		set selectedScale(v: string) { selectedScale = v; },
		set scaleToRemove(v: string) { scaleToRemove = v; },
		set showIntervals(v: boolean) { showIntervals = v; },
		set useFlats(v: boolean) { useFlats = v; },
		set eraseSelectedColorOnly(v: boolean) { eraseSelectedColorOnly = v; },
		set selectedColor(v: string) { selectedColor = v; },
		set customColor(v: string) { customColor = v; },
		set showShapeBoxes(v: boolean) { showShapeBoxes = v; },
		set show3NPSShapeBoxes(v: boolean) { show3NPSShapeBoxes = v; },
		set selected3NPSShape(v: number) { selected3NPSShape = v; },
		set settingsOpen(v: boolean) { settingsOpen = v; },
		set presetName(v: string) { presetName = v; },
		set selectedPresetName(v: string) { selectedPresetName = v; },
		set selectedTuningPreset(v: string) { selectedTuningPreset = v; },
		set strings(v: string[]) { strings = v; },

		// Actions
		initialize,
		setupAutoSave,
		pushHistory,
		undo,
		redo,
		canUndo,
		canRedo,
		applyTuningPreset,
		changeStringTuning,
		applyScale,
		removeScaleNotes,
		clearAll,
		clearString,
		selectString,
		isSelected,
		getNoteColor,
		startPainting,
		stopPainting,
		applyPaint,
		handlePaintOver,
		savePreset,
		loadPreset,
		deletePreset,
		recalculateShapes
	};
}

// Export singleton instance
export const fretboardStore = createFretboardStore();
