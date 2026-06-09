import copy

# Union-Find Helper for Kruskal's Algorithm
class DisjointSet:
    def __init__(self, vertices):
        self.parent = {v: v for v in vertices}
        self.rank = {v: 0 for v in vertices}
        
    def find(self, item):
        if self.parent[item] == item:
            return item
        else:
            # Path compression
            self.parent[item] = self.find(self.parent[item])
            return self.parent[item]
            
    def union(self, set1, set2):
        root1 = self.find(set1)
        root2 = self.find(set2)
        
        if root1 != root2:
            if self.rank[root1] > self.rank[root2]:
                self.parent[root2] = root1
            elif self.rank[root1] < self.rank[root2]:
                self.parent[root1] = root2
            else:
                self.parent[root2] = root1
                self.rank[root1] += 1
            return True
        return False

def solve_kruskals(graph):
    # graph: Dict[str, Dict[str, int]]
    steps = []
    
    # 1. Collect all unique edges (undirected)
    edges = []
    seen = set()
    vertices = list(graph.keys())
    
    for u in graph:
        for v in graph[u]:
            weight = graph[u][v]
            # Ensure edge is represented in a standard sorted direction to avoid duplicates
            edge_key = tuple(sorted([u, v]))
            if edge_key not in seen:
                seen.add(edge_key)
                edges.append((weight, u, v))
                
    # Sort edges initially
    sorted_edges = sorted(edges, key=lambda x: x[0])
    
    ds = DisjointSet(vertices)
    mst_edges = []
    total_cost = 0
    
    # Trace initial state
    steps.append({
        "active_edge": None,
        "sorted_edges": [{"weight": w, "from": u, "to": v} for w, u, v in sorted_edges],
        "disjoint_sets": copy.deepcopy(ds.parent),
        "mst_edges": [],
        "total_cost": 0,
        "action": "Disjoint set initialized. Edges sorted by weight for greedy selection."
    })
    
    for idx, (weight, u, v) in enumerate(sorted_edges):
        root_u = ds.find(u)
        root_v = ds.find(v)
        
        active_edge = {"weight": weight, "from": u, "to": v}
        
        if root_u != root_v:
            ds.union(u, v)
            mst_edges.append(active_edge)
            total_cost += weight
            action = f"Connected component containing {u} and {v} merged (no cycle). Edge accepted."
        else:
            action = f"Edge between {u} and {v} rejected. Both vertices are already in the same disjoint set (forms a cycle)."
            
        steps.append({
            "active_edge": active_edge,
            "sorted_edges": [{"weight": w, "from": u, "to": v} for w, u, v in sorted_edges[idx+1:]],
            "disjoint_sets": copy.deepcopy(ds.parent),
            "mst_edges": list(mst_edges),
            "total_cost": total_cost,
            "action": action
        })
        
    return {
        "steps": steps,
        "mst_edges": mst_edges,
        "total_cost": total_cost
    }

def solve_prims(graph, start_vertex=None):
    steps = []
    vertices = list(graph.keys())
    
    if not vertices:
        return {"steps": [], "mst_edges": [], "total_cost": 0}
        
    if not start_vertex or start_vertex not in graph:
        start_vertex = vertices[0]
        
    visited = [start_vertex]
    mst_edges = []
    total_cost = 0
    
    # Collect initial fringe edges from start node
    fringe = []
    for neighbor, weight in graph[start_vertex].items():
        fringe.append((weight, start_vertex, neighbor))
    fringe.sort(key=lambda x: x[0])
    
    steps.append({
        "visited": list(visited),
        "fringe": [{"weight": w, "from": u, "to": v} for w, u, v in fringe],
        "selected_edge": None,
        "mst_edges": [],
        "total_cost": 0,
        "action": f"Started Prim's algorithm from root node {start_vertex}. Loaded outgoing edges to queue."
    })
    
    while fringe and len(visited) < len(vertices):
        # Greedily pop minimum edge
        weight, u, v = fringe.pop(0)
        selected_edge = {"weight": weight, "from": u, "to": v}
        
        # If the edge connects to an unvisited vertex, add it to MST
        if v not in visited:
            visited.append(v)
            mst_edges.append(selected_edge)
            total_cost += weight
            
            # Add new candidate edges
            for next_neighbor, next_weight in graph[v].items():
                if next_neighbor not in visited:
                    fringe.append((next_weight, v, next_neighbor))
            fringe.sort(key=lambda x: x[0])
            
            action = f"Selected cheapest fringe edge: {u} - {v} (weight: {weight}). Vertex {v} added to visited frontier."
        else:
            action = f"Fringe edge {u} - {v} skipped. Vertex {v} is already visited (no cut crossing)."
            selected_edge = None # Don't mark as added to tree
            
        steps.append({
            "visited": list(visited),
            "fringe": [{"weight": w, "from": u, "to": v} for w, u, v in fringe],
            "selected_edge": selected_edge,
            "mst_edges": list(mst_edges),
            "total_cost": total_cost,
            "action": action
        })
        
    return {
        "steps": steps,
        "mst_edges": mst_edges,
        "total_cost": total_cost
    }
