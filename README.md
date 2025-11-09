# Performance-Critical-Data-Visualization-Dashboard
# Vue 3 Real-Time Dashboard

A feature-rich, animated dashboard for streaming and visualizing time-series data. Built with Vue 3 (Composition API), TypeScript, and Vite—designed for high performance, extensible components, and custom canvas graphics.

***

## Table of Contents

- [Overview](#overview)
- [Project Demo](#project-demo)
- [Folder Structure](#folder-structure)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration & Customization](#configuration--customization)
- [Data Generation & Import](#data-generation--import)
- [Contributing](#contributing)
- [License](#license)

***

## Overview

This dashboard streams simulated or user-imported CSV data, visualizing multiple categories (Alpha, Beta, Gamma, Delta) via animated canvas charts. It features performance monitoring, zoom/pan controls, flexible chart types (Bar, Line, Scatter, Heatmap), filter panels, and a modern Vue architecture.

***

## Project Demo

> Deployment link :
> <img width="1919" height="956" alt="Screenshot 2025-11-09 210033" src="https://github.com/user-attachments/assets/3f601405-d25b-4099-87db-caf972b4b893" />

> <img width="1919" height="953" alt="Screenshot 2025-11-09 210057" src="https://github.com/user-attachments/assets/000c65eb-3f1c-4c97-87e8-fb5a334fc157" />




***

## Folder Structure

Below is a clear outline of your project organization, emphasizing modularity and scalability.

```plaintext
VUE3-REALTIME-DASHBOARD/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       ├── global.css
│   │       └── main.css
│   ├── components/
│   │   ├── charts/
│   │   │   ├── BarChart.vue
│   │   │   ├── Heatmap.vue
│   │   │   ├── LineChart.vue
│   │   │   └── ScatterPlot.vue
│   │   ├── controls/
│   │   │   ├── FilterPanel.vue
│   │   │   ├── ZoomPanControls.vue
│   │   │   ├── DataTable.vue
│   │   │   ├── LoadingOverlay.vue
│   │   │   └── PerformanceMonitor.vue
│   ├── composables/
│   │   ├── useChartRenderer.ts
│   │   ├── useCsvData.ts
│   │   ├── useDataStream.ts
│   │   ├── usePerformanceMonitor.ts
│   │   └── useViewport.ts
│   ├── types/
│   │   └── dashboard.types.ts
│   ├── utils/
│   │   ├── colorUtils.ts
│   │   ├── dataGenerator.ts
│   │   └── mathUtils.ts
│   ├── App.vue
│   ├── env.d.ts
│   └── main.ts
├── index.html
├── package-lock.json
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

Each section is explained in the [Architecture](#architecture) below.

***

## Features

- **Real-time streaming:** Multi-category data, animated updates (canvas-based for high FPS)
- **Charting components:** Bar, Line, Scatter, Heatmap — easily extensible `.vue` files
- **CSV import:** Upload datasets using PapaParse, visualize instantly
- **Filter & zoom controls:** Interactive filtering and viewport changes
- **Responsive design:** Full device/DPI/canvas scaling
- **Performance metrics:** FPS, heap usage via PerformanceMonitor.vue
- **TypeScript everywhere:** Strong types, clear interfaces for easy extension
- **Custom theming:** Modular CSS, color utility functions, dashboard theme types

***

## Architecture

### Components

- **Charts:** (`BarChart.vue`, `LineChart.vue`, etc.) Modular chart visualizations, each supports live data props and options.
- **Controls:** (`FilterPanel.vue`, `ZoomPanControls.vue`, etc.) UI elements for data filtering, navigation, loading feedback, and monitoring.
- **PerformanceMonitor.vue:** Displays real-time FPS and memory usage. Interfaces with `usePerformanceMonitor.ts`.

### Composables (Vue's `setup()` logic abstractions)

- **useChartRenderer.ts:** Canvas rendering, drawing, and animation management
- **useDataStream.ts:** Reactive streaming, data grouping, interval logic
- **useCsvData.ts:** Async CSV parsing and error management
- **usePerformanceMonitor.ts:** Memory/FPS calculations, periodic updates
- **useViewport.ts:** Chart bounds, padding, pixel-to-value conversions

### Utilities & Types

- **colorUtils.ts:** Handles palette selection, conversions, and gradients
- **mathUtils.ts:** Scaling, interpolation, and chart math helpers
- **dataGenerator.ts:** Sinusoidal time-series simulation
- **dashboard.types.ts:** Pure TypeScript definitions for DataPoint, ViewportConfig, ChartTheme, Metrics

### Styles

- `global.css`: Base styling, fonts, grid systems
- `main.css`: Component overrides, responsive tweaks

***

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Visit in a browser
http://localhost:3000
```

***

## Configuration & Customization

- **Modify categories, noise settings:** Edit `dataGenerator.ts`
- **Change chart appearance:** Customize theme colors in `dashboard.types.ts` and style sheets
- **Extend components:** Add new chart types or controls in `/components/charts` and `/components/controls`
- **Optimize rendering:** Edit animation frame logic in `useChartRenderer.ts`

***

## Data Generation & Import

- **Synthetic:** Configured in `dataGenerator.ts` (frequency, amplitude, categories)
- **CSV:** Upload CSVs in-app, parsed via PapaParse in `useCsvData.ts`. Columns should match timestamp/value/category.

***

## Contributing

- Fork and clone the repo
- Create your feature branch (`git checkout -b feature-name`)
- Commit changes and push (`git push origin feature-name`)
- Submit a pull request with a detailed description

***

## License

MIT License. Free to use, modify, and distribute.

***
