<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Info from '@lucide/svelte/icons/info';
	import Plus from '@lucide/svelte/icons/plus';
	import Redo2 from '@lucide/svelte/icons/redo-2';
	import Settings from '@lucide/svelte/icons/settings';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Minus from '@lucide/svelte/icons/minus';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import Zap from '@lucide/svelte/icons/zap';

	import type { Preset } from '$lib/fretboard/types';
	import {
		PRESET_COLORS,
		TUNING_PRESET_NAMES,
		TUNING_PRESETS,
		SCALE_OPTIONS,
		REMOVE_SCALE_OPTIONS,
		THREE_NPS_OPTIONS
	} from '$lib/fretboard/constants';
	import { getDisplayNote, getNoteIndex, getChromaticScale } from '$lib/fretboard/music-utils';
	import { createScrollHandler, createNumericScrollHandler } from '$lib/fretboard/scroll-utils';
	import { exportPresetsToFile, importPresetsFromFile, savePresets } from '$lib/fretboard/storage';

	interface Props {
		settingsOpen: boolean;
		// History
		canUndo: () => boolean;
		canRedo: () => boolean;
		undo: () => void;
		redo: () => void;
		// Presets
		savedPresets: Record<string, Preset>;
		presetName: string;
		selectedPresetName: string;
		savePreset: () => void;
		loadPreset: () => void;
		deletePreset: () => void;
		// Display settings
		selectedColor: string;
		customColor: string;
		eraseSelectedColorOnly: boolean;
		showIntervals: boolean;
		useFlats: boolean;
		// Scale settings
		selectedKey: string;
		isMajor: boolean;
		selectedScale: string;
		scaleToRemove: string;
		applyScale: () => void;
		removeScaleNotes: () => void;
		// Shape settings
		showShapeBoxes: boolean;
		show3NPSShapeBoxes: boolean;
		selected3NPSShape: number;
		update3NPSShape: () => void;
		// Tuning settings
		selectedTuningPreset: string;
		strings: string[];
		applyTuningPreset: (preset: string) => void;
		pushHistory: (immediate?: boolean) => void;
		// Clear
		clearAll: () => void;
	}

	let {
		settingsOpen = $bindable(),
		canUndo,
		canRedo,
		undo,
		redo,
		savedPresets = $bindable(),
		presetName = $bindable(),
		selectedPresetName = $bindable(),
		savePreset,
		loadPreset,
		deletePreset,
		selectedColor = $bindable(),
		customColor = $bindable(),
		eraseSelectedColorOnly = $bindable(),
		showIntervals = $bindable(),
		useFlats = $bindable(),
		selectedKey = $bindable(),
		isMajor = $bindable(),
		selectedScale = $bindable(),
		scaleToRemove = $bindable(),
		applyScale,
		removeScaleNotes,
		showShapeBoxes = $bindable(),
		show3NPSShapeBoxes = $bindable(),
		selected3NPSShape = $bindable(),
		update3NPSShape,
		selectedTuningPreset = $bindable(),
		strings = $bindable(),
		applyTuningPreset,
		pushHistory,
		clearAll
	}: Props = $props();

	let fileInput: HTMLInputElement;

	const chromaticScale = $derived(getChromaticScale(useFlats));
	const tuningPresetKeys = Object.keys(TUNING_PRESETS);

	// Scroll handlers
	function scrollKey(e: WheelEvent) {
		e.preventDefault();
		const idx = getNoteIndex(selectedKey);
		const newIdx =
			e.deltaY > 0
				? (idx + 1) % chromaticScale.length
				: (idx - 1 + chromaticScale.length) % chromaticScale.length;
		selectedKey = chromaticScale[newIdx];
	}

	function scrollScale(e: WheelEvent) {
		e.preventDefault();
		const idx = SCALE_OPTIONS.indexOf(selectedScale);
		const newIdx =
			e.deltaY > 0
				? (idx + 1) % SCALE_OPTIONS.length
				: (idx - 1 + SCALE_OPTIONS.length) % SCALE_OPTIONS.length;
		selectedScale = SCALE_OPTIONS[newIdx];
	}

	function scrollRemoveScale(e: WheelEvent) {
		e.preventDefault();
		const idx = REMOVE_SCALE_OPTIONS.indexOf(scaleToRemove);
		const newIdx =
			e.deltaY > 0
				? (idx + 1) % REMOVE_SCALE_OPTIONS.length
				: (idx - 1 + REMOVE_SCALE_OPTIONS.length) % REMOVE_SCALE_OPTIONS.length;
		scaleToRemove = REMOVE_SCALE_OPTIONS[newIdx];
	}

	function scroll3NPSShape(e: WheelEvent) {
		e.preventDefault();
		const currentVal = selected3NPSShape?.toString() ?? '1';
		const idx = THREE_NPS_OPTIONS.indexOf(currentVal);
		const newIdx =
			e.deltaY > 0
				? (idx + 1) % THREE_NPS_OPTIONS.length
				: (idx - 1 + THREE_NPS_OPTIONS.length) % THREE_NPS_OPTIONS.length;
		selected3NPSShape = parseInt(THREE_NPS_OPTIONS[newIdx]);
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

	function scrollTuning(e: WheelEvent) {
		e.preventDefault();
		let idx = tuningPresetKeys.indexOf(selectedTuningPreset);
		if (idx === -1) idx = e.deltaY > 0 ? -1 : 0;
		const newIdx =
			e.deltaY > 0
				? (idx + 1) % tuningPresetKeys.length
				: (idx - 1 + tuningPresetKeys.length) % tuningPresetKeys.length;
		applyTuningPreset(tuningPresetKeys[newIdx]);
	}

	function scrollStringTuning(e: WheelEvent, stringIndex: number) {
		e.preventDefault();
		const currentNote = strings[stringIndex];
		const currentIdx = getNoteIndex(currentNote);
		const direction = e.deltaY > 0 ? -1 : 1;
		const newIdx = (currentIdx + direction + 12) % 12;
		strings[stringIndex] = chromaticScale[newIdx];
		strings = [...strings];
		selectedTuningPreset = 'custom';
		pushHistory(true);
	}

	function selectPresetColor(color: string) {
		selectedColor = color;
	}

	function handleCustomColorChange(event: Event) {
		const input = event.target as HTMLInputElement;
		customColor = input.value;
		selectedColor = input.value;
	}

	function exportPresets() {
		exportPresetsToFile(savedPresets);
	}

	function importPresets(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		importPresetsFromFile(
			file,
			(imported) => {
				savedPresets = { ...savedPresets, ...imported };
				savePresets(savedPresets);
				input.value = '';
			},
			(error) => {
				console.error('Failed to import presets:', error);
				alert('Failed to import presets. Please check the file format.');
				input.value = '';
			}
		);
	}
</script>

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
	<Collapsible.Content class="mt-2 rounded-lg border border-border/50 bg-card/50 p-3 sm:p-4">
		<div class="space-y-3 sm:space-y-4">
			<!-- Undo/Redo Section -->
			<div class="flex items-center justify-between border-b border-border/50 pb-3 sm:pb-4">
				<span class="text-sm font-medium text-muted-foreground">History</span>
				<div class="flex gap-1 sm:gap-2">
					<Button
						onclick={undo}
						variant="outline"
						size="sm"
						disabled={!canUndo()}
						class="h-8 px-2"
						title="Undo (Ctrl+Z)"
					>
						<Undo2 class="h-4 w-4 sm:mr-1" />
						<span class="hidden sm:inline">Undo</span>
					</Button>
					<Button
						onclick={redo}
						variant="outline"
						size="sm"
						disabled={!canRedo()}
						class="h-8 px-2"
						title="Redo (Ctrl+Y)"
					>
						<Redo2 class="h-4 w-4 sm:mr-1" />
						<span class="hidden sm:inline">Redo</span>
					</Button>
				</div>
			</div>

			<!-- Presets Section -->
			<div class="border-b border-border/50 pb-3 sm:pb-4">
				<span class="mb-2 block text-sm font-medium text-muted-foreground sm:mb-3">Presets</span>
				<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
					<!-- Save Preset -->
					<div class="flex flex-col gap-1">
						<span class="text-xs text-muted-foreground/70">Save As</span>
						<div class="flex gap-1">
							<input
								type="text"
								bind:value={presetName}
								placeholder="Preset name..."
								class="h-9 w-full rounded-md border border-border bg-background px-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring sm:w-36"
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
									<Select.Trigger class="h-9 w-full sm:w-36" onwheel={scrollPreset}>
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

			<!-- Display Settings -->
			<div
				class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2"
			>
				<!-- Note Color -->
				<div class="flex items-center gap-2">
					<span class="text-sm text-muted-foreground">Color</span>
					<div class="flex items-center gap-1">
						{#each PRESET_COLORS as color (color)}
							<button
								class="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 {selectedColor ===
								color
									? 'border-white ring-1 ring-white/30'
									: 'border-transparent'}"
								style="background-color: {color};"
								onclick={() => selectPresetColor(color)}
								aria-label="Select color {color}"
							></button>
						{/each}
						<div class="relative">
							<input
								type="color"
								value={customColor}
								onchange={handleCustomColorChange}
								class="absolute inset-0 h-6 w-6 cursor-pointer opacity-0"
								aria-label="Choose custom color"
							/>
							<div
								class="flex h-6 w-6 items-center justify-center rounded-full p-[2px] transition-transform hover:scale-110 {selectedColor ===
									customColor && !PRESET_COLORS.includes(selectedColor)
									? 'ring-1 ring-white/30'
									: ''}"
								style="background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);"
							>
								<div class="h-full w-full rounded-full" style="background-color: {customColor};"></div>
							</div>
						</div>
					</div>
				</div>

				<!-- Toggle Options -->
				<div class="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6">
					<label class="flex cursor-pointer items-center gap-2">
						<Switch bind:checked={eraseSelectedColorOnly} />
						<span class="text-sm text-muted-foreground">Erase color only</span>
					</label>

					<label class="flex cursor-pointer items-center gap-2">
						<Switch bind:checked={showIntervals} />
						<span class="text-sm text-muted-foreground">Intervals</span>
					</label>

					<label class="flex cursor-pointer items-center gap-2">
						<Switch bind:checked={useFlats} />
						<span class="text-sm text-muted-foreground">Flats</span>
					</label>
				</div>
			</div>

			<!-- Scale Selection -->
			<div class="border-t border-border/50 pt-3 sm:pt-4">
				<span class="mb-2 block text-sm font-medium text-muted-foreground sm:mb-3">Scale</span>
				<div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
					<!-- Key Selection -->
					<div class="flex flex-col gap-1">
						<span class="flex items-center gap-1 text-xs text-muted-foreground/70">
							Key
							<Zap class="h-3 w-3" />
						</span>
						<Select.Root type="single" bind:value={selectedKey}>
							<Select.Trigger class="w-full sm:w-20" onwheel={scrollKey}>
								{getDisplayNote(selectedKey, useFlats)}
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
						<div class="flex items-center rounded-md border border-border bg-background p-1">
							<button
								class="rounded px-2 py-1 text-sm transition-colors sm:px-3 {isMajor
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:text-foreground'}"
								onclick={() => (isMajor = true)}
							>
								Major
							</button>
							<button
								class="rounded px-2 py-1 text-sm transition-colors sm:px-3 {!isMajor
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
							<Select.Trigger class="w-full sm:w-36" onwheel={scrollScale}>
								{#if selectedScale === 'melodic-minor'}
									Melodic Minor
								{:else}
									{selectedScale.charAt(0).toUpperCase() + selectedScale.slice(1)}
								{/if}
							</Select.Trigger>
							<Select.Content class="max-h-64 overflow-y-auto">
								<Select.Item value="pentatonic">Pentatonic</Select.Item>
								<Select.Item value="blues">Blues</Select.Item>
								<Select.Item value="diatonic">Diatonic</Select.Item>
								<Select.Item value="ionian">Ionian</Select.Item>
								<Select.Item value="dorian">Dorian</Select.Item>
								<Select.Item value="phrygian">Phrygian</Select.Item>
								<Select.Item value="lydian">Lydian</Select.Item>
								<Select.Item value="mixolydian">Mixolydian</Select.Item>
								<Select.Item value="aeolian">Aeolian</Select.Item>
								<Select.Item value="locrian">Locrian</Select.Item>
								<Select.Item value="melodic-minor">Melodic Minor</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Apply Button -->
					<div class="flex flex-col gap-1">
						<span class="text-xs text-muted-foreground/70 opacity-0">Apply</span>
						<Button onclick={applyScale} variant="secondary" class="h-9 w-full px-3 sm:w-auto" title="Apply scale">
							<Plus class="h-4 w-4" />
						</Button>
					</div>

					<!-- Remove Scale Notes -->
					<div class="col-span-2 flex flex-col gap-1 sm:col-span-1">
						<span class="text-xs text-muted-foreground/70">Remove</span>
						<div class="flex gap-1">
							<Select.Root type="single" bind:value={scaleToRemove}>
								<Select.Trigger class="h-9 flex-1 sm:w-28 sm:flex-none" onwheel={scrollRemoveScale}>
									{#if scaleToRemove === '3nps'}
										3NPS
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
									<Select.Item value="melodic-minor">Melodic Minor</Select.Item>
								</Select.Content>
							</Select.Root>
							<Button onclick={removeScaleNotes} variant="secondary" class="h-9 px-2">
								<Minus class="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>

			<!-- Shape Overlays -->
			<div class="border-t border-border/50 pt-3 sm:pt-4">
				<span class="mb-2 flex items-center gap-1 text-sm font-medium text-muted-foreground sm:mb-3">
					Shape Overlays
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger class="cursor-help">
								<Info class="h-4 w-4 text-muted-foreground/70" />
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Shape overlays only work in Standard tuning</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</span>
				<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
					<!-- Pentatonic shapes toggle -->
					<label class="flex cursor-pointer items-center gap-2">
						<Switch bind:checked={showShapeBoxes} />
						<span class="text-sm text-muted-foreground">Pentatonic Shapes</span>
					</label>

					<!-- 3NPS shapes toggle -->
					<label class="flex cursor-pointer items-center gap-2">
						<Switch bind:checked={show3NPSShapeBoxes} />
						<span class="text-sm text-muted-foreground">3NPS Shapes</span>
					</label>

					<!-- 3NPS Shape Selector -->
					<Select.Root
						type="single"
						disabled={!show3NPSShapeBoxes}
						value={selected3NPSShape.toString()}
						onValueChange={(v) => {
							selected3NPSShape = parseInt(v);
							update3NPSShape();
						}}
					>
						<Select.Trigger
							class="w-full sm:w-28 {!show3NPSShapeBoxes ? 'opacity-50' : ''}"
							onwheel={show3NPSShapeBoxes ? scroll3NPSShape : undefined}
						>
							Shape {selected3NPSShape}
						</Select.Trigger>
						<Select.Content class="max-h-64 overflow-y-auto">
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
			</div>

			<!-- Tuning Configuration -->
			<div class="border-t border-border/50 pt-3 sm:pt-4">
				<span class="mb-2 block text-sm font-medium text-muted-foreground sm:mb-3">Tuning</span>
				<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
					<!-- Tuning Preset Selection -->
					<div class="flex flex-col gap-1">
						<span class="text-xs text-muted-foreground/70">Preset</span>
						<Select.Root
							type="single"
							value={selectedTuningPreset}
							onValueChange={(v) => applyTuningPreset(v)}
						>
							<Select.Trigger class="w-full sm:w-44" onwheel={scrollTuning}>
								{TUNING_PRESET_NAMES[selectedTuningPreset] || 'Custom'}
							</Select.Trigger>
							<Select.Content class="max-h-64 overflow-y-auto">
								{#each Object.entries(TUNING_PRESET_NAMES) as [key, name] (key)}
									<Select.Item value={key}>{name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Individual String Tuning -->
					<div class="flex flex-col gap-1">
						<span class="text-xs text-muted-foreground/70">Individual Strings (low → high)</span>
						<div class="grid grid-cols-6 gap-1">
							{#each [5, 4, 3, 2, 1, 0] as stringIndex (stringIndex)}
								<Select.Root
									type="single"
									value={strings[stringIndex]}
									onValueChange={(v) => {
										strings[stringIndex] = v;
										strings = [...strings];
										selectedTuningPreset = 'custom';
										pushHistory(true);
									}}
								>
									<Select.Trigger
										class="h-9 w-full justify-center px-1 sm:w-14 [&>svg]:hidden"
										onwheel={(e) => scrollStringTuning(e, stringIndex)}
									>
										<span class="w-full text-center">{getDisplayNote(strings[stringIndex], useFlats)}</span>
									</Select.Trigger>
									<Select.Content class="max-h-64 overflow-y-auto">
										{#each chromaticScale as note (note)}
											<Select.Item value={note}>{note}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Clear All Button -->
			<div class="border-t border-border/50 pt-3 sm:pt-4">
				<Button variant="secondary" onclick={clearAll} class="w-full">Clear All Notes</Button>
			</div>
		</div>
	</Collapsible.Content>
</Collapsible.Root>
