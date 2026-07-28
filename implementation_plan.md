# Dark Series — Full Knowledge Graph Conversion

## What Changes

The project transforms from a **collection of independent charts** into a **unified Knowledge Graph (KG) explorer**. The KG becomes the data backbone powering every view. All existing visualizations become different *projections* of the same underlying graph.

---

## The Knowledge Graph Data Model

### Node Types (4 entity types)

| Type | Shape | Color | Example |
|------|-------|-------|---------|
| `Event` | Circle | World color | *"Mikkel disappears"* |
| `Character` | Diamond | Gold accent | *Jonas Kahnwald / Adam (J)* |
| `World` | Hexagon | Unique tint | *Jonas World* |
| `TimePeriod` | Rounded rect | Grey | *1986*, *2019* |

### Edge Types (typed, directed relationships)

| Relation | Source → Target | Derived from |
|----------|----------------|--------------|
| `appears_in` | Character → Event | Characters column |
| `causes` | Event → Event | Dark_Edges.csv |
| `occurs_in` | Event → World | World column |
| `occurs_at` | Event → TimePeriod | Date column |
| `same_person_as` | Character → Character | `/` in name (Jonas / Adam) |
| `co_present_with` | Character → Character | Shared events |
| `triggers_death_of` | Event → Character | Death=TRUE + Characters |
| `important_trigger_for` | Event → Event | Important_Trigger edges |

---

## New Architecture

```
📁 Dark Series Visualization/
├── index.html              ← [MODIFY] KG Explorer as primary view + projection tabs
├── css/style.css           ← [MODIFY] KG node/edge visual styles
├── js/
│   ├── kg_builder.js       ← [NEW] Builds the full KG from CSV data
│   ├── kg_view.js          ← [NEW] Main interactive KG visualization (D3 force)
│   ├── kg_inspector.js     ← [NEW] Entity detail panel + neighborhood expand
│   ├── kg_pathfinder.js    ← [NEW] BFS shortest path between any two nodes
│   ├── kg_search.js        ← [NEW] Search/filter nodes by name, type, relation
│   ├── data_parser.js      ← [KEEP] CSV loader (unchanged)
│   ├── layout_logic.js     ← [KEEP] Temporal projection still uses it
│   ├── visualisation.js    ← [KEEP] Temporal projection
│   ├── network.js          ← [KEEP] Network projection
│   ├── barchart.js         ← [KEEP] Bar chart projection
│   ├── timeline.js         ← [KEEP] Timeline projection
│   └── main.js             ← [MODIFY] KG-first boot, projections wired to KG
```

---

## Proposed Changes

### [NEW] js/kg_builder.js
Converts CSV data → typed KG nodes + edges:
- Creates `Character`, `Event`, `World`, `TimePeriod` nodes with unique stable IDs
- Parses `Jonas Kahnwald / Adam (J)` into a `same_person_as` identity edge
- Builds all 8 edge types listed above
- Exposes `KGBuilder.build(csvData)` → `{ nodes, edges, index }`

---

### [NEW] js/kg_view.js — Main KG Visualization
Full interactive D3 force-directed graph:

**Node visual encoding:**
- `Event` → circle, colored by world
- `Character` → diamond ◆, gold with size = appearance frequency
- `World` → hexagon ⬡, large background anchor node  
- `TimePeriod` → pill/rect, grey, positioned on a timeline backbone

**Edge visual encoding:**
- `causes` → solid arrow, white
- `appears_in` → dashed, world color
- `same_person_as` → dotted, purple (identity)
- `co_present_with` → thin grey
- `triggers_death_of` → red arrow

**Interactions:**
- Click node → fires KGInspector to show details + highlights 1-hop neighbors
- Drag nodes → stable positions
- Scroll → zoom in/out
- Double-click → expand node's hidden neighbors (ego-graph expand)
- Hover edge → show relation label tooltip

**Filters panel (left sidebar):**
- Toggle node types on/off
- Toggle relation types on/off
- World filter (Jonas / Martha / Origin)
- Year range slider (1888–2053)
- Event type (trigger / death / all)

---

### [NEW] js/kg_inspector.js — Entity Inspector Panel
Right-side panel that opens when a node is clicked:

For a **Character** node:
- Name, alternate identities (same_person_as chain)
- Event count, death events, trigger events
- Timeline of their events (mini sparkline)
- List of co-present characters (most frequent)

For an **Event** node:
- ID, date, world, description
- Characters involved (links)
- Causes / caused-by events (expandable list)
- Badge: Trigger / Death / Start

For a **World** or **TimePeriod** node:
- Count of events, characters, connections

---

### [NEW] js/kg_pathfinder.js — Shortest Path
BFS-based path finding on the KG:
- User selects two nodes (click + Shift+click)
- BFS traverses the graph
- Shortest path highlighted with animated pulse on edges
- Path shown as a breadcrumb trail in the inspector panel

---

### [NEW] js/kg_search.js — Search & Filter
- Live search box: type a name/keyword → matching nodes pulse/highlight
- Results list with entity type badges
- Click a result → camera pans to that node

---

### [MODIFY] index.html
- KG Explorer becomes the **primary full-screen view**
- Existing 4 views become **"Projections"** accessible via a secondary tab row
- Add: left filter sidebar, right inspector panel, search bar in header
- Add: "Path Finder" toggle button in header

---

### [MODIFY] js/main.js
- Boot order: `DataParser.loadData()` → `KGBuilder.build()` → `KGView.initialize(kg)` 
- All projection views receive the same `csvData` as before
- KG object shared globally for cross-view highlighting

---

## Open Questions

> [!IMPORTANT]
> **How much do you want to simplify the graph?**
> The full KG with all 4 node types + 8 relation types will have ~800+ nodes and ~2000+ edges. Options:
> - **Full KG** — everything, requires filtering panel to navigate
> - **Character-centric KG** — Character nodes primary, Events as edges between characters
> - **Event-only KG** — same as current Network view but with typed edges

> [!IMPORTANT]
> **Keep the existing 4 views as projections, or replace them entirely?**
> - **Keep as projections** — No work lost, richer app
> - **Replace with KG only** — Cleaner, simpler interface

> [!NOTE]
> **Identity graph for Dark Series is unique** — Jonas = Adam, Martha = Eve. Should `same_person_as` edges collapse into one merged super-node with a time axis, or stay as separate nodes with a dotted link?

---

## Verification Plan
- Open app, confirm KG loads with all 4 node types visually distinct
- Click a Character node → inspector shows their events and co-characters
- Shift-click two nodes → path highlights
- Toggle relation types on/off → edges appear/disappear
- All projection tabs still work independently
