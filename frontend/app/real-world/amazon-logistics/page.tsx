'use client'

/**
 * app/real-world/amazon-logistics/page.tsx — Layer 3 experiential module:
 * "Amazon Logistics → 0/1 Knapsack".
 *
 * Story: a delivery van has a fixed weight capacity and a set of packages, each
 * with a weight (kg) and a value (delivery priority / revenue). Which subset
 * maximizes value without exceeding capacity? That's 0/1 Knapsack. Reuses the
 * existing /knapsack backend and *plays back* the dynamic-programming table one
 * package-row at a time — highlighting exactly which capacities each package
 * improves — before revealing the optimal van load and contrasting it with a
 * greedy value/weight heuristic.
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
import { Package, Truck, Weight, Sparkles, Boxes, WifiOff, Check } from 'lucide-react'

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

  const matrix = res?.dp.dp_matrix ?? []
  const player = useStepPlayer(Math.max(matrix.length, 1))
  const row = player.idx // rows 0..n revealed; active row = player.idx
  const finished = player.atEnd

  const selected = useMemo(() => new Set(res?.dp.selected_indices ?? []), [res])
  const loadedWeight = useMemo(
    () => ITEMS.filter((_, i) => selected.has(i)).reduce((s, it) => s + it.weight, 0),
    [selected],
  )

  // Which capacities did the active package improve over "skip it"?
  const improved = useMemo(() => {
    if (row < 1 || !matrix[row] || !matrix[row - 1]) return new Set<number>()
    const s = new Set<number>()
    matrix[row].forEach((v, w) => {
      if (v !== matrix[row - 1][w]) s.add(w)
    })
    return s
  }, [matrix, row])

  const activeItem = row >= 1 ? ITEMS[row - 1] : null

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
      <ModuleHero
        brand="Amazon Logistics"
        eyebrow="Fulfillment"
        title="Load the Delivery Van"
        algorithm="0/1 Knapsack (Dynamic Programming)"
        blurb="A delivery van leaves the warehouse with a strict weight limit. Each package has a weight and a business value (priority × revenue). You can load a package whole or leave it — no fractions. Choosing the highest-value subset that fits is the classic 0/1 Knapsack problem — and dynamic programming solves it exactly."
        icon={Truck}
        accent="from-amber-500/20"
        problem={`The van holds only ${CAPACITY} kg, but there are more packages than will fit. Pick the subset with the greatest total value without exceeding the weight limit.`}
        whyIndustry="Fulfillment centers, cargo airlines, and cloud schedulers all face knapsack-shaped choices — fit the most valuable work into a fixed resource. DP guarantees the optimal packing, which a fast greedy rule of thumb can silently miss."
        facts={[
          'A greedy “best value-per-kg first” loader is fast but can be provably worse than optimal.',
          'The DP table has (packages + 1) × (capacity + 1) cells — each solved exactly once.',
          'The same algorithm powers budget allocation, ad selection, and cloud bin-packing.',
        ]}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="bf-skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : err ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <WifiOff className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Couldn&apos;t reach the knapsack service.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ITEMS.map((it, i) => {
                const inPlan = finished && selected.has(i)
                const isActive = activeItem?.name === it.name
                return (
                  <div
                    key={it.name}
                    className={`rounded-xl border p-4 transition-all duration-300 ${
                      inPlan
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : isActive
                        ? 'border-primary/50 bg-primary/10 ring-1 ring-primary/20'
                        : 'border-border bg-background/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package
                          className={`w-4 h-4 ${inPlan ? 'text-emerald-500' : isActive ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                        <span className="font-semibold text-foreground">{it.name}</span>
                      </div>
                      {inPlan && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-500">
                          <Check className="w-3 h-3" /> Loaded
                        </span>
                      )}
                      {!finished && isActive && (
                        <span className="text-[10px] font-bold uppercase text-primary">Considering</span>
                      )}
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

            {/* Van capacity gauge — fills once the optimal plan is known */}
            {res && finished && (
              <div className="bf-fade-in mt-4 rounded-xl border border-border bg-background/40 p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="inline-flex items-center gap-2 font-semibold text-foreground">
                    <Truck className="w-4 h-4 text-primary" /> Van loaded
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {loadedWeight} / {CAPACITY} kg
                  </span>
                </div>
                <div className="flex h-6 w-full overflow-hidden rounded-lg bg-border/40 gap-0.5">
                  {ITEMS.filter((_, i) => selected.has(i)).map((it) => (
                    <div
                      key={it.name}
                      title={`${it.name} · ${it.weight}kg · value ${it.value}`}
                      className="bg-emerald-500/70 flex items-center justify-center text-[10px] font-bold text-emerald-50 transition-all duration-500"
                      style={{ width: `${(it.weight / CAPACITY) * 100}%` }}
                    >
                      {it.weight >= 2 ? it.name.split(' ')[0] : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {res && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SummaryTile
                  icon={Boxes}
                  label="Optimal value (DP)"
                  value={finished ? res.dp.max_value : matrix[row]?.[CAPACITY] ?? 0}
                  tone="text-emerald-500"
                  hint={finished ? 'provably best' : 'best so far'}
                />
                <SummaryTile
                  icon={Weight}
                  label="Weight loaded"
                  value={finished ? `${loadedWeight} / ${CAPACITY} kg` : `— / ${CAPACITY} kg`}
                  tone="text-primary"
                />
                <SummaryTile
                  icon={Sparkles}
                  label="Greedy heuristic"
                  value={res.greedy.max_value}
                  tone="text-amber-500"
                  hint="value/weight order"
                />
              </div>
            )}
          </>
        )}
      </Section>

      {res && !err && (
        <Section step={3} title="Watch the DP table fill" subtitle="Rows = packages considered · Columns = van capacity remaining">
          <div className="space-y-4">
            <StepPlayer player={player} label="Package" />

            <DecisionPanel
              state={
                row === 0 ? (
                  <>Base case: with <b className="text-foreground">zero packages</b>, every capacity is worth 0.</>
                ) : (
                  <>
                    Rows 0–{row} filled — the best value using the first <b className="text-foreground">{row}</b>{' '}
                    package{row === 1 ? '' : 's'} for each capacity is now known.
                  </>
                )
              }
              decision={
                activeItem ? (
                  <>
                    Consider <b className="text-foreground">{activeItem.name}</b> ({activeItem.weight}kg, value{' '}
                    {activeItem.value}): for each capacity take{' '}
                    <span className="text-primary font-medium">max(skip, load it)</span>.
                  </>
                ) : (
                  <>Initialize the empty-knapsack row to all zeros.</>
                )
              }
              reasoning={
                activeItem ? (
                  <>
                    Loading it beat skipping in <b className="text-emerald-500">{improved.size}</b> capacit
                    {improved.size === 1 ? 'y' : 'ies'} (highlighted). Best at cap {CAPACITY}:{' '}
                    <b className="text-foreground">{matrix[row]?.[CAPACITY]}</b>.
                  </>
                ) : (
                  <>Nothing to pack yet — this row anchors the recursion.</>
                )
              }
            />

            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-border bg-background/40 p-2">
              <table className="border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="p-1.5 text-muted-foreground font-medium sticky left-0 bg-card z-10">item \ cap</th>
                    {Array.from({ length: CAPACITY + 1 }, (_, w) => (
                      <th key={w} className="p-1.5 text-center text-muted-foreground font-medium w-9">
                        {w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((r, i) => {
                    const revealed = i <= row
                    const isActiveRow = i === row && row >= 1
                    return (
                      <tr key={i} className={isActiveRow ? 'bg-primary/5' : ''}>
                        <td
                          className={`p-1.5 text-right font-medium whitespace-nowrap sticky left-0 bg-card z-10 ${
                            revealed ? 'text-foreground/80' : 'text-muted-foreground/40'
                          }`}
                        >
                          {i === 0 ? '∅' : ITEMS[i - 1]?.name}
                        </td>
                        {r.map((cell, w) => {
                          const isAnswer = finished && i === matrix.length - 1 && w === CAPACITY
                          const isImproved = isActiveRow && improved.has(w)
                          const isHover =
                            hoverCell && (hoverCell.i === i || hoverCell.w === w) && hoverCell.i >= i && hoverCell.w >= w
                          let cls = 'text-muted-foreground/30'
                          if (isAnswer) cls = 'bg-emerald-500/25 text-emerald-500 font-bold'
                          else if (isImproved) cls = 'bg-emerald-500/15 text-emerald-500 font-semibold'
                          else if (isActiveRow) cls = 'text-foreground'
                          else if (revealed && isHover) cls = 'bg-primary/15 text-foreground'
                          else if (revealed) cls = 'text-muted-foreground'
                          return (
                            <td
                              key={w}
                              onMouseEnter={() => revealed && setHoverCell({ i, w })}
                              onMouseLeave={() => setHoverCell(null)}
                              className={`p-1.5 text-center border border-border/40 transition-colors duration-200 ${cls}`}
                            >
                              {revealed ? cell : '·'}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
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

      <Section step={5} title="Your challenge" subtitle="Predict the optimal packing">
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

      <Completion topic="knapsack" title="0/1 Knapsack" score={100} visible={solved} />
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
      <p className={`text-2xl font-bold mt-1 tabular-nums ${tone}`}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  )
}
