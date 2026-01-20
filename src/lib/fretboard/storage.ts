import { browser } from '$app/environment';
import type { HistoryState, Preset } from './types';
import { STORAGE_KEY, PRESETS_KEY, HISTORY_KEY, MAX_HISTORY_SIZE } from './constants';
import { isObject, isValidHexColor } from '$lib/utils';

/**
 * Load state from localStorage
 */
export function loadState(): Partial<HistoryState> | null {
	if (!browser) return null;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			return JSON.parse(saved);
		}
	} catch (e) {
		console.error('Failed to load state from localStorage:', e);
	}
	return null;
}

/**
 * Save state to localStorage
 */
export function saveState(state: HistoryState): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (e) {
		console.error('Failed to save state to localStorage:', e);
	}
}

/**
 * Load presets from localStorage
 */
export function loadPresets(): Record<string, Preset> {
	if (!browser) return {};
	try {
		const saved = localStorage.getItem(PRESETS_KEY);
		if (saved) {
			return JSON.parse(saved);
		}
	} catch (e) {
		console.error('Failed to load presets from localStorage:', e);
	}
	return {};
}

/**
 * Save presets to localStorage
 */
export function savePresets(presets: Record<string, Preset>): void {
	if (!browser) return;
	try {
		localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
	} catch (e) {
		console.error('Failed to save presets to localStorage:', e);
	}
}

/**
 * Load history from sessionStorage
 */
export function loadHistory(): { history: HistoryState[]; redo: HistoryState[] } {
	if (!browser) return { history: [], redo: [] };
	try {
		const saved = sessionStorage.getItem(HISTORY_KEY);
		if (saved) {
			const parsed = JSON.parse(saved);
			return {
				history: parsed.history || [],
				redo: parsed.redo || []
			};
		}
	} catch (e) {
		console.error('Failed to load history from sessionStorage:', e);
	}
	return { history: [], redo: [] };
}

/**
 * Save history to sessionStorage
 */
export function saveHistory(history: HistoryState[], redo: HistoryState[]): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(
			HISTORY_KEY,
			JSON.stringify({
				history,
				redo
			})
		);
	} catch (e) {
		// If sessionStorage is full, trim history
		console.warn('sessionStorage full, trimming history');
		const trimmedHistory = history.slice(-Math.floor(MAX_HISTORY_SIZE / 2));
		try {
			sessionStorage.setItem(
				HISTORY_KEY,
				JSON.stringify({
					history: trimmedHistory,
					redo: []
				})
			);
		} catch {
			console.error('Failed to save history even after trimming');
		}
	}
}

/**
 * Export presets to a JSON file
 */
export function exportPresetsToFile(presets: Record<string, Preset>): void {
	if (Object.keys(presets).length === 0) return;

	const data = JSON.stringify(presets, null, 2);
	const blob = new Blob([data], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = `fretboard-presets-${new Date().toISOString().split('T')[0]}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Validate a preset object has all required fields with correct types
 */
function isValidPreset(value: unknown): value is Preset {
	if (!isObject(value)) return false;

	// Required string fields
	const stringFields = [
		'selectedKey',
		'selectedScale',
		'selectedColor',
		'customColor',
		'scaleToRemove',
		'selectedTuningPreset'
	];
	for (const field of stringFields) {
		if (typeof value[field] !== 'string') return false;
	}

	// Required boolean fields
	const booleanFields = [
		'isMajor',
		'appliedIsMajor',
		'showShapeBoxes',
		'show3NPSShapeBoxes',
		'showIntervals',
		'useFlats',
		'eraseSelectedColorOnly',
		'highlightRootNotes'
	];
	for (const field of booleanFields) {
		if (typeof value[field] !== 'boolean') return false;
	}

	// Required number field
	if (typeof value.selected3NPSShape !== 'number') return false;

	// selectedFrets must be an object with string values (colors)
	if (!isObject(value.selectedFrets)) return false;
	for (const color of Object.values(value.selectedFrets)) {
		if (typeof color !== 'string') return false;
	}

	// strings must be an array of strings
	if (!Array.isArray(value.strings)) return false;
	if (!value.strings.every((s) => typeof s === 'string')) return false;

	// rootNoteHighlightColor should be a valid color
	if (typeof value.rootNoteHighlightColor !== 'string') return false;

	return true;
}

/**
 * Import presets from a file
 */
export function importPresetsFromFile(
	file: File,
	onSuccess: (imported: Record<string, Preset>) => void,
	onError: (error: Error) => void
): void {
	const reader = new FileReader();

	reader.onerror = () => {
		onError(new Error('Failed to read file'));
	};

	reader.onload = (e) => {
		try {
			const result = e.target?.result;
			if (typeof result !== 'string') {
				throw new Error('Invalid file content');
			}

			const parsed: unknown = JSON.parse(result);

			// Validate the imported data structure
			if (!isObject(parsed)) {
				throw new Error('Invalid preset file format: expected object');
			}

			const validated: Record<string, Preset> = {};
			for (const [name, preset] of Object.entries(parsed)) {
				// Limit preset name length
				if (name.length > 100) {
					throw new Error(`Preset name "${name.slice(0, 20)}..." is too long (max 100 characters)`);
				}
				if (!isValidPreset(preset)) {
					throw new Error(`Invalid preset format for "${name}": missing or invalid required fields`);
				}
				validated[name] = preset;
			}

			onSuccess(validated);
		} catch (err) {
			onError(err instanceof Error ? err : new Error(String(err)));
		}
	};

	reader.readAsText(file);
}
