'use client'

import { useState } from 'react'
import { Play, Pause, ChevronLeft, ChevronRight, GitFork, Info, RefreshCw, BarChart2 } from 'lucide-react'

interface TreeNode {
  id: string
  parent_id: string | null
  label: string
  val?: number
  side?: string
  status: 'active' | 'resolved' | 'memo_hit' | 'split' | 'leaf'
}

interface RecursionStep {
  action: string
  active_call?: string
  active_node?: string
  nodes_state: TreeNode[]
  description: string
}

export default function RecursionTreePage() {
  const [fibN, setFibN] = useState<number>(5)
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any>(null)
  
  // Interactive walkthrough states
  const [selectedAlgo, setSelectedAlgo] = useState<'fib_naive' | 'fib_memo' | 'merge_split'>('fib_naive')
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000) // ms
  const [playIntervalId, setPlayIntervalId] = useState<NodeJS.Timeout | null>(null)

  const handleSolve = async () => {
    setLoading(true)
    setResults(null)
    setCurrentStepIdx(0)
    stopPlayback()

    try {
      const response = await fetch('http://localhost:8000/recursion-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n: fibN })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recursion traces from backend')
      }

      const data = await response.json()
      setResults(data)
    } catch (e: any) {
      console.error(e)
      alert(`Error loading recursion tree: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const stopPlayback = () => {
    setIsPlaying(false)
    if (playIntervalId) {
      clearInterval(playIntervalId)
      setPlayIntervalId(null)
    }
  }

  const startPlayback = (currentSteps: RecursionStep[]) => {
    if (currentSteps.length === 0) return
    setIsPlaying(true)

    if (playIntervalId) clearInterval(playIntervalId)

    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= currentSteps.length - 1) {
          clearInterval(interval)
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, playbackSpeed)

    setPlayIntervalId(interval)
  }

  const togglePlay = () => {
    const currentSteps = results ? (selectedAlgo === 'fib_naive' ? results.fib_naive.steps : selectedAlgo === 'fib_memo' ? results.fib_memo.steps : results.merge_split.steps) : []
    if (isPlaying) {
      stopPlayback()
    } else {
      if (currentStepIdx >= currentSteps.length - 1) {
        setCurrentStepIdx(0)
        startPlayback(currentSteps)
      } else {
        startPlayback(currentSteps)
      }
    }
  }

  const handleNext = () => {
    const currentSteps = results ? (selectedAlgo === 'fib_naive' ? results.fib_naive.steps : selectedAlgo === 'fib_memo' ? results.fib_memo.steps : results.merge_split.steps) : []
    if (currentStepIdx < currentSteps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1)
    }
  }

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1)
    }
  }

  const activeSteps = results ? (selectedAlgo === 'fib_naive' ? results.fib_naive.steps : selectedAlgo === 'fib_memo' ? results.fib_memo.steps : results.merge_split.steps) : []
  const activeStep = activeSteps[currentStepIdx] || null
  const totalCalls = results ? (selectedAlgo === 'fib_naive' ? results.fib_naive.total_calls : selectedAlgo === 'fib_memo' ? results.fib_memo.total_calls : results.merge_split.total_splits) : 0

  // Compute 2D node coordinates in SVG dynamically based on parent-child depth
  const computeNodePositions = (nodes: TreeNode[]) => {
    const positions: Record<string, { x: number; y: number }> = {}
    if (nodes.length === 0) return positions

    const rootNode = nodes.find(n => !n.parent_id)
    if (!rootNode) return positions

    const childrenMap: Record<string, TreeNode[]> = {}
    nodes.forEach(n => {
      if (n.parent_id) {
        if (!childrenMap[n.parent_id]) childrenMap[n.parent_id] = []
        childrenMap[n.parent_id].push(n)
      }
    })

    const assign = (nodeId: string, depth: number, minX: number, maxX: number) => {
      const x = (minX + maxX) / 2
      const y = depth * 52 + 30
      positions[nodeId] = { x, y }

      const children = childrenMap[nodeId] || []
      if (children.length === 1) {
        assign(children[0].id, depth + 1, minX, x)
      } else if (children.length === 2) {
        assign(children[0].id, depth + 1, minX, x)
        assign(children[1].id, depth + 1, x, maxX)
      }
    }

    assign(rootNode.id, 0, 10, 610)
    return positions
  }

  const nodePositions = activeStep ? computeNodePositions(activeStep.nodes_state) : {}

  const getNodeColor = (status: string, isActive: boolean) => {
    if (isActive) return { fill: '#0066ff', stroke: '#00d8ff' }
    
    switch (status) {
      case 'resolved':
        return { fill: '#0c221b', stroke: '#00FF88' }
      case 'memo_hit':
        return { fill: '#091c2b', stroke: '#00AAFF' }
      case 'active':
        return { fill: '#141923', stroke: '#00d8ff' }
      case 'split':
        return { fill: '#141923', stroke: 'rgba(148, 163, 184, 0.4)' }
      case 'leaf':
        return { fill: '#0c221b', stroke: '#00FF88' }
      default:
        return { fill: '#141923', stroke: 'rgba(148, 163, 184, 0.3)' }
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
          Recursion Tree Visualizer
        </h1>
        <p className="text-muted-foreground">
          Study Unit I, II & IV recursive call structures, recursion stack frames, and memoization memory-pruning envelopes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Setup */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <GitFork className="w-5 h-5" /> Recursion Boundary
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
                  Fibonacci Value ($N$): <span className="text-accent font-bold">{fibN}</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={fibN}
                  onChange={(e) => setFibN(parseInt(e.target.value))}
                  className="w-full accent-primary bg-background h-2 rounded-lg mb-2"
                />
                <span className="text-[10px] text-muted-foreground italic leading-relaxed block">
                  Bounded to n=8 to avoid call tree coordinates collapsing in visual overlays.
                </span>
              </div>

              <button
                onClick={handleSolve}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Generating Trees...' : 'Compute Call Stack'}
              </button>
            </div>
          </div>

          {/* Analysis metrics comparisons */}
          {results && (
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6 space-y-4">
              <h4 className="text-sm font-bold text-primary uppercase flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-primary" /> Recursion Stack Battle
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-background/50 border border-border/15 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold block text-foreground">Naive Fibonacci</span>
                    <span className="text-muted-foreground text-[10px]">Exponential time complexity</span>
                  </div>
                  <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2 py-1.5 border border-red-500/20 rounded">
                    {results.fib_naive.total_calls} calls
                  </span>
                </div>

                <div className="p-3 bg-background/50 border border-border/15 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold block text-foreground">Memoized Fibonacci</span>
                    <span className="text-muted-foreground text-[10px]">Linear time via DP caching</span>
                  </div>
                  <span className="font-mono font-bold text-green-400 bg-green-500/10 px-2 py-1.5 border border-green-500/20 rounded">
                    {results.fib_memo.total_calls} calls
                  </span>
                </div>

                <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-lg text-xs leading-relaxed text-muted-foreground">
                  <Info className="w-4 h-4 text-primary inline-block mr-1.5 -mt-0.5" />
                  <span className="font-bold text-foreground">viva Tip:</span> Notice how Memoization reduces total calls from <span className="font-bold text-red-400">{results.fib_naive.total_calls}</span> to <span className="font-bold text-green-400">{results.fib_memo.total_calls}</span>. DP stores solved values in memory, pruning redundant branches from the call tree!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Tree Simulator player */}
        <div className="lg:col-span-2 space-y-6">
          {!results ? (
            <div className="bg-card/50 border border-border/30 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <GitFork className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Compute the call stack boundaries to animate dynamic recursive tree visualizers</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Algorithm select buttons */}
              <div className="bg-card/50 border border-border/30 p-4 rounded-lg flex gap-4">
                <button
                  onClick={() => {
                    setSelectedAlgo('fib_naive')
                    setCurrentStepIdx(0)
                    stopPlayback()
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase border transition-all ${
                    selectedAlgo === 'fib_naive'
                      ? 'bg-primary/20 text-primary border-primary/45'
                      : 'border-border/20 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Naive Fibonacci Call Tree
                </button>
                <button
                  onClick={() => {
                    setSelectedAlgo('fib_memo')
                    setCurrentStepIdx(0)
                    stopPlayback()
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase border transition-all ${
                    selectedAlgo === 'fib_memo'
                      ? 'bg-primary/20 text-primary border-primary/45'
                      : 'border-border/20 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Memoized (DP) Call Tree
                </button>
                <button
                  onClick={() => {
                    setSelectedAlgo('merge_split')
                    setCurrentStepIdx(0)
                    stopPlayback()
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase border transition-all ${
                    selectedAlgo === 'merge_split'
                      ? 'bg-primary/20 text-primary border-primary/45'
                      : 'border-border/20 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Merge Sort Splits
                </button>
              </div>

              {/* Tree player console */}
              <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-border/20 pb-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider block">Tree Frame Controller</span>
                    <span className="text-sm font-bold text-accent mt-0.5">
                      Nodes rendered: <span className="font-mono text-primary">{activeStep ? activeStep.nodes_state.length : 0}</span> / {totalCalls}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrev}
                      disabled={currentStepIdx === 0}
                      className="p-2 bg-background border border-border/30 hover:border-primary/50 disabled:opacity-40 rounded-lg"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="px-4 py-2 bg-primary text-background font-bold text-xs uppercase flex items-center gap-1 rounded-lg hover:opacity-90 transition-all"
                    >
                      {isPlaying ? <><Pause className="w-3.5 h-3.5 fill-current" /> Pause</> : <><Play className="w-3.5 h-3.5 fill-current" /> Play</>}
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentStepIdx === activeSteps.length - 1}
                      className="p-2 bg-background border border-border/30 hover:border-primary/50 disabled:opacity-40 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-xs text-muted-foreground bg-black/40 px-2 py-1.5 rounded border border-border/10">
                      Frame {currentStepIdx + 1} / {activeSteps.length}
                    </span>
                  </div>
                </div>

                {/* SVG Call Tree Canvas */}
                <div className="bg-black/60 rounded-lg border border-border/15 p-4 flex justify-center relative overflow-hidden">
                  <svg viewBox="0 0 620 340" className="w-full h-auto max-w-[620px] select-none font-sans">
                    {/* Render tree connections */}
                    {activeStep && activeStep.nodes_state.map((node) => {
                      if (!node.parent_id) return null
                      const parentPos = nodePositions[node.parent_id]
                      const childPos = nodePositions[node.id]
                      if (!parentPos || !childPos) return null

                      return (
                        <line
                          key={`link-${node.id}`}
                          x1={parentPos.x}
                          y1={parentPos.y}
                          x2={childPos.x}
                          y2={childPos.y}
                          stroke={node.status === 'memo_hit' ? '#00AAFF' : node.status === 'resolved' ? '#00FF88' : 'rgba(148, 163, 184, 0.2)'}
                          strokeWidth={node.status === 'memo_hit' ? '2.5' : '1.5'}
                          className="transition-all duration-300"
                        />
                      )
                    })}

                    {/* Render tree nodes */}
                    {activeStep && activeStep.nodes_state.map((node) => {
                      const pos = nodePositions[node.id]
                      if (!pos) return null

                      const isCurrent = activeStep.active_call === node.id || activeStep.active_node === node.id
                      const colors = getNodeColor(node.status, isCurrent)

                      return (
                        <g key={`node-${node.id}`} transform={`translate(${pos.x}, ${pos.y})`} className="transition-all duration-300">
                          <rect
                            x="-22"
                            y="-12"
                            width="44"
                            height="24"
                            rx="5"
                            fill={colors.fill}
                            stroke={colors.stroke}
                            strokeWidth={isCurrent ? '2.5' : '1.5'}
                          />
                          <text
                            textAnchor="middle"
                            y="4"
                            fill="#ffffff"
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {node.label.length > 8 ? node.label.substring(0, 7) + '..' : node.label}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>

                {/* Active description log */}
                {activeStep && (
                  <div className="p-4 bg-background/25 border border-border/20 rounded-lg text-xs leading-relaxed text-muted-foreground">
                    <span className="font-bold text-foreground block mb-1">Call Stack Actions:</span>
                    {activeStep.description}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
