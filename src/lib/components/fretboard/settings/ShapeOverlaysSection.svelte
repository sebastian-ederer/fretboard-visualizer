<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Info from '@lucide/svelte/icons/info';
	import { THREE_NPS_OPTIONS } from '$lib/fretboard/constants';
	import { createScrollHandler, handleArrowKeys } from '$lib/utils/scroll-handler';
	import type { fretboardStore as FretboardStoreType } from '$lib/fretboard/store.svelte';

	interface Props {
		store: typeof FretboardStoreType;
		showBorder?: boolean;
		headingClass?: string;
	}

	let { store, showBorder = true, headingClass = 'text-sm font-medium text-muted-foreground' }: Props = $props();
	const s = $derived(store.state);

	const scroll3NPSShape = createScrollHandler(
		() => THREE_NPS_OPTIONS,
		() => s.selected3NPSShape?.toString() ?? '1',
		(v) => (s.selected3NPSShape = parseInt(v)),
		() => store.recalculateShapes()
	);
</script>

<div class={showBorder ? 'border-b border-border/50 pb-4' : ''}>
	<span class="mb-3 flex items-center gap-1 {headingClass}">
		Shape Overlays
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger class="cursor-help">
					<Info class="h-4 w-4 text-muted-foreground/70" />
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Shape overlays only work in Standard tuning</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</span>
	<div class="space-y-3">
		<!-- Pentatonic shapes toggle -->
		<label class="flex cursor-pointer items-center gap-2">
			<Switch bind:checked={s.showShapeBoxes} />
			<span class="text-sm text-muted-foreground">Pentatonic Shapes</span>
		</label>

		<!-- 3NPS shapes toggle -->
		<label class="flex cursor-pointer items-center gap-2">
			<Switch bind:checked={s.show3NPSShapeBoxes} />
			<span class="text-sm text-muted-foreground">3NPS Shapes</span>
		</label>

		<!-- 3NPS Shape Selector -->
		{#if s.show3NPSShapeBoxes}
			<Select.Root
				type="single"
				value={s.selected3NPSShape.toString()}
				onValueChange={(v) => {
					s.selected3NPSShape = parseInt(v);
					store.recalculateShapes();
				}}
			>
				<Select.Trigger
					class="w-full"
					onwheel={scroll3NPSShape}
					onkeydown={(e) =>
						handleArrowKeys(
							e,
							THREE_NPS_OPTIONS,
							() => s.selected3NPSShape.toString(),
							(v) => {
								s.selected3NPSShape = parseInt(v);
								store.recalculateShapes();
							}
						)}
					aria-label="3NPS shape number"
				>
					Shape {s.selected3NPSShape}
				</Select.Trigger>
				<Select.Content class="max-h-64 overflow-y-auto">
					<Select.Item value="1">Shape 1</Select.Item>
					<Select.Item value="2">Shape 2</Select.Item>
					<Select.Item value="3">Shape 3</Select.Item>
					<Select.Item value="4">Shape 4</Select.Item>
					<Select.Item value="5">Shape 5</Select.Item>
					<Select.Item value="6">Shape 6</Select.Item>
					<Select.Item value="7">Shape 7</Select.Item>
				</Select.Content>
			</Select.Root>
		{/if}
	</div>
</div>
