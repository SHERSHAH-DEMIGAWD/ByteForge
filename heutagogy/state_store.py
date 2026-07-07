"""
heutagogy.state_store — the one new persistence file for Layer 2 (Heutagogy).

Layer 1 owns ``learner_profiles.json`` (the *evidence*: what was explained and
how it scored). Layer 2 never writes there. Instead, this module owns a separate
``learning_state.json`` for the small amount of state Layer 1 does not track —
state that is **authored by the learner** or is genuinely new bookkeeping:

    * ``goals``       — learner-authored learning goals (definitions only;
                        progress is derived from mastery at read time).
    * ``streak``      — study-streak day-boundary bookkeeping.
    * ``preferences`` — e.g. preferred difficulty.
    * ``checkpoints`` — explicit "save my place" markers per topic.

Everything else Layer 2 shows (mastery, confidence, completion estimates, weak
concepts) is *derived on read* from Layer 1's profile and is deliberately **not**
stored here, so the two files can never drift out of sync.

Design constraints — identical to ``ai.learner_context.LearnerContextStore``
---------------------------------------------------------------------------
* **No database.** A single JSON file whose directory/file are created on first
  use, in the same ``ai_data/`` directory Layer 1 uses (overridable with the
  ``AI_DATA_DIR`` environment variable). The file is intended to be gitignored.
* **Thread-safe.** Every read-modify-write goes through a re-entrant lock and
  each save is atomic (write-to-temp then ``os.replace``) so a crash mid-write
  cannot leave a torn file.
* **Provider-agnostic.** This module knows nothing about LLMs.
"""

from __future__ import annotations

import json
import os
import tempfile
import threading
import time
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Storage schema version + on-disk layout
# ---------------------------------------------------------------------------
# Bump when the persisted shape changes so a future migration can detect old
# files. The store tolerates a missing/older version by rebuilding an empty root.
# Versioned independently of Layer 1's SCHEMA_VERSION.
SCHEMA_VERSION = 1

# The default preferred difficulty for a brand-new learner. Kept here so the
# store is self-contained; the goal/roadmap services read it back.
DEFAULT_PREFERRED_DIFFICULTY = "beginner"


# ---------------------------------------------------------------------------
# Time source (isolated so it is easy to reason about / stub in tests)
# ---------------------------------------------------------------------------

def _now() -> float:
    """Current epoch seconds. Wrapped in one place for clarity and testability."""
    return time.time()


# ---------------------------------------------------------------------------
# Where the state file lives (same directory rules as Layer 1)
# ---------------------------------------------------------------------------

def _default_data_dir() -> Path:
    """Resolve the data directory.

    ``AI_DATA_DIR`` wins when set; otherwise use ``<project-root>/ai_data``. The
    project root is inferred as the parent of this ``heutagogy`` package so the
    location is stable regardless of the process's current working directory —
    and identical to where Layer 1 stores its profiles.
    """
    override = os.environ.get("AI_DATA_DIR")
    if override:
        return Path(override).expanduser()
    project_root = Path(__file__).resolve().parent.parent
    return project_root / "ai_data"


# ---------------------------------------------------------------------------
# The store
# ---------------------------------------------------------------------------

