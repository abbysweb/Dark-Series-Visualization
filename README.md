# Dark Series -- Knowledge Graph Visualization

Interactive web application for exploring the temporal, causal, and character-based relationships of the television series *Dark* (Netflix, 2017--2020). Transforms flat CSV data into a typed Knowledge Graph and provides six coordinated visualization views.



## Author
**Abdullah Al Mamun**  
M.Sc. & B.Sc. in Software Engineering  
TU Wien (Vienna, Austria) & Daffodil International University  
Email: mamun.swe.de@gmail.com  
GitHub: [github.com/abbysweb](https://github.com/abbysweb)  
ORCID: [0009-0006-7473-0024](https://orcid.org/0009-0006-7473-0024)

---

## Views

| View | Description |
|------|-------------|
| **Knowledge Graph** | Force-directed graph with 4 node types (Event, Character, World, TimePeriod) and 8 edge types |
| **Temporal** | Swimlane-based timeline of events grouped by time windows |
| **Network** | Event-centric force layout linked by shared characters |
| **Bar Chart** | Event counts by year, world, or character with selectable metrics |
| **Analytics** | Summary dashboard with key metrics and 4 chart types |
| **Timeline** | Beeswarm-per-lane layout across World bands (1885--2056) |

---

## Data

- `data/Dark_Events.csv` -- ~340 events with character, world, date, trigger, and death annotations
- `data/Dark_Edges.csv` -- ~590 causal edges between events

---

## Technology Stack

- **D3.js v7** -- rendering and force simulation (no framework)
- **Vanilla JS** -- modular Revealing Module Pattern (IIFE)
- **CSS custom properties** -- design tokens for theming
- **Google Fonts** -- Outfit typeface

---

## Running

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in a browser. A local server is required; `file://` will not work due to CORS restrictions on XHR-based CSV loading.

---

## Project Structure

```
Dark Series Visualization/
  index.html                    # Main page with 6 view panels
  README.md                     # This file
  implementation_plan.md        # Implementation plan
  css/
    style.css                   # Unified stylesheet (white theme)
  data/
    Dark_Events.csv             # Event records (~340 rows)
    Dark_Edges.csv              # Causal edges (~590 rows)
  js/
    main.js                     # Boot sequence & view manager
    data_parser.js              # CSV loader & preprocessing
    kg_builder.js               # KG data model construction
    kg_view.js                  # Main KG D3 force visualization
    kg_inspector.js             # Entity detail panel
    kg_search.js                # Live search + tooltips
    kg_pathfinder.js            # BFS shortest-path module
    analytics.js                # Analytics dashboard view
    barchart.js                 # Bar chart module
    timeline.js                 # Beeswarm timeline renderer
    network.js                  # Force network renderer
    visualisation.js            # Temporal graph renderer
    layout_logic.js             # Temporal graph layout engine
  Report/
    Report.tex                  # LaTeX report source
    Report.pdf                  # Compiled PDF report
    ...                         # (aux, log, out, toc)
```

---

## Key Design Decisions

- **Static graph layout** -- the force simulation stops after 600ms; nodes stay in place for a stable, frustration-free exploration
- **Larger character diamonds** -- node area scales with appearance frequency (546--1820 range) for readable labels
- **White theme** -- clean light palette optimized for readability and reduced eye strain
- **D3 mutation protection** -- persistent `sourceId`/`targetId` strings on edges prevent D3 simulation corruption
- **Improved identity detection** -- two-tier matching for Dark dual-identity pairs (Jonas/Adam, Mikkel/Michael, Martha/Eve, etc.)

---

## License

Academic project.

---

## Report

### Dark Series – Knowledge Graph Visualization
**Technical Design Report**

Abdullah Al Mamun
B.Sc. Software Engineering, Daffodil International University
M.Sc. Software Engineering, TU Wien
mamun.swe.de@gmail.com
ORCID: 0009-0006-7473-0024
July 28, 2026

### Abstract
This report documents the architecture, data model, implementation, and recent improvements of the Dark Series Knowledge Graph Visualization — an interactive web application for exploring the temporal, causal, and character-based relationships of the television series *Dark* (Netflix, 2017–2020). The application transforms flat CSV data into a typed Knowledge Graph and provides five coordinated visualization views, each projecting the same underlying graph from a different perspective. This report details the data model, the D3.js-based rendering pipeline, the bug fixes and architectural improvements applied, and guidelines for extending the system.

### 1 Development Approach
This project was developed following a structured, iterative methodology that combined data modeling, iterative visualization design, and systematic bug fixing.

### 2 Project Overview
The Dark Series Knowledge Graph Visualization is a single-page web application built with vanilla JavaScript and the D3.js library (v7). It loads two CSV datasets — `Dark_Events.csv` (~340 events) and `Dark_Edges.csv` (~590 causal edges) — and converts them into a unified Knowledge Graph (KG) comprising four entity types and eight typed, directed relations.

**Views:**
1. **Knowledge Graph** — primary full-screen force-directed graph with node shapes and colors encoding entity types
2. **Temporal Graph** — swimlane-based timeline of events grouped by time windows
3. **Force Network** — event-centric graph linking events by shared characters
4. **Bar Chart** — grouped bar chart of event counts by year, world, or character
5. **Analytics Dashboard** — summary dashboard with key metrics and four configurable distribution charts
6. **Timeline** — horizontal beeswarm layout of events across World bands (1888–2053)

### 3 Architecture
3.1 **File Structure** — Flat client-side architecture with no build step or framework, using modular IIFE pattern for each JavaScript component.
3.2 **Boot Sequence** — `DataParser.loadData()` → `KGBuilder.build(data)` → `ViewManager.boot(data, kg)`. The loading overlay is hidden after completion and the KG view becomes active immediately. All other views are lazily initialized on first navigation.

### 4 Data Model
4.1 **Knowledge Graph Schema** — 4 node types and 8 edge types:

| Type | Shape | Color | Example |
|------|-------|-------|---------|
| Event | Circle | World-dependent | "Mikkel disappears" |
| Character | Diamond | Gold accent | Jonas Kahnwald / Adam (J) |
| World | Hexagon | Unique tint | Jonas World |
| TimePeriod | Rounded rect | Grey | 1986, 2019 |

Edge types: `appears_in`, `causes`, `occurs_in`, `occurs_at`, `same_person_as`, `co_present_with`, `triggers_death_of`, `important_trigger_for`.

4.2 **Identity Detection** — Characters with `/` in their names are recognized as dual-identity personas. Matching works by: (1) stripping world-market tags `(J)`, `(M)`, `(O)`, (2) cross-referencing for word-level overlap. This correctly links Jonas/Adam, Mikkel/Michael, Martha/Eve, Noah/Hanno Tauber, and cross-world duplicates like Charlotte Doppler.

### 5 View Implementations
5.1 **Knowledge Graph** — D3 force-directed graph. Character nodes are diamonds (size proportional to appearance frequency). Events are circles colored by world. Nodes are draggable, scrollable for zoom, with hover tooltips and click-to-inspect interaction.
5.2 **Temporal Graph** — Swimlane-based timeline of events grouped by time windows. Smooth Bezier curves connect events across adjacent time boxes.
5.3 **Force Network** — Event-centric force layout linking events that share characters. Node size encodes importance.
5.4 **Bar Chart** — Grouped vertical bars with configurable grouping (year, world, top-25 characters) and animated D3 transitions.
5.5 **Analytics Dashboard** — Seven key metrics as stat cards plus four configurable charts: events-by-year bar chart, edge-type donut chart, top-20 character involvement, and events-by-world distribution.

### 6 Technical Implementation Details
6.1 **Data Parsing** — CSV loading via D3's `d3.csv()`, date parsing from `DD-MM-YYYY`, character list splitting, time-range clustering (years with gaps ≤5), start-node identification.
6.2 **Layout Engine** — Temporal boxes sized proportionally to event count and time span (weighted 0.7/0.3), swimlanes divided by character event counts, force-directed repulsion within swimlanes (40 iterations, strength 1000), cubic Bézier transition paths.
6.3 **Search Module** — Substring matching (min 2 characters), results capped at 12 with entity-type badges, camera pan via D3 zoom interpolation (700ms).
6.4 **Inspector Module** — Rich detail panel per node type: character info with identity links and statistics, event causal chains, world/time period aggregates.

### 7 Improvements Applied
7.1 **Identity Detection Bug Fix** (`kg_builder.js`) — Replaced exact string matching with two-tier algorithm: strip tags first, then check word overlap for `/`-separated names.
7.2 **D3 Edge Mutation Protection** (`kg_builder.js`, `kg_view.js`, `kg_inspector.js`) — Added persistent `sourceId`/`targetId` strings to every edge, eliminating 22 `typeof` checks across the codebase.
7.3 **Feature: `important_trigger_for` Edge Type** — Eighth relation type linking important-trigger events to the events they directly cause.
7.4 **Separate `kg_pathfinder.js`** — BFS shortest-path algorithm extracted into a dedicated 17-line module for better separation of concerns.

### 8 How to Run
1. Serve the project directory: `python -m http.server 8000`
2. Open `http://localhost:8000` in a browser.
3. A local server is required; `file://` will not work due to CORS restrictions on XHR-based CSV loading.

### 9 Development Process
9.1 **Data Pipeline** — CSV analysis, normalization, derived metadata computation.
9.2 **Architecture Decisions** — Modular IIFE pattern for encapsulation without build tools; shared data objects passed to each view's initializer.
9.3 **Knowledge Graph Construction** — Two-tier identity detection for Dark dual-identity pairs; D3 mutation protection via stable IDs.
9.4 **Visualization Design** — Each view serves a distinct analytical purpose; diamond/circle/hexagon/pill shapes with distinct edge dash patterns for immediate visual encoding.
9.5 **Challenges** — D3 simulation mutation (fixed with stable IDs), performance with 800+ nodes (type-specific charge strengths), cross-world identity mapping (tag stripping).

### 10 Conclusion
The Dark Series Knowledge Graph Visualization successfully transforms flat CSV data into a rich, interactive graph exploration experience. The Knowledge Graph serves as a unified data backbone for six distinct visualization views plus an Analytics dashboard, enabling users to explore character relationships, causal chains, and temporal patterns from multiple complementary perspectives.
