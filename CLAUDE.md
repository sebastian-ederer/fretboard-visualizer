# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fretboard Visualizer is a guitar theory learning tool built with SvelteKit 2, Svelte 5, and Tailwind CSS 4. Users can click on frets to visualize notes and patterns on a guitar fretboard.

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
- **SvelteKit 2** for routing and SSR
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin
- **shadcn-svelte** for UI components (based on bits-ui)
- **TypeScript** throughout

## Architecture

### UI Components
- shadcn-svelte components in `src/lib/components/ui/`
- Add new components: `npx shadcn-svelte@latest add <component>`
- Configuration in `components.json` (zinc base color, dark mode)

### Styling
- Global styles in `src/app.css` (Tailwind + shadcn theme variables)
- Dark mode enabled via `.dark` class on root element in `+layout.svelte`
- Use Tailwind utilities with shadcn color tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, etc.)

### State Management
- Use `$state({})` with object maps for reactive collections (not native Set/Map)
- Mutate object properties directly for reactivity; reassign for clearing

## Svelte MCP Tools

When writing Svelte code, use these MCP tools:

1. **list-sections** - Discover available Svelte 5/SvelteKit documentation
2. **get-documentation** - Fetch full docs for specific sections
3. **svelte-autofixer** - Validate Svelte code before finalizing (call until no issues)
4. **playground-link** - Generate Svelte Playground links (ask user first, never for file-based code)
