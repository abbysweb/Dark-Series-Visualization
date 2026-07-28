/**
 * KGPathfinder — BFS shortest path between any two nodes in the Knowledge Graph
 */
const KGPathfinder = (() => {

    const shortestPath = (kg, startId, endId) => {
        if (startId === endId) return [startId];
        const visited = new Set([startId]);
        const queue   = [[startId]];

        while (queue.length > 0) {
            const path = queue.shift();
            const node = path[path.length - 1];
            const nbrs = kg.neighbours.get(node) || new Set();
            for (const nb of nbrs) {
                if (nb === endId) return [...path, nb];
                if (!visited.has(nb)) {
                    visited.add(nb);
                    queue.push([...path, nb]);
                }
            }
        }
        return null;
    };

    return { shortestPath };
})();