'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause, Crosshair, Eraser, Info, MousePointerClick } from 'lucide-react'
import { ShareButton } from '@/components/share-button'
import { ExportReportButton } from '@/components/export-report'
import { useSharedParams } from '@/lib/share'
import { useStepPlayer } from '@/lib/use-step-player'

const ROWS = 12
const COLS = 20

type Tool = 'wall' | 'start' | 'goal' | 'erase'

function key(r: number, c: number) {
  return `${r},${c}`
}

export default function AStarPage() {
  const [walls, setWalls] = useState<Set<string>>(() => {
    // Default maze: a wall with a gap forces A* to demonstrate the heuristic detour
    const w = new Set<string>()
    for (let r = 2; r < 10; r++) w.add(key(r, 9))
    return w
  })
  const [start, setStart] = useState<[number, number]>([5, 2])
  const [goal, setGoal] = useState<[number, number]>([6, 17])
  const [tool, setTool] = useState<Tool>('wall')
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  useSharedParams((params) => {
    const w = params.get('walls')
    if (w) setWalls(new Set(w.split(';').filter(Boolean)))
    const s = params.get('start')?.split(',').map(Number)
    if (s && s.length === 2 && !s.some(isNaN)) setStart([s[0], s[1]])
    const g = params.get('goal')?.split(',').map(Number)
    if (g && g.length === 2 && !g.some(isNaN)) setGoal([g[0], g[1]])
  })

  const steps = results?.steps || []
  const { currentStepIdx, isPlaying, togglePlay, next, prev, reset } = useStepPlayer(steps.length, 150)
  const activeStep = steps[currentStepIdx] || null

  const paint = (r: number, c: number) => {
    const k = key(r, c)
    if (tool === 'start') {
      if (!walls.has(k)) setStart([r, c])
      return
    }
    if (tool === 'goal') {
      if (!walls.has(k)) setGoal([r, c])
      return
    }
    setWalls((prev) => {
      const nextWalls = new Set(prev)
      const isStartOrGoal = (start[0] === r && start[1] === c) || (goal[0] === r && goal[1] === c)
      if (tool === 'wall' && !isStartOrGoal) nextWalls.add(k)
      if (tool === 'erase') nextWalls.delete(k)
      return nextWalls
    })
    setResults(null)
  }

  const handleSolve = async () => {
    setLoading(true)
    setResults(null)
    reset()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/astar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: ROWS,
          cols: COLS,
          walls: [...walls].map((k) => k.split(',').map(Number)),
          start,
          goal,
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.detail || 'Backend request failed')
      }
      setResults(await response.json())
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Visualization state for current step
  const closedSoFar = new Set<string>()
  const openNow = new Map<string, { f: number; g: number; h: number }>()
  if (activeStep) {
    for (let i = 0; i <= currentStepIdx; i++) {
      const s = steps[i]
      if (s) closedSoFar.add(key(s.current[0], s.current[1]))
    }
    for (const o of activeStep.open || []) {
      openNow.set(key(o.cell[0], o.cell[1]), { f: o.f, g: o.g, h: o.h })
    }
  }
  const finalReached = currentStepIdx === steps.length - 1 && results?.found
  const pathSet = new Set<string>((finalReached ? results.path : []).map((p: number[]) => key(p[0], p[1])))

  const cellStyle = (r: number, c: number): string => {
    const k = key(r, c)
    if (start[0] === r && start[1] === c) return 'bg-blue-500 text-white font-bold'
    if (goal[0] === r && goal[1] === c) return 'bg-green-500 text-white font-bold'
    if (walls.has(k)) return 'bg-slate-600 dark:bg-slate-400/70'
    if (pathSet.has(k)) return 'bg-green-500/50 border-green-400'
    if (activeStep && key(activeStep.current[0], activeStep.current[1]) === k) return 'bg-accent text-accent-foreground font-bold scale-110 z-10'
    if (closedSoFar.has(k)) return 'bg-primary/30'
    if (openNow.has(k)) return 'bg-cyan-400/20 border-cyan-400/50'
    return 'bg-background/40 hover:bg-primary/10'
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
            A* Pathfinding Grid
          </h1>
          <p className="text-muted-foreground">
            Informed search: f(n) = g(n) + h(n). Draw walls, then watch the Manhattan heuristic steer the frontier toward the goal.
          </p>
        </div>
        <div className="flex gap-2">
          <ShareButton state={{ walls: [...walls].join(';'), start: start.join(','), goal: goal.join(',') }} />
          <ExportReportButton
            disabled={!results}
            getReport={() => ({
              title: 'A* Pathfinding Report',
              subtitle: `${ROWS}×${COLS} grid, ${walls.size} wall cells, Manhattan heuristic`,
              metrics: [
                { label: 'Path Found', value: results?.found ? 'Yes' : 'No' },
                { label: 'Path Cost', value: results?.path_cost ?? '-' },
                { label: 'Cells Expanded', value: results?.cells_expanded ?? 0 },
                { label: 'Free Cells Total', value: results?.total_cells ?? 0 },
              ],
              notes: [
                `A* expanded ${results?.cells_expanded ?? 0} of ${results?.total_cells ?? 0} free cells (${results ? Math.round((100 * results.cells_expanded) / Math.max(1, results.total_cells)) : 0}%) — Dijkstra (h=0) would expand nearly all cells closer than the goal.`,
                'The Manhattan heuristic is admissible on a 4-connected grid, so the returned path is provably optimal.',
              ],
            })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tools */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <MousePointerClick className="w-5 h-5" /> Grid Editor
            </h3>
            <p className="text-xs text-muted-foreground">Pick a tool, then click or drag on the grid.</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'wall', label: 'Draw Walls', color: 'bg-slate-500' },
                { id: 'erase', label: 'Erase', color: 'bg-background border border-border' },
                { id: 'start', label: 'Set Start', color: 'bg-blue-500' },
                { id: 'goal', label: 'Set Goal', color: 'bg-green-500' },
              ] as { id: Tool; label: string; color: string }[]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${
                    tool === t.id ? 'border-primary bg-primary/15 text-primary' : 'border-border/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className={`w-3 h-3 rounded ${t.color}`} />
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setWalls(new Set()); setResults(null) }}
              className="w-full py-2 bg-background border border-border/30 hover:border-destructive/50 rounded-lg text-muted-foreground hover:text-destructive transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
            >
              <Eraser className="w-3.5 h-3.5" /> Clear All Walls
            </button>
            <button
              onClick={handleSolve}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Crosshair className="w-4 h-4" />
              {loading ? 'Searching...' : 'Run A* Search'}
            </button>
          </div>

          {/* Live scores */}
          {activeStep && (
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-3">
              <h4 className="text-sm font-bold text-primary uppercase">Current Expansion</h4>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-sm">
                <div className="p-2 bg-background/50 border border-border/20 rounded">
                  <div className="text-[9px] text-muted-foreground uppercase">g (cost)</div>
                  <div className="font-bold text-primary">{activeStep.g}</div>
                </div>
                <div className="p-2 bg-background/50 border border-border/20 rounded">
                  <div className="text-[9px] text-muted-foreground uppercase">h (est.)</div>
                  <div className="font-bold text-accent">{activeStep.h}</div>
                </div>
                <div className="p-2 bg-background/50 border border-border/20 rounded">
                  <div className="text-[9px] text-muted-foreground uppercase">f = g+h</div>
                  <div className="font-bold text-green-400">{activeStep.f}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Open set: <span className="font-mono text-accent">{activeStep.open?.length ?? 0}</span> · Closed: <span className="font-mono text-primary">{activeStep.closed_count}</span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-card/50 border border-border/30 rounded-lg p-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-500" /> Start</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500" /> Goal</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-cyan-400/40 border border-cyan-400" /> Open (frontier)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-primary/40" /> Closed (expanded)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500/60" /> Optimal path</div>
          </div>
        </div>

        {/* Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div
            className="bg-card/50 border border-border/30 rounded-lg p-4 select-none"
            onMouseLeave={() => setIsDragging(false)}
          >
            <div
              className="grid gap-[3px] bg-black/40 dark:bg-black/60 p-3 rounded-lg"
              style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: ROWS }).map((_, r) =>
                Array.from({ length: COLS }).map((_, c) => {
                  const k = key(r, c)
                  const score = openNow.get(k)
                  return (
                    <div
                      key={k}
                      onMouseDown={() => { setIsDragging(true); paint(r, c) }}
                      onMouseUp={() => setIsDragging(false)}
                      onMouseEnter={() => { if (isDragging) paint(r, c) }}
                      title={score ? `f=${score.f} g=${score.g} h=${score.h}` : `(${r},${c})`}
                      className={`aspect-square rounded-sm border border-transparent cursor-pointer transition-all duration-150 flex items-center justify-center text-[8px] font-mono ${cellStyle(r, c)}`}
                    >
                      {start[0] === r && start[1] === c ? 'S' : goal[0] === r && goal[1] === c ? 'G' : score ? score.f : ''}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Player + explanation */}
          {results && (
            <div className="bg-card/50 border border-border/30 rounded-lg p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Expansion Playback</span>
                <div className="flex items-center gap-3">
                  <button onClick={prev} disabled={currentStepIdx === 0}
                    className="p-1.5 bg-background rounded-lg border border-border/30 hover:border-primary/50 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={togglePlay}
                    className="px-4 py-1.5 bg-primary text-background font-bold text-xs uppercase flex items-center gap-1.5 rounded-lg hover:opacity-90">
                    {isPlaying ? <><Pause className="w-3.5 h-3.5 fill-current" /> Pause</> : <><Play className="w-3.5 h-3.5 fill-current" /> Play</>}
                  </button>
                  <button onClick={next} disabled={currentStepIdx >= steps.length - 1}
                    className="p-1.5 bg-background rounded-lg border border-border/30 hover:border-primary/50 disabled:opacity-40">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-xs text-muted-foreground">{currentStepIdx + 1} / {steps.length}</span>
                </div>
              </div>

              {activeStep && (
                <div className="p-4 bg-background/25 border border-border/20 rounded-lg text-xs leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Step explanation:</span> {activeStep.explain}
                </div>
              )}

              {!results.found && (
                <div className="p-3.5 bg-destructive/10 border border-destructive/40 rounded-lg text-sm text-destructive font-bold">
                  No path exists — the goal is sealed off by walls.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Theory */}
      <div className="mt-12 bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b border-border/20 pb-4">
          <Info className="w-6 h-6" /> Theory & Study Guide: A* Search
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-muted-foreground leading-relaxed">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">The Evaluation Function</h3>
              <p>A* orders its priority queue by <span className="font-mono text-accent">f(n) = g(n) + h(n)</span>: the exact cost so far plus a heuristic estimate of the cost to go. With <span className="font-mono">h = 0</span>, A* degenerates into Dijkstra; with <span className="font-mono">g = 0</span>, it becomes Greedy Best-First (fast but non-optimal).</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Admissibility & Optimality</h3>
              <p>A heuristic is <strong className="text-foreground">admissible</strong> if it never over-estimates the true remaining cost. Manhattan distance on a 4-connected grid is admissible (every move covers exactly 1 unit of it), so A* is guaranteed to return an optimal path.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Why It Beats Dijkstra Here</h3>
              <p>Dijkstra expands cells in pure distance-from-start order — a circular flood. A*&apos;s heuristic biases expansion toward the goal, so it typically explores a narrow corridor. Compare the &quot;cells expanded&quot; metric against total free cells after a run.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Complexity</h3>
              <p>Worst case <span className="font-mono text-accent">O(E log V)</span> with a binary heap — same as Dijkstra — but the effective branching factor shrinks dramatically with a good heuristic. Space is O(V) for the open/closed sets.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
