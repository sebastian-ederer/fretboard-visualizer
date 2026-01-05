import { browser } from '$app/environment';
import type { HistoryState, Preset } from './types';
import { STORAGE_KEY, PRESETS_KEY, HISTORY_KEY, MAX_HISTORY_SIZE } from './constants';

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
 * Import presets from a file
 */
export function importPresetsFromFile(
	file: File,
	onSuccess: (imported: Record<string, Preset>) => void,
	onError: (error: Error) => void
): void {
	const reader = new FileReader();
	reader.onload = (e) => {
		try {
			const imported = JSON.parse(e.target?.result as string) as Record<string, Preset>;

			// Validate the imported data
			for (const [name, preset] of Object.entries(imported)) {
				if (typeof preset.selectedFrets !== 'object' || typeof preset.selectedKey !== 'string') {
					throw new Error(`Invalid preset format for "${name}"`);
				}
			}

			onSuccess(imported);
		} catch (err) {
			onError(err as Error);
		}
	};
	reader.readAsText(file);
}
