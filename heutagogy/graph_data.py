"""
heutagogy.graph_data — the static topic DAG for Layer 2, expressed as *pure data*.

This module is deliberately **just data plus one tiny build step**. It holds no
learner state, does no I/O, and imports nothing from the web layer. All behaviour
(traversal, status classification) lives in :mod:`heutagogy.skill_graph` and
:mod:`heutagogy.prerequisites`, which read the structures defined here. Keeping
the curated graph isolated means a curriculum author can retune nodes and edges
without touching a single line of algorithmic code.

What lives here
---------------
* :data:`RAW_NODES` — one entry per topic, keyed by a *human-readable* key, with
  presentation/pedagogy metadata (title, category, difficulty, estimated minutes,
  and the interactive-lab route the frontend links to).
* :data:`RAW_EDGES` — the "is-prerequisite-of" relation as ``(prereq, topic)``
  pairs. ``(a, b)`` reads "**a** is a prerequisite of **b**" — you should learn
  ``a`` before ``b``. This is the single source of the gating rules.
* :data:`NODES` / :data:`EDGES` — the same data with every topic key run through
  Layer 1's :func:`ai.learner_context.normalize_topic`. This is the important
  step: a topic a learner was assessed on in Layer 1 is stored under its
  *normalized* key (e.g. ``"Bellman-Ford"`` → ``"bellmanford"``), so the graph
  must key on the same normalized form for the two layers to line up. All of
  Layer 2 consumes the normalized :data:`NODES`/:data:`EDGES`; the ``RAW_*``
  tables exist only so this file stays legible to a human editor.

Design intent
-------------
The node set is a **superset of Layer 1's ``DEFAULT_TOPIC_CATALOG``** (§2.1 of the
architecture review): every catalogue topic appears here (so nothing a learner
can be recommended is missing from the map), and the graph may add extra scaffold
topics on top. Edges express a *sensible* learning order, not a mandatory track —
any node whose prerequisites are met is a valid next step (see
:mod:`heutagogy.prerequisites`). The graph is identical for every learner;
personalization happens above it.
"""

from __future__ import annotations

from typing import Any, Dict, List, Tuple

from ai.learner_context import normalize_topic


# ---------------------------------------------------------------------------
# Categories — used for grouping in the UI and analytics breakdowns.
# ---------------------------------------------------------------------------
# Kept as plain string constants (not an enum) so the data below reads cleanly
# and stays JSON-serialisable without conversion.
CAT_COMPRESSION = "compression"
CAT_SORTING = "sorting"
CAT_GRAPH = "graph"
CAT_GREEDY_DP = "greedy-dp"
CAT_STRINGS = "strings"

# Difficulty tiers mirror the learner's ``preferred_difficulty`` vocabulary in
# ``state_store`` so a future filter can compare them directly.
BEGINNER = "beginner"
INTERMEDIATE = "intermediate"
ADVANCED = "advanced"


