<script lang="ts">
	import { fretboardStore } from '$lib/fretboard';
	import {
		CIRCLE_OF_FIFTHS_MAJOR,
		CIRCLE_OF_FIFTHS_MINOR,
		MAJOR_SCALE_CHORDS,
		MINOR_SCALE_CHORDS
	} from '$lib/fretboard/constants';
	import { getDisplayNote, getNoteIndex } from '$lib/fretboard/music-utils';

	const s = $derived(fretboardStore.state);

	// Colors for each chord degree (I through VII)
	// Chosen to avoid overlap with fretboard preset colors:
	// (purple #a855f7, blue #3b82f6, green #22c55e, yellow #eab308, orange #f97316, red #ef4444)
	const DEGREE_COLORS = [
		{ bg: '#0891b2', text: '#ffffff' }, // I - cyan-600 (tonic)
		{ bg: '#7c3aed', text: '#ffffff' }, // ii - violet-600
		{ bg: '#0d9488', text: '#ffffff' }, // iii - teal-600
		{ bg: '#65a30d', text: '#ffffff' }, // IV - lime-600 (subdominant)
		{ bg: '#ca8a04', text: '#ffffff' }, // V - yellow-700 (dominant)
		{ bg: '#db2777', text: '#ffffff' }, // vi - pink-600 (relative minor)
		{ bg: '#be123c', text: '#ffffff' } // vii° - rose-700 (diminished)
	] as const;

	// Roman numerals for legend
	const MAJOR_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
	const MINOR_NUMERALS = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

	// Get all diatonic chords for current key/mode with degree info
	const diatonicChords = $derived.by(() => {
		const rootIndex = getNoteIndex(s.selectedKey);
		const scaleChords = s.isMajor ? MAJOR_SCALE_CHORDS : MINOR_SCALE_CHORDS;

		return scaleChords.map((chord, degree) => ({
			noteIndex: (rootIndex + chord.interval) % 12,
			quality: chord.quality,
			degree
		}));
	});

	// Check if a key is a diatonic chord and get its degree
	function getDiatonicInfo(
		key: string,
		isMajorRing: boolean
	): { isDiatonic: boolean; degree: number | null } {
		const keyIndex = getNoteIndex(key);

		// Find if this note is in diatonic chords with matching quality
		const matchingChord = diatonicChords.find((chord) => {
			if (chord.noteIndex !== keyIndex) return false;
			// Major ring shows major chords, minor ring shows minor chords
			if (isMajorRing && chord.quality === 'major') return true;
			if (!isMajorRing && (chord.quality === 'minor' || chord.quality === 'dim')) return true;
			return false;
		});

		return {
			isDiatonic: !!matchingChord,
			degree: matchingChord?.degree ?? null
		};
	}

	// Get color for a chord degree
	function getDegreeColor(degree: number | null): { bg: string; text: string } | null {
		if (degree === null) return null;
		return DEGREE_COLORS[degree];
	}

	// Get legend items based on current mode
	const legendItems = $derived.by(() => {
		const numerals = s.isMajor ? MAJOR_NUMERALS : MINOR_NUMERALS;
		return numerals.map((numeral, i) => ({
			numeral,
			color: DEGREE_COLORS[i]
		}));
	});

	// Track currently highlighted chord for toggle behavior
	let activeChord = $state<{ key: string; isMajor: boolean } | null>(null);

	// Handle chord click - highlight chord notes on fretboard (toggle behavior)
	function handleChordClick(key: string, isMajor: boolean, degree: number | null) {
		// If clicking the same chord, clear highlights
		if (activeChord?.key === key && activeChord?.isMajor === isMajor) {
			fretboardStore.clearHighlights();
			activeChord = null;
			return;
		}

		const quality = isMajor ? 'major' : 'minor';
		// Use degree color if diatonic, otherwise use a neutral gray
		const color = degree !== null ? DEGREE_COLORS[degree].bg : '#71717a';
		fretboardStore.highlightChordNotes(key, quality, color);
		activeChord = { key, isMajor };
	}

	// SVG dimensions
	const SIZE = 280;
	const CENTER = SIZE / 2;
	const OUTER_RADIUS = 115;
	const INNER_RADIUS = 75;
	const LABEL_OUTER_RADIUS = 95;
	const LABEL_INNER_RADIUS = 55;

	// Calculate position for a key at given index
	function getPosition(index: number, radius: number) {
		const angle = (index * 30 - 90) * (Math.PI / 180); // Start at top, go clockwise
		return {
			x: CENTER + radius * Math.cos(angle),
			y: CENTER + radius * Math.sin(angle)
		};
	}

	// Generate arc path for a segment
	function getArcPath(index: number, innerR: number, outerR: number) {
		const startAngle = (index * 30 - 105) * (Math.PI / 180);
		const endAngle = (index * 30 - 75) * (Math.PI / 180);

		const x1 = CENTER + innerR * Math.cos(startAngle);
		const y1 = CENTER + innerR * Math.sin(startAngle);
		const x2 = CENTER + outerR * Math.cos(startAngle);
		const y2 = CENTER + outerR * Math.sin(startAngle);
		const x3 = CENTER + outerR * Math.cos(endAngle);
		const y3 = CENTER + outerR * Math.sin(endAngle);
		const x4 = CENTER + innerR * Math.cos(endAngle);
		const y4 = CENTER + innerR * Math.sin(endAngle);

		return `M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 0 0 ${x1} ${y1}`;
	}

	</script>

