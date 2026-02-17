# FICSIT-Control - Project Specification

A real-time factory monitoring, production planning, and AI assistant tool for Satisfactory, powered by the FICSIT Remote Monitoring (FRM) mod.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.9 (strict) |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 (with persist middleware) |
| Graph | @xyflow/react 12, @dagrejs/dagre 2 |
| Charts | @nivo/line, @nivo/sankey 0.99 |
| Validation | Zod 4 |
| Icons | Lucide React |
| Testing | Vitest 4 + jsdom |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   React UI                       │
│  ┌──────┬──────┬───────┬────────┬──────┬──────┐ │
│  │Status│Assets│Dashbrd│ Power  │Plnnr │  AI  │ │
│  └──┬───┴──┬──┴───┬───┴───┬────┴──┬───┴──┬───┘ │
│     └──────┴──────┴───┬───┴──────┴──────┘      │
│                       │                          │
│  ┌────────────────────┴─────────────────────┐   │
│  │           Zustand Stores                  │   │
│  │  ui / connection / factory / planner / chat│   │
│  └────────┬───────────────┬─────────────────┘   │
│           │               │                      │
│  ┌────────┴──────┐ ┌─────┴──────┐               │
│  │  FRM Client   │ │   Solver   │               │
│  │  (WS + REST)  │ │  (BFS)     │               │
│  └───────┬───────┘ └────────────┘               │
└──────────┼──────────────────────────────────────┘
           │
    ┌──────┴──────┐
    │ Satisfactory │
    │  FRM Mod     │
    │ :8080        │
    └─────────────┘
```

### Data Flow

1. **FRM Client** polls Satisfactory every 3s via REST (`http://host:8080/api/...`)
2. Responses validated with Zod schemas, routed to **factory-store**
3. **Power history** tracked per circuit (120 snapshots, ~6 min window, deduped at 2s minimum)
4. **Planner** runs the solver on demand; results rendered as interactive graph or list
5. **AI Assistant** builds a dynamic system prompt from live factory data + game data, streams responses

---

## Tabs & Features

### 1. Factory Status (default tab)

Overview of the connected factory.

- **Overview cards** - total machine count, efficiency, production items, inventory slots
- **Machine breakdown** - grouped by building type (assembler, smelter, etc.) with utilization %
- **Bottleneck list** - machines running below a utilization threshold
- Shows disconnected message when FRM is not connected

### 2. Assets

Searchable inventory of all factory assets.

- **Search bar** with text filtering
- **Category tabs** - All | Machines | Power | Storage
- **Machine asset list** - every machine with recipe, efficiency, location
- **Power circuit list** - circuits with production/consumption/capacity
- **Storage asset list** - containers with contents and fill %

### 3. Dashboard

Summary panels for monitoring at a glance.

- **Power panel** - total production, consumption, capacity, utilization bar, per-circuit breakdown
- **Production panel** - high-level production stats (items produced/consumed per minute)
- **Inventory panel** - storage totals

### 4. Power Grid

Deep power monitoring with visualizations.

- **Overview mode** - all circuits in a card grid with key metrics
- **Circuit detail mode** - drill into a single circuit:
  - Power summary cards (produced, consumed, capacity, battery %)
  - **Power history line chart** (Nivo) - tracks production/consumption over time
  - **Sankey diagram** (Nivo) - generator types flowing to consumer categories
  - **Generation mix bar** - breakdown by fuel type (coal, fuel, nuclear, geothermal, biomass)
  - **Generator list** - grouped by type with fuel rates
  - **Consumer breakdown** - machines grouped by building type
  - **Mini gauge** - semicircle utilization gauge
  - **Battery detail panel** - charge %, input/output rates
  - **Fuse alert banner** - warning when fuse has tripped

### 5. Planner

Production chain solver with interactive graph output.

- **Target input** - add items to produce with desired rate (per-minute) or quantity (batch mode with configurable time window)
- **Item select** - dropdown of all producible (non-raw) items
- **Factory import** - detect current production targets from live FRM data
- **Recipe overrides** - choose alternate recipes per item
- **Solve button** - runs backward-propagation solver
- **Results view** (toggle graph/list):
  - **Graph** - interactive @xyflow/react canvas with Dagre hierarchical layout; production nodes, raw resource nodes, item flow edges with rate labels
  - **List** - tabular node/edge listing
- **Results summary** - total power, raw resource totals, building counts

### 6. Recipes

Recipe browser. **Stub** - not yet implemented.

### 7. AI Assistant

Chat interface for factory advice powered by LLMs.

