import { GRAVITY, HC_EV_NM } from '@/physics/constants'
import { smallAnglePeriod } from '@/physics/mechanics/pendulum'
import { idealFlightTime, idealMaxHeight, idealRange } from '@/physics/mechanics/projectile'
import { fringeWidth } from '@/physics/optics/doubleSlit'
import { METALS } from '@/physics/modern/photoelectric'
import { fixed, sig, texSci } from '@/utils/format'

/**
 * Rule-based calculators for Ask PHYSILAB. A question is parsed for quantities with units
 * ("2 m", "400 nm", "30°") and keywords; if a calculator's pattern matches, it works the answer
 * out with the same physics functions the experiments use and shows every step.
 */
export interface CalcResult {
  title: string
  steps: string[]
  note?: string
  to?: string
}

type Kind = 'length' | 'speed' | 'time' | 'voltage' | 'current' | 'resistance' | 'angle' | 'energy' | 'frequency'
interface Qty {
  kind: Kind
  si: number
  unit: string
  raw: number
}

const UNITS: Record<string, { kind: Kind; f: number }> = {
  nm: { kind: 'length', f: 1e-9 },
  mm: { kind: 'length', f: 1e-3 },
  cm: { kind: 'length', f: 1e-2 },
  km: { kind: 'length', f: 1e3 },
  m: { kind: 'length', f: 1 },
  'm/s': { kind: 'speed', f: 1 },
  ms: { kind: 'time', f: 1e-3 },
  s: { kind: 'time', f: 1 },
  sec: { kind: 'time', f: 1 },
  kv: { kind: 'voltage', f: 1e3 },
  mv: { kind: 'voltage', f: 1e-3 },
  v: { kind: 'voltage', f: 1 },
  volt: { kind: 'voltage', f: 1 },
  volts: { kind: 'voltage', f: 1 },
  ma: { kind: 'current', f: 1e-3 },
  ua: { kind: 'current', f: 1e-6 },
  µa: { kind: 'current', f: 1e-6 },
  a: { kind: 'current', f: 1 },
  amp: { kind: 'current', f: 1 },
  amps: { kind: 'current', f: 1 },
  kohm: { kind: 'resistance', f: 1e3 },
  'kω': { kind: 'resistance', f: 1e3 },
  ohm: { kind: 'resistance', f: 1 },
  ohms: { kind: 'resistance', f: 1 },
  'ω': { kind: 'resistance', f: 1 },
  '°': { kind: 'angle', f: 1 },
  deg: { kind: 'angle', f: 1 },
  degree: { kind: 'angle', f: 1 },
  degrees: { kind: 'angle', f: 1 },
  ev: { kind: 'energy', f: 1 },
  hz: { kind: 'frequency', f: 1 },
}

// Longest units first so "m/s" wins over "m", "mm" over "m", "ma" over "m".
const UNIT_RE = new RegExp(
  `(\\d+(?:\\.\\d+)?)\\s*(${Object.keys(UNITS)
    .sort((a, b) => b.length - a.length)
    .map((u) => u.replace(/[/.]/g, '\\$&'))
    .join('|')})(?![a-z])`,
  'gi',
)

export function parseQuantities(text: string): Qty[] {
  const out: Qty[] = []
  for (const m of text.toLowerCase().matchAll(UNIT_RE)) {
    const u = UNITS[m[2]]
    if (!u) continue
    const raw = Number(m[1])
    out.push({ kind: u.kind, si: raw * u.f, unit: m[2], raw })
  }
  return out
}

const has = (text: string, ...words: string[]) => words.some((w) => text.includes(w))
const first = (qs: Qty[], kind: Kind, pred: (q: Qty) => boolean = () => true) => qs.find((q) => q.kind === kind && pred(q))

function gravityFor(text: string) {
  for (const [key, g] of Object.entries(GRAVITY)) if (key !== 'earth' && text.includes(key)) return g
  return GRAVITY.earth
}

