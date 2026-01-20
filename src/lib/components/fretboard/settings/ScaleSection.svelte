<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Info from '@lucide/svelte/icons/info';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import Zap from '@lucide/svelte/icons/zap';
	import { SCALE_VALUES, REMOVE_SCALE_VALUES } from '$lib/fretboard/constants';
	import { getDisplayNote, getChromaticScale } from '$lib/fretboard/music-utils';
	import { createScrollHandler, handleArrowKeys } from '$lib/utils/scroll-handler';
	import { capitalize } from '$lib/utils';
	import type { fretboardStore as FretboardStoreType } from '$lib/fretboard/store.svelte';

	interface Props {
		store: typeof FretboardStoreType;
	}

	let { store }: Props = $props();
	const s = $derived(store.state);

	const chromaticScale = $derived(getChromaticScale(s.useFlats));

	const scrollKey = createScrollHandler(
		() => chromaticScale,
		() => s.selectedKey,
		(v) => (s.selectedKey = v)
	);

	const scrollScale = createScrollHandler(
		() => SCALE_VALUES,
		() => s.selectedScale,
		(v) => (s.selectedScale = v)
	);

	const scrollRemoveScale = createScrollHandler(
		() => REMOVE_SCALE_VALUES,
		() => s.scaleToRemove,
		(v) => (s.scaleToRemove = v)
	);
</script>

<div class="border-b border-border/50 pb-4">
	<span class="mb-3 block text-sm font-medium text-muted-foreground">Scale</span>
	<div class="space-y-3">
		<!-- Key and Mode -->
		<div class="grid grid-cols-2 gap-2">
			<!-- Key Selection -->
			<div class="space-y-1">
				<span
					id="key-select-label"
					class="flex items-center gap-1 text-xs text-muted-foreground/70"
				>
					Key
					<Zap class="h-3 w-3" />
				</span>
				<Select.Root type="single" bind:value={s.selectedKey}>
					<Select.Trigger
						class="w-full"
						onwheel={scrollKey}
						onkeydown={(e) =>
							handleArrowKeys(
								e,
								chromaticScale,
								() => s.selectedKey,
								(v) => (s.selectedKey = v)
							)}
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
			<div class="space-y-1">
				<span id="mode-toggle-label" class="text-xs text-muted-foreground/70">Mode</span>
				<div
					class="flex items-center rounded-md border border-border bg-background p-1"
					role="group"
					aria-labelledby="mode-toggle-label"
				>
					<button
						class="flex-1 rounded px-2 py-1 text-sm transition-colors {s.isMajor
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => (s.isMajor = true)}
						aria-pressed={s.isMajor}
					>
						Major
					</button>
					<button
						class="flex-1 rounded px-2 py-1 text-sm transition-colors {!s.isMajor
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => (s.isMajor = false)}
						aria-pressed={!s.isMajor}
					>
						Minor
					</button>
				</div>
			</div>
		</div>

		<!-- Add Scale -->
		<div class="space-y-1">
			<span id="scale-select-label" class="text-xs text-muted-foreground/70">Add Scale</span>
			<div class="flex gap-1">
				<Select.Root type="single" bind:value={s.selectedScale}>
					<Select.Trigger
						class="h-9 flex-1"
						onwheel={scrollScale}
						onkeydown={(e) =>
							handleArrowKeys(
								e,
								SCALE_VALUES,
								() => s.selectedScale,
								(v) => (s.selectedScale = v)
							)}
						aria-labelledby="scale-select-label"
					>
						{#if s.selectedScale === 'melodic-minor'}
							Mel. Minor
						{:else}
							{capitalize(s.selectedScale)}
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
				<Button
					onclick={store.applyScale}
					variant="secondary"
					class="h-9 px-2"
					aria-label="Add scale notes"
				>
					<Plus class="h-4 w-4" />
				</Button>
			</div>
		</div>

		<!-- Remove Scale Notes -->
		<div class="space-y-1">
			<span
				id="remove-scale-label"
				class="flex items-center gap-1 text-xs text-muted-foreground/70"
			>
				Remove Scale
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger class="cursor-help">
							<Info class="h-3 w-3" />
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Only removes notes not in the pentatonic scale</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</span>
			<div class="flex gap-1">
				<Select.Root type="single" bind:value={s.scaleToRemove}>
					<Select.Trigger
						class="h-9 flex-1"
						onwheel={scrollRemoveScale}
						onkeydown={(e) =>
							handleArrowKeys(
								e,
								REMOVE_SCALE_VALUES,
								() => s.scaleToRemove,
								(v) => (s.scaleToRemove = v)
							)}
						aria-labelledby="remove-scale-label"
					>
						{#if s.scaleToRemove === '3nps'}
							3NPS
						{:else if s.scaleToRemove === 'melodic-minor'}
							Mel. Minor
						{:else}
							{capitalize(s.scaleToRemove)}
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
				<Button
					onclick={store.removeScaleNotes}
					variant="secondary"
					class="h-9 px-2"
					aria-label="Remove scale notes"
				>
					<Minus class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>
</div>
