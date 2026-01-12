<script lang="ts">
	import type { ActiveShape } from '$lib/fretboard/types';
	import {
		SHAPE_COLORS,
		SHAPE_BORDER_COLORS,
		THREE_NPS_FILL_COLOR,
		THREE_NPS_BORDER_COLOR,
		STRING_LABEL_WIDTH,
		OPEN_FRET_WIDTH,
		FRET_WIDTH,
		FRET_COUNT,
		STRING_ROW_HEIGHT,
		FRETBOARD_PADDING_X,
		FRETBOARD_TOP_OFFSET,
		DEFAULT_STRING_COUNT
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

	// Calculated SVG dimensions from constants
	const svgWidth = STRING_LABEL_WIDTH + OPEN_FRET_WIDTH + FRET_COUNT * FRET_WIDTH;
	const svgHeight = STRING_ROW_HEIGHT * DEFAULT_STRING_COUNT + 60; // Extra space for visual padding
	// Label offset from shape coordinate system to DOM positioning
	const labelTopOffset = FRETBOARD_TOP_OFFSET - 8; // Adjust for visual alignment

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
		style="top: {FRETBOARD_TOP_OFFSET}px; left: {FRETBOARD_PADDING_X}px; width: {svgWidth}px; height: {svgHeight}px; isolation: isolate;"
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
				style="left: {labelPos.x + FRETBOARD_PADDING_X}px; top: {labelPos.y + labelTopOffset}px; transform: translateX(-50%);"
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
