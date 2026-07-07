"""
ai.learner_context — session-aware, file-persisted learner profiles (Layer 1).

This is the small piece of state that the AI features read and write. Layers 2–4
(adaptive difficulty, spaced review, path planning) build on top of it, but Layer
1 keeps it deliberately minimal: it records *what a learner has explored and how
they scored* so the ``/ai/recommend`` endpoint can make a transparent, rule-based
suggestion.

Design constraints (matching the rest of the repository)
--------------------------------------------------------
* **No database.** State persists to a single JSON file whose directory and file
  are created automatically on first use. The location defaults to ``ai_data/``
  in the project root and is overridable with the ``AI_DATA_DIR`` environment
  variable. The file is intended to be gitignored.
* **Thread-safe.** FastAPI/uvicorn can serve requests concurrently, so every
  read-modify-write goes through a re-entrant lock and each save is atomic
  (write-to-temp then ``os.replace``) to avoid a torn file if the process dies
  mid-write.
* **Provider-agnostic.** This module knows nothing about LLMs. It only stores the
  outcomes the endpoints hand it, which keeps the provider abstraction intact.
"""

from __future__ import annotations

import json
import os
import tempfile
import threading
import time
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Storage schema version + on-disk layout
# ---------------------------------------------------------------------------
# Bump when the persisted shape changes so a future migration can detect old
# files. The store tolerates a missing/older version by rebuilding an empty root.
SCHEMA_VERSION = 1

# Cap the per-session event log so a long-lived session can't grow the file
# without bound. Older events are dropped; aggregate counters are unaffected.
_MAX_EVENTS_PER_SESSION = 50

# A score at or above this is treated as "solid" for recommendation purposes;
# below it, a topic is surfaced for review. This is a plain, explainable
# threshold — Layer 2 can replace it with an adaptive model.
_MASTERY_THRESHOLD = 70


# A curated catalogue of DAA topics used to suggest *unexplored* material. It is
# intentionally broader than the offline provider's explainable knowledge base
# (which only needs the topics it can template) because a recommendation can
# point a learner at any part of the platform. Kept here so this module stays
# self-contained and never reaches into the provider's internals.
DEFAULT_TOPIC_CATALOG: List[str] = [
    "huffman",
    "lz77",
    "lzw",
    "dijkstra",
    "bellman-ford",
    "mergesort",
    "quicksort",
    "heapsort",
    "kruskal",
    "prim",
    "knapsack",
    "floyd-warshall",
    "topological-sort",
    "string-matching",
]


# ---------------------------------------------------------------------------
# Time source (isolated so it is easy to reason about / stub in tests)
# ---------------------------------------------------------------------------

def _now() -> float:
    """Current epoch seconds. Wrapped in one place for clarity and testability."""
    return time.time()


# ---------------------------------------------------------------------------
# Where the profile file lives
# ---------------------------------------------------------------------------

def _default_data_dir() -> Path:
    """Resolve the data directory.

    ``AI_DATA_DIR`` wins when set; otherwise use ``<project-root>/ai_data``. The
    project root is inferred as the parent of this ``ai`` package so the location
    is stable regardless of the process's current working directory.
    """
    override = os.environ.get("AI_DATA_DIR")
    if override:
        return Path(override).expanduser()
    project_root = Path(__file__).resolve().parent.parent
    return project_root / "ai_data"


# ---------------------------------------------------------------------------
# Recommendation result (typed for a clean endpoint contract)
# ---------------------------------------------------------------------------

@dataclass
class Recommendation:
    """A single, explainable suggestion for what to study next."""

    topic: str
    #: "review" (previously scored below mastery) or "explore" (not yet seen).
    kind: str
    #: Human-readable justification the frontend can show verbatim.
    reason: str

    def as_dict(self) -> Dict[str, str]:
        return {"topic": self.topic, "kind": self.kind, "reason": self.reason}


# ---------------------------------------------------------------------------
# The store
# ---------------------------------------------------------------------------

