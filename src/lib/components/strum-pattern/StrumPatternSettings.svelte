<script lang="ts">
	import { strumPatternStore, PATTERN_PRESETS, SUBDIVISION_OPTIONS } from '$lib/strum-pattern';
	import { fretboardStore } from '$lib/fretboard';
	import { MetronomeSettings } from '$lib/components/metronome';
	import { createScrollHandler, handleArrowKeys } from '$lib/utils/scroll-handler';
	import { CHROMATIC_SCALE_SHARP } from '$lib/fretboard/constants';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import Music from '@lucide/svelte/icons/music';
	import Timer from '@lucide/svelte/icons/timer';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import X from '@lucide/svelte/icons/x';
	import Library from '@lucide/svelte/icons/library';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Zap from '@lucide/svelte/icons/zap';

	const s = $derived(strumPatternStore.state);
	const fs = $derived(fretboardStore.state);

	const scrollKey = createScrollHandler(
		() => [...CHROMATIC_SCALE_SHARP],
		() => fs.selectedKey,
		(v) => (fretboardStore.state.selectedKey = v)
	);

	let savePatternName = $state('');
	let selectedSavedPattern = $state('');
	let fileInputRef: HTMLInputElement;

	// Get current subdivision (use first beat as reference)
	const currentSubdivision = $derived(s.currentPattern.beats[0]?.subdivision ?? 2);
	const beatCount = $derived(s.currentPattern.beats.length);

	function handlePresetChange(presetId: string | undefined) {
		if (presetId) {
			strumPatternStore.loadPreset(presetId);
		}
	}

	function handleSubdivisionChange(subdivision: 1 | 2 | 3 | 4) {
		strumPatternStore.setAllSubdivisions(subdivision);
	}

	function handleSavePattern() {
		if (savePatternName.trim()) {
			strumPatternStore.savePattern(savePatternName.trim());
			savePatternName = '';
		}
	}

	function handleAddChord() {
		if (s.customChordInput.trim()) {
			// Add to first empty beat or last beat
			const emptyBeat = s.currentPattern.beats.findIndex((_, i) => {
				return !s.currentPattern.chordProgression.some(
					(slot) => i >= slot.beatIndex && i < slot.beatIndex + slot.duration
				);
			});
			const targetBeat = emptyBeat >= 0 ? emptyBeat : s.currentPattern.beats.length - 1;
			strumPatternStore.addCustomChord(targetBeat);
		}
	}

	function handleAddToLibrary() {
		strumPatternStore.addChordToLibraryFromInput();
	}

	// Handle drag start from chord library
	function handleLibraryChordDragStart(chord: string) {
		strumPatternStore.state.draggedChord = chord;
		strumPatternStore.state.showChordDropZones = true;
	}

	function handleLibraryChordDragEnd() {
		strumPatternStore.state.draggedChord = null;
		strumPatternStore.state.showChordDropZones = false;
	}

	function handleLoadSavedPattern() {
		if (selectedSavedPattern) {
			strumPatternStore.loadPreset(selectedSavedPattern);
		}
	}

	function handleDeleteSavedPattern() {
		if (selectedSavedPattern) {
			strumPatternStore.deletePattern(selectedSavedPattern);
			selectedSavedPattern = '';
		}
	}

	function handleImport(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		strumPatternStore.importPatterns(file).then((result) => {
			if (!result.success) {
				alert('Failed to import patterns: ' + (result.error || 'Unknown error'));
			}
			input.value = '';
		});
	}

	const scrollSavedPattern = createScrollHandler(
		() => Object.keys(s.savedPatterns),
		() => selectedSavedPattern,
		(v) => (selectedSavedPattern = v)
	);
</script>

