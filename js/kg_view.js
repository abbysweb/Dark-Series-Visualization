/**
 * KGView — Main Knowledge Graph Visualization
 * ──────────────────────────────────────────
 * D3 force-directed graph with 4 node types and 7 edge types.
 * Node shapes:  Character=diamond  Event=circle  World=hexagon  TimePeriod=pill
 * Edge styles:  colour + stroke-dash per relation type
 */
const KGView = (() => {

    // ── Constants ───────────────────────────────────────────────────────────
    const REL_STYLES = {
        causes:            { color: 'rgba(0,0,0,0.55)', dash: 'none',    width: 1.8, label: 'causes' },
        appears_in:        { color: 'rgba(37,99,235,0.55)', dash: '6,3',   width: 1.2, label: 'appears in' },
        occurs_in:         { color: 'rgba(234,88,12,0.5)',  dash: '3,4',   width: 1.2, label: 'occurs in' },
        occurs_at:         { color: 'rgba(107,114,128,0.4)',dash: '2,5',   width: 0.9, label: 'occurs at' },
        same_person_as:    { color: 'rgba(147,51,234,0.7)',  dash: '6,3',   width: 2.2, label: 'same person' },
        co_present_with:   { color: 'rgba(22,163,74,0.4)',   dash: '3,4',   width: 0.9, label: 'co-present' },
        triggers_death_of: { color: 'rgba(220,38,38,0.7)',   dash: 'none',  width: 2,   label: 'triggers death' },
        important_trigger_for: { color: 'rgba(202,138,4,0.6)', dash: 'none', width: 1.8, label: 'important trigger' }
    };

    const WORLD_FILL = {
        Jonas:          '#3b82f6',
        Martha:         '#ef4444',
        Origin:         '#f97316',
        'Origin (End)': '#fb923c'
    };

    const getWorldFill = (world) => {
        if (!world) return '#374151';
        for (const k of Object.keys(WORLD_FILL)) if (world.includes(k)) return WORLD_FILL[k];
        return '#374151';
    };

    const NODE_STYLE = {
        Event:       { baseR: 6,  importantR: 10, deathR: 9,  color: null /* world-based */ },
        Character:   { baseSize: 546, maxSize: 1820 },   // d3.symbol size (area)
        World:       { r: 28 },
        TimePeriod:  { w: 38, h: 18 }
    };

    // ── State ────────────────────────────────────────────────────────────────
    let svg, g, simulation, kg;
    let nodeSel, edgeSel;
    let activeFilters = {
        nodeTypes: new Set(['Character', 'World']),
        relations: new Set(Object.keys(REL_STYLES)),
        world: 'all',
        eventType: 'all'
    };
    let pathHighlightSet = new Set();   // node ids in current highlighted path
    let selectedNodeId   = null;
    let pathSourceId     = null;        // for path-finding: first selected node

    // ── Init ─────────────────────────────────────────────────────────────────
    const initialize = (kgData) => {
        kg  = kgData;
        svg = d3.select('#kg-graph');
        g   = svg.append('g').attr('class', 'kg-root');

        setupZoom();
        setupMarkers();
        buildSidebar();
        render();

        window.addEventListener('resize', () => {
            if (document.getElementById('view-kg').classList.contains('active')) {
                svg.attr('width', document.getElementById('kg-container').clientWidth)
                   .attr('height', document.getElementById('kg-container').clientHeight);
            }
        });
    };

    const updateDimensions = () => {
        const el = document.getElementById('kg-container');
        svg.attr('width', el.clientWidth).attr('height', el.clientHeight);
    };

    // ── Zoom ─────────────────────────────────────────────────────────────────
    const setupZoom = () => {
        updateDimensions();
        const zoom = d3.zoom().scaleExtent([0.05, 6])
            .on('zoom', ev => g.attr('transform', ev.transform));
        svg.call(zoom);
        svg._zoom = zoom;   // stash for reset
    };

    const resetView = () => {
        const el  = document.getElementById('kg-container');
        const W   = el.clientWidth, H = el.clientHeight;
        svg.transition().duration(700).call(
            svg._zoom.transform,
            d3.zoomIdentity.translate(W / 2, H / 2).scale(0.25)
        );
    };

    // ── Arrow markers ─────────────────────────────────────────────────────────
    const setupMarkers = () => {
        const defs = svg.append('defs');
        Object.entries(REL_STYLES).forEach(([rel, style]) => {
            defs.append('marker')
                .attr('id', `arrow-${rel}`)
                .attr('viewBox', '0 -4 8 8')
                .attr('refX', 18).attr('refY', 0)
                .attr('markerWidth', 5).attr('markerHeight', 5)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-4L8,0L0,4')
                .attr('fill', style.color);
        });
        // Glow filter for highlighted nodes
       const filter = defs.append('filter').attr('id', 'glow');
        filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    };

    // ── Filter sidebar wiring ─────────────────────────────────────────────────
    const buildSidebar = () => {
        // Node type toggles
        ['Event', 'Character', 'World', 'TimePeriod'].forEach(type => {
            d3.select(`#kg-toggle-${type.toLowerCase()}`).on('change', function() {
                if (this.checked) activeFilters.nodeTypes.add(type);
                else              activeFilters.nodeTypes.delete(type);
                applyFilters();
            });
        });

        // Relation toggles
        Object.keys(REL_STYLES).forEach(rel => {
            d3.select(`#kg-rel-${rel}`).on('change', function() {
                if (this.checked) activeFilters.relations.add(rel);
                else              activeFilters.relations.delete(rel);
                applyFilters();
            });
        });

        // World filter
        d3.select('#kg-world-filter').on('change', function() {
            activeFilters.world = this.value;
            applyFilters();
        });

        // Event type
        d3.select('#kg-event-type').on('change', function() {
            activeFilters.eventType = this.value;
            applyFilters();
        });

        // Reset filters
        d3.select('#kg-reset-filters').on('click', () => {
            activeFilters.nodeTypes = new Set(['Character', 'World']);
            activeFilters.world = 'all';
            activeFilters.eventType = 'all';
            d3.selectAll('#kg-sidebar input[type="checkbox"]').property('checked', function() {
                return this.id === 'kg-toggle-character' || this.id === 'kg-toggle-world';
            });
            d3.select('#kg-world-filter').property('value', 'all');
            d3.select('#kg-event-type').property('value', 'all');
            applyFilters();
        });

        // Reset view
        d3.select('#kg-reset-view').on('click', resetView);

        // Clear path
        d3.select('#kg-clear-path').on('click', clearPath);

        // Focus mode toggle
        d3.select('#kg-focus-mode').on('click', function() {
            const isActive = this.classList.toggle('active');
            d3.select('#kg-path-status').text(
                isActive ? 'Click a node to focus its neighbourhood' : ''
            );
            pathSourceId = null;
            if (!isActive) clearHighlight();
        });

        // Path finder instruction
        d3.select('#kg-pathfind-mode').on('click', function() {
            pathSourceId = null;
            clearPath();
            this.classList.toggle('active');
            d3.select('#kg-path-status').text(
                this.classList.contains('active')
                    ? 'Click a start node…'
                    : ''
            );
        });
    };

    // ── Render ───────────────────────────────────────────────────────────────
    const render = () => {
        const el = document.getElementById('kg-container');
        const W  = el.clientWidth, H = el.clientHeight;
        svg.attr('width', W).attr('height', H);

        g.selectAll('*').remove();
        if (simulation) simulation.stop();

        const visNodes = getVisibleNodes();
        const visEdges = getVisibleEdges(visNodes);

        // Stat badge
        d3.select('#kg-stats').text(
            `${visNodes.length} nodes · ${visEdges.length} edges · ${kg.byType.characters.length} chars`
        );

        // ── Edge layer ────────────────────────────────────────────────────
        const edgeG = g.append('g').attr('class', 'kg-edges');
        edgeSel = edgeG.selectAll('.kg-edge')
            .data(visEdges, d => d.id)
            .enter().append('line')
            .attr('class', 'kg-edge')
            .attr('stroke', d => REL_STYLES[d.relation]?.color || 'rgba(255,255,255,0.2)')
            .attr('stroke-width', d => REL_STYLES[d.relation]?.width || 1)
            .attr('stroke-dasharray', d => REL_STYLES[d.relation]?.dash === 'none' ? null : REL_STYLES[d.relation]?.dash)
            .attr('marker-end', d => `url(#arrow-${d.relation})`)
            .attr('opacity', d => {
            if (d.relation === 'causes') return 0.7;
            if (d.relation === 'same_person_as') return 0.75;
            if (d.relation === 'triggers_death_of') return 0.8;
            if (d.relation === 'important_trigger_for') return 0.65;
            return 0.35;
        });

        // ── Node layer ─────────────────────────────────────────────────────
        const nodeG = g.append('g').attr('class', 'kg-nodes');
        nodeSel = nodeG.selectAll('.kg-node')
            .data(visNodes, d => d.id)
            .enter().append('g')
            .attr('class', d => `kg-node kg-node-${d.type.toLowerCase()}`)
            .call(drag())
            .on('click', onNodeClick)
            .on('mouseover', onNodeHover)
            .on('mouseout', onNodeOut);

        // Draw shape per type
        nodeSel.each(function(d) {
            const sel = d3.select(this);
            if (d.type === 'Character') drawCharacter(sel, d);
            else if (d.type === 'Event') drawEvent(sel, d);
            else if (d.type === 'World') drawWorld(sel, d);
            else if (d.type === 'TimePeriod') drawTimePeriod(sel, d);
        });

        // ── Force simulation ───────────────────────────────────────────────
        const maxCharCount = d3.max(kg.byType.characters, c => c.eventCount) || 1;

        simulation = d3.forceSimulation(visNodes)
            .force('link', d3.forceLink(visEdges).id(d => d.id)
                .distance(d => linkDist(d)).strength(d => linkStr(d)))
            .force('charge', d3.forceManyBody()
                .strength(d => d.type === 'World' ? -1200 : d.type === 'Character' ? -250 : -50))
            .force('center', d3.forceCenter(W / 2, H / 2).strength(0.005))
            .force('collide', d3.forceCollide(d => collideR(d) + 6).iterations(3))
            .force('cx', d3.forceX(d => clusterX(d, W)).strength(d => d.type === 'TimePeriod' ? 0.5 : d.type === 'World' ? 0.08 : 0.02))
            .force('cy', d3.forceY(d => clusterY(d, H)).strength(d => d.type === 'TimePeriod' ? 0.3 : d.type === 'World' ? 0.06 : 0.02))
            .alphaDecay(0.05)
            .alphaTarget(0)
            .on('tick', ticked);

        setTimeout(() => { simulation.stop(); resetView(); }, 600);
    };

    // ── Node drawing helpers ─────────────────────────────────────────────────
    const drawCharacter = (sel, d) => {
        const maxCount = d3.max(kg.byType.characters, c => c.eventCount) || 1;
        const size = 546 + (d.eventCount / maxCount) * 1274;
        const r = Math.sqrt(size / Math.PI);

        sel.append('rect')
            .attr('width', r * 1.9).attr('height', r * 1.9)
            .attr('x', -r * 0.95).attr('y', -r * 0.95)
            .attr('transform', 'rotate(45)')
            .attr('fill', d.worldSuffix === 'M' ? 'rgba(239,68,68,0.88)' :
                          d.worldSuffix === 'J' ? 'rgba(59,130,246,0.88)' : 'rgba(249,115,22,0.88)')
            .attr('stroke', '#d97706')
            .attr('stroke-width', d.hasIdentity ? 2.5 : 1.2)
            .attr('rx', 4);

        const fontSize = Math.max(9, Math.min(13, r * 0.55));
        const label = d.label.length > 18 ? d.label.slice(0, 16) + '…' : d.label;

        sel.append('text')
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
            .attr('font-size', fontSize)
            .attr('font-family', 'Outfit, sans-serif').attr('font-weight', '600')
            .attr('fill', '#fff').attr('pointer-events', 'none')
            .text(label);

        if (d.hasIdentity) {
            sel.append('circle').attr('r', 4.5).attr('cx', 0)
                .attr('cy', -(r * 0.95 + 6))
                .attr('fill', '#a855f7').attr('pointer-events', 'none');
        }
    };

    const drawEvent = (sel, d) => {
        const r = d.importantTrigger ? 9 : d.death ? 8 : 6;
        sel.append('circle').attr('r', r)
            .attr('fill', getWorldFill(d.world))
            .attr('fill-opacity', 0.9)
            .attr('stroke', d.death ? '#a855f7' : d.importantTrigger ? '#eab308' : 'rgba(0,0,0,0.25)')
            .attr('stroke-width', (d.death || d.importantTrigger) ? 2 : 1.2);

        if (d.importantTrigger) {
            sel.append('circle').attr('r', r + 4)
                .attr('fill', 'none').attr('stroke', '#d97706')
                .attr('stroke-width', 1).attr('stroke-opacity', 0.5)
                .attr('pointer-events', 'none');

            sel.append('text')
                .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
                .attr('font-size', 6).attr('font-family', 'Outfit, sans-serif')
                .attr('fill', '#fff').attr('pointer-events', 'none')
                .attr('font-weight', '700')
                .text('!');
        }
    };

    const drawWorld = (sel, d) => {
        const r = 32;
        const hex = d3.range(6).map(i => {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            return [r * Math.cos(a), r * Math.sin(a)];
        });
        sel.append('polygon')
            .attr('points', hex.map(p => p.join(',')).join(' '))
            .attr('fill', getWorldFill(d.name) + 'cc')
            .attr('stroke', getWorldFill(d.name))
            .attr('stroke-width', 2);

        const label = d.label.split(' ')[0];
        sel.append('text')
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
            .attr('font-size', 10).attr('font-family', 'Outfit, sans-serif')
            .attr('font-weight', '700').attr('fill', '#fff')
            .attr('pointer-events', 'none')
            .text(label);
    };

    const drawTimePeriod = (sel, d) => {
        const w = 44, h = 20;
        sel.append('rect')
            .attr('x', -w/2).attr('y', -h/2)
            .attr('width', w).attr('height', h).attr('rx', 8)
            .attr('fill', 'rgba(156,163,175,0.9)').attr('stroke', 'rgba(156,163,175,0.6)')
            .attr('stroke-width', 1);
        sel.append('text')
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
            .attr('font-size', 10).attr('font-family', 'Outfit, sans-serif')
            .attr('fill', '#fff').attr('pointer-events', 'none')
            .attr('font-weight', '600')
            .text(d.label);
    };

    // ── Force helpers ────────────────────────────────────────────────────────
    const linkDist = (e) => {
        const rel = e.relation;
        if (rel === 'same_person_as')    return 60;
        if (rel === 'co_present_with')   return 90;
        if (rel === 'appears_in')        return 80;
        if (rel === 'causes')            return 65;
        if (rel === 'occurs_in')         return 110;
        if (rel === 'occurs_at')         return 100;
        if (rel === 'important_trigger_for') return 70;
        if (rel === 'triggers_death_of')     return 75;
        return 65;
    };

    const linkStr = (e) => {
        const rel = e.relation;
        if (rel === 'same_person_as')    return 0.85;
        if (rel === 'co_present_with')   return 0.08;
        if (rel === 'occurs_in')         return 0.04;
        if (rel === 'occurs_at')         return 0.04;
        if (rel === 'important_trigger_for') return 0.15;
        if (rel === 'triggers_death_of')     return 0.12;
        if (rel === 'causes')            return 0.3;
        if (rel === 'appears_in')        return 0.25;
        return 0.15;
    };

const collideR = (d) => {
    if (d.type === 'Character') {
        const maxCount = d3.max(kg.byType.characters, c => c.eventCount) || 1;
        const area = 546 + (d.eventCount / maxCount) * 1274;
        return Math.sqrt(area / Math.PI) * 0.85 + 5;
    }
    if (d.type === 'World')      return 32;
    if (d.type === 'TimePeriod') return 24;
    return d.importantTrigger ? 11 : d.death ? 10 : 8;
};

    const clusterX = (d, W) => {
        if (d.type === 'Character')   return W * 0.25;
        if (d.type === 'World')       return W * 0.75;
        if (d.type === 'TimePeriod')  {
            const minY = Math.min(...kg.byType.timePeriods.map(t => t.year));
            const maxY = Math.max(...kg.byType.timePeriods.map(t => t.year));
            return W * 0.1 + ((d.year - minY) / (maxY - minY || 1)) * W * 0.8;
        }
        return W * 0.5;
    };

    const clusterY = (d, H) => {
        if (d.type === 'Character')   return H * 0.35;
        if (d.type === 'World')       return H * 0.3;
        if (d.type === 'TimePeriod')  return H * 0.92;
        return H * 0.5;
    };

    // ── Tick ─────────────────────────────────────────────────────────────────
    const ticked = () => {
        edgeSel
            .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        nodeSel
            .attr('transform', d => `translate(${d.x},${d.y})`);
    };

    // ── Drag ─────────────────────────────────────────────────────────────────
    const drag = () => d3.drag()
        .on('start', (ev, d) => {
            if (!ev.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end', (ev, d) => {
            if (!ev.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
        });

    // ── Visibility filters ───────────────────────────────────────────────────
    const getVisibleNodes = () => {
        return kg.nodes.filter(n => {
            if (!activeFilters.nodeTypes.has(n.type)) return false;
            if (n.type === 'Event') {
                if (activeFilters.world !== 'all' && n.world && !n.world.includes(activeFilters.world)) return false;
                if (activeFilters.eventType === 'trigger' && !n.importantTrigger) return false;
                if (activeFilters.eventType === 'death'   && !n.death)            return false;
            }
            if (n.type === 'Character') {
                if (activeFilters.world === 'Jonas'  && n.worldSuffix !== 'J') return false;
                if (activeFilters.world === 'Martha' && n.worldSuffix !== 'M') return false;
            }
            return true;
        });
    };

    const getVisibleEdges = (visNodes) => {
        const ids = new Set(visNodes.map(n => n.id));
        return kg.edges.filter(e => {
            const src = e.sourceId;
            const tgt = e.targetId;
            return activeFilters.relations.has(e.relation) && ids.has(src) && ids.has(tgt);
        });
    };

    const applyFilters = () => {
        // Re-render from scratch (cheaper than partial DOM update for this graph size)
        render();
    };

    // ── Interaction ──────────────────────────────────────────────────────────
    const onNodeClick = (ev, d) => {
        ev.stopPropagation();

        // Path-finder mode
        const pfBtn = document.getElementById('kg-pathfind-mode');
        if (pfBtn && pfBtn.classList.contains('active')) {
            if (!pathSourceId) {
                pathSourceId = d.id;
                d3.select('#kg-path-status').text(`Start: ${d.label} — now click an end node`);
                highlightNodes(new Set([d.id]), null);
            } else if (pathSourceId !== d.id) {
                const path = KGPathfinder.shortestPath(kg, pathSourceId, d.id);
                if (path) {
                    highlightPath(path);
                    d3.select('#kg-path-status').text(`Path length: ${path.length - 1} hops`);
                    KGInspector.showPath(path, kg);
                } else {
                    d3.select('#kg-path-status').text('No path found between these nodes');
                }
                pfBtn.classList.remove('active');
                pathSourceId = null;
            }
            return;
        }

        // Normal click → inspector
        selectedNodeId = d.id;
        highlightNeighbourhood(d.id);
        KGInspector.showNode(d, kg);
    };

    const onNodeHover = (ev, d) => {
        KGSearch.showTooltip(ev, d);
        d3.select(ev.currentTarget).raise();
    };

    const onNodeOut = () => {
        KGSearch.hideTooltip();
    };

    // ── Background click → deselect (wired inside initialize) ─────────────
    const bindBackgroundClick = () => {
        svg.on('click', () => {
            selectedNodeId = null;
            clearHighlight();
            KGInspector.clear();
        });
    };

    // ── Highlight helpers ────────────────────────────────────────────────────
    const highlightNeighbourhood = (nodeId) => {
        const nbrs = kg.neighbours.get(nodeId) || new Set();
        const highlighted = new Set([nodeId, ...nbrs]);
        highlightNodes(highlighted, nodeId);
    };

    const highlightNodes = (highlightedIds, focalId) => {
        nodeSel?.attr('opacity', d => highlightedIds.has(d.id) ? 1 : 0.06)
            .attr('filter', d => highlightedIds.has(d.id) ? 'url(#glow)' : null);
        edgeSel?.attr('opacity', e => {
            return highlightedIds.has(e.sourceId) && highlightedIds.has(e.targetId) ? 0.95 : 0.01;
        }).attr('stroke-width', e => {
            return highlightedIds.has(e.sourceId) && highlightedIds.has(e.targetId) ? 2.5 : (REL_STYLES[e.relation]?.width || 1);
        });
    };

    const highlightPath = (pathIds) => {
        pathHighlightSet = new Set(pathIds);
        const pathSet   = new Set(pathIds);
        const edgePairs = new Set();
        for (let i = 0; i < pathIds.length - 1; i++) {
            edgePairs.add(`${pathIds[i]}→${pathIds[i+1]}`);
            edgePairs.add(`${pathIds[i+1]}→${pathIds[i]}`);
        }
        nodeSel?.attr('opacity', d => pathSet.has(d.id) ? 1 : 0.05)
            .attr('filter', d => pathSet.has(d.id) ? 'url(#glow)' : null);
        edgeSel?.attr('opacity', e => {
            return edgePairs.has(`${e.sourceId}→${e.targetId}`) ? 1 : 0.03;
        }).attr('stroke-width', e => {
            const onPath = edgePairs.has(`${e.sourceId}→${e.targetId}`);
            return onPath ? 3 : REL_STYLES[e.relation]?.width || 1;
        });
    };

    const clearHighlight = () => {
        pathHighlightSet.clear();
        nodeSel?.attr('opacity', 1);
        edgeSel?.attr('opacity', d => {
            if (d.relation === 'causes') return 0.7;
            if (d.relation === 'same_person_as') return 0.75;
            if (d.relation === 'triggers_death_of') return 0.8;
            if (d.relation === 'important_trigger_for') return 0.65;
            return 0.35;
        })
            .attr('stroke-width', e => REL_STYLES[e.relation]?.width || 1);
    };

    const clearPath = () => {
        pathSourceId = null;
        pathHighlightSet.clear();
        clearHighlight();
        d3.select('#kg-path-status').text('');
        KGInspector.clear();
    };

    // ── Focus / zoom to node ─────────────────────────────────────────────────
    const focusNode = (nodeId) => {
        const node = kg.nodeMap.get(nodeId);
        if (!node || node.x == null) return;
        const el  = document.getElementById('kg-container');
        const W   = el.clientWidth, H = el.clientHeight;
        const scale = 1.8;
        svg.transition().duration(700).call(
            svg._zoom.transform,
            d3.zoomIdentity
                .translate(W / 2 - node.x * scale, H / 2 - node.y * scale)
                .scale(scale)
        );
        onNodeClick({ stopPropagation: () => {} }, node);
    };

    return { initialize, applyFilters, highlightPath, focusNode, clearPath, resetView };
})();
