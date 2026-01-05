<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import {
		FRET_COUNT,
		SINGLE_DOT_FRETS,
		DOUBLE_DOT_FRETS,
		STRING_THICKNESS_BASE,
		STRING_THICKNESS_INCREMENT
	} from '$lib/fretboard/constants';
	import { getNoteDisplay } from '$lib/fretboard/music-utils';
	import { getComplementaryColor } from '$lib/fretboard/color-utils';
	import { isNoteIn3NPSShape } from '$lib/fretboard/shape-utils';
	import ShapeOverlay from './ShapeOverlay.svelte';
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

	// Throttled touch handler state
	let lastTouchTime = 0;
	let lastTouchFret = -1;
	let lastTouchString = -1;
	const TOUCH_THROTTLE_MS = 16; // ~60fps

	// Optimized touch handler - throttled with position caching
	function handleTouchMove(e: TouchEvent) {
		const now = performance.now();
		if (now - lastTouchTime < TOUCH_THROTTLE_MS) return;
		lastTouchTime = now;

		const touch = e.touches[0];
		const target = document.elementFromPoint(touch.clientX, touch.clientY);
		const btn = target?.closest('button[data-fret]') as HTMLElement | null;
		if (btn) {
			const si = parseInt(btn.dataset.string || '-1', 10);
			const fi = parseInt(btn.dataset.fret || '-1', 10);
			// Skip if same position as last touch
			if (si === lastTouchString && fi === lastTouchFret) return;
			if (si >= 0 && fi >= 0) {
				lastTouchString = si;
				lastTouchFret = fi;
				store.handlePaintOver(si, fi);
			}
		}
	}

	// Generate accessible label for a fret button
	function getAriaLabel(stringIndex: number, fretIndex: number): string {
		const note = getNoteDisplayText(stringIndex, fretIndex);
		const selected = store.isSelected(stringIndex, fretIndex);
		return `${s.strings[stringIndex]} string, fret ${fretIndex}, note ${note}${selected ? ', selected' : ''}`;
	}
</script>

<div
	class="overflow-x-auto rounded-xl border border-border/50 bg-background"
	style="-webkit-overflow-scrolling: touch;"
>
	<!-- Inner wrapper with fixed width to ensure proper scrolling -->
	<div class="relative isolate bg-background px-6 pb-6 pt-12" style="min-width: 1464px;">
		<!-- Pentatonic shape overlays (only in standard tuning) -->
		{#if s.showShapeBoxes && s.activeShapes.length > 0 && s.selectedTuningPreset === 'standard'}
			<ShapeOverlay shapes={s.activeShapes} type="pentatonic" appliedIsMajor={s.appliedIsMajor} />
		{/if}

		<!-- 3NPS shape overlays (only in standard tuning) -->
		{#if s.show3NPSShapeBoxes && s.active3NPSShapes.length > 0 && s.selectedTuningPreset === 'standard'}
			<ShapeOverlay shapes={s.active3NPSShapes} type="3nps" />
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
		{#each s.strings as stringName, stringIndex (stringIndex)}
			<ContextMenu.Root>
				<ContextMenu.Trigger>
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
								class="relative z-20 flex h-10 flex-shrink-0 items-center justify-center {fretIndex === 0
									? 'w-8 border-r-4 border-r-zinc-300 bg-zinc-900/30'
									: 'w-14 border-r-2 border-r-zinc-600'}"
							>
								<!-- Circular hit area for painting -->
								<button
									class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 active:bg-white/20"
									data-string={stringIndex}
									data-fret={fretIndex}
									aria-label={getAriaLabel(stringIndex, fretIndex)}
									aria-pressed={store.isSelected(stringIndex, fretIndex)}
									onmousedown={() => store.startPainting(stringIndex, fretIndex)}
									onmouseenter={() => store.handlePaintOver(stringIndex, fretIndex)}
									ontouchstart={() => store.startPainting(stringIndex, fretIndex)}
									ontouchmove={handleTouchMove}
								>
									{#if store.isSelected(stringIndex, fretIndex)}
										{@const noteColor = store.getNoteColor(stringIndex, fretIndex)}
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
					<ContextMenu.Item onclick={() => store.selectString(stringIndex)}>
						Select all on {stringName} string
					</ContextMenu.Item>
					<ContextMenu.Item onclick={() => store.clearString(stringIndex)}>
						Clear {stringName} string
					</ContextMenu.Item>
					<ContextMenu.Separator />
					<ContextMenu.Item onclick={store.clearAll}>Clear all</ContextMenu.Item>
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
