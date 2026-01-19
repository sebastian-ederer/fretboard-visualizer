/**
 * Fretboard export utilities
 * Handles PNG and SVG export with lazy-loaded html-to-image
 */

// Lazy-load html-to-image once and cache
let htmlToImageModule: typeof import('html-to-image') | null = null;

async function getHtmlToImage() {
	if (!htmlToImageModule) {
		htmlToImageModule = await import('html-to-image');
	}
	return htmlToImageModule;
}

function downloadFile(dataUrl: string, filename: string) {
	const link = document.createElement('a');
	link.download = filename;
	link.href = dataUrl;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

/**
 * Export an HTML element as a PNG image
 */
export async function exportAsPng(element: HTMLElement | null, filename = 'fretboard.png'): Promise<void> {
	if (!element) return;
	try {
		const { toPng } = await getHtmlToImage();
		const dataUrl = await toPng(element, {
			backgroundColor: '#09090b',
			pixelRatio: 2
		});
		downloadFile(dataUrl, filename);
	} catch (err) {
		console.error('Failed to export PNG:', err);
	}
}

/**
 * Export an HTML element as an SVG image
 */
export async function exportAsSvg(element: HTMLElement | null, filename = 'fretboard.svg'): Promise<void> {
	if (!element) return;
	try {
		const { toSvg } = await getHtmlToImage();
		const dataUrl = await toSvg(element, {
			backgroundColor: '#09090b'
		});
		downloadFile(dataUrl, filename);
	} catch (err) {
		console.error('Failed to export SVG:', err);
	}
}
