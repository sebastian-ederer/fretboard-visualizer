import type { ClickSound } from './types';
import { SOUND_FREQUENCIES } from './constants';

let audioContext: AudioContext | null = null;

/**
 * Get or create the AudioContext (lazy initialization for browser autoplay policy)
 */
export function getAudioContext(): AudioContext {
	if (!audioContext) {
		audioContext = new AudioContext();
	}
	// Resume if suspended (required after user interaction)
	if (audioContext.state === 'suspended') {
		audioContext.resume();
	}
	return audioContext;
}

/**
 * Schedule a click sound at a specific time
 */
export function scheduleClick(
	time: number,
	isAccent: boolean,
	clickSound: ClickSound,
	volume: number
): void {
	const ctx = getAudioContext();
	const frequencies = SOUND_FREQUENCIES[clickSound];
	const frequency = isAccent ? frequencies.accent : frequencies.normal;

	// Create oscillator for the click
	const oscillator = ctx.createOscillator();
	const gainNode = ctx.createGain();

	oscillator.connect(gainNode);
	gainNode.connect(ctx.destination);

	// Configure sound based on type
	switch (clickSound) {
		case 'classic':
			oscillator.type = 'sine';
			gainNode.gain.setValueAtTime(volume * 0.5, time);
			gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
			break;
		case 'wood':
			oscillator.type = 'triangle';
			gainNode.gain.setValueAtTime(volume * 0.6, time);
			gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
			break;
		case 'digital':
			oscillator.type = 'square';
			gainNode.gain.setValueAtTime(volume * 0.3, time);
			gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
			break;
		case 'hihat':
			// For hi-hat, use noise-like sound with high frequency
			oscillator.type = 'sawtooth';
			gainNode.gain.setValueAtTime(volume * 0.2, time);
			gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
			break;
	}

	oscillator.frequency.setValueAtTime(frequency, time);
	oscillator.start(time);
	oscillator.stop(time + 0.1);
}

/**
 * Calculate the interval between beats in seconds
 */
export function getBeatInterval(tempo: number, beatUnit: number): number {
	// For compound time signatures (6/8, 9/8, 12/8), group beats
	// For simple time signatures, use standard quarter note = tempo
	const quarterNoteDuration = 60 / tempo;

	if (beatUnit === 8) {
		// Eighth note gets the beat
		return quarterNoteDuration / 2;
	}

	return quarterNoteDuration;
}
