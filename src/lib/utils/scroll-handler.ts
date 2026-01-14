/**
 * Factory function to create a wheel scroll handler for cycling through options.
 * Used for dropdown/select controls that should respond to mouse wheel.
 */
export function createScrollHandler<T>(
	getOptions: () => T[],
	getValue: () => T,
	setValue: (v: T) => void,
	onAfter?: () => void
) {
	return (e: WheelEvent) => {
		e.preventDefault();
		const options = getOptions();
		if (options.length === 0) return;
		const idx = options.indexOf(getValue());
		const newIdx =
			e.deltaY > 0 ? (idx + 1) % options.length : (idx - 1 + options.length) % options.length;
		setValue(options[newIdx]);
		onAfter?.();
	};
}

/**
 * Generic keyboard handler for cycling through options with arrow keys.
 * Used for accessible keyboard navigation in select controls.
 */
export function handleArrowKeys<T>(
	e: KeyboardEvent,
	options: T[],
	getCurrentValue: () => T,
	setValue: (value: T) => void,
	onAfterChange?: () => void
) {
	if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
	e.preventDefault();
	const currentValue = getCurrentValue();
	const idx = options.indexOf(currentValue);
	const newIdx =
		e.key === 'ArrowDown' ? (idx + 1) % options.length : (idx - 1 + options.length) % options.length;
	setValue(options[newIdx]);
	onAfterChange?.();
}
