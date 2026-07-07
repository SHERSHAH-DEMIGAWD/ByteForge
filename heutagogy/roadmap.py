"""
heutagogy.roadmap — the Learning Roadmap Service (Layer 2, M3, orchestration facade).

This is the composition point the frontend roadmap and dashboard consume. It
stitches together the four lower services into a single, ordered, per-learner
plan — *without* re-implementing any of their logic:

    Layer 1 profile ──► MasteryCalculator      (mastery + confidence, on read)
                   │
    SkillGraph ────┼──► PrerequisiteEngine      (locked / available / in_progress / mastered)
                   │
    Layer 1 recommend() ─► base "what next" signal, wrapped and enriched here

The service holds no state of its own: it reads the profile (Layer 1, read-only)
and the static graph, and returns plain dicts. Goals were part of the original
facade design (§2.5) and remain a clean seam — :meth:`build_roadmap` takes an
optional ``goal_id`` it currently ignores, so wiring goals in later is additive.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from ai.learner_context import get_store as get_profile_store

from . import mastery as mastery_mod
from .prerequisites import PrerequisiteEngine, get_prerequisite_engine
from .skill_graph import SkillGraphEngine, get_skill_graph


# Order in which statuses surface on the roadmap: things to finish, then things
# ready to start, then still-locked, then done. Within a status group the
# graph's topological order is preserved so prerequisites still read top-down.
_STATUS_RANK = {"in_progress": 0, "available": 1, "locked": 2, "mastered": 3}


class LearningRoadmapService:
    """Builds a personalized, prerequisite-aware roadmap for a session.

    Collaborators are injected for testability but default to the process-wide
    singletons, so the endpoint layer can just call ``LearningRoadmapService()``.
    """

    def __init__(
        self,
        graph: Optional[SkillGraphEngine] = None,
        prereqs: Optional[PrerequisiteEngine] = None,
    ) -> None:
        self._graph = graph if graph is not None else get_skill_graph()
        self._prereqs = prereqs if prereqs is not None else get_prerequisite_engine()

    def _profile(self, session_id: str) -> Dict[str, Any]:
        # Read-only access to Layer 1 evidence. Never written from here.
        return get_profile_store().get_profile(session_id)

    def build_roadmap(
        self, session_id: str, goal_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Return the ordered roadmap document for ``session_id``.

        Shape::

            {
              "session_id": str,
              "items": [ {topic, title, category, difficulty, route,
                          status, mastery, confidence, prereqs_met,
                          blocking_prereqs, reason} ],
              "next_topic": str | None,     # the single best next step
              "active_goal": None,          # reserved seam (goals deferred)
            }

        Items are sorted by status (finish → start → locked → done) then by the
        graph's topological order, so the very first ``available``/``in_progress``
        entry is the natural next thing to do.
        """
        profile = self._profile(session_id)
        mmap = mastery_mod.mastery_map(profile)
        details = mastery_mod.detail_map(profile)

        topo = self._graph.topological_order()
        topo_index = {t: i for i, t in enumerate(topo)}

        items: List[Dict[str, Any]] = []
        for topic in topo:
            node = self._graph.node(topic)
            status = self._prereqs.status_for(topic, mmap)
            detail = details.get(topic, {"mastery": 0, "confidence": 0.0})
            blocking = self._prereqs.blocking_prereqs(topic, mmap)
            items.append(
                {
                    "topic": topic,
                    "title": node.get("title", topic),
                    "category": node.get("category"),
                    "difficulty": node.get("difficulty"),
                    "route": node.get("route"),
                    "estimated_minutes": node.get("estimated_minutes"),
                    "status": status["status"],
                    "mastery": detail.get("mastery", 0),
                    "confidence": detail.get("confidence", 0.0),
                    "prereqs_met": not blocking,
                    "blocking_prereqs": blocking,
                    "reason": status["reason"],
                }
            )

        items.sort(key=lambda it: (_STATUS_RANK.get(it["status"], 9), topo_index[it["topic"]]))

        next_list = self._prereqs.next_available(mmap)
        return {
            "session_id": session_id,
            "items": items,
            "next_topic": next_list[0] if next_list else None,
            "active_goal": None,  # reserved: goals are deferred for the demo build
        }
