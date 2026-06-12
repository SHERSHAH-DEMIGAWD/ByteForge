'use client'

import { useState } from 'react'
import { Play, Pause, ChevronLeft, ChevronRight, Shuffle, RefreshCw, BarChart2, Info, CheckCircle2 } from 'lucide-react'
import { ShareButton } from '@/components/share-button'
import { ExportReportButton } from '@/components/export-report'
import { useSharedParams } from '@/lib/share'

interface SortStep {
  array: number[]
  pivot_idx?: number
  left_ptr?: number
  right_ptr?: number
  swap?: number[] | null
  bounds?: number[]
  active_indices?: number[]
  active_idx?: number
  left?: number
  mid?: number
  right?: number
  type?: string
  temp_array?: number[]
  heap_size?: number
  action?: string
  description: string
}

export default function SortingLabPage() {
  const [inputArrayStr, setInputArrayStr] = useState<string>('34, 8, 64, 51, 32, 21, 9, 15')
  const [inputType, setInputType] = useState<'automatic' | 'manual'>('automatic')
  const [arraySize, setArraySize] = useState<number>(8)
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedAlgo, setSelectedAlgo] = useState<'quick' | 'merge' | 'heap' | 'counting' | 'bubble' | 'selection'>('quick')
  
  // Trace states
  const [traces, setTraces] = useState<Record<string, SortStep[]>>({})
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(800) // ms
  const [playIntervalId, setPlayIntervalId] = useState<NodeJS.Timeout | null>(null)
  
  // Benchmark comparison results
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null)

  // Restore inputs from a shared link (?arr=34,8,64&algo=quick)
  useSharedParams((params) => {
    const arr = params.get('arr')
    if (arr) {
      setInputArrayStr(arr.split(',').map((x) => x.trim()).filter(Boolean).join(', '))
      setInputType('manual')
    }
    const algo = params.get('algo')
    if (algo && ['quick', 'merge', 'heap', 'counting', 'bubble', 'selection'].includes(algo)) {
      setSelectedAlgo(algo as any)
    }
  })

  const generateRandomArray = () => {
    const arr = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 80) + 10)
    setInputArrayStr(arr.join(', '))
    setTraces({})
    setBenchmarkResults(null)
    setCurrentStepIdx(0)
    stopPlayback()
  }

  const getArrayFromInput = (): number[] => {
    return inputArrayStr
      .split(',')
      .map(x => parseInt(x.trim()))
      .filter(x => !isNaN(x))
  }

  const handleFetchTraces = async () => {
    const arr = getArrayFromInput()
    if (arr.length === 0) {
      alert('Please enter a valid array of numbers.')
      return
    }

    setLoading(true)
    setTraces({})
    setBenchmarkResults(null)
    setCurrentStepIdx(0)
    stopPlayback()

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/sorting-trace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ array: arr })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sorting traces from server')
      }

      const data = await response.json()
      setTraces(data)
      
      // Compute benchmark counts immediately
      const benchmarks = {
        quick: { steps: data.quick.length, complexity: 'O(N log N)', paradigm: 'Divide & Conquer', worst: 'O(N²)' },
        merge: { steps: data.merge.length, complexity: 'O(N log N)', paradigm: 'Divide & Conquer', worst: 'O(N log N)' },
        heap: { steps: data.heap.length, complexity: 'O(N log N)', paradigm: 'Transform & Conquer', worst: 'O(N log N)' },
        counting: { steps: data.counting.length, complexity: 'O(N + K)', paradigm: 'Space-Time Tradeoffs', worst: 'O(N + K)' },
        bubble: { steps: data.bubble.length, complexity: 'O(N²)', paradigm: 'Brute Force', worst: 'O(N²)' },
        selection: { steps: data.selection.length, complexity: 'O(N²)', paradigm: 'Brute Force', worst: 'O(N²)' },
      }
      setBenchmarkResults(benchmarks)

    } catch (e: any) {
      console.error(e)
      alert(`Error fetching traces: ${e.message}`)
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

  const startPlayback = (currentSteps: SortStep[]) => {
    if (currentSteps.length === 0) return
    setIsPlaying(true)
    
    // Clear any existing
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
    const currentSteps = traces[selectedAlgo] || []
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
    const currentSteps = traces[selectedAlgo] || []
    if (currentStepIdx < currentSteps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1)
    }
  }

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1)
    }
  }

  const activeSteps = traces[selectedAlgo] || []
  const activeStep = activeSteps[currentStepIdx] || null

  const getBarColor = (idx: number): string => {
    if (!activeStep) return 'bg-primary/20 border-primary/40 text-primary'

    // Swapping state
    if (activeStep.swap && activeStep.swap.includes(idx)) {
      return 'bg-destructive/40 border-destructive text-destructive font-bold animate-pulse scale-105'
    }

    // Explicit active indices (Bubble/Selection/Heap)
    if (activeStep.active_indices && activeStep.active_indices.includes(idx)) {
      return 'bg-accent/40 border-accent text-accent font-bold scale-105 shadow-md shadow-accent/15'
    }

    // Quick sort pointers
    if (selectedAlgo === 'quick') {
      if (idx === activeStep.pivot_idx) {
        return 'bg-purple-500/40 border-purple-400 text-purple-200 font-bold scale-105'
      }
      if (idx === activeStep.left_ptr || idx === activeStep.right_ptr) {
        return 'bg-accent/30 border-accent/70 text-accent font-semibold'
      }
      if (activeStep.bounds) {
        const [low, high] = activeStep.bounds
        if (idx >= low && idx <= high) {
          return 'bg-primary/30 border-primary/50 text-foreground'
        }
      }
    }

    // Merge sort bounds
    if (selectedAlgo === 'merge') {
      const low = activeStep.left ?? -1
      const mid = activeStep.mid ?? -1
      const high = activeStep.right ?? -1
      if (low !== -1 && high !== -1 && idx >= low && idx <= high) {
        if (idx <= mid) {
          return 'bg-blue-500/20 border-blue-400/50 text-blue-300'
        } else {
          return 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
        }
      }
    }

    // Final completed step
    if (currentStepIdx === activeSteps.length - 1) {
      return 'bg-green-500/25 border-green-500/50 text-green-400'
    }

    return 'bg-primary/10 border-border/40 text-muted-foreground'
  }

  const getComplexityDetails = (algo: string) => {
    switch (algo) {
      case 'quick':
        return {
          best: 'O(N log N)',
          avg: 'O(N log N)',
          worst: 'O(N²)',
          space: 'O(log N) recursive stack',
          desc: 'Divide & Conquer: Picks a pivot element, partitions the array around the pivot, and recursively sorts the sub-arrays.'
        }
      case 'merge':
        return {
          best: 'O(N log N)',
          avg: 'O(N log N)',
          worst: 'O(N log N)',
          space: 'O(N) auxiliary array',
          desc: 'Divide & Conquer: Splits the array in half recursively, sorts each half, and merges them back in sorted order.'
        }
      case 'heap':
        return {
          best: 'O(N log N)',
          avg: 'O(N log N)',
          worst: 'O(N log N)',
          space: 'O(1) auxiliary',
          desc: 'Transform & Conquer: Builds a Max-Heap binary tree representation of the array, repeatedly extracts the maximum element, and restores the heap property.'
        }
      case 'counting':
        return {
          best: 'O(N + K)',
          avg: 'O(N + K)',
          worst: 'O(N + K)',
          space: 'O(N + K)',
          desc: 'Space-Time Tradeoff: Non-comparison sort that tallies frequencies of integers in a helper array, computes cumulative positions, and places elements stably.'
        }
      case 'bubble':
        return {
          best: 'O(N) sorted input',
          avg: 'O(N²)',
          worst: 'O(N²)',
          space: 'O(1) auxiliary',
          desc: 'Brute Force: Repeatedly compares adjacent elements and swaps them if they are in the wrong order. Bubbles the largest items to the end.'
        }
      case 'selection':
        return {
          best: 'O(N²)',
          avg: 'O(N²)',
          worst: 'O(N²)',
          space: 'O(1) auxiliary',
          desc: 'Brute Force: Repeatedly scans the unsorted portion of the array to find the minimum element, and swaps it into its correct starting index.'
        }
      default:
        return null
    }
  }

  const activeComplexity = getComplexityDetails(selectedAlgo)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
            Sorting Algorithm Laboratory
          </h1>
          <p className="text-muted-foreground">
            Study Unit I & II Brute Force, Divide & Conquer, and Transform & Conquer sorting paradigms with empirical benchmarking.
          </p>
        </div>
        <div className="flex gap-2">
          <ShareButton state={{ arr: getArrayFromInput().join(','), algo: selectedAlgo }} />
          <ExportReportButton
            disabled={!benchmarkResults}
            getReport={() => ({
              title: 'Sorting Laboratory Benchmark Report',
              subtitle: `Input array: [${getArrayFromInput().join(', ')}]`,
              metrics: [
                { label: 'Array Size', value: getArrayFromInput().length },
                { label: 'Algorithms Compared', value: Object.keys(benchmarkResults || {}).length },
              ],
              tables: [
                {
                  title: 'Empirical Benchmark Comparison',
                  headers: ['Algorithm', 'Paradigm', 'Avg Complexity', 'Worst Case', 'Trace Steps'],
                  rows: Object.entries(benchmarkResults || {}).map(([algo, item]: any) => [
                    `${algo.charAt(0).toUpperCase()}${algo.slice(1)} Sort`,
                    item.paradigm,
                    item.complexity,
                    item.worst,
                    item.steps,
                  ]),
                },
              ],
              notes: [
                'Trace steps count the engine-generated visualization frames; fewer steps reflect fewer comparisons/swaps on this dataset.',
                'Counting Sort bypasses the O(N log N) comparison lower bound via a space-time tradeoff.',
              ],
            })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Array Setup & Options */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Shuffle className="w-5 h-5" /> Data Stream Setup
            </h3>

            <div className="space-y-4">
              <div className="flex bg-background/50 p-1 rounded-lg border border-border/20 mb-4">
                <button
                  onClick={() => setInputType('automatic')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${inputType === 'automatic' ? 'bg-primary text-background' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Random Generator
                </button>
                <button
                  onClick={() => setInputType('manual')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${inputType === 'manual' ? 'bg-primary text-background' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Manual Array
                </button>
              </div>

              {inputType === 'manual' ? (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">Array Input (Comma Separated)</label>
                  <input
                    type="text"
                    value={inputArrayStr}
                    onChange={(e) => setInputArrayStr(e.target.value)}
                    className="w-full bg-background border border-border/30 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
                    Random Array Size: <span className="text-accent font-bold">{arraySize}</span>
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={arraySize}
                      onChange={(e) => setArraySize(parseInt(e.target.value))}
                      className="flex-1 accent-primary bg-background h-2 rounded-lg"
                    />
                    <button
                      onClick={generateRandomArray}
                      className="p-2.5 bg-background border border-border/30 hover:border-primary/50 rounded-lg text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
                    >
                      <Shuffle className="w-3.5 h-3.5" /> Generate
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleFetchTraces}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Compiling Traces...' : 'Initialize Visualizations'}
              </button>
            </div>
          </div>

          {/* Algorithm Paradigm Card */}
          {activeComplexity && (
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6 space-y-4">
              <h4 className="text-sm font-bold text-primary uppercase border-b border-border/20 pb-2">Complexity Envelope</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-background/50 border border-border/10 rounded-lg">
                  <div className="text-muted-foreground uppercase text-[9px] mb-0.5">Average Time</div>
                  <div className="font-mono font-bold text-accent text-sm">{activeComplexity.avg}</div>
                </div>
                <div className="p-2.5 bg-background/50 border border-border/10 rounded-lg">
                  <div className="text-muted-foreground uppercase text-[9px] mb-0.5">Worst Time</div>
                  <div className="font-mono font-bold text-accent text-sm">{activeComplexity.worst}</div>
                </div>
                <div className="p-2.5 bg-background/50 border border-border/10 rounded-lg col-span-2">
                  <div className="text-muted-foreground uppercase text-[9px] mb-0.5">Auxiliary Space</div>
                  <div className="font-mono font-bold text-primary text-xs">{activeComplexity.space}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeComplexity.desc}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Simulator Visualizer & Benchmark Results */}
        <div className="lg:col-span-2 space-y-6">
          {Object.keys(traces).length === 0 ? (
            <div className="bg-card/50 border border-border/30 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <BarChart2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Initialize data stream parameters to load sorting benchmarks and active simulator player</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Algorithm select buttons */}
              <div className="bg-card/50 border border-border/30 p-4 rounded-lg flex flex-wrap gap-2">
                {(['bubble', 'selection', 'quick', 'merge', 'heap', 'counting'] as const).map((algo) => (
                  <button
                    key={algo}
                    onClick={() => {
                      setSelectedAlgo(algo)
                      setCurrentStepIdx(0)
                      stopPlayback()
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                      selectedAlgo === algo
                        ? 'bg-primary/20 text-primary border-primary/45 scale-105'
                        : 'border-border/20 text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                  >
                    {algo === 'quick' ? 'Quick Sort' : algo === 'merge' ? 'Merge Sort' : algo === 'heap' ? 'Heap Sort' : algo === 'counting' ? 'Counting Sort' : algo === 'bubble' ? 'Bubble Sort' : 'Selection Sort'}
                  </button>
                ))}
              </div>

              {/* Dynamic Bar visualizer block */}
              <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-border/20 pb-4">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Step Playback Controller</span>
                    <span className="text-sm font-bold text-primary mt-0.5">
                      {selectedAlgo.charAt(0).toUpperCase() + selectedAlgo.slice(1)} Trace Simulation
                    </span>
                  </div>

                  {/* Playback step buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrev}
                      disabled={currentStepIdx === 0}
                      className="p-2 bg-background border border-border/30 hover:border-primary/50 disabled:opacity-40 rounded-lg transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="px-4 py-2 bg-primary text-background font-bold text-xs uppercase flex items-center gap-1.5 rounded-lg hover:opacity-90 transition-all"
                    >
                      {isPlaying ? <><Pause className="w-3.5 h-3.5 fill-current" /> Pause</> : <><Play className="w-3.5 h-3.5 fill-current" /> Play</>}
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentStepIdx === activeSteps.length - 1}
                      className="p-2 bg-background border border-border/30 hover:border-primary/50 disabled:opacity-40 rounded-lg transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-xs text-muted-foreground bg-black/40 px-2 py-1.5 rounded border border-border/10">
                      {currentStepIdx + 1} / {activeSteps.length}
                    </span>
                  </div>
                </div>

                {/* Speed selector */}
                <div className="flex justify-end items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Speed:</span>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => {
                      const spd = parseInt(e.target.value)
                      setPlaybackSpeed(spd)
                      if (isPlaying) {
                        stopPlayback()
                        // Resume with new speed
                        setTimeout(() => startPlayback(traces[selectedAlgo]), 50)
                      }
                    }}
                    className="bg-background border border-border/30 rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value={1500}>Slower (1.5s)</option>
                    <option value={800}>Medium (0.8s)</option>
                    <option value={300}>Fast (0.3s)</option>
                    <option value={100}>Hyper (0.1s)</option>
                  </select>
                </div>

                {/* Vertical Bars layout */}
                {activeStep && (
                  <div className="bg-black/60 border border-border/15 p-8 rounded-lg min-h-64 flex flex-col justify-end">
                    <div className="flex items-end justify-center gap-3 md:gap-4 h-48 select-none">
                      {activeStep.array.map((val, idx) => {
                        const heightPercent = Math.min(100, Math.max(10, (val / Math.max(...activeStep.array)) * 100))
                        const barColor = getBarColor(idx)
                        return (
                          <div key={idx} className="flex flex-col items-center flex-1 transition-all duration-300">
                            <span className="text-[10px] font-mono text-muted-foreground mb-1">{val}</span>
                            <div 
                              style={{ height: `${heightPercent}%` }} 
                              className={`w-full max-w-[28px] rounded-t border-t border-x transition-all duration-300 ${barColor}`} 
                            />
                            <span className="text-[9px] font-mono text-muted-foreground mt-1.5">[{idx}]</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Description details log */}
                {activeStep && (
                  <div className="p-4 bg-background/25 border border-border/20 rounded-lg text-xs leading-relaxed text-muted-foreground">
                    <span className="font-bold text-foreground">Action description:</span> {activeStep.description}
                  </div>
                )}
              </div>

              {/* Benchmarking Comparison Grid */}
              {benchmarkResults && (
                <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-4 animate-in fade-in duration-500">
                  <h4 className="text-sm font-bold text-primary uppercase flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-primary" /> Empirical Benchmarking comparison
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Number of tracing steps generated by the engine on the current input array. Lower steps reflect higher algorithmic efficiency for this dataset.
                  </p>

                  <div className="overflow-x-auto border border-border/20 rounded-lg">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="bg-background/80 border-b border-border/20">
                          <th className="py-2.5 px-4 text-left text-muted-foreground">Algorithm</th>
                          <th className="py-2.5 px-4 text-left text-muted-foreground">Paradigm</th>
                          <th className="py-2.5 px-4 text-center text-muted-foreground">Avg Complexity</th>
                          <th className="py-2.5 px-4 text-center text-muted-foreground">Worst Case</th>
                          <th className="py-2.5 px-4 text-right text-accent">Trace Steps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(benchmarkResults).map(([algo, item]: any) => {
                          const isCurrent = algo === selectedAlgo
                          return (
                            <tr key={algo} className={`border-b border-border/10 hover:bg-primary/5 transition-all ${isCurrent ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}>
                              <td className="py-3 px-4 font-bold capitalize text-foreground">{algo} Sort</td>
                              <td className="py-3 px-4 text-muted-foreground font-sans">{item.paradigm}</td>
                              <td className="py-3 px-4 text-center text-primary font-bold">{item.complexity}</td>
                              <td className="py-3 px-4 text-center text-muted-foreground">{item.worst}</td>
                              <td className="py-3 px-4 text-right text-accent font-extrabold">{item.steps}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                    <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-foreground">viva Note:</span> Sorting complexity varies heavily. Note that <span className="font-bold text-accent">Counting Sort</span> performs in linear time $O(N+K)$ because it makes space-time tradeoffs without pairwise key comparisons, making it faster than comparison limits!
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Theory & Study Guide */}
      <div className="mt-12 bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b border-border/20 pb-4">
          <Info className="w-6 h-6" /> Theory & Study Guide: Sorting Paradigms
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Algorithm Overview</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sorting is the process of rearranging a sequence of objects so as to put them in some logical order. Different algorithms employ distinct paradigms that trade off time complexity, space complexity, and stability.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Algorithmic Paradigms</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Brute Force:</strong> <span className="text-accent">Bubble / Selection</span>. Simple, exhaustive iterative scanning. $O(N^2)$ time. Good for tiny datasets.
                </li>
                <li>
                  <strong className="text-foreground">Divide & Conquer:</strong> <span className="text-accent">Quick / Merge</span>. Break the array into smaller chunks, sort them, and combine. $O(N \log N)$ time. Industry standard (e.g. V8 engine uses Timsort/Quicksort).
                </li>
                <li>
                  <strong className="text-foreground">Transform & Conquer:</strong> <span className="text-accent">Heap Sort</span>. Build a specialized data structure (a Max-Heap), then repeatedly extract the largest element. $O(N \log N)$ time with $O(1)$ space.
                </li>
                <li>
                  <strong className="text-foreground">Space-Time Tradeoffs:</strong> <span className="text-accent">Counting Sort</span>. Forgoes comparison entirely. Tallies frequencies in an auxiliary array to bypass the $O(N \log N)$ comparison limit, running in linear $O(N+K)$ time but using $O(K)$ space.
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Key Properties to Remember</h3>
              
              <div className="mb-4">
                <strong className="text-accent text-sm block mb-1">Stability</strong>
                <p className="text-sm text-muted-foreground">
                  A sorting algorithm is <strong className="text-foreground">stable</strong> if it preserves the relative order of equal elements. Merge Sort, Bubble Sort, and Counting Sort are stable. Quick Sort and Heap Sort are inherently unstable.
                </p>
              </div>

              <div>
                <strong className="text-accent text-sm block mb-1">In-Place Sorting</strong>
                <p className="text-sm text-muted-foreground">
                  An <strong className="text-foreground">in-place</strong> algorithm requires a small, constant amount of extra memory space $O(1)$. Bubble, Selection, and Heap sort are in-place. Merge Sort requires $O(N)$ extra space to merge sub-arrays. Counting Sort requires $O(K)$ extra space.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
