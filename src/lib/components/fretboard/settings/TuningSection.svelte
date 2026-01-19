<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import {
		TUNING_PRESET_NAMES,
		TUNING_PRESETS,
		MIN_STRING_COUNT,
		MAX_STRING_COUNT
	} from '$lib/fretboard/constants';
	import { getDisplayNote, getNoteIndex, getChromaticScale } from '$lib/fretboard/music-utils';
	import { createScrollHandler, handleArrowKeys } from '$lib/utils/scroll-handler';
	import type { fretboardStore as FretboardStoreType } from '$lib/fretboard/store.svelte';

	interface Props {
		store: typeof FretboardStoreType;
	}

	let { store }: Props = $props();
	const s = $derived(store.state);

	const chromaticScale = $derived(getChromaticScale(s.useFlats));
	const tuningPresetKeys = Object.keys(TUNING_PRESETS);

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
</script>

<div class="border-b border-border/50 pb-4">
	<span class="mb-3 block text-sm font-medium text-muted-foreground">Tuning</span>
	<div class="space-y-3">
		<!-- String Count -->
		<div class="space-y-1">
			<span id="string-count-label" class="text-xs text-muted-foreground/70">Number of Strings</span
			>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					class="h-8 w-8 p-0"
					onclick={() => store.setStringCount(s.strings.length - 1)}
					disabled={s.strings.length <= MIN_STRING_COUNT}
					aria-label="Remove string"
				>
					<Minus class="h-3 w-3" />
				</Button>
				<span class="w-8 text-center text-sm font-medium tabular-nums">{s.strings.length}</span>
				<Button
					variant="outline"
					size="sm"
					class="h-8 w-8 p-0"
					onclick={() => store.setStringCount(s.strings.length + 1)}
					disabled={s.strings.length >= MAX_STRING_COUNT}
					aria-label="Add string"
				>
					<Plus class="h-3 w-3" />
				</Button>
			</div>
		</div>

		<!-- Tuning Preset Selection -->
		<div class="space-y-1">
			<span id="tuning-preset-label" class="text-xs text-muted-foreground/70">Preset (6-string)</span
			>
			<Select.Root
				type="single"
				value={s.selectedTuningPreset}
				onValueChange={(v) => store.applyTuningPreset(v)}
			>
				<Select.Trigger
					class="w-full"
					onwheel={scrollTuning}
					onkeydown={(e) =>
						handleArrowKeys(
							e,
							tuningPresetKeys,
							() => s.selectedTuningPreset,
							(v) => store.applyTuningPreset(v)
						)}
					aria-labelledby="tuning-preset-label"
					disabled={s.strings.length !== 6}
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
		<div class="space-y-1">
			<span id="string-tuning-label" class="text-xs text-muted-foreground/70"
				>Strings (low → high)</span
			>
			<div class="flex flex-wrap gap-1" role="group" aria-labelledby="string-tuning-label">
				{#each Array.from({ length: s.strings.length }, (_, i) => s.strings.length - 1 - i) as stringIndex (stringIndex)}
					<Select.Root
						type="single"
						value={s.strings[stringIndex]}
						onValueChange={(v) => store.setStringNote(stringIndex, v)}
					>
						<Select.Trigger
							class="h-9 w-10 justify-center px-1 [&>svg]:hidden"
							onwheel={(e) => scrollStringTuning(e, stringIndex)}
							onkeydown={(e) =>
								handleArrowKeys(
									e,
									chromaticScale,
									() => s.strings[stringIndex],
									(v) => store.setStringNote(stringIndex, v)
								)}
						>
							<span class="w-full text-center text-xs"
								>{getDisplayNote(s.strings[stringIndex], s.useFlats)}</span
							>
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
