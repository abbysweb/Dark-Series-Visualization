/**
 * Timeline Module — Dark Series Visualization
 * Horizontal swimlane timeline: world rows × time axis (1888–2053)
 *
 * Layout algorithm: Per-lane Beeswarm Simulation
 * ─────────────────────────────────────────────
 * For each world-band we run an independent D3 force simulation with:
 *   • forceX  → strong pin to the event's date position on the X axis
 *   • forceY  → gentle centering force toward lane mid-line
 *   • forceCollide → hard collision radius = node radius + padding
 *
 * This guarantees no overlap while preserving temporal order on X.
 * Filters: character, event type, world
 */
const Timeline = (() => {
    let svg, allEvents, tooltip;
    let currentFilters = { character: 'all', type: 'all', world: 'all' };
    let selectedNode   = null;

    const WORLD_ORDER  = ['Jonas', 'Martha', 'Origin'];
    const WORLD_COLORS = {
        Jonas:  'var(--jonas)',
        Martha: 'var(--martha)',
        Origin: 'var(--origin)'
    };

    const NODE_PAD = 2;   // extra gap between circles (px)

    const getWorldKey = (world) => {
        if (!world) return 'Origin';
        if (world.includes('Jonas'))  return 'Jonas';
        if (world.includes('Martha')) return 'Martha';
        return 'Origin';
    };

    const nodeRadius = (d) => d.importantTrigger ? 8 : d.death ? 7 : 5.5;

    // ── Beeswarm: run a force sim per lane and return positioned nodes ──────
    const beeswarm = (nodes, x, laneY, laneH) => {
        // Clone to avoid mutating original data objects
        const pts = nodes.map(d => ({
            ref: d,
            r:   nodeRadius(d),
            // Start at the exact time-X position, mid-lane Y
            x:   Math.max(d.r + 2, Math.min(x.range()[1] - d.r - 2, x(d.date))),
            y:   laneY + laneH / 2
        }));

        if (pts.length === 0) return pts;

        const sim = d3.forceSimulation(pts)
            // Strongly pin X to the time axis position (strength 1 = fully locked)
            .force('x', d3.forceX(d => x(d.ref.date)).strength(0.85))
            // Gently pull Y back toward lane centre
            .force('y', d3.forceY(laneY + laneH / 2).strength(0.12))
            // Collision: ensures no two circles overlap
            .force('collide', d3.forceCollide(d => d.r + NODE_PAD).strength(1).iterations(4))
            // No global charge (we only want collision-avoidance, not repulsion at distance)
            .stop();

        // Run the simulation synchronously for a fixed number of ticks
        // 120 ticks is enough to converge for typical dataset sizes
        const ticks = Math.ceil(Math.log(sim.alphaMin()) / Math.log(1 - sim.alphaDecay()));
        for (let i = 0; i < Math.min(ticks, 150); i++) sim.tick();

        // Clamp Y within lane bounds (with radius padding)
        pts.forEach(p => {
            const top    = laneY + p.r + NODE_PAD;
            const bottom = laneY + laneH - p.r - NODE_PAD;
            p.y = Math.max(top, Math.min(bottom, p.y));
        });

        return pts;
    };

    // ── Initialize ──────────────────────────────────────────────────────────
    const initialize = (data) => {
        allEvents = data.events;
        tooltip   = d3.select('#timeline-tooltip');
        svg       = d3.select('#timeline-svg');

        d3.select('#timeline-character-filter').on('change', function() {
            currentFilters.character = this.value; render();
        });
        d3.select('#timeline-event-type').on('change', function() {
            currentFilters.type = this.value; render();
        });
        d3.select('#timeline-world-filter').on('change', function() {
            currentFilters.world = this.value; render();
        });

        window.addEventListener('resize', () => {
            if (document.getElementById('view-timeline').classList.contains('active')) render();
        });

        render();
    };

    // ── Filter ───────────────────────────────────────────────────────────────
    const filterEvents = () => allEvents.filter(ev => {
        if (currentFilters.character !== 'all') {
            if (!ev.characters || !ev.characters.some(c => c.includes(currentFilters.character))) return false;
        }
        if (currentFilters.type === 'trigger' && !ev.importantTrigger) return false;
        if (currentFilters.type === 'death'   && !ev.death) return false;
        if (currentFilters.world !== 'all') {
            if (!ev.world || !ev.world.includes(currentFilters.world)) return false;
        }
        return true;
    });

    // ── Render ───────────────────────────────────────────────────────────────
    const render = () => {
        svg.selectAll('*').remove();

        const container = document.getElementById('timeline-container');
        const W = container.clientWidth;
        const H = container.clientHeight;
        svg.attr('width', W).attr('height', H);

        const margin = { top: 32, right: 30, bottom: 44, left: 90 };
        const cW = W - margin.left - margin.right;
        const cH = H - margin.top - margin.bottom;

        const events = filterEvents();

        d3.select('#timeline-stats').text(
            `${events.length} events · ${events.filter(e => e.death).length} deaths · ${events.filter(e => e.importantTrigger).length} triggers`
        );

        if (events.length === 0) {
            svg.append('text')
                .attr('x', W / 2).attr('y', H / 2)
                .attr('text-anchor', 'middle')
                .attr('fill', 'var(--text-muted)')
                .attr('font-size', 15).attr('font-family', 'Outfit, sans-serif')
                .text('No events match the current filters');
            return;
        }

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        // Determine which worlds are present in filtered set
        const presentWorlds = WORLD_ORDER.filter(w => events.some(e => getWorldKey(e.world) === w));
        if (presentWorlds.length === 0) return;

        // ── Scales ────────────────────────────────────────────────────────
        const x = d3.scaleTime()
            .domain([new Date(1885, 0, 1), new Date(2056, 0, 1)])
            .range([0, cW]);

        const laneH = cH / presentWorlds.length;

        // ── World bands & labels ─────────────────────────────────────────
        presentWorlds.forEach((w, i) => {
            const bandY = i * laneH;

            // Alternating band fill
            g.append('rect')
                .attr('class', 'timeline-world-band')
                .attr('x', 0).attr('y', bandY)
                .attr('width', cW).attr('height', laneH)
                .attr('fill', i % 2 === 0 ? 'rgba(255,255,255,0.018)' : 'rgba(255,255,255,0.008)');

            // World label (left)
            g.append('text')
                .attr('class', 'timeline-world-label')
                .attr('x', -8).attr('y', bandY + laneH / 2 + 4)
                .attr('fill', WORLD_COLORS[w])
                .text(w);

            // Mid-lane centre guide line
            g.append('line')
                .attr('x1', 0).attr('x2', cW)
                .attr('y1', bandY + laneH / 2).attr('y2', bandY + laneH / 2)
                .attr('stroke', WORLD_COLORS[w])
                .attr('stroke-width', 0.4)
                .attr('stroke-opacity', 0.25);

            // Lane separator
            if (i > 0) {
                g.append('line')
                    .attr('x1', 0).attr('x2', cW)
                    .attr('y1', bandY).attr('y2', bandY)
                    .attr('stroke', 'var(--dark-border)')
                    .attr('stroke-width', 0.8);
            }
        });

        // ── Year grid lines ───────────────────────────────────────────────
        const tickYears = d3.range(1890, 2060, 10);
        tickYears.forEach(yr => {
            const xPos = x(new Date(yr, 0, 1));
            g.append('line')
                .attr('class', 'timeline-year-line')
                .attr('x1', xPos).attr('x2', xPos)
                .attr('y1', 0).attr('y2', cH);
            g.append('text')
                .attr('class', 'timeline-year-label')
                .attr('x', xPos).attr('y', cH + 18)
                .text(yr);
        });

        // ── X axis ───────────────────────────────────────────────────────
        g.append('g').attr('class', 'axis')
            .attr('transform', `translate(0,${cH})`)
            .call(d3.axisBottom(x)
                .ticks(d3.timeYear.every(10))
                .tickFormat(d3.timeFormat('%Y'))
                .tickSizeOuter(0))
            .selectAll('text').style('display', 'none'); // custom labels above

        // ── Beeswarm layout: run per world band ──────────────────────────
        const positionedNodes = [];

        presentWorlds.forEach((w, i) => {
            const bandY   = i * laneH;
            const laneEvts = events.filter(e => getWorldKey(e.world) === w);
            const pts      = beeswarm(laneEvts, x, bandY, laneH);
            positionedNodes.push(...pts);
        });

        // ── Draw circles from positioned nodes ───────────────────────────
        const nodeData = positionedNodes;   // [{ref, r, x, y}, ...]

        const eventCircles = g.selectAll('.timeline-event-circle')
            .data(nodeData)
            .enter().append('circle')
            .attr('class', 'timeline-event-circle')
            .attr('r', d => d.r)
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('fill', d => {
                if (d.ref.importantTrigger) return 'var(--trigger)';
                return WORLD_COLORS[getWorldKey(d.ref.world)] || 'var(--other)';
            })
            .attr('stroke', d => d.ref.death ? 'var(--death)' : 'rgba(0,0,0,0.4)')
            .attr('stroke-width', d => d.ref.death ? 2.5 : 1)
            .attr('fill-opacity', 0.88)
            .on('mouseover', (ev, d) => showTooltip(ev, d.ref))
            .on('mousemove', (ev) => moveTooltip(ev))
            .on('mouseout', () => hideTooltip())
            .on('click', (ev, d) => {
                ev.stopPropagation();
                selectEvent(d.ref, eventCircles);
            });

        // Fade in
        eventCircles.attr('opacity', 0)
            .transition().duration(500)
            .delay((_, i) => Math.min(i * 1.2, 250))
            .attr('opacity', 1);

        // Deselect on background click
        svg.on('click', () => {
            eventCircles.classed('selected', false);
            selectedNode = null;
            d3.select('#timeline-detail')
              .html('<p class="detail-hint">Click any event node to see details</p>');
        });
    };

    // ── Detail panel ────────────────────────────────────────────────────────
    const selectEvent = (d, allCircles) => {
        selectedNode = d;
        // match by ref object identity
        allCircles.classed('selected', nd => nd.ref === d);

        const fmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const worldKey   = getWorldKey(d.world);
        const worldClass = `world-${worldKey.toLowerCase()}`;

        const badges = [];
        if (d.importantTrigger) badges.push(`<span class="tooltip-badge badge-trigger">⚡ Important Trigger</span>`);
        if (d.death)            badges.push(`<span class="tooltip-badge badge-death">☠ Death Event</span>`);

        d3.select('#timeline-detail').html(`
            <div class="detail-card">
                <div class="detail-row">
                    <span class="detail-label">Event ID</span>
                    <span class="detail-value" style="color:var(--accent)">#${d.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${fmt.format(d.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">World</span>
                    <span class="detail-value">
                        <span class="detail-world-badge ${worldClass}">${d.world || 'Unknown'}</span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tags</span>
                    <span class="detail-value">${badges.join(' ') || '—'}</span>
                </div>
                <div class="detail-row full-width">
                    <span class="detail-label">Description</span>
                    <span class="detail-value">${d.description}</span>
                </div>
                <div class="detail-row full-width">
                    <span class="detail-label">Characters</span>
                    <span class="detail-value">${d.characters?.join(', ') || 'None'}</span>
                </div>
            </div>
        `);
    };

    // ── Tooltip ──────────────────────────────────────────────────────────────
    const showTooltip = (ev, d) => {
        const fmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        tooltip.html(`
            <div class="tooltip-header">
                <span class="tooltip-id">Event #${d.id}</span>
                <span style="color:var(--text-secondary);font-size:11px">${fmt.format(d.date)}</span>
            </div>
            <div class="tooltip-desc">${d.description.length > 100 ? d.description.slice(0, 100) + '…' : d.description}</div>
            <div class="tooltip-meta">🌍 ${d.world || 'Unknown'}</div>
        `).style('display', 'block');
        moveTooltip(ev);
    };

    const moveTooltip = (ev) => {
        const tw = 300, th = tooltip.node().offsetHeight;
        const px = Math.min(ev.clientX + 14, window.innerWidth - tw - 10);
        const py = Math.max(10, Math.min(ev.clientY - th / 2, window.innerHeight - th - 10));
        tooltip.style('left', px + 'px').style('top', py + 'px');
    };

    const hideTooltip = () => tooltip.style('display', 'none');

    return { initialize };
})();
