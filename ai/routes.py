"""
ai.routes — the FastAPI ``APIRouter`` that exposes the ``/ai/*`` HTTP contract
(Layer 1).

This is the *only* place the AI infrastructure meets the web layer. It wires the
three Layer-1 collaborators together for each request:

    request → build prompt (ai.prompts)
            → provider.complete()   (ai.provider — offline or a live LLM)
            → record outcome        (ai.learner_context)
            → response

Everything the frontend depends on is the stable JSON shape returned here; the
provider and the persistence details sit behind it. The router is included by
``api.py`` (``app.include_router(router)``) without touching any existing
endpoint, so the compression/algorithm API is entirely unaffected.
"""

from __future__ import annotations

import re
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from . import AI_INFRA_VERSION
from .learner_context import get_store
from .prompts import build_assess_messages, build_explain_messages
from .provider import describe_provider, get_provider

# All AI endpoints live under a single, versionable prefix. The tag groups them
# in the auto-generated Swagger docs at /docs.
router = APIRouter(prefix="/ai", tags=["ai"])


# Matches the offline provider's "Coverage score: 42%" line so the endpoint can
# persist a numeric score. A live provider that doesn't emit this simply yields
# ``None`` and the attempt is still recorded (without a score).
_SCORE_RE = re.compile(r"coverage score:\s*(\d{1,3})\s*%", re.IGNORECASE)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class ExplainRequest(BaseModel):
    """Payload for ``POST /ai/explain``."""

    topic: str = Field(..., description="Algorithm or concept to explain, e.g. 'Huffman'.")
    level: str = Field("beginner", description="Requested depth: 'beginner' | 'advanced'.")
    question: Optional[str] = Field(None, description="Optional specific question about the topic.")
    session_id: Optional[str] = Field(
        None, description="Client-owned session id; generated and returned if omitted."
    )


class AssessRequest(BaseModel):
    """Payload for ``POST /ai/assess``."""

    topic: str = Field(..., description="Topic the answer is about.")
    answer: str = Field(..., description="The learner's free-text answer to assess.")
    session_id: Optional[str] = Field(None, description="Client-owned session id; generated if omitted.")


class RecommendRequest(BaseModel):
    """Payload for ``POST /ai/recommend``."""

    session_id: Optional[str] = Field(None, description="Session to recommend for; generated if omitted.")
    limit: int = Field(3, ge=1, le=10, description="Maximum number of recommendations to return.")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_session_id(session_id: Optional[str]) -> str:
    """Return the caller's session id, or mint a fresh one when absent.

    The generated id is returned in every response so a stateless frontend can
    store it (e.g. in ``localStorage``) and send it back on the next call.
    """
    cleaned = (session_id or "").strip()
    return cleaned or f"sess-{uuid.uuid4().hex[:16]}"


def _extract_score(text: str) -> Optional[int]:
    """Pull a 0–100 coverage score out of assessment text, if present."""
    match = _SCORE_RE.search(text or "")
    if not match:
        return None
    return max(0, min(100, int(match.group(1))))


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/health")
async def ai_health() -> Dict[str, Any]:
    """Report AI-infrastructure status for the frontend and monitoring.

    Surfaces which provider is active (and whether it is a *live* model or the
    offline rule engine) plus the infra contract version, so a client can adapt
    its UI without guessing.
    """
    store = get_store()
    return {
        "status": "ok",
        "version": AI_INFRA_VERSION,
        "provider": describe_provider(),
        "persistence": {"path": str(store.path), "kind": "json-file"},
    }


@router.post("/explain")
async def ai_explain(req: ExplainRequest) -> Dict[str, Any]:
    """Explain a topic at the requested level and remember that it was studied.

    Flow: build a tutor prompt → ask the active provider → record the explanation
    against the session's profile → return the answer plus provider metadata.
    """
    session_id = _resolve_session_id(req.session_id)

    messages = build_explain_messages(req.topic, level=req.level, question=req.question)
    result = get_provider().complete(messages)

    get_store().record_explanation(session_id, req.topic, req.level)

    return {
        "session_id": session_id,
        "topic": req.topic,
        "level": req.level,
        "answer": result.text,
        "provider": result.provider,
        "model": result.model,
        "is_live": result.is_live,
        "meta": result.meta,
    }


@router.post("/assess")
async def ai_assess(req: AssessRequest) -> Dict[str, Any]:
    """Give feedback on a learner's answer and record the attempt/score.

    Flow: build an assessment prompt → ask the active provider → parse a numeric
    score if the response carries one → record it → return feedback + score.
    """
    session_id = _resolve_session_id(req.session_id)

    messages = build_assess_messages(req.topic, req.answer)
    result = get_provider().complete(messages)

    score = _extract_score(result.text)
    get_store().record_assessment(session_id, req.topic, score)

    return {
        "session_id": session_id,
        "topic": req.topic,
        "feedback": result.text,
        "score": score,  # None when the provider gave no numeric score
        "provider": result.provider,
        "model": result.model,
        "is_live": result.is_live,
        "meta": result.meta,
    }


@router.post("/recommend")
async def ai_recommend(req: RecommendRequest) -> Dict[str, Any]:
    """Suggest what to study next from the session's recorded history.

    Purely a read of the learner-context store (no provider call): weak topics to
    review first, then unexplored catalogue topics. Returns an explainable list.
    """
    session_id = _resolve_session_id(req.session_id)
    recommendations: List[Dict[str, str]] = get_store().recommend(session_id, limit=req.limit)

    return {
        "session_id": session_id,
        "count": len(recommendations),
        "recommendations": recommendations,
    }
