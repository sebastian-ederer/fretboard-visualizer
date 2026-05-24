import { THEME_STORAGE_KEY } from './constants';
import type { ThemePreference } from './types';

const DEFAULT_PREFERENCE: ThemePreference = 'auto';

function isValidPreference(value: unknown): value is ThemePreference {
	return value === 'light' || value === 'dark' || value === 'auto';
}

export function loadThemePreference(): ThemePreference {
	if (typeof localStorage === 'undefined') return DEFAULT_PREFERENCE;

	try {
		const saved = localStorage.getItem(THEME_STORAGE_KEY);
		return isValidPreference(saved) ? saved : DEFAULT_PREFERENCE;
	} catch {
		return DEFAULT_PREFERENCE;
	}
}

export function saveThemePreference(preference: ThemePreference): void {
	if (typeof localStorage === 'undefined') return;

	try {
		localStorage.setItem(THEME_STORAGE_KEY, preference);
	} catch {
		// Ignore storage errors
	}
}
