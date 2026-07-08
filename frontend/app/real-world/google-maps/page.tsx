'use client'

/**
 * app/real-world/google-maps/page.tsx — Layer 3 experiential module:
 * "Google Maps Navigation → Dijkstra's Shortest Path".
 *
 * A short real-world story that reuses the existing /dijkstra-routing backend:
 * a small city road network (nodes = intersections, edge weights = minutes),
 * an SVG map that highlights the optimal route, a step-by-step walkthrough of
 * how Dijkstra settles each intersection, an AI explanation, and a challenge that
 * credits mastery on success.
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
  useWalkthrough,
} from '@/components/learn/experiential'
import { MapPin, Navigation, ChevronLeft, ChevronRight, RotateCcw, Play, Clock } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// A tiny, hand-placed city grid so the SVG reads like a real map. Weights are
// "minutes of drive time" on each road segment (directed as stored).
const PLACES: Record<string, { x: number; y: number; label: string }> = {
  Home: { x: 60, y: 220, label: 'Home' },
  Market: { x: 200, y: 90, label: 'Market' },
  Bridge: { x: 210, y: 330, label: 'Bridge' },
  Mall: { x: 370, y: 170, label: 'Mall' },
  Park: { x: 380, y: 360, label: 'Park' },
  Office: { x: 540, y: 250, label: 'Office' },
}

const ROADS: Record<string, Record<string, number>> = {
  Home: { Market: 7, Bridge: 4 },
  Market: { Mall: 6, Bridge: 2 },
  Bridge: { Park: 5, Mall: 8 },
  Mall: { Office: 4, Park: 3 },
  Park: { Office: 6 },
  Office: {},
}

interface DijkstraStep {
  node: string
  dist: number
  visited: string[]
  relaxations: { neighbor: string; new_dist: number; relaxed: boolean }[]
}
interface DijkstraResult {
  shortest_path: string[]
  total_distance: number
  distances: Record<string, number>
  steps: DijkstraStep[]
}

export default function GoogleMapsModule() {
  const [res, setRes] = useState<DijkstraResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(false)
  const [solved, setSolved] = useState(false)

  useEffect(() => {
    fetch(`${API}/dijkstra-routing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graph: ROADS, start: 'Home', end: 'Office' }),
    })
      .then((r) => r.json())
      .then((d) => setRes(d))
      .catch(() => setErr(true))
      .finally(() => setLoading(false))
  }, [])

  const steps = res?.steps ?? []
  const wt = useWalkthrough(Math.max(steps.length, 1))
  const curStep = steps[wt.idx]
  const settled = useMemo(() => new Set(curStep?.visited ?? []), [curStep])

  const pathEdges = useMemo(() => {
    const p = res?.shortest_path ?? []
    const set = new Set<string>()
    for (let i = 0; i < p.length - 1; i++) set.add(`${p[i]}->${p[i + 1]}`)
    return set
  }, [res])

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
      <ModuleHero
        brand="Google Maps Navigation"
        eyebrow="Navigation"
        title="Fastest Route Across the City"
        algorithm="Dijkstra's Shortest Path"
        blurb="When you tap “Directions,” Google Maps models the road network as a weighted graph — intersections are nodes, road segments are edges weighted by travel time — and runs a shortest-path search. This is that engine, in miniature."
        icon={Navigation}
        accent="from-blue-500/20"
      />

      <Section step={1} title="The real-world problem" subtitle="Why a graph, and why weights?">
        <RealWorldIntro
          points={[
            { label: 'Nodes', text: 'Every intersection is a node the router can stop at.' },
            { label: 'Weights', text: 'Each road carries a cost — here, estimated minutes of drive time.' },
            { label: 'Goal', text: 'Find the lowest-total-time route from Home to the Office.' },
          ]}
        />
      </Section>

      <Section step={2} title="The live map" subtitle="Optimal route highlighted by the real Dijkstra backend">
        {loading ? (
          <div className="h-[420px] rounded-xl border border-border bg-background/40 animate-pulse" />
        ) : err ? (
          <p className="text-sm text-muted-foreground">Couldn&apos;t reach the routing service.</p>
        ) : (
          <div className="rounded-xl border border-border bg-background/40 overflow-hidden">
            <svg viewBox="0 0 620 440" className="w-full">
              {/* Roads */}
              {Object.entries(ROADS).map(([from, nbrs]) =>
                Object.entries(nbrs).map(([to, w]) => {
                  const a = PLACES[from]
                  const b = PLACES[to]
                  const onPath = pathEdges.has(`${from}->${to}`)
                  const mx = (a.x + b.x) / 2
                  const my = (a.y + b.y) / 2
                  return (
                    <g key={`${from}-${to}`}>
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke={onPath ? '#3b82f6' : 'var(--border)'}
                        strokeWidth={onPath ? 5 : 2}
                        strokeLinecap="round"
                        opacity={onPath ? 1 : 0.6}
                      />
                      <circle cx={mx} cy={my} r={11} fill="var(--card)" stroke="var(--border)" />
                      <text x={mx} y={my + 4} fontSize={11} textAnchor="middle" fill="var(--muted-foreground)" fontWeight={600}>
                        {w}
                      </text>
                    </g>
                  )
                }),
              )}
              {/* Places */}
              {Object.entries(PLACES).map(([id, p]) => {
                const isSettled = settled.has(id)
                const isCurrent = curStep?.node === id
                const onRoute = res?.shortest_path.includes(id)
                return (
                  <g key={id}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isCurrent ? 22 : 18}
                      fill={isCurrent ? '#3b82f6' : isSettled ? 'rgba(59,130,246,0.15)' : onRoute ? 'rgba(16,185,129,0.12)' : 'var(--card)'}
                      stroke={isCurrent ? '#3b82f6' : isSettled ? '#3b82f6' : onRoute ? '#10b981' : 'var(--border)'}
                      strokeWidth={2.5}
                    />
                    <MapPinSvg x={p.x} y={p.y} filled={isCurrent} />
                    <text x={p.x} y={p.y - 26} fontSize={12} textAnchor="middle" fontWeight={700} fill="var(--foreground)">
                      {p.label}
                    </text>
                    {res && res.distances[id] >= 0 && (isSettled || onRoute) && (
                      <text x={p.x} y={p.y + 34} fontSize={10} textAnchor="middle" fill="var(--muted-foreground)">
                        {res.distances[id]} min
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Route summary */}
            {res && (
              <div className="border-t border-border p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{res.shortest_path.join('  →  ')}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                  <Clock className="w-4 h-4" /> {res.total_distance} min total
                </span>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section step={3} title="Walk through the algorithm" subtitle="Dijkstra settles the closest unvisited intersection each step">
        {steps.length > 0 && curStep ? (
          <div className="space-y-4">
            <StepHint>
              Step {wt.idx + 1} of {steps.length}: settle <b className="text-foreground">{curStep.node}</b> at{' '}
              <b className="text-foreground">{curStep.dist} min</b> from Home, then relax its neighbours
              {curStep.relaxations.length
                ? `: ${curStep.relaxations
                    .map((r) => `${r.neighbor}${r.relaxed ? ` ↓${r.new_dist}` : ' (no change)'}`)
                    .join(', ')}.`
                : '.'}
            </StepHint>

            <div className="flex items-center gap-2">
              <button
                onClick={wt.prev}
                disabled={wt.atStart}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted/40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={wt.next}
                disabled={wt.atEnd}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={wt.reset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 transition-all ml-auto"
              >
                <RotateCcw className="w-4 h-4" /> Restart
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {Object.keys(PLACES).map((id) => (
                <span
                  key={id}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    settled.has(id)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {id}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Walkthrough will appear once the route loads.</p>
        )}
      </Section>

      <Section step={4} title="Understand the intuition" subtitle="Straight from the AI tutor">
        <AiExplanation
          topic="dijkstra"
          question="Explain Dijkstra's algorithm using the analogy of Google Maps finding the fastest driving route across a city. Keep it to 4-5 sentences and mention why edge weights and the greedy 'closest first' choice matter."
          fallback="Dijkstra grows a set of intersections whose fastest arrival time from Home is finalized. It always expands the closest un-finalized intersection next, then checks whether reaching each neighbour through it is faster than any route found so far — a 'relaxation'. Because every road's time is non-negative, once an intersection is settled its time can never improve, so the first time we reach the Office we already have the fastest route."
        />
      </Section>

      <Section step={5} title="Your challenge" subtitle="Prove you can reason about the route">
        <Challenge
          topic="dijkstra"
          spec={{
            prompt:
              'Dijkstra just settled the Mall. A road Mall→Park costs 3 min and Park is currently marked 9 min from Home, while Mall is 8 min from Home. What happens during relaxation?',
            options: [
              'Park stays at 9 — the new route through Mall (8+3=11) is worse.',
              'Park drops to 11 min because Mall was just settled.',
              'Nothing — Park is already visited so it is skipped.',
              'Park drops to 8 min, copying Mall’s distance.',
            ],
            answerIndex: 0,
            explanation:
              'Relaxation only lowers a distance when the new path is shorter. Through Mall, Park would cost 8 + 3 = 11 min, which is worse than its current 9 min, so Park keeps 9. Dijkstra never makes a distance larger.',
          }}
          onSolved={() => setSolved(true)}
        />
      </Section>

      <Completion topic="dijkstra" score={100} visible={solved} />
    </div>
  )
}

// Tiny inline map-pin glyph centered on (x,y).
function MapPinSvg({ x, y, filled }: { x: number; y: number; filled: boolean }) {
  return (
    <g transform={`translate(${x - 7}, ${y - 8})`} pointerEvents="none">
      <path
        d="M7 0C3.13 0 0 3.13 0 7c0 5.25 7 9 7 9s7-3.75 7-9c0-3.87-3.13-7-7-7z"
        fill={filled ? '#ffffff' : 'var(--primary)'}
        opacity={filled ? 0.95 : 0.85}
      />
      <circle cx={7} cy={7} r={2.5} fill={filled ? '#3b82f6' : 'var(--card)'} />
    </g>
  )
}
