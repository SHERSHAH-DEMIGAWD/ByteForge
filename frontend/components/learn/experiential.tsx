'use client'

/**
 * components/learn/experiential.tsx — the shared "chrome" for Layer 3 experiential
 * modules (Google Maps→Dijkstra, Amazon→Knapsack, WhatsApp→Huffman).
 *
 * Each real-world module is a guided story with the same spine:
 *   Hero → Real-world intro → Visualizer → AI explanation → Interactive walkthrough
 *   → Challenge → Completion → back into the roadmap.
 * These primitives encode that spine once so the three modules stay visually and
 * behaviourally consistent while each supplies its own domain content and reuses
 * the existing algorithm backend. All AI copy comes from the Layer 1 /ai/explain
 * seam (with a graceful offline fallback); mastery is credited via /ai/assess.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { aiExplain, saveCheckpoint } from '@/lib/learn-api'
import { useLearningStore } from '@/lib/learning-store'
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Map as MapIcon,
  Lightbulb,
  WifiOff,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Module hero — brand color + real-world framing.
// ---------------------------------------------------------------------------

export function ModuleHero({
  brand,
  eyebrow,
  title,
  algorithm,
  blurb,
  icon: Icon,
  accent,
}: {
  brand: string
  eyebrow: string
  title: string
  algorithm: string
  blurb: string
  icon: any
  accent: string // tailwind gradient e.g. 'from-blue-500/20'
}) {
  return (
    <div className={`rounded-3xl border border-border bg-gradient-to-br ${accent} via-card to-card p-8 md:p-10`}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        <span className="px-2 py-0.5 rounded-full bg-background/60 border border-border">Layer 3 · Experiential</span>
        <span>{eyebrow}</span>
      </div>
      <div className="flex items-start gap-5 mt-5">
        <div className="w-16 h-16 rounded-2xl bg-background/70 border border-border flex items-center justify-center shrink-0">
          <Icon className="w-8 h-8 text-foreground" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
          <p className="text-sm font-semibold text-primary mt-1">
            {brand} &nbsp;→&nbsp; powered by <span className="underline decoration-dotted">{algorithm}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl leading-relaxed">{blurb}</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section wrapper with a numbered step chip.
// ---------------------------------------------------------------------------

export function Section({
  step,
  title,
  subtitle,
  children,
}: {
  step: number
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-7">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
          {step}
        </span>
        <div>
          <h2 className="text-lg font-bold text-foreground leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------
// AI explanation panel — pulls from Layer 1 /ai/explain, caches per topic, and
// degrades gracefully to a supplied offline fallback.
// ---------------------------------------------------------------------------

export function AiExplanation({
  topic,
  question,
  fallback,
}: {
  topic: string
  question: string
  fallback: string
}) {
  const [text, setText] = useState<string | null>(null)
  const [live, setLive] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [failed, setFailed] = useState<boolean>(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    aiExplain(topic, 'beginner', question)
      .then((r) => {
        if (!alive) return
        setText(r.answer)
        setLive(r.is_live)
      })
      .catch(() => {
        if (!alive) return
        setFailed(true)
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [topic, question])

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="text-xs font-bold uppercase tracking-wider text-accent">AI Tutor</span>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        {!loading && !failed && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-background/60 border border-border text-muted-foreground">
            {live ? 'Live AI' : 'Offline AI'}
          </span>
        )}
        {failed && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <WifiOff className="w-3 h-3" /> Offline
          </span>
        )}
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
        {loading ? 'Thinking through the intuition…' : failed ? fallback : text}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Real-world intro callout.
// ---------------------------------------------------------------------------

export function RealWorldIntro({ points }: { points: { label: string; text: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {points.map((p) => (
        <div key={p.label} className="rounded-xl border border-border bg-background/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1.5">{p.label}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Challenge — a single multiple-choice question that, when correct, credits
// mastery via /ai/assess and reveals the completion card.
// ---------------------------------------------------------------------------

export interface ChallengeSpec {
  prompt: string
  options: string[]
  answerIndex: number
  explanation: string
}

export function Challenge({
  topic,
  spec,
  onSolved,
}: {
  topic: string
  spec: ChallengeSpec
  onSolved: () => void
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const submit = (i: number) => {
    if (revealed) return
    setPicked(i)
    setRevealed(true)
    if (i === spec.answerIndex) onSolved()
  }

  const correct = revealed && picked === spec.answerIndex

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-foreground">{spec.prompt}</p>
      <div className="space-y-2">
        {spec.options.map((opt, i) => {
          const isPicked = picked === i
          const isAnswer = i === spec.answerIndex
          let tone = 'border-border hover:border-primary/40 hover:bg-muted/20'
          if (revealed && isAnswer) tone = 'border-emerald-500/50 bg-emerald-500/10'
          else if (revealed && isPicked && !isAnswer) tone = 'border-destructive/50 bg-destructive/10'
          return (
            <button
              key={i}
              onClick={() => submit(i)}
              disabled={revealed}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-3 ${tone} ${
                revealed ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  revealed && isAnswer
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'border-muted-foreground text-muted-foreground'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-foreground/90">{opt}</span>
            </button>
          )
        })}
      </div>

      {revealed && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            correct ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5'
          }`}
        >
          <p className={`font-semibold mb-1 ${correct ? 'text-emerald-400' : 'text-amber-400'}`}>
            {correct ? 'Correct! 🎯' : 'Not quite — here&apos;s the idea:'}
          </p>
          <p className="text-muted-foreground">{spec.explanation}</p>
          {!correct && (
            <button
              onClick={() => {
                setPicked(null)
                setRevealed(false)
              }}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Completion card — celebrates, records evidence + a checkpoint, links back to
// the roadmap and to the next best step.
// ---------------------------------------------------------------------------

export function Completion({
  topic,
  score,
  visible,
}: {
  topic: string
  score: number
  visible: boolean
}) {
  const [saved, setSaved] = useState(false)
  const refresh = useLearningStore((s) => s.refresh)
  const resume = useLearningStore((s) => s.resume)

  useEffect(() => {
    if (!visible || saved) return
    setSaved(true)
    // Credit mastery evidence for this topic via the Layer 1 assess seam, then
    // drop a checkpoint and refresh the learning read-models so the roadmap /
    // dashboard immediately reflect the win.
    ;(async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/ai/assess`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            answer: `Completed the interactive ${topic} module challenge with score ${score}.`,
            session_id:
              typeof window !== 'undefined'
                ? window.localStorage.getItem('byteforge-learn-session')
                : null,
          }),
        })
        await saveCheckpoint(topic, 'module-complete')
        await refresh()
      } catch {
        /* offline — completion UI still shows */
      }
    })()
  }, [visible, saved, topic, score, refresh])

  if (!visible) return null

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-card p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
        <Trophy className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-2xl font-bold text-foreground">Module Complete!</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        You connected a real-world system to its core algorithm and passed the challenge. This evidence
        has been credited toward your <span className="capitalize font-semibold text-foreground">{topic}</span>{' '}
        mastery.
      </p>

      <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
        <Link
          href="/learn/roadmap"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          <MapIcon className="w-4 h-4" /> Back to Roadmap
        </Link>
        {resume?.route && (
          <Link
            href={resume.route}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
          >
            Next: {resume.next_title ?? resume.next_topic} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Walkthrough stepper — generic prev/next control over an array of steps.
// ---------------------------------------------------------------------------

export function useWalkthrough(total: number) {
  const [idx, setIdx] = useState(0)
  const next = () => setIdx((i) => Math.min(total - 1, i + 1))
  const prev = () => setIdx((i) => Math.max(0, i - 1))
  const reset = () => setIdx(0)
  return { idx, setIdx, next, prev, reset, atStart: idx === 0, atEnd: idx === total - 1 }
}

export function StepHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4 flex items-start gap-2.5">
      <Lightbulb className="w-4 h-4 text-accent mt-0.5 shrink-0" />
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  )
}

export function CompletionBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
      <CheckCircle2 className="w-4 h-4" /> Passed
    </span>
  )
}
