// Builds the two A3 posters (HTML → PDF + PNG) from the screenshots and results.
// Usage: node posters.mjs [1|2]
import fs from 'node:fs'
import path from 'node:path'
import { BUILD, CREDIT, OUT, esc, icon, katexCss, render, withBrowser } from './lib.mjs'
import { BASE_CSS, LOGO, QR, frame, src } from './poster-shared.mjs'
import { posterTwo } from './poster2.mjs'

// ───────────────────────────── Poster 1: the project ─────────────────────────────
async function posterOne() {
  const CROP = (top = 30, h = 1500) => [500, top, 2340, h]
  const steps = [
    { n: 1, t: 'Choose an experiment', d: '22 experiments in six areas of physics. One tap filters the 1BPHS102C lab syllabus.', img: await src('syllabus', { crop: CROP(40), width: 1400 }), url: 'physilab.vercel.app/experiments', icon: 'LayoutGrid' },
    { n: 2, t: 'Aim & theory', d: 'Aim, derivations, formulas, variables and apparatus: the physics before the practical.', img: await src('theory', { crop: CROP(20), width: 1400 }), url: '…/experiments/pendulum', icon: 'BookOpen' },
    { n: 3, t: 'Lab bench', d: 'Apparatus animated by the real equations; readings carry realistic instrument error.', img: await src('lab-pendulum', { crop: CROP(20), width: 1400 }), url: '…/experiments/pendulum/lab', icon: 'FlaskConical' },
    { n: 4, t: 'Analysis', d: 'Graph plotted and fitted automatically; the slope gives the constant ± uncertainty.', img: await src('analysis-photoelectric', { crop: CROP(30), width: 1400 }), url: '…/photoelectric/analysis', icon: 'ChartLine' },
    { n: 5, t: 'Viva', d: 'Eight explained viva questions per experiment; missed ones come back first.', img: await src('viva', { crop: CROP(20), width: 1400 }), url: '…/experiments/pendulum/viva', icon: 'GraduationCap' },
    { n: 6, t: 'Lab record', d: 'A printable report: aim, theory, observations, graph, calculations and result.', img: await src('report', { crop: [820, 20, 1720, 1100], width: 1400 }), url: '…/experiments/pendulum/report', icon: 'FileText' },
  ]
  const hero = await src('home-dark', { width: 2200 })
  const assistant = await src('assistant', { crop: [0, 0, 2256, 440], width: 1800 })
  const chat = await src('chat', { crop: [36, 604, 664, 300], width: 900 })
  const stats = [
    ['22', 'experiments'],
    ['6', 'areas of physics'],
    ['10/10', '1BPHS102C lab experiments'],
    ['176', 'viva questions'],
    ['< 2%', 'error vs accepted values'],
  ]

  const html = `<!doctype html><html><head><meta charset="utf-8">${katexCss()}<style>${BASE_CSS}
.hero{height:136mm;position:relative;padding:11mm 14mm 0}
.topbar{display:flex;align-items:center;gap:2.6mm}
.topbar .logo{width:8mm;height:8mm}
.topbar b{font-family:Bricolage;font-weight:700;font-size:13pt;letter-spacing:-.01em;color:#fff}
.topbar .right{margin-left:auto;font-family:PlexMono;font-size:8pt;letter-spacing:.14em;color:#8fa6b4;text-transform:uppercase}
.h-left{position:absolute;left:14mm;top:27mm;width:128mm}
h1.big{font-family:Bricolage;font-weight:800;font-size:74pt;line-height:.92;letter-spacing:-.035em;color:#f4f7f8;margin-top:3mm}
.tag{font-family:Bricolage;font-weight:600;font-size:23pt;letter-spacing:-.02em;margin-top:4mm;color:var(--sky)}
.tag em{font-style:normal;color:var(--sodium-bright)}
.intro{margin-top:4.5mm;font-size:12pt;line-height:1.5;color:#c3d0d8;width:122mm}
.pills{display:flex;flex-wrap:wrap;gap:1.8mm;margin-top:5mm}
.pills span{font-size:8.5pt;color:#dbe5ea;border:.3mm solid #2f4452;background:rgba(255,255,255,.04);border-radius:10mm;padding:1mm 3mm}
.h-right{position:absolute;right:14mm;top:24mm;width:128mm}
.h-right .glow{position:absolute;inset:-8mm;background:radial-gradient(closest-side,rgba(242,169,59,.20),transparent 70%);z-index:0}
.h-right .frame{position:relative;z-index:1}
.stats{position:absolute;left:14mm;right:14mm;bottom:0;height:22mm;display:grid;grid-template-columns:repeat(5,1fr);border-top:.3mm solid #26394a}
.stats div{padding:3.4mm 0 0 0}
.stats div+div{padding-left:5mm;border-left:.3mm solid #26394a}
.stats b{display:block;font-family:Bricolage;font-weight:700;font-size:22pt;line-height:1;color:#fff;letter-spacing:-.02em}
.stats div:nth-child(3) b,.stats div:nth-child(5) b{color:var(--sodium-bright)}
.stats span{display:block;margin-top:1.4mm;font-size:8.5pt;color:#9fb2bf}

section{padding:0 14mm}
.sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10mm}
.sec-head h2{white-space:nowrap;font-family:Bricolage;font-weight:700;font-size:25pt;letter-spacing:-.025em;line-height:1.05;margin-top:1.6mm}
.sec-head p{font-size:10.5pt;color:var(--ink2);max-width:118mm;text-align:right}
.steps{height:156mm;padding-top:8mm}
.stepgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:5.5mm 6mm;margin-top:6mm}
.step{position:relative;overflow:hidden;display:flex;flex-direction:column;height:58mm}
.step .shot{height:33mm;overflow:hidden;border-bottom:.3mm solid var(--line);background:#f3f5f2;position:relative}
.step .shot img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}
.step .body{padding:3.2mm 3.8mm 0 3.8mm;flex:1}
.step .num{position:absolute;top:27.5mm;left:3.8mm;width:10mm;height:10mm;border-radius:50%;background:var(--sodium);color:#fff;font-family:Bricolage;font-weight:800;font-size:15pt;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 1.2mm #fff}
.step h3{font-family:Bricolage;font-weight:700;font-size:13.5pt;letter-spacing:-.015em;margin-left:12.5mm;line-height:1.1;display:flex;align-items:center;gap:1.6mm;color:var(--ink)}
.step h3 svg{color:var(--prussian)}
.step p{font-size:9.4pt;line-height:1.42;color:var(--ink2);margin-top:2.6mm}
.flow{display:flex;align-items:center;gap:1.4mm;font-family:PlexMono;font-size:8pt;color:var(--ink3);letter-spacing:.06em}
.flow b{color:var(--prussian);font-weight:500}

.helpers{height:82mm;padding-top:7mm}
.helpgrid{display:grid;grid-template-columns:1.45fr 1.15fr .85fr;gap:6mm;margin-top:5mm;height:55mm}
.help{padding:3.6mm 4mm;overflow:hidden}
.help h3{font-family:Bricolage;font-weight:700;font-size:13pt;letter-spacing:-.015em;display:flex;align-items:center;gap:1.8mm}
.help h3 .ic{width:7mm;height:7mm;border-radius:50%;background:var(--sodium-soft);color:var(--sodium);display:flex;align-items:center;justify-content:center}
.help p{font-size:9.2pt;color:var(--ink2);line-height:1.42;margin-top:1.8mm}
.help .shot{margin-top:2.6mm;border:.3mm solid var(--line);border-radius:1.8mm;overflow:hidden}
.help .shot img{display:block;width:100%}
.help .shot.fixed{height:25mm}
.help .shot.fixed img{height:100%;object-fit:cover;object-position:center}
.help hr{border:0;border-top:.3mm solid var(--line);margin:3mm 0}
.q{display:flex;gap:1.2mm;margin-top:2mm}
.q span{font-family:PlexMono;font-size:7pt;padding:.5mm 1.6mm;border-radius:1mm}

.foot{margin-top:auto;height:46mm;padding:0 14mm;display:grid;grid-template-columns:34mm 1fr 1fr auto;gap:7mm;align-items:center}
.foot .qrbox{width:34mm;height:34mm}
.foot h3{font-family:Bricolage;font-weight:700;font-size:19pt;letter-spacing:-.02em;color:#fff;line-height:1.1}
.foot .url{font-family:PlexMono;font-size:13pt;color:var(--sodium-bright);margin-top:1.6mm}
.foot p{font-size:9pt;color:#a9bbc6;margin-top:1.6mm;line-height:1.45}
.foot .tech b{color:#e3eaee;font-weight:600}
.credit{text-align:right;padding-left:7mm;border-left:.3mm solid #2a3e4c}
.credit .label{font-family:PlexMono;font-size:8pt;letter-spacing:.18em;color:#8fa6b4;text-transform:uppercase}
.credit .name{font-size:22pt;color:#fff;margin-top:1mm;line-height:1.05}
.credit .role{font-size:10pt;color:var(--sodium-bright);margin-top:1mm}
</style></head><body><div class="sheet">

<div class="hero dark grid-dark">
  <div class="topbar"><div class="logo">${LOGO}</div><b>PHYSILAB</b><span class="right">Project poster · 1 of 2</span></div>
  <div class="h-left">
    <div class="eyebrow">Virtual physics laboratory · Engineering physics</div>
    <h1 class="big">PHYSILAB</h1>
    <div class="tag">Physics. Simulated. <em>Understood.</em></div>
    <p class="intro">An interactive virtual laboratory where engineering students <b style="color:#fff;font-weight:600">perform, analyse and understand</b> physics experiments: from the simple pendulum to the Hall effect, in any web browser.</p>
    <div class="pills"><span>Free &amp; open</span><span>No install · no login</span><span>Laptop, tablet or phone</span></div>
  </div>
  <div class="h-right"><div class="glow"></div>${frame('physilab.vercel.app', hero, 'darkframe')}</div>
  <div class="stats">${stats.map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join('')}</div>
</div>

<section class="steps grid-paper">
  <div class="sec-head">
    <div><div class="eyebrow">How it works · step by step</div><h2 class="display">From aim to lab record in six steps</h2></div>
    <p>Every experiment follows the same scientific sequence, so students learn the <b>method</b> of experimental physics, not just the menu.</p>
  </div>
  <div class="stepgrid">
    ${steps
      .map(
        (s) => `<div class="step panel" data-fit="step${s.n}"><div class="shot"><img src="${s.img}"></div><div class="num">${s.n}</div>
      <div class="body"><h3>${s.t}</h3><p>${s.d}</p></div></div>`,
      )
      .join('')}
  </div>
</section>

<section class="helpers">
  <div class="sec-head">
    <div><div class="eyebrow">Built-in help</div><h2 class="display">A lab partner that checks your work</h2></div>
    <p>All rule-based: no online AI, and nothing leaves the device. Every hint comes from the physics of the experiment itself.</p>
  </div>
  <div class="helpgrid">
    <div class="help panel" data-fit="assistant">
      <h3><span class="ic">${icon('Sparkles', { size: 15 })}</span>Lab Assistant</h3>
      <p>Checks every reading as you take it: flags outliers with a statistical residual test, warns about large swings or a narrow range, and suggests the next reading.</p>
      <div class="shot"><img src="${assistant}"></div>
    </div>
    <div class="help panel" data-fit="chat">
      <h3><span class="ic">${icon('MessageCircleQuestion', { size: 15 })}</span>Ask PHYSILAB</h3>
      <p>Answers theory and viva questions from PHYSILAB's own notes, and solves quick numericals step by step.</p>
      <div class="shot fixed"><img src="${chat}"></div>
    </div>
    <div class="help panel" data-fit="viva">
      <h3><span class="ic">${icon('Repeat', { size: 15 })}</span>Adaptive viva</h3>
      <p>Missed questions come first, then new, then review.</p>
      <div class="q"><span style="background:#f8dcda;color:#9b2a22">missed</span><span style="background:var(--sodium-soft);color:#9a5c05">new</span><span style="background:var(--ok-soft);color:var(--ok)">review</span></div>
      <hr>
      <h3><span class="ic">${icon('CircleHelp', { size: 15 })}</span>Page guide</h3>
      <p>A short tour of any page, on request.</p>
    </div>
  </div>
</section>

<div class="foot dark grid-dark">
  <div class="qrbox">${QR}</div>
  <div><h3>Scan to open the lab</h3><div class="url">physilab.vercel.app</div><p>Works on any laptop or phone. Your notebook is saved in the browser.</p></div>
  <div class="tech"><div class="eyebrow">Under the hood · briefly</div><p><b>React + TypeScript</b> web app · <b>HTML Canvas</b> animations · <b>KaTeX</b> equations. The physics engine is written from scratch: RK4 integration and least-squares fits with standard errors.</p></div>
  <div class="credit"><div class="label">Made by</div><div class="name">${CREDIT.name}</div><div class="role">${CREDIT.role}</div></div>
</div>
</div></body></html>`
  return html
}

// ───────────────────────────── build ─────────────────────────────
const which = process.argv[2]
const jobs = [
  { n: '1', build: posterOne, name: 'PHYSILAB-Poster-1-How-It-Works-A3' },
  { n: '2', build: posterTwo, name: 'PHYSILAB-Poster-2-The-Physics-A3' },
]
await withBrowser(async (browser) => {
  for (const j of jobs.filter((j) => !which || j.n === which)) {
    const html = await j.build()
    const file = path.join(BUILD, `${j.name}.html`)
    fs.writeFileSync(file, html)
    const o = await render(browser, file, { widthMm: 297, heightMm: 420, pdf: path.join(OUT, `${j.name}.pdf`), png: path.join(OUT, `${j.name}.png`), dpi: 200 })
    console.log(j.name, o.length ? 'OVERFLOW' : 'ok')
  }
})
