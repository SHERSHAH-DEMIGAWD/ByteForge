'use client'

import { Network } from 'lucide-react'

interface HuffmanTreeProps {
  codebook: Record<string, string>
}

export function HuffmanTreeVisualizer({ codebook }: HuffmanTreeProps) {
  // Sort codebook by length of code
  const sortedCodes = Object.entries(codebook).sort((a, b) => a[1].length - b[1].length)

  return (
    <div className="mt-4 p-4 bg-black/80 rounded-lg border border-primary/30 text-left shadow-inner text-sm">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4 text-primary" />
        <h4 className="text-primary font-bold">Huffman Dictionary</h4>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {sortedCodes.map(([char, code]) => {
          let displayChar = char
          if (char === ' ') displayChar = 'SPACE'
          else if (char === '\n') displayChar = 'NEWLINE'
          else if (char === '\t') displayChar = 'TAB'
          else if (char === '\r') displayChar = 'CR'

          return (
            <div key={char} className="flex justify-between items-center bg-card/50 p-2 rounded border border-border/30">
              <span className="font-mono text-muted-foreground bg-black/50 px-2 py-0.5 rounded shadow-inner">
                {displayChar}
              </span>
              <span className="font-mono text-accent font-bold tracking-widest">
                {code}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
