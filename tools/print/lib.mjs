// Shared helpers for the print deliverables (posters and slide deck).
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import katex from 'katex'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as Lucide from 'lucide-react'
import puppeteer from 'puppeteer-core'

export const ROOT = path.resolve(import.meta.dirname, '../..')
export const SCREENS = path.join(ROOT, 'deliverables/screens')
export const OUT = path.join(ROOT, 'deliverables')
export const BUILD = path.join(import.meta.dirname, 'build')
export const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
export const URL_LIVE = 'https://physilab.vercel.app/'
export const CREDIT = { name: 'Prathiksha D', role: '1st year Engineering Student' }
fs.mkdirSync(path.join(BUILD, 'img'), { recursive: true })

export const fileUrl = (p) => pathToFileURL(p).href
export const results = JSON.parse(fs.readFileSync(path.join(SCREENS, 'results.json'), 'utf8'))
export const byId = (id) => results.find((r) => r.id === id)

/** App palette (matches src/index.css). */
export const C = {
  dark: '0B141A',
  dark2: '13212B',
  dark3: '1B2C38',
  paper: 'F3F5F2',
  white: 'FFFFFF',
  ink: '13212B',
  ink2: '44565F',
  ink3: '6B7C85',
  line: 'D5DDD8',
  prussian: '1D4E89',
  prussianSoft: 'DFE8F3',
  sky: '8FB8E6',
  sodium: 'D98309',
  sodiumBright: 'F2A93B',
  sodiumSoft: 'FBEED8',
  ok: '2F7D4A',
  okSoft: 'DDEFE3',
  bad: 'B3261E',
}

/**
 * Crops/resizes a screenshot to a JPEG for print. crop is in source pixels.
 * Returns the absolute path of the processed image.
 */
export async function img(name, { crop, width = 1800, quality = 88, format = 'jpeg' } = {}) {
  const key = `${name}${crop ? `-${crop.join('_')}` : ''}-${width}.${format === 'png' ? 'png' : 'jpg'}`
  const out = path.join(BUILD, 'img', key)
  if (fs.existsSync(out)) return out
  let s = sharp(path.join(SCREENS, `${name}.png`))
  if (crop) s = s.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] })
  s = s.resize({ width, withoutEnlargement: true })
  s = format === 'png' ? s.png({ compressionLevel: 9 }) : s.jpeg({ quality, mozjpeg: true })
  await s.toFile(out)
  return out
}

export async function imgSize(p) {
  const m = await sharp(p).metadata()
  return { w: m.width, h: m.height }
}

export const tex = (s, display = false) => katex.renderToString(s, { displayMode: display, throwOnError: true, output: 'html' })

/** A lucide icon as inline SVG markup. */
export function icon(name, { size = 24, color = 'currentColor', stroke = 2 } = {}) {
  const I = Lucide[name]
  if (!I) throw new Error(`no icon ${name}`)
  return renderToStaticMarkup(createElement(I, { size, color, strokeWidth: stroke }))
}

/** A lucide icon rasterised to a PNG data URI (for pptx). */
export async function iconPng(name, color, px = 256) {
  const svg = icon(name, { size: px, color: `#${color}`, stroke: 2 })
  const buf = await sharp(Buffer.from(svg)).png().toBuffer()
  return 'image/png;base64,' + buf.toString('base64')
}

const fontDir = (pkg) => path.join(ROOT, 'node_modules', pkg, 'files')
export function fontCss() {
  const f = (pkg, file) => fileUrl(path.join(fontDir(pkg), file))
  return `
@font-face{font-family:'Bricolage';src:url(${f('@fontsource-variable/bricolage-grotesque', 'bricolage-grotesque-latin-wght-normal.woff2')}) format('woff2');font-weight:200 800}
${[400, 500, 600, 700].map((w) => `@font-face{font-family:'Plex';src:url(${f('@fontsource/ibm-plex-sans', `ibm-plex-sans-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('\n')}
${[400, 500].map((w) => `@font-face{font-family:'PlexMono';src:url(${f('@fontsource/ibm-plex-mono', `ibm-plex-mono-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('\n')}
`
}
export const katexCss = () => `<link rel="stylesheet" href="${fileUrl(path.join(ROOT, 'node_modules/katex/dist/katex.min.css'))}">`

export async function withBrowser(fn) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files', '--force-color-profile=srgb'] })
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

/** Renders an HTML file to PDF and/or PNG at the given physical size. */
export async function render(browser, htmlFile, { widthMm, heightMm, pdf, png, dpi = 150 }) {
  const page = await browser.newPage()
  const pxW = Math.round((widthMm / 25.4) * 96)
  const pxH = Math.round((heightMm / 25.4) * 96)
  await page.setViewport({ width: pxW, height: pxH, deviceScaleFactor: dpi / 96 })
  await page.goto(fileUrl(htmlFile), { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll('[data-fit]')]
      .filter((el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)
      .map((el) => `${el.dataset.fit}: ${el.scrollWidth}x${el.scrollHeight} > ${el.clientWidth}x${el.clientHeight}`),
  )
  if (overflow.length) console.warn('OVERFLOW', overflow)
  if (png) await page.screenshot({ path: png, clip: { x: 0, y: 0, width: pxW, height: pxH } })
  if (pdf) await page.pdf({ path: pdf, width: `${widthMm}mm`, height: `${heightMm}mm`, printBackground: true, pageRanges: '1' })
  await page.close()
  return overflow
}

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
