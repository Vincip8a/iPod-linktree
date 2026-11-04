// Blocks (game.js frame): our own falling-block game. Pieces of four cells fall into a well ten cells wide;
// a full row disappears, and every ten rows the pieces fall faster. Turning the wheel or pressing left and
// right slides the piece, up turns it, down lets it fall faster; a piece that cannot come in ends the round.
// Drawn in the iPod's blues: the falling piece in the selection blue, the stack in the night slate.
import { COLORS } from '../shared/ipodSpec.js';

const CELL = 10;        // logical px
const COLS = 10;
const ROWS = 20;
const WELL_X = 110;     // the well in the middle, the counts left of it, the next piece right of it
const PANEL_L = 14;
const PANEL_R = 228;
const DROP_MS = 600;    // the first speed, one row per tick
const DROP_MIN = 90;
const SPEEDUP = 55;     // ms faster per level
const LINES = [0, 100, 300, 500, 800]; // points for 1–4 rows at once, times the level
// the seven pieces of four cells, as cells in an n × n box (they turn inside it)
const PIECES = {
  I: { n: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { n: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  T: { n: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { n: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { n: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { n: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { n: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
};
const KICKS = [0, -1, 1, -2, 2]; // a turn against a wall or the stack tries these sideways shifts

const wellY = (H) => Math.round((H - ROWS * CELL) / 2);

export function blocks() {
  let grid, piece, next, bag, lines;
  /** the seven pieces in a shuffled order, then the next seven: none waits long */
  function take() {
    if (!bag?.length) {
      bag = Object.keys(PIECES);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop();
  }
  function spawn(kind) {
    const { n, cells } = PIECES[kind];
    return { kind, n, cells: cells.map((c) => [...c]), x: Math.floor((COLS - n) / 2), y: -Math.min(...cells.map((c) => c[1])) };
  }
  const fits = (cells, x, y) => cells.every(([cx, cy]) => {
    const gx = x + cx;
    const gy = y + cy;
    return gx >= 0 && gx < COLS && gy < ROWS && (gy < 0 || !grid[gy][gx]);
  });
  const level = () => 1 + Math.floor(lines / 10);
  /** the piece joins the stack, full rows go, the next piece comes in (or cannot: game over) */
  function lock() {
    for (const [cx, cy] of piece.cells) if (piece.y + cy >= 0) grid[piece.y + cy][piece.x + cx] = 1;
    const kept = grid.filter((row) => row.some((c) => !c));
    const cleared = ROWS - kept.length;
    if (cleared) {
      s.score += LINES[cleared] * level();
      lines += cleared;
      grid = [...Array.from({ length: cleared }, () => Array(COLS).fill(0)), ...kept];
    }
    piece = spawn(next);
    next = take();
    if (!fits(piece.cells, piece.x, piece.y)) s.over = true;
  }
  function shift(dx) {
    if (fits(piece.cells, piece.x + dx, piece.y)) piece.x += dx;
  }
  function rotate() {
    if (piece.kind === 'O') return;
    const cells = piece.cells.map(([x, y]) => [piece.n - 1 - y, x]); // a quarter turn clockwise
    const dx = KICKS.find((d) => fits(cells, piece.x + d, piece.y));
    if (dx === undefined) return;
    piece.cells = cells;
    piece.x += dx;
  }
  /** one row down; at the bottom (or on the stack) the piece locks */
  function fall() {
    if (fits(piece.cells, piece.x, piece.y + 1)) {
      piece.y++;
      return true;
    }
    lock();
    return false;
  }

  const s = {
    score: 0,
    over: false,
    hints: ['blocksSteer', 'blocksDrop'],
    delay: () => Math.max(DROP_MIN, DROP_MS - (level() - 1) * SPEEDUP),
    reset() {
      grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      bag = null;
      lines = 0;
      s.score = 0;
      s.over = false;
      piece = spawn(take());
      next = take();
    },
    tick() {
      fall();
      return !s.over;
    },
    input(btn) {
      if (btn === 'left' || btn === 'right') shift(btn === 'right' ? 1 : -1);
      else if (btn === 'up') rotate();
      else if (fall()) s.score++; // down: one row faster, a point per row
      return true;
    },
    /** turning the wheel slides the piece, one cell per step (clockwise: to the right) */
    turn(d) { shift(d > 0 ? 1 : -1); },
    status: (L) => `${L.score}: ${s.score} · ${L.lines}: ${lines}`,
    area: (H) => [PANEL_L - 4, wellY(H), 320 - 2 * (PANEL_L - 4), ROWS * CELL],
    draw(g, H, p) {
      const wy = wellY(H);
      g.fillStyle = '#eef1f5';
      g.fillRect(WELL_X, wy, COLS * CELL, ROWS * CELL);
      g.strokeStyle = '#b9bfc8';
      g.lineWidth = 1;
      g.strokeRect(WELL_X - 0.5, wy - 0.5, COLS * CELL + 1, ROWS * CELL + 1);
      // the stack in the night slate, the falling piece in the selection blue
      const slate = g.createLinearGradient(0, 1, 0, CELL - 1);
      slate.addColorStop(0, '#6b7386');
      slate.addColorStop(1, '#3a4155');
      grid.forEach((row, y) => row.forEach((c, x) => { if (c) p.cell(WELL_X + x * CELL, wy + y * CELL, slate, CELL); }));
      const blue = p.blue(CELL);
      for (const [cx, cy] of piece.cells) {
        if (piece.y + cy >= 0) p.cell(WELL_X + (piece.x + cx) * CELL, wy + (piece.y + cy) * CELL, blue, CELL);
      }
      // the counts on the left, the next piece on the right
      g.textAlign = 'left';
      [[p.L.score, s.score], [p.L.lines, lines], [p.L.level, level()], [p.L.best, p.best]].forEach(([label, value], i) => {
        const y = wy + 16 + i * 46;
        g.font = `11px ${p.font}`;
        g.fillStyle = '#6b6f75';
        g.fillText(label, PANEL_L, y);
        g.font = `700 16px ${p.font}`;
        g.fillStyle = COLORS.uiText;
        g.fillText(String(value), PANEL_L, y + 19);
      });
      g.font = `11px ${p.font}`;
      g.fillStyle = '#6b6f75';
      g.fillText(p.L.next, PANEL_R, wy + 16);
      const { n, cells } = PIECES[next];
      const small = p.blue(8);
      for (const [cx, cy] of cells) p.cell(PANEL_R + (cx + (4 - n) / 2) * 8, wy + 26 + cy * 8, small, 8);
    },
  };
  return s;
}
