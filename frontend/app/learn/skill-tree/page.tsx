'use client'

/**
 * app/learn/skill-tree/page.tsx — the Interactive Skill Tree.
 *
 * Renders the skill DAG (/learn/skill-graph) as a layered SVG graph: nodes are
 * placed in topological "levels" (longest-path depth from a root), edges drawn as
 * curved prerequisite links, each node coloured by the learner's status. Hovering
 * a node lifts it and highlights its prerequisite links; clicking opens a detail
 * panel with mastery, the placement reason, blocking prerequisites, and a
 * deep-link into its lab. Layout is computed purely from the returned nodes/edges
 * — no hard-coded positions — so it adapts if the graph grows.
 */

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useLearningStore } from '@/lib/learning-store'
import {
  STATUS_META,
  StatusBadge,
  MasteryBar,
  ConfidenceMeter,
  DifficultyBadge,
  CATEGORY_LABEL,
  formatMinutes,
  Skeleton,
} from '@/components/learn/primitives'
import type { SkillNode } from '@/lib/learn-api'
import { PlayCircle, Lock, X, Info, ArrowRight, MousePointerClick } from 'lucide-react'

// Visual constants for the SVG canvas.
const COL_W = 220
const ROW_H = 104
const NODE_W = 176
const NODE_H = 66
const PAD_X = 44
const PAD_Y = 44

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
  const [hovered, setHovered] = useState<string | null>(null)

  const { placed, edges, width, height, byTopic, counts } = useMemo(() => {
    const empty = {
      placed: [] as Placed[],
      edges: [] as [string, string][],
      width: 800,
      height: 400,
      byTopic: {} as Record<string, Placed>,
      counts: { mastered: 0, in_progress: 0, available: 0, locked: 0 },
    }
    if (!skillGraph) return empty

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

    const counts = { mastered: 0, in_progress: 0, available: 0, locked: 0 }
    nodes.forEach((n) => {
      if (n.status in counts) counts[n.status as keyof typeof counts]++
    })

    return { placed: placedNodes, edges: edgeList, width: w, height: h, byTopic: map, counts }
  }, [skillGraph])

  if (error && !skillGraph) {
    return <p className="text-center text-sm text-muted-foreground mt-16">Couldn&apos;t load skill graph: {error}</p>
  }
  if (!skillGraph) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-16" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-[500px]" />
          <Skeleton className="h-[500px]" />
        </div>
      </div>
    )
  }

  const selectedNode = selected ? byTopic[selected] : null
  const focus = hovered ?? selected

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Legend + summary */}
      <div className="bf-card bf-rise p-4 flex items-center gap-x-6 gap-y-3 flex-wrap">
        {(['mastered', 'in_progress', 'available', 'locked'] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-2 text-xs">
            <span
              className="w-3 h-3 rounded-full border-2"
              style={{ background: NODE_COLORS[s].fill, borderColor: NODE_COLORS[s].stroke }}
            />
            <span className="text-muted-foreground">{STATUS_META[s].label}</span>
            <span className="font-semibold text-foreground tabular-nums">{counts[s]}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 ml-auto">
          <MousePointerClick className="w-3.5 h-3.5" /> Hover to trace prerequisites · click for details
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graph canvas */}
        <div className="lg:col-span-2 bf-card p-2 overflow-auto custom-scrollbar">
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
              const active = focus === a || focus === b
              const dim = focus && !active
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={active ? 'var(--primary)' : 'var(--border)'}
                  strokeWidth={active ? 2.5 : 1.5}
                  opacity={dim ? 0.18 : active ? 1 : 0.5}
                  className="transition-all duration-200"
                />
              )
            })}

            {/* Nodes */}
            {placed.map((n) => {
              const c = NODE_COLORS[n.status] ?? NODE_COLORS.locked
              const isSel = selected === n.topic
              const isHover = hovered === n.topic
              const dim = focus && focus !== n.topic && !edgeTouches(edges, focus, n.topic)
              return (
                <g
                  key={n.topic}
                  transform={`translate(${n.x}, ${n.y})`}
                  className="cursor-pointer transition-all duration-200"
                  style={{ opacity: dim ? 0.4 : 1 }}
                  onClick={() => setSelected(n.topic === selected ? null : n.topic)}
                  onMouseEnter={() => setHovered(n.topic)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <title>
                    {n.title} — {STATUS_META[n.status].label}
                    {n.mastery > 0 ? ` (${Math.round(n.mastery)}% mastery)` : ''}
                  </title>
                  {(isSel || isHover) && (
                    <rect
                      x={-3}
                      y={-3}
                      width={NODE_W + 6}
                      height={NODE_H + 6}
                      rx={15}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth={1}
                      opacity={0.25}
                    />
                  )}
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={12}
                    fill={c.fill}
                    stroke={isSel || isHover ? 'var(--primary)' : c.stroke}
                    strokeWidth={isSel ? 3 : isHover ? 2.5 : 1.5}
                    className="transition-all duration-200"
                  />
                  <text x={14} y={26} fontSize={13} fontWeight={700} fill="var(--foreground)">
                    {truncate(n.title, 20)}
                  </text>
                  <text x={14} y={46} fontSize={10} fill={c.text} fontWeight={600}>
                    {STATUS_META[n.status].label}
                    {n.mastery > 0 ? ` · ${Math.round(n.mastery)}%` : ''}
                  </text>
                  {n.status === 'locked' && (
                    <text x={NODE_W - 24} y={24} fontSize={13} fill={c.text}>
                      🔒
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Detail panel */}
        <div className="bf-card p-5 h-fit lg:sticky lg:top-44">
          {selectedNode ? (
            <NodeDetail node={selectedNode} onClose={() => setSelected(null)} />
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-11 h-11 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-center mb-3">
                <Info className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground">Select a node</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                See its mastery, prerequisites, and a direct link to the lab.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function edgeTouches(edges: [string, string][], focus: string, topic: string): boolean {
  return edges.some(([a, b]) => (a === focus && b === topic) || (b === focus && a === topic))
}

function NodeDetail({ node, onClose }: { node: Placed; onClose: () => void }) {
  return (
    <div className="space-y-4 bf-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-foreground">{node.title}</h3>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[node.category] ?? node.category}</span>
            <DifficultyBadge difficulty={node.difficulty} />
            {node.estimated_minutes ? (
              <span className="text-xs text-muted-foreground">{formatMinutes(node.estimated_minutes)}</span>
            ) : null}
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <StatusBadge status={node.status} />

      {(node.mastery > 0 || node.status === 'mastered') && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Mastery</span>
            <span className="font-semibold text-foreground tabular-nums">{Math.round(node.mastery)}%</span>
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
          className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm shadow-primary/25 group"
        >
          <PlayCircle className="w-4 h-4" /> Open lab{' '}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
