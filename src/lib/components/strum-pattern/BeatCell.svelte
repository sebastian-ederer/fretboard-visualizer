<script lang="ts">
	import type { StrumEvent, StrumType } from '$lib/strum-pattern/types';
	import { getStrumSymbol, isAccented, isMuted } from '$lib/strum-pattern/types';

	interface Props {
		strum: StrumEvent;
		isActive: boolean;
		beatIndex: number;
		subdivIndex: number;
		isFirstOfBeat: boolean;
		onclick: () => void;
	}

	let { strum, isActive, beatIndex, subdivIndex, isFirstOfBeat, onclick }: Props = $props();

	const symbol = $derived(getStrumSymbol(strum.type));
	const accented = $derived(isAccented(strum.type));
	const muted = $derived(isMuted(strum.type));
	const isRest = $derived(strum.type === 'rest');
</script>

<button
	class="relative flex h-12 w-10 items-center justify-center rounded-md border transition-all duration-75
		{isActive ? 'border-primary bg-primary/20 ring-2 ring-primary' : 'border-border/50 bg-card/50 hover:bg-card'}
		{isFirstOfBeat ? 'border-l-2 border-l-border' : ''}"
	onclick={onclick}
	title="Click to change strum type"
>
	<!-- Beat number indicator for first subdivision -->
	{#if isFirstOfBeat}
		<span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
			{beatIndex + 1}
		</span>
	{/if}

	<!-- Strum symbol -->
	<span
		class="text-lg font-bold select-none
			{isRest ? 'text-muted-foreground/50' : ''}
			{muted ? 'text-orange-400' : ''}
			{accented ? 'text-primary' : ''}"
	>
		{symbol}
	</span>

	<!-- Accent indicator -->
	{#if accented}
		<span class="absolute -top-1 right-0.5 text-[10px] text-primary">{'>'}</span>
	{/if}

	<!-- Direction arrow -->
	{#if !isRest && !muted}
		<span
			class="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground/70"
		>
			{strum.type.includes('down') ? '↓' : '↑'}
		</span>
	{/if}
</button>
