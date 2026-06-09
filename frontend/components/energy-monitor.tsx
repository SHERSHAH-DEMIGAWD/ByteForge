'use client'

import { Zap, Leaf, Cpu, Server } from 'lucide-react'

interface EnergyMonitorProps {
  time: number // ms
  memory: number // MB
  originalSize: number // bytes
  algoName: string
}

export function EnergyMonitor({ time, memory, originalSize, algoName }: EnergyMonitorProps) {
  // Conservative estimates for a typical cloud server
  const PUE = 1.5 // Power Usage Effectiveness
  const P_CPU = 100 // Watts (active CPU)
  const P_MEM = 0.375 // Watts per GB of RAM
  const CARBON_INTENSITY = 400 // gCO2eq per kWh (global average)

  // Energy Calculation
  const timeSeconds = time / 1000
  const cpuEnergyJoules = P_CPU * timeSeconds
  const memoryEnergyJoules = (memory / 1024) * P_MEM * timeSeconds
  const totalEnergyJoules = (cpuEnergyJoules + memoryEnergyJoules) * PUE
  
  // Convert Joules to kWh (1 kWh = 3.6 million Joules)
  const energyKwh = totalEnergyJoules / 3600000

  // Carbon Calculation
  const carbonGrams = energyKwh * CARBON_INTENSITY

  // Throughput
  const throughputMBps = (originalSize / 1024 / 1024) / (timeSeconds || 0.001)

  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-black/40 border border-green-500/20 rounded-lg">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-500" /> Total Energy
        </span>
        <span className="text-sm font-mono text-yellow-400">
          {(totalEnergyJoules * 1000).toFixed(2)} mJ
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
          <Leaf className="w-3 h-3 text-green-500" /> Carbon Footprint
        </span>
        <span className="text-sm font-mono text-green-400">
          {(carbonGrams * 1000).toFixed(3)} mg CO₂
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
          <Server className="w-3 h-3 text-blue-500" /> Throughput
        </span>
        <span className="text-sm font-mono text-blue-400">
          {throughputMBps.toFixed(2)} MB/s
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
          <Cpu className="w-3 h-3 text-purple-500" /> Compute Time
        </span>
        <span className="text-sm font-mono text-purple-400">
          {time.toFixed(1)} ms
        </span>
      </div>
    </div>
  )
}
