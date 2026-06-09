'use client'

import { useCompressionStore } from '@/lib/store'
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function AnalyticsPage() {
  const results = useCompressionStore((state) => state.results)

  // Prepare chart data
  const compressionRatioData = results
    ? Object.entries(results.algorithms)
        .filter(([_, data]) => data)
        .map(([algo, data]) => ({
          name: algo.charAt(0).toUpperCase() + algo.slice(1),
          'Ratio (%)': parseFloat((data!.ratio * 100).toFixed(2)),
        }))
    : []

  const executionSpeedData = results
    ? Object.entries(results.algorithms)
        .filter(([_, data]) => data)
        .map(([algo, data]) => ({
          name: algo.charAt(0).toUpperCase() + algo.slice(1),
          'Time (ms)': data!.time,
        }))
    : []

  const memoryData = results
    ? Object.entries(results.algorithms)
        .filter(([_, data]) => data)
        .map(([algo, data]) => ({
          name: algo.charAt(0).toUpperCase() + algo.slice(1),
          'Memory (MB)': data!.memory,
        }))
    : []

  const radarData = results
    ? Object.entries(results.algorithms)
        .filter(([_, data]) => data)
        .map(([algo, data]) => ({
          algorithm: algo.charAt(0).toUpperCase() + algo.slice(1),
          'Ratio': 100 - (data!.ratio * 100),
          'Speed': 100 - Math.min((data!.time / 100) * 100, 100),
          'Simplicity': algo === 'rle' ? 95 : algo === 'huffman' ? 75 : 60,
          'Space': 100 - Math.min((data!.memory / 5) * 100, 100),
        }))
    : []

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 border border-border/50 rounded-lg p-3 backdrop-blur-md">
          <p className="text-sm font-medium text-foreground">{payload[0].payload.name}</p>
          <p className="text-sm text-accent">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Benchmark & Analytics</h1>
        <p className="text-muted-foreground">
          Compare compression algorithms across multiple performance dimensions
        </p>
      </div>

      {!results ? (
        <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Run compression on the dashboard first to see analytics</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Bar Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compression Ratio */}
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Compression Ratio</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={compressionRatioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="name" stroke="rgb(148, 163, 184)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgb(148, 163, 184)" style={{ fontSize: '12px' }} />
                  <Tooltip content={customTooltip} />
                  <Bar dataKey="Ratio (%)" fill="#00AAFF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-background/30 rounded-lg border border-border/20">
                <p className="text-xs text-muted-foreground">
                  <span className="text-accent font-bold">Lower is better.</span> Ratio indicates final size as % of original.
                </p>
              </div>
            </div>

            {/* Execution Speed */}
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Execution Speed</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={executionSpeedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="name" stroke="rgb(148, 163, 184)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgb(148, 163, 184)" style={{ fontSize: '12px' }} />
                  <Tooltip content={customTooltip} />
                  <Bar dataKey="Time (ms)" fill="#00FF88" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-background/30 rounded-lg border border-border/20">
                <p className="text-xs text-muted-foreground">
                  <span className="text-accent font-bold">Lower is faster.</span> Time in milliseconds to compress.
                </p>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Space Complexity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={memoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="name" stroke="rgb(148, 163, 184)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgb(148, 163, 184)" style={{ fontSize: '12px' }} />
                  <Tooltip content={customTooltip} />
                  <Bar dataKey="Memory (MB)" fill="#FF4B4B" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-background/30 rounded-lg border border-border/20">
                <p className="text-xs text-muted-foreground">
                  <span className="text-accent font-bold">Lower is better.</span> Peak memory usage in megabytes.
                </p>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4">Multi-Dimensional Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148, 163, 184, 0.1)" />
                <PolarAngleAxis dataKey="algorithm" stroke="rgb(148, 163, 184)" style={{ fontSize: '12px' }} />
                <PolarRadiusAxis stroke="rgb(148, 163, 184)" style={{ fontSize: '12px' }} />
                <Radar name="Ratio" dataKey="Ratio" stroke="#00AAFF" fill="#00AAFF" fillOpacity={0.2} />
                <Radar name="Speed" dataKey="Speed" stroke="#00FF88" fill="#00FF88" fillOpacity={0.2} />
                <Radar name="Simplicity" dataKey="Simplicity" stroke="#FF4B4B" fill="#FF4B4B" fillOpacity={0.2} />
                <Radar name="Space" dataKey="Space" stroke="#FFB800" fill="#FFB800" fillOpacity={0.2} />
                <Legend />
                <Tooltip content={customTooltip} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-background/30 rounded-lg border border-border/20">
              <p className="text-xs text-muted-foreground">
                Radar chart comparing algorithms across multiple axes. <span className="text-accent font-bold">Higher values are better</span> for all axes.
              </p>
            </div>
          </div>

          {/* Summary Table */}
          <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-primary mb-4">Summary Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Algorithm</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Ratio</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Time (ms)</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Memory (MB)</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Best For</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(results.algorithms).map(([algo, data]) => {
                    if (!data) return null
                    const bestUseCases = {
                      huffman: 'Non-uniform text',
                      lz77: 'Local repetition',
                      rle: 'Long runs',
                      bwt: 'Highly compressible',
                      deflate: 'General purpose',
                    }
                    return (
                      <tr key={algo} className="border-b border-border/20 hover:bg-primary/5">
                        <td className="py-3 px-4 font-medium capitalize">{algo}</td>
                        <td className="py-3 px-4 text-right text-accent">{(data.ratio * 100).toFixed(2)}%</td>
                        <td className="py-3 px-4 text-right">{data.time}ms</td>
                        <td className="py-3 px-4 text-right">{data.memory}MB</td>
                        <td className="py-3 px-4 text-right text-muted-foreground text-xs">
                          {bestUseCases[algo as keyof typeof bestUseCases]}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
