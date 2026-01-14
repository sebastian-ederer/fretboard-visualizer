<script lang="ts">
	import { onMount } from 'svelte';
	import { Fretboard } from '$lib/components/fretboard';
	import { SidePanel } from '$lib/components/side-panel';
	import { AppShell } from '$lib/components/app-shell';
	import { fretboardStore } from '$lib/fretboard';
	import { metronomeStore } from '$lib/metronome';
	import { Button } from '$lib/components/ui/button';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import Redo2 from '@lucide/svelte/icons/redo-2';
	import Download from '@lucide/svelte/icons/download';

	// Shorthand access to state
	const s = $derived(fretboardStore.state);

	// Initialize stores on mount
	onMount(() => {
		fretboardStore.initialize();
		metronomeStore.initialize();
		// Clear any chord highlights from Circle of Fifths when navigating to this page
		fretboardStore.clearHighlights();
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
		// Ignore if user is typing in an input field
		const target = e.target as HTMLElement;
		const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

		// Space to toggle metronome (only when not in input)
		if (e.code === 'Space' && !isInput) {
			e.preventDefault();
			metronomeStore.toggle();
		}

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

<AppShell title="Fretboard Visualizer">
	{#snippet headerActions()}
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
			<span class="text-xs">PNG</span>
		</Button>
		<Button
			onclick={fretboardStore.exportAsSvg}
			variant="ghost"
			size="sm"
			class="h-8 px-2"
			title="Save as SVG"
		>
			<Download class="mr-1 h-4 w-4" />
			<span class="text-xs">SVG</span>
		</Button>
	{/snippet}

	{#snippet sidePanel()}
		<SidePanel store={fretboardStore} />
	{/snippet}

	<Fretboard store={fretboardStore} />
</AppShell>
