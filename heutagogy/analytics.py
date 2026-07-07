"""
heutagogy.analytics — Progress Analytics (Layer 2, M3).

Aggregates the learner-facing metrics the dashboard and Progress page render:
overall mastery, per-status counts, study streak, an (explicitly-labelled) time
estimate, a completion estimate, weak concepts, a category breakdown, and a
mastery-over-time series for the chart.

Everything is **derived on read** from Layer 1 evidence + the static skill graph,
with one exception the review calls out (§2.7): the **streak** is computed from
Layer 1 event timestamps here, which is accurate as of the learner's last
activity and needs no external "today" clock — keeping the function pure and
unit-testable. (Day-boundary persistence in the Layer-2 store remains available
as a future refinement; not needed for the demo.)
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from ai.learner_context import MASTERY_THRESHOLD, get_store as get_profile_store

from . import mastery as mastery_mod
from .prerequisites import (
    AVAILABLE,
    IN_PROGRESS,
    LOCKED,
    MASTERED,
    PrerequisiteEngine,
    get_prerequisite_engine,
)
from .skill_graph import SkillGraphEngine, get_skill_graph


# Rough per-interaction minute costs for the time-spent *estimate* (labelled as
# such in the UI). Deliberately simple — precise time tracking is out of scope.
_MINUTES_PER_VIEW = 4
_MINUTES_PER_ASSESS = 6

_SECONDS_PER_DAY = 86_400


def _day_ordinal(ts: float) -> int:
    """Map an epoch timestamp to an integer day number (UTC) for streak math."""
    return int(ts // _SECONDS_PER_DAY)


class ProgressAnalytics:
    """Computes the analytics summary for a session."""

    def __init__(
        self,
        graph: Optional[SkillGraphEngine] = None,
        prereqs: Optional[PrerequisiteEngine] = None,
    ) -> None:
        self._graph = graph if graph is not None else get_skill_graph()
        self._prereqs = prereqs if prereqs is not None else get_prerequisite_engine()

    # -- individual metrics (small, testable pieces) ------------------------

    def _status_counts(self, mmap: Dict[str, int]) -> Dict[str, int]:
        counts = {MASTERED: 0, IN_PROGRESS: 0, AVAILABLE: 0, LOCKED: 0}
        for topic in self._graph.all_topics():
            counts[self._prereqs.status_for(topic, mmap)["status"]] += 1
        return counts

    def _overall_mastery(self, mmap: Dict[str, int]) -> int:
        """Mean mastery across *all* graph nodes (unstarted count as 0).

        Averaging over the whole graph (not just attempted topics) makes this a
        true "journey completeness" number that only rises as the map fills in.
        """
        topics = self._graph.all_topics()
        if not topics:
            return 0
        total = sum(mmap.get(t, 0) for t in topics)
        return int(round(total / len(topics)))

    def _study_streak_days(self, profile: Dict[str, Any]) -> int:
        """Consecutive active days ending at the learner's most recent activity.

        Derived purely from event timestamps: collect the distinct day numbers,
        then walk back from the latest counting unbroken consecutive days. No
        dependence on the current wall-clock, so it is deterministic in tests.
        """
        days = {
            _day_ordinal(e["ts"])
            for e in profile.get("events", [])
            if isinstance(e.get("ts"), (int, float))
        }
        if not days:
            return 0
        streak = 1
        cursor = max(days)
        while (cursor - 1) in days:
            streak += 1
            cursor -= 1
        return streak

    def _time_spent_estimate(self, profile: Dict[str, Any]) -> int:
        """Minutes-on-task *estimate* from view/assessment counts."""
        views = sum(v.get("count", 0) for v in profile.get("explained", {}).values())
        attempts = sum(a.get("attempts", 0) for a in profile.get("assessments", {}).values())
        return int(views * _MINUTES_PER_VIEW + attempts * _MINUTES_PER_ASSESS)

    def _completion_estimate(self, mmap: Dict[str, int]) -> int:
        """Estimated minutes to finish: sum of estimated_minutes over unmastered nodes."""
        remaining = 0
        for topic in self._graph.all_topics():
            if mmap.get(topic, 0) < MASTERY_THRESHOLD:
                remaining += int(self._graph.node(topic).get("estimated_minutes") or 0)
        return remaining

    def _category_breakdown(self, mmap: Dict[str, int]) -> List[Dict[str, Any]]:
        """Per-category totals + mastered counts + average mastery, for the chart."""
        buckets: Dict[str, Dict[str, Any]] = {}
        for topic in self._graph.all_topics():
            cat = self._graph.node(topic).get("category", "other")
            b = buckets.setdefault(cat, {"category": cat, "total": 0, "mastered": 0, "_sum": 0})
            b["total"] += 1
            score = mmap.get(topic, 0)
            b["_sum"] += score
            if score >= MASTERY_THRESHOLD:
                b["mastered"] += 1
        result = []
        for b in buckets.values():
            b["avg_mastery"] = int(round(b.pop("_sum") / b["total"])) if b["total"] else 0
            result.append(b)
        result.sort(key=lambda x: x["category"])
        return result

    def _mastery_over_time(self, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """A time series of assessment scores for the trend chart.

        One point per assessment event, in order, carrying a running average so
        the frontend can draw both the raw scores and the trend line.
        """
        series: List[Dict[str, Any]] = []
        running_sum = 0
        n = 0
        for e in profile.get("events", []):
            if e.get("type") == "assess" and isinstance(e.get("score"), int):
                n += 1
                running_sum += e["score"]
                series.append(
                    {
                        "t": e.get("ts"),
                        "topic": e.get("topic"),
                        "score": e["score"],
                        "avg": int(round(running_sum / n)),
                    }
                )
        return series

    # -- public facade ------------------------------------------------------

    def summary(self, session_id: str) -> Dict[str, Any]:
        """Return the full analytics summary document for ``session_id``."""
        profile = get_profile_store().get_profile(session_id)
        mmap = mastery_mod.mastery_map(profile)
        counts = self._status_counts(mmap)

        return {
            "session_id": session_id,
            "topics_total": len(self._graph.all_topics()),
            "topics_mastered": counts[MASTERED],
            "topics_in_progress": counts[IN_PROGRESS],
            "topics_available": counts[AVAILABLE],
            "topics_locked": counts[LOCKED],
            "overall_mastery": self._overall_mastery(mmap),
            "study_streak_days": self._study_streak_days(profile),
            "time_spent_estimate_min": self._time_spent_estimate(profile),
            "completion_estimate_min": self._completion_estimate(mmap),
            "weak_concepts": mastery_mod.weak_concepts(profile, k=3),
            "category_breakdown": self._category_breakdown(mmap),
            "mastery_over_time": self._mastery_over_time(profile),
        }
