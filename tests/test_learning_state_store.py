"""
Unit tests for heutagogy.state_store.LearningStateStore (Layer 2, M0).

Pure-stdlib (``unittest``) so they run with no third-party dependencies, matching
the repository's zero-dependency default. Each test uses an isolated temp file
via the explicit ``path`` constructor argument, so nothing touches the real
``ai_data/`` directory.

Run: ``python -m unittest tests.test_learning_state_store``
"""

from __future__ import annotations

import json
import tempfile
import threading
import unittest
from pathlib import Path

from heutagogy.state_store import (
    DEFAULT_PREFERRED_DIFFICULTY,
    SCHEMA_VERSION,
    LearningStateStore,
)


class LearningStateStoreTest(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.path = Path(self._tmp.name) / "learning_state.json"
        self.store = LearningStateStore(path=self.path)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    # -- creation / defaults ------------------------------------------------

    def test_file_created_with_empty_root(self) -> None:
        self.assertTrue(self.path.exists())
        root = json.loads(self.path.read_text(encoding="utf-8"))
        self.assertEqual(root["version"], SCHEMA_VERSION)
        self.assertEqual(root["sessions"], {})

    def test_get_state_creates_default_shape(self) -> None:
        state = self.store.get_state("sess-1")
        self.assertEqual(state["session_id"], "sess-1")
        self.assertEqual(state["goals"], [])
        self.assertEqual(state["checkpoints"], {})
        self.assertEqual(
            state["preferences"]["preferred_difficulty"], DEFAULT_PREFERRED_DIFFICULTY
        )
        self.assertEqual(state["streak"]["current_days"], 0)
        self.assertIsNone(state["streak"]["last_active_date"])

    def test_get_state_returns_a_copy(self) -> None:
        # Mutating the returned dict must not affect on-disk state.
        state = self.store.get_state("sess-1")
        state["goals"].append({"id": "x"})
        reloaded = self.store.get_state("sess-1")
        self.assertEqual(reloaded["goals"], [])

    def test_empty_session_id_falls_back_to_anonymous(self) -> None:
        state = self.store.get_state("   ")
        self.assertEqual(state["session_id"], "anonymous")

    # -- update primitive ---------------------------------------------------

    def test_update_state_persists(self) -> None:
        def add_goal(state):
            state["goals"].append(
                {"id": "g1", "title": "Master graphs", "topics": ["dijkstra"]}
            )

        self.store.update_state("sess-1", add_goal)
        reloaded = self.store.get_state("sess-1")
        self.assertEqual(len(reloaded["goals"]), 1)
        self.assertEqual(reloaded["goals"][0]["title"], "Master graphs")

    def test_update_state_bumps_updated_at(self) -> None:
        before = self.store.get_state("sess-1")["updated_at"]
        after = self.store.update_state("sess-1", lambda s: s)["updated_at"]
        self.assertGreaterEqual(after, before)

    def test_update_state_accepts_replacement_dict(self) -> None:
        def replace(state):
            new = dict(state)
            new["preferences"] = {"preferred_difficulty": "advanced"}
            return new

        result = self.store.update_state("sess-1", replace)
        self.assertEqual(result["preferences"]["preferred_difficulty"], "advanced")
        # session_id is re-stamped so a replacement can't orphan the record.
        self.assertEqual(result["session_id"], "sess-1")

    # -- reset / isolation --------------------------------------------------

    def test_reset_removes_only_target_session(self) -> None:
        self.store.get_state("sess-1")
        self.store.get_state("sess-2")
        self.store.reset("sess-1")
        self.assertNotIn("sess-1", self.store.all_session_ids())
        self.assertIn("sess-2", self.store.all_session_ids())

    def test_sessions_are_independent(self) -> None:
        self.store.update_state(
            "sess-1", lambda s: s["goals"].append({"id": "g1"})
        )
        self.assertEqual(self.store.get_state("sess-2")["goals"], [])

    # -- corruption healing -------------------------------------------------

    def test_corrupt_file_heals_to_empty_root(self) -> None:
        self.path.write_text("{ not valid json", encoding="utf-8")
        # A read-through must not raise; it rebuilds an empty root.
        state = self.store.get_state("sess-1")
        self.assertEqual(state["goals"], [])

    def test_old_version_is_reset(self) -> None:
        self.path.write_text(
            json.dumps({"version": 0, "sessions": {"legacy": {}}}), encoding="utf-8"
        )
        # A mismatched schema version drops to an empty (but structurally valid) root.
        state = self.store.get_state("sess-new")
        self.assertEqual(state["session_id"], "sess-new")

    # -- atomicity / concurrency -------------------------------------------

    def test_no_temp_files_left_behind(self) -> None:
        for i in range(5):
            self.store.update_state(f"sess-{i}", lambda s: s)
        leftovers = list(self.path.parent.glob("*.tmp"))
        self.assertEqual(leftovers, [])

    def test_concurrent_updates_are_serialized(self) -> None:
        # Many threads each append one goal to the same session; the lock must
        # ensure no update is lost to a read-modify-write race.
        n = 40

        def worker(idx: int) -> None:
            self.store.update_state(
                "sess-hot", lambda s: s["goals"].append({"id": f"g{idx}"})
            )

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(n)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        final = self.store.get_state("sess-hot")
        self.assertEqual(len(final["goals"]), n)


if __name__ == "__main__":
    unittest.main()
