// Poster 2: the physics inside PHYSILAB (method, six featured laws, all 22 results).
import { CREDIT, byId, esc, icon, katexCss, results, tex } from './lib.mjs'
import { BASE_CSS, LOGO, QR, src } from './poster-shared.mjs'

export const AREA = {
  mechanics: ['Mechanics', '#1d4e89'],
  optics: ['Optics', '#7a4fb3'],
  electromagnetism: ['Electricity & magnetism', '#b3261e'],
  waves: ['Waves & acoustics', '#0f7c86'],
  modern: ['Modern physics', '#d98309'],
  semiconductor: ['Semiconductors', '#2f7d4a'],
}

export const SHORT = {
  pendulum: 'Simple pendulum',
  projectile: 'Projectile motion',
  'ohms-law': "Ohm's law",
  faraday: "Faraday's law",
  'double-slit': "Young's double slit",
  photoelectric: 'Photoelectric effect',
  'newtons-rings': "Newton's rings",
  'diffraction-grating': 'Diffraction grating',
  'malus-law': "Malus' law",
  sonometer: 'Sonometer',
  'rc-circuit': 'RC circuit',
  'planck-led': "Planck's constant (LEDs)",
  'band-gap': 'Energy gap of a diode',
  'hall-effect': 'Hall effect',
  'fermi-energy': 'Fermi energy of copper',
  'laser-wavelength': 'Wavelength of a laser',
  'optical-fiber': 'Optical fibre NA',
  'four-probe': 'Four-probe energy gap',
  'lcr-resonance': 'Series LCR resonance',
  'black-box': 'Black-box components',
  photodiode: 'Photodiode responsivity',
  'dielectric-constant': 'Dielectric constant',
}

export const fmt = (v, d = 4) => {
  const s = Number(v).toPrecision(d)
  return s.includes('e') ? Number(v).toExponential(d - 1) : s
}
export const pct = (e) => `${e < 1 ? e.toFixed(2) : e.toFixed(1)}%`

