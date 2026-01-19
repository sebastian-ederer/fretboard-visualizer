<script lang="ts">
	import { getNoteDisplay, isRootNote, createFretKey } from '$lib/fretboard/music-utils';
	import { fretboardStore } from '$lib/fretboard';
	import { scaleComparerStore } from '$lib/scale-comparer';
	import { BaseFretboard } from '$lib/components/fretboard';

	const fs = $derived(fretboardStore.state);
	const sc = $derived(scaleComparerStore.state);
	const displayNotes = $derived(scaleComparerStore.displayNotes);
	const stringBaseNotes = $derived(fretboardStore.stringBaseNotes);

	function getNoteDisplayText(stringIndex: number, fretIndex: number): string {
		return getNoteDisplay(stringIndex, fretIndex, stringBaseNotes, fs.selectedKey, fs.showIntervals, fs.useFlats);
	}

	function getNoteInfo(stringIndex: number, fretIndex: number) {
		return displayNotes[createFretKey(stringIndex, fretIndex)] || null;
	}
</script>

<BaseFretboard
	strings={fs.strings}
	showShapeBoxes={fs.showShapeBoxes}
	activeShapes={fs.activeShapes}
	show3NPSShapeBoxes={fs.show3NPSShapeBoxes}
	active3NPSShapes={fs.active3NPSShapes}
	appliedIsMajor={fs.appliedIsMajor}
	isStandardTuning={fs.selectedTuningPreset === 'standard'}
	onElementBind={(el) => fretboardStore.setFretboardElement(el)}
>
	{#snippet cellContent({ stringIndex, fretIndex })}
		{@const noteInfo = getNoteInfo(stringIndex, fretIndex)}
		{@const isRoot = fs.highlightRootNotes && isRootNote(stringIndex, fretIndex, stringBaseNotes, fs.selectedKey)}
		{@const highlighted = fretboardStore.isHighlighted(stringIndex, fretIndex)}
		{@const highlightColor = fretboardStore.getHighlightColor(stringIndex, fretIndex)}

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
					box-shadow: {isRoot ? `0 0 0 2px ${noteInfo.color}, 0 0 0 4px ${fs.rootNoteHighlightColor}` : `0 4px 6px -1px ${noteInfo.color}40`};
					border-color: {noteInfo.primary && noteInfo.secondary ? sc.secondaryColor : 'white'};"
				title={noteInfo.primary && noteInfo.secondary ? 'In both scales' : noteInfo.primary ? 'Primary scale' : 'Secondary scale'}
			>
				<span class="select-none text-[10px] font-bold text-white">
					{getNoteDisplayText(stringIndex, fretIndex)}
				</span>
			</div>
		{/if}
	{/snippet}
</BaseFretboard>