<div class="flex flex-col items-center rounded-lg border border-border/50 bg-card/50 p-2 sm:p-4">
	<h3 class="mb-1 text-xs font-medium text-muted-foreground sm:mb-2 sm:text-sm">Circle of Fifths</h3>

	<svg viewBox="0 0 {SIZE} {SIZE}" class="h-auto w-full max-w-[180px] sm:max-w-[240px] md:max-w-[280px]">
		<!-- Background circle -->
		<circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS + 5} fill="none" class="stroke-border/30" stroke-width="1" />

		<!-- Outer ring (Major keys) -->
		{#each CIRCLE_OF_FIFTHS_MAJOR as key, i (key)}
			{@const pos = getPosition(i, LABEL_OUTER_RADIUS)}
			{@const info = getDiatonicInfo(key, true)}
			{@const color = getDegreeColor(info.degree)}

			<path
				d={getArcPath(i, INNER_RADIUS + 2, OUTER_RADIUS)}
				fill={color?.bg ?? undefined}
				class="cursor-pointer transition-colors duration-150 {!color
					? 'fill-muted/50 hover:fill-muted'
					: 'hover:opacity-80'}"
				onclick={() => handleChordClick(key, true, info.degree)}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Enter' && handleChordClick(key, true, info.degree)}
			/>

			<text
				x={pos.x}
				y={pos.y}
				text-anchor="middle"
				dominant-baseline="central"
				fill={color?.text ?? undefined}
				class="pointer-events-none select-none text-xs font-semibold transition-colors {!color
					? 'fill-foreground'
					: ''}"
			>
				{getDisplayNote(key, s.useFlats)}
			</text>
		{/each}

		<!-- Inner ring (Minor keys) -->
		{#each CIRCLE_OF_FIFTHS_MINOR as key, i (key)}
			{@const pos = getPosition(i, LABEL_INNER_RADIUS)}
			{@const info = getDiatonicInfo(key, false)}
			{@const color = getDegreeColor(info.degree)}

			<path
				d={getArcPath(i, 30, INNER_RADIUS)}
				fill={color?.bg ?? undefined}
				class="cursor-pointer transition-colors duration-150 {!color
					? 'fill-muted/30 hover:fill-muted/50'
					: 'hover:opacity-80'}"
				onclick={() => handleChordClick(key, false, info.degree)}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Enter' && handleChordClick(key, false, info.degree)}
			/>

			<text
				x={pos.x}
				y={pos.y}
				text-anchor="middle"
				dominant-baseline="central"
				fill={color?.text ?? undefined}
				class="pointer-events-none select-none text-[10px] font-medium transition-colors {!color
					? 'fill-muted-foreground'
					: ''}"
			>
				{getDisplayNote(key, s.useFlats)}m
			</text>
		{/each}

		<!-- Center circle -->
		<circle cx={CENTER} cy={CENTER} r="28" class="fill-background stroke-border/50" stroke-width="1" />

		<!-- Current key display in center -->
		<text
			x={CENTER}
			y={CENTER - 4}
			text-anchor="middle"
			dominant-baseline="central"
			class="fill-foreground text-lg font-bold"
		>
			{getDisplayNote(s.selectedKey, s.useFlats)}{s.isMajor ? '' : 'm'}
		</text>
		<text
			x={CENTER}
			y={CENTER + 12}
			text-anchor="middle"
			dominant-baseline="central"
			class="fill-muted-foreground text-[9px]"
		>
			{s.isMajor ? 'Major' : 'Minor'}
		</text>
	</svg>

	<!-- Legend -->
	<div class="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1 sm:mt-3">
		{#each legendItems as item (item.numeral)}
			<div class="flex items-center gap-1">
				<div
					class="h-3 w-3 rounded-sm sm:h-3.5 sm:w-3.5"
					style="background-color: {item.color.bg}"
				></div>
				<span class="text-[10px] text-muted-foreground sm:text-xs">{item.numeral}</span>
			</div>
		{/each}
	</div>
</div>
