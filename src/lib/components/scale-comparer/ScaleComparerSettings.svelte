<script lang="ts">
	import { scaleComparerStore, SCALE_OPTIONS } from '$lib/scale-comparer';
	import { fretboardStore } from '$lib/fretboard';
	import { MetronomeSettings } from '$lib/components/metronome';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Select from '$lib/components/ui/select';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { CHROMATIC_SCALE_SHARP, THREE_NPS_OPTIONS } from '$lib/fretboard/constants';
	import Music from '@lucide/svelte/icons/music';
	import Timer from '@lucide/svelte/icons/timer';
	import X from '@lucide/svelte/icons/x';
	import Info from '@lucide/svelte/icons/info';

	const fs = $derived(fretboardStore.state);
	const sc = $derived(scaleComparerStore.state);

	// Color options for scale colors
	const COLOR_OPTIONS = [
		{ value: '#0891b2', label: 'Cyan' },
		{ value: '#7c3aed', label: 'Violet' },
		{ value: '#0d9488', label: 'Teal' },
		{ value: '#65a30d', label: 'Lime' },
		{ value: '#ca8a04', label: 'Gold' },
		{ value: '#db2777', label: 'Pink' },
		{ value: '#be123c', label: 'Rose' },
		{ value: '#059669', label: 'Emerald' },
		{ value: '#0284c7', label: 'Sky' },
		{ value: '#7c2d12', label: 'Brown' }
	];

	// Scroll handler factory
	function createScrollHandler<T>(
		getOptions: () => T[],
		getValue: () => T,
		setValue: (v: T) => void
	) {
		return (e: WheelEvent) => {
			e.preventDefault();
			const options = getOptions();
			if (options.length === 0) return;
			const idx = options.indexOf(getValue());
			const newIdx = e.deltaY > 0 ? (idx + 1) % options.length : (idx - 1 + options.length) % options.length;
			setValue(options[newIdx]);
		};
	}

	// Scroll handlers for dropdowns
	const handleKeyScroll = createScrollHandler(
		() => [...CHROMATIC_SCALE_SHARP],
		() => fs.selectedKey,
		(v) => fretboardStore.state.selectedKey = v
	);

	const handlePrimaryScaleScroll = createScrollHandler(
		() => SCALE_OPTIONS.map(s => s.value),
		() => sc.primaryScale,
		(v) => scaleComparerStore.setPrimaryScale(v)
	);

	const handlePrimaryColorScroll = createScrollHandler(
		() => COLOR_OPTIONS.map(c => c.value),
		() => sc.primaryColor,
		(v) => scaleComparerStore.setPrimaryColor(v)
	);

	const handleSecondaryScaleScroll = createScrollHandler(
		() => SCALE_OPTIONS.map(s => s.value),
		() => sc.secondaryScale || SCALE_OPTIONS[0].value,
		(v) => scaleComparerStore.setSecondaryScale(v)
	);

	const handleSecondaryColorScroll = createScrollHandler(
		() => COLOR_OPTIONS.map(c => c.value),
		() => sc.secondaryColor,
		(v) => scaleComparerStore.setSecondaryColor(v)
	);

	const handle3NPSShapeScroll = createScrollHandler(
		() => THREE_NPS_OPTIONS,
		() => fs.selected3NPSShape?.toString() ?? '1',
		(v) => {
			fretboardStore.state.selected3NPSShape = parseInt(v);
			fretboardStore.recalculateShapes();
		}
	);

	function handleKeyChange(value: string | undefined) {
		if (value) {
			fretboardStore.state.selectedKey = value;
		}
	}
</script>

