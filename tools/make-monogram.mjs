#!/usr/bin/env node
// Zeichnet brand.monogram aus public/config.json in der Markenschrift Bricolage Grotesque (ExtraBold) als
// public/assets/monogram.svg: das Bild des Boot-Screens, wenn brand.monogramArt darauf zeigt. Ein Punkt
// bekommt die Akzentfarbe (wie der Punkt in "anstatt."). Die Umrisse liefert CoreText (tools/lib/glyphs.swift),
// das Skript läuft also nur auf einem Mac mit Swift; die Seite braucht dafür keine Schriftdatei.
// Schrift: tools/fonts/BricolageGrotesque.ttf (SIL Open Font License, tools/fonts/OFL.txt).
//
// Aufruf:  node tools/make-monogram.mjs

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { formatSize } from './lib/size.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(readFileSync(join(root, 'public', 'config.json'), 'utf8'))
const text = String(config.brand?.monogram ?? '').trim()
if (!text) {
  console.error('make-monogram: brand.monogram in public/config.json ist leer.')
  process.exit(1)
}

const INK = '#eef0f3'    // hell auf dem dunklen Boot-Screen
const ACCENT = '#8df7c4' // Mint der Marke, für den Punkt
const font = join(root, 'tools', 'fonts', 'BricolageGrotesque.ttf')
const out = execFileSync('swift', [join(root, 'tools', 'lib', 'glyphs.swift'), font, text, 'wght=800', 'opsz=96'], { encoding: 'utf8' })
const { glyphs } = JSON.parse(out)

// enge Box um die Umrisse (alle Zahlenpaare der Pfade), 2 % Rand
const nums = glyphs.flatMap((g) => g.d.match(/-?\d+(?:\.\d+)?/g).map(Number))
const xs = nums.filter((_, i) => i % 2 === 0), ys = nums.filter((_, i) => i % 2 === 1)
const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
const pad = Math.round((y1 - y0) * 0.02)
const box = [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad].map(Math.round)
const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.join(' ')}" role="img" aria-label="${esc(text)}">
${glyphs.filter((g) => g.d).map((g) => `  <path fill="${g.char === '.' ? ACCENT : INK}" d="${g.d}"/>`).join('\n')}
</svg>
`
const target = join(root, 'public', 'assets', 'monogram.svg')
writeFileSync(target, svg)
console.log(`public/assets/monogram.svg  "${text}"  ${formatSize(Buffer.byteLength(svg))}`)
