#!/usr/bin/env node
// Baut public/guide/index.html (anstattpunkt.com/guide/) aus dem Gratis-Guide im Motion-Studio.
// Die Quelle ist ein Artifact-Body ohne doctype und <head>: das Skript ergänzt Kopf, Meta- und
// og-Tags, lädt die Schriften aus public/fonts/ statt von Google Fonts und verlinkt den Impressum-
// Platzhalter im Footer auf Impressum und Datenschutz der Seite (Pfade aus `legal` in public/config.json).
// Den Guide nur in der Quelle ändern und danach neu synchronisieren, sonst laufen die beiden Fassungen
// auseinander. Der gemeinsame Teil mit sync-offer.mjs steht in tools/lib/artifact-page.mjs.
//
// Aufruf:  node tools/sync-guide.mjs                        (Quelle: ../motion_studio/sales/creator/free_guide.html)
//          node tools/sync-guide.mjs pfad/free_guide.html
//          node tools/sync-guide.mjs --check                 (ändert nichts, Code 1, wenn die Seite veraltet ist)

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { failer, headMeta, legalLinks, pageHtml, publicDir, readConfig, root, selfHostFonts, splitArtifact, writePage } from './lib/artifact-page.mjs'

const fail = failer('sync-guide')
const out = join(publicDir, 'guide', 'index.html')
const args = process.argv.slice(2)
const check = args.includes('--check')
const src = args.find((a) => !a.startsWith('--')) ?? join(root, '..', 'motion_studio', 'sales', 'creator', 'free_guide.html')

if (!existsSync(src)) fail(`Quelle nicht gefunden: ${src}\nDen Pfad zu free_guide.html als Argument angeben.`)
const config = readConfig()
const page = splitArtifact(readFileSync(src, 'utf8'), fail)
let { body } = page

// Impressum-Platzhalter im Footer → die Rechtsseiten der Seite (eine Ebene höher)
const links = legalLinks(config, { impressum: 'Imprint', datenschutz: 'Privacy policy', hreflang: 'de' })
const placeholder = /Imprint: <span class="ph">\[name, address\]<\/span>/
if (placeholder.test(body) && links) body = body.replace(placeholder, links)
else if (!placeholder.test(body)) console.warn('sync-guide: Impressum-Platzhalter im Footer nicht gefunden, Footer bleibt wie in der Quelle.')

const html = pageHtml({
  lang: 'en',
  comment: 'Erzeugt von tools/sync-guide.mjs aus free_guide.html. Nicht hier ändern, sondern in der Quelle, dann neu synchronisieren.',
  meta: headMeta(config, { title: page.title, description: page.lead, path: 'guide/', type: 'article', image: 'og-image.png' }),
  head: selfHostFonts(page.head, '../fonts/', fail),
  body,
})
writePage(out, html, { check, fail, tool: 'sync-guide' })
