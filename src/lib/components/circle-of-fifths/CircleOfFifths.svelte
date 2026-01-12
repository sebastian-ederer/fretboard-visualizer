<script lang="ts">
	import { fretboardStore } from '$lib/fretboard';
	import { getDisplayNote, getNoteIndex } from '$lib/fretboard/music-utils';

	const s = $derived(fretboardStore.state);

	// Circle of Fifths order (clockwise from top)
	const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
	const MINOR_KEYS = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'Eb', 'Bb', 'F', 'C', 'G', 'D'];

	// Diatonic chord intervals (semitones from root) and their quality
	// Major scale: I(M), ii(m), iii(m), IV(M), V(M), vi(m), vii°(dim)
	const MAJOR_SCALE_CHORDS = [
		{ interval: 0, quality: 'major' },   // I
		{ interval: 2, quality: 'minor' },   // ii
		{ interval: 4, quality: 'minor' },   // iii
		{ interval: 5, quality: 'major' },   // IV
		{ interval: 7, quality: 'major' },   // V
		{ interval: 9, quality: 'minor' },   // vi
		{ interval: 11, quality: 'dim' }     // vii°
	];

	// Natural minor scale: i(m), ii°(dim), III(M), iv(m), v(m), VI(M), VII(M)
	const MINOR_SCALE_CHORDS = [
		{ interval: 0, quality: 'minor' },   // i
		{ interval: 2, quality: 'dim' },     // ii°
		{ interval: 3, quality: 'major' },   // III
		{ interval: 5, quality: 'minor' },   // iv
		{ interval: 7, quality: 'minor' },   // v
		{ interval: 8, quality: 'major' },   // VI
		{ interval: 10, quality: 'major' }   // VII
	];

	// Get all diatonic chords for current key/mode
	const diatonicChords = $derived.by(() => {
		const rootIndex = getNoteIndex(s.selectedKey);
		const scaleChords = s.isMajor ? MAJOR_SCALE_CHORDS : MINOR_SCALE_CHORDS;

		return scaleChords.map(chord => ({
			noteIndex: (rootIndex + chord.interval) % 12,
			quality: chord.quality
		}));
	});

	// Check if a key is a diatonic chord and get its role
	function getDiatonicInfo(key: string, isMajorRing: boolean): { isDiatonic: boolean; isRoot: boolean } {
		const keyIndex = getNoteIndex(key);
		const selectedIndex = getNoteIndex(s.selectedKey);

		// Check if this is the root
		const isRoot = keyIndex === selectedIndex && s.isMajor === isMajorRing;

		// Find if this note is in diatonic chords with matching quality
		const matchingChord = diatonicChords.find(chord => {
			if (chord.noteIndex !== keyIndex) return false;
			// Major ring shows major chords, minor ring shows minor chords
			if (isMajorRing && chord.quality === 'major') return true;
			if (!isMajorRing && chord.quality === 'minor') return true;
			return false;
		});

		return {
			isDiatonic: !!matchingChord,
			isRoot
		};
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
		{#each MAJOR_KEYS as key, i}
			{@const pos = getPosition(i, LABEL_OUTER_RADIUS)}
			{@const info = getDiatonicInfo(key, true)}

			<path
				d={getArcPath(i, INNER_RADIUS + 2, OUTER_RADIUS)}
				class="transition-colors duration-150 {info.isRoot
					? 'fill-primary'
					: info.isDiatonic
						? 'fill-primary/40'
						: 'fill-muted/50 hover:fill-muted'}"
			/>

			<text
				x={pos.x}
				y={pos.y}
				text-anchor="middle"
				dominant-baseline="central"
				class="pointer-events-none select-none text-xs font-semibold transition-colors {info.isRoot
					? 'fill-primary-foreground'
					: info.isDiatonic
						? 'fill-primary-foreground'
						: 'fill-foreground'}"
			>
				{getDisplayNote(key, s.useFlats)}
			</text>
		{/each}

		<!-- Inner ring (Minor keys) -->
		{#each MINOR_KEYS as key, i}
			{@const pos = getPosition(i, LABEL_INNER_RADIUS)}
			{@const info = getDiatonicInfo(key, false)}

			<path
				d={getArcPath(i, 30, INNER_RADIUS)}
				class="transition-colors duration-150 {info.isRoot
					? 'fill-primary'
					: info.isDiatonic
						? 'fill-primary/40'
						: 'fill-muted/30 hover:fill-muted/50'}"
			/>

			<text
				x={pos.x}
				y={pos.y}
				text-anchor="middle"
				dominant-baseline="central"
				class="pointer-events-none select-none text-[10px] font-medium transition-colors {info.isRoot
					? 'fill-primary-foreground'
					: info.isDiatonic
						? 'fill-primary-foreground'
						: 'fill-muted-foreground'}"
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
</div>
