# FICSIT-Control — Claude Code Implementation Specification

A real-time factory **monitoring, production planning, AI assistance, and external control** tool for **Satisfactory**.

- **Read plane**: **Ficsit Remote Monitoring (FRM)** mod (telemetry)
- **Write plane**: **Companion SML Control Mod** (safe external control)

This document is written to be directly actionable by Claude Code.

---

## 1) Goals

### Must-have
- Connect to FRM (WS + REST polling) and populate the existing UI tabs (Status/Assets/Dashboard/Power/Planner/AI).
- Add a **Control plane**:
  - A companion SML mod exposes an authenticated **REST + WebSocket** API.
  - The React app can issue commands and display results.
- Safety:
  - Auth required for all write commands.
  - Idempotency for command submission.
  - Capability discovery for feature gating.

### Nice-to-have
- “Apply Plan” (assist-first) execution: convert Planner output into a *reviewable* list of proposed actions.

### Non-goals
- Memory injection, DLL hooks, or save-file hacking.
- Unbounded automation without confirmation.

---

## 2) Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript 5.9 (strict) |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 (persist where noted) |
| Graph | @xyflow/react 12, @dagrejs/dagre 2 |
| Charts | @nivo/line, @nivo/sankey 0.99 |
| Validation | Zod 4 |
| Icons | Lucide React |
| Testing | Vitest 4 + jsdom |
| Game Mod | Satisfactory Mod Loader (SML) |
| Transport | HTTP + WebSocket (JSON) |

---

## 3) System Architecture

### 3.1 Data planes

**Read (FRM)**
- Poll every 3s and optionally subscribe WS.
- Validate all responses using Zod.

**Write (Control Mod)**
- UI submits a command intent.
- Control mod executes the intent in-game and returns status/events.

### 3.2 High-level diagram

```
[React UI]
  |      \
  |       \__ [FRM Client] -> FRM Mod (:8080)  (READ)
  |
  \__ [Control Client] -> Companion Control Mod (WRITE)

[Zustand Stores] unify into factory/planner/chat/control
```

---

## 4) FRM Integration (READ)

- Endpoint: `http://<host>:8080`
- Activation: `/frm http start`
- Poll interval: 3 seconds
- Endpoints:
  - `getPower`
  - `getProdStats`
  - `getStorageInv`
  - `getAssembler`, `getSmelter`, `getConstructor`, `getRefinery`, `getManufacturer`, `getFoundry`, `getBlender`, `getPackager`
  - `getGenerators`
- Validation: Zod schemas in `src/api/frm/frm-schemas.ts`
- Reconnect: persisted host/port, auto-reconnect on reload

**Power history**
- 120 snapshots (~6 min window)
- minimum 2s dedupe window

---

## 5) Control Integration (WRITE)

### 5.1 Requirements
- Runs inside Satisfactory via SML.
- Exposes REST endpoints + WS event stream.
- Requires auth for all endpoints except `/capabilities`.
- All write commands must be:
  - idempotent via `idempotencyKey`
  - auditable (command log)
  - validated and return structured errors

### 5.2 Security model

- UI stores:
  - `controlHost` (default `localhost`)
  - `controlPort` (default TBD)
  - `token` (persisted)

- Auth:
  - Use a **pre-shared token** set via config OR
  - A token generated in-game and copied into UI

### 5.3 Capabilities discovery

UI must not render control actions unless supported.

Example response (Zod-validated):
```json
{
  "version": "1.0.0",
  "features": {
    "resetFuse": true,
    "toggleGeneratorGroup": true,
    "toggleBuilding": true,
    "setRecipe": true,
    "setOverclock": true
  },
  "limits": {
    "commandsPerSecond": 5
  }
}
```

### 5.4 Command model (single unified endpoint)

All commands are submitted to one endpoint and tracked by ID.

**Submit**
- `POST /control/v1/commands`

Request:
```json
{
  "idempotencyKey": "uuid",
  "type": "RESET_FUSE",
  "payload": {
    "circuitId": "..."
  }
}
```

Response:
```json
{
  "commandId": "uuid",
  "status": "QUEUED"
}
```

**Query**
- `GET /control/v1/commands/{commandId}`

Response:
```json
{
  "commandId": "uuid",
  "status": "SUCCEEDED",
  "result": {"message": "Fuse reset"},
  "error": null
}
```

**Events**
- `WS /control/v1/stream`

