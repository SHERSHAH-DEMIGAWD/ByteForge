'use client'

import { useState } from 'react'
import { Play, Pause, ChevronLeft, ChevronRight, GitMerge, Info, CheckCircle2, Shield, Network } from 'lucide-react'

// Coordinate positions for rendering servers in SVG graph
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  'Server_A': { x: 80, y: 150 },
  'Server_B': { x: 220, y: 60 },
  'Server_C': { x: 220, y: 240 },
  'Server_D': { x: 420, y: 60 },
  'Server_E': { x: 420, y: 240 },
  'Server_F': { x: 560, y: 150 }
}

export default function MSTPlannerPage() {
  const [graph, setGraph] = useState<any>({
    'Server_A': { 'Server_B': 4, 'Server_C': 2 },
    'Server_B': { 'Server_A': 4, 'Server_C': 1, 'Server_D': 5 },
    'Server_C': { 'Server_A': 2, 'Server_B': 1, 'Server_D': 8, 'Server_E': 10 },
    'Server_D': { 'Server_B': 5, 'Server_C': 8, 'Server_E': 2, 'Server_F': 6 },
    'Server_E': { 'Server_C': 10, 'Server_D': 2, 'Server_F': 3 },
    'Server_F': { 'Server_D': 6, 'Server_E': 3 }
  })
  
  const [inputType, setInputType] = useState<'automatic' | 'manual'>('automatic')
  const [jsonInput, setJsonInput] = useState<string>(JSON.stringify({
    'Server_A': { 'Server_B': 4, 'Server_C': 2 },
    'Server_B': { 'Server_A': 4, 'Server_C': 1, 'Server_D': 5 },
    'Server_C': { 'Server_A': 2, 'Server_B': 1, 'Server_D': 8, 'Server_E': 10 },
    'Server_D': { 'Server_B': 5, 'Server_C': 8, 'Server_E': 2, 'Server_F': 6 },
    'Server_E': { 'Server_C': 10, 'Server_D': 2, 'Server_F': 3 },
    'Server_F': { 'Server_D': 6, 'Server_E': 3 }
  }, null, 2))

  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any>(null)
  
  // Interactive walkthrough states
  const [selectedAlgo, setSelectedAlgo] = useState<'kruskal' | 'prim'>('kruskal')
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000) // ms
  const [playIntervalId, setPlayIntervalId] = useState<NodeJS.Timeout | null>(null)

  const handleSolve = async () => {
    setLoading(true)
    setResults(null)
    setCurrentStepIdx(0)
    stopPlayback()

    let currentGraph = graph
    if (inputType === 'manual') {
      try {
        currentGraph = JSON.parse(jsonInput)
        setGraph(currentGraph)
      } catch (e: any) {
        alert('Invalid JSON input: ' + e.message)
        setLoading(false)
        return
      }
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/mst-trace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph: currentGraph })
      })

      if (!response.ok) {
        throw new Error('Failed to run MST solver on backend')
      }

      const data = await response.json()
      setResults(data)
    } catch (e: any) {
      console.error(e)
      alert(`Error solving MST: ${e.message}`)
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

  const startPlayback = (currentSteps: any[]) => {
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
    const currentSteps = results ? (selectedAlgo === 'kruskal' ? results.kruskal.steps : results.prim.steps) : []
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
    const currentSteps = results ? (selectedAlgo === 'kruskal' ? results.kruskal.steps : results.prim.steps) : []
    if (currentStepIdx < currentSteps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1)
    }
  }

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1)
    }
  }

  const activeSteps = results ? (selectedAlgo === 'kruskal' ? results.kruskal.steps : results.prim.steps) : []
  const activeStep = activeSteps[currentStepIdx] || null
  const totalCost = results ? (selectedAlgo === 'kruskal' ? results.kruskal.total_cost : results.prim.total_cost) : 0
  const finalMst = results ? (selectedAlgo === 'kruskal' ? results.kruskal.mst_edges : results.prim.mst_edges) : []

  // Check edge status in Kruskal/Prim step
  const getEdgeStatus = (u: string, v: string) => {
    if (!activeStep) return 'inactive'

    const checkMatch = (edge: any) => 
      (edge.from === u && edge.to === v) || (edge.from === v && edge.to === u)

    // Check if edge is active in this step
    if (selectedAlgo === 'kruskal' && activeStep.active_edge && checkMatch(activeStep.active_edge)) {
      // Determine if it was accepted or rejected
      const wasAccepted = activeStep.mst_edges.some((e: any) => checkMatch(e))
      return wasAccepted ? 'accepted' : 'testing'
    }

    if (selectedAlgo === 'prim' && activeStep.selected_edge && checkMatch(activeStep.selected_edge)) {
      return 'accepted'
    }

    // Check if in MST list so far
    if (activeStep.mst_edges.some((e: any) => checkMatch(e))) {
      return 'mst'
    }

    // Check if Kruskal rejected this edge in the past
    // If it's sorted, and not in remaining, and not in MST, it was evaluated and rejected
    if (selectedAlgo === 'kruskal') {
      const isRemaining = activeStep.sorted_edges.some((e: any) => checkMatch(e))
      const isMst = activeStep.mst_edges.some((e: any) => checkMatch(e))
      const isCurrentActive = activeStep.active_edge && checkMatch(activeStep.active_edge)
      if (!isRemaining && !isMst && !isCurrentActive) {
        return 'rejected'
      }
    }

    return 'inactive'
  }

  // Helper to compile all unique edges in graph
  const getAllEdges = () => {
    const edgeList: { from: string; to: string; weight: number }[] = []
    const seen = new Set<string>()
    for (const u in graph) {
      for (const v in graph[u]) {
        const key = [u, v].sort().join('-')
        if (!seen.has(key)) {
          seen.add(key)
          edgeList.push({ from: u, to: v, weight: graph[u][v] })
        }
      }
    }
    return edgeList
  }

  const allEdges = getAllEdges()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
          MST Server Planner
        </h1>
        <p className="text-muted-foreground">
          Study Unit IV Greedy Techniques by building optimal minimum-weight server routing trees using Kruskal's or Prim's algorithms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Parameters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Network className="w-5 h-5" /> Network Topologies
            </h3>
            
            <div className="flex bg-background/50 p-1 rounded-lg border border-border/20 mb-4">
              <button
                onClick={() => setInputType('automatic')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${inputType === 'automatic' ? 'bg-primary text-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Automatic
              </button>
              <button
                onClick={() => setInputType('manual')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${inputType === 'manual' ? 'bg-primary text-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Manual JSON
              </button>
            </div>

            {inputType === 'automatic' ? (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  We define a cloud topology with 6 main server nodes and 9 potential high-capacity transmission channels. Click below to load routing matrices.
                </p>

                <div className="border border-border/20 rounded-lg p-3 bg-background/40 max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2 mb-6">
                  {allEdges.map((ed, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 border-b border-border/10">
                      <span className="font-mono text-muted-foreground">
                        {ed.from.replace('Server_', '')} ── {ed.to.replace('Server_', '')}
                      </span>
                      <span className="font-mono font-bold text-accent">{ed.weight} Gbps</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mb-6 space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Adjacency List (JSON)</label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full h-48 bg-background/40 border border-border/30 rounded-lg p-3 font-mono text-xs text-foreground focus:outline-none focus:border-primary/50"
                  spellCheck={false}
                />
              </div>
            )}

            <button
              onClick={handleSolve}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
            >
              <GitMerge className="w-4 h-4" />
              {loading ? 'Compiling MST Paths...' : 'Generate Spanning Trees'}
            </button>
          </div>

          {/* Theoretical paradigm breakdowns */}
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6 space-y-4 text-xs">
            <h4 className="text-sm font-bold text-primary uppercase border-b border-border/20 pb-2">Greedy Parallels</h4>
            <div className="space-y-3">
              <div className="border-l-2 border-primary pl-2">
                <span className="font-bold text-foreground block">Kruskal's Algorithm</span>
                <span className="text-muted-foreground block mt-0.5">
                  Sorts all edges globally and adds them one by one, skipping edges that create cycles. Uses Union-Find disjoint sets. Complexity: $O(E \log E)$.
                </span>
              </div>
              <div className="border-l-2 border-accent pl-2">
                <span className="font-bold text-foreground block">Prim's Algorithm</span>
                <span className="text-muted-foreground block mt-0.5">
                  Grows tree from a single starting vertex, repeatedly choosing the minimum edge crossing the cut from visited to unvisited vertices. Complexity: $O(E \log V)$.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - SVG Graph and Step Walkthrough */}
        <div className="lg:col-span-2 space-y-6">
          {!results ? (
            <div className="bg-card/50 border border-border/30 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <Network className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Compile spanning tree paths to view the interactive server network topological graph</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Algorithm select tab */}
              <div className="bg-card/50 border border-border/30 p-4 rounded-lg flex gap-4">
                <button
                  onClick={() => {
                    setSelectedAlgo('kruskal')
                    setCurrentStepIdx(0)
                    stopPlayback()
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase border transition-all ${
                    selectedAlgo === 'kruskal'
                      ? 'bg-primary/20 text-primary border-primary/45'
                      : 'border-border/20 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Kruskal's Sort-and-Union
                </button>
                <button
                  onClick={() => {
                    setSelectedAlgo('prim')
                    setCurrentStepIdx(0)
                    stopPlayback()
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase border transition-all ${
                    selectedAlgo === 'prim'
                      ? 'bg-primary/20 text-primary border-primary/45'
                      : 'border-border/20 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Prim's Visited cut
                </button>
              </div>

              {/* SVG Graph visualizer container */}
              <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-border/20 pb-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider block">Greedy Path Player</span>
                    <span className="text-sm font-bold text-accent mt-0.5">
                      Cost Limit: <span className="font-mono text-primary">{activeStep ? activeStep.total_cost : 0}</span> / {totalCost}
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
                      Step {currentStepIdx + 1} / {activeSteps.length}
                    </span>
                  </div>
                </div>

                {/* SVG Graph Container */}
                <div className="bg-black/60 rounded-lg border border-border/15 p-4 flex justify-center relative overflow-hidden">
                  <svg viewBox="0 0 640 320" className="w-full h-auto max-w-[640px] select-none font-sans">
                    <defs>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Render regular edges */}
                    {allEdges.map((ed, idx) => {
                      const getPos = (name: string, i: number, arr: any[]) => NODE_POSITIONS[name] || { x: 320 + 200 * Math.cos(2 * Math.PI * i / arr.length), y: 160 + 100 * Math.sin(2 * Math.PI * i / arr.length) }
                      const nodesArr = Object.keys(graph)
                      const fromPos = getPos(ed.from, nodesArr.indexOf(ed.from), nodesArr)
                      const toPos = getPos(ed.to, nodesArr.indexOf(ed.to), nodesArr)
                      if (!fromPos || !toPos) return null

                      const status = getEdgeStatus(ed.from, ed.to)
                      let strokeColor = 'rgba(148, 163, 184, 0.15)'
                      let strokeWidth = '2'
                      let strokeDash = undefined

                      if (status === 'accepted' || status === 'mst') {
                        strokeColor = '#00FF88'
                        strokeWidth = '4'
                      } else if (status === 'testing') {
                        strokeColor = '#00d8ff'
                        strokeWidth = '4'
                      } else if (status === 'rejected') {
                        strokeColor = 'rgba(239, 68, 68, 0.15)'
                        strokeWidth = '1.5'
                        strokeDash = '4 4'
                      }

                      return (
                        <g key={`edge-${idx}`}>
                          <line
                            x1={fromPos.x}
                            y1={fromPos.y}
                            x2={toPos.x}
                            y2={toPos.y}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDash}
                            className="transition-all duration-300"
                            filter={(status === 'accepted' || status === 'testing') ? "url(#glow)" : ""}
                          />
                          {/* Weight badge background */}
                          <rect
                            x={(fromPos.x + toPos.x) / 2 - 12}
                            y={(fromPos.y + toPos.y) / 2 - 9}
                            width="24"
                            height="18"
                            rx="3"
                            fill="#090d16"
                            stroke="rgba(148, 163, 184, 0.2)"
                            strokeWidth="1"
                          />
                          {/* Weight label */}
                            <text
                              x={(fromPos.x + toPos.x) / 2}
                              y={(fromPos.y + toPos.y) / 2 + 4}
                              textAnchor="middle"
                              fill="#00d8ff"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                              filter={(status === 'accepted' || status === 'testing') ? "url(#glow)" : ""}
                            >
                            {ed.weight}
                          </text>
                        </g>
                      )
                    })}

                    {/* Render servers */}
                    {Object.keys(graph).map((nodeName, nodeIdx, nodesArr) => {
                      const getPos = (name: string, i: number, arr: any[]) => NODE_POSITIONS[name] || { x: 320 + 200 * Math.cos(2 * Math.PI * i / arr.length), y: 160 + 100 * Math.sin(2 * Math.PI * i / arr.length) }
                      const pos = getPos(nodeName, nodeIdx, nodesArr)

                      let isVisited = false
                      let isCurrent = false

                      if (activeStep) {
                        if (selectedAlgo === 'prim') {
                          isVisited = activeStep.visited.includes(nodeName)
                          // Check if it's the node currently selected
                          isCurrent = activeStep.selected_edge?.to === nodeName || activeStep.selected_edge?.from === nodeName
                        } else {
                          // Kruskal node highlight if connected to active edge
                          isCurrent = activeStep.active_edge?.from === nodeName || activeStep.active_edge?.to === nodeName
                          // Highlight if in MST so far
                          isVisited = activeStep.mst_edges.some((e: any) => e.from === nodeName || e.to === nodeName)
                        }
                      }

                      let nodeFill = '#141923'
                      let nodeStroke = 'rgba(148, 163, 184, 0.4)'
                      let ringScale = 1.0

                      if (isCurrent) {
                        nodeFill = '#0066ff'
                        nodeStroke = '#00d8ff'
                        ringScale = 1.15
                      } else if (isVisited) {
                        nodeFill = '#091c2b'
                        nodeStroke = '#00FF88'
                      }

                      return (
                        <g key={nodeName} transform={`translate(${pos.x}, ${pos.y}) scale(${ringScale})`} className="transition-all duration-300">
                          {/* Outer ring */}
                          <circle
                            r="22"
                            fill={nodeFill}
                            stroke={nodeStroke}
                            strokeWidth="2.5"
                          />
                          {/* Inner label */}
                          <text
                            y="-2"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="9"
                            fontWeight="bold"
                          >
                            Server
                          </text>
                          <text
                            y="8"
                            textAnchor="middle"
                            fill="#00d8ff"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {nodeName.split('_')[1]}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>

                {/* Step logging card */}
                {activeStep && (
                  <div className="p-4 bg-background/25 border border-border/20 rounded-lg text-xs leading-relaxed text-muted-foreground">
                    <span className="font-bold text-foreground block mb-1">State Log:</span>
                    {activeStep.action}
                  </div>
                )}

                {/* Union-Find Subsets (Kruskal) or Visited frontier / Priority Queue (Prim) */}
                {selectedAlgo === 'kruskal' && activeStep && (
                  <div className="p-4 bg-background/25 border border-border/20 rounded-lg space-y-3">
                    <h5 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Disjoint Sets Forest State</h5>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {Object.entries(activeStep.disjoint_sets).map(([node, parent]: any) => (
                        <div key={node} className="p-2 bg-background/40 border border-border/10 rounded-lg text-center text-xs">
                          <div className="text-[9px] text-muted-foreground uppercase">{node.replace('Server_', '')}</div>
                          <div className="font-mono text-accent font-bold mt-0.5">➔ {parent.replace('Server_', '')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAlgo === 'prim' && activeStep && (
                  <div className="p-4 bg-background/25 border border-border/20 rounded-lg space-y-3">
                    <h5 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Cheapest Fringe Queue</h5>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {activeStep.fringe.length === 0 ? (
                        <span className="text-muted-foreground italic">Fringe is empty</span>
                      ) : (
                        activeStep.fringe.map((item: any, idx: number) => (
                          <span key={idx} className="bg-background border border-border/15 px-2.5 py-1.5 rounded-lg font-mono text-[10px]">
                            ({item.weight}G, {item.from.replace('Server_', '')} ➔ {item.to.replace('Server_', '')})
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Theory & Study Guide */}
      <div className="mt-12 bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b border-border/20 pb-4">
          <Info className="w-6 h-6" /> Theory & Study Guide: Minimum Spanning Trees (MST)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Algorithm Overview</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A Minimum Spanning Tree is a subset of the edges of a connected, edge-weighted graph that connects all the vertices together, without any cycles, and with the minimum possible total edge weight.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Algorithmic Paradigm</h3>
              <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase rounded-md mb-2">Greedy Approach</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Both Prim's and Kruskal's algorithms use the Greedy approach. At each step, they make a locally optimal choice (e.g., picking the cheapest available edge) with the hope of finding a global optimum.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Complexity Envelope</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Kruskal's Time:</strong> <span className="font-mono text-accent">O(E log E)</span> (Sorting the edges dominates)</li>
                <li><strong className="text-foreground">Prim's Time:</strong> <span className="font-mono text-accent">O(E log V)</span> (Using a Min-Priority Queue)</li>
                <li><strong className="text-foreground">Auxiliary Space:</strong> <span className="font-mono text-accent">O(V)</span> (For Disjoint Sets or Priority Queue mappings)</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Step-by-Step Mechanisms</h3>
              
              <div className="mb-4">
                <strong className="text-accent text-sm block mb-1">Kruskal's Algorithm (Edge-based)</strong>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Sort all edges in ascending order of their weight.</li>
                  <li>Pick the smallest edge. Check if it forms a cycle with the spanning tree formed so far using a <strong className="text-foreground">Disjoint Set (Union-Find)</strong> data structure.</li>
                  <li>If no cycle is formed, include this edge. Else, discard it.</li>
                  <li>Repeat until there are $V - 1$ edges in the spanning tree.</li>
                </ul>
              </div>

              <div>
                <strong className="text-accent text-sm block mb-1">Prim's Algorithm (Vertex-based)</strong>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Initialize a tree with a single, arbitrarily chosen vertex.</li>
                  <li>Maintain a fringe (priority queue) of all edges connecting the tree to vertices not yet in the tree.</li>
                  <li>Greedy pick the minimum-weight edge from the fringe and add the corresponding vertex to the tree.</li>
                  <li>Update the fringe and repeat until all vertices are included.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
