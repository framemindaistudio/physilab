import { useEffect } from 'react'
import { lab } from '@/store/labStore'

/** Accumulates time spent on an experiment page while the tab is visible. */
export function useLabTimer(experimentId: string) {
  useEffect(() => {
    let last = Date.now()
    const flush = () => {
      const now = Date.now()
      if (document.visibilityState === 'visible') lab.addTime(experimentId, now - last)
      last = now
    }
    const id = window.setInterval(flush, 15000)
    const onVis = () => {
      if (document.visibilityState === 'visible') last = Date.now()
      else flush()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      flush()
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [experimentId])
}
