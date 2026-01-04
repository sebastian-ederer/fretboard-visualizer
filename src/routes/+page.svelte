<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Settings from '@lucide/svelte/icons/settings';

	// Standard guitar tuning (high to low in display)
	const strings = ['E', 'B', 'G', 'D', 'A', 'E'];
	const fretCount = 15;

	// Fret markers (single dots and double dot at 12th)
	const singleDotFrets = [3, 5, 7, 9, 15];
	const doubleDotFret = 12;

	// Track selected frets: object map of "string-fret" to color
	let selectedFrets: Record<string, string> = $state({});

	// Painting state
	let isPainting = $state(false);
	let paintMode: 'add' | 'remove' = $state('add');

	// Settings state
	let settingsOpen = $state(false);

	// Color options - predefined colors that match the dark theme
	const presetColors = [
		'#a855f7', // Purple
		'#3b82f6', // Blue
		'#22c55e', // Green
		'#eab308', // Yellow
		'#f97316', // Orange
		'#ef4444' // Red
	];
	let selectedColor = $state(presetColors[0]);
	let customColor = $state('#ffffff');

	function selectPresetColor(color: string) {
		selectedColor = color;
	}

	function handleCustomColorChange(event: Event) {
		const input = event.target as HTMLInputElement;
		customColor = input.value;
		selectedColor = input.value;
	}

	function isSelected(stringIndex: number, fretIndex: number): boolean {
		return !!selectedFrets[`${stringIndex}-${fretIndex}`];
	}

	function getNoteColor(stringIndex: number, fretIndex: number): string {
		return selectedFrets[`${stringIndex}-${fretIndex}`] || selectedColor;
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
			selectedFrets[`${stringIndex}-${i}`] = selectedColor;
		}
	}

	function startPainting(stringIndex: number, fretIndex: number) {
		isPainting = true;
		paintMode = isSelected(stringIndex, fretIndex) ? 'remove' : 'add';
		applyPaint(stringIndex, fretIndex);
	}

	function stopPainting() {
		isPainting = false;
	}

	function applyPaint(stringIndex: number, fretIndex: number) {
		const key = `${stringIndex}-${fretIndex}`;
		if (paintMode === 'add') {
			selectedFrets[key] = selectedColor;
		} else {
			delete selectedFrets[key];
		}
	}

	function handlePaintOver(stringIndex: number, fretIndex: number) {
		if (isPainting) {
			applyPaint(stringIndex, fretIndex);
		}
	}
</script>

<svelte:window onmouseup={stopPainting} />

<div class="flex min-h-screen flex-col p-8">
	<header class="mb-12 text-center">
		<h1 class="mb-2 text-4xl font-bold tracking-tight">Fretboard Visualizer</h1>
		<p class="text-muted-foreground">Click and drag to paint notes on the fretboard</p>
	</header>

	<main class="flex flex-1 flex-col items-center gap-6">
		<div class="flex flex-col gap-4">
			<!-- Settings Section -->
			<Collapsible.Root bind:open={settingsOpen} class="w-full">
				<Collapsible.Trigger
					class="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card/50 px-4 py-3 transition-colors hover:bg-card"
				>
					<div class="flex items-center gap-2">
						<Settings class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm font-medium">Settings</span>
					</div>
					<ChevronDown
						class="h-4 w-4 text-muted-foreground transition-transform duration-200 {settingsOpen
							? 'rotate-180'
							: ''}"
					/>
				</Collapsible.Trigger>
				<Collapsible.Content class="mt-2 rounded-lg border border-border/50 bg-card/50 p-4">
					<div class="space-y-4">
						<div>
							<span class="mb-2 block text-sm font-medium text-muted-foreground">Note Color</span>
							<div class="flex items-center gap-3">
								{#each presetColors as color (color)}
									<button
										class="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 {selectedColor ===
										color
											? 'border-white ring-2 ring-white/30'
											: 'border-transparent'}"
										style="background-color: {color};"
										onclick={() => selectPresetColor(color)}
										aria-label="Select color {color}"
									></button>
								{/each}
								<!-- Custom color picker -->
								<div class="relative">
									<input
										type="color"
										value={customColor}
										onchange={handleCustomColorChange}
										class="absolute inset-0 h-8 w-8 cursor-pointer opacity-0"
										aria-label="Choose custom color"
									/>
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full p-[3px] transition-transform hover:scale-110 {selectedColor ===
											customColor && !presetColors.includes(selectedColor)
											? 'ring-2 ring-white/30'
											: ''}"
										style="background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);"
									>
										<div
											class="h-full w-full rounded-full"
											style="background-color: {customColor};"
										></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Collapsible.Content>
			</Collapsible.Root>

			<!-- Fretboard -->
			<div class="overflow-x-auto rounded-xl border border-border/50 bg-transparent p-6">
				<!-- Fret numbers -->
				<div class="mb-3 flex pl-10">
					{#each { length: fretCount + 1 }, fretIndex (fretIndex)}
						<div
							class="text-center text-xs font-medium text-muted-foreground {fretIndex === 0
								? 'w-8'
								: 'w-14'}"
						>
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
									<div
										class="relative z-10 flex h-10 items-center justify-center {fretIndex === 0
											? 'w-8 border-r-4 border-r-zinc-300 bg-zinc-900/30'
											: 'w-14 border-r-2 border-r-zinc-600'}"
									>
										<!-- Circular hit area for painting -->
										<button
											class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
											onmousedown={() => startPainting(stringIndex, fretIndex)}
											onmouseenter={() => handlePaintOver(stringIndex, fretIndex)}
										>
											{#if isSelected(stringIndex, fretIndex)}
												{@const noteColor = getNoteColor(stringIndex, fretIndex)}
												<div
													class="h-7 w-7 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110"
													style="background-color: {noteColor}; box-shadow: 0 10px 15px -3px {noteColor}80;"
												></div>
											{/if}
										</button>
									</div>
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
						<div
							class="flex items-center justify-center gap-1 {fretIndex === 0 ? 'w-8' : 'w-14'}"
						>
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

			<Button variant="secondary" class="self-center" onclick={clearAll}>Clear All</Button>
		</div>
	</main>
</div>
