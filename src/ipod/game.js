// The game screen on the logical 320×240 LCD (menu type "game"; `game` picks one of GAMES: Snake in
// snake.js, Blocks in blocks.js). This frame is the same for every game: the canvas, the start / pause /
// game over states with their hint over the board, the record (for the visit only: nothing is stored on
// the device), the option text a screen reader reads, and how the iPod's presses reach the game. The
// centre (Enter, Space) starts and pauses; while a round runs, the four zones, the arrow keys and the
// wheel are the game's; while it is not running, left goes back as on every screen.
import { h } from './util.js';
import { COLORS } from '../shared/ipodSpec.js';
import { snake } from './snake.js';
import { blocks } from './blocks.js';

const GAMES = { snake, blocks };
export const GAME_KINDS = Object.keys(GAMES);
const W = 320;          // logical px
const OVER_LOCK = 500;  // a press this soon after game over does not start the next round at once
const ARROWS = ['up', 'right', 'down', 'left'];
const best = {};        // per game

/**
 * A game is a factory returning { score, over, hints, delay(), reset(), begin(btn)?, tick() → false when the
 * round ended, input(btn) → true when it used the press, turn(dir), status(L), area(H) → [x, y, w, h] for the
 * hint, draw(g, H, paint) }. `paint`: { k, font, L, best, cell(x, y, fill, size?), blue(size?) }.
 */
export function gameScreen(ctx, id, title, kind) {
  const { L, timers } = ctx;
  if (kind != null && !Object.hasOwn(GAMES, kind)) console.warn(`[ipod] config.json: unknown game "${kind}" (one of ${GAME_KINDS.join(', ')}), Snake instead`);
  const name = Object.hasOwn(GAMES, kind) ? kind : 'snake';
  const game = GAMES[name]();
  best[name] ??= 0;
  const node = h('div', `ipodc-screen ipodc-screen--game ipodc-screen--${name}`);
  const canvas = h('canvas', 'ipodc-game', { 'aria-hidden': 'true' });
  // the drawn board is aria-hidden: the score and what to press next are this option's text
  const sr = h('div', 'ipodc-sr', { id: ctx.nid('t'), role: 'option', 'aria-selected': 'true' });
  node.append(canvas, sr);
  const g = canvas.getContext('2d');
  let font = 'sans-serif';
  let k = 1; // canvas px per logical px
  let state = 'ready'; // ready → run ⇄ pause, run → over → run
  let record = false;
  let tickT = 0;
  let overAt = 0;

  function loop() {
    tickT = 0;
    if (!game.tick()) return end();
    draw();
    tickT = timers.later(loop, game.delay());
  }
  function run() {
    state = 'run';
    timers.cancel(tickT);
    tickT = timers.later(loop, game.delay());
    sync();
  }
  function pause(quiet) {
    tickT = timers.cancel(tickT);
    state = 'pause';
    sync();
    if (!quiet) ctx.announce(L.gamePaused);
  }
  function end() {
    tickT = timers.cancel(tickT);
    state = 'over';
    overAt = performance.now();
    record = game.score > best[name];
    best[name] = Math.max(best[name], game.score);
    sync();
    ctx.announce(`${L.gameOver}. ${game.status(L)}.${record ? ` ${L.newBest}` : ''}`);
  }

  // rounded cells in the selection blue (or any fill), shared by the games
  const paint = {
    cell(x, y, fill, size = 10) {
      g.setTransform(k, 0, 0, k, x * k, y * k);
      g.fillStyle = fill;
      g.beginPath();
      g.roundRect(1, 1, size - 2, size - 2, size / 5);
      g.fill();
      g.setTransform(k, 0, 0, k, 0, 0);
    },
    blue(size = 10) {
      const b = g.createLinearGradient(0, 1, 0, size - 1);
      b.addColorStop(0, COLORS.uiHighlightTop);
      b.addColorStop(1, COLORS.uiHighlightBottom);
      return b;
    },
  };
  function draw() {
    const H = canvas.height / k;
    g.setTransform(k, 0, 0, k, 0, 0);
    g.fillStyle = COLORS.uiBackground;
    g.fillRect(0, 0, W, H);
    game.draw(g, H, Object.assign(paint, { k, font, L, best: best[name] }));
    g.setTransform(k, 0, 0, k, 0, 0);
    if (state === 'run') return;
    // not running: the board fades and says what the centre does now
    const [big, ...lines] = state === 'over'
      ? [L.gameOver, `${game.status(L)}${record ? ` · ${L.newBest}` : ''}`, L.gameAgain]
      : state === 'pause' ? [L.gamePaused, L.gameResume] : [title, L.gameStart, ...game.hints.map((t) => L[t])];
    const [ax, ay, aw, ah] = game.area(H);
    g.fillStyle = 'rgba(255,255,255,.84)';
    g.fillRect(ax, ay, aw, ah);
    let y = Math.round(ay + ah / 2 - (22 + lines.length * 17) / 2 + 15);
    g.textAlign = 'center';
    g.fillStyle = COLORS.uiText;
    g.font = `700 17px ${font}`;
    g.fillText(big, W / 2, y);
    g.font = `12.5px ${font}`;
    g.fillStyle = '#4a4e55';
    for (const t of lines) g.fillText(t, W / 2, (y += 19));
  }
  /** redraws and keeps the option's text (what a screen reader reads) in step */
  function sync() {
    draw();
    sr.textContent = s.summary();
  }
  const onVisibility = () => { if (document.hidden && state === 'run' && ctx.isCurrent(s)) pause(true); };

  const s = {
    kind: 'game', id, title, node, rows: [], specs: [], roving: false, index: 0, enteredAt: 0,
    adId: () => sr.id,
    layout() {
      const w = canvas.clientWidth;
      if (!w) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      k = canvas.width / W;
      font = getComputedStyle(node).fontFamily || font;
      draw();
    },
    /** while a round runs the game takes the zones and arrow keys; the centre pauses; left, MENU and
     *  Escape go back while it is not running */
    press(btn) {
      if (state === 'run') {
        if (btn === 'center' || btn === 'play') pause();
        else if (ARROWS.includes(btn) && game.input(btn)) {
          if (game.over) end(); else draw();
        } else return false;
        return true;
      }
      const arrow = ARROWS.includes(btn) && btn !== 'left';
      if (!(arrow || btn === 'center' || btn === 'play')) return false;
      if (state === 'over' && performance.now() - overAt < OVER_LOCK) return true;
      if (state !== 'pause') game.reset();
      if (arrow) game.begin?.(btn);
      run();
      return true;
    },
    /** a wheel step while a round runs: the game's (Snake turns, Blocks slides) */
    move(d) {
      if (state !== 'run') return false;
      game.turn(d);
      if (game.over) end(); else draw();
      return true;
    },
    jump: () => false,
    bump() {},
    activate: () => s.press('center'),
    currentLabel: () => '',
    currentLang: () => null,
    summary: () => [game.status(L), ...(state === 'run' ? [] : state === 'over' ? [L.gameOver, L.gameAgain]
      : state === 'pause' ? [L.gamePaused, L.gameResume] : [L.gameStart, ...game.hints.map((t) => L[t])])].join('. '),
    onShow() { document.addEventListener('visibilitychange', onVisibility); },
    onHide() {
      document.removeEventListener('visibilitychange', onVisibility);
      if (state === 'run') pause(true);
    },
  };
  game.reset();
  sr.textContent = s.summary();
  return s;
}