class LearnerContextStore:
    """A thread-safe, JSON-backed collection of per-session learner profiles.

    A *profile* is a plain dict (JSON-friendly) with this shape::

        {
          "session_id": str,
          "created_at": float,          # epoch seconds
          "updated_at": float,
          "explained":   {topic: {"count": int, "last_level": str, "last_ts": float}},
          "assessments": {topic: {"attempts": int, "last_score": int|None,
                                   "best_score": int|None, "last_ts": float}},
          "events": [ {"type": str, "topic": str, "ts": float, ...}, ... ]  # capped
        }

    All public methods are safe to call from multiple threads. Each mutating call
    loads the whole file, updates it, and writes it back atomically under the
    lock. The file is tiny (a handful of sessions), so this is simple and correct;
    it can be swapped for per-session files if it ever grows.
    """

    def __init__(self, path: Optional[Path] = None) -> None:
        self._path = Path(path) if path is not None else _default_data_dir() / "learner_profiles.json"
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
            root = {"version": SCHEMA_VERSION, "sessions": root.get("sessions", {}) if isinstance(root, dict) else {}}
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
    def _new_profile(session_id: str) -> Dict[str, Any]:
        ts = _now()
        return {
            "session_id": session_id,
            "created_at": ts,
            "updated_at": ts,
            "explained": {},
            "assessments": {},
            "events": [],
        }

    def _append_event(self, profile: Dict[str, Any], event: Dict[str, Any]) -> None:
        events: List[Dict[str, Any]] = profile.setdefault("events", [])
        events.append(event)
        if len(events) > _MAX_EVENTS_PER_SESSION:
            # Keep only the most recent events.
            del events[: len(events) - _MAX_EVENTS_PER_SESSION]

    # -- public API ---------------------------------------------------------

    def get_profile(self, session_id: str) -> Dict[str, Any]:
        """Return a copy of the profile for ``session_id``, creating it if new.

        A copy is returned so callers can't mutate on-disk state by accident;
        use the ``record_*`` methods to persist changes.
        """
        session_id = _clean_session_id(session_id)
        with self._lock:
            root = self._read_root()
            profile = root["sessions"].get(session_id)
            if profile is None:
                profile = self._new_profile(session_id)
                root["sessions"][session_id] = profile
                self._write_root(root)
            # json round-trip = cheap deep copy of plain data.
            return json.loads(json.dumps(profile))

    def record_explanation(self, session_id: str, topic: str, level: str) -> Dict[str, Any]:
        """Record that the learner requested an explanation of ``topic``.

        Returns the updated profile (a copy).
        """
        session_id = _clean_session_id(session_id)
        topic_key = _normalize_topic(topic)
        with self._lock:
            root = self._read_root()
            profile = root["sessions"].setdefault(session_id, self._new_profile(session_id))

            entry = profile["explained"].setdefault(
                topic_key, {"count": 0, "last_level": level, "last_ts": 0.0}
            )
            entry["count"] += 1
            entry["last_level"] = level
            entry["last_ts"] = _now()

            self._append_event(profile, {"type": "explain", "topic": topic_key, "level": level, "ts": _now()})
            profile["updated_at"] = _now()

            root["sessions"][session_id] = profile
            self._write_root(root)
            return json.loads(json.dumps(profile))

    def record_assessment(
        self, session_id: str, topic: str, score: Optional[int]
    ) -> Dict[str, Any]:
        """Record an assessment attempt for ``topic``.

        ``score`` is an integer 0–100 when one is available (the offline provider
        emits a coverage score; a live provider may not), or ``None`` when the
        attempt was recorded without a numeric score. Returns the updated profile.
        """
        session_id = _clean_session_id(session_id)
        topic_key = _normalize_topic(topic)
        clean_score = _clamp_score(score)
        with self._lock:
            root = self._read_root()
            profile = root["sessions"].setdefault(session_id, self._new_profile(session_id))

            entry = profile["assessments"].setdefault(
                topic_key, {"attempts": 0, "last_score": None, "best_score": None, "last_ts": 0.0}
            )
            entry["attempts"] += 1
            entry["last_score"] = clean_score
            if clean_score is not None:
                prev_best = entry.get("best_score")
                entry["best_score"] = clean_score if prev_best is None else max(prev_best, clean_score)
            entry["last_ts"] = _now()

            self._append_event(profile, {"type": "assess", "topic": topic_key, "score": clean_score, "ts": _now()})
            profile["updated_at"] = _now()

            root["sessions"][session_id] = profile
            self._write_root(root)
            return json.loads(json.dumps(profile))

    def recommend(self, session_id: str, limit: int = 3) -> List[Dict[str, str]]:
        """Return up to ``limit`` transparent study recommendations.

        The rule is deliberately simple and explainable (Layer 1):

        1. **Review** any assessed topic whose best score is below the mastery
           threshold, weakest first.
        2. **Explore** catalogue topics the learner has neither explained nor
           been assessed on, in catalogue order.

        Layer 2 will replace this heuristic with an adaptive model; the endpoint
        contract (a list of ``{topic, kind, reason}``) stays the same.
        """
        limit = max(0, int(limit))
        profile = self.get_profile(session_id)
        recs: List[Recommendation] = []

        # 1. Weak topics to review.
        assessments: Dict[str, Any] = profile.get("assessments", {})
        weak = [
            (topic, data.get("best_score"))
            for topic, data in assessments.items()
            if isinstance(data.get("best_score"), int) and data["best_score"] < _MASTERY_THRESHOLD
        ]
        weak.sort(key=lambda pair: pair[1])  # weakest score first
        for topic, best in weak:
            recs.append(
                Recommendation(
                    topic=topic,
                    kind="review",
                    reason=f"Your best score here is {best}% (below {_MASTERY_THRESHOLD}%). A quick review would help.",
                )
            )

        # 2. Unexplored catalogue topics.
        seen = set(profile.get("explained", {})) | set(assessments)
        for topic in DEFAULT_TOPIC_CATALOG:
            if topic not in seen:
                recs.append(
                    Recommendation(
                        topic=topic,
                        kind="explore",
                        reason="You haven't explored this topic yet — a good next step.",
                    )
                )

        return [rec.as_dict() for rec in recs[:limit]]

    def reset(self, session_id: str) -> None:
        """Delete a single session's profile (used by tests / a future reset UI)."""
        session_id = _clean_session_id(session_id)
        with self._lock:
            root = self._read_root()
            if session_id in root["sessions"]:
                del root["sessions"][session_id]
                self._write_root(root)

    @property
    def path(self) -> Path:
        """The JSON file backing this store (exposed for diagnostics/health)."""
        return self._path