class LearningStateStore:
    """A thread-safe, JSON-backed collection of per-session Layer 2 state.

    A *state* record is a plain dict (JSON-friendly) with this shape::

        {
          "session_id": str,
          "created_at": float,          # epoch seconds
          "updated_at": float,
          "goals":       [ {"id": str, "title": str, "topics": [str], "category": str|None,
                             "target_mastery": int, "deadline": str|None,
                             "status": "active"|"completed"|"archived", "created_at": float} ],
          "streak":      {"current_days": int, "longest_days": int, "last_active_date": str|None},
          "preferences": {"preferred_difficulty": str},
          "checkpoints": { topic: {"position": Any|None, "ts": float} }
        }

    All public methods are safe to call from multiple threads. Each mutating call
    loads the whole file, updates it, and writes it back atomically under the
    lock — the same simple, correct approach Layer 1 uses. The file is tiny (a
    handful of sessions), so this is more than sufficient; it can be swapped for
    per-session files if it ever grows.
    """

    def __init__(self, path: Optional[Path] = None) -> None:
        self._path = Path(path) if path is not None else _default_data_dir() / "learning_state.json"
        # Re-entrant so a public method can call another without deadlocking.
        self._lock = threading.RLock()
        self._ensure_file()

    # -- persistence helpers ------------------------------------------------

    def _ensure_file(self) -> None:
        """Create the data directory and an empty root document if missing."""
        with self._lock:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            if not self._path.exists():
                self._write_root({"version": SCHEMA_VERSION, "sessions": {}})

    def _read_root(self) -> Dict[str, Any]:
        """Load the root document, healing a missing/corrupt/old file to empty."""
        try:
            with self._path.open("r", encoding="utf-8") as fh:
                root = json.load(fh)
        except (FileNotFoundError, json.JSONDecodeError):
            root = {"version": SCHEMA_VERSION, "sessions": {}}

        # Defensive normalization: guarantee the keys callers rely on exist.
        if not isinstance(root, dict) or root.get("version") != SCHEMA_VERSION:
            root = {
                "version": SCHEMA_VERSION,
                "sessions": root.get("sessions", {}) if isinstance(root, dict) else {},
            }
        root.setdefault("sessions", {})
        return root

    def _write_root(self, root: Dict[str, Any]) -> None:
        """Atomically persist the root document (temp file + ``os.replace``)."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        # Write to a temp file in the same directory so os.replace is atomic on
        # the same filesystem, then swap it into place.
        fd, tmp_name = tempfile.mkstemp(dir=str(self._path.parent), suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                json.dump(root, fh, indent=2, sort_keys=True)
            os.replace(tmp_name, self._path)
        except BaseException:
            # Clean up the temp file on any failure so we don't litter the dir.
            try:
                os.unlink(tmp_name)
            except OSError:
                pass
            raise

    @staticmethod
    def _new_state(session_id: str) -> Dict[str, Any]:
        ts = _now()
        return {
            "session_id": session_id,
            "created_at": ts,
            "updated_at": ts,
            "goals": [],
            "streak": {"current_days": 0, "longest_days": 0, "last_active_date": None},
            "preferences": {"preferred_difficulty": DEFAULT_PREFERRED_DIFFICULTY},
            "checkpoints": {},
        }

    # -- public API ---------------------------------------------------------

    def get_state(self, session_id: str) -> Dict[str, Any]:
        """Return a copy of the Layer 2 state for ``session_id``, creating it if new.

        A copy is returned so callers can't mutate on-disk state by accident; use
        the mutating methods below (or :meth:`update_state`) to persist changes.
        """
        session_id = _clean_session_id(session_id)
        with self._lock:
            root = self._read_root()
            state = root["sessions"].get(session_id)
            if state is None:
                state = self._new_state(session_id)
                root["sessions"][session_id] = state
                self._write_root(root)
            # json round-trip = cheap deep copy of plain data.
            return json.loads(json.dumps(state))

    def update_state(self, session_id: str, mutate) -> Dict[str, Any]:
        """Apply ``mutate(state)`` under the lock and persist atomically.

        ``mutate`` receives the live state dict and edits it in place (it may also
        return a replacement dict). This is the single write primitive the higher
        Layer 2 services (goals, streak, preferences, checkpoints) build on, so
        the read-modify-write happens exactly once and stays consistent. Returns
        the updated state (a copy).
        """
        session_id = _clean_session_id(session_id)
        with self._lock:
            root = self._read_root()
            state = root["sessions"].setdefault(session_id, self._new_state(session_id))
            result = mutate(state)
            if isinstance(result, dict):
                state = result
            state["session_id"] = session_id
            state["updated_at"] = _now()
            root["sessions"][session_id] = state
            self._write_root(root)
            return json.loads(json.dumps(state))

    def reset(self, session_id: str) -> None:
        """Delete a single session's Layer 2 state (tests / a future reset UI)."""
        session_id = _clean_session_id(session_id)
        with self._lock:
            root = self._read_root()
            if session_id in root["sessions"]:
                del root["sessions"][session_id]
                self._write_root(root)

    def all_session_ids(self) -> List[str]:
        """Return the session ids that currently have Layer 2 state (diagnostics)."""
        with self._lock:
            return list(self._read_root()["sessions"].keys())

    @property
    def path(self) -> Path:
        """The JSON file backing this store (exposed for diagnostics/health)."""
        return self._path


# ---------------------------------------------------------------------------
# Small normalization helper (shared, side-effect free)
# ---------------------------------------------------------------------------

def _clean_session_id(session_id: str) -> str:
    """Fall back to a shared 'anonymous' bucket for empty/whitespace ids.

    Mirrors Layer 1 so a session keyed 'anonymous' there maps to the same bucket
    here. Endpoints mint a real id when a client doesn't supply one; this is just
    a last line of defence so the store never keys on an empty string.
    """
    cleaned = (session_id or "").strip()
    return cleaned or "anonymous"


# ---------------------------------------------------------------------------
# Process-wide accessor (one store per process, like ai.learner_context.get_store)
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def get_learning_store() -> LearningStateStore:
    """Return the process-wide Layer 2 learning-state store.

    Cached so the data directory/file is resolved and created once. Tests that
    need isolation can construct :class:`LearningStateStore` with an explicit
    ``path`` instead of going through this accessor.
    """
    return LearningStateStore()
