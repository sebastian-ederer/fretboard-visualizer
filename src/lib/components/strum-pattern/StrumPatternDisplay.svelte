<script lang="ts">
	import { strumPatternStore } from '$lib/strum-pattern';
	import BeatCell from './BeatCell.svelte';
	import ChordTimeline from './ChordTimeline.svelte';
	import Loader from '@lucide/svelte/icons/loader';

	const s = $derived(strumPatternStore.state);

	// Calculate flat list of all strum positions for the grid
	const strumPositions = $derived.by(() => {
		const positions: Array<{
			beatIndex: number;
			subdivIndex: number;
			strum: (typeof s.currentPattern.beats)[0]['strums'][0];
			isFirstOfBeat: boolean;
		}> = [];

		s.currentPattern.beats.forEach((beat, beatIndex) => {
			beat.strums.forEach((strum, subdivIndex) => {
				positions.push({
					beatIndex,
					subdivIndex,
					strum,
					isFirstOfBeat: subdivIndex === 0
				});
			});
		});

		return positions;
	});

	function isPositionActive(beatIndex: number, subdivIndex: number): boolean {
		return s.isPlaying && s.currentBeat === beatIndex && s.currentSubdivision === subdivIndex;
	}
</script>

<div class="flex h-full flex-col p-4">
	<!-- Loading indicator -->
	{#if s.isAudioLoading}
		<div class="mb-4 flex items-center justify-center gap-2 rounded-lg bg-primary/10 py-2">
			<Loader class="h-4 w-4 animate-spin text-primary" />
			<span class="text-sm text-primary">Loading audio...</span>
		</div>
	{/if}

	<!-- Chord Timeline -->
	<ChordTimeline />

	<!-- Pattern Grid -->
	<div class="flex-1 overflow-x-auto">
		<div class="min-w-fit">
			<!-- Legend -->
			<div class="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
				<span><strong>D</strong> = Down</span>
				<span><strong>U</strong> = Up</span>
				<span class="text-orange-400"><strong>X</strong> = Muted</span>
			</div>

			<!-- Beat cells -->
			<div class="flex flex-wrap gap-1 pt-6">
				{#each strumPositions as pos (pos.beatIndex + '-' + pos.subdivIndex)}
					<BeatCell
						strum={pos.strum}
						isActive={isPositionActive(pos.beatIndex, pos.subdivIndex)}
						beatIndex={pos.beatIndex}
						subdivIndex={pos.subdivIndex}
						isFirstOfBeat={pos.isFirstOfBeat}
						onclick={() => strumPatternStore.cycleStrumAtPosition(pos.beatIndex, pos.subdivIndex)}
					/>
				{/each}
			</div>

			<!-- Subdivision markers -->
			<div class="mt-2 flex gap-1">
				{#each s.currentPattern.beats as beat, beatIndex (beatIndex)}
					<div
						class="flex items-center justify-center text-[10px] text-muted-foreground/50"
						style="width: {beat.subdivision * 40 + (beat.subdivision - 1) * 4}px"
					>
						{beat.subdivision === 1
							? '♩'
							: beat.subdivision === 2
								? '♪♪'
								: beat.subdivision === 3
									? '♪♪♪'
									: '♬♬'}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Instructions -->
	<div class="mt-4 rounded-lg border border-border/50 bg-card/30 p-3">
		<h4 class="mb-2 text-xs font-medium text-muted-foreground">How to use</h4>
		<ul class="space-y-1 text-xs text-muted-foreground/70">
			<li>• Click on cells to cycle through strum types (D → U → X → –)</li>
			<li>• Drag chords from the Circle of Fifths below to the chord timeline</li>
			<li>• Press <kbd class="rounded bg-muted px-1">Space</kbd> to play/pause</li>
			<li>• Adjust tempo and time signature in the Metronome settings</li>
		</ul>
	</div>
</div>
