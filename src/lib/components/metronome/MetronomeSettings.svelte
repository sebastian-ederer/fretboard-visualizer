<script lang="ts">
	import { metronomeStore, CLICK_SOUNDS, MIN_TEMPO, MAX_TEMPO, HOLD_REPEAT_DELAY, HOLD_REPEAT_INTERVAL } from '$lib/metronome';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import { Button } from '$lib/components/ui/button';
	import { createScrollHandler } from '$lib/utils/scroll-handler';
	import { createHoldRepeat } from '$lib/utils/hold-repeat';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import Hand from '@lucide/svelte/icons/hand';

	const m = $derived(metronomeStore.state);

	// Beat unit options
	const BEAT_UNITS = [1, 2, 4, 8, 16];

	// Scroll handlers for dropdowns
	const handleBeatUnitScroll = createScrollHandler(
		() => BEAT_UNITS,
		() => m.beatUnit,
		(v) => metronomeStore.setTimeSignature(m.beatsPerMeasure, v)
	);

	const handleClickSoundScroll = createScrollHandler(
		() => CLICK_SOUNDS.map(s => s.value),
		() => m.clickSound,
		(v) => metronomeStore.setClickSound(v as typeof m.clickSound)
	);

	function handleTempoInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = parseInt(input.value);
		if (!isNaN(value)) {
			metronomeStore.setTempo(value);
		}
	}

	function handleBeatsChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = parseInt(input.value);
		if (!isNaN(value) && value >= 1 && value <= 16) {
			metronomeStore.setTimeSignature(value, m.beatUnit);
		}
	}

	function handleBeatUnitChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = parseInt(input.value);
		if (!isNaN(value) && [1, 2, 4, 8, 16].includes(value)) {
			metronomeStore.setTimeSignature(m.beatsPerMeasure, value);
		}
	}

	// Hold-to-repeat for tempo buttons
	const tempoHold = createHoldRepeat(
		(delta: number) => metronomeStore.adjustTempo(delta),
		{ delay: HOLD_REPEAT_DELAY, interval: HOLD_REPEAT_INTERVAL }
	);
</script>

