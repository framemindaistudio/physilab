/** Format a number to fixed decimals, trimming "-0". */
export function fixed(v: number, decimals = 2): string {
  if (!Number.isFinite(v)) return '—'
  const s = v.toFixed(decimals)
  return s === '-' + (0).toFixed(decimals) ? (0).toFixed(decimals) : s
}

/** Format with a given number of significant figures, switching to ×10ⁿ for extremes. */
export function sig(v: number, figures = 3): string {
  if (!Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const abs = Math.abs(v)
  if (abs >= 1e5 || abs < 1e-3) return sci(v, figures)
  return Number(v.toPrecision(figures)).toString()
}

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }

export function sci(v: number, figures = 3): string {
  if (!Number.isFinite(v)) return '—'
  const [m, e] = v.toExponential(figures - 1).split('e')
  const exp = String(Number(e)).split('').map((c) => SUP[c] ?? c).join('')
  return `${m}×10${exp}`
}

/** LaTeX scientific notation, e.g. 6.63 \times 10^{-34}. */
export function texSci(v: number, figures = 3): string {
  if (!Number.isFinite(v)) return '\text{—}'
  const abs = Math.abs(v)
  if (abs !== 0 && (abs >= 1e5 || abs < 1e-3)) {
    const [m, e] = v.toExponential(figures - 1).split('e')
    return `${m}\times10^{${Number(e)}}`
  }
  return Number(v.toPrecision(figures)).toString()
}

export function decimalsOf(step: number): number {
  const s = String(step)
  const i = s.indexOf('.')
  return i === -1 ? 0 : s.length - i - 1
}

export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min} min`
  const h = ms / 3600000
  return `${h.toFixed(1)} h`
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}
