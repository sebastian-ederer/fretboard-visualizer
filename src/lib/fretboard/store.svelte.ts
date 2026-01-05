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
	getChromaticScale
} from './music-utils';
import { calculatePentatonicShapes, calculate3NPSShapes } from './shape-utils';
import { loadState, saveState, loadPresets, savePresets, loadHistory, saveHistory } from './storage';

// Create a singleton store for the fretboard state
function createFretboardStore() {
	// Unified state object - all reactive state in one place
	const state = $state({
		// Core state
		selectedFrets: {} as Record<string, string>,
		strings: ['E', 'B', 'G', 'D', 'A', 'E'] as string[],
		selectedTuningPreset: 'standard',

		// Scale settings
		selectedKey: 'C',
		previousKey: 'C',
		isMajor: true,
		previousIsMajor: true,
		appliedIsMajor: true,
		selectedScale: 'pentatonic',
		lastAppliedScale: null as string | null,
		scaleToRemove: 'ionian',

		// Display settings
		showIntervals: false,
		useFlats: false,
		eraseSelectedColorOnly: false,

		// Color settings
		selectedColor: PRESET_COLORS[0],
		customColor: '#ffffff',

		// Shape settings
		showShapeBoxes: true,
		show3NPSShapeBoxes: true,
		selected3NPSShape: 1,
		activeShapes: [] as ActiveShape[],
		active3NPSShapes: [] as ActiveShape[],

		// Painting state
		isPainting: false,
		paintMode: 'add' as 'add' | 'remove',

		// UI state
		settingsOpen: true,

		// Preset management
		savedPresets: {} as Record<string, Preset>,
		presetName: '',
		selectedPresetName: '',

		// History state
		historyStack: [] as HistoryState[],
		redoStack: [] as HistoryState[],
		isUndoRedoAction: false,

		// Loading state
		isLoaded: false
	});

	// Debounce timer (not reactive)
	let historyDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Derived state
	const chromaticScale = $derived(getChromaticScale(state.useFlats));
	const stringBaseNotes = $derived(getStringBaseNotes(state.strings));
	const canUndo = $derived(state.historyStack.length > 1);
	const canRedo = $derived(state.redoStack.length > 0);

	// Capture current state
	function captureState(): HistoryState {
		return {
			selectedFrets: { ...state.selectedFrets },
			selectedKey: state.selectedKey,
			isMajor: state.isMajor,
			appliedIsMajor: state.appliedIsMajor,
			selectedScale: state.selectedScale,
			selectedColor: state.selectedColor,
			customColor: state.customColor,
			showShapeBoxes: state.showShapeBoxes,
			show3NPSShapeBoxes: state.show3NPSShapeBoxes,
			selected3NPSShape: state.selected3NPSShape,
			showIntervals: state.showIntervals,
			useFlats: state.useFlats,
			eraseSelectedColorOnly: state.eraseSelectedColorOnly,
			lastAppliedScale: state.lastAppliedScale,
			scaleToRemove: state.scaleToRemove,
			strings: [...state.strings],
			selectedTuningPreset: state.selectedTuningPreset
		};
	}

	// Push to history
	function pushHistory(immediate = false) {
		if (state.isUndoRedoAction || !state.isLoaded) return;

		if (historyDebounceTimer) {
			clearTimeout(historyDebounceTimer);
		}

		const doSave = () => {
			const currentState = captureState();

			if (state.historyStack.length > 0) {
				const lastState = state.historyStack[state.historyStack.length - 1];
				if (JSON.stringify(currentState) === JSON.stringify(lastState)) {
					return;
				}
			}

			state.historyStack = [...state.historyStack, currentState].slice(-MAX_HISTORY_SIZE);
			state.redoStack = [];
			saveHistory(state.historyStack, state.redoStack);
		};

		if (immediate) {
			doSave();
		} else {
			historyDebounceTimer = setTimeout(doSave, HISTORY_DEBOUNCE_MS);
		}
	}

	// Restore state from snapshot
	function restoreState(snapshot: HistoryState) {
		state.selectedFrets = { ...snapshot.selectedFrets };
		state.selectedKey = snapshot.selectedKey;
		state.previousKey = snapshot.selectedKey;
		state.isMajor = snapshot.isMajor;
		state.previousIsMajor = snapshot.isMajor;
		state.appliedIsMajor = snapshot.appliedIsMajor ?? snapshot.isMajor;
		state.selectedScale = snapshot.selectedScale;
		state.selectedColor = snapshot.selectedColor;
		state.customColor = snapshot.customColor;
		state.showShapeBoxes = snapshot.showShapeBoxes;
		state.show3NPSShapeBoxes = snapshot.show3NPSShapeBoxes;
		state.selected3NPSShape = snapshot.selected3NPSShape;
		state.showIntervals = snapshot.showIntervals;
		state.useFlats = snapshot.useFlats ?? false;
		state.eraseSelectedColorOnly = snapshot.eraseSelectedColorOnly;
		state.lastAppliedScale = snapshot.lastAppliedScale;
		state.scaleToRemove = snapshot.scaleToRemove;
		state.strings = snapshot.strings ? [...snapshot.strings] : ['E', 'B', 'G', 'D', 'A', 'E'];
		state.selectedTuningPreset = snapshot.selectedTuningPreset || 'standard';

		recalculateShapes();
	}

	// Recalculate shapes based on current state
	function recalculateShapes() {
		if (state.selectedTuningPreset === 'standard') {
			state.activeShapes = calculatePentatonicShapes(state.selectedKey, state.isMajor, stringBaseNotes);
			if (state.show3NPSShapeBoxes) {
				state.active3NPSShapes = calculate3NPSShapes(state.selectedKey, state.selected3NPSShape, state.isMajor, stringBaseNotes);
			} else {
				state.active3NPSShapes = [];
			}
		} else {
			state.activeShapes = [];
			state.active3NPSShapes = [];
		}
	}

	// Undo/Redo
	function undo() {
		if (state.historyStack.length <= 1) return;
		state.isUndoRedoAction = true;

		const currentState = state.historyStack[state.historyStack.length - 1];
		state.redoStack = [...state.redoStack, currentState];
		state.historyStack = state.historyStack.slice(0, -1);

		const previousState = state.historyStack[state.historyStack.length - 1];
		restoreState(previousState);
		saveHistory(state.historyStack, state.redoStack);

		state.isUndoRedoAction = false;
	}

	function redo() {
		if (state.redoStack.length === 0) return;
		state.isUndoRedoAction = true;

		const nextState = state.redoStack[state.redoStack.length - 1];
		state.redoStack = state.redoStack.slice(0, -1);
		state.historyStack = [...state.historyStack, nextState];

		restoreState(nextState);
		saveHistory(state.historyStack, state.redoStack);

		state.isUndoRedoAction = false;
	}

	// Tuning functions
	function applyTuningPreset(presetKey: string) {
		if (!presetKey || typeof presetKey !== 'string') return;
		const preset = TUNING_PRESETS[presetKey];
		if (!preset || !Array.isArray(preset) || preset.length === 0) return;

		state.selectedTuningPreset = presetKey;
		state.strings = [...preset];
		pushHistory(true);
	}

	function changeStringTuning(stringIndex: number, direction: number) {
		const currentNote = state.strings[stringIndex];
		const currentIdx = getNoteIndex(currentNote);
		const newIdx = (currentIdx + direction + 12) % 12;
		state.strings[stringIndex] = chromaticScale[newIdx];
		state.strings = [...state.strings];
		state.selectedTuningPreset = 'custom';
		pushHistory(true);
	}

	// Apply scale to fretboard
	function applyScale() {
		// Validate inputs
		if (!state.selectedKey || !state.selectedScale) return;

		const scaleNotes = getScaleNotes(state.selectedKey, state.isMajor, state.selectedScale);
		if (scaleNotes.size === 0) return; // Invalid scale

		const shouldLayer = state.selectedScale === 'pentatonic' || state.lastAppliedScale === 'pentatonic';

		if (!shouldLayer) {
			state.selectedFrets = {};
		}

		recalculateShapes();

		for (let stringIndex = 0; stringIndex < state.strings.length; stringIndex++) {
			for (let fretIndex = 0; fretIndex <= FRET_COUNT; fretIndex++) {
				const noteIndex = (stringBaseNotes[stringIndex] + fretIndex) % 12;
				if (scaleNotes.has(noteIndex)) {
					const key = `${stringIndex}-${fretIndex}`;
					if (!state.selectedFrets[key]) {
						state.selectedFrets[key] = state.selectedColor;
					}
				}
			}
		}

		state.lastAppliedScale = shouldLayer ? 'pentatonic' : state.selectedScale;
		state.appliedIsMajor = state.isMajor;
		pushHistory(true);
	}

	// Remove scale notes
	function removeScaleNotes() {
		// Validate inputs
		if (!state.selectedKey || !state.scaleToRemove) return;

		const pentatonicNotes = getScaleNotes(state.selectedKey, state.isMajor, 'pentatonic');
		const scaleNotes = getScaleNotes(state.selectedKey, state.isMajor, state.scaleToRemove);
		if (scaleNotes.size === 0) return; // Invalid scale

		const extraNotes = new Set<number>();
		for (const note of scaleNotes) {
			if (!pentatonicNotes.has(note)) {
				extraNotes.add(note);
			}
		}

		for (let stringIndex = 0; stringIndex < state.strings.length; stringIndex++) {
			for (let fretIndex = 0; fretIndex <= FRET_COUNT; fretIndex++) {
				const noteIndex = (stringBaseNotes[stringIndex] + fretIndex) % 12;
				if (extraNotes.has(noteIndex)) {
					delete state.selectedFrets[`${stringIndex}-${fretIndex}`];
				}
			}
		}

		state.selectedFrets = { ...state.selectedFrets };
		pushHistory(true);
	}

	// Clear functions
	function clearAll() {
		state.selectedFrets = {};
		state.lastAppliedScale = null;
		recalculateShapes();
		pushHistory(true);
	}

	function clearString(stringIndex: number) {
		for (let i = 0; i <= FRET_COUNT; i++) {
			delete state.selectedFrets[`${stringIndex}-${i}`];
		}
		pushHistory(true);
	}

	function selectString(stringIndex: number) {
		for (let i = 0; i <= FRET_COUNT; i++) {
			state.selectedFrets[`${stringIndex}-${i}`] = state.selectedColor;
		}
		pushHistory(true);
	}

	// Painting functions
	function isSelected(stringIndex: number, fretIndex: number): boolean {
		return !!state.selectedFrets[`${stringIndex}-${fretIndex}`];
	}

	function getNoteColor(stringIndex: number, fretIndex: number): string {
		return state.selectedFrets[`${stringIndex}-${fretIndex}`] || state.selectedColor;
	}

	function startPainting(stringIndex: number, fretIndex: number) {
		state.isPainting = true;
		state.paintMode = isSelected(stringIndex, fretIndex) ? 'remove' : 'add';
		applyPaint(stringIndex, fretIndex);
	}

	function stopPainting() {
		if (state.isPainting) {
			pushHistory(true);
		}
		state.isPainting = false;
	}

	function applyPaint(stringIndex: number, fretIndex: number) {
		const key = `${stringIndex}-${fretIndex}`;
		if (state.paintMode === 'add') {
			state.selectedFrets[key] = state.selectedColor;
		} else {
			if (!state.eraseSelectedColorOnly || state.selectedFrets[key] === state.selectedColor) {
				delete state.selectedFrets[key];
			}
		}
	}

	function handlePaintOver(stringIndex: number, fretIndex: number) {
		if (state.isPainting) {
			applyPaint(stringIndex, fretIndex);
		}
	}

	// Preset functions
	function savePreset() {
		if (!state.presetName.trim()) return;

		const preset: Preset = captureState();
		state.savedPresets[state.presetName.trim()] = preset;
		state.savedPresets = { ...state.savedPresets };
		savePresets(state.savedPresets);

		state.selectedPresetName = state.presetName.trim();
		state.presetName = '';
	}

	function loadPreset() {
		if (!state.selectedPresetName || !state.savedPresets[state.selectedPresetName]) return;
		restoreState(state.savedPresets[state.selectedPresetName]);
		pushHistory(true);
	}

	function deletePreset() {
		if (!state.selectedPresetName || !state.savedPresets[state.selectedPresetName]) return;
		delete state.savedPresets[state.selectedPresetName];
		state.savedPresets = { ...state.savedPresets };
		savePresets(state.savedPresets);
		state.selectedPresetName = '';
	}

	// Initialize store
	function initialize() {
		const saved = loadState();
		if (saved) {
			if (saved.selectedFrets) state.selectedFrets = saved.selectedFrets;
			if (saved.selectedKey) {
				state.selectedKey = saved.selectedKey;
				state.previousKey = saved.selectedKey;
			}
			if (saved.isMajor !== undefined) {
				state.isMajor = saved.isMajor;
				state.previousIsMajor = saved.isMajor;
			}
			if (saved.appliedIsMajor !== undefined) {
				state.appliedIsMajor = saved.appliedIsMajor;
			}
			if (saved.selectedScale) state.selectedScale = saved.selectedScale;
			if (saved.selectedColor) state.selectedColor = saved.selectedColor;
			if (saved.customColor) state.customColor = saved.customColor;
			if (saved.showShapeBoxes !== undefined) state.showShapeBoxes = saved.showShapeBoxes;
			if (saved.show3NPSShapeBoxes !== undefined) state.show3NPSShapeBoxes = saved.show3NPSShapeBoxes;
			if (saved.selected3NPSShape !== undefined) state.selected3NPSShape = saved.selected3NPSShape;
			if (saved.showIntervals !== undefined) state.showIntervals = saved.showIntervals;
			if (saved.useFlats !== undefined) state.useFlats = saved.useFlats;
			if (saved.eraseSelectedColorOnly !== undefined) state.eraseSelectedColorOnly = saved.eraseSelectedColorOnly;
			if (saved.lastAppliedScale !== undefined) state.lastAppliedScale = saved.lastAppliedScale;
			if (saved.scaleToRemove) state.scaleToRemove = saved.scaleToRemove;
			if (saved.strings) state.strings = saved.strings;
			if (saved.selectedTuningPreset) state.selectedTuningPreset = saved.selectedTuningPreset;
		}

		state.savedPresets = loadPresets();

		const { history, redo } = loadHistory();
		state.historyStack = history;
		state.redoStack = redo;

		state.isLoaded = true;

		recalculateShapes();

		if (state.historyStack.length === 0) {
			state.historyStack = [captureState()];
			saveHistory(state.historyStack, state.redoStack);
		}
	}

	// Auto-save effect
	function setupAutoSave() {
		$effect(() => {
			if (!state.isLoaded) return;
			saveState(captureState());
		});
	}

	// Cleanup function
	function cleanup() {
		if (historyDebounceTimer) {
			clearTimeout(historyDebounceTimer);
			historyDebounceTimer = null;
		}
	}

	return {
		// Expose state object directly for reactive access
		state,

		// Derived values (read-only)
		get chromaticScale() { return chromaticScale; },
		get stringBaseNotes() { return stringBaseNotes; },
		get canUndo() { return canUndo; },
		get canRedo() { return canRedo; },

		// Actions
		initialize,
		setupAutoSave,
		cleanup,
		pushHistory,
		undo,
		redo,
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
