'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Activity } from 'lucide-react'

interface EntropyGraphProps {
  originalText: string
  compressedBase64: string
}

export function EntropyGraph({ originalText, compressedBase64 }: EntropyGraphProps) {
  const chartData = useMemo(() => {
    // 1. Calculate original frequencies
    const originalFreq = new Array(256).fill(0)
    const encoder = new TextEncoder()
    const originalBytes = encoder.encode(originalText)
    for (let i = 0; i < originalBytes.length; i++) {
      originalFreq[originalBytes[i]]++
    }

    // 2. Calculate compressed frequencies
    const compressedFreq = new Array(256).fill(0)
    try {
      const binaryString = atob(compressedBase64)
      for (let i = 0; i < binaryString.length; i++) {
        compressedFreq[binaryString.charCodeAt(i)]++
      }
    } catch {
      // Ignore if decoding fails
    }

    // 3. Format for Recharts
    const data = []
    for (let i = 0; i < 256; i++) {
      if (originalFreq[i] > 0 || compressedFreq[i] > 0) {
        data.push({
          byte: i,
          hex: '0x' + i.toString(16).padStart(2, '0').toUpperCase(),
          char: i >= 32 && i <= 126 ? String.fromCharCode(i) : `chr(${i})`,
          original: originalFreq[i],
          compressed: compressedFreq[i]
        })
      }
    }
    
    // Sort by byte value
    return data.sort((a, b) => a.byte - b.byte)
  }, [originalText, compressedBase64])

  if (chartData.length === 0) return null

  return (
    <div className="mt-4 p-4 bg-black/80 rounded-lg border border-primary/30 shadow-inner">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-4 h-4 text-primary" />
        <h4 className="text-primary font-bold">Entropy Analysis (Byte Frequency)</h4>
      </div>
      
      <p className="text-xs text-muted-foreground mb-4">
        Notice how the <span className="text-[#3b82f6] font-bold">Original Data</span> has massive spikes (low entropy), while the <span className="text-[#10b981] font-bold">Compressed Data</span> is distributed much more flatly, resembling pure random noise (maximizing Shannon Entropy).
      </p>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="char" stroke="#666" fontSize={10} tickMargin={5} />
            <YAxis stroke="#666" fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '12px' }}
              itemStyle={{ fontSize: '12px' }}
              labelStyle={{ color: '#888', marginBottom: '5px' }}
            />
            <Bar dataKey="original" name="Original Bytes" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={20} />
            <Bar dataKey="compressed" name="Compressed Bytes" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
