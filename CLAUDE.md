# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fretboard Visualizer is a guitar theory learning tool built with SvelteKit 2, Svelte 5, and Tailwind CSS 4. Users can click on frets to visualize notes and patterns on a guitar fretboard. The app includes a metronome, circle of fifths, scale comparer, and strum pattern builder for practice.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Type-check with svelte-check
npm run lint         # Check formatting (Prettier) and lint (ESLint)
npm run format       # Auto-format with Prettier
```

## Tech Stack

- **Svelte 5** with runes (`$state`, `$derived`, `$effect`, `$props`)
- **SvelteKit 2** for routing and SSR (static adapter for GitHub Pages)
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin
- **shadcn-svelte** for UI components (based on bits-ui)
- **TypeScript** throughout
- **Tone.js** for strum pattern audio playback
- **html-to-image** for PNG/SVG export

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Main fretboard page
│   ├── +layout.svelte        # Root layout (dark mode)
│   ├── scale-comparer/       # Scale comparison tool
│   └── strum-pattern/        # Strum pattern builder
├── lib/
│   ├── components/
│   │   ├── ui/               # shadcn-svelte components
│   │   ├── app-shell/        # AppShell layout wrapper
│   │   ├── fretboard/        # Fretboard, FretboardSettings, ShapeOverlay
│   │   ├── metronome/        # MetronomeDisplay, MetronomeSettings
│   │   ├── circle-of-fifths/ # CircleOfFifths (shared across pages)
│   │   ├── scale-comparer/   # ScaleComparerSettings
│   │   ├── strum-pattern/    # StrumPatternDisplay, BeatCell, ChordTimeline
│   │   └── side-panel/       # SidePanel (settings container)
│   ├── fretboard/            # Fretboard feature module
│   │   ├── store.svelte.ts   # Singleton store with $state (shared key/mode)
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── constants.ts      # Scales, tunings, layout dimensions
│   │   ├── music-utils.ts    # Note/scale calculations
│   │   ├── shape-utils.ts    # Shape overlay calculations
│   │   ├── color-utils.ts    # Color manipulation
│   │   ├── storage.ts        # localStorage persistence
│   │   └── index.ts          # Barrel exports
│   ├── metronome/            # Metronome feature module
│   │   ├── store.svelte.ts   # Singleton store with $state
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── constants.ts      # Tempo limits, timing
│   │   ├── audio.ts          # Web Audio API scheduling
│   │   ├── storage.ts        # localStorage persistence
│   │   └── index.ts          # Barrel exports
│   ├── strum-pattern/        # Strum pattern feature module
│   │   ├── store.svelte.ts   # Pattern state and playback
│   │   ├── types.ts          # Beat, StrumEvent, ChordSlot types
│   │   ├── constants.ts      # Pattern presets, strum cycle
│   │   ├── audio.ts          # Tone.js guitar playback
│   │   ├── storage.ts        # Pattern persistence
│   │   └── index.ts          # Barrel exports
│   └── utils.ts              # Shared utilities (cn, deepClone, etc.)
└── app.css                   # Global styles + Tailwind
```

## Architecture Patterns

### Singleton Stores with $state

Feature stores use a factory pattern returning a singleton with `$state`:

```typescript
function createFeatureStore() {
    const state = $state({
        // All reactive state in one object
        someValue: 'default',
        isLoaded: false
    });

    function someAction() {
        state.someValue = 'updated';
    }

    return {
        state,                    // Expose for reactive access
        get derivedValue() { return $derived(/*...*/); },
        someAction,
        initialize,               // Load from localStorage
    };
}

export const featureStore = createFeatureStore();
```

**Usage in components:**
```svelte
<script lang="ts">
    import { featureStore } from '$lib/feature';
    const s = $derived(featureStore.state);  // Shorthand for state access
</script>

<div>{s.someValue}</div>
```

### Component Organization

