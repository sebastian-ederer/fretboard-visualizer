<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { Fretboard } from '$lib/components/fretboard';
	import { CircleOfFifths } from '$lib/components/circle-of-fifths';
	import { MetronomeDisplay } from '$lib/components/metronome';
	import { SidePanel } from '$lib/components/side-panel';
	import { fretboardStore } from '$lib/fretboard';
	import { metronomeStore } from '$lib/metronome';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import Redo2 from '@lucide/svelte/icons/redo-2';
	import Download from '@lucide/svelte/icons/download';
	import Github from '@lucide/svelte/icons/github';
	import Settings from '@lucide/svelte/icons/settings';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	// Shorthand access to state
	const s = $derived(fretboardStore.state);

	// Side panel state
	let sidePanelOpen = $state(false); // Mobile sheet
	let desktopPanelOpen = $state(true); // Desktop collapsible

	// Initialize stores on mount
	onMount(() => {
		fretboardStore.initialize();
		metronomeStore.initialize();
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

<div class="flex h-screen flex-col overflow-hidden">
	<header class="z-50 shrink-0 border-b border-border/50 bg-card/80 px-4 py-2 backdrop-blur-sm">
		<div class="flex w-full items-center justify-between">
			<div class="flex items-center gap-2">
				<!-- Mobile: Settings button -->
				<Button
					onclick={() => (sidePanelOpen = true)}
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0 md:hidden"
					title="Open Settings"
				>
					<Settings class="h-4 w-4" />
				</Button>
				<h1 class="hidden text-lg font-semibold tracking-tight md:block">Fretboard Visualizer</h1>
			</div>
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

	<div class="flex min-h-0 flex-1">
		<!-- Desktop: Sidebar with collapse toggle -->
		<div class="hidden shrink-0 md:flex">
			<!-- Expanded panel -->
			{#if desktopPanelOpen}
				<aside
					class="flex w-80 flex-col overflow-y-auto border-r border-border/50 bg-card/30"
					transition:slide={{ axis: 'x', duration: 200 }}
				>
					<SidePanel store={fretboardStore} />
				</aside>
			{/if}

			<!-- Collapse/Expand strip -->
			<button
				onclick={() => (desktopPanelOpen = !desktopPanelOpen)}
				class="flex w-6 items-center justify-center border-r border-border/50 bg-card/20 text-muted-foreground transition-colors hover:bg-card/50 hover:text-foreground"
				title={desktopPanelOpen ? 'Collapse panel' : 'Expand panel'}
			>
				{#if desktopPanelOpen}
					<ChevronLeft class="h-4 w-4" />
				{:else}
					<ChevronRight class="h-4 w-4" />
				{/if}
			</button>
		</div>

		<!-- Main content area -->
		<main class="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
			<div class="mx-auto flex w-full max-w-[1500px] flex-col gap-3 sm:gap-4">
				<!-- Fretboard -->
				<Fretboard store={fretboardStore} />

				<!-- Circle of Fifths + Metronome -->
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
					<CircleOfFifths />
					<MetronomeDisplay />
				</div>
			</div>
		</main>
	</div>
</div>

<!-- Mobile: Sheet overlay -->
<Sheet.Root bind:open={sidePanelOpen}>
	<Sheet.Content side="left" class="w-80 p-0">
		<Sheet.Header class="border-b border-border/50 px-4 py-3">
			<Sheet.Title>Settings</Sheet.Title>
		</Sheet.Header>
		<div class="h-[calc(100vh-57px)] overflow-y-auto">
			<SidePanel store={fretboardStore} />
		</div>
	</Sheet.Content>
</Sheet.Root>
