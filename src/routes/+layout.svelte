<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Fretboard Visualizer</title>
</svelte:head>

<div class="dark min-h-screen bg-background text-foreground">
	{@render children()}
</div>
