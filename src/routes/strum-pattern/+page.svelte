<script lang="ts">
	import { onMount } from 'svelte';
	import { AppShell } from '$lib/components/app-shell';
	import { StrumPatternDisplay, StrumPatternSettings } from '$lib/components/strum-pattern';
	import { strumPatternStore } from '$lib/strum-pattern';
	import { fretboardStore } from '$lib/fretboard';
	import { metronomeStore } from '$lib/metronome';
	import { Button } from '$lib/components/ui/button';
	import Play from '@lucide/svelte/icons/play';
	import Pause from '@lucide/svelte/icons/pause';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';

	const s = $derived(strumPatternStore.state);

	onMount(() => {
		strumPatternStore.initialize();
		metronomeStore.initialize();
		fretboardStore.initialize();
	});

	// Auto-save effect for fretboard store (key/mode settings)
	fretboardStore.setupAutoSave();

	function handleKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		const isInput =
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.isContentEditable;

		// Space to toggle playback
		if (e.code === 'Space' && !isInput) {
			e.preventDefault();
			strumPatternStore.toggle();
		}
	}
</script>

<svelte:head>
	<title>Strum Pattern Builder - Fretboard Visualizer</title>
	<meta
		name="description"
		content="Build and practice guitar strumming patterns with chord progressions. Synchronize with the metronome to improve your rhythm."
	/>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<AppShell title="Strum Pattern">
	{#snippet headerActions()}
		<div class="flex items-center gap-1">
			<Button
				onclick={strumPatternStore.toggle}
				variant="ghost"
				size="sm"
				class="h-8 w-8 p-0"
				title={s.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
			>
				{#if s.isPlaying}
					<Pause class="h-4 w-4" />
				{:else}
					<Play class="h-4 w-4" />
				{/if}
			</Button>
			<Button
				onclick={strumPatternStore.resetPattern}
				variant="ghost"
				size="sm"
				class="h-8 w-8 p-0"
				title="Reset Pattern"
			>
				<RotateCcw class="h-4 w-4" />
			</Button>
		</div>
	{/snippet}

	{#snippet sidePanel()}
		<StrumPatternSettings />
	{/snippet}

	<StrumPatternDisplay />
</AppShell>
