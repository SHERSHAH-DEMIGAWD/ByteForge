"""
heutagogy.skill_graph — the Skill Graph Engine (Layer 2, M1).

Wraps the pure data in :mod:`heutagogy.graph_data` behind a small, read-only API
that the prerequisite engine, roadmap, and skill-tree view all build on. This is
the structural backbone of the learning map: *which topics exist, how they relate,
and in what order they can be learned.*

Key properties (by design):

* **Stateless / learner-agnostic.** The graph is identical for every learner.
  Nothing here reads a profile or touches disk. Personalization (locked /
  available / mastered) is layered on top by :mod:`heutagogy.prerequisites`.
* **Validated on construction.** The engine verifies at build time that every
  edge references a known node and that the relation is a **DAG** (acyclic). A
  malformed :mod:`graph_data` therefore fails loudly and immediately rather than
  producing a confusing partial order later.
* **Normalized keys.** Every topic key is Layer 1's normalized form (see
  :mod:`graph_data`), so a topic recorded in ``learner_profiles.json`` maps to
  the same node.

Exposed surface (per architecture review §2.1): :meth:`get_graph`,
:meth:`nodes`, :meth:`edges`, :meth:`topological_order`, :meth:`neighbors`,
:meth:`category_of`, plus :meth:`prerequisites_of` / :meth:`dependents_of` /
:meth:`roots` used by the prerequisite engine and roadmap.
"""

from __future__ import annotations

from collections import defaultdict, deque
from functools import lru_cache
from typing import Any, Dict, List, Tuple

from . import graph_data


class SkillGraphError(ValueError):
    """Raised when the curated graph data is structurally invalid.

    Subclasses :class:`ValueError` so callers can catch it as one, but the
    distinct type makes "the *graph* is broken" easy to distinguish from an
    ordinary bad argument. Two conditions trigger it: an edge that names a
    non-existent node, and a cycle (the relation must be a DAG).
    """


