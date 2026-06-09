'use client'

import { useState } from 'react'
import { Plus, Trash, Database, ArrowRight, Table, Info } from 'lucide-react'

interface Item {
  name: string
  weight: number
  value: number
}

export default function KnapsackPage() {
  const [items, setItems] = useState<Item[]>([
    { name: 'System Logs.bin', weight: 4, value: 30 },
    { name: 'Database Backup.db', weight: 8, value: 80 },
    { name: 'Docker Image.tar', weight: 10, value: 110 },
    { name: 'PDF Docs.zip', weight: 2, value: 20 },
    { name: 'Asset Archive.tar.gz', weight: 6, value: 50 }
  ])
  const [newItemName, setNewItemName] = useState<string>('')
  const [newItemWeight, setNewItemWeight] = useState<number>(5)
  const [newItemValue, setNewItemValue] = useState<number>(40)
  
  const [capacity, setCapacity] = useState<number>(15)
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any>(null)
  
  const addItem = () => {
    if (!newItemName) return
    setItems([...items, { name: newItemName, weight: newItemWeight, value: newItemValue }])
    setNewItemName('')
  }
  
  const deleteItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx))
  }
  
  const handleSolve = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      const payload = {
        weights: items.map(it => it.weight),
        values: items.map(it => it.value),
        capacity
      }
      
      const response = await fetch('http://localhost:8000/knapsack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error('Failed to run Knapsack on backend')
      }
      
      const data = await response.json()
      setResults(data)
    } catch (e: any) {
      console.error(e)
      alert(`Error solving knapsack: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
          Knapsack Bandwidth Allocator
        </h1>
        <p className="text-muted-foreground">
          Study Unit IV Dynamic Programming vs. Greedy choice by optimizing compressed file transmissions under bandwidth limits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Parameters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" /> File Repositories
            </h3>

            {/* Capacity slider */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
                Bandwidth Capacity (W): <span className="text-accent font-bold">{capacity} MB</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                className="w-full accent-primary bg-background h-2 rounded-lg"
              />
            </div>

            {/* Item list */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar mb-6">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-background/50 border border-border/20 p-2.5 rounded-lg text-sm">
                  <div>
                    <p className="font-bold truncate max-w-[150px]">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Weight: {item.weight}MB | Utility: {item.value}
                    </p>
                  </div>
                  <button 
                    onClick={() => deleteItem(idx)}
                    className="p-1 hover:bg-destructive/10 text-destructive rounded transition-all"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add custom item */}
            <div className="border-t border-border/30 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Add Custom File</h4>
              <input
                type="text"
                placeholder="File name (e.g. video.mp4)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full bg-background border border-border/30 rounded-lg p-2 text-xs focus:outline-none focus:border-primary/50 text-foreground"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase block mb-1">Weight (MB)</label>
                  <input
                    type="number"
                    value={newItemWeight}
                    onChange={(e) => setNewItemWeight(parseInt(e.target.value) || 1)}
                    className="w-full bg-background border border-border/30 rounded-lg p-2 text-xs focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase block mb-1">Utility / Value</label>
                  <input
                    type="number"
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(parseInt(e.target.value) || 1)}
                    className="w-full bg-background border border-border/30 rounded-lg p-2 text-xs focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>
              </div>
              <button
                onClick={addItem}
                className="w-full py-2 bg-primary/20 text-primary border border-primary/30 font-bold rounded-lg text-xs hover:bg-primary/30 transition-all flex justify-center items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add File
              </button>
            </div>

            <button
              onClick={handleSolve}
              disabled={loading || items.length === 0}
              className="w-full mt-6 py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Optimizing...' : 'Allocate Bandwidth'}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {!results ? (
            <div className="bg-card/50 border border-border/30 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <Database className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Select files and budget constraints, then run allocation to see DAA solving metrics</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top comparisons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 0/1 Knapsack (DP) */}
                <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-border/20 pb-2">
                    <h4 className="text-sm font-bold text-primary uppercase">0/1 Knapsack (Dynamic Programming)</h4>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-mono font-bold">O(N*W)</span>
                  </div>
                  <div className="text-center py-4 bg-background/50 border border-border/20 rounded-lg">
                    <div className="text-3xl font-extrabold text-accent">{results.dp.max_value}</div>
                    <div className="text-[10px] text-muted-foreground uppercase mt-1">Total Allocated Utility</div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-muted-foreground uppercase">Selected Files (No Splits)</h5>
                    <div className="space-y-1">
                      {results.dp.selected_indices.map((idx: number) => {
                        const item = items[idx]
                        if (!item) return null
                        return (
                          <div key={idx} className="flex justify-between text-xs bg-background/30 p-2 border border-border/10 rounded">
                            <span>{item.name}</span>
                            <span className="font-mono text-accent">{item.weight}MB | +{item.value} val</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Fractional Knapsack (Greedy) */}
                <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-border/20 pb-2">
                    <h4 className="text-sm font-bold text-primary uppercase">Fractional Knapsack (Greedy)</h4>
                    <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded font-mono font-bold">O(N log N)</span>
                  </div>
                  <div className="text-center py-4 bg-background/50 border border-border/20 rounded-lg">
                    <div className="text-3xl font-extrabold text-accent">{results.greedy.max_value.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground uppercase mt-1">Total Allocated Utility</div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-muted-foreground uppercase">Selected Files (Allowing Splits)</h5>
                    <div className="space-y-1">
                      {results.greedy.selections.map((sel: any, idx: number) => {
                        const item = items[sel.index]
                        if (!item) return null
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs bg-background/30 p-2 border border-border/10 rounded">
                            <span className="truncate max-w-[150px]">{item.name}</span>
                            <div className="text-right font-mono">
                              <div className="text-accent">{sel.weight_taken}MB ({(sel.fraction * 100).toFixed(0)}%)</div>
                              <div className="text-[9px] text-muted-foreground">+{sel.value_gained.toFixed(1)} val</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Programming Matrix Table */}
              {results.dp.dp_matrix && (
                <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-4">
                  <h4 className="text-sm font-bold text-primary uppercase flex items-center gap-2">
                    <Table className="w-4 h-4 text-primary" /> Dynamic Programming Solution Matrix
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    This table maps subproblems. Rows denote items, and columns denote intermediate capacities (0 to {capacity} MB). 
                    The grid values are $DP[i][w]$.
                  </p>

                  <div className="overflow-x-auto border border-border/20 rounded-lg">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="bg-background/80 border-b border-border/20">
                          <th className="py-2 px-3 text-left border-r border-border/20 text-[10px] text-muted-foreground">Item (i)</th>
                          {Array.from({ length: capacity + 1 }).map((_, w) => (
                            <th key={w} className="py-2 px-2 text-center border-r border-border/20 w-8">{w}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.dp.dp_matrix.map((row: number[], i: number) => {
                          const isZeroRow = i === 0
                          const item = !isZeroRow ? items[i - 1] : null
                          
                          return (
                            <tr key={i} className="border-b border-border/20 hover:bg-primary/5">
                              <td className="py-2 px-3 border-r border-border/20 font-bold bg-background/30">
                                {isZeroRow ? '0 (None)' : `${i}. ${item?.name}`}
                                {!isZeroRow && item && (
                                  <div className="text-[9px] text-muted-foreground font-sans font-normal">
                                    w={item.weight}, v={item.value}
                                  </div>
                                )}
                              </td>
                              {row.map((val, w) => {
                                return (
                                  <td 
                                    key={w} 
                                    className="py-2 px-2 text-center border-r border-border/20"
                                  >
                                    {val}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                    <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-foreground">viva Tip:</span> Notice how the maximum value in the bottom-right cell <span className="font-bold text-accent">({results.dp.max_value})</span> matches the 0/1 solver result. By starting there, if $DP[i][w] \neq DP[i-1][w]$, we know item $i$ was selected, and we subtract its weight and backtrack upwards!
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
