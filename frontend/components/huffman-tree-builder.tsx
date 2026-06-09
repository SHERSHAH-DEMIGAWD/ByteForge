'use client'

import { useState, useEffect } from 'react'
import { Play, Square, ChevronLeft, ChevronRight, Info, Layers } from 'lucide-react'
import { useCompressionStore } from '@/lib/store'

interface HeapNode {
  id: string
  char?: string
  freq: number
  left?: HeapNode
  right?: HeapNode
}

export function HuffmanTreeBuilder() {
  const inputData = useCompressionStore((state) => state.inputData)
  const [steps, setSteps] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)

  // Build the list of merge states whenever inputData changes
  useEffect(() => {
    if (!inputData) return
    
    // 1. Calculate frequencies
    const freqMap: Record<string, number> = {}
    // To keep the visualization clean, let's limit it to the first 200 chars or 8 unique chars
    const shortText = inputData.slice(0, 1000)
    for (const char of shortText) {
      freqMap[char] = (freqMap[char] || 0) + 1
    }

    // Sort unique characters by frequency to make a clean initial list
    const sortedChars = Object.entries(freqMap)
      .map(([char, freq]) => ({ id: `leaf-${char}`, char, freq }))
      .sort((a, b) => a.freq - b.freq)

    // Only simulate if we have at least 2 unique characters
    if (sortedChars.length < 2) {
      setSteps([])
      return
    }

    // Build the step history
    const simulationSteps: any[] = []
    let currentHeap: HeapNode[] = sortedChars.map(c => ({ ...c }))
    
    // Initial state
    simulationSteps.push({
      heap: [...currentHeap],
      action: "Initial Priority Queue built from character frequencies.",
      merged: []
    })

    let mergeCounter = 0
    while (currentHeap.length > 1) {
      // Sort heap to simulate priority queue order
      currentHeap.sort((a, b) => a.freq - b.freq)
      
      // Pop two lowest frequency nodes
      const left = currentHeap.shift()!
      const right = currentHeap.shift()!
      
      // Merge them
      const parent: HeapNode = {
        id: `node-${mergeCounter++}`,
        freq: left.freq + right.freq,
        left,
        right
      }
      
      currentHeap.push(parent)
      
      simulationSteps.push({
        heap: [...currentHeap],
        action: `Merged node '${left.char || '•'}' (${left.freq}) and '${right.char || '•'}' (${right.freq}) into parent node (${parent.freq}).`,
        merged: [left.id, right.id, parent.id]
      })
    }

    setSteps(simulationSteps)
    setCurrentStep(0)
    setIsPlaying(false)
  }, [inputData])

  // Playback Loop
  useEffect(() => {
    let intervalId: any
    if (isPlaying) {
      intervalId = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 1500)
    }
    return () => clearInterval(intervalId)
  }, [isPlaying, steps])

  if (steps.length === 0) {
    return (
      <div className="p-4 bg-black/40 border border-border/20 rounded-lg text-center text-xs text-muted-foreground">
        Please run compression on the dashboard first to load text data.
      </div>
    )
  }

  const activeStep = steps[currentStep]

  // Render a simple text-based tree representation recursively
  const renderTreeString = (node: HeapNode, prefix = "", isLeft = true): string => {
    if (!node) return ""
    let result = ""
    
    // Label for current node
    const label = node.char 
      ? `'${node.char === '\n' ? 'NL' : node.char}' (${node.freq})`
      : `Node (${node.freq})`
      
    result += `${prefix}${isLeft ? "├── " : "└── "}${label}\n`
    
    const childPrefix = prefix + (isLeft ? "│   " : "    ")
    if (node.left) result += renderTreeString(node.left, childPrefix, true)
    if (node.right) result += renderTreeString(node.right, childPrefix, false)
    
    return result
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center bg-background/50 border border-border/20 p-3 rounded-lg">
        <span className="text-xs text-muted-foreground font-mono">
          Merge Step {currentStep + 1} / {steps.length}
        </span>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentStep(0)
              setIsPlaying(false)
            }}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-background rounded"
            title="Reset"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded flex items-center justify-center ${isPlaying ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}
          >
            <Play className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (currentStep > 0) setCurrentStep(currentStep - 1)
            }}
            disabled={currentStep === 0}
            className="p-1 hover:bg-background rounded disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1)
            }}
            disabled={currentStep === steps.length - 1}
            className="p-1 hover:bg-background rounded disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Heap state list */}
      <div>
        <h5 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Priority Queue Nodes</h5>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-background/30 rounded border border-border/10">
          {activeStep.heap.map((node: HeapNode) => {
            const isMerged = activeStep.merged.includes(node.id)
            return (
              <span 
                key={node.id} 
                className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all ${
                  isMerged 
                    ? 'bg-accent/20 border-accent text-accent font-bold scale-105'
                    : 'bg-card border-border/20 text-muted-foreground'
                }`}
              >
                {node.char ? `'${node.char}'` : 'Node'} ({node.freq})
              </span>
            )
          })}
        </div>
      </div>

      {/* Graphical Tree view (Indented Text representation of current root node sub-trees) */}
      <div>
        <h5 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-primary" /> Active Trees in Heap
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeStep.heap.slice(0, 2).map((rootNode: HeapNode) => (
            <div key={rootNode.id} className="p-3 bg-[#0d1117] rounded border border-border/20 max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
              <pre className="text-[10px] leading-tight text-accent/90 font-mono whitespace-pre-wrap">
                {renderTreeString(rootNode, "", false) || "(Leaf)"}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Action log */}
      <div className="p-3 bg-primary/10 border border-primary/20 rounded text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5 text-primary inline-block mr-1.5 -mt-0.5" />
        {activeStep.action}
      </div>
    </div>
  )
}
