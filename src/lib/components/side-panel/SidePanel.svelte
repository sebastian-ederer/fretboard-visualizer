<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import { FretboardSettings } from '$lib/components/fretboard';
	import { MetronomeSettings } from '$lib/components/metronome';
	import { fretboardStore } from '$lib/fretboard';
	import Guitar from '@lucide/svelte/icons/guitar';
	import Timer from '@lucide/svelte/icons/timer';

	interface Props {
		store: typeof fretboardStore;
	}

	let { store }: Props = $props();
</script>

<div class="flex h-full flex-col">
	<Tabs.Root value="fretboard" class="flex h-full flex-col">
		<Tabs.List class="mx-3 mt-3 grid w-auto grid-cols-2">
			<Tabs.Trigger value="fretboard" class="gap-1.5">
				<Guitar class="h-4 w-4" />
				<span class="hidden sm:inline">Fretboard</span>
			</Tabs.Trigger>
			<Tabs.Trigger value="metronome" class="gap-1.5">
				<Timer class="h-4 w-4" />
				<span class="hidden sm:inline">Metronome</span>
			</Tabs.Trigger>
		</Tabs.List>

		<div class="flex-1 overflow-y-auto">
			<Tabs.Content value="fretboard" class="mt-0 p-3">
				<FretboardSettings {store} />
			</Tabs.Content>

			<Tabs.Content value="metronome" class="mt-0 p-3">
				<MetronomeSettings />
			</Tabs.Content>
		</div>
	</Tabs.Root>
</div>
