/**
 * Bar Chart Module — Dark Series Visualization
 * Grouped bar chart: events per year/world/character with selectable metrics
 */
const BarChart = (() => {
    let svg, g, allEvents, tooltip;
    let currentGroupBy = 'year';
    let currentMetric  = 'count';

    const CHART_COLORS = [
        '#ffd700','#60a5fa','#f87171','#4ade80','#c084fc',
        '#fb923c','#22d3ee','#f472b6','#a3e635','#fbbf24'
    ];

    const initialize = (data) => {
        allEvents = data.events;
        tooltip   = d3.select('#barchart-tooltip');
        svg       = d3.select('#bar-chart');

        d3.select('#bar-group-by').on('change', function() {
            currentGroupBy = this.value;
            render();
        });
        d3.select('#bar-metric').on('change', function() {
            currentMetric = this.value;
            render();
        });

        window.addEventListener('resize', () => {
            if (document.getElementById('view-barchart').classList.contains('active')) render();
        });

        render();
    };

    const buildChartData = () => {
        if (currentGroupBy === 'year') {
            const grouped = d3.group(allEvents, d => d.year);
            return [...grouped.entries()]
                .map(([key, evts]) => ({ label: String(key), events: evts }))
                .sort((a, b) => +a.label - +b.label);
        }
        if (currentGroupBy === 'world') {
            const grouped = d3.group(allEvents, d => d.world || 'Unknown');
            return [...grouped.entries()]
                .map(([key, evts]) => ({ label: key, events: evts }))
                .sort((a, b) => b.events.length - a.events.length);
        }
        if (currentGroupBy === 'character') {
            const counts = {};
            allEvents.forEach(ev => {
                (ev.characters || []).forEach(c => {
                    counts[c] = (counts[c] || []);
                    counts[c].push(ev);
                });
            });
            return Object.entries(counts)
                .map(([char, evts]) => ({ label: char, events: evts }))
                .sort((a, b) => b.events.length - a.events.length)
                .slice(0, 25);
        }
        return [];
    };

    const getMetricValue = (evts) => {
        if (currentMetric === 'count')    return evts.length;
        if (currentMetric === 'deaths')   return evts.filter(e => e.death).length;
        if (currentMetric === 'triggers') return evts.filter(e => e.importantTrigger).length;
        return 0;
    };

    const metricLabel = () => ({
        count:    'Number of Events',
        deaths:   'Death Events',
        triggers: 'Important Triggers'
    }[currentMetric] || '');

    const render = () => {
        const container = document.getElementById('barchart-container');
        const W = container.clientWidth - 40;
        const H = container.clientHeight - 20;
        svg.attr('width', W + 40).attr('height', H + 20);

        const margin = { top: 50, right: 30, bottom: currentGroupBy === 'character' ? 120 : 60, left: 60 };
        const cW = W - margin.left - margin.right;
        const cH = H - margin.top - margin.bottom;

        svg.selectAll('*').remove();

        const chartData = buildChartData();
        const values    = chartData.map(d => getMetricValue(d.events));

        d3.select('#barchart-stats').text(
            `${allEvents.length} total events · ${chartData.length} groups`
        );

        g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleBand()
            .domain(chartData.map(d => d.label))
            .range([0, cW])
            .padding(0.22);

        const y = d3.scaleLinear()
            .domain([0, d3.max(values) || 1])
            .nice()
            .range([cH, 0]);

        const colorScale = d3.scaleOrdinal(CHART_COLORS).domain(chartData.map(d => d.label));

        // Grid lines
        g.append('g').attr('class', 'grid')
            .selectAll('line').data(y.ticks(6)).enter().append('line')
            .attr('class', 'grid-line')
            .attr('x1', 0).attr('x2', cW)
            .attr('y1', d => y(d)).attr('y2', d => y(d));

        // Bars
        const bars = g.selectAll('.bar-rect')
            .data(chartData).enter().append('rect')
            .attr('class', 'bar-rect')
            .attr('x', d => x(d.label))
            .attr('width', x.bandwidth())
            .attr('fill', (_, i) => colorScale(chartData[i].label))
            .attr('fill-opacity', 0.85)
            .attr('y', cH).attr('height', 0);

        // Animate bars in
        bars.transition().duration(600).ease(d3.easeCubicOut)
            .attr('y', d => y(getMetricValue(d.events)))
            .attr('height', d => cH - y(getMetricValue(d.events)));

        // Value labels on top of bars
        g.selectAll('.bar-value')
            .data(chartData).enter().append('text')
            .attr('class', 'bar-value')
            .attr('x', d => x(d.label) + x.bandwidth() / 2)
            .attr('y', d => y(getMetricValue(d.events)) - 5)
            .attr('opacity', 0)
            .text(d => getMetricValue(d.events))
            .transition().delay(300).duration(400)
            .attr('opacity', d => getMetricValue(d.events) > 0 ? 1 : 0);

        // Tooltip
        g.selectAll('.bar-rect')
            .on('mouseover', (ev, d) => {
                const val = getMetricValue(d.events);
                tooltip.html(`
                    <div class="tooltip-header">
                        <span class="tooltip-id">${d.label}</span>
                    </div>
                    <div class="tooltip-meta">${metricLabel()}: <strong style="color:var(--text-primary)">${val}</strong></div>
                    <div class="tooltip-meta">Total events in group: ${d.events.length}</div>
                    <div class="tooltip-meta">Deaths: ${d.events.filter(e => e.death).length} · Triggers: ${d.events.filter(e => e.importantTrigger).length}</div>
                `).style('display', 'block');
            })
            .on('mousemove', ev => {
                const tw = 280, th = tooltip.node().offsetHeight;
                tooltip.style('left', Math.min(ev.clientX + 14, window.innerWidth - tw - 10) + 'px')
                       .style('top',  Math.max(10, ev.clientY - th / 2) + 'px');
            })
            .on('mouseout', () => tooltip.style('display', 'none'));

        // X axis
        const xAxis = g.append('g').attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${cH})`)
            .call(d3.axisBottom(x).tickSizeOuter(0));

        if (currentGroupBy !== 'year') {
            xAxis.selectAll('text')
                .attr('transform', 'rotate(-35)')
                .attr('text-anchor', 'end')
                .attr('dx', '-0.5em').attr('dy', '0.3em');
        }

        // Y axis
        g.append('g').attr('class', 'axis y-axis')
            .call(d3.axisLeft(y).ticks(6).tickSizeOuter(0));

        // Chart title
        g.append('text').attr('class', 'chart-title')
            .attr('x', cW / 2).attr('y', -22)
            .text(`Dark Series Events — ${metricLabel()} by ${currentGroupBy.charAt(0).toUpperCase() + currentGroupBy.slice(1)}`);

        // Y-axis label
        g.append('text').attr('class', 'chart-subtitle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -cH / 2).attr('y', -44)
            .text(metricLabel());
    };

    return { initialize };
})();
