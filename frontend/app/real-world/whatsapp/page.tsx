'use client'

/**
 * app/real-world/whatsapp/page.tsx — Layer 3 experiential module:
 * "WhatsApp Message Compression → Huffman Coding".
 *
 * Story: messaging apps send billions of texts a day, so every byte counts.
 * Huffman coding gives frequent characters short bit-codes and rare characters
 * long ones, shrinking messages losslessly. Reuses the existing /compress backend
 * (huffman engine), lets the learner type their own message, and visualizes the
 * generated codebook, per-character bit savings, and the overall ratio.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  ModuleHero,
  Section,
  RealWorldIntro,
  AiExplanation,
  Challenge,
  Completion,
  StepHint,
} from '@/components/learn/experiential'
import { MessageSquare, Send, Zap, ArrowDownWideNarrow, Binary } from 'lucide-react'

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

  const freq = useMemo(() => {
    const f: Record<string, number> = {}
    for (const ch of msg) f[ch] = (f[ch] ?? 0) + 1
    return f
  }, [msg])

  const huff = res?.algorithms.huffman
  const codeRows = useMemo(() => {
    if (!huff) return []
    return Object.entries(huff.codebook)
      .map(([code, bits]) => {
        const ch = String.fromCharCode(Number(code))
        return { ch: ch === ' ' ? '␣' : ch, count: freq[ch] ?? 0, bits, len: bits.length }
      })
      .sort((a, b) => a.len - b.len || b.count - a.count)
  }, [huff, freq])

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
        blurb="Messaging platforms move billions of texts daily, so shaving bits off each one saves enormous bandwidth. Huffman coding assigns short binary codes to frequent characters and longer codes to rare ones — a lossless scheme that reconstructs your message character-for-character."
        icon={MessageSquare}
        accent="from-emerald-500/20"
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

      <Section step={2} title="Compress a message" subtitle="Type your own — the real Huffman engine encodes it live">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Your message</label>
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run(msg)}
              maxLength={140}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/60 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Type a WhatsApp message…"
            />
          </div>
          <button
            onClick={() => run(msg)}
            disabled={loading || !msg.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4" /> Compress
          </button>
        </div>

        {err ? (
          <p className="text-sm text-muted-foreground mt-4">Couldn&apos;t reach the compression service.</p>
        ) : loading || !huff ? (
          <div className="h-24 rounded-xl border border-border bg-background/40 animate-pulse mt-4" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <StatTile icon={Binary} label="Original" value={`${originalBits} bits`} tone="text-muted-foreground" />
            <StatTile icon={Zap} label="Huffman" value={`${huffBits} bits`} tone="text-emerald-400" />
            <StatTile icon={ArrowDownWideNarrow} label="Saved" value={`${savedPct}%`} tone="text-primary" />
            <StatTile icon={MessageSquare} label="Ratio" value={`${huff.ratio.toFixed(2)}×`} tone="text-accent" />
          </div>
        )}
      </Section>

      {huff && !loading && (
        <Section step={3} title="The generated codebook" subtitle="Shorter codes went to the most frequent characters">
          <StepHint>
            Notice the pattern: the characters you used most got the <b className="text-foreground">shortest</b> bit
            codes. That&apos;s the whole trick — and because no code is a prefix of another, the decoder never gets
            confused.
          </StepHint>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {codeRows.map((r) => (
              <div
                key={r.bits}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
              >
                <span className="w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center font-mono font-bold text-foreground">
                  {r.ch}
                </span>
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-mono text-emerald-400">{r.bits}</code>
                  <span className="text-[11px] text-muted-foreground ml-2">
                    {r.len} bit{r.len === 1 ? '' : 's'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">×{r.count}</span>
                {/* bit-length bar */}
                <div className="w-16 h-2 rounded-full bg-border/40 overflow-hidden shrink-0">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${Math.min(100, (r.len / 8) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section step={4} title="Why it works" subtitle="Straight from the AI tutor">
        <AiExplanation
          topic="huffman"
          question="Explain Huffman coding using the example of compressing WhatsApp text messages. In 4-5 sentences, cover why variable-length codes help, what a prefix-free code is, and how the Huffman tree is built from character frequencies."
          fallback="Huffman coding replaces fixed 8-bit characters with variable-length codes, giving the most frequent characters the shortest codes. It builds a binary tree by repeatedly merging the two least-frequent symbols, so rare characters end up deeper (longer codes) and common ones stay shallow (short codes). The resulting codes are prefix-free — no code is the start of another — which lets the decoder read the bitstream left to right and recover the exact original text. On typical messages this saves a meaningful fraction of bits with zero information loss."
        />
      </Section>

      <Section step={5} title="Your challenge" subtitle="Reason about prefix-free codes">
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

      <Completion topic="huffman" score={100} visible={solved} />
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
      <p className={`text-lg font-bold mt-1 ${tone}`}>{value}</p>
    </div>
  )
}
