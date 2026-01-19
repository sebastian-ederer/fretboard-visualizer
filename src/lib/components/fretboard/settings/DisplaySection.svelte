<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { DisplayToggles } from '$lib/components/shared';
	import { PRESET_COLORS } from '$lib/fretboard/constants';
	import type { fretboardStore as FretboardStoreType } from '$lib/fretboard/store.svelte';

	interface Props {
		store: typeof FretboardStoreType;
	}

	let { store }: Props = $props();
	const s = $derived(store.state);

	function selectPresetColor(color: string) {
		s.selectedColor = color;
	}

	function handleCustomColorChange(event: Event) {
		const input = event.target as HTMLInputElement;
		s.customColor = input.value;
		s.selectedColor = input.value;
	}
</script>

<div class="border-b border-border/50 pb-4">
	<span class="mb-3 block text-sm font-medium text-muted-foreground">Display</span>
	<div class="space-y-3">
		<!-- Note Color -->
		<div class="space-y-1">
			<span class="text-xs text-muted-foreground/70">Color</span>
			<div class="flex flex-wrap items-center gap-1">
				{#each PRESET_COLORS as color (color)}
					<button
						class="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 {s.selectedColor ===
						color
							? 'border-white ring-1 ring-white/30'
							: 'border-transparent'}"
						style="background-color: {color};"
						onclick={() => selectPresetColor(color)}
						aria-label="Select color {color}"
					></button>
				{/each}
				<div class="relative">
					<input
						type="color"
						value={s.customColor}
						onchange={handleCustomColorChange}
						class="absolute inset-0 h-6 w-6 cursor-pointer opacity-0"
						aria-label="Choose custom color"
					/>
					<div
						class="flex h-6 w-6 items-center justify-center rounded-full p-[2px] transition-transform hover:scale-110 {s.selectedColor ===
							s.customColor && !PRESET_COLORS.includes(s.selectedColor)
							? 'ring-1 ring-white/30'
							: ''}"
						style="background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);"
					>
						<div
							class="h-full w-full rounded-full"
							style="background-color: {s.customColor};"
						></div>
					</div>
				</div>
			</div>
		</div>

		<!-- Toggle Options -->
		<div class="space-y-2">
			<label class="flex cursor-pointer items-center gap-2">
				<Switch bind:checked={s.eraseSelectedColorOnly} />
				<span class="text-sm text-muted-foreground">Erase color only</span>
			</label>

			<DisplayToggles {store} />
		</div>
	</div>
</div>
