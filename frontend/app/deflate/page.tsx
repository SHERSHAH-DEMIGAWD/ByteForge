'use client'

import { useCompressionStore } from '@/lib/store'
import { MetricCard } from '@/components/metric-card'

export default function DeflatePage() {
  const results = useCompressionStore((state) => state.results)
  const deflateData = results?.algorithms.deflate

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">DEFLATE Compression</h1>
        <p className="text-muted-foreground">
          Hybrid algorithm combining LZ77 and Huffman coding
        </p>
      </div>

      {!deflateData ? (
        <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Run compression on the dashboard first to see DEFLATE analysis</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pipeline Diagram */}
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8">
            <h3 className="text-lg font-bold text-primary mb-8">Compression Pipeline</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-background/30 rounded-lg p-4 border border-border/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Input</p>
                  <p className="text-sm font-mono text-accent">Raw Data</p>
                </div>
                
                <div className="text-primary text-xl">→</div>
                
                <div className="flex-1 bg-background/30 rounded-lg p-4 border border-border/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Step 1</p>
                  <p className="text-sm font-mono text-accent">LZ77 Tokenization</p>
                  <p className="text-xs text-muted-foreground mt-2">(offset, length, next_char)</p>
                </div>
                
                <div className="text-primary text-xl">→</div>
                
                <div className="flex-1 bg-background/30 rounded-lg p-4 border border-border/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Step 2</p>
                  <p className="text-sm font-mono text-accent">Huffman Encoding</p>
                  <p className="text-xs text-muted-foreground mt-2">Variable-length codes</p>
                </div>
                
                <div className="text-primary text-xl">→</div>
                
                <div className="flex-1 bg-background/30 rounded-lg p-4 border border-border/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Output</p>
                  <p className="text-sm font-mono text-accent">Compressed Data</p>
                </div>
              </div>
            </div>
          </div>

          {/* Algorithm Comparison */}
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-6">Component Algorithms</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border/30 rounded-lg p-4 bg-background/30">
                <p className="text-sm font-bold text-accent mb-3">LZ77 Component</p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Finds repeated patterns in data</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Outputs tokens with offsets and lengths</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Handles literal bytes that don&apos;t match</span>
                  </li>
                </ul>
              </div>

              <div className="border border-border/30 rounded-lg p-4 bg-background/30">
                <p className="text-sm font-bold text-accent mb-3">Huffman Component</p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Encodes tokens with optimal variable-length codes</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Stores codebook in compressed header</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Achieves better ratios than LZ77 alone</span>
                  </li>
                </ul>
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
                value={deflateData.size}
                unit="bytes"
              />
              <MetricCard
                title="Compression Ratio"
                value={(deflateData.ratio * 100).toFixed(2)}
                unit="%"
                variant="success"
              />
              <MetricCard
                title="Space Saved"
                value={((1 - deflateData.ratio) * 100).toFixed(2)}
                unit="%"
                variant="success"
              />
              <MetricCard
                title="Execution Time"
                value={deflateData.time}
                unit="ms"
              />
              <MetricCard
                title="Peak Memory"
                value={deflateData.memory}
                unit="MB"
              />
            </div>
          </div>

          {/* Algorithm Info */}
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4">Algorithm Details</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Paradigm: Hybrid (Two-Stage)</p>
                <p>Combines LZ77 dictionary compression with Huffman statistical compression for synergistic results.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Time Complexity: O(n log n)</p>
                <p>Dominated by Huffman tree construction and LZ77 pattern matching.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Space Complexity: O(n)</p>
                <p>Requires space for tokens and Huffman tree structure.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Best Use Case</p>
                <p>Industry standard for general-purpose compression. Used in ZIP, gzip, HTTP compression, and PNG. Excellent balance of speed and compression ratio.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
