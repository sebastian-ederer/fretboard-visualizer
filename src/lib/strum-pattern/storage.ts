/**
 * Strum Pattern localStorage persistence
 */

import type { StrumPatternPreset } from './types';
import { createDefaultPattern } from './constants';
import { isObject } from '$lib/utils';

const STORAGE_KEY = 'fretboard-strum-pattern-state';
const PATTERNS_KEY = 'fretboard-strum-patterns';

export interface PersistedState {
	currentPattern: StrumPatternPreset;
	savedPatterns: Record<string, StrumPatternPreset>;
	strumVolume: number;
	loopEnabled: boolean;
	chordLibrary: string[];
}

function getDefaultPersistedState(): PersistedState {
	return {
		currentPattern: createDefaultPattern(),
		savedPatterns: {},
		strumVolume: 0.7,
		loopEnabled: true,
		chordLibrary: []
	};
}

export function loadState(): PersistedState {
	if (typeof localStorage === 'undefined') {
		return getDefaultPersistedState();
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return getDefaultPersistedState();
		}

		const parsed = JSON.parse(stored);
		return {
			...getDefaultPersistedState(),
			...parsed
		};
	} catch {
		return getDefaultPersistedState();
	}
}

export function saveState(state: Partial<PersistedState>): void {
	if (typeof localStorage === 'undefined') return;

	try {
		const current = loadState();
		const merged = { ...current, ...state };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
	} catch (e) {
		console.error('Failed to save strum pattern state:', e);
	}
}

export function loadSavedPatterns(): Record<string, StrumPatternPreset> {
	if (typeof localStorage === 'undefined') {
		return {};
	}

	try {
		const stored = localStorage.getItem(PATTERNS_KEY);
		if (!stored) return {};
		return JSON.parse(stored);
	} catch {
		return {};
	}
}

export function savePatternsToStorage(patterns: Record<string, StrumPatternPreset>): void {
	if (typeof localStorage === 'undefined') return;

	try {
		localStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));
	} catch (e) {
		console.error('Failed to save patterns:', e);
	}
}

export function exportPatternsToFile(patterns: Record<string, StrumPatternPreset>): void {
	const dataStr = JSON.stringify(patterns, null, 2);
	const blob = new Blob([dataStr], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.download = 'strum-patterns.json';
	link.href = url;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

const VALID_STRUM_TYPES = ['down', 'up', 'down-accent', 'up-accent', 'muted', 'rest'];
const VALID_CATEGORIES = ['basic', 'folk', 'rock', 'ballad', 'custom'];
const VALID_SUBDIVISIONS = [1, 2, 3, 4];

/**
 * Validate a strum pattern preset has correct structure
 */
function isValidStrumPattern(value: unknown): value is StrumPatternPreset {
	if (!isObject(value)) return false;

	// Required string fields
	if (typeof value.id !== 'string' || value.id.length === 0 || value.id.length > 100) return false;
	if (typeof value.name !== 'string' || value.name.length === 0 || value.name.length > 100)
		return false;
	if (typeof value.category !== 'string' || !VALID_CATEGORIES.includes(value.category))
		return false;

	// Optional description
	if (value.description !== undefined && typeof value.description !== 'string') return false;

	// Beats array validation
	if (!Array.isArray(value.beats)) return false;
	for (const beat of value.beats) {
		if (!isObject(beat)) return false;
		if (typeof beat.subdivision !== 'number' || !VALID_SUBDIVISIONS.includes(beat.subdivision))
			return false;
		if (!Array.isArray(beat.strums)) return false;
		for (const strum of beat.strums) {
			if (!isObject(strum)) return false;
			if (typeof strum.type !== 'string' || !VALID_STRUM_TYPES.includes(strum.type)) return false;
			if (typeof strum.velocity !== 'number' || strum.velocity < 0 || strum.velocity > 1)
				return false;
		}
	}

	// Chord progression validation
	if (!Array.isArray(value.chordProgression)) return false;
	for (const slot of value.chordProgression) {
		if (!isObject(slot)) return false;
		if (typeof slot.beatIndex !== 'number' || slot.beatIndex < 0) return false;
		if (typeof slot.chord !== 'string' || slot.chord.length > 50) return false;
		if (typeof slot.duration !== 'number' || slot.duration < 1) return false;
	}

	return true;
}

export function importPatternsFromFile(
	file: File,
	onSuccess: (patterns: Record<string, StrumPatternPreset>) => void,
	onError: (error: string) => void
): void {
	const reader = new FileReader();
	reader.onload = (e) => {
		try {
			const content = e.target?.result;
			if (typeof content !== 'string') {
				throw new Error('Invalid file content');
			}

			const parsed: unknown = JSON.parse(content);

			if (!isObject(parsed)) {
				throw new Error('Invalid format: expected object');
			}

			const validated: Record<string, StrumPatternPreset> = {};
			for (const [name, pattern] of Object.entries(parsed)) {
				if (name.length > 100) {
					throw new Error(`Pattern name "${name.slice(0, 20)}..." is too long`);
				}
				if (!isValidStrumPattern(pattern)) {
					throw new Error(`Invalid pattern format for "${name}"`);
				}
				validated[name] = pattern;
			}

			onSuccess(validated);
		} catch (err) {
			onError(err instanceof Error ? err.message : 'Failed to parse patterns file');
		}
	};
	reader.onerror = () => onError('Failed to read file');
	reader.readAsText(file);
}
