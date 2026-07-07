"""
heutagogy.resume — the Resume Learning Service (Layer 2, M3).

Answers the two "continue where I left off" questions the dashboard and the
Continue page ask:

* **Where was I?** — the learner's most recent Layer 1 activity (last topic +
  action + when), optionally refined by an explicit checkpoint they saved.
* **What's the one best next step?** — the top ``available``/``in_progress`` node
  from the prerequisite engine, with a reason and a deep-link route.

Reads Layer 1 evidence (read-only) for "where was I", and the Layer-2
:class:`~heutagogy.state_store.LearningStateStore` for explicit checkpoints — the
one thing Layer 1 doesn't track. Deriving "what next" from the live roadmap means
the suggestion always reflects current mastery; nothing is cached.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from ai.learner_context import get_store as get_profile_store

from . import mastery as mastery_mod
from .prerequisites import PrerequisiteEngine, get_prerequisite_engine
from .skill_graph import SkillGraphEngine, get_skill_graph
from .state_store import LearningStateStore, get_learning_store


# Human-readable phrasing for the Layer 1 event types we surface.
_ACTION_LABEL = {"explain": "read an explanation of", "assess": "was assessed on"}


class ResumeLearningService:
    """Compute a resume point and persist explicit checkpoints for a session."""

    def __init__(
        self,
        graph: Optional[SkillGraphEngine] = None,
        prereqs: Optional[PrerequisiteEngine] = None,
        state_store: Optional[LearningStateStore] = None,
    ) -> None:
        self._graph = graph if graph is not None else get_skill_graph()
        self._prereqs = prereqs if prereqs is not None else get_prerequisite_engine()
        self._state = state_store if state_store is not None else get_learning_store()

    def _last_event(self, profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """The most recent Layer 1 event, or ``None`` for a brand-new learner."""
        events = profile.get("events", [])
        return events[-1] if events else None

    def resume_point(self, session_id: str) -> Dict[str, Any]:
        """Return ``{last_topic, last_action, last_ts, next_topic, next_title,
        next_reason, route, checkpoint}`` for ``session_id``.

        Every field degrades gracefully: a learner with no history gets
        ``last_*`` = ``None`` and is still pointed at a valid first step (a graph
        root), so the Continue page always has something actionable to show.
        """
        profile = get_profile_store().get_profile(session_id)
        mmap = mastery_mod.mastery_map(profile)

        # --- Where was I? ---------------------------------------------------
        last = self._last_event(profile)
        last_topic = last.get("topic") if last else None
        last_action = _ACTION_LABEL.get(last.get("type"), last.get("type")) if last else None
        last_ts = last.get("ts") if last else None

        # --- What next? -----------------------------------------------------
        next_list = self._prereqs.next_available(mmap)
        next_topic = next_list[0] if next_list else None
        next_title = None
        next_reason = "You've mastered every unlocked topic — explore a new branch!"
        route = None
        if next_topic is not None:
            node = self._graph.node(next_topic)
            next_title = node.get("title", next_topic)
            route = node.get("route")
            next_reason = self._prereqs.status_for(next_topic, mmap)["reason"]

        # --- Explicit checkpoint (Layer-2 owned) ----------------------------
        checkpoints = self._state.get_state(session_id).get("checkpoints", {})
        checkpoint = None
        if last_topic and last_topic in checkpoints:
            checkpoint = {"topic": last_topic, **checkpoints[last_topic]}

        return {
            "session_id": session_id,
            "last_topic": last_topic,
            "last_action": last_action,
            "last_ts": last_ts,
            "next_topic": next_topic,
            "next_title": next_title,
            "next_reason": next_reason,
            "route": route,
            "checkpoint": checkpoint,
        }

    def record_checkpoint(
        self, session_id: str, topic: str, position: Any = None
    ) -> Dict[str, Any]:
        """Save an explicit "my place" marker for ``topic`` and return it.

        Persists to the Layer-2 store only (Layer 1 stays frozen). ``position`` is
        an opaque, caller-defined cursor (e.g. a step index in a visualizer); we
        store it verbatim alongside a timestamp.
        """
        from .state_store import _now  # local import: time source lives with the store

        ts = _now()

        def _mutate(state: Dict[str, Any]) -> None:
            state.setdefault("checkpoints", {})[topic] = {"position": position, "ts": ts}

        self._state.update_state(session_id, _mutate)
        return {"topic": topic, "position": position, "ts": ts}
