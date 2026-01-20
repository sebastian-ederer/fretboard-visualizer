<script lang="ts">
	import { strumPatternStore } from '$lib/strum-pattern';
	import { Button } from '$lib/components/ui/button';
	import X from '@lucide/svelte/icons/x';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';

	const s = $derived(strumPatternStore.state);
	const beatsCount = $derived(s.currentPattern.beats.length);

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleDrop(e: DragEvent, beatIndex: number) {
		e.preventDefault();

		// Check if this is a reorder operation (dragging existing chord)
		if (s.draggedChordSlotIndex !== null) {
			strumPatternStore.moveChord(s.draggedChordSlotIndex, beatIndex);
			strumPatternStore.setDraggedChordSlot(null);
			return;
		}

		// Check if this is a new chord being dragged (from Circle of Fifths or library)
		if (s.draggedChord) {
			strumPatternStore.handleChordDrop(s.draggedChord, beatIndex);
			return;
		}

		// Fallback to native drag data
		const chord = e.dataTransfer?.getData('text/plain');
		if (chord) {
			strumPatternStore.handleChordDrop(chord, beatIndex);
		}
	}

	function handleChordDragStart(slotIndex: number, chord: string) {
		strumPatternStore.setDraggedChordSlot(slotIndex);
		strumPatternStore.state.draggedChord = chord;
	}

	function handleChordDragEnd() {
		strumPatternStore.setDraggedChordSlot(null);
		strumPatternStore.state.draggedChord = null;
	}

	function getChordForBeat(beatIndex: number): { chord: string; slotIndex: number } | null {
		const progression = s.currentPattern.chordProgression;
		for (let i = 0; i < progression.length; i++) {
			const slot = progression[i];
			if (beatIndex >= slot.beatIndex && beatIndex < slot.beatIndex + slot.duration) {
				// Only return for the first beat of the chord
				if (beatIndex === slot.beatIndex) {
					return { chord: slot.chord, slotIndex: i };
				}
				return null; // This beat is covered by a chord but not the first
			}
		}
		return null;
	}

	function isChordContinuation(beatIndex: number): { isContinuation: boolean; slotIndex: number | null } {
		const progression = s.currentPattern.chordProgression;
		for (let i = 0; i < progression.length; i++) {
			const slot = progression[i];
			if (beatIndex > slot.beatIndex && beatIndex < slot.beatIndex + slot.duration) {
				return { isContinuation: true, slotIndex: i };
			}
		}
		return { isContinuation: false, slotIndex: null };
	}

	function isChordSlotActive(slotIndex: number | null): boolean {
		if (slotIndex === null || s.currentChordSlotIndex === null) return false;
		return s.isPlaying && s.currentChordSlotIndex === slotIndex;
	}

	function isBeatActive(beatIndex: number): boolean {
		return s.isPlaying && s.currentBeat === beatIndex;
	}

	function isBeingDragged(slotIndex: number): boolean {
		return s.draggedChordSlotIndex === slotIndex;
	}
</script>

<div class="mb-4">
	<div class="mb-2 flex items-center justify-between">
		<span class="text-xs text-muted-foreground">
			Chord Progression ({beatsCount} beats) — Drag to reorder
		</span>
		{#if s.isPlaying && s.currentChordSlotIndex !== null}
			{@const activeSlot = s.currentPattern.chordProgression[s.currentChordSlotIndex]}
			{#if activeSlot}
				<span class="rounded bg-primary/20 px-2 py-0.5 text-sm font-semibold text-primary animate-pulse">
					{activeSlot.chord}
				</span>
			{/if}
		{/if}
	</div>
	<div class="overflow-x-auto pb-1">
		<div class="flex gap-1 min-w-fit">
		{#each Array(beatsCount) as _, beatIndex (beatIndex)}
			{@const chordInfo = getChordForBeat(beatIndex)}
			{@const continuation = isChordContinuation(beatIndex)}
			{@const isActive = chordInfo ? isChordSlotActive(chordInfo.slotIndex) : isChordSlotActive(continuation.slotIndex)}
			{@const isBeatPlaying = isBeatActive(beatIndex)}
			{@const isDragging = chordInfo ? isBeingDragged(chordInfo.slotIndex) : false}

			<div
				class="relative flex h-12 min-w-[48px] flex-1 items-center justify-center rounded-md border transition-colors duration-100
					{isDragging ? 'opacity-50' : ''}
					{isActive
						? 'bg-primary/25 border-primary'
						: chordInfo
							? 'bg-primary/10 border-primary/30'
							: continuation.isContinuation
								? 'bg-primary/5 border-l-0 border-border/30'
								: s.showChordDropZones
									? 'border-dashed border-primary/50 bg-primary/5'
									: 'border-border/50 bg-card/30'}
					{isBeatPlaying && !isActive ? 'ring-1 ring-primary/40' : ''}"
				role="button"
				tabindex="0"
				data-beat-index={beatIndex}
				data-chord-drop-zone="true"
				ondragover={handleDragOver}
				ondrop={(e) => handleDrop(e, beatIndex)}
			>
				{#if chordInfo}
					<div
						class="flex cursor-grab items-center gap-0.5 active:cursor-grabbing"
						draggable="true"
						ondragstart={() => handleChordDragStart(chordInfo.slotIndex, chordInfo.chord)}
						ondragend={handleChordDragEnd}
						role="button"
						tabindex="0"
					>
						<GripVertical class="h-3 w-3 text-muted-foreground/50" />
						<span class="font-semibold text-sm {isActive ? 'text-primary-foreground scale-110' : ''}">{chordInfo.chord}</span>
					</div>
					{#if !s.isPlaying}
						<Button
							variant="ghost"
							size="sm"
							class="absolute -right-1 -top-1 h-5 w-5 p-0 opacity-0 hover:opacity-100 group-hover:opacity-100"
							onclick={() => strumPatternStore.removeChord(chordInfo.slotIndex)}
						>
							<X class="h-3 w-3" />
						</Button>
					{/if}
				{:else if continuation.isContinuation}
					<span class="text-muted-foreground/30 {isActive ? 'text-primary/50' : ''}">—</span>
				{:else if s.showChordDropZones}
					<span class="text-xs text-muted-foreground/50">Drop</span>
				{:else}
					<span class="text-xs text-muted-foreground/30">{beatIndex + 1}</span>
				{/if}

				<!-- Beat indicator line at bottom -->
				{#if isBeatPlaying}
					<div class="absolute bottom-0 left-0 right-0 h-1 rounded-b bg-primary"></div>
				{/if}
			</div>
		{/each}
		</div>
	</div>

	<!-- Quick info about drag sources -->
	{#if s.chordLibrary.length > 0 || s.currentPattern.chordProgression.length > 0}
		<p class="mt-2 text-[10px] text-muted-foreground/60">
			Drag from: Circle of Fifths, Chord Library, or reorder existing chords
		</p>
	{/if}
</div>
