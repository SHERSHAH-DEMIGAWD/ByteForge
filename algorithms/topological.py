def solve_kahns_topological(graph: dict) -> dict:
    """
    Topological Sort using Kahn's Algorithm (In-degree queue).
    Time Complexity: O(V + E)
    Space Complexity: O(V)
    """
    # 1. Compute in-degrees for all nodes
    indegree = {u: 0 for u in graph}
    for u in graph:
        for v in graph[u]:
            if v not in indegree:
                indegree[v] = 0
            indegree[v] += 1
            
    # 2. Find nodes with 0 in-degree
    queue = [u for u in indegree if indegree[u] == 0]
    # Sort queue alphabetically to make the demo deterministic
    queue.sort()
    
    order = []
    steps = []
    
    while queue:
        # Log current step state
        steps.append({
            "queue": list(queue),
            "indegrees": dict(indegree),
            "order_so_far": list(order)
        })
        
        curr = queue.pop(0)
        order.append(curr)
        
        # Decrease indegrees of neighbors
        for neighbor in graph.get(curr, []):
            if neighbor in indegree:
                indegree[neighbor] -= 1
                if indegree[neighbor] == 0:
                    queue.append(neighbor)
        # Sort queue to remain deterministic
        queue.sort()
        
    # Check for cycles
    has_cycle = len(order) != len(indegree)
    
    return {
        "topological_order": [] if has_cycle else order,
        "steps": steps,
        "has_cycle": has_cycle,
        "nodes": list(indegree.keys())
    }

def solve_dfs_topological(graph: dict) -> dict:
    """
    Topological Sort using Depth First Search.
    Time Complexity: O(V + E)
    Space Complexity: O(V)
    """
    visited = {} # None = unvisited, False = visiting, True = visited
    for node in graph:
        visited[node] = None
        for neighbor in graph[node]:
            visited[neighbor] = None
            
    order = []
    steps = []
    has_cycle = False
    
    def dfs(node):
        nonlocal has_cycle
        if has_cycle:
            return
            
        visited[node] = False # Visiting (in stack)
        steps.append({
            "node": node,
            "action": "visit",
            "visited_states": dict(visited),
            "order": list(order)
        })
        
        for neighbor in graph.get(node, []):
            if visited[neighbor] == False:
                # Cycle detected!
                has_cycle = True
                return
            elif visited[neighbor] is None:
                dfs(neighbor)
                
        visited[node] = True # Visited (finished)
        order.append(node)
        steps.append({
            "node": node,
            "action": "finish",
            "visited_states": dict(visited),
            "order": list(order)
        })
        
    for node in list(visited.keys()):
        if visited[node] is None:
            dfs(node)
            
    order.reverse()
    
    return {
        "topological_order": [] if has_cycle else order,
        "steps": steps,
        "has_cycle": has_cycle
    }
