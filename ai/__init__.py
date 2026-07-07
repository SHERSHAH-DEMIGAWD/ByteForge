"""
ByteForge — AI Learning Infrastructure (Layer 1).

This package is the foundation for the platform's pedagogical layers. It is a
*sibling* of ``algorithms/`` and ``utils/`` and intentionally does not modify or
reorganize any existing module.

Responsibilities
----------------
* ``provider``        — a swappable LLM provider abstraction (offline by default,
                        with a documented seam for Gemini / Claude / OpenAI /
                        local LLMs).
* ``learner_context`` — a lightweight, file-persisted per-session learner profile
                        that Layers 2–4 will read and write.
* ``prompts``         — prompt / response templates kept out of the endpoint code.
* ``routes``          — the FastAPI ``APIRouter`` that exposes the ``/ai/*`` API.

Design principles
-----------------
1. **Runs with zero external dependencies and zero API keys.** The default
   provider is a pure-Python, rule-based ``OfflineProvider`` so the app behaves
   identically on the free tier and in offline demos/vivas.
2. **Provider-agnostic.** The frontend only ever talks to the stable ``/ai/*``
   HTTP contract. Swapping in a real LLM is a backend-only change (one env var
   plus a new ``LLMProvider`` subclass) and requires no frontend edits.
3. **No database.** Learner state persists to a gitignored JSON file, matching
   the repository's existing no-DB design.
"""

# The public version of the AI infrastructure contract. Bump the minor version
# when adding backward-compatible endpoints; bump major on breaking changes so
# the frontend can guard against a mismatched backend if needed.
AI_INFRA_VERSION = "1.0.0"
