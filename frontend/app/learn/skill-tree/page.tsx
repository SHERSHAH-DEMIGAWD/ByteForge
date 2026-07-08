'use client'

/**
 * app/learn/skill-tree/page.tsx — the Interactive Skill Tree.
 *
 * Renders the skill DAG (/learn/skill-graph) as a layered SVG graph: nodes are
 * placed in topological "levels" (longest-path depth from a root), edges drawn as
 * curved prerequisite links, each node coloured by the learner's status. Clicking
 * a node opens a detail panel with mastery, the placement reason, blocking
 * prerequisites, and a deep-link into its lab. Layout is computed purely from the
 * returned nodes/edges — no hard-coded positions — so it adapts if the graph grows.
 */

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useLearningStore } from '@/lib/learning-store'
import {
  STATUS_META,
  StatusBadge,
  MasteryBar,
  ConfidenceMeter,
  CATEGORY_LABEL,
  formatMinutes,
} from '@/components/learn/primitives'
import type { SkillNode } from '@/lib/learn-api'
import { PlayCircle, Lock, X, Info, ArrowRight } from 'lucide-react'

// Visual constants for the SVG canvas.
const COL_W = 210
const ROW_H = 96
const NODE_W = 168
const NODE_H = 62
const PAD_X = 40
const PAD_Y = 40

interface Placed extends SkillNode {
  x: number
  y: number
  level: number
}

// Status → fill/stroke for the SVG node (uses hard hex so SVG is theme-stable).
const NODE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  mastered: { fill: 'rgba(16,185,129,0.14)', stroke: '#10b981', text: '#059669' },
  in_progress: { fill: 'rgba(245,158,11,0.14)', stroke: '#f59e0b', text: '#d97706' },
  available: { fill: 'rgba(56,189,248,0.14)', stroke: '#38bdf8', text: '#0ea5e9' },
  locked: { fill: 'rgba(148,163,184,0.10)', stroke: '#94a3b8', text: '#64748b' },
}

