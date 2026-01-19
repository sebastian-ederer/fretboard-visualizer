<script lang="ts">
	import { scaleComparerStore, SCALE_OPTIONS } from '$lib/scale-comparer';
	import { fretboardStore } from '$lib/fretboard';
	import { MetronomeSettings } from '$lib/components/metronome';
	import { ShapeOverlaysSection } from '$lib/components/fretboard/settings';
	import { DisplayToggles } from '$lib/components/shared';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Select from '$lib/components/ui/select';
	import ScaleSelector from './ScaleSelector.svelte';
	import { createScrollHandler } from '$lib/utils/scroll-handler';
	import { CHROMATIC_SCALE_SHARP } from '$lib/fretboard/constants';
	import Music from '@lucide/svelte/icons/music';
	import Timer from '@lucide/svelte/icons/timer';

	const fs = $derived(fretboardStore.state);
	const sc = $derived(scaleComparerStore.state);

	const handleKeyScroll = createScrollHandler(
		() => [...CHROMATIC_SCALE_SHARP],
		() => fs.selectedKey,
		(v) => (fretboardStore.state.selectedKey = v)
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
								<div
									class="flex items-center rounded-md border border-border bg-background p-1"
									role="group"
								>
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
						<ScaleSelector
							scale={sc.primaryScale}
							color={sc.primaryColor}
							onScaleChange={(v) => scaleComparerStore.setPrimaryScale(v)}
							onColorChange={(v) => scaleComparerStore.setPrimaryColor(v)}
						/>
					</div>

					<!-- Secondary Scale (Comparison) -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Compare With</h3>
						<ScaleSelector
							scale={sc.secondaryScale || ''}
							color={sc.secondaryColor}
							onScaleChange={(v) => scaleComparerStore.setSecondaryScale(v)}
							onColorChange={(v) => scaleComparerStore.setSecondaryColor(v)}
							placeholder="None (optional)"
							allowClear={true}
							onClear={() => scaleComparerStore.clearSecondaryScale()}
						/>

						{#if sc.secondaryScale}
							<p class="text-xs text-muted-foreground">
								Notes in both scales have a <span style="color: {sc.secondaryColor}"
									>colored border</span
								>.
							</p>
						{/if}
					</div>

					<!-- Display Options -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Display Options</h3>
						<DisplayToggles store={fretboardStore} />
					</div>

					<!-- Shape Overlays -->
					<div class="space-y-3">
						<ShapeOverlaysSection
							store={fretboardStore}
							showBorder={false}
							headingClass="text-sm font-semibold text-foreground"
						/>
					</div>

					<!-- Legend -->
					<div class="space-y-3 rounded-lg border border-border/50 bg-card/30 p-3">
						<h4 class="text-xs font-medium text-muted-foreground">Legend</h4>
						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-2">
								<div
									class="h-5 w-5 rounded-full border-2 border-white"
									style="background-color: {sc.primaryColor}"
								></div>
								<span class="text-xs"
									>{SCALE_OPTIONS.find((s) => s.value === sc.primaryScale)?.label || 'Primary'} only</span
								>
							</div>
							{#if sc.secondaryScale}
								<div class="flex items-center gap-2">
									<div
										class="h-5 w-5 rounded-full border-2 border-white"
										style="background-color: {sc.secondaryColor}"
									></div>
									<span class="text-xs"
										>{SCALE_OPTIONS.find((s) => s.value === sc.secondaryScale)?.label} only</span
									>
								</div>
								<div class="flex items-center gap-2">
									<div
										class="h-5 w-5 rounded-full border-2"
										style="background-color: {sc.primaryColor}; border-color: {sc.secondaryColor}"
									></div>
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
