<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();

	const title = 'Fretboard Visualizer - Interactive Guitar Learning Tool';
	const description =
		'Free interactive guitar fretboard tool for learning scales, modes, and music theory. Visualize pentatonic shapes, practice with a built-in metronome, and explore the circle of fifths.';
	const url = 'https://fretboardvisualizer.viridianblue.com';
	const image = `${url}${favicon}`;
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{title}</title>
	<meta name="title" content={title} />
	<meta name="description" content={description} />
	<meta
		name="keywords"
		content="guitar fretboard, guitar scales, music theory, pentatonic shapes, guitar learning, metronome, circle of fifths, guitar practice tool, fretboard visualization"
	/>
	<meta name="author" content="Sebastian Ederer" />
	<meta name="theme-color" content="#09090b" />

	<!-- Canonical URL -->
	<link rel="canonical" href={url} />

	<!-- Favicon -->
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href={favicon} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={url} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:site_name" content="Fretboard Visualizer" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={url} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />

	<!-- Structured Data -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Fretboard Visualizer',
		description: description,
		url: url,
		applicationCategory: 'EducationalApplication',
		operatingSystem: 'Any',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		},
		featureList: [
			'Interactive guitar fretboard',
			'Scale and mode visualization',
			'Pentatonic shape overlays',
			'Built-in metronome',
			'Circle of fifths reference',
			'Custom tuning support'
		]
	})}</script>`}
</svelte:head>

<div class="dark min-h-screen bg-background text-foreground">
	{@render children()}
</div>
