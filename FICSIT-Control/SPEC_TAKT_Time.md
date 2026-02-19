# Feature Spec: Takt Time Planner

Satisfactory Companion App

---

## 1. Objective

Add a Takt Time Planner that allows users to define a target demand for an item and evaluate whether factory output meets that demand, accounting for uptime and optional process stages.

Outputs:

* Takt time (sec/item)
* Actual cycle time (sec/item)
* Surplus or deficit (items/min)
* Pass or fail compliance
* Optional bottleneck flags

---

## 2. Scope

### In Scope (MVP)

* Demand-based takt calculation
* Uptime adjustment
* Manual actual throughput entry
* Optional manual stage times
* Local persistence (offline)

### Out of Scope (Future)

* Automatic recipe graph balancing
* Live in-game telemetry
* Automatic bottleneck detection from machines or belts
* Cloud sync or sharing

---

## 3. Definitions

| Term              | Definition                           | Unit      |
| ----------------- | ------------------------------------ | --------- |
| Demand            | Desired output rate                  | items/min |
| Uptime            | Expected runtime availability        | %         |
| Effective Demand  | Demand adjusted for uptime           | items/min |
| Takt Time         | Required time per item               | sec/item  |
| Actual Throughput | Measured output rate                 | items/min |
| Actual Cycle Time | Time per item from actual throughput | sec/item  |
| Delta             | Surplus or deficit vs demand         | items/min |

---

## 4. Calculations (Authoritative)

All calculations must match exactly.

Uptime fraction:

uptimeFraction = uptimePct / 100

Effective demand:

effectiveDemandPerMin = demandPerMin / uptimeFraction

Takt time:

taktSecPerItem = 60 / effectiveDemandPerMin

Actual cycle time (if provided):

actualCycleSecPerItem = 60 / actualPerMin

Delta (if actual provided):

deltaPerMin = actualPerMin - demandPerMin

Compliance (if actual provided):

compliance = actualCycleSecPerItem <= taktSecPerItem

Stage over-takt flag:

stage.timeSec > taktSecPerItem

### Validation Rules

* demandPerMin > 0
* 1 <= uptimePct <= 100
* if provided: actualPerMin > 0
* if stages provided: stage.timeSec >= 0

---

## 5. Data Model

### Stored Entities

TaktPlan

```
{
  id: string,            // uuid
  name: string,
  itemId: string,
  demandPerMin: number,
  uptimePct: number,     // default 100
  actualPerMin?: number,
  notes?: string,
  tags: string[],
  createdAt: string,     // ISO
  updatedAt: string      // ISO
}
```

TaktStage (optional)

```
{
  id: string,            // uuid
  planId: string,
  name: string,
  timeSec: number,
  order: number,
  notes?: string
}
```

### Derived (Not Persisted)

TaktResult

```
{
  uptimeFraction: number,
  effectiveDemandPerMin: number,
  taktSecPerItem: number,
  actualCycleSecPerItem?: number,
  deltaPerMin?: number,
  compliance?: boolean,
  flaggedStages: string[]
}
```

---

## 6. UI Requirements

### Navigation

* Add screen or route: Takt Planner
* Plan list with Create and Edit actions

### Plan Editor Inputs

* Item selector (by itemId)
* Demand (items/min)
* Uptime (%), default 100
* Actual throughput (items/min), optional
* Notes and tags
* Optional stage table (name, timeSec, reorderable)

### Live Outputs

* Effective demand (items/min)
* Takt time (sec/item)
* If actual provided:

  * Actual cycle time (sec/item)
  * Delta (items/min)
  * Compliance (Pass or Fail)
* Stage warnings where timeSec > takt

### Display Rules

* Display sec/item with reasonable precision (e.g., 2 decimals)
* Preserve full precision internally
* If no actual provided, show Takt-only mode

---

## 7. Acceptance Criteria

| ID   | Criteria                                                  |
| ---- | --------------------------------------------------------- |
| AC-1 | Valid demand computes takt time                           |
| AC-2 | Changing uptime updates takt immediately                  |
| AC-3 | Providing actual throughput computes compliance and delta |
| AC-4 | Over-takt stages are flagged                              |
| AC-5 | Saved plan reloads with identical results                 |
| AC-6 | Invalid inputs block save and show inline errors          |

---

## 8. Public Interfaces (Suggested)

```
computeTakt(plan: TaktPlan, stages?: TaktStage[]): TaktResult
createPlan(data): TaktPlan
updatePlan(id, patch): TaktPlan
listPlans(): TaktPlan[]
getPlan(id): { plan: TaktPlan, stages: TaktStage[] }
setStages(planId: string, stages: TaktStage[]): void
```

---

## 9. Edge Cases

| Case               | Handling                       |
| ------------------ | ------------------------------ |
| uptimePct = 100    | Effective demand equals demand |
| uptimePct very low | Allow but show warning         |
| takt < 1 sec/item  | Show warning                   |
| actual omitted     | Hide compliance and delta      |
| no stages          | Hide bottleneck section        |

---

## 10. Implementation Notes

* Do not persist derived values
* Use itemId, not display name
* Units:

  * Inputs: items/min and %
  * Outputs: sec/item and items/min

---

## 11. Deliverables Checklist

* Data schema and migrations
* Deterministic compute module
* Plan list and editor UI
* Validation and error handling
* Unit tests for calculations and validation
