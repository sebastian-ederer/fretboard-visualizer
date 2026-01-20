/**
 * Strum Pattern audio generation using Tone.js
 * Uses real guitar samples for natural sound
 * Professional signal chain with:
 * - Pre-amp saturation (tube warmth)
 * - Velocity-to-filter mapping (dynamic brightness)
 * - Stereo width (Haas effect)
 */

import * as Tone from 'tone';
import type { StrumType } from './types';
import { getStrumDirection, isMuted, isAccented } from './types';
import { getChordFrequencies } from './chord-utils';
import {
	CABINET_IR_PATH,
	CABINET_MIX,
	MASTER_VOLUME,
	EQ_SETTINGS,
	COMPRESSOR_SETTINGS,
	REVERB_SETTINGS,
	LIMITER_THRESHOLD,
	SAMPLE_SETTINGS,
	MUTED_SETTINGS,
	UPSTROKE_SETTINGS,
	STRUM_DELAY,
	HUMANIZE,
	PREAMP_SETTINGS,
	VELOCITY_FILTER,
	STEREO_SETTINGS
} from './audio-config';

// Default guitar string frequencies (standard tuning)
const DEFAULT_FREQUENCIES = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

// ============================================
// Audio Nodes
// ============================================

// Samplers (real guitar samples)
let openSampler: Tone.Sampler | null = null;

// Muted/percussion synth (noise-based "chuck" sound)
let mutedSynth: Tone.NoiseSynth | null = null;
let mutedFilter: Tone.Filter | null = null;

// Pre-amp stage (adds harmonic richness)
let chebyshev: Tone.Chebyshev | null = null;
let overdrive: Tone.Distortion | null = null;
let overdriveGain: Tone.Gain | null = null;

// Per-string velocity filters (brightness control)
let velocityFilters: Tone.Filter[] = [];

// Cabinet
let cabinet: Tone.Convolver | null = null;
let cabinetMix: Tone.Gain | null = null;

// Stereo widening (Haas effect)
let stereoSplitter: Tone.Split | null = null;
let stereoMerger: Tone.Merge | null = null;
let leftChannel: Tone.Channel | null = null;
let rightChannel: Tone.Channel | null = null;
let rightDelay: Tone.Delay | null = null;
let rightPitchShift: Tone.PitchShift | null = null;

// Master chain
let masterCompressor: Tone.Compressor | null = null;
let masterEQ: Tone.EQ3 | null = null;
let masterReverb: Tone.Reverb | null = null;
let masterLimiter: Tone.Limiter | null = null;
let masterChannel: Tone.Channel | null = null;

let isInitialized = false;
let isInitializing = false;

// ============================================
// Configuration Helpers
// ============================================

/**
 * Build sample URLs from config
 */
function buildSampleUrls(): Record<string, string> {
	const urls: Record<string, string> = {};
	for (const [note, filename] of Object.entries(SAMPLE_SETTINGS.samples)) {
		urls[note] = SAMPLE_SETTINGS.basePath + filename;
	}
	return urls;
}

/**
 * Calculate filter frequency based on velocity
 * Hard strum = bright (high freq), soft strum = dark (low freq)
 */
function getVelocityFilterFrequency(velocity: number): number {
	const { minFrequency, maxFrequency } = VELOCITY_FILTER;
	// Exponential mapping for more natural response
	const normalizedVelocity = Math.pow(velocity, 0.7);
	return minFrequency + (maxFrequency - minFrequency) * normalizedVelocity;
}

// ============================================
// Initialization
// ============================================

