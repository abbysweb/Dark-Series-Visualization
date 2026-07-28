# Dark Series — Knowledge Graph Visualization

Abdullah Al Mamun

B.Sc. Software Engineering, Daffodil International University
M.Sc. Software Engineering, TU Wien
mamun.swe.de@gmail.com
ORCID: [0009-0006-7473-0024](https://orcid.org/0009-0006-7473-0024)

## Overview

Interactive web application for exploring the temporal, causal, and character-based relationships of the television series *Dark* (Netflix, 2017–2020). The application transforms flat CSV data into a typed Knowledge Graph and provides five coordinated visualization views, each projecting the same underlying graph from a different perspective.

## Views

| View | Description |
|------|-------------|
| **Knowledge Graph** | Force-directed graph with 4 node types (Event, Character, World, TimePeriod) and 8 edge types |
| **Temporal** | Swimlane-based timeline of events grouped by time windows |
| **Network** | Event-centric force layout linked by shared characters |
| **Bar Chart** | Event counts by year, world, or character with selectable metrics |
| **Timeline** | Beeswarm-per-lane layout across World bands (1885–2056) |

## Data

- `data/Dark_Events.csv` — ~340 events with character, world, date, trigger, and death annotations
- `data/Dark_Edges.csv` — ~590 causal edges between events

## Technology Stack

- D3.js v7 (no framework, vanilla JS)
- CSS custom properties (design tokens)
- Google Fonts (Outfit)

## Running

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server . -p 8000
```

Then open `http://localhost:8000` in a browser. A local server is required; `file://` will not work due to CORS restrictions on XHR-based CSV loading.

## Project Structure

```
├── index.html
├── css/style.css
├── data/
│   ├── Dark_Events.csv
│   └── Dark_Edges.csv
├── js/
│   ├── data_parser.js
│   ├── layout_logic.js
│   ├── visualisation.js
│   ├── network.js
│   ├── barchart.js
│   ├── timeline.js
│   ├── kg_builder.js
│   ├── kg_view.js
│   ├── kg_inspector.js
│   ├── kg_search.js
│   ├── kg_pathfinder.js
│   └── main.js
├── Report/
│   ├── Report.tex
│   └── Report.pdf
└── README.md
```

## License

Academic project.