<script lang="ts">
	import { onMount } from 'svelte';
	import { AppShell } from '$lib/components/app-shell';
	import { ScaleComparerFretboard, ScaleComparerSettings } from '$lib/components/scale-comparer';
	import { fretboardStore } from '$lib/fretboard';
	import { metronomeStore } from '$lib/metronome';
	import { Button } from '$lib/components/ui/button';
	import Download from '@lucide/svelte/icons/download';

	// Initialize stores on mount (shared with main page)
	onMount(() => {
		fretboardStore.initialize();
		metronomeStore.initialize();
		// Clear any chord highlights from Circle of Fifths when navigating to this page
		fretboardStore.clearHighlights();
	});

	// Keyboard shortcuts for metronome
	function handleKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

		if (e.code === 'Space' && !isInput) {
			e.preventDefault();
			metronomeStore.toggle();
		}
	}
</script>

<svelte:head>
	<title>Scale Comparer - Fretboard Visualizer</title>
	<meta name="description" content="Compare guitar scales side by side. See how pentatonic, blues, and modal scales relate to each other on the fretboard." />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<AppShell title="Scale Comparer">
	{#snippet headerActions()}
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
		<ScaleComparerSettings />
	{/snippet}

	<ScaleComparerFretboard />
</AppShell>
