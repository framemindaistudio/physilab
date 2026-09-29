import type { Advice, AssistantConfig } from '@/assistant/types'
import type { Params } from '@/types/experiment'
import { METALS, thresholdWavelength } from '@/physics/modern/photoelectric'

const metalOf = (p: Params) => METALS[String(p.metal)] ?? METALS.sodium

export const assistant: AssistantConfig = {
  sweep: {
    param: 'wavelength',
    row: 'lambda',
    label: 'λ',
    unit: 'nm',
    // Only wavelengths shorter than the threshold give a stopping potential.
    range: (p) => [200, Math.max(205, Math.floor(thresholdWavelength(metalOf(p).phi)) - 5)],
  },
  errorCauses: ['Wavelengths close to the threshold give tiny currents, so V₀ is hard to judge — spread λ well below the threshold.'],
  rules: (ctx) => {
    const out: Advice[] = []
    const metal = metalOf(ctx.params)
    const threshold = thresholdWavelength(metal.phi)
    const lambda0 = Math.floor(threshold)
    // Same test as the model: no emission once the photon energy is at or below the work function.
    if (ctx.where === 'bench' && Number(ctx.params.wavelength) >= threshold) {
      const suggest = Math.max(200, lambda0 - 60)
      out.push({
        id: 'pe-threshold',
        level: 'warn',
        title: `No electrons at ${ctx.params.wavelength} nm`,
        detail: `Each photon has less energy than the work function of ${metal.label} (${metal.phi} eV). Use a wavelength shorter than ${lambda0} nm.`,
        action: { kind: 'setParams', label: `Set λ = ${suggest} nm`, params: { wavelength: suggest } },
      })
    }
    if (ctx.where === 'bench' && Number(ctx.params.intensity) === 0) {
      out.push({ id: 'pe-dark', level: 'warn', title: 'The lamp is off', action: { kind: 'setParams', label: 'Set intensity = 60%', params: { intensity: 60 } } })
    }
    // Intensity check: the same λ at two intensities should give the same V₀.
    const byLambda = new Map<number, { I: number; V0: number }[]>()
    for (const r of ctx.used) {
      const l = Number(r.values.lambda)
      byLambda.set(l, [...(byLambda.get(l) ?? []), { I: Number(r.values.intensity), V0: Number(r.values.V0) }])
    }
    for (const [l, list] of byLambda) {
      if (new Set(list.map((x) => x.I)).size < 2) continue
      const V = list.map((x) => x.V0)
      const same = Math.max(...V) - Math.min(...V) <= 0.03
      out.push({
        id: 'pe-intensity',
        level: same ? 'good' : 'info',
        title: same ? `Intensity check passed at ${l} nm` : `V₀ at ${l} nm varies with intensity`,
        detail: same
          ? 'Changing the intensity did not change V₀ — photon energy, not brightness, sets the electrons’ maximum energy.'
          : 'V₀ should not depend on intensity; repeat those readings carefully.',
      })
      break
    }
    return out
  },
}
