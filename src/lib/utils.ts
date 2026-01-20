import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Deep clone an object using JSON serialization
 * Note: Uses JSON instead of structuredClone to support Svelte 5's reactive Proxy objects
 */
export function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
	fn: T,
	ms: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	return (...args: Parameters<T>) => {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), ms);
	};
}

/**
 * Check if a value is a non-null object (not an array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate an object has specific fields with expected types
 */
export function hasFields<T extends Record<string, string>>(
	obj: unknown,
	fields: T
): obj is Record<keyof T, unknown> {
	if (!isObject(obj)) return false;
	for (const [key, type] of Object.entries(fields)) {
		if (!(key in obj)) return false;
		if (typeof obj[key] !== type) return false;
	}
	return true;
}

/**
 * Validate a color string (hex format)
 */
export function isValidHexColor(color: string): boolean {
	return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validate a color string (hex or rgba format)
 */
export function isValidColor(color: string): boolean {
	if (isValidHexColor(color)) return true;
	// Also accept named colors and rgba
	return /^(rgba?\([^)]+\)|[a-z]+)$/i.test(color);
}
