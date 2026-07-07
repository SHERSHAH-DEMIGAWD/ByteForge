"""
heutagogy.routes — the FastAPI ``APIRouter`` exposing the ``/learn/*`` HTTP
contract (Layer 2, Self-Determined Learning).

This is the only place the heutagogy services meet the web layer, mirroring the
role ``ai.routes`` plays for Layer 1. It is included by ``api.py``
(``app.include_router(router)``) alongside the ``/ai/*`` router, without touching
any existing endpoint.

Session model (identical to Layer 1)
------------------------------------
Every endpoint accepts an optional ``session_id``; when absent, a fresh id is
minted and **echoed back** in the response so a stateless frontend can persist it
in ``localStorage`` and send it on subsequent calls. Reads take it as a query
param; the one write (checkpoint) takes it in the JSON body.

Demo-build surface
------------------
Roadmap, skill-graph, mastery, progress, resume (GET + POST), and recommendations
— everything the demonstration user journey needs. Goals, achievements, and
preferences are deferred (documented seams); adding them later is purely additive
under this same prefix.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from ai import AI_INFRA_VERSION
from ai.learner_context import get_store as get_profile_store, normalize_topic

from . import HEUTAGOGY_VERSION
from . import mastery as mastery_mod
from .analytics import ProgressAnalytics
from .prerequisites import get_prerequisite_engine
from .resume import ResumeLearningService
from .roadmap import LearningRoadmapService
from .skill_graph import get_skill_graph
from .state_store import get_learning_store

# All Layer 2 endpoints live under a single, versionable prefix. The tag groups
# them in the auto-generated Swagger docs at /docs, next to the "ai" group.
router = APIRouter(prefix="/learn", tags=["learn"])


# ---------------------------------------------------------------------------
# Session helper (mirrors ai.routes._resolve_session_id exactly)
# ---------------------------------------------------------------------------

def _resolve_session_id(session_id: Optional[str]) -> str:
    """Return the caller's session id, or mint a fresh one when absent."""
    cleaned = (session_id or "").strip()
    return cleaned or f"sess-{uuid.uuid4().hex[:16]}"


# ---------------------------------------------------------------------------
# Request models (only the one write endpoint needs a body)
# ---------------------------------------------------------------------------

class CheckpointRequest(BaseModel):
    """Payload for ``POST /learn/resume`` — save an explicit 'my place' marker."""

    topic: str = Field(..., description="Topic to checkpoint (any casing; normalized server-side).")
    position: Any = Field(None, description="Opaque caller-defined cursor, e.g. a visualizer step index.")
    session_id: Optional[str] = Field(None, description="Client session id; minted if omitted.")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/health")
async def learn_health() -> Dict[str, Any]:
    """Report Layer 2 status/version for the frontend and monitoring."""
    store = get_learning_store()
    return {
        "status": "ok",
        "version": HEUTAGOGY_VERSION,
        "layer1_version": AI_INFRA_VERSION,
        "persistence": {"path": str(store.path), "kind": "json-file"},
    }


