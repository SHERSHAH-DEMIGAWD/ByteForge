"""
heutagogy.mastery — the Mastery Calculator (Layer 2, M2).

Derives, **on read**, two distinct signals for each topic from Layer 1's raw
learner profile:

* ``mastery`` (0–100) — *how well* the learner has demonstrated the topic.
* ``confidence`` (0–1) — *how sure* we are of that mastery number, given how many
  attempts back it and how stable the scores are.

Separating the two is the heutagogy distinction between **recall** (one lucky
high score) and **capability** (repeated, stable performance). The UI shows both,
each with a plain-language ``reason``.

Why nothing is persisted
------------------------
The single source of truth is Layer 1's ``learner_profiles.json`` (the evidence:
``explained`` / ``assessments`` / ``events``). Every number here is recomputed
from that profile at read time, so a cached "mastered" flag can never drift out
of sync with the underlying scores (see the architecture review, §2.3 / §5). This
module therefore holds **no state** and does **no I/O** — it is a set of pure
functions over a profile dict, trivially unit-testable.

The mastery-map contract (consumed by :mod:`heutagogy.prerequisites`)
--------------------------------------------------------------------
:func:`mastery_map` returns ``{topic: mastery_score}`` and includes a topic **iff
the learner has some evidence for it** (an assessment attempt or an explanation
view). A topic with no evidence is simply absent — which the prerequisite engine
reads as "not started" (``available``), while a present-but-low score reads as
``in_progress``. Keys are Layer 1's normalized topic form, so they line up with
skill-graph nodes.
"""

from __future__ import annotations

from typing import Any, Dict, List

from ai.learner_context import MASTERY_THRESHOLD


# ---------------------------------------------------------------------------
# Tunable model constants — kept together, named, and documented so the model is
# transparent and easy to retune from real data (the review's explicit ask: no
# ML, no black box).
# ---------------------------------------------------------------------------

# Blend weights for a topic that has been assessed. Best score dominates (it is
# the learner's demonstrated ceiling), recent score is a smaller recency nudge.
_W_BEST = 0.7
_W_LAST = 0.3

# Reading an explanation is *exposure*, not mastery. It contributes a small
# "familiarity floor" that can never on its own reach the mastery threshold, so a
# topic is never marked mastered without an assessment backing it.
_FAMILIARITY_PER_VIEW = 12  # points per explanation view …
_FAMILIARITY_CAP = 30       # … capped well below MASTERY_THRESHOLD (70).

# Confidence: attempts needed before the "enough evidence" factor saturates.
_ATTEMPTS_FOR_FULL_CONFIDENCE = 3
# How confidence splits between "enough attempts" and "scores are stable".
_W_ATTEMPTS = 0.5
_W_STABILITY = 0.5
# A single assessment is inherently ambiguous (could be luck): start stability at
# neutral rather than assuming consistency.
_SINGLE_ATTEMPT_STABILITY = 0.5
# Score spread (best-worst) at which stability is considered fully eroded.
_STABILITY_SPREAD_FLOOR = 50.0


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------

def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _assess_scores_from_events(profile: Dict[str, Any], topic: str) -> List[int]:
    """Recover the ordered list of numeric assessment scores for ``topic``.

    Layer 1's ``events`` log carries one entry per assessment (``{"type":"assess",
    "topic", "score", ...}``). Reading the series lets us judge *stability* — a
    consistent run of high scores means far more than a single spike. The event
    log is capped (50 entries), so this is a best-effort recent history; the
    authoritative attempt *count* still comes from the assessments record.
    """
    scores: List[int] = []
    for event in profile.get("events", []):
        if (
            event.get("type") == "assess"
            and event.get("topic") == topic
            and isinstance(event.get("score"), int)
        ):
            scores.append(int(event["score"]))
    return scores


# ---------------------------------------------------------------------------
# Per-topic derivation
# ---------------------------------------------------------------------------

