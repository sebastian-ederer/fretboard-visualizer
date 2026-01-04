<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Settings from '@lucide/svelte/icons/settings';

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

	// Display settings
	let showIntervals = $state(false);

	// Interval names (semitones from root)
	const intervalNames = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

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
	const scaleIntervals: Record<string, { major: number[]; minor: number[] }> = {
		pentatonic: {
			major: [0, 2, 4, 7, 9], // 1, 2, 3, 5, 6
			minor: [0, 3, 5, 7, 10] // 1, b3, 4, 5, b7
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

	// Active shapes state
	interface ActiveShape {
		name: string;
		startFret: number;
		colorIndex: number;
		path?: [number, number][]; // For pentatonic - array of [fretOffset, stringIndex]
		endFret?: number; // For rectangle-based shapes
	}
	let activeShapes: ActiveShape[] = $state([]);
	let showShapeBoxes = $state(true);

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

	function calculateShapes(key: string, scale: string): ActiveShape[] {
		const rootFret = getRootFret(key);
		const result: ActiveShape[] = [];

		if (scale === 'pentatonic') {
			// Use path-based shapes for pentatonic
			pentatonicShapes.forEach((shape, index) => {
				for (let octave = -1; octave <= 2; octave++) {
					const startFret = rootFret + shape.startOffset + octave * 12;
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
		} else {
			// Use rectangle-based shapes for diatonic and 3nps
			const shapes = scaleShapes[scale];
			shapes.forEach((shape, index) => {
				for (let octave = -1; octave <= 2; octave++) {
					const startFret = rootFret + shape.startOffset + octave * 12;
					const endFret = startFret + shape.span;

					if (endFret >= 0 && startFret <= fretCount) {
						result.push({
							name: shape.name,
							startFret: Math.max(0, startFret),
							endFret: Math.min(fretCount, endFret),
							colorIndex: index % shapeBorderColors.length
						});
					}
				}
			});
		}

		// Sort by start fret for consistent rendering
		result.sort((a, b) => a.startFret - b.startFret);

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
				y: 12
			};
		} else if (shape.endFret !== undefined) {
			// For rectangle shapes
			const pos = getShapePosition(shape.startFret, shape.endFret);
			return {
				x: pos.left + pos.width / 2,
				y: 12
			};
		}
		return { x: 0, y: 0 };
	}

	function applyScale() {
		const scaleNotes = getScaleNotes(selectedKey, isMajor, selectedScale);

		// Clear existing notes
		selectedFrets = {};

		// Calculate and store active shapes
		activeShapes = calculateShapes(selectedKey, selectedScale);

		// Apply scale to all frets
		for (let stringIndex = 0; stringIndex < strings.length; stringIndex++) {
			for (let fretIndex = 0; fretIndex <= fretCount; fretIndex++) {
				const noteIndex = (stringBaseNotes[stringIndex] + fretIndex) % 12;
				if (scaleNotes.has(noteIndex)) {
					selectedFrets[`${stringIndex}-${fretIndex}`] = selectedColor;
				}
			}
		}
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

	function clearAll() {
		selectedFrets = {};
		activeShapes = [];
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
								<span class="block text-sm font-medium text-muted-foreground"
									>Show intervals</span
								>
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
										<Select.Trigger class="w-20">
											{selectedKey}
										</Select.Trigger>
										<Select.Content>
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
									<span class="text-xs text-muted-foreground/70">Shape</span>
									<Select.Root type="single" bind:value={selectedScale}>
										<Select.Trigger class="w-32">
											{selectedScale === '3nps'
												? '3 Notes/String'
												: selectedScale.charAt(0).toUpperCase() + selectedScale.slice(1)}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="pentatonic">Pentatonic</Select.Item>
											<Select.Item value="diatonic">Diatonic</Select.Item>
											<Select.Item value="3nps">3 Notes/String</Select.Item>
										</Select.Content>
									</Select.Root>
								</div>

								<!-- Apply Button -->
								<Button onclick={applyScale} variant="secondary" class="h-9">Apply Scale</Button>
							</div>
							{#if activeShapes.length > 0}
								<div class="mt-3 flex items-center gap-2">
									<Switch bind:checked={showShapeBoxes} />
									<span class="text-sm text-muted-foreground">Show shape boxes</span>
								</div>
							{/if}
						</div>
					</div>
				</Collapsible.Content>
			</Collapsible.Root>

			<!-- Fretboard -->
			<div class="relative overflow-x-auto rounded-xl border border-border/50 bg-transparent p-6">
				<!-- Shape overlays using SVG -->
				{#if showShapeBoxes && activeShapes.length > 0}
					<!-- SVG overlay for shape paths -->
					<svg
						class="pointer-events-none absolute inset-0 z-10"
						style="top: 24px; left: 24px; width: calc(100% - 48px); height: 300px;"
					>
						{#each activeShapes as shape (shape.name + '-' + shape.startFret)}
							{#if isShapeVisible(shape)}
								{#if shape.path}
									<!-- Pentatonic diagonal shape -->
									<path
										d={generateShapePath(shape)}
										fill="none"
										stroke={shapeBorderColors[shape.colorIndex]}
										stroke-width="2"
										stroke-linejoin="round"
									/>
								{:else if shape.endFret !== undefined}
									<!-- Rectangle shape for diatonic/3nps -->
									{@const pos = getShapePosition(shape.startFret, shape.endFret)}
									<rect
										x={pos.left}
										y="44"
										width={pos.width}
										height="240"
										fill="none"
										stroke={shapeBorderColors[shape.colorIndex]}
										stroke-width="2"
										rx="4"
									/>
								{/if}
							{/if}
						{/each}
					</svg>

					<!-- Shape labels (only show if center is within visible fretboard) -->
					{#each activeShapes as shape (shape.name + '-' + shape.startFret + '-label')}
						{#if isShapeLabelVisible(shape)}
							{@const labelPos = getShapeLabelPosition(shape)}
							<div
								class="pointer-events-none absolute z-20"
								style="left: {labelPos.x + 24}px; top: {labelPos.y + 24}px; transform: translateX(-50%);"
							>
								<span
									class="whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold"
									style="background-color: {shapeColors[shape.colorIndex]}; color: {shapeBorderColors[
										shape.colorIndex
									]}; border: 1px solid {shapeBorderColors[shape.colorIndex]};"
								>
									Shape {shape.name}
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
										class="relative z-10 flex h-10 items-center justify-center {fretIndex === 0
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
												<div
													class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110"
													style="background-color: {noteColor}bf; box-shadow: 0 10px 15px -3px {noteColor}80;"
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

			<Button variant="secondary" class="self-center" onclick={clearAll}>Clear All</Button>
		</div>
	</main>
</div>
