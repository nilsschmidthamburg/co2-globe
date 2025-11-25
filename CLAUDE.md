# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a 3D interactive globe visualization for CO₂ emissions data (1970-2024). The project uses React with TypeScript, Vite as the build tool, and react-globe.gl for 3D visualization. The UI is built with Radix UI primitives and Tailwind CSS.

## Commands

### Development
```bash
npm i          # Install dependencies
npm run dev    # Start dev server on port 3000 (opens browser automatically)
npm run build  # Production build (outputs to build/)
```

Note: No tests, linting, or other scripts are configured in this project.

## Architecture

### Core Application Flow

The app (`src/App.tsx`) manages the main state and coordinates three key components:

1. **GlobeViz** (`src/components/GlobeViz.tsx`) - The 3D globe rendering using react-globe.gl
2. **ControlPanel** (`src/components/ControlPanel.tsx`) - User controls for year selection, playback, view modes
3. **Tooltip** (`src/components/Tooltip.tsx`) - Displays country/region data on hover

### Data Model

Data is managed in `src/lib/co2-data.ts`:
- **CO2Data interface**: Contains country/continent IDs, names, and yearly emission data
- **Mock data generator**: Creates synthetic data for 1970-2024 with trends
- Each year has `absolute` (gigatonnes), `perCapita` (tonnes), and `uncertainty` flags

### View Modes

The application supports two view modes:
- **country**: Colors countries individually based on their emission data
- **continent**: Colors all countries in a continent the same based on aggregated data

And two data modes:
- **absolute**: Total emissions in gigatonnes
- **perCapita**: Emissions per capita in tonnes

### 3D Visualization Details

GlobeViz uses:
- Low-res GeoJSON from react-globe.gl examples (110m resolution)
- D3 color scales (interpolateReds for absolute, interpolateBlues for perCapita)
- Dynamic color scaling based on current year's max values
- Polygon altitude of 0.004 for country extrusion
- Console warnings suppressed for Three.js multiple instance warnings

### State Management

Simple React state (no Redux/Zustand):
- Year playback with 600ms intervals
- Hover state for tooltips with mouse position tracking
- Async data loading simulation (800ms delay)

## Path Aliases

Vite is configured with `@` alias pointing to `./src` for imports.

## UI Components

The project includes a full set of shadcn/ui-style components in `src/components/ui/`, all built on Radix UI primitives. These are pre-configured and ready to use.

## Styling

Tailwind CSS is used throughout. The main stylesheet is `src/index.css` (44KB) which includes Tailwind directives and custom styles.

## Data Source

The application credits EDGAR (Emissions Database for Global Atmospheric Research) as the data source, using real CO2 emissions data from 1970-2024.