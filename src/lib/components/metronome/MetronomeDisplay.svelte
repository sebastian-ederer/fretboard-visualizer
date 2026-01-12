<script lang="ts">
	import { metronomeStore } from '$lib/metronome';
	import { Button } from '$lib/components/ui/button';
	import Play from '@lucide/svelte/icons/play';
	import Pause from '@lucide/svelte/icons/pause';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';

	const m = $derived(metronomeStore.state);

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		metronomeStore.adjustTempo(e.deltaY > 0 ? -1 : 1);
	}

	// Hold-to-repeat for tempo buttons
	let holdInterval: number | null = null;
	let holdTimeout: number | null = null;

	function startHold(delta: number) {
		metronomeStore.adjustTempo(delta);
		holdTimeout = window.setTimeout(() => {
			holdInterval = window.setInterval(() => {
				metronomeStore.adjustTempo(delta);
			}, 50);
		}, 300);
	}

	function stopHold() {
		if (holdTimeout) {
			clearTimeout(holdTimeout);
			holdTimeout = null;
		}
		if (holdInterval) {
			clearInterval(holdInterval);
			holdInterval = null;
		}
	}
</script>

<div class="flex flex-col items-center rounded-lg border border-border/50 bg-card/50 p-2 sm:p-4">
	<h3 class="mb-1 text-xs font-medium text-muted-foreground sm:mb-2 sm:text-sm">Metronome</h3>

	<!-- Count-in indicator -->
	{#if m.isPlaying && m.isCountingIn}
		<div class="mb-1 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-500 sm:mb-2 sm:px-2 sm:text-xs">
			Count-in...
		</div>
	{/if}

	<!-- Beat indicators -->
	<div class="mb-2 flex items-center gap-1 sm:mb-3 sm:gap-1.5">
		{#each Array(m.beatsPerMeasure) as _, i}
			<div
				class="h-2 w-2 rounded-full transition-all duration-75 sm:h-3 sm:w-3 {m.isPlaying && m.currentBeat === i
					? m.isCountingIn
						? 'scale-110 bg-yellow-500'
						: i === 0 && m.accentFirstBeat
							? 'scale-125 bg-primary'
							: 'scale-110 bg-primary/70'
					: 'bg-muted/50'}"
			></div>
		{/each}
	</div>

	<!-- Tempo display -->
	<div class="mb-2 flex items-center gap-1 sm:mb-3 sm:gap-2" onwheel={handleWheel}>
		<Button
			variant="ghost"
			size="sm"
			class="h-6 w-6 p-0 sm:h-8 sm:w-8"
			onmousedown={() => startHold(-5)}
			onmouseup={stopHold}
			onmouseleave={stopHold}
			ontouchstart={() => startHold(-5)}
			ontouchend={stopHold}
			aria-label="Decrease tempo by 5"
		>
			<Minus class="h-3 w-3 sm:h-4 sm:w-4" />
		</Button>

		<div class="flex flex-col items-center">
			<span class="text-2xl font-bold tabular-nums sm:text-4xl">{m.tempo}</span>
			<span class="text-[10px] text-muted-foreground sm:text-xs">BPM</span>
		</div>

		<Button
			variant="ghost"
			size="sm"
			class="h-6 w-6 p-0 sm:h-8 sm:w-8"
			onmousedown={() => startHold(5)}
			onmouseup={stopHold}
			onmouseleave={stopHold}
			ontouchstart={() => startHold(5)}
			ontouchend={stopHold}
			aria-label="Increase tempo by 5"
		>
			<Plus class="h-3 w-3 sm:h-4 sm:w-4" />
		</Button>
	</div>

	<!-- Time signature & bar count -->
	<div class="mb-2 flex items-center gap-2 text-xs text-muted-foreground sm:mb-3 sm:gap-3 sm:text-sm">
		<span>{m.beatsPerMeasure}/{m.beatUnit}</span>
		{#if m.autoTempoEnabled && m.isPlaying && !m.isCountingIn}
			<span class="rounded bg-muted/50 px-1 py-0.5 text-[10px] tabular-nums sm:px-1.5 sm:text-xs">
				Bar {m.currentBar + 1}
			</span>
		{/if}
	</div>

	<!-- Controls -->
	<div class="flex items-center gap-2">
		<Button
			variant={m.isPlaying ? 'secondary' : 'default'}
			size="lg"
			class="h-10 w-10 rounded-full p-0 sm:h-12 sm:w-12"
			onclick={metronomeStore.toggle}
			aria-label={m.isPlaying ? 'Stop metronome (Space)' : 'Start metronome (Space)'}
		>
			{#if m.isPlaying}
				<Pause class="h-4 w-4 sm:h-5 sm:w-5" />
			{:else}
				<Play class="ml-0.5 h-4 w-4 sm:h-5 sm:w-5" />
			{/if}
		</Button>
	</div>
	<p class="mt-1 hidden text-xs text-muted-foreground sm:mt-2 sm:block">Press Space to play/pause</p>
</div>
