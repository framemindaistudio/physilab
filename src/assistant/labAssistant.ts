import type { AnalysisOutput, ExperimentModule, LinearFit, ObservationRow, Params, RangeParameter } from '@/types/experiment'
import { decimalsOf, fixed } from '@/utils/format'
import { percentError } from '@/utils/stats'
import { selectRows } from '@/components/experiment/useAnalysis'
import type { Advice, AdviceLevel, AssistantContext } from './types'

/**
 * The PHYSILAB Lab Assistant: a transparent, rule-based coach.
 * Every message comes from an explicit rule below (or an experiment's own rules), computed from
 * the student's readings and settings — nothing is generated or guessed.
 */

const ORDER: Record<AdviceLevel, number> = { warn: 0, tip: 1, info: 2, good: 3 }

/** Pick the value in [lo, hi] (on the slider's step grid) farthest from every existing reading. */
export function suggestNext(values: number[], lo: number, hi: number, step: number, origin: number): number {
  const snap = (v: number) => Math.min(hi, Math.max(lo, origin + Math.round((v - origin) / step) * step))
  if (!values.length) return snap(lo + (hi - lo) * 0.25)
  const n = Math.max(1, Math.min(400, Math.round((hi - lo) / step)))
  let best = snap(lo)
  let bestD = -1
  for (let i = 0; i <= n; i++) {
    const c = snap(lo + ((hi - lo) * i) / n)
    const d = Math.min(...values.map((v) => Math.abs(c - v)))
    if (d > bestD + 1e-12) {
      best = c
      bestD = d
    }
  }
  return best
}

/**
 * Externally studentised residuals (each point judged against a fit that does not include it).
 * Unlike internally studentised residuals — which can never exceed √(n−2) — these grow without
 * bound for a genuine slip, so a single bad reading stands out even with only 5–6 readings.
 */
export function worstOutlier(points: { x: number; y: number }[], fit: LinearFit): { index: number; t: number } | null {
  const n = points.length
  if (n < 5) return null
  const mx = points.reduce((s, p) => s + p.x, 0) / n
  const sxx = points.reduce((s, p) => s + (p.x - mx) ** 2, 0)
  const res = points.map((p) => p.y - (fit.intercept + fit.slope * p.x))
  const s = Math.sqrt(res.reduce((a, r) => a + r * r, 0) / (n - 2))
  if (!(s > 0) || !(sxx > 0)) return null
  // Stricter threshold for small samples, where chance deviations are larger.
  const threshold = n <= 7 ? 4 : 3.5
  let worst: { index: number; t: number } | null = null
  points.forEach((p, i) => {
    const h = 1 / n + (p.x - mx) ** 2 / sxx
    const r = res[i] / (s * Math.sqrt(Math.max(1e-9, 1 - h)))
    const t = r * Math.sqrt((n - 3) / Math.max(1e-9, n - 2 - r * r))
    const yhat = fit.intercept + fit.slope * p.x
    const rel = Math.abs(res[i]) / Math.max(Math.abs(yhat), 1e-12)
    if (Math.abs(t) > threshold && rel > 0.03 && (!worst || Math.abs(t) > Math.abs(worst.t))) worst = { index: i, t }
  })
  return worst
}

/** Observation column that records a parameter (usually the same key). */
function rowKeyOf(m: ExperimentModule, paramKey: string): string {
  const cfg = m.assistant
  if (cfg?.sweep.param === paramKey) return cfg.sweep.row
  return cfg?.rowKeys?.[paramKey] ?? paramKey
}

/** True when the current bench settings match a reading already taken. */
function alreadyMeasured(m: ExperimentModule, params: Params, row: ObservationRow): boolean {
  let compared = 0
  for (const def of m.parameters) {
    const rowKey = rowKeyOf(m, def.key)
    if (!(rowKey in row.values)) continue
    if (def.visible && !def.visible(params)) continue
    compared++
    const a = row.values[rowKey]
    const b = params[def.key]
    if (def.kind === 'range') {
      if (Math.abs(Number(a) - Number(b)) > def.step / 2) return false
    } else if (String(a) !== String(b)) return false
  }
  return compared > 0
}

/** Does a reading share the bench's current fixed (controlled) settings? */
function matchesControls(m: ExperimentModule, params: Params, row: ObservationRow): boolean {
  return m.observation.controlKeys.every((k) => {
    const def = m.parameters.find((d) => d.key === k)
    if (def?.visible && !def.visible(params)) return true
    return String(row.values[k]) === String(params[k])
  })
}

