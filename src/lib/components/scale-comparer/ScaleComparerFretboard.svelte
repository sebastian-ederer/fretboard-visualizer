<script lang="ts">
	import {
		FRET_COUNT,
		SINGLE_DOT_FRETS,
		DOUBLE_DOT_FRETS,
		STRING_THICKNESS_BASE,
		STRING_THICKNESS_INCREMENT,
		FRETBOARD_MIN_WIDTH
	} from '$lib/fretboard/constants';
	import { getNoteDisplay, isRootNote, getStringBaseNotes } from '$lib/fretboard/music-utils';
	import { fretboardStore } from '$lib/fretboard';
	import { scaleComparerStore } from '$lib/scale-comparer';
	import { ShapeOverlay } from '$lib/components/fretboard';

	const fs = $derived(fretboardStore.state);
	const sc = $derived(scaleComparerStore.state);
	const displayNotes = $derived(scaleComparerStore.displayNotes);
	const stringBaseNotes = $derived(getStringBaseNotes(fs.strings));

	// Reference to the fretboard element for export
	let fretboardElement: HTMLDivElement;
	$effect(() => {
		fretboardStore.setFretboardElement(fretboardElement);
	});

	function getNoteDisplayText(stringIndex: number, fretIndex: number): string {
		return getNoteDisplay(stringIndex, fretIndex, stringBaseNotes, fs.selectedKey, fs.showIntervals, fs.useFlats);
	}

	function getNoteInfo(stringIndex: number, fretIndex: number) {
		const key = `${stringIndex}-${fretIndex}`;
		return displayNotes[key] || null;
	}

	// Check if note is highlighted from Circle of Fifths chord click
	function isHighlighted(stringIndex: number, fretIndex: number): boolean {
		return fretboardStore.isHighlighted(stringIndex, fretIndex);
	}

	function getHighlightColor(stringIndex: number, fretIndex: number): string | null {
		return fretboardStore.getHighlightColor(stringIndex, fretIndex);
	}
</script>

<div
	class="overflow-x-auto rounded-xl border border-border/50 bg-background"
	style="-webkit-overflow-scrolling: touch;"
>
	<div bind:this={fretboardElement} class="relative isolate bg-background px-6 pb-6 pt-12" style="min-width: {FRETBOARD_MIN_WIDTH}px;">
		<!-- Pentatonic shape overlays (only in standard tuning) -->
		{#if fs.showShapeBoxes && fs.activeShapes.length > 0 && fs.selectedTuningPreset === 'standard'}
			<ShapeOverlay shapes={fs.activeShapes} type="pentatonic" appliedIsMajor={fs.appliedIsMajor} />
		{/if}

		<!-- 3NPS shape overlays (only in standard tuning) -->
		{#if fs.show3NPSShapeBoxes && fs.active3NPSShapes.length > 0 && fs.selectedTuningPreset === 'standard'}
			<ShapeOverlay shapes={fs.active3NPSShapes} type="3nps" />
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
		{#each fs.strings as stringName, stringIndex (stringIndex)}
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
					{@const noteInfo = getNoteInfo(stringIndex, fretIndex)}
					{@const isRoot = isRootNote(stringIndex, fretIndex, stringBaseNotes, fs.selectedKey)}
					{@const highlighted = isHighlighted(stringIndex, fretIndex)}
					{@const highlightColor = getHighlightColor(stringIndex, fretIndex)}
					<div
						class="relative z-20 flex h-10 flex-shrink-0 items-center justify-center {fretIndex === 0
							? 'w-8 border-r-4 border-r-zinc-300 bg-zinc-900/30'
							: 'w-14 border-r-2 border-r-zinc-600'}"
					>
						<!-- Highlight ring from Circle of Fifths chord click -->
						{#if highlighted}
							<div class="pointer-events-none absolute flex items-center justify-center">
								<div
									class="h-8 w-8 animate-pulse rounded-full border-[3px]"
									style="border-color: {highlightColor}; box-shadow: 0 0 8px {highlightColor};"
								></div>
							</div>
						{/if}

						{#if noteInfo}
							<div
								class="flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
								style="background-color: {noteInfo.color}{isRoot ? '' : 'bf'};
									box-shadow: 0 4px 6px -1px {noteInfo.color}40;
									border-color: {noteInfo.primary && noteInfo.secondary ? sc.secondaryColor : 'white'};"
								title={noteInfo.primary && noteInfo.secondary ? 'In both scales' : noteInfo.primary ? 'Primary scale' : 'Secondary scale'}
							>
								<span class="select-none text-[10px] font-bold text-white">
									{getNoteDisplayText(stringIndex, fretIndex)}
								</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
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