export async function initializeAudio(): Promise<void> {
	if (isInitialized || isInitializing) return;
	isInitializing = true;

	try {
		// ========== SAMPLERS ==========
		const sampleUrls = buildSampleUrls();
		console.log('Loading guitar samples from:', sampleUrls);

		// Open string sampler
		openSampler = new Tone.Sampler({
			urls: sampleUrls,
			release: SAMPLE_SETTINGS.release,
			volume: SAMPLE_SETTINGS.volume,
			onload: () => console.log('Open string samples loaded')
		});

		// Muted/percussion synth (noise-based "chuck" sound)
		mutedSynth = new Tone.NoiseSynth({
			noise: {
				type: MUTED_SETTINGS.noiseType
			},
			envelope: {
				attack: MUTED_SETTINGS.attack,
				decay: MUTED_SETTINGS.decay,
				sustain: MUTED_SETTINGS.sustain,
				release: MUTED_SETTINGS.release
			},
			volume: MUTED_SETTINGS.volume
		});

		// Bandpass filter adds "guitar body" resonance to the noise
		mutedFilter = new Tone.Filter({
			type: MUTED_SETTINGS.filterType,
			frequency: MUTED_SETTINGS.filterFrequency,
			Q: MUTED_SETTINGS.filterQ
		});

		// Connect muted synth through its filter (will connect to master later)
		mutedSynth.connect(mutedFilter);
		console.log('Muted percussion synth created');

		// ========== PRE-AMP STAGE ==========
		chebyshev = new Tone.Chebyshev(PREAMP_SETTINGS.chebyshevOrder);
		overdrive = new Tone.Distortion(PREAMP_SETTINGS.overdriveAmount);
		overdriveGain = new Tone.Gain(Tone.dbToGain(PREAMP_SETTINGS.overdriveGain));

		// ========== VELOCITY FILTERS ==========
		velocityFilters = [];
		for (let i = 0; i < 6; i++) {
			const filter = new Tone.Filter({
				type: VELOCITY_FILTER.type,
				frequency: VELOCITY_FILTER.maxFrequency,
				Q: VELOCITY_FILTER.q
			});
			velocityFilters.push(filter);
		}

		// ========== CABINET (optional) ==========
		if (CABINET_IR_PATH && CABINET_MIX > 0) {
			console.log('Loading cabinet IR from:', CABINET_IR_PATH);
			cabinet = new Tone.Convolver(CABINET_IR_PATH);
			cabinetMix = new Tone.Gain(CABINET_MIX);
		} else {
			console.log('Cabinet IR bypassed (acoustic mode)');
			cabinet = null;
			cabinetMix = new Tone.Gain(1.0); // Pass-through gain
		}

		// Wait for all samples to load
		await Tone.loaded();
		console.log('All samples loaded successfully');

		// ========== STEREO WIDENING (HAAS EFFECT) ==========
		if (STEREO_SETTINGS.enabled) {
			stereoSplitter = new Tone.Split();
			stereoMerger = new Tone.Merge();

			leftChannel = new Tone.Channel({
				pan: -STEREO_SETTINGS.panAmount,
				volume: -1
			});

			rightDelay = new Tone.Delay(STEREO_SETTINGS.haasDelay);
			rightPitchShift = new Tone.PitchShift(STEREO_SETTINGS.detuneCents / 100);
			rightChannel = new Tone.Channel({
				pan: STEREO_SETTINGS.panAmount,
				volume: -1
			});
		}

		// ========== MASTER CHAIN ==========
		masterCompressor = new Tone.Compressor({
			threshold: COMPRESSOR_SETTINGS.threshold,
			ratio: COMPRESSOR_SETTINGS.ratio,
			attack: COMPRESSOR_SETTINGS.attack,
			release: COMPRESSOR_SETTINGS.release
		});

		masterEQ = new Tone.EQ3({
			low: EQ_SETTINGS.low,
			mid: EQ_SETTINGS.mid,
			high: EQ_SETTINGS.high,
			lowFrequency: EQ_SETTINGS.lowFrequency,
			highFrequency: EQ_SETTINGS.highFrequency
		});

		masterReverb = new Tone.Reverb({
			decay: REVERB_SETTINGS.decay,
			wet: REVERB_SETTINGS.wet,
			preDelay: REVERB_SETTINGS.preDelay
		});
		await masterReverb.generate();

		masterLimiter = new Tone.Limiter(LIMITER_THRESHOLD);

		masterChannel = new Tone.Channel({
			volume: MASTER_VOLUME
		});

		// ========== CONNECT THE SIGNAL CHAIN ==========

		// Pre-amp chain: Chebyshev -> Overdrive -> Gain
		chebyshev.connect(overdrive);
		overdrive.connect(overdriveGain!);

		// Connect velocity filters to pre-amp input
		velocityFilters.forEach((filter) => {
			filter.connect(chebyshev!);
		});

		// Samplers -> Velocity filters (we'll route dynamically during playback)
		// For simplicity, connect samplers to filter 0 as default routing point
		openSampler.connect(velocityFilters[0]);

		// Pre-amp -> Cabinet (or bypass)
		if (cabinet) {
			overdriveGain!.connect(cabinet);
			cabinet.connect(cabinetMix!);
		} else {
			// Bypass cabinet - connect directly to mix gain
			overdriveGain!.connect(cabinetMix!);
		}

		// Cabinet -> Stereo processing or direct to compressor
		if (STEREO_SETTINGS.enabled && stereoSplitter && stereoMerger && leftChannel && rightChannel) {
			cabinetMix!.connect(stereoSplitter);

			stereoSplitter.connect(leftChannel, 0);
			leftChannel.connect(stereoMerger, 0, 0);

			stereoSplitter.connect(rightDelay!, 1);
			rightDelay!.connect(rightPitchShift!);
			rightPitchShift!.connect(rightChannel);
			rightChannel.connect(stereoMerger, 0, 1);

			stereoMerger.connect(masterCompressor);
		} else {
			cabinetMix!.connect(masterCompressor);
		}

		// Muted percussion -> direct to compressor (bypasses guitar signal chain)
		mutedFilter!.connect(masterCompressor);

		// Master chain
		masterCompressor.connect(masterEQ);
		masterEQ.connect(masterReverb);
		masterReverb.connect(masterLimiter);
		masterLimiter.connect(masterChannel);
		masterChannel.toDestination();

		isInitialized = true;
		console.log('Audio system initialized with guitar samples');
	} catch (e) {
		console.error('Failed to initialize audio:', e);
		await createFallbackSynths();
	} finally {
		isInitializing = false;
	}
}

