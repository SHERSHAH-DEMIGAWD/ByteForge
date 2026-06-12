'use client'

import { useState } from 'react'
import { Grid3X3, Shuffle, Info, Zap } from 'lucide-react'
import { ShareButton } from '@/components/share-button'
import { ExportReportButton } from '@/components/export-report'
import { useSharedParams } from '@/lib/share'

function randomMatrix(n: number): number[][] {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => Math.floor(Math.random() * 9) + 1))
}

function parseMatrixParam(param: string | null, n: number): number[][] | null {
  if (!param) return null
  const vals = param.split(',').map(Number)
  if (vals.length !== n * n || vals.some(isNaN)) return null
  return Array.from({ length: n }, (_, i) => vals.slice(i * n, (i + 1) * n))
}

export default function StrassenPage() {
  const [size, setSize] = useState(4)
  const [matA, setMatA] = useState<number[][]>(() => randomMatrix(4))
  const [matB, setMatB] = useState<number[][]>(() => randomMatrix(4))
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  useSharedParams((params) => {
    const n = parseInt(params.get('n') || '')
    if ([2, 4, 8].includes(n)) {
      const a = parseMatrixParam(params.get('a'), n)
      const b = parseMatrixParam(params.get('b'), n)
      setSize(n)
      setMatA(a || randomMatrix(n))
      setMatB(b || randomMatrix(n))
    }
  })

  const changeSize = (n: number) => {
    setSize(n)
    setMatA(randomMatrix(n))
    setMatB(randomMatrix(n))
    setResults(null)
  }

  const updateCell = (which: 'a' | 'b', r: number, c: number, value: string) => {
    const v = parseInt(value)
    const setter = which === 'a' ? setMatA : setMatB
    setter((prev) => prev.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? (isNaN(v) ? 0 : v) : cell))))
    setResults(null)
  }

  const handleSolve = async () => {
    setLoading(true)
    setResults(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/strassen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: matA, b: matB }),
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

  const MatrixGrid = ({ m, which, editable }: { m: number[][]; which?: 'a' | 'b'; editable?: boolean }) => (
    <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${m.length}, minmax(0, 1fr))` }}>
      {m.map((row, r) =>
        row.map((val, c) =>
          editable && which ? (
            <input
              key={`${r}-${c}`}
              type="number"
              value={val}
              onChange={(e) => updateCell(which, r, c, e.target.value)}
              className="w-11 h-9 bg-background border border-border/30 rounded text-center font-mono text-xs focus:outline-none focus:border-primary/60 text-foreground"
            />
          ) : (
            <div key={`${r}-${c}`} className="w-11 h-9 bg-primary/10 border border-primary/25 rounded flex items-center justify-center font-mono text-xs font-bold text-primary">
              {val}
            </div>
          )
        )
      )}
    </div>
  )

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
            Strassen Matrix Multiplication
          </h1>
          <p className="text-muted-foreground">
            Unit II Divide & Conquer: 7 clever block products instead of 8 — turning O(N³) into O(N^2.807).
          </p>
        </div>
        <div className="flex gap-2">
          <ShareButton state={{ n: size, a: matA.flat().join(','), b: matB.flat().join(',') }} />
          <ExportReportButton
            disabled={!results}
            getReport={() => ({
              title: 'Strassen vs Naive Multiplication Report',
              subtitle: `${size}×${size} integer matrices`,
              metrics: [
                { label: 'Naive Multiplications (N³)', value: results?.naive_multiplications ?? 0 },
                { label: 'Strassen Multiplications (7^log₂N)', value: results?.strassen_multiplications ?? 0 },
                { label: 'Multiplications Saved', value: `${results?.savings_percent ?? 0}%` },
                { label: 'Results Identical', value: results?.results_match ? 'Yes' : 'NO — bug!' },
              ],
              notes: [
                'Strassen replaces the 8 recursive block products of naive divide & conquer with 7 (M1..M7), at the cost of 18 extra block additions.',
                'The recurrence T(N) = 7T(N/2) + O(N²) solves to O(N^log₂7) ≈ O(N^2.807) by the Master Theorem.',
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
              <Grid3X3 className="w-5 h-5" /> Matrix Setup
            </h3>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Size (power of 2)</label>
              <div className="flex gap-2">
                {[2, 4, 8].map((s) => (
                  <button
                    key={s}
                    onClick={() => changeSize(s)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                      size === s ? 'border-primary bg-primary/15 text-primary' : 'border-border/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s}×{s}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => { setMatA(randomMatrix(size)); setMatB(randomMatrix(size)); setResults(null) }}
              className="w-full py-2 bg-background border border-border/30 hover:border-primary/50 rounded-lg text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
            >
              <Shuffle className="w-3.5 h-3.5" /> Randomize Matrices
            </button>
            <button
              onClick={handleSolve}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Multiplying...' : 'Multiply Both Ways'}
            </button>
          </div>

          {/* The 7 formulas */}
          <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-2">
            <h4 className="text-sm font-bold text-primary uppercase mb-3">The 7 Strassen Products</h4>
            {(results?.formulas || [
              'M1 = (A11 + A22)(B11 + B22)',
              'M2 = (A21 + A22) B11',
              'M3 = A11 (B12 - B22)',
              'M4 = A22 (B21 - B11)',
              'M5 = (A11 + A12) B22',
              'M6 = (A21 - A11)(B11 + B12)',
              'M7 = (A12 - A22)(B21 + B22)',
              'C11 = M1 + M4 - M5 + M7',
              'C12 = M3 + M5',
              'C21 = M2 + M4',
              'C22 = M1 - M2 + M3 + M6',
            ]).map((f: string, i: number) => (
              <div key={i} className={`font-mono text-[11px] px-2 py-1 rounded ${i < 7 ? 'bg-primary/8 text-accent' : 'bg-background/40 text-muted-foreground'}`}>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Matrices + results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card/50 border border-border/30 rounded-lg p-6">
            <h4 className="text-sm font-bold text-primary uppercase mb-4">Input Matrices (editable)</h4>
            <div className="flex flex-wrap gap-8 items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase">Matrix A</div>
                <MatrixGrid m={matA} which="a" editable />
              </div>
              <div className="text-2xl font-bold text-muted-foreground">×</div>
              <div className="text-center space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase">Matrix B</div>
                <MatrixGrid m={matB} which="b" editable />
              </div>
            </div>
          </div>

          {results && (
            <>
              {/* Multiplication count battle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card/50 border border-border/30 rounded-lg p-6 text-center space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase">Naive Divide & Conquer</div>
                  <div className="text-4xl font-extrabold text-destructive font-mono">{results.naive_multiplications}</div>
                  <div className="text-[11px] text-muted-foreground">scalar multiplications — N³ = {size}³</div>
                  <div className="h-2 rounded bg-background/60 overflow-hidden">
                    <div className="h-full bg-destructive/70" style={{ width: '100%' }} />
                  </div>
                </div>
                <div className="bg-card/50 border border-border/30 rounded-lg p-6 text-center space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase">Strassen</div>
                  <div className="text-4xl font-extrabold text-accent font-mono">{results.strassen_multiplications}</div>
                  <div className="text-[11px] text-muted-foreground">scalar multiplications — 7^log₂{size} ({results.savings_percent}% saved)</div>
                  <div className="h-2 rounded bg-background/60 overflow-hidden">
                    <div className="h-full bg-accent/80" style={{ width: `${(100 * results.strassen_multiplications) / Math.max(1, results.naive_multiplications)}%` }} />
                  </div>
                </div>
              </div>

              {/* Result matrix */}
              <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-primary uppercase">Product C = A × B</h4>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded ${results.results_match ? 'bg-green-500/15 text-green-400' : 'bg-destructive/15 text-destructive'}`}>
                    {results.results_match ? '✓ Strassen result matches naive result' : '✕ MISMATCH'}
                  </span>
                </div>
                <div className="flex justify-center">
                  <MatrixGrid m={results.result} />
                </div>
              </div>

              {/* Recursion log */}
              {results.steps?.length > 0 && (
                <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-3">
                  <h4 className="text-sm font-bold text-primary uppercase">Recursion Trace</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {results.steps.map((s: any, i: number) => (
                      <div key={i} className="text-[11px] text-muted-foreground font-mono px-3 py-1.5 bg-background/40 border border-border/15 rounded" style={{ marginLeft: `${s.level * 16}px` }}>
                        {s.explain}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Theory */}
      <div className="mt-12 bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b border-border/20 pb-4">
          <Info className="w-6 h-6" /> Theory & Study Guide: Strassen
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-muted-foreground leading-relaxed">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">The Master Theorem Argument</h3>
              <p>Naive block multiplication: <span className="font-mono text-accent">T(N) = 8T(N/2) + O(N²)</span> → O(N³), no improvement. Strassen: <span className="font-mono text-accent">T(N) = 7T(N/2) + O(N²)</span> → <span className="font-mono text-accent">O(N^log₂7) ≈ O(N^2.807)</span>. Removing a single recursive call changes the exponent — the additions only affect constants.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Why It Works</h3>
              <p>The four result blocks C11..C22 need 8 products naively. Strassen&apos;s M1..M7 are chosen so each Cij is a ± combination of them — algebraic cancellation eliminates the 8th product entirely.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Practical Caveats</h3>
              <p>Strassen pays 18 block additions per level and worse cache behaviour, so real BLAS libraries only switch to it above a crossover size (N ≈ 512+), and it is numerically less stable for floating point. For exam answers: asymptotically faster, practically nuanced.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Beyond Strassen</h3>
              <p>Coppersmith–Winograd and successors push the exponent to ≈ 2.371, but their constants are so enormous they are purely theoretical (&quot;galactic algorithms&quot;). The conjectured optimum is O(N²).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
