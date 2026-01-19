<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { COLOR_OPTIONS } from '$lib/fretboard/constants';
	import { createScrollHandler } from '$lib/utils/scroll-handler';

	interface Props {
		value: string;
		onValueChange: (value: string) => void;
		class?: string;
	}

	let { value, onValueChange, class: className = 'h-9 w-20' }: Props = $props();

	const handleScroll = createScrollHandler(
		() => COLOR_OPTIONS.map((c) => c.value),
		() => value,
		(v) => onValueChange(v)
	);
</script>

<Select.Root type="single" {value} onValueChange={(v) => v && onValueChange(v)}>
	<Select.Trigger class={className} onwheel={handleScroll}>
		<div class="flex items-center gap-2">
			<div
				class="h-4 w-4 rounded-full border border-border"
				style="background-color: {value}"
			></div>
		</div>
	</Select.Trigger>
	<Select.Content>
		{#each COLOR_OPTIONS as color (color.value)}
			<Select.Item value={color.value}>
				<div class="flex items-center gap-2">
					<div
						class="h-4 w-4 rounded-full border border-border"
						style="background-color: {color.value}"
					></div>
					<span>{color.label}</span>
				</div>
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
