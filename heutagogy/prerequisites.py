"""
heutagogy.prerequisites — the Prerequisite Engine (Layer 2, M1).

Takes the learner-agnostic :class:`~heutagogy.skill_graph.SkillGraphEngine` and a
per-learner **mastery map**, and answers the questions the roadmap and skill-tree
views ask about *this* learner:

* What is the status of each topic — ``locked`` / ``available`` / ``in_progress``
  / ``mastered``?
* Which topics are unlocked (prerequisites satisfied) right now?
* What are the best next topics to work on?
* If a topic is locked, *which* prerequisites are blocking it?

Every answer carries a plain-language ``reason`` (explainability parity with
Layer 1), so the UI never shows a status without saying why.

The mastery-map contract
------------------------
A *mastery map* is ``{topic: score}`` where ``score`` is 0–100 and a **key is
present only when the learner has evidence** (attempts) for that topic. This is
exactly what :class:`heutagogy.mastery.MasteryCalculator` will produce in M2; for
M1 the engine is tested against synthetic maps. The distinction matters:

* topic **absent** from the map  → no attempts yet.
* topic **present** but below threshold → attempted, not yet mastered
  (``in_progress``).

A single, shared cutoff decides "mastered": :data:`MASTERY_THRESHOLD`, imported
from Layer 1 so both layers agree on one number instead of re-declaring it.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from ai.learner_context import MASTERY_THRESHOLD

from .skill_graph import SkillGraphEngine, get_skill_graph


# Canonical status strings. Kept as module constants so callers (roadmap, routes,
# tests) reference a name rather than a bare literal that could drift.
LOCKED = "locked"
AVAILABLE = "available"
IN_PROGRESS = "in_progress"
MASTERED = "mastered"


class PrerequisiteEngine:
    """Classifies skill-graph nodes for a specific learner's mastery map.

    Stateless with respect to the learner: it holds only the (immutable) graph and
    the mastery threshold. Every method takes the ``mastery_map`` as an argument,
    so one engine instance serves all learners and all requests — nothing to reset
    between calls.
    """

    def __init__(
        self,
        graph: Optional[SkillGraphEngine] = None,
        threshold: int = MASTERY_THRESHOLD,
    ) -> None:
        # Default to the curated platform graph; allow injection for tests.
        self._graph = graph if graph is not None else get_skill_graph()
        self._threshold = int(threshold)

    @property
    def threshold(self) -> int:
        """The mastery cutoff (≥ this counts a prerequisite as met)."""
        return self._threshold

    # -- helpers ------------------------------------------------------------

    def _is_met(self, topic: str, mastery_map: Dict[str, int]) -> bool:
        """Whether ``topic`` is mastered well enough to satisfy a prerequisite."""
        score = mastery_map.get(topic)
        return isinstance(score, (int, float)) and score >= self._threshold

    def _unmet_prereqs(self, topic: str, mastery_map: Dict[str, int]) -> List[str]:
        """Direct prerequisites of ``topic`` that are not yet met, in graph order."""
        return [
            prereq
            for prereq in self._graph.prerequisites_of(topic)
            if not self._is_met(prereq, mastery_map)
        ]

    # -- public API ---------------------------------------------------------

    def status_for(self, topic: str, mastery_map: Dict[str, int]) -> Dict[str, Any]:
        """Classify a single ``topic`` for a learner and explain the verdict.

        Returns ``{"topic", "status", "mastery", "reason"}``. The rules, in order:

        1. **mastered** — the topic's own score is at/above threshold. (Evidence of
           mastery wins even if the learner jumped ahead of the recommended order.)
        2. **locked** — at least one direct prerequisite is unmet. ``reason`` names
           the blockers so the UI can say *why*.
        3. **in_progress** — prerequisites met and the learner has attempts on this
           topic but hasn't crossed the threshold.
        4. **available** — prerequisites met and no attempts yet: a clean next step.
        """
        if topic not in self._graph.nodes():
            raise KeyError(topic)

        score = mastery_map.get(topic)
        mastery_value = int(score) if isinstance(score, (int, float)) else 0

        # 1. Mastered — own score meets the bar.
        if self._is_met(topic, mastery_map):
            return {
                "topic": topic,
                "status": MASTERED,
                "mastery": mastery_value,
                "reason": f"Mastered — your score of {mastery_value}% is at or above the {self._threshold}% bar.",
            }

        # 2. Locked — some prerequisite is not yet met.
        blockers = self._unmet_prereqs(topic, mastery_map)
        if blockers:
            pretty = ", ".join(blockers)
            return {
                "topic": topic,
                "status": LOCKED,
                "mastery": mastery_value,
                "reason": f"Locked — first reach {self._threshold}% in: {pretty}.",
            }

        # 3/4. Prerequisites satisfied: in_progress if attempted, else available.
        if topic in mastery_map:
            return {
                "topic": topic,
                "status": IN_PROGRESS,
                "mastery": mastery_value,
                "reason": (
                    f"In progress — prerequisites done and you're at {mastery_value}%; "
                    f"reach {self._threshold}% to master it."
                ),
            }
        return {
            "topic": topic,
            "status": AVAILABLE,
            "mastery": mastery_value,
            "reason": "Available — all prerequisites are met, so you can start this now.",
        }

    def status_map(self, mastery_map: Dict[str, int]) -> Dict[str, Dict[str, Any]]:
        """Classify **every** node, returned as ``{topic: status_record}``.

        Convenience for the skill-tree/roadmap views, which colour the whole graph
        at once. Order follows the graph's topological order so a caller iterating
        the dict renders prerequisites before dependents.
        """
        return {
            topic: self.status_for(topic, mastery_map)
            for topic in self._graph.topological_order()
        }

    def blocking_prereqs(self, topic: str, mastery_map: Dict[str, int]) -> List[str]:
        """Return the direct, still-unmet prerequisites of ``topic``.

        Empty when ``topic`` is unlocked. Only *direct* prerequisites are listed
        (the immediate blockers); their own upstream requirements surface when the
        learner drills into each blocker, keeping the message actionable rather
        than dumping the whole ancestry.
        """
        if topic not in self._graph.nodes():
            raise KeyError(topic)
        return self._unmet_prereqs(topic, mastery_map)

    def unlocked_topics(self, mastery_map: Dict[str, int]) -> List[str]:
        """Topics whose prerequisites are all met (status is *not* ``locked``).

        Includes ``available``, ``in_progress`` **and** ``mastered`` topics — i.e.
        everything the learner is free to open — in topological order. Use
        :meth:`next_available` for the narrower "what should I actually do next"
        list.
        """
        return [
            topic
            for topic in self._graph.topological_order()
            if not self._unmet_prereqs(topic, mastery_map)
        ]

    def next_available(self, mastery_map: Dict[str, int]) -> List[str]:
        """Ordered list of topics ready to be worked on now.

        These are the ``available`` and ``in_progress`` topics — prerequisites met,
        not yet mastered — in topological order, so the first element is the single
        best "next step" and the rest are the runners-up the roadmap can show
        beneath it. ``in_progress`` topics sort ahead of untouched ``available``
        ones at the same depth, nudging the learner to finish what they started.
        """
        ready: List[tuple[int, int, str]] = []
        for position, topic in enumerate(self._graph.topological_order()):
            record = self.status_for(topic, mastery_map)
            if record["status"] in (AVAILABLE, IN_PROGRESS):
                # Priority 0 for in-progress (finish it first), 1 for available;
                # `position` keeps topological order as the stable tie-break.
                priority = 0 if record["status"] == IN_PROGRESS else 1
                ready.append((priority, position, topic))
        ready.sort()
        return [topic for _prio, _pos, topic in ready]


# ---------------------------------------------------------------------------
# Process-wide accessor (mirrors get_skill_graph / get_store)
# ---------------------------------------------------------------------------

def get_prerequisite_engine() -> PrerequisiteEngine:
    """Return a Prerequisite Engine bound to the curated platform graph.

    Not ``lru_cache``d: the engine is a thin, cheap wrapper over the already-cached
    :func:`~heutagogy.skill_graph.get_skill_graph`, and keeping it un-cached avoids
    pinning a stale threshold if Layer 1's value is ever monkeypatched in a test.
    """
    return PrerequisiteEngine()
