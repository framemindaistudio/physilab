// Runs every experiment's own analysis on the seeded notebook and writes the
// measured-vs-accepted results (and each experiment's formulas) to results.json.
// Usage: node results.mjs  (needs the dev server on http://localhost:5173)
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import { seedNotebook } from './seed.mjs'

const OUT = path.resolve(import.meta.dirname, '../../deliverables/screens/results.json')
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage()
await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle0' })
await seedNotebook(page)
const data = await page.evaluate(async () => {
  const reg = await import('/src/experiments/registry.ts')
  const { computeAnalysis } = await import('/src/components/experiment/useAnalysis.ts')
  const { inSyllabus } = await import('/src/data/syllabus.ts')
  const store = JSON.parse(localStorage.getItem('physilab:v1'))
  return reg.EXPERIMENTS.map((m) => {
    const rows = store.experiments[m.id]?.rows ?? []
    const a = computeAnalysis(m, rows)
    const r = a.result
    return {
      id: m.id,
      number: m.number,
      title: m.title,
      category: m.category,
      tagline: m.tagline,
      aim: m.aim,
      syllabus: inSyllabus(m.id),
      n: a.used.length,
      r2: r?.fit?.r2 ?? null,
      axes: r ? `${r.y.label} vs ${r.x.label}` : null,
      results: (r?.results ?? []).map((x) => ({
        ...x,
        err: x.accepted ? (Math.abs(x.value - x.accepted) / Math.abs(x.accepted)) * 100 : null,
      })),
      formulas: m.theory.flatMap((t) => (t.formulas ?? []).map((f) => ({ tex: f.tex, caption: f.caption ?? '' }))),
      model: m.model.equations.map((f) => ({ tex: f.tex, caption: f.caption ?? '' })),
      assumptions: m.model.assumptions,
      method: m.model.method,
    }
  })
})
fs.writeFileSync(OUT, JSON.stringify(data, null, 2))
await browser.close()
for (const e of data)
  console.log(
    e.number,
    e.id.padEnd(20),
    `n=${e.n}`,
    e.results.map((x) => `${x.label}: ${x.value.toPrecision(5)} ${x.unit} (acc ${x.accepted ?? '-'}; ${x.err == null ? '-' : x.err.toFixed(2) + '%'})`).join(' | '),
  )
