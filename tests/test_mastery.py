"""
Unit tests for heutagogy.mastery (Layer 2, M2).

Pure-stdlib ``unittest``. The calculator is a set of pure functions over a Layer 1
profile dict, so tests just build synthetic profiles and assert the derived
mastery/confidence — no store, no I/O. Golden cases from the review (§2.3):
no attempts, explained-only, one high score → modest confidence, repeated stable
highs → high confidence, declining scores → lower stability.

Run: ``python -m unittest tests.test_mastery``
"""

from __future__ import annotations

import unittest

from ai.learner_context import MASTERY_THRESHOLD
from heutagogy import mastery as m


def _profile(explained=None, assessments=None, events=None):
    """Assemble a minimal Layer 1-shaped profile from parts."""
    return {
        "explained": explained or {},
        "assessments": assessments or {},
        "events": events or [],
    }


def _assess_events(topic, scores):
    return [{"type": "assess", "topic": topic, "score": s, "ts": 1000 + i} for i, s in enumerate(scores)]


class MasteryForTest(unittest.TestCase):
    def test_no_activity_is_zero(self) -> None:
        rec = m.mastery_for(_profile(), "huffman")
        self.assertEqual(rec["mastery"], 0)
        self.assertEqual(rec["confidence"], 0.0)
        self.assertEqual(rec["attempts"], 0)

    def test_explained_only_is_familiarity_floor_never_mastered(self) -> None:
        rec = m.mastery_for(_profile(explained={"huffman": {"count": 3}}), "huffman")
        self.assertGreater(rec["mastery"], 0)
        self.assertLess(rec["mastery"], MASTERY_THRESHOLD)  # reading never masters
        self.assertLessEqual(rec["confidence"], 0.15)
        self.assertEqual(rec["attempts"], 0)

    def test_one_high_score_gives_high_mastery_modest_confidence(self) -> None:
        prof = _profile(
            assessments={"huffman": {"attempts": 1, "best_score": 92, "last_score": 92}},
            events=_assess_events("huffman", [92]),
        )
        rec = m.mastery_for(prof, "huffman")
        self.assertGreaterEqual(rec["mastery"], MASTERY_THRESHOLD)
        # A single attempt can't be fully trusted (could be luck).
        self.assertLess(rec["confidence"], 0.6)

    def test_repeated_stable_highs_give_high_confidence(self) -> None:
        prof = _profile(
            assessments={"huffman": {"attempts": 3, "best_score": 92, "last_score": 90}},
            events=_assess_events("huffman", [90, 92, 90]),
        )
        rec = m.mastery_for(prof, "huffman")
        self.assertGreaterEqual(rec["mastery"], MASTERY_THRESHOLD)
        self.assertGreater(rec["confidence"], 0.8)

    def test_declining_scores_lower_stability(self) -> None:
        stable = m.mastery_for(
            _profile(
                assessments={"t": {"attempts": 2, "best_score": 90, "last_score": 90}},
                events=_assess_events("t", [90, 90]),
            ),
            "t",
        )
        volatile = m.mastery_for(
            _profile(
                assessments={"t": {"attempts": 2, "best_score": 95, "last_score": 55}},
                events=_assess_events("t", [95, 55]),
            ),
            "t",
        )
        self.assertGreater(stable["confidence"], volatile["confidence"])

    def test_best_score_dominates_recent(self) -> None:
        rec = m.mastery_for(
            _profile(
                assessments={"t": {"attempts": 2, "best_score": 100, "last_score": 40}},
                events=_assess_events("t", [100, 40]),
            ),
            "t",
        )
        # 0.7*100 + 0.3*40 = 82 → still mastered despite a poor recent attempt.
        self.assertGreaterEqual(rec["mastery"], MASTERY_THRESHOLD)

    def test_reason_is_present(self) -> None:
        self.assertIn("reason", m.mastery_for(_profile(), "x"))


class MapsAndWeakConceptsTest(unittest.TestCase):
    def test_mastery_map_includes_only_evidence_topics(self) -> None:
        prof = _profile(
            explained={"mergesort": {"count": 1}},
            assessments={"huffman": {"attempts": 1, "best_score": 80, "last_score": 80}},
        )
        mmap = m.mastery_map(prof)
        self.assertEqual(set(mmap), {"mergesort", "huffman"})
        self.assertNotIn("dijkstra", mmap)  # no evidence → absent

    def test_detail_map_carries_confidence(self) -> None:
        prof = _profile(assessments={"huffman": {"attempts": 1, "best_score": 80, "last_score": 80}})
        details = m.detail_map(prof)
        self.assertIn("confidence", details["huffman"])

    def test_weak_concepts_are_below_threshold_and_sorted(self) -> None:
        prof = _profile(
            assessments={
                "a": {"attempts": 1, "best_score": 50, "last_score": 50},
                "b": {"attempts": 1, "best_score": 30, "last_score": 30},
                "c": {"attempts": 1, "best_score": 95, "last_score": 95},  # mastered → excluded
            },
            events=_assess_events("a", [50]) + _assess_events("b", [30]) + _assess_events("c", [95]),
        )
        weak = m.weak_concepts(prof, k=5)
        topics = [w["topic"] for w in weak]
        self.assertEqual(topics, ["b", "a"])  # weakest first, mastered 'c' excluded

    def test_weak_concepts_respects_k(self) -> None:
        prof = _profile(
            assessments={t: {"attempts": 1, "best_score": 10 * i, "last_score": 10 * i} for i, t in enumerate("abcd", 1)},
        )
        self.assertLessEqual(len(m.weak_concepts(prof, k=2)), 2)

    def test_explained_only_topic_is_not_weak(self) -> None:
        # Merely read (not assessed) → "unstarted", not "weak".
        prof = _profile(explained={"huffman": {"count": 1}})
        self.assertEqual(m.weak_concepts(prof), [])


if __name__ == "__main__":
    unittest.main()
