"""
ByteForge — Self-Determined Learning (Heutagogy), Layer 2.

This package is the pedagogical layer that sits *on top of* the Layer 1 AI
infrastructure (the ``ai`` package). It is a **sibling** of ``ai/``,
``algorithms/`` and ``utils/`` and does not modify or reorganize any existing
module.

Relationship to Layer 1
-----------------------
The dependency direction is strictly one-way: ``heutagogy -> ai`` (never the
reverse). Layer 2 *reads* Layer 1's learner profile as the single source of
truth (``ai.learner_context.get_store().get_profile``) and *derives* higher-order
pedagogy on top of it — mastery, prerequisites, roadmaps. It never writes to
Layer 1's ``learner_profiles.json``.

Responsibilities (built up across milestones M0–M7)
--------------------------------------------------
* ``state_store``   — the one new persistence file (``learning_state.json``) for
                      *authored* state: goals, streak, preferences, checkpoints.
                      Mirrors Layer 1's thread-safe, atomic-write JSON store.
* ``skill_graph``   — the static topic DAG (added in M1).
* ``prerequisites`` — locked/available/mastered classification (M1).
* ``mastery``       — mastery + confidence derived from Layer 1 profiles (M2).
* ``goals``         — learner-authored goal CRUD (M3).
* ``roadmap``       — the orchestration facade (M3).
* ``resume``        — "where was I / what next" (M3).
* ``analytics``     — streak, time, weak concepts, completion estimate (M3).
* ``routes``        — the FastAPI ``APIRouter`` exposing the ``/learn/*`` API.

Design principles (inherited from Layer 1)
-----------------------------------------
1. **Runs offline with zero external dependencies and zero API keys.** All
   pedagogy is rule-based and explainable; the AI provider is only an optional
   narration seam reused from Layer 1.
2. **No database.** New state persists to a single gitignored JSON file in the
   same ``ai_data/`` directory Layer 1 uses.
3. **Additive.** Removing this package leaves Layer 1 fully functional.
"""

# The public version of the Layer 2 (``/learn/*``) contract. Versioned
# independently of Layer 1's ``AI_INFRA_VERSION`` so the two layers can evolve
# separately. Bump the minor version when adding backward-compatible endpoints;
# bump major on breaking changes.
HEUTAGOGY_VERSION = "2.0.0"