@router.get("/roadmap")
async def learn_roadmap(
    session_id: Optional[str] = Query(None),
    goal_id: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """Full personalized, prerequisite-aware roadmap for the session.

    Ordered finish → start → locked → done, each item carrying status, mastery,
    confidence, the blocking prerequisites (if any), a reason, and the deep-link
    route to its interactive lab.
    """
    sid = _resolve_session_id(session_id)
    return LearningRoadmapService().build_roadmap(sid, goal_id=goal_id)


@router.get("/skill-graph")
async def learn_skill_graph(session_id: Optional[str] = Query(None)) -> Dict[str, Any]:
    """The static skill DAG, annotated with this learner's per-node status.

    Returns ``{session_id, nodes:[{topic, ...meta, status, mastery, confidence}],
    edges:[[from,to]]}`` — exactly what the interactive skill-tree view renders.
    """
    sid = _resolve_session_id(session_id)
    profile = get_profile_store().get_profile(sid)
    mmap = mastery_mod.mastery_map(profile)
    details = mastery_mod.detail_map(profile)
    prereqs = get_prerequisite_engine()
    graph = get_skill_graph().get_graph()

    for node in graph["nodes"]:
        topic = node["topic"]
        status = prereqs.status_for(topic, mmap)
        detail = details.get(topic, {"mastery": 0, "confidence": 0.0})
        node["status"] = status["status"]
        node["mastery"] = detail.get("mastery", 0)
        node["confidence"] = detail.get("confidence", 0.0)
        node["reason"] = status["reason"]
        node["blocking_prereqs"] = prereqs.blocking_prereqs(topic, mmap)

    return {"session_id": sid, "nodes": graph["nodes"], "edges": graph["edges"]}


@router.get("/mastery")
async def learn_mastery(
    session_id: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """Mastery + confidence map for the session (or one topic when ``topic`` given)."""
    sid = _resolve_session_id(session_id)
    profile = get_profile_store().get_profile(sid)

    if topic:
        key = normalize_topic(topic)
        record = mastery_mod.mastery_for(profile, key)
        return {"session_id": sid, "topic": key, **record}

    details = mastery_mod.detail_map(profile)
    analytics = ProgressAnalytics()
    overall = analytics.summary(sid)["overall_mastery"]
    return {"session_id": sid, "overall": overall, "topics": details}


@router.get("/progress")
async def learn_progress(session_id: Optional[str] = Query(None)) -> Dict[str, Any]:
    """Analytics summary: mastery, streak, weak concepts, category breakdown, trend."""
    sid = _resolve_session_id(session_id)
    return ProgressAnalytics().summary(sid)


@router.get("/resume")
async def learn_resume_get(session_id: Optional[str] = Query(None)) -> Dict[str, Any]:
    """Where the learner was + the single best next step (with a deep-link route)."""
    sid = _resolve_session_id(session_id)
    return ResumeLearningService().resume_point(sid)


@router.post("/resume")
async def learn_resume_post(req: CheckpointRequest) -> Dict[str, Any]:
    """Save an explicit checkpoint ('save my place') for a topic."""
    sid = _resolve_session_id(req.session_id)
    checkpoint = ResumeLearningService().record_checkpoint(
        sid, normalize_topic(req.topic), req.position
    )
    return {"session_id": sid, "saved": True, "checkpoint": checkpoint}


@router.get("/recommendations")
async def learn_recommendations(
    session_id: Optional[str] = Query(None),
    limit: int = Query(5, ge=1, le=10),
) -> Dict[str, Any]:
    """Enriched, graph-aware recommendations.

    Wraps Layer 1's ``recommend()`` (weak topics first, then unexplored catalogue
    topics) and layers on skill-graph status, mastery, and the lab route for each
    item — a superset of ``/ai/recommend``, not a re-implementation.
    """
    sid = _resolve_session_id(session_id)
    profile = get_profile_store().get_profile(sid)
    mmap = mastery_mod.mastery_map(profile)
    prereqs = get_prerequisite_engine()
    graph = get_skill_graph()

    base: List[Dict[str, str]] = get_profile_store().recommend(sid, limit=limit)
    enriched: List[Dict[str, Any]] = []
    for rec in base:
        key = normalize_topic(rec["topic"])
        node = graph.node(key) if graph.has_topic(key) else {}
        detail = mastery_mod.mastery_for(profile, key)
        status = prereqs.status_for(key, mmap) if graph.has_topic(key) else {"status": "available"}
        enriched.append(
            {
                "topic": key,
                "title": node.get("title", rec["topic"]),
                "kind": rec["kind"],
                "reason": rec["reason"],
                "status": status["status"],
                "mastery": detail["mastery"],
                "confidence": detail["confidence"],
                "route": node.get("route"),
                "category": node.get("category"),
            }
        )

    return {"session_id": sid, "count": len(enriched), "recommendations": enriched}
