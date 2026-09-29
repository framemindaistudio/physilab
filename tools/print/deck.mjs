// Builds the PHYSILAB slide deck (.pptx) plus an HTML mirror of every slide for visual QA.
// Each slide is described once as a list of primitives (rect, text, image, …); the same
// description is emitted to pptxgenjs and to absolutely-positioned HTML rendered by Chrome
// with the same system fonts (Calibri, Cambria, Consolas) that PowerPoint uses.
// Usage: node deck.mjs
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import pptxgen from 'pptxgenjs'
import { BUILD, C, CREDIT, OUT, SCREENS, byId, fileUrl, fontCss, iconPng, katexCss, results, tex, withBrowser } from './lib.mjs'
import { AREA, SHORT, fmt, pct } from './poster2.mjs'

const W = 13.333
const H = 7.5
const M = 0.6
const CW = W - 2 * M
const DECK = path.join(OUT, 'PHYSILAB-Presentation.pptx')
const PREVIEW = path.join(OUT, 'deck-preview')
const IMG = path.join(BUILD, 'deck')
fs.mkdirSync(IMG, { recursive: true })
fs.mkdirSync(PREVIEW, { recursive: true })

const FONT = { head: 'Cambria', body: 'Calibri', mono: 'Consolas' }

// ───────────────────────── assets ─────────────────────────
/** Crops a screenshot to exactly the aspect of a w×h box (anchor: top | center). */
async function pic(name, w, h, { crop, anchor = 'top', ax = 0.5, px = 1600, png = false } = {}) {
  const key = `${name}-${crop ? crop.join('_') : 'full'}-${w.toFixed(3)}x${h.toFixed(3)}-${anchor}-${ax}-${px}${png ? '.png' : '.jpg'}`
  const out = path.join(IMG, key)
  if (!fs.existsSync(out)) {
    const file = path.join(SCREENS, `${name}.png`)
    const meta = await sharp(file).metadata()
    let [x, y, cw, ch] = crop ?? [0, 0, meta.width, meta.height]
    const a = w / h
    if (cw / ch > a) {
      const nw = Math.round(ch * a)
      x += Math.round((cw - nw) * ax)
      cw = nw
    } else {
      const nh = Math.round(cw / a)
      y += anchor === 'top' ? 0 : Math.round((ch - nh) / 2)
      ch = nh
    }
    let s = sharp(file).extract({ left: x, top: y, width: cw, height: ch }).resize({ width: Math.min(px, cw) })
    s = png ? s.png() : s.jpeg({ quality: 86, mozjpeg: true })
    await s.toFile(out)
  }
  return out
}
async function svgPng(svg, name, px) {
  const out = path.join(IMG, name)
  if (!fs.existsSync(out)) await sharp(Buffer.from(svg), { density: 300 }).resize({ width: px }).png().toFile(out)
  return out
}
function gridSvg(dark) {
  const w = 2667
  const h = 1500
  const step = 50
  const minor = dark ? 'rgba(130,175,210,0.055)' : 'rgba(29,78,137,0.045)'
  const major = dark ? 'rgba(130,175,210,0.12)' : 'rgba(29,78,137,0.085)'
  let lines = ''
  for (let x = 0; x <= w; x += step) lines += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${x % (step * 5) === 0 ? major : minor}" stroke-width="${x % (step * 5) === 0 ? 2 : 1.4}"/>`
  for (let y = 0; y <= h; y += step) lines += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${y % (step * 5) === 0 ? major : minor}" stroke-width="${y % (step * 5) === 0 ? 2 : 1.4}"/>`
  const glow = dark
    ? `<defs><radialGradient id="g1" cx="0.78" cy="0.28" r="0.5"><stop offset="0" stop-color="#f2a93b" stop-opacity="0.16"/><stop offset="1" stop-color="#f2a93b" stop-opacity="0"/></radialGradient><radialGradient id="g2" cx="0.1" cy="0.95" r="0.55"><stop offset="0" stop-color="#2d6cb5" stop-opacity="0.2"/><stop offset="1" stop-color="#2d6cb5" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#g1)"/><rect width="${w}" height="${h}" fill="url(#g2)"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#${dark ? C.dark : C.paper}"/>${glow}${lines}</svg>`
}

// Formula images (KaTeX → transparent PNG), rendered in one browser session.
const FORMULAS = {}
function formula(key, texStr, color = C.ink, size = 26) {
  FORMULAS[key] = { tex: texStr, color, size }
  return key
}

// ───────────────────────── slide model ─────────────────────────
const slides = []
let icons = {}
async function ic(name, color) {
  const k = `${name}-${color}`
  icons[k] ??= await iconPng(name, color)
  return icons[k]
}
function newSlide(bg, notes) {
  const s = { bg, items: [], notes }
  slides.push(s)
  const add = (o) => (s.items.push(o), s)
  Object.assign(s, {
    rect: (o) => add({ type: 'rect', ...o }),
    ellipse: (o) => add({ type: 'ellipse', ...o }),
    line: (o) => add({ type: 'line', ...o }),
    image: (o) => add({ type: 'image', ...o }),
    text: (o) => add({ type: 'text', ...o }),
    table: (o) => add({ type: 'table', ...o }),
    chart: (o) => add({ type: 'chart', ...o }),
    formula: (key, x, y, w, h, align = 'center') => add({ type: 'formula', key, x, y, w, h, align }),
  })
  return s
}
const shadow = () => ({ type: 'outer', color: '0B141A', opacity: 0.12, blur: 7, offset: 2, angle: 90 })

// Reusable compositions
function header(s, eyebrow, title, dark = false) {
  s.text({ x: M, y: 0.42, w: CW, h: 0.28, paras: [eyebrow.toUpperCase()], font: FONT.mono, size: 10.5, color: dark ? '8FA6B4' : C.ink3, cs: 2 })
  s.text({ x: M, y: 0.7, w: CW, h: 0.62, paras: [title], font: FONT.head, size: 30, bold: true, color: dark ? 'FFFFFF' : C.ink })
}
function footer(s, n, dark = false) {
  const c = dark ? '6F8796' : C.ink3
  s.text({ x: M, y: 7.02, w: 5, h: 0.26, paras: [[{ t: 'PHYSILAB', b: true }, { t: '  ·  physilab.vercel.app' }]], size: 9, color: c })
  s.text({ x: W - M - 2, y: 7.02, w: 2, h: 0.26, paras: [`${String(n).padStart(2, '0')} / ${TOTAL}`], size: 9, color: c, align: 'right', font: FONT.mono })
}
/** Browser-window frame around a screenshot. Returns the frame height. */
async function frame(s, name, x, y, w, aspect, { crop, dark = false, url = 'physilab.vercel.app', anchor = 'top' } = {}) {
  const bar = 0.24
  const ih = w / aspect
  s.rect({ x, y, w, h: ih + bar, fill: dark ? '0E181F' : 'FFFFFF', line: dark ? '2B3D49' : 'C9D3D8', lineW: 0.75, r: 0.09, shadow: shadow() })
  s.rect({ x: x + 0.01, y: y + 0.01, w: w - 0.02, h: bar - 0.01, fill: dark ? '16242E' : 'E9EEF0', r: 0.08 })
  s.rect({ x: x + 0.01, y: y + bar * 0.5, w: w - 0.02, h: bar * 0.5, fill: dark ? '16242E' : 'E9EEF0' })
  ;['E0685F', 'E6B54A', '6CBF6A'].forEach((c, i) => s.ellipse({ x: x + 0.12 + i * 0.13, y: y + 0.085, w: 0.075, h: 0.075, fill: c }))
  s.rect({ x: x + 0.55, y: y + 0.05, w: Math.min(3.3, w * 0.5), h: 0.14, fill: dark ? '0E181F' : 'FFFFFF', r: 0.05 })
  s.text({ x: x + 0.62, y: y + 0.05, w: Math.min(3.2, w * 0.5) - 0.1, h: 0.14, paras: [url], font: FONT.mono, size: 6.5, color: dark ? '8FA6B4' : '5F7079', valign: 'middle' })
  s.image({ x: x + 0.01, y: y + bar, w: w - 0.02, h: ih - 0.01, path: await pic(name, w - 0.02, ih - 0.01, { crop, anchor }) })
  return ih + bar
}
function iconCircle(s, x, y, d, iconData, fill) {
  s.ellipse({ x, y, w: d, h: d, fill })
  const k = d * 0.56
  s.image({ x: x + (d - k) / 2, y: y + (d - k) / 2, w: k, h: k, data: iconData })
}
function pill(s, x, y, w, text, { fill = C.okSoft, color = C.ok, size = 10.5 } = {}) {
  s.rect({ x, y, w, h: 0.28, fill, r: 0.06 })
  s.text({ x, y, w, h: 0.28, paras: [text], size, color, align: 'center', valign: 'middle', font: FONT.mono })
}

