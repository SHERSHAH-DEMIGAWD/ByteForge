'use client'

import { useEffect, useState } from 'react'

/**
 * Shared trace-playback state: step index, play/pause with auto-advance,
 * and prev/next controls. Used by the algorithm visualizer pages.
 */
export function useStepPlayer(totalSteps: number, intervalMs = 600) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!isPlaying || totalSteps === 0) return
    const timer = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, intervalMs)
    return () => clearInterval(timer)
  }, [isPlaying, totalSteps, intervalMs])

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      if (currentStepIdx >= totalSteps - 1) setCurrentStepIdx(0)
      setIsPlaying(true)
    }
  }

  const next = () => setCurrentStepIdx((i) => Math.min(totalSteps - 1, i + 1))
  const prev = () => setCurrentStepIdx((i) => Math.max(0, i - 1))
  const reset = () => {
    setIsPlaying(false)
    setCurrentStepIdx(0)
  }

  return { currentStepIdx, setCurrentStepIdx, isPlaying, togglePlay, next, prev, reset }
}
