'use client'

/**
 * app/learn/roadmap/page.tsx — the personalized, prerequisite-aware Learning
 * Roadmap. Renders the ordered items from /learn/roadmap as a vertical track:
 * each node shows status, mastery, the reason it's placed where it is, blocking
 * prerequisites when locked, and a deep-link into its interactive lab. A progress
 * overview header summarizes the whole journey and a filter bar lets the learner
 * focus by status.
 */

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useLearningStore } from '@/lib/learning-store'
import {
  StatusBadge,
  MasteryBar,
  ConfidenceMeter,
  DifficultyBadge,
  STATUS_META,
  CATEGORY_LABEL,
  formatMinutes,
  Skeleton,
} from '@/components/learn/primitives'
import type { SkillStatus } from '@/lib/learn-api'
import { ArrowRight, Lock, PlayCircle, Sparkles, Clock, Map as MapIcon, CheckCircle2 } from 'lucide-react'

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

  const stats = useMemo(() => {
    const all = roadmap?.items ?? []
    const by = (s: SkillStatus) => all.filter((i) => i.status === s).length
    const remainingMin = all
      .filter((i) => i.status !== 'mastered')
      .reduce((sum, i) => sum + (i.estimated_minutes ?? 0), 0)
    return {
      total: all.length,
      mastered: by('mastered'),
      inProgress: by('in_progress'),
      available: by('available'),
      locked: by('locked'),
      pct: all.length ? Math.round((by('mastered') / all.length) * 100) : 0,
      remainingMin,
    }
  }, [roadmap])

  if (error && !roadmap) {
    return <p className="text-center text-sm text-muted-foreground mt-16">Couldn&apos;t load roadmap: {error}</p>
  }

  if (!roadmap) {
    return <RoadmapSkeleton />
  }

  const nextTopic = roadmap.next_topic

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress overview */}
      <div className="bf-card bf-rise p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MapIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Your Learning Track</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.mastered} of {stats.total} topics mastered
                {stats.remainingMin > 0 && ` · ~${formatMinutes(stats.remainingMin)} of learning left`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold bf-gradient-text leading-none tabular-nums">{stats.pct}%</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">Complete</p>
          </div>
        </div>

        {/* Segmented progress bar */}
        <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-border/40">
          {stats.mastered > 0 && (
            <div className="bg-emerald-400 transition-all duration-700" style={{ width: `${(stats.mastered / stats.total) * 100}%` }} />
          )}
          {stats.inProgress > 0 && (
            <div className="bg-amber-400 transition-all duration-700" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }} />
          )}
          {stats.available > 0 && (
            <div className="bg-sky-400 transition-all duration-700" style={{ width: `${(stats.available / stats.total) * 100}%` }} />
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
          <LegendDot className="bg-emerald-400" label="Mastered" count={stats.mastered} />
          <LegendDot className="bg-amber-400" label="Current" count={stats.inProgress} />
          <LegendDot className="bg-sky-400" label="Available" count={stats.available} />
          <LegendDot className="bg-muted-foreground/50" label="Locked" count={stats.locked} />
        </div>
      </div>

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
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                {f.label} <span className="opacity-60 tabular-nums">{count}</span>
              </button>
            )
          })}
        </div>
        {isLoading && <span className="text-xs text-muted-foreground animate-pulse">Syncing…</span>}
      </div>

      {/* Track */}
      <ol className="relative ml-3 space-y-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400/40 before:via-primary/30 before:to-border/40">
        {items.map((item, idx) => {
          const meta = STATUS_META[item.status]
          const Icon = meta.icon
          const isNext = item.topic === nextTopic
          return (
            <li key={item.topic} className="ml-6 relative bf-rise">
              {/* Node dot */}
              <span
                className={`absolute -left-[2.1rem] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${meta.bg} ${meta.border} ${
                  isNext ? 'ring-4 ring-primary/15' : ''
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${meta.text} ${item.status === 'in_progress' ? 'animate-spin [animation-duration:3s]' : ''}`} />
              </span>

              <div
                className={`bf-card ${item.status !== 'locked' ? 'bf-card-hover' : ''} p-5 transition-all ${
                  isNext ? 'border-primary/50 ring-1 ring-primary/20 shadow-lg shadow-primary/10' : ''
                } ${item.status === 'locked' ? 'opacity-75' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Step {idx + 1}
                      </span>
                      {isNext && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3" /> Recommended next
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mt-1">{item.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        {CATEGORY_LABEL[item.category] ?? item.category}
                      </span>
                      <DifficultyBadge difficulty={item.difficulty} />
                      {item.estimated_minutes ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> {formatMinutes(item.estimated_minutes)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {/* Mastery bar (when there's evidence) */}
                {item.status !== 'locked' && (item.mastery > 0 || item.status === 'mastered') && (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Mastery</span>
                      <span className="font-semibold text-foreground tabular-nums">{Math.round(item.mastery)}%</span>
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
                    <span className="text-muted-foreground">Unlock by mastering:</span>
                    {item.blocking_prereqs.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-md bg-muted/40 border border-border text-foreground capitalize"
                      >
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
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all group ${
                        isNext
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/25'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {item.status === 'mastered' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <PlayCircle className="w-4 h-4" />
                      )}
                      {item.status === 'mastered' ? 'Revisit lab' : 'Open lab'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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

function LegendDot({ className, label, count }: { className: string; label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={`w-2.5 h-2.5 rounded-full ${className}`} />
      {label} <span className="font-semibold text-foreground tabular-nums">{count}</span>
    </span>
  )
}

function RoadmapSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-9 w-72" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-36 ml-9" />
      ))}
    </div>
  )
}
