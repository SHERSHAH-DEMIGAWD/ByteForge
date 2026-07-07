'use client'

/**
 * components/learn/primitives.tsx — small, shared presentational pieces for the
 * Layer 2 learning UI (status colours, progress ring, mastery/confidence bars,
 * badges). Kept in one cohesive module so every learn page pulls from a single
 * visual vocabulary; each piece is a pure, prop-driven component with no data
 * fetching. Uses the app's existing Tailwind theme tokens (primary/accent/card/
 * border/muted-foreground) plus status-specific accent colours.
 */

import type { SkillStatus } from '@/lib/learn-api'
import { CheckCircle2, Circle, Lock, Loader2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Status vocabulary — one source of truth for colour + label + icon per status.
// ---------------------------------------------------------------------------

export const STATUS_META: Record<
  SkillStatus,
  { label: string; text: string; bg: string; border: string; ring: string; icon: any }
> = {
  mastered: {
    label: 'Mastered',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    ring: 'stroke-emerald-400',
    icon: CheckCircle2,
  },
  in_progress: {
    label: 'In Progress',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    ring: 'stroke-amber-400',
    icon: Loader2,
  },
  available: {
    label: 'Available',
    text: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    ring: 'stroke-sky-400',
    icon: Circle,
  },
  locked: {
    label: 'Locked',
    text: 'text-muted-foreground',
    bg: 'bg-muted/10',
    border: 'border-border',
    ring: 'stroke-muted-foreground',
    icon: Lock,
  },
}

export function StatusBadge({ status }: { status: SkillStatus }) {
  const m = STATUS_META[status]
  const Icon = m.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${m.text} ${m.bg} ${m.border}`}
    >
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Progress ring — an SVG donut for overall mastery / per-topic scores.
// ---------------------------------------------------------------------------

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  label,
  sublabel,
}: {
  value: number
  size?: number
  stroke?: number
  label?: string
  sublabel?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - clamped / 100)
  const color =
    clamped >= 70 ? 'stroke-emerald-400' : clamped >= 30 ? 'stroke-amber-400' : 'stroke-sky-400'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-border/40 fill-none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`fill-none transition-all duration-700 ${color}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{label ?? `${Math.round(clamped)}%`}</span>
        {sublabel && <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{sublabel}</span>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mastery + confidence bars.
// ---------------------------------------------------------------------------

export function MasteryBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  const color = clamped >= 70 ? 'bg-emerald-400' : clamped >= 30 ? 'bg-amber-400' : 'bg-sky-400'
  return (
    <div className="w-full h-2 rounded-full bg-border/40 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export function ConfidenceMeter({ confidence }: { confidence: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, confidence)) * 100)
  return (
    <div className="flex items-center gap-2" title={`Confidence: ${pct}%`}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</span>
      <div className="flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`w-1.5 h-3 rounded-sm ${pct >= (i + 1) * 20 ? 'bg-accent' : 'bg-border/50'}`} />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small helpers reused across pages.
// ---------------------------------------------------------------------------

export const CATEGORY_LABEL: Record<string, string> = {
  compression: 'Compression',
  sorting: 'Sorting',
  graph: 'Graph',
  'greedy-dp': 'Greedy / DP',
  strings: 'Strings',
}

export function formatMinutes(min: number): string {
  if (!min) return '0m'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}h ${m}m` : `${m}m`
}