<div class="flex h-full flex-col">
	<Tabs.Root value="scales" class="flex h-full flex-col">
		<Tabs.List class="mx-3 mt-3 grid w-auto grid-cols-2">
			<Tabs.Trigger value="scales" class="gap-1.5">
				<Music class="h-4 w-4" />
				<span class="hidden sm:inline">Scales</span>
			</Tabs.Trigger>
			<Tabs.Trigger value="metronome" class="gap-1.5">
				<Timer class="h-4 w-4" />
				<span class="hidden sm:inline">Metronome</span>
			</Tabs.Trigger>
		</Tabs.List>

		<div class="flex-1 overflow-y-auto">
			<Tabs.Content value="scales" class="mt-0 p-3">
				<div class="space-y-6">
					<!-- Key & Mode Selection -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Key & Mode</h3>

						<div class="grid grid-cols-2 gap-2">
							<div class="space-y-1.5">
								<label class="text-xs text-muted-foreground">Key</label>
								<Select.Root type="single" value={fs.selectedKey} onValueChange={handleKeyChange}>
									<Select.Trigger class="h-9 w-full" onwheel={handleKeyScroll}>
										{fs.selectedKey}
									</Select.Trigger>
									<Select.Content>
										{#each CHROMATIC_SCALE_SHARP as note (note)}
											<Select.Item value={note}>{note}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>

							<div class="space-y-1.5">
								<span class="text-xs text-muted-foreground">Mode</span>
								<div class="flex items-center rounded-md border border-border bg-background p-1" role="group">
									<button
										class="flex-1 rounded px-2 py-1.5 text-sm transition-colors {fs.isMajor
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground hover:text-foreground'}"
										onclick={() => (fretboardStore.state.isMajor = true)}
										aria-pressed={fs.isMajor}
									>
										Major
									</button>
									<button
										class="flex-1 rounded px-2 py-1.5 text-sm transition-colors {!fs.isMajor
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground hover:text-foreground'}"
										onclick={() => (fretboardStore.state.isMajor = false)}
										aria-pressed={!fs.isMajor}
									>
										Minor
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Primary Scale -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Primary Scale</h3>

						<div class="space-y-2">
							<div class="flex gap-2">
								<Select.Root type="single" value={sc.primaryScale} onValueChange={(v) => v && scaleComparerStore.setPrimaryScale(v)}>
									<Select.Trigger class="h-9 flex-1" onwheel={handlePrimaryScaleScroll}>
										{SCALE_OPTIONS.find(s => s.value === sc.primaryScale)?.label || 'Select scale'}
									</Select.Trigger>
									<Select.Content>
										{#each SCALE_OPTIONS as scale (scale.value)}
											<Select.Item value={scale.value}>{scale.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>

								<Select.Root type="single" value={sc.primaryColor} onValueChange={(v) => v && scaleComparerStore.setPrimaryColor(v)}>
									<Select.Trigger class="h-9 w-20" onwheel={handlePrimaryColorScroll}>
										<div class="flex items-center gap-2">
											<div class="h-4 w-4 rounded-full border border-border" style="background-color: {sc.primaryColor}"></div>
										</div>
									</Select.Trigger>
									<Select.Content>
										{#each COLOR_OPTIONS as color (color.value)}
											<Select.Item value={color.value}>
												<div class="flex items-center gap-2">
													<div class="h-4 w-4 rounded-full border border-border" style="background-color: {color.value}"></div>
													<span>{color.label}</span>
												</div>
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						</div>
					</div>

					<!-- Secondary Scale (Comparison) -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Compare With</h3>

						<div class="space-y-2">
							<div class="flex gap-2">
								<Select.Root type="single" value={sc.secondaryScale || undefined} onValueChange={(v) => scaleComparerStore.setSecondaryScale(v || '')}>
									<Select.Trigger class="h-9 flex-1" onwheel={handleSecondaryScaleScroll}>
										{#if sc.secondaryScale}
											{SCALE_OPTIONS.find(s => s.value === sc.secondaryScale)?.label}
										{:else}
											<span class="text-muted-foreground">None (optional)</span>
										{/if}
									</Select.Trigger>
									<Select.Content>
										{#each SCALE_OPTIONS as scale (scale.value)}
											<Select.Item value={scale.value}>{scale.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>

								<Select.Root type="single" value={sc.secondaryColor} onValueChange={(v) => v && scaleComparerStore.setSecondaryColor(v)}>
									<Select.Trigger class="h-9 w-20" onwheel={handleSecondaryColorScroll}>
										<div class="flex items-center gap-2">
											<div class="h-4 w-4 rounded-full border border-border" style="background-color: {sc.secondaryColor}"></div>
										</div>
									</Select.Trigger>
									<Select.Content>
										{#each COLOR_OPTIONS as color (color.value)}
											<Select.Item value={color.value}>
												<div class="flex items-center gap-2">
													<div class="h-4 w-4 rounded-full border border-border" style="background-color: {color.value}"></div>
													<span>{color.label}</span>
												</div>
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>

								{#if sc.secondaryScale}
									<Button
										variant="ghost"
										size="sm"
										class="h-9 w-9 p-0"
										onclick={() => scaleComparerStore.clearSecondaryScale()}
										title="Clear secondary scale"
									>
										<X class="h-4 w-4" />
									</Button>
								{/if}
							</div>
						</div>

						{#if sc.secondaryScale}
							<p class="text-xs text-muted-foreground">
								Notes in both scales have a <span style="color: {sc.secondaryColor}">colored border</span>.
							</p>
						{/if}
					</div>

					<!-- Display Options -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Display Options</h3>
						<div class="space-y-3">
							<label class="flex cursor-pointer items-center gap-2">
								<Switch bind:checked={fs.showIntervals} />
								<span class="text-sm text-muted-foreground">Show intervals</span>
							</label>

							<label class="flex cursor-pointer items-center gap-2">
								<Switch bind:checked={fs.useFlats} />
								<span class="text-sm text-muted-foreground">Use flats</span>
							</label>
						</div>
					</div>

					<!-- Shape Overlays -->
					<div class="space-y-3">
						<h3 class="flex items-center gap-1 text-sm font-semibold text-foreground">
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
						</h3>
						<div class="space-y-3">
							<!-- Pentatonic shapes toggle -->
							<label class="flex cursor-pointer items-center gap-2">
								<Switch bind:checked={fs.showShapeBoxes} onCheckedChange={() => fretboardStore.recalculateShapes()} />
								<span class="text-sm text-muted-foreground">Pentatonic Shapes</span>
							</label>

							<!-- 3NPS shapes toggle -->
							<label class="flex cursor-pointer items-center gap-2">
								<Switch bind:checked={fs.show3NPSShapeBoxes} onCheckedChange={() => fretboardStore.recalculateShapes()} />
								<span class="text-sm text-muted-foreground">3NPS Shapes</span>
							</label>

							<!-- 3NPS Shape Selector -->
							{#if fs.show3NPSShapeBoxes}
								<Select.Root
									type="single"
									value={fs.selected3NPSShape.toString()}
									onValueChange={(v) => {
										fretboardStore.state.selected3NPSShape = parseInt(v);
										fretboardStore.recalculateShapes();
									}}
								>
									<Select.Trigger class="w-full" onwheel={handle3NPSShapeScroll}>
										Shape {fs.selected3NPSShape}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="1">Shape 1</Select.Item>
										<Select.Item value="2">Shape 2</Select.Item>
										<Select.Item value="3">Shape 3</Select.Item>
										<Select.Item value="4">Shape 4</Select.Item>
										<Select.Item value="5">Shape 5</Select.Item>
										<Select.Item value="6">Shape 6</Select.Item>
										<Select.Item value="7">Shape 7</Select.Item>
									</Select.Content>
								</Select.Root>
							{/if}
						</div>
					</div>

					<!-- Legend -->
					<div class="space-y-3 rounded-lg border border-border/50 bg-card/30 p-3">
						<h4 class="text-xs font-medium text-muted-foreground">Legend</h4>
						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-2">
								<div class="h-5 w-5 rounded-full border-2 border-white" style="background-color: {sc.primaryColor}"></div>
								<span class="text-xs">{SCALE_OPTIONS.find(s => s.value === sc.primaryScale)?.label || 'Primary'} only</span>
							</div>
							{#if sc.secondaryScale}
								<div class="flex items-center gap-2">
									<div class="h-5 w-5 rounded-full border-2 border-white" style="background-color: {sc.secondaryColor}"></div>
									<span class="text-xs">{SCALE_OPTIONS.find(s => s.value === sc.secondaryScale)?.label} only</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="h-5 w-5 rounded-full border-2" style="background-color: {sc.primaryColor}; border-color: {sc.secondaryColor}"></div>
									<span class="text-xs">In both scales</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</Tabs.Content>

			<Tabs.Content value="metronome" class="mt-0 p-3">
				<MetronomeSettings />
			</Tabs.Content>
		</div>
	</Tabs.Root>
</div>