Each feature has its own folder under `src/lib/components/` with:
- Main display component (e.g., `Fretboard.svelte`)
- Settings component (e.g., `FretboardSettings.svelte`)
- `index.ts` barrel export

Components receive the store as a prop when they need to modify state:
```svelte
interface Props {
    store: typeof featureStore;
}
let { store }: Props = $props();
```

### State Persistence

- State auto-saves to localStorage via `$effect` in the store
- Presets are stored separately from current state
- History (undo/redo) uses a stack with debounced saves

### UI Components (shadcn-svelte)

Located in `src/lib/components/ui/`. Add new components with:
```bash
npx shadcn-svelte@latest add <component>
```

Configuration in `components.json` (zinc base color, dark mode).

## Key Constants

### Fretboard (`src/lib/fretboard/constants.ts`)
- `FRET_COUNT = 24` - Number of frets
- `MIN_STRING_COUNT = 4`, `MAX_STRING_COUNT = 12` - String range
- `TUNING_PRESETS` - Standard, Drop D, DADGAD, Open G/D/E, etc.
- `SCALE_INTERVALS` - Pentatonic, blues, modes, melodic minor
- `PENTATONIC_SHAPES` - Path-based shape patterns for overlay

### Metronome (`src/lib/metronome/constants.ts`)
- `MIN_TEMPO = 20`, `MAX_TEMPO = 300` - BPM range
- `CLICK_SOUNDS` - Available click sounds

### Strum Pattern (`src/lib/strum-pattern/constants.ts`)
- `PATTERN_PRESETS` - Built-in patterns (basic, folk, rock, ballad)
- `STRUM_CYCLE` - Strum type cycle order (down → up → muted → rest)
- `DEFAULT_SUBDIVISION = 2` - Eighth notes by default

## Keyboard Shortcuts

Defined in page components:
- `Space` - Toggle metronome play/pause (fretboard) or strum pattern playback
- `Ctrl+Z` - Undo (fretboard page)
- `Ctrl+Y` / `Ctrl+Shift+Z` - Redo (fretboard page)

## Styling

- Global styles in `src/app.css` (Tailwind + shadcn theme variables)
- Dark mode always enabled via `.dark` class on `<html>` in `+layout.svelte`
- Use Tailwind utilities with shadcn color tokens:
  - `bg-background`, `bg-card`, `bg-muted`
  - `text-foreground`, `text-muted-foreground`
  - `border-border`

## State Management Guidelines

1. **Use `$state({})` with object maps** for reactive collections (not native Set/Map)
2. **Mutate object properties directly** for reactivity
3. **Reassign the object** (`state.obj = {...state.obj}`) when deleting properties
4. **Use `$derived`** for computed values that depend on state
5. **Debounce history saves** to avoid excessive storage writes
6. **Shared state**: Key/mode settings live in `fretboardStore` and are shared across all pages. Call `fretboardStore.setupAutoSave()` on pages that modify these settings.
7. **Deep cloning**: Use `deepClone()` from utils.ts (JSON-based) instead of `structuredClone` for Svelte 5 Proxy compatibility

## Adding New Features

1. Create feature module in `src/lib/<feature>/`:
   - `store.svelte.ts` - Singleton store
   - `types.ts` - TypeScript interfaces
   - `constants.ts` - Magic values and configs
   - `storage.ts` - localStorage helpers
   - `index.ts` - Barrel exports

2. Create components in `src/lib/components/<feature>/`:
   - Main display component
   - Settings component (if needed)
   - `index.ts` - Barrel export

3. Initialize store in `+page.svelte` `onMount`

## Svelte MCP Tools

When writing Svelte code, use these MCP tools:

1. **list-sections** - Discover available Svelte 5/SvelteKit documentation
2. **get-documentation** - Fetch full docs for specific sections
3. **svelte-autofixer** - Validate Svelte code before finalizing (call until no issues)
4. **playground-link** - Generate Svelte Playground links (ask user first, never for file-based code)