- **Provider selection** - Anthropic Claude or Ollama (local)
- **API key input** + connection test
- **Chat interface** - streaming message display, image attachment support
- **Dynamic context** - system prompt includes all game data (items, recipes, buildings) plus live factory snapshot if connected
- **Stop button** - abort streaming mid-response

---

## Production Solver

### Algorithm: BFS Backward-Propagation

Pure function: `solve(SolverInput) => SolverOutput`

**Input:**
```typescript
{
  targets: Array<{ itemId: ItemId, ratePerMinute: number }>,
  recipeOverrides: Record<ItemId, RecipeId>
}
```

**Process:**
1. Merge duplicate targets for the same item
2. Queue all targets as demand entries
3. BFS loop:
   - Credit any existing byproduct surplus against demand
   - If raw resource: accumulate in raw resources list
   - If manufactured: select recipe (override or default), calculate building count (`demand / outputRate`), merge with existing node if same recipe already queued, enqueue input demands, track byproducts
4. Warn about unconsumed byproducts (> 0.01/min)
5. Aggregate power by building type

**Output:**
```typescript
{
  nodes: ProductionNode[],          // one per unique recipe instance
  edges: SolverEdge[],             // item flow connections
  rawResources: Array<{ itemId, ratePerMinute }>,
  totalPowerMW: number,
  powerByBuilding: Record<BuildingId, { count, totalMW }>,
  warnings: string[]
}
```

**Key behaviors:**
- **Node merging** - same recipe demanded from multiple sources shares one node with scaled count
- **Byproduct crediting** - multi-output recipes credit non-primary outputs against future demand
- **Circular dependency protection** - tracks active resolution set, warns and halts loops
- **Prototype-safe aggregation** - `Object.create(null)` for powerByBuilding to avoid `"constructor"` collision

### Factory Import

Scans live FRM production stats to auto-detect:
- **Net outputs** - items where `MaxProd > MaxConsumed` (excludes raw resources)
- **Recipe overrides** - if majority of machines producing an item use a non-default recipe

Returns a ready-to-solve `SolverInput`.

---

## Game Data

### Items (~40)
Categories: ore, ingot, component, industrial, fluid, gas
Each item has: `id`, `name`, `category`, `form` (solid/liquid/gas), `stackSize`, `sinkPoints`, `isRawResource`

### Buildings (10)
Smelter, Foundry, Constructor, Assembler, Manufacturer, Refinery, Blender, Packager, Particle Accelerator, Converter
Each has power spec (constant or variable MW), slot counts, overclock flag

### Recipes (~100+)
Default + alternate variants. Each recipe: building, cycle duration, inputs/outputs with rates, primary output ID.
Derived lookups: `RECIPES_BY_OUTPUT`, `DEFAULT_RECIPE_FOR_ITEM`

---

## State Management (Zustand Stores)

| Store | Persisted | Purpose |
|-------|-----------|---------|
| `ui-store` | No | Active tab selection |
| `connection-store` | Yes (host/port) | FRM host, port, connection status, client instance |
| `factory-store` | No | Live data: power circuits, production stats, inventory, machines, generators, power history |
| `planner-store` | No | Solver targets, recipe overrides, solver output, batch time config |
| `chat-store` | Yes (messages, config) | AI chat messages, streaming state, provider config, connection test status |

---

## FRM Integration

- **Protocol**: WebSocket + REST polling
- **Default endpoint**: `localhost:8080`
- **Activation**: `/frm http start` in-game console
- **Poll interval**: 3 seconds
- **Endpoints**: `getPower`, `getProdStats`, `getStorageInv`, `getAssembler`, `getSmelter`, `getConstructor`, `getRefinery`, `getManufacturer`, `getFoundry`, `getBlender`, `getPackager`, `getGenerators`
- **Validation**: All responses validated with Zod schemas (`frm-schemas.ts`)
- **Reconnection**: Auto-reconnect on page reload (persisted host/port)

---

## AI Integration

| Provider | Endpoint | Auth |
|----------|----------|------|
| Anthropic Claude | Proxied via Vite (`/api/anthropic/` -> `api.anthropic.com`) | API key (user input or `ANTHROPIC_API_KEY` env) |
| Ollama | `http://localhost:11434` (configurable) | None |

Default model: `claude-sonnet-4-20250514`

The system prompt is built dynamically and includes all game data (items, recipes, buildings) plus a live factory snapshot when connected to FRM.

---

## UI Theme

Dark theme inspired by Satisfactory's industrial aesthetic.

