'use client'

/**
 * app/real-world/whatsapp/page.tsx — Layer 3 experiential module:
 * "WhatsApp Message Compression → Huffman Coding".
 *
 * Story: messaging apps send billions of texts a day, so every byte counts.
 * Huffman coding gives frequent characters short bit-codes and rare characters
 * long ones, shrinking messages losslessly. Reuses the existing /compress backend
 * (huffman engine), lets the learner type their own message, then *plays the
 * encoder character-by-character* — watching the bitstream grow while comparing
 * each variable-length code against a flat 8-bit baseline.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  ModuleHero,
  Section,
  RealWorldIntro,
  AiExplanation,
  Challenge,
  Completion,
  DecisionPanel,
  StepPlayer,
  useStepPlayer,
} from '@/components/learn/experiential'
import { MessageSquare, Send, Zap, ArrowDownWideNarrow, Binary, WifiOff } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface HuffResult {
  original_size: number
  shannon_entropy: number
  algorithms: {
    huffman: {
      size: number
      ratio: number
      codebook: Record<string, string> // charCode(str) -> bits
    }
  }
}

const DEFAULT_MSG = 'see you soon! see you soon!'

export default function WhatsAppModule() {
  const [msg, setMsg] = useState(DEFAULT_MSG)
  const [encodedMsg, setEncodedMsg] = useState(DEFAULT_MSG)
  const [res, setRes] = useState<HuffResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(false)
  const [solved, setSolved] = useState(false)

  const run = async (text: string) => {
    if (!text.trim()) return
    setLoading(true)
    setErr(false)
    try {
      const r = await fetch(`${API}/compress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: text, algorithms: ['huffman'], mode: 'educational', is_base64: false }),
      })
      setRes(await r.json())
      setEncodedMsg(text)
    } catch {
      setErr(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    run(DEFAULT_MSG)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const huff = res?.algorithms.huffman

  const freq = useMemo(() => {
    const f: Record<string, number> = {}
    for (const ch of encodedMsg) f[ch] = (f[ch] ?? 0) + 1
    return f
  }, [encodedMsg])

  const codeFor = (ch: string) => huff?.codebook[String(ch.charCodeAt(0))] ?? ''

  const codeRows = useMemo(() => {
    if (!huff) return []
    return Object.entries(huff.codebook)
      .map(([code, bits]) => {
        const raw = String.fromCharCode(Number(code))
        return { raw, ch: raw === ' ' ? '␣' : raw, count: freq[raw] ?? 0, bits, len: bits.length }
      })
      .sort((a, b) => a.len - b.len || b.count - a.count)
  }, [huff, freq])

  // Per-character encode playback.
  const chars = useMemo(() => [...encodedMsg], [encodedMsg])
  const player = useStepPlayer(Math.max(chars.length, 1))
  // Reset playback whenever a fresh message is encoded.
  useEffect(() => {
    player.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [huff, encodedMsg])

  const step = player.idx
  const currentChar = chars[step] ?? ''
  const currentCode = codeFor(currentChar)
  const bitsSoFar = useMemo(
    () => chars.slice(0, step + 1).reduce((n, c) => n + (codeFor(c).length || 8), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chars, step, huff],
  )
  const baselineSoFar = (step + 1) * 8

  const originalBits = (res?.original_size ?? 0) * 8
  const huffBits = huff ? huff.size * 8 : 0
  const savedPct = originalBits ? Math.max(0, Math.round((1 - huffBits / originalBits) * 100)) : 0

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
      <ModuleHero
        brand="WhatsApp Message Compression"
        eyebrow="Messaging"
        title="Shrink Every Message, Lose Nothing"
        algorithm="Huffman Coding"
        blurb="Messaging platforms move billions of texts daily, so shaving bits off each one saves enormous bandwidth. Huffman coding assigns short binary codes to frequent characters and longer codes to rare ones — a lossless scheme that reconstructs your message character-for-character. Type a message and watch it encode."
        icon={MessageSquare}
        accent="from-emerald-500/20"
        problem="Plain text spends a flat 8 bits on every character — common and rare alike. On billions of messages that uniform cost is enormously wasteful."
        whyIndustry="Huffman (and its descendants in gzip, Brotli, and HTTP/2 HPACK) underpins the compression that keeps chat apps, web pages, and APIs fast and cheap. It's lossless, so not a single character is ever altered."
        facts={[
          'David Huffman invented it in 1952 as a student — beating his professor’s own method.',
          'Frequent letters like space and “e” get the shortest codes; rare ones get the longest.',
          'Codes are prefix-free, so the decoder never needs separators between characters.',
        ]}
      />

      <Section step={1} title="The real-world problem" subtitle="Not all characters are equally common">
        <RealWorldIntro
          points={[
            { label: 'Frequency', text: 'In real text a few characters (space, e, o) dominate.' },
            { label: 'Idea', text: 'Give common characters fewer bits, rare ones more.' },
            { label: 'Lossless', text: 'Prefix-free codes decode uniquely — nothing is lost.' },
          ]}
        />
      </Section>

      <Section step={2} title="Compose a message" subtitle="Type your own — the real Huffman engine encodes it live">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Your message</label>
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run(msg)}
              maxLength={140}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/60 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Type a WhatsApp message…"
            />
          </div>
          <button
            onClick={() => run(msg)}
            disabled={loading || !msg.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm shadow-primary/25"
          >
            <Send className="w-4 h-4" /> Compress
          </button>
        </div>

        {err ? (
          <div className="flex flex-col items-center justify-center py-8 text-center mt-4">
            <WifiOff className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Couldn&apos;t reach the compression service.</p>
          </div>
        ) : loading || !huff ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bf-skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <StatTile icon={Binary} label="Original" value={`${originalBits} bits`} tone="text-muted-foreground" />
            <StatTile icon={Zap} label="Huffman" value={`${huffBits} bits`} tone="text-emerald-500" />
            <StatTile icon={ArrowDownWideNarrow} label="Saved" value={`${savedPct}%`} tone="text-primary" />
            <StatTile icon={MessageSquare} label="Ratio" value={`${huff.ratio.toFixed(2)}×`} tone="text-accent" />
          </div>
        )}
      </Section>

      {huff && !loading && chars.length > 0 && (
        <Section step={3} title="Watch it encode, character by character" subtitle="The bitstream grows as each character is replaced by its code">
          <div className="space-y-4">
            {/* Chat bubble with per-char highlight */}
            <div className="flex justify-end">
              <div className="max-w-full rounded-2xl rounded-br-sm bg-emerald-500/15 border border-emerald-500/30 px-4 py-3">
                <div className="flex flex-wrap gap-0.5 font-mono text-sm">
                  {chars.map((c, i) => {
                    const done = i <= step
                    const active = i === step
                    return (
                      <span
                        key={i}
                        className={`px-0.5 rounded transition-all duration-200 ${
                          active
                            ? 'bg-primary text-primary-foreground font-bold'
                            : done
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-muted-foreground/40'
                        }`}
                      >
                        {c === ' ' ? ' ' : c}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            <StepPlayer player={player} label="Char" />

            <DecisionPanel
              state={
                <>
                  Encoded <b className="text-foreground">{step + 1}</b>/{chars.length} characters →{' '}
                  <b className="text-emerald-500">{bitsSoFar} bits</b> vs{' '}
                  <span className="text-muted-foreground">{baselineSoFar} bits</span> flat ASCII.
                </>
              }
              decision={
                <>
                  Emit the code for{' '}
                  <b className="text-foreground">“{currentChar === ' ' ? '␣ (space)' : currentChar}”</b> →{' '}
                  <code className="font-mono text-emerald-500">{currentCode || '—'}</code>
                </>
              }
              reasoning={
                <>
                  “{currentChar === ' ' ? '␣' : currentChar}” appears{' '}
                  <b className="text-foreground">{freq[currentChar] ?? 0}×</b> → {currentCode.length || 8} bits vs 8.{' '}
                  {currentCode.length < 8 ? (
                    <span className="text-emerald-500 font-medium">Saves {8 - currentCode.length} bits here.</span>
                  ) : (
                    <span className="text-muted-foreground">A rare character — pays a little more.</span>
                  )}
                </>
              }
            />

            {/* Growing bitstream */}
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Encoded bitstream</p>
              <div className="font-mono text-xs leading-relaxed break-all max-h-28 overflow-y-auto custom-scrollbar">
                {chars.slice(0, step + 1).map((c, i) => (
                  <span
                    key={i}
                    className={i === step ? 'bg-primary/20 text-primary rounded px-0.5' : 'text-emerald-600 dark:text-emerald-400'}
                  >
                    {codeFor(c) || '········'}
                  </span>
                ))}
                <span className="inline-block w-1.5 h-3.5 bg-primary/70 ml-0.5 align-middle animate-pulse" />
              </div>
            </div>
          </div>
        </Section>
      )}

      {huff && !loading && (
        <Section step={4} title="The generated codebook" subtitle="Shorter codes went to the most frequent characters">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {codeRows.map((r) => {
              const active = r.raw === currentChar
              return (
                <div
                  key={r.bits}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-all duration-200 ${
                    active ? 'border-primary/50 bg-primary/10 ring-1 ring-primary/20' : 'border-border bg-background/40'
                  }`}
                >
                  <span className="w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center font-mono font-bold text-foreground shrink-0">
                    {r.ch}
                  </span>
                  <div className="flex-1 min-w-0">
                    <code className="text-sm font-mono text-emerald-500">{r.bits}</code>
                    <span className="text-[11px] text-muted-foreground ml-2">
                      {r.len} bit{r.len === 1 ? '' : 's'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">×{r.count}</span>
                  <div className="w-16 h-2 rounded-full bg-border/40 overflow-hidden shrink-0">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (r.len / 8) * 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      <Section step={5} title="Why it works" subtitle="Straight from the AI tutor">
        <AiExplanation
          topic="huffman"
          question="Explain Huffman coding using the example of compressing WhatsApp text messages. In 4-5 sentences, cover why variable-length codes help, what a prefix-free code is, and how the Huffman tree is built from character frequencies."
          fallback="Huffman coding replaces fixed 8-bit characters with variable-length codes, giving the most frequent characters the shortest codes. It builds a binary tree by repeatedly merging the two least-frequent symbols, so rare characters end up deeper (longer codes) and common ones stay shallow (short codes). The resulting codes are prefix-free — no code is the start of another — which lets the decoder read the bitstream left to right and recover the exact original text. On typical messages this saves a meaningful fraction of bits with zero information loss."
        />
      </Section>

      <Section step={6} title="Your challenge" subtitle="Predict why prefix-free matters">
        <Challenge
          topic="huffman"
          spec={{
            prompt:
              'Why must Huffman codes be “prefix-free” (no code is a prefix of another), e.g. why can’t “e” = 0 and “o” = 01 coexist?',
            options: [
              'Otherwise the decoder can’t tell where one character’s code ends — “0…” is ambiguous.',
              'Because shorter codes must always be assigned to rarer characters.',
              'To keep every code exactly the same length as ASCII.',
              'Prefix-free is optional; it only makes files slightly smaller.',
            ],
            answerIndex: 0,
            explanation:
              'If “e”=0 and “o”=01, then reading “01” could mean “e then start of something” or “o”. Prefix-free codes remove that ambiguity, so the decoder can uniquely split the bitstream as it reads — which is exactly what the Huffman tree guarantees.',
          }}
          onSolved={() => setSolved(true)}
        />
      </Section>

      <Completion topic="huffman" title="Huffman Coding" score={100} visible={solved} />
    </div>
  )
}

function StatTile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${tone}`} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={`text-lg font-bold mt-1 tabular-nums ${tone}`}>{value}</p>
    </div>
  )
}
