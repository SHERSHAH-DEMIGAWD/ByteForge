/**
 * lib/learn-api.ts — thin, typed client for the Layer 2 `/learn/*` API (and the
 * Layer 1 `/ai/explain` seam used by the experiential modules).
 *
 * Mirrors the established fetch convention used across the app
 * (`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`) so it needs no
 * extra config. The backend mints a `session_id` when one isn't supplied and
 * echoes it back on every response; this module persists that id in
 * `localStorage` and threads it through subsequent calls, matching the Layer 1
 * session contract. Everything degrades gracefully — callers get typed data or a
 * thrown Error they can render as an empty/offline state.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const SESSION_KEY = 'byteforge-learn-session'

// ---------------------------------------------------------------------------
// Response types (match the shapes returned by heutagogy/routes.py)
// ---------------------------------------------------------------------------

export type SkillStatus = 'locked' | 'available' | 'in_progress' | 'mastered'

export interface RoadmapItem {
  topic: string
  title: string
  category: string
  difficulty: string
  route: string | null
  estimated_minutes: number | null
  status: SkillStatus
  mastery: number
  confidence: number
  prereqs_met: boolean
  blocking_prereqs: string[]
  reason: string
}

export interface Roadmap {
  session_id: string
  items: RoadmapItem[]
  next_topic: string | null
  active_goal: null
}

export interface SkillNode {
  topic: string
  title: string
  category: string
  difficulty: string
  route: string | null
  estimated_minutes: number | null
  status: SkillStatus
  mastery: number
  confidence: number
  reason: string
  blocking_prereqs: string[]
}

export interface SkillGraph {
  session_id: string
  nodes: SkillNode[]
  edges: [string, string][]
}

export interface MasteryDetail {
  topic: string
  mastery: number
  confidence: number
  attempts: number
  reason: string
}

export interface MasteryMap {
  session_id: string
  overall: number
  topics: Record<string, MasteryDetail>
}

export interface WeakConcept {
  topic: string
  mastery: number
  confidence: number
  attempts: number
  reason: string
}

export interface CategoryBreakdown {
  category: string
  total: number
  mastered: number
  avg_mastery: number
}

export interface MasteryPoint {
  t: number | null
  topic: string
  score: number
  avg: number
}

export interface ProgressSummary {
  session_id: string
  topics_total: number
  topics_mastered: number
  topics_in_progress: number
  topics_available: number
  topics_locked: number
  overall_mastery: number
  study_streak_days: number
  time_spent_estimate_min: number
  completion_estimate_min: number
  weak_concepts: WeakConcept[]
  category_breakdown: CategoryBreakdown[]
  mastery_over_time: MasteryPoint[]
}

export interface ResumePoint {
  session_id: string
  last_topic: string | null
  last_action: string | null
  last_ts: number | null
  next_topic: string | null
  next_title: string | null
  next_reason: string
  route: string | null
  checkpoint: { topic: string; position: unknown; ts: number } | null
}

export interface Recommendation {
  topic: string
  title: string
  kind: 'review' | 'explore'
  reason: string
  status: SkillStatus
  mastery: number
  confidence: number
  route: string | null
  category: string | null
}

export interface Recommendations {
  session_id: string
  count: number
  recommendations: Recommendation[]
}

export interface AiExplanation {
  session_id: string
  topic: string
  level: string
  answer: string
  provider: string
  model: string | null
  is_live: boolean
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

export function getStoredSession(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

function storeSession(id: string | undefined) {
  if (!id || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SESSION_KEY, id)
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

/** Append `session_id` to a query string when we already have one. */
function withSession(path: string): string {
  const sid = getStoredSession()
  if (!sid) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}session_id=${encodeURIComponent(sid)}`
}

async function getJSON<T extends { session_id?: string }>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${withSession(path)}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  const data = (await res.json()) as T
  storeSession(data.session_id)
  return data
}

async function postJSON<T extends { session_id?: string }>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const sid = getStoredSession()
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sid ? { session_id: sid, ...body } : body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  const data = (await res.json()) as T
  storeSession(data.session_id)
  return data
}

// ---------------------------------------------------------------------------
// Endpoint calls
// ---------------------------------------------------------------------------

export const fetchRoadmap = () => getJSON<Roadmap>('/learn/roadmap')
export const fetchSkillGraph = () => getJSON<SkillGraph>('/learn/skill-graph')
export const fetchMastery = () => getJSON<MasteryMap>('/learn/mastery')
export const fetchProgress = () => getJSON<ProgressSummary>('/learn/progress')
export const fetchResume = () => getJSON<ResumePoint>('/learn/resume')
export const fetchRecommendations = (limit = 5) =>
  getJSON<Recommendations>(`/learn/recommendations?limit=${limit}`)

export const saveCheckpoint = (topic: string, position?: unknown) =>
  postJSON<{ session_id: string; saved: boolean; checkpoint: unknown }>(
    '/learn/resume',
    { topic, position: position ?? null },
  )

/** Layer 1 seam: fetch an AI explanation for a topic (used by AI panels). */
export const aiExplain = (topic: string, level = 'beginner', question?: string) =>
  postJSON<AiExplanation>('/ai/explain', { topic, level, question: question ?? null })
