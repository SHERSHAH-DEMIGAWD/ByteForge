'use client'

/**
 * app/learn/continue/page.tsx — the "pick up where you left off" surface.
 * Foregrounds the single best next step from /learn/resume, shows an explicit
 * saved checkpoint if one exists, and offers the next few in-progress / available
 * topics as alternatives. The primary CTA deep-links straight into the lab.
 */

import Link from 'next/link'
import { useMemo } from 'react'
import { useLearningStore } from '@/lib/learning-store'
import { StatusBadge, MasteryBar, formatMinutes } from '@/components/learn/primitives'
import { PlayCircle, Bookmark, ArrowRight, History, Compass } from 'lucide-react'

export default function ContinueLearningPage() {
  const { resume, roadmap, error } = useLearningStore()

  const upNext = useMemo(() => {
    const items = roadmap?.items ?? []
    return items
      .filter((i) => i.status === 'in_progress' || i.status === 'available')
      .filter((i) => i.topic !== resume?.next_topic)
      .slice(0, 4)
  }, [roadmap, resume])

  if (error && !resume) {
    return <p className="text-center text-sm text-muted-foreground mt-16">Couldn&apos;t load your progress: {error}</p>
  }

  if (!resume) {
    return <div className="max-w-3xl mx-auto h-64 rounded-2xl border border-border bg-card animate-pulse" />
  }

  const hasNext = Boolean(resume.next_topic)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Primary resume card */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-8">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
          <PlayCircle className="w-3.5 h-3.5" /> Pick up where you left off
        </span>

        {hasNext ? (
          <>
            <h2 className="text-3xl font-bold mt-3 text-foreground">
              {resume.next_title ?? resume.next_topic}
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl">{resume.next_reason}</p>

            <Link
              href={resume.route ?? '/learn/roadmap'}
              className="inline-flex items-center gap-2 px-6 py-3 mt-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <PlayCircle className="w-5 h-5" /> Resume Now <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold mt-3 text-foreground">You&apos;re all caught up 🎉</h2>
            <p className="text-sm text-muted-foreground mt-3">
              Explore the roadmap to choose your next challenge.
            </p>
            <Link
              href="/learn/roadmap"
              className="inline-flex items-center gap-2 px-6 py-3 mt-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all"
            >
              <Compass className="w-5 h-5" /> Browse Roadmap
            </Link>
          </>
        )}
      </div>

      {/* Last activity + saved checkpoint */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
            <History className="w-4 h-4" /> Recent Activity
          </h3>
          {resume.last_topic ? (
            <div>
              <p className="font-semibold capitalize text-foreground">{resume.last_topic}</p>
              <p className="text-xs text-muted-foreground mt-1">{resume.last_action ?? 'Viewed'}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No activity recorded yet — your first lab visit will show here.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
            <Bookmark className="w-4 h-4" /> Saved Checkpoint
          </h3>
          {resume.checkpoint ? (
            <div>
              <p className="font-semibold capitalize text-foreground">{resume.checkpoint.topic}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Position: {String(resume.checkpoint.position ?? '—')}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No checkpoint saved. Labs can bookmark your exact step so you never lose your place.
            </p>
          )}
        </div>
      </div>

      {/* Up next alternatives */}
      {upNext.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Or continue with</h3>
          <div className="space-y-3">
            {upNext.map((item) => (
              <Link
                key={item.topic}
                href={item.route ?? '/learn/roadmap'}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-muted/20 transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  {item.mastery > 0 && (
                    <div className="mt-2 max-w-xs">
                      <MasteryBar value={item.mastery} />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {item.estimated_minutes ? formatMinutes(item.estimated_minutes) : ''} · {item.difficulty}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
