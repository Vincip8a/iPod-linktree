#!/usr/bin/env node
// Baut public/angebot/ (anstattpunkt.com/angebot/) aus der B2B-Angebotsseite im Motion-Studio: index.html
// wie beim Guide (Kopf, Meta- und og-Tags, Schriften aus public/fonts/, Impressum-Platzhalter → Impressum
// und Datenschutz der Seite) und daneben media/ mit den Videos und Standbildern, auf die die Seite zeigt.
// Ein Video media/<name>.mp4 kommt aus demos/deliver/preview/<name>_preview.mp4, ein Standbild
// media/<name>_poster.jpg aus offer_media/. Dateien in media/, auf die die Seite nicht mehr zeigt, gehen weg.
// Zum Schluss muss jede relative Adresse der Seite (src, poster, href, data-src, data-poster) auf eine Datei
// zeigen. Die Seite nur in der Quelle ändern und danach neu synchronisieren.
//
// Aufruf:  node tools/sync-offer.mjs                        (Quelle: ../motion_studio/sales/offer_page.html)
//          node tools/sync-offer.mjs pfad/offer_page.html   (Videos und Bilder relativ zu deren Ordner)
//          node tools/sync-offer.mjs --check                 (ändert nichts, Code 1, wenn Seite oder Medien veraltet sind)

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

import { failer, headMeta, legalLinks, pageHtml, publicDir, readConfig, root, selfHostFonts, splitArtifact, writePage } from './lib/artifact-page.mjs'
import { formatSize } from './lib/size.mjs'

const fail = failer('sync-offer')
const dir = join(publicDir, 'angebot')
const out = join(dir, 'index.html')
const args = process.argv.slice(2)
const check = args.includes('--check')
const src = args.find((a) => !a.startsWith('--')) ?? join(root, '..', 'motion_studio', 'sales', 'offer_page.html')

if (!existsSync(src)) fail(`Quelle nicht gefunden: ${src}\nDen Pfad zu offer_page.html als Argument angeben.`)
const config = readConfig()
const page = splitArtifact(readFileSync(src, 'utf8'), fail)
let { body } = page

// Impressum-Platzhalter im Footer → die Rechtsseiten der Seite (eine Ebene höher)
const links = legalLinks(config, { impressum: 'Impressum', datenschutz: 'Datenschutz' })
const placeholder = /Impressum: <span class="ph">\[Name, Anschrift, Gewerbe\]<\/span>/
if (placeholder.test(body) && links) body = body.replace(placeholder, links)
else if (!placeholder.test(body)) console.warn('sync-offer: Impressum-Platzhalter im Footer nicht gefunden, Footer bleibt wie in der Quelle.')
if (body.includes('class="ph"')) console.warn('sync-offer: die Seite hat noch Platzhalter (class="ph"), die öffentlich zu sehen wären.')

// die Medien der Seite: Ziel in media/ → Datei im Motion-Studio
const salesDir = dirname(src)
const refs = [...body.matchAll(/\b(?:src|poster|data-src|data-poster)="(media\/[^"]+)"/g)].map((m) => m[1])
const media = new Map()
for (const ref of new Set(refs)) {
  const name = ref.slice('media/'.length)
  const from = name.endsWith('_poster.jpg') ? join(salesDir, 'offer_media', name)
    : name.endsWith('.mp4') ? join(salesDir, 'demos', 'deliver', 'preview', name.replace(/\.mp4$/, '_preview.mp4'))
    : fail(`unbekannte Medienart: ${ref} (nur <name>.mp4 und <name>_poster.jpg)`)
  if (!existsSync(from)) fail(`${ref}: Quelle fehlt (${relative(process.cwd(), from)})`)
  media.set(name, from)
}

const mediaDir = join(dir, 'media')
const same = (a, b) => existsSync(b) && statSync(a).size === statSync(b).size && readFileSync(a).equals(readFileSync(b))
const stale = [...media].filter(([name, from]) => !same(from, join(mediaDir, name))).map(([name]) => name)
const extra = existsSync(mediaDir) ? readdirSync(mediaDir).filter((f) => !media.has(f) && f !== '.DS_Store') : []
if (check) {
  if (stale.length || extra.length) fail(`public/angebot/media/ ist veraltet (${[...stale, ...extra].join(', ')}): node tools/sync-offer.mjs ausführen.`)
} else {
  mkdirSync(mediaDir, { recursive: true })
  for (const name of stale) {
    copyFileSync(media.get(name), join(mediaDir, name))
    console.log(`${relative(process.cwd(), join(mediaDir, name)).padEnd(42)} ${formatSize(statSync(media.get(name)).size)}`)
  }
  for (const name of extra) {
    rmSync(join(mediaDir, name))
    console.log(`${relative(process.cwd(), join(mediaDir, name))} entfernt (die Seite zeigt nicht mehr darauf)`)
  }
}

// jede relative Adresse der Seite muss auf eine Datei zeigen (Anker, mailto: und volle Adressen nicht)
const missing = [...body.matchAll(/\b(?:src|poster|href|data-src|data-poster)="([^"#][^"]*)"/g)]
  .map((m) => m[1].split(/[?#]/)[0])
  .filter((p) => p && !/^[a-z][a-z\d+.-]*:/i.test(p) && !p.startsWith('//'))
  .filter((p) => !existsSync(join(dir, p)))
if (missing.length) fail(`Adressen ohne Datei: ${[...new Set(missing)].join(', ')}`)

// das Vorschaubild für Messenger und soziale Netze: das Standbild des ersten Videos
const poster = body.match(/\bposter="(media\/[^"]+)"/)?.[1]
const html = pageHtml({
  lang: 'de',
  comment: 'Erzeugt von tools/sync-offer.mjs aus offer_page.html. Nicht hier ändern, sondern in der Quelle, dann neu synchronisieren.',
  meta: headMeta(config, { title: page.title, description: page.lead, path: 'angebot/', type: 'website', image: poster ? `angebot/${poster}` : 'og-image.png' }),
  head: selfHostFonts(page.head, '../fonts/', fail),
  body,
})
writePage(out, html, { check, fail, tool: 'sync-offer' })
