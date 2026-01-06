<script lang="ts">
	import { onMount } from 'svelte';
	import { Fretboard, Settings } from '$lib/components/fretboard';
	import { fretboardStore } from '$lib/fretboard';
	import { Button } from '$lib/components/ui/button';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import Redo2 from '@lucide/svelte/icons/redo-2';
	import Download from '@lucide/svelte/icons/download';
	import Github from '@lucide/svelte/icons/github';

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

<div class="flex min-h-screen flex-col">
	<header class="border-b border-border/50 bg-card/30 px-4 py-2">
		<div class="mx-auto flex max-w-[1500px] items-center justify-between">
			<h1 class="text-lg font-semibold tracking-tight">Fretboard Visualizer</h1>
			<div class="flex items-center gap-1">
				<Button
					onclick={fretboardStore.undo}
					variant="ghost"
					size="sm"
					disabled={!fretboardStore.canUndo}
					class="h-8 px-2"
					title="Undo (Ctrl+Z)"
				>
					<Undo2 class="h-4 w-4" />
				</Button>
				<Button
					onclick={fretboardStore.redo}
					variant="ghost"
					size="sm"
					disabled={!fretboardStore.canRedo}
					class="h-8 px-2"
					title="Redo (Ctrl+Y)"
				>
					<Redo2 class="h-4 w-4" />
				</Button>
				<div class="mx-1 h-4 w-px bg-border"></div>
				<Button
					onclick={fretboardStore.exportAsPng}
					variant="ghost"
					size="sm"
					class="h-8 px-2"
					title="Save as PNG"
				>
					<Download class="mr-1 h-4 w-4" />
					<span class="hidden text-xs sm:inline">PNG</span>
				</Button>
				<Button
					onclick={fretboardStore.exportAsSvg}
					variant="ghost"
					size="sm"
					class="h-8 px-2"
					title="Save as SVG"
				>
					<Download class="mr-1 h-4 w-4" />
					<span class="hidden text-xs sm:inline">SVG</span>
				</Button>
				<div class="mx-1 h-4 w-px bg-border"></div>
				<a
					href="https://github.com/sebastian-ederer/fretboard-visualizer"
					target="_blank"
					rel="noopener noreferrer"
					class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					title="View on GitHub"
				>
					<Github class="h-4 w-4" />
				</a>
			</div>
		</div>
	</header>

	<main class="flex flex-1 flex-col items-center gap-4 p-4 sm:gap-6 sm:p-6">
		<div class="flex w-full max-w-[1500px] flex-col gap-4">
			<!-- Settings Section -->
			<Settings store={fretboardStore} />

			<!-- Fretboard -->
			<Fretboard store={fretboardStore} />
		</div>
	</main>
</div>
