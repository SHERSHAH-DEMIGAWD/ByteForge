'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause, Crown, Info } from 'lucide-react'
import { ShareButton } from '@/components/share-button'
import { ExportReportButton } from '@/components/export-report'
import { useSharedParams } from '@/lib/share'
import { useStepPlayer } from '@/lib/use-step-player'

export default function NQueensPage() {
  const [n, setN] = useState(6)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  useSharedParams((params) => {
    const qn = parseInt(params.get('n') || '')
    if (!isNaN(qn) && qn >= 4 && qn <= 8) setN(qn)
  })

  const steps = results?.steps || []
  const { currentStepIdx, isPlaying, togglePlay, next, prev, reset } = useStepPlayer(steps.length, 300)
  const activeStep = steps[currentStepIdx] || null

  const handleSolve = async () => {
    setLoading(true)
    setResults(null)
    reset()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/nqueens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n }),
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

  // Board state for the active step: board[row] = col
  const board: number[] = activeStep?.board || []
  const action = activeStep?.action
  const actionColors: Record<string, string> = {
    place: 'text-green-400',
    conflict: 'text-red-400',
    backtrack: 'text-amber-400',
    solution: 'text-accent',
    try: 'text-muted-foreground',
  }

  const cellContent = (r: number, c: number) => {
    if (board[r] === c) return '♛'
    if (activeStep && activeStep.row === r && activeStep.col === c) {
      if (action === 'conflict') return '✕'
      if (action === 'backtrack') return '↩'
    }
    return ''
  }

  const cellClass = (r: number, c: number): string => {
    const isDarkSq = (r + c) % 2 === 1
    let base = isDarkSq ? 'bg-primary/15' : 'bg-background/40'
    if (board[r] === c) base = 'bg-green-500/30 text-green-400'
    if (activeStep && activeStep.row === r && activeStep.col === c) {
      if (action === 'conflict') base = 'bg-red-500/30 text-red-400'
      if (action === 'place') base = 'bg-green-500/50 text-green-300 scale-105'
      if (action === 'backtrack') base = 'bg-amber-500/30 text-amber-400'
    }
    return base
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
            N-Queens Backtracking Lab
          </h1>
          <p className="text-muted-foreground">
            Unit V Backtracking: place N queens with zero conflicts. Watch the solver advance, hit dead ends, and retreat.
          </p>
        </div>
        <div className="flex gap-2">
          <ShareButton state={{ n }} />
          <ExportReportButton
            disabled={!results}
            getReport={() => ({
              title: 'N-Queens Backtracking Report',
              subtitle: `${n}×${n} board`,
              metrics: [
                { label: 'Solutions Found', value: results?.solution_count ?? 0 },
                { label: 'Nodes Explored', value: results?.nodes_explored ?? 0 },
                { label: 'Brute-Force Space', value: `${n}^${n} = ${Math.pow(n, n).toLocaleString()}` },
              ],
              tables: [
                {
                  title: 'Solutions (queen column per row)',
                  headers: ['#', ...Array.from({ length: n }, (_, i) => `Row ${i}`)],
                  rows: (results?.solutions || []).map((sol: number[], i: number) => [i + 1, ...sol]),
                },
              ],
              notes: [
                `Backtracking explored ${results?.nodes_explored ?? 0} nodes versus ${Math.pow(n, n).toLocaleString()} brute-force placements — pruning kills entire subtrees on the first conflict.`,
                'Conflict checks are O(1) using column and diagonal hash sets (row−col and row+col).',
              ],
            })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Crown className="w-5 h-5" /> Board Configuration
            </h3>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
                Board Size N: <span className="text-accent font-bold">{n} × {n}</span>
              </label>
              <input
                type="range" min={4} max={8} value={n}
                onChange={(e) => { setN(parseInt(e.target.value)); setResults(null) }}
                className="w-full accent-primary bg-background h-2 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                <span>4</span><span>5</span><span>6</span><span>7</span><span>8</span>
              </div>
            </div>
            <button
              onClick={handleSolve}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Backtracking...' : 'Solve N-Queens'}
            </button>
          </div>

          {/* Stats */}
          {results && (
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-3">
              <h4 className="text-sm font-bold text-primary uppercase">Search Statistics</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 bg-background/50 border border-border/20 rounded">
                  <span className="text-muted-foreground">Solutions found</span>
                  <span className="font-mono font-bold text-accent">{results.solution_count}</span>
                </div>
                <div className="flex justify-between p-2 bg-background/50 border border-border/20 rounded">
                  <span className="text-muted-foreground">Nodes explored</span>
                  <span className="font-mono font-bold text-primary">{results.nodes_explored.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 bg-background/50 border border-border/20 rounded">
                  <span className="text-muted-foreground">Brute-force space (n^n)</span>
                  <span className="font-mono font-bold text-destructive">{Math.pow(n, n).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Pruning ratio: backtracking visited only <span className="font-bold text-accent">{((100 * results.nodes_explored) / Math.pow(n, n)).toFixed(3)}%</span> of the brute-force search space.
              </p>
            </div>
          )}

          {/* Solutions gallery */}
          {results?.solutions?.length > 0 && (
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-3">
              <h4 className="text-sm font-bold text-primary uppercase">Solutions Gallery</h4>
              <div className="grid grid-cols-2 gap-3">
                {results.solutions.slice(0, 6).map((sol: number[], sIdx: number) => (
                  <div key={sIdx} className="space-y-1">
                    <div className="grid gap-px bg-border/30 p-px rounded" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                      {Array.from({ length: n * n }).map((_, idx) => {
                        const r = Math.floor(idx / n), c = idx % n
                        return (
                          <div key={idx} className={`aspect-square flex items-center justify-center text-[8px] ${
                            (r + c) % 2 === 1 ? 'bg-primary/15' : 'bg-background/60'
                          } ${sol[r] === c ? 'text-accent' : ''}`}>
                            {sol[r] === c ? '♛' : ''}
                          </div>
                        )
                      })}
                    </div>
                    <div className="text-[9px] text-center text-muted-foreground font-mono">#{sIdx + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Board + player */}
        <div className="lg:col-span-2 space-y-6">
          {!results ? (
            <div className="bg-card/50 border border-border/30 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <Crown className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Choose a board size and run the solver to animate the backtracking search tree</p>
            </div>
          ) : (
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-5">
              {/* Player */}
              <div className="flex justify-between items-center border-b border-border/30 pb-4">
                <div className="flex flex-col">
                  <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Backtracking Player</span>
                  {action && (
                    <span className={`text-sm font-bold uppercase mt-0.5 ${actionColors[action] || ''}`}>{action}</span>
                  )}
                </div>
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

              {/* Chessboard */}
              <div className="bg-black/60 border border-border/15 p-6 rounded-lg flex justify-center">
                <div
                  className="grid gap-[2px] bg-border/40 p-[2px] rounded w-full max-w-md"
                  style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
                >
                  {Array.from({ length: n * n }).map((_, idx) => {
                    const r = Math.floor(idx / n), c = idx % n
                    return (
                      <div
                        key={idx}
                        className={`aspect-square flex items-center justify-center text-2xl md:text-3xl rounded-sm transition-all duration-200 ${cellClass(r, c)}`}
                      >
                        {cellContent(r, c)}
                      </div>
                    )
                  })}
                </div>
              </div>

              {activeStep && (
                <div className="p-4 bg-background/25 border border-border/20 rounded-lg text-xs leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Step explanation:</span> {activeStep.explain}
                </div>
              )}

              {results.steps_truncated && (
                <p className="text-[11px] text-muted-foreground">
                  Trace truncated to the first {steps.length} events to keep the player responsive — search statistics cover the complete run.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Theory */}
      <div className="mt-12 bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b border-border/20 pb-4">
          <Info className="w-6 h-6" /> Theory & Study Guide: Backtracking
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-muted-foreground leading-relaxed">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">State-Space Tree Pruning</h3>
              <p>Backtracking performs a depth-first search of the state-space tree, but abandons a branch the moment a partial solution violates a constraint (<strong className="text-foreground">bounding</strong>). One conflict at row 2 prunes all n^(n−2) completions below it — that is why the explored-node count is a tiny fraction of n^n.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">O(1) Conflict Detection</h3>
              <p>Three hash sets — columns, ↘ diagonals (<span className="font-mono text-accent">row − col</span>) and ↙ diagonals (<span className="font-mono text-accent">row + col</span>) — make each safety check constant-time. The naive alternative re-scans all previously placed queens: O(N) per check.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Backtracking vs Branch & Bound</h3>
              <p>Backtracking discards subtrees that are <em>infeasible</em>. Branch &amp; Bound (used for optimization problems like Knapsack or TSP) additionally discards subtrees that are feasible but provably <em>worse than the best solution found so far</em>, using a bounding function.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Complexity</h3>
              <p>Worst case <span className="font-mono text-accent">O(N!)</span> placements (already far better than n^n by never repeating a column), with O(N) space for the placement stack. Solutions exist for every N ≥ 4; N=8 has 92.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
