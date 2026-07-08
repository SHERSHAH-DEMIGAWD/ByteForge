'use client'

/**
 * app/learn/roadmap/page.tsx — the personalized, prerequisite-aware Learning
 * Roadmap. Renders the ordered items from /learn/roadmap as a vertical track:
 * each node shows status, mastery, the reason it's placed where it is, blocking
 * prerequisites when locked, and a deep-link into its interactive lab. A filter
 * bar lets the learner focus by status.
 */

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useLearningStore } from '@/lib/learning-store'
import {
  StatusBadge,
  MasteryBar,
  ConfidenceMeter,
  STATUS_META,
  CATEGORY_LABEL,
  formatMinutes,
} from '@/components/learn/primitives'
import type { SkillStatus } from '@/lib/learn-api'
import { ArrowRight, Lock, PlayCircle, Sparkles, Clock } from 'lucide-react'

type Filter = 'all' | SkillStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'mastered', label: 'Mastered' },
  { key: 'locked', label: 'Locked' },
]

export default function RoadmapPage() {
  const { roadmap, isLoading, error } = useLearningStore()
  const [filter, setFilter] = useState<Filter>('all')

  const items = useMemo(() => {
    const all = roadmap?.items ?? []
    return filter === 'all' ? all : all.filter((i) => i.status === filter)
  }, [roadmap, filter])

  if (error && !roadmap) {
    return <p className="text-center text-sm text-muted-foreground mt-16">Couldn&apos;t load roadmap: {error}</p>
  }

  if (!roadmap) {
    return <RoadmapSkeleton />
  }

  const nextTopic = roadmap.next_topic

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => {
            const active = filter === f.key
            const count =
              f.key === 'all'
                ? roadmap.items.length
                : roadmap.items.filter((i) => i.status === f.key).length
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                {f.label} <span className="opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
        {isLoading && <span className="text-xs text-muted-foreground animate-pulse">Syncing…</span>}
      </div>

      {/* Track */}
      <ol className="relative border-l-2 border-border/60 ml-3 space-y-4">
        {items.map((item, idx) => {
          const meta = STATUS_META[item.status]
          const Icon = meta.icon
          const isNext = item.topic === nextTopic
          return (
            <li key={item.topic} className="ml-6 relative">
              {/* Node dot */}
              <span
                className={`absolute -left-[2.1rem] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${meta.bg} ${meta.border}`}
              >
                <Icon className={`w-3.5 h-3.5 ${meta.text}`} />
              </span>

              <div
                className={`rounded-2xl border bg-card p-5 transition-all ${
                  isNext ? 'border-primary/50 ring-1 ring-primary/20 shadow-lg shadow-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Step {idx + 1}
                      </span>
                      {isNext && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          <Sparkles className="w-3 h-3" /> Next up
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mt-0.5">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {CATEGORY_LABEL[item.category] ?? item.category} · {item.difficulty}
                      {item.estimated_minutes ? (
                        <span className="inline-flex items-center gap-1 ml-2">
                          <Clock className="w-3 h-3" /> {formatMinutes(item.estimated_minutes)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {/* Mastery bar (when there's evidence) */}
                {item.status !== 'locked' && (item.mastery > 0 || item.status === 'mastered') && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Mastery</span>
                      <span className="font-semibold text-foreground">{Math.round(item.mastery)}%</span>
                    </div>
                    <MasteryBar value={item.mastery} />
                    <ConfidenceMeter confidence={item.confidence} />
                  </div>
                )}

                <p className="text-sm text-muted-foreground mt-3">{item.reason}</p>

                {/* Blocking prereqs */}
                {item.status === 'locked' && item.blocking_prereqs.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Requires:</span>
                    {item.blocking_prereqs.map((p) => (
                      <span key={p} className="px-2 py-0.5 rounded-md bg-muted/40 border border-border text-foreground capitalize">
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action */}
                {item.route && item.status !== 'locked' && (
                  <div className="mt-4">
                    <Link
                      href={item.route}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
                    >
                      <PlayCircle className="w-4 h-4" />
                      {item.status === 'mastered' ? 'Revisit lab' : 'Open lab'}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {items.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">No topics match this filter.</p>
      )}
    </div>
  )
}

function RoadmapSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-32 rounded-2xl border border-border bg-card ml-9" />
      ))}
    </div>
  )
}
