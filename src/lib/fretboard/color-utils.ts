import { SHAPE_COLORS } from './constants';
import { getPentatonicShapeDisplayName } from './music-utils';

// LRU cache with size limit
const MAX_COLOR_CACHE_SIZE = 50;
const complementaryColorCache = new Map<string, string>();

function setColorCache(key: string, value: string) {
	if (complementaryColorCache.size >= MAX_COLOR_CACHE_SIZE) {
		const firstKey = complementaryColorCache.keys().next().value;
		if (firstKey) complementaryColorCache.delete(firstKey);
	}
	complementaryColorCache.set(key, value);
}

/**
 * Calculate complementary color for high contrast borders (memoized)
 */
export function getComplementaryColor(hexColor: string): string {
	// Check cache first
	const cached = complementaryColorCache.get(hexColor);
	if (cached) return cached;
	// Remove # if present
	const hex = hexColor.replace('#', '');

	// Parse RGB
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	// Convert to HSL
	const rNorm = r / 255;
	const gNorm = g / 255;
	const bNorm = b / 255;

	const max = Math.max(rNorm, gNorm, bNorm);
	const min = Math.min(rNorm, gNorm, bNorm);
	const l = (max + min) / 2;

	let h = 0;
	let s = 0;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case rNorm:
				h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
				break;
			case gNorm:
				h = ((bNorm - rNorm) / d + 2) / 6;
				break;
			case bNorm:
				h = ((rNorm - gNorm) / d + 4) / 6;
				break;
		}
	}

	// Shift hue by 180 degrees (0.5 in normalized form)
	h = (h + 0.5) % 1;

	// Increase saturation for more vibrant complementary color
	s = Math.min(1, s * 1.2);

	// Convert back to RGB
	function hue2rgb(p: number, q: number, t: number) {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	}

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;

	const rOut = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
	const gOut = Math.round(hue2rgb(p, q, h) * 255);
	const bOut = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

	const result = `rgb(${rOut}, ${gOut}, ${bOut})`;
	setColorCache(hexColor, result);
	return result;
}

/**
 * Get the color index for a pentatonic shape based on its display number
 */
export function getPentatonicShapeColorIndex(minorShapeName: string, appliedIsMajor: boolean): number {
	const displayNum = parseInt(getPentatonicShapeDisplayName(minorShapeName, appliedIsMajor));
	if (isNaN(displayNum) || displayNum < 1 || displayNum > 5) return 0;
	return (displayNum - 1) % SHAPE_COLORS.length;
}
