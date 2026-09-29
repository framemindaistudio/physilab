// Shared styles and snippets for the A3 posters.
import fs from 'node:fs'
import path from 'node:path'
import { OUT, esc, fileUrl, fontCss, img } from './lib.mjs'

export const QR = fs.readFileSync(path.join(OUT, 'qr/physilab-qr.svg'), 'utf8')
export const LOGO = fs.readFileSync(path.resolve(import.meta.dirname, '../../public/favicon.svg'), 'utf8')
export const src = async (...a) => fileUrl(await img(...a))

export const BASE_CSS = `
${fontCss()}
@page{size:297mm 420mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
:root{--dark:#0b141a;--dark2:#13212b;--dark3:#1b2c38;--paper:#f3f5f2;--ink:#13212b;--ink2:#44565f;--ink3:#6b7c85;--line:#d5ddd8;
--prussian:#1d4e89;--prussian-soft:#dfe8f3;--sky:#8fb8e6;--sodium:#d98309;--sodium-bright:#f2a93b;--sodium-soft:#fbeed8;--ok:#2f7d4a;--ok-soft:#ddefe3}
html,body{width:297mm;height:420mm}
body{font-family:Plex,sans-serif;color:var(--ink);background:var(--paper);-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:10.5pt;line-height:1.45}
.sheet{width:297mm;height:420mm;position:relative;overflow:hidden;display:flex;flex-direction:column}
.display{font-family:Bricolage,sans-serif;letter-spacing:-0.02em}
.mono{font-family:PlexMono,monospace}
.eyebrow{font-family:PlexMono,monospace;font-size:8.5pt;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink3)}
.dark{background:var(--dark);color:#e3eaee}
.dark .eyebrow{color:#8fa6b4}
.grid-dark{background-image:linear-gradient(rgba(130,175,210,.15) .22mm,transparent .22mm),linear-gradient(90deg,rgba(130,175,210,.15) .22mm,transparent .22mm),linear-gradient(rgba(130,175,210,.06) .15mm,transparent .15mm),linear-gradient(90deg,rgba(130,175,210,.06) .15mm,transparent .15mm);background-size:25mm 25mm,25mm 25mm,5mm 5mm,5mm 5mm;background-position:-.1mm -.1mm}
.grid-paper{background-image:linear-gradient(rgba(29,78,137,.09) .2mm,transparent .2mm),linear-gradient(90deg,rgba(29,78,137,.09) .2mm,transparent .2mm),linear-gradient(rgba(29,78,137,.045) .12mm,transparent .12mm),linear-gradient(90deg,rgba(29,78,137,.045) .12mm,transparent .12mm);background-size:25mm 25mm,25mm 25mm,5mm 5mm,5mm 5mm}
.panel{background:#fff;border:.3mm solid var(--line);border-radius:3mm;box-shadow:0 .6mm 2.5mm rgba(19,33,43,.07)}
.frame{border-radius:2.4mm;overflow:hidden;background:#fff;border:.3mm solid #c9d3d8;box-shadow:0 1.2mm 5mm rgba(8,20,30,.16)}
.frame .bar{height:5mm;display:flex;align-items:center;gap:1.2mm;padding:0 2.4mm;background:#e9eef0;border-bottom:.3mm solid #d3dbdf}
.frame .bar i{width:1.6mm;height:1.6mm;border-radius:50%;background:#c3ccd1;display:block}
.frame .bar i:nth-child(1){background:#e0685f}.frame .bar i:nth-child(2){background:#e6b54a}.frame .bar i:nth-child(3){background:#6cbf6a}
.frame .bar span{margin-left:2.4mm;font-family:PlexMono,monospace;font-size:6pt;color:#5f7079;background:#fff;border-radius:1.2mm;padding:.35mm 2.4mm;flex:1;max-width:70%}
.frame.darkframe{border-color:#2b3d49;background:#0e181f}
.frame.darkframe .bar{background:#16242e;border-bottom-color:#243642}
.frame.darkframe .bar span{background:#0e181f;color:#8fa6b4}
.frame img{display:block;width:100%}
.katex{font-size:1.08em}
.qrbox{background:#fff;border-radius:3mm;padding:2.2mm;display:inline-flex}
.qrbox svg{display:block;width:100%;height:100%}
.logo svg{display:block;width:100%;height:100%}
.credit .name{font-family:Bricolage,sans-serif;font-weight:700;letter-spacing:-.01em}
`

export const frame = (url, imgSrc, cls = '', style = '') =>
  `<div class="frame ${cls}" style="${style}"><div class="bar"><i></i><i></i><i></i><span>${esc(url)}</span></div><img src="${imgSrc}"></div>`
