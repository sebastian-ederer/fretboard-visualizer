<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { CircleOfFifths } from '$lib/components/circle-of-fifths';
	import { MetronomeDisplay } from '$lib/components/metronome';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import Github from '@lucide/svelte/icons/github';
	import Settings from '@lucide/svelte/icons/settings';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	interface Props {
		title: string;
		headerActions?: Snippet;
		sidePanel?: Snippet;
		children: Snippet;
	}

	let { title, headerActions, sidePanel, children }: Props = $props();

	// Side panel state
	let sidePanelOpen = $state(false); // Mobile sheet
	let desktopPanelOpen = $state(true); // Desktop collapsible

	// Navigation items
	const navItems = [
		{ href: '/', label: 'Fretboard' },
		{ href: '/scale-comparer', label: 'Scale Comparer' },
		{ href: '/strum-pattern', label: 'Strum Pattern' }
	];

	const currentPath = $derived($page.url.pathname);
</script>

<div class="flex h-screen flex-col overflow-hidden">
	<header class="z-50 shrink-0 border-b border-border/50 bg-card/80 px-4 py-2 backdrop-blur-sm">
		<!-- Row 1: Navigation -->
		<div class="flex w-full items-center justify-between">
			<div class="flex items-center gap-2">
				<!-- Mobile: Settings button -->
				{#if sidePanel}
					<Button
						onclick={() => (sidePanelOpen = true)}
						variant="ghost"
						size="sm"
						class="h-8 w-8 p-0 md:hidden"
						title="Open Settings"
					>
						<Settings class="h-4 w-4" />
					</Button>
				{/if}

				<!-- Navigation tabs -->
				<nav class="flex items-center gap-1">
					{#each navItems as item (item.href)}
						<a
							href={item.href}
							class="rounded-md px-2 py-1.5 text-sm font-medium transition-colors sm:px-3 {currentPath === item.href
								? 'bg-accent text-foreground'
								: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}"
						>
							{item.label}
						</a>
					{/each}
				</nav>
			</div>
			<div class="flex items-center gap-1">
				<!-- Desktop: Header actions inline -->
				{#if headerActions}
					<div class="hidden items-center gap-1 md:flex">
						{@render headerActions()}
						<div class="mx-1 h-4 w-px bg-border"></div>
					</div>
				{/if}
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

		<!-- Row 2: Mobile header actions -->
		{#if headerActions}
			<div class="mt-2 flex items-center justify-center gap-1 border-t border-border/30 pt-2 md:hidden">
				{@render headerActions()}
			</div>
		{/if}
	</header>

	<div class="flex min-h-0 flex-1">
		<!-- Desktop: Sidebar with collapse toggle -->
		{#if sidePanel}
			<div class="hidden shrink-0 md:flex">
				<!-- Expanded panel -->
				{#if desktopPanelOpen}
					<aside
						class="flex w-80 flex-col overflow-y-auto border-r border-border/50 bg-card/30"
						transition:slide={{ axis: 'x', duration: 200 }}
					>
						{@render sidePanel()}
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
		{/if}

		<!-- Main content area -->
		<main class="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
			<div class="mx-auto flex w-full max-w-[1500px] flex-col gap-3 sm:gap-4">
				<!-- Page-specific content (fretboard) -->
				{@render children()}

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
{#if sidePanel}
	<Sheet.Root bind:open={sidePanelOpen}>
		<Sheet.Content side="left" class="w-80 p-0">
			<Sheet.Header class="border-b border-border/50 px-4 py-3">
				<Sheet.Title>Settings</Sheet.Title>
			</Sheet.Header>
			<div class="h-[calc(100vh-57px)] overflow-y-auto">
				{@render sidePanel()}
			</div>
		</Sheet.Content>
	</Sheet.Root>
{/if}