Event messages:
```json
{ "event": "COMMAND_STATUS", "commandId": "uuid", "status": "RUNNING" }
{ "event": "COMMAND_STATUS", "commandId": "uuid", "status": "SUCCEEDED", "result": {"message":"..."} }
```

### 5.5 Initial command set (v1)

| Type | Payload | Notes |
|---|---|---|
| `RESET_FUSE` | `{ circuitId }` | safest first write |
| `TOGGLE_GENERATOR_GROUP` | `{ groupId, enabled }` | group = type/fuel/circuit |
| `TOGGLE_BUILDING` | `{ buildingId, enabled }` | disable/enable production |
| `SET_RECIPE` | `{ machineId, recipeId }` | only compatible machines |
| `SET_OVERCLOCK` | `{ machineId, clockPercent }` | clamp to allowed range |

---

## 6) UI Features

### 6.1 Tabs

1. **Factory Status**
   - overview cards, machine breakdown, bottleneck list

2. **Assets**
   - search + category tabs (Machines/Power/Storage)

3. **Dashboard**
   - summary panels

4. **Power Grid**
   - overview + circuit detail
   - history line chart, sankey, generator list, consumer breakdown
   - fuse alert banner
   - **NEW controls** (feature-gated): reset fuse; toggle generator groups

5. **Planner**
   - target input (rate/batch)
   - recipe overrides
   - solve button
   - results graph/list
   - summary totals

6. **Recipes**
   - stub ok

7. **AI Assistant**
   - provider selection
   - API key + test
   - streaming chat
   - dynamic context injection

### 6.2 Control UX requirements
- A dedicated “Control” panel per relevant page:
  - Power Grid circuit page: show “Reset Fuse” button if capability present.
  - Show command status: queued/running/succeeded/failed.
  - Maintain a “Recent Commands” list with timestamps.

---

## 7) Game Data

- Items: `id`, `name`, `category`, `form`, `stackSize`, `sinkPoints`, `isRawResource`
- Buildings: power specs, slot counts, overclock support flag
- Recipes: default + alternate, with derived lookups

---

## 8) Production Solver

Algorithm: BFS backward-propagation.

Key behaviors:
- node merging
- byproduct crediting
- circular dependency protection
- prototype-safe aggregation (`Object.create(null)`)

Inputs/Outputs as previously specified.

---

## 9) Project Layout (Required)

```
src/
  api/
    frm/
      frm-client.ts
      frm-schemas.ts
    control/
      control-client.ts          # REST + WS
      control-schemas.ts         # Zod for capabilities/commands/events
  stores/
    ui-store.ts
    connection-store.ts
    factory-store.ts
    planner-store.ts
    chat-store.ts
    control-store.ts             # NEW
  solver/
  data/
  types/
  ui/
    components/
    tabs/
```

SML Companion Mod repo layout (separate project):
```
control-mod/
  Source/
    ControlMod/
      ControlModModule.cpp
      HttpServer/
      WsServer/
      Commands/
        CommandRouter.cpp
        ResetFuseCommand.cpp
        ...
      Auth/
      Models/
```

---

## 10) Acceptance Criteria

### FRM
- Connect/disconnect works.
- Polling every 3s updates UI.
- Zod validation errors are surfaced in a non-crashing way.

### Control
- UI can:
  - fetch `/control/v1/capabilities`
  - submit `RESET_FUSE`
  - receive status via polling and/or WS events
- Auth required: invalid token returns 401.
- Idempotency: resubmitting same `(type,payload,idempotencyKey)` does not double-execute.
- Command log visible in UI.

### Tests
- Vitest unit tests for:
  - control schemas
  - control client retry/idempotency handling
  - store reducers for command statuses

---

## 11) Implementation Plan (Milestones)

1) **UI: Control foundations**
- Add `control-client.ts` (REST + WS)
- Add `control-schemas.ts` (capabilities, commands, events)
- Add `control-store.ts` (token, capabilities, command log)

2) **SML Mod: MVP**
- Implement `/control/v1/capabilities`
- Implement `/control/v1/commands` for `RESET_FUSE`
- Implement command status tracking + WS stream

3) **UI: Power Grid control**
- Add “Reset Fuse” button in circuit detail
- Display status + errors

4) Expand commands
- generator groups, toggle building, set recipe, set overclock

5) Planner “Apply Plan” (assist-first)
- convert solver output to reviewable actions

---

## 12) Notes for Claude Code

- Prefer small, testable modules.
- Use Zod for all external data.
- Keep the Control Mod API versioned (`/control/v1`).
- Keep FRM read client unchanged except refactors needed for consistency.

