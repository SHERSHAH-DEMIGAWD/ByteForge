"""
heutagogy.routes — the FastAPI ``APIRouter`` that exposes the ``/learn/*`` HTTP
contract (Layer 2, Self-Determined Learning).

This is the *only* place the heutagogy services meet the web layer, mirroring the
role ``ai.routes`` plays for Layer 1. It is included by ``api.py``
(``app.include_router(router)``) alongside the ``/ai/*`` router, without touching
any existing endpoint.

Milestone status
----------------
M0 ships only ``GET /learn/health`` so the router can be mounted and monitored
while the pedagogy services are built out. Subsequent milestones add
``/learn/roadmap``, ``/learn/mastery``, ``/learn/goals`` and the rest — all under
this same prefix, keeping the frontend contract stable.
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter

from ai import AI_INFRA_VERSION
from . import HEUTAGOGY_VERSION
from .state_store import get_learning_store

# All Layer 2 endpoints live under a single, versionable prefix. The tag groups
# them in the auto-generated Swagger docs at /docs, next to the "ai" group.
router = APIRouter(prefix="/learn", tags=["learn"])


@router.get("/health")
async def learn_health() -> Dict[str, Any]:
    """Report Layer 2 status for the frontend and monitoring.

    Surfaces the heutagogy contract version, the underlying Layer 1 version it
    builds on, and where the new authored-state file lives — so a client can
    confirm both layers are present and compatible without guessing.
    """
    store = get_learning_store()
    return {
        "status": "ok",
        "version": HEUTAGOGY_VERSION,
        "layer1_version": AI_INFRA_VERSION,
        "persistence": {"path": str(store.path), "kind": "json-file"},
    }
