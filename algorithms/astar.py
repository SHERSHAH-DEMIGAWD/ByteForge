"""
A* Pathfinding on a Grid
Paradigm: Greedy Best-First + Dynamic Programming hybrid (informed search)
Time Complexity: O(E log V) with a binary heap (grid: O(R*C log(R*C)))
Space Complexity: O(R*C)

Explanation: A* extends Dijkstra with a heuristic h(n) estimating the remaining
distance to the goal. It always expands the node with the lowest
f(n) = g(n) + h(n). With an admissible heuristic (never over-estimates, e.g.
Manhattan distance on a 4-connected grid) the path found is optimal — while
exploring far fewer cells than Dijkstra.
"""
import heapq


def manhattan(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def solve_astar(rows: int, cols: int, walls: list, start: list, goal: list) -> dict:
    """
    4-connected grid. walls/start/goal are [row, col] pairs.
    Returns the optimal path, expansion order and per-step trace with
    open/closed sets and f/g/h scores for visualization.
    """
    start = tuple(start)
    goal = tuple(goal)
    wall_set = {tuple(w) for w in walls}
    if start in wall_set or goal in wall_set:
        raise ValueError("Start or goal cannot be a wall cell")

    g_score = {start: 0}
    came_from = {}
    open_heap = [(manhattan(start, goal), 0, start)]
    closed = set()
    steps = []
    expanded = 0

    def cell(c):
        return [c[0], c[1]]

    while open_heap:
        f, g, current = heapq.heappop(open_heap)
        if current in closed:
            continue
        closed.add(current)
        expanded += 1

        h = manhattan(current, goal)
        open_snapshot = []
        seen = set()
        for fo, go, node in sorted(open_heap):
            if node not in closed and node not in seen:
                seen.add(node)
                open_snapshot.append({"cell": cell(node), "f": fo, "g": go, "h": fo - go})

        explain = (f"Expand cell ({current[0]},{current[1]}): lowest f = g + h = "
                   f"{g} + {h} = {f}. Moved to the closed set.")
        if current == goal:
            explain = f"Goal ({current[0]},{current[1]}) reached with path cost g = {g}. Search complete."

        if len(steps) < 400:
            steps.append({
                "current": cell(current),
                "g": g, "h": h, "f": f,
                "open": open_snapshot[:50],
                "closed_count": len(closed),
                "explain": explain,
            })

        if current == goal:
            break

        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nb = (current[0] + dr, current[1] + dc)
            if not (0 <= nb[0] < rows and 0 <= nb[1] < cols):
                continue
            if nb in wall_set or nb in closed:
                continue
            tentative_g = g + 1
            if tentative_g < g_score.get(nb, float('inf')):
                g_score[nb] = tentative_g
                came_from[nb] = current
                heapq.heappush(open_heap, (tentative_g + manhattan(nb, goal), tentative_g, nb))

    # Reconstruct path
    path = []
    if goal in closed or goal in g_score:
        node = goal
        while node in came_from:
            path.append(cell(node))
            node = came_from[node]
        if node == start:
            path.append(cell(start))
            path.reverse()
        else:
            path = []

    return {
        "path": path,
        "path_cost": (g_score.get(goal) if path else None),
        "found": bool(path) or start == goal,
        "cells_expanded": expanded,
        "total_cells": rows * cols - len(wall_set),
        "expansion_order": [s["current"] for s in steps],
        "steps": steps,
    }
