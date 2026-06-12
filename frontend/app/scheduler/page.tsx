'use client'

import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Play, Square, Info, Layers, CheckCircle2 } from 'lucide-react'

export default function SchedulerPage() {
  const [graph, setGraph] = useState<any>({
    '1_Fundamentals': ['2_Greedy_Methods', '3_Divide_Conquer', '4_Decrease_Conquer'],
    '2_Greedy_Methods': ['5_Branch_Bound'],
    '3_Divide_Conquer': ['6_Dynamic_Prog'],
    '4_Decrease_Conquer': ['6_Dynamic_Prog', '7_Backtracking'],
    '5_Branch_Bound': [],
    '6_Dynamic_Prog': ['5_Branch_Bound', '8_NP_Completeness'],
    '7_Backtracking': ['8_NP_Completeness'],
    '8_NP_Completeness': []
  })

  const [inputType, setInputType] = useState<'automatic' | 'manual'>('automatic')
  const [jsonInput, setJsonInput] = useState<string>(JSON.stringify({
    '1_Fundamentals': ['2_Greedy_Methods', '3_Divide_Conquer', '4_Decrease_Conquer'],
    '2_Greedy_Methods': ['5_Branch_Bound'],
    '3_Divide_Conquer': ['6_Dynamic_Prog'],
    '4_Decrease_Conquer': ['6_Dynamic_Prog', '7_Backtracking'],
    '5_Branch_Bound': [],
    '6_Dynamic_Prog': ['5_Branch_Bound', '8_NP_Completeness'],
    '7_Backtracking': ['8_NP_Completeness'],
    '8_NP_Completeness': []
  }, null, 2))
  
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any>(null)
  
  // Walkthrough State
  const [selectedAlgo, setSelectedAlgo] = useState<'kahns' | 'dfs'>('kahns')
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0)

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/topological-scheduler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph: currentGraph })
      })
      
      if (!response.ok) {
        throw new Error('Failed to run Topological Sort on backend')
      }
      
      const data = await response.json()
      setResults(data)
    } catch (e: any) {
      console.error(e)
      alert(`Error running scheduler: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const activeSteps = results ? (selectedAlgo === 'kahns' ? results.kahns.steps : results.dfs.steps) : []
  const activeStep = activeSteps[currentStepIdx] || null
  const finalOrder = results ? (selectedAlgo === 'kahns' ? results.kahns.topological_order : results.dfs.topological_order) : []

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

  const formatNodeName = (name: string) => {
    return name.replace(/^[0-9]+_/, '').replace(/_/g, ' ')
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
          Topological Course Scheduler
        </h1>
        <p className="text-muted-foreground">
          Study Unit II Decrease & Conquer by generating optimal learning paths for DAA course units using DAG dependency sorting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Graph topology configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Course Graph
            </h3>

            <div className="space-y-4">
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
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The nodes represent DAA Syllabus Modules. Directed edges show pre-requisite relationships (e.g. Fundamentals must be studied before Greedy Methods).
                  </p>

                  <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar space-y-2 text-xs">
                    {Object.entries(graph).map(([fromNode, neighbors]: any) => (
                      <div key={fromNode} className="p-2.5 bg-background/50 border border-border/10 rounded">
                        <div className="font-bold text-primary mb-1">{formatNodeName(fromNode)}</div>
                        {neighbors.length === 0 ? (
                          <span className="text-muted-foreground italic text-[10px]">No prerequisites unlocked by this</span>
                        ) : (
                          <div className="space-y-0.5 text-[10px] text-muted-foreground">
                            {neighbors.map((n: string) => (
                              <div key={n} className="flex items-center gap-1.5">
                                <span className="text-accent font-bold">➔</span>
                                <span>Unlocks {formatNodeName(n)}</span>
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
                  <label className="text-xs font-bold text-muted-foreground uppercase">DAG Adjacency List (JSON)</label>
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
                className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading ? 'Scheduling...' : 'Generate Study Timeline'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Step Walkthrough */}
        <div className="lg:col-span-2 space-y-6">
          {!results ? (
            <div className="bg-card/50 border border-border/30 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Run the scheduler to compute dependency hierarchies and start the visual solver walkthrough</p>
            </div>
          ) : (
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-6">
              {/* Scheduling Path Banner */}
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
                <span className="text-muted-foreground block text-xs uppercase font-bold">Optimal Schedule Sequence</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {finalOrder.map((node: string, idx: number) => (
                    <div key={node} className="flex items-center gap-1.5">
                      <span className="font-bold bg-background border border-border/30 px-2 py-1.5 rounded text-accent font-mono">
                        {idx + 1}. {formatNodeName(node)}
                      </span>
                      {idx < finalOrder.length - 1 && <span className="text-muted-foreground">➔</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Player */}
              <div className="flex border-b border-border/30 pb-4 justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedAlgo('kahns')
                      setCurrentStepIdx(0)
                    }}
                    className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                      selectedAlgo === 'kahns'
                        ? 'bg-primary/20 text-primary border-primary/45'
                        : 'border-border/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Kahn's (In-Degrees)
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAlgo('dfs')
                      setCurrentStepIdx(0)
                    }}
                    className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                      selectedAlgo === 'dfs'
                        ? 'bg-primary/20 text-primary border-primary/45'
                        : 'border-border/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    DFS recursion
                  </button>
                </div>

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

              {/* Step visual grid */}
              {selectedAlgo === 'kahns' && activeStep && (
                <div className="space-y-6">
                  {/* Queue elements */}
                  <div className="p-4 bg-background/20 border border-border/20 rounded-lg space-y-3">
                    <h5 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Zero In-Degree Queue</h5>
                    <div className="flex gap-2">
                      {activeStep.queue.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Queue is empty</span>
                      ) : (
                        activeStep.queue.map((node: string, idx: number) => (
                          <span key={node} className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold ${idx === 0 ? 'bg-accent/20 border-accent text-accent scale-105' : 'bg-card border-border/20 text-muted-foreground'}`}>
                            {formatNodeName(node)}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Nodes and in-degree mappings */}
                  <div>
                    <h5 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">In-Degree Tracking Table</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(activeStep.indegrees).map(([node, indeg]: any) => {
                        const isInQueue = activeStep.queue.includes(node)
                        const isOrdered = activeStep.order_so_far.includes(node)
                        
                        let cardBg = 'bg-card/40 border border-border/10 text-muted-foreground'
                        if (isOrdered) cardBg = 'bg-primary/10 border-primary/20 text-primary line-through opacity-50'
                        else if (isInQueue) cardBg = 'bg-[#00d8ff]/10 border-[#00d8ff]/50 text-[#00d8ff] font-bold shadow-[0_0_15px_rgba(0,216,255,0.4)] scale-105 relative z-10'
                        
                        return (
                          <div key={node} className={`p-3 border rounded-lg text-center transition-all ${cardBg}`}>
                            <div className="text-xs truncate">{formatNodeName(node)}</div>
                            <div className="text-lg font-mono font-bold mt-1">{indeg}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {selectedAlgo === 'dfs' && activeStep && (
                <div className="space-y-6">
                  {/* Visited statuses mapping */}
                  <div>
                    <h5 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">DFS Visited Node States</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(activeStep.visited_states).map(([node, state]: any) => {
                        const isCurrent = activeStep.node === node
                        let stateText = 'Unvisited'
                        let badgeColor = 'bg-background/50 border border-border/20 text-muted-foreground'
                        
                        if (state === False) {
                          stateText = 'Visiting'
                          badgeColor = 'bg-accent/20 border-accent text-accent font-bold scale-105'
                        } else if (state === True) {
                          stateText = 'Finished'
                          badgeColor = 'bg-primary/20 border-primary text-primary font-bold line-through'
                        }
                        
                        return (
                          <div key={node} className={`p-3 border rounded-lg text-center transition-all ${isCurrent ? 'ring-2 ring-accent/60' : ''} ${badgeColor}`}>
                            <div className="text-xs truncate">{formatNodeName(node)}</div>
                            <div className="text-[10px] font-mono mt-2 font-bold uppercase tracking-wider">{stateText}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions log */}
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5 text-primary inline-block mr-1.5 -mt-0.5" />
                    DFS Stack Action: <span className="font-bold text-foreground capitalize">{activeStep.action} node</span> '{formatNodeName(activeStep.node)}'
                  </div>
                </div>
              )}

              {/* educational tip */}
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-foreground">viva Tip:</span> Kahn's algorithm resolves topological ordering iteratively by locating vertices with <span className="font-bold text-accent">in-degree = 0</span>, appending them to the queue, and removing their outgoing edges. If nodes remain unscheduled, a cycle exists!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Theory & Study Guide */}
      <div className="mt-12 bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b border-border/20 pb-4">
          <Info className="w-6 h-6" /> Theory & Study Guide: Topological Sorting
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Algorithm Overview</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Topological Sorting provides a linear ordering of vertices in a Directed Acyclic Graph (DAG) such that for every directed edge $U \to V$, vertex $U$ comes before $V$. It is commonly used for scheduling tasks with dependencies.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Algorithmic Paradigm</h3>
              <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase rounded-md mb-2">Graph Traversal</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This algorithm leverages standard graph traversals. Kahn's uses a BFS-like iterative approach tracking incoming edges (in-degrees), whereas the DFS approach goes deep and appends finished nodes to the front of the sorted list.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Complexity Envelope</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Time Complexity:</strong> <span className="font-mono text-accent">O(V + E)</span> (Every vertex and edge is processed exactly once)</li>
                <li><strong className="text-foreground">Auxiliary Space:</strong> <span className="font-mono text-accent">O(V)</span> (For the queue/stack and in-degree/visited arrays)</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Step-by-Step Mechanisms</h3>
              
              <div className="mb-4">
                <strong className="text-accent text-sm block mb-1">Kahn's Algorithm (In-degree)</strong>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Compute the in-degree (number of incoming edges) for all vertices.</li>
                  <li>Push all vertices with an in-degree of $0$ into a queue.</li>
                  <li>While the queue is not empty, dequeue vertex $U$ and append it to the sorted order.</li>
                  <li>For each neighbor $V$ of $U$, decrement its in-degree by 1. If it becomes $0$, push $V$ to the queue.</li>
                  <li>If the final sorted list has fewer than $V$ elements, the graph has a cycle!</li>
                </ul>
              </div>

              <div>
                <strong className="text-accent text-sm block mb-1">DFS-based Topological Sort</strong>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Initialize all vertices as unvisited.</li>
                  <li>For each unvisited vertex, launch a recursive Depth First Search (DFS).</li>
                  <li>In DFS, mark the current vertex as visiting. Recurse into all its unvisited neighbors.</li>
                  <li>Once all neighbors are fully explored, mark the vertex as finished and push it onto a stack.</li>
                  <li>Popping all elements from the stack gives the topological order.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper reference
const False = false
const True = true