/**
 * Create fallback synths if samples fail to load
 */
async function createFallbackSynths(): Promise<void> {
	console.log('Using fallback PluckSynth (samples failed to load)');

	const filter = new Tone.Filter({
		frequency: 3000,
		type: 'lowpass'
	}).toDestination();

	// Create simple PluckSynth as fallback
	openSampler = null;
	mutedSynth = null;

	// We'll use a basic setup
	const fallbackSynth = new Tone.PluckSynth({
		attackNoise: 2,
		dampening: 4000,
		resonance: 0.98,
		release: 1.5,
		volume: -6
	});
	fallbackSynth.connect(filter);

	// Store reference for cleanup
	(window as unknown as Record<string, unknown>).__fallbackSynth = fallbackSynth;

	isInitialized = true;
}

/**
 * Ensure Tone.js audio context is started
 */
async function ensureAudioStarted(): Promise<void> {
	if (Tone.getContext().state !== 'running') {
		await Tone.start();
	}
	if (!isInitialized) {
		await initializeAudio();
	}
}

/**
 * Convert frequency to note name
 */
function frequencyToNote(freq: number): string {
	return Tone.Frequency(freq).toNote();
}

// ============================================
// Playback
// ============================================

/**
 * Schedule a strum sound using samples or noise synth
 */
