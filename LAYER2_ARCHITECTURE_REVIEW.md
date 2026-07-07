# Layer 2 — Self-Determined Learning (Heutagogy)
## Architecture Review Report

**Platform:** ByteForge — *The 5-Layer AI–Heutagogy Model for Gen Z Engineering Education*
**Status:** DESIGN ONLY — awaiting approval. No code written.
**Builds on:** Layer 1 AI Learning Infrastructure (`ai/` package, `AI_INFRA_VERSION = "1.0.0"`)

---

## Guiding Principle

> **Layer 1 records *what happened*. Layer 2 decides *what should happen next* — and hands the steering wheel to the learner.**

Layer 2 introduces **zero new heavy dependencies**, **no database**, and **does not fork or duplicate any Layer 1 logic**. It sits *on top of* Layer 1 as a new sibling package (`heutagogy/`) that **reads** Layer 1's learner profile as the single source of truth and **derives** higher-order pedagogy (mastery, roadmaps, prerequisites) on top of it. New *authored* state (goals, streaks, preferences, checkpoints) lives in a Layer-2-owned JSON file, keeping Layer 1's schema frozen.

---

## 1. Educational Objectives

### Why Layer 2 exists
Layer 1 can explain a topic and score an answer, but the learner still has to decide *what to study, in what order, and when they're "done."* In a heutagogical (self-determined) model, that agency **belongs to the learner** — but they need a scaffold to exercise it well. Layer 2 provides that scaffold: a visible skill map, transparent mastery signals, learner-authored goals, and a "continue where you left off" spine — without ever forcing a fixed curriculum.

