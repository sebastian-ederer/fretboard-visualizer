<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Settings from '@lucide/svelte/icons/settings';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	// Standard guitar tuning (high to low in display)
	const strings = ['E', 'B', 'G', 'D', 'A', 'E'];
	const fretCount = 24;

	// Fret markers (single dots and double dots at 12th and 24th)
	const singleDotFrets = [3, 5, 7, 9, 15, 17, 19, 21];
	const doubleDotFrets = [12, 24];

	// Chromatic scale for note calculation
	const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	// Base note index for each string (E=4, B=11, G=7, D=2, A=9, E=4)
	const stringBaseNotes = [4, 11, 7, 2, 9, 4];

	function getNoteName(stringIndex: number, fretIndex: number): string {
		const noteIndex = (stringBaseNotes[stringIndex] + fretIndex) % 12;
		return chromaticScale[noteIndex];
	}

	// Track selected frets: object map of "string-fret" to color
	let selectedFrets: Record<string, string> = $state({});

	// Painting state
	let isPainting = $state(false);
	let paintMode: 'add' | 'remove' = $state('add');

	// Settings state
	let settingsOpen = $state(true);
	let eraseSelectedColorOnly = $state(false);

	// Scale settings
	let selectedKey = $state('C');
	let isMajor = $state(true);
	let selectedScale = $state('pentatonic');
	let lastAppliedScale: string | null = $state(null);
	let scaleToRemove = $state('ionian');

	// 3NPS shape selection (1-7, or null for none)
	let selected3NPSShape: number | null = $state(null);

	// Display settings
	let showIntervals = $state(false);

	// Interval names (semitones from root)
	const intervalNames = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

	// localStorage keys
	const STORAGE_KEY = 'fretboard-visualizer-state';
	const PRESETS_KEY = 'fretboard-visualizer-presets';

	// Preset management
	interface Preset {
		selectedFrets: Record<string, string>;
		selectedKey: string;
		isMajor: boolean;
		selectedScale: string;
		selectedColor: string;
		customColor: string;
		showShapeBoxes: boolean;
		show3NPSShapeBoxes: boolean;
		selected3NPSShape: number | null;
		showIntervals: boolean;
		eraseSelectedColorOnly: boolean;
		lastAppliedScale: string | null;
		scaleToRemove: string;
	}

	let savedPresets: Record<string, Preset> = $state({});
	let presetName = $state('');
	let selectedPresetName = $state('');

	// Scroll wheel handlers for dropdowns
	function scrollKey(e: WheelEvent) {
		e.preventDefault();
		const idx = chromaticScale.indexOf(selectedKey);
		const newIdx =
			e.deltaY > 0
				? (idx + 1) % chromaticScale.length
				: (idx - 1 + chromaticScale.length) % chromaticScale.length;
		selectedKey = chromaticScale[newIdx];
	}

	const scaleOptions = [
		'pentatonic',
		'blues',
		'ionian',
		'dorian',
		'phrygian',
		'lydian',
		'mixolydian',
		'aeolian',
		'locrian',
		'dorian-#4',
		'melodic-minor',
		'diatonic',
		'3nps'
	];

	function scrollScale(e: WheelEvent) {
		e.preventDefault();
		const idx = scaleOptions.indexOf(selectedScale);
		const newIdx =
			e.deltaY > 0
				? (idx + 1) % scaleOptions.length
				: (idx - 1 + scaleOptions.length) % scaleOptions.length;
		selectedScale = scaleOptions[newIdx];
	}

	const removeScaleOptions = [
		'blues',
		'ionian',
		'dorian',
		'phrygian',
		'lydian',
		'mixolydian',
		'aeolian',
		'locrian',
		'dorian-#4',
		'melodic-minor'
	];

	function scrollRemoveScale(e: WheelEvent) {
		e.preventDefault();
		const idx = removeScaleOptions.indexOf(scaleToRemove);
		const newIdx =
			e.deltaY > 0
				? (idx + 1) % removeScaleOptions.length
				: (idx - 1 + removeScaleOptions.length) % removeScaleOptions.length;
		scaleToRemove = removeScaleOptions[newIdx];
	}

	const threeNPSOptions = ['none', '1', '2', '3', '4', '5', '6', '7'];

	function scroll3NPSShape(e: WheelEvent) {
		e.preventDefault();
		const currentVal = selected3NPSShape?.toString() ?? 'none';
		const idx = threeNPSOptions.indexOf(currentVal);
		const newIdx =
			e.deltaY > 0
				? (idx + 1) % threeNPSOptions.length
				: (idx - 1 + threeNPSOptions.length) % threeNPSOptions.length;
		const newVal = threeNPSOptions[newIdx];
		selected3NPSShape = newVal === 'none' ? null : parseInt(newVal);
		update3NPSShape();
	}

	function scrollPreset(e: WheelEvent) {
		e.preventDefault();
		const presetNames = Object.keys(savedPresets);
		if (presetNames.length === 0) return;
		const idx = presetNames.indexOf(selectedPresetName);
		const newIdx =
			e.deltaY > 0
				? (idx + 1) % presetNames.length
				: (idx - 1 + presetNames.length) % presetNames.length;
		selectedPresetName = presetNames[newIdx];
	}

	// Load state from localStorage on mount
	function loadFromStorage() {
		if (!browser) return;
		try {
			// Load current state
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const state = JSON.parse(saved);
				if (state.selectedFrets) selectedFrets = state.selectedFrets;
				if (state.selectedKey) selectedKey = state.selectedKey;
				if (state.isMajor !== undefined) isMajor = state.isMajor;
				if (state.selectedScale) selectedScale = state.selectedScale;
				if (state.selectedColor) selectedColor = state.selectedColor;
				if (state.customColor) customColor = state.customColor;
				if (state.showShapeBoxes !== undefined) showShapeBoxes = state.showShapeBoxes;
				if (state.show3NPSShapeBoxes !== undefined) show3NPSShapeBoxes = state.show3NPSShapeBoxes;
				if (state.selected3NPSShape !== undefined) selected3NPSShape = state.selected3NPSShape;
				if (state.showIntervals !== undefined) showIntervals = state.showIntervals;
				if (state.eraseSelectedColorOnly !== undefined)
					eraseSelectedColorOnly = state.eraseSelectedColorOnly;
				if (state.lastAppliedScale !== undefined) lastAppliedScale = state.lastAppliedScale;
				if (state.scaleToRemove) scaleToRemove = state.scaleToRemove;

				// Recalculate shapes based on loaded state
				activeShapes = calculatePentatonicShapes(selectedKey);
				if (selected3NPSShape !== null) {
					active3NPSShapes = calculate3NPSShapes(selectedKey, selected3NPSShape);
				}
			}

			// Load saved presets
			const presetsData = localStorage.getItem(PRESETS_KEY);
			if (presetsData) {
				savedPresets = JSON.parse(presetsData);
			}
		} catch (e) {
			console.error('Failed to load state from localStorage:', e);
		}
	}

	// Save state to localStorage
	function saveToStorage() {
		if (!browser) return;
		try {
			const state = {
				selectedFrets,
				selectedKey,
				isMajor,
				selectedScale,
				selectedColor,
				customColor,
				showShapeBoxes,
				show3NPSShapeBoxes,
				selected3NPSShape,
				showIntervals,
				eraseSelectedColorOnly,
				lastAppliedScale,
				scaleToRemove
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch (e) {
			console.error('Failed to save state to localStorage:', e);
		}
	}

	// Preset functions
	function savePreset() {
		if (!presetName.trim()) return;

		const preset: Preset = {
			selectedFrets: { ...selectedFrets },
			selectedKey,
			isMajor,
			selectedScale,
			selectedColor,
			customColor,
			showShapeBoxes,
			show3NPSShapeBoxes,
			selected3NPSShape,
			showIntervals,
			eraseSelectedColorOnly,
			lastAppliedScale,
			scaleToRemove
		};

		savedPresets[presetName.trim()] = preset;
		savedPresets = { ...savedPresets }; // Trigger reactivity

		// Save to localStorage
		if (browser) {
			localStorage.setItem(PRESETS_KEY, JSON.stringify(savedPresets));
		}

		// Update selected preset and clear input
		selectedPresetName = presetName.trim();
		presetName = '';
	}

	function loadPreset() {
		if (!selectedPresetName || !savedPresets[selectedPresetName]) return;

		const preset = savedPresets[selectedPresetName];

		selectedFrets = { ...preset.selectedFrets };
		selectedKey = preset.selectedKey;
		isMajor = preset.isMajor;
		selectedScale = preset.selectedScale;
		selectedColor = preset.selectedColor;
		customColor = preset.customColor;
		showShapeBoxes = preset.showShapeBoxes;
		show3NPSShapeBoxes = preset.show3NPSShapeBoxes;
		selected3NPSShape = preset.selected3NPSShape;
		showIntervals = preset.showIntervals;
		eraseSelectedColorOnly = preset.eraseSelectedColorOnly;
		lastAppliedScale = preset.lastAppliedScale;
		scaleToRemove = preset.scaleToRemove;

		// Recalculate shapes
		activeShapes = calculatePentatonicShapes(selectedKey);
		if (selected3NPSShape !== null) {
			active3NPSShapes = calculate3NPSShapes(selectedKey, selected3NPSShape);
		} else {
			active3NPSShapes = [];
		}
	}

	function deletePreset() {
		if (!selectedPresetName || !savedPresets[selectedPresetName]) return;

		delete savedPresets[selectedPresetName];
		savedPresets = { ...savedPresets }; // Trigger reactivity

		// Save to localStorage
		if (browser) {
			localStorage.setItem(PRESETS_KEY, JSON.stringify(savedPresets));
		}

		selectedPresetName = '';
	}

	function exportPresets() {
		if (Object.keys(savedPresets).length === 0) return;

		const data = JSON.stringify(savedPresets, null, 2);
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

	let fileInput: HTMLInputElement;

	function importPresets(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const imported = JSON.parse(e.target?.result as string) as Record<string, Preset>;

				// Validate the imported data has the expected structure
				for (const [name, preset] of Object.entries(imported)) {
					if (typeof preset.selectedFrets !== 'object' || typeof preset.selectedKey !== 'string') {
						throw new Error('Invalid preset format');
					}
				}

				// Merge with existing presets (imported presets override existing ones with same name)
				savedPresets = { ...savedPresets, ...imported };

				// Save to localStorage
				if (browser) {
					localStorage.setItem(PRESETS_KEY, JSON.stringify(savedPresets));
				}

				// Reset file input
				input.value = '';
			} catch (err) {
				console.error('Failed to import presets:', err);
				alert('Failed to import presets. Please check the file format.');
				input.value = '';
			}
		};
		reader.readAsText(file);
	}

	// Load on mount
	let isLoaded = $state(false);

	onMount(() => {
		loadFromStorage();
		isLoaded = true;
	});

	// Only save after initial load to prevent overwriting saved state
	$effect(() => {
		if (!isLoaded) return;

		// Access all reactive values to track them
		selectedFrets;
		selectedKey;
		isMajor;
		selectedScale;
		selectedColor;
		customColor;
		showShapeBoxes;
		show3NPSShapeBoxes;
		selected3NPSShape;
		showIntervals;
		eraseSelectedColorOnly;
		lastAppliedScale;
		scaleToRemove;

		saveToStorage();
	});

	function getIntervalName(stringIndex: number, fretIndex: number): string {
		const noteIndex = (stringBaseNotes[stringIndex] + fretIndex) % 12;
		const rootIndex = chromaticScale.indexOf(selectedKey);
		const interval = (noteIndex - rootIndex + 12) % 12;
		return intervalNames[interval];
	}

	function getNoteDisplay(stringIndex: number, fretIndex: number): string {
		if (showIntervals) {
			return getIntervalName(stringIndex, fretIndex);
		}
		return getNoteName(stringIndex, fretIndex);
	}

	// Scale intervals (semitones from root)
	// Overlays on pentatonic: minor pent = [0, 3, 5, 7, 10], major pent = [0, 2, 4, 7, 9]
	// Minor-relative modes: Dorian, Aeolian, Phrygian, Locrian (add to minor pentatonic)
	// Major-relative modes: Ionian, Lydian, Mixolydian (add to major pentatonic)
	const scaleIntervals: Record<string, { major: number[]; minor: number[] }> = {
		pentatonic: {
			major: [0, 2, 4, 7, 9], // 1, 2, 3, 5, 6
			minor: [0, 3, 5, 7, 10] // 1, b3, 4, 5, b7
		},
		blues: {
			major: [0, 2, 3, 4, 7, 9], // Major pentatonic + b3 (blue note)
			minor: [0, 3, 5, 6, 7, 10] // Minor pentatonic + b5 (blue note)
		},
		// Major-relative modes (overlay on major pentatonic)
		ionian: {
			major: [0, 2, 4, 5, 7, 9, 11], // Major pentatonic + 4 + 7
			minor: [0, 2, 3, 5, 7, 8, 10] // Aeolian (parallel minor)
		},
		lydian: {
			major: [0, 2, 4, 6, 7, 9, 11], // Major pentatonic + #4 + 7
			minor: [0, 2, 3, 5, 6, 7, 9, 10] // Dorian #4 (parallel minor feel)
		},
		mixolydian: {
			major: [0, 2, 4, 5, 7, 9, 10], // Major pentatonic + 4 + b7
			minor: [0, 2, 3, 5, 7, 9, 10] // Dorian (parallel minor)
		},
		// Minor-relative modes (overlay on minor pentatonic)
		dorian: {
			major: [0, 2, 4, 5, 7, 9, 11], // Ionian (parallel major)
			minor: [0, 2, 3, 5, 7, 9, 10] // Minor pentatonic + 2 + 6
		},
		aeolian: {
			major: [0, 2, 4, 5, 7, 9, 11], // Ionian (parallel major)
			minor: [0, 2, 3, 5, 7, 8, 10] // Minor pentatonic + 2 + b6
		},
		phrygian: {
			major: [0, 1, 4, 5, 7, 8, 10], // Phrygian dominant
			minor: [0, 1, 3, 5, 7, 8, 10] // Minor pentatonic + b2 + b6
		},
		locrian: {
			major: [0, 1, 3, 5, 6, 8, 10], // Standard Locrian
			minor: [0, 1, 3, 5, 6, 7, 8, 10] // Minor pentatonic + b2 + b5 + b6
		},
		'dorian-#4': {
			major: [0, 2, 4, 6, 7, 9, 11], // Lydian
			minor: [0, 2, 3, 5, 6, 7, 9, 10] // Minor pentatonic + 2 + #4 + 6
		},
		'melodic-minor': {
			major: [0, 2, 4, 5, 7, 9, 11], // Ionian
			minor: [0, 2, 3, 5, 7, 9, 10, 11] // Minor pentatonic + 2 + 6 + 7
		},
		diatonic: {
			major: [0, 2, 4, 5, 7, 9, 11], // Ionian
			minor: [0, 2, 3, 5, 7, 8, 10] // Aeolian
		},
		'3nps': {
			major: [0, 2, 4, 5, 7, 9, 11], // Same notes as diatonic
			minor: [0, 2, 3, 5, 7, 8, 10]
		}
	};

	// Shape definitions for each scale type
	interface Shape {
		name: string;
		startOffset: number; // Semitones from root
		span: number; // Number of frets wide
	}

	// Shape patterns define the exact path through the notes
	// Path is an array of [fretOffset, stringIndex] where stringIndex 0=highE, 5=lowE
	interface ShapePattern {
		name: string;
		startOffset: number; // Semitones from root where shape starts
		path: [number, number][]; // [fretOffset, stringIndex] - the path through the shape
	}

	// Minor pentatonic shape paths
	// Each path traces around the shape's notes to create an outline
	const pentatonicShapes: ShapePattern[] = [
		{
			name: '1',
			startOffset: 0,
			path: [
				[0, 5], // 1 on low E
				[3, 5], // b3 on low E
				[2, 4], // 5 on A
				[2, 3], // 1 on D
				[2, 2], // 4 on G
				[3, 1], // b7 on B
				[3, 0], // b3 on high E
				[0, 0], // 1 on high E
				[0, 1], // 5 on B
				[0, 2], // b3 on G
				[0, 3], // b7 on D
				[0, 4] // 4 on A
			]
		},
		{
			name: '2',
			startOffset: 2,
			path: [
				// b3(lowE) → 4(lowE) → b7(A) → b3(D) → 5(G) → 1(B) → 4(highE) → b3(highE) → b7(B) → 4(G) → 1(D) → 5(A) → [close]
				[1, 5], // b3 on low E
				[3, 5], // 4 on low E
				[3, 4], // b7 on A
				[3, 3], // b3 on D
				[2, 2], // 5 on G
				[3, 1], // 1 on B
				[3, 0], // 4 on high E
				[1, 0], // b3 on high E
				[1, 1], // b7 on B
				[0, 2], // 4 on G
				[0, 3], // 1 on D
				[0, 4] // 5 on A
				// closes back to b3 on low E
			]
		},
		{
			name: '3',
			startOffset: 5,
			path: [
				// 4(lowE) → 5(lowE) → 1(A) → 4(D) → b7(G) → b3(B) → 5(highE) → 4(highE) → 1(B) → 5(G) → b3(D) → b7(A) → [close]
				[0, 5], // 4 on low E
				[2, 5], // 5 on low E
				[2, 4], // 1 on A
				[2, 3], // 4 on D
				[2, 2], // b7 on G
				[3, 1], // b3 on B
				[2, 0], // 5 on high E
				[0, 0], // 4 on high E
				[0, 1], // 1 on B
				[-1, 2], // 5 on G
				[0, 3], // b3 on D
				[0, 4] // b7 on A
				// closes back to 4 on low E
			]
		},
		{
			name: '4',
			startOffset: 7,
			path: [
				// 5(lowE) → b7(lowE) → b3(A) → 5(D) → 1(G) → 4(B) → b7(highE) → 5(highE) → b3(B) → b7(G) → 4(D) → 1(A) → [close]
				[0, 5], // 5 on low E
				[3, 5], // b7 on low E
				[3, 4], // b3 on A
				[2, 3], // 5 on D
				[2, 2], // 1 on G
				[3, 1], // 4 on B
				[3, 0], // b7 on high E
				[0, 0], // 5 on high E
				[1, 1], // b3 on B
				[0, 2], // b7 on G
				[0, 3], // 4 on D
				[0, 4] // 1 on A
				// closes back to 5 on low E
			]
		},
		{
			name: '5',
			startOffset: 10,
			path: [
				// b7(lowE) → 1(lowE) → 4(A) → b7(D) → b3(G) → 5(B) → 1(highE) → b7(highE) → 4(B) → 1(G) → 5(D) → b3(A) → [close]
				[0, 5], // b7 on low E
				[2, 5], // 1 on low E
				[2, 4], // 4 on A
				[2, 3], // b7 on D
				[2, 2], // b3 on G
				[2, 1], // 5 on B
				[2, 0], // 1 on high E
				[0, 0], // b7 on high E
				[0, 1], // 4 on B
				[-1, 2], // 1 on G
				[-1, 3], // 5 on D
				[0, 4] // b3 on A
				// closes back to b7 on low E
			]
		}
	];

	// For diatonic and 3nps, we'll use simpler rectangle approach for now
	interface Shape {
		name: string;
		startOffset: number;
		span: number;
	}

	const scaleShapes: Record<string, Shape[]> = {
		diatonic: [
			{ name: '1', startOffset: 0, span: 3 },
			{ name: '2', startOffset: 2, span: 3 },
			{ name: '3', startOffset: 4, span: 2 },
			{ name: '4', startOffset: 5, span: 3 },
			{ name: '5', startOffset: 7, span: 3 },
			{ name: '6', startOffset: 9, span: 2 },
			{ name: '7', startOffset: 11, span: 3 }
		],
		'3nps': [
			{ name: '1', startOffset: 0, span: 4 },
			{ name: '2', startOffset: 2, span: 4 },
			{ name: '3', startOffset: 4, span: 3 },
			{ name: '4', startOffset: 5, span: 4 },
			{ name: '5', startOffset: 7, span: 4 },
			{ name: '6', startOffset: 9, span: 3 },
			{ name: '7', startOffset: 11, span: 4 }
		]
	};

	// Colors for shape boxes
	// Pentatonic shape colors
	const shapeColors = [
		'rgba(168, 85, 247, 0.15)', // Purple
		'rgba(59, 130, 246, 0.15)', // Blue
		'rgba(34, 197, 94, 0.15)', // Green
		'rgba(234, 179, 8, 0.15)', // Yellow
		'rgba(249, 115, 22, 0.15)', // Orange
		'rgba(239, 68, 68, 0.15)', // Red
		'rgba(236, 72, 153, 0.15)' // Pink
	];

	const shapeBorderColors = [
		'rgba(168, 85, 247, 0.6)',
		'rgba(59, 130, 246, 0.6)',
		'rgba(34, 197, 94, 0.6)',
		'rgba(234, 179, 8, 0.6)',
		'rgba(249, 115, 22, 0.6)',
		'rgba(239, 68, 68, 0.6)',
		'rgba(236, 72, 153, 0.6)'
	];

	// 3NPS shape colors (transparent white for best visibility)
	const threeNPSShapeColors = [
		'rgba(255, 255, 255, 0.15)',
		'rgba(255, 255, 255, 0.15)',
		'rgba(255, 255, 255, 0.15)',
		'rgba(255, 255, 255, 0.15)',
		'rgba(255, 255, 255, 0.15)',
		'rgba(255, 255, 255, 0.15)',
		'rgba(255, 255, 255, 0.15)'
	];

	const threeNPSBorderColors = [
		'rgba(255, 255, 255, 0.9)',
		'rgba(255, 255, 255, 0.9)',
		'rgba(255, 255, 255, 0.9)',
		'rgba(255, 255, 255, 0.9)',
		'rgba(255, 255, 255, 0.9)',
		'rgba(255, 255, 255, 0.9)',
		'rgba(255, 255, 255, 0.9)'
	];

	// Active shapes state
	interface ActiveShape {
		name: string;
		startFret: number;
		colorIndex: number;
		path?: [number, number][]; // For pentatonic - array of [fretOffset, stringIndex]
		endFret?: number; // For rectangle-based shapes
	}
	let activeShapes: ActiveShape[] = $state([]);
	let active3NPSShapes: ActiveShape[] = $state([]);
	let showShapeBoxes = $state(true);
	let show3NPSShapeBoxes = $state(true);

	function getScaleNotes(key: string, major: boolean, scale: string): Set<number> {
		const keyIndex = chromaticScale.indexOf(key);
		const intervals = scaleIntervals[scale][major ? 'major' : 'minor'];
		return new Set(intervals.map((interval) => (keyIndex + interval) % 12));
	}

	function getRootFret(key: string): number {
		// Find the first occurrence of the root note on the low E string (string index 5)
		const keyIndex = chromaticScale.indexOf(key);
		const lowEBase = stringBaseNotes[5]; // E = 4
		// Calculate fret where this note appears on low E
		let fret = (keyIndex - lowEBase + 12) % 12;
		return fret;
	}

	// Always calculate pentatonic shapes (can overlay on any scale)
	function calculatePentatonicShapes(key: string): ActiveShape[] {
		const rootFret = getRootFret(key);
		const result: ActiveShape[] = [];

		// For major, use relative minor position (3 semitones down)
		// This aligns shapes correctly since C major pent = A minor pent (same notes)
		const effectiveRootFret = isMajor ? (rootFret - 3 + 12) % 12 : rootFret;

		// Use path-based shapes for pentatonic
		pentatonicShapes.forEach((shape, index) => {
			for (let octave = -1; octave <= 2; octave++) {
				const startFret = effectiveRootFret + shape.startOffset + octave * 12;
				const maxFret = startFret + Math.max(...shape.path.map((p) => p[0]));
				const minFret = startFret + Math.min(...shape.path.map((p) => p[0]));

				// Only add if the shape is visible on the fretboard
				if (maxFret >= 0 && minFret <= fretCount) {
					result.push({
						name: shape.name,
						startFret: startFret,
						colorIndex: index % shapeBorderColors.length,
						path: shape.path
					});
				}
			}
		});

		// Sort by start fret for consistent rendering
		result.sort((a, b) => a.startFret - b.startFret);

		return result;
	}

	// Calculate all instances of a 3NPS shape across the fretboard
	function calculate3NPSShapes(key: string, shapeNumber: number): ActiveShape[] {
		if (shapeNumber < 1 || shapeNumber > 7) return [];

		const keyIndex = chromaticScale.indexOf(key);
		const intervals = scaleIntervals['3nps'][isMajor ? 'major' : 'minor'];
		const startDegree = shapeNumber - 1;

		// First, calculate the base shape pattern (relative fret positions)
		const stringNotes: { fret: number; stringIndex: number }[][] = [];

		for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
			const stringBase = stringBaseNotes[stringIndex];
			const notesOnString: { fret: number; stringIndex: number }[] = [];
			const stringOffset = (5 - stringIndex) * 3;

			for (let noteIdx = 0; noteIdx < 3; noteIdx++) {
				const degree = (startDegree + stringOffset + noteIdx) % 7;
				const semitones = intervals[degree];
				const noteIndex = (keyIndex + semitones) % 12;
				const baseFret = (noteIndex - stringBase + 12) % 12;
				notesOnString.push({ fret: baseFret, stringIndex });
			}

			stringNotes.push(notesOnString);
		}

		// Normalize fret positions for the base shape
		let referenceFret = stringNotes[5]?.[0]?.fret || 0;
		const adjustedNotes: { fret: number; stringIndex: number }[][] = [];

		for (let stringIndex = 5; stringIndex >= 0; stringIndex--) {
			const notes = stringNotes[stringIndex];
			const adjusted: { fret: number; stringIndex: number }[] = [];

			for (const note of notes) {
				let fret = note.fret;
				while (fret < referenceFret - 3) fret += 12;
				while (fret > referenceFret + 8) fret -= 12;
				adjusted.push({ fret, stringIndex: note.stringIndex });
			}

			adjusted.sort((a, b) => a.fret - b.fret);
			adjustedNotes[stringIndex] = adjusted;

			if (adjusted.length > 0) {
				referenceFret = adjusted[Math.floor(adjusted.length / 2)].fret;
			}
		}

		// Build the path pattern
		const allFrets = adjustedNotes.flat().map((n) => n.fret);
		const minFret = Math.min(...allFrets);
		const maxFret = Math.max(...allFrets);

		const simplePath: [number, number][] = [];

		// Right side going up (low E to high E)
		for (let stringIndex = 5; stringIndex >= 0; stringIndex--) {
			const notes = adjustedNotes[stringIndex];
			if (notes && notes.length > 0) {
				const rightmost = notes[notes.length - 1];
				simplePath.push([rightmost.fret - minFret, stringIndex]);
			}
		}

		// Left side going down (high E to low E)
		for (let stringIndex = 0; stringIndex <= 5; stringIndex++) {
			const notes = adjustedNotes[stringIndex];
			if (notes && notes.length > 0) {
				const leftmost = notes[0];
				if (notes.length > 1 || stringIndex === 0) {
					simplePath.push([leftmost.fret - minFret, stringIndex]);
				}
			}
		}

		// Now create instances at every octave across the fretboard
		const result: ActiveShape[] = [];

		for (let octave = -1; octave <= 2; octave++) {
			const startFret = minFret + octave * 12;
			const endFret = startFret + (maxFret - minFret);

			// Only add if the shape is at least partially visible
			if (endFret >= 0 && startFret <= fretCount) {
				result.push({
					name: String(shapeNumber),
					startFret: startFret,
					colorIndex: (shapeNumber - 1) % shapeBorderColors.length,
					path: simplePath
				});
			}
		}

		return result;
	}

	// Calculate pixel position for shape overlays
	function getShapePosition(startFret: number, endFret: number) {
		// Fret 0 is w-8 (32px), frets 1+ are w-14 (56px)
		// String labels are w-10 (40px)
		let left = 40; // pl-10 for string labels
		for (let i = 0; i < startFret; i++) {
			left += i === 0 ? 32 : 56;
		}

		let width = 0;
		for (let i = startFret; i <= endFret; i++) {
			width += i === 0 ? 32 : 56;
		}

		return { left, width };
	}

	// Get X position for a specific fret (center of fret cell)
	// Fret 0 = 32px wide, Frets 1+ = 56px wide, String labels = 40px
	function getFretX(fret: number): number {
		if (fret === 0) return 56; // 40 + 32/2
		if (fret > 0) return 44 + 56 * fret; // 40 + 32 + (fret-1)*56 + 28
		// Negative frets (for shapes extending past fret 0)
		return 12 + (fret + 1) * 56; // 40 - 28 + (fret+1)*56
	}

	// Get Y position for a specific string (center of string row)
	function getStringY(stringIndex: number): number {
		// Each string row is h-10 (40px), starting after fret numbers
		// Fret numbers row is about 28px (mb-3 = 12px + text height ~16px)
		return 28 + stringIndex * 40 + 20; // 20px to center in 40px row
	}

	// Generate SVG path for a pentatonic shape
	// Uses the explicit path defined for each shape
	// Clamps points to visible fretboard range (0 to fretCount)
	function generateShapePath(shape: ActiveShape): string {
		if (!shape.path) return '';

		const points: { x: number; y: number }[] = [];

		for (const [fretOffset, stringIdx] of shape.path) {
			const fret = shape.startFret + fretOffset;
			// Clamp fret to visible range
			const clampedFret = Math.max(0, Math.min(fretCount, fret));
			points.push({ x: getFretX(clampedFret), y: getStringY(stringIdx) });
		}

		if (points.length < 3) return '';

		// Create closed path
		return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';
	}

	// Check if shape overlaps with visible fretboard (for rendering)
	function isShapeVisible(shape: ActiveShape): boolean {
		if (shape.path) {
			const frets = shape.path.map((p) => shape.startFret + p[0]);
			const minFret = Math.min(...frets);
			const maxFret = Math.max(...frets);
			// Shape is visible if it overlaps with [0, fretCount]
			return maxFret >= 0 && minFret <= fretCount;
		} else if (shape.endFret !== undefined) {
			return shape.endFret >= 0 && shape.startFret <= fretCount;
		}
		return false;
	}

	// Check if shape label should be visible (center is within fretboard)
	function isShapeLabelVisible(shape: ActiveShape): boolean {
		if (shape.path) {
			const frets = shape.path.map((p) => shape.startFret + p[0]);
			const minFret = Math.min(...frets);
			const maxFret = Math.max(...frets);
			const centerFret = (minFret + maxFret) / 2;
			return centerFret >= 0 && centerFret <= fretCount;
		} else if (shape.endFret !== undefined) {
			const centerFret = (shape.startFret + shape.endFret) / 2;
			return centerFret >= 0 && centerFret <= fretCount;
		}
		return false;
	}

	// Get center position for shape label
	function getShapeLabelPosition(shape: ActiveShape): { x: number; y: number } {
		if (shape.path) {
			// For pentatonic, calculate center of the shape (clamped to visible range)
			const frets = shape.path.map((p) => shape.startFret + p[0]);
			const minFret = Math.max(0, Math.min(...frets));
			const maxFret = Math.min(fretCount, Math.max(...frets));
			return {
				x: (getFretX(minFret) + getFretX(maxFret)) / 2,
				y: -28
			};
		} else if (shape.endFret !== undefined) {
			// For rectangle shapes
			const pos = getShapePosition(shape.startFret, shape.endFret);
			return {
				x: pos.left + pos.width / 2,
				y: -28
			};
		}
		return { x: 0, y: 0 };
	}

	function applyScale() {
		const scaleNotes = getScaleNotes(selectedKey, isMajor, selectedScale);

		// Check if we should layer on top of pentatonic
		const shouldLayer = lastAppliedScale === 'pentatonic' && selectedScale !== 'pentatonic';

		// Clear existing notes only if not layering
		if (!shouldLayer) {
			selectedFrets = {};
		}

		// Always calculate pentatonic shapes (can overlay on any scale)
		activeShapes = calculatePentatonicShapes(selectedKey);

		// Calculate 3NPS shapes if one is selected (all octaves)
		if (selected3NPSShape !== null) {
			active3NPSShapes = calculate3NPSShapes(selectedKey, selected3NPSShape);
		} else {
			active3NPSShapes = [];
		}

		// Apply scale to all frets
		for (let stringIndex = 0; stringIndex < strings.length; stringIndex++) {
			for (let fretIndex = 0; fretIndex <= fretCount; fretIndex++) {
				const noteIndex = (stringBaseNotes[stringIndex] + fretIndex) % 12;
				if (scaleNotes.has(noteIndex)) {
					const key = `${stringIndex}-${fretIndex}`;
					// Only add if not already selected (preserves existing colors when layering)
					if (!selectedFrets[key]) {
						selectedFrets[key] = selectedColor;
					}
				}
			}
		}

		// Track the last applied scale (use 'pentatonic' if layering to allow further layering)
		lastAppliedScale = shouldLayer ? 'pentatonic' : selectedScale;
	}

	// Recalculate 3NPS shapes when selection changes
	function update3NPSShape() {
		if (selected3NPSShape !== null) {
			active3NPSShapes = calculate3NPSShapes(selectedKey, selected3NPSShape);
		} else {
			active3NPSShapes = [];
		}
	}

	// Remove notes that are specific to a scale (extra notes compared to pentatonic)
	function removeScaleNotes() {
		const pentatonicNotes = getScaleNotes(selectedKey, isMajor, 'pentatonic');
		const scaleNotes = getScaleNotes(selectedKey, isMajor, scaleToRemove);

		// Find notes that are in the scale but NOT in pentatonic (the "extra" notes)
		const extraNotes = new Set<number>();
		for (const note of scaleNotes) {
			if (!pentatonicNotes.has(note)) {
				extraNotes.add(note);
			}
		}

		// Remove frets that match these extra notes
		for (let stringIndex = 0; stringIndex < strings.length; stringIndex++) {
			for (let fretIndex = 0; fretIndex <= fretCount; fretIndex++) {
				const noteIndex = (stringBaseNotes[stringIndex] + fretIndex) % 12;
				if (extraNotes.has(noteIndex)) {
					delete selectedFrets[`${stringIndex}-${fretIndex}`];
				}
			}
		}

		// Trigger reactivity
		selectedFrets = { ...selectedFrets };
	}

	// Color options - predefined colors that match the dark theme
	const presetColors = [
		'#a855f7', // Purple
		'#3b82f6', // Blue
		'#22c55e', // Green
		'#eab308', // Yellow
		'#f97316', // Orange
		'#ef4444' // Red
	];
	let selectedColor = $state(presetColors[0]);
	let customColor = $state('#ffffff');

	function selectPresetColor(color: string) {
		selectedColor = color;
	}

	function handleCustomColorChange(event: Event) {
		const input = event.target as HTMLInputElement;
		customColor = input.value;
		selectedColor = input.value;
	}

	function isSelected(stringIndex: number, fretIndex: number): boolean {
		return !!selectedFrets[`${stringIndex}-${fretIndex}`];
	}

	function getNoteColor(stringIndex: number, fretIndex: number): string {
		return selectedFrets[`${stringIndex}-${fretIndex}`] || selectedColor;
	}

	// Calculate complementary color for high contrast borders
	function getComplementaryColor(hexColor: string): string {
		// Remove # if present
		const hex = hexColor.replace('#', '');

		// Parse RGB
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);

		// Convert to HSL
		const rNorm = r / 255;
		const gNorm = g / 255;
		const bNorm = b / 255;

		const max = Math.max(rNorm, gNorm, bNorm);
		const min = Math.min(rNorm, gNorm, bNorm);
		const l = (max + min) / 2;

		let h = 0;
		let s = 0;

		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

			switch (max) {
				case rNorm:
					h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
					break;
				case gNorm:
					h = ((bNorm - rNorm) / d + 2) / 6;
					break;
				case bNorm:
					h = ((rNorm - gNorm) / d + 4) / 6;
					break;
			}
		}

		// Shift hue by 180 degrees (0.5 in normalized form)
		h = (h + 0.5) % 1;

		// Increase saturation for more vibrant complementary color
		s = Math.min(1, s * 1.2);

		// Convert back to RGB
		function hue2rgb(p: number, q: number, t: number) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		}

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;

		const rOut = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
		const gOut = Math.round(hue2rgb(p, q, h) * 255);
		const bOut = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

		return `rgb(${rOut}, ${gOut}, ${bOut})`;
	}

	// Check if a note is within any active 3NPS shape
	function isNoteIn3NPSShape(stringIndex: number, fretIndex: number): boolean {
		if (!show3NPSShapeBoxes || active3NPSShapes.length === 0) return false;

		for (const shape of active3NPSShapes) {
			if (!shape.path) continue;

			// Get the fret range for this string from the shape path
			const stringPoints = shape.path.filter(([_, strIdx]) => strIdx === stringIndex);
			if (stringPoints.length === 0) continue;

			const frets = stringPoints.map(([fretOffset, _]) => shape.startFret + fretOffset);
			const minFret = Math.min(...frets);
			const maxFret = Math.max(...frets);

			if (fretIndex >= minFret && fretIndex <= maxFret) {
				return true;
			}
		}

		return false;
	}

	function clearAll() {
		selectedFrets = {};
		activeShapes = [];
		lastAppliedScale = null;
	}

	function clearString(stringIndex: number) {
		for (let i = 0; i <= fretCount; i++) {
			delete selectedFrets[`${stringIndex}-${i}`];
		}
	}

	function selectString(stringIndex: number) {
		for (let i = 0; i <= fretCount; i++) {
			selectedFrets[`${stringIndex}-${i}`] = selectedColor;
		}
	}

	function startPainting(stringIndex: number, fretIndex: number) {
		isPainting = true;
		paintMode = isSelected(stringIndex, fretIndex) ? 'remove' : 'add';
		applyPaint(stringIndex, fretIndex);
	}

	function stopPainting() {
		isPainting = false;
	}

	function applyPaint(stringIndex: number, fretIndex: number) {
		const key = `${stringIndex}-${fretIndex}`;
		if (paintMode === 'add') {
			selectedFrets[key] = selectedColor;
		} else {
			// Only erase if toggle is off, or if the note matches the selected color
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
</script>

<svelte:window onmouseup={stopPainting} />

<div class="flex min-h-screen flex-col p-8">
	<header class="mb-12 text-center">
		<h1 class="mb-2 text-4xl font-bold tracking-tight">Fretboard Visualizer</h1>
		<p class="text-muted-foreground">Click and drag to paint notes on the fretboard</p>
	</header>

	<main class="flex flex-1 flex-col items-center gap-6">
		<div class="flex flex-col gap-4">
			<!-- Settings Section -->
			<Collapsible.Root bind:open={settingsOpen} class="w-full">
				<Collapsible.Trigger
					class="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card/50 px-4 py-3 transition-colors hover:bg-card"
				>
					<div class="flex items-center gap-2">
						<Settings class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm font-medium">Settings</span>
					</div>
					<ChevronDown
						class="h-4 w-4 text-muted-foreground transition-transform duration-200 {settingsOpen
							? 'rotate-180'
							: ''}"
					/>
				</Collapsible.Trigger>
				<Collapsible.Content class="mt-2 rounded-lg border border-border/50 bg-card/50 p-4">
					<div class="space-y-4">
						<!-- Presets Section -->
						<div class="border-b border-border/50 pb-4">
							<span class="mb-3 block text-sm font-medium text-muted-foreground">Presets</span>
							<div class="flex flex-wrap items-end gap-3">
								<!-- Save Preset -->
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground/70">Save As</span>
									<div class="flex gap-1">
										<input
											type="text"
											bind:value={presetName}
											placeholder="Preset name..."
											class="h-9 w-36 rounded-md border border-border bg-background px-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
											onkeydown={(e) => e.key === 'Enter' && savePreset()}
										/>
										<Button
											onclick={savePreset}
											variant="secondary"
											class="h-9 px-2"
											disabled={!presetName.trim()}
										>
											Save
										</Button>
									</div>
								</div>

								<!-- Load/Delete Preset -->
								{#if Object.keys(savedPresets).length > 0}
									<div class="flex flex-col gap-1">
										<span class="text-xs text-muted-foreground/70">Load Preset</span>
										<div class="flex gap-1">
											<Select.Root type="single" bind:value={selectedPresetName}>
												<Select.Trigger class="h-9 w-36" onwheel={scrollPreset}>
													{selectedPresetName || 'Select...'}
												</Select.Trigger>
												<Select.Content class="max-h-64 overflow-y-auto">
													{#each Object.keys(savedPresets) as name (name)}
														<Select.Item value={name}>{name}</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
											<Button
												onclick={loadPreset}
												variant="secondary"
												class="h-9 px-2"
												disabled={!selectedPresetName}
											>
												Load
											</Button>
											<Button
												onclick={deletePreset}
												variant="ghost"
												class="h-9 px-2 text-muted-foreground hover:text-destructive"
												disabled={!selectedPresetName}
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										</div>
									</div>
								{/if}

								<!-- Export/Import Presets -->
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground/70">File</span>
									<div class="flex gap-1">
										<Button
											onclick={exportPresets}
											variant="outline"
											class="h-9 px-2"
											disabled={Object.keys(savedPresets).length === 0}
										>
											Export
										</Button>
										<Button onclick={() => fileInput.click()} variant="outline" class="h-9 px-2">
											Import
										</Button>
										<input
											type="file"
											accept=".json"
											bind:this={fileInput}
											onchange={importPresets}
											class="hidden"
										/>
									</div>
								</div>
							</div>
						</div>

						<div>
							<span class="mb-2 block text-sm font-medium text-muted-foreground">Note Color</span>
							<div class="flex items-center gap-3">
								{#each presetColors as color (color)}
									<button
										class="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 {selectedColor ===
										color
											? 'border-white ring-2 ring-white/30'
											: 'border-transparent'}"
										style="background-color: {color};"
										onclick={() => selectPresetColor(color)}
										aria-label="Select color {color}"
									></button>
								{/each}
								<!-- Custom color picker -->
								<div class="relative">
									<input
										type="color"
										value={customColor}
										onchange={handleCustomColorChange}
										class="absolute inset-0 h-8 w-8 cursor-pointer opacity-0"
										aria-label="Choose custom color"
									/>
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full p-[3px] transition-transform hover:scale-110 {selectedColor ===
											customColor && !presetColors.includes(selectedColor)
											? 'ring-2 ring-white/30'
											: ''}"
										style="background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);"
									>
										<div
											class="h-full w-full rounded-full"
											style="background-color: {customColor};"
										></div>
									</div>
								</div>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<div>
								<span class="block text-sm font-medium text-muted-foreground"
									>Erase selected color only</span
								>
								<span class="text-xs text-muted-foreground/70"
									>Only erase notes matching the current color</span
								>
							</div>
							<Switch bind:checked={eraseSelectedColorOnly} />
						</div>
						<div class="flex items-center justify-between">
							<div>
								<span class="block text-sm font-medium text-muted-foreground">Show intervals</span>
								<span class="text-xs text-muted-foreground/70"
									>Display interval numbers instead of note names</span
								>
							</div>
							<Switch bind:checked={showIntervals} />
						</div>

						<!-- Scale Selection -->
						<div class="border-t border-border/50 pt-4">
							<span class="mb-3 block text-sm font-medium text-muted-foreground">Scale</span>
							<div class="flex flex-wrap items-end gap-3">
								<!-- Key Selection -->
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground/70">Key</span>
									<Select.Root type="single" bind:value={selectedKey}>
										<Select.Trigger class="w-20" onwheel={scrollKey}>
											{selectedKey}
										</Select.Trigger>
										<Select.Content class="max-h-64 overflow-y-auto">
											{#each chromaticScale as note (note)}
												<Select.Item value={note}>{note}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>

								<!-- Major/Minor Toggle -->
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground/70">Mode</span>
									<div
										class="flex items-center gap-2 rounded-md border border-border bg-background p-1"
									>
										<button
											class="rounded px-3 py-1 text-sm transition-colors {isMajor
												? 'bg-primary text-primary-foreground'
												: 'text-muted-foreground hover:text-foreground'}"
											onclick={() => (isMajor = true)}
										>
											Major
										</button>
										<button
											class="rounded px-3 py-1 text-sm transition-colors {!isMajor
												? 'bg-primary text-primary-foreground'
												: 'text-muted-foreground hover:text-foreground'}"
											onclick={() => (isMajor = false)}
										>
											Minor
										</button>
									</div>
								</div>

								<!-- Scale Type Selection -->
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground/70">Scale</span>
									<Select.Root type="single" bind:value={selectedScale}>
										<Select.Trigger class="w-36" onwheel={scrollScale}>
											{#if selectedScale === '3nps'}
												3 Notes/String
											{:else if selectedScale === 'dorian-#4'}
												Dorian #4
											{:else if selectedScale === 'melodic-minor'}
												Melodic Minor
											{:else}
												{selectedScale.charAt(0).toUpperCase() + selectedScale.slice(1)}
											{/if}
										</Select.Trigger>
										<Select.Content class="max-h-64 overflow-y-auto">
											<Select.Item value="pentatonic">Pentatonic</Select.Item>
											<Select.Item value="blues">Blues</Select.Item>
											<Select.Item value="ionian">Ionian</Select.Item>
											<Select.Item value="dorian">Dorian</Select.Item>
											<Select.Item value="phrygian">Phrygian</Select.Item>
											<Select.Item value="lydian">Lydian</Select.Item>
											<Select.Item value="mixolydian">Mixolydian</Select.Item>
											<Select.Item value="aeolian">Aeolian</Select.Item>
											<Select.Item value="locrian">Locrian</Select.Item>
											<Select.Item value="dorian-#4">Dorian #4</Select.Item>
											<Select.Item value="melodic-minor">Melodic Minor</Select.Item>
											<Select.Item value="diatonic">Diatonic</Select.Item>
											<Select.Item value="3nps">3 Notes/String</Select.Item>
										</Select.Content>
									</Select.Root>
								</div>

								<!-- Apply Button -->
								<Button onclick={applyScale} variant="secondary" class="h-9">Apply</Button>

								<!-- Remove Scale Notes -->
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground/70">Remove</span>
									<div class="flex gap-1">
										<Select.Root type="single" bind:value={scaleToRemove}>
											<Select.Trigger class="h-9 w-28" onwheel={scrollRemoveScale}>
												{#if scaleToRemove === '3nps'}
													3NPS
												{:else if scaleToRemove === 'dorian-#4'}
													Dorian #4
												{:else if scaleToRemove === 'melodic-minor'}
													Mel. Minor
												{:else}
													{scaleToRemove.charAt(0).toUpperCase() + scaleToRemove.slice(1)}
												{/if}
											</Select.Trigger>
											<Select.Content class="max-h-64 overflow-y-auto">
												<Select.Item value="blues">Blues</Select.Item>
												<Select.Item value="ionian">Ionian</Select.Item>
												<Select.Item value="dorian">Dorian</Select.Item>
												<Select.Item value="phrygian">Phrygian</Select.Item>
												<Select.Item value="lydian">Lydian</Select.Item>
												<Select.Item value="mixolydian">Mixolydian</Select.Item>
												<Select.Item value="aeolian">Aeolian</Select.Item>
												<Select.Item value="locrian">Locrian</Select.Item>
												<Select.Item value="dorian-#4">Dorian #4</Select.Item>
												<Select.Item value="melodic-minor">Melodic Minor</Select.Item>
											</Select.Content>
										</Select.Root>
										<Button
											onclick={removeScaleNotes}
											variant="ghost"
											class="h-9 px-2 text-muted-foreground hover:text-destructive"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</div>

								<!-- Show pentatonic shapes toggle (works on any scale) -->
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground/70">Pentatonic</span>
									<div class="flex h-9 items-center">
										<Switch bind:checked={showShapeBoxes} />
									</div>
								</div>

								<!-- Show 3NPS shapes toggle (works on any scale) -->
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground/70">3NPS</span>
									<div class="flex h-9 items-center">
										<Switch bind:checked={show3NPSShapeBoxes} />
									</div>
								</div>

								<!-- 3NPS Shape Selector (available for all scales) -->
								{#if show3NPSShapeBoxes}
									<div class="flex flex-col gap-1">
										<span class="text-xs text-muted-foreground/70">3NPS Shape</span>
										<Select.Root
											type="single"
											value={selected3NPSShape?.toString() ?? 'none'}
											onValueChange={(v) => {
												selected3NPSShape = v === 'none' ? null : parseInt(v);
												update3NPSShape();
											}}
										>
											<Select.Trigger class="w-28" onwheel={scroll3NPSShape}>
												{selected3NPSShape === null ? 'None' : `Shape ${selected3NPSShape}`}
											</Select.Trigger>
											<Select.Content class="max-h-64 overflow-y-auto">
												<Select.Item value="none">None</Select.Item>
												<Select.Item value="1">Shape 1</Select.Item>
												<Select.Item value="2">Shape 2</Select.Item>
												<Select.Item value="3">Shape 3</Select.Item>
												<Select.Item value="4">Shape 4</Select.Item>
												<Select.Item value="5">Shape 5</Select.Item>
												<Select.Item value="6">Shape 6</Select.Item>
												<Select.Item value="7">Shape 7</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>
								{/if}
							</div>
						</div>

						<!-- Clear All Button -->
						<div class="border-t border-border/50 pt-4">
							<Button variant="secondary" onclick={clearAll} class="w-full">Clear All Notes</Button>
						</div>
					</div>
				</Collapsible.Content>
			</Collapsible.Root>

			<!-- Fretboard -->
			<div
				class="relative overflow-x-auto rounded-xl border border-border/50 bg-transparent px-6 pb-6 pt-12"
			>
				<!-- Pentatonic shape overlays using SVG -->
				{#if showShapeBoxes && activeShapes.length > 0}
					<svg
						class="pointer-events-none absolute inset-0 z-10"
						style="top: 48px; left: 24px; width: calc(100% - 48px); height: 300px;"
					>
						{#each activeShapes as shape (shape.name + '-' + shape.startFret)}
							{#if isShapeVisible(shape) && shape.path}
								<path
									d={generateShapePath(shape)}
									fill={shapeColors[shape.colorIndex]}
									stroke={shapeBorderColors[shape.colorIndex]}
									stroke-width="2"
									stroke-linejoin="round"
								/>
							{/if}
						{/each}
					</svg>

					<!-- Pentatonic shape labels -->
					{#each activeShapes as shape (shape.name + '-' + shape.startFret + '-label')}
						{#if shape.path && isShapeLabelVisible(shape)}
							{@const labelPos = getShapeLabelPosition(shape)}
							<div
								class="pointer-events-none absolute z-20"
								style="left: {labelPos.x + 24}px; top: {labelPos.y +
									40}px; transform: translateX(-50%);"
							>
								<span
									class="whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold"
									style="background-color: {shapeColors[
										shape.colorIndex
									]}; color: {shapeBorderColors[
										shape.colorIndex
									]}; border: 1px solid {shapeBorderColors[shape.colorIndex]};"
								>
									Shape {shape.name}
								</span>
							</div>
						{/if}
					{/each}
				{/if}

				<!-- 3NPS shape overlays -->
				{#if show3NPSShapeBoxes && active3NPSShapes.length > 0}
					<svg
						class="pointer-events-none absolute inset-0 z-10"
						style="top: 48px; left: 24px; width: calc(100% - 48px); height: 300px;"
					>
						{#each active3NPSShapes as shape (shape.name + '-3nps-' + shape.startFret)}
							{#if isShapeVisible(shape) && shape.path}
								<path
									d={generateShapePath(shape)}
									fill={threeNPSShapeColors[shape.colorIndex]}
									stroke={threeNPSBorderColors[shape.colorIndex]}
									stroke-width="2"
									stroke-linejoin="round"
								/>
							{/if}
						{/each}
					</svg>

					<!-- 3NPS shape labels -->
					{#each active3NPSShapes as shape (shape.name + '-3nps-' + shape.startFret + '-label')}
						{#if shape.path && isShapeLabelVisible(shape)}
							{@const labelPos = getShapeLabelPosition(shape)}
							<div
								class="pointer-events-none absolute z-20"
								style="left: {labelPos.x + 24}px; top: {labelPos.y +
									40}px; transform: translateX(-50%);"
							>
								<span
									class="whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold"
									style="background-color: {threeNPSShapeColors[
										shape.colorIndex
									]}; color: {threeNPSBorderColors[
										shape.colorIndex
									]}; border: 1px solid {threeNPSBorderColors[shape.colorIndex]};"
								>
									3NPS {shape.name}
								</span>
							</div>
						{/if}
					{/each}
				{/if}

				<!-- Fret numbers -->
				<div class="mb-3 flex pl-10">
					{#each { length: fretCount + 1 }, fretIndex (fretIndex)}
						<div
							class="text-center text-xs font-medium text-muted-foreground {fretIndex === 0
								? 'w-8'
								: 'w-14'}"
						>
							{fretIndex}
						</div>
					{/each}
				</div>

				<!-- Strings -->
				{#each strings as stringName, stringIndex (stringIndex)}
					<ContextMenu.Root>
						<ContextMenu.Trigger>
							<div class="group relative flex items-center">
								<div class="w-10 text-center text-sm font-semibold text-muted-foreground">
									{stringName}
								</div>

								<!-- String line -->
								<div
									class="pointer-events-none absolute left-10 right-0 bg-gradient-to-r from-zinc-400 via-zinc-300 to-zinc-400"
									style="height: {1 + stringIndex * 0.4}px;"
								></div>

								{#each { length: fretCount + 1 }, fretIndex (fretIndex)}
									<div
										class="relative z-20 flex h-10 items-center justify-center {fretIndex === 0
											? 'w-8 border-r-4 border-r-zinc-300 bg-zinc-900/30'
											: 'w-14 border-r-2 border-r-zinc-600'}"
									>
										<!-- Circular hit area for painting -->
										<button
											class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
											onmousedown={() => startPainting(stringIndex, fretIndex)}
											onmouseenter={() => handlePaintOver(stringIndex, fretIndex)}
										>
											{#if isSelected(stringIndex, fretIndex)}
												{@const noteColor = getNoteColor(stringIndex, fretIndex)}
												{@const inShape = isNoteIn3NPSShape(stringIndex, fretIndex)}
												{@const borderColor = inShape ? getComplementaryColor(noteColor) : 'white'}
												<div
													class="flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-lg transition-transform hover:scale-110"
													style="background-color: {noteColor}bf; box-shadow: 0 10px 15px -3px {noteColor}80; border-color: {borderColor};"
												>
													<span class="text-[10px] font-bold text-white drop-shadow-md"
														>{getNoteDisplay(stringIndex, fretIndex)}</span
													>
												</div>
											{/if}
										</button>
									</div>
								{/each}
							</div>
						</ContextMenu.Trigger>
						<ContextMenu.Content class="w-48">
							<ContextMenu.Item onclick={() => selectString(stringIndex)}>
								Select all on {stringName} string
							</ContextMenu.Item>
							<ContextMenu.Item onclick={() => clearString(stringIndex)}>
								Clear {stringName} string
							</ContextMenu.Item>
							<ContextMenu.Separator />
							<ContextMenu.Item onclick={clearAll}>Clear all</ContextMenu.Item>
						</ContextMenu.Content>
					</ContextMenu.Root>
				{/each}

				<!-- Fret markers -->
				<div class="mt-3 flex pl-10">
					{#each { length: fretCount + 1 }, fretIndex (fretIndex)}
						<div class="flex items-center justify-center gap-1 {fretIndex === 0 ? 'w-8' : 'w-14'}">
							{#if singleDotFrets.includes(fretIndex)}
								<div class="h-2 w-2 rounded-full bg-zinc-600"></div>
							{:else if doubleDotFrets.includes(fretIndex)}
								<div class="h-2 w-2 rounded-full bg-zinc-600"></div>
								<div class="h-2 w-2 rounded-full bg-zinc-600"></div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</main>
</div>
