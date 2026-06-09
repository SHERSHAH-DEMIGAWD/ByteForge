'use client'

import { BrainCircuit, Sparkles, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AIRouterProps {
  inputData: string
  onSelectRecommended: (algo: string) => void
}

export function AIRouter({ inputData, onSelectRecommended }: AIRouterProps) {
  const [recommendation, setRecommendation] = useState<{ algo: string, reason: string, confidence: number } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    if (!inputData) {
      setRecommendation(null)
      return
    }

    setIsAnalyzing(true)
    
    // Simulate AI thinking time for effect
    const timer = setTimeout(() => {
      analyzeData(inputData)
      setIsAnalyzing(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [inputData])

  const analyzeData = (data: string) => {
    const len = data.length
    
    // Calculate basic heuristic entropy (character diversity)
    const charCounts: Record<string, number> = {}
    for (let i = 0; i < Math.min(data.length, 5000); i++) {
      charCounts[data[i]] = (charCounts[data[i]] || 0) + 1
    }
    const uniqueChars = Object.keys(charCounts).length
    
    // Check for repetitive sequences (good for RLE)
    let maxRun = 0
    let currentRun = 1
    for (let i = 1; i < Math.min(data.length, 5000); i++) {
      if (data[i] === data[i-1]) currentRun++
      else {
        if (currentRun > maxRun) maxRun = currentRun
        currentRun = 1
      }
    }

    // Routing Logic
    if (maxRun > 10 && uniqueChars < 20) {
      setRecommendation({
        algo: 'rle',
        reason: 'Detected long sequences of identical characters. RLE will dominate this payload.',
        confidence: 94
      })
    } else if (uniqueChars < 15 && len < 10000) {
      setRecommendation({
        algo: 'huffman',
        reason: 'Low character diversity detected. Huffman frequency trees will be highly efficient.',
        confidence: 88
      })
    } else if (len > 5000) {
      setRecommendation({
        algo: 'deflate',
        reason: 'Large, complex dataset. Deflate (LZ77 + Huffman) is the industry standard for this profile.',
        confidence: 97
      })
    } else {
      setRecommendation({
        algo: 'lz77',
        reason: 'Standard text structure detected. LZ77 sliding window will find repeating sub-strings effectively.',
        confidence: 85
      })
    }
  }

  if (!inputData) return null

  return (
    <div className="mt-4 mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg animate-in fade-in zoom-in duration-500">
      <div className="flex items-center gap-2 mb-3">
        <BrainCircuit className={`w-5 h-5 text-primary ${isAnalyzing ? 'animate-pulse' : ''}`} />
        <h4 className="font-bold text-primary">ByteForge AI Predictive Router</h4>
      </div>
      
      {isAnalyzing ? (
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <Activity className="w-4 h-4 animate-spin" />
          Analyzing payload heuristics (Entropy, Variance, Pattern Frequency)...
        </div>
      ) : recommendation ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {recommendation.reason}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded text-accent border border-accent/20">
                Confidence: {recommendation.confidence}%
              </span>
            </div>
            <button
              onClick={() => onSelectRecommended(recommendation.algo)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary/20 text-primary font-bold rounded hover:bg-primary/30 transition-all"
            >
              <Sparkles className="w-3 h-3" />
              Auto-Select {recommendation.algo.toUpperCase()}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