class SkillGraphEngine:
    """Read-only view over the static topic DAG.

    Construct it with explicit ``nodes``/``edges`` (handy for tests that want a
    tiny synthetic graph), or leave them as ``None`` to load the curated platform
    graph from :mod:`heutagogy.graph_data`. Adjacency maps are precomputed once in
    the constructor so every accessor is a cheap lookup.
    """

    def __init__(
        self,
        nodes: Dict[str, Dict[str, Any]] | None = None,
        edges: List[Tuple[str, str]] | None = None,
    ) -> None:
        # Defensive copies so callers/tests can't mutate our internal state, and
        # so the module-level curated data is never edited in place.
        self._nodes: Dict[str, Dict[str, Any]] = {
            key: dict(meta)
            for key, meta in (graph_data.NODES if nodes is None else nodes).items()
        }
        self._edges: List[Tuple[str, str]] = list(
            graph_data.EDGES if edges is None else edges
        )

        # Precomputed adjacency in both directions.
        #   _forward[a]  = topics that have `a` as a prerequisite (what `a` unlocks)
        #   _prereqs[b]  = the direct prerequisites of `b`
        self._forward: Dict[str, List[str]] = defaultdict(list)
        self._prereqs: Dict[str, List[str]] = defaultdict(list)

        self._validate_and_index()

    # -- construction helpers ----------------------------------------------

    def _validate_and_index(self) -> None:
        """Check referential integrity + acyclicity, then build adjacency maps."""
        for src, dst in self._edges:
            if src not in self._nodes:
                raise SkillGraphError(
                    f"edge ({src!r} -> {dst!r}) references unknown prerequisite node {src!r}"
                )
            if dst not in self._nodes:
                raise SkillGraphError(
                    f"edge ({src!r} -> {dst!r}) references unknown node {dst!r}"
                )
            self._forward[src].append(dst)
            self._prereqs[dst].append(src)

        # Fail fast on a cycle: a prerequisite loop can never be satisfied, so it
        # would silently soft-lock every node in the loop. topological_order()
        # raises on a cycle; calling it here turns "bad data" into a startup error.
        self.topological_order()

    # -- whole-graph accessors ---------------------------------------------

    def get_graph(self) -> Dict[str, Any]:
        """Return the full graph as a JSON-friendly ``{nodes, edges}`` document.

        This is the shape the ``GET /learn/skill-graph`` endpoint (a later
        milestone) serves to the frontend skill-tree view. ``nodes`` is a list so
        the client keeps a stable order; each entry carries its ``topic`` key plus
        all static metadata. Copies are returned so the caller can annotate the
        result (e.g. bolt on per-learner ``status``) without corrupting the engine.
        """
        return {
            "nodes": [
                {"topic": key, **dict(meta)} for key, meta in self._nodes.items()
            ],
            "edges": [[src, dst] for src, dst in self._edges],
        }

    def nodes(self) -> Dict[str, Dict[str, Any]]:
        """Return a copy of the ``{topic: metadata}`` node map."""
        return {key: dict(meta) for key, meta in self._nodes.items()}

    def edges(self) -> List[Tuple[str, str]]:
        """Return a copy of the ``(prerequisite, topic)`` edge list."""
        return list(self._edges)

    def has_topic(self, topic: str) -> bool:
        """Whether ``topic`` (already-normalized key) is a node in the graph."""
        return topic in self._nodes

    def all_topics(self) -> List[str]:
        """All node keys, in the graph's insertion order (i.e. curated order)."""
        return list(self._nodes.keys())

    # -- per-node accessors -------------------------------------------------

    def node(self, topic: str) -> Dict[str, Any]:
        """Return a copy of one node's metadata, or raise ``KeyError`` if absent."""
        if topic not in self._nodes:
            raise KeyError(topic)
        return dict(self._nodes[topic])

    def category_of(self, topic: str) -> str:
        """Return the category string for ``topic`` (raises ``KeyError`` if absent)."""
        return self.node(topic)["category"]

    def prerequisites_of(self, topic: str) -> List[str]:
        """Direct prerequisites of ``topic`` (topics one edge upstream)."""
        return list(self._prereqs.get(topic, []))

    def dependents_of(self, topic: str) -> List[str]:
        """Topics that ``topic`` directly unlocks (one edge downstream)."""
        return list(self._forward.get(topic, []))

    def neighbors(self, topic: str) -> Dict[str, List[str]]:
        """Both-direction adjacency for ``topic`` as ``{prerequisites, unlocks}``.

        A single convenience call for the skill-tree view, which needs to draw
        edges into and out of a selected node.
        """
        if topic not in self._nodes:
            raise KeyError(topic)
        return {
            "prerequisites": self.prerequisites_of(topic),
            "unlocks": self.dependents_of(topic),
        }

    def roots(self) -> List[str]:
        """Topics with no prerequisites — valid starting points for a new learner."""
        return [key for key in self._nodes if not self._prereqs.get(key)]

    # -- ordering -----------------------------------------------------------

    def topological_order(self) -> List[str]:
        """Return all topics in a valid learn-before order (Kahn's algorithm).

        A prerequisite always appears before every topic that depends on it. Among
        otherwise-independent nodes, the graph's curated insertion order is used
        as a stable tie-break, so the output is deterministic run to run. Raises
        :class:`SkillGraphError` if the graph contains a cycle (no valid order
        exists) — which is also how construction detects bad data.
        """
        indegree: Dict[str, int] = {key: 0 for key in self._nodes}
        for _src, dst in self._edges:
            indegree[dst] += 1

        # Seed the queue with every zero-indegree node, preserving curated order
        # for determinism (dict iteration is insertion-ordered in Python 3.7+).
        queue: deque[str] = deque(key for key in self._nodes if indegree[key] == 0)
        order: List[str] = []

        while queue:
            node = queue.popleft()
            order.append(node)
            for nxt in self._forward.get(node, []):
                indegree[nxt] -= 1
                if indegree[nxt] == 0:
                    queue.append(nxt)

        if len(order) != len(self._nodes):
            # Some nodes never reached indegree 0 → they sit on a cycle.
            remaining = sorted(set(self._nodes) - set(order))
            raise SkillGraphError(
                f"skill graph is not a DAG; cycle involves: {remaining}"
            )
        return order


# ---------------------------------------------------------------------------
# Process-wide accessor (one engine per process, mirroring get_store()/get_provider())
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def get_skill_graph() -> SkillGraphEngine:
    """Return the process-wide Skill Graph Engine built from the curated data.

    Cached because the graph is immutable and validation (the acyclicity check) is
    worth doing exactly once. Tests that want an isolated or synthetic graph can
    instantiate :class:`SkillGraphEngine` directly with explicit ``nodes``/``edges``
    instead of going through this accessor.
    """
    return SkillGraphEngine()
