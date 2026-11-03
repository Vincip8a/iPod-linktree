// Gemeinsame Gestaltung fuer alle generierten Assets: Farben, Schrift und die
// selbst gezeichneten SVG-Motive (Player-Silhouette, Click Wheel, Monogramm).
// Alle Motive sind reine Geometrie, keine fremden Bilder, keine Logos.

import { readFileSync } from 'node:fs'

import { FINISHES, finishOf } from '../../src/shared/ipodSpec.js'
import { languagesOf, localize } from '../../src/shared/i18n.js'

// Name, Monogramm, Tagline, E-Mail, Playlist-Titel und Menuepunkte kommen aus
// public/config.json, damit Social-Bild, Cover und PDFs zur Seite passen.
// Nach einer Aenderung dort: node tools/make-all.mjs
// (Texte in mehreren Sprachen: die erste aus settings.languages, wie die gebaute Seite)
const rawConfig = JSON.parse(readFileSync(new URL('../../public/config.json', import.meta.url), 'utf8'))
const config = localize(rawConfig, languagesOf(rawConfig)[0])
const cfgBrand = config.brand ?? {}
const menu = (Array.isArray(config.menu) ? config.menu : []).filter((m) => m && typeof m === 'object')

/** Text fuer HTML- und SVG-Vorlagen: &, <, >, " und ' maskiert. */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

// Alle Werte sind bereits maskiert und duerfen direkt in Markup eingesetzt werden.
export const brand = {
  name: esc(cfgBrand.name || 'Dein Name'),
  monogram: esc(cfgBrand.monogram || 'DN'),
  tagline: esc(cfgBrand.tagline ?? ''),
  email: esc(cfgBrand.email || 'hallo@example.com'),
  playlistTitle: esc(menu.find((m) => m.type === 'nowplaying')?.title || 'Playlist'),
  // wie auf dem iPod (firstText in src/shared/href.js): ein leeres label zaehlt als fehlend
  menuLabels: menu.map((m) => esc([m.label, m.title].map((v) => String(v ?? '').trim()).find(Boolean) ?? '')).filter(Boolean),
}

export const palette = {
  aquaLight: '#6fc0ff',
  aqua: '#2c82d6',
  aquaDeep: '#11508f',
  aquaInk: '#0a3763',
  silverLight: '#fdfefe',
  silver: '#dfe4e9',
  silverDark: '#b2bac3',
  edge: '#8b949e',
  ink: '#16222e',
  inkSoft: '#4a5a6a',
  paper: '#f3f6f9',
}

// Die Farbe des gezeichneten Players folgt settings.finish (wie der iPod auf der Seite), der Hintergrund
// von Favicon, Touch-Icon und Social-Bild ist der Nacht-Desktop der Seite (src/window/window.css).
const finish = finishOf(config)
const dark = finish !== FINISHES.silver
export const look = dark
  ? {
      body: ['#3a4155', '#262c3d', '#1d2232', '#2a3044', '#121520'],
      wheel: [finish.wheelHi, finish.wheel, finish.wheelLo],
      button: ['#2c3243', finish.centerButton, '#181c28'],
      edge: '#07080c', rim: 0.18, ring: '#0b0d14', label: finish.wheelLabel,
      outline: '#c9ced8', // Umriss der kleinen Icons, damit der dunkle Player auf dem dunklen Grund steht
    }
  : {
      body: ['#ffffff', '#eef1f4', '#ccd3da', '#e7ebef', '#aab2bb'],
      wheel: ['#fbfcfd', '#e2e7ec', '#bfc7d0'],
      button: ['#ffffff', '#edf0f3', '#c9d1d9'],
      edge: palette.edge, rim: 0.75, ring: palette.silverDark, label: '#6d7884',
      outline: '#2a4a6b',
    }
// Nacht-Desktop: Markenfarbe night, Signalgruen und Gelb als Licht
export const night = { top: '#2b3a4a', mid: '#1f2638', base: '#171c2a', deep: '#0e1119', green: '36,115,77', mint: '141,247,196', yellow: '255,214,10', ink: '#171c2a' }

export const fontStack =
  '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", "DejaVu Sans", sans-serif'

// Gleiche Schriftenliste, aber mit einfachen Anfuehrungszeichen: SVG-Dateien
// werden als XML geparst, doppelte Anfuehrungszeichen wuerden das
// font-family-Attribut zerreissen und die Datei unlesbar machen.
export const svgFontStack = fontStack.replaceAll('"', "'")

