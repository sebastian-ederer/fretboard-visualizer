<script lang="ts">
	import { TAP_THRESHOLD, TOUCH_DEBOUNCE_MS } from '$lib/fretboard/constants';
	import { getNoteDisplay, isRootNote } from '$lib/fretboard/music-utils';
	import { getComplementaryColor } from '$lib/fretboard/color-utils';
	import { isNoteIn3NPSShape } from '$lib/fretboard/shape-utils';
	import BaseFretboard from './BaseFretboard.svelte';
	import type { fretboardStore as FretboardStoreType } from '$lib/fretboard/store.svelte';

	interface Props {
		store: typeof FretboardStoreType;
	}

	let { store }: Props = $props();

	// Shorthand access to state
	const s = $derived(store.state);

	function getNoteDisplayText(stringIndex: number, fretIndex: number): string {
		return getNoteDisplay(stringIndex, fretIndex, store.stringBaseNotes, s.selectedKey, s.showIntervals, s.useFlats);
	}

	function checkNoteIn3NPSShape(stringIndex: number, fretIndex: number): boolean {
		if (!s.show3NPSShapeBoxes) return false;
		return isNoteIn3NPSShape(stringIndex, fretIndex, s.active3NPSShapes);
	}

	// Guard to prevent mousedown from firing after touchstart
	let lastTouchStartTime = 0;

	// Touch tracking for tap detection (prevents accidental notes while scrolling)
	let touchStartX = 0;
	let touchStartY = 0;
	let touchTarget: { stringIndex: number; fretIndex: number } | null = null;

	function handleTouchStart(e: TouchEvent, stringIndex: number, fretIndex: number) {
		lastTouchStartTime = performance.now();
		const touch = e.touches[0];
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
		touchTarget = { stringIndex, fretIndex };
	}

	function handleTouchMove(e: TouchEvent) {
		if (!touchTarget) return;
		const touch = e.touches[0];
		const deltaX = Math.abs(touch.clientX - touchStartX);
		const deltaY = Math.abs(touch.clientY - touchStartY);
		// If moved beyond threshold, cancel the tap (it's a scroll)
		if (deltaX > TAP_THRESHOLD || deltaY > TAP_THRESHOLD) {
			touchTarget = null;
		}
	}

	function handleTouchEnd() {
		// Only trigger if we still have a valid tap target (didn't scroll)
		if (touchTarget) {
			store.startPainting(touchTarget.stringIndex, touchTarget.fretIndex);
			store.stopPainting();
		}
		touchTarget = null;
	}

	function handleMouseDown(stringIndex: number, fretIndex: number) {
		// Skip if this mousedown was triggered by a recent touch
		if (performance.now() - lastTouchStartTime < TOUCH_DEBOUNCE_MS) return;
		store.startPainting(stringIndex, fretIndex);
	}

	// Generate accessible label for a fret button
	function getAriaLabel(stringIndex: number, fretIndex: number): string {
		const note = getNoteDisplayText(stringIndex, fretIndex);
		const selected = store.isSelected(stringIndex, fretIndex);
		return `${s.strings[stringIndex]} string, fret ${fretIndex}, note ${note}${selected ? ', selected' : ''}`;
	}
</script>

<BaseFretboard
	strings={s.strings}
	showShapeBoxes={s.showShapeBoxes}
	activeShapes={s.activeShapes}
	show3NPSShapeBoxes={s.show3NPSShapeBoxes}
	active3NPSShapes={s.active3NPSShapes}
	appliedIsMajor={s.appliedIsMajor}
	isStandardTuning={s.selectedTuningPreset === 'standard'}
	onElementBind={(el) => store.setFretboardElement(el)}
>
	{#snippet cellContent({ stringIndex, fretIndex })}
		<!-- Circular hit area for painting -->
		<button
			class="relative flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 active:bg-white/20"
			data-string={stringIndex}
			data-fret={fretIndex}
			aria-label={getAriaLabel(stringIndex, fretIndex)}
			aria-pressed={store.isSelected(stringIndex, fretIndex)}
			onmousedown={() => handleMouseDown(stringIndex, fretIndex)}
			onmouseenter={() => store.handlePaintOver(stringIndex, fretIndex)}
			ontouchstart={(e) => handleTouchStart(e, stringIndex, fretIndex)}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
		>
			<!-- Highlight ring (shows when chord notes are highlighted) -->
			{#if store.isHighlighted(stringIndex, fretIndex)}
				{@const highlightColor = store.getHighlightColor(stringIndex, fretIndex)}
				<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div
						class="h-8 w-8 animate-pulse rounded-full border-[3px]"
						style="border-color: {highlightColor}; box-shadow: 0 0 8px {highlightColor};"
					></div>
				</div>
			{/if}

			{#if store.isSelected(stringIndex, fretIndex)}
				{@const noteColor = store.getNoteColor(stringIndex, fretIndex)}
				{@const inShape = checkNoteIn3NPSShape(stringIndex, fretIndex)}
				{@const borderColor = inShape ? getComplementaryColor(noteColor) : 'white'}
				{@const isRoot = s.highlightRootNotes && isRootNote(stringIndex, fretIndex, store.stringBaseNotes, s.selectedKey)}
				<div
					class="flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
					style="background-color: {noteColor}{isRoot ? '' : 'bf'}; box-shadow: {isRoot ? `0 0 0 2px ${noteColor}, 0 0 0 4px ${s.rootNoteHighlightColor}` : `0 4px 6px -1px ${noteColor}40`}; border-color: {borderColor};"
				>
					<span class="select-none text-[10px] font-bold text-white">
						{getNoteDisplayText(stringIndex, fretIndex)}
					</span>
				</div>
			{/if}
		</button>
	{/snippet}
</BaseFretboard>