const SUP = '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'
const supToTex = (e) => [...e].map((c) => (SUP.indexOf(c) === 0 ? '-' : String(SUP.indexOf(c) - 1))).join('')
/** Converts a display unit such as "×10⁻³⁴ J s" or "m s⁻²" to KaTeX. */
export const unitTex = (u) =>
  u
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => {
      const pow = t.match(/^×10([⁻⁰-⁹¹²³]+)$/)
      if (pow) return `\\times10^{${supToTex(pow[1])}}`
      const m = t.match(/^(.*?)([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/)
      const base = (m ? m[1] : t).replace(/Ω/g, '\\Omega').replace(/µ/g, '\\mu ').replace(/°/g, '^\\circ').replace(/%/g, '\\%')
      return `\\mathrm{${base}}${m ? `^{${supToTex(m[2])}}` : ''}`
    })
    .reduce((acc, t, i, all) => (i === 0 ? t : acc + (all[i - 1].startsWith('\\times') ? '\\ ' : '\\,') + t), '')
/** "h = 6.564 × 10⁻³⁴ J s" as KaTeX, with a thin space before plain units and none before ×10ⁿ. */
export const withUnit = (value, unit) => {
  const u = unit.trim() ? unitTex(unit) : ''
  return `${value}${u ? (u.startsWith('\\times') ? '' : '\\ ') + u : ''}`
}
export const measured = (r, d = 4) => `${r.symbol} = ${withUnit(fmt(r.value, d), r.unit)}`

export async function posterTwo() {
  const CROPS = { sonometer: [40, 40, 960, 540] }
  const card = async (id, law, plot, extra = '') => {
    const e = byId(id)
    return { e, r: e.results[0], law, plot, extra, img: await src(`canvas-${id}`, { crop: CROPS[id], width: 1100 }) }
  }
  const lcrQ = byId('lcr-resonance').results.find((r) => r.label.startsWith('Quality'))
  const featured = [
    await card('projectile', 'R = \\dfrac{v_0^2 \\sin 2\\theta}{g}', 'R vs v₀² sin 2θ → slope = 1/g'),
    await card('newtons-rings', 'D_n^2 = 4n\\lambda R', 'D² vs ring number n → slope = 4λR'),
    await card('lcr-resonance', 'f_0 = \\dfrac{1}{2\\pi\\sqrt{LC}}', 'I vs f → resonance peak, half-power width', `Q = ${fmt(lcrQ.value, 3)}`),
    await card('sonometer', 'f = \\dfrac{1}{2L}\\sqrt{\\dfrac{T}{\\mu}}', 'L vs 1/f → slope = v/2'),
    await card('photoelectric', 'eV_0 = h\\nu - \\phi', 'V₀ vs ν → slope = h/e'),
    await card('four-probe', '\\rho = A\\,e^{E_g/2kT}', 'ln ρ vs 1/T → slope = E_g/2k'),
  ]
  const hero = await src('canvas-double-slit', { width: 1600 })
  const pend = byId('pendulum').results[0]
  const chips = [
    ['pendulum', 'g', 3],
    ['planck-led', 'h', 3],
    ['newtons-rings', '\\lambda_{\\mathrm{Na}}', 4],
    ['four-probe', 'E_g(\\mathrm{Ge})', 3],
  ].map(([id, sym, d]) => {
    const r = byId(id).results[0]
    return tex(`${sym} = ${withUnit(fmt(r.value, d), r.unit)}`)
  })
  const chain = [
    { t: 'Physical law', tex: '\\ddot\\theta = -\\dfrac{g}{L}\\sin\\theta', d: 'The exact equation of motion, not the small-angle shortcut.' },
    { t: 'Numerical model', tex: 'T \\approx T_0\\left(1 + \\dfrac{\\theta_0^2}{16}\\right)', d: 'Solved with 4th-order Runge–Kutta, so wide swings really do run slow.' },
    { t: 'Virtual instrument', tex: 't_{10} \\pm 0.1\\ \\mathrm{s}', d: 'T is timed from zero crossings, with reaction time and a 0.01 s least count.' },
    { t: 'Graph & fit', tex: 'T^2 = \\dfrac{4\\pi^2}{g}\\,L', d: `A least-squares line through ${byId('pendulum').n} readings gives slope ± standard error.` },
    { t: 'Physical constant', tex: `g = ${fmt(pend.value, 3)} \\pm ${fmt(pend.uncertainty, 1)}\\ \\mathrm{m\\,s^{-2}}`, d: `Accepted 9.81 m s⁻²: ${pct(pend.err)} error. Earned, not looked up.` },
  ]
  const effects = ['Large-amplitude period', 'Reaction time', 'Least count', 'Meter noise', 'Stray light', 'T³ term in diode current', 'Coil resistance', 'Dark current']
  const rows = results.map((e) => ({ e, r: e.results.find((x) => x.err != null) }))
  const maxErr = 2

  return `<!doctype html><html><head><meta charset="utf-8">${katexCss()}<style>${BASE_CSS}
.hero{height:95mm;flex:none;position:relative;padding:11mm 14mm 0}
.topbar{display:flex;align-items:center;gap:2.6mm}
.topbar .logo{width:8mm;height:8mm}
.topbar b{font-family:Bricolage;font-weight:700;font-size:13pt;letter-spacing:-.01em;color:#fff}
.topbar .right{margin-left:auto;font-family:PlexMono;font-size:8pt;letter-spacing:.14em;color:#8fa6b4;text-transform:uppercase}
.h-left{position:absolute;left:14mm;top:25mm;width:150mm}
h1.title{font-family:Bricolage;font-weight:800;font-size:34pt;line-height:1;letter-spacing:-.03em;color:#f4f7f8;margin-top:3mm}
h1.title em{font-style:normal;color:var(--sodium-bright)}
.intro{margin-top:4mm;font-size:11pt;line-height:1.5;color:#c3d0d8}
.intro b{color:#fff;font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:1.8mm;margin-top:5mm}
.chips>span{font-size:9.5pt;color:#f6d7a6;border:.3mm solid #4a3a20;background:rgba(242,169,59,.08);border-radius:1.6mm;padding:.9mm 2.4mm}
.chips .katex{font-size:1em}
.h-right{position:absolute;right:14mm;top:22mm;width:97mm}
.h-right .img{border-radius:2.4mm;overflow:hidden;border:.3mm solid #2b3d49;box-shadow:0 0 12mm rgba(242,190,60,.18)}
.h-right img{display:block;width:100%}
.h-right .cap{font-size:8.2pt;color:#93a8b5;margin-top:2.4mm;line-height:1.45}
.h-right .cap .katex{font-size:1em;color:#dfe8ee}

section{padding:0 14mm;flex:none;overflow:hidden}
.sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10mm}
.sec-head h2{white-space:nowrap;font-family:Bricolage;font-weight:700;font-size:23pt;letter-spacing:-.025em;line-height:1.05;margin-top:1.6mm}
.sec-head p{font-size:10pt;color:var(--ink2);max-width:112mm;text-align:right}

.method{height:75mm;padding-top:6mm}
.chain{display:grid;grid-template-columns:1fr 5mm 1fr 5mm 1fr 5mm 1fr 5mm 1fr;align-items:stretch;margin-top:5mm}
.node{padding:3.2mm 3.2mm 3mm;display:flex;flex-direction:column}
.node .top{display:flex;align-items:center;gap:1.8mm}
.node .n{width:6.4mm;height:6.4mm;border-radius:50%;background:var(--prussian);color:#fff;font-family:Bricolage;font-weight:800;font-size:10pt;display:flex;align-items:center;justify-content:center;flex:none}
.node.last .n{background:var(--sodium)}
.node h3{font-family:Bricolage;font-weight:700;font-size:11pt;letter-spacing:-.01em;line-height:1.1}
.node .eq{height:11mm;display:flex;align-items:center;justify-content:center;margin-top:2mm;background:var(--paper);border-radius:1.6mm;font-size:9.5pt}
.node.last .eq{background:var(--sodium-soft);font-size:8.4pt}
.node p{font-size:8.4pt;color:var(--ink2);line-height:1.36;margin-top:1.8mm}
.arrow{display:flex;align-items:center;justify-content:center;color:var(--sodium)}
.effects{display:flex;flex-wrap:nowrap;align-items:center;gap:1.4mm;margin-top:3mm;white-space:nowrap}
.effects b{font-size:8.6pt;color:var(--ink);font-weight:600;margin-right:1mm}
.effects span{font-size:8pt;color:var(--prussian);background:var(--prussian-soft);border-radius:10mm;padding:.5mm 2.2mm}

.featured{height:133mm;padding-top:5mm}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:4mm 6mm;margin-top:4.5mm}
.fcard{display:grid;grid-template-columns:57mm 1fr;height:33mm;overflow:hidden}
.fcard .pic{background:#fff;border-right:.3mm solid var(--line);overflow:hidden}
.fcard .pic img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
.fcard .txt{padding:2.4mm 3.4mm 2.2mm;display:flex;flex-direction:column;min-width:0}
.fcard .area{font-family:PlexMono;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;font-weight:500}
.fcard h3{font-family:Bricolage;font-weight:700;font-size:12pt;letter-spacing:-.015em;line-height:1.1;margin-top:.6mm}
.fcard .law{margin-top:.6mm;font-size:9.6pt;height:9mm;display:flex;align-items:center}
.fcard .plot{font-family:PlexMono;font-size:7.2pt;color:var(--ink3)}
.fcard .res{margin-top:auto;display:flex;align-items:center;gap:2mm;flex-wrap:nowrap}
.fcard .res .v{font-size:9.6pt;color:var(--ink);white-space:nowrap}
.fcard .res .v .katex{font-size:1.02em}
.fcard .res .x{font-size:8.4pt;color:var(--ink2);white-space:nowrap}
.pill{font-family:PlexMono;font-size:7.4pt;background:var(--ok-soft);color:var(--ok);border-radius:1mm;padding:.35mm 1.5mm;white-space:nowrap}

.results{height:81mm;padding-top:5mm}
.rgrid{display:grid;grid-template-columns:1fr 1fr;gap:0 8mm;margin-top:4mm}
.row{display:grid;grid-template-columns:6mm 40mm 1fr 30mm 11mm;align-items:center;height:4.6mm;border-bottom:.25mm solid #e1e7e3;font-size:8.4pt}
.row .no{font-family:PlexMono;font-size:7.6pt;color:var(--ink3)}
.row .nm{display:flex;align-items:center;gap:1.4mm;white-space:nowrap}
.row .dot{width:1.8mm;height:1.8mm;border-radius:50%;background:var(--sodium);flex:none}
.row .dot.off{background:transparent;border:.25mm solid #c9d3d8}
.row .ms{white-space:nowrap;overflow:hidden}
.row .ms .katex{font-size:.98em}
.row .bar{height:2.2mm;background:#e8edea;border-radius:1mm;overflow:hidden;margin-right:2mm}
.row .bar i{display:block;height:100%;background:linear-gradient(90deg,#2f7d4a,#58a86f);border-radius:1mm}
.row .er{font-family:PlexMono;font-size:7.8pt;text-align:right;color:var(--ok)}
.legend{display:flex;gap:6mm;align-items:center;margin-top:2.6mm;font-size:8pt;color:var(--ink3)}
.legend .dot{display:inline-block;width:1.8mm;height:1.8mm;border-radius:50%;background:var(--sodium);margin-right:1.2mm;vertical-align:middle}

.foot{margin-top:auto;flex:none;height:36mm;padding:0 14mm;display:grid;grid-template-columns:27mm 1fr 1.25fr auto;gap:7mm;align-items:center}
.foot .qrbox{width:27mm;height:27mm}
.foot h3{font-family:Bricolage;font-weight:700;font-size:17pt;letter-spacing:-.02em;color:#fff;line-height:1.1}
.foot .url{font-family:PlexMono;font-size:12pt;color:var(--sodium-bright);margin-top:1.6mm}
.foot p{font-size:8.8pt;color:#a9bbc6;margin-top:1.4mm;line-height:1.45}
.foot .tech b{color:#e3eaee;font-weight:600}
.credit{text-align:right;padding-left:7mm;border-left:.3mm solid #2a3e4c}
.credit .label{font-family:PlexMono;font-size:8pt;letter-spacing:.18em;color:#8fa6b4;text-transform:uppercase}
.credit .name{font-size:21pt;color:#fff;margin-top:1mm;line-height:1.05}
.credit .role{font-size:10pt;color:var(--sodium-bright);margin-top:1mm}
</style></head><body><div class="sheet">

<div class="hero dark grid-dark" data-fit="hero">
  <div class="topbar"><div class="logo">${LOGO}</div><b>PHYSILAB</b><span class="right">Physics poster · 2 of 2</span></div>
  <div class="h-left">
    <div class="eyebrow">Engineering physics · 22 experiments · 1BPHS102C lab</div>
    <h1 class="title">Nature's constants,<br>measured in a <em>virtual lab</em></h1>
    <p class="intro">PHYSILAB rebuilds 22 engineering-physics experiments from their <b>governing laws</b>. Every reading is computed from the physics, with the imperfections of <b>real instruments</b>, so each constant a student finds is earned, never looked up.</p>
    <div class="chips">${chips.map((c) => `<span>${c}</span>`).join('')}</div>
  </div>
  <div class="h-right"><div class="img"><img src="${hero}"></div>
    <div class="cap">Young's double slit: the fringes are drawn from the Fraunhofer intensity ${tex('I = \\cos^2\\!\\big(\\tfrac{\\pi d\\sin\\theta}{\\lambda}\\big)\\,\\mathrm{sinc}^2\\!\\big(\\tfrac{\\pi a\\sin\\theta}{\\lambda}\\big)')} and measured with a virtual micrometer.</div></div>
</div>

<section class="method grid-paper" data-fit="method">
  <div class="sec-head">
    <div><div class="eyebrow">The method · worked example: simple pendulum</div><h2 class="display">Don't fake the physics</h2></div>
    <p>A reading is never looked up from a formula. It is <b>measured</b> from a simulation of the full physical law, just as on the real apparatus.</p>
  </div>
  <div class="chain">
    ${chain
      .map(
        (c, i) =>
          `${i ? `<div class="arrow">${icon('ChevronRight', { size: 20, stroke: 2.6 })}</div>` : ''}<div class="node panel ${i === chain.length - 1 ? 'last' : ''}" data-fit="node${i}"><div class="top"><span class="n">${i + 1}</span><h3>${c.t}</h3></div><div class="eq">${tex(c.tex)}</div><p>${c.d}</p></div>`,
      )
      .join('')}
  </div>
  <div class="effects"><b>Real-lab effects built into the models:</b>${effects.map((x) => `<span>${x}</span>`).join('')}</div>
</section>

<section class="featured" data-fit="featured">
  <div class="sec-head">
    <div><div class="eyebrow">Six areas of physics</div><h2 class="display">One law, one graph, one constant</h2></div>
    <p>Each experiment turns its law into a straight line or a resonance peak. The graph, not a formula, gives the result.</p>
  </div>
  <div class="fgrid">
    ${featured
      .map(
        (f) => `<div class="fcard panel" data-fit="${f.e.id}"><div class="pic"><img src="${f.img}"></div><div class="txt">
      <div class="area" style="color:${AREA[f.e.category][1]}">${AREA[f.e.category][0]} · ${f.e.number}</div>
      <h3>${esc(SHORT[f.e.id])}</h3>
      <div class="law">${tex(f.law)}</div>
      <div class="plot">${esc(f.plot)}</div>
      <div class="res"><span class="v">${tex(measured(f.r))}</span>${f.extra ? `<span class="x">${tex(f.extra)}</span>` : ''}<span class="pill">${pct(f.r.err)} error</span></div>
    </div></div>`,
      )
      .join('')}
  </div>
</section>

<section class="results grid-paper" data-fit="results">
  <div class="sec-head">
    <div><div class="eyebrow">Measured vs accepted · instrument error switched on</div><h2 class="display">All 22 experiments land within 2%</h2></div>
    <p>Each value comes from the experiment's own analysis of a full set of simulated readings. Bars show |measured − accepted| / accepted.</p>
  </div>
  <div class="rgrid">
    ${[rows.slice(0, 11), rows.slice(11)]
      .map(
        (col) =>
          `<div>${col
            .map(
              ({ e, r }) =>
                `<div class="row" data-fit="row${e.number}"><span class="no">${e.number}</span><span class="nm"><i class="dot ${e.syllabus ? '' : 'off'}"></i>${esc(SHORT[e.id])}</span><span class="ms">${tex(measured(r))}</span><span class="bar"><i style="width:${Math.max(1.5, (r.err / maxErr) * 100).toFixed(1)}%"></i></span><span class="er">${pct(r.err)}</span></div>`,
            )
            .join('')}</div>`,
      )
      .join('')}
  </div>
  <div class="legend"><span><i class="dot"></i>In the 1BPHS102C lab syllabus: all 10 are included</span><span>Bar scale: 0 to 2% error</span></div>
</section>

<div class="foot dark grid-dark">
  <div class="qrbox">${QR}</div>
  <div><h3>Try every experiment</h3><div class="url">physilab.vercel.app</div><p>Free, in any browser, on a laptop or a phone.</p></div>
  <div class="tech"><div class="eyebrow">How it is built · briefly</div><p>A <b>React + TypeScript</b> web app. The same physics code draws the <b>Canvas</b> animation and produces every reading: RK4 integration, exact interference and circuit laws, and least-squares fits with standard errors.</p></div>
  <div class="credit"><div class="label">Made by</div><div class="name">${CREDIT.name}</div><div class="role">${CREDIT.role}</div></div>
</div>
</div></body></html>`
}
