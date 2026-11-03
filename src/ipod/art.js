// Procedural SVG artwork (no external assets). Gradient ids are prefixed per call
// (`p`) so several iPods on one page never share or collide on ids.
import { IPOD } from '../shared/ipodSpec.js';

const esc = (s) => String(s ?? '').replace(/[<&>"]/g, (c) => `&#${c.charCodeAt(0)};`);
// lg(id, '0 #fff,1 #000 .5') → linear gradient (top → bottom unless x2/y2 given); stop = "offset colour [opacity]"
const lg = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x2="${x2}" y2="${y2}">${stops.split(',').map((st) => { const [o, c, a = 1] = st.split(' '); return `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`; }).join('')}</linearGradient>`;
const svg = (vb, body, cls = '') => `<svg${cls && ` class="${cls}"`} viewBox="${vb}" aria-hidden="true">${body}</svg>`;

export const CHEVRON = svg('0 0 7 12', '<path d="M1.2 1.2 5.6 6l-4.4 4.8" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="square"/>', 'ipodc-chev');

// Wheel glyphs (path data from ipodSpec.js, shared with the 3D wheel), drawn in the wheel-label grey via currentColor
export const GLYPH = Object.fromEntries(Object.entries(IPOD.wheelLabels.glyphs).map(([k, d]) => [k, svg('0 0 20 9', `<path d="${d}"/>`)]));

export const playIndicator = (p) => svg('0 0 10 10', `<g fill="url(#${p}sbl)" stroke="#123f80" stroke-width=".8" stroke-linejoin="round"><path class="ipodc-ind-play" d="M1.2.6 9.2 5l-8 4.4z"/><path class="ipodc-ind-pause" d="M1.4.8H4v8.4H1.4zM6 .8h2.6v8.4H6z"/></g>`);

export const battery = (p) => svg('0 0 23 11', `<defs>${lg(`${p}bf`, '0 #d4f7a6,0.45 #7fd23f,0.55 #55b51d,1 #3f9a12')}</defs><rect x=".5" y=".5" width="19.5" height="10" rx="1.6" fill="#f1f2f3" stroke="#55595f"/><path d="M20.5 3.5h1.2v4h-1.2" fill="#8b8f95" stroke="#55595f" stroke-width=".6"/><rect x="2" y="2" width="16.5" height="7" rx=".7" fill="url(#${p}bf)"/>`);


const SPK = '<path d="M0 3.5h2.5L6 .8v9.4L2.5 7.5H0z"/>';
const WAVES = '<path d="M8 3.2a3 3 0 0 1 0 4.6M9.8 1.6a5.4 5.4 0 0 1 0 7.8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>';
export const SPEAKER_LO = svg('-1 0 13 11', SPK);
export const SPEAKER_HI = svg('0 0 13 11', SPK + WAVES);
export const SPEAKER_NOW = svg('0 0 13 11', SPK + WAVES, 'ipodc-trk-ico'); // "now playing" marker

// Gradients shared by the indicator and every preview icon (and its reflection copy): emitted once per iPod.
export const sharedDefs = (p) => `<svg class="ipodc-defs" aria-hidden="true" focusable="false"><defs>${lg(`${p}gl`, '0 #fff 0.8,1 #fff 0.04')}${lg(`${p}bl`, '0 #a3d2ff,0.48 #3f8fe6,1 #1b56b0')}<radialGradient id="${p}md" cx=".5" cy=".38" r=".62"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#d9dce0"/><stop offset="1" stop-color="#9ea3aa"/></radialGradient></defs></svg>`;

// Large preview icons for the split-screen pane and text pages: a glossy silver medallion carrying the
// brand monogram or a blue glyph (100×100 viewBox, gradients from sharedDefs(s)). A menu entry picks one
// with `icon` in config.json (ICON_KINDS), else its type does (iconOf in screens.js).
const PERSON = '<circle cx="50" cy="39" r="11"/><path d="M29 70c0-12 9-20 21-20s21 8 21 20z"/>';
const ICON = {
  contacts: PERSON,
  person: PERSON,
  chat: '<path d="M31 29h38a9 9 0 0 1 9 9v17a9 9 0 0 1-9 9H50L37 74l2-10h-8a9 9 0 0 1-9-9V38a9 9 0 0 1 9-9z"/>',
  download: '<path d="M44 25h12v22h11L50 66 33 47h11zM31 70h38v7H31z"/>',
  // an open book, the spine drawn by the group's stroke
  book: '<path d="M50 35c-6-4.5-13.5-6.5-22-6.5v35c8.5 0 16 2 22 6.5 6-4.5 13.5-6.5 22-6.5v-35c-8.5 0-16 2-22 6.5z"/><path d="M50 35v35" fill="none"/>',
  // a closed box seen from above, its lid lighter
  box: '<path d="M50 26.5 72 37v26L50 73.5 28 63V37z"/><path d="M50 26.5 72 37 50 47.5 28 37z" fill="#fff" fill-opacity=".35"/><path d="M50 47.5v26" fill="none"/>',
  // a film clapperboard, its arm open
  film: '<path d="M29 47h42v21a4 4 0 0 1-4 4H33a4 4 0 0 1-4-4z"/><path d="m28.2 44.6-1.7-7.2 40.9-9.6 1.7 7.2z"/><path d="m33.5 35.8 6.6 5 6.2-1.5-6.6-5zm14.2-3.3 6.6 5 6.2-1.5-6.6-5z" fill="#fff" fill-opacity=".8" stroke="none"/>',
  // the game: a snake of five cells heading for a green dot
  game: '<rect x="27" y="51" width="10" height="10" rx="2"/><rect x="39" y="51" width="10" height="10" rx="2"/><rect x="51" y="51" width="10" height="10" rx="2"/><rect x="51" y="39" width="10" height="10" rx="2"/><rect x="63" y="39" width="10" height="10" rx="2"/><circle cx="69.6" cy="41.8" r="1.3" fill="#fff" stroke="none"/><circle cx="69.6" cy="46.2" r="1.3" fill="#fff" stroke="none"/><circle cx="68" cy="58" r="4.2" fill="#24734d" stroke="none"/>',
};
export const ICON_KINDS = [...Object.keys(ICON), 'monogram'];
let clipSeq = 0;
/** `img`: a picture (the playlist cover) cut round inside the ring instead of the glyph; the monogram
 *  under it shows when the picture does not load */
export function previewIcon(kind, monogram, s, img = null) {
  const m = esc(String(monogram ?? '').slice(0, 3));
  let inner = ICON[kind] && !img ? `<g fill="url(#${s}bl)" stroke="#164f9e" stroke-width="1.2">${ICON[kind]}</g>`
    : `<text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-weight="700" font-size="${m.length > 2 ? 26 : 34}" letter-spacing="-1.5" fill="#43474e">${m}</text>`;
  if (img) {
    const id = `${s}cv${++clipSeq}`;
    inner += `<clipPath id="${id}"><circle cx="50" cy="50" r="35"/></clipPath><image href="${esc(img)}" x="15" y="15" width="70" height="70" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
  }
  const ring = '<circle cx="50" cy="50" r="35" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/>';
  return svg('0 0 100 100', `<circle cx="50" cy="50" r="42" fill="url(#${s}md)" stroke="#80868e" stroke-width="1.5"/>${img ? inner + ring : ring + inner}<path d="M14 44a36 36 0 0 1 72 0c-22 8-50 8-72 0z" fill="url(#${s}gl)" opacity=".5"/>`);
}
