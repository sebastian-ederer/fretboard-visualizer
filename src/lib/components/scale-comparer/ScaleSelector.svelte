<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { ColorSelect } from '$lib/components/ui/color-select';
	import { SCALE_OPTIONS } from '$lib/scale-comparer';
	import { createScrollHandler } from '$lib/utils/scroll-handler';
	import X from '@lucide/svelte/icons/x';

	interface Props {
		scale: string;
		color: string;
		onScaleChange: (value: string) => void;
		onColorChange: (value: string) => void;
		placeholder?: string;
		allowClear?: boolean;
		onClear?: () => void;
	}

	let {
		scale,
		color,
		onScaleChange,
		onColorChange,
		placeholder = 'Select scale',
		allowClear = false,
		onClear
	}: Props = $props();

	const scaleLabel = $derived(SCALE_OPTIONS.find((s) => s.value === scale)?.label || placeholder);

	const handleScaleScroll = createScrollHandler(
		() => SCALE_OPTIONS.map((s) => s.value),
		() => scale || SCALE_OPTIONS[0].value,
		(v) => onScaleChange(v)
	);
</script>

<div class="flex gap-2">
	<Select.Root
		type="single"
		value={scale || undefined}
		onValueChange={(v) => v && onScaleChange(v)}
	>
		<Select.Trigger class="h-9 flex-1" onwheel={handleScaleScroll}>
			{#if scale}
				{scaleLabel}
			{:else}
				<span class="text-muted-foreground">{placeholder}</span>
			{/if}
		</Select.Trigger>
		<Select.Content>
			{#each SCALE_OPTIONS as scaleOption (scaleOption.value)}
				<Select.Item value={scaleOption.value}>{scaleOption.label}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	<ColorSelect value={color} onValueChange={onColorChange} />

	{#if allowClear && scale && onClear}
		<Button
			variant="ghost"
			size="sm"
			class="h-9 w-9 p-0"
			onclick={onClear}
			title="Clear selection"
		>
			<X class="h-4 w-4" />
		</Button>
	{/if}
</div>
