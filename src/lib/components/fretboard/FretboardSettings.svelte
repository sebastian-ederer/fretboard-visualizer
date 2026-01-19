<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		PresetsSection,
		DisplaySection,
		ScaleSection,
		ShapeOverlaysSection,
		TuningSection
	} from './settings';
	import type { fretboardStore as FretboardStoreType } from '$lib/fretboard/store.svelte';

	interface Props {
		store: typeof FretboardStoreType;
	}

	let { store }: Props = $props();
</script>

<div class="space-y-4">
	<PresetsSection {store} />
	<DisplaySection {store} />
	<ScaleSection {store} />
	<ShapeOverlaysSection {store} />
	<TuningSection {store} />

	<!-- Clear All Button -->
	<Button variant="secondary" onclick={store.clearAll} class="w-full">Clear All Notes</Button>
</div>
