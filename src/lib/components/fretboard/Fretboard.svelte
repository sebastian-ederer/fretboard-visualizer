<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { FRET_COUNT, SINGLE_DOT_FRETS, DOUBLE_DOT_FRETS } from '$lib/fretboard/constants';
	import { getNoteDisplay } from '$lib/fretboard/music-utils';
	import { getComplementaryColor } from '$lib/fretboard/color-utils';
	import { isNoteIn3NPSShape } from '$lib/fretboard/shape-utils';
	import ShapeOverlay from './ShapeOverlay.svelte';
	import type { ActiveShape } from '$lib/fretboard/types';

	interface Props {
		strings: string[];
		stringBaseNotes: number[];
		selectedFrets: Record<string, string>;
		selectedKey: string;
		showIntervals: boolean;
		useFlats: boolean;
		selectedColor: string;
		showShapeBoxes: boolean;
		show3NPSShapeBoxes: boolean;
		activeShapes: ActiveShape[];
		active3NPSShapes: ActiveShape[];
		appliedIsMajor: boolean;
		selectedTuningPreset: string;
		isSelected: (stringIndex: number, fretIndex: number) => boolean;
		getNoteColor: (stringIndex: number, fretIndex: number) => string;
		startPainting: (stringIndex: number, fretIndex: number) => void;
		handlePaintOver: (stringIndex: number, fretIndex: number) => void;
		selectString: (stringIndex: number) => void;
		clearString: (stringIndex: number) => void;
		clearAll: () => void;
	}

	let {
		strings,
		stringBaseNotes,
		selectedFrets,
		selectedKey,
		showIntervals,
		useFlats,
		selectedColor,
		showShapeBoxes,
		show3NPSShapeBoxes,
		activeShapes,
		active3NPSShapes,
		appliedIsMajor,
		selectedTuningPreset,
		isSelected,
		getNoteColor,
		startPainting,
		handlePaintOver,
		selectString,
		clearString,
		clearAll
	}: Props = $props();

	function getNoteDisplayText(stringIndex: number, fretIndex: number): string {
		return getNoteDisplay(stringIndex, fretIndex, stringBaseNotes, selectedKey, showIntervals, useFlats);
	}

	function checkNoteIn3NPSShape(stringIndex: number, fretIndex: number): boolean {
		if (!show3NPSShapeBoxes) return false;
		return isNoteIn3NPSShape(stringIndex, fretIndex, active3NPSShapes);
	}
</script>

<div
	class="overflow-x-auto rounded-xl border border-border/50 bg-background"
	style="-webkit-overflow-scrolling: touch;"
>
	<!-- Inner wrapper with fixed width to ensure proper scrolling -->
	<div class="relative isolate bg-background px-6 pb-6 pt-12" style="min-width: 1464px;">
		<!-- Pentatonic shape overlays (only in standard tuning) -->
		{#if showShapeBoxes && activeShapes.length > 0 && selectedTuningPreset === 'standard'}
			<ShapeOverlay shapes={activeShapes} type="pentatonic" {appliedIsMajor} />
		{/if}

		<!-- 3NPS shape overlays (only in standard tuning) -->
		{#if show3NPSShapeBoxes && active3NPSShapes.length > 0 && selectedTuningPreset === 'standard'}
			<ShapeOverlay shapes={active3NPSShapes} type="3nps" />
		{/if}

		<!-- Fret numbers -->
		<div class="mb-3 flex pl-10">
			{#each { length: FRET_COUNT + 1 }, fretIndex (fretIndex)}
				<div
					class="flex-shrink-0 text-center text-xs font-medium text-muted-foreground {fretIndex === 0
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
						<div class="w-10 flex-shrink-0 text-center text-sm font-semibold text-muted-foreground">
							{stringName}
						</div>

						<!-- String line -->
						<div
							class="pointer-events-none absolute left-10 right-0 bg-gradient-to-r from-zinc-400 via-zinc-300 to-zinc-400"
							style="height: {1 + stringIndex * 0.4}px;"
						></div>

						{#each { length: FRET_COUNT + 1 }, fretIndex (fretIndex)}
							<div
								class="relative z-20 flex h-10 flex-shrink-0 items-center justify-center {fretIndex === 0
									? 'w-8 border-r-4 border-r-zinc-300 bg-zinc-900/30'
									: 'w-14 border-r-2 border-r-zinc-600'}"
							>
								<!-- Circular hit area for painting -->
								<button
									class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 active:bg-white/20"
									onmousedown={() => startPainting(stringIndex, fretIndex)}
									onmouseenter={() => handlePaintOver(stringIndex, fretIndex)}
									ontouchstart={() => startPainting(stringIndex, fretIndex)}
									ontouchmove={(e) => {
										const touch = e.touches[0];
										const target = document.elementFromPoint(touch.clientX, touch.clientY);
										if (target?.closest('button')) {
											const btn = target.closest('button');
											const parent = btn?.parentElement;
											if (parent) {
												const row = parent.parentElement;
												const cells = row?.querySelectorAll(':scope > div');
												if (cells) {
													const cellIndex = Array.from(cells).indexOf(parent);
													if (cellIndex >= 0) {
														handlePaintOver(stringIndex, cellIndex);
													}
												}
											}
										}
									}}
								>
									{#if isSelected(stringIndex, fretIndex)}
										{@const noteColor = getNoteColor(stringIndex, fretIndex)}
										{@const inShape = checkNoteIn3NPSShape(stringIndex, fretIndex)}
										{@const borderColor = inShape ? getComplementaryColor(noteColor) : 'white'}
										<div
											class="flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
											style="background-color: {noteColor}bf; box-shadow: 0 4px 6px -1px {noteColor}40; border-color: {borderColor};"
										>
											<span class="text-[10px] font-bold text-white">
												{getNoteDisplayText(stringIndex, fretIndex)}
											</span>
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
			{#each { length: FRET_COUNT + 1 }, fretIndex (fretIndex)}
				<div
					class="flex flex-shrink-0 items-center justify-center gap-1 {fretIndex === 0 ? 'w-8' : 'w-14'}"
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
