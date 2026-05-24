import { loadThemePreference, saveThemePreference } from './storage';
import { THEME_PREFERENCES } from './constants';
import type { ThemePreference } from './types';

function createThemeStore() {
	const state = $state<{ preference: ThemePreference; systemPrefersDark: boolean }>({
		preference: 'auto',
		systemPrefersDark: false
	});

	let isInitialized = false;
	let mediaQuery: MediaQueryList | null = null;
	let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

	function setPreference(preference: ThemePreference) {
		state.preference = preference;
		saveThemePreference(preference);
	}

	function cyclePreference() {
		const idx = THEME_PREFERENCES.indexOf(state.preference);
		const next = THEME_PREFERENCES[(idx + 1) % THEME_PREFERENCES.length];
		setPreference(next);
	}

	function initialize(): () => void {
		if (isInitialized) return cleanup;
		if (typeof window === 'undefined') return () => {};

		state.preference = loadThemePreference();

		mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		state.systemPrefersDark = mediaQuery.matches;

		mediaListener = (e: MediaQueryListEvent) => {
			state.systemPrefersDark = e.matches;
		};
		mediaQuery.addEventListener('change', mediaListener);

		isInitialized = true;
		return cleanup;
	}

	function cleanup() {
		if (mediaQuery && mediaListener) {
			mediaQuery.removeEventListener('change', mediaListener);
		}
		mediaQuery = null;
		mediaListener = null;
		isInitialized = false;
	}

	return {
		state,
		get isDark(): boolean {
			return (
				state.preference === 'dark' ||
				(state.preference === 'auto' && state.systemPrefersDark)
			);
		},
		setPreference,
		cyclePreference,
		initialize
	};
}

export const themeStore = createThemeStore();
