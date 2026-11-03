#!/usr/bin/env node
// Baut public/guide/index.html (anstattpunkt.com/guide/) aus dem Gratis-Guide im Motion-Studio.
// Die Quelle ist ein Artifact-Body ohne doctype und <head>: das Skript ergänzt Kopf, Meta- und
// og-Tags und verlinkt den Impressum-Platzhalter im Footer auf Impressum und Datenschutz der Seite
// (Pfade aus `legal` in public/config.json). Den Guide nur in der Quelle ändern und danach neu
// synchronisieren, sonst laufen die beiden Fassungen auseinander. Braucht kein Chromium.
//
// Aufruf:  node tools/sync-guide.mjs                        (Quelle: ../motion_studio/sales/creator/free_guide.html)
//          node tools/sync-guide.mjs pfad/free_guide.html
//          node tools/sync-guide.mjs --check                 (ändert nichts, Code 1, wenn die Seite veraltet ist)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { esc } from './lib/brand.mjs'
import { formatSize } from './lib/render.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'guide', 'index.html')
const args = process.argv.slice(2)
const check = args.includes('--check')
const src = args.find((a) => !a.startsWith('--')) ?? join(root, '..', 'motion_studio', 'sales', 'creator', 'free_guide.html')

function fail(msg) {
  console.error(`sync-guide: ${msg}`)
  process.exit(1)
}

if (!existsSync(src)) fail(`Quelle nicht gefunden: ${src}\nDen Pfad zu free_guide.html als Argument angeben.`)
const text = readFileSync(src, 'utf8')
const config = JSON.parse(readFileSync(join(root, 'public', 'config.json'), 'utf8'))

// Alles bis zum ersten </style> gehört in den <head>, der Rest ist die Seite selbst.
const cut = text.indexOf('</style>')
if (cut < 0) fail('kein </style> in der Quelle: ist das noch der Artifact-Body des Guides?')
const headPart = text.slice(0, cut + '</style>'.length)
let body = text.slice(cut + '</style>'.length).trim()

const title = headPart.match(/<title>([^<]*)<\/title>/)?.[1].trim()
if (!title) fail('kein <title> in der Quelle')
// Titel und Lead stehen in der Quelle schon als HTML: Tags weg, Entities bleiben, nur " für das Attribut
const lead = body.match(/<p class="lead">([\s\S]*?)<\/p>/)?.[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() ?? ''
const attr = (s) => s.replace(/"/g, '&quot;')
// den <title> setzt der Kopf unten; das claude:-Meta ersetzt viewport-fit=cover im Viewport-Meta
const headRest = headPart
  .replace(/<title>[^<]*<\/title>\s*/, '')
  .replace(/<meta name="claude:[^>]*>\s*/g, '')
  .trim()

// Impressum-Platzhalter im Footer → die Rechtsseiten der Seite (eine Ebene höher)
const up = (p) => (/^[a-z][a-z\d+.-]*:/i.test(p) ? p : `../${String(p).replace(/^(?:\.?\/)+/, '')}`)
const legal = config.legal ?? {}
const legalLinks = [
  legal.impressum && `<a href="${esc(up(legal.impressum))}" hreflang="de">Imprint</a>`,
  legal.datenschutz && `<a href="${esc(up(legal.datenschutz))}" hreflang="de">Privacy policy</a>`,
].filter(Boolean).join(' · ')
const placeholder = /Imprint: <span class="ph">\[name, address\]<\/span>/
if (placeholder.test(body) && legalLinks) body = body.replace(placeholder, legalLinks)
else if (!placeholder.test(body)) console.warn('sync-guide: Impressum-Platzhalter im Footer nicht gefunden, Footer bleibt wie in der Quelle.')

// absolute Adressen für og:url und Canonical, wie der Build (siteUrl, eine Adresse ohne https:// bekommt es)
const siteUrl = String(config.siteUrl ?? '').trim()
const site = siteUrl && new URL(/^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`)
const abs = (p) => site && new URL(p, site.href.endsWith('/') ? site.href : `${site.href}/`).href

const meta = [
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  `<title>${title}</title>`,
  lead && `<meta name="description" content="${attr(lead)}">`,
  site && `<link rel="canonical" href="${abs('guide/')}">`,
  '<link rel="icon" href="../favicon.svg" type="image/svg+xml">',
  '<link rel="apple-touch-icon" href="../apple-touch-icon.png">',
  '<meta property="og:type" content="article">',
  config.brand?.name && `<meta property="og:site_name" content="${esc(config.brand.name)}">`,
  `<meta property="og:title" content="${attr(title)}">`,
  lead && `<meta property="og:description" content="${attr(lead)}">`,
  site && `<meta property="og:url" content="${abs('guide/')}">`,
  site && `<meta property="og:image" content="${abs('og-image.png')}">`,
  '<meta name="twitter:card" content="summary_large_image">',
].filter(Boolean)

const html = `<!doctype html>
<!-- Erzeugt von tools/sync-guide.mjs aus free_guide.html. Nicht hier ändern, sondern in der Quelle, dann neu synchronisieren. -->
<html lang="en">
<head>
${meta.join('\n')}
${headRest}
</head>
<body>
${body}
</body>
</html>
`

const name = relative(process.cwd(), out) || out
if (check) {
  const current = existsSync(out) ? readFileSync(out, 'utf8') : ''
  if (current === html) console.log(`${name} ist aktuell.`)
  else fail(`${name} ist veraltet: node tools/sync-guide.mjs ausführen.`)
} else {
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, html)
  console.log(`${name.padEnd(42)} ${formatSize(Buffer.byteLength(html))}`)
}
