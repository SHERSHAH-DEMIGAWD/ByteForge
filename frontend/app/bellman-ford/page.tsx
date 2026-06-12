'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause, GitBranch, Info, AlertTriangle } from 'lucide-react'
import { ShareButton } from '@/components/share-button'
import { ExportReportButton } from '@/components/export-report'
import { useSharedParams } from '@/lib/share'
import { useStepPlayer } from '@/lib/use-step-player'

const PRESETS: Record<string, { label: string; desc: string; edges: string; start: string; end: string }> = {
  classic: {
    label: 'Classic Negative Edge',
    desc: 'Dijkstra fails here — the cheap route to D goes through a negative edge.',
    edges: 'A B 4\nA C 2\nB C -3\nB D 2\nC D 4',
    start: 'A',
    end: 'D',
  },
  discount: {
    label: 'Refund / Discount Network',
    desc: 'Edge weights model costs with cashback (negative) hops.',
    edges: 'S A 10\nS E 8\nA C 2\nB A 1\nC B -2\nD C -1\nD A -4\nE D 1',
    start: 'S',
    end: 'B',
  },
  negcycle: {
    label: 'Negative Cycle Trap',
    desc: 'Contains a reachable negative-weight cycle — no shortest path exists.',
    edges: 'A B 1\nB C 2\nC D -3\nD B -1\nC E 5',
    start: 'A',
    end: 'E',
  },
}

function parseEdges(text: string): { graph: Record<string, Record<string, number>>; vertices: string[] } {
  const graph: Record<string, Record<string, number>> = {}
  const vertices = new Set<string>()
  for (const line of text.split('\n')) {
    const parts = line.trim().split(/[\s,]+/)
    if (parts.length < 3) continue
    const [u, v, wRaw] = parts
    const w = parseInt(wRaw)
    if (!u || !v || isNaN(w)) continue
    if (!graph[u]) graph[u] = {}
    graph[u][v] = w
    vertices.add(u)
    vertices.add(v)
  }
  return { graph, vertices: [...vertices].sort() }
}

