<script lang="ts">
	import { onMount } from 'svelte';
	import { Fretboard, Settings } from '$lib/components/fretboard';
	import {
		fretboardStore,
		getNoteIndex,
		getDisplayNote,
		transposeNotes,
		calculatePentatonicShapes,
		calculate3NPSShapes,
		saveState,
		FRET_COUNT
	} from '$lib/fretboard';

	// Initialize store on mount
	onMount(() => {
		fretboardStore.initialize();
	});

	// Key transposition effect
	let previousKeyRef = $state(fretboardStore.selectedKey);
	$effect(() => {
		if (!fretboardStore.isLoaded) return;

		const oldKeyIndex = getNoteIndex(previousKeyRef);
		const newKeyIndex = getNoteIndex(fretboardStore.selectedKey);
		const semitoneShift = newKeyIndex - oldKeyIndex;

		if (semitoneShift !== 0) {
			// This would need to update selectedFrets through the store
			// For now, we'll call recalculateShapes
			fretboardStore.recalculateShapes();
			fretboardStore.pushHistory(true);
		}

		previousKeyRef = fretboardStore.selectedKey;
	});

	// Mode change effect
	let previousIsMajorRef = $state(fretboardStore.isMajor);
	$effect(() => {
		if (!fretboardStore.isLoaded) return;

		if (fretboardStore.isMajor !== previousIsMajorRef) {
			fretboardStore.recalculateShapes();
			fretboardStore.pushHistory(true);
			previousIsMajorRef = fretboardStore.isMajor;
		}
	});

	// Tuning change effect
	$effect(() => {
		if (!fretboardStore.isLoaded) return;
		fretboardStore.selectedTuningPreset; // Track
		fretboardStore.recalculateShapes();
	});

	// Auto-save effect
	$effect(() => {
		if (!fretboardStore.isLoaded) return;

		// Access all reactive values to track them
		fretboardStore.selectedFrets;
		fretboardStore.selectedKey;
		fretboardStore.isMajor;
		fretboardStore.appliedIsMajor;
		fretboardStore.selectedScale;
		fretboardStore.selectedColor;
		fretboardStore.customColor;
		fretboardStore.showShapeBoxes;
		fretboardStore.show3NPSShapeBoxes;
		fretboardStore.selected3NPSShape;
		fretboardStore.showIntervals;
		fretboardStore.useFlats;
		fretboardStore.eraseSelectedColorOnly;
		fretboardStore.lastAppliedScale;
		fretboardStore.scaleToRemove;
		fretboardStore.strings;
		fretboardStore.selectedTuningPreset;

		saveState({
			selectedFrets: fretboardStore.selectedFrets,
			selectedKey: fretboardStore.selectedKey,
			isMajor: fretboardStore.isMajor,
			appliedIsMajor: fretboardStore.appliedIsMajor,
			selectedScale: fretboardStore.selectedScale,
			selectedColor: fretboardStore.selectedColor,
			customColor: fretboardStore.customColor,
			showShapeBoxes: fretboardStore.showShapeBoxes,
			show3NPSShapeBoxes: fretboardStore.show3NPSShapeBoxes,
			selected3NPSShape: fretboardStore.selected3NPSShape,
			showIntervals: fretboardStore.showIntervals,
			useFlats: fretboardStore.useFlats,
			eraseSelectedColorOnly: fretboardStore.eraseSelectedColorOnly,
			lastAppliedScale: fretboardStore.lastAppliedScale,
			scaleToRemove: fretboardStore.scaleToRemove,
			strings: fretboardStore.strings,
			selectedTuningPreset: fretboardStore.selectedTuningPreset
		});
	});

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

	// Update 3NPS shapes when selection changes
	function update3NPSShape() {
		fretboardStore.recalculateShapes();
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
			<Settings
				bind:settingsOpen={fretboardStore.settingsOpen}
				canUndo={fretboardStore.canUndo}
				canRedo={fretboardStore.canRedo}
				undo={fretboardStore.undo}
				redo={fretboardStore.redo}
				bind:savedPresets={fretboardStore.savedPresets}
				bind:presetName={fretboardStore.presetName}
				bind:selectedPresetName={fretboardStore.selectedPresetName}
				savePreset={fretboardStore.savePreset}
				loadPreset={fretboardStore.loadPreset}
				deletePreset={fretboardStore.deletePreset}
				bind:selectedColor={fretboardStore.selectedColor}
				bind:customColor={fretboardStore.customColor}
				bind:eraseSelectedColorOnly={fretboardStore.eraseSelectedColorOnly}
				bind:showIntervals={fretboardStore.showIntervals}
				bind:useFlats={fretboardStore.useFlats}
				bind:selectedKey={fretboardStore.selectedKey}
				bind:isMajor={fretboardStore.isMajor}
				bind:selectedScale={fretboardStore.selectedScale}
				bind:scaleToRemove={fretboardStore.scaleToRemove}
				applyScale={fretboardStore.applyScale}
				removeScaleNotes={fretboardStore.removeScaleNotes}
				bind:showShapeBoxes={fretboardStore.showShapeBoxes}
				bind:show3NPSShapeBoxes={fretboardStore.show3NPSShapeBoxes}
				bind:selected3NPSShape={fretboardStore.selected3NPSShape}
				{update3NPSShape}
				bind:selectedTuningPreset={fretboardStore.selectedTuningPreset}
				bind:strings={fretboardStore.strings}
				applyTuningPreset={fretboardStore.applyTuningPreset}
				pushHistory={fretboardStore.pushHistory}
				clearAll={fretboardStore.clearAll}
			/>

			<!-- Fretboard -->
			<Fretboard
				strings={fretboardStore.strings}
				stringBaseNotes={fretboardStore.stringBaseNotes}
				selectedFrets={fretboardStore.selectedFrets}
				selectedKey={fretboardStore.selectedKey}
				showIntervals={fretboardStore.showIntervals}
				useFlats={fretboardStore.useFlats}
				selectedColor={fretboardStore.selectedColor}
				showShapeBoxes={fretboardStore.showShapeBoxes}
				show3NPSShapeBoxes={fretboardStore.show3NPSShapeBoxes}
				activeShapes={fretboardStore.activeShapes}
				active3NPSShapes={fretboardStore.active3NPSShapes}
				appliedIsMajor={fretboardStore.appliedIsMajor}
				selectedTuningPreset={fretboardStore.selectedTuningPreset}
				isSelected={fretboardStore.isSelected}
				getNoteColor={fretboardStore.getNoteColor}
				startPainting={fretboardStore.startPainting}
				handlePaintOver={fretboardStore.handlePaintOver}
				selectString={fretboardStore.selectString}
				clearString={fretboardStore.clearString}
				clearAll={fretboardStore.clearAll}
			/>
		</div>
	</main>
</div>