def mastery_for(profile: Dict[str, Any], topic: str) -> Dict[str, Any]:
    """Return ``{topic, mastery, confidence, attempts, reason}`` for one topic.

    ``topic`` must already be a normalized key (the profile stores normalized
    keys). The result is self-explaining: ``reason`` states, in plain language,
    what evidence produced the numbers.
    """
    assessments: Dict[str, Any] = profile.get("assessments", {})
    explained: Dict[str, Any] = profile.get("explained", {})

    a = assessments.get(topic)
    e = explained.get(topic)

    attempts = int(a.get("attempts", 0)) if isinstance(a, dict) else 0
    views = int(e.get("count", 0)) if isinstance(e, dict) else 0

    familiarity = min(_FAMILIARITY_CAP, _FAMILIARITY_PER_VIEW * views)

    # --- No assessment yet: mastery is just the familiarity floor. ----------
    if not isinstance(a, dict) or a.get("best_score") is None:
        if views == 0:
            return {
                "topic": topic,
                "mastery": 0,
                "confidence": 0.0,
                "attempts": 0,
                "reason": "No activity yet on this topic.",
            }
        # Explained but never assessed.
        confidence = round(min(0.15, 0.05 * views), 2)
        return {
            "topic": topic,
            "mastery": int(familiarity),
            "confidence": confidence,
            "attempts": 0,
            "reason": (
                f"Read {views} explanation(s) but not yet assessed — familiarity only. "
                f"Take an assessment to build real mastery."
            ),
        }

    # --- Assessed: blend best + recent, then add the familiarity floor. ------
    best = int(a.get("best_score") or 0)
    last = int(a.get("last_score") if a.get("last_score") is not None else best)
    blended = _W_BEST * best + _W_LAST * last
    mastery = int(round(_clamp(blended + familiarity * 0.2, 0, 100)))

    # --- Confidence: enough attempts AND stable scores. ---------------------
    attempt_factor = min(1.0, attempts / _ATTEMPTS_FOR_FULL_CONFIDENCE)
    scores = _assess_scores_from_events(profile, topic)
    if len(scores) >= 2:
        spread = max(scores) - min(scores)
        stability = _clamp(1.0 - spread / _STABILITY_SPREAD_FLOOR, 0.0, 1.0)
    else:
        stability = _SINGLE_ATTEMPT_STABILITY
    confidence = round(
        _clamp(_W_ATTEMPTS * attempt_factor + _W_STABILITY * stability, 0.0, 1.0), 2
    )

    mastered = mastery >= MASTERY_THRESHOLD
    if mastered:
        headline = f"Mastered: best {best}%, recent {last}%"
    else:
        headline = f"Best {best}%, recent {last}% — below the {MASTERY_THRESHOLD}% bar"
    reason = (
        f"{headline}. Confidence {confidence:.2f} from {attempts} attempt(s)"
        + (" with stable scores." if stability >= 0.7 else " (more consistent attempts raise confidence).")
    )

    return {
        "topic": topic,
        "mastery": mastery,
        "confidence": confidence,
        "attempts": attempts,
        "reason": reason,
    }


# ---------------------------------------------------------------------------
# Whole-profile derivations
# ---------------------------------------------------------------------------

def evidence_topics(profile: Dict[str, Any]) -> List[str]:
    """Normalized keys of every topic the learner has any evidence for.

    Evidence = at least one assessment attempt or one explanation view. The union
    (not just assessments) so a topic the learner has only *read* still appears on
    the map as started.
    """
    topics = set(profile.get("assessments", {})) | set(profile.get("explained", {}))
    return sorted(topics)


def mastery_map(profile: Dict[str, Any]) -> Dict[str, int]:
    """Return ``{topic: mastery_score}`` for every topic with evidence.

    This is the exact structure :class:`heutagogy.prerequisites.PrerequisiteEngine`
    expects: a key is present only when there is evidence, so absence means
    "not started". Consumed by the roadmap, skill-tree, and analytics.
    """
    return {
        topic: mastery_for(profile, topic)["mastery"]
        for topic in evidence_topics(profile)
    }


def detail_map(profile: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Like :func:`mastery_map` but each value is the full mastery record.

    Handy for the ``/learn/mastery`` endpoint, which returns mastery **and**
    confidence **and** a reason per topic without recomputing.
    """
    return {topic: mastery_for(profile, topic) for topic in evidence_topics(profile)}


def weak_concepts(profile: Dict[str, Any], k: int = 3) -> List[Dict[str, Any]]:
    """Return up to ``k`` assessed topics scoring below the mastery threshold.

    Weakest first. Only topics with an actual *assessment* qualify (a topic merely
    read isn't "weak", it's "unstarted"), so this surfaces genuine review targets
    for the dashboard's "Weak Topics" panel. Each item carries its ``reason``.
    """
    assessments: Dict[str, Any] = profile.get("assessments", {})
    weak: List[Dict[str, Any]] = []
    for topic in assessments:
        record = mastery_for(profile, topic)
        if record["attempts"] > 0 and record["mastery"] < MASTERY_THRESHOLD:
            weak.append(record)
    weak.sort(key=lambda r: r["mastery"])
    return weak[: max(0, int(k))]
