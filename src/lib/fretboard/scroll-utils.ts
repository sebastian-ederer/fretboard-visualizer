/**
 * Create a generic scroll handler for cycling through options
 */
export function createScrollHandler<T>(
	options: T[],
	getCurrentValue: () => T,
	setValue: (value: T) => void,
	onAfterChange?: () => void
): (e: WheelEvent) => void {
	return (e: WheelEvent) => {
		e.preventDefault();
		const currentValue = getCurrentValue();
		const idx = options.indexOf(currentValue);
		const newIdx =
			e.deltaY > 0 ? (idx + 1) % options.length : (idx - 1 + options.length) % options.length;
		setValue(options[newIdx]);
		onAfterChange?.();
	};
}

/**
 * Create a scroll handler for numeric options (1-based)
 */
export function createNumericScrollHandler(
	min: number,
	max: number,
	getCurrentValue: () => number,
	setValue: (value: number) => void,
	onAfterChange?: () => void
): (e: WheelEvent) => void {
	const range = max - min + 1;
	return (e: WheelEvent) => {
		e.preventDefault();
		const current = getCurrentValue();
		const idx = current - min;
		const newIdx = e.deltaY > 0 ? (idx + 1) % range : (idx - 1 + range) % range;
		setValue(newIdx + min);
		onAfterChange?.();
	};
}
