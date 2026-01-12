/**
 * Creates an LRU (Least Recently Used) cache with a size limit.
 * When the cache exceeds the limit, the oldest entry is removed.
 */
export function createLRUCache<T>(maxSize: number) {
	const cache = new Map<string, T>();

	return {
		get(key: string): T | undefined {
			return cache.get(key);
		},

		set(key: string, value: T): void {
			// Remove oldest entry if at capacity
			if (cache.size >= maxSize) {
				const firstKey = cache.keys().next().value;
				if (firstKey) cache.delete(firstKey);
			}
			cache.set(key, value);
		},

		has(key: string): boolean {
			return cache.has(key);
		},

		clear(): void {
			cache.clear();
		},

		get size(): number {
			return cache.size;
		}
	};
}

/**
 * Helper to add an item to a Map with LRU eviction
 */
export function setWithLRULimit<T>(
	cache: Map<string, T>,
	key: string,
	value: T,
	maxSize: number
): void {
	if (cache.size >= maxSize) {
		const firstKey = cache.keys().next().value;
		if (firstKey) cache.delete(firstKey);
	}
	cache.set(key, value);
}