export default function BellmanFordPage() {
  const [edgesText, setEdgesText] = useState<string>(PRESETS.classic.edges)
  const [startNode, setStartNode] = useState<string>('A')
  const [endNode, setEndNode] = useState<string>('D')
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any>(null)

  useSharedParams((params) => {
    const e = params.get('edges')
    if (e) setEdgesText(e.split(';').join('\n'))
    const s = params.get('start')
    if (s) setStartNode(s)
    const t = params.get('end')
    if (t) setEndNode(t)
  })

  const { vertices } = parseEdges(edgesText)

  const handleSolve = async () => {
    const { graph } = parseEdges(edgesText)
    if (Object.keys(graph).length === 0) {
      alert('Enter at least one edge as: FROM TO WEIGHT (one per line)')
      return
    }
    setLoading(true)
    setResults(null)
    reset()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/bellman-ford`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph, start: startNode, end: endNode || null }),
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

  const steps = results?.steps || []
  const { currentStepIdx, isPlaying, togglePlay, next, prev, reset } = useStepPlayer(steps.length)
  const activeStep = steps[currentStepIdx] || null

  // Circular SVG layout
  const positions: Record<string, { x: number; y: number }> = {}
  const verts: string[] = results?.vertices || vertices
  verts.forEach((v, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, verts.length) - Math.PI / 2
    positions[v] = { x: 300 + 200 * Math.cos(angle), y: 190 + 140 * Math.sin(angle) }
  })

  const isPathEdge = (u: string, v: string) => {
    const p: string[] = results?.path || []
    for (let i = 0; i < p.length - 1; i++) if (p[i] === u && p[i + 1] === v) return true
    return false
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
            Bellman-Ford Relaxation Lab
          </h1>
          <p className="text-muted-foreground">
            Unit IV Dynamic Programming: shortest paths that survive negative edge weights — where Dijkstra&apos;s greedy choice fails.
          </p>
        </div>
        <div className="flex gap-2">
          <ShareButton state={{ edges: edgesText.split('\n').join(';'), start: startNode, end: endNode }} />
          <ExportReportButton
            disabled={!results}
            getReport={() => ({
              title: 'Bellman-Ford Shortest Path Report',
              subtitle: `Source vertex: ${startNode}${endNode ? ` — target: ${endNode}` : ''}`,
              metrics: [
                { label: 'Vertices', value: results?.vertices?.length ?? 0 },
                { label: 'Edges', value: results?.edges?.length ?? 0 },
                { label: 'Relaxations Applied', value: results?.total_relaxations ?? 0 },
                { label: 'Negative Cycle', value: results?.negative_cycle ? 'DETECTED' : 'None' },
              ],
              tables: [
                {
                  title: 'Final Shortest Distances',
                  headers: ['Vertex', 'Distance from ' + startNode, 'Predecessor'],
                  rows: Object.entries(results?.distances || {}).map(([v, d]: any) => [
                    v,
                    d === null ? 'unreachable' : d,
                    results?.predecessors?.[v] ?? '-',
                  ]),
                },
              ],
              notes: [
                'Bellman-Ford relaxes every edge V-1 times: any shortest path uses at most V-1 edges.',
                'A V-th pass that still improves a distance proves a reachable negative-weight cycle.',
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
              <GitBranch className="w-5 h-5" /> Directed Graph Setup
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase block">Preset Scenarios</label>
              {Object.entries(PRESETS).map(([key, preset]) => (
                <div
                  key={key}
                  onClick={() => {
                    setEdgesText(preset.edges)
                    setStartNode(preset.start)
                    setEndNode(preset.end)
                    setResults(null)
                  }}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    edgesText === preset.edges ? 'border-primary bg-primary/10' : 'border-border/30 bg-background/40 hover:bg-background/80'
                  }`}
                >
                  <div className="font-bold text-xs text-primary mb-0.5">{preset.label}</div>
                  <div className="text-[10px] text-muted-foreground">{preset.desc}</div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
                Edge List (FROM TO WEIGHT per line — negatives allowed)
              </label>
              <textarea
                value={edgesText}
                onChange={(e) => setEdgesText(e.target.value)}
                className="w-full h-36 bg-background border border-border/30 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-primary/50 text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">Source</label>
                <select
                  value={startNode}
                  onChange={(e) => setStartNode(e.target.value)}
                  className="w-full bg-background border border-border/30 rounded-lg p-2.5 text-sm focus:outline-none text-foreground"
                >
                  {vertices.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">Target</label>
                <select
                  value={endNode}
                  onChange={(e) => setEndNode(e.target.value)}
                  className="w-full bg-background border border-border/30 rounded-lg p-2.5 text-sm focus:outline-none text-foreground"
                >
                  {vertices.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleSolve}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Relaxing Edges...' : 'Run Bellman-Ford'}
            </button>
          </div>

          {/* Distance table */}
          {activeStep && (
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-3">
              <h4 className="text-sm font-bold text-primary uppercase">Distance Vector (Live)</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(activeStep.distances).map(([v, d]: any) => (
                  <div
                    key={v}
                    className={`p-2 rounded border text-center text-xs font-mono transition-all ${
                      activeStep.edge && activeStep.updated && activeStep.edge.v === v
                        ? 'bg-green-500/20 border-green-500/60 text-green-400 font-bold scale-105'
                        : 'bg-background/50 border-border/20 text-foreground'
                    }`}
                  >
                    <div className="text-muted-foreground">{v}</div>
                    <div className="font-bold">{d === null ? '∞' : d}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {!results ? (
            <div className="bg-card/50 border border-border/30 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <GitBranch className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Define a directed graph (negative weights welcome) and run the relaxation engine</p>
            </div>
          ) : (
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-5">
              {/* Player controls */}
              <div className="flex justify-between items-center border-b border-border/30 pb-4">
                <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  Pass {activeStep?.iteration ?? 0} / {Math.max(0, (results.vertices?.length ?? 1) - 1)} — Edge Relaxation Player
                </span>
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

              {/* Negative cycle banner */}
              {results.negative_cycle && (
                <div className="p-3.5 bg-destructive/10 border border-destructive/40 rounded-lg flex items-center gap-2.5 text-sm text-destructive font-bold">
                  <AlertTriangle className="w-5 h-5" /> Negative-weight cycle detected — shortest paths are undefined!
                </div>
              )}

              {/* SVG Graph */}
              <div className="bg-black/60 border border-border/15 rounded-lg overflow-hidden">
                <svg viewBox="0 0 600 380" className="w-full h-auto select-none">
                  <defs>
                    <marker id="bf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(148,163,184,0.6)" />
                    </marker>
                    <marker id="bf-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#00d8ff" />
                    </marker>
                    <marker id="bf-arrow-path" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#00ff88" />
                    </marker>
                  </defs>
                  {(results.edges || []).map((e: any, idx: number) => {
                    const p1 = positions[e.u], p2 = positions[e.v]
                    if (!p1 || !p2) return null
                    const dx = p2.x - p1.x, dy = p2.y - p1.y
                    const len = Math.sqrt(dx * dx + dy * dy)
                    const ux = dx / len, uy = dy / len
                    const sx = p1.x + ux * 24, sy = p1.y + uy * 24
                    const ex = p2.x - ux * 26, ey = p2.y - uy * 26
                    const isActive = activeStep?.edge && activeStep.edge.u === e.u && activeStep.edge.v === e.v
                    const onPath = isPathEdge(e.u, e.v) && currentStepIdx === steps.length - 1
                    const stroke = onPath ? '#00ff88' : isActive ? '#00d8ff' : e.w < 0 ? 'rgba(255,120,90,0.55)' : 'rgba(148,163,184,0.35)'
                    return (
                      <g key={idx}>
                        <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={stroke} strokeWidth={isActive || onPath ? 3 : 1.5}
                          markerEnd={`url(#bf-arrow${onPath ? '-path' : isActive ? '-active' : ''})`} className="transition-all duration-300" />
                        <text x={(sx + ex) / 2 + uy * 12} y={(sy + ey) / 2 - ux * 12} fill={e.w < 0 ? '#ff8866' : '#94a3b8'}
                          fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{e.w}</text>
                      </g>
                    )
                  })}
                  {verts.map((v) => {
                    const pos = positions[v]
                    if (!pos) return null
                    const d = activeStep?.distances?.[v]
                    const isSource = v === startNode
                    const isUpdated = activeStep?.edge && activeStep.updated && activeStep.edge.v === v
                    return (
                      <g key={v} className="transition-all duration-300">
                        <circle cx={pos.x} cy={pos.y} r="22"
                          fill={isUpdated ? 'rgba(0,255,136,0.2)' : isSource ? 'rgba(0,102,255,0.3)' : 'rgba(15,23,42,0.9)'}
                          stroke={isUpdated ? '#00ff88' : isSource ? '#0066ff' : 'rgba(148,163,184,0.4)'} strokeWidth="2" />
                        <text x={pos.x} y={pos.y + 1} fill="#e2e8f0" fontSize="14" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">{v}</text>
                        <text x={pos.x} y={pos.y + 36} fill={d === null ? '#64748b' : '#00d8ff'} fontSize="11" fontWeight="bold"
                          textAnchor="middle" fontFamily="monospace">{d === null || d === undefined ? '∞' : d}</text>
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* Explanation */}
              {activeStep && (
                <div className="p-4 bg-background/25 border border-border/20 rounded-lg text-xs leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Step explanation:</span> {activeStep.explain}
                </div>
              )}

              {/* Result summary */}
              {results.path?.length > 0 && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex justify-between items-center text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase font-bold mb-1">Shortest Path {startNode} → {endNode}</span>
                    <span className="font-bold text-accent font-mono">{results.path.join(' → ')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-xs uppercase font-bold mb-1">Total Cost</span>
                    <span className="font-mono font-bold text-lg text-primary">{results.path_cost}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Theory */}
      <div className="mt-12 bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b border-border/20 pb-4">
          <Info className="w-6 h-6" /> Theory & Study Guide: Bellman-Ford
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-muted-foreground leading-relaxed">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Why Dijkstra Fails on Negative Edges</h3>
              <p>Dijkstra finalizes a vertex the moment it leaves the priority queue (greedy choice). A negative edge discovered later can produce a cheaper route into an already-finalized vertex — but Dijkstra never revisits it. Bellman-Ford makes no such commitment: it keeps relaxing all edges until distances stabilize.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">The V−1 Guarantee</h3>
              <p>Any shortest path visits at most V vertices, hence uses at most <span className="font-mono text-accent">V−1</span> edges. After pass k, all shortest paths using ≤ k edges are correct — so V−1 passes suffice. Complexity: <span className="font-mono text-accent">O(V·E)</span>, space <span className="font-mono text-accent">O(V)</span>.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Negative Cycle Detection</h3>
              <p>If a V-th pass still relaxes some edge, a reachable negative-weight cycle exists: you could loop it forever to drive the cost to −∞. This detection is exactly how arbitrage loops are found in currency-exchange graphs (using −log of exchange rates as weights).</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Viva Comparison Table</h3>
              <p><strong className="text-foreground">Dijkstra:</strong> greedy, O((V+E) log V), positive weights only. <strong className="text-foreground">Bellman-Ford:</strong> DP, O(V·E), handles negatives + detects cycles. <strong className="text-foreground">Floyd-Warshall:</strong> DP, O(V³), all-pairs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
