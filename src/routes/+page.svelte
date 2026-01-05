<script lang="ts">
	import { onMount } from 'svelte';
	import { Fretboard, Settings } from '$lib/components/fretboard';
	import { fretboardStore } from '$lib/fretboard';

	// Shorthand access to state
	const s = $derived(fretboardStore.state);

	// Initialize store on mount
	onMount(() => {
		fretboardStore.initialize();
	});

	// Consolidated key/mode change effect
	let prevKey = $state('C');
	let prevIsMajor = $state(true);
	$effect(() => {
		if (!s.isLoaded) {
			prevKey = s.selectedKey;
			prevIsMajor = s.isMajor;
			return;
		}

		const keyChanged = s.selectedKey !== prevKey;
		const modeChanged = s.isMajor !== prevIsMajor;

		if (keyChanged || modeChanged) {
			fretboardStore.recalculateShapes();
			fretboardStore.pushHistory(true);
			prevKey = s.selectedKey;
			prevIsMajor = s.isMajor;
		}
	});

	// Auto-save effect - uses store's built-in method
	fretboardStore.setupAutoSave();

	// Keyboard shortcuts
	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
			e.preventDefault();
			fretboardStore.undo();
		}
		if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
			e.preventDefault();
			fretboardStore.redo();
		}
	}
</script>

<svelte:window
	onmouseup={fretboardStore.stopPainting}
	ontouchend={fretboardStore.stopPainting}
	onkeydown={handleKeydown}
/>

<div class="flex min-h-screen flex-col p-4 sm:p-6 md:p-8">
	<header class="mb-6 text-center sm:mb-8 md:mb-12">
		<h1 class="mb-1 text-2xl font-bold tracking-tight sm:mb-2 sm:text-3xl md:text-4xl">
			Fretboard Visualizer
		</h1>
		<p class="text-sm text-muted-foreground sm:text-base">
			Tap or drag to paint notes on the fretboard
		</p>
	</header>

	<main class="flex flex-1 flex-col items-center gap-4 sm:gap-6">
		<div class="flex w-full max-w-[1500px] flex-col gap-4">
			<!-- Settings Section -->
			<Settings store={fretboardStore} />

			<!-- Fretboard -->
			<Fretboard store={fretboardStore} />
		</div>
	</main>
</div>
