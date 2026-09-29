import type { Advice, AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'frequency', row: 'f', label: 'f', unit: 'Hz' },
  errorCauses: ['Take closely spaced readings near the peak.', 'Make sure you have readings below I_max/√2 on both sides.'],
  rules: (ctx) => {
    const out: Advice[] = []
    const pts = ctx.used.map((r) => ({ f: Number(r.values.f), I: Number(r.values.I) })).sort((a, b) => a.f - b.f)
    if (pts.length >= 4) {
      let k = 0
      pts.forEach((pt, i) => {
        if (pt.I > pts[k].I) k = i
      })
      if (k === 0 || k === pts.length - 1) {
        out.push({
          id: 'lcr-edge',
          level: 'tip',
          title: `The highest current is at the ${k === 0 ? 'lowest' : 'highest'} frequency you measured`,
          detail: `The peak may lie ${k === 0 ? 'below' : 'above'} your readings — extend the sweep in that direction.`,
        })
      } else {
        const near = pts.filter((pt) => pt.I > pts[k].I / Math.SQRT2).length
        if (near < 3) {
          out.push({
            id: 'lcr-peak',
            level: 'tip',
            title: `Add readings near ${pts[k].f} Hz`,
            detail: 'Only a few readings lie above the half-power level; closely spaced points around the peak give an accurate f₀ and bandwidth.',
          })
        }
      }
    }
    return out
  },
}
