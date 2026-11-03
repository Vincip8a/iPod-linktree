// Snake on the logical 320×240 LCD (menu type "game"). The snake moves one cell per tick and grows with
// every dot it eats; a wall or its own body ends the round, and each dot makes it a little faster. The four
// wheel zones and the arrow keys steer, turning the wheel turns it to its left or right, the centre (Enter,
// Space) starts and pauses. While it is not running, left goes back as on every screen. Drawn on a canvas
// in the iPod's own blue; the record lasts for the visit (nothing is stored on the device).
import { h } from './util.js';
import { COLORS } from '../shared/ipodSpec.js';

const W = 320;          // logical px
const CELL = 10;
const COLS = 30;
const ROWS = 19;
const BOARD_X = (W - COLS * CELL) / 2;
const TICK_MS = 150;    // the first speed
const TICK_MIN = 75;    // the fastest
const SPEEDUP = 3;      // ms faster per dot
const WHEEL_TURN = 3;   // wheel steps (about 45–60°) per turn
const OVER_LOCK = 500;  // a press this soon after the crash does not start the next round at once
const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const FOOD = '#24734d'; // the brand's signal green
const HEAD = '#1b56b0';
let best = 0;

export function gameScreen(ctx, id, title) {
  const { L, timers } = ctx;
  const node = h('div', 'ipodc-screen ipodc-screen--game');
  const canvas = h('canvas', 'ipodc-game', { 'aria-hidden': 'true' });
  // the drawn board is aria-hidden: the score and what to press next are this option's text
  const sr = h('div', 'ipodc-sr', { id: ctx.nid('t'), role: 'option', 'aria-selected': 'true' });
  node.append(canvas, sr);
  const g = canvas.getContext('2d');
  let font = 'sans-serif';
  let k = 1; // canvas px per logical px
  let state = 'ready'; // ready → run ⇄ pause, run → over → run
  let snake, dir, queue, food, score, record;
  let tickT = 0;
  let overAt = 0;
  let wAcc = 0;

  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  function reset() {
    const y = ROWS - 5; // below the start text
    snake =[[8, y], [7, y], [6, y], [5, y]];
    dir = DIRS.right;
    queue = [];
    score = 0;
    record = false;
    wAcc = 0;
    placeFood();
  }
  function placeFood() {
    const free = [];
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if (!snake.some((c) => same(c, [x, y]))) free.push([x, y]);
    food = free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }
  const last = () => queue[queue.length - 1] ?? dir;
  /** queues a turn (two at most, one is taken per tick), never straight back into the neck */
  function steer(d) {
    const l = last();
    if (queue.length < 2 && !same(d, l) && !same(d, [-l[0], -l[1]])) queue.push(d);
  }

  function tick() {
    tickT = 0;
    if (queue.length) dir = queue.shift();
    const head = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
    const eats = !!food && same(head, food);
    const body = eats ? snake : snake.slice(0, -1); // the tail moves on unless the snake grows
    if (head[0] < 0 || head[1] < 0 || head[0] >= COLS || head[1] >= ROWS || body.some((c) => same(c, head))) return end();
    snake.unshift(head);
    if (eats) {
      score++;
      placeFood();
      if (!food) return end(); // the board is full
    } else snake.pop();
    draw();
    tickT = timers.later(tick, Math.max(TICK_MIN, TICK_MS - score * SPEEDUP));
  }
  function run() {
    state = 'run';
    timers.cancel(tickT);
    tickT = timers.later(tick, TICK_MS);
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
    record = score > best;
    best = Math.max(best, score);
    sync();
    ctx.announce(`${L.gameOver}. ${L.score}: ${score}.${record ? ` ${L.newBest}` : ''}`);
  }

  function draw() {
    const H = canvas.height / k;
    const by = Math.round(H - ROWS * CELL - 7);
    const bw = COLS * CELL;
    const bh = ROWS * CELL;
    g.setTransform(k, 0, 0, k, 0, 0);
    g.fillStyle = COLORS.uiBackground;
    g.fillRect(0, 0, W, H);
    g.font = `700 12px ${font}`;
    g.textAlign = 'left';
    g.fillStyle = COLORS.uiText;
    g.fillText(`${L.score} ${score}`, BOARD_X, by - 6);
    g.textAlign = 'right';
    g.fillStyle = '#6b6f75';
    g.fillText(`${L.best} ${best}`, BOARD_X + bw, by - 6);
    // the board: a light well with a fine frame
    g.fillStyle = '#eef1f5';
    g.fillRect(BOARD_X, by, bw, bh);
    g.strokeStyle = '#b9bfc8';
    g.lineWidth = 1;
    g.strokeRect(BOARD_X - 0.5, by - 0.5, bw + 1, bh + 1);
    if (food) {
      g.fillStyle = FOOD;
      g.beginPath();
      g.arc(BOARD_X + food[0] * CELL + CELL / 2, by + food[1] * CELL + CELL / 2, 3.6, 0, 7);
      g.fill();
    }
    // the snake in the selection blue, its head darker with two eyes looking ahead
    const blue = g.createLinearGradient(0, 1, 0, CELL - 1);
    blue.addColorStop(0, COLORS.uiHighlightTop);
    blue.addColorStop(1, COLORS.uiHighlightBottom);
    for (let i = snake.length - 1; i >= 0; i--) { // tail first: the head is drawn last, the eyes on it
      const [x, y] = snake[i];
      g.setTransform(k, 0, 0, k, (BOARD_X + x * CELL) * k, (by + y * CELL) * k);
      g.fillStyle = i ? blue : HEAD;
      g.beginPath();
      g.roundRect(1, 1, CELL - 2, CELL - 2, 2);
      g.fill();
    }
    const [dx, dy] = dir;
    g.fillStyle = '#fff';
    for (const side of [-1, 1]) {
      g.beginPath();
      g.arc(CELL / 2 + dx * 1.6 - dy * side * 2, CELL / 2 + dy * 1.6 + dx * side * 2, 1.2, 0, 7);
      g.fill();
    }
    g.setTransform(k, 0, 0, k, 0, 0);
    if (state === 'run') return;
    // not running: the board fades and says what the centre does now
    const [big, ...lines] = state === 'over'
      ? [L.gameOver, `${L.score}: ${score}${record ? ` · ${L.newBest}` : ''}`, L.gameAgain]
      : state === 'pause' ? [L.gamePaused, L.gameResume] : [title, L.gameStart, L.gameSteer];
    g.fillStyle = 'rgba(255,255,255,.84)';
    g.fillRect(BOARD_X, by, bw, bh);
    let y = Math.round(by + bh / 2 - (22 + lines.length * 17) / 2 + 15);
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
    /** the four zones (and arrow keys) steer; left, MENU and Escape go back while the snake is not running */
    press(btn) {
      const d = DIRS[btn];
      if (state === 'run') {
        if (d) steer(d);
        else if (btn === 'center' || btn === 'play') pause();
        else return false;
        return true;
      }
      if (btn === 'left' || !(d || btn === 'center' || btn === 'play')) return false;
      if (state === 'over' && performance.now() - overAt < OVER_LOCK) return true;
      if (state !== 'pause') reset();
      if (d) steer(d); // an arrow starts the round in its direction
      run();
      return true;
    },
    /** a wheel step: turning the wheel turns the snake (clockwise: to its right) */
    move(d) {
      if (state !== 'run') return false;
      wAcc = Math.sign(wAcc) === d ? wAcc + d : d;
      if (Math.abs(wAcc) >= WHEEL_TURN) {
        wAcc = 0;
        const [x, y] = last();
        steer(d > 0 ? [-y, x] : [y, -x]);
      }
      return true;
    },
    jump: () => false,
    bump() {},
    activate: () => s.press('center'),
    currentLabel: () => '',
    currentLang: () => null,
    summary: () => [`${L.score}: ${score}`, ...(state === 'run' ? [] : state === 'over' ? [L.gameOver, L.gameAgain]
      : state === 'pause' ? [L.gamePaused, L.gameResume] : [L.gameStart, L.gameSteer])].join('. '),
    onShow() { document.addEventListener('visibilitychange', onVisibility); },
    onHide() {
      document.removeEventListener('visibilitychange', onVisibility);
      if (state === 'run') pause(true);
    },
  };
  reset();
  sr.textContent = s.summary();
  return s;
}
