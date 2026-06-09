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
  
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any>(null)
  
  // Walkthrough State
  const [selectedAlgo, setSelectedAlgo] = useState<'kahns' | 'dfs'>('kahns')
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0)

  const handleSolve = async () => {
    setLoading(true)
    setResults(null)
    setCurrentStepIdx(0)
    
    try {
      const response = await fetch('http://localhost:8000/topological-scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph })
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
                        else if (isInQueue) cardBg = 'bg-accent/10 border-accent/20 text-accent font-bold'
                        
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
    </div>
  )
}

// Helper reference
const False = false
const True = true