| Token | Color | Usage |
|-------|-------|-------|
| `--satisfactory-orange` | `#f5a623` | Primary accent |
| `--satisfactory-dark` | `#0d1117` | Background |
| `--satisfactory-panel` | `#161b22` | Card/panel backgrounds |
| `--satisfactory-border` | `#30363d` | Borders |
| `--satisfactory-text` | `#e6edf3` | Primary text |
| `--satisfactory-text-dim` | `#8b949e` | Secondary text |
| `--connected` | `#3fb950` | Success / connected |
| `--disconnected` | `#f85149` | Error / disconnected |
| `--warning` | `#d29922` | Warnings |

---

## Testing

**Framework**: Vitest 4 + jsdom
**Commands**: `npm run test` (watch) | `npm run test:run` (single)

| Test File | Coverage |
|-----------|----------|
| `solver/__tests__/solve.test.ts` | 15+ tests: single/multi-input chains, byproducts, circular deps, node merging, recipe overrides |
| `solver/__tests__/power.test.ts` | Power calculation by building type and count |
| `solver/__tests__/factory-import.test.ts` | Net output detection, recipe override detection from FRM data |
| `utils/__tests__/frm-name-map.test.ts` | FRM name -> internal ID resolution, case-insensitive fallback |

---

## Project Structure

```
src/
├── main.tsx / App.tsx              # Entry point & root component
├── index.css                       # Theme variables, Tailwind, React Flow overrides
├── types/                          # TypeScript definitions (frm, item, building, recipe, solver)
├── data/                           # Static game data (items, buildings, recipes)
├── stores/                         # Zustand stores (ui, connection, factory, planner, chat)
├── api/                            # FRM client (WebSocket + REST) & Zod schemas
├── solver/                         # Production solver (BFS), power calc, factory import
├── ai/                             # AI providers (Anthropic, Ollama), system prompt builder
├── utils/                          # Formatting, FRM name mapping, power helpers
└── components/
    ├── layout/                     # Header, TabNav
    ├── connection/                 # ConnectionSetup sidebar
    ├── status/                     # Factory status tab (overview, machines, bottlenecks)
    ├── assets/                     # Assets tab (machines, power, storage lists)
    ├── dashboard/                  # Dashboard tab (power, production, inventory panels)
    ├── power/                      # Power grid tab (charts, gauges, circuit detail)
    ├── planner/                    # Planner tab (targets, overrides, results)
    ├── graph/                      # Production graph (XYFlow nodes/edges, Dagre layout)
    └── ai/                         # AI chat tab (messages, input, settings)
```

**89 source files** | ~4,500+ lines of application code | 4 test files with 30+ test cases

---

## Development Status

### Completed

| Feature | Status | Notes |
|---------|--------|-------|
| Project foundation (React + Vite + Tailwind + Zustand) | Done | |
| FRM connection (WebSocket + REST polling) | Done | 3s poll interval, Zod validation, auto-reconnect |
| Factory Status tab | Done | Overview cards, machine breakdown, bottleneck list |
| Assets tab | Done | Search, category filtering, machine/power/storage lists |
| Dashboard tab | Done | Power, production, inventory summary panels |
| Power Grid tab | Done | Multi-circuit overview, circuit drill-down, history chart, Sankey, gauges, generators, consumers, battery, fuse alerts |
| Power history tracking | Done | Per-circuit, 120 snapshots, deduped, Nivo line chart + mini gauge |
| Production solver | Done | BFS backward-propagation, byproducts, circular deps, node merging, recipe overrides |
| Solver tests | Done | 15+ unit tests covering core scenarios |
| Planner UI | Done | Target input (rate/quantity modes), recipe overrides, solve button, results summary |
| Factory import | Done | Detect net outputs + recipe overrides from live FRM data |
| Production graph visualization | Done | @xyflow/react canvas, Dagre layout, production/resource nodes, flow edges |
| AI Assistant | Done | Anthropic + Ollama providers, streaming, dynamic context, image attachments |
| Dark theme | Done | Satisfactory-inspired industrial palette |

### Not Started

| Feature | Phase | Description |
|---------|-------|-------------|
| Recipe browser | 5 | Interactive recipe database with search, filtering, dependency trees |
| Full game data | 5 | Expand from ~40 items / ~100 recipes to complete game coverage |
| Overclocking support | - | Model overclock/underclock in solver power calculations |
| Planner persistence | - | Save/load planner targets and results across sessions |
| Map / spatial view | - | Conveyor/pipe routing, factory layout visualization |
| Mod recipe support | - | Import recipes from mods (e.g., Circuitry) |

---

*Last updated: 2026-02-16*
