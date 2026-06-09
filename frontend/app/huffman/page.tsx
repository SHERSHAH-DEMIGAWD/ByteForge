'use client'

import { useCompressionStore } from '@/lib/store'
import { MetricCard } from '@/components/metric-card'
import { ArrowRight } from 'lucide-react'

export default function HuffmanPage() {
  const results = useCompressionStore((state) => state.results)
  const huffmanData = results?.algorithms.huffman

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Huffman Coding</h1>
        <p className="text-muted-foreground">
          Greedy algorithm that builds an optimal prefix-free code using binary trees
        </p>
      </div>

      {!huffmanData ? (
        <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Run compression on the dashboard first to see Huffman visualization</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Codebook */}
          <div>
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-6">Generated Codebook</h3>
              
              {huffmanData.codebook ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Character</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Binary Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(huffmanData.codebook).map(([char, code]) => (
                        <tr key={char} className="border-b border-border/20 hover:bg-primary/5">
                          <td className="py-3 px-3">{char === ' ' ? '&lt;space&gt;' : char}</td>
                          <td className="py-3 px-3">
                            <code className="bg-background/50 px-2 py-1 rounded text-accent font-mono text-xs">
                              {code}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No codebook data available</p>
              )}
            </div>
          </div>

          {/* Right Column - Tree Visualization */}
          <div>
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-6">Huffman Tree Structure</h3>
              
              <div className="bg-background/30 rounded-lg p-8 min-h-96 flex items-center justify-center border border-border/20">
                <div className="text-center">
                  <div className="inline-block bg-primary/20 border border-primary/30 px-4 py-2 rounded-lg mb-4">
                    <p className="text-accent font-bold">Root</p>
                  </div>
                  
                  <div className="flex gap-8 justify-center mt-8">
                    <div className="relative">
                      <div className="absolute top-0 left-1/2 w-px h-8 bg-border/50" />
                      <div className="bg-card/80 border border-border/30 px-3 py-1 rounded text-xs text-muted-foreground">
                        Left (0)
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute top-0 left-1/2 w-px h-8 bg-border/50" />
                      <div className="bg-card/80 border border-border/30 px-3 py-1 rounded text-xs text-muted-foreground">
                        Right (1)
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-xs mt-8">Tree visualization would be rendered here with D3.js in production</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom - Metrics */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold text-primary mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Original Size"
                value={results.original_size}
                unit="bytes"
              />
              <MetricCard
                title="Compressed Size"
                value={huffmanData.size}
                unit="bytes"
              />
              <MetricCard
                title="Compression Ratio"
                value={(huffmanData.ratio * 100).toFixed(2)}
                unit="%"
                variant="success"
              />
              <MetricCard
                title="Space Saved"
                value={((1 - huffmanData.ratio) * 100).toFixed(2)}
                unit="%"
                variant="success"
              />
              <MetricCard
                title="Execution Time"
                value={huffmanData.time}
                unit="ms"
              />
              <MetricCard
                title="Peak Memory"
                value={huffmanData.memory}
                unit="MB"
              />
            </div>
          </div>

          {/* Algorithm Info */}
          <div className="lg:col-span-2 bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4">Algorithm Details</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Paradigm: Greedy Algorithm</p>
                <p>Huffman coding constructs the optimal binary tree bottom-up by repeatedly combining the two least-frequent symbols.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Time Complexity: O(n log n)</p>
                <p>n is the number of unique characters. Dominated by sorting/heap operations during tree construction.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Space Complexity: O(n)</p>
                <p>Storage for frequency map and binary tree structure.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Best Use Case</p>
                <p>Excellent for text with non-uniform character distribution. Often used as a final stage in multi-algorithm pipelines like DEFLATE.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