// Markenschrift fuer Monogramme in den gerenderten Bildern (OG-Bild): Bricolage Grotesque aus tools/fonts
// (SIL OFL). brandFontFace gehoert in das <style> der Vorlage, die Schrift wird lokal geladen.
export const brandFontFace = `@font-face { font-family: "Bricolage Grotesque"; src: url("${new URL('../fonts/BricolageGrotesque.ttf', import.meta.url).href}") format("truetype"); font-weight: 200 800; }`
export const brandFont = `"Bricolage Grotesque", ${fontStack}`
export const svgBrandFont = brandFont.replaceAll('"', "'")
/** Monogramm als HTML mit hervorgehobenem Punkt (<span class="dot">), wie im Logo "anstatt." */
export const monogramHtml = brand.monogram.replaceAll('.', '<span class="dot">.</span>')

/** Verlaeufe und Filter, die alle Motive teilen. ns haelt die IDs eindeutig. */
function defs(ns) {
  return `
  <defs>
    <linearGradient id="${ns}-body" x1="0" y1="0" x2="1" y2="1">
      ${[0, 0.18, 0.55, 0.82, 1].map((o, i) => `<stop offset="${o}" stop-color="${look.body[i]}"/>`).join('')}
    </linearGradient>
    <linearGradient id="${ns}-screen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1d3449"/>
      <stop offset="1" stop-color="#09131d"/>
    </linearGradient>
    <linearGradient id="${ns}-gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".40"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${ns}-aqua" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${palette.aquaLight}"/>
      <stop offset=".5" stop-color="${palette.aqua}"/>
      <stop offset="1" stop-color="${palette.aquaDeep}"/>
    </linearGradient>
    <radialGradient id="${ns}-wheel" cx=".5" cy=".36" r=".78">
      ${[0, 0.62, 1].map((o, i) => `<stop offset="${o}" stop-color="${look.wheel[i]}"/>`).join('')}
    </radialGradient>
    <radialGradient id="${ns}-button" cx=".5" cy=".3" r=".85">
      ${[0, 0.55, 1].map((o, i) => `<stop offset="${o}" stop-color="${look.button[i]}"/>`).join('')}
    </radialGradient>
  </defs>`
}

/** Transport-Glyphen als Pfade, unabhaengig von installierten Schriften. */
function transportGlyphs(cx, cy, r, fill) {
  const s = r * 0.17
  const bar = s * 0.34
  const left = cx - r * 0.62
  const right = cx + r * 0.62
  const bottom = cy + r * 0.6
  return `
    <g fill="${fill}">
      <path d="M${left + s} ${cy - s} L${left - s * 0.35} ${cy} L${left + s} ${cy + s} Z"/>
      <path d="M${left + s * 1.6} ${cy - s} L${left + s * 0.25} ${cy} L${left + s * 1.6} ${cy + s} Z"/>
      <rect x="${left - s * 0.35 - bar}" y="${cy - s}" width="${bar}" height="${s * 2}" rx="${bar * 0.3}"/>
      <path d="M${right - s} ${cy - s} L${right + s * 0.35} ${cy} L${right - s} ${cy + s} Z"/>
      <path d="M${right - s * 1.6} ${cy - s} L${right - s * 0.25} ${cy} L${right - s * 1.6} ${cy + s} Z"/>
      <rect x="${right + s * 0.35}" y="${cy - s}" width="${bar}" height="${s * 2}" rx="${bar * 0.3}"/>
      <path d="M${cx - s * 1.5} ${bottom - s} L${cx - s * 0.2} ${bottom} L${cx - s * 1.5} ${bottom + s} Z"/>
      <rect x="${cx + s * 0.2}" y="${bottom - s}" width="${bar}" height="${s * 2}" rx="${bar * 0.3}"/>
      <rect x="${cx + s * 0.2 + bar * 1.8}" y="${bottom - s}" width="${bar}" height="${s * 2}" rx="${bar * 0.3}"/>
    </g>`
}

/**
 * Ausgezeichnete Player-Illustration (Front mit Display und Click Wheel).
 * viewBox 0 0 260 420, als eigenstaendiges <svg> zum Einbetten.
 */
