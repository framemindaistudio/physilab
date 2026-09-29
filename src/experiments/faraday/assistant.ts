import type { Advice, AssistantConfig } from '@/assistant/types'

export const assistant: AssistantConfig = {
  sweep: { param: 'velocity', row: 'v', label: 'v', unit: 'm/s' },
  rowKeys: { turns: 'N' },
  throughOrigin: true,
  interceptCause: 'Check for a constant offset in the voltmeter reading.',
  errorCauses: ['Readings at low speed give small EMFs, where meter noise matters most — use larger N·v.'],
  rules: (ctx) => {
    const out: Advice[] = []
    const turns = new Set(ctx.used.map((r) => Number(r.values.N)))
    if (turns.size === 1 && ctx.used.length >= 3) {
      const N = [...turns][0]
      const next = N === 400 ? 200 : 400
      out.push({
        id: 'faraday-turns',
        level: 'tip',
        title: 'Change the number of turns too',
        detail: `All readings use N = ${N}. Readings at another N show that ε is proportional to N as well as to v.`,
        action: ctx.where === 'bench' ? { kind: 'setParams', label: `Set N = ${next}`, params: { turns: next } } : undefined,
      })
    }
    if (ctx.where === 'bench' && Number(ctx.params.velocity) >= 2.5) {
      out.push({
        id: 'faraday-slowmo',
        level: 'info',
        title: 'The magnet passes very quickly at this speed',
        detail: 'Set the playback to 0.1× to watch the two EMF pulses form.',
      })
    }
    return out
  },
}
