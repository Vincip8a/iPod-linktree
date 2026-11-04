// Gemeinsamer Teil von sync-guide.mjs und sync-offer.mjs: macht aus einem Artifact-Body (ohne doctype und
// <head>) eine Seite der Website. Alles bis zum ersten </style> wird Kopf, der Rest Seite; dazu kommen Meta-
// und og-Tags, Footer-Links auf Impressum und Datenschutz, und die Google-Fonts-Links der Quelle werden zu
// @font-face-Regeln auf die Dateien in public/fonts/: die Seiten laden keine Schrift bei Google, so geht
// beim Aufruf keine IP-Adresse an Dritte. Braucht kein Chromium.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { esc } from './brand.mjs'
import { formatSize } from './size.mjs'

export const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const publicDir = join(root, 'public')

/** Fehlermeldung mit dem Namen des Skripts, dann Code 1 */
export const failer = (tool) => (msg) => {
  console.error(`${tool}: ${msg}`)
  process.exit(1)
}

export const readConfig = () => JSON.parse(readFileSync(join(publicDir, 'config.json'), 'utf8'))

// Titel und Lead stehen in der Quelle schon als HTML: Tags weg, Entities bleiben, nur " für das Attribut
export const attr = (s) => s.replace(/"/g, '&quot;')
const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

/** Kopf (ohne <title> und claude:-Meta), Seite, Titel und Lead der Quelle */
export function splitArtifact(text, fail) {
  const cut = text.indexOf('</style>')
  if (cut < 0) fail('kein </style> in der Quelle: ist das noch ein Artifact-Body?')
  const headPart = text.slice(0, cut + '</style>'.length)
  const body = text.slice(cut + '</style>'.length).trim()
  const title = headPart.match(/<title>([^<]*)<\/title>/)?.[1].trim()
  if (!title) fail('kein <title> in der Quelle')
  const lead = plain(body.match(/<p class="lead">([\s\S]*?)<\/p>/)?.[1] ?? '')
  // den <title> setzt der Kopf der Seite; das claude:-Meta ersetzt viewport-fit=cover im Viewport-Meta
  const head = headPart
    .replace(/<title>[^<]*<\/title>\s*/, '')
    .replace(/<meta name="claude:[^>]*>\s*/g, '')
    .trim()
  return { head, body, title, lead }
}

// Die Schriften der Seiten als variable woff2, so wie Google Fonts sie ausliefert: je Familie eine Datei für
// Latin (reicht fürs Deutsche) und eine für Latin Extended, die der Browser nur bei Bedarf lädt. Alle drei
// stehen unter der SIL Open Font License 1.1 (openfontlicense.org), die Lizenz steckt auch in den Dateien.
const SUBSETS = {
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
}
export const FONTS = {
  'Bricolage Grotesque': { file: 'bricolage-grotesque', weight: [500, 800], stretch: true },
  'Instrument Sans': { file: 'instrument-sans', weight: [400, 600], stretch: true },
  'JetBrains Mono': { file: 'jetbrains-mono', weight: [400, 600] },
}

/** Familien und Schnitte aus einer css2-Adresse: "Instrument+Sans:wght@400;500" → ['Instrument Sans', [400, 500]] */
function googleFamilies(href) {
  const url = new URL(href.replace(/&amp;/g, '&'))
  return url.searchParams.getAll('family').map((spec) => {
    const [name, axes = ''] = spec.split(':')
    const [names, tuples = ''] = axes.split('@')
    const at = names.split(',').indexOf('wght')
    const weights = at < 0 ? [400] : tuples.split(';').flatMap((t) => t.split(',')[at].split('..').map(Number))
    return [name, weights]
  })
}

/** ersetzt die Google-Fonts-Links im Kopf durch @font-face-Regeln auf public/fonts/ (Pfad aus Sicht der Seite) */
export function selfHostFonts(head, fontsUrl, fail) {
  const sheet = head.match(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)">/)
  if (!sheet) return head
  const rules = []
  for (const [name, weights] of googleFamilies(sheet[1])) {
    const font = FONTS[name]
    if (!font) fail(`Schrift "${name}" liegt nicht in public/fonts/: in FONTS (tools/lib/artifact-page.mjs) eintragen und die Dateien ablegen.`)
    const [lo, hi] = font.weight
    const off = weights.filter((w) => w < lo || w > hi)
    if (off.length) fail(`"${name}" braucht die Stärke ${off.join(', ')}, die Dateien in public/fonts/ decken nur ${lo}–${hi} ab.`)
    for (const [subset, range] of Object.entries(SUBSETS)) {
      const file = `${font.file}-${subset}.woff2`
      if (!existsSync(join(publicDir, 'fonts', file))) fail(`public/fonts/${file} fehlt (siehe README, Abschnitt Schriften).`)
      rules.push(`@font-face { font-family: '${name}'; font-style: normal; font-weight: ${lo} ${hi};${font.stretch ? ' font-stretch: 100%;' : ''} font-display: swap; src: url(${fontsUrl}${file}) format('woff2'); unicode-range: ${range}; }`)
    }
  }
  const out = head
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"[^>]*>\s*/g, '')
    .replace(sheet[0], `<style>\n/* Schriften von dieser Seite statt von Google Fonts (SIL Open Font License 1.1) */\n${rules.join('\n')}\n</style>`)
  if (/fonts\.(?:googleapis|gstatic)\.com/.test(out)) fail('die Quelle lädt noch auf anderem Weg Schriften bei Google (z. B. @import): bitte dort entfernen.')
  return out
}

/** Pfad aus `legal` in config.json, gesehen von einer Seite eine Ebene tiefer (Adressen mit Schema bleiben) */
const up = (p) => (/^[a-z][a-z\d+.-]*:/i.test(p) ? p : `../${String(p).replace(/^(?:\.?\/)+/, '')}`)

/** Links auf Impressum und Datenschutz der Seite, z. B. für den Footer; leer, wenn config.json keine hat */
export function legalLinks(config, { impressum, datenschutz, hreflang }) {
  const legal = config.legal ?? {}
  const lang = hreflang ? ` hreflang="${hreflang}"` : ''
  return [
    legal.impressum && `<a href="${esc(up(legal.impressum))}"${lang}>${impressum}</a>`,
    legal.datenschutz && `<a href="${esc(up(legal.datenschutz))}"${lang}>${datenschutz}</a>`,
  ].filter(Boolean).join(' · ')
}

/** absolute Adresse unter siteUrl, wie der Build (eine Adresse ohne https:// bekommt es); leer ohne siteUrl */
export function siteAbs(config) {
  const siteUrl = String(config.siteUrl ?? '').trim()
  if (!siteUrl) return () => ''
  const site = new URL(/^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`)
  return (p) => new URL(p, site.href.endsWith('/') ? site.href : `${site.href}/`).href
}

/** der Kopf einer Seite eine Ebene unter der Wurzel: Zeichensatz, Viewport, Titel, Beschreibung, og-Tags */
export function headMeta(config, { title, description, path, type, image }) {
  const abs = siteAbs(config)
  return [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    `<title>${title}</title>`,
    description && `<meta name="description" content="${attr(description)}">`,
    abs(path) && `<link rel="canonical" href="${abs(path)}">`,
    '<link rel="icon" href="../favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="../apple-touch-icon.png">',
    `<meta property="og:type" content="${type}">`,
    config.brand?.name && `<meta property="og:site_name" content="${esc(config.brand.name)}">`,
    `<meta property="og:title" content="${attr(title)}">`,
    description && `<meta property="og:description" content="${attr(description)}">`,
    abs(path) && `<meta property="og:url" content="${abs(path)}">`,
    abs(image) && `<meta property="og:image" content="${abs(image)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
  ].filter(Boolean)
}

export function pageHtml({ lang, meta, head, body, comment }) {
  return `<!doctype html>
<!-- ${comment} -->
<html lang="${lang}">
<head>
${meta.join('\n')}
${head}
</head>
<body>
${body}
</body>
</html>
`
}

/** schreibt die Seite, oder prüft mit --check nur, ob sie aktuell ist (Code 1, wenn nicht) */
export function writePage(out, html, { check, fail, tool }) {
  const name = relative(process.cwd(), out) || out
  if (check) {
    const current = existsSync(out) ? readFileSync(out, 'utf8') : ''
    if (current === html) console.log(`${name} ist aktuell.`)
    else fail(`${name} ist veraltet: node tools/${tool}.mjs ausführen.`)
  } else {
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, html)
    console.log(`${name.padEnd(42)} ${formatSize(Buffer.byteLength(html))}`)
  }
}
