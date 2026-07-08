'use client'

/**
 * app/learn/page.tsx — the Layer 2 Learning Dashboard (the section's home).
 *
 * A single at-a-glance surface that answers "where am I, and what should I do
 * next?": overall mastery, a one-click Continue CTA (from /learn/resume), an AI
 * recommendation summary, the top recommendation, weak topics, recent activity,
 * headline stats (streak / estimated completion / progress), and a category
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
  SectionHeading,
  EmptyState,
  Skeleton,
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
  History,
  Sparkles,
  RotateCcw,
  Compass,
  TrendingUp,
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
  const recs = recommendations?.recommendations ?? []
  const topRec = recs[0] ?? null
  const reviewCount = recs.filter((r) => r.kind === 'review').length
  const exploreCount = recs.filter((r) => r.kind === 'explore').length
  const weak = progress.weak_concepts.slice(0, 3)
  const masteredPct = progress.topics_total
    ? Math.round((progress.topics_mastered / progress.topics_total) * 100)
    : 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero: mastery ring + resume CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall mastery */}
        <div className="bf-card bf-rise p-6 flex flex-col items-center justify-center text-center">
          <ProgressRing value={overall} size={150} sublabel="Overall Mastery" />
          <p className="text-xs text-muted-foreground mt-4">
            Derived from real assessment evidence across{' '}
            <span className="font-semibold text-foreground">{progress.topics_total}</span> topics.
          </p>
        </div>

        {/* Continue learning CTA (spans two cols) */}
        <div className="lg:col-span-2 bf-rise bf-stagger-1 relative overflow-hidden rounded-[var(--radius-xl)] border border-primary/30 bg-gradient-to-br from-primary/12 via-card to-card p-6 flex flex-col justify-between">
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5" /> Continue Learning
            </span>
            {resume?.next_topic ? (
              <>
                <h2 className="text-2xl font-bold mt-2 text-foreground">
                  {resume.next_title ?? resume.next_topic}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">{resume.next_reason}</p>
                {resume.last_topic && (
                  <p className="text-xs text-muted-foreground/70 mt-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Last touched <span className="font-medium capitalize">{resume.last_topic}</span>
                    {resume.last_action ? ` · ${resume.last_action}` : ''}
                  </p>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mt-2 text-foreground">You&apos;re all caught up 🎉</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  Every available topic is under way. Explore the roadmap to line up your next challenge.
                </p>
              </>
            )}
          </div>

          <div className="relative flex items-center gap-3 mt-6">
            <Link
              href={resume?.route ?? '/learn/roadmap'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 hover:gap-3 transition-all shadow-lg shadow-primary/25"
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
        <StatTile
          icon={CheckCircle2}
          label="Progress"
          value={`${progress.topics_mastered}/${progress.topics_total}`}
          tone="emerald"
          footer={<MasteryBar value={masteredPct} />}
          className="bf-stagger-2"
        />
        <StatTile
          icon={Target}
          label="Available Now"
          value={progress.topics_available}
          tone="sky"
          hint={`${progress.topics_in_progress} in progress`}
          className="bf-stagger-3"
        />
        <StatTile
          icon={Flame}
          label="Learning Streak"
          value={`${progress.study_streak_days}d`}
          tone="amber"
          hint={progress.study_streak_days > 0 ? 'Keep it alive!' : 'Assess a topic today'}
          className="bf-stagger-4"
        />
        <StatTile
          icon={Clock}
          label="Est. to Finish"
          value={formatMinutes(progress.completion_estimate_min)}
          tone="primary"
          hint={`~${formatMinutes(progress.time_spent_estimate_min)} invested`}
          className="bf-stagger-5"
        />
      </div>

      {/* AI recommendation summary — a synthesized, natural-language nudge */}
      <div className="bf-rise relative overflow-hidden rounded-[var(--radius-xl)] border border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card p-6">
        <div className="pointer-events-none absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">AI Recommendation Summary</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">
                Personalized
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              You&apos;re at{' '}
              <span className="font-semibold text-foreground">{Math.round(overall)}% overall mastery</span>
              {topRec ? (
                <>
                  {' '}— the highest-leverage next move is{' '}
                  <span className="font-semibold text-foreground">{topRec.title}</span>. {topRec.reason}
                </>
              ) : (
                <> — you&apos;ve covered the current catalogue. Revisit labs to deepen retention.</>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {reviewCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <RotateCcw className="w-3.5 h-3.5" /> {reviewCount} to review
                </span>
              )}
              {exploreCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-500 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-full">
                  <Compass className="w-3.5 h-3.5" /> {exploreCount} to explore
                </span>
              )}
              {weak.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> {progress.weak_concepts.length} weak spot
                  {progress.weak_concepts.length === 1 ? '' : 's'}
                </span>
              )}
              <Link
                href="/learn/recommendations"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:gap-2.5 transition-all ml-auto"
              >
                View all recommendations <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended next topic */}
        <div className="bf-card p-6">
          <SectionHeading icon={Lightbulb} iconClass="text-accent">
            Recommended Next
          </SectionHeading>
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
            <EmptyState
              icon={Lightbulb}
              title="No recommendations right now"
              hint="Assess a few more topics and we'll surface your best next step."
            />
          )}
        </div>

        {/* Weak topics */}
        <div className="bf-card p-6">
          <SectionHeading icon={AlertTriangle} iconClass="text-amber-500">
            Weak Topics
          </SectionHeading>
          {weak.length ? (
            <ul className="space-y-3.5">
              {weak.map((w) => (
                <li key={w.topic}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium capitalize text-foreground">{w.topic}</span>
                    <span className="text-muted-foreground tabular-nums">{Math.round(w.mastery)}%</span>
                  </div>
                  <MasteryBar value={w.mastery} />
                  <p className="text-xs text-muted-foreground mt-1.5">{w.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              tone="text-emerald-500"
              title="No weak spots yet"
              hint="Keep assessing topics to surface areas worth reviewing."
            />
          )}
        </div>
      </div>

      {/* Recent activity + category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="bf-card p-6">
          <SectionHeading icon={History} iconClass="text-sky-500">
            Recent Activity
          </SectionHeading>
          {resume?.last_topic ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <PlayCircle className="w-4 h-4 text-sky-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold capitalize text-foreground truncate">{resume.last_topic}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {resume.last_action ?? 'Viewed'}
                    {resume.last_ts ? ` · ${relativeTime(resume.last_ts)}` : ''}
                  </p>
                </div>
              </div>
              {resume.checkpoint && (
                <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Saved checkpoint
                  </p>
                  <p className="text-sm font-medium text-foreground capitalize mt-0.5">
                    {resume.checkpoint.topic}
                  </p>
                </div>
              )}
              <Link
                href="/learn/continue"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
              >
                Continue where you left off <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="No activity yet"
              hint="Open a lab and your recent steps will appear here."
            />
          )}
        </div>

        {/* Category breakdown */}
        <div className="bf-card p-6 lg:col-span-2">
          <SectionHeading icon={Layers} iconClass="text-primary">
            Mastery by Category
          </SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {progress.category_breakdown.map((c) => (
              <div
                key={c.category}
                className="rounded-xl border border-border/60 bg-background/40 p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    {CATEGORY_LABEL[c.category] ?? c.category}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {c.mastered}/{c.total}
                  </span>
                </div>
                <MasteryBar value={c.avg_mastery} />
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Avg mastery {Math.round(c.avg_mastery)}%
                </p>
              </div>
            ))}
          </div>
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
  hint,
  footer,
  className = '',
}: {
  icon: any
  label: string
  value: string | number
  tone: 'emerald' | 'sky' | 'amber' | 'primary'
  hint?: string
  footer?: React.ReactNode
  className?: string
}) {
  const toneMap = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    sky: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    primary: 'text-primary bg-primary/10 border-primary/20',
  }
  return (
    <div className={`bf-card bf-card-hover bf-rise p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-foreground leading-none tabular-nums">{value}</p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
        </div>
      </div>
      {footer && <div className="mt-3">{footer}</div>}
      {!footer && hint && <p className="text-[11px] text-muted-foreground mt-2.5">{hint}</p>}
    </div>
  )
}

/** Format an epoch timestamp (seconds or ms) as a compact "3h ago" string. */
function relativeTime(ts: number): string {
  const ms = ts < 1e12 ? ts * 1000 : ts
  const diff = Date.now() - ms
  if (diff < 0 || !Number.isFinite(diff)) return 'just now'
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function LoadingState() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-56" />
        <Skeleton className="lg:col-span-2 h-56" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-28" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    </div>
  )
}

function OfflineState({ message }: { message: string }) {
  return (
    <div className="max-w-xl mx-auto mt-16 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center bf-rise">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <h2 className="text-lg font-bold text-foreground">Couldn&apos;t reach the learning service</h2>
      <p className="text-sm text-muted-foreground mt-2">{message}</p>
      <p className="text-xs text-muted-foreground/70 mt-4">
        Make sure the API is running at{' '}
        <code className="font-mono">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</code>.
      </p>
    </div>
  )
}
