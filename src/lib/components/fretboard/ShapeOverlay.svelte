<script lang="ts">
	import type { ActiveShape } from '$lib/fretboard/types';
	import {
		SHAPE_COLORS,
		SHAPE_BORDER_COLORS,
		THREE_NPS_FILL_COLOR,
		THREE_NPS_BORDER_COLOR
	} from '$lib/fretboard/constants';
	import {
		generateShapePath,
		isShapeVisible,
		isShapeLabelVisible,
		getShapeLabelPosition
	} from '$lib/fretboard/shape-utils';
	import { getPentatonicShapeColorIndex } from '$lib/fretboard/color-utils';
	import { getPentatonicShapeDisplayName } from '$lib/fretboard/music-utils';

	interface Props {
		shapes: ActiveShape[];
		type: 'pentatonic' | '3nps';
		appliedIsMajor?: boolean;
	}

	let { shapes, type, appliedIsMajor = true }: Props = $props();

	const isPentatonic = $derived(type === 'pentatonic');

	function getFillColor(shape: ActiveShape): string {
		if (!isPentatonic) return THREE_NPS_FILL_COLOR;
		return SHAPE_COLORS[getPentatonicShapeColorIndex(shape.name, appliedIsMajor)];
	}

	function getBorderColor(shape: ActiveShape): string {
		if (!isPentatonic) return THREE_NPS_BORDER_COLOR;
		return SHAPE_BORDER_COLORS[getPentatonicShapeColorIndex(shape.name, appliedIsMajor)];
	}

	function getShapeLabel(shape: ActiveShape): string {
		if (isPentatonic) {
			return `Shape ${getPentatonicShapeDisplayName(shape.name, appliedIsMajor)}`;
		}
		return `3NPS ${shape.name}`;
	}
</script>

{#if shapes.length > 0}
	<svg
		class="pointer-events-none absolute z-10"
		style="top: 48px; left: 24px; width: 1416px; height: 300px; isolation: isolate;"
	>
		{#each shapes as shape (shape.name + '-' + type + '-' + shape.startFret)}
			{#if isShapeVisible(shape) && shape.path}
				<path
					d={generateShapePath(shape)}
					fill={getFillColor(shape)}
					stroke={getBorderColor(shape)}
					stroke-width="2"
					stroke-linejoin="round"
				/>
			{/if}
		{/each}
	</svg>

	<!-- Shape labels (combined in single loop) -->
	{#each shapes as shape (shape.name + '-' + type + '-' + shape.startFret + '-label')}
		{#if shape.path && isShapeLabelVisible(shape)}
			{@const labelPos = getShapeLabelPosition(shape)}
			{@const fillColor = getFillColor(shape)}
			{@const borderColor = getBorderColor(shape)}
			<div
				class="pointer-events-none absolute z-20"
				style="left: {labelPos.x + 24}px; top: {labelPos.y + 40}px; transform: translateX(-50%);"
			>
				<span
					class="whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold"
					style="background-color: {fillColor}; color: {borderColor}; border: 1px solid {borderColor};"
				>
					{getShapeLabel(shape)}
				</span>
			</div>
		{/if}
	{/each}
{/if}