<div class="flex h-full flex-col">
	<Tabs.Root value="pattern" class="flex h-full flex-col">
		<Tabs.List class="mx-3 mt-3 grid w-auto grid-cols-2">
			<Tabs.Trigger value="pattern" class="gap-1.5">
				<Music class="h-4 w-4" />
				<span class="hidden sm:inline">Pattern</span>
			</Tabs.Trigger>
			<Tabs.Trigger value="metronome" class="gap-1.5">
				<Timer class="h-4 w-4" />
				<span class="hidden sm:inline">Metronome</span>
			</Tabs.Trigger>
		</Tabs.List>

		<div class="flex-1 overflow-y-auto">
			<Tabs.Content value="pattern" class="mt-0 p-3">
				<div class="space-y-6">
					<!-- Pattern Presets -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Pattern Presets</h3>

						<div class="space-y-3">
							<!-- Built-in Presets -->
							<div class="space-y-1">
								<span class="text-xs text-muted-foreground/70">Built-in</span>
								<Select.Root
									type="single"
									value={s.currentPattern.id}
									onValueChange={handlePresetChange}
								>
									<Select.Trigger class="h-9 w-full">
										{s.currentPattern.name || 'Select preset...'}
									</Select.Trigger>
									<Select.Content class="max-h-64 overflow-y-auto">
										{#each PATTERN_PRESETS as preset (preset.id)}
											<Select.Item value={preset.id}>
												{preset.name}
												{#if preset.description}
													<span class="ml-2 text-xs text-muted-foreground">
														- {preset.description}
													</span>
												{/if}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>

							<!-- Save As -->
							<div class="space-y-1">
								<span class="text-xs text-muted-foreground/70">Save As</span>
								<div class="flex gap-1">
									<input
										type="text"
										bind:value={savePatternName}
										placeholder="Pattern name..."
										class="h-9 flex-1 rounded-md border border-border bg-background px-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
										onkeydown={(e) => e.key === 'Enter' && handleSavePattern()}
									/>
									<Button
										onclick={handleSavePattern}
										variant="secondary"
										class="h-9 px-2"
										disabled={!savePatternName.trim()}
									>
										Save
									</Button>
								</div>
							</div>

							<!-- Load/Delete Saved Pattern -->
							{#if Object.keys(s.savedPatterns).length > 0}
								<div class="space-y-1">
									<span class="text-xs text-muted-foreground/70">Load Saved</span>
									<div class="flex gap-1">
										<Select.Root
											type="single"
											value={selectedSavedPattern}
											onValueChange={(v) => v && (selectedSavedPattern = v)}
										>
											<Select.Trigger
												class="h-9 flex-1"
												onwheel={scrollSavedPattern}
												onkeydown={(e) => {
													const patternIds = Object.keys(s.savedPatterns);
													if (patternIds.length === 0) return;
													handleArrowKeys(
														e,
														patternIds,
														() => selectedSavedPattern,
														(v) => (selectedSavedPattern = v)
													);
												}}
											>
												<span class="truncate">
													{selectedSavedPattern
														? s.savedPatterns[selectedSavedPattern]?.name || selectedSavedPattern
														: 'Select...'}
												</span>
											</Select.Trigger>
											<Select.Content class="max-h-64 overflow-y-auto">
												{#each Object.values(s.savedPatterns) as preset (preset.id)}
													<Select.Item value={preset.id}>{preset.name}</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
										<Button
											onclick={handleLoadSavedPattern}
											variant="secondary"
											class="h-9 px-2"
											disabled={!selectedSavedPattern}
										>
											Load
										</Button>
										<Button
											onclick={handleDeleteSavedPattern}
											variant="ghost"
											class="h-9 px-2 text-muted-foreground hover:text-destructive"
											disabled={!selectedSavedPattern}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</div>
							{/if}

							<!-- Export/Import -->
							<div class="space-y-1">
								<span class="text-xs text-muted-foreground/70">File</span>
								<div class="flex gap-1">
									<Button
										onclick={strumPatternStore.exportPatterns}
										variant="outline"
										class="h-9 flex-1 px-2"
										disabled={Object.keys(s.savedPatterns).length === 0}
									>
										Export
									</Button>
									<Button
										onclick={() => fileInputRef?.click()}
										variant="outline"
										class="h-9 flex-1 px-2"
									>
										Import
									</Button>
									<input
										type="file"
										accept=".json"
										class="hidden"
										bind:this={fileInputRef}
										onchange={handleImport}
									/>
								</div>
							</div>
						</div>
					</div>

					<!-- Key and Mode -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Key</h3>
						<div class="grid grid-cols-2 gap-2">
							<!-- Key Selection -->
							<div class="space-y-1">
								<span
									id="strum-key-select-label"
									class="flex items-center gap-1 text-xs text-muted-foreground/70"
								>
									Root
									<Zap class="h-3 w-3" />
								</span>
								<Select.Root
									type="single"
									value={fs.selectedKey}
									onValueChange={(v) => v && (fretboardStore.state.selectedKey = v)}
								>
									<Select.Trigger
										class="w-full"
										onwheel={scrollKey}
										onkeydown={(e) =>
											handleArrowKeys(
												e,
												CHROMATIC_SCALE_SHARP,
												() => fs.selectedKey,
												(v) => (fretboardStore.state.selectedKey = v)
											)}
										aria-labelledby="strum-key-select-label"
									>
										{fs.selectedKey}
									</Select.Trigger>
									<Select.Content class="max-h-64 overflow-y-auto">
										{#each CHROMATIC_SCALE_SHARP as note (note)}
											<Select.Item value={note}>{note}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>

							<!-- Major/Minor Toggle -->
							<div class="space-y-1">
								<span id="strum-mode-toggle-label" class="text-xs text-muted-foreground/70">Mode</span>
								<div
									class="flex items-center rounded-md border border-border bg-background p-1"
									role="group"
									aria-labelledby="strum-mode-toggle-label"
								>
									<button
										class="flex-1 rounded px-2 py-1 text-sm transition-colors {fs.isMajor
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground hover:text-foreground'}"
										onclick={() => (fretboardStore.state.isMajor = true)}
										aria-pressed={fs.isMajor}
									>
										Major
									</button>
									<button
										class="flex-1 rounded px-2 py-1 text-sm transition-colors {!fs.isMajor
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground hover:text-foreground'}"
										onclick={() => (fretboardStore.state.isMajor = false)}
										aria-pressed={!fs.isMajor}
									>
										Minor
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Beat Count -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Beat Count</h3>
						<div class="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								class="h-9 w-9 p-0"
								onclick={() => strumPatternStore.removeBeat()}
								disabled={beatCount <= 1}
							>
								<Minus class="h-4 w-4" />
							</Button>
							<div class="flex h-9 min-w-[60px] items-center justify-center rounded-md border border-border bg-background px-3">
								<span class="text-lg font-semibold tabular-nums">{beatCount}</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								class="h-9 w-9 p-0"
								onclick={() => strumPatternStore.addBeat()}
								disabled={beatCount >= 16}
							>
								<Plus class="h-4 w-4" />
							</Button>
							<span class="text-xs text-muted-foreground">beats</span>
						</div>
						<p class="text-xs text-muted-foreground">
							Add more beats for longer chord progressions (1-16 beats)
						</p>
					</div>

					<!-- Subdivision - Quick Buttons -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Note Subdivision</h3>
						<div class="grid grid-cols-4 gap-1">
							{#each SUBDIVISION_OPTIONS as option (option.value)}
								<Button
									variant={currentSubdivision === option.value ? 'default' : 'outline'}
									size="sm"
									class="h-12 flex-col gap-0.5 px-1"
									onclick={() => handleSubdivisionChange(option.value as 1 | 2 | 3 | 4)}
								>
									<span class="text-lg leading-none">{option.symbol}</span>
									<span class="text-[10px] leading-none opacity-70">{option.shortLabel}</span>
								</Button>
							{/each}
						</div>
						<p class="text-xs text-muted-foreground">
							{currentSubdivision === 1 && 'Quarter notes - 1 strum per beat'}
							{currentSubdivision === 2 && 'Eighth notes - 2 strums per beat (most common)'}
							{currentSubdivision === 3 && 'Triplets - 3 strums per beat (shuffle feel)'}
							{currentSubdivision === 4 && 'Sixteenth notes - 4 strums per beat (fast patterns)'}
						</p>
					</div>

					<!-- Add Chord -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Add Chord</h3>
						<div class="flex gap-1">
							<input
								type="text"
								bind:value={s.customChordInput}
								oninput={(e) => strumPatternStore.setCustomChordInput(e.currentTarget.value)}
								placeholder="e.g., Am7, Gsus4, Cmaj7..."
								class="h-9 flex-1 rounded-md border border-border bg-background px-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										if (e.shiftKey) {
											handleAddToLibrary();
										} else {
											handleAddChord();
										}
									}
								}}
							/>
							<Button
								onclick={handleAddChord}
								variant="secondary"
								size="sm"
								class="h-9 px-2"
								disabled={!s.customChordInput.trim()}
								title="Add to progression"
							>
								<Plus class="h-4 w-4" />
							</Button>
							<Button
								onclick={handleAddToLibrary}
								variant="outline"
								size="sm"
								class="h-9 px-2"
								disabled={!s.customChordInput.trim()}
								title="Save to library"
							>
								<Library class="h-4 w-4" />
							</Button>
						</div>
						<p class="text-xs text-muted-foreground">
							<kbd class="rounded bg-muted px-1">Enter</kbd> adds to progression,
							<kbd class="rounded bg-muted px-1">Shift+Enter</kbd> saves to library
						</p>
					</div>

					<!-- Chord Library -->
					{#if s.chordLibrary.length > 0}
						<div class="space-y-3">
							<h3 class="flex items-center gap-2 text-sm font-semibold text-foreground">
								<Library class="h-4 w-4" />
								Chord Library
							</h3>
							<div class="flex flex-wrap gap-1.5">
								{#each s.chordLibrary as chord (chord)}
									<div
										class="group relative flex cursor-grab items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/10 active:cursor-grabbing"
										draggable="true"
										ondragstart={() => handleLibraryChordDragStart(chord)}
										ondragend={handleLibraryChordDragEnd}
										role="button"
										tabindex="0"
									>
										{chord}
										<button
											class="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/20 group-hover:opacity-100"
											onclick={(e) => {
												e.stopPropagation();
												strumPatternStore.removeFromChordLibrary(chord);
											}}
											title="Remove from library"
										>
											<X class="h-3 w-3 text-destructive" />
										</button>
									</div>
								{/each}
							</div>
							<p class="text-xs text-muted-foreground">
								Drag chords to the timeline or click to add
							</p>
						</div>
					{/if}

					<!-- Playback Options -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Playback</h3>
						<div class="space-y-2">
							<label class="flex cursor-pointer items-center gap-2">
								<Switch bind:checked={s.loopEnabled} />
								<span class="text-sm text-muted-foreground">Loop pattern</span>
							</label>
						</div>

						<!-- Volume -->
						<div class="space-y-1">
							<div class="flex items-center justify-between">
								<span class="text-xs text-muted-foreground">Strum Volume</span>
								<span class="text-xs text-muted-foreground tabular-nums">{Math.round(s.strumVolume * 100)}%</span>
							</div>
							<input
								type="range"
								min="0"
								max="1"
								step="0.05"
								value={s.strumVolume}
								oninput={(e) => strumPatternStore.setStrumVolume(parseFloat(e.currentTarget.value))}
								class="w-full accent-primary"
							/>
						</div>
					</div>

					<!-- Quick Actions -->
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">Actions</h3>
						<div class="flex gap-2">
							<Button
								onclick={strumPatternStore.resetPattern}
								variant="outline"
								size="sm"
								class="flex-1"
							>
								Reset Pattern
							</Button>
						</div>
					</div>

				</div>
			</Tabs.Content>

			<Tabs.Content value="metronome" class="mt-0 p-3">
				<MetronomeSettings />
			</Tabs.Content>
		</div>
	</Tabs.Root>
</div>
