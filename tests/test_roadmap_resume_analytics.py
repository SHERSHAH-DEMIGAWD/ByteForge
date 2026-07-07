"""
Unit tests for the M3 orchestration services (Layer 2): roadmap, resume, analytics.

These services read Layer 1's real ``LearnerContextStore`` and the Layer 2
``LearningStateStore`` singletons. To stay hermetic, each test points both stores
at a fresh temp directory via the ``AI_DATA_DIR`` env var and clears the
``lru_cache``d accessors, so nothing touches the developer's real ``ai_data/``.
Evidence is seeded through Layer 1's public ``record_*`` API — exercising the
exact write path the ``/ai/*`` endpoints use.

Run: ``python -m unittest tests.test_roadmap_resume_analytics``
"""

from __future__ import annotations

import os
import tempfile
import unittest

import ai.learner_context as lc
import heutagogy.state_store as ss
from ai.learner_context import MASTERY_THRESHOLD
from heutagogy.analytics import ProgressAnalytics
from heutagogy.resume import ResumeLearningService
from heutagogy.roadmap import LearningRoadmapService


class _IsolatedStoresTest(unittest.TestCase):
    """Base class: redirect both JSON stores to a throwaway directory."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self._prev = os.environ.get("AI_DATA_DIR")
        os.environ["AI_DATA_DIR"] = self._tmp.name
        # Drop cached singletons so they rebuild against the temp dir.
        lc.get_store.cache_clear()
        ss.get_learning_store.cache_clear()
        self.profile_store = lc.get_store()

    def tearDown(self) -> None:
        if self._prev is None:
            os.environ.pop("AI_DATA_DIR", None)
        else:
            os.environ["AI_DATA_DIR"] = self._prev
        lc.get_store.cache_clear()
        ss.get_learning_store.cache_clear()
        self._tmp.cleanup()

    def _master(self, sid: str, topic: str, score: int = 95) -> None:
        self.profile_store.record_assessment(sid, topic, score)


class RoadmapServiceTest(_IsolatedStoresTest):
    def test_roadmap_covers_every_graph_node(self) -> None:
        rm = LearningRoadmapService().build_roadmap("s1")
        from heutagogy.skill_graph import get_skill_graph

        self.assertEqual(len(rm["items"]), len(get_skill_graph().all_topics()))

    def test_fresh_learner_next_topic_is_a_root(self) -> None:
        rm = LearningRoadmapService().build_roadmap("s1")
        from heutagogy.skill_graph import get_skill_graph

        self.assertIn(rm["next_topic"], get_skill_graph().roots())

    def test_mastering_topic_marks_it_mastered_and_unlocks_child(self) -> None:
        self._master("s1", "huffman", 95)
        items = {it["topic"]: it for it in LearningRoadmapService().build_roadmap("s1")["items"]}
        self.assertEqual(items["huffman"]["status"], "mastered")
        self.assertEqual(items["lz77"]["status"], "available")  # unlocked by huffman

    def test_items_sorted_finish_start_locked_done(self) -> None:
        self._master("s1", "huffman", 95)
        statuses = [it["status"] for it in LearningRoadmapService().build_roadmap("s1")["items"]]
        rank = {"in_progress": 0, "available": 1, "locked": 2, "mastered": 3}
        ranks = [rank[s] for s in statuses]
        self.assertEqual(ranks, sorted(ranks))


class ResumeServiceTest(_IsolatedStoresTest):
    def test_fresh_learner_has_no_last_but_a_next(self) -> None:
        rp = ResumeLearningService().resume_point("s1")
        self.assertIsNone(rp["last_topic"])
        self.assertIsNotNone(rp["next_topic"])

    def test_last_activity_is_surfaced(self) -> None:
        self.profile_store.record_explanation("s1", "Huffman", "beginner")
        rp = ResumeLearningService().resume_point("s1")
        self.assertEqual(rp["last_topic"], "huffman")
        self.assertIn("explanation", rp["last_action"])

    def test_checkpoint_round_trip(self) -> None:
        svc = ResumeLearningService()
        svc.record_checkpoint("s1", "huffman", position=7)
        self.profile_store.record_explanation("s1", "Huffman", "beginner")
        rp = svc.resume_point("s1")
        self.assertIsNotNone(rp["checkpoint"])
        self.assertEqual(rp["checkpoint"]["position"], 7)

    def test_next_topic_advances_after_mastery(self) -> None:
        self._master("s1", "huffman", 95)
        rp = ResumeLearningService().resume_point("s1")
        self.assertNotEqual(rp["next_topic"], "huffman")  # already mastered


class AnalyticsServiceTest(_IsolatedStoresTest):
    def test_empty_summary_is_all_zero(self) -> None:
        s = ProgressAnalytics().summary("s1")
        self.assertEqual(s["topics_mastered"], 0)
        self.assertEqual(s["overall_mastery"], 0)
        self.assertEqual(s["study_streak_days"], 0)
        self.assertEqual(s["weak_concepts"], [])

    def test_mastery_raises_counts_and_overall(self) -> None:
        self._master("s1", "huffman", 95)
        s = ProgressAnalytics().summary("s1")
        self.assertEqual(s["topics_mastered"], 1)
        self.assertGreater(s["overall_mastery"], 0)

    def test_weak_concept_surfaces(self) -> None:
        self._master("s1", "huffman", 40)  # below threshold
        s = ProgressAnalytics().summary("s1")
        self.assertTrue(any(w["topic"] == "huffman" for w in s["weak_concepts"]))
        self.assertLess(s["weak_concepts"][0]["mastery"], MASTERY_THRESHOLD)

    def test_streak_counts_single_active_day(self) -> None:
        self.profile_store.record_explanation("s1", "Huffman", "beginner")
        self.assertEqual(ProgressAnalytics().summary("s1")["study_streak_days"], 1)

    def test_category_breakdown_totals_match_graph(self) -> None:
        s = ProgressAnalytics().summary("s1")
        total = sum(b["total"] for b in s["category_breakdown"])
        self.assertEqual(total, s["topics_total"])


if __name__ == "__main__":
    unittest.main()
