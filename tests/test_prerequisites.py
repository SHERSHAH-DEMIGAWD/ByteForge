"""
Unit tests for heutagogy.prerequisites.PrerequisiteEngine (Layer 2, M1).

Pure-stdlib ``unittest``. The engine is exercised on a small, hand-built skill
graph so each locked/available/in_progress/mastered transition is unambiguous and
independent of future edits to the curated curriculum. One suite at the end also
sanity-checks the engine against the real platform graph.

Synthetic graph used by most tests::

    a ─► b ─► c        (a is prereq of b; b is prereq of c)
    a ─► d             (a is prereq of d)

So `a` and any root are immediately available; `b`/`d` unlock once `a` is mastered;
`c` unlocks once `b` is mastered.

Run: ``python -m unittest tests.test_prerequisites``
"""

from __future__ import annotations

import unittest

from ai.learner_context import MASTERY_THRESHOLD
from heutagogy.prerequisites import (
    AVAILABLE,
    IN_PROGRESS,
    LOCKED,
    MASTERED,
    PrerequisiteEngine,
    get_prerequisite_engine,
)
from heutagogy.skill_graph import SkillGraphEngine


def _graph() -> SkillGraphEngine:
    nodes = {k: {"category": "x"} for k in ("a", "b", "c", "d")}
    return SkillGraphEngine(nodes=nodes, edges=[("a", "b"), ("b", "c"), ("a", "d")])


# A score comfortably at/above and below the shared threshold.
PASS = MASTERY_THRESHOLD
FAIL = MASTERY_THRESHOLD - 1


class StatusForTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = PrerequisiteEngine(graph=_graph())

    def test_root_with_no_attempts_is_available(self) -> None:
        status = self.engine.status_for("a", {})
        self.assertEqual(status["status"], AVAILABLE)
        self.assertEqual(status["mastery"], 0)
        self.assertIn("prerequisites are met", status["reason"])

    def test_child_is_locked_when_prereq_unmet(self) -> None:
        status = self.engine.status_for("b", {})
        self.assertEqual(status["status"], LOCKED)
        self.assertIn("a", status["reason"])

    def test_child_below_threshold_keeps_prereq_locked(self) -> None:
        # `a` attempted but not mastered → `b` stays locked.
        status = self.engine.status_for("b", {"a": FAIL})
        self.assertEqual(status["status"], LOCKED)

    def test_child_unlocks_when_prereq_mastered(self) -> None:
        status = self.engine.status_for("b", {"a": PASS})
        self.assertEqual(status["status"], AVAILABLE)

    def test_attempted_but_unmastered_is_in_progress(self) -> None:
        # `a` mastered so `b` is unlocked; `b` attempted below threshold.
        status = self.engine.status_for("b", {"a": PASS, "b": FAIL})
        self.assertEqual(status["status"], IN_PROGRESS)
        self.assertEqual(status["mastery"], FAIL)

    def test_mastered_when_own_score_meets_threshold(self) -> None:
        status = self.engine.status_for("a", {"a": PASS})
        self.assertEqual(status["status"], MASTERED)
        self.assertIn(str(PASS), status["reason"])

    def test_mastery_wins_even_if_prereqs_unmet(self) -> None:
        # Evidence of mastery on `c` overrides the locked-by-prereq rule.
        status = self.engine.status_for("c", {"c": PASS})
        self.assertEqual(status["status"], MASTERED)

    def test_exactly_at_threshold_counts_as_mastered(self) -> None:
        # Boundary: >= threshold, not strictly greater.
        self.assertEqual(self.engine.status_for("a", {"a": PASS})["status"], MASTERED)

    def test_unknown_topic_raises(self) -> None:
        with self.assertRaises(KeyError):
            self.engine.status_for("ghost", {})


class BlockingPrereqsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = PrerequisiteEngine(graph=_graph())

    def test_lists_unmet_direct_prereqs(self) -> None:
        self.assertEqual(self.engine.blocking_prereqs("b", {}), ["a"])

    def test_empty_when_unlocked(self) -> None:
        self.assertEqual(self.engine.blocking_prereqs("b", {"a": PASS}), [])

    def test_only_direct_prereqs_reported(self) -> None:
        # `c`'s only *direct* blocker is `b`, even though `a` is also unmet upstream.
        self.assertEqual(self.engine.blocking_prereqs("c", {}), ["b"])

    def test_root_is_never_blocked(self) -> None:
        self.assertEqual(self.engine.blocking_prereqs("a", {}), [])


class UnlockedAndNextTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = PrerequisiteEngine(graph=_graph())

    def test_only_roots_unlocked_initially(self) -> None:
        self.assertEqual(self.engine.unlocked_topics({}), ["a"])

    def test_unlock_cascades_as_mastery_grows(self) -> None:
        unlocked = self.engine.unlocked_topics({"a": PASS})
        self.assertEqual(set(unlocked), {"a", "b", "d"})

    def test_unlocked_includes_mastered(self) -> None:
        # `a` mastered is still "unlocked" (not locked), alongside newly opened b/d.
        unlocked = self.engine.unlocked_topics({"a": PASS})
        self.assertIn("a", unlocked)

    def test_next_available_excludes_mastered(self) -> None:
        nxt = self.engine.next_available({"a": PASS})
        self.assertNotIn("a", nxt)  # already mastered
        self.assertEqual(set(nxt), {"b", "d"})

    def test_next_available_prioritizes_in_progress(self) -> None:
        # `a` mastered opens b & d; d is already in progress → it should sort first.
        nxt = self.engine.next_available({"a": PASS, "d": FAIL})
        self.assertEqual(nxt[0], "d")

    def test_next_available_empty_when_all_mastered(self) -> None:
        allmastered = {k: PASS for k in ("a", "b", "c", "d")}
        self.assertEqual(self.engine.next_available(allmastered), [])

    def test_status_map_covers_every_node(self) -> None:
        smap = self.engine.status_map({"a": PASS})
        self.assertEqual(set(smap), {"a", "b", "c", "d"})
        self.assertEqual(smap["a"]["status"], MASTERED)
        self.assertEqual(smap["c"]["status"], LOCKED)


class CuratedGraphIntegrationTest(unittest.TestCase):
    """A couple of checks against the real platform graph via the default accessor."""

    def setUp(self) -> None:
        self.engine = get_prerequisite_engine()

    def test_shares_layer1_threshold(self) -> None:
        self.assertEqual(self.engine.threshold, MASTERY_THRESHOLD)

    def test_fresh_learner_can_only_start_at_roots(self) -> None:
        # With no evidence, unlocked topics are exactly the graph roots.
        from heutagogy.skill_graph import get_skill_graph

        self.assertEqual(
            set(self.engine.unlocked_topics({})),
            set(get_skill_graph().roots()),
        )

    def test_mastering_huffman_unlocks_lz77(self) -> None:
        # huffman → lz77 in the curated compression chain.
        status = self.engine.status_for("lz77", {"huffman": PASS})
        self.assertEqual(status["status"], AVAILABLE)


if __name__ == "__main__":
    unittest.main()
