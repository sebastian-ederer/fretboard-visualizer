<script lang="ts">
	import {
		FRET_COUNT,
		SINGLE_DOT_FRETS,
		DOUBLE_DOT_FRETS,
		STRING_THICKNESS_BASE,
		STRING_THICKNESS_INCREMENT,
		FRETBOARD_MIN_WIDTH
	} from '$lib/fretboard/constants';
	import type { ActiveShape } from '$lib/fretboard/types';
	import type { Snippet } from 'svelte';
	import ShapeOverlay from './ShapeOverlay.svelte';

	interface Props {
		strings: string[];
		showShapeBoxes?: boolean;
		activeShapes?: ActiveShape[];
		show3NPSShapeBoxes?: boolean;
		active3NPSShapes?: ActiveShape[];
		appliedIsMajor?: boolean;
		isStandardTuning?: boolean;
		onElementBind?: (element: HTMLDivElement) => void;
		cellContent: Snippet<[{ stringIndex: number; fretIndex: number }]>;
	}

	let {
		strings,
		showShapeBoxes = false,
		activeShapes = [],
		show3NPSShapeBoxes = false,
		active3NPSShapes = [],
		appliedIsMajor = true,
		isStandardTuning = true,
		onElementBind,
		cellContent
	}: Props = $props();

	let fretboardElement: HTMLDivElement;

	$effect(() => {
		if (fretboardElement && onElementBind) {
			onElementBind(fretboardElement);
		}
	});
</script>

<div
	class="overflow-x-auto rounded-xl border border-border/50 bg-background"
	style="-webkit-overflow-scrolling: touch;"
>
	<div
		bind:this={fretboardElement}
		class="relative isolate bg-background px-6 pb-6 pt-12"
		style="min-width: {FRETBOARD_MIN_WIDTH}px;"
	>
		<!-- Pentatonic shape overlays (only in standard tuning) -->
		{#if showShapeBoxes && activeShapes.length > 0 && isStandardTuning}
			<ShapeOverlay shapes={activeShapes} type="pentatonic" {appliedIsMajor} />
		{/if}

		<!-- 3NPS shape overlays (only in standard tuning) -->
		{#if show3NPSShapeBoxes && active3NPSShapes.length > 0 && isStandardTuning}
			<ShapeOverlay shapes={active3NPSShapes} type="3nps" />
		{/if}

		<!-- Fret numbers -->
		<div class="mb-3 flex pl-10">
			{#each { length: FRET_COUNT + 1 }, fretIndex (fretIndex)}
				<div
					class="flex-shrink-0 text-center text-xs font-medium text-muted-foreground {fretIndex ===
					0
						? 'w-8'
						: 'w-14'}"
				>
					{fretIndex}
				</div>
			{/each}
		</div>

		<!-- Strings -->
		{#each strings as stringName, stringIndex (stringIndex)}
			<div class="group relative flex items-center">
				<div class="w-10 flex-shrink-0 text-center text-sm font-semibold text-muted-foreground">
					{stringName}
				</div>

				<!-- String line -->
				<div
					class="pointer-events-none absolute left-10 right-0 bg-gradient-to-r from-zinc-400 via-zinc-300 to-zinc-400"
					style="height: {STRING_THICKNESS_BASE + stringIndex * STRING_THICKNESS_INCREMENT}px;"
				></div>

				{#each { length: FRET_COUNT + 1 }, fretIndex (fretIndex)}
					<div
						class="relative z-20 flex h-10 flex-shrink-0 items-center justify-center {fretIndex ===
						0
							? 'w-8 border-r-4 border-r-zinc-300 bg-zinc-900/30'
							: 'w-14 border-r-2 border-r-zinc-600'}"
					>
						{@render cellContent({ stringIndex, fretIndex })}
					</div>
				{/each}
			</div>
		{/each}

		<!-- Fret markers -->
		<div class="mt-3 flex pl-10">
			{#each { length: FRET_COUNT + 1 }, fretIndex (fretIndex)}
				<div
					class="flex flex-shrink-0 items-center justify-center gap-1 {fretIndex === 0
						? 'w-8'
						: 'w-14'}"
				>
					{#if SINGLE_DOT_FRETS.includes(fretIndex)}
						<div class="h-2 w-2 rounded-full bg-zinc-600"></div>
					{:else if DOUBLE_DOT_FRETS.includes(fretIndex)}
						<div class="h-2 w-2 rounded-full bg-zinc-600"></div>
						<div class="h-2 w-2 rounded-full bg-zinc-600"></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
