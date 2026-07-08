'use client'

/**
 * components/learn/experiential.tsx — the shared "chrome" for Layer 3 experiential
 * modules (Google Maps→Dijkstra, Amazon→Knapsack, WhatsApp→Huffman).
 *
 * Each real-world module is a guided, *playable* story with the same spine:
 *   Hero (problem · why industry · facts) → Real-world intro → Animated visualizer
 *   with transport controls → Per-step decision panel → AI explanation → Predict
 *   challenge → Completion (mastered · unlocked topics · next step).
 * These primitives encode that spine once so the three modules stay visually and
 * behaviourally consistent while each supplies its own domain content and reuses
 * the existing algorithm backend. All AI copy comes from the Layer 1 /ai/explain
 * seam (with a graceful offline fallback); mastery is credited via /ai/assess.
 */

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
  Layers,
  GitBranch,
  Zap,
  Unlock,
  Target,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Module hero — brand colour + real-world framing, the "why this matters".
// ---------------------------------------------------------------------------

export function ModuleHero({
  brand,
  eyebrow,
  title,
  algorithm,
  blurb,
  icon: Icon,
  accent,
  problem,
  whyIndustry,
  facts,
}: {
  brand: string
  eyebrow: string
  title: string
  algorithm: string
  blurb: string
  icon: any
  accent: string // tailwind gradient e.g. 'from-blue-500/20'
  problem?: string
  whyIndustry?: string
  facts?: string[]
}) {
  return (
    <div
      className={`bf-rise relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br ${accent} via-card to-card p-8 md:p-10`}
    >
      <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <span className="px-2 py-0.5 rounded-full bg-background/60 border border-border">Layer 3 · Experiential</span>
          <span>{eyebrow}</span>
        </div>
        <div className="flex items-start gap-5 mt-5">
          <div className="w-16 h-16 rounded-2xl bg-background/70 border border-border flex items-center justify-center shrink-0 shadow-sm">
            <Icon className="w-8 h-8 text-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">{title}</h1>
            <p className="text-sm font-semibold text-primary mt-1.5">
              {brand} &nbsp;→&nbsp; powered by <span className="underline decoration-dotted">{algorithm}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl leading-relaxed">{blurb}</p>
          </div>
        </div>

        {(problem || whyIndustry) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
            {problem && (
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-1.5">
                  <Target className="w-3.5 h-3.5" /> The problem
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{problem}</p>
              </div>
            )}
            {whyIndustry && (
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5 mb-1.5">
                  <Zap className="w-3.5 h-3.5" /> Why industry relies on it
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{whyIndustry}</p>
              </div>
            )}
          </div>
        )}

        {facts && facts.length > 0 && (
          <div className="mt-4 rounded-xl border border-accent/25 bg-accent/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Did you know?
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {facts.map((f, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
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
    <section className="bf-card bf-rise p-6 md:p-7">
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
      {loading ? (
        <div className="space-y-2">
          <div className="bf-skeleton h-3.5 rounded w-full" />
          <div className="bf-skeleton h-3.5 rounded w-11/12" />
          <div className="bf-skeleton h-3.5 rounded w-4/5" />
        </div>
      ) : (
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{failed ? fallback : text}</p>
      )}
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
        <div key={p.label} className="rounded-xl border border-border bg-background/40 p-4 hover:border-primary/30 transition-colors">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1.5">{p.label}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step player — playable trace controls (play/pause, prev/next, reset, speed)
// with a clickable scrubber. The single source of animation across all modules.
// ---------------------------------------------------------------------------

const SPEEDS = [
  { label: '0.5×', mult: 0.5 },
  { label: '1×', mult: 1 },
  { label: '2×', mult: 2 },
] as const

export function useStepPlayer(total: number) {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const idxRef = useRef(idx)
  idxRef.current = idx

  useEffect(() => {
    if (!playing || total <= 1) return
    const t = setInterval(() => {
      setIdx((prev) => {
        if (prev >= total - 1) {
          setPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1200 / speed)
    return () => clearInterval(t)
  }, [playing, total, speed])

  // Keep the index valid if the underlying trace length changes.
  useEffect(() => {
    setIdx((i) => Math.min(i, Math.max(0, total - 1)))
  }, [total])

  const play = useCallback(() => {
    setIdx((i) => (i >= total - 1 ? 0 : i))
    setPlaying(true)
  }, [total])
  const pause = useCallback(() => setPlaying(false), [])
  const toggle = useCallback(() => setPlaying((p) => {
    if (!p && idxRef.current >= total - 1) setIdx(0)
    return !p
  }), [total])
  const next = useCallback(() => {
    setPlaying(false)
    setIdx((i) => Math.min(total - 1, i + 1))
  }, [total])
  const prev = useCallback(() => {
    setPlaying(false)
    setIdx((i) => Math.max(0, i - 1))
  }, [])
  const reset = useCallback(() => {
    setPlaying(false)
    setIdx(0)
  }, [])
  const goTo = useCallback(
    (i: number) => {
      setPlaying(false)
      setIdx(Math.max(0, Math.min(total - 1, i)))
    },
    [total],
  )

  return {
    idx,
    total,
    playing,
    speed,
    setSpeed,
    play,
    pause,
    toggle,
    next,
    prev,
    reset,
    goTo,
    atStart: idx === 0,
    atEnd: idx === total - 1,
  }
}

export type StepPlayerApi = ReturnType<typeof useStepPlayer>

export function StepPlayer({ player, label }: { player: StepPlayerApi; label?: string }) {
  const { idx, total, playing, speed, setSpeed, toggle, next, prev, reset, goTo, atStart, atEnd } = player
  const pct = total > 1 ? (idx / (total - 1)) * 100 : 0

  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={toggle}
          title={playing ? 'Pause' : 'Play'}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/25"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
        </button>
        <button
          onClick={prev}
          disabled={atStart}
          title="Previous step"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border disabled:opacity-40 hover:bg-muted/40 transition-all"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={next}
          disabled={atEnd}
          title="Next step"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border disabled:opacity-40 hover:bg-muted/40 transition-all"
        >
          <SkipForward className="w-4 h-4" />
        </button>
        <button
          onClick={reset}
          title="Reset to start"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted/40 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 ml-auto" title="Playback speed">
          <Gauge className="w-4 h-4 text-muted-foreground mr-0.5" />
          {SPEEDS.map((s) => (
            <button
              key={s.label}
              onClick={() => setSpeed(s.mult)}
              className={`px-2 py-1 rounded-md text-xs font-semibold border transition-all ${
                speed === s.mult
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrubber */}
      <div className="mt-3 flex items-center gap-3">
        <div className="relative flex-1 h-2 group">
          <div className="absolute inset-0 rounded-full bg-border/50" />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={Math.max(0, total - 1)}
            value={idx}
            onChange={(e) => goTo(Number(e.target.value))}
            aria-label="Scrub steps"
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background shadow transition-all duration-200"
            style={{ left: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
          {label ? `${label} ` : 'Step '}
          {Math.min(idx + 1, total)}/{total}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Decision panel — the "current state · decision · reasoning" narration synced
// to the active step. Turns a visualizer into a taught walkthrough.
// ---------------------------------------------------------------------------

export function DecisionPanel({
  state,
  decision,
  reasoning,
}: {
  state: React.ReactNode
  decision: React.ReactNode
  reasoning: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <DecisionCell icon={Layers} tone="text-sky-500" bg="bg-sky-500/10" border="border-sky-500/20" label="Current state">
        {state}
      </DecisionCell>
      <DecisionCell icon={GitBranch} tone="text-primary" bg="bg-primary/10" border="border-primary/20" label="Algorithm decision">
        {decision}
      </DecisionCell>
      <DecisionCell icon={Lightbulb} tone="text-accent" bg="bg-accent/10" border="border-accent/20" label="Why">
        {reasoning}
      </DecisionCell>
    </div>
  )
}

function DecisionCell({
  icon: Icon,
  tone,
  bg,
  border,
  label,
  children,
}: {
  icon: any
  tone: string
  bg: string
  border: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl border bg-background/40 p-4 ${border}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-6 h-6 rounded-md flex items-center justify-center ${bg}`}>
          <Icon className={`w-3.5 h-3.5 ${tone}`} />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm text-foreground/90 leading-relaxed">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Challenge — a "predict the outcome" question that, when correct, credits
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
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-1.5">
          <Target className="w-3.5 h-3.5" /> Predict the outcome
        </p>
        <p className="text-sm font-medium text-foreground">{spec.prompt}</p>
      </div>
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
                    : revealed && isPicked
                    ? 'bg-destructive text-white border-destructive'
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
          className={`bf-fade-in rounded-xl border p-4 text-sm ${
            correct ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5'
          }`}
        >
          <p className={`font-semibold mb-1 flex items-center gap-1.5 ${correct ? 'text-emerald-500' : 'text-amber-500'}`}>
            {correct ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Correct — nicely reasoned!
              </>
            ) : (
              <>Not quite — here&apos;s the idea:</>
            )}
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
// Completion card — celebrates, records evidence + a checkpoint, surfaces the
// topics this unlocks, and links to the next best step.
// ---------------------------------------------------------------------------

export function Completion({
  topic,
  title,
  score,
  visible,
}: {
  topic: string
  title?: string
  score: number
  visible: boolean
}) {
  const [saved, setSaved] = useState(false)
  const refresh = useLearningStore((s) => s.refresh)
  const resume = useLearningStore((s) => s.resume)
  const skillGraph = useLearningStore((s) => s.skillGraph)

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
              typeof window !== 'undefined' ? window.localStorage.getItem('byteforge-learn-session') : null,
          }),
        })
        await saveCheckpoint(topic, 'module-complete')
        await refresh()
      } catch {
        /* offline — completion UI still shows */
      }
    })()
  }, [visible, saved, topic, score, refresh])

  // Topics unlocked by mastering this one = graph edges [topic → dependent].
  const unlocked = (skillGraph?.edges ?? [])
    .filter(([from]) => from === topic)
    .map(([, to]) => skillGraph?.nodes.find((n) => n.topic === to))
    .filter((n): n is NonNullable<typeof n> => Boolean(n))

  if (!visible) return null

  return (
    <div className="bf-rise relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-card p-8 text-center">
      <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">Module Complete! 🎉</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          You connected a real-world system to its core algorithm and passed the challenge.
        </p>

        <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-sm font-semibold text-emerald-500">
          <CheckCircle2 className="w-4 h-4" /> Concept mastered:{' '}
          <span className="capitalize">{title ?? topic}</span>
        </div>

        {unlocked.length > 0 && (
          <div className="mt-6 max-w-md mx-auto">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1.5 mb-2">
              <Unlock className="w-3.5 h-3.5 text-emerald-500" /> This unlocks
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {unlocked.map((n) => (
                <Link
                  key={n.topic}
                  href={n.route ?? '/learn/roadmap'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/60 border border-border text-xs font-medium text-foreground hover:border-primary/40 hover:bg-muted/30 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-accent" /> {n.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mt-7 flex-wrap">
          <Link
            href="/learn/roadmap"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm shadow-primary/25"
          >
            <MapIcon className="w-4 h-4" /> Back to Roadmap
          </Link>
          {resume?.route && (
            <Link
              href={resume.route}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all group"
            >
              Next: {resume.next_title ?? resume.next_topic}{' '}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Legacy stepper (kept for compatibility) + small shared bits.
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
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
      <CheckCircle2 className="w-4 h-4" /> Passed
    </span>
  )
}
