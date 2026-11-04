// Snake (game.js frame): the snake moves one cell per tick and grows with every dot it eats; a wall or its
// own body ends the round, and each dot makes it a little faster. The four zones and the arrow keys steer,
// turning the wheel turns it to its left or right; an arrow that starts a round starts it that way.
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
const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const FOOD = '#24734d'; // the brand's signal green
const HEAD = '#1b56b0';

const same = (a, b) => a[0] === b[0] && a[1] === b[1];
const boardY = (H) => Math.round(H - ROWS * CELL - 7);

export function snake() {
  let body, dir, queue, food;
  let wAcc = 0;
  const last = () => queue[queue.length - 1] ?? dir;
  /** queues a turn (two at most, one is taken per tick), never straight back into the neck */
  function steer(d) {
    const l = last();
    if (queue.length < 2 && !same(d, l) && !same(d, [-l[0], -l[1]])) queue.push(d);
  }
  function placeFood() {
    const free = [];
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if (!body.some((c) => same(c, [x, y]))) free.push([x, y]);
    food = free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }

  const s = {
    score: 0,
    over: false,
    hints: ['gameSteer'],
    delay: () => Math.max(TICK_MIN, TICK_MS - s.score * SPEEDUP),
    reset() {
      const y = ROWS - 5; // below the start text
      body = [[8, y], [7, y], [6, y], [5, y]];
      dir = DIRS.right;
      queue = [];
      s.score = 0;
      s.over = false;
      wAcc = 0;
      placeFood();
    },
    begin(btn) { steer(DIRS[btn]); },
    tick() {
      if (queue.length) dir = queue.shift();
      const head = [body[0][0] + dir[0], body[0][1] + dir[1]];
      const eats = !!food && same(head, food);
      const rest = eats ? body : body.slice(0, -1); // the tail moves on unless the snake grows
      if (head[0] < 0 || head[1] < 0 || head[0] >= COLS || head[1] >= ROWS || rest.some((c) => same(c, head))) return false;
      body.unshift(head);
      if (eats) {
        s.score++;
        placeFood();
        return !!food; // a full board ends the round
      }
      body.pop();
      return true;
    },
    input(btn) {
      steer(DIRS[btn]);
      return true;
    },
    /** turning the wheel turns the snake (clockwise: to its right), one turn per WHEEL_TURN steps */
    turn(d) {
      wAcc = Math.sign(wAcc) === d ? wAcc + d : d;
      if (Math.abs(wAcc) < WHEEL_TURN) return;
      wAcc = 0;
      const [x, y] = last();
      steer(d > 0 ? [-y, x] : [y, -x]);
    },
    status: (L) => `${L.score}: ${s.score}`,
    area: (H) => [BOARD_X, boardY(H), COLS * CELL, ROWS * CELL],
    draw(g, H, p) {
      const by = boardY(H);
      const bw = COLS * CELL;
      const bh = ROWS * CELL;
      g.font = `700 12px ${p.font}`;
      g.textAlign = 'left';
      g.fillStyle = COLORS.uiText;
      g.fillText(`${p.L.score} ${s.score}`, BOARD_X, by - 6);
      g.textAlign = 'right';
      g.fillStyle = '#6b6f75';
      g.fillText(`${p.L.best} ${p.best}`, BOARD_X + bw, by - 6);
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
      const blue = p.blue(CELL);
      for (let i = body.length - 1; i >= 0; i--) p.cell(BOARD_X + body[i][0] * CELL, by + body[i][1] * CELL, i ? blue : HEAD, CELL);
      const [hx, hy] = [BOARD_X + body[0][0] * CELL, by + body[0][1] * CELL];
      const [dx, dy] = dir;
      g.fillStyle = '#fff';
      for (const side of [-1, 1]) {
        g.beginPath();
        g.arc(hx + CELL / 2 + dx * 1.6 - dy * side * 2, hy + CELL / 2 + dy * 1.6 + dx * side * 2, 1.2, 0, 7);
        g.fill();
      }
    },
  };
  return s;
}
