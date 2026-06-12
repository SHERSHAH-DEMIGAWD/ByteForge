"""
Bellman-Ford Shortest Path
Paradigm: Dynamic Programming (edge relaxation)
Time Complexity: O(V * E)
Space Complexity: O(V)

Explanation: Unlike Dijkstra's greedy approach, Bellman-Ford relaxes every edge
V-1 times, guaranteeing correct shortest paths even with negative edge weights.
A V-th pass that still relaxes an edge proves a negative-weight cycle exists.
"""

INF = float('inf')


def solve_bellman_ford(graph: dict, start: str, end: str = None) -> dict:
    """
    graph: {u: {v: weight}} directed adjacency map (weights may be negative).
    Returns distances, predecessors, per-relaxation trace steps and
    negative-cycle detection result.
    """
    # Collect every vertex mentioned either as a source or a destination
    vertices = set(graph.keys())
    for u, neighbors in graph.items():
        vertices.update(neighbors.keys())
    vertices = sorted(vertices)

    edges = [(u, v, w) for u, neighbors in graph.items() for v, w in neighbors.items()]

    if start not in vertices:
        raise ValueError(f"Start vertex '{start}' not present in graph")

    dist = {v: INF for v in vertices}
    pred = {v: None for v in vertices}
    dist[start] = 0

    steps = []
    relaxations = 0

    def snapshot():
        return {v: (None if dist[v] == INF else dist[v]) for v in vertices}

    steps.append({
        "iteration": 0,
        "edge": None,
        "updated": False,
        "distances": snapshot(),
        "explain": f"Initialization: dist[{start}] = 0, all other distances = ∞."
    })

    for iteration in range(1, len(vertices)):
        changed = False
        for u, v, w in edges:
            if dist[u] != INF and dist[u] + w < dist[v]:
                old = dist[v]
                dist[v] = dist[u] + w
                pred[v] = u
                relaxations += 1
                changed = True
                old_str = "∞" if old == INF else str(old)
                steps.append({
                    "iteration": iteration,
                    "edge": {"u": u, "v": v, "w": w},
                    "updated": True,
                    "distances": snapshot(),
                    "explain": f"Pass {iteration}: relax edge {u}→{v} (w={w}). "
                               f"dist[{v}] improves {old_str} → {dist[v]} via {u}."
                })
            else:
                steps.append({
                    "iteration": iteration,
                    "edge": {"u": u, "v": v, "w": w},
                    "updated": False,
                    "distances": snapshot(),
                    "explain": f"Pass {iteration}: edge {u}→{v} (w={w}) gives no improvement, skip."
                })
        if not changed:
            steps.append({
                "iteration": iteration,
                "edge": None,
                "updated": False,
                "distances": snapshot(),
                "explain": f"Pass {iteration} made no updates — distances converged early, stop."
            })
            break

    # V-th pass: negative cycle check
    negative_cycle = False
    for u, v, w in edges:
        if dist[u] != INF and dist[u] + w < dist[v]:
            negative_cycle = True
            steps.append({
                "iteration": len(vertices),
                "edge": {"u": u, "v": v, "w": w},
                "updated": True,
                "distances": snapshot(),
                "explain": f"Extra pass: edge {u}→{v} STILL relaxes — a negative-weight cycle is reachable!"
            })
            break

    # Reconstruct path to end if requested
    path = []
    if end and not negative_cycle and dist.get(end, INF) != INF:
        node = end
        while node is not None:
            path.append(node)
            node = pred[node]
        path.reverse()

    return {
        "distances": snapshot(),
        "predecessors": pred,
        "path": path,
        "path_cost": (None if not path else dist[end]),
        "negative_cycle": negative_cycle,
        "total_relaxations": relaxations,
        "vertices": vertices,
        "edges": [{"u": u, "v": v, "w": w} for u, v, w in edges],
        "steps": steps[:300],
    }