export function calculate(question: string): CalcResult | null {
  const t = question.toLowerCase()
  const q = parseQuantities(question)
  if (!q.length) return null

  // ---- Pendulum ----
  if (has(t, 'pendulum', 'period', 'oscillation', 'swing')) {
    const planet = gravityFor(t)
    const L = first(q, 'length', (x) => x.unit !== 'nm' && x.unit !== 'mm') ?? first(q, 'length')
    const time = first(q, 'time')
    if (L && time && (/\bg\b/.test(t) || has(t, 'gravity', 'acceleration'))) {
      const nMatch = t.match(/(\d+)\s*(?:oscillations|swings|vibrations)/)
      const n = nMatch ? Number(nMatch[1]) : 1
      const T = time.si / n
      const g = (4 * Math.PI ** 2 * L.si) / (T * T)
      return {
        title: 'Acceleration due to gravity from a pendulum',
        steps: [
          ...(n > 1 ? [`T = \\frac{t}{n} = \\frac{${sig(time.si, 4)}\\,\\mathrm s}{${n}} = ${sig(T, 4)}\\,\\mathrm s`] : []),
          `g = \\frac{4\\pi^2 L}{T^2} = \\frac{4\\pi^2 \\times ${sig(L.si, 4)}}{${sig(T, 4)}^2} = ${fixed(g, 3)}\\,\\mathrm{m\\,s^{-2}}`,
        ],
        note: 'Small-angle formula; keep the amplitude below about 10°.',
        to: '/experiments/pendulum',
      }
    }
    if (L) {
      const T = smallAnglePeriod(L.si, planet.g)
      return {
        title: `Period of a ${sig(L.si, 3)} m pendulum${planet.label !== 'Earth' ? ` on the ${planet.label}` : ''}`,
        steps: [`T = 2\\pi\\sqrt{\\frac{L}{g}} = 2\\pi\\sqrt{\\frac{${sig(L.si, 4)}}{${planet.g}}} = ${fixed(T, 3)}\\,\\mathrm s`],
        note: 'Small-angle approximation (amplitude ≲ 10°). The mass of the bob does not matter.',
        to: '/experiments/pendulum/lab',
      }
    }
    if (time && has(t, 'length', 'long')) {
      const L2 = (planet.g * time.si ** 2) / (4 * Math.PI ** 2)
      return {
        title: `Length for a ${sig(time.si, 3)} s period`,
        steps: [`L = \\frac{g T^2}{4\\pi^2} = \\frac{${planet.g} \\times ${sig(time.si, 4)}^2}{4\\pi^2} = ${fixed(L2, 3)}\\,\\mathrm m`],
        to: '/experiments/pendulum/lab',
      }
    }
  }

  // ---- Projectile ----
  const v0 = first(q, 'speed')
  const angle = first(q, 'angle')
  if (v0 && angle) {
    const planet = gravityFor(t)
    const R = idealRange(v0.si, angle.si, 0, planet.g)
    const H = idealMaxHeight(v0.si, angle.si, 0, planet.g)
    const T = idealFlightTime(v0.si, angle.si, 0, planet.g)
    return {
      title: `Projectile at ${sig(v0.si, 3)} m/s, ${sig(angle.si, 3)}°`,
      steps: [
        `R = \\frac{v_0^2 \\sin 2\\theta}{g} = \\frac{${sig(v0.si, 4)}^2 \\sin ${sig(2 * angle.si, 4)}^\\circ}{${planet.g}} = ${fixed(R, 2)}\\,\\mathrm m`,
        `H = \\frac{v_0^2 \\sin^2\\theta}{2g} = ${fixed(H, 2)}\\,\\mathrm m`,
        `T = \\frac{2 v_0 \\sin\\theta}{g} = ${fixed(T, 2)}\\,\\mathrm s`,
      ],
      note: 'Level ground, no air resistance.',
      to: '/experiments/projectile/lab',
    }
  }

  // ---- Double slit ----
  if (has(t, 'fringe', 'slit', 'young', 'interference', 'β', 'beta')) {
    const lam = first(q, 'length', (x) => x.unit === 'nm')
    const d = first(q, 'length', (x) => x.unit === 'mm')
    const D = first(q, 'length', (x) => x.unit === 'm' || x.unit === 'cm')
    if (lam && d && D) {
      const beta = fringeWidth(lam.si, d.si, D.si)
      return {
        title: 'Fringe width',
        steps: [`\\beta = \\frac{\\lambda D}{d} = \\frac{(${sig(lam.raw, 4)}\\times10^{-9})(${sig(D.si, 4)})}{${sig(d.raw, 4)}\\times10^{-3}} = ${fixed(beta * 1000, 3)}\\,\\mathrm{mm}`],
        to: '/experiments/double-slit/lab',
      }
    }
    if (lam || d || D) {
      return {
        title: 'Fringe width needs three values',
        steps: ['\\beta = \\frac{\\lambda D}{d}'],
        note: 'Give the wavelength in nm, the screen distance D in m and the slit separation d in mm — e.g. “fringe width for 600 nm, D = 1 m, d = 0.5 mm”.',
      }
    }
  }

  // ---- Photon energy / photoelectric ----
  const lamNm = first(q, 'length', (x) => x.unit === 'nm')
  const metalKey = Object.keys(METALS).find((k) => t.includes(k) || t.includes(METALS[k].label.split(' ')[0].toLowerCase()))
  if (lamNm || (metalKey && first(q, 'frequency'))) {
    const nu = first(q, 'frequency')
    const E = lamNm ? HC_EV_NM / lamNm.raw : (6.62607015e-34 * (nu as Qty).si) / 1.602176634e-19
    const steps = lamNm
      ? [`E = \\frac{hc}{\\lambda} = \\frac{1239.84\\ \\mathrm{eV\\,nm}}{${sig(lamNm.raw, 4)}\\ \\mathrm{nm}} = ${fixed(E, 3)}\\ \\mathrm{eV}`]
      : [`E = h\\nu = (6.626\\times10^{-34})(${texSci((nu as Qty).si, 4)}) = ${fixed(E, 3)}\\ \\mathrm{eV}`]
    let note: string | undefined
    if (metalKey) {
      const metal = METALS[metalKey]
      const K = E - metal.phi
      if (K > 0) {
        steps.push(`K_{\\max} = h\\nu - \\phi = ${fixed(E, 3)} - ${metal.phi} = ${fixed(K, 3)}\\ \\mathrm{eV}`)
        steps.push(`V_0 = \\frac{K_{\\max}}{e} = ${fixed(K, 3)}\\ \\mathrm V`)
      } else {
        note = `${E.toFixed(2)} eV is less than the work function of ${metal.label} (${metal.phi} eV), so no electrons are emitted — at any intensity.`
      }
    } else {
      note = 'Add a metal (e.g. “on sodium”) to get the maximum kinetic energy and stopping potential.'
    }
    return { title: lamNm ? `Energy of a ${sig(lamNm.raw, 4)} nm photon` : 'Photon energy', steps, note, to: '/experiments/photoelectric/lab' }
  }

  // ---- Ohm's law: any two of V, I, R ----
  const V = first(q, 'voltage')
  const I = first(q, 'current')
  const Rq = first(q, 'resistance')
  const known = [V, I, Rq].filter(Boolean).length
  if (known >= 2) {
    if (V && I && !Rq)
      return { title: 'Resistance from V and I', steps: [`R = \\frac{V}{I} = \\frac{${sig(V.si, 4)}\\ \\mathrm V}{${sig(I.si, 4)}\\ \\mathrm A} = ${sig(V.si / I.si, 4)}\\ \\Omega`], to: '/experiments/ohms-law/lab' }
    if (V && Rq && !I)
      return { title: 'Current from V and R', steps: [`I = \\frac{V}{R} = \\frac{${sig(V.si, 4)}}{${sig(Rq.si, 4)}} = ${sig((V.si / Rq.si) * 1000, 4)}\\ \\mathrm{mA}`], to: '/experiments/ohms-law/lab' }
    if (I && Rq && !V)
      return { title: 'Voltage from I and R', steps: [`V = IR = (${sig(I.si, 4)})(${sig(Rq.si, 4)}) = ${sig(I.si * Rq.si, 4)}\\ \\mathrm V`], to: '/experiments/ohms-law/lab' }
  }

  return null
}
