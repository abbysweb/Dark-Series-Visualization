/**
 * KGInspector — Entity detail panel for the Knowledge Graph
 * Renders rich contextual info for any clicked node.
 */
const KGInspector = (() => {

    const panel     = () => document.getElementById('kg-inspector-content');
    const panelWrap = () => document.getElementById('kg-inspector');

    const open  = () => panelWrap()?.classList.add('open');
    const close = () => { panelWrap()?.classList.remove('open'); clear(); };

    const clear = () => {
        const p = panel();
        if (p) p.innerHTML = '<p class="kg-inspector-hint">Click any node to inspect it</p>';
    };

    // ── World badge helper ───────────────────────────────────────────────────
    const worldBadge = (world) => {
        if (!world) return '';
        const cls = world.includes('Martha') ? 'badge-martha'
                  : world.includes('Jonas')  ? 'badge-jonas'
                  : 'badge-origin';
        return `<span class="tooltip-badge ${cls}">${world}</span>`;
    };

    // ── Show node ────────────────────────────────────────────────────────────
    const showNode = (d, kg) => {
        open();
        const p = panel();
        if (!p) return;

        if      (d.type === 'Character')  p.innerHTML = renderCharacter(d, kg);
        else if (d.type === 'Event')      p.innerHTML = renderEvent(d, kg);
        else if (d.type === 'World')      p.innerHTML = renderWorld(d, kg);
        else if (d.type === 'TimePeriod') p.innerHTML = renderTimePeriod(d, kg);

        // Wire "focus" links inside inspector
        p.querySelectorAll('[data-focus-node]').forEach(el => {
            el.addEventListener('click', () => KGView.focusNode(el.dataset.focusNode));
        });
    };

    // ── Character inspector ──────────────────────────────────────────────────
    const renderCharacter = (d, kg) => {
        // Gather their events
        const eventEdges = kg.edges.filter(e => {
            return e.sourceId === d.id && e.relation === 'appears_in';
        });
        const eventNodes = eventEdges.map(e => {
            return kg.nodeMap.get(e.targetId);
        }).filter(Boolean);

        // Deaths
        const deathEvents = eventNodes.filter(e => e.death);
        // Triggers
        const triggerEvents = eventNodes.filter(e => e.importantTrigger);

        // Co-present characters
        const coPresentEdges = kg.edges.filter(e => {
            return e.relation === 'co_present_with' && (e.sourceId === d.id || e.targetId === d.id);
        });
        const coChars = coPresentEdges.map(e => {
            const otherId = e.sourceId === d.id ? e.targetId : e.sourceId;
            return { node: kg.nodeMap.get(otherId), count: e.count || 1 };
        }).filter(x => x.node).sort((a, b) => b.count - a.count).slice(0, 8);

        // Identity links
        const samePersonEdges = kg.edges.filter(e => {
            return e.relation === 'same_person_as' && (e.sourceId === d.id || e.targetId === d.id);
        });
        const identities = samePersonEdges.map(e => {
            const otherId = e.sourceId === d.id ? e.targetId : e.sourceId;
            return kg.nodeMap.get(otherId);
        }).filter(Boolean);

        // Year sparkline data (events per year)
        const yearCounts = {};
        eventNodes.forEach(ev => { yearCounts[ev.year] = (yearCounts[ev.year] || 0) + 1; });
        const sparkline = buildSparkline(yearCounts);

        return `
            <div class="kg-entity-header kg-char-header">
                <div class="kg-entity-diamond"></div>
                <div>
                    <div class="kg-entity-title">${d.fullName}</div>
                    <div class="kg-entity-type-badge kg-badge-character">Character</div>
                    ${d.worldSuffix ? `<span class="kg-world-pill kg-world-${d.worldSuffix === 'M' ? 'martha' : 'jonas'}">${d.worldSuffix === 'M' ? 'Martha World' : 'Jonas World'}</span>` : ''}
                </div>
            </div>

            ${identities.length > 0 ? `
            <div class="kg-section">
                <div class="kg-section-title">🔗 Identity (same person)</div>
                ${identities.map(n => `
                    <span class="kg-link-chip" data-focus-node="${n.id}">${n.label}</span>
                `).join('')}
            </div>` : ''}

            <div class="kg-stat-grid">
                <div class="kg-stat"><div class="kg-stat-val">${d.eventCount}</div><div class="kg-stat-lbl">Events</div></div>
                <div class="kg-stat"><div class="kg-stat-val kg-death-val">${d.deathCount}</div><div class="kg-stat-lbl">Deaths</div></div>
                <div class="kg-stat"><div class="kg-stat-val kg-trigger-val">${d.triggerCount}</div><div class="kg-stat-lbl">Triggers</div></div>
                <div class="kg-stat"><div class="kg-stat-val">${coPresentEdges.length}</div><div class="kg-stat-lbl">Co-actors</div></div>
            </div>

            <div class="kg-section">
                <div class="kg-section-title">📅 Activity timeline</div>
                ${sparkline}
            </div>

            ${coChars.length > 0 ? `
            <div class="kg-section">
                <div class="kg-section-title">👥 Most frequent co-actors</div>
                <div class="kg-chip-list">
                    ${coChars.map(({ node, count }) => `
                        <span class="kg-link-chip" data-focus-node="${node.id}">${node.label} <span class="kg-chip-count">×${count}</span></span>
                    `).join('')}
                </div>
            </div>` : ''}

            ${deathEvents.length > 0 ? `
            <div class="kg-section">
                <div class="kg-section-title">☠ Death events</div>
                ${deathEvents.slice(0, 4).map(e => `
                    <div class="kg-event-row" data-focus-node="event:${e.eventId}">
                        <span class="kg-event-year">${e.year}</span>
                        <span class="kg-event-desc">${e.description?.slice(0, 70)}…</span>
                    </div>
                `).join('')}
            </div>` : ''}

            ${triggerEvents.length > 0 ? `
            <div class="kg-section">
                <div class="kg-section-title">⚡ Trigger events</div>
                ${triggerEvents.slice(0, 4).map(e => `
                    <div class="kg-event-row" data-focus-node="event:${e.eventId}">
                        <span class="kg-event-year">${e.year}</span>
                        <span class="kg-event-desc">${e.description?.slice(0, 70)}…</span>
                    </div>
                `).join('')}
            </div>` : ''}
        `;
    };

    // ── Event inspector ──────────────────────────────────────────────────────
    const renderEvent = (d, kg) => {
        const fmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const dateStr = d.date ? fmt.format(d.date) : String(d.year);

        // Causal edges
        const causeEdges = kg.edges.filter(e => {
            return e.relation === 'causes' && e.targetId === d.id;
        });
        const effectEdges = kg.edges.filter(e => {
            return e.relation === 'causes' && e.sourceId === d.id;
        });

        const causedBy = causeEdges.map(e => kg.nodeMap.get(e.sourceId)).filter(Boolean);
        const causes = effectEdges.map(e => kg.nodeMap.get(e.targetId)).filter(Boolean);

        const badges = [];
        if (d.importantTrigger) badges.push('<span class="tooltip-badge badge-trigger">⚡ Important Trigger</span>');
        if (d.death)            badges.push('<span class="tooltip-badge badge-death">☠ Death Event</span>');

        return `
            <div class="kg-entity-header">
                <div class="kg-entity-circle" style="background:${worldFillCSS(d.world)}"></div>
                <div>
                    <div class="kg-entity-title">Event #${d.eventId}</div>
                    <div class="kg-entity-type-badge kg-badge-event">Event</div>
                    ${worldBadge(d.world)}
                </div>
            </div>

            <div class="kg-section">
                <div class="kg-section-title">📅 Date</div>
                <div class="kg-detail-val">${dateStr}</div>
            </div>

            <div class="kg-section">
                <div class="kg-section-title">📝 Description</div>
                <div class="kg-detail-val kg-desc-text">${d.description}</div>
            </div>

            ${badges.length > 0 ? `<div class="kg-section">${badges.join(' ')}</div>` : ''}

            ${(d.characters || []).length > 0 ? `
            <div class="kg-section">
                <div class="kg-section-title">👤 Characters</div>
                <div class="kg-chip-list">
                    ${d.characters.map(c => `
                        <span class="kg-link-chip" data-focus-node="char:${c}">${c.split(' / ').map(p => p.split(' ')[0]).join(' / ')}</span>
                    `).join('')}
                </div>
            </div>` : ''}

            ${causedBy.length > 0 ? `
            <div class="kg-section">
                <div class="kg-section-title">⬅ Caused by</div>
                ${causedBy.slice(0, 4).map(e => `
                    <div class="kg-event-row" data-focus-node="${e.id}">
                        <span class="kg-event-year">${e.year}</span>
                        <span class="kg-event-desc">${e.description?.slice(0, 65)}…</span>
                    </div>
                `).join('')}
            </div>` : ''}

            ${causes.length > 0 ? `
            <div class="kg-section">
                <div class="kg-section-title">➡ Causes</div>
                ${causes.slice(0, 4).map(e => `
                    <div class="kg-event-row" data-focus-node="${e.id}">
                        <span class="kg-event-year">${e.year}</span>
                        <span class="kg-event-desc">${e.description?.slice(0, 65)}…</span>
                    </div>
                `).join('')}
            </div>` : ''}
        `;
    };

    // ── World inspector ──────────────────────────────────────────────────────
    const renderWorld = (d, kg) => {
        const eventsInWorld = kg.byType.events.filter(e => e.world === d.name);
        const deaths   = eventsInWorld.filter(e => e.death).length;
        const triggers = eventsInWorld.filter(e => e.importantTrigger).length;
        const years    = [...new Set(eventsInWorld.map(e => e.year))].sort((a,b) => a-b);

        return `
            <div class="kg-entity-header">
                <div class="kg-entity-hex" style="background:${worldFillCSS(d.name)}22; border-color:${worldFillCSS(d.name)}"></div>
                <div>
                    <div class="kg-entity-title">${d.name}</div>
                    <div class="kg-entity-type-badge kg-badge-world">World</div>
                </div>
            </div>
            <div class="kg-stat-grid">
                <div class="kg-stat"><div class="kg-stat-val">${eventsInWorld.length}</div><div class="kg-stat-lbl">Events</div></div>
                <div class="kg-stat"><div class="kg-stat-val kg-death-val">${deaths}</div><div class="kg-stat-lbl">Deaths</div></div>
                <div class="kg-stat"><div class="kg-stat-val kg-trigger-val">${triggers}</div><div class="kg-stat-lbl">Triggers</div></div>
                <div class="kg-stat"><div class="kg-stat-val">${years.length}</div><div class="kg-stat-lbl">Years</div></div>
            </div>
            <div class="kg-section">
                <div class="kg-section-title">📅 Active years</div>
                <div class="kg-detail-val" style="font-size:12px">${years.slice(0,6).join(', ')}${years.length > 6 ? ` … ${years[years.length-1]}` : ''}</div>
            </div>
        `;
    };

    // ── TimePeriod inspector ─────────────────────────────────────────────────
    const renderTimePeriod = (d, kg) => {
        const eventsInYear = kg.byType.events.filter(e => e.year === d.year);
        const worldBreakdown = {};
        eventsInYear.forEach(e => { worldBreakdown[e.world || 'Unknown'] = (worldBreakdown[e.world || 'Unknown'] || 0) + 1; });

        return `
            <div class="kg-entity-header">
                <div class="kg-entity-pill"></div>
                <div>
                    <div class="kg-entity-title">${d.year}</div>
                    <div class="kg-entity-type-badge kg-badge-time">Time Period</div>
                </div>
            </div>
            <div class="kg-stat-grid">
                <div class="kg-stat"><div class="kg-stat-val">${eventsInYear.length}</div><div class="kg-stat-lbl">Events</div></div>
                <div class="kg-stat"><div class="kg-stat-val kg-death-val">${eventsInYear.filter(e=>e.death).length}</div><div class="kg-stat-lbl">Deaths</div></div>
                <div class="kg-stat"><div class="kg-stat-val kg-trigger-val">${eventsInYear.filter(e=>e.importantTrigger).length}</div><div class="kg-stat-lbl">Triggers</div></div>
            </div>
            <div class="kg-section">
                <div class="kg-section-title">🌍 By world</div>
                ${Object.entries(worldBreakdown).map(([w, c]) => `
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:12px">
                        <span style="color:var(--text-secondary)">${w}</span>
                        <span style="color:var(--text-primary);font-weight:600">${c}</span>
                    </div>
                `).join('')}
            </div>
            <div class="kg-section">
                <div class="kg-section-title">Key events</div>
                ${eventsInYear.filter(e => e.importantTrigger || e.death).slice(0, 5).map(e => `
                    <div class="kg-event-row" data-focus-node="${e.id}">
                        ${e.death ? '☠' : '⚡'}
                        <span class="kg-event-desc">${e.description?.slice(0, 70)}…</span>
                    </div>
                `).join('')}
            </div>
        `;
    };

    // ── Path result ──────────────────────────────────────────────────────────
    const showPath = (pathIds, kg) => {
        open();
        const p = panel();
        if (!p) return;
        const pathNodes = pathIds.map(id => kg.nodeMap.get(id)).filter(Boolean);

        p.innerHTML = `
            <div class="kg-entity-header">
                <div class="kg-entity-title">🔍 Shortest Path</div>
            </div>
            <div class="kg-section">
                <div class="kg-section-title">${pathNodes.length - 1} hop${pathNodes.length > 2 ? 's' : ''}</div>
                <div class="kg-path-chain">
                    ${pathNodes.map((n, i) => `
                        <span class="kg-path-node kg-path-${n.type.toLowerCase()}" data-focus-node="${n.id}">${n.label}</span>
                        ${i < pathNodes.length - 1 ? '<span class="kg-path-arrow">→</span>' : ''}
                    `).join('')}
                </div>
            </div>
        `;
        p.querySelectorAll('[data-focus-node]').forEach(el => {
            el.addEventListener('click', () => KGView.focusNode(el.dataset.focusNode));
        });
    };

    // ── Sparkline ────────────────────────────────────────────────────────────
    const buildSparkline = (yearCounts) => {
        const entries = Object.entries(yearCounts).sort((a, b) => +a[0] - +b[0]);
        if (entries.length === 0) return '<p style="color:var(--text-muted);font-size:11px">No events</p>';
        const maxC = Math.max(...entries.map(e => e[1]));
        const barW = Math.max(4, Math.min(16, 220 / entries.length));
        const bars = entries.map(([yr, c]) => {
            const h = Math.max(2, (c / maxC) * 36);
            return `<div title="${yr}: ${c} events" style="
                width:${barW - 1}px;height:${h}px;
                background:var(--accent);opacity:${0.4 + (c/maxC)*0.6};
                border-radius:1px 1px 0 0;flex-shrink:0"></div>`;
        }).join('');
        return `
            <div style="display:flex;align-items:flex-end;gap:1px;height:40px;margin-top:6px;overflow:hidden">${bars}</div>
            <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-muted);margin-top:2px">
                <span>${entries[0][0]}</span><span>${entries[entries.length-1][0]}</span>
            </div>`;
    };

    // ── CSS world fill ───────────────────────────────────────────────────────
    const worldFillCSS = (world) => {
        if (!world) return '#374151';
        if (world.includes('Martha')) return '#991b1b';
        if (world.includes('Jonas'))  return '#1d4ed8';
        return '#9a3412';
    };

    // Close button
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('kg-inspector-close')?.addEventListener('click', close);
    });

    return { showNode, showPath, clear, open, close };
})();
