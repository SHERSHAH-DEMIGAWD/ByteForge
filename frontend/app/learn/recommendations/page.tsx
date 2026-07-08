'use client'

/**
 * app/learn/recommendations/page.tsx — graph-aware "what to study next" list.
 * Reads /learn/recommendations (weak-topics-first, then unexplored catalogue
 * topics, each annotated with skill-graph status + lab route) and enriches each
 * card with the roadmap item's difficulty, estimated time, and prerequisites.
 * Review items and fresh explore items are visually separated so the intent of
 * each is obvious; every card explains *why* it's recommended and how confident
 * the model is.
 */

import Link from 'next/link'
import { useMemo } from 'react'
import { useLearningStore } from '@/lib/learning-store'
import {
  StatusBadge,
  MasteryBar,
  ConfidenceMeter,
  DifficultyBadge,
  EmptyState,
  Skeleton,
  CATEGORY_LABEL,
  formatMinutes,
} from '@/components/learn/primitives'
import type { Recommendation, RoadmapItem } from '@/lib/learn-api'
import { RefreshCw, Sparkles, ArrowRight, Lightbulb, RotateCcw, Clock, Lock } from 'lucide-react'

export default function RecommendationsPage() {
  const { recommendations, roadmap, error, refresh, isLoading } = useLearningStore()

  const byTopic = useMemo(() => {
    const map: Record<string, RoadmapItem> = {}
    ;(roadmap?.items ?? []).forEach((i) => (map[i.topic] = i))
    return map
  }, [roadmap])

  const { review, explore } = useMemo(() => {
    const recs = recommendations?.recommendations ?? []
    return {
      review: recs.filter((r) => r.kind === 'review'),
      explore: recs.filter((r) => r.kind === 'explore'),
    }
  }, [recommendations])

  if (error && !recommendations) {
    return <p className="text-center text-sm text-muted-foreground mt-16">Couldn&apos;t load recommendations: {error}</p>
  }

  if (!recommendations) {
    return (
      <div className="max-w-3xl mx-auto space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{recommendations.count}</span> personalized suggestions,
          weak topics first.
        </p>
        <button
          onClick={() => refresh()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {review.length > 0 && (
        <section className="bf-rise">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2 mb-3">
            <RotateCcw className="w-4 h-4" /> Review &amp; Reinforce
          </h2>
          <div className="space-y-3">
            {review.map((r) => (
              <RecCard key={r.topic} rec={r} item={byTopic[r.topic]} />
            ))}
          </div>
        </section>
      )}

      <section className="bf-rise bf-stagger-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" /> Explore Next
        </h2>
        {explore.length > 0 ? (
          <div className="space-y-3">
            {explore.map((r) => (
              <RecCard key={r.topic} rec={r} item={byTopic[r.topic]} />
            ))}
          </div>
        ) : (
          <div className="bf-card">
            <EmptyState
              icon={Sparkles}
              title="Nothing new to explore right now"
              hint="You've reached the frontier of the current catalogue — revisit weak topics to deepen mastery."
            />
          </div>
        )}
      </section>
    </div>
  )
}

function RecCard({ rec, item }: { rec: Recommendation; item?: RoadmapItem }) {
  const disabled = rec.status === 'locked' || !rec.route
  const Wrapper: any = disabled ? 'div' : Link
  const wrapperProps = disabled ? {} : { href: rec.route! }
  const prereqs = item?.blocking_prereqs ?? []

  return (
    <Wrapper
      {...wrapperProps}
      className={`block bf-card p-5 transition-all group ${
        disabled ? 'opacity-75' : 'bf-card-hover cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground">{rec.title}</h3>
            <StatusBadge status={rec.status} />
          </div>

          {/* Meta row: category · difficulty · est time */}
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            {rec.category && (
              <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[rec.category] ?? rec.category}</span>
            )}
            {item?.difficulty && <DifficultyBadge difficulty={item.difficulty} />}
            {item?.estimated_minutes ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" /> {formatMinutes(item.estimated_minutes)}
              </span>
            ) : null}
          </div>
        </div>
        {!disabled && (
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
        )}
      </div>

      {rec.mastery > 0 && (
        <div className="mt-3 max-w-xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Mastery</span>
            <span className="font-semibold text-foreground tabular-nums">{Math.round(rec.mastery)}%</span>
          </div>
          <MasteryBar value={rec.mastery} />
        </div>
      )}

      {/* Why recommended */}
      <div className="mt-3 rounded-xl bg-muted/30 border border-border/60 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5 mb-1">
          <Lightbulb className="w-3.5 h-3.5" /> Why this
        </p>
        <p className="text-sm text-muted-foreground">{rec.reason}</p>
      </div>

      {/* Footer: prerequisites + confidence */}
      <div className="mt-3 flex items-end justify-between gap-4 flex-wrap">
        {prereqs.length > 0 ? (
          <div className="text-xs min-w-0">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Prerequisites
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {prereqs.map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded-md bg-muted/40 border border-border text-foreground capitalize"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-xs text-emerald-500 font-medium">Prerequisites met</span>
        )}
        <ConfidenceMeter confidence={rec.confidence} />
      </div>
    </Wrapper>
  )
}
