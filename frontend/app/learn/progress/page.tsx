'use client'

/**
 * app/learn/progress/page.tsx — the Progress & Analytics view. Surfaces the full
 * /learn/progress summary: overall mastery ring, headline counts, a mastery-over-
 * time trend (recharts), a per-category bar breakdown, and the weak-concepts list.
 * Read-only analytics — the single source is the ProgressAnalytics service.
 */

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { useLearningStore } from '@/lib/learning-store'
import { ProgressRing, MasteryBar, CATEGORY_LABEL, formatMinutes } from '@/components/learn/primitives'
import {
  CheckCircle2,
  Loader2,
  Circle,
  Lock,
  Flame,
  Clock,
  TrendingUp,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'

export default function ProgressPage() {
  const { progress, error } = useLearningStore()

  if (error && !progress) {
    return <p className="text-center text-sm text-muted-foreground mt-16">Couldn&apos;t load analytics: {error}</p>
  }
  if (!progress) {
    return (
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="h-56 rounded-2xl border border-border bg-card" />
        <div className="lg:col-span-2 h-56 rounded-2xl border border-border bg-card" />
      </div>
    )
  }

  const trend = progress.mastery_over_time.map((p, i) => ({
    idx: i + 1,
    avg: Math.round(p.avg),
    score: Math.round(p.score),
    topic: p.topic,
  }))

  const catData = progress.category_breakdown.map((c) => ({
    name: CATEGORY_LABEL[c.category] ?? c.category,
    mastery: Math.round(c.avg_mastery),
    mastered: c.mastered,
    total: c.total,
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top row: ring + status counts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center">
          <ProgressRing value={progress.overall_mastery} size={150} sublabel="Overall Mastery" />
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <CountTile icon={CheckCircle2} tone="text-emerald-400" label="Mastered" value={progress.topics_mastered} />
          <CountTile icon={Loader2} tone="text-amber-400" label="In Progress" value={progress.topics_in_progress} />
          <CountTile icon={Circle} tone="text-sky-400" label="Available" value={progress.topics_available} />
          <CountTile icon={Lock} tone="text-muted-foreground" label="Locked" value={progress.topics_locked} />
          <CountTile icon={Flame} tone="text-amber-400" label="Streak" value={`${progress.study_streak_days}d`} />
          <CountTile icon={Clock} tone="text-primary" label="To Finish" value={formatMinutes(progress.completion_estimate_min)} />
        </div>
      </div>

      {/* Mastery over time */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" /> Mastery Over Time
        </h3>
        {trend.length > 1 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="masteryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis dataKey="idx" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} stroke="var(--border)" />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} stroke="var(--border)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'var(--popover-foreground)',
                }}
                labelFormatter={(l) => `Assessment #${l}`}
                formatter={((v: any, n: any) => [`${v}%`, n === 'avg' ? 'Running avg' : 'Score']) as any}
              />
              <Area type="monotone" dataKey="avg" stroke="var(--primary)" strokeWidth={2.5} fill="url(#masteryFill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Complete a few AI assessments to build your mastery trend." />
        )}
      </div>

      {/* Category breakdown chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-accent" /> Mastery by Category
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={catData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} stroke="var(--border)" />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} stroke="var(--border)" />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 12,
                color: 'var(--popover-foreground)',
              }}
              formatter={((v: any) => [`${v}%`, 'Avg mastery']) as any}
            />
            <Bar dataKey="mastery" radius={[6, 6, 0, 0]}>
              {catData.map((d, i) => (
                <Cell key={i} fill={d.mastery >= 70 ? 'var(--chart-3)' : d.mastery >= 30 ? '#fbbf24' : 'var(--primary)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weak concepts */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Weak Concepts
        </h3>
        {progress.weak_concepts.length ? (
          <ul className="space-y-4">
            {progress.weak_concepts.map((w) => (
              <li key={w.topic}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium capitalize text-foreground">{w.topic}</span>
                  <span className="text-muted-foreground">
                    {Math.round(w.mastery)}% · {w.attempts} attempt{w.attempts === 1 ? '' : 's'}
                  </span>
                </div>
                <MasteryBar value={w.mastery} />
                <p className="text-xs text-muted-foreground mt-1">{w.reason}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-sm text-muted-foreground">No weak concepts flagged. Solid work!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CountTile({ icon: Icon, tone, label, value }: { icon: any; tone: string; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-center">
      <Icon className={`w-5 h-5 ${tone}`} />
      <p className="text-2xl font-bold text-foreground mt-2 leading-none">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[240px] flex flex-col items-center justify-center text-center border border-dashed border-border/60 rounded-xl">
      <TrendingUp className="w-8 h-8 text-muted-foreground/50 mb-2" />
      <p className="text-sm text-muted-foreground max-w-xs">{label}</p>
    </div>
  )
}