### Educational problems it solves
| Problem | Layer 2 response |
|---|---|
| "I don't know what to learn next." | Skill graph + prerequisite-aware roadmap with *available / locked / mastered* states. |
| "I don't know if I actually understand this." | Mastery score **and** a separate confidence signal, derived from real attempts. |
| "I lost my place / lost momentum." | Resume banner + study streak + time-on-task analytics. |
| "The course decides everything for me." | Learner-authored **goals** and **preferred difficulty** steer the recommendations. |
| "Feedback is a black box." | Every mastery number and recommendation ships with a plain-language *reason* (inherited from Layer 1's explainability contract). |

### How it differs from a traditional LMS
- **No enrollment, no fixed course order, no instructor gradebook.** The graph is a *map*, not a track. Learners can jump to any *unlocked* node.
- **Mastery is computed from evidence, not marked complete by a checkbox.** A module is "mastered" because assessment scores crossed a threshold, not because a video reached 100%.
- **The learner sets the goals.** An LMS assigns objectives; Layer 2 lets the learner declare "I want to master all Graph algorithms by Friday" and then measures against *their* target.
- **Fully offline-capable.** Like Layer 1, it runs with zero API keys — pedagogy is rule-based and explainable, with an optional AI-narration seam.

### How it supports Heutagogy principles
| Heutagogy principle | Concrete Layer 2 feature |
|---|---|
| **Learner-determined goals** | `LearningGoalManager` — learner authors, edits, and completes their own goals. |
| **Capability over competency** | Mastery **+ confidence** (can they *apply* it, not just recall it), plus weak-concept surfacing. |
| **Non-linear, self-directed paths** | Prerequisite-gated skill graph where any unlocked node is a valid next step. |
| **Reflection & self-monitoring** | Learning analytics, timeline, streaks, confidence meter — the learner watches their own trajectory. |
| **Double-loop learning** | Roadmap re-plans as mastery changes; recommendations adapt to goals and preferences the learner sets. |

---

## 2. Backend Architecture

New package **`heutagogy/`** (sibling of `ai/`, `algorithms/`, `utils/`). Dependency direction is strictly **`heutagogy/ → ai/`** (never the reverse), preserving Layer 1 as a stable foundation.

```
              ┌─────────────────────────── heutagogy/ (Layer 2) ───────────────────────────┐
              │                                                                              │
 HTTP  ──►  routes.py ──►  LearningRoadmapService ──┬──► SkillGraphEngine                    │
 /learn/*                      │                    ├──► PrerequisiteEngine                   │
              │                │                    ├──► MasteryCalculator ──┐                │
              │                │                    └──► LearningGoalManager  │               │
              │          ResumeLearningService ─────────────────────────────┤               │
              │          ProgressAnalytics ─────────────────────────────────┤               │
              │                                                              │               │
              │          LearningStateStore (goals/streak/prefs/checkpoint)  │               │
              └──────────────────────────────────────────────────────────────┼──────────────┘
                                                                              ▼
                          ai/ (Layer 1):  get_store() → LearnerContextStore  (READ-ONLY from L2)
                                           get_provider() / prompts  (optional AI narration)
```

### 2.1 Skill Graph Engine — `heutagogy/skill_graph.py`
- **Responsibility:** Own the static, data-driven **DAG of topics**. Nodes = topics (superset of Layer 1's `DEFAULT_TOPIC_CATALOG`), each with metadata (title, category, `difficulty`, `estimated_minutes`, related algorithm route). Edges = "is-prerequisite-of".
- **Exposes:** `get_graph()`, `nodes()`, `edges()`, `topological_order()`, `neighbors(topic)`, `category_of(topic)`.
- **Key trait:** Pure data + pure functions, **no persistence, no learner state**. The graph is identical for every learner; personalization happens above it. Topic keys use Layer 1's `_normalize_topic` convention so a topic explained in Layer 1 maps to the same node.

### 2.2 Prerequisite Engine — `heutagogy/prerequisites.py`
- **Responsibility:** Given the skill graph + a learner's mastery map, classify every node as **`locked`** (unmet prereqs), **`available`** (prereqs met, not yet mastered), **`in_progress`** (some attempts, below mastery), or **`mastered`**.
- **Exposes:** `status_for(topic, mastery_map)`, `unlocked_topics(mastery_map)`, `next_available(mastery_map)`, `blocking_prereqs(topic, mastery_map)`.
- **Rule:** a prerequisite counts as "met" when its mastery ≥ `MASTERY_THRESHOLD` (reuses Layer 1's `_MASTERY_THRESHOLD = 70`, imported — not re-declared).

### 2.3 Mastery Calculator — `heutagogy/mastery.py`
- **Responsibility:** Derive, **on read**, a `mastery_score` (0–100) and a separate `confidence` (0–1) for each topic from Layer 1's raw profile. **No persistence** — single source of truth is `learner_profiles.json`, so numbers can never drift.
- **Inputs:** `LearnerContextStore.get_profile(session_id)` → `explained`, `assessments`, `events`.
- **Model (transparent, tunable):**
  - `mastery_score` = weighted blend of `best_score`, recent `last_score`, and an attempt/exposure factor (explained count nudges a small "familiarity" floor).
  - `confidence` = function of *number of attempts* and *score stability* (consistent high scores → high confidence; one lucky high score → lower confidence). Encodes the heutagogy distinction between *recall* and *capability*.
- **Exposes:** `mastery_for(profile, topic)`, `mastery_map(profile)`, `confidence_for(profile, topic)`, `weak_concepts(profile, k)`.
- Ships a `reason` string with each number for the UI (explainability parity with Layer 1).

### 2.4 Learning Goal Manager — `heutagogy/goals.py`
- **Responsibility:** CRUD for **learner-authored goals** — the heart of self-determined learning. A goal = `{id, title, topics[] | category, target_mastery, deadline?, created_at, status}`.
- **Exposes:** `list_goals(session_id)`, `create_goal(session_id, spec)`, `update_goal(...)`, `delete_goal(...)`, `evaluate_goal(session_id, goal)` (computes % complete against live mastery).
- **Persists** via `LearningStateStore` (§2.8). Progress is *derived* from mastery at read time; only the goal *definition* is stored.

### 2.5 Learning Roadmap Service — `heutagogy/roadmap.py`
- **Responsibility:** The **orchestrator/facade**. Composes SkillGraph + Prerequisite + Mastery + Goals into a single ordered, personalized roadmap the frontend renders directly.
- **Exposes:** `build_roadmap(session_id)` → ordered list of roadmap items `{topic, title, category, status, mastery, confidence, prereqs_met, reason, route}`; goal-scoped roadmap when a goal is active.
- **Reuses Layer 1's `recommend()`** as a signal and layers graph/goal awareness on top — no re-implementation of the base heuristic.

### 2.6 Resume Learning Service — `heutagogy/resume.py`
- **Responsibility:** Answer "where was I, and what's the one best next action?" Reads the most recent Layer 1 `events` entry + optional Layer-2 checkpoint, cross-references the roadmap for the top *available* node.
- **Exposes:** `resume_point(session_id)` → `{last_topic, last_action, last_ts, next_topic, next_reason, route}`; `record_checkpoint(session_id, topic, position)` for explicit "save my place."

### 2.7 Progress Analytics — `heutagogy/analytics.py`
- **Responsibility:** Aggregate learner-facing metrics for the analytics page and dashboard.
- **Exposes:** `summary(session_id)` → `{topics_mastered, topics_in_progress, overall_mastery, study_streak_days, time_spent_estimate, weak_concepts[], completion_estimate, mastery_over_time[], category_breakdown[]}`.
- **Derivation:** streak & time-on-task approximated from Layer 1 `events` timestamps (+ streak persisted in `LearningStateStore` for day-boundary accuracy); completion estimate from remaining nodes × `estimated_minutes`.

### 2.8 Learning State Store — `heutagogy/state_store.py`
- **Responsibility:** The *only* new persistence. Mirrors `LearnerContextStore` **exactly** (thread-safe `RLock`, atomic temp-file + `os.replace`, `SCHEMA_VERSION`, `AI_DATA_DIR`-based location, `get_learning_store()` `lru_cache` accessor). Stores **authored/derived-cache** state Layer 1 doesn't own: goals, streak bookkeeping, preferred difficulty, checkpoints.
- **File:** `ai_data/learning_state.json` (same gitignored dir as Layer 1).

### Interaction with `learner_context.py`
- Layer 2 calls **`ai.learner_context.get_store().get_profile(session_id)`** (read-only) everywhere it needs evidence. It **never writes** to `learner_profiles.json`.
- Layer 2 imports `_MASTERY_THRESHOLD`, `DEFAULT_TOPIC_CATALOG`, and `_normalize_topic` from Layer 1 (we'll promote the two underscored names to public aliases — a tiny, additive, backward-compatible Layer 1 touch; see §9/§10).
- Writes that record explanations/assessments continue to flow through Layer 1's existing `/ai/explain` and `/ai/assess`. Layer 2 is a **reader + new-state writer**, so both files stay consistent by construction.

---

## 3. Frontend Architecture

New route group **`app/learn/`** (Next.js App Router). Existing algorithm pages are untouched; the sidebar gains one new "Learning" section.

### Pages & routing
```
/learn                → Learning Dashboard (hub: rings, streak, resume banner, top recs)
/learn/roadmap        → Learning Roadmap (ordered, prereq-aware, goal-scoped)
/learn/skill-tree     → Skill Tree (interactive DAG, locked/available/mastered)
/learn/continue       → Continue Learning (resume + next-best-action)
/learn/achievements   → Achievements (badges, streak milestones)
/learn/analytics      → Learning Analytics (mastery-over-time, weak concepts, time)
/learn/goals          → Goal Setting (author/edit/track goals)
/learn/recommendations→ Recommendations (enriched, goal-aware)
```

- **Shared layout:** `app/learn/layout.tsx` provides a sub-nav/tab bar across the eight pages and hydrates the learning session once.
- **State:** new `lib/learning-store.ts` (Zustand slice — kept separate from `useCompressionStore`), holding `sessionId`, cached roadmap/mastery/analytics, and optimistic goal edits.
- **API access:** `lib/learn-api.ts` — thin `fetch` wrapper using the established `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'` pattern, targeting `/learn/*`.
- **Session identity:** reuse Layer 1's convention — `sessionId` persisted in `localStorage`, sent on every request, echoed back by the server (same contract as `/ai/*`).

---

## 4. API Design

New router **`heutagogy/routes.py`** → `APIRouter(prefix="/learn", tags=["learn"])`, mounted in `api.py` next to the existing `ai_router`. All responses echo `session_id` (Layer 1 pattern). Pydantic models, same style as `ExplainRequest` etc.

| Method & path | Purpose | Request | Response (shape) |
|---|---|---|---|
| `GET /learn/health` | Layer 2 status/version | — | `{status, version, persistence, layer1_version}` |
| `GET /learn/roadmap` | Full personalized roadmap | `?session_id&goal_id?` | `{session_id, items:[{topic,title,category,status,mastery,confidence,reason,route}], active_goal?}` |
| `GET /learn/skill-graph` | Graph + per-node status | `?session_id` | `{session_id, nodes:[...], edges:[[from,to]]}` |
| `GET /learn/mastery` | Mastery + confidence map | `?session_id&topic?` | `{session_id, overall, topics:{topic:{mastery,confidence,status,reason}}}` |
| `GET /learn/progress` | Analytics summary | `?session_id` | `{session_id, topics_mastered, overall_mastery, study_streak_days, time_spent_estimate, weak_concepts, completion_estimate, mastery_over_time, category_breakdown}` |
| `GET /learn/resume` | Where I was + next step | `?session_id` | `{session_id, last_topic, last_action, last_ts, next_topic, next_reason, route}` |
| `POST /learn/resume` | Save an explicit checkpoint | `{session_id?, topic, position?}` | `{session_id, saved:true, checkpoint}` |
| `GET /learn/goals` | List goals + live progress | `?session_id` | `{session_id, goals:[{id,title,topics,target_mastery,deadline,status,progress_pct}]}` |
| `POST /learn/goals` | Create a goal | `{session_id?, title, topics[]|category, target_mastery?, deadline?}` | `{session_id, goal:{...}}` |
| `PATCH /learn/goals/{id}` | Edit a goal | `{title?,topics?,target_mastery?,deadline?,status?}` | `{session_id, goal:{...}}` |
| `DELETE /learn/goals/{id}` | Remove a goal | `?session_id` | `{session_id, deleted:true}` |
| `GET /learn/recommendations` | Enriched, goal-aware recs | `?session_id&limit=5` | `{session_id, count, recommendations:[{topic,kind,reason,status,mastery,route}]}` |
| `GET /learn/achievements` | Earned + locked badges | `?session_id` | `{session_id, achievements:[{id,title,earned,earned_at?,reason}]}` |
| `POST /learn/preferences` | Set preferred difficulty | `{session_id?, preferred_difficulty}` | `{session_id, preferences}` |

**Request/response conventions:** `session_id` optional on writes (minted + returned, exactly like `_resolve_session_id`); all reads accept it as a query param. Every derived number carries a `reason`. Errors use FastAPI's standard `{detail}` with `404` for unknown `goal_id`.

`GET /learn/recommendations` **wraps** Layer 1's `/ai/recommend` logic (`get_store().recommend(...)`) and enriches each item with graph status, mastery, and route — not a re-implementation.

---

## 5. Database / Persistence

Continues the **JSON-file, no-DB** design. Two files in the gitignored `ai_data/`:

| File | Owner | Contents |
|---|---|---|
| `learner_profiles.json` | Layer 1 (unchanged) | `explained`, `assessments`, `events` — the **evidence** (source of truth). |
| `learning_state.json` | **Layer 2 (new)** | `goals`, `streak`, `preferences`, `checkpoints` — **authored state only**. |

**New learner data (and where it comes from):**
| Field | Storage | Source |
|---|---|---|
| completed / mastered modules | derived | computed from `assessments` via MasteryCalculator |
| mastery score | derived | MasteryCalculator (not stored — recomputed on read) |
| confidence | derived | MasteryCalculator (attempt count + score stability) |
| study streak | `learning_state.json` | day-boundary bookkeeping over Layer 1 `events` |
| learning goals | `learning_state.json` | authored by learner |
| estimated completion | derived | remaining nodes × `estimated_minutes` |
| time spent | derived (+ cached) | approximated from `events` timestamps |
| weak concepts | derived | topics with mastery < threshold |
| preferred difficulty | `learning_state.json` | authored by learner |
| checkpoints ("my place") | `learning_state.json` | explicit `POST /learn/resume` |

**Design rule:** *evidence is never duplicated; derived values are never persisted as truth.* This eliminates the classic drift bug where a cached "completed" flag disagrees with the underlying scores.

`learning_state.json` root shape:
```json
{
  "version": 1,
  "sessions": {
    "sess-xxxx": {
      "session_id": "sess-xxxx",
      "created_at": 0.0, "updated_at": 0.0,
      "goals": [ {"id":"g1","title":"...","topics":["dijkstra"],"target_mastery":80,"deadline":null,"status":"active","created_at":0.0} ],
      "streak": {"current_days": 0, "longest_days": 0, "last_active_date": "2026-07-08"},
      "preferences": {"preferred_difficulty": "beginner"},
      "checkpoints": {"dijkstra": {"position": null, "ts": 0.0}}
    }
  }
}
```

---

## 6. UI Components

New folder **`components/learn/`** (reuses existing shadcn `ui/`, `metric-card.tsx`, `theme-toggle.tsx`; matches Tailwind/oklch theme).

| Component | Props (essence) | Used on |
|---|---|---|
| `ProgressRing` | `value, size, label` | Dashboard, Analytics |
| `SkillTree` | `nodes, edges, onSelect` | Skill Tree, Roadmap |
| `RoadmapCard` | `item{topic,status,mastery,reason,route}` | Roadmap, Dashboard |
| `AchievementBadge` | `title, earned, reason` | Achievements |
| `ConfidenceMeter` | `confidence, mastery` | Roadmap, Analytics |
| `GoalCard` | `goal, progressPct, onEdit, onDelete` | Goals |
| `ResumeBanner` | `resumePoint` | Dashboard, Continue |
| `LearningTimeline` | `events[]` | Analytics, Continue |
| `RecommendationPanel` | `recommendations[]` | Recommendations, Dashboard |
| `MasteryBar` | `topic, mastery, status` | Roadmap, Mastery views |
| `StreakFlame` | `currentDays, longestDays` | Dashboard, Achievements |
| `StatTile` | `label, value, delta?` | Dashboard, Analytics |

**Charting:** reuse the already-installed `recharts` (used by `/analytics`) for `mastery_over_time` and `category_breakdown` — no new chart dep.

---

## 7. Data Flow

Read path (e.g., rendering the roadmap):
```
Student
  ↓  (opens /learn/roadmap)
Next.js page  ──uses──►  lib/learning-store.ts (Zustand)
  ↓  fetch GET /learn/roadmap?session_id
FastAPI  ──►  heutagogy/routes.py
  ↓
LearningRoadmapService.build_roadmap(session_id)
  ├─► ai.learner_context.get_store().get_profile(session_id)   ← Layer 1 evidence (READ)
  ├─► MasteryCalculator.mastery_map(profile)                   ← derive scores + confidence
  ├─► SkillGraphEngine.get_graph() + PrerequisiteEngine        ← statuses (locked/available/…)
  ├─► LearningGoalManager (LearningStateStore)                 ← active goal scope
  └─► ai.learner_context.recommend(...)                        ← Layer 1 base signal
  ↓  ordered roadmap items (+ reasons)
Response (JSON, echoes session_id)
  ↓
RoadmapCard / SkillTree render
```

Write path (authoring a goal):
```
Student → GoalCard form → POST /learn/goals
  → routes.py → LearningGoalManager.create_goal()
  → LearningStateStore (atomic write to learning_state.json)
  → returns goal → store updates → UI reflects new goal + live progress
```

Learning-loop path (matches the prompt's example): `Student → Dashboard → API → Learning Service → Learner Context → AI Recommendation → Response`.

---

## 8. Folder Structure (added only)

```
ByteForge/
├── heutagogy/                     # NEW — Layer 2 backend package (sibling of ai/)
│   ├── __init__.py                # HEUTAGOGY_VERSION = "2.0.0"
│   ├── skill_graph.py             # SkillGraphEngine (static DAG + metadata)
│   ├── graph_data.py              # topic node/edge definitions (pure data)
│   ├── prerequisites.py           # PrerequisiteEngine
│   ├── mastery.py                 # MasteryCalculator (derives from Layer 1 profile)
│   ├── goals.py                   # LearningGoalManager
│   ├── roadmap.py                 # LearningRoadmapService (facade/orchestrator)
│   ├── resume.py                  # ResumeLearningService
│   ├── analytics.py               # ProgressAnalytics
│   ├── achievements.py            # achievement rules (pure functions)
│   ├── state_store.py             # LearningStateStore + get_learning_store()
│   └── routes.py                  # APIRouter(prefix="/learn")
│
├── tests/                         # NEW (or extend existing) — Layer 2 unit tests
│   ├── test_mastery.py
│   ├── test_prerequisites.py
│   ├── test_roadmap.py
│   ├── test_goals.py
│   └── test_learn_routes.py
│
└── frontend/
    ├── app/
    │   └── learn/                 # NEW route group
    │       ├── layout.tsx         # sub-nav + session hydration
    │       ├── page.tsx           # Learning Dashboard
    │       ├── roadmap/page.tsx
    │       ├── skill-tree/page.tsx
    │       ├── continue/page.tsx
    │       ├── achievements/page.tsx
    │       ├── analytics/page.tsx
    │       ├── goals/page.tsx
    │       └── recommendations/page.tsx
    ├── components/
    │   └── learn/                 # NEW component folder
    │       ├── progress-ring.tsx
    │       ├── skill-tree.tsx
    │       ├── roadmap-card.tsx
    │       ├── achievement-badge.tsx
    │       ├── confidence-meter.tsx
    │       ├── goal-card.tsx
    │       ├── resume-banner.tsx
    │       ├── learning-timeline.tsx
    │       ├── recommendation-panel.tsx
    │       ├── mastery-bar.tsx
    │       ├── streak-flame.tsx
    │       └── stat-tile.tsx
    └── lib/
        ├── learning-store.ts      # NEW Zustand slice
        └── learn-api.ts           # NEW fetch wrapper for /learn/*
```

**Files modified (minimal, additive):**
- `api.py` — one block: `from heutagogy.routes import router as learn_router; app.include_router(learn_router)`.
- `ai/learner_context.py` — promote `_MASTERY_THRESHOLD`, `_normalize_topic`, (`DEFAULT_TOPIC_CATALOG` already public) to public aliases so Layer 2 imports a stable API instead of underscored internals. **No behavior change.**
- `frontend/components/sidebar.tsx` — add a "Learning" link group.
- `.gitignore` — already covers `ai_data/`; no change needed.

---

## 9. Integration Plan (how Layer 2 plugs into Layer 1)

**Dependency graph (strict, one-directional):**
```
frontend/app/learn/*  ─►  /learn/*  (heutagogy/routes.py)
                                │
        ┌───────────────────────┼─────────────────────────┐
        ▼                       ▼                          ▼
 heutagogy services   ai.learner_context (READ)   ai.provider + ai.prompts (optional)
        │                       │
        ▼                       ▼
 heutagogy/state_store   ai_data/learner_profiles.json
        │
        ▼
 ai_data/learning_state.json
```

**Layer 1 services reused (not duplicated):**
| Layer 1 asset | How Layer 2 uses it |
|---|---|
| `get_store()` / `LearnerContextStore.get_profile()` | Read evidence for mastery, resume, analytics. |
| `LearnerContextStore.recommend()` | Base signal wrapped by `/learn/recommendations`. |
| `_MASTERY_THRESHOLD` | Single shared mastery cutoff (imported). |
| `DEFAULT_TOPIC_CATALOG` | Seed set for the skill graph nodes. |
| `_normalize_topic` | Guarantees Layer 1 & 2 key topics identically. |
| `get_provider()` + `prompts` | *Optional* AI narration of roadmaps/goals (offline-safe). |
| Persistence pattern (RLock + atomic write + `AI_DATA_DIR`) | Copied verbatim into `LearningStateStore`. |
| `_resolve_session_id` + `session_id` echo contract | Same session model end-to-end. |

**Contract stability:** `/ai/*` endpoints and `learner_profiles.json` are **frozen**. Layer 2 is purely additive; deleting `heutagogy/` would leave Layer 1 fully functional.

---

## 10. Implementation Plan (milestones)

Each milestone is independently testable and shippable.

### M0 — Foundation & Layer 1 seam (Low)
- **Goal:** Package skeleton + safe public aliases in Layer 1.
- **Create:** `heutagogy/__init__.py`, `heutagogy/state_store.py`.
- **Modify:** `ai/learner_context.py` (public aliases only); `api.py` (mount empty router).
- **Test:** `LearningStateStore` round-trip, atomicity, isolation via explicit `path`; Layer 1 tests still green.
- **Complexity:** Low.

### M1 — Skill Graph + Prerequisites (Medium)
- **Goal:** Static DAG + status classification.
- **Create:** `graph_data.py`, `skill_graph.py`, `prerequisites.py`.
- **Test:** graph is acyclic; topological order valid; locked/available transitions with synthetic mastery maps.
- **Complexity:** Medium (data curation is the real work).

### M2 — Mastery Calculator (Medium)
- **Goal:** Derive mastery + confidence from Layer 1 profiles.
- **Create:** `mastery.py`.
- **Test:** golden cases (no attempts, one high score → modest confidence, repeated high scores → high confidence, declining scores).
- **Complexity:** Medium (pedagogical tuning; pure functions ⇒ easy to unit-test).

### M3 — Goals + Roadmap + Resume + Analytics (Medium–High)
- **Goal:** Authored goals and the orchestration facade.
- **Create:** `goals.py`, `roadmap.py`, `resume.py`, `analytics.py`, `achievements.py`.
- **Modify:** none.
- **Test:** goal CRUD + live progress; roadmap ordering respects prereqs & goal scope; streak day-boundary logic (inject clock, mirroring Layer 1's `_now`).
- **Complexity:** Medium–High.

### M4 — API layer (Medium)
- **Goal:** Expose everything over `/learn/*`.
- **Create:** `heutagogy/routes.py`; **Modify:** `api.py` (include router).
- **Test:** FastAPI `TestClient` per endpoint; session mint/echo; 404 on unknown goal; `/learn/recommendations` matches `/ai/recommend` base then enriches.
- **Complexity:** Medium.

### M5 — Frontend foundation (Medium)
- **Goal:** Store, API client, layout, dashboard.
- **Create:** `lib/learning-store.ts`, `lib/learn-api.ts`, `app/learn/layout.tsx`, `app/learn/page.tsx`; core components (`ProgressRing`, `ResumeBanner`, `StatTile`, `RecommendationPanel`).
- **Modify:** `components/sidebar.tsx`.
- **Test:** manual + component render; graceful offline/empty-profile states.
- **Complexity:** Medium.

### M6 — Remaining pages & components (Medium–High)
- **Goal:** Roadmap, Skill Tree, Goals, Analytics, Achievements, Continue, Recommendations.
- **Create:** remaining `app/learn/*` pages + `components/learn/*`.
- **Test:** end-to-end against a seeded session; visual states for locked/mastered; empty-goal state.
- **Complexity:** Medium–High (Skill Tree visualization is the heaviest piece).

### M7 — Polish, docs, optional AI narration (Low–Medium)
- **Goal:** `/learn/health`, optional AI-narrated roadmap via Layer 1 provider, README/`LAYER2.md`.
- **Complexity:** Low–Medium.

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Mastery model too crude / gameable** | Learners mistrust scores | Keep it transparent + tunable; ship `reason`; separate confidence from score; iterate from real data. Do **not** over-engineer into ML now. |
| **Two JSON files drift** | Inconsistent UI | Evidence lives only in Layer 1; Layer 2 stores *authored* data only and derives the rest on read → drift is structurally impossible. |
| **Skill-graph edges become opinionated/wrong** | Bad gating frustrates learners | Data-driven `graph_data.py` (easy to edit); allow any *unlocked* node (no forced single path); "unlock anyway" is a future toggle. |
| **JSON contention at higher concurrency** | Latency under load | Reuse Layer 1's proven RLock + atomic-write; file is tiny; documented seam to per-session files or SQLite if it ever matters (not now). |
| **Streak/time-spent inaccuracy from event timestamps** | Minor metric error | Persist streak day-boundaries explicitly; label time-spent an *estimate* in UI. |
| **Scope creep into gamification** | Complexity balloon | Achievements are pure functions over existing metrics — no new economy, currency, or social layer in Layer 2. |
| **Touching Layer 1 introduces regressions** | Breaks foundation | Only additive public aliases + one router mount; Layer 1 test suite must stay green as a gate. |

**Explicit anti-over-engineering stance:** no ML, no graph DB, no message queue, no new runtime dependency. Rules are readable, testable, and swappable — matching Layer 1's philosophy.

---

## 12. Future Compatibility (Layers 3–5)

Designed as extension seams — **not implemented now.**

- **Layer 3 — Experiential Learning:** the skill graph nodes already carry a `route` to the corresponding interactive algorithm lab; Layer 3 can attach *projects/challenges* to nodes and feed outcomes back as new Layer 1 `events`, which Layer 2's MasteryCalculator will automatically fold into mastery — **no Layer 2 change required**.
- **Layer 4 — AI-Human Collaboration:** roadmap/goal reasoning is centralized in the RoadmapService facade; swapping the rule-based recommender for an AI co-planner is a provider swap behind the same `/learn/*` contract (Layer 1's provider abstraction already supports live LLMs).
- **Layer 5 — Innovation & Societal Impact:** goals already support free-form titles/categories; Layer 5 can introduce *capstone/impact* goal types and portfolio export by extending `LearningGoalManager` and adding read-only aggregation — additive, no schema break.

**Compatibility guarantees:** `HEUTAGOGY_VERSION` versions the `/learn/*` contract independently of `AI_INFRA_VERSION`; both stores carry `SCHEMA_VERSION` for forward migration; every service is a pure/rule-based function today with a documented AI seam for later.

---

## Architecture Review — Verdict

| Criterion | Assessment |
|---|---|
| Reuses Layer 1 without duplication | ✅ reads profile, wraps `recommend()`, shares threshold/normalization/persistence pattern |
| No new heavy dependencies / no DB | ✅ JSON files, existing `recharts`/`zustand`/shadcn |
| Existing code untouched (mostly) | ✅ 4 additive edits (router mount, public aliases, sidebar link, store slice) |
| Heutagogy principles realized | ✅ learner goals, capability+confidence, non-linear paths, self-monitoring |
| Testable in small milestones | ✅ M0–M7, pure functions dominate |
| Forward-compatible with L3–L5 | ✅ documented seams, versioned contracts |
| Avoids over-engineering | ✅ explicit anti-scope-creep guardrails |

**Recommendation:** Approve and proceed to **M0**.

---

*Awaiting your approval before any code is written.*