export function scheduleStrum(
	time: number,
	strumType: StrumType,
	velocity: number,
	volume: number,
	chordName?: string | null
): void {
	if (strumType === 'rest') return;

	const direction = getStrumDirection(strumType);
	const muted = isMuted(strumType);
	const accented = isAccented(strumType);

	const finalVelocity = accented ? Math.min(velocity * 1.4, 1.0) : velocity;

	// Set master volume
	if (masterChannel) {
		const volumeDb = MASTER_VOLUME + (volume - 0.7) * 15;
		masterChannel.volume.rampTo(volumeDb, 0.05);
	}

	const now = Tone.now();
	const startTime = time > now ? time : now;

	// MUTED: Single percussive "chuck" sound (noise-based)
	if (muted) {
		if (!mutedSynth) {
			console.warn('Muted synth not initialized');
			return;
		}

		// Small timing variation for humanization
		const timeVariation = (Math.random() - 0.5) * HUMANIZE.timeVariation;
		const duration = MUTED_SETTINGS.decay + MUTED_SETTINGS.release;

		// Trigger the percussive hit
		mutedSynth.triggerAttackRelease(duration, startTime + timeVariation, finalVelocity);
		return;
	}

	// OPEN STRUM: Play each string with samples
	if (!openSampler) {
		console.warn('Sampler not initialized');
		return;
	}

	const frequencies = chordName ? getChordFrequencies(chordName, 3) : DEFAULT_FREQUENCIES;

	frequencies.forEach((freq, i) => {
		const stringIndex = direction === 'down' ? i : frequencies.length - 1 - i;
		const stringTime = startTime + stringIndex * STRUM_DELAY;

		// Humanization
		const timeVariation = (Math.random() - 0.5) * HUMANIZE.timeVariation * 2;
		const pitchVariation = 1 + (Math.random() - 0.5) * HUMANIZE.pitchVariation * 2;

		// Per-string velocity variation (simulates pick angle)
		const positionFactor = 1 - Math.abs(i - 2.5) / 5;
		let velocityVariation = 1 - HUMANIZE.velocityVariation + positionFactor * HUMANIZE.velocityVariation * 2;

		// Upstroke adjustment: boost high strings, reduce low strings
		if (direction === 'up') {
			// String 0 = low E (reduce), String 5 = high E (boost)
			const stringPosition = i / 5; // 0 to 1 (low to high)
			const upstrokeAdjust =
				-UPSTROKE_SETTINGS.lowStringReduction * (1 - stringPosition) +
				UPSTROKE_SETTINGS.highStringBoost * stringPosition;
			velocityVariation *= 1 + upstrokeAdjust;
		}

		const stringVelocity = Math.min(finalVelocity * velocityVariation, 1.0);

		// Velocity-to-Filter Mapping
		if (velocityFilters[i]) {
			let filterFreq = getVelocityFilterFrequency(stringVelocity);
			// Upstrokes are slightly brighter
			if (direction === 'up') {
				filterFreq = Math.min(filterFreq + UPSTROKE_SETTINGS.filterBoost, VELOCITY_FILTER.maxFrequency);
			}
			velocityFilters[i].frequency.setValueAtTime(filterFreq, stringTime + timeVariation);
		}

		const note = frequencyToNote(freq * pitchVariation);
		const actualTime = stringTime + timeVariation;

		// Trigger the sample with velocity
		openSampler!.triggerAttackRelease(note, SAMPLE_SETTINGS.release, actualTime, stringVelocity);
	});
}

/**
 * Play a preview strum (called on click)
 */
export function playStrumPreview(
	strumType: StrumType,
	volume: number = 0.7,
	chordName?: string | null
): void {
	if (strumType === 'rest') return;

	ensureAudioStarted().then(() => {
		scheduleStrum(Tone.now(), strumType, 0.8, volume, chordName);
	});
}

/**
 * Stop all sounds
 */
export function stopAllSounds(): void {
	openSampler?.releaseAll();
	// NoiseSynth doesn't have releaseAll, but it auto-releases
}

/**
 * Force re-initialization of audio
 */
export async function reinitializeAudio(): Promise<void> {
	disposeAudio();
	await initializeAudio();
}

/**
 * Dispose of all audio resources
 */
export function disposeAudio(): void {
	// Sampler
	openSampler?.dispose();
	openSampler = null;

	// Muted synth and filter
	mutedSynth?.dispose();
	mutedSynth = null;
	mutedFilter?.dispose();
	mutedFilter = null;

	// Velocity filters
	velocityFilters.forEach((f) => f.dispose());
	velocityFilters = [];

	// Pre-amp
	chebyshev?.dispose();
	overdrive?.dispose();
	overdriveGain?.dispose();
	chebyshev = null;
	overdrive = null;
	overdriveGain = null;

	// Cabinet
	cabinet?.dispose();
	cabinetMix?.dispose();
	cabinet = null;
	cabinetMix = null;

	// Stereo
	stereoSplitter?.dispose();
	stereoMerger?.dispose();
	leftChannel?.dispose();
	rightChannel?.dispose();
	rightDelay?.dispose();
	rightPitchShift?.dispose();
	stereoSplitter = null;
	stereoMerger = null;
	leftChannel = null;
	rightChannel = null;
	rightDelay = null;
	rightPitchShift = null;

	// Master
	masterCompressor?.dispose();
	masterEQ?.dispose();
	masterReverb?.dispose();
	masterLimiter?.dispose();
	masterChannel?.dispose();
	masterCompressor = null;
	masterEQ = null;
	masterReverb = null;
	masterLimiter = null;
	masterChannel = null;

	// Fallback synth cleanup
	const fallback = (window as unknown as Record<string, unknown>).__fallbackSynth;
	if (fallback && typeof (fallback as Tone.PluckSynth).dispose === 'function') {
		(fallback as Tone.PluckSynth).dispose();
	}

	isInitialized = false;
}
