/**
 * lib/learning-store.ts — Zustand slice for the Layer 2 (Heutagogy) UI.
 *
 * Deliberately kept **separate** from `useCompressionStore` (lib/store.ts): the
 * learning journey is its own concern and shares no state with the compression
 * lab. This store caches the four read models the learn pages render (roadmap,
 * skill graph, progress, resume, recommendations) plus a single `hydrate()` that
 * loads them together, so pages can mount instantly from cache and refresh in the
 * background. All network access goes through `lib/learn-api.ts`; this store only
 * holds state + loading/error flags.
 */

import { create } from 'zustand'
import {
  fetchProgress,
  fetchRecommendations,
  fetchResume,
  fetchRoadmap,
  fetchSkillGraph,
  getStoredSession,
  type ProgressSummary,
  type Recommendations,
  type ResumePoint,
  type Roadmap,
  type SkillGraph,
} from './learn-api'

interface LearningState {
  sessionId: string | null
  roadmap: Roadmap | null
  skillGraph: SkillGraph | null
  progress: ProgressSummary | null
  resume: ResumePoint | null
  recommendations: Recommendations | null

  isLoading: boolean
  error: string | null
  lastLoadedAt: number | null

  /** Load every read model in parallel. Safe to call on each page mount. */
  hydrate: () => Promise<void>
  /** Re-fetch after the learner does something that changes evidence. */
  refresh: () => Promise<void>
}

export const useLearningStore = create<LearningState>((set, get) => ({
  sessionId: null,
  roadmap: null,
  skillGraph: null,
  progress: null,
  resume: null,
  recommendations: null,
  isLoading: false,
  error: null,
  lastLoadedAt: null,

  hydrate: async () => {
    // Avoid a redundant network storm if we loaded very recently.
    const { isLoading, lastLoadedAt } = get()
    if (isLoading) return
    if (lastLoadedAt && Date.now() - lastLoadedAt < 1500) return
    await get().refresh()
  },

  refresh: async () => {
    set({ isLoading: true, error: null })
    try {
      const [roadmap, skillGraph, progress, resume, recommendations] =
        await Promise.all([
          fetchRoadmap(),
          fetchSkillGraph(),
          fetchProgress(),
          fetchResume(),
          fetchRecommendations(5),
        ])
      set({
        roadmap,
        skillGraph,
        progress,
        resume,
        recommendations,
        sessionId: getStoredSession(),
        isLoading: false,
        lastLoadedAt: Date.now(),
      })
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : 'Failed to load learning data',
      })
    }
  },
}))
