import { useEffect, useRef } from 'react'

export type FrameFn = (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => void

/**
 * Owns a canvas: keeps it sized to its container at device-pixel resolution and runs a
 * requestAnimationFrame loop. `dt` (seconds) is 0 while paused, so the frame is still
 * redrawn when parameters or the theme change.
 */
export function useCanvasLoop(frame: FrameFn, running: boolean, speed = 1) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(frame)
  frameRef.current = frame
  const runRef = useRef({ running, speed })
  runRef.current = { running, speed }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let last = performance.now()
    let w = 0
    let h = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const loop = (now: number) => {
      const real = Math.min(0.05, (now - last) / 1000)
      last = now
      const { running: r, speed: s } = runRef.current
      if (w > 0 && h > 0) frameRef.current(ctx, w, h, r ? real * s : 0)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return canvasRef
}
