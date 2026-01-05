<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Info from '@lucide/svelte/icons/info';
	import Plus from '@lucide/svelte/icons/plus';
	import Settings from '@lucide/svelte/icons/settings';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Minus from '@lucide/svelte/icons/minus';
	import Zap from '@lucide/svelte/icons/zap';

	import {
		PRESET_COLORS,
		TUNING_PRESET_NAMES,
		TUNING_PRESETS,
		SCALE_OPTIONS,
		REMOVE_SCALE_OPTIONS,
		THREE_NPS_OPTIONS
	} from '$lib/fretboard/constants';
	import { getDisplayNote, getNoteIndex, getChromaticScale } from '$lib/fretboard/music-utils';
	import { exportPresetsToFile, importPresetsFromFile, savePresets } from '$lib/fretboard/storage';
	import type { fretboardStore as FretboardStoreType } from '$lib/fretboard/store.svelte';

	interface Props {
		store: typeof FretboardStoreType;
	}

	let { store }: Props = $props();

	// Shorthand access to state
	const s = $derived(store.state);

	let fileInput: HTMLInputElement;

	const chromaticScale = $derived(getChromaticScale(s.useFlats));
	const tuningPresetKeys = Object.keys(TUNING_PRESETS);

	// Generic keyboard handler for cycling through options
	function handleArrowKeys<T>(
		e: KeyboardEvent,
		options: T[],
		getCurrentValue: () => T,
		setValue: (value: T) => void,
		onAfterChange?: () => void
	) {
		if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
		e.preventDefault();
		const currentValue = getCurrentValue();
		const idx = options.indexOf(currentValue);
		const newIdx =
			e.key === 'ArrowDown'
				? (idx + 1) % options.length
				: (idx - 1 + options.length) % options.length;
		setValue(options[newIdx]);
		onAfterChange?.();
	}

	// Generic scroll handler factory
	function createScrollHandler<T>(
		getOptions: () => T[],
		getValue: () => T,
		setValue: (v: T) => void,
		onAfter?: () => void
	) {
		return (e: WheelEvent) => {
			e.preventDefault();
			const options = getOptions();
			if (options.length === 0) return;
			const idx = options.indexOf(getValue());
			const newIdx = e.deltaY > 0
				? (idx + 1) % options.length
				: (idx - 1 + options.length) % options.length;
			setValue(options[newIdx]);
			onAfter?.();
		};
	}

	// Scroll handlers using the factory
	const scrollKey = createScrollHandler(
		() => chromaticScale,
		() => s.selectedKey,
		(v) => (s.selectedKey = v)
	);

	const scrollScale = createScrollHandler(
		() => SCALE_OPTIONS,
		() => s.selectedScale,
		(v) => (s.selectedScale = v)
	);

	const scrollRemoveScale = createScrollHandler(
		() => REMOVE_SCALE_OPTIONS,
		() => s.scaleToRemove,
		(v) => (s.scaleToRemove = v)
	);

	const scroll3NPSShape = createScrollHandler(
		() => THREE_NPS_OPTIONS,
		() => s.selected3NPSShape?.toString() ?? '1',
		(v) => (s.selected3NPSShape = parseInt(v)),
		() => store.recalculateShapes()
	);

	const scrollPreset = createScrollHandler(
		() => Object.keys(s.savedPresets),
		() => s.selectedPresetName,
		(v) => (s.selectedPresetName = v)
	);

	const scrollTuning = createScrollHandler(
		() => tuningPresetKeys,
		() => s.selectedTuningPreset,
		(v) => store.applyTuningPreset(v)
	);

	function scrollStringTuning(e: WheelEvent, stringIndex: number) {
		e.preventDefault();
		const currentNote = s.strings[stringIndex];
		const currentIdx = getNoteIndex(currentNote);
		const direction = e.deltaY > 0 ? -1 : 1;
		const newIdx = (currentIdx + direction + 12) % 12;
		s.strings[stringIndex] = chromaticScale[newIdx];
		s.strings = [...s.strings];
		s.selectedTuningPreset = 'custom';
		store.pushHistory(true);
	}

	function selectPresetColor(color: string) {
		s.selectedColor = color;
	}

	function handleCustomColorChange(event: Event) {
		const input = event.target as HTMLInputElement;
		s.customColor = input.value;
		s.selectedColor = input.value;
	}

	function exportPresets() {
		exportPresetsToFile(s.savedPresets);
	}

	function importPresets(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		importPresetsFromFile(
			file,
			(imported) => {
				s.savedPresets = { ...s.savedPresets, ...imported };
				savePresets(s.savedPresets);
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

<Collapsible.Root bind:open={s.settingsOpen} class="w-full">
	<Collapsible.Trigger
		class="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card/50 px-4 py-3 transition-colors hover:bg-card"
	>
		<div class="flex items-center gap-2">
			<Settings class="h-4 w-4 text-muted-foreground" />
			<span class="text-sm font-medium">Settings</span>
		</div>
		<ChevronDown
			class="h-4 w-4 text-muted-foreground transition-transform duration-200 {s.settingsOpen
				? 'rotate-180'
				: ''}"
		/>
	</Collapsible.Trigger>
	<Collapsible.Content class="mt-2 rounded-lg border border-border/50 bg-card/50 p-3 sm:p-4">
		<div class="space-y-3 sm:space-y-4">
			<!-- Presets Section -->
			<div class="border-b border-border/50 pb-3 sm:pb-4">
				<span class="mb-2 block text-sm font-medium text-muted-foreground sm:mb-3">Presets</span>
				<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
					<!-- Save Preset -->
					<div class="flex flex-col gap-1">
						<label for="preset-name-input" class="text-xs text-muted-foreground/70">Save As</label>
						<div class="flex gap-1">
							<input
								id="preset-name-input"
								type="text"
								bind:value={s.presetName}
								placeholder="Preset name..."
								class="h-9 w-full rounded-md border border-border bg-background px-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring sm:w-36"
								onkeydown={(e) => e.key === 'Enter' && store.savePreset()}
							/>
							<Button
								onclick={store.savePreset}
								variant="secondary"
								class="h-9 px-2"
								disabled={!s.presetName.trim()}
								aria-label="Save preset"
							>
								Save
							</Button>
						</div>
					</div>

					<!-- Load/Delete Preset -->
					{#if Object.keys(s.savedPresets).length > 0}
						<div class="flex flex-col gap-1">
							<span id="preset-load-label" class="text-xs text-muted-foreground/70">Load Preset</span>
							<div class="flex gap-1">
								<Select.Root type="single" bind:value={s.selectedPresetName}>
									<Select.Trigger
										class="h-9 w-full sm:w-36"
										onwheel={scrollPreset}
										onkeydown={(e) => {
											const presetNames = Object.keys(s.savedPresets);
											if (presetNames.length === 0) return;
											handleArrowKeys(e, presetNames, () => s.selectedPresetName, (v) => (s.selectedPresetName = v));
										}}
										aria-labelledby="preset-load-label"
									>
										{s.selectedPresetName || 'Select...'}
									</Select.Trigger>
									<Select.Content class="max-h-64 overflow-y-auto">
										{#each Object.keys(s.savedPresets) as name (name)}
											<Select.Item value={name}>{name}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
								<Button
									onclick={store.loadPreset}
									variant="secondary"
									class="h-9 px-2"
									disabled={!s.selectedPresetName}
									aria-label="Load preset"
								>
									Load
								</Button>
								<Button
									onclick={store.deletePreset}
									variant="ghost"
									class="h-9 px-2 text-muted-foreground hover:text-destructive"
									disabled={!s.selectedPresetName}
									aria-label="Delete preset"
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
								disabled={Object.keys(s.savedPresets).length === 0}
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
								class="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 {s.selectedColor ===
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
								value={s.customColor}
								onchange={handleCustomColorChange}
								class="absolute inset-0 h-6 w-6 cursor-pointer opacity-0"
								aria-label="Choose custom color"
							/>
							<div
								class="flex h-6 w-6 items-center justify-center rounded-full p-[2px] transition-transform hover:scale-110 {s.selectedColor ===
									s.customColor && !PRESET_COLORS.includes(s.selectedColor)
									? 'ring-1 ring-white/30'
									: ''}"
								style="background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);"
							>
								<div class="h-full w-full rounded-full" style="background-color: {s.customColor};"></div>
							</div>
						</div>
					</div>
				</div>

				<!-- Toggle Options -->
				<div class="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6">
					<label class="flex cursor-pointer items-center gap-2">
						<Switch bind:checked={s.eraseSelectedColorOnly} />
						<span class="text-sm text-muted-foreground">Erase color only</span>
					</label>

					<label class="flex cursor-pointer items-center gap-2">
						<Switch bind:checked={s.showIntervals} />
						<span class="text-sm text-muted-foreground">Intervals</span>
					</label>

					<label class="flex cursor-pointer items-center gap-2">
						<Switch bind:checked={s.useFlats} />
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
						<span id="key-select-label" class="flex items-center gap-1 text-xs text-muted-foreground/70">
							Key
							<Zap class="h-3 w-3" />
						</span>
						<Select.Root type="single" bind:value={s.selectedKey}>
							<Select.Trigger
								class="w-full sm:w-20"
								onwheel={scrollKey}
								onkeydown={(e) => handleArrowKeys(e, chromaticScale, () => s.selectedKey, (v) => (s.selectedKey = v))}
								aria-labelledby="key-select-label"
							>
								{getDisplayNote(s.selectedKey, s.useFlats)}
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
						<span id="mode-toggle-label" class="text-xs text-muted-foreground/70">Mode</span>
						<div class="flex items-center rounded-md border border-border bg-background p-1" role="group" aria-labelledby="mode-toggle-label">
							<button
								class="rounded px-2 py-1 text-sm transition-colors sm:px-3 {s.isMajor
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:text-foreground'}"
								onclick={() => (s.isMajor = true)}
								aria-pressed={s.isMajor}
							>
								Major
							</button>
							<button
								class="rounded px-2 py-1 text-sm transition-colors sm:px-3 {!s.isMajor
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:text-foreground'}"
								onclick={() => (s.isMajor = false)}
								aria-pressed={!s.isMajor}
							>
								Minor
							</button>
						</div>
					</div>

					<!-- Scale Type Selection -->
					<div class="flex flex-col gap-1">
						<span id="scale-select-label" class="text-xs text-muted-foreground/70">Add</span>
						<div class="flex gap-1">
							<Select.Root type="single" bind:value={s.selectedScale}>
								<Select.Trigger
									class="h-9 w-full sm:w-28"
									onwheel={scrollScale}
									onkeydown={(e) => handleArrowKeys(e, SCALE_OPTIONS, () => s.selectedScale, (v) => (s.selectedScale = v))}
									aria-labelledby="scale-select-label"
								>
									{#if s.selectedScale === 'melodic-minor'}
										Mel. Minor
									{:else}
										{s.selectedScale.charAt(0).toUpperCase() + s.selectedScale.slice(1)}
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
							<Button onclick={store.applyScale} variant="secondary" class="h-9 px-2" aria-label="Add scale notes">
								<Plus class="h-4 w-4" />
							</Button>
						</div>
					</div>

					<!-- Remove Scale Notes -->
					<div class="col-span-2 flex flex-col gap-1 sm:col-span-1">
						<span id="remove-scale-label" class="text-xs text-muted-foreground/70">Remove</span>
						<div class="flex gap-1">
							<Select.Root type="single" bind:value={s.scaleToRemove}>
								<Select.Trigger
									class="h-9 flex-1 sm:w-28 sm:flex-none"
									onwheel={scrollRemoveScale}
									onkeydown={(e) => handleArrowKeys(e, REMOVE_SCALE_OPTIONS, () => s.scaleToRemove, (v) => (s.scaleToRemove = v))}
									aria-labelledby="remove-scale-label"
								>
									{#if s.scaleToRemove === '3nps'}
										3NPS
									{:else if s.scaleToRemove === 'melodic-minor'}
										Mel. Minor
									{:else}
										{s.scaleToRemove.charAt(0).toUpperCase() + s.scaleToRemove.slice(1)}
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
							<Button onclick={store.removeScaleNotes} variant="secondary" class="h-9 px-2" aria-label="Remove scale notes">
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
						<Switch bind:checked={s.showShapeBoxes} />
						<span class="text-sm text-muted-foreground">Pentatonic Shapes</span>
					</label>

					<!-- 3NPS shapes toggle -->
					<label class="flex cursor-pointer items-center gap-2">
						<Switch bind:checked={s.show3NPSShapeBoxes} />
						<span class="text-sm text-muted-foreground">3NPS Shapes</span>
					</label>

					<!-- 3NPS Shape Selector -->
					<Select.Root
						type="single"
						disabled={!s.show3NPSShapeBoxes}
						value={s.selected3NPSShape.toString()}
						onValueChange={(v) => {
							s.selected3NPSShape = parseInt(v);
							store.recalculateShapes();
						}}
					>
						<Select.Trigger
							class="w-full sm:w-28 {!s.show3NPSShapeBoxes ? 'opacity-50' : ''}"
							onwheel={s.show3NPSShapeBoxes ? scroll3NPSShape : undefined}
							onkeydown={s.show3NPSShapeBoxes
								? (e) => handleArrowKeys(
									e,
									THREE_NPS_OPTIONS,
									() => s.selected3NPSShape.toString(),
									(v) => { s.selected3NPSShape = parseInt(v); store.recalculateShapes(); }
								)
								: undefined}
							aria-label="3NPS shape number"
						>
							Shape {s.selected3NPSShape}
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
						<span id="tuning-preset-label" class="text-xs text-muted-foreground/70">Preset</span>
						<Select.Root
							type="single"
							value={s.selectedTuningPreset}
							onValueChange={(v) => store.applyTuningPreset(v)}
						>
							<Select.Trigger
								class="w-full sm:w-44"
								onwheel={scrollTuning}
								onkeydown={(e) => handleArrowKeys(e, tuningPresetKeys, () => s.selectedTuningPreset, (v) => store.applyTuningPreset(v))}
								aria-labelledby="tuning-preset-label"
							>
								{TUNING_PRESET_NAMES[s.selectedTuningPreset] || 'Custom'}
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
						<span id="string-tuning-label" class="text-xs text-muted-foreground/70">Individual Strings (low → high)</span>
						<div class="grid grid-cols-6 gap-1" role="group" aria-labelledby="string-tuning-label">
							{#each [5, 4, 3, 2, 1, 0] as stringIndex (stringIndex)}
								<Select.Root
									type="single"
									value={s.strings[stringIndex]}
									onValueChange={(v) => {
										s.strings[stringIndex] = v;
										s.strings = [...s.strings];
										s.selectedTuningPreset = 'custom';
										store.pushHistory(true);
									}}
								>
									<Select.Trigger
										class="h-9 w-full justify-center px-1 sm:w-14 [&>svg]:hidden"
										onwheel={(e) => scrollStringTuning(e, stringIndex)}
										onkeydown={(e) => handleArrowKeys(
											e,
											chromaticScale,
											() => s.strings[stringIndex],
											(v) => {
												s.strings[stringIndex] = v;
												s.strings = [...s.strings];
												s.selectedTuningPreset = 'custom';
												store.pushHistory(true);
											}
										)}
									>
										<span class="w-full text-center">{getDisplayNote(s.strings[stringIndex], s.useFlats)}</span>
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
				<Button variant="secondary" onclick={store.clearAll} class="w-full">Clear All Notes</Button>
			</div>
		</div>
	</Collapsible.Content>
</Collapsible.Root>
