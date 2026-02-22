# FICSIT Control

A real-time factory monitoring, planning, and control dashboard for [Satisfactory](https://www.satisfactorygame.com/), built with React 19 and powered by the [FICSIT Remote Monitoring (FRM)](https://ficsit.app/mod/FicsitRemoteMonitoring) mod.

Connect to a running Satisfactory session over WebSocket/REST to get live production data, visualize power grids, solve production chains, browse recipe trees, and issue in-game commands — all from your browser.

## Features

### Factory Status
Overview cards for power, machine efficiency, inventory, and production. An AI-powered recommendation banner highlights the single highest-impact action to take, with deep-links to the relevant machines.

### Assets
Sortable, searchable lists of every machine, power circuit, and storage container in your factory. Machines show recipe, power draw, and status. Power circuits show generators grouped by type with fuel info. Storage shows an inventory rollup with category-colored item counts.

### Dashboard
Time-series charts for power (production, consumed, capacity) and production rates using @nivo. Sankey diagrams visualize item flow across the factory.

### Power Grid
Per-circuit cards with utilization bars, battery status, fuse indicators, and consumer/producer breakdowns. Drill into any circuit to see its machines and reset tripped fuses via the control plane.

### One-Line Diagram
A single-line diagram of the power distribution network rendered with @xyflow/react. Generator groups, busbars, fuses, consumers, and batteries are auto-laid out with dagre.

### Planner
A BFS backward-propagation solver computes the full production chain from target items down to raw resources. Override default recipes with alternates, import your current factory as a baseline, and preview the solved graph. The Apply Plan panel generates `SET_RECIPE` commands and executes them through the control plane.

### Takt Time Planner
Stage-based takt time planning with configurable durations, lead times, and belt constraints. Calculates BOM per stage and identifies bottleneck machines.

### Recipe Tree
An interactive recipe dependency graph. Search by item name, filter by category, toggle alternate recipes, and overlay live inventory counts from FRM. Nodes are color-coded by item category.

### AI Assistant
Chat with Claude (Anthropic) or a local Ollama model. The system prompt includes live factory data and full game reference (151 items, 275 recipes, 11 buildings), so the AI can give specific, data-driven advice. A recommendation system auto-refreshes every 2 minutes and avoids repeating previous suggestions.

## Architecture

```
┌──────────────┐    WebSocket/REST     ┌────────────────┐
│  Satisfactory │◄────────────────────►│  FICSIT Control │
│  (FRM mod)   │    port 8080 (read)   │  (Browser)     │
│              │                       │                │
│  (Control   │◄────────────────────►│                │
│   mod)      │    port 9090 (write)   │                │
└──────────────┘                       └────────────────┘
```

- **Read plane**: FRM mod exposes game state via WebSocket push + REST polling on port 8080
- **Write plane**: Companion control mod accepts commands (toggle buildings, set recipes, reset fuses) on port 9090 with Bearer token auth
- **Solver**: Pure function with no side effects — runs entirely client-side
- **State**: Six Zustand stores (connection, factory, planner, UI, chat, control) with selective persistence

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript 5.9 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 (persist middleware) |
| Graphs | @xyflow/react 12, @dagrejs/dagre |
| Charts | @nivo/line, @nivo/sankey 0.99 |
| Validation | Zod 4 |
| Testing | Vitest 4, @testing-library/react |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- Satisfactory with the [FRM mod](https://ficsit.app/mod/FicsitRemoteMonitoring) installed
- In-game, run `/frm http start` to activate the FRM HTTP/WebSocket server

### Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 and enter your game's FRM host/port (default `localhost:8080`).

### Control Plane (Optional)

To enable write commands (toggle machines, set recipes, reset fuses), run the companion control mod on port 9090. For development without the game:

```bash
npm run mock:control   # Mock server on port 9090, token: "test"
```

### Teleport Helper (Optional)

A local Express server that bridges the browser to Win32 window focus and in-game teleport commands:

```bash
npm run bridge         # Starts on port 3001
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest single run |
| `npm run mock:control` | Mock control plane (port 9090) |
| `npm run bridge` | Teleport helper server (port 3001) |

## Game Data

Item, recipe, and building definitions are extracted from the game's `en-US.json` community resource file using `scripts/extract-game-data.py`. The generated TypeScript files live in `src/data/`:

- **151 items** across categories (ores, ingots, components, fuel, etc.)
- **275 recipes** (15 FICSMAS/event recipes excluded)
- **11 production buildings** with power specs and I/O slot counts

## Project Structure

```
src/
├── ai/              # AI chat providers, system prompt, recommendation engine
├── api/
│   ├── frm-client.ts          # FRM WebSocket + REST client
│   ├── frm-schemas.ts         # Zod schemas for FRM payloads
│   └── control/               # Control plane client + schemas
├── components/
│   ├── assets/                # Machine, power, storage asset lists
│   ├── ai/                    # Chat UI
│   ├── control/               # Control action buttons, focus game
│   ├── dashboard/             # Power, production, inventory panels
│   ├── layout/                # Header, tab nav, sidebar
│   ├── machines/              # Machine detail + controls
│   ├── planner/               # Solver UI + apply plan
│   ├── power/                 # Power grid view + circuit detail
│   ├── recipe-tree/           # Interactive recipe graph
│   ├── sld/                   # One-line diagram
│   └── takt/                  # Takt time planner
├── data/                      # Generated game data (items, recipes, buildings)
├── hooks/                     # useRecommendation, etc.
├── solver/                    # Pure solver + plan action generator
├── stores/                    # Zustand stores
├── types/                     # TypeScript interfaces
└── utils/                     # Formatting, machine ID helpers
```

## License

MIT