// Unicode symbol runs for results (with real subscripts)
function symRuns(sym) {
  const map = { '\\lambda': 'λ', '\\tau': 'τ', '\\kappa': 'κ', '\\mathcal R': 'ℛ', '\\Phi': 'Φ', '\\max': 'max' }
  let s = sym
  for (const [k, v] of Object.entries(map)) s = s.split(k).join(v)
  const m = s.match(/^(.*?)_\{?([^}]*)\}?$/)
  if (!m) return [{ t: s }]
  return [{ t: m[1] }, { t: m[2], sub: true }]
}
function resultRuns(r, d = 4, { size, color, bold = true } = {}) {
  const unit = r.unit.trim().replace(/^×10/, '× 10')
  return [...symRuns(r.symbol).map((x) => ({ ...x, b: bold, s: size, c: color })), { t: ` = ${fmt(r.value, d)}${unit ? ` ${unit}` : ''}`, b: bold, s: size, c: color }]
}

const TOTAL = 19
const pend = byId('pendulum').results[0]
const pe = byId('photoelectric')
const peH = pe.results[0]
const E = 1.602176634e-19

// ───────────────────────── slides ─────────────────────────
async function build() {
  const bgDark = await svgPng(gridSvg(true), 'bg-dark.png', 2667)
  const bgLight = await svgPng(gridSvg(false), 'bg-light.png', 2667)
  const logo = await svgPng(fs.readFileSync(path.join(import.meta.dirname, '../../public/favicon.svg'), 'utf8'), 'logo.png', 256)
  const qr = path.join(OUT, 'qr/physilab-qr.png')
  const dark = { image: bgDark }
  const light = { image: bgLight }

  // 1 ─ Title
  {
    const s = newSlide(dark, 'PHYSILAB is a virtual physics laboratory for first-year engineering students. In the next few minutes: why we need it, how it works, the physics inside it, and how accurate it is.')
    s.image({ x: M, y: 0.5, w: 0.42, h: 0.42, path: logo })
    s.text({ x: 1.12, y: 0.5, w: 3, h: 0.42, paras: ['PHYSILAB'], bold: true, size: 15, color: 'FFFFFF', valign: 'middle' })
    s.text({ x: M, y: 1.72, w: 6.4, h: 0.3, paras: ['VIRTUAL PHYSICS LABORATORY · ENGINEERING PHYSICS'], font: FONT.mono, size: 11, color: '8FA6B4', cs: 1.5 })
    s.text({ x: M, y: 2.02, w: 6.4, h: 1.2, paras: ['PHYSILAB'], font: FONT.head, size: 66, bold: true, color: 'FFFFFF', valign: 'middle' })
    s.text({ x: M, y: 3.22, w: 6.4, h: 0.55, paras: [[{ t: 'Physics. Simulated. ', c: C.sky }, { t: 'Understood.', c: C.sodiumBright }]], size: 26, bold: true })
    s.text({ x: M, y: 3.9, w: 5.9, h: 0.9, paras: ['An interactive virtual laboratory for performing, analysing and understanding engineering-physics experiments, right in the browser.'], size: 15, color: 'C3D0D8' })
    s.rect({ x: M, y: 5.2, w: 1.45, h: 1.45, fill: 'FFFFFF', r: 0.1 })
    s.image({ x: M + 0.08, y: 5.28, w: 1.29, h: 1.29, path: qr })
    s.text({ x: 2.25, y: 5.25, w: 4.6, h: 0.34, paras: ['Scan to open the lab'], bold: true, size: 15, color: 'FFFFFF' })
    s.text({ x: 2.25, y: 5.6, w: 4.6, h: 0.34, paras: ['physilab.vercel.app'], font: FONT.mono, size: 15, color: C.sodiumBright })
    s.text({ x: 2.25, y: 6.05, w: 4.8, h: 0.55, paras: [[{ t: 'Made by ', c: 'A9BBC6' }, { t: CREDIT.name, b: true, c: 'FFFFFF' }], [{ t: CREDIT.role, c: 'A9BBC6' }]], size: 13 })
    await frame(s, 'home-dark', 7.05, 1.2, 5.68, 1.6, { dark: true })
    const stats = [['22', 'experiments', 'FFFFFF'], ['6', 'areas of physics', 'FFFFFF'], ['10/10', '1BPHS102C lab', C.sodiumBright]]
    stats.forEach(([n, l, c], i) => {
      const x = 7.05 + i * 1.95
      s.text({ x, y: 5.3, w: 1.85, h: 0.55, paras: [n], font: FONT.head, bold: true, size: 28, color: c })
      s.text({ x, y: 5.85, w: 1.85, h: 0.3, paras: [l], size: 12, color: 'A9BBC6' })
    })
  }

  // 2 ─ Why
  {
    const s = newSlide(light, 'Real labs are essential, but a two-hour slot gives each student one attempt, the physics is invisible, and mistakes are only found when the record is corrected.')
    header(s, '01 · The problem', 'Why a virtual physics lab?')
    const cards = [
      ['Clock', 'Limited lab time', 'A lab slot allows each experiment once. There is no time to repeat readings, try other values or recover from a mistake.'],
      ['EyeOff', 'Invisible physics', 'Electrons, fields, phasors and wavefronts cannot be seen on a real bench, so the equations stay abstract.'],
      ['Hourglass', 'Slow feedback', 'Graphs and errors are checked days later, long after the chance to fix the readings has passed.'],
    ]
    const cw = (CW - 0.7) / 3
    for (const [i, [icn, t, d]] of cards.entries()) {
      const x = M + i * (cw + 0.35)
      s.rect({ x, y: 1.75, w: cw, h: 3.45, fill: 'FFFFFF', line: C.line, lineW: 0.75, r: 0.12, shadow: shadow() })
      iconCircle(s, x + 0.35, 2.1, 0.72, await ic(icn, C.sodium), C.sodiumSoft)
      s.text({ x: x + 0.35, y: 3.02, w: cw - 0.7, h: 0.45, paras: [t], font: FONT.head, bold: true, size: 19, color: C.ink })
      s.text({ x: x + 0.35, y: 3.5, w: cw - 0.7, h: 1.5, paras: [d], size: 14, color: C.ink2 })
    }
    s.rect({ x: M, y: 5.55, w: CW, h: 1.1, fill: C.prussianSoft, r: 0.12 })
    iconCircle(s, 0.95, 5.75, 0.7, await ic('ArrowRight', 'FFFFFF'), C.prussian)
    s.text({ x: 1.95, y: 5.6, w: 10.5, h: 1.0, valign: 'middle', size: 16, color: C.prussian, paras: [[{ t: 'PHYSILAB gives every student a complete lab bench, any time: ', b: true }, { t: 'the same apparatus, the same method, and instant feedback from the physics itself.' }]] })
    footer(s, 2)
  }

  // 3 ─ What
  {
    const s = newSlide(light, 'PHYSILAB is a free web app. Everything a practical needs is in one place, and it runs on any laptop or phone without installing anything.')
    header(s, '02 · The idea', 'One lab bench, 22 experiments')
    s.text({ x: M, y: 1.7, w: 5.0, h: 1.8, size: 15, color: C.ink2, paras: ['PHYSILAB is a free web app that simulates engineering-physics experiments from their governing equations. Students set up the apparatus, take readings, plot graphs, face a viva and print a lab record: the whole practical, in a browser.'] })
    const stats = [['22', 'experiments', C.prussian], ['6', 'areas of physics', C.prussian], ['10/10', '1BPHS102C lab experiments', C.sodium], ['176', 'viva questions, all explained', C.sodium]]
    stats.forEach(([n, l, c], i) => {
      const x = M + (i % 2) * 2.6
      const y = 3.7 + Math.floor(i / 2) * 1.45
      s.rect({ x, y, w: 2.4, h: 1.3, fill: 'FFFFFF', line: C.line, lineW: 0.75, r: 0.1, shadow: shadow() })
      s.text({ x: x + 0.25, y: y + 0.15, w: 2.0, h: 0.62, paras: [n], font: FONT.head, bold: true, size: 32, color: c, valign: 'middle' })
      s.text({ x: x + 0.25, y: y + 0.8, w: 2.0, h: 0.4, paras: [l], size: 12, color: C.ink2 })
    })
    await frame(s, 'catalogue', 5.95, 1.7, 6.78, 1.6, { url: 'physilab.vercel.app/experiments' })
    footer(s, 3)
  }

  // 4 ─ Six areas
  {
    const s = newSlide(light, 'The 22 experiments cover six areas of the first-year syllabus, from classical mechanics to semiconductor physics.')
    header(s, '03 · Coverage', 'Six areas of physics')
    const icn = { mechanics: 'Orbit', optics: 'Sun', electromagnetism: 'Zap', waves: 'AudioWaveform', modern: 'Atom', semiconductor: 'Cpu' }
    const tint = (hex) => {
      const n = parseInt(hex.slice(1), 16)
      const mix = (v) => Math.round(v + (255 - v) * 0.86)
      return [mix(n >> 16), mix((n >> 8) & 255), mix(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
    }
    const cw = (CW - 0.7) / 3
    for (const [i, cat] of Object.keys(AREA).entries()) {
      const [name, color] = AREA[cat]
      const list = results.filter((e) => e.category === cat)
      const x = M + (i % 3) * (cw + 0.35)
      const y = 1.65 + Math.floor(i / 3) * 2.58
      s.rect({ x, y, w: cw, h: 2.38, fill: 'FFFFFF', line: C.line, lineW: 0.75, r: 0.12, shadow: shadow() })
      iconCircle(s, x + 0.3, y + 0.3, 0.62, await ic(icn[cat], color.slice(1)), tint(color))
      s.text({ x: x + 1.08, y: y + 0.28, w: cw - 1.18, h: 0.36, paras: [name], font: FONT.head, bold: true, size: 15.5, color: C.ink })
      s.text({ x: x + 1.08, y: y + 0.64, w: cw - 1.3, h: 0.28, paras: [`${list.length} experiment${list.length > 1 ? 's' : ''}`], size: 11.5, color: color.slice(1), bold: true })
      s.text({ x: x + 0.3, y: y + 1.08, w: cw - 0.6, h: 1.2, size: 12, color: C.ink2, paras: [list.map((e) => SHORT[e.id]).join('  ·  ')] })
    }
    footer(s, 4)
  }

  // 5 ─ Five stages
  {
    const s = newSlide(light, 'Every experiment has the same five stages, in the order a real practical is done. The stage bar at the top shows progress.')
    header(s, '04 · How it works', 'Every experiment follows the same five stages')
    const stages = [
      ['BookOpen', 'Aim & theory', 'Aim, derivation, formulas, variables, apparatus and procedure.'],
      ['FlaskConical', 'Lab bench', 'Animated apparatus and readings with instrument error.'],
      ['ChartLine', 'Analysis', 'Automatic graph, best-fit line, result ± uncertainty.'],
      ['GraduationCap', 'Viva', 'Eight explained questions; missed ones come back first.'],
      ['FileText', 'Report', 'A printable lab record with everything in one place.'],
    ]
    const step = CW / 5
    s.line({ x1: M + step / 2, y1: 2.67, x2: M + CW - step / 2, y2: 2.67, color: 'C9D3D8', w: 2 })
    for (const [i, [icn, t, d]] of stages.entries()) {
      const cx = M + step / 2 + i * step
      iconCircle(s, cx - 0.48, 2.19, 0.96, await ic(icn, 'FFFFFF'), i === 4 ? C.sodium : C.prussian)
      s.text({ x: cx - 1.12, y: 3.32, w: 2.24, h: 0.38, paras: [`${i + 1} · ${t}`], font: FONT.head, bold: true, size: 16, color: C.ink, align: 'center' })
      s.text({ x: cx - 1.1, y: 3.74, w: 2.2, h: 1.1, paras: [d], size: 12.5, color: C.ink2, align: 'center' })
    }
    s.rect({ x: M - 0.1, y: 5.3, w: CW + 0.2, h: 0.8, fill: 'FFFFFF', line: C.line, lineW: 0.75, r: 0.1, shadow: shadow() })
    s.image({ x: M, y: 5.4, w: CW, h: 0.6, path: await pic('theory', CW, 0.6, { crop: [540, 52, 2268, 116] }) })
    s.text({ x: M, y: 6.3, w: CW, h: 0.35, paras: ['The stage bar at the top of every experiment: a green tick marks each completed stage.'], size: 12, color: C.ink3, align: 'center' })
    footer(s, 5)
  }

  // 6 ─ Stage 1
  {
    const s = newSlide(light, 'Before touching the apparatus, the student reads the aim, the theory with derivations and the formulas. A panel also explains exactly how the simulation is built, so nothing is a black box.')
    header(s, 'Stage 1 · Aim & theory', 'The physics comes before the practical')
    await frame(s, 'theory', M, 1.62, 7.25, 2340 / 1500, { crop: [500, 20, 2340, 1500], url: 'physilab.vercel.app/experiments/pendulum' })
    const rows = [
      ['Target', 'Aim and objectives', 'what will be measured, and why'],
      ['BookOpen', 'Theory with derivations', 'from first principles to the working formula'],
      ['Sigma', 'Properly typeset formulas', 'every equation, not a picture of one'],
      ['SlidersHorizontal', 'Variables', 'independent, dependent and controlled'],
      ['ListChecks', 'Apparatus and procedure', 'with the precautions'],
      ['Cpu', 'How the simulation is built', 'the exact model and its assumptions'],
    ]
    for (const [i, [icn, t, d]] of rows.entries()) {
      const y = 1.75 + i * 0.8
      iconCircle(s, 8.3, y, 0.5, await ic(icn, C.prussian), C.prussianSoft)
      s.text({ x: 8.98, y: y - 0.05, w: 3.75, h: 0.32, paras: [t], bold: true, size: 14.5, color: C.ink })
      s.text({ x: 8.98, y: y + 0.26, w: 3.75, h: 0.3, paras: [d], size: 12, color: C.ink2 })
    }
    footer(s, 6)
  }

  // 7 ─ Stage 2
  {
    const s = newSlide(light, 'On the lab bench the apparatus is animated by the same equations that produce the readings. Instrument error can be switched off to reveal the ideal law.')
    header(s, 'Stage 2 · Lab bench', 'An apparatus that obeys the equations')
    const feats = [
      ['Play', 'Animated apparatus', 'Driven by the same equations that produce the readings.'],
      ['SlidersHorizontal', 'Real controls', 'Length, mass, amplitude, even the gravity of the Moon.'],
      ['Gauge', 'Instrument error', 'Reaction time, least count and meter noise; switch it off to see the ideal law.'],
      ['Table', 'Observation table', "Every reading is saved in the student's lab notebook."],
    ]
    for (const [i, [icn, t, d]] of feats.entries()) {
      const y = 1.65 + i * 1.22
      s.rect({ x: M, y, w: 4.6, h: 1.08, fill: 'FFFFFF', line: C.line, lineW: 0.75, r: 0.1, shadow: shadow() })
      iconCircle(s, M + 0.22, y + 0.24, 0.6, await ic(icn, C.sodium), C.sodiumSoft)
      s.text({ x: M + 1.0, y: y + 0.13, w: 3.45, h: 0.3, paras: [t], bold: true, size: 14.5, color: C.ink })
      s.text({ x: M + 1.0, y: y + 0.44, w: 3.45, h: 0.56, paras: [d], size: 12, color: C.ink2 })
    }
    await frame(s, 'lab-pendulum', 5.55, 1.65, 7.18, 2340 / 1500, { crop: [500, 20, 2340, 1500], url: 'physilab.vercel.app/experiments/pendulum/lab' })
    footer(s, 7)
  }

  // 8 ─ Stage 3
  {
    const slope = peH.value * 1e-34 / E
    const slopeSE = peH.uncertainty * 1e-34 / E
    const s = newSlide(light, `In analysis the law is plotted as a straight line. For the photoelectric effect V0 against frequency has slope h/e, so h = e × slope = ${fmt(peH.value, 3)} × 10^-34 J s, ${pct(peH.err)} from the accepted value.`)
    header(s, 'Stage 3 · Analysis', 'Graph → slope → physical constant')
    await frame(s, 'graph-photoelectric', M, 1.62, 7.0, 1528 / 948, { url: 'physilab.vercel.app/experiments/photoelectric/analysis' })
    s.text({ x: M, y: 6.3, w: 7.0, h: 0.3, paras: [`Photoelectric effect (sodium): ${pe.n} readings of stopping potential, R² = ${pe.r2.toFixed(4)}`], size: 11, color: C.ink3 })
    const steps = [
      ['Plot the law as a straight line', formula('pe-law', 'V_0 = \\dfrac{h}{e}\\,\\nu - \\dfrac{\\phi}{e}')],
      ['Least-squares slope', formula('pe-slope', `\\text{slope} = (${(slope * 1e15).toFixed(2)} \\pm ${(slopeSE * 1e15).toFixed(2)})\\times10^{-15}\\ \\mathrm{V\\,s}`)],
      ['Physical constant', formula('pe-h', `h = e\\times\\text{slope} = (${fmt(peH.value, 3)} \\pm ${fmt(peH.uncertainty, 1)})\\times10^{-34}\\ \\mathrm{J\\,s}`)],
    ]
    for (const [i, [t, f]] of steps.entries()) {
      const y = 1.62 + i * 1.62
      const x = 7.95
      const w = CW + M - x
      s.rect({ x, y, w, h: 1.45, fill: 'FFFFFF', line: C.line, lineW: 0.75, r: 0.1, shadow: shadow() })
      s.ellipse({ x: x + 0.22, y: y + 0.2, w: 0.42, h: 0.42, fill: i === 2 ? C.sodium : C.prussian })
      s.text({ x: x + 0.22, y: y + 0.2, w: 0.42, h: 0.42, paras: [String(i + 1)], bold: true, size: 14, color: 'FFFFFF', align: 'center', valign: 'middle' })
      s.text({ x: x + 0.8, y: y + 0.24, w: w - 1.0, h: 0.34, paras: [t], bold: true, size: 14, color: C.ink })
      s.formula(f, x + 0.3, y + 0.68, w - 0.6, 0.62)
      if (i === 2) pill(s, x + w - 2.25, y + 0.22, 2.05, `${pct(peH.err)} from 6.626`)
    }
    footer(s, 8)
  }

  // 9 ─ Stages 4 & 5
  {
    const s = newSlide(light, 'The viva checks understanding with eight explained questions per experiment and brings back missed questions first. The report collects everything into a printable lab record.')
    header(s, 'Stages 4 & 5 · Viva and report', 'Check understanding, then write it up')
    const w = (CW - 0.43) / 2
    const items = [
      ['viva', [500, 20, 2340, 1500], 'Adaptive viva', 'Eight questions per experiment, each with an explanation. Questions missed last time come back first.', 'physilab.vercel.app/experiments/pendulum/viva'],
      ['report', [820, 20, 1720, 1100], 'Printable lab record', "Aim, theory, observations, graph, calculations and result, with the student's name and date.", 'physilab.vercel.app/experiments/pendulum/report'],
    ]
    for (const [i, [name, crop, t, d, url]] of items.entries()) {
      const x = M + i * (w + 0.43)
      const fh = await frame(s, name, x, 1.62, w, crop[2] / crop[3], { crop, url })
      s.text({ x, y: 1.62 + fh + 0.2, w, h: 0.34, paras: [t], bold: true, size: 15, color: C.ink })
      s.text({ x, y: 1.62 + fh + 0.54, w, h: 0.6, paras: [d], size: 12.5, color: C.ink2 })
    }
    footer(s, 9)
  }

  // 10 ─ Don't fake the physics
  {
    const s = newSlide(dark, `The key design rule: a reading is never looked up. For the pendulum the exact equation is integrated with RK4, the period is timed from zero crossings with reaction time and least count, and the graph gives g = ${fmt(pend.value, 3)} m/s², ${pct(pend.err)} from 9.81.`)
    header(s, 'The key idea', "Don't fake the physics", true)
    s.text({ x: M, y: 1.35, w: CW, h: 0.4, paras: ['A reading is never looked up from a formula. It is measured from a simulation of the full physical law. Worked example: the simple pendulum.'], size: 15, color: 'C3D0D8' })
    const L = 'E3EAEE'
    const nodes = [
      ['Physical law', formula('d-law', '\\ddot\\theta = -\\dfrac{g}{L}\\sin\\theta', L), 'The exact equation of motion, not the small-angle shortcut.'],
      ['Numerical model', formula('d-model', 'T \\approx T_0\\left(1+\\dfrac{\\theta_0^2}{16}\\right)', L), 'Solved with 4th-order Runge–Kutta: wide swings really run slow.'],
      ['Virtual instrument', formula('d-instr', 't_{10} \\pm 0.1\\ \\mathrm{s}', L), 'T is timed from zero crossings, with reaction time and least count.'],
      ['Graph & fit', formula('d-graph', 'T^2 = \\dfrac{4\\pi^2}{g}\\,L', L), `Least-squares line through ${byId('pendulum').n} readings: slope ± error.`],
      ['Physical constant', formula('d-const', `g = ${fmt(pend.value, 3)} \\pm ${fmt(pend.uncertainty, 1)}\\ \\mathrm{m\\,s^{-2}}`, 'F6D7A6'), `Accepted 9.81 m s⁻²: ${pct(pend.err)} error. Earned, not looked up.`],
    ]
    const gap = 0.33
    const nw = (CW - 4 * gap) / 5
    const chev = await ic('ChevronRight', C.sodiumBright)
    for (const [i, [t, f, d]] of nodes.entries()) {
      const x = M + i * (nw + gap)
      const y = 2.0
      s.rect({ x, y, w: nw, h: 3.25, fill: '16242E', line: '2B3D49', lineW: 0.75, r: 0.12 })
      s.ellipse({ x: x + 0.2, y: y + 0.22, w: 0.44, h: 0.44, fill: i === 4 ? C.sodium : '2D6CB5' })
      s.text({ x: x + 0.2, y: y + 0.22, w: 0.44, h: 0.44, paras: [String(i + 1)], bold: true, size: 14, color: 'FFFFFF', align: 'center', valign: 'middle' })
      s.text({ x: x + 0.74, y: y + 0.2, w: nw - 0.84, h: 0.48, paras: [t], bold: true, size: 14, color: 'FFFFFF', valign: 'middle' })
      s.rect({ x: x + 0.15, y: y + 0.88, w: nw - 0.3, h: 0.95, fill: i === 4 ? '3A2A12' : '0E1A22', r: 0.08 })
      s.formula(f, x + 0.22, y + 0.95, nw - 0.44, 0.81)
      s.text({ x: x + 0.2, y: y + 1.98, w: nw - 0.4, h: 1.15, paras: [d], size: 12, color: 'A9BBC6' })
      if (i < 4) s.image({ x: x + nw + 0.035, y: y + 1.45, w: 0.26, h: 0.26, data: chev })
    }
    s.text({ x: M, y: 5.55, w: 2.55, h: 0.34, paras: ['Real-lab effects built in:'], bold: true, size: 12.5, color: 'FFFFFF', valign: 'middle' })
    const effects = ['Large-amplitude period', 'Reaction time', 'Least count', 'Meter noise', 'Stray light', 'T³ term in diode current', 'Coil resistance', 'Dark current']
    let ex = 3.2
    let ey = 5.55
    for (const e of effects) {
      const w = 0.3 + e.length * 0.074
      if (ex + w > W - M) {
        ex = 3.2
        ey += 0.44
      }
      s.rect({ x: ex, y: ey, w, h: 0.34, fill: '1B2C38', r: 0.17 })
      s.text({ x: ex, y: ey, w, h: 0.34, paras: [e], size: 11, color: C.sky, align: 'center', valign: 'middle' })
      ex += w + 0.12
    }
    s.text({ x: M, y: 6.45, w: CW, h: 0.4, paras: ['“T is timed from the simulated motion: measured, not looked up from 2π√(L/g).”'], italic: true, size: 14, color: C.sodiumBright })
    footer(s, 10, true)
  }

  // 11 ─ Mechanics & waves
  {
    const s = newSlide(light, 'Mechanics and waves: the pendulum is integrated exactly, the projectile trajectory step by step, and the sonometer wire responds like a driven oscillator, so the rider only jumps off near resonance.')
    header(s, '05 · Showcase', 'Mechanics and waves')
    const items = [
      ['pendulum', formula('law-pend', 'T^2 = \\dfrac{4\\pi^2}{g}\\,L'), 'Exact non-linear motion via RK4; wide swings visibly lengthen the period.', { crop: [250, 0, 1110, 880], anchor: 'top' }],
      ['projectile', formula('law-proj', 'R = \\dfrac{v_0^2\\sin 2\\theta}{g}'), 'Trajectory integrated step by step, with optional air drag; R and H read off the flight.', {}],
      ['sonometer', formula('law-son', 'f = \\dfrac{1}{2L}\\sqrt{\\dfrac{T}{\\mu}}'), 'Driven-oscillator response: the rider jumps off only near resonance.', {}],
    ]
    const cw = (CW - 0.7) / 3
    for (const [i, [id, f, note, opt]] of items.entries()) {
      const e = byId(id)
      const r = e.results[0]
      const x = M + i * (cw + 0.35)
      s.rect({ x, y: 1.62, w: cw, h: 5.1, fill: 'FFFFFF', line: C.line, lineW: 0.75, r: 0.12, shadow: shadow() })
      s.image({ x: x + 0.1, y: 1.72, w: cw - 0.2, h: 1.95, path: await pic(`canvas-${id}`, cw - 0.2, 1.95, { anchor: 'center', ...opt }) })
      s.text({ x: x + 0.28, y: 3.82, w: cw - 0.5, h: 0.25, paras: [`${AREA[e.category][0].toUpperCase()} · ${e.number}`], font: FONT.mono, size: 9.5, color: AREA[e.category][1].slice(1), cs: 1 })
      s.text({ x: x + 0.28, y: 4.07, w: cw - 0.5, h: 0.4, paras: [SHORT[id]], font: FONT.head, bold: true, size: 18, color: C.ink })
      s.formula(f, x + 0.28, 4.52, cw - 0.56, 0.66, 'left')
      s.text({ x: x + 0.28, y: 5.3, w: 2.3, h: 0.32, paras: [resultRuns(r, 4, { size: 13 })], color: C.ink, valign: 'middle' })
      pill(s, x + cw - 1.55, 5.32, 1.3, `${pct(r.err)} error`)
      s.text({ x: x + 0.28, y: 5.72, w: cw - 0.56, h: 0.85, paras: [note], size: 11.5, color: C.ink2 })
    }
    footer(s, 11)
  }

  // 12–14 ─ Showcase grids
  const grid = async (n, eyebrow, title, ids, cols, notes, extra) => {
    const s = newSlide(light, notes)
    header(s, eyebrow, title)
    const gap = 0.25
    const tw = (CW - (cols - 1) * gap) / cols
    const th = 2.42
    for (const [i, id] of ids.entries()) {
      const e = byId(id)
      const r = e.results[0]
      const x = M + (i % cols) * (tw + gap)
      const y = 1.62 + Math.floor(i / cols) * (th + 0.2)
      s.rect({ x, y, w: tw, h: th, fill: 'FFFFFF', line: C.line, lineW: 0.75, r: 0.1, shadow: shadow() })
      s.image({ x: x + 0.08, y: y + 0.08, w: tw - 0.16, h: 1.5, path: await pic(`canvas-${id}`, tw - 0.16, 1.5, { anchor: 'center' }) })
      s.text({ x: x + 0.2, y: y + 1.66, w: tw - 0.4, h: 0.32, paras: [[{ t: `${e.number}  `, c: C.ink3, f: FONT.mono, s: 10.5, b: false }, { t: SHORT[id] }]], font: FONT.head, bold: true, size: cols === 4 ? 12 : 14.5, color: C.ink })
      s.text({ x: x + 0.2, y: y + 1.99, w: tw - 0.4, h: 0.32, paras: [[...resultRuns(r, 4, { size: cols === 4 ? 11 : 12, color: C.ink }), { t: `   ${pct(r.err)} error`, c: C.ok, s: cols === 4 ? 10.5 : 11.5, b: false }]], valign: 'middle' })
    }
    if (extra) await extra(s, tw, th)
    footer(s, n)
  }
  await grid(12, '06 · Showcase', 'Optics: interference, diffraction, polarisation', ['double-slit', 'newtons-rings', 'diffraction-grating', 'malus-law', 'laser-wavelength', 'optical-fiber'], 3, 'Optics: every fringe, ring and spectral line is computed from the wave intensity, and the virtual micrometer or spectrometer finds them the way a student does.')
  await grid(13, '07 · Showcase', 'Electricity and magnetism', ['ohms-law', 'faraday', 'rc-circuit', 'lcr-resonance', 'black-box', 'dielectric-constant'], 3, 'Electricity and magnetism: circuits follow Kirchhoff and the impedance laws; the black box hides a real R, C or L that the student identifies from how Z changes with frequency.')
  await grid(14, '08 · Showcase', 'Modern physics and semiconductors', ['photoelectric', 'planck-led', 'fermi-energy', 'band-gap', 'hall-effect', 'four-probe', 'photodiode'], 4, 'Modern physics and semiconductors: photons, Fermi electrons and band gaps, including every semiconductor experiment of the 1BPHS102C syllabus.', async (s, tw, th) => {
    const x = M + 3 * (tw + 0.25)
    const y = 1.62 + th + 0.2
    s.rect({ x, y, w: tw, h: th, fill: C.prussian, r: 0.1 })
    s.text({ x: x + 0.25, y: y + 0.25, w: tw - 0.5, h: 0.3, paras: ['QUANTUM SIDE'], font: FONT.mono, size: 10, color: C.sky, cs: 1.5 })
    s.text({ x: x + 0.25, y: y + 0.6, w: tw - 0.5, h: 1.6, paras: [`Photons, Fermi electrons and band gaps: 7 experiments, ${results.filter((e) => ['modern', 'semiconductor'].includes(e.category) && e.syllabus).length} of them in the 1BPHS102C lab.`], font: FONT.head, bold: true, size: 15, color: 'FFFFFF' })
  })

  // 15 ─ Syllabus
  {
    const s = newSlide(light, 'All ten experiments of the 1BPHS102C lab are built in. The table shows the result each one produced from a full set of simulated readings.')
    header(s, '09 · 1BPHS102C', 'The complete 1BPHS102C lab syllabus')
    s.text({ x: M, y: 1.35, w: CW, h: 0.36, paras: ['All ten experiments of the first-year lab are built in, each with its own apparatus, analysis, viva and report.'], size: 14, color: C.ink2 })
    const syl = [
      ['Planck’s constant using LEDs', 'planck-led'],
      ['Fermi energy for a conductor', 'fermi-energy'],
      ['Wavelength of a laser', 'laser-wavelength'],
      ['Numerical aperture and acceptance angle of an optical fibre', 'optical-fiber'],
      ['Energy gap by four-probe method', 'four-probe'],
      ['Frequency response of a series LCR circuit', 'lcr-resonance'],
      ['Identification of passive components in a black box', 'black-box'],
      ['I–V characteristics of a photodiode and responsivity', 'photodiode'],
      ['Dielectric constant by charging and discharging', 'dielectric-constant'],
      ['Energy gap of a semiconductor diode', 'band-gap'],
    ]
    const head = ['No.', 'Syllabus experiment', 'PHYSILAB', 'Result obtained', 'Error']
    const rows = syl.map(([t, id], i) => {
      const r = byId(id).results[0]
      return [String(i + 1).padStart(2, '0'), t, `Exp ${byId(id).number}`, resultRuns(r, 4, { bold: false }).map((x) => x.t).join('').replace(/(E|R|I|f)g? /, (m) => m), pct(r.err)]
    })
    // Subscripts in a table cell: keep Unicode (E_g → Eg) readable.
    rows.forEach((row, i) => {
      const r = byId(syl[i][1]).results[0]
      row[3] = resultRuns(r, 4, { bold: false })
    })
    s.table({ x: M, y: 1.88, colW: [0.65, 5.35, 1.25, 3.6, 1.283], rowH: 0.39, head, rows })
    footer(s, 15)
  }

  // 16 ─ Accuracy
  {
    const errs = results.map((e) => e.results.find((x) => x.err != null).err)
    const sorted = [...errs].sort((a, b) => a - b)
    const median = (sorted[10] + sorted[11]) / 2
    const worst = results[errs.indexOf(Math.max(...errs))]
    const s = newSlide(light, `Every experiment was run with instrument error switched on. All 22 land within 2% of the accepted value; the median error is ${pct(median)}.`)
    header(s, '10 · Results', 'Measured vs accepted: all 22 within 2%')
    s.rect({ x: M, y: 1.55, w: 8.25, h: 5.3, fill: 'FFFFFF', line: C.line, lineW: 0.75, r: 0.1, shadow: shadow() })
    s.chart({ x: M + 0.1, y: 1.62, w: 8.05, h: 5.16, labels: results.map((e) => `${e.number} ${SHORT[e.id]}`), values: errs.map((v) => Math.round(v * 100) / 100) })
    const cards = [
      ['22 / 22', 'experiments within 2% of the accepted value', C.ok],
      [pct(median), 'median error across all 22 experiments', C.prussian],
      [pct(Math.max(...errs)), `largest error (${SHORT[worst.id]})`, C.sodium],
    ]
    cards.forEach(([n, l, c], i) => {
      const y = 1.55 + i * 1.83
      const x = 9.2
      s.rect({ x, y, w: W - M - x, h: 1.64, fill: 'FFFFFF', line: C.line, lineW: 0.75, r: 0.1, shadow: shadow() })
      s.text({ x: x + 0.3, y: y + 0.2, w: W - M - x - 0.6, h: 0.7, paras: [n], font: FONT.head, bold: true, size: 34, color: c, valign: 'middle' })
      s.text({ x: x + 0.3, y: y + 0.95, w: W - M - x - 0.6, h: 0.55, paras: [l], size: 12.5, color: C.ink2 })
    })
    footer(s, 16)
  }

  // 17 ─ Helpers
  {
    const s = newSlide(light, 'Three rule-based helpers: the Lab Assistant checks readings as they are taken, Ask PHYSILAB answers questions from the app’s own notes, and the adaptive viva focuses on weak topics. None of them needs the internet.')
    header(s, '11 · Built-in help', 'A lab partner that checks your work')
    s.text({ x: M, y: 1.35, w: CW, h: 0.36, paras: ['Rule-based, not online AI: every hint comes from the physics of the experiment, and nothing leaves the device.'], size: 14, color: C.ink2 })
    const cw = (CW - 0.7) / 3
    const cards = [
      ['Sparkles', 'Lab Assistant', 'Watches every reading: flags outliers with a statistical residual test, warns about large swings or a narrow range, and suggests the next reading.', 'assistant', [0, 0, 1500, 602]],
      ['MessageCircleQuestion', 'Ask PHYSILAB', 'Answers theory and viva questions from PHYSILAB’s own notes and solves quick numericals step by step.', 'chat', [0, 470, 800, 610]],
      ['Repeat', 'Adaptive viva', 'Each round starts with the questions missed last time, then new ones, then review, with an explanation for every answer.', 'viva', [590, 330, 1560, 700]],
    ]
    for (const [i, [icn, t, d, name, crop]] of cards.entries()) {
      const x = M + i * (cw + 0.35)
      const y = 1.9
      s.rect({ x, y, w: cw, h: 4.85, fill: 'FFFFFF', line: C.line, lineW: 0.75, r: 0.12, shadow: shadow() })
      s.rect({ x: x + 0.15, y: y + 0.15, w: cw - 0.3, h: 2.25, fill: C.paper, r: 0.08 })
      const a = crop[2] / crop[3]
      let iw = cw - 0.5
      let ih = iw / a
      if (ih > 2.05) {
        ih = 2.05
        iw = ih * a
      }
      s.image({ x: x + (cw - iw) / 2, y: y + 0.15 + (2.25 - ih) / 2, w: iw, h: ih, path: await pic(name, iw, ih, { crop }) })
      iconCircle(s, x + 0.3, y + 2.62, 0.55, await ic(icn, C.sodium), C.sodiumSoft)
      s.text({ x: x + 1.0, y: y + 2.62, w: cw - 1.2, h: 0.55, paras: [t], font: FONT.head, bold: true, size: 18, color: C.ink, valign: 'middle' })
      s.text({ x: x + 0.3, y: y + 3.32, w: cw - 0.6, h: 1.4, paras: [d], size: 12.5, color: C.ink2 })
    }
    footer(s, 17)
  }

  // 18 ─ How it's built
  {
    const s = newSlide(light, 'Briefly, the technology: one physics engine written in TypeScript drives both the animation and the virtual instruments; the interface is React. Everything runs in the browser, so there is no server or login.')
    header(s, '12 · Under the hood', 'How it is built (briefly)')
    const box = (x, y, w, h, t, d, fill, tc, dc, line) => {
      s.rect({ x, y, w, h, fill, line, lineW: line ? 0.75 : undefined, r: 0.1, shadow: shadow() })
      s.text({ x: x + 0.25, y: y + 0.14, w: w - 0.5, h: 0.34, paras: [t], bold: true, size: 15, color: tc })
      s.text({ x: x + 0.25, y: y + 0.48, w: w - 0.5, h: h - 0.56, paras: [d], size: 12, color: dc })
    }
    box(M, 1.7, 7.0, 1.05, 'Physics engine · TypeScript', 'RK4 integrator · interference, circuit and semiconductor laws', C.prussian, 'FFFFFF', 'DCE6F2')
    s.line({ x1: M + 1.75, y1: 2.75, x2: M + 1.75, y2: 3.2, color: '8A9AA3', w: 1.5, arrow: true })
    s.line({ x1: M + 5.25, y1: 2.75, x2: M + 5.25, y2: 3.2, color: '8A9AA3', w: 1.5, arrow: true })
    box(M, 3.2, 3.35, 1.05, 'Canvas animation', 'what the student sees', 'FFFFFF', C.ink, C.ink2, C.line)
    box(M + 3.65, 3.2, 3.35, 1.05, 'Virtual instrument', 'the readings, with noise', 'FFFFFF', C.ink, C.ink2, C.line)
    s.line({ x1: M + 5.25, y1: 4.25, x2: M + 5.25, y2: 4.7, color: '8A9AA3', w: 1.5, arrow: true })
    s.line({ x1: M + 1.75, y1: 4.25, x2: M + 1.75, y2: 4.7, color: '8A9AA3', w: 1.5, arrow: true })
    box(M, 4.7, 7.0, 1.05, 'React interface', 'theory · lab bench · least-squares analysis · viva · report', C.sodiumSoft, C.ink, C.ink2)
    s.text({ x: M, y: 5.95, w: 7.0, h: 0.6, paras: ['The same code draws the apparatus and produces the readings, so what the student sees is exactly what they measure.'], size: 12.5, color: C.ink2, italic: true })
    s.text({ x: 8.2, y: 1.7, w: 4.5, h: 0.34, paras: ['Built with'], bold: true, size: 15, color: C.ink })
    const chips = ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'HTML Canvas', 'KaTeX', 'Recharts', 'Vercel']
    chips.forEach((c, i) => {
      const x = 8.2 + (i % 2) * 2.3
      const y = 2.15 + Math.floor(i / 2) * 0.62
      s.rect({ x, y, w: 2.15, h: 0.48, fill: 'FFFFFF', line: C.line, lineW: 0.75, r: 0.24 })
      s.text({ x, y, w: 2.15, h: 0.48, paras: [c], size: 13, color: C.prussian, bold: true, align: 'center', valign: 'middle' })
    })
    s.rect({ x: 8.2, y: 4.75, w: 4.45, h: 1.0, fill: C.prussianSoft, r: 0.1 })
    s.text({ x: 8.4, y: 4.8, w: 4.1, h: 0.9, paras: ['No server and no login: the whole lab runs in the browser and saves the notebook on the device.'], size: 12.5, color: C.prussian, valign: 'middle' })
    footer(s, 18)
  }

  // 19 ─ Close
  {
    const s = newSlide(dark, 'Next steps: more experiments, cloud sync for teachers, and an installable app. Thank you. Scan the QR code to try every experiment.')
    s.text({ x: M, y: 0.42, w: 6, h: 0.28, paras: ['WHAT’S NEXT'], font: FONT.mono, size: 10.5, color: '8FA6B4', cs: 2 })
    s.text({ x: M, y: 0.7, w: 6.5, h: 0.62, paras: ['Next steps'], font: FONT.head, size: 30, bold: true, color: 'FFFFFF' })
    const next = [
      ['FlaskConical', '15 more experiments', 'Already planned in the catalogue, across all six areas.'],
      ['Cloud', 'Cloud sync and class dashboard', 'Online notebooks so teachers can follow progress.'],
      ['Smartphone', 'Install as an app', 'Offline use on phones and tablets.'],
    ]
    for (const [i, [icn, t, d]] of next.entries()) {
      const y = 1.7 + i * 0.95
      iconCircle(s, M, y, 0.62, await ic(icn, C.sodiumBright), '1B2C38')
      s.text({ x: M + 0.85, y: y - 0.02, w: 5.6, h: 0.34, paras: [t], bold: true, size: 15.5, color: 'FFFFFF' })
      s.text({ x: M + 0.85, y: y + 0.32, w: 5.6, h: 0.32, paras: [d], size: 12.5, color: 'A9BBC6' })
    }
    s.line({ x1: M, y1: 4.7, x2: M + 6.2, y2: 4.7, color: '2A3E4C', w: 1 })
    s.text({ x: M, y: 4.95, w: 6.6, h: 0.85, paras: ['Thank you'], font: FONT.head, bold: true, size: 44, color: 'FFFFFF', valign: 'middle' })
    s.text({ x: M, y: 5.85, w: 6.6, h: 0.5, paras: [[{ t: 'Physics. Simulated. ', c: C.sky }, { t: 'Understood.', c: C.sodiumBright }]], size: 22, bold: true })
    s.rect({ x: 8.45, y: 1.2, w: 3.4, h: 3.4, fill: 'FFFFFF', r: 0.16 })
    s.image({ x: 8.6, y: 1.35, w: 3.1, h: 3.1, path: qr })
    s.text({ x: 7.65, y: 4.8, w: 5.0, h: 0.42, paras: ['physilab.vercel.app'], font: FONT.mono, size: 19, color: C.sodiumBright, align: 'center' })
    s.text({ x: 7.65, y: 5.22, w: 5.0, h: 0.32, paras: ['Scan to try every experiment'], size: 13, color: 'A9BBC6', align: 'center' })
    s.text({ x: 7.65, y: 5.8, w: 5.0, h: 0.7, paras: [[{ t: 'Made by ', c: 'A9BBC6', b: false }, { t: CREDIT.name, c: 'FFFFFF' }], [{ t: CREDIT.role, c: C.sodiumBright, s: 12.5 }]], size: 15, bold: true, align: 'center' })
  }
}

// ───────────────────────── formulas → PNG ─────────────────────────
async function renderFormulas(browser) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 4 })
  const keys = Object.keys(FORMULAS)
  const html = `<!doctype html><html><head><meta charset="utf-8">${katexCss()}<style>body{margin:0;background:transparent}.f{display:inline-block;padding:3px 5px;margin:6px}</style></head><body>${keys
    .map((k) => `<div class="f" id="f-${k}" style="color:#${FORMULAS[k].color};font-size:${FORMULAS[k].size}px">${tex(FORMULAS[k].tex, false)}</div><br>`)
    .join('')}</body></html>`
  const file = path.join(IMG, 'formulas.html')
  fs.writeFileSync(file, html)
  await page.goto(fileUrl(file), { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  for (const k of keys) {
    const el = await page.$(`#f-${k}`)
    const box = await el.boundingBox()
    const out = path.join(IMG, `f-${k}.png`)
    await el.screenshot({ path: out, omitBackground: true })
    FORMULAS[k].path = out
    FORMULAS[k].w = box.width / 96
    FORMULAS[k].h = box.height / 96
  }
  await page.close()
}
/** Places a formula image inside its box: natural size, shrunk to fit, aligned. */
function placeFormula(it) {
  const f = FORMULAS[it.key]
  const k = Math.min(1, it.w / f.w, it.h / f.h)
  const w = f.w * k
  const h = f.h * k
  const x = it.align === 'left' ? it.x : it.x + (it.w - w) / 2
  return { x, y: it.y + (it.h - h) / 2, w, h, path: f.path }
}

// ───────────────────────── emit: pptx ─────────────────────────
function pptxRuns(it) {
  const out = []
  it.paras.forEach((p, pi) => {
    const rs = typeof p === 'string' ? [{ t: p }] : p
    rs.forEach((r, ri) => {
      out.push({
        text: r.t,
        options: {
          fontFace: r.f ?? it.font ?? FONT.body,
          fontSize: r.s ?? it.size ?? 14,
          color: r.c ?? it.color ?? C.ink,
          bold: r.b ?? it.bold ?? false,
          italic: r.i ?? it.italic ?? false,
          subscript: r.sub || undefined,
          charSpacing: it.cs,
          breakLine: ri === rs.length - 1 && pi < it.paras.length - 1,
          bullet: it.bullet ? { indent: 14 } : undefined,
          paraSpaceAfter: it.paraAfter,
          align: it.align ?? 'left',
        },
      })
    })
  })
  return out
}
async function writePptx() {
  const pres = new pptxgen()
  pres.layout = 'LAYOUT_WIDE'
  pres.author = CREDIT.name
  pres.company = 'PHYSILAB'
  pres.title = 'PHYSILAB: a virtual physics laboratory'
  pres.theme = { headFontFace: FONT.head, bodyFontFace: FONT.body }
  for (const sd of slides) {
    const s = pres.addSlide()
    s.background = sd.bg.image ? { path: sd.bg.image } : { color: sd.bg.color }
    for (const it of sd.items) {
      if (it.type === 'rect' || it.type === 'ellipse') {
        const shape = it.type === 'ellipse' ? pres.shapes.OVAL : it.r ? pres.shapes.ROUNDED_RECTANGLE : pres.shapes.RECTANGLE
        s.addShape(shape, {
          x: it.x,
          y: it.y,
          w: it.w,
          h: it.h,
          fill: it.fill ? { color: it.fill, transparency: it.transparency } : undefined,
          line: it.line ? { color: it.line, width: it.lineW ?? 0.75 } : { type: 'none' },
          rectRadius: it.type === 'rect' && it.r ? it.r : undefined,
          shadow: it.shadow ? { ...it.shadow } : undefined,
        })
      } else if (it.type === 'line') {
        s.addShape(pres.shapes.LINE, {
          x: Math.min(it.x1, it.x2),
          y: Math.min(it.y1, it.y2),
          w: Math.abs(it.x2 - it.x1),
          h: Math.abs(it.y2 - it.y1),
          line: { color: it.color, width: it.w, endArrowType: it.arrow ? 'triangle' : undefined },
        })
      } else if (it.type === 'image') {
        s.addImage(it.data ? { data: it.data, x: it.x, y: it.y, w: it.w, h: it.h } : { path: it.path, x: it.x, y: it.y, w: it.w, h: it.h })
      } else if (it.type === 'formula') {
        const p = placeFormula(it)
        s.addImage({ path: p.path, x: p.x, y: p.y, w: p.w, h: p.h, altText: FORMULAS[it.key].tex })
      } else if (it.type === 'text') {
        s.addText(pptxRuns(it), { x: it.x, y: it.y, w: it.w, h: it.h, margin: 0, valign: it.valign ?? 'top', align: it.align ?? 'left', isTextBox: true, wrap: true, fit: 'none' })
      } else if (it.type === 'table') {
        const hdr = it.head.map((t, i) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: C.prussian }, align: i === 4 ? 'right' : 'left' } }))
        const body = it.rows.map((row, ri) =>
          row.map((cell, ci) => {
            const fill = { color: ri % 2 ? 'FFFFFF' : 'F4F7F5' }
            if (Array.isArray(cell))
              return { text: cell.map((r) => ({ text: r.t, options: { subscript: r.sub || undefined, color: C.ink } })), options: { fill } }
            return {
              text: cell,
              options: { fill, color: ci === 4 ? C.ok : ci === 0 || ci === 2 ? C.ink3 : C.ink, fontFace: ci === 0 || ci === 2 || ci === 4 ? FONT.mono : FONT.body, align: ci === 4 ? 'right' : 'left', bold: ci === 1 },
            }
          }),
        )
        s.addTable([hdr, ...body], { x: it.x, y: it.y, colW: it.colW, rowH: it.rowH, fontFace: FONT.body, fontSize: 12, color: C.ink, valign: 'middle', margin: [0.03, 0.1, 0.03, 0.1], border: { type: 'solid', pt: 0.75, color: 'DDE3DF' } })
      } else if (it.type === 'chart') {
        s.addChart(pres.charts.BAR, [{ name: 'Error (%)', labels: it.labels, values: it.values }], {
          x: it.x,
          y: it.y,
          w: it.w,
          h: it.h,
          barDir: 'bar',
          chartColors: [C.ok],
          catAxisOrientation: 'maxMin',
          valAxisMinVal: 0,
          valAxisMaxVal: 2,
          valAxisMajorUnit: 0.5,
          valAxisLabelFormatCode: '0.0"%"',
          showValue: true,
          dataLabelPosition: 'outEnd',
          dataLabelFormatCode: '0.00"%"',
          dataLabelFontSize: 9,
          dataLabelColor: C.ink2,
          catAxisLabelFontSize: 9.5,
          catAxisLabelColor: C.ink2,
          catAxisLabelFontFace: FONT.body,
          valAxisLabelFontSize: 9,
          valAxisLabelColor: C.ink3,
          valGridLine: { color: 'E1E7E3', size: 0.75 },
          catGridLine: { style: 'none' },
          barGapWidthPct: 45,
          showLegend: false,
          showTitle: true,
          title: 'Error vs accepted value, % (instrument error on)',
          titleFontSize: 12,
          titleColor: C.ink,
          titleFontFace: FONT.body,
        })
      }
    }
    if (sd.notes) s.addNotes(sd.notes)
  }
  await pres.writeFile({ fileName: DECK })
}

