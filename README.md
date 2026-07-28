# Dark Series -- Knowledge Graph Visualization

Interactive web application for exploring the temporal, causal, and character-based relationships of the television series *Dark* (Netflix, 2017--2020). Transforms flat CSV data into a typed Knowledge Graph and provides six coordinated visualization views.

---

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
