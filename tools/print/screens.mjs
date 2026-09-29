// Captures high-resolution screenshots of PHYSILAB for the posters and the deck.
// Usage: node screens.mjs  (needs the dev server on http://localhost:5173)
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'
import { seedNotebook } from './seed.mjs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://localhost:5173'
const OUT = path.resolve(import.meta.dirname, '../../deliverables/screens')
fs.mkdirSync(OUT, { recursive: true })
// Optional name prefixes: `node screens.mjs chat canvas-` re-shoots only those.
const only = process.argv.slice(2)

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars', '--force-color-profile=srgb'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message))

// ---- Seed realistic notebooks using the app's own measurement functions ----
await page.goto(`${BASE}/about`, { waitUntil: 'networkidle0' })
await seedNotebook(page)

async function shot(name, url, { before, delay = 1200, element, scrollTo, offset = 90, full = false } = {}) {
  if (only.length && !only.some((o) => name.startsWith(o))) return
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle0' })
  await wait(600)
  if (before) await before()
  if (scrollTo) {
    await page.evaluate(
      (sel, off) => {
        const el = document.querySelector(sel)
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - off)
      },
      scrollTo,
      offset,
    )
  }
  await wait(delay)
  const file = path.join(OUT, `${name}.png`)
  if (element) {
    const el = (await page.$(element)) ?? (await page.$(element.split(' ')[0]))
    if (!el) throw new Error(`missing ${element} on ${url}`)
    await el.screenshot({ path: file })
  } else await page.screenshot({ path: file, fullPage: full })
  console.log('saved', name)
}

const clickStart = async () => {
  await page.waitForSelector('[data-guide="bench-apparatus"] canvas, [data-guide="bench-apparatus"] svg', { timeout: 15000 })
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Start')?.click())
}

// ---- Pages ----
await shot('home', '/', { delay: 3500 })
await shot('catalogue', '/experiments', { delay: 800 })
await shot('syllabus', '/experiments', {
  before: async () => page.evaluate(() => [...document.querySelectorAll('[role=tab]')].find((b) => b.textContent.includes('1BPHS102C'))?.click()),
  delay: 800,
})
await shot('dashboard', '/dashboard', { delay: 800 })
await shot('theory', '/experiments/pendulum', { scrollTo: '[data-guide="stage-nav"]', offset: 30 })
await shot('lab-pendulum', '/experiments/pendulum/lab', { before: clickStart, delay: 1400, scrollTo: '[data-guide="stage-nav"]', offset: 30 })
await shot('assistant', '/experiments/pendulum/lab', { element: '[data-guide="lab-assistant"]', delay: 800 })
await shot('table', '/experiments/pendulum/lab', { element: '[data-guide="bench-table"]', delay: 800 })
await shot('analysis-pendulum', '/experiments/pendulum/analysis', { scrollTo: '[data-guide="analysis-graph"]', offset: 30, delay: 1200 })
await shot('analysis-photoelectric', '/experiments/photoelectric/analysis', { scrollTo: '[data-guide="analysis-graph"]', offset: 30, delay: 1200 })
await shot('analysis-lcr', '/experiments/lcr-resonance/analysis', { scrollTo: '[data-guide="analysis-graph"]', offset: 30, delay: 1200 })
await shot('graph-pendulum', '/experiments/pendulum/analysis', { element: '[data-guide="analysis-graph"]', delay: 1200 })
await shot('graph-photoelectric', '/experiments/photoelectric/analysis', { element: '[data-guide="analysis-graph"]', delay: 1200 })
await shot('calcs-photoelectric', '/experiments/photoelectric/analysis', { element: '[data-guide="analysis-calcs"]', delay: 1200 })
await shot('viva', '/experiments/pendulum/viva', {
  before: async () => {
    await page.waitForSelector('[data-guide="viva-options"] input')
    await page.evaluate(() => {
      document.querySelectorAll('[data-guide="viva-options"] input')[0].click()
    })
    await wait(200)
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Submit answer')?.click())
  },
  scrollTo: '[data-guide="stage-nav"]',
  offset: 30,
  delay: 600,
})
await shot('report', '/experiments/pendulum/report', { scrollTo: '[data-guide="report-sheet"]', offset: 20, delay: 1500 })
await shot('chat', '/experiments/photoelectric/lab', {
  before: async () => {
    await page.evaluate(() => document.querySelector('[aria-label="Ask PHYSILAB a question"]')?.click())
    await wait(300)
    for (const q of ['What is stopping potential?', 'Energy of a 400 nm photon on sodium']) {
      await page.type('#ask-input', q)
      await page.keyboard.press('Enter')
      await wait(300)
    }
  },
  element: '[aria-labelledby="ask-title"]',
  delay: 800,
})
await shot('guide', '/experiments/pendulum/lab', {
  before: async () => {
    await page.evaluate(() => [...document.querySelectorAll('[data-guide="guide-button"]')].find((b) => b.getBoundingClientRect().width > 0)?.click())
    await wait(400)
    await page.keyboard.press('ArrowRight')
  },
  delay: 900,
})

// ---- Every apparatus, running ----
const delays = { faraday: 1500, projectile: 3600, 'rc-circuit': 3500, 'dielectric-constant': 3500, photoelectric: 2500, 'band-gap': 2500, 'hall-effect': 2500 }
const reg = await page.evaluate(async () => (await import('/src/experiments/registry.ts')).EXPERIMENTS.map((e) => e.id))
for (const id of reg) {
  await shot(`apparatus-${id}`, `/experiments/${id}/lab`, { before: clickStart, element: '[data-guide="bench-apparatus"]', delay: delays[id] ?? 1500 })
  await shot(`canvas-${id}`, `/experiments/${id}/lab`, { before: clickStart, element: '[data-guide="bench-apparatus"] canvas', delay: delays[id] ?? 1500 })
}

// Dark theme hero for the title slide
await page.evaluate(() => localStorage.setItem('physilab:theme', 'dark'))
await shot('home-dark', '/', { delay: 3500 })
await shot('lab-faraday-dark', '/experiments/faraday/lab', { before: clickStart, delay: 1500, scrollTo: '[data-guide="stage-nav"]', offset: 30 })
await page.evaluate(() => localStorage.setItem('physilab:theme', 'light'))

await browser.close()
console.log('done')