export function playerSvg({ ns = 'pl', width = 260, height = 420, showScreenContent = true } = {}) {
  const screen = showScreenContent
    ? `
      <g>
        <rect x="46" y="50" width="56" height="56" rx="5" fill="url(#${ns}-aqua)"/>
        <text x="74" y="88" text-anchor="middle" font-family="${svgBrandFont}" font-size="27"
              font-weight="800" fill="#ffffff" opacity=".94">${brand.monogram}</text>
        <rect x="114" y="54" width="94" height="9" rx="4.5" fill="#8fd0ff" opacity=".95"/>
        <rect x="114" y="70" width="72" height="7" rx="3.5" fill="#9db3c7" opacity=".85"/>
        <rect x="114" y="84" width="58" height="7" rx="3.5" fill="#9db3c7" opacity=".6"/>
        <rect x="46" y="128" width="162" height="7" rx="3.5" fill="#33506b"/>
        <rect x="46" y="128" width="96" height="7" rx="3.5" fill="#7fc3ff"/>
        <text x="46" y="156" font-family="${svgFontStack}" font-size="11" fill="#7f94a8">1:12</text>
        <text x="208" y="156" text-anchor="end" font-family="${svgFontStack}" font-size="11" fill="#7f94a8">3:48</text>
      </g>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 420" width="${width}" height="${height}" role="img" aria-label="Stilisierter MP3-Player mit Click Wheel">
  ${defs(ns)}
  <rect x="10" y="10" width="240" height="400" rx="28" fill="url(#${ns}-body)" stroke="${look.edge}" stroke-width="2"/>
  <rect x="17" y="17" width="226" height="386" rx="22" fill="none" stroke="#ffffff" stroke-opacity="${look.rim}" stroke-width="2"/>
  <rect x="32" y="32" width="196" height="156" rx="10" fill="#79838e"/>
  <rect x="34" y="34" width="192" height="152" rx="9" fill="url(#${ns}-screen)"/>
  ${screen}
  <path d="M34 34 h192 v44 q-96 26 -192 0 Z" fill="url(#${ns}-gloss)"/>
  <circle cx="130" cy="300" r="80" fill="url(#${ns}-wheel)" stroke="${look.ring}" stroke-width="1.5"/>
  <circle cx="130" cy="300" r="80" fill="none" stroke="#ffffff" stroke-opacity="${look.rim * 0.8}" stroke-width="1" transform="translate(0,1.5)"/>
  <circle cx="130" cy="300" r="31" fill="url(#${ns}-button)" stroke="${look.ring}" stroke-width="1.2"/>
  <text x="130" y="243" text-anchor="middle" font-family="${svgFontStack}" font-size="15"
        font-weight="600" letter-spacing="1.5" fill="${look.label}">MENU</text>
  ${transportGlyphs(130, 300, 80, look.label)}
</svg>`
}

