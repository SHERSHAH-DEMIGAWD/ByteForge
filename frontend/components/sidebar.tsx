'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'
import {
  Home,
  Zap,
  BarChart3,
  Code,
  BookOpen,
  Unlock,
  Activity,
  Search,
  Calendar,
  Shuffle,
  GitMerge,
  GitFork,
  GraduationCap,
  Database,
  GitBranch,
  Crosshair,
  Table2,
  Crown,
  Grid3X3
} from 'lucide-react'

const coreLinks = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/decoder', label: 'The Decoder Node', icon: Unlock },
  { href: '/viva-guide', label: 'DAA Viva Sandbox', icon: GraduationCap },
]

const algoLinks = [
  { href: '/huffman', label: 'Huffman Coding', icon: Zap },
  { href: '/lz77', label: 'LZ77 Compression', icon: Zap },
  { href: '/rle', label: 'RLE Encoding', icon: Zap },
  { href: '/bwt', label: 'BWT Pipeline', icon: Zap },
  { href: '/deflate', label: 'Deflate Compression', icon: Zap },
  { href: '/knapsack', label: 'Knapsack Allocator', icon: Database },
  { href: '/string-matching', label: 'String Matching Lab', icon: Search },
  { href: '/sorting-lab', label: 'Sorting Laboratory', icon: Shuffle },
  { href: '/mst-planner', label: 'MST Server Planner', icon: GitMerge },
  { href: '/network-routing', label: 'Dijkstra Latency Router', icon: Activity },
  { href: '/scheduler', label: 'Topological Scheduler', icon: Calendar },
  { href: '/recursion-tree', label: 'Recursion Tree visualizer', icon: GitFork },
  { href: '/bellman-ford', label: 'Bellman-Ford Lab', icon: GitBranch },
  { href: '/astar', label: 'A* Pathfinding Grid', icon: Crosshair },
  { href: '/lcs', label: 'LCS DP Table', icon: Table2 },
  { href: '/nqueens', label: 'N-Queens Backtracking', icon: Crown },
  { href: '/strassen', label: 'Strassen Multiplier', icon: Grid3X3 },
]

const analysisLinks = [
  { href: '/analytics', label: 'Benchmark & Analytics', icon: BarChart3 },
  { href: '/verification', label: 'Big-O Verification', icon: Code },
  { href: '/guide', label: 'Complexity Guide', icon: BookOpen },
]

export function Sidebar() {
  const pathname = usePathname()

  const renderLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => (
    <Link
      key={href}
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all border ${
        pathname === href
          ? 'bg-primary/10 text-primary border-primary/20 font-bold'
          : 'text-foreground/70 hover:text-foreground hover:bg-card/50 border-transparent'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )

  return (
    <aside className="w-64 border-r border-border bg-card/40 backdrop-blur-md fixed h-screen overflow-y-auto z-20 custom-scrollbar">
      {/* Logo */}
      <div className="sticky top-0 p-6 border-b border-border/50 bg-card/85 backdrop-blur-md z-30 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            ByteForge
          </h1>
          <p className="text-xs text-muted-foreground mt-1">DAA Laboratory Hub</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-5">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Core Hub</p>
          <div className="space-y-1">
            {coreLinks.map(renderLink)}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">DAA Visualizers</p>
          <div className="space-y-1">
            {algoLinks.map(renderLink)}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Analysis</p>
          <div className="space-y-1">
            {analysisLinks.map(renderLink)}
          </div>
        </div>
      </nav>
    </aside>
  )
}
