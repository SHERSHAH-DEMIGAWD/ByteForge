'use client'

import { useCompressionStore } from '@/lib/store'
import { MetricCard } from '@/components/metric-card'

export default function RLEPage() {
  const results = useCompressionStore((state) => state.results)
  const rleData = results?.algorithms.rle

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">RLE (Run-Length Encoding)</h1>
        <p className="text-muted-foreground">
          Simple compression for consecutive identical characters
        </p>
      </div>

      {!rleData ? (
        <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Run compression on the dashboard first to see RLE sequences</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Sequences Table */}
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-6">Run-Length Sequences</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Index</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Count</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Character</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Encoding</th>
                  </tr>
                </thead>
                <tbody>
                  {rleData.sequences?.slice(0, 30).map((seq, idx) => (
                    <tr key={idx} className="border-b border-border/20 hover:bg-primary/5">
                      <td className="py-3 px-3 text-muted-foreground text-xs">{idx}</td>
                      <td className="py-3 px-3 text-accent font-mono font-bold">{seq.count}</td>
                      <td className="py-3 px-3">{seq.char === ' ' ? '&lt;space&gt;' : seq.char}</td>
                      <td className="py-3 px-3">
                        <code className="bg-background/50 px-2 py-1 rounded text-accent font-mono text-xs">
                          {seq.count}×{seq.char}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {(rleData.sequences?.length ?? 0) > 30 && (
              <p className="text-xs text-muted-foreground mt-4">
                Showing first 30 sequences ({rleData.sequences?.length} total)
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
                value={rleData.size}
                unit="bytes"
              />
              <MetricCard
                title="Compression Ratio"
                value={(rleData.ratio * 100).toFixed(2)}
                unit="%"
                variant="success"
              />
              <MetricCard
                title="Space Saved"
                value={((1 - rleData.ratio) * 100).toFixed(2)}
                unit="%"
                variant="success"
              />
              <MetricCard
                title="Execution Time"
                value={rleData.time}
                unit="ms"
              />
              <MetricCard
                title="Peak Memory"
                value={rleData.memory}
                unit="MB"
              />
            </div>
          </div>

          {/* Algorithm Info */}
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4">Algorithm Details</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Paradigm: Simple/Brute Force</p>
                <p>RLE scans the input once, counting consecutive identical characters and storing count-character pairs.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Time Complexity: O(n)</p>
                <p>Single-pass algorithm with linear time. No complex data structures required.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Space Complexity: O(1)</p>
                <p>Constant extra space, excluding output buffer.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Best Use Case</p>
                <p>Highly specialized for data with long runs (e.g., uncompressed images, fax data, some binary formats).</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