export interface Series {
  used: ObservationRow[]
  excluded: ObservationRow[]
  analysis: AnalysisOutput | null
  /** Parameters describing the graphed series (bench: current settings; analysis: the graphed readings). */
  params: Params
  /** Bench only: the current fixed settings differ from the latest reading's. */
  newSeries: boolean
}

function analyse(m: ExperimentModule, rows: ObservationRow[]): AnalysisOutput | null {
  if (rows.length < 2) return null
  try {
    return m.analyze(rows.map((r) => r.values))
  } catch {
    return null
  }
}

/**
 * Which readings the advice is about.
 *  • On the bench: readings taken with the current fixed settings (so changing e.g. the device
 *    starts a fresh series straight away).
 *  • On the Analysis page: the graphed readings (those matching the latest reading).
 */
export function seriesFor(m: ExperimentModule, rows: ObservationRow[], params: Params, where: 'bench' | 'analysis'): Series {
  if (where === 'bench') {
    const used = rows.filter((r) => matchesControls(m, params, r))
    const excluded = rows.filter((r) => !used.includes(r))
    const last = rows[rows.length - 1]
    return { used, excluded, analysis: analyse(m, used), params, newSeries: !!last && !matchesControls(m, params, last) }
  }
  const { used, excluded } = selectRows(m, rows)
  const ref = used[used.length - 1]?.values ?? {}
  const graphed: Params = { ...params }
  for (const k of m.observation.controlKeys) if (k in ref) graphed[k] = ref[k]
  return { used, excluded, analysis: analyse(m, used), params: graphed, newSeries: false }
}

function fmt(v: number, step: number) {
  return fixed(v, decimalsOf(step))
}

