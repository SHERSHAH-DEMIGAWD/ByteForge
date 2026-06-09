'use client'

import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Play, Square, RefreshCw, BarChart2 } from 'lucide-react'

export default function StringMatchingPage() {
  const [text, setText] = useState<string>('ABABDABACDABABCABAB')
  const [pattern, setPattern] = useState<string>('ABABCABAB')
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any>(null)
  
  // Interactive Walkthrough State
  const [selectedAlgo, setSelectedAlgo] = useState<'naive' | 'horspool' | 'boyer_moore'>('boyer_moore')
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0)
  
  const handleSearch = async () => {
    if (!text || !pattern) return
    setLoading(true)
    setResults(null)
    setCurrentStepIdx(0)
    
    try {
      const response = await fetch('http://localhost:8000/string-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, pattern })
      })
      if (!response.ok) {
        throw new Error('Failed to run string matching on backend')
      }
      const data = await response.json()
      setResults(data)
    } catch (e: any) {
      console.error(e)
      alert(`Error running search: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Helper to get active step list
  const activeSteps = results ? results[selectedAlgo]?.steps || [] : []
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
          String Matching Laboratory
        </h1>
        <p className="text-muted-foreground">
          Study Unit III Space-Time Tradeoffs by analyzing Naive matching against Input Enhancement algorithms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" /> Pattern Parameters
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">Text Stream</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-32 bg-background border border-border/30 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-primary/50 text-foreground"
                  placeholder="Enter main text here..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">Search Pattern</label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  className="w-full bg-background border border-border/30 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-primary/50 text-foreground"
                  placeholder="Enter pattern..."
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={loading || !text || !pattern}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Analyze Alignments'}
              </button>
            </div>
          </div>

          {/* Algorithm stats compared */}
          {results && (
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5" /> Comparisons Battle
              </h3>
              
              <div className="space-y-4">
                {[
                  { id: 'naive', name: 'Naive Search', comps: results.naive.total_comparisons, matches: results.naive.alignments.length, color: 'text-red-400' },
                  { id: 'horspool', name: "Horspool's", comps: results.horspool.total_comparisons, matches: results.horspool.alignments.length, color: 'text-blue-400' },
                  { id: 'boyer_moore', name: 'Boyer-Moore', comps: results.boyer_moore.total_comparisons, matches: results.boyer_moore.alignments.length, color: 'text-green-400' }
                ].map((item) => (
                  <div key={item.id} className="p-3 bg-background/50 border border-border/20 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm">{item.name}</span>
                      <span className={`font-mono text-xs font-bold ${item.color}`}>
                        {item.comps} comparisons
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Matches: {item.matches}</span>
                      <span>Avg Comps/Char: {(item.comps / text.length).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Walkthrough Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {!results ? (
            <div className="bg-card/50 border border-border/30 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Submit parameters to run string matching algorithms and start the step-by-step walkthrough</p>
            </div>
          ) : (
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-6">
              {/* Selector */}
              <div className="flex border-b border-border/30 pb-4 justify-between items-center">
                <div className="flex gap-2">
                  {(['naive', 'horspool', 'boyer_moore'] as const).map((algo) => (
                    <button
                      key={algo}
                      onClick={() => {
                        setSelectedAlgo(algo)
                        setCurrentStepIdx(0)
                      }}
                      className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                        selectedAlgo === algo
                          ? 'bg-primary/20 text-primary border-primary/45'
                          : 'border-border/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {algo === 'boyer_moore' ? 'Boyer-Moore' : algo === 'horspool' ? "Horspool's" : 'Naive'}
                    </button>
                  ))}
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

              {/* Grid visualization */}
              <div className="p-6 bg-black/60 rounded-lg border border-border/20 overflow-x-auto relative">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-4 tracking-wider">Step Alignment Map</h4>

                {activeStep && (
                  <div className="space-y-4 font-mono text-sm select-none">
                    {/* Text Stream Row */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-16 text-xs text-muted-foreground font-sans">Text:</span>
                      <div className="flex">
                        {text.split('').map((char, idx) => {
                          // Highlight character if compared in this step
                          const comp = activeStep.comparisons.find((c: any) => c.text_idx === idx)
                          let cellBg = 'bg-card/20 border border-border/20 text-muted-foreground'
                          if (comp) {
                            cellBg = comp.match 
                              ? 'bg-green-500/20 border border-green-500/60 text-green-400 font-bold scale-105 shadow-md shadow-green-500/10'
                              : 'bg-red-500/20 border border-red-500/60 text-red-400 font-bold scale-105 shadow-md shadow-red-500/10'
                          }
                          return (
                            <span 
                              key={idx} 
                              className={`w-7 h-7 flex items-center justify-center rounded text-center transition-all ${cellBg}`}
                              title={`Index ${idx}`}
                            >
                              {char}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    {/* Pattern Row */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-16 text-xs text-muted-foreground font-sans">Pattern:</span>
                      <div className="flex">
                        {/* Pad to alignment index */}
                        {Array.from({ length: activeStep.alignment_index }).map((_, idx) => (
                          <span key={`pad-${idx}`} className="w-7 h-7" />
                        ))}
                        {pattern.split('').map((char, idx) => {
                          const comp = activeStep.comparisons.find((c: any) => c.pattern_idx === idx)
                          let cellBg = 'bg-primary/5 border border-primary/20 text-muted-foreground'
                          if (comp) {
                            cellBg = comp.match 
                              ? 'bg-green-500/20 border border-green-500/60 text-green-400 font-bold'
                              : 'bg-red-500/20 border border-red-500/60 text-red-400 font-bold'
                          }
                          return (
                            <span 
                              key={idx} 
                              className={`w-7 h-7 flex items-center justify-center rounded text-center transition-all ${cellBg}`}
                            >
                              {char}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step info details */}
              {activeStep && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-background/30 rounded-lg border border-border/20">
                  <div className="space-y-2 text-xs">
                    <h5 className="font-bold text-primary">Shift Logistics</h5>
                    <p className="text-muted-foreground">
                      Alignment Offset: <span className="font-mono text-accent">{activeStep.alignment_index}</span>
                    </p>
                    {activeStep.shift && (
                      <p className="text-muted-foreground">
                        Next Calculated Shift: <span className="font-mono text-accent">+{activeStep.shift} characters</span>
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      Step Status: <span className={`font-bold uppercase ${activeStep.status === 'match' ? 'text-green-400' : 'text-red-400'}`}>{activeStep.status}</span>
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <h5 className="font-bold text-primary">Comparisons Log</h5>
                    <div className="max-h-24 overflow-y-auto space-y-1">
                      {activeStep.comparisons.map((c: any, idx: number) => (
                        <div key={idx} className="flex justify-between font-mono px-2 py-0.5 bg-background/50 rounded">
                          <span>Text[{c.text_idx}] ({c.text_char}) == Pat[{c.pattern_idx}] ({c.pattern_char})</span>
                          <span className={c.match ? 'text-green-400' : 'text-red-400'}>
                            {c.match ? 'Match' : 'Mismatch'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Shift tables */}
              {results[selectedAlgo]?.shift_table && (
                <div className="p-4 bg-background/20 rounded-lg border border-border/20 space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Horspool Shift Dictionary</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {Object.entries(results[selectedAlgo].shift_table).map(([char, shift]: any) => (
                      <div key={char} className="p-2 bg-card/60 border border-border/20 rounded text-center text-xs font-mono">
                        <div className="text-muted-foreground">{char === ' ' ? 'SPC' : char}</div>
                        <div className="font-bold text-accent">+{shift}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results[selectedAlgo]?.bad_char_table && (
                <div className="p-4 bg-background/20 rounded-lg border border-border/20 space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Boyer-Moore Bad Character Shifts (Last Index)</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {Object.entries(results[selectedAlgo].bad_char_table).map(([char, idx]: any) => (
                      <div key={char} className="p-2 bg-card/60 border border-border/20 rounded text-center text-xs font-mono">
                        <div className="text-muted-foreground">{char === ' ' ? 'SPC' : char}</div>
                        <div className="font-bold text-accent">{idx}</div>
                      </div>
                    ))}
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
