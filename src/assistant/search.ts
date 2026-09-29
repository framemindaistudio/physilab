/**
 * A small, transparent search engine for the Ask PHYSILAB helper:
 * tokenise → light stemming → synonym expansion → BM25 ranking.
 * No external service; every answer is a passage from PHYSILAB's own notes.
 */

const GREEK: [RegExp, string][] = [
  [/λ/g, ' lambda '],
  [/θ/g, ' theta '],
  [/φ|ϕ/g, ' phi '],
  [/Φ/g, ' flux '],
  [/ε/g, ' emf '],
  [/β/g, ' beta '],
  [/ν/g, ' nu '],
  [/Ω/g, ' ohm '],
  [/μ|µ/g, ' mu '],
  [/π/g, ' pi '],
  [/²/g, '2'],
  [/₀/g, '0'],
]

const STOP = new Set(
  'a an the is are was were be been being of to in on for and or with what whats why how does do did doing which that this these those it its as at by from into can could i you we me my your our there their them they about when where who whom whose will would should shall than then so if not no yes please tell explain define meaning mean means give show get use using used also just very much many more most some any all one two'.split(
    ' ',
  ),
)

/** Light suffix stripping so "doubling", "doubled", "double" and "doubles" all meet at "doubl". */
export function stem(word: string): string {
  let w = word
  if (w.length <= 3) return w
  if (w.endsWith('ies') && w.length > 4) w = w.slice(0, -3) + 'y'
  else if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3)
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2)
  else if (/(ss|x|ch|sh)es$/.test(w)) w = w.slice(0, -2)
  else if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) w = w.slice(0, -1)
  if (w.length > 4 && w.endsWith('e')) w = w.slice(0, -1)
  return w
}

export function tokenize(text: string): string[] {
  let s = text
  for (const [re, rep] of GREEK) s = s.replace(re, rep)
  s = s.toLowerCase().replace(/[^a-z0-9]+/g, ' ')
  return s
    .split(' ')
    .filter((w) => w && !STOP.has(w))
    .map(stem)
}

/** Query expansion: each key also searches its related terms (at reduced weight). */
const SYNONYMS: Record<string, string[]> = {
  g: ['gravity', 'acceleration'],
  gravity: ['g', 'acceleration'],
  period: ['oscillation', 'time'],
  oscillation: ['period', 'swing'],
  swing: ['oscillation', 'amplitude'],
  emf: ['induc', 'voltage', 'electromotive'],
  induc: ['emf', 'faraday'],
  voltage: ['potential', 'emf'],
  wavelength: ['lambda'],
  lambda: ['wavelength'],
  frequency: ['nu'],
  nu: ['frequency'],
  phi: ['work', 'function'],
  fringe: ['beta', 'interference'],
  beta: ['fringe', 'width'],
  resistance: ['ohm', 'resistor'],
  ohm: ['resistance', 'resistor'],
  current: ['ammeter', 'ampere'],
  planck: ['h', 'constant'],
  stopp: ['retard', 'potential'],
  stop: ['retard', 'potential'],
  retard: ['stopp', 'potential'],
  range: ['distance', 'horizontal'],
  lenz: ['oppose', 'direction'],
  bob: ['mass'],
  mass: ['bob'],
  viva: ['question'],
  pdf: ['report', 'print'],
  report: ['pdf', 'print'],
  csv: ['export', 'download'],
  export: ['csv', 'download'],
  excel: ['csv', 'export'],
  flux: ['magnetic', 'weber'],
  photon: ['light', 'quantum'],
  diode: ['junction', 'knee'],
  lamp: ['filament', 'bulb'],
  bulb: ['lamp', 'filament'],
  slit: ['interference', 'young'],
  young: ['slit', 'interference'],
  dark: ['theme', 'mode'],
  theme: ['dark', 'light'],
  max: ['maximum'],
  maximum: ['max'],
  min: ['minimum'],
  minimum: ['min'],
  speed: ['fast', 'velocity'],
  fast: ['speed', 'velocity'],
  velocity: ['speed', 'fast'],
  double: ['twice'],
  twice: ['double'],
  fake: ['real', 'genuine'],
  real: ['fake', 'genuine'],
  wrong: ['error', 'mistake'],
  error: ['uncertainty', 'mistake'],
  uncertainty: ['error'],
  angle: ['theta'],
  theta: ['angle'],
}

// Keys are stored stemmed so they match stemmed query tokens.
const SYN = new Map(Object.entries(SYNONYMS).map(([k, v]) => [stem(k), v.map(stem)]))

export interface SearchDoc {
  id: string
  title: string
  text: string
  keywords?: string[]
}

interface Indexed<T extends SearchDoc> {
  doc: T
  tf: Map<string, number>
  len: number
}

export class Bm25Index<T extends SearchDoc> {
  private docs: Indexed<T>[]
  private df = new Map<string, number>()
  private avgLen: number
  private readonly k1 = 1.4
  private readonly b = 0.75

  constructor(docs: T[]) {
    this.docs = docs.map((doc) => {
      // Title and keywords count double: they say what the passage is about.
      const tokens = [...tokenize(doc.title), ...tokenize(doc.title), ...tokenize((doc.keywords ?? []).join(' ')).flatMap((t) => [t, t]), ...tokenize(doc.text)]
      const tf = new Map<string, number>()
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1)
      return { doc, tf, len: tokens.length }
    })
    this.avgLen = this.docs.reduce((s, d) => s + d.len, 0) / Math.max(1, this.docs.length)
  }

  private idf(t: string) {
    const n = this.docs.length
    const df = this.df.get(t) ?? 0
    return Math.log(1 + (n - df + 0.5) / (df + 0.5))
  }

  search(query: string, opts: { boost?: (doc: T) => number; filter?: (doc: T) => boolean } = {}): { doc: T; score: number }[] {
    const base = tokenize(query)
    const weights = new Map<string, number>()
    for (const t of base) weights.set(t, 1)
    for (const t of base) for (const s of SYN.get(t) ?? []) if (!weights.has(s)) weights.set(s, 0.4)
    if (!weights.size) return []

    const out: { doc: T; score: number }[] = []
    for (const d of this.docs) {
      if (opts.filter && !opts.filter(d.doc)) continue
      let score = 0
      let matchedCore = 0
      for (const [t, w] of weights) {
        const f = d.tf.get(t)
        if (!f) continue
        if (w === 1) matchedCore++
        score += w * this.idf(t) * ((f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * d.len) / this.avgLen)))
      }
      if (score <= 0) continue
      // Reward passages that match more of the question's own words.
      score *= 1 + 0.25 * matchedCore
      score *= opts.boost?.(d.doc) ?? 1
      out.push({ doc: d.doc, score })
    }
    return out.sort((a, b) => b.score - a.score)
  }
}
