'use client'

import { useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Play } from 'lucide-react'
import { useCompressionStore } from '@/lib/store'

export default function VerificationPage() {
  const [selectedAlgo, setSelectedAlgo] = useState<string>('huffman')
  const [profilerRunning, setProfilerRunning] = useState(false)
  const [profileData, setProfileData] = useState<any[]>([])

  const algorithms = [
    { id: 'all', name: 'Unified Graph (All)', complexity: 'Comparison', description: 'Observe all algorithms simultaneously to compare their scaling factors.' },
    { id: 'huffman', name: 'Huffman Coding', complexity: 'O(n log n)', description: 'Time dominated by tree construction and sorting' },
    { id: 'lz77', name: 'LZ77', complexity: 'O(n²)', description: 'Quadratic for naive implementation, O(n) with hash tables' },
    { id: 'rle', name: 'RLE', complexity: 'O(n)', description: 'Linear single-pass scan' },
    { id: 'bwt', name: 'BWT', complexity: 'O(n log n)', description: 'Suffix array/sorting dominates' },
    { id: 'deflate', name: 'DEFLATE', complexity: 'O(n log n)', description: 'Combination of LZ77 and Huffman' },
  ]

  const currentAlgo = algorithms.find((a) => a.id === selectedAlgo)

  const handleProfiler = async () => {
    setProfilerRunning(true)
    const storeInput = useCompressionStore.getState().inputData
    const textData = storeInput || "The quick brown fox jumps over the lazy dog. ".repeat(250)
    
    // Create 10 sizes
    const maxLen = Math.min(textData.length, 10000)
    const step = Math.floor(maxLen / 10)
    const sizes = Array.from({ length: 10 }, (_, i) => Math.max(100, (i + 1) * step))

    try {
      if (selectedAlgo === 'all') {
        const [huffRes, lzRes, rleRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/batch-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ algorithm: 'huffman', data: textData, sizes })
          }).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/batch-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ algorithm: 'lz77', data: textData, sizes, mode: 'naive' }) // naive to show O(n^2) scaling!
          }).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/batch-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ algorithm: 'rle', data: textData, sizes })
          }).then(r => r.json())
        ])

        const combined = sizes.map((size, idx) => ({
          inputSize: size,
          huffman: huffRes[idx]?.time || 0,
          lz77: lzRes[idx]?.time || 0,
          rle: rleRes[idx]?.time || 0
        }))
        setProfileData(combined)
      } else {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/batch-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            algorithm: selectedAlgo,
            data: textData,
            sizes,
            mode: useCompressionStore.getState().engineMode
          })
        })
        if (!response.ok) {
          throw new Error('Failed to run batch profiling')
        }
        const backendData = await response.json()
        
        // Generate trendline matching physical bounds
        const mapped = backendData.map((d: any) => {
          let trend = 0
          const n = d.inputSize / 1000
          if (selectedAlgo === 'rle') {
            trend = n * 0.1 // linear coefficient
          } else if (selectedAlgo === 'lz77') {
            trend = useCompressionStore.getState().engineMode === 'naive' 
              ? Math.pow(n, 2) * 0.5 
              : n * 0.15
          } else {
            trend = n * Math.log2(n + 1) * 0.2
          }
          return {
            inputSize: d.inputSize,
            time: d.time,
            trendline: trend
          }
        })
        setProfileData(mapped)
      }
    } catch (e: any) {
      console.error(e)
      alert(`Error during empirical profiling: ${e.message}`)
    } finally {
      setProfilerRunning(false)
    }
  }

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 border border-border/50 rounded-lg p-3 backdrop-blur-md">
          <p className="text-xs text-foreground mb-2">Input Size: {payload[0].payload.inputSize} bytes</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-xs" style={{ color: p.color || p.stroke || p.fill }}>
              {p.name}: {Number(p.value).toFixed(2)}ms
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Big-O Verification</h1>
        <p className="text-muted-foreground">
          Empirically verify mathematical time complexity predictions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column - Controls */}
        <div className="lg:col-span-1">
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6 sticky top-8">
            <h3 className="text-lg font-bold text-primary mb-4">Select Algorithm</h3>

            <div className="space-y-2 mb-6">
              {algorithms.map((algo) => (
                <button
                  key={algo.id}
                  onClick={() => {
                    setSelectedAlgo(algo.id)
                    setProfileData([])
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedAlgo === algo.id
                      ? 'bg-primary/20 border border-primary/30 text-primary'
                      : 'border border-border/30 text-muted-foreground hover:text-foreground hover:bg-card/50'
                  }`}
                >
                  <p className="text-sm font-medium">{algo.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{algo.complexity}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleProfiler}
              disabled={profilerRunning}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {profilerRunning ? 'Running...' : 'Run Profiler'}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-3 space-y-8">
          {/* Algorithm Info Card */}
          {currentAlgo && (
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4">{currentAlgo.name}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-accent mb-1">Expected Complexity</p>
                  <p className="text-3xl font-bold text-primary">{currentAlgo.complexity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">How it works</p>
                  <p className="text-sm text-muted-foreground">{currentAlgo.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {profileData.length > 0 ? (
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Execution Time vs Input Size</h3>
              <ResponsiveContainer width="100%" height={400}>
                {selectedAlgo === 'all' ? (
                  <LineChart data={profileData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="inputSize" name="Input Size (bytes)" stroke="rgb(148, 163, 184)" style={{ fontSize: '12px' }} />
                    <YAxis name="Time (ms)" stroke="rgb(148, 163, 184)" style={{ fontSize: '12px' }} />
                    <Tooltip content={customTooltip} cursor={{ fill: 'rgba(0, 170, 255, 0.1)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="huffman" name="O(N log N) e.g. Huffman" stroke="#00AAFF" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="lz77" name="O(N²) e.g. Naive LZ77" stroke="#FF5555" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="rle" name="O(N) e.g. RLE" stroke="#00FF88" strokeWidth={2} dot={false} />
                  </LineChart>
                ) : (
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis type="number" dataKey="inputSize" name="Input Size (bytes)" stroke="rgb(148, 163, 184)" style={{ fontSize: '12px' }} />
                    <YAxis type="number" dataKey="time" name="Time (ms)" stroke="rgb(148, 163, 184)" style={{ fontSize: '12px' }} />
                    <Tooltip content={customTooltip} cursor={{ fill: 'rgba(0, 170, 255, 0.1)' }} />
                    <Scatter name="Measured" data={profileData} fill="#00AAFF" />
                    <Line type="monotone" dataKey="trendline" stroke="#00FF88" name="Trendline" isAnimationActive={false} />
                  </ScatterChart>
                )}
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-background/30 rounded-lg border border-border/20">
                <p className="text-xs text-muted-foreground">
                  {selectedAlgo === 'all' 
                    ? "Comparing all complexities. Notice how O(N²) explodes, while O(N) stays flat and O(N log N) curves slightly."
                    : <><span className="text-accent font-bold">Blue points</span> show actual measurements. <span className="text-accent font-bold">Green line</span> shows theoretical trend.</>}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-12 text-center">
              <p className="text-muted-foreground">Click &quot;Run Profiler&quot; to generate empirical data</p>
            </div>
          )}

          {/* Statistics */}
          {profileData.length > 0 && selectedAlgo !== 'all' && (
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-border/20 rounded-lg p-4 bg-background/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Samples</p>
                  <p className="text-2xl font-bold text-accent">{profileData.length}</p>
                </div>
                <div className="border border-border/20 rounded-lg p-4 bg-background/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Min Time</p>
                  <p className="text-2xl font-bold text-accent">
                    {Math.min(...profileData.map((d) => d.time)).toFixed(2)}ms
                  </p>
                </div>
                <div className="border border-border/20 rounded-lg p-4 bg-background/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Max Time</p>
                  <p className="text-2xl font-bold text-accent">
                    {Math.max(...profileData.map((d) => d.time)).toFixed(2)}ms
                  </p>
                </div>
                <div className="border border-border/20 rounded-lg p-4 bg-background/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Avg Time</p>
                  <p className="text-2xl font-bold text-accent">
                    {(profileData.reduce((a, d) => a + d.time, 0) / profileData.length).toFixed(2)}ms
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
