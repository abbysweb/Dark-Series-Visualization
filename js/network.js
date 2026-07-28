/**
 * Network Graph Module — Dark Series Visualization
 * Force-directed graph: nodes = events, links = shared characters
 */
const NetworkGraph = (() => {
    let svg, g, simulation, allNodes, allLinks, tooltip;
    let currentFilter = { world: 'all', type: 'all' };

    const worldColor = {
        'Jonas':  'var(--jonas)',
        'Martha': 'var(--martha)',
        'Origin': 'var(--origin)',
        'Origin (End)': 'var(--origin)',
    };

    const getWorldColor = world => {
        for (const key of Object.keys(worldColor)) {
            if (world && world.includes(key)) return worldColor[key];
        }
        return 'var(--other)';
    };

    // Build links from shared characters between events
    const buildLinks = (events) => {
        const links = [];
        // Limit to a manageable subset for performance (sample every 2nd event if > 300)
        const sample = events.length > 300
            ? events.filter((_, i) => i % 2 === 0)
            : events;

        for (let i = 0; i < sample.length; i++) {
            for (let j = i + 1; j < sample.length; j++) {
                const a = sample[i], b = sample[j];
                if (!a.characters || !b.characters) continue;
                const common = a.characters.filter(c => b.characters.includes(c));
                if (common.length > 0) {
                    links.push({
                        source: a.id,
                        target: b.id,
                        weight: common.length,
                        sharedChars: common
                    });
                }
            }
        }
        // Keep only nodes that have at least one link
        return links;
    };

    const initialize = (data) => {
        allNodes = data.events.map(e => ({ ...e }));
        allLinks = buildLinks(data.events);
        tooltip = d3.select('#network-tooltip');

        svg = d3.select('#network-graph');
        g   = svg.append('g').attr('class', 'network-root');

        // Zoom behaviour
        const zoom = d3.zoom()
            .scaleExtent([0.1, 5])
            .on('zoom', ev => g.attr('transform', ev.transform));
        svg.call(zoom);

        // Arrow marker
        svg.append('defs').append('marker')
            .attr('id', 'net-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 14).attr('refY', 0)
            .attr('markerWidth', 5).attr('markerHeight', 5)
            .attr('orient', 'auto')
            .append('path').attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', 'rgba(0,0,0,0.25)');

        // Wire up controls
        d3.select('#network-world-filter').on('change', function() {
            currentFilter.world = this.value;
            render();
        });
        d3.select('#network-type-filter').on('change', function() {
            currentFilter.type = this.value;
            render();
        });

        // Resize
        window.addEventListener('resize', () => {
            if (document.getElementById('view-network').classList.contains('active')) {
                updateDimensions();
                if (simulation) simulation.alpha(0.3).restart();
            }
        });

        render();
    };

    const filterData = () => {
        let nodes = allNodes.slice();
        if (currentFilter.world !== 'all') {
            nodes = nodes.filter(n => n.world && n.world.includes(currentFilter.world));
        }
        if (currentFilter.type === 'important') {
            nodes = nodes.filter(n => n.importantTrigger);
        } else if (currentFilter.type === 'death') {
            nodes = nodes.filter(n => n.death);
        }

        // Sample for performance
        const MAX = 200;
        if (nodes.length > MAX) nodes = nodes.filter((_, i) => i % Math.ceil(nodes.length / MAX) === 0);

        const nodeIds = new Set(nodes.map(n => n.id));
        const links = allLinks
            .filter(l => nodeIds.has(l.source?.id ?? l.source) && nodeIds.has(l.target?.id ?? l.target))
            .slice(0, 500); // cap links for perf

        return { nodes, links };
    };

    const updateDimensions = () => {
        const el = document.getElementById('network-container');
        svg.attr('width', el.clientWidth).attr('height', el.clientHeight);
    };

    const render = () => {
        updateDimensions();
        const el = document.getElementById('network-container');
        const W = el.clientWidth, H = el.clientHeight;

        const { nodes, links } = filterData();

        // Update stat badge
        d3.select('#network-stats').text(`${nodes.length} events · ${links.length} connections`);

        g.selectAll('*').remove();

        if (nodes.length === 0) {
            g.append('text').attr('x', W / 2).attr('y', H / 2)
                .attr('text-anchor', 'middle').attr('fill', 'var(--text-muted)')
                .attr('font-size', 16).attr('font-family', 'Outfit, sans-serif')
                .text('No events match the current filters');
            return;
        }

        // Stop old simulation
        if (simulation) simulation.stop();

        // Draw links
        const linkSel = g.append('g').attr('class', 'links')
            .selectAll('line').data(links).enter().append('line')
            .attr('class', d => `network-link${d.weight >= 3 ? ' weighted-3' : d.weight >= 2 ? ' weighted-2' : ''}`);

        // Draw nodes
        const nodeSel = g.append('g').attr('class', 'nodes')
            .selectAll('circle').data(nodes).enter().append('circle')
            .attr('class', 'network-node')
            .attr('r', d => d.importantTrigger ? 10 : d.death ? 9 : 7)
            .attr('fill', d => getWorldColor(d.world))
            .attr('stroke', d => d.death ? 'var(--death)' : d.importantTrigger ? 'var(--trigger)' : 'rgba(0,0,0,0.15)')
            .attr('stroke-width', d => (d.death || d.importantTrigger) ? 2 : 1)
            .on('mouseover', (ev, d) => showTooltip(ev, d))
            .on('mousemove', (ev) => moveTooltip(ev))
            .on('mouseout', () => hideTooltip())
            .call(d3.drag()
                .on('start', (ev, d) => { if (!ev.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
                .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
                .on('end',   (ev, d) => { if (!ev.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
            );

        // World background labels
        const worlds = [...new Set(nodes.map(n => n.world).filter(Boolean))];
        const worldLabelGroup = g.append('g').attr('class', 'world-labels').style('pointer-events', 'none');
        worlds.forEach(w => {
            worldLabelGroup.append('text')
                .attr('class', 'network-world-label')
                .attr('x', 20).attr('y', 20 + worlds.indexOf(w) * 18)
                .text(w).attr('fill', getWorldColor(w));
        });

        simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(60).strength(0.5))
            .force('charge', d3.forceManyBody().strength(-150))
            .force('center', d3.forceCenter(W / 2, H / 2))
            .force('collision', d3.forceCollide().radius(d => (d.importantTrigger ? 10 : 7) + 4))
            .on('tick', () => {
                linkSel
                    .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
                nodeSel
                    .attr('cx', d => d.x).attr('cy', d => d.y);
            });
    };

    const showTooltip = (ev, d) => {
        const fmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const badges = [];
        if (d.importantTrigger) badges.push(`<span class="tooltip-badge badge-trigger">Trigger</span>`);
        if (d.death) badges.push(`<span class="tooltip-badge badge-death">Death</span>`);
        const worldClass = d.world?.includes('Jonas') ? 'badge-jonas' : d.world?.includes('Martha') ? 'badge-martha' : 'badge-origin';
        if (d.world) badges.push(`<span class="tooltip-badge ${worldClass}">${d.world}</span>`);

        tooltip.html(`
            <div class="tooltip-header">
                <span class="tooltip-id">Event #${d.id}</span>
                <span style="color:var(--text-secondary);font-size:11px">${fmt.format(d.date)}</span>
            </div>
            <div class="tooltip-desc">${d.description}</div>
            <div class="tooltip-meta">👤 ${d.characters?.join(', ') || 'None'}</div>
            <div style="margin-top:6px">${badges.join(' ')}</div>
        `).style('display', 'block');
        moveTooltip(ev);
    };

    const moveTooltip = (ev) => {
        const tw = 300, th = tooltip.node().offsetHeight;
        const x = Math.min(ev.clientX + 14, window.innerWidth - tw - 10);
        const y = Math.max(10, Math.min(ev.clientY - th / 2, window.innerHeight - th - 10));
        tooltip.style('left', x + 'px').style('top', y + 'px');
    };

    const hideTooltip = () => tooltip.style('display', 'none');

    return { initialize, render };
})();
