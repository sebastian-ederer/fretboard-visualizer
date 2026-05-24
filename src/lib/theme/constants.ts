import type { ThemePreference } from './types';

export const THEME_STORAGE_KEY = 'fretboard-visualizer-theme';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'auto'] as const;
