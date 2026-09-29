// Builds a contact sheet of screenshots (for visual QA only).
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve(import.meta.dirname, '../../deliverables/screens')
const out = process.argv[2] ?? path.join(process.env.TEMP ?? '.', 'contact.png')
const filter = process.argv[3] ?? 'apparatus-'
const files = fs.readdirSync(dir).filter((f) => f.startsWith(filter) && f.endsWith('.png'))
const html = `<body style="margin:0;background:#ddd;font:14px sans-serif;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px">${files
  .map((f) => `<figure style="margin:0;background:#fff"><img style="width:100%;display:block" src="file:///${path.join(dir, f).replace(/\\/g, '/')}"><figcaption>${f}</figcaption></figure>`)
  .join('')}</body>`
const tmp = path.join(path.dirname(out), 'contact.html')
fs.writeFileSync(tmp, html)
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files'] })
const p = await b.newPage()
await p.setViewport({ width: 1800, height: 1000 })
await p.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'load' })
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log(out, files.length)
