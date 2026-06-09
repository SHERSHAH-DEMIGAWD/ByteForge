'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/file-upload'
import { MetricCard } from '@/components/metric-card'
import { useCompressionStore } from '@/lib/store'
import { 
  Download, 
  BarChart2, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Shuffle,
  GitMerge,
  Search,
  Database,
  GitFork,
  GraduationCap,
  Activity,
  Calendar,
  Layers
} from 'lucide-react'
import { HexViewer } from '@/components/hex-viewer'
import { HuffmanTreeVisualizer } from '@/components/huffman-tree'
import { EntropyGraph } from '@/components/entropy-graph'
import { NetworkRacer } from '@/components/network-racer'
import { LZ77Inspector } from '@/components/lz77-inspector'
import { EnergyMonitor } from '@/components/energy-monitor'
import { AIRouter } from '@/components/ai-router'
import Link from 'next/link'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'settings'>('upload')
  const [inspectingAlgo, setInspectingAlgo] = useState<string | null>(null)
  const inputData = useCompressionStore((state) => state.inputData)
  const selectedAlgorithms = useCompressionStore((state) => state.selectedAlgorithms)
  const engineMode = useCompressionStore((state) => state.engineMode)
  const results = useCompressionStore((state) => state.results)
  const isLoading = useCompressionStore((state) => state.isLoading)
  const currentFile = useCompressionStore((state) => state.currentFile)
  const toggleAlgorithm = useCompressionStore((state) => state.toggleAlgorithm)
  const setEngineMode = useCompressionStore((state) => state.setEngineMode)
  const setIsLoading = useCompressionStore((state) => state.setIsLoading)
  const setResults = useCompressionStore((state) => state.setResults)

  const handleCompress = async () => {
    if (!inputData) return

    setIsLoading(true)
    try {
      const payload = {
        data: inputData,
        algorithms: Array.from(selectedAlgorithms),
        mode: engineMode,
        is_base64: false
      }

      const response = await fetch('http://localhost:8000/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Compression failed')
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Compression failed:', error)
      alert(`Compression error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectRecommended = (algo: string) => {
    const current = new Set(selectedAlgorithms)
    current.forEach(a => toggleAlgorithm(a))
    const allAlgos = ['huffman', 'lz77', 'lzw', 'rle', 'bwt', 'deflate', 'arithmetic']
    allAlgos.forEach(a => {
      if (a === algo && !selectedAlgorithms.has(a)) toggleAlgorithm(a)
      if (a !== algo && selectedAlgorithms.has(a)) toggleAlgorithm(a)
    })
  }

  const handleExportSummary = () => {
    if (!results) return
    const summary = generateSummary()
    const blob = new Blob([summary], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'compression-summary.txt'
    a.click()
  }

  const generateSummary = () => {
    if (!results) return ''
    let summary = `ByteForge Compression Analysis Report\n`
    summary += `=====================================\n\n`
    summary += `File: ${currentFile}\n`
    summary += `Original Size: ${results.original_size} bytes\n\n`

    Object.entries(results.algorithms).forEach(([algo, data]) => {
      if (data) {
        summary += `${algo.toUpperCase()}\n`
        summary += `  Compressed Size: ${data.size} bytes\n`
        summary += `  Ratio: ${(data.ratio * 100).toFixed(2)}%\n`
        summary += `  Time: ${data.time}ms\n`
        summary += `  Memory: ${data.memory}MB\n\n`
      }
    })

    return summary
  }

  const handleDownload = (algo: string, data: any) => {
    if (!data.payload_base64) {
      alert("No binary payload available to download.");
      return;
    }
    
    const bfgPayload = {
      version: "1.0",
      algorithm: algo,
      data_base64: data.payload_base64,
      metadata: {
        codebook: data.codebook,
        tokens: data.tokens,
        prob_ranges: data.prob_ranges,
        total_length: results?.original_size
      }
    };
    
    const blob = new Blob([JSON.stringify(bfgPayload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${algo}.bfg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const daaModules = [
    { href: '/sorting-lab', label: 'Sorting Laboratory', desc: 'Animate Bubble, Selection, Merge, Quick, Heap, & Counting sort benchmarks.', icon: Shuffle, badge: 'Unit I & II' },
    { href: '/mst-planner', label: 'MST Server Planner', desc: 'Construct optimal minimum-weight server trees using Kruskal\'s & Prim\'s.', icon: GitMerge, badge: 'Unit IV' },
    { href: '/network-routing', label: 'Dijkstra Latency Router', desc: 'Find shortest transmission latency paths across edge server nodes.', icon: Activity, badge: 'Unit IV' },
    { href: '/scheduler', label: 'Topological Scheduler', desc: 'Resolve prerequisite module order hierarchies with Kahn\'s & DFS.', icon: Calendar, badge: 'Unit II' },
    { href: '/recursion-tree', label: 'Recursion Tree Visualizer', desc: 'Animate naive vs memoized Fibonacci call stack trees.', icon: GitFork, badge: 'Unit I & IV' },
    { href: '/knapsack', label: 'Knapsack Allocator', desc: 'Optimize transmission values under bandwidth limits using DP vs Greedy.', icon: Database, badge: 'Unit IV' },
    { href: '/string-matching', label: 'String Matching Lab', desc: 'Compare Naive matching alignments with Boyer-Moore & Horspool shifts.', icon: Search, badge: 'Unit III' },
    { href: '/viva-guide', label: 'DAA Viva Sandbox', desc: 'Interactive mock oral exam questions & DP table solvers.', icon: GraduationCap, badge: 'Syllabus & Practice' },
  ]

  return (
    <div className="p-8 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-3 tracking-tight">
          DAA Algorithm Laboratory Showcase
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Interactive educational environment for studying Design and Analysis of Algorithms (DAA) syllabus paradigms, time complexity parameters, and sorting/graph solvers.
        </p>
      </div>

      {/* DAA Modules Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-primary uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-5 h-5" /> Interactive Syllabus Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {daaModules.map((mod, idx) => {
            const Icon = mod.icon
            return (
              <Link 
                key={idx} 
                href={mod.href} 
                className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-lg p-5 hover:border-primary/55 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-all text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-accent bg-accent/10 border border-accent/15 px-2 py-0.5 rounded">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1.5 group-hover:text-primary transition-all">
                    {mod.label}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
                <div className="text-[10px] text-accent font-bold mt-4 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                  Launch Visualizer <span>➔</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-border/25" />

      {/* Compression Workspace Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-primary uppercase tracking-wider">
            File Compression & Entropy Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Upload files or paste text to inspect lossless compression metrics and compare Shannon entropy vs actual bits/symbol limits.
          </p>
        </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Input & Settings */}
        <div className="lg:col-span-1">
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-card/50 rounded-lg border border-border/30">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                  activeTab === 'settings'
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Settings
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'upload' && <FileUpload />}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Algorithm Selection */}
                <div>
                  <label className="text-sm font-medium block mb-3">Select Algorithms:</label>
                  <div className="space-y-2">
                    {['huffman', 'lz77', 'lzw', 'rle', 'bwt', 'deflate', 'arithmetic'].map((algo) => (
                      <label key={algo} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAlgorithms.has(algo)}
                          onChange={() => toggleAlgorithm(algo)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm capitalize font-medium">{algo}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Engine Mode */}
                <div>
                  <label className="text-sm font-medium block mb-3">Engine Mode:</label>
                  <div className="space-y-2">
                    {(['naive', 'optimized'] as const).map((mode) => (
                      <label key={mode} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="engine-mode"
                          checked={engineMode === mode}
                          onChange={() => setEngineMode(mode)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm capitalize font-medium">{mode} O(N) Data Structures</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI Predictive Router */}
            <AIRouter inputData={inputData} onSelectRecommended={handleSelectRecommended} />

            {/* Compress Button */}
            <button
              onClick={handleCompress}
              disabled={!inputData || isLoading}
              className="w-full mt-8 py-3 px-4 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Compressing...' : 'Compress & Analyze'}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2">
          {!results ? (
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-12 text-center">
              <BarChart2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Upload a file and click &quot;Compress & Analyze&quot; to see results</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
                <h3 className="text-lg font-bold text-primary mb-4">Compression Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    title="Original Size"
                    value={results.original_size}
                    unit="bytes"
                  />
                  <MetricCard
                    title="File"
                    value={currentFile}
                  />
                  {results.shannon_entropy && (
                    <>
                      <MetricCard
                        title="Shannon Entropy"
                        value={`${results.shannon_entropy.toFixed(3)} bits/symbol`}
                        className="col-span-2 bg-primary/10 border-primary/50"
                      />
                      <MetricCard
                        title="Theoretical Min Size"
                        value={Math.ceil(results.theoretical_min_size)}
                        unit="bytes"
                        className="col-span-2 bg-primary/10 border-primary/50"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Algorithm Results Grid */}
              <div>
                <h3 className="text-lg font-bold text-primary mb-4">Algorithm Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(results.algorithms).map(([algo, data]) => {
                    if (!data) return null
                    return (
                      <div key={algo} className={`bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6 transition-all ${inspectingAlgo === algo ? 'md:col-span-2 ring-2 ring-primary/50' : ''}`}>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-bold text-primary uppercase">{algo}</h4>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleDownload(algo, data)}
                              className="flex items-center gap-1 text-xs px-2 py-1 bg-accent/20 text-accent font-bold rounded hover:bg-accent/30 transition-all"
                              title="Download .bfg Payload"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                            <button 
                              onClick={() => setInspectingAlgo(inspectingAlgo === algo ? null : algo)}
                              className="flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-all"
                            >
                              {inspectingAlgo === algo ? <><EyeOff className="w-3 h-3" /> Hide Details</> : <><Eye className="w-3 h-3" /> Deep Dive</>}
                            </button>
                          </div>
                        </div>
                        {data.error ? (
                          <div className="text-xs text-red-500 font-mono mt-4 break-words">
                            Error: {data.error}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Compressed</span>
                              <span className="text-accent">{data.size} bytes</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Ratio</span>
                              <span className="text-accent">{(data.ratio * 100).toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Space Saved</span>
                              <span className="text-accent">{((1 - data.ratio) * 100).toFixed(2)}%</span>
                            </div>
                            {results.theoretical_min_size && data.size > 0 && (
                              <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Efficiency</span>
                                  <span className="text-primary font-bold">{Math.min(100, (results.theoretical_min_size / data.size) * 100).toFixed(1)}% of limit</span>
                              </div>
                            )}
                            <div className="h-px bg-border/20" />
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Time</span>
                              <span>{data.time}ms</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Memory</span>
                              <span>{data.memory}MB</span>
                            </div>
                          </div>
                        )}

                        {/* Expanded Inspection View */}
                        {inspectingAlgo === algo && data.payload_base64 && inputData && (
                          <div className="mt-6 pt-4 border-t border-border/50 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Algorithm Insights
                              </h5>
                            </div>
                            
                            {algo === 'huffman' && data.codebook && (
                              <HuffmanTreeVisualizer codebook={data.codebook} />
                            )}
                            
                            {algo === 'lz77' && data.tokens && (
                              <LZ77Inspector tokens={data.tokens} />
                            )}
                            
                            <HexViewer originalText={inputData} compressedBase64={data.payload_base64} />
                            
                            <EntropyGraph originalText={inputData} compressedBase64={data.payload_base64} />
                            
                            <EnergyMonitor time={data.time} memory={data.memory} originalSize={results.original_size} algoName={algo} />

                            <NetworkRacer originalSize={results.original_size} compressedSize={data.size} algoName={algo} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleExportSummary}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary/20 border border-primary/30 text-primary font-medium rounded-lg hover:bg-primary/30 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export Summary
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)
}
