/**
 * Audio Configuration - Clean Acoustic Guitar Tone
 * Optimized for natural, warm acoustic sound
 */

// Cabinet IR path (set to empty string to bypass for pure acoustic)
export const CABINET_IR_PATH = './acoustic-cab.wav';

// Cabinet mix (0.0 = bypass, 1.0 = full wet)
// For acoustic guitar, we skip the cabinet IR entirely
export const CABINET_MIX = 0.0;

// Master volume in dB
export const MASTER_VOLUME = -3;

/**
 * Pre-Amp Settings
 * For acoustic: minimal processing to preserve natural tone
 * Set to very subtle values - just enough to add slight warmth
 */
export const PREAMP_SETTINGS = {
	// Chebyshev waveshaper order (1 = bypass, 2-3 = subtle warmth)
	// For acoustic, we want minimal coloration
	chebyshevOrder: 1,

	// Overdrive amount (0.0 = clean, no distortion)
	// Acoustic guitars should be clean
	overdriveAmount: 0.0,

	// Overdrive output gain compensation in dB
	overdriveGain: 0
};

/**
 * Velocity Filter Settings
 * Links pick attack strength to brightness (critical for realism)
 * Hard strum = bright, soft strum = dark
 */
export const VELOCITY_FILTER = {
	// Filter type
	type: 'lowpass' as const,

	// Base frequency when velocity = 0 (dark/muted sound)
	// Higher min for acoustic - even soft strums have body
	minFrequency: 1200,

	// Max frequency when velocity = 1 (bright/open sound)
	// Higher max for acoustic sparkle
	maxFrequency: 8000,

	// Filter Q (resonance) - lower for smoother, more natural response
	q: 0.7
};

/**
 * Stereo Width Settings (Haas Effect)
 * For acoustic: subtle width, natural feel
 */
export const STEREO_SETTINGS = {
	// Enable stereo widening
	enabled: true,

	// Pan amount for each side (0.0 = center, 1.0 = hard pan)
	// Subtle for acoustic - like a single guitar in a room
	panAmount: 0.35,

	// Delay for the right channel in seconds
	// Shorter delay for tighter, more focused sound
	haasDelay: 0.012,

	// Detune for the right channel in cents
	// Zero for acoustic - we want ONE guitar, not a doubled effect
	detuneCents: 0
};

/**
 * EQ Settings
 * Shape the frequency balance for natural acoustic tone
 */
export const EQ_SETTINGS = {
	// Low: slight cut to reduce boominess
	low: -1,
	// Mid: gentle boost for body and warmth
	mid: 1.5,
	// High: slight cut to soften pick attack
	high: -2,
	// Frequency crossover points
	lowFrequency: 120,
	highFrequency: 4500
};

/**
 * Compressor Settings
 * Gentle compression to even out dynamics while preserving natural feel
 */
export const COMPRESSOR_SETTINGS = {
	// Higher threshold = less compression, more dynamics
	threshold: -18,
	// Lower ratio for transparent compression
	ratio: 2.5,
	// Slower attack lets transients through (pick attack)
	attack: 0.015,
	// Medium release for natural decay
	release: 0.2
};

/**
 * Reverb Settings
 * Natural room ambience for acoustic guitar
 */
export const REVERB_SETTINGS = {
	// Decay time in seconds - medium room
	decay: 1.5,
	// Wet mix - subtle but present
	wet: 0.18,
	// Pre-delay adds sense of space
	preDelay: 0.015
};

/**
 * Limiter threshold in dB
 */
export const LIMITER_THRESHOLD = -2;

/**
 * Guitar Sample Settings
 * Using real multi-velocity guitar samples for natural sound
 *
 * These samples are from a professional sample library with:
 * - ff (fortissimo) - loud/hard pick
 * - mf (mezzo-forte) - medium pick
 * - pp (pianissimo) - soft pick
 */
export const SAMPLE_SETTINGS = {
	// Base path for samples
	basePath: '/1644mono/',

	// Sample mapping for medium velocity (mf) - main samples
	// Tone.Sampler will pitch-shift to play other notes
	samples: {
		E2: 'Guitar.mf.sulE.E2B2.wav',
		A2: 'Guitar.mf.sulA.A2B2.wav',
		D3: 'Guitar.mf.sulD.D3B3.wav',
		G3: 'Guitar.mf.sulG.G3B3.wav',
		B3: 'Guitar.mf.sulB.B3.wav',
		E4: 'Guitar.mf.sul_E.E4B4.wav'
	} as Record<string, string>,

	// Sampler release time
	release: 2.0,

	// Volume in dB
	volume: -2
};

/**
 * Muted String Settings
 * Percussive "thump" - mimics palm slap on guitar bridge
 */
export const MUTED_SETTINGS = {
	// Brown noise has more low-frequency energy = "heavy" thump
	noiseType: 'brown' as const,

	// Bandpass filter centered at 300Hz removes hiss and rumble
	// Leaves only the "knock" sound of wood
	filterType: 'bandpass' as const,
	filterFrequency: 300,
	filterQ: 3, // High Q adds resonant "knock" character

	// Very short envelope = "choked" sound like hand on strings
	attack: 0.002,
	decay: 0.05,
	sustain: 0,
	release: 0.05,

	// Volume in dB
	volume: -10
};

/**
 * Upstroke Settings
 * Upstrokes naturally emphasize higher strings
 */
export const UPSTROKE_SETTINGS = {
	// Velocity boost for high strings (0 = none, 0.3 = 30% louder)
	highStringBoost: 0.25,
	// Velocity reduction for low strings
	lowStringReduction: 0.15,
	// Slightly brighter tone for upstrokes
	filterBoost: 500
};

/**
 * Strum Timing
 * Time between each string in a strum (in seconds)
 */
export const STRUM_DELAY = 0.018; // Slightly faster for crisp acoustic strums

/**
 * Humanization Settings
 * Adds natural variation to avoid machine-like precision
 */
export const HUMANIZE = {
	// Timing variation in seconds
	timeVariation: 0.006,
	// Pitch micro-variation (very subtle)
	pitchVariation: 0.001,
	// Per-string velocity variation (simulates pick angle differences)
	velocityVariation: 0.12
};