<div class="space-y-6">
	<!-- Tempo -->
	<div class="space-y-3">
		<label class="text-sm font-medium text-muted-foreground">Tempo</label>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				class="h-8 w-8 p-0"
				onmousedown={() => tempoHold.start(-1)}
				onmouseup={tempoHold.stop}
				onmouseleave={tempoHold.stop}
				ontouchstart={() => tempoHold.start(-1)}
				ontouchend={tempoHold.stop}
			>
				<Minus class="h-3 w-3" />
			</Button>

			<input
				type="number"
				min={MIN_TEMPO}
				max={MAX_TEMPO}
				value={m.tempo}
				onchange={handleTempoInput}
				class="h-9 w-20 rounded-md border border-border bg-background px-2 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			/>

			<Button
				variant="outline"
				size="sm"
				class="h-8 w-8 p-0"
				onmousedown={() => tempoHold.start(1)}
				onmouseup={tempoHold.stop}
				onmouseleave={tempoHold.stop}
				ontouchstart={() => tempoHold.start(1)}
				ontouchend={tempoHold.stop}
			>
				<Plus class="h-3 w-3" />
			</Button>

			<span class="text-sm text-muted-foreground">BPM</span>
		</div>

		<!-- Tempo slider -->
		<input
			type="range"
			min={MIN_TEMPO}
			max={MAX_TEMPO}
			value={m.tempo}
			oninput={(e) => metronomeStore.setTempo(parseInt((e.target as HTMLInputElement).value))}
			class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted"
		/>

		<!-- Tap Tempo -->
		<Button
			variant="outline"
			size="sm"
			class="w-full gap-1.5"
			onclick={metronomeStore.tapTempo}
		>
			<Hand class="h-4 w-4" />
			Tap Tempo
		</Button>
	</div>

	<!-- Time Signature -->
	<div class="space-y-3">
		<label class="text-sm font-medium text-muted-foreground">Time Signature</label>
		<div class="flex items-center gap-2">
			<input
				type="number"
				min="1"
				max="16"
				value={m.beatsPerMeasure}
				onchange={handleBeatsChange}
				class="h-9 w-14 rounded-md border border-border bg-background px-2 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				aria-label="Beats per measure"
			/>
			<span class="text-lg text-muted-foreground">/</span>
			<Select.Root
				type="single"
				value={m.beatUnit.toString()}
				onValueChange={(v) => metronomeStore.setTimeSignature(m.beatsPerMeasure, parseInt(v))}
			>
				<Select.Trigger class="h-9 w-14" aria-label="Beat unit" onwheel={handleBeatUnitScroll}>
					{m.beatUnit}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="1">1</Select.Item>
					<Select.Item value="2">2</Select.Item>
					<Select.Item value="4">4</Select.Item>
					<Select.Item value="8">8</Select.Item>
					<Select.Item value="16">16</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<!-- Volume -->
	<div class="space-y-3">
		<label class="text-sm font-medium text-muted-foreground">Volume</label>
		<div class="flex items-center gap-3">
			<input
				type="range"
				min="0"
				max="1"
				step="0.05"
				value={m.volume}
				oninput={(e) => metronomeStore.setVolume(parseFloat((e.target as HTMLInputElement).value))}
				class="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-muted"
			/>
			<span class="w-10 text-right text-sm tabular-nums text-muted-foreground">
				{Math.round(m.volume * 100)}%
			</span>
		</div>
	</div>

	<!-- Click Sound -->
	<div class="space-y-3">
		<label id="click-sound-label" class="text-sm font-medium text-muted-foreground">Click Sound</label>
		<Select.Root
			type="single"
			value={m.clickSound}
			onValueChange={(v) => metronomeStore.setClickSound(v as typeof m.clickSound)}
		>
			<Select.Trigger class="w-full" aria-labelledby="click-sound-label" onwheel={handleClickSoundScroll}>
				{CLICK_SOUNDS.find((s) => s.value === m.clickSound)?.label || m.clickSound}
			</Select.Trigger>
			<Select.Content>
				{#each CLICK_SOUNDS as sound}
					<Select.Item value={sound.value}>{sound.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- Toggle options -->
	<div class="space-y-4">
		<label class="flex cursor-pointer items-center gap-3">
			<Switch
				checked={m.accentFirstBeat}
				onCheckedChange={(v) => metronomeStore.setAccentFirstBeat(v)}
			/>
			<span class="text-sm text-muted-foreground">Accent first beat</span>
		</label>

		<label class="flex cursor-pointer items-center gap-3">
			<Switch
				checked={m.countInEnabled}
				onCheckedChange={(v) => metronomeStore.setCountInEnabled(v)}
			/>
			<span class="text-sm text-muted-foreground">Count-in (1 bar)</span>
		</label>
	</div>

	<!-- Separator -->
	<div class="h-px bg-border"></div>

	<!-- Auto Tempo Increase -->
	<div class="space-y-4">
		<label class="flex cursor-pointer items-center gap-3">
			<Switch
				checked={m.autoTempoEnabled}
				onCheckedChange={(v) => metronomeStore.setAutoTempoEnabled(v)}
			/>
			<span class="text-sm font-medium text-muted-foreground">Auto tempo increase</span>
		</label>

		{#if m.autoTempoEnabled}
			<div class="space-y-4 pl-1">
				<!-- Increment -->
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm text-muted-foreground">Raise by</span>
					<div class="flex items-center gap-1.5">
						<input
							type="number"
							min="1"
							max="20"
							value={m.autoTempoIncrement}
							onchange={(e) =>
								metronomeStore.setAutoTempoIncrement(
									parseInt((e.target as HTMLInputElement).value)
								)}
							class="h-8 w-14 rounded-md border border-border bg-background px-2 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
						/>
						<span class="text-sm text-muted-foreground">BPM</span>
					</div>
				</div>

				<!-- After X bars -->
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm text-muted-foreground">Every</span>
					<div class="flex items-center gap-1.5">
						<input
							type="number"
							min="1"
							max="32"
							value={m.autoTempoBars}
							onchange={(e) =>
								metronomeStore.setAutoTempoBars(parseInt((e.target as HTMLInputElement).value))}
							class="h-8 w-14 rounded-md border border-border bg-background px-2 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
						/>
						<span class="text-sm text-muted-foreground">bars</span>
					</div>
				</div>

				<!-- Max BPM -->
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm text-muted-foreground">Max tempo</span>
					<div class="flex items-center gap-1.5">
						<input
							type="number"
							min={MIN_TEMPO}
							max={MAX_TEMPO}
							value={m.autoTempoMaxBpm}
							onchange={(e) =>
								metronomeStore.setAutoTempoMaxBpm(parseInt((e.target as HTMLInputElement).value))}
							class="h-8 w-16 rounded-md border border-border bg-background px-2 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
						/>
						<span class="text-sm text-muted-foreground">BPM</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
