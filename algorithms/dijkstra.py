import heapq

def solve_dijkstra(graph: dict, start: str, end: str) -> dict:
    """
    Dijkstra's algorithm with relaxation tracing for educational visuals.
    graph structure: { "nodeA": { "nodeB": weight1, "nodeC": weight2 }, ... }
    """
    # Initialize distances
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    
    # Priority Queue: (distance, node)
    pq = [(0, start)]
    
    # Track paths
    predecessors = {node: None for node in graph}
    
    # Trace step-by-step relaxation for front-end rendering
    steps = []
    visited = set()
    
    while pq:
        curr_dist, curr_node = heapq.heappop(pq)
        
        # Skip if we found a shorter path already
        if curr_dist > distances[curr_node]:
            continue
            
        visited.add(curr_node)
        
        step_log = {
            "node": curr_node,
            "dist": curr_dist,
            "queue": [(d, n) for d, n in pq],
            "distances": {k: (v if v != float('inf') else -1) for k, v in distances.items()},
            "visited": list(visited),
            "relaxations": []
        }
        
        # Explore neighbors
        for neighbor, weight in graph.get(curr_node, {}).items():
            new_dist = curr_dist + weight
            if new_dist < distances[neighbor]:
                old_dist = distances[neighbor]
                distances[neighbor] = new_dist
                predecessors[neighbor] = curr_node
                heapq.heappush(pq, (new_dist, neighbor))
                
                step_log["relaxations"].append({
                    "neighbor": neighbor,
                    "old_dist": old_dist if old_dist != float('inf') else -1,
                    "new_dist": new_dist,
                    "weight": weight,
                    "relaxed": True
                })
            else:
                step_log["relaxations"].append({
                    "neighbor": neighbor,
                    "old_dist": distances[neighbor],
                    "new_dist": new_dist,
                    "weight": weight,
                    "relaxed": False
                })
                
        steps.append(step_log)
        
        # We can stop early if we reached the end node, but let's complete it or stop at end
        if curr_node == end:
            break
            
    # Reconstruct path
    path = []
    curr = end
    while curr is not None:
        path.append(curr)
        curr = predecessors[curr]
    path.reverse()
    
    # Check if path is valid
    if distances[end] == float('inf'):
        path = []
        
    return {
        "shortest_path": path,
        "total_distance": distances[end] if distances[end] != float('inf') else -1,
        "distances": {k: (v if v != float('inf') else -1) for k, v in distances.items()},
        "steps": steps,
        "visited": list(visited)
    }
