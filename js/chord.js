const ChordDiagram = (() => {
    let svg, tooltip;
    let allData;

    const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const initialize = (data) => {
        allData = data;
        tooltip = d3.select('#chord-tooltip');
        svg = d3.select('#chord-svg');
        render();
    };

    const getCharacterMatrix = () => {
        const cooccur = {};
        const charEvents = {};

        allData.events.forEach(ev => {
            const chars = (ev.characters || [])
                .map(c => c.trim())
                .filter(c => c);
            if (chars.length < 2) return;
            chars.forEach(c => {
                charEvents[c] = (charEvents[c] || 0) + 1;
            });
            for (let i = 0; i < chars.length; i++) {
                for (let j = i + 1; j < chars.length; j++) {
                    const a = chars[i], b = chars[j];
                    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
                    cooccur[key] = (cooccur[key] || 0) + 1;
                }
            }
        });

        const topChars = Object.entries(charEvents)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 14)
            .map(([name]) => name);

        const index = new Map(topChars.map((n, i) => [n, i]));
        const matrix = Array.from({ length: topChars.length }, () => new Array(topChars.length).fill(0));

        for (const [key, count] of Object.entries(cooccur)) {
            const [a, b] = key.split('|');
            if (index.has(a) && index.has(b)) {
                matrix[index.get(a)][index.get(b)] += count;
                matrix[index.get(b)][index.get(a)] += count;
            }
        }

        return { matrix, names: topChars };
    };

    const render = () => {
        const textColor = getVar('--text-primary') || '#1a1a2e';
        const mutedColor = getVar('--text-secondary') || '#555570';
        const arcStroke = 'rgba(0,0,0,0.12)';
        const arcStrokeHover = 'rgba(0,0,0,0.35)';
        const blendMode = 'multiply';
        const fillOpacity = 0.4;

        const container = document.getElementById('chord-container');
        const rect = container ? container.getBoundingClientRect() : { width: 900, height: 700 };
        const width = rect.width || 900;
        const height = rect.height || 700;
        const innerRadius = Math.min(width, height) * 0.5 - 100;
        const outerRadius = innerRadius + 14;

        const { matrix, names } = getCharacterMatrix();

        svg.selectAll('*').remove();

        const chord = d3.chordDirected()
            .padAngle(12 / innerRadius)
            .sortSubgroups(d3.descending)
            .sortChords(d3.descending);

        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        const ribbon = d3.ribbonArrow()
            .radius(innerRadius - 2)
            .padAngle(2 / innerRadius);

        const colors = d3.scaleOrdinal()
            .domain(d3.range(names.length))
            .range(d3.quantize(d3.interpolateRainbow, names.length));

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        svg.attr('viewBox', `0 0 ${width} ${height}`);

        const chords = chord(matrix);

        const group = g.append('g')
            .selectAll('g')
            .data(chords.groups)
            .join('g');

        group.append('path')
            .attr('fill', d => colors(d.index))
            .attr('stroke', arcStroke)
            .attr('stroke-width', 1)
            .attr('d', arc)
            .on('mouseenter', function (event, d) {
                d3.select(this).attr('stroke', arcStrokeHover);
                showTooltip(event, `${names[d.index]} — ${Math.round(d3.sum(chords, c =>
                    (c.source.index === d.index) * c.source.value + (c.target.index === d.index) * c.source.value))} co-occurrences`);
            })
            .on('mousemove', moveTooltip)
            .on('mouseleave', function () {
                d3.select(this).attr('stroke', arcStroke);
                hideTooltip();
            });

        group.append('text')
            .each(d => (d.angle = (d.startAngle + d.endAngle) / 2))
            .attr('dy', '0.35em')
            .attr('fill', textColor)
            .attr('font-family', 'Outfit, sans-serif')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .attr('transform', d => {
                const r = outerRadius + 8;
                const ang = d.angle * 180 / Math.PI - 90;
                return `rotate(${ang}) translate(${r},0) ${d.angle > Math.PI ? 'rotate(180)' : ''}`;
            })
            .attr('text-anchor', d => d.angle > Math.PI ? 'end' : null)
            .text(d => names[d.index]);

        g.append('g')
            .attr('fill-opacity', fillOpacity)
            .selectAll('path')
            .data(chords)
            .join('path')
            .style('mix-blend-mode', blendMode)
            .attr('fill', d => colors(d.target.index))
            .attr('d', ribbon)
            .on('mouseenter', function (event, d) {
                d3.select(this).attr('fill-opacity', 1);
                showTooltip(event, `${names[d.source.index]} ↔ ${names[d.target.index]}: ${d.source.value} events`);
            })
            .on('mousemove', moveTooltip)
            .on('mouseleave', function () {
                d3.select(this).attr('fill-opacity', fillOpacity);
                hideTooltip();
            });


    };

    const showTooltip = (event, text) => {
        tooltip.style('display', 'block').html(text);
        moveTooltip(event);
    };

    const moveTooltip = (event) => {
        const [x, y] = d3.pointer(event, document.body);
        tooltip
            .style('left', (x + 12) + 'px')
            .style('top', (y - 10) + 'px');
    };

    const hideTooltip = () => {
        tooltip.style('display', 'none');
    };

    const updateForTheme = () => {
        if (svg) render();
    };

    return { initialize, updateForTheme };
})();
