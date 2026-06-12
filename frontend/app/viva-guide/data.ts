export const VIVA_QUESTIONS = [
  // ==========================================
  // TOPIC 1: Minimum Spanning Trees (MST)
  // ==========================================
  {
    id: 101,
    topic: "Minimum Spanning Trees",
    question: "What is a Minimum Spanning Tree (MST)?",
    answer: [
      "A Minimum Spanning Tree is a subgraph of a connected, undirected, edge-weighted graph.",
      "It connects all the vertices together without any cycles.",
      "The total edge weight is minimized among all possible spanning trees."
    ]
  },
  {
    id: 102,
    topic: "Minimum Spanning Trees",
    question: "What is the Cut Property in the context of MSTs?",
    answer: [
      "If we partition the vertices of a graph into two disjoint sets, this partition is called a cut.",
      "The Cut Property states that for any cut, the crossing edge with the minimum weight must belong to the MST.",
      "Both Prim's and Kruskal's algorithms rely heavily on the Cut Property to guarantee correctness."
    ]
  },
  {
    id: 103,
    topic: "Minimum Spanning Trees",
    question: "How does Kruskal's algorithm work?",
    answer: [
      "It sorts all edges in ascending order of their weights.",
      "It iterates through the sorted edges, adding an edge to the MST if it does not form a cycle.",
      "It uses a Disjoint Set (Union-Find) data structure to efficiently check for cycles."
    ]
  },
  {
    id: 104,
    topic: "Minimum Spanning Trees",
    question: "What is the time complexity of Kruskal's algorithm?",
    answer: [
      "Sorting the edges takes O(E log E).",
      "Union-Find operations take O(E α(V)), where α is the inverse Ackermann function.",
      "The overall time complexity is dominated by sorting, making it O(E log E) or O(E log V)."
    ]
  },
  {
    id: 105,
    topic: "Minimum Spanning Trees",
    question: "How does Prim's algorithm work?",
    answer: [
      "It starts with a single arbitrary vertex to form the initial tree.",
      "It maintains a priority queue of edges connecting tree vertices to non-tree vertices.",
      "It greedily selects the minimum weight edge from the queue and adds the new vertex to the tree.",
      "This process repeats until all vertices are included."
    ]
  },
  {
    id: 106,
    topic: "Minimum Spanning Trees",
    question: "What is the time complexity of Prim's algorithm?",
    answer: [
      "Using an adjacency list and a Binary Min-Heap, the time complexity is O((V + E) log V).",
      "Using a Fibonacci Heap, it can be optimized to O(E + V log V).",
      "Without a heap (using a simple array), it is O(V^2), which is only good for very dense graphs."
    ]
  },
  {
    id: 107,
    topic: "Minimum Spanning Trees",
    question: "When would you prefer Kruskal's over Prim's?",
    answer: [
      "Kruskal's is generally preferred for sparse graphs where E is much less than V^2.",
      "It's also easier to implement if the graph is already represented as an edge list.",
      "Prim's is preferred for dense graphs (E ≈ V^2) because it avoids sorting a massive number of edges."
    ]
  },
  {
    id: 108,
    topic: "Minimum Spanning Trees",
    question: "Does an MST change if we add a constant C to all edge weights?",
    answer: [
      "No, the MST structure remains exactly the same.",
      "Since an MST for V vertices always has exactly V - 1 edges, the total weight increases by exactly C * (V - 1) for every possible spanning tree.",
      "The relative ordering of edge weights remains unchanged, so Greedy choices remain the same."
    ]
  },
  {
    id: 109,
    topic: "Minimum Spanning Trees",
    question: "Does an MST change if we multiply all edge weights by a positive constant?",
    answer: [
      "No, the MST structure remains the same.",
      "Multiplying by a positive constant preserves the relative ordering of the edge weights.",
      "Since Prim's and Kruskal's only rely on comparisons (A < B), the same edges will be chosen."
    ]
  },
  {
    id: 110,
    topic: "Minimum Spanning Trees",
    question: "What happens if a graph has multiple edges with the same minimum weight?",
    answer: [
      "The graph may have multiple valid Minimum Spanning Trees.",
      "However, the total weight of any valid MST will always be the same.",
      "Algorithms like Kruskal's might produce different MSTs depending on how ties are broken during sorting."
    ]
  },
  {
    id: 111,
    topic: "Minimum Spanning Trees",
    question: "What is the role of the Disjoint Set (Union-Find) in Kruskal's algorithm?",
    answer: [
      "It keeps track of which vertices are connected to each other.",
      "The 'Find' operation checks if two vertices belong to the same component (which would mean adding an edge forms a cycle).",
      "The 'Union' operation merges two components together when an edge is added."
    ]
  },
  {
    id: 112,
    topic: "Minimum Spanning Trees",
    question: "What is Path Compression in Union-Find?",
    answer: [
      "It is an optimization used during the 'Find' operation.",
      "When finding the root of a node, we make every node on the path point directly to the root.",
      "This flattens the tree structure, making subsequent 'Find' operations extremely fast (amortized O(1))."
    ]
  },
  {
    id: 113,
    topic: "Minimum Spanning Trees",
    question: "Can an MST contain the heaviest edge of a graph?",
    answer: [
      "Yes, but only if that edge is an absolute necessity to keep the graph connected.",
      "If the heaviest edge is the only bridge connecting two distinct components of the graph, it MUST be included in the MST."
    ]
  },
  {
    id: 114,
    topic: "Minimum Spanning Trees",
    question: "Is the shortest path between two nodes in an MST the same as the shortest path in the original graph?",
    answer: [
      "No, an MST does not guarantee shortest paths between individual pairs of nodes.",
      "An MST minimizes the TOTAL weight of connecting all nodes.",
      "To find the shortest path between a specific pair of nodes, use Dijkstra's or Bellman-Ford."
    ]
  },
  {
    id: 115,
    topic: "Minimum Spanning Trees",
    question: "What happens to Kruskal's algorithm if the graph is not connected?",
    answer: [
      "It will fail to produce a single spanning tree.",
      "Instead, it will produce a Minimum Spanning Forest (a collection of MSTs, one for each connected component).",
      "The algorithm stops when all edges are processed, leaving V - k edges, where k is the number of connected components."
    ]
  },

  // ==========================================
  // TOPIC 2: Single Source Shortest Paths
  // ==========================================
  {
    id: 201,
    topic: "Single Source Shortest Paths",
    question: "What is the objective of Dijkstra's Algorithm?",
    answer: [
      "To find the shortest path from a single source node to all other reachable nodes in a graph.",
      "It works on both directed and undirected graphs, provided all edge weights are non-negative."
    ]
  },
  {
    id: 202,
    topic: "Single Source Shortest Paths",
    question: "What algorithmic paradigm does Dijkstra's use?",
    answer: [
      "It uses the Greedy paradigm.",
      "At each step, it selects the unvisited node with the smallest known tentative distance from the source.",
      "Because weights are positive, this locally optimal choice guarantees global optimality."
    ]
  },
  {
    id: 203,
    topic: "Single Source Shortest Paths",
    question: "What is Edge Relaxation?",
    answer: [
      "Relaxation is the process of updating the shortest known distance to a node.",
      "If the path to node V through node U is shorter than the currently known path to V (dist[U] + weight(U,V) < dist[V]), we update dist[V]."
    ]
  },
  {
    id: 204,
    topic: "Single Source Shortest Paths",
    question: "Why does Dijkstra's algorithm fail on graphs with negative edge weights?",
    answer: [
      "Dijkstra's assumes that once a node is visited and its shortest path is finalized, it can never be reached via a shorter path later.",
      "A negative weight edge can violate this assumption by providing a 'backdoor' shorter path to a previously finalized node.",
      "Because Dijkstra's doesn't re-evaluate finalized nodes, it yields incorrect results."
    ]
  },
  {
    id: 205,
    topic: "Single Source Shortest Paths",
    question: "What is the time complexity of Dijkstra's algorithm?",
    answer: [
      "With a basic array to find the minimum distance: O(V^2).",
      "With an Adjacency List and a Binary Min-Heap: O((V + E) log V).",
      "With a Fibonacci Heap: O(V log V + E)."
    ]
  },
  {
    id: 206,
    topic: "Single Source Shortest Paths",
    question: "How does the Bellman-Ford algorithm work?",
    answer: [
      "It is a Dynamic Programming algorithm.",
      "It relaxes ALL edges in the graph exactly V - 1 times.",
      "By the i-th iteration, it finds all shortest paths that use at most i edges."
    ]
  },
  {
    id: 207,
    topic: "Single Source Shortest Paths",
    question: "Why does Bellman-Ford iterate V - 1 times?",
    answer: [
      "A simple shortest path in a graph with V vertices can have at most V - 1 edges (otherwise it contains a cycle).",
      "Relaxing all edges V - 1 times guarantees that the shortest path information has propagated across the longest possible valid path."
    ]
  },
  {
    id: 208,
    topic: "Single Source Shortest Paths",
    question: "How does Bellman-Ford detect negative weight cycles?",
    answer: [
      "After performing V - 1 iterations of relaxing all edges, it performs one final, extra iteration.",
      "If any distance can STILL be relaxed (reduced) on the V-th iteration, it means there is a negative weight cycle in the graph.",
      "In a negative cycle, you can infinitely loop to decrease the path cost, so no 'shortest' path exists."
    ]
  },
  {
    id: 209,
    topic: "Single Source Shortest Paths",
    question: "What is the time complexity of the Bellman-Ford algorithm?",
    answer: [
      "It relaxes E edges V - 1 times.",
      "Therefore, the time complexity is O(V * E).",
      "In the worst case (a dense graph where E ≈ V^2), the complexity is O(V^3), making it slower than Dijkstra's."
    ]
  },
  {
    id: 210,
    topic: "Single Source Shortest Paths",
    question: "What is the Floyd-Warshall algorithm?",
    answer: [
      "It is a Dynamic Programming algorithm used to find the shortest paths between ALL PAIRS of vertices.",
      "It works by iteratively allowing each vertex to act as an intermediate step for all pairs of paths.",
      "It can handle negative edge weights but not negative cycles."
    ]
  },
  {
    id: 211,
    topic: "Single Source Shortest Paths",
    question: "What is the time complexity of Floyd-Warshall?",
    answer: [
      "It uses three nested loops (for k, for i, for j) iterating over all V vertices.",
      "The time complexity is strictly O(V^3).",
      "The space complexity is O(V^2) to store the distance matrix."
    ]
  },
  {
    id: 212,
    topic: "Single Source Shortest Paths",
    question: "How does Floyd-Warshall detect a negative cycle?",
    answer: [
      "In the distance matrix, the diagonal elements D[i][i] represent the distance from a node to itself.",
      "Initially, D[i][i] = 0.",
      "If after running the algorithm, any diagonal element D[i][i] < 0, it means the graph contains a negative weight cycle."
    ]
  },
  {
    id: 213,
    topic: "Single Source Shortest Paths",
    question: "When should you use Dijkstra's vs Bellman-Ford vs Floyd-Warshall?",
    answer: [
      "Dijkstra's: Single source, all non-negative weights. Fastest. O((V+E)logV).",
      "Bellman-Ford: Single source, graph contains negative weights. O(VE).",
      "Floyd-Warshall: All-pairs shortest path, or dense graphs needing all paths. O(V^3)."
    ]
  },
  {
    id: 214,
    topic: "Single Source Shortest Paths",
    question: "Can we add a large constant to all edge weights to make them positive and then run Dijkstra's?",
    answer: [
      "No, this is a common misconception.",
      "Adding a constant adds more weight to paths with more edges. A path with 3 edges will have the constant added 3 times, while a path with 1 edge will only have it added once.",
      "This changes the relative weighting of the paths, producing incorrect shortest paths."
    ]
  },
  {
    id: 215,
    topic: "Single Source Shortest Paths",
    question: "What is Johnson's Algorithm?",
    answer: [
      "It is an algorithm for finding all-pairs shortest paths in a sparse graph.",
      "It uses Bellman-Ford once to 'reweight' all edges to be non-negative without changing the shortest paths.",
      "Then it runs Dijkstra's algorithm from every vertex, achieving O(V^2 log V + VE) time, which is faster than Floyd-Warshall for sparse graphs."
    ]
  },

  // ==========================================
  // TOPIC 3: Topological Sorting & Scheduling
  // ==========================================
  {
    id: 301,
    topic: "Topological Sorting & Scheduling",
    question: "What is a Topological Sort?",
    answer: [
      "It is a linear ordering of vertices in a Directed Acyclic Graph (DAG).",
      "For every directed edge U -> V, vertex U comes before V in the ordering.",
      "It is used to schedule tasks that have dependencies (e.g., course prerequisites, build systems)."
    ]
  },
  {
    id: 302,
    topic: "Topological Sorting & Scheduling",
    question: "Can a graph with a cycle have a topological sort?",
    answer: [
      "No. Topological sorting is only possible on Directed Acyclic Graphs (DAGs).",
      "If there is a cycle (e.g., A depends on B, B depends on A), it's impossible to order them linearly without violating a dependency."
    ]
  },
  {
    id: 303,
    topic: "Topological Sorting & Scheduling",
    question: "How does Kahn's Algorithm for Topological Sort work?",
    answer: [
      "It calculates the in-degree (number of incoming edges) for all vertices.",
      "It places all vertices with an in-degree of 0 into a queue.",
      "It dequeues a vertex, adds it to the sort order, and conceptually removes its outgoing edges (by decrementing the in-degree of its neighbors).",
      "If a neighbor's in-degree hits 0, it is added to the queue."
    ]
  },
  {
    id: 304,
    topic: "Topological Sorting & Scheduling",
    question: "How does Kahn's Algorithm detect cycles?",
    answer: [
      "It counts how many vertices were added to the final topological order.",
      "If the count is less than the total number of vertices in the graph, it means some vertices never reached an in-degree of 0.",
      "This implies the graph contains at least one cycle."
    ]
  },
  {
    id: 305,
    topic: "Topological Sorting & Scheduling",
    question: "How does the DFS-based Topological Sort work?",
    answer: [
      "It performs a Depth-First Search on every unvisited vertex.",
      "During the DFS, it fully explores all neighbors (children) of a vertex first.",
      "Only after a vertex is fully explored (finished), it is pushed onto a stack.",
      "Popping all elements from the stack gives the topological order."
    ]
  },
  {
    id: 306,
    topic: "Topological Sorting & Scheduling",
    question: "What is the time complexity of Topological Sort?",
    answer: [
      "Both Kahn's algorithm and the DFS-based algorithm have a time complexity of O(V + E).",
      "This is because they both visit every vertex and every edge exactly once."
    ]
  },
  {
    id: 307,
    topic: "Topological Sorting & Scheduling",
    question: "Can a DAG have multiple valid topological sorts?",
    answer: [
      "Yes. If two vertices do not have a dependency on each other, their relative order doesn't matter.",
      "A DAG has a unique topological sort if and only if it contains a Hamiltonian path (a path that visits every vertex exactly once)."
    ]
  },
  {
    id: 308,
    topic: "Topological Sorting & Scheduling",
    question: "What happens in the DFS approach if the graph has a cycle?",
    answer: [
      "The DFS algorithm will encounter a 'back edge'.",
      "A back edge is an edge pointing to a vertex that is currently being visited (i.e., it's on the current recursion stack).",
      "If we track visited states as Unvisited, Visiting, and Finished, seeing a 'Visiting' node indicates a cycle."
    ]
  },
  {
    id: 309,
    topic: "Topological Sorting & Scheduling",
    question: "What are some real-world applications of Topological Sorting?",
    answer: [
      "Package managers resolving dependencies (e.g., npm, apt).",
      "Build systems (e.g., Make, Maven, Webpack) scheduling compilation tasks.",
      "Course prerequisite planning in universities.",
      "Instruction scheduling in compilers."
    ]
  },
  {
    id: 310,
    topic: "Topological Sorting & Scheduling",
    question: "What is the space complexity of Kahn's Algorithm?",
    answer: [
      "O(V) auxiliary space.",
      "It requires an array of size V to store the in-degrees, and a Queue that can hold at most V elements."
    ]
  },
  {
    id: 311,
    topic: "Topological Sorting & Scheduling",
    question: "How do you find the lexicographically smallest topological sort?",
    answer: [
      "Modify Kahn's algorithm.",
      "Instead of using a standard FIFO Queue, use a Min-Priority Queue.",
      "When multiple vertices have an in-degree of 0, the Min-Priority Queue will always pop the alphabetically or numerically smallest one first."
    ]
  },
  {
    id: 312,
    topic: "Topological Sorting & Scheduling",
    question: "Does topological sort work on undirected graphs?",
    answer: [
      "No. Topological sorting intrinsically requires directed edges to represent one-way dependencies.",
      "In an undirected graph, an edge between A and B implies A depends on B AND B depends on A, which is a cycle."
    ]
  },
  {
    id: 313,
    topic: "Topological Sorting & Scheduling",
    question: "What is an 'in-degree' in the context of Kahn's algorithm?",
    answer: [
      "The in-degree of a vertex is the number of directed edges pointing INTO it.",
      "In scheduling, an in-degree of 3 means the task has 3 prerequisites that must be completed before it can start."
    ]
  },
  {
    id: 314,
    topic: "Topological Sorting & Scheduling",
    question: "If a DAG has V vertices and V-1 edges (a directed tree), how many topological sorts exist?",
    answer: [
      "It depends on the structure. If it's a straight line, exactly 1.",
      "If it's a star graph (one source pointing to V-1 sinks), there are (V-1)! valid topological sorts, because the sinks can be processed in any order."
    ]
  },
  {
    id: 315,
    topic: "Topological Sorting & Scheduling",
    question: "Why does the DFS approach push to a stack instead of an array?",
    answer: [
      "DFS goes as deep as possible. The FIRST vertex to finish has no outgoing edges (or its descendants are processed).",
      "Because it has no dependencies, it must be the LAST task in the topological order.",
      "Pushing to a stack reverses the order, placing the first-finished tasks at the end, yielding the correct sort."
    ]
  },

  // ==========================================
  // TOPIC 4: Sorting Algorithms
  // ==========================================
  {
    id: 401,
    topic: "Sorting Algorithms",
    question: "What is a 'stable' sorting algorithm?",
    answer: [
      "A stable sorting algorithm preserves the relative order of elements with equal keys.",
      "If item A appears before item B in the input, and A == B, then A will still appear before B in the output.",
      "Merge Sort and Counting Sort are stable. Quick Sort and Heap Sort are inherently unstable."
    ]
  },
  {
    id: 402,
    topic: "Sorting Algorithms",
    question: "What does it mean for a sort to be 'in-place'?",
    answer: [
      "An in-place algorithm transforms the input using no auxiliary data structures, requiring only a small, constant O(1) extra space.",
      "Bubble, Selection, and Heap sort are in-place.",
      "Merge Sort is not in-place because it requires O(N) extra space to merge subarrays."
    ]
  },
  {
    id: 403,
    topic: "Sorting Algorithms",
    question: "How does Quick Sort work?",
    answer: [
      "It uses the Divide & Conquer paradigm.",
      "It picks a 'pivot' element and partitions the array so that all elements smaller than the pivot are on the left, and larger are on the right.",
      "It then recursively applies the same process to the left and right subarrays."
    ]
  },
  {
    id: 404,
    topic: "Sorting Algorithms",
    question: "What is the worst-case time complexity of Quick Sort, and when does it happen?",
    answer: [
      "The worst-case time complexity is O(N^2).",
      "It occurs when the partitioning is highly unbalanced (e.g., the array is already sorted, and we always pick the first or last element as the pivot).",
      "The recursion tree degrades to a linked list of depth N."
    ]
  },
  {
    id: 405,
    topic: "Sorting Algorithms",
    question: "How can we mitigate the O(N^2) worst case in Quick Sort?",
    answer: [
      "Use Randomized Quick Sort: pick a random index as the pivot to avoid predictable worst-case inputs.",
      "Use Median-of-Three: pick the median of the first, middle, and last elements as the pivot.",
      "Introsort: Fall back to Heap Sort if the recursion depth exceeds O(log N) (used in standard libraries)."
    ]
  },
  {
    id: 406,
    topic: "Sorting Algorithms",
    question: "How does Merge Sort work?",
    answer: [
      "It uses Divide & Conquer.",
      "It recursively splits the array in half until subarrays have 1 element (which are trivially sorted).",
      "It then repeatedly 'merges' the adjacent sorted subarrays together to build larger sorted arrays."
    ]
  },
  {
    id: 407,
    topic: "Sorting Algorithms",
    question: "What are the complexities of Merge Sort?",
    answer: [
      "Time Complexity: Always O(N log N) in the best, average, and worst cases because it always divides the array precisely in half.",
      "Space Complexity: O(N) auxiliary space is required for the temporary arrays during the merge step."
    ]
  },
  {
    id: 408,
    topic: "Sorting Algorithms",
    question: "How does Heap Sort work?",
    answer: [
      "It uses the Transform & Conquer paradigm.",
      "It first transforms the array into a Max-Heap (where the parent is always greater than its children).",
      "It repeatedly swaps the root (maximum element) with the last element, reduces the heap size, and 'heapifies' the root.",
      "This builds the sorted array from back to front in-place."
    ]
  },
  {
    id: 409,
    topic: "Sorting Algorithms",
    question: "Why is Quick Sort often faster than Merge Sort in practice despite the O(N^2) worst case?",
    answer: [
      "Quick Sort is an in-place sort, so it has excellent spatial locality and CPU cache performance.",
      "Merge Sort involves allocating and copying to temporary arrays, which causes memory overhead and cache misses.",
      "The constant factors hidden in Quick Sort's O(N log N) average case are smaller."
    ]
  },
  {
    id: 410,
    topic: "Sorting Algorithms",
    question: "What is Counting Sort and why is it O(N)?",
    answer: [
      "Counting sort trades space for time. It is not a comparison-based sort.",
      "It counts the frequency of each unique element and uses prefix sums to calculate exact index placements.",
      "Time complexity is O(N + K) where K is the range of the input values. It beats the O(N log N) lower bound because it doesn't compare elements!"
    ]
  },
  {
    id: 411,
    topic: "Sorting Algorithms",
    question: "What is the absolute lower bound for comparison-based sorting algorithms?",
    answer: [
      "The lower bound is Ω(N log N).",
      "A decision tree model proves that to distinguish between N! possible permutations, the binary tree of comparisons must have a height of at least log(N!), which simplifies to N log N."
    ]
  },
  {
    id: 412,
    topic: "Sorting Algorithms",
    question: "How does Bubble Sort work and what is its complexity?",
    answer: [
      "It repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.",
      "The largest element 'bubbles' up to the end in each pass.",
      "Time Complexity: O(N^2) average and worst. O(N) best case (if an 'already sorted' flag is used)."
    ]
  },
  {
    id: 413,
    topic: "Sorting Algorithms",
    question: "How does Selection Sort work and what is its complexity?",
    answer: [
      "It divides the array into a sorted and unsorted region.",
      "It repeatedly scans the unsorted region to find the absolute minimum element and swaps it with the first unsorted element.",
      "Time Complexity: Exactly O(N^2) in all cases (best, worst, average) because it always scans the entire remaining array."
    ]
  },
  {
    id: 414,
    topic: "Sorting Algorithms",
    question: "What is Radix Sort?",
    answer: [
      "It is a non-comparative integer sorting algorithm.",
      "It sorts data with integer keys by grouping keys by the individual digits which share the same significant position and value.",
      "It uses Counting Sort as a subroutine for each digit. Time complexity is O(d * (N + K)) where d is the number of digits."
    ]
  },
  {
    id: 415,
    topic: "Sorting Algorithms",
    question: "What is Timsort?",
    answer: [
      "It is a hybrid sorting algorithm derived from Merge Sort and Insertion Sort.",
      "It takes advantage of strictly increasing or decreasing 'runs' (subarrays) that already exist in most real-world data.",
      "It is the default sorting algorithm used in Python, Java, and the V8 JavaScript engine."
    ]
  },

  // ==========================================
  // TOPIC 5: Recursion & Dynamic Programming
  // ==========================================
  {
    id: 501,
    topic: "Recursion & DP",
    question: "What are the two key properties a problem must have to use Dynamic Programming?",
    answer: [
      "1. Overlapping Subproblems: The problem can be broken down into subproblems which are reused multiple times.",
      "2. Optimal Substructure (Principle of Optimality): An optimal solution to the overall problem can be constructed from optimal solutions of its subproblems."
    ]
  },
  {
    id: 502,
    topic: "Recursion & DP",
    question: "What is the difference between Top-Down and Bottom-Up Dynamic Programming?",
    answer: [
      "Top-Down (Memoization): Uses recursion. It starts with the main problem and recursively calls subproblems, caching their results in a hash map or array to avoid recalculation.",
      "Bottom-Up (Tabulation): Uses iteration. It builds a table starting from the smallest base cases (e.g., DP[0], DP[1]) up to the final target DP[N]."
    ]
  },
  {
    id: 503,
    topic: "Recursion & DP",
    question: "What is the Time and Space complexity of naive recursive Fibonacci?",
    answer: [
      "Time Complexity: O(2^N). The recursion tree branches into two calls at every step, creating an exponential number of redundant calculations.",
      "Space Complexity: O(N) auxiliary space, representing the maximum depth of the call stack."
    ]
  },
  {
    id: 504,
    topic: "Recursion & DP",
    question: "How does DP optimize the Fibonacci algorithm?",
    answer: [
      "By caching (memoizing) the results of Fib(N).",
      "When Fib(K) is requested again, the algorithm returns the cached value in O(1) time instead of spawning a new subtree.",
      "Time complexity drops from O(2^N) to linear O(N)."
    ]
  },
  {
    id: 505,
    topic: "Recursion & DP",
    question: "What is the 0/1 Knapsack Problem?",
    answer: [
      "Given a set of items, each with a weight and a value, determine the maximum value you can pack into a knapsack of capacity W.",
      "'0/1' means you must either take the whole item or leave it; you cannot take fractions of an item."
    ]
  },
  {
    id: 506,
    topic: "Recursion & DP",
    question: "Why does the Greedy approach fail for the 0/1 Knapsack problem?",
    answer: [
      "A Greedy approach (e.g., sorting by value-to-weight ratio) might choose a high-value item that consumes most of the capacity, leaving wasted space.",
      "Another combination of smaller items might perfectly fill the space yielding a higher total value.",
      "DP is required to exhaustively evaluate the choices implicitly."
    ]
  },
  {
    id: 507,
    topic: "Recursion & DP",
    question: "What is the time complexity of the 0/1 Knapsack DP solution?",
    answer: [
      "O(N * W), where N is the number of items and W is the knapsack capacity.",
      "It requires filling a 2D table of size N by W.",
      "Note: This is 'Pseudo-polynomial' time because it depends on the numerical value of W, not just the number of items."
    ]
  },
  {
    id: 508,
    topic: "Recursion & DP",
    question: "What is the state transition formula for 0/1 Knapsack?",
    answer: [
      "DP[i][w] = max( DP[i-1][w] , value[i] + DP[i-1][w - weight[i]] )",
      "In words: For item i at capacity w, the max value is the maximum of either LEAVING the item (inheriting the value from i-1) or TAKING the item (adding its value to the optimal solution for the remaining capacity)."
    ]
  },
  {
    id: 509,
    topic: "Recursion & DP",
    question: "What is the Longest Common Subsequence (LCS) problem?",
    answer: [
      "Given two strings, find the length of the longest subsequence present in both of them.",
      "A subsequence is a sequence that appears in the same relative order, but not necessarily contiguous."
    ]
  },
  {
    id: 510,
    topic: "Recursion & DP",
    question: "How do you solve LCS using DP?",
    answer: [
      "Create a 2D table DP[m+1][n+1] for strings of length m and n.",
      "If characters match (str1[i-1] == str2[j-1]), DP[i][j] = 1 + DP[i-1][j-1].",
      "If they don't match, take the max of excluding from string1 or string2: DP[i][j] = max(DP[i-1][j], DP[i][j-1]).",
      "Time complexity is O(m * n)."
    ]
  },
  {
    id: 511,
    topic: "Recursion & DP",
    question: "What is Matrix Chain Multiplication?",
    answer: [
      "Given a sequence of matrices, find the most efficient way to multiply them.",
      "Matrix multiplication is associative. (AB)C and A(BC) yield the same result but require vastly different numbers of scalar multiplications depending on their dimensions."
    ]
  },
  {
    id: 512,
    topic: "Recursion & DP",
    question: "How does DP solve Matrix Chain Multiplication?",
    answer: [
      "It defines DP[i][j] as the minimum scalar multiplications needed to compute the matrix from i to j.",
      "It tries all possible splitting points k between i and j.",
      "DP[i][j] = min(DP[i][k] + DP[k+1][j] + cost_to_multiply_results). Time complexity is O(N^3)."
    ]
  },
  {
    id: 513,
    topic: "Recursion & DP",
    question: "What is the difference between Divide & Conquer and Dynamic Programming?",
    answer: [
      "Divide & Conquer partitions a problem into INDEPENDENT subproblems (like Merge Sort). The subproblems do not overlap.",
      "Dynamic Programming is used when subproblems OVERLAP (like Fibonacci). It caches results to avoid doing the same work twice."
    ]
  },
  {
    id: 514,
    topic: "Recursion & DP",
    question: "Can DP be implemented recursively?",
    answer: [
      "Yes. Top-Down DP with Memoization is implemented recursively.",
      "It combines the natural expression of a recursive formula with a dictionary/array to cache results."
    ]
  },
  {
    id: 515,
    topic: "Recursion & DP",
    question: "What is a Stack Overflow exception in recursion?",
    answer: [
      "It occurs when the recursion depth is too deep, exceeding the memory allocated for the call stack.",
      "This happens if the base case is missing, incorrect, or if the problem size is simply too large for the system's memory limits.",
      "Iterative DP (Bottom-Up) completely avoids this issue because it doesn't use the call stack."
    ]
  },

  // ==========================================
  // TOPIC 6: String Matching
  // ==========================================
  {
    id: 601,
    topic: "String Matching",
    question: "What is the naive/brute-force string matching algorithm?",
    answer: [
      "It slides the pattern over the text one character at a time.",
      "At each position, it checks if the pattern matches the substring.",
      "If a mismatch occurs, it shifts the pattern by exactly 1 position."
    ]
  },
  {
    id: 602,
    topic: "String Matching",
    question: "What is the time complexity of naive string matching?",
    answer: [
      "Let N be text length and M be pattern length.",
      "Best Case: O(N), when the first character always mismatches.",
      "Worst Case: O((N - M + 1) * M), occurring when the text and pattern are almost identical (e.g., Text = 'AAAAAB', Pattern = 'AAAAB')."
    ]
  },
  {
    id: 603,
    topic: "String Matching",
    question: "What is the Horspool Algorithm?",
    answer: [
      "A simplification of the Boyer-Moore algorithm.",
      "It pre-processes the pattern to create a Shift Table (Bad Symbol Table).",
      "During search, it compares characters from right-to-left.",
      "On mismatch, it uses the Shift Table to slide the pattern by a calculated amount, often skipping multiple characters."
    ]
  },
  {
    id: 604,
    topic: "String Matching",
    question: "How is the Horspool Shift Table calculated?",
    answer: [
      "For every character in the alphabet, the shift is the distance from its LAST occurrence in the pattern to the end of the pattern.",
      "If the character is the very last character of the pattern, it is ignored (its second-to-last occurrence is used).",
      "For characters not in the pattern, the shift is M (the length of the entire pattern)."
    ]
  },
  {
    id: 605,
    topic: "String Matching",
    question: "Why does Horspool compare characters from Right to Left?",
    answer: [
      "Because the mismatch at the rightmost end of the pattern provides the most information.",
      "If the text character at the end of the pattern does not exist in the pattern at all, we can safely slide the entire pattern past that character (a shift of M)."
    ]
  },
  {
    id: 606,
    topic: "String Matching",
    question: "What is the time complexity of Horspool's Algorithm?",
    answer: [
      "Average Case: O(N). It performs very well on natural language texts.",
      "Worst Case: O(N * M), same as naive. Occurs with repetitive patterns like Text='AAAAA', Pat='BAAAA'."
    ]
  },
  {
    id: 607,
    topic: "String Matching",
    question: "How does the Boyer-Moore algorithm improve upon Horspool?",
    answer: [
      "Boyer-Moore uses two heuristics simultaneously: The Bad Character heuristic (similar to Horspool) and the Good Suffix heuristic.",
      "At every mismatch, it calculates the suggested shift from both heuristics and takes the MAXIMUM of the two."
    ]
  },
  {
    id: 608,
    topic: "String Matching",
    question: "What is the Good Suffix heuristic in Boyer-Moore?",
    answer: [
      "If a mismatch occurs, but a suffix of the pattern has ALREADY matched correctly.",
      "The algorithm shifts the pattern to align with the next occurrence of that matched suffix within the pattern itself."
    ]
  },
  {
    id: 609,
    topic: "String Matching",
    question: "What makes Boyer-Moore highly efficient in practice?",
    answer: [
      "It exhibits sub-linear average time complexity O(N / M).",
      "Because it skips chunks of text based on right-to-left mismatches, it doesn't even inspect every character in the text.",
      "The longer the pattern, the faster the search goes!"
    ]
  },
  {
    id: 610,
    topic: "String Matching",
    question: "What is the Rabin-Karp algorithm?",
    answer: [
      "It uses a rolling hash function to match strings.",
      "Instead of checking every character, it calculates the hash of the pattern, and compares it to the hash of an M-length sliding window in the text.",
      "Only if the hashes match does it perform a full string comparison (to handle hash collisions)."
    ]
  },
  {
    id: 611,
    topic: "String Matching",
    question: "What is a 'rolling hash'?",
    answer: [
      "A hash function where you can calculate the hash of the next window in O(1) time.",
      "It removes the influence of the character leaving the window and adds the influence of the new character entering the window."
    ]
  },
  {
    id: 612,
    topic: "String Matching",
    question: "What is the Knuth-Morris-Pratt (KMP) algorithm?",
    answer: [
      "An algorithm that achieves O(N + M) worst-case time by never re-evaluating text characters.",
      "It pre-processes the pattern to build a Prefix-Suffix (LPS - Longest Proper Prefix which is also Suffix) array.",
      "On mismatch, the LPS array tells the algorithm exactly where to resume matching, preventing the text pointer from ever moving backwards."
    ]
  },
  {
    id: 613,
    topic: "String Matching",
    question: "Why is KMP better than Naive in the worst case?",
    answer: [
      "In Naive, if a mismatch occurs after 5 matching characters, the text pointer jumps all the way back to the start.",
      "In KMP, the text pointer only moves forward. The pattern pointer is adjusted using the LPS array. Thus, it strictly takes O(N) time."
    ]
  },
  {
    id: 614,
    topic: "String Matching",
    question: "What is the space complexity of these advanced string matching algorithms?",
    answer: [
      "Horspool/Boyer-Moore: O(Σ), where Σ is the alphabet size, to store the Shift Table.",
      "KMP: O(M) auxiliary space to store the Prefix-Suffix (LPS) array."
    ]
  },
  {
    id: 615,
    topic: "String Matching",
    question: "When would you prefer KMP over Boyer-Moore?",
    answer: [
      "Boyer-Moore is much faster in practice for standard text search (e.g., Ctrl+F).",
      "KMP is preferred when the alphabet is tiny (e.g., Binary data, DNA sequences) because Boyer-Moore's Bad Character heuristic becomes ineffective and devolves to shifting by 1."
    ]
  }
];
