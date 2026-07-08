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
  GraduationCap,
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
      <div className="sticky top-0 z-10 bg-background/70 backdrop-blur-xl border-b border-border/70">
        <div className="px-6 sm:px-8 pt-6 pb-0 max-w-6xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20 items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Layer 2 · Heutagogy
              </span>
              <h1 className="text-2xl font-bold bf-gradient-text leading-tight mt-0.5">
                Self-Determined Learning
              </h1>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Your map, your pace — mastery derived from real evidence, not checkboxes.
              </p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto custom-scrollbar -mx-1 px-1">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors duration-200 ${
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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

      <div className="px-6 sm:px-8 py-8">{children}</div>
    </div>
  )
}
