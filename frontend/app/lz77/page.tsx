'use client'

import { useCompressionStore } from '@/lib/store'
import { MetricCard } from '@/components/metric-card'

export default function LZ77Page() {
  const results = useCompressionStore((state) => state.results)
  const lz77Data = results?.algorithms.lz77

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">LZ77 Compression</h1>
        <p className="text-muted-foreground">
          Dictionary-based sliding window algorithm that encodes repeated patterns
        </p>
      </div>

      {!lz77Data ? (
        <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Run compression on the dashboard first to see LZ77 tokens</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tokens Table */}
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-6">LZ77 Tokens</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Offset</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Length</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Next Char</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Encoding</th>
                  </tr>
                </thead>
                <tbody>
                  {lz77Data.tokens?.slice(0, 20).map((token, idx) => (
                    <tr key={idx} className="border-b border-border/20 hover:bg-primary/5">
                      <td className="py-3 px-3 text-accent font-mono">{token.offset}</td>
                      <td className="py-3 px-3 text-accent font-mono">{token.length}</td>
                      <td className="py-3 px-3">{token.next === ' ' ? '&lt;space&gt;' : token.next}</td>
                      <td className="py-3 px-3">
                        <code className="bg-background/50 px-2 py-1 rounded text-accent font-mono text-xs">
                          ({token.offset}, {token.length}, {token.next})
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {(lz77Data.tokens?.length ?? 0) > 20 && (
              <p className="text-xs text-muted-foreground mt-4">
                Showing first 20 tokens ({lz77Data.tokens?.length} total)
              </p>
            )}
          </div>

          {/* Metrics Grid */}
          <div>
            <h3 className="text-lg font-bold text-primary mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Original Size"
                value={results.original_size}
                unit="bytes"
              />
              <MetricCard
                title="Compressed Size"
                value={lz77Data.size}
                unit="bytes"
              />
              <MetricCard
                title="Compression Ratio"
                value={(lz77Data.ratio * 100).toFixed(2)}
                unit="%"
                variant="success"
              />
              <MetricCard
                title="Space Saved"
                value={((1 - lz77Data.ratio) * 100).toFixed(2)}
                unit="%"
                variant="success"
              />
              <MetricCard
                title="Execution Time"
                value={lz77Data.time}
                unit="ms"
              />
              <MetricCard
                title="Peak Memory"
                value={lz77Data.memory}
                unit="MB"
              />
            </div>
          </div>

          {/* Algorithm Info */}
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4">Algorithm Details</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Paradigm: Dictionary-Based Compression</p>
                <p>LZ77 uses a sliding window to find repeated patterns and encodes them as (offset, length, next_char) tuples.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Time Complexity: O(n²) naive, O(n) with hash tables</p>
                <p>Pattern matching within the sliding window determines efficiency.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Space Complexity: O(w)</p>
                <p>w is the window size. Can be configured for memory-constrained environments.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Best Use Case</p>
                <p>Effective for data with local repetition. Foundation for ZIP and GZIP compression standards.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
