'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { buildShareUrl } from '@/lib/share'

/**
 * Copies a shareable link encoding the page's current input state.
 * Pass the state you want restored when someone opens the link.
 */
export function ShareButton({ state }: { state: Record<string, string | number | undefined> }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const url = buildShareUrl(state)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Clipboard API can fail on http:// origins — fall back to a prompt
      window.prompt('Copy this share link:', url)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border border-border/40 bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
      title="Copy a link that restores these inputs"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Link2 className="w-3.5 h-3.5" />}
      {copied ? 'Link copied!' : 'Share'}
    </button>
  )
}