# ---------------------------------------------------------------------------
# Small normalization helpers (shared, side-effect free)
# ---------------------------------------------------------------------------

def _normalize_topic(topic: str) -> str:
    """Collapse a free-text topic to a stable key, e.g. 'Merge Sort' -> 'mergesort'.

    Mirrors the provider's normalization so a topic explained offline and a topic
    recorded here land on the same key.
    """
    return "".join(ch for ch in (topic or "").lower() if ch.isalnum())


def _clean_session_id(session_id: str) -> str:
    """Fall back to a shared 'anonymous' bucket for empty/whitespace ids.

    Endpoints generate a real id when a client doesn't supply one; this is just a
    last line of defence so the store never keys on an empty string.
    """
    cleaned = (session_id or "").strip()
    return cleaned or "anonymous"


def _clamp_score(score: Optional[int]) -> Optional[int]:
    """Coerce a score to an int in [0, 100], or ``None`` if not provided/parseable."""
    if score is None:
        return None
    try:
        return max(0, min(100, int(score)))
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Process-wide accessor (one store per process, like get_provider())
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def get_store() -> LearnerContextStore:
    """Return the process-wide learner-context store.

    Cached so the data directory/file is resolved and created once. Tests that
    need isolation can construct :class:`LearnerContextStore` with an explicit
    ``path`` instead of going through this accessor.
    """
    return LearnerContextStore()
