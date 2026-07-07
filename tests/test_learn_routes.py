"""
Route tests for the /learn/* API (Layer 2, M4) using FastAPI's TestClient.

Unlike the other Layer 2 suites (pure stdlib), these need ``fastapi`` + ``httpx``
installed to boot the app. To preserve the repository's zero-dependency default,
the whole module **skips cleanly** when those aren't present, so
``python -m unittest discover`` stays green on a bare interpreter.

Stores are isolated per-test via a temp ``AI_DATA_DIR`` (+ cache clear), and
evidence is seeded through the real ``/ai/*`` endpoints — so these double as a
light integration check that Layer 2 reads what Layer 1 writes.

Run: ``python -m unittest tests.test_learn_routes``
"""

from __future__ import annotations

import os
import tempfile
import unittest

try:
    from fastapi.testclient import TestClient  # noqa: F401

    _HAVE_FASTAPI = True
except Exception:  # pragma: no cover - env without API deps
    _HAVE_FASTAPI = False


@unittest.skipUnless(_HAVE_FASTAPI, "fastapi/httpx not installed (API-optional deps)")
class LearnRoutesTest(unittest.TestCase):
    def setUp(self) -> None:
        import ai.learner_context as lc
        import heutagogy.state_store as ss

        self._tmp = tempfile.TemporaryDirectory()
        self._prev = os.environ.get("AI_DATA_DIR")
        os.environ["AI_DATA_DIR"] = self._tmp.name
        lc.get_store.cache_clear()
        ss.get_learning_store.cache_clear()

        from fastapi.testclient import TestClient
        from api import app

        self.client = TestClient(app)
        self.sid = "route-test"

    def tearDown(self) -> None:
        import ai.learner_context as lc
        import heutagogy.state_store as ss

        if self._prev is None:
            os.environ.pop("AI_DATA_DIR", None)
        else:
            os.environ["AI_DATA_DIR"] = self._prev
        lc.get_store.cache_clear()
        ss.get_learning_store.cache_clear()
        self._tmp.cleanup()

    # -- helpers ------------------------------------------------------------

    def _seed_explain(self, topic: str) -> None:
        r = self.client.post("/ai/explain", json={"topic": topic, "session_id": self.sid})
        self.assertEqual(r.status_code, 200)

    def _seed_assess(self, topic: str, answer: str) -> None:
        r = self.client.post("/ai/assess", json={"topic": topic, "answer": answer, "session_id": self.sid})
        self.assertEqual(r.status_code, 200)

    # -- health / surface ---------------------------------------------------

    def test_health(self) -> None:
        body = self.client.get("/learn/health").json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["layer1_version"], "1.0.0")

    def test_all_routes_return_200(self) -> None:
        for path in (
            f"/learn/roadmap?session_id={self.sid}",
            f"/learn/skill-graph?session_id={self.sid}",
            f"/learn/mastery?session_id={self.sid}",
            f"/learn/progress?session_id={self.sid}",
            f"/learn/resume?session_id={self.sid}",
            f"/learn/recommendations?session_id={self.sid}",
        ):
            self.assertEqual(self.client.get(path).status_code, 200, msg=path)

    # -- session mint/echo --------------------------------------------------

    def test_session_is_minted_and_echoed_when_absent(self) -> None:
        body = self.client.get("/learn/roadmap").json()
        self.assertTrue(body["session_id"].startswith("sess-"))

    def test_session_is_echoed_when_supplied(self) -> None:
        body = self.client.get(f"/learn/roadmap?session_id={self.sid}").json()
        self.assertEqual(body["session_id"], self.sid)

    # -- derived behavior end-to-end ---------------------------------------

    def test_skill_graph_annotates_status(self) -> None:
        body = self.client.get(f"/learn/skill-graph?session_id={self.sid}").json()
        self.assertTrue(all("status" in n and "mastery" in n for n in body["nodes"]))

    def test_explaining_marks_topic_in_progress(self) -> None:
        self._seed_explain("Huffman")
        nodes = {n["topic"]: n for n in self.client.get(f"/learn/skill-graph?session_id={self.sid}").json()["nodes"]}
        self.assertEqual(nodes["huffman"]["status"], "in_progress")

    def test_resume_reflects_last_activity(self) -> None:
        self._seed_explain("Merge Sort")
        rp = self.client.get(f"/learn/resume?session_id={self.sid}").json()
        self.assertEqual(rp["last_topic"], "mergesort")
        self.assertIsNotNone(rp["next_topic"])

    def test_checkpoint_post_persists(self) -> None:
        r = self.client.post("/learn/resume", json={"session_id": self.sid, "topic": "Huffman", "position": 5})
        self.assertTrue(r.json()["saved"])
        self.assertEqual(r.json()["checkpoint"]["position"], 5)

    def test_recommendations_are_enriched(self) -> None:
        self._seed_assess("Huffman", "wrong")  # low score → becomes a review rec
        recs = self.client.get(f"/learn/recommendations?session_id={self.sid}&limit=5").json()["recommendations"]
        self.assertTrue(recs)
        # Enrichment fields present on every item.
        for rec in recs:
            self.assertIn("status", rec)
            self.assertIn("mastery", rec)

    def test_recommendations_matches_ai_recommend_base(self) -> None:
        # The enriched list should cover the same base topics /ai/recommend returns.
        self._seed_assess("Huffman", "wrong")
        base = self.client.post("/ai/recommend", json={"session_id": self.sid, "limit": 5}).json()["recommendations"]
        enriched = self.client.get(f"/learn/recommendations?session_id={self.sid}&limit=5").json()["recommendations"]
        from ai.learner_context import normalize_topic

        base_keys = {normalize_topic(r["topic"]) for r in base}
        enriched_keys = {r["topic"] for r in enriched}
        self.assertEqual(base_keys, enriched_keys)


if __name__ == "__main__":
    unittest.main()
