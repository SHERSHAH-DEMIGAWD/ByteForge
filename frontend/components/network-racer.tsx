'use client'

import { useState, useEffect } from 'react'
import { Wifi, Play, Square, RotateCcw } from 'lucide-react'

interface NetworkRacerProps {
  originalSize: number
  compressedSize: number
  algoName: string
}

const NETWORKS = {
  '3G': 3 * 1024 * 1024 / 8,      // ~384 KB/s
  '4G': 20 * 1024 * 1024 / 8,     // ~2.5 MB/s
  '5G': 100 * 1024 * 1024 / 8,    // ~12.5 MB/s
  'Dial-up': 56 * 1024 / 8        // ~7 KB/s
}

export function NetworkRacer({ originalSize, compressedSize, algoName }: NetworkRacerProps) {
  const [network, setNetwork] = useState<keyof typeof NETWORKS>('3G')
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress1, setProgress1] = useState(0) // original
  const [progress2, setProgress2] = useState(0) // compressed
  const [time1, setTime1] = useState(0)
  const [time2, setTime2] = useState(0)

  // Simulation logic
  useEffect(() => {
    let animationFrameId: number
    let lastTime: number

    const updateProgress = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp
      const deltaTime = (timestamp - lastTime) / 1000 // in seconds
      lastTime = timestamp

      const bytesPerSecond = NETWORKS[network]
      const bytesTransferred = bytesPerSecond * deltaTime

      setProgress1(prev => {
        const next = Math.min(originalSize, prev + bytesTransferred)
        if (next < originalSize) setTime1(t => t + deltaTime)
        return next
      })

      setProgress2(prev => {
        const next = Math.min(compressedSize, prev + bytesTransferred)
        if (next < compressedSize) setTime2(t => t + deltaTime)
        return next
      })

      if (progress1 < originalSize || progress2 < compressedSize) {
        animationFrameId = requestAnimationFrame(updateProgress)
      } else {
        setIsPlaying(false)
      }
    }

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateProgress)
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying, network, originalSize, compressedSize, progress1, progress2])

  const handleStart = () => {
    setProgress1(0)
    setProgress2(0)
    setTime1(0)
    setTime2(0)
    setIsPlaying(true)
  }

  const handleStop = () => setIsPlaying(false)
  
  const handleReset = () => {
    setIsPlaying(false)
    setProgress1(0)
    setProgress2(0)
    setTime1(0)
    setTime2(0)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes.toFixed(0) + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const timeSaved = Math.max(0, time1 - time2)

  return (
    <div className="mt-4 p-4 bg-black/80 rounded-lg border border-primary/30 shadow-inner">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-primary" />
          <h4 className="text-primary font-bold">Network Transmission Racer</h4>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={network}
            onChange={(e) => setNetwork(e.target.value as keyof typeof NETWORKS)}
            className="bg-card border border-border rounded px-2 py-1 text-xs"
            disabled={isPlaying}
          >
            {Object.keys(NETWORKS).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          
          <button 
            onClick={isPlaying ? handleStop : handleStart}
            className={`p-1.5 rounded ${isPlaying ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}
          >
            {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          
          <button onClick={handleReset} className="p-1.5 rounded bg-blue-500/20 text-blue-500">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Original File Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground font-mono">Original File</span>
            <span className="text-muted-foreground">{formatSize(progress1)} / {formatSize(originalSize)} ({time1.toFixed(2)}s)</span>
          </div>
          <div className="h-4 bg-[#0d1117] rounded-full overflow-hidden border border-border/20 relative">
            <div 
              className="h-full bg-[#3b82f6] transition-all duration-75"
              style={{ width: `${Math.min(100, (progress1 / originalSize) * 100)}%` }}
            />
          </div>
        </div>

        {/* Compressed File Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-accent font-mono font-bold">{algoName.toUpperCase()} Compressed</span>
            <span className="text-accent">{formatSize(progress2)} / {formatSize(compressedSize)} ({time2.toFixed(2)}s)</span>
          </div>
          <div className="h-4 bg-[#0d1117] rounded-full overflow-hidden border border-border/20 relative">
            <div 
              className="h-full bg-[#10b981] transition-all duration-75"
              style={{ width: `${Math.min(100, (progress2 / compressedSize) * 100)}%` }}
            />
          </div>
        </div>
      </div>
      
      {progress1 >= originalSize && progress2 >= compressedSize && timeSaved > 0 && (
        <div className="mt-4 text-center p-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs font-bold animate-in fade-in zoom-in">
          {algoName.toUpperCase()} saved you {timeSaved.toFixed(2)} seconds of transmission time on {network}!
        </div>
      )}
    </div>
  )
}
