'use client'

import { useEffect, useRef } from 'react'

/**
 * Reads URL query params once on mount and hands them to the page so a
 * shared link can restore its input state. Uses window.location instead of
 * useSearchParams() so no Suspense boundary is needed.
 */
export function useSharedParams(apply: (params: URLSearchParams) => void) {
  const applied = useRef(false)
  useEffect(() => {
    if (applied.current) return
    applied.current = true
    const params = new URLSearchParams(window.location.search)
    if ([...params.keys()].length > 0) {
      apply(params)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** Builds a shareable URL for the current page from a state object. */
export function buildShareUrl(state: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(state)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ''}`
}
