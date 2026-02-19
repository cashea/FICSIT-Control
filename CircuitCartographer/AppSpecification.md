Below is the **updated Claude Code–ready specification**, revised to reflect:

* **Final mod name:** CircuitCartographer
* **Explicit dependency:** **Ficsit Remote Monitoring (FRM)**
* Architecture that **builds on FRM’s data model instead of re-implementing power discovery**

---

# CircuitCartographer

**Satisfactory Mod – Power Grid Mapping & Visualization**
**Built on: Ficsit Remote Monitoring (FRM)**

Dependency:
[https://ficsit.app/mod/FicsitRemoteMonitoring](https://ficsit.app/mod/FicsitRemoteMonitoring)

---

## 1. Purpose

**CircuitCartographer** provides a **map-like, explorable visualization of Satisfactory power grids**, using **Ficsit Remote Monitoring (FRM)** as its authoritative data source.

The mod exposes power circuits as **navigable networks**, allowing players to:

* Understand large-scale power topology
* Identify circuit boundaries
* Name and annotate circuits
* Diagnose power issues visually

The mod is **observational**, not automating gameplay.

---

## 2. Architectural Principle

> **FRM is the data backend. CircuitCartographer is the visualization and interaction layer.**

CircuitCartographer:

* Does **not** enumerate power networks directly from game internals unless necessary
* Consumes **FRM’s power, circuit, and generator data**
* Builds higher-level abstractions (graphs, maps, clusters) on top of FRM output

---

## 3. Core Goals

* Visualize **power circuits as graphs**
* Provide **spatial and logical views**
* Enable **circuit naming and annotation**
* Scale to megafactories
* Remain compatible across Satisfactory updates by relying on FRM

---

## 4. FRM Integration Details

### 4.1 FRM Data Sources Used

Primary FRM endpoints / data structures:

* Power overview
  [https://docs.ficsit.app/ficsitremotemonitoring/latest/json/Read/getPower.html](https://docs.ficsit.app/ficsitremotemonitoring/latest/json/Read/getPower.html)

* Generator listing
  [https://docs.ficsit.app/ficsitremotemonitoring/latest/json/Read/getGenerators.html](https://docs.ficsit.app/ficsitremotemonitoring/latest/json/Read/getGenerators.html)

* Circuit identifiers and statistics:

  * Circuit ID
  * Production
  * Consumption
  * Capacity
  * Fuse/trip state

CircuitCartographer assumes FRM already:

* Groups entities by circuit
* Tracks live power stats
* Maintains circuit consistency

---

### 4.2 Data Flow

1. FRM collects and normalizes power data
2. CircuitCartographer queries FRM periodically or on-demand
3. CircuitCartographer:

   * Builds graph models
   * Associates world positions
   * Applies user metadata (names, colors, notes)

---

## 5. Feature Overview

---

### 5.1 Circuit Registry

Each power circuit is represented as a first-class object:

| Field          | Source              |
| -------------- | ------------------- |
| Circuit ID     | FRM                 |
| Power Produced | FRM                 |
| Power Consumed | FRM                 |
| Capacity       | FRM                 |
| Fuse State     | FRM                 |
| User Name      | CircuitCartographer |
| Notes          | CircuitCartographer |
| Color Tag      | CircuitCartographer |

---

### 5.2 Visualization Modes

#### A. World Map Mode

* Nodes placed using world coordinates
* Shows approximate factory layout
* Ideal for locating problem areas

#### B. Abstract Graph Mode

* Non-spatial network diagram
* Nodes arranged for readability
* Ideal for logic and debugging

#### C. Hybrid Mode

* Spatial clustering
* Logical routing between clusters

---

### 5.3 Node Types

Nodes derived from FRM data:

* Power generators
* Power consumers
* Power switches
* Poles / connection hubs (abstracted if needed)

Each node displays:

* Type icon
* Power contribution or draw
* Circuit membership
* Status (active, idle, tripped)

---

### 5.4 Circuit Highlighting & Tracing

* Select a circuit to:

  * Highlight all associated nodes
  * Dim unrelated circuits
* Click a building → “Trace Circuit”
* Power switches visually split circuits

---

### 5.5 Naming & Annotation

Because vanilla Satisfactory does not support this:

* User-defined **circuit names**
* Free-text notes
* Optional color coding

Examples:

* `MAIN BASE GRID`
* `NUCLEAR BACKUP`
* `TRAIN POWER`

All metadata persists across saves.

---

## 6. UI Design

### 6.1 Entry Points

* Button in FRM UI (preferred)
* Optional hotkey
* Optional standalone window

---

### 6.2 Layout

**Left Panel**

* Circuit list
* Status indicators
* Search/filter

**Center Panel**

* Map / graph view

**Right Panel**

* Selected circuit details
* Rename field
* Notes editor

---

### 6.3 Tooltips

Hovering any node shows:

* Building type
* Power draw/output
* Circuit name
* Circuit ID (debug mode)

---

## 7. Performance Strategy

Designed for very large saves:

* Circuit-level aggregation by default
* Optional node clustering
* Manual refresh option
* No per-tick updates
* Cache FRM responses

---

## 8. Persistence Model

Stored separately from FRM data:

* Circuit name map (Circuit ID → Name)
* Notes
* Colors
* UI preferences

Persistence requirements:

* Save/load safe
* Multiplayer safe
* Client-local by default

---

## 9. Multiplayer Behavior

* FRM provides shared power data
* CircuitCartographer metadata defaults to **client-local**
* Optional host-authoritative mode (configurable)

---

## 10. Non-Goals

Out of scope by design:

* Auto-balancing power
* Auto-rewiring
* AI recommendations
* Gameplay-altering automation

---

## 11. Design Philosophy

* **Visibility over control**
* Engineer-friendly mental model
* Leverage existing FRM infrastructure
* Minimal duplication of logic

---

## 12. Summary

CircuitCartographer turns FRM’s power data into a **true cartographic representation** of Satisfactory’s electrical systems.

It fills a critical observability gap without interfering with gameplay, making power networks as understandable as belts, pipes, and trains.

