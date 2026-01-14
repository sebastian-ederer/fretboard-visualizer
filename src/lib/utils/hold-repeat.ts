/**
 * Default delay (ms) before repeat starts when holding a button.
 */
export const DEFAULT_HOLD_DELAY = 300;

/**
 * Default interval (ms) between repeated actions when holding a button.
 */
export const DEFAULT_HOLD_INTERVAL = 50;

/**
 * Creates a hold-to-repeat controller for buttons that should repeat an action
 * while being held down (like +/- tempo buttons).
 *
 * @example
 * ```svelte
 * <script>
 *   const holdRepeat = createHoldRepeat((delta) => store.adjustValue(delta));
 * </script>
 *
 * <button
 *   onmousedown={() => holdRepeat.start(1)}
 *   onmouseup={holdRepeat.stop}
 *   onmouseleave={holdRepeat.stop}
 *   ontouchstart={() => holdRepeat.start(1)}
 *   ontouchend={holdRepeat.stop}
 * >+</button>
 * ```
 */
export function createHoldRepeat<T = number>(
	action: (value: T) => void,
	options?: {
		delay?: number;
		interval?: number;
	}
) {
	const delay = options?.delay ?? DEFAULT_HOLD_DELAY;
	const interval = options?.interval ?? DEFAULT_HOLD_INTERVAL;

	let holdTimeout: number | null = null;
	let holdInterval: number | null = null;

	function start(value: T) {
		// Execute immediately
		action(value);

		// Start repeating after delay
		holdTimeout = window.setTimeout(() => {
			holdInterval = window.setInterval(() => {
				action(value);
			}, interval);
		}, delay);
	}

	function stop() {
		if (holdTimeout) {
			clearTimeout(holdTimeout);
			holdTimeout = null;
		}
		if (holdInterval) {
			clearInterval(holdInterval);
			holdInterval = null;
		}
	}

	return { start, stop };
}