export default function SkillTreePage() {
  const { skillGraph, error } = useLearningStore()
  const [selected, setSelected] = useState<string | null>(null)

  const { placed, edges, width, height, byTopic } = useMemo(() => {
    if (!skillGraph) return { placed: [] as Placed[], edges: [] as [string, string][], width: 800, height: 400, byTopic: {} as Record<string, Placed> }

    const nodes = skillGraph.nodes
    const edgeList = skillGraph.edges
    const topics = nodes.map((n) => n.topic)

    // Longest-path level assignment (topological depth).
    const preds: Record<string, string[]> = {}
    topics.forEach((t) => (preds[t] = []))
    edgeList.forEach(([a, b]) => {
      if (preds[b]) preds[b].push(a)
    })

    const level: Record<string, number> = {}
    const compute = (t: string, seen: Set<string>): number => {
      if (level[t] !== undefined) return level[t]
      if (seen.has(t)) return 0
      seen.add(t)
      const ps = preds[t] ?? []
      const l = ps.length ? Math.max(...ps.map((p) => compute(p, seen))) + 1 : 0
      level[t] = l
      return l
    }
    topics.forEach((t) => compute(t, new Set()))

    // Group by level, then stack vertically within each column.
    const byLevel: Record<number, SkillNode[]> = {}
    nodes.forEach((n) => {
      const l = level[n.topic] ?? 0
      ;(byLevel[l] ??= []).push(n)
    })

    const placedNodes: Placed[] = []
    const maxRows = Math.max(...Object.values(byLevel).map((g) => g.length), 1)
    Object.entries(byLevel).forEach(([lvlStr, group]) => {
      const lvl = Number(lvlStr)
      // Center each column vertically relative to the tallest column.
      const offset = (maxRows - group.length) / 2
      group.forEach((n, i) => {
        placedNodes.push({
          ...n,
          level: lvl,
          x: PAD_X + lvl * COL_W,
          y: PAD_Y + (i + offset) * ROW_H,
        })
      })
    })

    const map: Record<string, Placed> = {}
    placedNodes.forEach((p) => (map[p.topic] = p))

    const maxLevel = Math.max(...Object.values(level), 0)
    const w = PAD_X * 2 + maxLevel * COL_W + NODE_W
    const h = PAD_Y * 2 + maxRows * ROW_H
    return { placed: placedNodes, edges: edgeList, width: w, height: h, byTopic: map }
  }, [skillGraph])

  if (error && !skillGraph) {
    return <p className="text-center text-sm text-muted-foreground mt-16">Couldn&apos;t load skill graph: {error}</p>
  }
  if (!skillGraph) {
    return <div className="max-w-6xl mx-auto h-[500px] rounded-2xl border border-border bg-card animate-pulse" />
  }

  const selectedNode = selected ? byTopic[selected] : null

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs">
        {(['mastered', 'in_progress', 'available', 'locked'] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border-2"
              style={{ background: NODE_COLORS[s].fill, borderColor: NODE_COLORS[s].stroke }}
            />
            <span className="text-muted-foreground">{STATUS_META[s].label}</span>
          </span>
        ))}
        <span className="text-muted-foreground/60 ml-auto hidden sm:inline">Click a node for details →</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graph canvas */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-2 overflow-auto custom-scrollbar">
          <svg width={width} height={height} className="min-w-full">
            {/* Edges */}
            {edges.map(([a, b], i) => {
              const from = byTopic[a]
              const to = byTopic[b]
              if (!from || !to) return null
              const x1 = from.x + NODE_W
              const y1 = from.y + NODE_H / 2
              const x2 = to.x
              const y2 = to.y + NODE_H / 2
              const midX = (x1 + x2) / 2
              const active = selected === a || selected === b
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={active ? '#3b82f6' : 'var(--border)'}
                  strokeWidth={active ? 2.5 : 1.5}
                  opacity={active ? 1 : 0.55}
                />
              )
            })}

            {/* Nodes */}
            {placed.map((n) => {
              const c = NODE_COLORS[n.status] ?? NODE_COLORS.locked
              const isSel = selected === n.topic
              return (
                <g
                  key={n.topic}
                  transform={`translate(${n.x}, ${n.y})`}
                  className="cursor-pointer"
                  onClick={() => setSelected(n.topic === selected ? null : n.topic)}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={12}
                    fill={c.fill}
                    stroke={isSel ? '#3b82f6' : c.stroke}
                    strokeWidth={isSel ? 3 : 1.5}
                  />
                  <text x={12} y={24} fontSize={13} fontWeight={700} fill="var(--foreground)">
                    {truncate(n.title, 20)}
                  </text>
                  <text x={12} y={44} fontSize={10} fill={c.text} fontWeight={600}>
                    {STATUS_META[n.status].label}
                    {n.mastery > 0 ? ` · ${Math.round(n.mastery)}%` : ''}
                  </text>
                  {n.status === 'locked' && (
                    <g transform={`translate(${NODE_W - 26}, 10)`}>
                      <Lock className="w-3 h-3" />
                      <text x={0} y={12} fontSize={13} fill={c.text}>
                        🔒
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Detail panel */}
        <div className="rounded-2xl border border-border bg-card p-5 h-fit lg:sticky lg:top-40">
          {selectedNode ? (
            <NodeDetail node={selectedNode} onClose={() => setSelected(null)} />
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <Info className="w-8 h-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Select any node to see its mastery, prerequisites, and a direct link to the lab.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NodeDetail({ node, onClose }: { node: Placed; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-foreground">{node.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {CATEGORY_LABEL[node.category] ?? node.category} · {node.difficulty}
            {node.estimated_minutes ? ` · ${formatMinutes(node.estimated_minutes)}` : ''}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <StatusBadge status={node.status} />

      {(node.mastery > 0 || node.status === 'mastered') && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Mastery</span>
            <span className="font-semibold text-foreground">{Math.round(node.mastery)}%</span>
          </div>
          <MasteryBar value={node.mastery} />
          <ConfidenceMeter confidence={node.confidence} />
        </div>
      )}

      <p className="text-sm text-muted-foreground">{node.reason}</p>

      {node.status === 'locked' && node.blocking_prereqs.length > 0 && (
        <div className="text-xs">
          <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Unlock by mastering:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {node.blocking_prereqs.map((p) => (
              <span key={p} className="px-2 py-0.5 rounded-md bg-muted/40 border border-border capitalize text-foreground">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {node.route && node.status !== 'locked' && (
        <Link
          href={node.route}
          className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          <PlayCircle className="w-4 h-4" /> Open lab <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
