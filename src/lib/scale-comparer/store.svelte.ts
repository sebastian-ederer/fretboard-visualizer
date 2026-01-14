import { SCALE_OPTIONS } from '$lib/fretboard/constants';
import { getScaleNotes, getStringBaseNotes, getScaleFrets, createFretKey } from '$lib/fretboard/music-utils';
import { fretboardStore } from '$lib/fretboard';

// Re-export for convenience
export { SCALE_OPTIONS };

// Default colors that are distinct from each other
const DEFAULT_PRIMARY_COLOR = '#0891b2'; // cyan
const DEFAULT_SECONDARY_COLOR = '#db2777'; // pink

function createScaleComparerStore() {
	const state = $state({
		primaryScale: 'pentatonic',
		primaryColor: DEFAULT_PRIMARY_COLOR,
		secondaryScale: '',
		secondaryColor: DEFAULT_SECONDARY_COLOR
	});

	// Get computed scale notes for primary scale
	const primaryScaleNotes = $derived.by(() => {
		const fs = fretboardStore.state;
		if (!state.primaryScale) return new Set<number>();
		return getScaleNotes(fs.selectedKey, fs.isMajor, state.primaryScale);
	});

	// Get computed scale notes for secondary scale
	const secondaryScaleNotes = $derived.by(() => {
		const fs = fretboardStore.state;
		if (!state.secondaryScale) return new Set<number>();
		return getScaleNotes(fs.selectedKey, fs.isMajor, state.secondaryScale);
	});

	// Calculate all fret positions for display
	const displayNotes = $derived.by(() => {
		const fs = fretboardStore.state;
		const stringBaseNotes = getStringBaseNotes(fs.strings);
		const notes: Record<string, { primary: boolean; secondary: boolean; color: string }> = {};

		// Add primary scale notes
		for (let stringIndex = 0; stringIndex < fs.strings.length; stringIndex++) {
			const frets = getScaleFrets(stringBaseNotes[stringIndex], primaryScaleNotes);
			for (const fret of frets) {
				const key = createFretKey(stringIndex, fret);
				notes[key] = { primary: true, secondary: false, color: state.primaryColor };
			}
		}

		// Add/overlay secondary scale notes
		for (let stringIndex = 0; stringIndex < fs.strings.length; stringIndex++) {
			const frets = getScaleFrets(stringBaseNotes[stringIndex], secondaryScaleNotes);
			for (const fret of frets) {
				const key = createFretKey(stringIndex, fret);
				if (notes[key]) {
					// Note exists in both scales
					notes[key].secondary = true;
				} else {
					// Note only in secondary scale
					notes[key] = { primary: false, secondary: true, color: state.secondaryColor };
				}
			}
		}

		return notes;
	});

	function setPrimaryScale(scale: string) {
		state.primaryScale = scale;
	}

	function setSecondaryScale(scale: string) {
		state.secondaryScale = scale;
	}

	function setPrimaryColor(color: string) {
		state.primaryColor = color;
	}

	function setSecondaryColor(color: string) {
		state.secondaryColor = color;
	}

	function clearSecondaryScale() {
		state.secondaryScale = '';
	}

	return {
		state,
		get primaryScaleNotes() { return primaryScaleNotes; },
		get secondaryScaleNotes() { return secondaryScaleNotes; },
		get displayNotes() { return displayNotes; },
		setPrimaryScale,
		setSecondaryScale,
		setPrimaryColor,
		setSecondaryColor,
		clearSecondaryScale
	};
}

export const scaleComparerStore = createScaleComparerStore();
