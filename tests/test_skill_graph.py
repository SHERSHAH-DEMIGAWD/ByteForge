"""
Unit tests for heutagogy.skill_graph.SkillGraphEngine + heutagogy.graph_data (M1).

Pure-stdlib ``unittest`` (no third-party deps), matching the repository default.
Two concerns are covered here:

* The **curated platform graph** loaded from :mod:`heutagogy.graph_data` — it is a
  valid DAG, covers Layer 1's catalogue, and keys topics the same way Layer 1 does.
* The **engine mechanics** — topological order, adjacency, and the acyclicity /
  referential-integrity validation — exercised with small synthetic graphs so a
  failure points at logic, not curriculum data.

Run: ``python -m unittest tests.test_skill_graph``
"""

from __future__ import annotations

import unittest

from ai.learner_context import DEFAULT_TOPIC_CATALOG, normalize_topic
from heutagogy import graph_data
from heutagogy.skill_graph import (
    SkillGraphEngine,
    SkillGraphError,
    get_skill_graph,
)


class CuratedGraphTest(unittest.TestCase):
    """Properties the shipped platform graph must hold."""

    def setUp(self) -> None:
        self.engine = SkillGraphEngine()  # loads curated graph_data by default

    def test_is_acyclic_and_orders_all_nodes(self) -> None:
        order = self.engine.topological_order()
        self.assertEqual(len(order), len(self.engine.nodes()))
        self.assertEqual(set(order), set(self.engine.all_topics()))

    def test_topological_order_respects_every_edge(self) -> None:
        order = self.engine.topological_order()
        position = {topic: i for i, topic in enumerate(order)}
        for src, dst in self.engine.edges():
            self.assertLess(
                position[src],
                position[dst],
                msg=f"prerequisite {src!r} must come before {dst!r}",
            )

    def test_covers_layer1_catalogue(self) -> None:
        # Every recommendable Layer 1 topic must exist as a node (normalized).
        nodes = self.engine.nodes()
        for raw in DEFAULT_TOPIC_CATALOG:
            self.assertIn(
                normalize_topic(raw),
                nodes,
                msg=f"catalogue topic {raw!r} missing from skill graph",
            )

    def test_node_keys_are_normalized(self) -> None:
        # A hyphenated raw key like "bellman-ford" must be stored as "bellmanford".
        self.assertIn("bellmanford", self.engine.nodes())
        self.assertNotIn("bellman-ford", self.engine.nodes())

    def test_every_node_has_required_metadata(self) -> None:
        required = {"title", "category", "difficulty", "estimated_minutes", "route"}
        for topic, meta in self.engine.nodes().items():
            self.assertTrue(
                required.issubset(meta),
                msg=f"node {topic!r} is missing metadata keys {required - set(meta)}",
            )

    def test_edges_reference_only_known_nodes(self) -> None:
        nodes = self.engine.nodes()
        for src, dst in self.engine.edges():
            self.assertIn(src, nodes)
            self.assertIn(dst, nodes)

    def test_roots_have_no_prerequisites(self) -> None:
        roots = self.engine.roots()
        self.assertTrue(roots, "graph should have at least one entry-point topic")
        for root in roots:
            self.assertEqual(self.engine.prerequisites_of(root), [])

    def test_get_graph_shape_is_json_friendly(self) -> None:
        graph = self.engine.get_graph()
        self.assertEqual(set(graph), {"nodes", "edges"})
        self.assertTrue(all("topic" in n for n in graph["nodes"]))
        self.assertTrue(all(len(e) == 2 for e in graph["edges"]))

    def test_get_graph_returns_independent_copies(self) -> None:
        # Mutating the returned document must not corrupt the engine's data.
        graph = self.engine.get_graph()
        graph["nodes"][0]["title"] = "MUTATED"
        graph["nodes"][0]["status"] = "hacked"
        fresh = self.engine.get_graph()
        self.assertNotEqual(fresh["nodes"][0]["title"], "MUTATED")
        self.assertNotIn("status", fresh["nodes"][0])

    def test_neighbors_reports_both_directions(self) -> None:
        # dijkstra: prereq topological-sort (normalized), unlocks bellman-ford & prim.
        nb = self.engine.neighbors("dijkstra")
        self.assertIn(normalize_topic("topological-sort"), nb["prerequisites"])
        self.assertIn(normalize_topic("bellman-ford"), nb["unlocks"])
        self.assertIn("prim", nb["unlocks"])


class GetSkillGraphAccessorTest(unittest.TestCase):
    def test_accessor_is_cached_singleton(self) -> None:
        self.assertIs(get_skill_graph(), get_skill_graph())


class EngineMechanicsTest(unittest.TestCase):
    """Engine logic exercised on tiny synthetic graphs."""

    def _linear(self) -> SkillGraphEngine:
        # a -> b -> c
        nodes = {k: {"category": "x"} for k in ("a", "b", "c")}
        return SkillGraphEngine(nodes=nodes, edges=[("a", "b"), ("b", "c")])

    def test_linear_topological_order(self) -> None:
        self.assertEqual(self._linear().topological_order(), ["a", "b", "c"])

    def test_diamond_topological_order(self) -> None:
        #   a -> b -> d
        #   a -> c -> d
        nodes = {k: {"category": "x"} for k in ("a", "b", "c", "d")}
        eng = SkillGraphEngine(
            nodes=nodes, edges=[("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")]
        )
        order = eng.topological_order()
        pos = {n: i for i, n in enumerate(order)}
        self.assertLess(pos["a"], pos["b"])
        self.assertLess(pos["a"], pos["c"])
        self.assertLess(pos["b"], pos["d"])
        self.assertLess(pos["c"], pos["d"])

    def test_cycle_is_rejected_at_construction(self) -> None:
        nodes = {k: {"category": "x"} for k in ("a", "b")}
        with self.assertRaises(SkillGraphError):
            SkillGraphEngine(nodes=nodes, edges=[("a", "b"), ("b", "a")])

    def test_self_loop_is_rejected(self) -> None:
        with self.assertRaises(SkillGraphError):
            SkillGraphEngine(nodes={"a": {}}, edges=[("a", "a")])

    def test_edge_to_unknown_node_is_rejected(self) -> None:
        with self.assertRaises(SkillGraphError):
            SkillGraphEngine(nodes={"a": {}}, edges=[("a", "ghost")])

    def test_engine_does_not_mutate_input_data(self) -> None:
        nodes = {"a": {"category": "x"}}
        eng = SkillGraphEngine(nodes=nodes, edges=[])
        eng.nodes()["a"]["category"] = "MUTATED"
        self.assertEqual(nodes["a"]["category"], "x")

    def test_unknown_node_lookups_raise_keyerror(self) -> None:
        eng = self._linear()
        for call in (
            lambda: eng.node("ghost"),
            lambda: eng.category_of("ghost"),
            lambda: eng.neighbors("ghost"),
        ):
            with self.assertRaises(KeyError):
                call()

    def test_graph_data_raw_and_normalized_agree_in_size(self) -> None:
        # Normalization must not collide two distinct raw topics onto one key.
        self.assertEqual(len(graph_data.RAW_NODES), len(graph_data.NODES))
        self.assertEqual(len(graph_data.RAW_EDGES), len(graph_data.EDGES))


if __name__ == "__main__":
    unittest.main()