# ---------------------------------------------------------------------------
# Nodes — one curated entry per topic (human-readable keys).
# ---------------------------------------------------------------------------
# Each value carries only *static* metadata. Nothing here depends on a learner;
# mastery/status are computed at read time by the prerequisite engine. ``route``
# is the interactive-lab path the frontend links to (``None`` when a topic has no
# dedicated lab yet — the map still shows the node, just without a "practice"
# link). Estimated minutes feed the completion-time estimate in later milestones.
RAW_NODES: Dict[str, Dict[str, Any]] = {
    # --- Compression -------------------------------------------------------
    "huffman": {
        "title": "Huffman Coding",
        "category": CAT_COMPRESSION,
        "difficulty": BEGINNER,
        "estimated_minutes": 30,
        "route": "/huffman",
    },
    "lz77": {
        "title": "LZ77",
        "category": CAT_COMPRESSION,
        "difficulty": INTERMEDIATE,
        "estimated_minutes": 40,
        "route": "/lz77",
    },
    "lzw": {
        "title": "LZW",
        "category": CAT_COMPRESSION,
        "difficulty": INTERMEDIATE,
        "estimated_minutes": 40,
        "route": "/decoder",
    },
    # --- Sorting -----------------------------------------------------------
    "mergesort": {
        "title": "Merge Sort",
        "category": CAT_SORTING,
        "difficulty": BEGINNER,
        "estimated_minutes": 25,
        "route": "/sorting-lab",
    },
    "quicksort": {
        "title": "Quick Sort",
        "category": CAT_SORTING,
        "difficulty": INTERMEDIATE,
        "estimated_minutes": 30,
        "route": "/sorting-lab",
    },
    "heapsort": {
        "title": "Heap Sort",
        "category": CAT_SORTING,
        "difficulty": INTERMEDIATE,
        "estimated_minutes": 30,
        "route": "/sorting-lab",
    },
    # --- Graph -------------------------------------------------------------
    "topological-sort": {
        "title": "Topological Sort",
        "category": CAT_GRAPH,
        "difficulty": BEGINNER,
        "estimated_minutes": 25,
        "route": "/scheduler",
    },
    "dijkstra": {
        "title": "Dijkstra's Shortest Path",
        "category": CAT_GRAPH,
        "difficulty": INTERMEDIATE,
        "estimated_minutes": 35,
        "route": "/network-routing",
    },
    "bellman-ford": {
        "title": "Bellman-Ford",
        "category": CAT_GRAPH,
        "difficulty": ADVANCED,
        "estimated_minutes": 35,
        "route": "/bellman-ford",
    },
    "floyd-warshall": {
        "title": "Floyd-Warshall (All-Pairs)",
        "category": CAT_GRAPH,
        "difficulty": ADVANCED,
        "estimated_minutes": 40,
        "route": None,
    },
    "prim": {
        "title": "Prim's MST",
        "category": CAT_GRAPH,
        "difficulty": INTERMEDIATE,
        "estimated_minutes": 30,
        "route": "/mst-planner",
    },
    "kruskal": {
        "title": "Kruskal's MST",
        "category": CAT_GRAPH,
        "difficulty": INTERMEDIATE,
        "estimated_minutes": 30,
        "route": "/mst-planner",
    },
    # --- Greedy / Dynamic Programming -------------------------------------
    "knapsack": {
        "title": "0/1 Knapsack",
        "category": CAT_GREEDY_DP,
        "difficulty": INTERMEDIATE,
        "estimated_minutes": 35,
        "route": "/knapsack",
    },
    # --- Strings -----------------------------------------------------------
    "string-matching": {
        "title": "String Matching",
        "category": CAT_STRINGS,
        "difficulty": INTERMEDIATE,
        "estimated_minutes": 35,
        "route": "/string-matching",
    },
}


# ---------------------------------------------------------------------------
# Edges — the "is-prerequisite-of" relation (human-readable keys).
# ---------------------------------------------------------------------------
# Read ``(a, b)`` as "learn *a* before *b*". These encode a gentle, defensible
# progression, not a forced path:
#   * Compression:  huffman → lz77 → lzw   (entropy coding before dictionary coding)
#   * Sorting:      mergesort → quicksort, heapsort   (divide-and-conquer first)
#   * Graph:        topological-sort → dijkstra → {bellman-ford, prim};
#                   bellman-ford → floyd-warshall (single-source before all-pairs)
#   * MST:          mergesort → kruskal   (Kruskal sorts edges → needs sorting)
# Roots with no incoming edge (huffman, mergesort, topological-sort, knapsack,
# string-matching) are the natural entry points a brand-new learner can start on.
RAW_EDGES: List[Tuple[str, str]] = [
    # Compression chain.
    ("huffman", "lz77"),
    ("lz77", "lzw"),
    # Sorting fan-out from merge sort.
    ("mergesort", "quicksort"),
    ("mergesort", "heapsort"),
    # Kruskal needs a sorting foundation (it sorts edges by weight).
    ("mergesort", "kruskal"),
    # Graph progression.
    ("topological-sort", "dijkstra"),
    ("dijkstra", "bellman-ford"),
    ("dijkstra", "prim"),
    ("bellman-ford", "floyd-warshall"),
]


# ---------------------------------------------------------------------------
# Normalized views — what the rest of Layer 2 actually consumes.
# ---------------------------------------------------------------------------
# Re-key every node/edge through Layer 1's normalizer so a topic recorded in
# ``learner_profiles.json`` (always stored normalized) lands on the exact same
# key as its graph node. e.g. "bellman-ford" → "bellmanford". The metadata dict
# is preserved verbatim; only the key changes.
NODES: Dict[str, Dict[str, Any]] = {
    normalize_topic(key): dict(meta) for key, meta in RAW_NODES.items()
}

EDGES: List[Tuple[str, str]] = [
    (normalize_topic(src), normalize_topic(dst)) for src, dst in RAW_EDGES
]
