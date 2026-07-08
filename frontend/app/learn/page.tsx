'use client'

/**
 * app/learn/page.tsx — the Layer 2 Learning Dashboard (the section's home).
 *
 * A single at-a-glance surface that answers "where am I, and what should I do
 * next?": overall mastery, a one-click Continue CTA (from /learn/resume), the top
 * recommendation, weak topics to shore up, quick counts, and a category
 * breakdown. Everything reads from `useLearningStore` (already hydrated by the
 * section layout) so the page paints instantly from cache and refreshes in the
 * background.
 */

import Link from 'next/link'
import { useLearningStore } from '@/lib/learning-store'
import {
  ProgressRing,
  MasteryBar,
  StatusBadge,
  CATEGORY_LABEL,
  formatMinutes,
} from '@/components/learn/primitives'
import {
  PlayCircle,
  Flame,
  Target,
  Clock,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  Layers,
  CheckCircle2,
} from 'lucide-react'

export default function LearningDashboard() {
  const { progress, resume, recommendations, isLoading, error } = useLearningStore()

  if (error && !progress) {
    return <OfflineState message={error} />
  }

  if (!progress) {
    return <LoadingState />
  }

  const overall = progress.overall_mastery
  const topRec = recommendations?.recommendations?.[0] ?? null
  const weak = progress.weak_concepts.slice(0, 3)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero: mastery ring + resume CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall mastery */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center">
          <ProgressRing value={overall} size={150} sublabel="Overall Mastery" />
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Derived from real assessment evidence across{' '}
            <span className="font-semibold text-foreground">{progress.topics_total}</span> topics.
          </p>
        </div>

        {/* Continue learning CTA (spans two cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5" /> Continue Learning
            </span>
            {resume?.next_topic ? (
              <>
                <h2 className="text-2xl font-bold mt-2 text-foreground">
                  {resume.next_title ?? resume.next_topic}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  {resume.next_reason}
                </p>
                {resume.last_topic && (
                  <p className="text-xs text-muted-foreground/70 mt-3">
                    Last touched: <span className="font-medium">{resume.last_topic}</span>
                    {resume.last_action ? ` · ${resume.last_action}` : ''}
                  </p>
                )}
              </>
            ) : (
              <h2 className="text-2xl font-bold mt-2 text-foreground">You&apos;re all caught up 🎉</h2>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <Link
              href={resume?.route ?? '/learn/roadmap'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <PlayCircle className="w-4 h-4" />
              {resume?.next_topic ? 'Resume Now' : 'Browse Roadmap'}
            </Link>
            <Link
              href="/learn/roadmap"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              Full Roadmap <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={CheckCircle2} label="Mastered" value={`${progress.topics_mastered}/${progress.topics_total}`} tone="emerald" />
        <StatTile icon={Target} label="Available Now" value={progress.topics_available} tone="sky" />
        <StatTile icon={Flame} label="Study Streak" value={`${progress.study_streak_days}d`} tone="amber" />
        <StatTile icon={Clock} label="Est. to Finish" value={formatMinutes(progress.completion_estimate_min)} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended next topic */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-accent" /> Recommended Next
          </h3>
          {topRec ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-lg text-foreground">{topRec.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {topRec.category ? CATEGORY_LABEL[topRec.category] ?? topRec.category : ''}
                  </p>
                </div>
                <StatusBadge status={topRec.status} />
              </div>
              <p className="text-sm text-muted-foreground">{topRec.reason}</p>
              <Link
                href={topRec.route ?? '/learn/recommendations'}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
              >
                Start this topic <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recommendations right now.</p>
          )}
        </div>

        {/* Weak topics */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Weak Topics
          </h3>
          {weak.length ? (
            <ul className="space-y-3">
              {weak.map((w) => (
                <li key={w.topic}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium capitalize text-foreground">{w.topic}</span>
                    <span className="text-muted-foreground">{Math.round(w.mastery)}%</span>
                  </div>
                  <MasteryBar value={w.mastery} />
                  <p className="text-xs text-muted-foreground mt-1">{w.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-sm text-muted-foreground">
                No weak spots yet — keep assessing topics to surface areas to review.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-primary" /> Mastery by Category
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {progress.category_breakdown.map((c) => (
            <div key={c.category} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">
                  {CATEGORY_LABEL[c.category] ?? c.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c.mastered}/{c.total} mastered
                </span>
              </div>
              <MasteryBar value={c.avg_mastery} />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Avg mastery {Math.round(c.avg_mastery)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <p className="text-center text-xs text-muted-foreground animate-pulse">Syncing latest evidence…</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small local pieces
// ---------------------------------------------------------------------------

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any
  label: string
  value: string | number
  tone: 'emerald' | 'sky' | 'amber' | 'primary'
}) {
  const toneMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    sky: 'text-sky-400 bg-sky-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    primary: 'text-primary bg-primary/10',
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneMap[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-56 rounded-2xl border border-border bg-card" />
        <div className="lg:col-span-2 h-56 rounded-2xl border border-border bg-card" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  )
}

function OfflineState({ message }: { message: string }) {
  return (
    <div className="max-w-xl mx-auto mt-16 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
      <h2 className="text-lg font-bold text-foreground">Couldn&apos;t reach the learning service</h2>
      <p className="text-sm text-muted-foreground mt-2">{message}</p>
      <p className="text-xs text-muted-foreground/70 mt-4">
        Make sure the API is running at{' '}
        <code className="font-mono">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</code>.
      </p>
    </div>
  )
}
