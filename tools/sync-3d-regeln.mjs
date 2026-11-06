#!/usr/bin/env node
// Baut public/3d-regeln/ (anstattpunkt.com/3d-regeln/) aus der deutschen Gratis-Seite „Meine 12 Regeln für 3D-Renders
// mit Claude“ im Motion-Studio, so wie sync-offer.mjs die Angebotsseite: index.html mit Kopf, Meta- und og-Tags,
// Schriften aus public/fonts/ statt von Google Fonts, Impressum-Platzhalter → Impressum und Datenschutz der Seite,
// und daneben media/ mit den Bildern, auf die die Seite zeigt (Quelle: sales/creator/3d_regeln_media/<name>).
// og.jpg (Vorschaubild für Messenger und soziale Netze) kommt aus demselben Ordner. Dateien in media/, auf die die
// Seite nicht mehr zeigt, gehen weg. Nur in der Quelle ändern und danach neu synchronisieren.
//
// Aufruf:  node tools/sync-3d-regeln.mjs                         (Quelle: ../motion_studio/sales/creator/3d_regeln.html)
//          node tools/sync-3d-regeln.mjs pfad/3d_regeln.html      (Bilder aus 3d_regeln_media/ neben der Datei)
//          node tools/sync-3d-regeln.mjs --check                  (ändert nichts, Code 1, wenn Seite oder Bilder veraltet sind)

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

import { failer, headMeta, legalLinks, pageHtml, publicDir, readConfig, root, selfHostFonts, splitArtifact, writePage } from './lib/artifact-page.mjs'
import { formatSize } from './lib/size.mjs'

const fail = failer('sync-3d-regeln')
const dir = join(publicDir, '3d-regeln')
const out = join(dir, 'index.html')
const args = process.argv.slice(2)
const check = args.includes('--check')
const src = args.find((a) => !a.startsWith('--')) ?? join(root, '..', 'motion_studio', 'sales', 'creator', '3d_regeln.html')

if (!existsSync(src)) fail(`Quelle nicht gefunden: ${src}\nDen Pfad zu 3d_regeln.html als Argument angeben.`)
const config = readConfig()
const page = splitArtifact(readFileSync(src, 'utf8'), fail)
let { body } = page

// Impressum-Platzhalter im Footer → die Rechtsseiten der Seite (eine Ebene höher)
const links = legalLinks(config, { impressum: 'Impressum', datenschutz: 'Datenschutz' })
const placeholder = /Impressum: <span class="ph">\[Name, Anschrift, Gewerbe\]<\/span>/
if (placeholder.test(body) && links) body = body.replace(placeholder, links)
else if (!placeholder.test(body)) console.warn('sync-3d-regeln: Impressum-Platzhalter im Footer nicht gefunden, Footer bleibt wie in der Quelle.')
if (body.includes('class="ph"')) console.warn('sync-3d-regeln: die Seite hat noch Platzhalter (class="ph"), die öffentlich zu sehen wären.')

// die Bilder der Seite (plus og.jpg): Ziel in media/ → Datei in 3d_regeln_media/
const srcMedia = join(dirname(src), '3d_regeln_media')
const refs = [...body.matchAll(/\bsrc="(media\/[^"]+)"/g)].map((m) => m[1].slice('media/'.length))
const media = new Map()
for (const name of new Set([...refs, 'og.jpg'])) {
  const from = join(srcMedia, name)
  if (!existsSync(from)) fail(`media/${name}: Quelle fehlt (${relative(process.cwd(), from)})`)
  media.set(name, from)
}

const mediaDir = join(dir, 'media')
const same = (a, b) => existsSync(b) && statSync(a).size === statSync(b).size && readFileSync(a).equals(readFileSync(b))
const stale = [...media].filter(([name, from]) => !same(from, join(mediaDir, name))).map(([name]) => name)
const extra = existsSync(mediaDir) ? readdirSync(mediaDir).filter((f) => !media.has(f) && f !== '.DS_Store') : []
if (check) {
  if (stale.length || extra.length) fail(`public/3d-regeln/media/ ist veraltet (${[...stale, ...extra].join(', ')}): node tools/sync-3d-regeln.mjs ausführen.`)
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

const html = pageHtml({
  lang: 'de',
  comment: 'Erzeugt von tools/sync-3d-regeln.mjs aus 3d_regeln.html. Nicht hier ändern, sondern in der Quelle, dann neu synchronisieren.',
  meta: headMeta(config, { title: page.title, description: page.lead, path: '3d-regeln/', type: 'article', image: '3d-regeln/media/og.jpg' }),
  head: selfHostFonts(page.head, '../fonts/', fail),
  body,
})
writePage(out, html, { check, fail, tool: 'sync-3d-regeln' })
