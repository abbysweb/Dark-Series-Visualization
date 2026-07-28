/**
 * KGBuilder — Dark Series Knowledge Graph Data Model
 * ─────────────────────────────────────────────────
 * Converts flat CSV data into a typed Knowledge Graph:
 *   Nodes: Event | Character | World | TimePeriod
 *   Edges: appears_in | causes | occurs_in | occurs_at |
 *          same_person_as | co_present_with | triggers_death_of
 */
const KGBuilder = (() => {

    // ── Entity & Relation type enums ────────────────────────────────────────
    const TYPE = {
        EVENT:       'Event',
        CHARACTER:   'Character',
        WORLD:       'World',
        TIME_PERIOD: 'TimePeriod'
    };

    const REL = {
        APPEARS_IN:          'appears_in',
        CAUSES:              'causes',
        OCCURS_IN:           'occurs_in',
        OCCURS_AT:           'occurs_at',
        SAME_PERSON_AS:      'same_person_as',
        CO_PRESENT_WITH:     'co_present_with',
        TRIGGERS_DEATH_OF:   'triggers_death_of',
        IMPORTANT_TRIGGER_FOR: 'important_trigger_for'
    };

    // ── Short display label helpers ─────────────────────────────────────────
    const charShortLabel = (fullName) => {
        // "Jonas Kahnwald / Adam (J)" → "Jonas / Adam"
        return fullName.split(' / ').map(part => part.split(' ')[0]).join(' / ');
    };

    const charWorldSuffix = (fullName) => {
        const m = fullName.match(/\(([JMO])\)$/);
        return m ? m[1] : null; // J=Jonas-world, M=Martha-world, O=Origin
    };

    // ── Build ────────────────────────────────────────────────────────────────
    const build = (csvData) => {
        const { events, edges } = csvData;

        const nodes   = [];
        const kgEdges = [];
        const nodeMap = new Map(); // id → node
        let   eid     = 0;

        const addNode = (node) => {
            if (!nodeMap.has(node.id)) {
                nodeMap.set(node.id, node);
                nodes.push(node);
            }
            return nodeMap.get(node.id);
        };

        const addEdge = (sourceId, targetId, relation, props = {}) => {
            if (!nodeMap.has(sourceId) || !nodeMap.has(targetId)) return;
            kgEdges.push({ id: `ke${eid++}`, sourceId, targetId, source: sourceId, target: targetId, relation, ...props });
        };

        // ── 1. World nodes ──────────────────────────────────────────────────
        const worldCounts = new Map();
        const yearCounts = new Map();
        events.forEach(e => {
            if (e.world) worldCounts.set(e.world, (worldCounts.get(e.world) || 0) + 1);
            yearCounts.set(e.year, (yearCounts.get(e.year) || 0) + 1);
        });

        const worldNames = [...worldCounts.keys()];
        worldNames.forEach(w => {
            addNode({
                id:    `world:${w}`,
                type:  TYPE.WORLD,
                label: w,
                name:  w,
                eventCount: worldCounts.get(w)
            });
        });

        // ── 2. TimePeriod nodes (one per unique year) ───────────────────────
        const years = [...yearCounts.keys()].sort((a, b) => a - b);
        years.forEach(y => {
            addNode({
                id:    `time:${y}`,
                type:  TYPE.TIME_PERIOD,
                label: String(y),
                year:  y,
                eventCount: yearCounts.get(y)
            });
        });

        // ── 3. Character nodes ─────────────────────────────────────────────
        // First pass: collect all unique character strings + count appearances
        const charStats = new Map(); // charName → { eventCount, deathCount, triggerCount }
        events.forEach(ev => {
            (ev.characters || []).forEach(charName => {
                if (!charStats.has(charName)) {
                    charStats.set(charName, { eventCount: 0, deathCount: 0, triggerCount: 0 });
                }
                const s = charStats.get(charName);
                s.eventCount++;
                if (ev.death)             s.deathCount++;
                if (ev.importantTrigger)  s.triggerCount++;
            });
        });

        charStats.forEach((stats, charName) => {
            const worldSuffix = charWorldSuffix(charName);
            addNode({
                id:           `char:${charName}`,
                type:         TYPE.CHARACTER,
                label:        charShortLabel(charName),
                fullName:     charName,
                worldSuffix,
                eventCount:   stats.eventCount,
                deathCount:   stats.deathCount,
                triggerCount: stats.triggerCount,
                hasIdentity:  charName.includes(' / ')   // e.g. Jonas / Adam
            });
        });

        const marketTagRe = /\s*\([JMO]\)\s*$/;

    const stripTag = (name) => name.replace(marketTagRe, '').trim();

    const nameWords = (name) => stripTag(name).toLowerCase().split(/\s+/);

    const isSameIdentity = (nameA, nameB) => {
        const strippedA = stripTag(nameA);
        const strippedB = stripTag(nameB);
        if (strippedA === strippedB) return true;
        if (nameA.includes(' / ') && nameB.includes(' / ')) {
            const wordsA = nameWords(nameA);
            const wordsB = nameWords(nameB);
            return wordsA.some(w => wordsB.includes(w));
        }
        return false;
    };

    // ── 4. same_person_as edges (identity "/" in name or cross-world match) ─
    const allCharNames = [...charStats.keys()];
    for (let i = 0; i < allCharNames.length; i++) {
        for (let j = i + 1; j < allCharNames.length; j++) {
            const nameA = allCharNames[i];
            const nameB = allCharNames[j];
            if (isSameIdentity(nameA, nameB)) {
                addEdge(`char:${nameA}`, `char:${nameB}`, REL.SAME_PERSON_AS);
            }
        }
    }

        // ── 5. Event nodes ─────────────────────────────────────────────────
        events.forEach(ev => {
            addNode({
                id:              `event:${ev.id}`,
                type:            TYPE.EVENT,
                label:           `E${ev.id}`,
                eventId:         ev.id,
                description:     ev.description,
                date:            ev.date,
                year:            ev.year,
                world:           ev.world,
                importantTrigger: ev.importantTrigger,
                death:           ev.death,
                characters:      ev.characters || []
            });

            // occurs_in World
            if (ev.world) {
                addEdge(`event:${ev.id}`, `world:${ev.world}`, REL.OCCURS_IN);
            }

            // occurs_at TimePeriod
            addEdge(`event:${ev.id}`, `time:${ev.year}`, REL.OCCURS_AT);

            // appears_in  (Character → Event)
            (ev.characters || []).forEach(charName => {
                addEdge(`char:${charName}`, `event:${ev.id}`, REL.APPEARS_IN);
                if (ev.death) {
                    addEdge(`event:${ev.id}`, `char:${charName}`, REL.TRIGGERS_DEATH_OF);
                }
            });
        });

        // ── 6. Causal edges from Dark_Edges.csv ────────────────────────────
        edges.forEach(edge => {
            addEdge(
                `event:${edge.source}`,
                `event:${edge.target}`,
                REL.CAUSES,
                { edgeType: edge.type, description: edge.description }
            );
        });

        // ── 7. co_present_with (deduplicated, min 2 shared events) ─────────
        const coPresentMap = new Map(); // "charA|||charB" → { count, events[] }
        events.forEach(ev => {
            const chars = ev.characters || [];
            for (let i = 0; i < chars.length; i++) {
                for (let j = i + 1; j < chars.length; j++) {
                    const key = [chars[i], chars[j]].sort().join('|||');
                    if (!coPresentMap.has(key)) coPresentMap.set(key, { count: 0, eventIds: [] });
                    const entry = coPresentMap.get(key);
                    entry.count++;
                    if (entry.eventIds.length < 5) entry.eventIds.push(ev.id);
                }
            }
        });
        coPresentMap.forEach(({ count, eventIds }, key) => {
            if (count < 2) return;
            const [charA, charB] = key.split('|||');
            addEdge(`char:${charA}`, `char:${charB}`, REL.CO_PRESENT_WITH, { count, eventIds });
        });

        // ── 8. important_trigger_for (trigger events → events they cause) ──
        const triggerNodeIds = [...nodeMap.values()]
            .filter(n => n.type === TYPE.EVENT && n.importantTrigger)
            .map(n => n.id);

        triggerNodeIds.forEach(tid => {
            kgEdges.forEach(e => {
                if (e.sourceId === tid && e.relation === REL.CAUSES) {
                    addEdge(tid, e.targetId, REL.IMPORTANT_TRIGGER_FOR);
                }
            });
        });

        // ── Build neighbour index (node id → Set of neighbour ids) ─────────
        const neighbours = new Map();
        nodes.forEach(n => neighbours.set(n.id, new Set()));
        kgEdges.forEach(e => {
            const src = e.sourceId;
            const tgt = e.targetId;
            neighbours.get(src)?.add(tgt);
            neighbours.get(tgt)?.add(src);
        });

        const kg = {
            nodes,
            edges: kgEdges,
            nodeMap,
            neighbours,
            TYPE,
            REL,
            byType: {
                events:      nodes.filter(n => n.type === TYPE.EVENT),
                characters:  nodes.filter(n => n.type === TYPE.CHARACTER),
                worlds:      nodes.filter(n => n.type === TYPE.WORLD),
                timePeriods: nodes.filter(n => n.type === TYPE.TIME_PERIOD)
            }
        };

        console.log(`[KG] Built: ${nodes.length} nodes, ${kgEdges.length} edges`);
        console.log(`[KG]   Events: ${kg.byType.events.length}, Characters: ${kg.byType.characters.length}, Worlds: ${kg.byType.worlds.length}, TimePeriods: ${kg.byType.timePeriods.length}`);

        return kg;
    };

    return { build, TYPE, REL };
})();