/** Favicon: 32x32, Nacht-Kachel mit Player-Silhouette, auch bei 16 px lesbar. */
export function faviconSvg() {
  const ns = 'fv'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" role="img" aria-label="MP3-Player mit Click Wheel">
  <defs>
    <linearGradient id="${ns}-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${night.top}"/>
      <stop offset="1" stop-color="${night.deep}"/>
    </linearGradient>
    <linearGradient id="${ns}-body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${look.body[0]}"/>
      <stop offset=".55" stop-color="${look.body[2]}"/>
      <stop offset="1" stop-color="${look.body[4]}"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="url(#${ns}-bg)"/>
  <rect x="8" y="3" width="16" height="26" rx="3.4" fill="url(#${ns}-body)" stroke="${look.outline}" stroke-width="1"/>
  <rect x="10.5" y="5.5" width="11" height="9" rx="1.4" fill="${dark ? '#dfe9f5' : '#10212f'}"/>
  <circle cx="16" cy="22" r="5.4" fill="${look.wheel[1]}" stroke="${dark ? look.outline : '#8d97a2'}" stroke-width="1"/>
  <circle cx="16" cy="22" r="1.9" fill="${look.button[2]}"/>
</svg>
`
}

/** Apple-Touch-Icon: 180x180, randlos (iOS rundet selbst ab). */
export function touchIconSvg() {
  const ns = 'ti'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <defs>
    <linearGradient id="${ns}-bg" x1="0" y1="0" x2=".3" y2="1">
      <stop offset="0" stop-color="${night.top}"/>
      <stop offset=".55" stop-color="${night.base}"/>
      <stop offset="1" stop-color="${night.deep}"/>
    </linearGradient>
    <radialGradient id="${ns}-glow" cx=".15" cy="1.05" r=".9">
      <stop offset="0" stop-color="rgb(${night.green})" stop-opacity=".75"/>
      <stop offset="1" stop-color="rgb(${night.green})" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${ns}-body" x1="0" y1="0" x2="1" y2="1">
      ${[0, 0.2, 0.6, 1].map((o, i) => `<stop offset="${o}" stop-color="${look.body[[0, 1, 2, 4][i]]}"/>`).join('')}
    </linearGradient>
    <linearGradient id="${ns}-screen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1d3449"/>
      <stop offset="1" stop-color="#09131d"/>
    </linearGradient>
    <radialGradient id="${ns}-wheel" cx=".5" cy=".35" r=".8">
      ${[0, 0.65, 1].map((o, i) => `<stop offset="${o}" stop-color="${look.wheel[i]}"/>`).join('')}
    </radialGradient>
  </defs>
  <rect width="180" height="180" fill="url(#${ns}-bg)"/>
  <rect width="180" height="180" fill="url(#${ns}-glow)"/>
  <path d="M0 0 h180 v74 q-90 30 -180 0 Z" fill="#ffffff" fill-opacity=".06"/>
  <rect x="48" y="16" width="84" height="148" rx="16" fill="url(#${ns}-body)" stroke="${dark ? look.outline : '#1d4570'}" stroke-width="3"/>
  <rect x="59" y="28" width="62" height="52" rx="6" fill="url(#${ns}-screen)"/>
  <rect x="66" y="38" width="30" height="6" rx="3" fill="#7fc3ff"/>
  <rect x="66" y="50" width="42" height="5" rx="2.5" fill="#8299ad"/>
  <rect x="66" y="61" width="24" height="5" rx="2.5" fill="#8299ad" opacity=".7"/>
  <circle cx="90" cy="124" r="29" fill="url(#${ns}-wheel)" stroke="${dark ? '#0b0d14' : '#9aa4ae'}" stroke-width="2"/>
  <circle cx="90" cy="124" r="10.5" fill="${look.button[1]}" stroke="${dark ? '#0b0d14' : '#9aa4ae'}" stroke-width="1.5"/>
</svg>
`
}

/** Album-Cover 600x600 fuer die Playlist-Ansicht. */
export function playlistCoverSvg() {
  const ns = 'pc'
  const rings = [250, 205, 160]
    .map((r, i) => `<circle cx="300" cy="286" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="${0.1 - i * 0.025}" stroke-width="2"/>`)
    .join('\n  ')
  const bars = [34, 58, 86, 70, 44, 96, 62, 38]
    .map((h, i) => `<rect x="${196 + i * 27}" y="${508 - h}" width="13" height="${h}" rx="6" fill="#ffffff" fill-opacity="${0.32 + (i % 3) * 0.14}"/>`)
    .join('\n  ')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="img" aria-label="${brand.playlistTitle}, Album-Cover">
  <defs>
    <linearGradient id="${ns}-bg" x1="0" y1="0" x2=".55" y2="1">
      <stop offset="0" stop-color="#8fd3ff"/>
      <stop offset=".42" stop-color="${palette.aqua}"/>
      <stop offset="1" stop-color="#07305c"/>
    </linearGradient>
    <radialGradient id="${ns}-glow" cx=".3" cy=".18" r=".8">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".42"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${ns}-disc" cx=".42" cy=".3" r=".75">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".58" stop-color="#e6ebf0"/>
      <stop offset="1" stop-color="#b9c2cb"/>
    </radialGradient>
    <linearGradient id="${ns}-sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#${ns}-bg)"/>
  <rect width="600" height="600" fill="url(#${ns}-glow)"/>
  ${rings}
  <circle cx="300" cy="286" r="124" fill="url(#${ns}-disc)"/>
  <circle cx="300" cy="286" r="124" fill="none" stroke="#ffffff" stroke-opacity=".8" stroke-width="3"/>
  <path d="M176 286 a124 124 0 0 1 248 0 Z" fill="url(#${ns}-sheen)"/>
  <text x="300" y="316" text-anchor="middle" font-family="${svgFontStack}" font-size="112"
        font-weight="700" letter-spacing="2" fill="${palette.aquaInk}">${brand.monogram}</text>
  ${bars}
  <text x="300" y="556" text-anchor="middle" font-family="${svgFontStack}" font-size="40"
        font-weight="600" letter-spacing="1" fill="#ffffff">${brand.playlistTitle}</text>
</svg>
`
}
