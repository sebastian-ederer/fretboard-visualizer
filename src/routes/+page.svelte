<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as ContextMenu from '$lib/components/ui/context-menu';

	// Standard guitar tuning (high to low in display)
	const strings = ['E', 'B', 'G', 'D', 'A', 'E'];
	const fretCount = 15;

	// Fret markers (single dots and double dot at 12th)
	const singleDotFrets = [3, 5, 7, 9, 15];
	const doubleDotFret = 12;

	// Track selected frets: object map of "string-fret" to boolean
	let selectedFrets: Record<string, boolean> = $state({});

	function toggleFret(stringIndex: number, fretIndex: number) {
		const key = `${stringIndex}-${fretIndex}`;
		if (selectedFrets[key]) {
			delete selectedFrets[key];
		} else {
			selectedFrets[key] = true;
		}
	}

	function isSelected(stringIndex: number, fretIndex: number): boolean {
		return !!selectedFrets[`${stringIndex}-${fretIndex}`];
	}

	function clearAll() {
		selectedFrets = {};
	}

	function clearString(stringIndex: number) {
		for (let i = 0; i <= fretCount; i++) {
			delete selectedFrets[`${stringIndex}-${i}`];
		}
	}

	function selectString(stringIndex: number) {
		for (let i = 0; i <= fretCount; i++) {
			selectedFrets[`${stringIndex}-${i}`] = true;
		}
	}
</script>

<div class="flex min-h-screen flex-col p-8">
	<header class="mb-12 text-center">
		<h1 class="mb-2 text-4xl font-bold tracking-tight">Fretboard Visualizer</h1>
		<p class="text-muted-foreground">Click on the frets to visualize notes and patterns</p>
	</header>

	<main class="flex flex-1 flex-col items-center gap-6">
		<div class="overflow-x-auto rounded-xl border border-border/50 bg-transparent p-6">
			<!-- Fret numbers -->
			<div class="mb-3 flex pl-10">
				{#each { length: fretCount + 1 }, fretIndex (fretIndex)}
					<div class="text-center text-xs font-medium text-muted-foreground {fretIndex === 0 ? 'w-8' : 'w-14'}">
						{fretIndex}
					</div>
				{/each}
			</div>

			<!-- Strings -->
			{#each strings as stringName, stringIndex (stringIndex)}
				<ContextMenu.Root>
					<ContextMenu.Trigger>
						<div class="group relative flex items-center">
							<div class="w-10 text-center text-sm font-semibold text-muted-foreground">
								{stringName}
							</div>

							<!-- String line -->
							<div
								class="pointer-events-none absolute left-10 right-0 bg-gradient-to-r from-zinc-400 via-zinc-300 to-zinc-400"
								style="height: {1 + stringIndex * 0.4}px;"
							></div>

							{#each { length: fretCount + 1 }, fretIndex (fretIndex)}
								<button
									class="relative z-10 flex h-10 items-center justify-center transition-colors hover:bg-white/5 {fretIndex === 0 ? 'w-8 border-r-4 border-r-zinc-300 bg-zinc-900/30' : 'w-14 border-r-2 border-r-zinc-600'}"
									onclick={() => toggleFret(stringIndex, fretIndex)}
								>
									{#if isSelected(stringIndex, fretIndex)}
										<div class="h-7 w-7 rounded-full border-2 border-white bg-primary shadow-lg shadow-primary/50 transition-transform hover:scale-110"></div>
									{/if}
								</button>
							{/each}
						</div>
					</ContextMenu.Trigger>
					<ContextMenu.Content class="w-48">
						<ContextMenu.Item onclick={() => selectString(stringIndex)}>
							Select all on {stringName} string
						</ContextMenu.Item>
						<ContextMenu.Item onclick={() => clearString(stringIndex)}>
							Clear {stringName} string
						</ContextMenu.Item>
						<ContextMenu.Separator />
						<ContextMenu.Item onclick={clearAll}>Clear all</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
			{/each}

			<!-- Fret markers -->
			<div class="mt-3 flex pl-10">
				{#each { length: fretCount + 1 }, fretIndex (fretIndex)}
					<div class="flex items-center justify-center gap-1 {fretIndex === 0 ? 'w-8' : 'w-14'}">
						{#if singleDotFrets.includes(fretIndex)}
							<div class="h-2 w-2 rounded-full bg-zinc-600"></div>
						{:else if fretIndex === doubleDotFret}
							<div class="h-2 w-2 rounded-full bg-zinc-600"></div>
							<div class="h-2 w-2 rounded-full bg-zinc-600"></div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<Button variant="secondary" onclick={clearAll}>Clear All</Button>
	</main>
</div>
