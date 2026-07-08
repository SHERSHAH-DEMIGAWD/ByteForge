'use client'

/**
 * app/learn/recommendations/page.tsx — graph-aware "what to study next" list.
 * Reads /learn/recommendations (weak-topics-first, then unexplored catalogue
 * topics, each annotated with skill-graph status + lab route). Review items and
 * fresh explore items are visually separated so the intent of each is obvious.
 */

import Link from 'next/link'
import { useMemo } from 'react'
import { useLearningStore } from '@/lib/learning-store'
import { StatusBadge, MasteryBar, CATEGORY_LABEL } from '@/components/learn/primitives'
import { RefreshCw, Sparkles, ArrowRight, Lightbulb, RotateCcw } from 'lucide-react'

export default function RecommendationsPage() {
  const { recommendations, error, refresh, isLoading } = useLearningStore()

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
      <div className="max-w-3xl mx-auto space-y-3 animate-pulse">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-border bg-card" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
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
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-3">
            <RotateCcw className="w-4 h-4" /> Review &amp; Reinforce
          </h2>
          <div className="space-y-3">
            {review.map((r) => (
              <RecCard key={r.topic} rec={r} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" /> Explore Next
        </h2>
        {explore.length > 0 ? (
          <div className="space-y-3">
            {explore.map((r) => (
              <RecCard key={r.topic} rec={r} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing new to explore right now.</p>
        )}
      </section>
    </div>
  )
}

function RecCard({ rec }: { rec: import('@/lib/learn-api').Recommendation }) {
  const disabled = rec.status === 'locked' || !rec.route
  const Wrapper: any = disabled ? 'div' : Link
  const wrapperProps = disabled ? {} : { href: rec.route! }

  return (
    <Wrapper
      {...wrapperProps}
      className={`flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 transition-all group ${
        disabled
          ? 'border-border opacity-70'
          : 'border-border hover:border-primary/40 hover:bg-muted/20 cursor-pointer'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-foreground">{rec.title}</h3>
          <StatusBadge status={rec.status} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {rec.category ? CATEGORY_LABEL[rec.category] ?? rec.category : ''}
        </p>
        {rec.mastery > 0 && (
          <div className="mt-2 max-w-xs">
            <MasteryBar value={rec.mastery} />
          </div>
        )}
        <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent" />
          {rec.reason}
        </p>
      </div>
      {!disabled && (
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
      )}
    </Wrapper>
  )
}
