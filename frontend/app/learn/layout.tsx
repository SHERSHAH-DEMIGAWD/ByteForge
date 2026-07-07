'use client'

/**
 * app/learn/layout.tsx — shared shell for the Layer 2 "Self-Determined Learning"
 * hub. Provides the sub-navigation tab bar across the learning pages and hydrates
 * the learning session once when the section mounts, so every child page can read
 * from `useLearningStore` cache instead of each fetching on its own.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useLearningStore } from '@/lib/learning-store'
import {
  LayoutDashboard,
  Map as MapIcon,
  Network,
  PlayCircle,
  TrendingUp,
  Lightbulb,
} from 'lucide-react'

const tabs = [
  { href: '/learn', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/learn/roadmap', label: 'Roadmap', icon: MapIcon },
  { href: '/learn/skill-tree', label: 'Skill Tree', icon: Network },
  { href: '/learn/continue', label: 'Continue', icon: PlayCircle },
  { href: '/learn/progress', label: 'Progress', icon: TrendingUp },
  { href: '/learn/recommendations', label: 'Recommendations', icon: Lightbulb },
]

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hydrate = useLearningStore((s) => s.hydrate)

  // Load the learning read-models once when entering the section.
  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <div className="min-h-screen">
      {/* Section header + tabs */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-8 pt-6 pb-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Layer 2 · Heutagogy</span>
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Self-Determined Learning
          </h1>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Your map, your pace — mastery derived from real evidence, not checkboxes.
          </p>
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="p-8">{children}</div>
    </div>
  )
}
