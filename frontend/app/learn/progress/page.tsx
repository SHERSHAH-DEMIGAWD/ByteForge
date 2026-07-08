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
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { useLearningStore } from '@/lib/learning-store'
import {
  ProgressRing,
  MasteryBar,
  SectionHeading,
  EmptyState,
  Skeleton,
  CATEGORY_LABEL,
  formatMinutes,
} from '@/components/learn/primitives'
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

// Professional, colour-blind-friendly palette (indigo / cyan / emerald / amber).
const CHART = {
  primary: 'var(--primary)',
  accent: 'var(--accent)',
  emerald: '#10b981',
  amber: '#f59e0b',
  sky: '#38bdf8',
}

const TOOLTIP_STYLE = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  fontSize: 12,
  color: 'var(--popover-foreground)',
  boxShadow: '0 8px 24px -8px rgba(0,0,0,0.25)',
} as const

export default function ProgressPage() {
  const { progress, error } = useLearningStore()

  if (error && !progress) {
    return <p className="text-center text-sm text-muted-foreground mt-16">Couldn&apos;t load analytics: {error}</p>
  }
  if (!progress) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-56" />
          <Skeleton className="lg:col-span-2 h-56" />
        </div>
        <Skeleton className="h-72" />
        <Skeleton className="h-64" />
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
        <div className="bf-card bf-rise p-6 flex flex-col items-center justify-center">
          <ProgressRing value={progress.overall_mastery} size={150} sublabel="Overall Mastery" />
          <p className="text-xs text-muted-foreground mt-4 text-center">
            {progress.topics_mastered} of {progress.topics_total} topics mastered
          </p>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <CountTile icon={CheckCircle2} tone="emerald" label="Mastered" value={progress.topics_mastered} delay="bf-stagger-1" />
          <CountTile icon={Loader2} tone="amber" label="In Progress" value={progress.topics_in_progress} delay="bf-stagger-2" />
          <CountTile icon={Circle} tone="sky" label="Available" value={progress.topics_available} delay="bf-stagger-3" />
          <CountTile icon={Lock} tone="muted" label="Locked" value={progress.topics_locked} delay="bf-stagger-4" />
          <CountTile icon={Flame} tone="amber" label="Streak" value={`${progress.study_streak_days}d`} delay="bf-stagger-5" />
          <CountTile icon={Clock} tone="primary" label="To Finish" value={formatMinutes(progress.completion_estimate_min)} delay="bf-stagger-6" />
        </div>
      </div>

      {/* Mastery over time */}
      <div className="bf-card bf-rise p-6">
        <SectionHeading icon={TrendingUp} iconClass="text-primary">
          Mastery Over Time
        </SectionHeading>
        {trend.length > 1 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="masteryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="idx"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                stroke="var(--border)"
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                stroke="var(--border)"
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(l) => `Assessment #${l}`}
                formatter={((v: any, n: any) => [`${v}%`, n === 'avg' ? 'Running average' : 'Assessment score']) as any}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={28}
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="avg"
                name="Running average"
                stroke={CHART.primary}
                strokeWidth={2.5}
                fill="url(#masteryFill)"
                animationDuration={900}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Assessment score"
                stroke={CHART.accent}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Complete a few AI assessments to build your mastery trend." />
        )}
      </div>

      {/* Category breakdown chart */}
      <div className="bf-card bf-rise p-6">
        <SectionHeading icon={BarChart3} iconClass="text-accent">
          Mastery by Category
        </SectionHeading>
        {catData.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={catData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="barMastered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.emerald} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={CHART.emerald} stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="barMid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.amber} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={CHART.amber} stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="barLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={CHART.primary} stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                stroke="var(--border)"
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                stroke="var(--border)"
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                contentStyle={TOOLTIP_STYLE}
                formatter={((v: any, _n: any, item: any) => [
                  `${v}% · ${item?.payload?.mastered}/${item?.payload?.total} mastered`,
                  'Avg mastery',
                ]) as any}
              />
              <Bar dataKey="mastery" radius={[8, 8, 0, 0]} animationDuration={800} maxBarSize={72}>
                {catData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.mastery >= 70 ? 'url(#barMastered)' : d.mastery >= 30 ? 'url(#barMid)' : 'url(#barLow)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="No category data yet." />
        )}
        {/* Manual legend for the threshold colours */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-xs">
          <ThresholdKey color={CHART.emerald} label="Strong (≥70%)" />
          <ThresholdKey color={CHART.amber} label="Developing (30–69%)" />
          <ThresholdKey color={CHART.primary} label="Needs work (<30%)" />
        </div>
      </div>

      {/* Weak concepts */}
      <div className="bf-card bf-rise p-6">
        <SectionHeading icon={AlertTriangle} iconClass="text-amber-500">
          Weak Concepts
        </SectionHeading>
        {progress.weak_concepts.length ? (
          <ul className="space-y-4">
            {progress.weak_concepts.map((w) => (
              <li key={w.topic}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium capitalize text-foreground">{w.topic}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {Math.round(w.mastery)}% · {w.attempts} attempt{w.attempts === 1 ? '' : 's'}
                  </span>
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
            title="No weak concepts flagged"
            hint="Solid work — every assessed topic is holding up well."
          />
        )}
      </div>
    </div>
  )
}

function CountTile({
  icon: Icon,
  tone,
  label,
  value,
  delay = '',
}: {
  icon: any
  tone: 'emerald' | 'amber' | 'sky' | 'primary' | 'muted'
  label: string
  value: string | number
  delay?: string
}) {
  const toneMap = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    sky: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    primary: 'text-primary bg-primary/10 border-primary/20',
    muted: 'text-muted-foreground bg-muted/40 border-border',
  }
  return (
    <div className={`bf-card bf-card-hover bf-rise ${delay} p-4 flex flex-col justify-center`}>
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${toneMap[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-foreground mt-2.5 leading-none tabular-nums">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function ThresholdKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
      {label}
    </span>
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
