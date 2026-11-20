// My Cozy Market's own pixel font, drawn letter by letter, saved as a real font file
// (public/fonts/pawpal-pixel.ttf) so the game, the login page and the name
// box can all use it like any other font.
//
// Why our own? A pixel font only looks sharp when each of its pixels lands
// exactly on a screen pixel. This one is built on a 10-pixel grid, so at
// font-size 10px (or 20px, 30px...) every letter is perfectly crisp.
//
// Each letter is a list of rows: '#' = pixel, '.' = empty. Rows go from the
// top of a capital letter (row 1) down to the bottom of a "g" (row 9):
//
//   rows 1-7  capitals, digits, tall letters (b, d, h, k, l)
//   rows 3-7  small letters (a, c, e, ...)
//   rows 8-9  the tails of g, j, p, q, y
//
// Letters can be any width; there's always 1 empty column between letters.
// To change a letter: edit its rows, run `npm run art`, reload the game.
import { writeFileSync, mkdirSync } from 'node:fs';

const FAMILY = 'Cozy Market Pixel';
const PX = 100; // font units per pixel (1000 units per em = 10 pixels)
const ASCENT = 8; // pixels above the baseline (row 0 is a 1px gap above capitals)
const DESCENT = 2; // pixels below the baseline

// Letters on rows 1-7 only: written as 7 rows (tails rows are added empty).
// Letters with tails: written as 9 rows.
const GLYPHS = {
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['####', '#...', '#...', '###.', '#...', '#...', '####'],
  F: ['####', '#...', '#...', '###.', '#...', '#...', '#...'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['..##', '...#', '...#', '...#', '...#', '#..#', '.##.'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#...', '#...', '#...', '#...', '#...', '#...', '####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.###.', '#...#', '#....', '.###.', '....#', '#...#', '.###.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],

  a: ['....', '....', '.##.', '...#', '.###', '#..#', '.###'],
  b: ['#...', '#...', '###.', '#..#', '#..#', '#..#', '###.'],
  c: ['...', '...', '.##', '#..', '#..', '#..', '.##'],
  d: ['...#', '...#', '.###', '#..#', '#..#', '#..#', '.###'],
  e: ['....', '....', '.##.', '#..#', '####', '#...', '.###'],
  f: ['.##', '#..', '###', '#..', '#..', '#..', '#..'],
  g: ['....', '....', '.###', '#..#', '#..#', '#..#', '.###', '...#', '.##.'],
  h: ['#...', '#...', '###.', '#..#', '#..#', '#..#', '#..#'],
  i: ['#', '.', '#', '#', '#', '#', '#'],
  j: ['.#', '..', '.#', '.#', '.#', '.#', '.#', '.#', '#.'],
  k: ['#...', '#...', '#..#', '#.#.', '##..', '#.#.', '#..#'],
  l: ['#.', '#.', '#.', '#.', '#.', '#.', '.#'],
  m: ['.....', '.....', '####.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
  n: ['....', '....', '###.', '#..#', '#..#', '#..#', '#..#'],
  o: ['....', '....', '.##.', '#..#', '#..#', '#..#', '.##.'],
  p: ['....', '....', '###.', '#..#', '#..#', '#..#', '###.', '#...', '#...'],
  q: ['....', '....', '.###', '#..#', '#..#', '#..#', '.###', '...#', '...#'],
  r: ['...', '...', '#.#', '##.', '#..', '#..', '#..'],
  s: ['....', '....', '.###', '#...', '.##.', '...#', '###.'],
  t: ['.#.', '.#.', '###', '.#.', '.#.', '.#.', '..#'],
  u: ['....', '....', '#..#', '#..#', '#..#', '#..#', '.###'],
  v: ['.....', '.....', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  w: ['.....', '.....', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  x: ['....', '....', '#..#', '#..#', '.##.', '#..#', '#..#'],
  y: ['....', '....', '#..#', '#..#', '#..#', '#..#', '.###', '...#', '.##.'],
  z: ['....', '....', '####', '...#', '.##.', '#...', '####'],

  0: ['.##.', '#..#', '#..#', '#..#', '#..#', '#..#', '.##.'],
  1: ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
  2: ['.##.', '#..#', '...#', '..#.', '.#..', '#...', '####'],
  3: ['.##.', '#..#', '...#', '.##.', '...#', '#..#', '.##.'],
  4: ['#..#', '#..#', '#..#', '####', '...#', '...#', '...#'],
  5: ['####', '#...', '###.', '...#', '...#', '#..#', '.##.'],
  6: ['.##.', '#...', '#...', '###.', '#..#', '#..#', '.##.'],
  7: ['####', '...#', '...#', '..#.', '.#..', '.#..', '.#..'],
  8: ['.##.', '#..#', '#..#', '.##.', '#..#', '#..#', '.##.'],
  9: ['.##.', '#..#', '#..#', '.###', '...#', '...#', '.##.'],

  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '"': ['#.#', '#.#', '...', '...', '...', '...', '...'],
  '#': ['.....', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.....'],
  $: ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'],
  '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'],
  '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
  "'": ['#', '#', '.', '.', '.', '.', '.'],
  '(': ['.#', '#.', '#.', '#.', '#.', '#.', '.#'],
  ')': ['#.', '.#', '.#', '.#', '.#', '.#', '#.'],
  '*': ['...', '#.#', '.#.', '#.#', '...', '...', '...'],
  '+': ['...', '...', '.#.', '###', '.#.', '...', '...'],
  ',': ['..', '..', '..', '..', '..', '..', '.#', '#.', '..'],
  '-': ['...', '...', '...', '###', '...', '...', '...'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  '/': ['..#', '..#', '.#.', '.#.', '.#.', '#..', '#..'],
  ':': ['.', '.', '#', '.', '.', '.', '#'],
  ';': ['..', '..', '.#', '..', '..', '..', '.#', '#.', '..'],
  '<': ['...', '..#', '.#.', '#..', '.#.', '..#', '...'],
  '=': ['...', '...', '###', '...', '###', '...', '...'],
  '>': ['...', '#..', '.#.', '..#', '.#.', '#..', '...'],
  '?': ['.##.', '#..#', '...#', '..#.', '.#..', '....', '.#..'],
  '@': ['.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.###.'],
  '[': ['##', '#.', '#.', '#.', '#.', '#.', '##'],
  '\\': ['#..', '#..', '.#.', '.#.', '.#.', '..#', '..#'],
  ']': ['##', '.#', '.#', '.#', '.#', '.#', '##'],
  '^': ['.#.', '#.#', '...', '...', '...', '...', '...'],
  _: ['....', '....', '....', '....', '....', '....', '....', '####', '....'],
  '`': ['#.', '.#', '..', '..', '..', '..', '..'],
  '{': ['..#', '.#.', '.#.', '#..', '.#.', '.#.', '..#'],
  '|': ['#', '#', '#', '#', '#', '#', '#', '#', '.'],
  '}': ['#..', '.#.', '.#.', '..#', '.#.', '.#.', '#..'],
  '~': ['.....', '.....', '.#..#', '#.##.', '.....', '.....', '.....'],

  // a few symbols the game uses
  '…': ['.....', '.....', '.....', '.....', '.....', '.....', '#.#.#'],
  '·': ['.', '.', '.', '#', '.', '.', '.'],
  '×': ['...', '...', '#.#', '.#.', '#.#', '...', '...'],
  '◀': ['...#', '..##', '.###', '####', '.###', '..##', '...#'],
  '▶': ['#...', '##..', '###.', '####', '###.', '##..', '#...'],
  '▲': ['.....', '.....', '..#..', '.###.', '#####', '.....', '.....'],
  '▼': ['.....', '.....', '#####', '.###.', '..#..', '.....', '.....'],
  '↑': ['..#..', '.###.', '#.#.#', '..#..', '..#..', '..#..', '..#..'],
  '←': ['.....', '.#...', '#....', '#####', '#....', '.#...', '.....'],
  '→': ['.....', '...#.', '....#', '#####', '....#', '...#.', '.....'],
  '✓': ['.....', '.....', '....#', '...#.', '#.#..', '.#...', '.....'],
  '♥': ['.....', '##.##', '#####', '#####', '.###.', '..#..', '.....'],
};

// ---------- turning pixels into font outlines ----------

// The outline of a letter: the edges of its pixels that aren't shared with
// a neighbor, joined into closed loops (clockwise, as TrueType wants).
function contours(rows) {
  const on = (x, y) => rows[y]?.[x] === '#';
  const edges = new Map(); // "x,y" start point -> list of end points
  const add = (x1, y1, x2, y2) => {
    const k = `${x1},${y1}`;
    if (!edges.has(k)) edges.set(k, []);
    edges.get(k).push([x2, y2]);
  };
  // grid coordinates: x across, y down from row 0 (the top of the em)
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (!on(x, y)) continue;
      if (!on(x, y - 1)) add(x, y, x + 1, y); // top edge, going right
      if (!on(x + 1, y)) add(x + 1, y, x + 1, y + 1); // right edge, going down
      if (!on(x, y + 1)) add(x + 1, y + 1, x, y + 1); // bottom edge, going left
      if (!on(x - 1, y)) add(x, y + 1, x, y); // left edge, going up
    }
  });
  const loops = [];
  for (;;) {
    const startKey = [...edges.keys()].find((k) => edges.get(k).length);
    if (!startKey) break;
    const loop = [];
    let [x, y] = startKey.split(',').map(Number);
    const sx = x;
    const sy = y;
    do {
      loop.push([x, y]);
      const next = edges.get(`${x},${y}`).shift();
      [x, y] = next;
    } while (x !== sx || y !== sy);
    // drop points in the middle of straight lines
    loops.push(loop.filter((p, i) => {
      const a = loop[(i - 1 + loop.length) % loop.length];
      const b = loop[(i + 1) % loop.length];
      return !((a[0] === p[0] && p[0] === b[0]) || (a[1] === p[1] && p[1] === b[1]));
    }));
  }
  return loops;
}

// ---------- writing the .ttf file ----------

class Buf {
  constructor() {
    this.bytes = [];
  }
  u8(v) {
    this.bytes.push(v & 255);
    return this;
  }
  u16(v) {
    return this.u8(v >> 8).u8(v);
  }
  i16(v) {
    return this.u16(v < 0 ? v + 65536 : v);
  }
  u32(v) {
    return this.u16(Math.floor(v / 65536) & 65535).u16(v & 65535);
  }
  tag(s) {
    for (const ch of s) this.u8(ch.charCodeAt(0));
    return this;
  }
  get length() {
    return this.bytes.length;
  }
  buffer() {
    return Buffer.from(this.bytes);
  }
}

function checksum(buf) {
  let sum = 0;
  for (let i = 0; i < buf.length; i += 4) sum = (sum + ((buf[i] << 24) | ((buf[i + 1] ?? 0) << 16) | ((buf[i + 2] ?? 0) << 8) | (buf[i + 3] ?? 0))) >>> 0;
  return sum;
}

export function buildFont() {
  // glyph 0 is the "missing letter" box
  const missing = ['####', '#..#', '#..#', '#..#', '#..#', '#..#', '####'];
  const entries = [[null, missing], ...Object.entries(GLYPHS).sort((a, b) => a[0].codePointAt(0) - b[0].codePointAt(0))];
  const glyphs = entries.map(([ch, rows7]) => {
    const rows = ['', ...rows7]; // row 0: the gap above capitals
    while (rows.length < ASCENT + DESCENT) rows.push('');
    const width = Math.max(...rows7.map((r) => r.length));
    const loops = contours(rows);
    // grid (x, y down from the top) -> font units (x, y up from the baseline)
    const pts = loops.map((loop) => loop.map(([x, y]) => [x * PX, (ASCENT - y) * PX]));
    const all = pts.flat();
    return {
      ch,
      advance: (width + 1) * PX,
      loops: pts,
      xMin: all.length ? Math.min(...all.map((p) => p[0])) : 0,
      xMax: all.length ? Math.max(...all.map((p) => p[0])) : 0,
      yMin: all.length ? Math.min(...all.map((p) => p[1])) : 0,
      yMax: all.length ? Math.max(...all.map((p) => p[1])) : 0,
    };
  });

  // glyf + loca
  const glyf = new Buf();
  const loca = [];
  for (const g of glyphs) {
    loca.push(glyf.length);
    if (!g.loops.length) continue;
    glyf.i16(g.loops.length).i16(g.xMin).i16(g.yMin).i16(g.xMax).i16(g.yMax);
    let end = -1;
    for (const loop of g.loops) glyf.u16((end += loop.length));
    glyf.u16(0); // no hinting instructions
    const points = g.loops.flat();
    for (let k = 0; k < points.length; k++) glyf.u8(1); // every point is on the curve; x and y stored as 2-byte steps
    let px = 0;
    for (const [x] of points) {
      glyf.i16(x - px);
      px = x;
    }
    let py = 0;
    for (const [, y] of points) {
      glyf.i16(y - py);
      py = y;
    }
    while (glyf.length % 4) glyf.u8(0);
  }
  loca.push(glyf.length);
  const locaBuf = new Buf();
  for (const o of loca) locaBuf.u32(o);

  const n = glyphs.length;
  const maxPoints = Math.max(...glyphs.map((g) => g.loops.flat().length));
  const maxContours = Math.max(...glyphs.map((g) => g.loops.length));
  const advMax = Math.max(...glyphs.map((g) => g.advance));
  const xMaxAll = Math.max(...glyphs.map((g) => g.xMax));
  const yMinAll = Math.min(...glyphs.map((g) => g.yMin));
  const yMaxAll = Math.max(...glyphs.map((g) => g.yMax));
  const UPM = (ASCENT + DESCENT) * PX;

  const head = new Buf()
    .u32(0x00010000).u32(0x00010000).u32(0) // version, revision, checksum adjustment (filled in later)
    .u32(0x5f0f3cf5).u16(0x000b).u16(UPM)
    .u32(0).u32(0).u32(0).u32(0) // created, modified
    .i16(0).i16(yMinAll).i16(xMaxAll).i16(yMaxAll)
    .u16(0).u16(8).i16(2).i16(1).i16(0); // macStyle, smallest size, direction, long loca, glyph format

  const hhea = new Buf()
    .u32(0x00010000).i16(ASCENT * PX).i16(-DESCENT * PX).i16(0)
    .u16(advMax).i16(0).i16(0).i16(xMaxAll)
    .i16(1).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0)
    .u16(n);

  const maxp = new Buf().u32(0x00010000).u16(n).u16(maxPoints).u16(maxContours).u16(0).u16(0).u16(2);
  for (let k = 0; k < 8; k++) maxp.u16(0);

  const codes = glyphs.slice(1).map((g) => g.ch.codePointAt(0));
  const os2 = new Buf()
    .u16(4).i16(Math.round(glyphs.reduce((s, g) => s + g.advance, 0) / n)).u16(400).u16(5).u16(0)
    .i16(500).i16(500).i16(0).i16(100).i16(500).i16(500).i16(0).i16(300).i16(PX).i16(4 * PX)
    .i16(0);
  for (let k = 0; k < 10; k++) os2.u8(0); // panose
  os2.u32(1).u32(0).u32(0).u32(0).tag('PAWP').u16(0x40)
    .u16(Math.min(...codes)).u16(Math.min(0xffff, Math.max(...codes)))
    .i16(ASCENT * PX).i16(-DESCENT * PX).i16(0).u16(ASCENT * PX).u16(DESCENT * PX)
    .u32(1).u32(0).i16(5 * PX).i16(7 * PX).u16(0).u16(32).u16(1);

  const hmtx = new Buf();
  for (const g of glyphs) hmtx.u16(g.advance).i16(g.xMin);

  // cmap: format 4, one segment per letter
  const segs = glyphs.slice(1).map((g, k) => ({ code: g.ch.codePointAt(0), id: k + 1 })).sort((a, b) => a.code - b.code);
  const segCount = segs.length + 1;
  const searchRange = 2 * 2 ** Math.floor(Math.log2(segCount));
  const sub = new Buf()
    .u16(4).u16(16 + segCount * 8).u16(0)
    .u16(segCount * 2).u16(searchRange).u16(Math.log2(searchRange / 2)).u16(segCount * 2 - searchRange);
  for (const s of segs) sub.u16(s.code);
  sub.u16(0xffff).u16(0);
  for (const s of segs) sub.u16(s.code);
  sub.u16(0xffff);
  for (const s of segs) sub.i16((s.id - s.code + 65536) % 65536 > 32767 ? ((s.id - s.code + 65536) % 65536) - 65536 : (s.id - s.code + 65536) % 65536);
  sub.i16(1);
  for (let k = 0; k < segCount; k++) sub.u16(0);
  const cmap = new Buf().u16(0).u16(1).u16(3).u16(1).u32(12);
  cmap.bytes.push(...sub.bytes);

  // name
  const names = [[1, FAMILY], [2, 'Regular'], [3, `${FAMILY} Regular`], [4, FAMILY], [5, 'Version 1.0'], [6, 'CozyMarketPixel-Regular']];
  const strs = names.map(([, s]) => Buffer.from(s, 'utf16le').swap16());
  const name = new Buf().u16(0).u16(names.length).u16(6 + names.length * 12);
  let off = 0;
  names.forEach(([id], k) => {
    name.u16(3).u16(1).u16(0x409).u16(id).u16(strs[k].length).u16(off);
    off += strs[k].length;
  });
  for (const s of strs) name.bytes.push(...s);

  const post = new Buf().u32(0x00030000).u32(0).i16(-PX).i16(PX / 2).u32(0).u32(0).u32(0).u32(0).u32(0);

  const tables = { 'OS/2': os2, cmap, glyf, head, hhea, hmtx, loca: locaBuf, maxp, name, post };
  const tags = Object.keys(tables).sort();
  const numTables = tags.length;
  const sr = 16 * 2 ** Math.floor(Math.log2(numTables));
  const dir = new Buf().u32(0x00010000).u16(numTables).u16(sr).u16(Math.log2(sr / 16)).u16(numTables * 16 - sr);
  let offset = 12 + numTables * 16;
  const bodies = [];
  for (const tag of tags) {
    const data = tables[tag].buffer();
    const padded = Buffer.concat([data, Buffer.alloc((4 - (data.length % 4)) % 4)]);
    dir.tag(tag).u32(checksum(padded)).u32(offset).u32(data.length);
    bodies.push({ tag, offset, padded });
    offset += padded.length;
  }
  const font = Buffer.concat([dir.buffer(), ...bodies.map((b) => b.padded)]);
  const headAt = bodies.find((b) => b.tag === 'head').offset;
  font.writeUInt32BE((0xb1b0afba - checksum(font)) >>> 0, headAt + 8);
  return font;
}

export function saveFont(dir = 'public/fonts') {
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/pawpal-pixel.ttf`, buildFont());
}

// A preview of every letter (tools/preview/font.png), drawn on a Canvas.
export function fontPreview(Canvas, text) {
  const lines = text.split('\n');
  const width = Math.max(...lines.map((l) => [...l].reduce((s, ch) => s + ((GLYPHS[ch]?.[0].length ?? 4) + 1), 0))) + 4;
  const c = new Canvas(width, lines.length * 12 + 4);
  c.rect(0, 0, c.w, c.h, 0x2f4a52);
  lines.forEach((line, li) => {
    let x = 2;
    for (const ch of line) {
      const rows = GLYPHS[ch] ?? GLYPHS['?'];
      rows.forEach((row, y) => [...row].forEach((p, dx) => p === '#' && c.set(x + dx, 3 + li * 12 + y, 0xf2ead8)));
      x += rows[0].length + 1;
    }
  });
  return c;
}
