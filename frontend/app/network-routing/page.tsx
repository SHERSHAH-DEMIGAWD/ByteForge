'use client'

import { useState } from 'react'
import { Server, Activity, ChevronLeft, ChevronRight, Play, Square, Info, Compass } from 'lucide-react'

export default function NetworkRoutingPage() {
  const [graph, setGraph] = useState<any>({
    'Server_A': { 'Server_B': 4, 'Server_C': 2 },
    'Server_B': { 'Server_C': 1, 'Server_D': 5 },
    'Server_C': { 'Server_B': 1, 'Server_D': 8, 'Server_E': 10 },
    'Server_D': { 'Server_E': 2, 'Server_F': 6 },
    'Server_E': { 'Server_D': 2, 'Server_F': 3 },
    'Server_F': {}
  })
  
  const [startNode, setStartNode] = useState<string>('Server_A')
  const [endNode, setEndNode] = useState<string>('Server_F')
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any>(null)
  
  // Walkthrough State
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0)
  
  const nodes = Object.keys(graph)

  const handleSolve = async () => {
    setLoading(true)
    setResults(null)
    setCurrentStepIdx(0)
    
    try {
      const payload = {
        graph,
        start: startNode,
        end: endNode
      }
      
      const response = await fetch('http://localhost:8000/dijkstra-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error('Failed to run Dijkstra on backend')
      }
      
      const data = await response.json()
      setResults(data)
    } catch (e: any) {
      console.error(e)
      alert(`Error solving network route: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const activeSteps = results?.steps || []
  const activeStep = activeSteps[currentStepIdx] || null

  const handleNext = () => {
    if (currentStepIdx < activeSteps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1)
    }
  }

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
          Dijkstra Routing Simulator
        </h1>
        <p className="text-muted-foreground">
          Study Unit IV Greedy Techniques by finding the lowest-latency path to transfer files across compressed edge nodes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Server className="w-5 h-5" /> Node Setup
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">Source Server</label>
                <select
                  value={startNode}
                  onChange={(e) => setStartNode(e.target.value)}
                  className="w-full bg-background border border-border/30 rounded-lg p-3 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                >
                  {nodes.map(n => <option key={n} value={n}>{n.replace('_', ' ')}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">Destination Server</label>
                <select
                  value={endNode}
                  onChange={(e) => setEndNode(e.target.value)}
                  className="w-full bg-background border border-border/30 rounded-lg p-3 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                >
                  {nodes.map(n => <option key={n} value={n}>{n.replace('_', ' ')}</option>)}
                </select>
              </div>

              {/* Show Network Edges Configuration */}
              <div className="border-t border-border/30 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Topology Connectivity</h4>
                <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-2 text-xs">
                  {Object.entries(graph).map(([fromNode, edges]: any) => (
                    <div key={fromNode} className="p-2 bg-background/50 border border-border/10 rounded">
                      <div className="font-bold text-primary mb-1">{fromNode.replace('_', ' ')}</div>
                      {Object.keys(edges).length === 0 ? (
                        <span className="text-muted-foreground italic">No outgoing nodes</span>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                          {Object.entries(edges).map(([toNode, weight]: any) => (
                            <div key={toNode} className="flex justify-between border-b border-border/10">
                              <span>→ {toNode.split('_')[1]}</span>
                              <span className="text-accent">{weight} ms</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSolve}
                disabled={loading || startNode === endNode}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading ? 'Routing...' : 'Calculate Route'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Graph & Trace visualization */}
        <div className="lg:col-span-2 space-y-6">
          {!results ? (
            <div className="bg-card/50 border border-border/30 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <Compass className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Select edge servers and run solver to visual Dijkstra's relaxation process</p>
            </div>
          ) : (
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-6">
              {/* Shortest Path Summary */}
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex justify-between items-center text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs uppercase font-bold mb-1">Optimal Route</span>
                  <span className="font-bold text-base text-accent flex items-center gap-2">
                    {results.shortest_path.map(n => n.replace('Server_', '')).join(' ➔ ')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-xs uppercase font-bold mb-1">Total Transmission Latency</span>
                  <span className="font-mono font-bold text-lg text-primary">{results.total_distance} ms</span>
                </div>
              </div>

              {/* Step Controls */}
              <div className="flex border-b border-border/30 pb-4 justify-between items-center">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Greedy Trace Player</h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrev}
                    disabled={currentStepIdx === 0}
                    className="p-1.5 bg-background rounded-lg border border-border/30 hover:border-primary/50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-xs text-muted-foreground">
                    Step {currentStepIdx + 1} / {activeSteps.length}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={currentStepIdx === activeSteps.length - 1}
                    className="p-1.5 bg-background rounded-lg border border-border/30 hover:border-primary/50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Graph nodes visual layout */}
              <div className="p-6 bg-black/60 rounded-lg border border-border/20 relative min-h-64 flex flex-col justify-center">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-6 tracking-wider">Server Network Visualization</h4>
                
                {activeStep && (
                  <div className="grid grid-cols-3 gap-6">
                    {nodes.map((node) => {
                      const isCurrent = activeStep.node === node
                      const isVisited = activeStep.visited.includes(node)
                      const dist = activeStep.distances[node]
                      
                      let borderClass = 'border-border/30 bg-card/40 text-muted-foreground'
                      if (isCurrent) {
                        borderClass = 'border-accent bg-accent/20 text-accent font-bold scale-105 shadow-lg shadow-accent/15'
                      } else if (isVisited) {
                        borderClass = 'border-primary bg-primary/20 text-primary font-bold shadow-md shadow-primary/10'
                      }
                      
                      return (
                        <div key={node} className={`p-4 border rounded-lg flex flex-col items-center justify-center text-center transition-all ${borderClass}`}>
                          <Server className="w-6 h-6 mb-2" />
                          <span className="text-xs font-bold">{node.replace('Server_', 'Server ')}</span>
                          <span className="text-[10px] font-mono mt-1 bg-black/40 px-2 py-0.5 rounded text-white shadow-inner">
                            {dist === -1 ? '∞' : `${dist} ms`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Relaxation Logs */}
              {activeStep && (
                <div className="p-4 bg-background/20 rounded-lg border border-border/20 space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Edge Relaxation Details</h4>
                  
                  {activeStep.relaxations.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No unvisited outgoing edges to relax.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {activeStep.relaxations.map((rel: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-mono p-2 bg-background/50 rounded border border-border/10">
                          <div>
                            <span className="font-bold text-primary">{activeStep.node.replace('Server_', 'Server ')}</span>
                            <span> ➔ {rel.neighbor.replace('Server_', 'Server ')} (wt: {rel.weight}ms)</span>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground">Old: {rel.old_dist === -1 ? '∞' : `${rel.old_dist}ms`} | </span>
                            <span className="text-muted-foreground">New: {rel.new_dist}ms | </span>
                            <span className={`font-bold ${rel.relaxed ? 'text-green-400' : 'text-red-400'}`}>
                              {rel.relaxed ? 'Relaxed ✓' : 'Skipped ✕'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Priority Queue State */}
              {activeStep && (
                <div className="p-4 bg-background/20 rounded-lg border border-border/20 space-y-2 text-xs">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Priority Queue State</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeStep.queue.length === 0 ? (
                      <span className="text-muted-foreground italic">Queue is empty</span>
                    ) : (
                      activeStep.queue.map((item: any, idx: number) => (
                        <span key={idx} className="bg-card px-2.5 py-1.5 rounded-lg border border-border/20 font-mono text-[10px] shadow-sm">
                          ({item[0]}ms, {item[1].replace('Server_', 'Server ')})
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* educational tip */}
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-foreground">viva Tip:</span> Dijkstra's algorithm uses a <span className="font-bold text-accent">Greedy choice</span>. In each iteration, it selects the unvisited node with the smallest tentative distance (which is why we pop from the Min-Heap Priority Queue) and relaxes its outgoing edges. This guarantees correctness on positive weights!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
