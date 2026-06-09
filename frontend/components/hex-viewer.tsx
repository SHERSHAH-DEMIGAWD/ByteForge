'use client'

import { useState, useMemo } from 'react'
import { FileDown, FileText } from 'lucide-react'

interface HexViewerProps {
  originalText: string
  compressedBase64: string
}

export function HexViewer({ originalText, compressedBase64 }: HexViewerProps) {
  // Convert original text to bytes
  const originalBytes = useMemo(() => {
    const encoder = new TextEncoder()
    return encoder.encode(originalText)
  }, [originalText])

  // Convert compressed base64 back to bytes
  const compressedBytes = useMemo(() => {
    try {
      const binaryString = atob(compressedBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return bytes
    } catch {
      return new Uint8Array()
    }
  }, [compressedBase64])

  const formatHex = (bytes: Uint8Array, limit = 256) => {
    const hex = []
    const ascii = []
    
    for (let i = 0; i < Math.min(bytes.length, limit); i++) {
      const b = bytes[i]
      hex.push(b.toString(16).padStart(2, '0').toUpperCase())
      
      // Printable ASCII range
      if (b >= 32 && b <= 126) {
        ascii.push(String.fromCharCode(b))
      } else {
        ascii.push('.')
      }
    }

    const rows = []
    for (let i = 0; i < hex.length; i += 16) {
      const hexRow = hex.slice(i, i + 16).join(' ')
      const asciiRow = ascii.slice(i, i + 16).join('')
      const offset = i.toString(16).padStart(8, '0')
      rows.push(`${offset}  ${hexRow.padEnd(47, ' ')}  |${asciiRow}|`)
    }
    
    if (bytes.length > limit) {
      rows.push(`... ${bytes.length - limit} more bytes truncated ...`)
    }
    
    return rows.join('\n')
  }

  return (
    <div className="mt-4 p-4 bg-black/80 rounded-lg border border-primary/30 overflow-hidden text-left shadow-inner font-mono text-xs">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-primary font-bold flex items-center gap-2">
          <FileText className="w-4 h-4" /> Hexadecimal Inspector
        </h4>
        <div className="flex gap-4 text-muted-foreground">
          <span>Original: {originalBytes.length}B</span>
          <span>Compressed: {compressedBytes.length}B</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-muted-foreground mb-2 text-[10px] uppercase font-bold tracking-wider">Original Stream</span>
          <pre className="text-[10px] leading-tight text-slate-300 overflow-x-auto p-3 bg-[#0d1117] rounded border border-border/20">
            {formatHex(originalBytes)}
          </pre>
        </div>
        <div className="flex flex-col">
          <span className="text-accent mb-2 text-[10px] uppercase font-bold tracking-wider">Compressed Stream</span>
          <pre className="text-[10px] leading-tight text-accent/80 overflow-x-auto p-3 bg-[#0d1117] rounded border border-accent/20">
            {formatHex(compressedBytes)}
          </pre>
        </div>
      </div>
    </div>
  )
}
