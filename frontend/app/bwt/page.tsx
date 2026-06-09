'use client'

import { useCompressionStore } from '@/lib/store'
import { MetricCard } from '@/components/metric-card'

export default function BWTPage() {
  const results = useCompressionStore((state) => state.results)
  const bwtData = results?.algorithms.bwt

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">BWT Pipeline</h1>
        <p className="text-muted-foreground">
          Burrows-Wheeler Transform followed by Move-to-Front encoding
        </p>
      </div>

      {!bwtData ? (
        <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Run compression on the dashboard first to see BWT transformation</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Transformation Pipeline */}
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8">
            <h3 className="text-lg font-bold text-primary mb-8">Transformation Pipeline</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stage 1 */}
              <div className="border border-border/30 rounded-lg p-4 bg-background/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Stage 1</p>
                <p className="text-sm font-bold text-accent mb-4">Original Data</p>
                <div className="bg-background/50 rounded p-3 font-mono text-xs text-foreground/70 break-all max-h-32 overflow-auto">
                  {results?.original_size || 0} bytes
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="text-primary text-2xl">→</div>
              </div>

              {/* Stage 2 */}
              <div className="border border-border/30 rounded-lg p-4 bg-background/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Stage 2</p>
                <p className="text-sm font-bold text-accent mb-4">After BWT</p>
                <div className="bg-background/50 rounded p-3 font-mono text-xs text-foreground/70">
                  Data rotated & sorted
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center md:col-start-2">
                <div className="text-primary text-2xl">→</div>
              </div>

              {/* Stage 3 */}
              <div className="md:col-start-3 border border-border/30 rounded-lg p-4 bg-background/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Stage 3</p>
                <p className="text-sm font-bold text-accent mb-4">After MTF</p>
                <div className="bg-background/50 rounded p-3 font-mono text-xs text-foreground/70">
                  Move-to-Front encoded
                </div>
              </div>
            </div>
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
                value={bwtData.size}
                unit="bytes"
              />
              <MetricCard
                title="Compression Ratio"
                value={(bwtData.ratio * 100).toFixed(2)}
                unit="%"
                variant="success"
              />
              <MetricCard
                title="Space Saved"
                value={((1 - bwtData.ratio) * 100).toFixed(2)}
                unit="%"
                variant="success"
              />
              <MetricCard
                title="Execution Time"
                value={bwtData.time}
                unit="ms"
              />
              <MetricCard
                title="Peak Memory"
                value={bwtData.memory}
                unit="MB"
              />
            </div>
          </div>

          {/* Algorithm Info */}
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4">Algorithm Details</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Paradigm: Transform-Based Compression</p>
                <p>BWT reorders characters to group similar ones, making data more compressible. Move-to-Front further groups repeated characters.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Time Complexity: O(n log n) to O(n²)</p>
                <p>Suffix sorting dominates. Modern implementations use induced sorting for O(n) time.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Space Complexity: O(n)</p>
                <p>Requires temporary storage for the transformed data.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Best Use Case</p>
                <p>Excellent for highly compressible text data. Used in bzip2. Less effective for random or pre-compressed data.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
