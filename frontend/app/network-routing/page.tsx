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

  const [inputType, setInputType] = useState<'automatic' | 'manual'>('automatic')
  const [jsonInput, setJsonInput] = useState<string>(JSON.stringify({
    'Server_A': { 'Server_B': 4, 'Server_C': 2 },
    'Server_B': { 'Server_C': 1, 'Server_D': 5 },
    'Server_C': { 'Server_B': 1, 'Server_D': 8, 'Server_E': 10 },
    'Server_D': { 'Server_E': 2, 'Server_F': 6 },
    'Server_E': { 'Server_D': 2, 'Server_F': 3 },
    'Server_F': {}
  }, null, 2))
  
  const [startNode, setStartNode] = useState<string>('Server_A')
  const [endNode, setEndNode] = useState<string>('Server_F')
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any>(null)
  
  // Walkthrough State
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0)
  
  let nodes = Object.keys(graph)
  if (inputType === 'manual') {
    try {
      nodes = Object.keys(JSON.parse(jsonInput))
    } catch(e) {}
  }

  const handleSolve = async () => {
    setLoading(true)
    setResults(null)
    setCurrentStepIdx(0)
    
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
      const payload = {
        graph: currentGraph,
        start: startNode,
        end: endNode
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/dijkstra-routing`, {
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
                <div className="flex bg-background/50 p-1 rounded-lg border border-border/20 mb-2">
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
                                  <span>→ {toNode.split('_')[1] || toNode}</span>
                                  <span className="text-accent">{weight} ms</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Adjacency List (JSON)</label>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="w-full h-48 bg-background/40 border border-border/30 rounded-lg p-3 font-mono text-xs text-foreground focus:outline-none focus:border-primary/50"
                      spellCheck={false}
                    />
                  </div>
                )}
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
                    {results.shortest_path.map((n: string) => n.replace('Server_', '')).join(' ➔ ')}
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
                        borderClass = 'border-[#00d8ff] bg-[#00d8ff]/20 text-[#00d8ff] font-bold scale-105 shadow-[0_0_20px_#00d8ff]'
                      } else if (isVisited) {
                        borderClass = 'border-[#00FF88] bg-[#00FF88]/20 text-[#00FF88] font-bold shadow-[0_0_15px_rgba(0,255,136,0.3)]'
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

      {/* Theory & Study Guide */}
      <div className="mt-12 bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b border-border/20 pb-4">
          <Info className="w-6 h-6" /> Theory & Study Guide: Single Source Shortest Path
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Algorithm Overview</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dijkstra's algorithm finds the shortest paths between nodes in a graph. Given a source node, it calculates the lowest-cost route to all other reachable nodes.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Algorithmic Paradigm</h3>
              <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase rounded-md mb-2">Greedy Approach</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                It uses a Greedy strategy: it maintains a priority queue of unvisited nodes and always selects the one with the smallest tentative distance from the source.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Complexity Envelope</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Time Complexity:</strong> <span className="font-mono text-accent">O((V + E) log V)</span> (When using an adjacency list and a Min-Heap / Priority Queue)</li>
                <li><strong className="text-foreground">Auxiliary Space:</strong> <span className="font-mono text-accent">O(V)</span> (To store the distance array, visited set, and Priority Queue)</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Step-by-Step Mechanisms</h3>
              
              <div className="mb-4">
                <strong className="text-accent text-sm block mb-1">Dijkstra's Logic</strong>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Set the distance to the source node to $0$ and to all other nodes to $\infty$.</li>
                  <li>Insert all nodes into a Min-Priority Queue.</li>
                  <li>Extract the node $U$ with the minimum distance from the queue.</li>
                  <li>For each neighbor $V$ of $U$, perform <strong className="text-foreground">Edge Relaxation</strong>: if $dist[U] + weight(U, V) &lt; dist[V]$, update $dist[V]$ to the new smaller distance.</li>
                  <li>Mark $U$ as visited and repeat until the queue is empty.</li>
                </ul>
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <strong className="text-red-400 text-xs block mb-1">Limitation: Negative Weights</strong>
                <p className="text-xs text-muted-foreground">
                  Dijkstra's fails if the graph has negative edge weights. Because it strictly visits each node once and assumes paths only get longer, a negative edge can create a shorter path to a previously "finished" node, breaking the greedy guarantee. (Use Bellman-Ford instead for negative weights).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
