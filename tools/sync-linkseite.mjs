#!/usr/bin/env node
// Baut public/linkseite/index.html (anstattpunkt.com/linkseite/) aus der deutschen Anleitung „So baust du deine
// Link-Seite mit Claude Code“ im Motion-Studio, so wie sync-guide.mjs den Gratis-Guide: Kopf, Meta- und og-Tags,
// Schriften aus public/fonts/ statt von Google Fonts, Impressum-Platzhalter im Footer → Impressum und Datenschutz
// der Seite. Die Seite hat keine eigenen Medien. Nur in der Quelle ändern und danach neu synchronisieren.
//
// Aufruf:  node tools/sync-linkseite.mjs                            (Quelle: ../motion_studio/sales/creator/linkseite_guide.html)
//          node tools/sync-linkseite.mjs pfad/linkseite_guide.html
//          node tools/sync-linkseite.mjs --check                     (ändert nichts, Code 1, wenn die Seite veraltet ist)

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { failer, headMeta, legalLinks, pageHtml, publicDir, readConfig, root, selfHostFonts, splitArtifact, writePage } from './lib/artifact-page.mjs'

const fail = failer('sync-linkseite')
const out = join(publicDir, 'linkseite', 'index.html')
const args = process.argv.slice(2)
const check = args.includes('--check')
const src = args.find((a) => !a.startsWith('--')) ?? join(root, '..', 'motion_studio', 'sales', 'creator', 'linkseite_guide.html')

if (!existsSync(src)) fail(`Quelle nicht gefunden: ${src}\nDen Pfad zu linkseite_guide.html als Argument angeben.`)
const config = readConfig()
const page = splitArtifact(readFileSync(src, 'utf8'), fail)
let { body } = page

// Impressum-Platzhalter im Footer → die Rechtsseiten der Seite (eine Ebene höher)
const links = legalLinks(config, { impressum: 'Impressum', datenschutz: 'Datenschutz' })
const placeholder = /Impressum: <span class="ph">\[Name, Anschrift, Gewerbe\]<\/span>/
if (placeholder.test(body) && links) body = body.replace(placeholder, links)
else if (!placeholder.test(body)) console.warn('sync-linkseite: Impressum-Platzhalter im Footer nicht gefunden, Footer bleibt wie in der Quelle.')
if (body.includes('class="ph"')) console.warn('sync-linkseite: die Seite hat noch Platzhalter (class="ph"), die öffentlich zu sehen wären.')

const html = pageHtml({
  lang: 'de',
  comment: 'Erzeugt von tools/sync-linkseite.mjs aus linkseite_guide.html. Nicht hier ändern, sondern in der Quelle, dann neu synchronisieren.',
  meta: headMeta(config, { title: page.title, description: page.lead, path: 'linkseite/', type: 'article', image: 'og-image.png' }),
  head: selfHostFonts(page.head, '../fonts/', fail),
  body,
})
writePage(out, html, { check, fail, tool: 'sync-linkseite' })
