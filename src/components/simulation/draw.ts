import type { ThemeColors } from '@/hooks/useThemeColors'

/** Small, shared canvas drawing helpers so every apparatus looks like part of one lab. */

export function clear(ctx: CanvasRenderingContext2D, w: number, h: number, c: ThemeColors) {
  ctx.fillStyle = c.canvas
  ctx.fillRect(0, 0, w, h)
}

/** Graph-paper background: minor lines every `minor` px, major every 5 minor. */
export function graphPaper(ctx: CanvasRenderingContext2D, w: number, h: number, c: ThemeColors, minor = 10) {
  ctx.save()
  ctx.lineWidth = 1
  for (let i = 0, x = 0.5; x < w; x += minor, i++) {
    ctx.strokeStyle = i % 5 === 0 ? c.gridMajor : c.grid
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let i = 0, y = 0.5; y < h; y += minor, i++) {
    ctx.strokeStyle = i % 5 === 0 ? c.gridMajor : c.grid
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  ctx.restore()
}

export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2,
  head = 8,
) {
  const ang = Math.atan2(y2 - y1, x2 - x1)
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 1) return
  const hs = Math.min(head, len * 0.6)
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2 - hs * 0.7 * Math.cos(ang), y2 - hs * 0.7 * Math.sin(ang))
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - hs * Math.cos(ang - 0.42), y2 - hs * Math.sin(ang - 0.42))
  ctx.lineTo(x2 - hs * Math.cos(ang + 0.42), y2 - hs * Math.sin(ang + 0.42))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  opts: { size?: number; align?: CanvasTextAlign; baseline?: CanvasTextBaseline; mono?: boolean; weight?: number } = {},
) {
  ctx.save()
  ctx.fillStyle = color
  ctx.font = `${opts.weight ?? 500} ${opts.size ?? 12}px ${opts.mono === false ? "'IBM Plex Sans', sans-serif" : "'IBM Plex Mono', monospace"}`
  ctx.textAlign = opts.align ?? 'left'
  ctx.textBaseline = opts.baseline ?? 'alphabetic'
  ctx.fillText(text, x, y)
  ctx.restore()
}

/** A mini oscilloscope/strip-chart panel for live traces. */
export function tracePanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  c: ThemeColors,
  series: { values: number[]; color: string; max: number; upTo?: number }[],
  title: string,
  cursor?: number,
) {
  ctx.save()
  ctx.fillStyle = c.panel
  ctx.strokeStyle = c.line
  ctx.lineWidth = 1
  roundRect(ctx, x, y, w, h, 8)
  ctx.fill()
  ctx.stroke()
  // Graticule
  ctx.strokeStyle = c.grid
  for (let i = 1; i < 8; i++) {
    const gx = x + (w * i) / 8
    ctx.beginPath()
    ctx.moveTo(gx, y + 4)
    ctx.lineTo(gx, y + h - 4)
    ctx.stroke()
  }
  for (let i = 1; i < 4; i++) {
    const gy = y + (h * i) / 4
    ctx.beginPath()
    ctx.moveTo(x + 4, gy)
    ctx.lineTo(x + w - 4, gy)
    ctx.stroke()
  }
  ctx.strokeStyle = c.gridMajor
  ctx.beginPath()
  ctx.moveTo(x + 4, y + h / 2)
  ctx.lineTo(x + w - 4, y + h / 2)
  ctx.stroke()
  for (const s of series) {
    if (s.values.length < 2 || s.max === 0) continue
    ctx.strokeStyle = s.color
    ctx.lineWidth = 1.8
    ctx.beginPath()
    const last = Math.min(s.values.length - 1, s.upTo ?? s.values.length - 1)
    for (let i = 0; i <= last; i++) {
      const px = x + 6 + ((w - 12) * i) / (s.values.length - 1)
      const py = y + h / 2 - (s.values[i] / s.max) * (h / 2 - 8)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }
  if (cursor !== undefined) {
    const cx = x + 6 + (w - 12) * cursor
    ctx.strokeStyle = c.ink3
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(cx, y + 4)
    ctx.lineTo(cx, y + h - 4)
    ctx.stroke()
    ctx.setLineDash([])
  }
  label(ctx, title, x + 8, y + 15, c.ink3, { size: 10 })
  ctx.restore()
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const n = parseInt(h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}