export function adviseLab(ctx: AssistantContext): Advice[] {
  const { module: m, rows, used, excluded, analysis, params, where, noise } = ctx
  const cfg = m.assistant
  const min = m.observation.minTrials
  const out: Advice[] = []
  const linear = !!analysis?.fit && !analysis.connectPoints

  if (cfg?.rules) out.push(...cfg.rules(ctx))

  // ---- Getting started and coverage ----
  if (!rows.length) {
    out.push({
      id: 'start',
      level: 'tip',
      title: where === 'bench' ? `Press “${m.observation.measureLabel}” to take your first reading` : 'No readings yet',
      detail: where === 'bench' ? m.observation.hint : 'Take readings on the Lab bench first.',
      action: where === 'analysis' ? { kind: 'link', label: 'Go to the lab bench', to: `/experiments/${m.id}/lab` } : undefined,
    })
  } else if (ctx.newSeries) {
    out.push({
      id: 'new-series',
      level: 'info',
      title: 'New settings — this starts a new graph',
      detail: `Your fixed settings differ from your last reading, so readings from now on form a separate series${used.length ? ` (${used.length} so far)` : ''}. Earlier readings stay in your notebook.`,
    })
  }

  const sweepDef = cfg && (m.parameters.find((p) => p.key === cfg.sweep.param && p.kind === 'range') as RangeParameter | undefined)
  if (cfg && sweepDef && rows.length) {
    const { label, unit, row } = cfg.sweep
    const [lo, hi] = cfg.sweep.range ? cfg.sweep.range(params) : [sweepDef.min, sweepDef.max]
    const values = used.map((r) => Number(r.values[row])).filter(Number.isFinite)
    const vMin = Math.min(...values)
    const vMax = Math.max(...values)
    const narrow = values.length >= 2 && vMax - vMin < 0.5 * (hi - lo)

    if (used.length < min + 1 || narrow) {
      const next = suggestNext(values, lo, hi, sweepDef.step, sweepDef.min)
      // Pressing the button twice at the same settings adds no new point; say so here.
      const repeat = where === 'bench' && used.some((r) => alreadyMeasured(m, params, r))
      const why = linear ? 'makes the slope far more reliable' : 'traces the whole characteristic curve'
      out.push({
        id: 'next',
        level: 'tip',
        title: `Next reading: ${label} = ${fmt(next, sweepDef.step)} ${unit}`,
        detail: [
          repeat ? `You already have a reading at the current settings, so change ${label} first.` : '',
          narrow
            ? `Your readings only cover ${label} = ${fmt(vMin, sweepDef.step)}–${fmt(vMax, sweepDef.step)} ${unit}. Spreading them across ${fmt(lo, sweepDef.step)}–${fmt(hi, sweepDef.step)} ${unit} ${why}.`
            : values.length
              ? 'This fills the biggest gap between your readings.'
              : 'A good first reading for this series.',
        ]
          .filter(Boolean)
          .join(' '),
        action:
          where === 'bench'
            ? { kind: 'setParams', label: `Set ${label} = ${fmt(next, sweepDef.step)} ${unit}`, params: { [cfg.sweep.param]: next } }
            : { kind: 'link', label: 'Go to the lab bench', to: `/experiments/${m.id}/lab` },
      })
    }
  }

  if (rows.length && used.length < min) {
    out.push({
      id: 'count',
      level: 'info',
      title: `${min - used.length} more reading${min - used.length === 1 ? '' : 's'} needed`,
      detail: `A reliable graph needs at least ${min} readings with these settings; you have ${used.length}.`,
    })
  }

  if (excluded.length && !ctx.newSeries) {
    out.push({
      id: 'excluded',
      level: 'info',
      title: `${excluded.length} reading${excluded.length === 1 ? ' was' : 's were'} taken under different settings`,
      detail: 'Only readings with the same fixed settings are graphed together.',
    })
  }

  // ---- Checks on the graph ----
  const fit = analysis?.fit
  if (analysis && fit && linear && used.length === analysis.points.length) {
    const outlier = worstOutlier(analysis.points, fit)
    if (outlier) {
      const trial = rows.indexOf(used[outlier.index]) + 1
      out.push({
        id: 'outlier',
        level: 'warn',
        title: `Trial ${trial} lies far from the line`,
        detail: `Judged against the line through the other readings, it is ${Math.abs(outlier.t).toFixed(1)} standard errors away — likely a slip in that reading. Repeat it, or delete it if you can justify why it is wrong.`,
        action: { kind: 'removeRow', label: `Delete trial ${trial}`, rowId: used[outlier.index].id },
      })
    }

    if (fit.n >= 3 && fit.r2 < 0.98) {
      out.push({
        id: 'r2-low',
        level: 'warn',
        title: `The points don’t make a straight line (R² = ${fixed(fit.r2, 3)})`,
        detail: 'Check that only the intended setting changed between readings, and look for a single bad reading.',
      })
    } else if (fit.n >= min && fit.r2 >= 0.999) {
      out.push({ id: 'r2-good', level: 'good', title: `Excellent straight line (R² = ${fixed(fit.r2, 4)})` })
    }

    if (cfg?.throughOrigin && fit.n >= 4) {
      const maxY = Math.max(...analysis.points.map((p) => Math.abs(p.y)))
      if (Math.abs(fit.intercept) > 3 * fit.interceptSE && Math.abs(fit.intercept) > 0.02 * maxY) {
        out.push({
          id: 'intercept',
          level: 'tip',
          title: 'The line does not pass through the origin',
          detail: `Theory predicts a zero intercept, but yours is ${fixed(fit.intercept, 3)}. ${cfg.interceptCause ?? 'This points to a systematic error.'}`,
        })
      }
    }
  }

  if (analysis && used.length >= min) {
    const r = analysis.results.find((x) => x.accepted !== undefined && Number.isFinite(x.value))
    if (r && r.accepted !== undefined) {
      const err = percentError(r.value, r.accepted)
      if (err < 2) out.push({ id: 'err-good', level: 'good', title: `${r.label}: within ${fixed(err, 1)}% of the accepted value` })
      else if (err < 5)
        out.push({ id: 'err-ok', level: 'info', title: `${r.label}: ${fixed(err, 1)}% from the accepted value`, detail: 'Acceptable. More readings over a wider range would tighten it.' })
      else
        out.push({
          id: 'err-high',
          level: 'warn',
          title: `${r.label} is ${fixed(err, 1)}% from the accepted value`,
          detail: ['Likely causes:', ...(cfg?.errorCauses ?? ['Too few readings, or readings over a narrow range.'])].join(' • '),
        })
    }
  }

  if (where === 'bench' && rows.length && !noise) {
    out.push({ id: 'noise-off', level: 'info', title: 'Instrument error is off', detail: 'Readings are ideal values. Switch it on for realistic data.' })
  }

  if (where === 'bench' && used.length >= min && analysis && !ctx.newSeries) {
    out.push({
      id: 'ready',
      level: 'tip',
      title: 'You have enough readings for the graph',
      action: { kind: 'link', label: 'Open Analysis', to: `/experiments/${m.id}/analysis` },
    })
  }

  // De-duplicate by id, most urgent first.
  const seen = new Set<string>()
  return out.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true))).sort((a, b) => ORDER[a.level] - ORDER[b.level])
}
