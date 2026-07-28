/**
 * analytics_dashboard.js
 *
 * Adds an interactive analytics dashboard to the Dark Series visualisation.
 * The dashboard displays:
 *   - Total number of events, deaths and triggers
 *   - Distribution of events by world (pie chart)
 *   - Distribution of events by year (bar chart)
 *   - Trend of deaths over time (line chart)
 *
 * The module relies on the existing DataParser to load the CSV data.
 * It is self‑contained and attaches its UI to the document body.
 */

(function () {
    // Ensure the module runs after the DOM is ready
    document.addEventListener('DOMContentLoaded', initDashboard);

    /**
     * Initialise the dashboard.
     */
    function initDashboard() {
        // Create a container for the dashboard
        const container = document.createElement('div');
        container.id = 'analytics-dashboard';
        container.style.position = 'fixed';
        container.style.right = '0';
        container.style.top = '0';
        container.style.width = '350px';
        container.style.height = '100%';
        container.style.background = 'var(--bg-secondary)';
        container.style.color = 'var(--text-primary)';
        container.style.overflowY = 'auto';
        container.style.padding = '15px';
        container.style.boxShadow = 'rgba(0,0,0,0.2) -2px 0 5px';
        container.style.zIndex = '1000';
        container.style.fontFamily = 'sans-serif';
        container.style.fontSize = '15px';          // larger base font
        container.style.lineHeight = '1.5';
        container.style.borderLeft = '1px solid var(--border)';
        container.style.boxSizing = 'border-box';

        // Title
        const title = document.createElement('h2');
        title.textContent = 'Analytics';
        title.style.fontSize = '22px';              // larger title
        title.style.margin = '0 0 15px 0';
        title.style.borderBottom = '1px solid var(--border)';
        title.style.paddingBottom = '5px';
        container.appendChild(title);

        // Stats section
        const statsSection = document.createElement('div');
        statsSection.id = 'analytics-stats';
        statsSection.style.marginBottom = '20px';
        container.appendChild(statsSection);

        // Charts section
        const chartsSection = document.createElement('div');
        chartsSection.id = 'analytics-charts';
        container.appendChild(chartsSection);

        document.body.appendChild(container);

        // Load data and render
        DataParser.loadData().then(({ events, edges }) => {
            const stats = computeStats(events);
            renderStats(statsSection, stats);
            renderCharts(chartsSection, stats);
        }).catch(err => {
            console.error('Failed to load data for analytics dashboard:', err);
            statsSection.textContent = 'Error loading analytics data.';
        });
    }

    /**
     * Compute aggregated statistics from the events array.
     * @param {Array} events
     * @returns {Object}
     */
    function computeStats(events) {
        const stats = {
            totalEvents: events.length,
            totalDeaths: 0,
            totalTriggers: 0,
            worldCounts: {},
            yearCounts: {},
            deathsByYear: {}
        };

        events.forEach(ev => {
            if (ev.death) stats.totalDeaths++;
            if (ev.importantTrigger) stats.totalTriggers++;

            // World distribution
            const world = ev.world || 'Unknown';
            stats.worldCounts[world] = (stats.worldCounts[world] || 0) + 1;

            // Year distribution
            const year = ev.year || 'Unknown';
            stats.yearCounts[year] = (stats.yearCounts[year] || 0) + 1;

            // Deaths over time
            if (ev.death) {
                stats.deathsByYear[year] = (stats.deathsByYear[year] || 0) + 1;
            }
        });

        return stats;
    }

    /**
     * Render the summary statistics.
     * @param {HTMLElement} container
     * @param {Object} stats
     */
    function renderStats(container, stats) {
        container.innerHTML = `
            <div><strong>Total Events:</strong> ${stats.totalEvents}</div>
            <div><strong>Total Deaths:</strong> ${stats.totalDeaths}</div>
            <div><strong>Total Triggers:</strong> ${stats.totalTriggers}</div>
        `;
    }

    /**
     * Render all charts.
     * @param {HTMLElement} container
     * @param {Object} stats
     */
    function renderCharts(container, stats) {
        // World distribution pie chart
        const worldPie = document.createElement('div');
        worldPie.id = 'world-pie';
        worldPie.style.marginBottom = '20px';
        container.appendChild(worldPie);
        renderWorldPie(worldPie, stats.worldCounts);

        // Year distribution bar chart
        const yearBar = document.createElement('div');
        yearBar.id = 'year-bar';
        yearBar.style.marginBottom = '20px';
        container.appendChild(yearBar);
        renderYearBar(yearBar, stats.yearCounts);

        // Deaths trend line chart
        const deathsLine = document.createElement('div');
        deathsLine.id = 'deaths-line';
        container.appendChild(deathsLine);
        renderDeathsLine(deathsLine, stats.deathsByYear);
    }

    /**
     * Render a pie chart of event distribution by world.
     * @param {HTMLElement} container
     * @param {Object} data
     */
    function renderWorldPie(container, data) {
        const width = 300;
        const height = 200;
        const radius = Math.min(width, height) / 2;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        const color = d3.scaleOrdinal()
            .domain(Object.keys(data))
            .range(d3.schemeCategory10);

        const pie = d3.pie()
            .value(d => d[1]);

        const arc = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        const labelArc = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

        const pieData = pie(Object.entries(data));

        const g = svg.selectAll('.arc')
            .data(pieData)
            .enter().append('g')
            .attr('class', 'arc');

        g.append('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data[0]));

        g.append('text')
            .attr('transform', d => `translate(${labelArc.centroid(d)})`)
            .attr('dy', '0.35em')
            .style('font-size', '12px')          // larger text
            .style('text-anchor', 'middle')
            .text(d => `${d.data[0]} (${d.data[1]})`);
    }

    /**
     * Render a bar chart of events per year.
     * @param {HTMLElement} container
     * @param {Object} data
     */
    function renderYearBar(container, data) {
        const margin = { top: 20, right: 10, bottom: 30, left: 40 };
        const width = 300 - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const years = Object.keys(data).sort((a, b) => +a - +b);
        const counts = years.map(y => data[y]);

        const x = d3.scaleBand()
            .domain(years)
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(counts)])
            .nice()
            .range([height, 0]);

        svg.append('g')
            .selectAll('.bar')
            .data(years)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d))
            .attr('y', d => y(data[d]))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(data[d]))
            .attr('fill', '#60a5fa');

        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d => d));

        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y).ticks(5));

        // Increase tick label font size
        svg.selectAll('.x-axis text, .y-axis text')
            .style('font-size', '12px');
    }

    /**
     * Render a line chart of deaths over time.
     * @param {HTMLElement} container
     * @param {Object} data
     */
    function renderDeathsLine(container, data) {
        const margin = { top: 20, right: 10, bottom: 30, left: 40 };
        const width = 300 - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const years = Object.keys(data).sort((a, b) => +a - +b);
        const deaths = years.map(y => data[y] || 0);

        const x = d3.scaleLinear()
            .domain([+years[0], +years[years.length - 1]])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(deaths)])
            .nice()
            .range([height, 0]);

        const line = d3.line()
            .x((d, i) => x(+years[i]))
            .y(d => y(d));

        svg.append('path')
            .datum(deaths)
            .attr('fill', 'none')
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 2)
            .attr('d', line);

        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(years.length).tickFormat(d3.format('d')));

        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y).ticks(5));

        // Increase tick label font size
        svg.selectAll('.x-axis text, .y-axis text')
            .style('font-size', '12px');
    }
})();
