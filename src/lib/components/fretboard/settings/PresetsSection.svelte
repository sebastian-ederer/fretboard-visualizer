<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { exportPresetsToFile, importPresetsFromFile, savePresets } from '$lib/fretboard/storage';
	import { createScrollHandler, handleArrowKeys } from '$lib/utils/scroll-handler';
	import type { fretboardStore as FretboardStoreType } from '$lib/fretboard/store.svelte';

	interface Props {
		store: typeof FretboardStoreType;
	}

	let { store }: Props = $props();
	const s = $derived(store.state);

	let fileInput: HTMLInputElement;

	const scrollPreset = createScrollHandler(
		() => Object.keys(s.savedPresets),
		() => s.selectedPresetName,
		(v) => (s.selectedPresetName = v)
	);

	function exportPresets() {
		exportPresetsToFile(s.savedPresets);
	}

	function importPresets(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		importPresetsFromFile(
			file,
			(imported) => {
				s.savedPresets = { ...s.savedPresets, ...imported };
				savePresets(s.savedPresets);
				input.value = '';
			},
			(error) => {
				console.error('Failed to import presets:', error);
				alert('Failed to import presets. Please check the file format.');
				input.value = '';
			}
		);
	}
</script>

<div class="border-b border-border/50 pb-4">
	<span class="mb-3 block text-sm font-medium text-muted-foreground">Presets</span>
	<div class="space-y-3">
		<!-- Save Preset -->
		<div class="space-y-1">
			<label for="preset-name-input" class="text-xs text-muted-foreground/70">Save As</label>
			<div class="flex gap-1">
				<input
					id="preset-name-input"
					type="text"
					bind:value={s.presetName}
					placeholder="Preset name..."
					class="h-9 flex-1 rounded-md border border-border bg-background px-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
					onkeydown={(e) => e.key === 'Enter' && store.savePreset()}
				/>
				<Button
					onclick={store.savePreset}
					variant="secondary"
					class="h-9 px-2"
					disabled={!s.presetName.trim()}
					aria-label="Save preset"
				>
					Save
				</Button>
			</div>
		</div>

		<!-- Load/Delete Preset -->
		{#if Object.keys(s.savedPresets).length > 0}
			<div class="space-y-1">
				<span id="preset-load-label" class="text-xs text-muted-foreground/70">Load Preset</span>
				<div class="flex gap-1">
					<Select.Root type="single" bind:value={s.selectedPresetName}>
						<Select.Trigger
							class="h-9 flex-1"
							onwheel={scrollPreset}
							onkeydown={(e) => {
								const presetNames = Object.keys(s.savedPresets);
								if (presetNames.length === 0) return;
								handleArrowKeys(
									e,
									presetNames,
									() => s.selectedPresetName,
									(v) => (s.selectedPresetName = v)
								);
							}}
							aria-labelledby="preset-load-label"
						>
							<span class="truncate">{s.selectedPresetName || 'Select...'}</span>
						</Select.Trigger>
						<Select.Content class="max-h-64 overflow-y-auto">
							{#each Object.keys(s.savedPresets) as name (name)}
								<Select.Item value={name}>{name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<Button
						onclick={store.loadPreset}
						variant="secondary"
						class="h-9 px-2"
						disabled={!s.selectedPresetName}
						aria-label="Load preset"
					>
						Load
					</Button>
					<Button
						onclick={store.deletePreset}
						variant="ghost"
						class="h-9 px-2 text-muted-foreground hover:text-destructive"
						disabled={!s.selectedPresetName}
						aria-label="Delete preset"
					>
						<Trash2 class="h-4 w-4" />
					</Button>
				</div>
			</div>
		{/if}

		<!-- Export/Import Presets -->
		<div class="space-y-1">
			<span class="text-xs text-muted-foreground/70">File</span>
			<div class="flex gap-1">
				<Button
					onclick={exportPresets}
					variant="outline"
					class="h-9 flex-1 px-2"
					disabled={Object.keys(s.savedPresets).length === 0}
				>
					Export
				</Button>
				<Button onclick={() => fileInput.click()} variant="outline" class="h-9 flex-1 px-2">
					Import
				</Button>
				<input
					type="file"
					accept=".json"
					bind:this={fileInput}
					onchange={importPresets}
					class="hidden"
				/>
			</div>
		</div>
	</div>
</div>