// ───────────────────────── emit: HTML mirror ─────────────────────────
const PX = 96
const pt = (v) => `${v}pt`
const inch = (v) => `${(v * PX).toFixed(2)}px`
const src = (it) => (it.data ? `data:${it.data}` : fileUrl(it.path))
function htmlRuns(it, p) {
  const rs = typeof p === 'string' ? [{ t: p }] : p
  return rs
    .map((r) => {
      const st = [
        r.f && `font-family:'${r.f}'`,
        r.s && `font-size:${pt(r.s)}`,
        r.c && `color:#${r.c}`,
        r.b !== undefined && `font-weight:${r.b ? 700 : 400}`,
        r.i && 'font-style:italic',
      ]
        .filter(Boolean)
        .join(';')
      const t = r.t.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      return r.sub ? `<sub style="${st}">${t}</sub>` : `<span style="${st}">${t}</span>`
    })
    .join('')
}
function toHtml() {
  let body = ''
  slides.forEach((sd, si) => {
    let h = `<section class="slide" id="s${si + 1}" style="background:${sd.bg.image ? `url('${fileUrl(sd.bg.image)}') center/cover` : '#' + sd.bg.color}">`
    for (const it of sd.items) {
      const box = `left:${inch(it.x)};top:${inch(it.y)};width:${inch(it.w)};height:${inch(it.h)}`
      if (it.type === 'rect' || it.type === 'ellipse') {
        const sh = it.shadow ? `box-shadow:0 ${it.shadow.offset}pt ${it.shadow.blur}pt rgba(11,20,26,${it.shadow.opacity});` : ''
        h += `<div class="a" style="${box};${it.fill ? `background:#${it.fill};` : ''}${it.line ? `border:${pt(it.lineW ?? 0.75)} solid #${it.line};` : ''}border-radius:${it.type === 'ellipse' ? '50%' : it.r ? inch(it.r) : '0'};${sh}box-sizing:border-box"></div>`
      } else if (it.type === 'line') {
        const x = Math.min(it.x1, it.x2)
        const y = Math.min(it.y1, it.y2)
        const w = Math.max(Math.abs(it.x2 - it.x1), 0.001)
        const hh = Math.max(Math.abs(it.y2 - it.y1), 0.001)
        h += `<svg class="a" style="left:${inch(x)};top:${inch(y)};width:${inch(w)};height:${inch(hh)};overflow:visible"><line x1="${it.x1 === it.x2 ? 0 : 0}" y1="0" x2="${it.x1 === it.x2 ? 0 : w * PX}" y2="${it.y1 === it.y2 ? 0 : hh * PX}" stroke="#${it.color}" stroke-width="${it.w * 1.333}"/>${it.arrow ? `<polygon points="-5,${hh * PX - 8} 5,${hh * PX - 8} 0,${hh * PX}" fill="#${it.color}"/>` : ''}</svg>`
      } else if (it.type === 'image') {
        h += `<img class="a" style="${box}" src="${src(it)}">`
      } else if (it.type === 'formula') {
        const p = placeFormula(it)
        h += `<img class="a" style="left:${inch(p.x)};top:${inch(p.y)};width:${inch(p.w)};height:${inch(p.h)}" src="${fileUrl(p.path)}">`
      } else if (it.type === 'text') {
        const jc = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[it.valign ?? 'top']
        const st = `font-family:'${it.font ?? FONT.body}';font-size:${pt(it.size ?? 14)};color:#${it.color ?? C.ink};font-weight:${it.bold ? 700 : 400};${it.italic ? 'font-style:italic;' : ''}text-align:${it.align ?? 'left'};${it.cs ? `letter-spacing:${pt(it.cs)};` : ''}justify-content:${jc}`
        const paras = it.paras.map((p, i) => `<p style="margin:0 0 ${i < it.paras.length - 1 ? pt(it.paraAfter ?? 0) : 0} 0">${htmlRuns(it, p)}</p>`).join('')
        h += `<div class="a t" data-si="${si + 1}" style="${box};${st}"><div class="in">${paras}</div></div>`
      } else if (it.type === 'table') {
        const cols = it.colW.map((w) => `<col style="width:${inch(w)}">`).join('')
        const head = `<tr>${it.head.map((c, i) => `<th style="text-align:${i === 4 ? 'right' : 'left'}">${c}</th>`).join('')}</tr>`
        const rows = it.rows
          .map(
            (row, ri) =>
              `<tr style="background:${ri % 2 ? '#fff' : '#F4F7F5'}">${row
                .map((cell, ci) => {
                  const st = `${ci === 4 ? 'text-align:right;color:#2F7D4A;' : ''}${ci === 0 || ci === 2 || ci === 4 ? "font-family:'Consolas';" : ''}${ci === 0 || ci === 2 ? 'color:#6B7C85;' : ''}${ci === 1 ? 'font-weight:700;' : ''}`
                  return `<td style="${st}">${Array.isArray(cell) ? htmlRuns(it, cell.map((r) => ({ t: r.t, sub: r.sub }))) : cell}</td>`
                })
                .join('')}</tr>`,
          )
          .join('')
        h += `<table class="a tb" style="left:${inch(it.x)};top:${inch(it.y)}"><colgroup>${cols}</colgroup>${head}${rows}</table>`
      } else if (it.type === 'chart') {
        const n = it.values.length
        const rowH = ((it.h - 0.75) * PX) / n
        h += `<div class="a chart" style="${box}"><div class="ct">Error vs accepted value, % (instrument error on)</div>${it.labels
          .map(
            (l, i) =>
              `<div class="cr" style="top:${40 + i * rowH}px;height:${rowH}px"><span class="cl">${l}</span><span class="cb"><i style="width:${(it.values[i] / 2) * 100}%"></i><b style="left:${(it.values[i] / 2) * 100}%">${it.values[i].toFixed(2)}%</b></span></div>`,
          )
          .join('')}</div>`
      }
    }
    body += h + '</section>'
  })
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss()}
body{margin:0;background:#888}
.slide{position:relative;width:${W * PX}px;height:${H * PX}px;overflow:hidden;margin:0 0 20px 0}
.a{position:absolute;margin:0}
.t{display:flex;flex-direction:column;line-height:normal;white-space:pre-wrap;overflow:visible}
.t .in{width:100%}
.t.over{outline:2px solid red}
sub{vertical-align:sub;font-size:.7em;line-height:0}
.tb{border-collapse:collapse;table-layout:fixed;font-family:'Calibri';font-size:12pt;color:#13212B}
.tb th{background:#1D4E89;color:#fff;text-align:left;font-weight:700}
.tb th,.tb td{height:${0.39 * PX}px;padding:0 ${0.1 * PX}px;border:0.75pt solid #DDE3DF;box-sizing:border-box}
.chart{font-family:'Calibri'}
.chart .ct{position:absolute;left:0;right:0;top:6px;text-align:center;font-size:12pt;color:#13212B}
.chart .cr{position:absolute;left:0;right:0;display:flex;align-items:center;font-size:9.5pt;color:#44565F}
.chart .cl{width:2.3in;text-align:right;padding-right:8px;white-space:nowrap}
.chart .cb{flex:1;position:relative;height:60%;margin-right:.6in}
.chart .cb i{display:block;height:100%;background:#2F7D4A}
.chart .cb b{position:absolute;top:0;font-weight:400;font-size:9pt;margin-left:4px;color:#44565F}
</style></head><body>${body}</body></html>`
}

// ───────────────────────── run ─────────────────────────
await build()
if (slides.length !== TOTAL) throw new Error(`expected ${TOTAL} slides, built ${slides.length}`)
await withBrowser(async (browser) => {
  await renderFormulas(browser)
  await writePptx()
  const file = path.join(BUILD, 'deck-preview.html')
  fs.writeFileSync(file, toHtml())
  const page = await browser.newPage()
  await page.setViewport({ width: Math.round(W * PX), height: Math.round(H * PX), deviceScaleFactor: 1.5 })
  await page.goto(fileUrl(file), { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  const over = await page.evaluate(() => {
    const bad = []
    for (const t of document.querySelectorAll('.t')) {
      const inner = t.firstElementChild
      if (inner.scrollHeight > t.clientHeight + 1 || inner.scrollWidth > t.clientWidth + 1) {
        t.classList.add('over')
        bad.push(`slide ${t.dataset.si}: "${t.textContent.slice(0, 50)}" ${inner.scrollWidth}x${inner.scrollHeight} > ${t.clientWidth}x${t.clientHeight}`)
      }
    }
    return bad
  })
  if (over.length) console.warn('TEXT OVERFLOW\n' + over.join('\n'))
  for (let i = 1; i <= slides.length; i++) {
    const el = await page.$(`#s${i}`)
    await el.screenshot({ path: path.join(PREVIEW, `slide-${String(i).padStart(2, '0')}.png`) })
  }
  await page.close()
})
console.log('wrote', DECK, fs.statSync(DECK).size, 'bytes')
