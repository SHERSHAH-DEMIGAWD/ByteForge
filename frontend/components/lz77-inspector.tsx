'use client'

import { SearchCode } from 'lucide-react'

interface LZ77InspectorProps {
  tokens: any[]
}

export function LZ77Inspector({ tokens }: LZ77InspectorProps) {
  return (
    <div className="mt-4 p-4 bg-black/80 rounded-lg border border-primary/30 shadow-inner">
      <div className="flex items-center gap-2 mb-4">
        <SearchCode className="w-4 h-4 text-primary" />
        <h4 className="text-primary font-bold">LZ77 Dictionary Tokens</h4>
      </div>
      
      <p className="text-xs text-muted-foreground mb-4">
        LZ77 compresses by saying "Go back X characters, and copy the next Y characters." 
        <br/>Format: <span className="font-mono text-accent bg-accent/10 px-1 rounded">&lt;Offset, Length, Next Char&gt;</span>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {tokens.map((tk, idx) => {
          let nextChar = tk.next
          if (nextChar === ' ') nextChar = 'SPC'
          else if (nextChar === '\n') nextChar = 'NL'
          else if (nextChar === '\t') nextChar = 'TAB'
          else if (nextChar === '\r') nextChar = 'CR'
          else if (nextChar === '') nextChar = 'EOF'

          return (
            <div key={idx} className="flex justify-center items-center bg-card/50 p-2 rounded border border-border/30 font-mono text-xs shadow-inner">
              <span className="text-muted-foreground mr-1">&lt;</span>
              <span className="text-blue-400">{tk.offset}</span>
              <span className="text-muted-foreground mx-1">,</span>
              <span className="text-green-400">{tk.length}</span>
              <span className="text-muted-foreground mx-1">,</span>
              <span className="text-accent">'{nextChar}'</span>
              <span className="text-muted-foreground ml-1">&gt;</span>
            </div>
          )
        })}
      </div>
      
      <div className="mt-2 text-xs text-center text-muted-foreground italic">
        Showing first {Math.min(tokens.length, 100)} tokens...
      </div>
    </div>
  )
}
