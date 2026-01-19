<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import type { fretboardStore as FretboardStoreType } from '$lib/fretboard/store.svelte';

	interface Props {
		store: typeof FretboardStoreType;
	}

	let { store }: Props = $props();
	const s = $derived(store.state);
</script>

<div class="space-y-2">
	<label class="flex cursor-pointer items-center gap-2">
		<Switch bind:checked={s.showIntervals} />
		<span class="text-sm text-muted-foreground">Show intervals</span>
	</label>

	<label class="flex cursor-pointer items-center gap-2">
		<Switch bind:checked={s.useFlats} />
		<span class="text-sm text-muted-foreground">Use flats</span>
	</label>

	<label class="flex cursor-pointer items-center gap-2">
		<Switch bind:checked={s.highlightRootNotes} />
		<span class="text-sm text-muted-foreground">Highlight root notes</span>
	</label>

	{#if s.highlightRootNotes}
		<label class="flex cursor-pointer items-center gap-2">
			<div class="relative flex h-5 w-8 items-center justify-center">
				<input
					type="color"
					bind:value={s.rootNoteHighlightColor}
					class="absolute inset-0 cursor-pointer opacity-0"
					aria-label="Choose root note highlight color"
				/>
				<div
					class="h-5 w-5 rounded-full border border-white/20 transition-transform hover:scale-110"
					style="background-color: {s.rootNoteHighlightColor};"
				></div>
			</div>
			<span class="text-sm text-muted-foreground">Root note color</span>
		</label>
	{/if}
</div>
