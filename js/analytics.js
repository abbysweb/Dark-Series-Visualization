const Analytics = (() => {
    let svg, tooltip;
    let allData;
    let currentMetric = 'distribution';

    const COLORS = {
        Event: '#60a5fa',
        Character: '#ffd700',
        World: '#fb923c',
        TimePeriod: '#9ca3af'
    };

    const initialize = (data) => {
        allData = data;
        tooltip = d3.select('#analytics-tooltip');
        svg = d3.select('#analytics-chart');

        d3.select('#analytics-metric').on('change', function () {
            currentMetric = this.value;
            render();
        });

        window.addEventListener('resize', () => {
            if (document.getElementById('view-analytics').classList.contains('active')) {
                render();
            }
        });

        render();
    };

    const buildStats = () => {
        const events = allData.events;
        const edges = allData.edges;
        const characters = [];
        const worlds = new Set();
        const years = new Set();

        events.forEach(e => {
            characters.push(...(e.characters || []));
            worlds.add(e.world);
            years.add(e.year);
        });

        const uniqueChars = new Set(characters);
        const deaths = events.filter(e => e.death).length;
        const triggers = events.filter(e => e.importantTrigger).length;

        const edgeTypes = {};
        edges.forEach(ev => {
            edgeTypes[ev.type] = (edgeTypes[ev.type] || 0) + 1;
        });

        return {
            totalEvents: events.length,
            totalEdges: edges.length,
            totalCharacters: uniqueChars.size,
            totalWorlds: worlds.size,
            totalYears: years.size,
            deaths,
            triggers,
            edgeTypes,
            years: [...years].sort((a, b) => a - b)
        };
    };

    const getEventDistribution = () => {
        const grouped = d3.group(allData.events, d => d.year);
        return [...grouped.entries()]
            .map(([year, evts]) => ({ year, count: evts.length }))
            .sort((a, b) => a.year - b.year);
    };

    const getEdgeTypeDistribution = () => {
        const counts = {};
        allData.edges.forEach(e => {
            counts[e.type] = (counts[e.type] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count);
    };

    const getCharacterInvolvement = () => {
        const counts = {};
        allData.events.forEach(ev => {
            (ev.characters || []).forEach(c => {
                counts[c] = (counts[c] || 0) + 1;
            });
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
    };

    const getWorldDistribution = () => {
        const counts = {};
        allData.events.forEach(ev => {
            const w = ev.world || 'Unknown';
            counts[w] = (counts[w] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([world, count]) => ({ world, count }))
            .sort((a, b) => b.count - a.count);
    };

    const renderStats = (stats) => {
        const container = document.getElementById('analytics-stats');
        if (!container) return;
        container.innerHTML = `
            <div class="analytics-stat">
                <span class="analytics-stat-val">${stats.totalEvents}</span>
                <span class="analytics-stat-lbl">Events</span>
            </div>
            <div class="analytics-stat">
                <span class="analytics-stat-val">${stats.totalEdges}</span>
                <span class="analytics-stat-lbl">Edges</span>
            </div>
            <div class="analytics-stat">
                <span class="analytics-stat-val">${stats.totalCharacters}</span>
                <span class="analytics-stat-lbl">Characters</span>
            </div>
            <div class="analytics-stat">
                <span class="analytics-stat-val">${stats.totalWorlds}</span>
                <span class="analytics-stat-lbl">Worlds</span>
            </div>
            <div class="analytics-stat">
                <span class="analytics-stat-val">${stats.totalYears}</span>
                <span class="analytics-stat-lbl">Years</span>
            </div>
            <div class="analytics-stat">
                <span class="analytics-stat-val analytics-death">${stats.deaths}</span>
                <span class="analytics-stat-lbl">Deaths</span>
            </div>
            <div class="analytics-stat">
                <span class="analytics-stat-val analytics-trigger">${stats.triggers}</span>
                <span class="analytics-stat-lbl">Triggers</span>
            </div>
        `;
    };

    const render = () => {
        const container = document.getElementById('analytics-container');
        if (!container) return;

        const W = container.clientWidth - 40;
        const H = container.clientHeight - 100;
        svg.attr('width', W).attr('height', H);
        svg.selectAll('*').remove();

        const stats = buildStats();
        renderStats(stats);

        const margin = { top: 40, right: 30, bottom: 60, left: 60 };
        const cW = W - margin.left - margin.right;
        const cH = H - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        if (currentMetric === 'distribution') {
            renderBarChart(g, stats, cW, cH);
        } else if (currentMetric === 'edgeTypes') {
            renderEdgeChart(g, stats, cW, cH);
        } else if (currentMetric === 'characters') {
            renderCharChart(g, stats, cW, cH);
        } else if (currentMetric === 'worlds') {
            renderWorldChart(g, stats, cW, cH);
        }
    };

    const renderBarChart = (g, stats, cW, cH) => {
        const data = getEventDistribution();
        const x = d3.scaleBand()
            .domain(data.map(d => d.year))
            .range([0, cW])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count) || 1])
            .nice()
            .range([cH, 0]);

        g.append('g').attr('class', 'grid')
            .selectAll('line').data(y.ticks(5)).enter().append('line')
            .attr('class', 'grid-line')
            .attr('x1', 0).attr('x2', cW)
            .attr('y1', d => y(d)).attr('y2', d => y(d));

        g.selectAll('.bar-rect')
            .data(data).enter().append('rect')
            .attr('class', 'bar-rect')
            .attr('x', d => x(d.year))
            .attr('width', x.bandwidth())
            .attr('fill', '#60a5fa')
            .attr('fill-opacity', 0.85)
            .attr('rx', 2)
            .attr('y', cH).attr('height', 0)
            .on('mouseover', (ev, d) => showTooltip(ev, `Year ${d.year}: ${d.count} events`, ev))
            .on('mousemove', moveTooltip)
            .on('mouseout', hideTooltip)
            .transition().duration(600).ease(d3.easeCubicOut)
            .attr('y', d => y(d.count))
            .attr('height', d => cH - y(d.count));

        g.append('g').attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${cH})`)
            .call(d3.axisBottom(x).tickFormat(d3.format('d')).tickSizeOuter(0))
            .selectAll('text').attr('transform', 'rotate(-45)').attr('text-anchor', 'end');

        g.append('g').attr('class', 'axis y-axis')
            .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0));

        g.append('text').attr('class', 'chart-title')
            .attr('x', cW / 2).attr('y', -18)
            .attr('text-anchor', 'middle')
            .text('Event Distribution by Year');

        g.append('text').attr('class', 'chart-subtitle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -cH / 2).attr('y', -44)
            .attr('text-anchor', 'middle')
            .text('Number of Events');
    };

    const renderEdgeChart = (g, stats, cW, cH) => {
        const data = getEdgeTypeDistribution();
        const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(data.map(d => d.type));

        const pie = d3.pie().value(d => d.count).sort(null);
        const arc = d3.arc().innerRadius(Math.min(cW, cH) / 4).outerRadius(Math.min(cW, cH) / 2.5);
        const arcHover = d3.arc().innerRadius(Math.min(cW, cH) / 4).outerRadius(Math.min(cW, cH) / 2.5 + 6);

        const centerX = cW / 2;
        const centerY = cH / 2;

        const slices = g.append('g')
            .attr('transform', `translate(${centerX},${centerY})`)
            .selectAll('path')
            .data(pie(data))
            .enter().append('path')
            .attr('d', arc)
            .attr('fill', d => colorScale(d.data.type))
            .attr('stroke', '#0e0b06')
            .attr('stroke-width', 1.5)
            .on('mouseover', function (ev, d) {
                d3.select(this).transition().duration(200).attr('d', arcHover);
                showTooltip(ev, `${d.data.type}: ${d.data.count} edges`, ev);
            })
            .on('mousemove', moveTooltip)
            .on('mouseout', function () {
                d3.select(this).transition().duration(200).attr('d', arc);
                hideTooltip();
            });

        g.append('text').attr('x', centerX).attr('y', centerY - 8)
            .attr('text-anchor', 'middle').attr('fill', 'var(--text-primary)')
            .attr('font-size', 13).attr('font-family', 'Outfit, sans-serif')
            .attr('font-weight', '600').text('Total');

        g.append('text').attr('x', centerX).attr('y', centerY + 10)
            .attr('text-anchor', 'middle').attr('fill', 'var(--text-secondary)')
            .attr('font-size', 11).attr('font-family', 'Outfit, sans-serif')
            .text(`${stats.totalEdges} edges`);

        const legend = g.append('g')
            .attr('transform', `translate(0, ${cH - 20})`);

        data.forEach((d, i) => {
            const lx = (cW / data.length) * i;
            legend.append('rect')
                .attr('x', lx).attr('y', 0)
                .attr('width', 10).attr('height', 10)
                .attr('fill', colorScale(d.type)).attr('rx', 2);
            legend.append('text')
                .attr('x', lx + 14).attr('y', 9)
                .attr('fill', 'var(--text-secondary)')
                .attr('font-size', 10).attr('font-family', 'Outfit, sans-serif')
                .text(`${d.type} (${d.count})`);
        });
    };

    const renderCharChart = (g, stats, cW, cH) => {
        const data = getCharacterInvolvement();
        const x = d3.scaleBand()
            .domain(data.map(d => d.name.length > 18 ? d.name.slice(0, 16) + '\u2026' : d.name))
            .range([0, cW])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count) || 1])
            .nice()
            .range([cH, 0]);

        g.append('g').attr('class', 'grid')
            .selectAll('line').data(y.ticks(5)).enter().append('line')
            .attr('class', 'grid-line')
            .attr('x1', 0).attr('x2', cW)
            .attr('y1', d => y(d)).attr('y2', d => y(d));

        g.selectAll('.bar-rect')
            .data(data).enter().append('rect')
            .attr('class', 'bar-rect')
            .attr('x', d => x(d.name.length > 18 ? d.name.slice(0, 16) + '\u2026' : d.name))
            .attr('width', x.bandwidth())
            .attr('fill', '#ffd700')
            .attr('fill-opacity', 0.85)
            .attr('rx', 2)
            .attr('y', cH).attr('height', 0)
            .on('mouseover', (ev, d) => showTooltip(ev, `${d.name}: ${d.count} events`, ev))
            .on('mousemove', moveTooltip)
            .on('mouseout', hideTooltip)
            .transition().duration(600).ease(d3.easeCubicOut)
            .attr('y', d => y(d.count))
            .attr('height', d => cH - y(d.count));

        g.append('g').attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${cH})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .selectAll('text')
            .attr('transform', 'rotate(-40)')
            .attr('text-anchor', 'end')
            .attr('dx', '-0.5em').attr('dy', '0.3em');

        g.append('g').attr('class', 'axis y-axis')
            .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0));

        g.append('text').attr('class', 'chart-title')
            .attr('x', cW / 2).attr('y', -18)
            .attr('text-anchor', 'middle')
            .text('Top 20 Characters by Event Involvement');

        g.append('text').attr('class', 'chart-subtitle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -cH / 2).attr('y', -44)
            .attr('text-anchor', 'middle')
            .text('Event Count');
    };

    const renderWorldChart = (g, stats, cW, cH) => {
        const data = getWorldDistribution();
        const colorMap = {
            'Jonas': '#60a5fa',
            'Martha': '#f87171',
            'Origin': '#fb923c',
            'Origin (End)': '#b45309'
        };

        const x = d3.scaleBand()
            .domain(data.map(d => d.world))
            .range([0, cW])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count) || 1])
            .nice()
            .range([cH, 0]);

        g.append('g').attr('class', 'grid')
            .selectAll('line').data(y.ticks(5)).enter().append('line')
            .attr('class', 'grid-line')
            .attr('x1', 0).attr('x2', cW)
            .attr('y1', d => y(d)).attr('y2', d => y(d));

        g.selectAll('.bar-rect')
            .data(data).enter().append('rect')
            .attr('class', 'bar-rect')
            .attr('x', d => x(d.world))
            .attr('width', x.bandwidth())
            .attr('fill', d => colorMap[d.world] || '#9ca3af')
            .attr('fill-opacity', 0.85)
            .attr('rx', 2)
            .attr('y', cH).attr('height', 0)
            .on('mouseover', (ev, d) => showTooltip(ev, `${d.world}: ${d.count} events`, ev))
            .on('mousemove', moveTooltip)
            .on('mouseout', hideTooltip)
            .transition().duration(600).ease(d3.easeCubicOut)
            .attr('y', d => y(d.count))
            .attr('height', d => cH - y(d.count));

        g.append('g').attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${cH})`)
            .call(d3.axisBottom(x).tickSizeOuter(0));

        g.append('g').attr('class', 'axis y-axis')
            .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0));

        g.append('text').attr('class', 'chart-title')
            .attr('x', cW / 2).attr('y', -18)
            .attr('text-anchor', 'middle')
            .text('Event Distribution by World');

        g.append('text').attr('class', 'chart-subtitle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -cH / 2).attr('y', -44)
            .attr('text-anchor', 'middle')
            .text('Number of Events');
    };

    const showTooltip = (ev, html, event) => {
        tooltip.html(`<div class="tooltip-header"><span class="tooltip-id">${html}</span></div>`)
            .style('display', 'block');
        moveTooltip(event);
    };

    const moveTooltip = (ev) => {
        const tw = 260, th = tooltip.node()?.offsetHeight || 60;
        tooltip.style('left', Math.min(ev.clientX + 14, window.innerWidth - tw - 10) + 'px')
            .style('top', Math.max(10, ev.clientY - th / 2) + 'px');
    };

    const hideTooltip = () => tooltip.style('display', 'none');

    return { initialize, render };
})();