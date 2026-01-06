<script lang="ts">
	import { Collapsible as CollapsiblePrimitive } from "bits-ui";
	import { slide } from "svelte/transition";
	import { cubicOut } from "svelte/easing";

	let { ref = $bindable(null), ...restProps }: CollapsiblePrimitive.ContentProps = $props();
</script>

<CollapsiblePrimitive.Content bind:ref data-slot="collapsible-content" {...restProps}>
	{#snippet child({ props, open })}
		{#if open}
			<div {...props} transition:slide={{ duration: 200, easing: cubicOut }}>
				{@render restProps.children?.()}
			</div>
		{/if}
	{/snippet}
</CollapsiblePrimitive.Content>
