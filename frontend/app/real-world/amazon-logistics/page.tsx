'use client'

/**
 * app/real-world/amazon-logistics/page.tsx — Layer 3 experiential module:
 * "Amazon Logistics → 0/1 Knapsack".
 *
 * Story: a delivery van has a fixed weight capacity and a set of packages, each
 * with a weight (kg) and a value (delivery priority / revenue). Which subset
 * maximizes value without exceeding capacity? That's 0/1 Knapsack. Reuses the
 * existing /knapsack backend, visualizes the DP table fill, shows which packages
 * the optimal plan loads, and contrasts it with a greedy value/weight heuristic.
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
import { Package, Truck, Weight, Sparkles, Boxes } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Item {
  name: string
  weight: number
  value: number
}

// A friendly, "Amazon warehouse" set of packages.
const ITEMS: Item[] = [
  { name: 'Laptop', weight: 3, value: 10 },
  { name: 'Headphones', weight: 1, value: 4 },
  { name: 'Coffee Maker', weight: 4, value: 9 },
  { name: 'Textbooks', weight: 5, value: 8 },
  { name: 'Sneakers', weight: 2, value: 5 },
]
const CAPACITY = 8

interface KnapResult {
  dp: {
    max_value: number
    selected_indices: number[]
    dp_matrix: number[][]
  }
  greedy: { max_value: number }
}

export default function AmazonLogisticsModule() {
  const [res, setRes] = useState<KnapResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(false)
  const [solved, setSolved] = useState(false)
  const [hoverCell, setHoverCell] = useState<{ i: number; w: number } | null>(null)

  useEffect(() => {
    fetch(`${API}/knapsack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weights: ITEMS.map((i) => i.weight),
        values: ITEMS.map((i) => i.value),
        capacity: CAPACITY,
      }),
    })
      .then((r) => r.json())
      .then((d) => setRes(d))
      .catch(() => setErr(true))
      .finally(() => setLoading(false))
  }, [])

  const selected = useMemo(() => new Set(res?.dp.selected_indices ?? []), [res])
  const loadedWeight = useMemo(
    () => ITEMS.filter((_, i) => selected.has(i)).reduce((s, it) => s + it.weight, 0),
    [selected],
  )

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
      <ModuleHero
        brand="Amazon Logistics"
        eyebrow="Fulfillment"
        title="Load the Delivery Van"
        algorithm="0/1 Knapsack (Dynamic Programming)"
        blurb="A delivery van leaves the warehouse with a strict weight limit. Each package has a weight and a business value (priority × revenue). You can either load a package whole or leave it — no fractions. Choosing the highest-value subset that fits is the classic 0/1 Knapsack problem."
        icon={Truck}
        accent="from-amber-500/20"
      />

      <Section step={1} title="The real-world problem" subtitle="Capacity vs. value, one indivisible package at a time">
        <RealWorldIntro
          points={[
            { label: 'Capacity', text: `The van holds at most ${CAPACITY} kg this trip.` },
            { label: '0/1 rule', text: 'Each package is loaded whole or skipped — you can’t ship half a laptop.' },
            { label: 'Objective', text: 'Maximize total delivery value carried on this run.' },
          ]}
        />
      </Section>

      <Section step={2} title="The packages" subtitle="Optimal load computed by the real /knapsack backend">
        {loading ? (
          <div className="h-40 rounded-xl border border-border bg-background/40 animate-pulse" />
        ) : err ? (
          <p className="text-sm text-muted-foreground">Couldn&apos;t reach the knapsack service.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ITEMS.map((it, i) => {
                const inPlan = selected.has(i)
                return (
                  <div
                    key={it.name}
                    className={`rounded-xl border p-4 transition-all ${
                      inPlan ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-border bg-background/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className={`w-4 h-4 ${inPlan ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                        <span className="font-semibold text-foreground">{it.name}</span>
                      </div>
                      {inPlan && <span className="text-[10px] font-bold uppercase text-emerald-400">Loaded</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Weight className="w-3 h-3" /> {it.weight} kg
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> value {it.value}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {res && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SummaryTile icon={Boxes} label="Optimal value (DP)" value={res.dp.max_value} tone="text-emerald-400" />
                <SummaryTile icon={Weight} label="Weight loaded" value={`${loadedWeight} / ${CAPACITY} kg`} tone="text-primary" />
                <SummaryTile
                  icon={Sparkles}
                  label="Greedy heuristic"
                  value={res.greedy.max_value}
                  tone="text-amber-400"
                  hint="value/weight order"
                />
              </div>
            )}
          </>
        )}
      </Section>

      {res && (
        <Section step={3} title="Inside the DP table" subtitle="Rows = packages considered · Columns = remaining capacity">
          <StepHint>
            Each cell answers: “using only the first <i>i</i> packages and a van of capacity <i>w</i>, what&apos;s the
            best value?” Hover a cell — the highlighted row/column shows the sub-problem it solves. The bottom-right
            cell is the answer: <b className="text-foreground">{res.dp.max_value}</b>.
          </StepHint>
          <div className="overflow-x-auto mt-4 custom-scrollbar">
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-1.5 text-muted-foreground font-medium sticky left-0 bg-card">item \ cap</th>
                  {Array.from({ length: CAPACITY + 1 }, (_, w) => (
                    <th key={w} className="p-1.5 text-center text-muted-foreground font-medium w-9">
                      {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {res.dp.dp_matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="p-1.5 text-right font-medium text-foreground/80 whitespace-nowrap sticky left-0 bg-card">
                      {i === 0 ? '∅' : ITEMS[i - 1]?.name}
                    </td>
                    {row.map((cell, w) => {
                      const isAnswer = i === res.dp.dp_matrix.length - 1 && w === CAPACITY
                      const active =
                        hoverCell && (hoverCell.i === i || hoverCell.w === w) && hoverCell.i >= i && hoverCell.w >= w
                      return (
                        <td
                          key={w}
                          onMouseEnter={() => setHoverCell({ i, w })}
                          onMouseLeave={() => setHoverCell(null)}
                          className={`p-1.5 text-center border border-border/40 transition-colors ${
                            isAnswer
                              ? 'bg-emerald-500/25 text-emerald-300 font-bold'
                              : active
                              ? 'bg-primary/15 text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {cell}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section step={4} title="Why not just be greedy?" subtitle="Straight from the AI tutor">
        <AiExplanation
          topic="knapsack"
          question="Explain the 0/1 Knapsack problem using an Amazon delivery van with a weight limit. In 4-5 sentences, explain why a greedy value-per-kg strategy can be suboptimal and why dynamic programming guarantees the best packing."
          fallback="Greedy packing sorts packages by value-per-kilogram and grabs the best ratio first, but because packages are indivisible it can waste capacity and miss a better combination. 0/1 Knapsack instead builds a table of the best achievable value for every (package-prefix, capacity) pair. Each cell chooses the better of skipping the current package or taking it plus the best solution for the leftover capacity. This considers all valid combinations implicitly, so the final cell is provably optimal — something the greedy shortcut can't promise."
        />
      </Section>

      <Section step={5} title="Your challenge" subtitle="Reason about the trade-off">
        <Challenge
          topic="knapsack"
          spec={{
            prompt:
              'A van fits 4 kg. Package X is 3 kg / value 6. Packages Y and Z are each 2 kg / value 5. A greedy “highest value first” loader grabs X. What does the optimal 0/1 knapsack do, and why?',
            options: [
              'Loads Y + Z for value 10 — two smaller packages beat the single high-value one.',
              'Loads X alone for value 6 — it has the highest single value.',
              'Loads X + Y for value 11 — it ignores the weight limit.',
              'Loads all three; 0/1 knapsack allows overflow.',
            ],
            answerIndex: 0,
            explanation:
              'Y + Z weigh 4 kg (exactly fits) for value 10, beating X alone (value 6). Greedy grabbing the single highest-value item wastes the remaining 1 kg. DP explores the “skip X, take Y and Z” branch and wins.',
          }}
          onSolved={() => setSolved(true)}
        />
      </Section>

      <Completion topic="knapsack" score={100} visible={solved} />
    </div>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: any
  label: string
  value: string | number
  tone: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${tone}`} />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  )
}
