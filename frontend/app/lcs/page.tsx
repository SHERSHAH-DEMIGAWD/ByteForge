'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause, Table2, Info } from 'lucide-react'
import { ShareButton } from '@/components/share-button'
import { ExportReportButton } from '@/components/export-report'
import { useSharedParams } from '@/lib/share'
import { useStepPlayer } from '@/lib/use-step-player'

const PRESETS = [
  { label: 'DNA Alignment', a: 'AGGTAB', b: 'GXTXAYB' },
  { label: 'Diff Tool (words)', a: 'STONE', b: 'LONGEST' },
  { label: 'Spell Check', a: 'ALGORITHM', b: 'ALTRUISTIC' },
]

export default function LCSPage() {
  const [strA, setStrA] = useState('AGGTAB')
  const [strB, setStrB] = useState('GXTXAYB')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  useSharedParams((params) => {
    const a = params.get('a')
    const b = params.get('b')
    if (a) setStrA(a.slice(0, 30))
    if (b) setStrB(b.slice(0, 30))
  })

  const steps = results?.steps || []
  const { currentStepIdx, isPlaying, togglePlay, next, prev, reset } = useStepPlayer(steps.length, 250)
  const activeStep = steps[currentStepIdx] || null
  const isDone = results && currentStepIdx === steps.length - 1

  const handleSolve = async () => {
    if (!strA || !strB) return
    setLoading(true)
    setResults(null)
    reset()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/lcs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: strA, b: strB }),
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

  // Cells filled up to the current step
  const filled = new Map<string, { value: number; source: string }>()
  for (let i = 0; i <= currentStepIdx && i < steps.length; i++) {
    const s = steps[i]
    filled.set(`${s.i},${s.j}`, { value: s.value, source: s.source })
  }
  const tracebackSet = new Set<string>(isDone ? (results.traceback || []).map((p: number[]) => `${p[0]},${p[1]}`) : [])

  const lcsCharSet = new Set<string>()
  if (isDone) {
    // Mark traceback cells where characters matched (diagonal moves) for emphasis
    for (const [i, j] of results.traceback || []) {
      if (strA[i - 1] === strB[j - 1]) lcsCharSet.add(`${i},${j}`)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
            Longest Common Subsequence
          </h1>
          <p className="text-muted-foreground">
            Unit IV Dynamic Programming: watch the DP table fill cell by cell, then trace back the optimal subsequence — the engine behind diff tools and DNA alignment.
          </p>
        </div>
        <div className="flex gap-2">
          <ShareButton state={{ a: strA, b: strB }} />
          <ExportReportButton
            disabled={!results}
            getReport={() => ({
              title: 'LCS Dynamic Programming Report',
              subtitle: `Comparing "${strA}" (${strA.length} chars) vs "${strB}" (${strB.length} chars)`,
              metrics: [
                { label: 'LCS Length', value: results?.length ?? 0 },
                { label: 'LCS String', value: results?.lcs || '(empty)' },
                { label: 'DP Cells Computed', value: strA.length * strB.length },
              ],
              notes: [
                `Recurrence: match → L[i][j] = L[i-1][j-1] + 1; mismatch → max(L[i-1][j], L[i][j-1]).`,
                `Time complexity O(N·M) = O(${strA.length}·${strB.length}); the traceback recovers the subsequence in O(N+M).`,
              ],
            })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Table2 className="w-5 h-5" /> Sequence Inputs
            </h3>

            <div className="space-y-2">
              {PRESETS.map((p, i) => (
                <div
                  key={i}
                  onClick={() => { setStrA(p.a); setStrB(p.b); setResults(null) }}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    strA === p.a && strB === p.b ? 'border-primary bg-primary/10' : 'border-border/30 bg-background/40 hover:bg-background/80'
                  }`}
                >
                  <div className="font-bold text-xs text-primary mb-0.5">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{p.a} ↔ {p.b}</div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">String A (rows, max 30)</label>
              <input
                value={strA}
                onChange={(e) => setStrA(e.target.value.slice(0, 30))}
                className="w-full bg-background border border-border/30 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-primary/50 text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">String B (columns, max 30)</label>
              <input
                value={strB}
                onChange={(e) => setStrB(e.target.value.slice(0, 30))}
                className="w-full bg-background border border-border/30 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-primary/50 text-foreground"
              />
            </div>

            <button
              onClick={handleSolve}
              disabled={loading || !strA || !strB}
              className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Filling Table...' : 'Solve LCS'}
            </button>
          </div>

          {/* Result */}
          {results && isDone && (
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-3 text-center">
              <h4 className="text-xs font-bold text-muted-foreground uppercase">Longest Common Subsequence</h4>
              <div className="text-3xl font-extrabold font-mono text-accent tracking-widest">{results.lcs || '∅'}</div>
              <div className="text-xs text-muted-foreground">Length: <span className="font-bold text-primary">{results.length}</span></div>
            </div>
          )}
        </div>

        {/* DP Table */}
        <div className="lg:col-span-2 space-y-6">
          {!results ? (
            <div className="bg-card/50 border border-border/30 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <Table2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Enter two sequences and solve to animate the dynamic programming table</p>
            </div>
          ) : (
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-5">
              {/* Player */}
              <div className="flex justify-between items-center border-b border-border/30 pb-4">
                <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">DP Table Fill Player</span>
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

              <div className="overflow-x-auto">
                <table className="font-mono text-xs border-collapse mx-auto">
                  <thead>
                    <tr>
                      <th className="w-9 h-9" />
                      <th className="w-9 h-9 text-muted-foreground">∅</th>
                      {strB.split('').map((ch, j) => (
                        <th key={j} className={`w-9 h-9 text-sm ${activeStep?.j === j + 1 ? 'text-accent' : 'text-muted-foreground'}`}>{ch}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th className="w-9 h-9 text-muted-foreground">∅</th>
                      {Array.from({ length: strB.length + 1 }).map((_, j) => (
                        <td key={j} className="w-9 h-9 text-center border border-border/20 text-muted-foreground/50 bg-background/30">0</td>
                      ))}
                    </tr>
                    {strA.split('').map((ch, i) => (
                      <tr key={i}>
                        <th className={`w-9 h-9 text-sm ${activeStep?.i === i + 1 ? 'text-accent' : 'text-muted-foreground'}`}>{ch}</th>
                        <td className="w-9 h-9 text-center border border-border/20 text-muted-foreground/50 bg-background/30">0</td>
                        {strB.split('').map((_, j) => {
                          const cellKey = `${i + 1},${j + 1}`
                          const cell = filled.get(cellKey)
                          const isCurrent = activeStep && activeStep.i === i + 1 && activeStep.j === j + 1
                          const onTraceback = tracebackSet.has(cellKey)
                          const isLcsChar = lcsCharSet.has(cellKey)
                          let cls = 'bg-background/20 text-transparent'
                          if (cell) cls = 'bg-background/50 text-foreground'
                          if (cell && cell.source === 'diagonal') cls = 'bg-primary/15 text-primary font-bold'
                          if (onTraceback) cls = 'bg-amber-400/20 text-amber-500 dark:text-amber-300 font-bold'
                          if (isLcsChar) cls = 'bg-green-500/30 text-green-500 dark:text-green-300 font-extrabold'
                          if (isCurrent) cls = 'bg-accent text-accent-foreground font-extrabold scale-110'
                          return (
                            <td key={j} className={`w-9 h-9 text-center border border-border/20 transition-all duration-200 ${cls}`}>
                              {cell ? cell.value : '·'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {activeStep && (
                <div className="p-4 bg-background/25 border border-border/20 rounded-lg text-xs leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Step explanation:</span> {activeStep.explain}
                </div>
              )}

              {isDone && (
                <div className="p-3.5 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-green-500 dark:text-green-400">Traceback complete:</span> amber cells show the walk from L[{strA.length}][{strB.length}] back to the origin; green cells are diagonal moves where characters matched — together they spell <span className="font-mono font-bold text-accent">{results.lcs}</span>.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Theory */}
      <div className="mt-12 bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b border-border/20 pb-4">
          <Info className="w-6 h-6" /> Theory & Study Guide: LCS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-muted-foreground leading-relaxed">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Optimal Substructure</h3>
              <p>If the last characters match, the LCS must use that match: <span className="font-mono text-accent">L[i][j] = L[i−1][j−1] + 1</span>. Otherwise the LCS drops a character from one string: <span className="font-mono text-accent">L[i][j] = max(L[i−1][j], L[i][j−1])</span>. Overlapping subproblems make memoization (the table) essential — naive recursion is O(2^N).</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Subsequence ≠ Substring</h3>
              <p>A subsequence keeps relative order but need not be contiguous. &quot;GTAB&quot; is a subsequence of &quot;AGGTAB&quot; but not a substring. Longest Common <em>Substring</em> uses a similar table but resets to 0 on mismatch.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Real-World Applications</h3>
              <p><strong className="text-foreground">diff / git:</strong> lines kept by the LCS are &quot;unchanged&quot;; everything else becomes +/− hunks. <strong className="text-foreground">Bioinformatics:</strong> sequence alignment scoring. <strong className="text-foreground">Plagiarism detection:</strong> similarity ratio = 2·LCS / (N+M).</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Complexity</h3>
              <p>Time <span className="font-mono text-accent">O(N·M)</span>, space <span className="font-mono text-accent">O(N·M)</span> for full traceback (reducible to O(min(N,M)) with Hirschberg&apos;s algorithm if only the length is needed).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
