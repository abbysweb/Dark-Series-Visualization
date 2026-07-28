/**
 * KGSearch — Live search + hover tooltip for the Knowledge Graph
 */
const KGSearch = (() => {
    let kg, tooltip;

    const initialize = (kgData) => {
        kg      = kgData;
        tooltip = d3.select('#kg-tooltip');

        const input = document.getElementById('kg-search-input');
        if (!input) return;

        input.addEventListener('input', () => {
            const q = input.value.trim().toLowerCase();
            renderResults(q);
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Escape') { input.value = ''; renderResults(''); }
        });

        document.getElementById('kg-search-clear')?.addEventListener('click', () => {
            input.value = ''; renderResults('');
        });
    };

    const renderResults = (q) => {
        const box = document.getElementById('kg-search-results');
        if (!box) return;
        if (!q || q.length < 2) { box.innerHTML = ''; box.style.display = 'none'; return; }

        const results = kg.nodes.filter(n => {
            const label = (n.label || n.name || '').toLowerCase();
            const desc  = (n.description || '').toLowerCase();
            return label.includes(q) || desc.includes(q);
        }).slice(0, 12);

        if (results.length === 0) {
            box.innerHTML = '<div class="kg-search-empty">No results</div>';
            box.style.display = 'block';
            return;
        }

        box.style.display = 'block';
        box.innerHTML = results.map(n => {
            const typeBadge = `<span class="kg-search-type kg-search-type-${n.type.toLowerCase()}">${n.type}</span>`;
            const subtext = n.type === 'Event'
                ? `<span class="kg-search-sub">${n.year} · ${n.world || ''}</span>`
                : n.type === 'Character'
                ? `<span class="kg-search-sub">${n.eventCount} events</span>`
                : '';
            return `
                <div class="kg-search-item" data-node-id="${n.id}">
                    ${typeBadge}
                    <span class="kg-search-label">${n.label || n.name}</span>
                    ${subtext}
                </div>`;
        }).join('');

        box.querySelectorAll('.kg-search-item').forEach(el => {
            el.addEventListener('click', () => {
                KGView.focusNode(el.dataset.nodeId);
                box.style.display = 'none';
                document.getElementById('kg-search-input').value = '';
            });
        });
    };

    // ── Hover tooltip ────────────────────────────────────────────────────────
    const showTooltip = (ev, d) => {
        if (!tooltip) return;
        let html = '';
        if (d.type === 'Event') {
            const fmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const badges = [];
            if (d.importantTrigger) badges.push(`<span class="tooltip-badge badge-trigger">⚡ Trigger</span>`);
            if (d.death)            badges.push(`<span class="tooltip-badge badge-death">☠ Death</span>`);
            html = `
                <div class="tooltip-header">
                    <span class="tooltip-id">Event #${d.eventId}</span>
                    <span style="font-size:11px;color:var(--text-secondary)">${d.date ? fmt.format(d.date) : d.year}</span>
                </div>
                <div class="tooltip-desc">${d.description?.length > 110 ? d.description.slice(0, 110) + '…' : d.description}</div>
                <div class="tooltip-meta">🌍 ${d.world || '—'}</div>
                ${badges.length ? `<div style="margin-top:5px">${badges.join(' ')}</div>` : ''}
            `;
        } else if (d.type === 'Character') {
            html = `
                <div class="tooltip-header"><span class="tooltip-id">${d.label}</span></div>
                <div class="tooltip-meta">Events: ${d.eventCount} · Deaths: ${d.deathCount} · Triggers: ${d.triggerCount}</div>
                ${d.hasIdentity ? `<div style="margin-top:4px"><span class="tooltip-badge" style="background:rgba(168,85,247,0.2);color:#a855f7">↕ Identity character</span></div>` : ''}
            `;
        } else if (d.type === 'World') {
            html = `
                <div class="tooltip-header"><span class="tooltip-id">${d.name}</span></div>
                <div class="tooltip-meta">${d.eventCount} events in this world</div>
            `;
        } else if (d.type === 'TimePeriod') {
            html = `
                <div class="tooltip-header"><span class="tooltip-id">${d.year}</span></div>
                <div class="tooltip-meta">${d.eventCount} events this year</div>
            `;
        }

        tooltip.html(html).style('display', 'block');
        moveTooltip(ev);
    };

    const moveTooltip = (ev) => {
        if (!tooltip) return;
        const tw = 300, th = tooltip.node()?.offsetHeight || 80;
        const px = Math.min(ev.clientX + 14, window.innerWidth - tw - 10);
        const py = Math.max(10, Math.min(ev.clientY - th / 2, window.innerHeight - th - 10));
        tooltip.style('left', px + 'px').style('top', py + 'px');
    };

    const hideTooltip = () => tooltip?.style('display', 'none');

    return { initialize, showTooltip, hideTooltip };
})();
