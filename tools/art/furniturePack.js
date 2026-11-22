// The big furniture pack (src/data/furniturePack.js): every piece gets
//   item-<id>.png   its 16 x 16 shop picture, seen from the front
//   iso-<id>.png    floor things: a 3D picture for your home (see furniture.js
//                   for how the iso() workspace works)
//   wall-<id>.png   curtains and hanging plants: a big picture for the wall
// Other wall things (frames, mirrors, shelves) hang on the wall as their shop
// picture, drawn twice as big and slanted to lie along the wall.
//
// Also here: new hanging-plant pictures for the plant shop (they used to
// look flat and oddly colored, now they hang from a little iron hook).
import { Canvas } from './canvas.js';
import { P } from './palette.js';
import { C, icon, shadow, pot } from './items.js';
import { tone, piece, legs, pillow, plantPot } from './furniture.js';
import { FURNITURE_PACK } from '../../src/data/furniturePack.js';
import { FOOTPRINT, WALL_ART, wallArtTexture } from '../../src/data/furniture.js';

// ---------- colors ----------

const K = {
  oak: 0x9a6f48,
  oakDark: 0x6e4c32,
  honey: 0xc9963e,
  moss: 0x5e7a4e,
  rose: 0xc98a96,
  plum: 0x5d3f63,
  leather: 0x7a3f2e,
  wicker: 0xc9a86a,
  wickerDark: 0x9a7a44,
  sagePaint: 0x7f9a80,
  oatmeal: 0xd8c8a8,
  red: 0xb8404a,
  redDark: 0x82303a,
  navy: 0x2c3352,
  glass: 0x9ccfd4,
  glassDark: 0x6fa8b0,
  shine: 0xdff0f0,
  mirror: 0x8fbfc8,
  rust: 0xa8583e,
  mustard: 0xd9a646,
  flame: 0xffe3a0,
  black: 0x2b2b30,
  // plant greens: cool and deep, with a soft light leaf (no yellow-greens)
  leafDeep: 0x2c4a36,
  leafMid: 0x3f6b4a,
  leafSoft: 0x5f8f5a,
  leafHi: 0x8fb878,
  succulent: 0x7fa89a,
  succulentHi: 0xa8c8b8,
  succulentTip: 0xd9a3ad,
};

const BOOKS = [P.brick, P.sage, P.lilac, P.cream, K.navy, P.pink, K.mustard, P.sageShade];

// a little random number generator that always gives the same numbers
function rng(seed) {
  let r = seed * 9301 + 49297;
  return () => ((r = (r * 9301 + 49297) % 233280) / 233280);
}

// ---------- 3D helpers ----------

// Paint the top of an a x b patch at height z one pixel at a time:
// color(i, j) gives the color at that floor spot (or null to skip). Great for
// rug patterns.
function paintFlat(s, a, b, z, color) {
  const [ox, oy] = s.p(0, 0, z);
  const { c } = s;
  for (let y = oy - 2; y <= oy + a + b + 2; y++)
    for (let x = ox - 2 * b - 2; x <= ox + 2 * a + 2; x++) {
      const u = (x + 0.5 - ox) / 2;
      const v = y + 0.5 - oy;
      const i = (u + v) / 2;
      const j = (v - u) / 2;
      if (i < 0 || j < 0 || i >= a || j >= b) continue;
      const col = color(i, j);
      if (col !== null && col !== undefined) c.set(x, y, col);
    }
}

// A row of book spines on the front face (j = b) from i0 to i1 at height z.
function bookRow(s, i0, i1, b, z, maxH, seed) {
  const rand = rng(seed);
  let i = i0;
  while (i < i1 - 0.5) {
    const w = Math.min(i1 - i, rand() > 0.6 ? 1.5 : 1);
    const h = maxH - Math.floor(rand() * 3);
    const col = BOOKS[Math.floor(rand() * BOOKS.length)];
    s.front(i, b, z, w, h, col);
    if (h > 3) s.front(i, b, z + h - 2, w, 1, tone(col, 1.25));
    i += w;
  }
}

// A flame with a soft glow at a 3D point.
function flame(s, i, j, z) {
  s.glow(i, j, z + 1, 6, P.glowWarm, 45);
  const [x, y] = s.p(i, j, z);
  s.c.set(x, y - 1, K.flame);
  s.c.set(x, y, P.glowWarm);
}

// A candle standing at (i, j, z).
function candle(s, i, j, z, h = 4, color = P.cream) {
  s.cyl(i, j, z, 0.8, h, color, { side: tone(color, 0.8) });
  flame(s, i, j, z + h + 1);
}

// A small pot with a little plant in it, for shelves and stands.
function tinyPlant(s, i, j, z, potColor, kind = 0) {
  s.cyl(i, j, z, 1.4, 3, potColor, { side: tone(potColor, 0.75) });
  const [x, y] = s.p(i, j, z + 3);
  if (kind === 0) {
    s.c.ellipse(x, y - 2, 3, 2.5, K.leafMid);
    s.c.ellipse(x - 1, y - 3, 1.5, 1.2, K.leafSoft);
  } else if (kind === 1) {
    for (const dx of [-2, 0, 2]) s.c.line(x, y, x + dx, y - 5 + Math.abs(dx), K.leafSoft);
  } else {
    s.c.ellipse(x, y - 1, 2.5, 1.5, K.succulent);
    s.c.set(x, y - 2, K.succulentTip);
  }
}

// ---------- sofas and chairs ----------

// A sofa or armchair: legs, a base, a back, arms and seat cushions.
function sofa(s, a, b, o) {
  const { color, shade = tone(color, 0.75), legColor = P.woodDark, backH = 15, armH = 5, seats = 2, tufts = false, roll = false } = o;
  legs(s, a, b, 0, 2, legColor, 1);
  s.box(0, 0, 2, a, 4, backH + 1, color, { side: shade }); // back
  if (tufts) for (let i = 3; i < a - 2; i += 3) for (const z of [11, 14]) s.dot(i + (z === 14 ? 1.5 : 0), 4, z, tone(color, 0.6));
  s.box(0, 0, 2, a, b, 6, color, { side: shade }); // base
  const w = (a - 6) / seats;
  for (let k = 0; k < seats; k++) s.box(3 + k * w, 3, 8, w - 0.5, b - 4, 2, tone(color, 1.08), { side: shade }); // seat cushions
  s.box(0, 1, 8, 3, b - 1, armH, color, { side: shade }); // arms
  s.box(a - 3, 1, 8, 3, b - 1, armH, color, { side: shade });
  if (roll) {
    s.ball(1.5, b - 1, 8 + armH, 3, 2, tone(color, 1.1));
    s.ball(a - 1.5, b - 1, 8 + armH, 3, 2, tone(color, 1.05));
  }
}

function ladderChair(s, a, b, color, spindles) {
  legs(s, a, b, 0, 8, color, 0.5, 1);
  s.box(0.5, 0.5, 0, 1, 1, 22, color, { edge: false }); // back posts
  s.box(a - 1.5, 0.5, 0, 1, 1, 22, color, { edge: false });
  if (spindles) {
    for (let i = 2; i < a - 1.5; i += 1.5) s.box(i, 0.5, 9, 0.6, 0.6, 12, tone(color, 0.85), { edge: false });
    s.box(0.5, 0, 20, a - 1, 1.5, 2, color);
  } else {
    for (const z of [12, 16, 20]) s.box(0.5, 0.5, z, a - 1, 1, 1.5, color, { edge: false });
  }
  s.box(0, 0, 8, a, b, 1.5, spindles ? color : P.creamShade, { side: tone(color, 0.75) }); // seat
  if (!spindles) for (let k = 1; k < b; k += 1.5) s.line([0.5, k, 9.5], [a - 0.5, k, 9.5], tone(P.creamShade, 0.85)); // woven rush
}

const SEATS = [
  piece('moss-loveseat', (s, a, b) => sofa(s, a, b, { color: K.moss, seats: 2 })),
  piece('rose-settee', (s, a, b) => {
    sofa(s, a, b, { color: K.rose, legColor: P.wood, backH: 13, armH: 4, seats: 2, roll: true });
    s.box(a / 2 - 3, 0, 18, 6, 2, 2, P.wood); // carved crest on the back
  }),
  piece('plum-sofa', (s, a, b) => {
    sofa(s, a, b, { color: K.plum, seats: 3 });
    s.box(4, 3.5, 10, 4, 1.5, 5, K.mustard, { side: tone(K.mustard, 0.75) }); // throw pillows
    s.box(a - 8, 3.5, 10, 4, 1.5, 5, K.mustard, { side: tone(K.mustard, 0.75) });
  }),
  piece('chesterfield', (s, a, b) => {
    sofa(s, a, b, { color: K.leather, legColor: P.woodDark, backH: 11, armH: 7, seats: 3, tufts: true, roll: true });
    for (let i = 4; i < a - 3; i += 3) s.dot(i, 1, 15, tone(K.leather, 1.3)); // brass studs
  }),
  piece('wingback-chair', (s, a, b) => {
    // Built from the same 3D boxes as the sofas. The wings and arms are one
    // piece each: a side that slopes from the tall back down to a rolled arm
    // at the front, so it reads as a wingback and not as steps.
    const body = P.sageDark;
    const side = tone(body, 0.72);
    const top = tone(body, 1.2);
    const { p, c } = s;
    const wing = (i0, w, lit) => {
      const i1 = i0 + w;
      const high = 27; // height of the wing at the back
      const low = 15; // height of the arm at the front
      // the right-hand side (only the right wing shows it), front and sloping top
      c.poly([p(i1, 0, 5), p(i1, b, 5), p(i1, b, low), p(i1, 0, high)], side);
      c.poly([p(i0, b, 5), p(i1, b, 5), p(i1, b, low), p(i0, b, low)], lit ? tone(body, 1.05) : body);
      c.poly([p(i0, 0, high), p(i1, 0, high), p(i1, b, low), p(i0, b, low)], top);
      c.line(...p(i0, b, low), ...p(i1, b, low), tone(top, 1.15));
      s.ball(i0 + w / 2, b - 0.5, low, 3.2, 2.2, tone(body, 1.28)); // the rolled front of the arm
    };
    legs(s, a, b, 0, 4, P.woodDark, 1);
    wing(0, 3, true);
    // the tall back with a rounded top, drawn as columns
    s.box(3, 0, 4, a - 6, 3, 9, body, { side });
    for (let i = 0; i < a; i += 0.5) {
      const t = (i + 0.25 - a / 2) / (a / 2);
      const h = 22 + 5 * Math.sqrt(Math.max(0, 1 - t * t));
      s.front(i, 3, 4, 0.5, h, i < a / 2 ? tone(body, 1.05) : body);
      s.front(i, 3, 4 + h - 1, 0.5, 1, tone(top, 1.1)); // a lit rim along the top
    }
    s.box(0, 0, 4, a, 3, 6, body, { side }); // the base, joining the back to the seat
    // buttons on the back
    for (const [i, z] of [[a / 2 - 2, 23], [a / 2 + 2, 23], [a / 2 - 4, 17], [a / 2, 17], [a / 2 + 4, 17], [a / 2 - 2, 11], [a / 2 + 2, 11]]) s.dot(i, 3, z, side);
    // seat
    s.box(3, 3, 4, a - 6, b - 3, 5, body, { side });
    s.box(3, 3, 9, a - 6, b - 4, 2, P.sage, { side: P.sageShade }); // seat cushion
    s.box(3.5, 3, 11, a - 7, 2, 7, tone(P.sage, 1.08), { side: P.sageShade }); // back cushion
    wing(a - 3, 3, false);
    for (const j of [b - 3, b - 6]) s.dot(a, j, 11, P.gold); // brass nailheads
  }),
  piece('honey-armchair', (s, a, b) => {
    sofa(s, a, b, { color: K.honey, seats: 1, backH: 13, armH: 6, roll: true });
    s.box(4, 3.5, 10, 4, 1.5, 4, P.cream, { side: P.creamShade }); // a little cushion
  }),
  piece('wicker-chair', (s, a, b) => {
    // the big round back stands along the back edge, made of woven columns
    for (let i = 0; i < a; i += 0.5) {
      const t = (i + 0.25 - a / 2) / (a / 2);
      const h = 6 + 18 * Math.sqrt(Math.max(0, 1 - t * t));
      s.front(i, 1.5, 6, 0.5, h, Math.floor(i) % 2 ? K.wicker : K.wickerDark);
      s.front(i, 1.5, 6 + h - 1, 0.5, 1, tone(K.wicker, 1.15)); // a light rim along the top
    }
    s.cyl(a / 2, b / 2 + 1, 0, 3.5, 7, K.wicker, { side: K.wickerDark }); // the woven base
    s.cyl(a / 2, b / 2 + 1, 7, 5, 2, P.cream, { side: P.creamShade }); // seat cushion
    s.box(a / 2 - 3, 2, 9, 6, 2, 6, P.pink, { side: P.pinkShade }); // back cushion
  }),
  piece('dining-chair', (s, a, b) => ladderChair(s, a, b, K.oak, false)),
  piece('spindle-chair', (s, a, b) => ladderChair(s, a, b, K.sagePaint, true)),
  piece('bean-bag', (s, a, b) => {
    const [x, y] = s.p(a / 2, b / 2, 0);
    s.c.ellipse(x, y - 3, 11, 6, tone(P.lilac, 0.8));
    s.c.ellipse(x - 1, y - 5, 9, 5, P.lilac);
    s.c.ellipse(x + 2, y - 9, 7, 4, P.lilac); // the slouched back
    s.c.ellipse(x - 2, y - 6, 3, 1.5, tone(P.lilac, 1.2));
    s.c.line(x - 6, y - 4, x + 5, y - 7, P.lilacShade); // a seam
  }),
  piece('bar-stool', (s, a, b) => {
    legs(s, a, b, 0, 16, K.oak, 0, 1);
    s.box(0.5, 0.5, 5, a - 1, a - 1, 0, P.woodDark, { top: P.woodDark, edge: false }); // footrest
    s.cyl(a / 2, b / 2, 16, 3.4, 2, K.oak, { side: K.oakDark });
  }),
  piece('mushroom-stool', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 1.8, 7, P.cream, { side: P.creamShade });
    const [x, y] = s.p(a / 2, b / 2, 8);
    s.c.ellipse(x, y, 7, 4, K.red, (px, py) => py <= y + 1);
    s.c.ellipse(x, y + 1, 7, 1.5, K.redDark, (px, py) => py >= y + 1);
    s.c.ellipse(x - 2, y - 2, 2.5, 1, tone(K.red, 1.25));
    for (const [dx, dy] of [[-4, -1], [2, -3], [4, 0], [-1, -2]]) s.c.rect(x + dx, y + dy, 2, 1, P.white);
  }),
  piece('knit-pouf', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 3.5, 6, K.oatmeal, { side: tone(K.oatmeal, 0.8), top: tone(K.oatmeal, 1.12) });
    const [x, y] = s.p(a / 2, b / 2, 0);
    for (let dx = -6; dx <= 6; dx += 3) s.c.line(x + dx, y - 1, x + dx, y - 5, tone(K.oatmeal, 0.88)); // cable knit
    s.c.set(x, y - 6, tone(K.oatmeal, 0.8));
  }),
];

// ---------- tables ----------

const TABLE_PIECES = [
  piece('round-coffee-table', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 3, 1, P.woodDark);
    s.cyl(a / 2, b / 2, 1, 1.5, 5, P.woodDark);
    s.cyl(a / 2, b / 2, 6, 7, 2, K.oak, { side: K.oakDark });
    const [x, y] = s.p(a / 2, b / 2, 8);
    s.c.ellipse(x, y, 7, 3.5, P.white); // a lace doily
    for (let k = 0; k < 12; k++) s.c.set(x + Math.cos(k / 1.9) * 7, y + Math.sin(k / 1.9) * 3.5, P.creamShade);
    s.cyl(a / 2, b / 2, 8, 1.2, 3, P.sage, { side: P.sageShade }); // a little vase
    s.c.set(x, y - 5, P.pink);
    s.c.set(x + 1, y - 6, P.pink);
  }),
  piece('square-coffee-table', (s, a, b) => {
    legs(s, a, b, 0, 7, P.woodDark, 0.5);
    s.box(1, 1, 2, a - 2, b - 2, 1, P.wood, { edge: false }); // lower shelf
    s.box(2, 2, 3, 4, 3, 2, P.brick, { side: P.brickDark }); // a basket of blankets? a book box
    s.box(0, 0, 7, a, b, 2, K.oak, { side: K.oakDark });
    s.box(3, 3, 9, 4, 3, 1, P.lilac, { side: P.lilacShade });
    s.cyl(8.5, 7, 9, 1.2, 3, P.white);
  }),
  piece('glass-coffee-table', (s, a, b) => {
    for (const [i, j] of [[1, 1], [a - 1, 1], [1, b - 1], [a - 1, b - 1]]) {
      s.line([i, j, 0], [i + (i < a / 2 ? 1 : -1), j, 3], P.iron).line([i + (i < a / 2 ? 1 : -1), j, 3], [i, j, 7], P.iron);
    }
    s.c.see(200, () => s.box(0, 0, 7, a, b, 1, K.glass, { side: K.glassDark, top: K.glass }));
    s.line([2, b - 2, 8], [6, b - 6, 8], K.shine).line([4, b - 1, 8], [9, b - 6, 8], K.shine);
    s.box(a - 6, 2, 8, 4, 3, 2, K.navy, { side: tone(K.navy, 0.75) }); // a book
  }),
  piece('stump-table', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 4, 9, P.woodDark, { side: tone(P.woodDark, 0.7), top: P.woodLight });
    const [x, y] = s.p(a / 2, b / 2, 9);
    s.c.ellipse(x, y, 6, 3, tone(P.woodLight, 1.1), (px, py) => (px - x) ** 2 / 36 + (py - y) ** 2 / 9 > 0.55);
    s.c.ellipse(x, y, 3, 1.5, tone(P.woodLight, 1.1), (px, py) => (px - x) ** 2 / 9 + (py - y) ** 2 / 2.25 > 0.4);
    for (const dx of [-7, -3, 2]) s.c.line(x + dx, y + 3, x + dx, y + 10, tone(P.woodDark, 0.8)); // bark
    s.c.set(x - 6, y + 6, P.mossLight);
    s.c.set(x - 5, y + 7, P.moss);
  }),
  piece('end-table', (s, a, b) => {
    legs(s, a, b, 0, 10, P.woodDark, 0.5, 1);
    s.box(0, 0, 6, a, b, 5, P.wood);
    s.front(1.5, b, 7, a - 3, 3, P.woodDark);
    s.dot(a / 2, b, 8, P.gold);
    s.box(0, 0, 11, a, b, 1, K.oak, { side: K.oakDark });
    s.box(1, 1, 12, 3, 3, 1, P.sage, { side: P.sageShade });
    candle(s, 5, 4, 12, 3);
  }),
  piece('crate-table', (s, a, b) => {
    s.box(0, 0, 0, a, b, 9, K.wicker, { side: K.wickerDark });
    s.front(1, b, 1, a - 2, 7, P.woodDark); // open side
    bookRow(s, 1.5, a - 1.5, b, 1, 6, 4);
    for (const z of [3, 6]) s.side(a, 0, z, b, 1, tone(K.wickerDark, 0.85)); // slats
    s.cyl(a / 2, b / 2, 9, 1.5, 3, P.cream, { side: P.creamShade }); // a mug
  }),
  piece('dining-table', (s, a, b) => {
    legs(s, a, b, 0, 11, P.woodDark, 1, 2);
    s.box(0, 0, 11, a, b, 2, K.oak, { side: K.oakDark });
    s.flat(0, b / 2 - 2, 13, a, 4, P.sage); // table runner
    s.line([0, b / 2 - 2, 13], [a, b / 2 - 2, 13], P.sageShade);
    s.cyl(a / 2, b / 2, 13, 1.5, 4, P.white); // a jug of flowers
    const [x, y] = s.p(a / 2, b / 2, 18);
    for (const [dx, dy, col] of [[-2, -1, P.pink], [1, -2, K.mustard], [2, 0, P.white], [0, -3, P.pink]]) s.c.set(x + dx, y + dy, col);
    candle(s, 6, b / 2, 13, 4);
    candle(s, a - 6, b / 2, 13, 4);
  }),
  piece('bistro-table', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 3, 1, P.iron);
    s.post(a / 2, b / 2, 1, 11, P.iron, 1);
    s.cyl(a / 2, b / 2, 12, 4.5, 1, P.white, { side: P.creamShade });
    s.cyl(a / 2 - 1, b / 2, 13, 1, 2, P.pink, { side: P.pinkShade }); // a cup
    s.dot(a / 2 + 2, b / 2 + 1, 13, P.brick); // a macaron
  }),
  piece('plant-stand', (s, a, b) => {
    // three steps, highest at the back
    s.box(0, 0, 0, a, 2, 16, K.oak, { side: K.oakDark });
    s.box(0, 2, 0, a, 2, 10, K.oak, { side: K.oakDark });
    s.box(0, 4, 0, a, 2, 5, K.oak, { side: K.oakDark });
    tinyPlant(s, 3, 1, 16, C.terracotta, 0);
    tinyPlant(s, 9, 1, 16, C.potWhite, 1);
    tinyPlant(s, 4, 3, 10, C.potGray, 2);
    tinyPlant(s, 9, 3, 10, C.terracotta, 0);
    tinyPlant(s, 6, 5, 5, C.potWhite, 1);
  }),
  piece('iron-plant-stand', (s, a, b) => {
    for (const [i, j] of [[0.5, 0.5], [a - 0.5, 0.5], [0.5, b - 0.5], [a - 0.5, b - 0.5]]) s.line([i, j, 0], [a / 2 + (i - a / 2) * 0.6, b / 2 + (j - b / 2) * 0.6, 18], P.iron);
    s.cyl(a / 2, b / 2, 18, 3, 1, P.iron);
    s.cyl(a / 2, b / 2, 19, 2.6, 4, C.potWhite, { side: C.potWhiteShade });
    const [x, y] = s.p(a / 2, b / 2, 23);
    // a fern spilling over the rim
    for (let k = 0; k < 9; k++) {
      const dir = k < 4.5 ? -1 : 1;
      const spread = 2 + (k % 5) * 2;
      for (let t = 0; t <= 8; t++) {
        const px = x + dir * (t * spread) / 8;
        const py = y - 3 + (t * t) / 6 + (k % 3);
        s.c.set(px, py, t % 2 ? K.leafSoft : K.leafMid);
      }
    }
    s.c.ellipse(x, y - 2, 4, 2, K.leafMid);
    s.c.ellipse(x - 1, y - 3, 2, 1, K.leafHi);
  }),
];

// ---------- shelves and cabinets ----------

const STORAGE_PIECES = [
  piece('small-bookshelf', (s, a, b) => {
    s.box(0, 0, 0, a, b, 22, P.wood);
    s.front(1, b, 1, a - 2, 20, P.woodDark); // the inside
    bookRow(s, 1.5, a - 1.5, b, 2, 7, 1);
    s.front(1, b, 10, a - 2, 1, P.wood); // the shelf
    bookRow(s, 1.5, a - 4, b, 11, 7, 2);
    s.box(0, 0, 22, a, b, 1, P.woodLight, { edge: false });
    candle(s, 3, b / 2, 23, 3);
    s.cyl(a - 3, b / 2, 23, 1.3, 3, C.terracotta, { side: C.terracottaDark });
    const [x, y] = s.p(a - 3, b / 2, 26);
    s.c.ellipse(x, y - 1, 3, 2, K.leafMid);
    s.c.line(x + 2, y, x + 4, y + 6, K.leafSoft); // trailing vine
  }),
  piece('tall-bookshelf', (s, a, b) => {
    s.box(0, 0, 0, a, b, 52, P.woodDark);
    s.front(1, b, 1, a - 2, 48, tone(P.woodDark, 0.7));
    for (const [z, k] of [[2, 3], [14, 5], [26, 6], [38, 7]]) {
      bookRow(s, 1.5, k === 6 ? a - 6 : a - 1.5, b, z, 9, k);
      s.front(1, b, z + 10, a - 2, 1, P.woodDark);
    }
    s.cyl(a - 3.5, b / 2, 27, 1.5, 4, P.white, { side: P.creamShade }); // a little globe? a jar
    s.box(-0.5, -0.5, 52, a + 1, b + 1, 2, P.wood); // crown
    s.line([2, b, 1], [4, b + 2, 30], K.oak, 2); // a library ladder leaning on it
    s.line([6, b, 1], [8, b + 2, 30], K.oak, 2);
    for (let z = 6; z < 30; z += 6) s.line([2 + z / 15, b + z / 15, z], [6 + z / 15, b + z / 15, z], K.oak);
  }),
  piece('tv-cabinet', (s, a, b) => {
    legs(s, a, b, 0, 2, P.woodDark, 0.5);
    s.box(0, 0, 2, a, b, 10, K.oak, { side: K.oakDark });
    s.front(1, b, 3, a / 2 - 1.5, 8, P.wood).front(a / 2 + 0.5, b, 3, a / 2 - 1.5, 8, P.wood); // doors
    s.dot(a / 2 - 1.5, b, 7, P.gold).dot(a / 2 + 1.5, b, 7, P.gold);
    // the chunky old TV
    s.box(2, 1, 12, 11, 6, 11, 0x8a8478, { side: 0x5e5a52, top: 0xa39d90 });
    s.front(3, 7, 14, 7, 8, P.iron);
    s.front(3.5, 7, 14.5, 6, 7, 0x5fa8a0); // screen glow
    s.line([4, 7, 20], [6, 7, 20], 0xa8e0d0);
    s.dot(11.2, 7, 19, P.brick).dot(11.2, 7, 17, P.iron); // knobs
    s.line([7, 3, 23], [4, 2, 31], P.iron).line([7, 3, 23], [11, 2, 30], P.iron); // rabbit ears
    s.glow(6.5, 7, 18, 9, 0x8ff0d6, 25);
  }),
  piece('curio-cabinet', (s, a, b) => {
    legs(s, a, b, 0, 3, P.woodDark, 0.5);
    s.box(0, 0, 3, a, b, 34, P.wood);
    s.front(1, b, 4, a - 2, 31, tone(P.woodDark, 0.8));
    for (const z of [6, 15, 24]) {
      s.front(1, b, z + 7, a - 2, 1, P.woodLight); // glass shelves
      for (let i = 2.5; i < a - 2; i += 3) {
        const col = [P.pink, P.white, K.glassDark, P.lilac][Math.floor(i + z) % 4];
        s.front(i, b, z, 1.5, 2 + ((i * 3 + z) % 3), col); // teacups and trinkets
      }
    }
    s.c.see(110, () => s.front(1, b, 4, a - 2, 31, K.glass)); // glass doors
    s.line([a / 2, b, 4], [a / 2, b, 35], P.wood);
    s.line([2, b, 8], [5, b, 14], K.shine).line([a / 2 + 1.5, b, 20], [a / 2 + 4, b, 26], K.shine);
    s.box(-0.5, -0.5, 37, a + 1, b + 1, 2, P.woodLight);
  }),
];

// ---------- lamps ----------

const LAMP_PIECES = [
  piece('arc-lamp', (s, a, b) => {
    s.cyl(1.5, b / 2, 0, 3, 2, P.white, { side: P.creamShade }); // marble base
    const [x0, y0] = s.p(1.5, b / 2, 2);
    // a curve up and over to the right
    let last = [x0, y0];
    for (let t = 1; t <= 20; t++) {
      const ang = (t / 20) * Math.PI * 0.85;
      const pt = [x0 + (1 - Math.cos(ang)) * 9, y0 - Math.sin(ang) * 30 - t * 0.4];
      s.c.line(...last, ...pt, K.mustard);
      last = pt;
    }
    const [x, y] = last;
    s.glow(1.5, b / 2, 6, 10, P.glow, 30);
    s.c.ellipse(x, y + 3, 5, 3, K.mustard, (px, py) => py <= y + 3); // dome shade
    s.c.rect(x - 4, y + 3, 9, 1, P.glow);
  }),
  piece('lantern-lamp', (s, a, b) => {
    s.box(1, 1, 0, a - 2, b - 2, 1, P.iron);
    s.glow(a / 2, b / 2, 6, 9, P.glowWarm, 45);
    s.c.see(150, () => s.box(1.5, 1.5, 1, a - 3, b - 3, 9, P.glow, { side: P.glowWarm, edge: false }));
    candle(s, a / 2, b / 2, 1, 3);
    for (const [i, j] of [[1, b - 1], [a - 1, b - 1], [a - 1, 1]]) s.line([i, j, 1], [i, j, 10], P.iron);
    s.box(0.5, 0.5, 10, a - 1, b - 1, 1, P.iron);
    const [x, y] = s.p(a / 2, b / 2, 11);
    s.c.poly([[x - 5, y + 1], [x + 5, y + 1], [x, y - 4]], P.iron); // roof
    s.c.circle(x, y - 6, 1.5, P.iron); // ring
  }),
  piece('candelabra', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 2.5, 1, P.gold, { side: P.coinShade });
    s.post(a / 2, b / 2, 1, 20, P.gold, 1);
    s.line([a / 2 - 2.5, b / 2 + 2.5, 18], [a / 2 + 2.5, b / 2 - 2.5, 18], P.gold);
    s.line([a / 2 - 2.5, b / 2 + 2.5, 18], [a / 2 - 2.5, b / 2 + 2.5, 21], P.gold);
    s.line([a / 2 + 2.5, b / 2 - 2.5, 18], [a / 2 + 2.5, b / 2 - 2.5, 21], P.gold);
    candle(s, a / 2 - 2.5, b / 2 + 2.5, 21, 4, P.white);
    candle(s, a / 2, b / 2, 21, 6, P.white);
    candle(s, a / 2 + 2.5, b / 2 - 2.5, 21, 4, P.white);
  }),
  piece('star-lamp', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 2, 2, P.woodDark);
    s.glow(a / 2, b / 2, 9, 11, P.glow, 40);
    const [x, y] = s.p(a / 2, b / 2, 9);
    const pts = [];
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 3 : 7;
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      pts.push([x + Math.cos(ang) * r, y + Math.sin(ang) * r]);
    }
    s.c.poly(pts, 0xf7dc8a);
    s.c.ellipse(x - 1, y - 1, 2, 2, K.flame);
  }),
];

// ---------- beds ----------

// A bed: headboard at the back (j = 0), mattress, pillows, a quilt and a
// footboard. quilt(i, j) can return a color for patterned quilts.
function bed(s, a, b, o) {
  const { frame = P.wood, headH = 18, footH = 10, quilt, quiltShade = tone(quilt, 0.78), pillows = 2, pattern } = o;
  s.box(0, 0, 0, a, 2, headH, frame); // headboard
  s.box(0, 2, 0, a, b - 4, 6, frame); // frame
  s.box(1, 2, 6, a - 2, b - 5, 3, P.cream); // mattress
  const pw = (a - 4) / pillows;
  for (let k = 0; k < pillows; k++) pillow(s, 2 + k * pw, 3, 9, pw - 1, 4);
  s.box(0, 9, 6, a, b - 11, 5, quilt, { side: quiltShade });
  if (pattern) paintFlat(s, a, b - 11, 11, (i, j) => pattern(i, j + 9));
  s.line([0, 9, 11], [a, 9, 11], tone(quilt, 1.2)); // folded-down edge
  if (footH) s.box(0, b - 2, 0, a, 2, footH, frame);
}

const BED_PIECES = [
  piece('single-bed', (s, a, b) => {
    const patch = [P.pink, P.cream, P.sage, K.mustard, P.lilac];
    bed(s, a, b, { quilt: P.sage, pillows: 1, headH: 16, footH: 9, frame: K.oak, pattern: (i, j) => patch[(Math.floor(i / 3) + Math.floor(j / 3) * 2) % patch.length] });
  }),
  piece('double-bed', (s, a, b) => {
    bed(s, a, b, { quilt: P.sageLight, quiltShade: P.sage, headH: 20, footH: 8, frame: P.woodDark });
    for (let j = 12; j < b - 3; j += 4) s.line([0, j, 11], [a, j, 11], P.sage);
    s.box(2, b - 6, 11, a - 4, 3, 1, K.oatmeal, { side: tone(K.oatmeal, 0.8) }); // a knitted throw
  }),
  piece('iron-bed', (s, a, b) => {
    const iron = P.iron;
    // curly iron headboard
    s.box(0, 0, 0, 1, 1, 28, iron, { edge: false }).box(a - 1, 0, 0, 1, 1, 28, iron, { edge: false });
    s.line([0, 0.5, 27], [a, 0.5, 27], iron);
    for (let i = 3; i < a - 1; i += 3) s.line([i, 0.5, 10], [i, 0.5, 27], iron);
    const [hx, hy] = s.p(a / 2, 0.5, 22);
    s.c.circle(hx, hy, 3, iron, (px, py) => Math.hypot(px - hx, py - hy) > 2);
    s.box(0, 1, 4, a, b - 2, 4, iron, { edge: false }); // frame
    s.box(0.5, 1, 7, a - 1, b - 2, 3, P.cream);
    pillow(s, 2, 2, 10, 6, 4);
    pillow(s, a - 8, 2, 10, 6, 4);
    // a puffy white duvet
    s.box(0, 8, 7, a, b - 9, 6, P.white, { side: P.creamShade, top: 0xfffaf0 });
    for (let j = 11; j < b - 1; j += 4) s.ball(a / 2, j, 13, 2 * a - 4, 0.6, P.creamShade);
    s.box(0, b - 1, 0, 1, 1, 16, iron, { edge: false }).box(a - 1, b - 1, 0, 1, 1, 16, iron, { edge: false });
    s.line([0, b - 0.5, 15], [a, b - 0.5, 15], iron);
    for (let i = 3; i < a - 1; i += 3) s.line([i, b - 0.5, 9], [i, b - 0.5, 15], iron);
  }),
  piece('daybed', (s, a, b) => {
    const frame = P.white;
    legs(s, a, b, 0, 3, frame, 0.5);
    s.box(0, 0, 3, a, 2, 14, frame, { side: P.creamShade }); // long back
    for (let i = 3; i < a - 2; i += 3) s.front(i, 2, 7, 1, 8, P.creamShade); // spindles
    s.box(0, 2, 3, 2, b - 2, 10, frame, { side: P.creamShade }); // ends
    s.box(2, 2, 3, a - 4, b - 2, 5, P.cream, { side: P.creamShade }); // mattress
    s.box(a - 2, 2, 3, 2, b - 2, 10, frame, { side: P.creamShade });
    s.box(2, 2, 8, a - 4, b - 2, 1, P.pink, { side: P.pinkShade }); // pink cover
    s.box(3, 2.5, 9, 5, 2, 5, P.white, { side: P.creamShade }); // pillows against the back
    s.box(9, 2.5, 9, 5, 2, 5, P.lilac, { side: P.lilacShade });
    s.box(a - 9, 2.5, 9, 5, 2, 5, P.pinkShade, { side: P.pinkDark });
  }),
];

// ---------- bedroom ----------

const BEDROOM_PIECES = [
  piece('nightstand', (s, a, b) => {
    legs(s, a, b, 0, 3, P.woodDark, 0.5, 1);
    s.box(0, 0, 3, a, b, 9, P.wood);
    s.front(1, b, 7, a - 2, 3, P.woodDark);
    s.dot(a / 2, b, 8, P.gold);
    s.front(1, b, 4, a - 2, 2, tone(P.wood, 0.8)); // open cubby
    s.box(1, 1, 12, 4, 4, 1, P.lilac, { side: P.lilacShade });
    s.cyl(5, 2, 12, 1, 2, P.white); // an alarm clock? a glass of water
  }),
  piece('round-nightstand', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 3.4, 10, P.pink, { side: P.pinkShade });
    const [x, y] = s.p(a / 2, b / 2, 0);
    for (let dx = -6; dx <= 6; dx += 2) s.c.line(x + dx, y - 1, x + dx, y - 8, tone(P.pink, 0.9)); // folds
    s.cyl(a / 2, b / 2, 10, 3.6, 1, P.white, { side: P.creamShade });
    candle(s, a / 2 + 1, b / 2 - 1, 11, 2);
  }),
  piece('chest-of-drawers', (s, a, b) => {
    legs(s, a, b, 0, 2, P.woodDark, 0.5);
    s.box(0, 0, 2, a, b, 22, K.oak, { side: K.oakDark });
    for (const z of [3, 8, 13, 18]) {
      s.front(1, b, z, a - 2, 4, P.wood);
      s.dot(a / 3, b, z + 2, P.gold).dot((a * 2) / 3, b, z + 2, P.gold);
    }
    s.box(0, 0, 24, a, b, 1, K.oak, { side: K.oakDark });
    s.box(2, 2, 25, 4, 3, 3, P.sage, { side: P.sageShade }); // a jewelry box
    s.cyl(a - 4, 4, 25, 1.4, 4, P.white); // a vase of lavender
    const [x, y] = s.p(a - 4, 4, 29);
    for (const dx of [-1, 0, 1]) s.c.line(x + dx, y, x + dx * 2, y - 4, P.lilac);
  }),
  piece('vanity', (s, a, b) => {
    // mirror at the back
    s.box(a / 2 - 5, 0, 13, 10, 1.5, 22, P.white, { side: P.creamShade });
    const [mx, my] = s.p(a / 2, 1.5, 24);
    s.c.ellipse(mx, my, 6, 8, K.mirror);
    s.c.line(mx - 3, my - 4, mx, my - 7, K.shine);
    s.c.line(mx - 3, my - 1, mx + 1, my - 6, K.shine);
    // table with drawers on both sides
    s.box(0, 0, 0, 5, b, 13, P.white, { side: P.creamShade });
    s.box(a - 5, 0, 0, 5, b, 13, P.white, { side: P.creamShade });
    for (const z of [2, 7]) s.front(0.5, b, z, 4, 3, P.pink).front(a - 4.5, b, z, 4, 3, P.pink);
    s.box(0, 0, 13, a, b, 1.5, P.white, { side: P.creamShade });
    s.cyl(3, 3, 14.5, 1, 2, P.lilac); // perfume
    s.cyl(5, 2, 14.5, 0.8, 3, P.pink);
    s.box(a - 6, 3, 14.5, 3, 3, 1, P.gold); // a jewelry dish
    s.dot(a - 4.5, 4.5, 15.5, P.brick);
  }),
  piece('wardrobe', (s, a, b) => {
    const paint = K.sagePaint;
    legs(s, a, b, 0, 2, P.woodDark, 0.5);
    s.box(0, 0, 2, a, b, 46, paint, { side: tone(paint, 0.75) });
    s.front(1, b, 4, a / 2 - 1.5, 40, tone(paint, 1.08)).front(a / 2 + 0.5, b, 4, a / 2 - 1.5, 40, tone(paint, 1.08)); // doors
    s.line([a / 2, b, 3], [a / 2, b, 46], tone(paint, 0.7));
    s.dot(a / 2 - 1, b, 24, P.gold).dot(a / 2 + 1, b, 24, P.gold);
    // painted flowers on the doors
    for (const [i, z] of [[a / 4, 38], [a / 4 - 1, 34], [(3 * a) / 4, 12], [(3 * a) / 4 + 1, 16]]) {
      s.dot(i, b, z, P.pink).dot(i + 0.6, b, z - 1, P.leaf);
    }
    s.box(-0.5, -0.5, 48, a + 1, b + 1, 2, tone(paint, 0.85)); // crown
    const [x, y] = s.p(a / 2, b, 51);
    s.c.ellipse(x, y - 1, 5, 2, tone(paint, 0.85), (px, py) => py <= y);
  }),
  piece('bed-bench', (s, a, b) => {
    legs(s, a, b, 0, 6, P.woodDark, 0.5, 1);
    s.box(0, 0, 6, a, b, 2, P.wood);
    s.box(0.5, 0.5, 8, a - 1, b - 1, 2, P.lilac, { side: P.lilacShade });
    for (let i = 3; i < a - 1; i += 3) s.dot(i, b / 2, 10, P.lilacDark); // buttons
  }),
  piece('storage-trunk', (s, a, b) => {
    s.box(0, 0, 0, a, b, 9, P.brick, { side: P.brickDark });
    s.box(0, 0, 9, a, b, 3, tone(P.brick, 1.08), { side: P.brickDark }); // lid
    for (const i of [2, a - 3]) {
      s.front(i, b, 0, 1, 12, P.iron); // straps
      s.line([i, 0, 12], [i, b, 12], P.iron);
    }
    s.front(a / 2 - 1, b, 7, 2, 3, P.gold); // clasp
    s.front(0, b, 0, 1, 2, P.iron).front(a - 1, b, 0, 1, 2, P.iron); // corners
  }),
  piece('floor-mirror', (s, a, b) => {
    s.line([1, b - 0.5, 0], [2, b / 2, 6], P.wood).line([a - 1, b - 0.5, 0], [a - 2, b / 2, 6], P.wood); // feet
    s.line([1, 0.5, 0], [2, b / 2, 6], P.wood).line([a - 1, 0.5, 0], [a - 2, b / 2, 6], P.wood);
    const [x, y] = s.p(a / 2, b / 2, 20);
    s.c.ellipse(x, y, 6, 14, K.oak);
    s.c.ellipse(x, y, 5, 13, K.mirror);
    s.c.line(x - 3, y - 4, x, y - 10, K.shine);
    s.c.line(x - 2, y, x + 1, y - 7, K.shine);
  }),
];

// ---------- rugs (flat, no shadow) ----------

const RUG = { shadow: false };

// a round rug's pixels: color(t) where t = 0 at the middle, 1 at the edge
function roundRug(s, a, color) {
  const r = a / 2;
  paintFlat(s, a, a, 0, (i, j) => {
    const d = Math.hypot(i - r + 0.5, j - r + 0.5) / r;
    return d > 1 ? null : color(d, i, j);
  });
}

const RUG_PIECES = [
  piece('mushroom-rug', (s, a) =>
    roundRug(s, a, (d, i, j) => {
      if (d > 0.9) return K.redDark;
      const spot = [[4, 4], [9, 5], [6, 9], [10, 10], [3, 9]].some(([si, sj]) => Math.hypot(i - si, j - sj) < 1.4);
      return spot ? P.white : K.red;
    }), RUG),
  piece('moon-rug', (s, a) =>
    roundRug(s, a, (d, i, j) => {
      if (d > 0.88) return K.mustard;
      const moon = Math.hypot(i - 8, j - 8) < 4.5 && Math.hypot(i - 9.5, j - 6.5) > 3.8;
      if (moon) return 0xf7dc8a;
      if ([[4, 4], [12, 11], [4, 12], [11, 3]].some(([si, sj]) => Math.round(i) === si && Math.round(j) === sj)) return P.white;
      return K.navy;
    }), RUG),
  piece('woven-rug', (s, a, b) => {
    s.box(0, 0, 0, a, b, 1, K.oatmeal, { side: tone(K.oatmeal, 0.8), edge: false });
    paintFlat(s, a, b, 1, (i, j) => {
      if (i < 1 || j < 1 || i > a - 1 || j > b - 1) return K.rust;
      const band = Math.floor(j / 3) % 3;
      const zig = Math.abs(((i + j) % 6) - 3) < 1;
      if (band === 1) return zig ? K.oatmeal : K.rust;
      if (band === 2 && Math.floor(i) % 4 === 0) return P.woodDark;
      return K.oatmeal;
    });
  }, RUG),
  piece('rose-rug', (s, a, b) => {
    s.box(0, 0, 0, a, b, 1, P.redDark, { side: tone(P.redDark, 0.8), edge: false });
    paintFlat(s, a, b, 1, (i, j) => {
      const edge = Math.min(i, j, a - i, b - j);
      if (edge < 1) return P.redDark;
      if (edge < 2.5) return (Math.floor(i + j) % 3 === 0) ? K.mustard : K.navy;
      if (edge < 3.2) return P.redDark;
      const ci = a / 2;
      const cj = b / 2;
      const m = Math.abs(i - ci) / 1.4 + Math.abs(j - cj);
      if (m < 2) return P.pink;
      if (m < 3) return P.white;
      if (m < 5) return (Math.floor(i) + Math.floor(j)) % 3 ? P.brick : P.pink;
      if (m < 5.8) return K.mustard;
      if ([[5, 5], [a - 5, 5], [5, b - 5], [a - 5, b - 5]].some(([si, sj]) => Math.hypot(i - si, j - sj) < 1.5)) return P.pink;
      return P.red;
    });
  }, RUG),
  piece('striped-rug', (s, a, b) => {
    // a hall runner: a wide border (stripe 1) around a cream middle with
    // cross stripes (stripe 2) and a thin line of stripe 2 inside the border
    s.box(0, 0, 0, a, b, 1, P.cream, { side: P.creamShade, edge: false });
    paintFlat(s, a, b, 1, (i, j) => {
      const edge = Math.min(i, a - i);
      if (edge < 2) return P.sage;
      if (edge >= 3 && edge < 4) return P.brick;
      if (j > 1 && j < b - 1 && Math.floor(j) % 6 === 3 && edge >= 4) return P.brick;
      return P.cream;
    });
    for (let i = 1; i < a; i += 2) s.line([i, b, 1], [i, b + 1.5, 0], P.creamShade); // fringe
  }, RUG),
  piece('checker-rug', (s, a, b) => {
    s.box(0, 0, 0, a, b, 1, P.cream, { side: P.creamShade, edge: false });
    paintFlat(s, a, b, 1, (i, j) => ((Math.floor(i / 4) + Math.floor(j / 4)) % 2 ? P.sage : P.cream));
  }, RUG),
  piece('floral-runner', (s, a, b) => {
    s.box(0, 0, 0, a, b, 1, P.cream, { side: P.creamShade, edge: false });
    paintFlat(s, a, b, 1, (i, j) => {
      if (Math.min(i, a - i) < 1 || Math.min(j, b - j) < 1) return P.sageShade;
      const fi = Math.floor(i) % 5;
      const fj = Math.floor(j) % 5;
      if (fi === 2 && fj === 2) return K.mustard;
      if ((fi === 2 && (fj === 1 || fj === 3)) || (fj === 2 && (fi === 1 || fi === 3))) return P.pink;
      if (fi === 4 && fj === 3) return P.sage;
      return P.cream;
    });
    for (let i = 1; i < a; i += 2) s.line([i, b, 1], [i, b + 1.5, 0], P.creamShade); // fringe
  }, RUG),
  piece('sage-runner', (s, a, b) => {
    s.box(0, 0, 0, a, b, 1, P.sage, { side: P.sageShade, edge: false });
    paintFlat(s, a, b, 1, (i, j) => {
      const e = Math.min(i, a - i, j, b - j);
      if (e < 1) return P.sageShade;
      if (e < 2) return P.cream;
      return Math.floor(j) % 6 === 0 ? P.sageLight : P.sage;
    });
    for (let i = 1; i < a; i += 2) s.line([i, b, 1], [i, b + 1.5, 0], P.cream);
  }, RUG),
];

// ---------- plant shop: a few floor plants redrawn ----------
// (These replace the older drawings of the same name in furniture.js.)

const PLANT_FIXES = [
  piece('succulent-trio', (s, a, b) => {
    s.box(0.5, 0.5, 0, a - 1, b - 1, 4, C.terracotta, { side: C.terracottaDark });
    s.flat(1, 1, 4, a - 2, b - 2, 0x4a3426);
    for (const [i, j, r] of [[2.2, 2, 2.4], [5.8, 2, 2.2], [4, 4, 2.8]]) {
      const [x, y] = s.p(i, j, 5);
      s.c.ellipse(x, y, r * 1.4, r, tone(K.succulent, 0.8)); // outer leaves
      s.c.ellipse(x, y - 1, r, r * 0.65, K.succulent);
      s.c.ellipse(x, y - 1.5, r * 0.5, r * 0.35, K.succulentHi); // center
      s.c.set(x - Math.round(r * 1.2), y, K.succulentTip); // pink tips
      s.c.set(x + Math.round(r * 1.2), y, K.succulentTip);
    }
  }),
  piece('tiny-cactus', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 2.1, 4, C.terracotta, { side: C.terracottaDark, r2: 2.4, top: 0x4a3426 });
    const [x, y] = s.p(a / 2, b / 2, 4);
    s.c.ellipse(x, y - 5, 2.6, 5.5, K.leafSoft);
    s.c.rect(x + 1, y - 9, 1, 8, K.leafMid); // shade
    s.c.rect(x - 1, y - 9, 1, 7, K.leafHi); // ribs
    s.c.rect(x - 5, y - 6, 2, 3, K.leafSoft); // arm
    s.c.rect(x - 5, y - 4, 3, 1, K.leafSoft);
    s.c.set(x - 5, y - 7, K.leafHi);
    s.c.rect(x - 1, y - 12, 3, 2, P.pink); // a flower on top
    s.c.set(x, y - 12, 0xf2b3c4);
  }),
  piece('boston-fern', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 2.6, 6, C.terracotta, { side: C.terracottaDark, r2: 3, top: 0x4a3426 });
    const [x, y] = s.p(a / 2, b / 2, 6);
    s.c.ellipse(x, y - 3, 7, 4, K.leafDeep);
    // lots of fronds arching out and drooping
    for (let k = 0; k < 16; k++) {
      const ang = Math.PI * (0.02 + (k / 15) * 0.96);
      const len = 9 + (k % 4) * 2;
      for (let t = 1; t < len; t++) {
        const f = t / len;
        const px = x - Math.cos(ang) * t * 1.15;
        const py = y - 3 - Math.sin(ang) * t * 0.85 + f * f * 8;
        s.c.set(px, py, k % 3 === 0 ? K.leafHi : k % 2 ? K.leafSoft : K.leafMid);
        if (t % 2 === 0) s.c.set(px + (k < 8 ? -1 : 1), py + 1, K.leafMid);
      }
    }
  }),
];


// ---------- richer houseplants (home pictures) ----------
// These are drawn with lots of small leaves in four greens (dark underneath,
// light on top), painted pots with a band and a lit rim, soil with pebbles,
// veins on the big leaves and little flowers, the same level of detail as the
// hanging plants.

const RED = K.red;
const YELLOW = 0xf2c94c;
const GREENS = { deep: K.leafDeep, mid: K.leafMid, soft: K.leafSoft, hi: K.leafHi };
const BLOSSOM = { deep: 0xc2708a, mid: 0xe09ab0, soft: 0xf2b3c4, hi: 0xffd9e2 };

// A round mass of leaves at screen point (x, y).
function foliage(c, x, y, rx, ry, seed, pal = GREENS) {
  const rand = rng(seed);
  c.ellipse(x, y, rx, ry, pal.deep);
  c.ellipse(x, y - 1, rx - 1, ry - 1, pal.mid);
  const n = Math.round(rx * ry * 0.9);
  for (let k = 0; k < n; k++) {
    const ang = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * 0.85;
    const lx = x + Math.cos(ang) * rx * d;
    const ly = y + Math.sin(ang) * ry * d - 1;
    const t = (y - ly) / ry; // 1 at the top, -1 at the bottom
    const col = t > 0.3 ? (rand() > 0.5 ? pal.hi : pal.soft) : t > -0.25 ? pal.soft : pal.mid;
    c.ellipse(lx, ly, 1.8, 1.1, col);
    c.set(lx + 1, ly + 2, pal.deep); // a dark gap under each leaf
  }
  for (let k = 0; k < 3; k++) c.set(x - rx * 0.6 + k * 2, y - ry * 0.7 + k, pal.hi); // light catching the top left
}

// One leaf from (x0, y0) to its tip (x1, y1): a pointed oval with a lit half and a vein.
function leafShape(c, x0, y0, x1, y1, wid, col, hi, vein = K.leafDeep) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  const side = [];
  const other = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8;
    const w = wid * Math.sin(Math.PI * Math.pow(t, 0.75));
    side.push([x0 + dx * t + nx * w, y0 + dy * t + ny * w]);
    other.push([x0 + dx * t - nx * w, y0 + dy * t - ny * w]);
  }
  c.poly([...side, ...other.reverse()], col);
  c.line(x0 + nx * 0.6, y0 + ny * 0.6, x1 + nx * 0.6, y1 + ny * 0.6, hi); // the lit half
  c.line(x0, y0, x1, y1, vein);
}

// A potted plant's pot with a painted band, lit rim and pebbles on the soil.
// Returns the screen point at the middle of the soil.
function richPot(s, a, b, r, h, color) {
  plantPot(s, a, b, r, h, color, tone(color, 0.72));
  const [x, y] = s.p(a / 2, b / 2, h * 0.45);
  for (let dx = -r * 2 + 1; dx <= r * 2 - 1; dx++) {
    const px = Math.round(x + dx);
    if (s.c.get(px, Math.round(y)) === color) s.c.set(px, Math.round(y), tone(color, 0.84)); // a painted band
  }
  const [tx, ty] = s.p(a / 2, b / 2, h);
  s.c.set(tx - 2, ty, 0x7a6a58);
  s.c.set(tx + 2, ty, 0x7a6a58);
  return [tx, ty];
}

// A sword-shaped upright leaf (snake plant).
function blade(c, x, y, h, lean, w, col) {
  for (let t = 0; t < h; t++) {
    const half = Math.max(0.5, (w * (1 - t / h)) / 2 + 0.3);
    const cx = x + (lean * t) / h;
    for (let dx = -Math.floor(half); dx <= Math.floor(half); dx++) {
      const edge = dx === -Math.floor(half) ? K.leafHi : dx === Math.floor(half) ? K.leafDeep : col;
      c.set(cx + dx, y - t, edge);
    }
    if (t % 4 === 2 && half > 1) c.set(cx, y - t, K.leafDeep); // cross banding
    if (t % 4 === 0 && half > 1) c.set(cx - 1, y - t, tone(col, 1.2));
  }
}

// A frond of a palm: a drooping spine with little leaflets along it.
function frond(c, x, y, dx, dy, len, seed) {
  let px = x;
  let py = y;
  for (let t = 1; t <= len; t++) {
    const f = t / len;
    px = x + dx * f * len;
    py = y + dy * f * len + f * f * len * 0.5;
    c.set(px, py, K.leafDeep);
    if (t > 1 && t % 2 === 0) {
      const up = t % 4 === 0;
      for (const side of [-1, 1]) {
        c.set(px + side, py + (up ? -1 : 1), up ? K.leafHi : K.leafSoft);
        c.set(px + side * 2, py + (up ? 0 : 2), K.leafMid);
      }
    }
  }
}

// A planter box with plank lines, soil and a few leaves at the stems' feet.
function planterBox(s, a, b) {
  s.box(0, 0, 0, a, b, 5, K.oak, { side: tone(K.oak, 0.72) });
  s.flat(1, 1, 5, a - 2, b - 2, 0x4a3426);
  for (const i of [a / 3, (a * 2) / 3]) s.front(i, b, 1, 0.5, 3, tone(K.oak, 0.8)); // plank joints
  s.front(0, b, 4, a, 1, tone(K.oak, 1.25)); // lit rim
  for (const [i, j] of [[2, 2], [5, 3], [7, 2]]) s.dot(i, j, 5, 0x7a6a58); // pebbles
}

// Seven stems growing in a planter. head(c, x, y, k) draws each bloom;
// `leafy` adds a pair of long leaves at each stem's foot.
function planterPlants(s, a, b, { stem, head, height = 8, leaf = K.leafSoft }) {
  const spots = [[2, 1.6], [4.2, 1.8], [6.4, 1.6], [3, b - 2], [5.2, b - 2.2], [7.2, b - 2], [1.5, b / 2]];
  spots.forEach(([i, j], k) => {
    const h = height + ((k * 5) % 4);
    const [x, y] = s.p(i, j, 5);
    s.c.line(x, y, x + (k % 2 ? 1 : -1), y - h, stem);
    s.c.line(x, y - 1, x + (k % 2 ? 3 : -3), y - 4, leaf); // leaves at the foot
    s.c.line(x, y - 1, x + (k % 2 ? -3 : 3), y - 3, K.leafMid);
    head(s.c, x + (k % 2 ? 1 : -1), y - h, k);
  });
  planterBoxFront(s, a, b);
}
// the box's front face goes over the stems' feet
function planterBoxFront(s, a, b) {
  s.box(0, b - 1, 0, a, 1, 5, K.oak, { side: tone(K.oak, 0.72) });
  s.front(0, b, 4, a, 1, tone(K.oak, 1.25));
}

const RICH_PLANTS = [
  piece('flower-pot', (s, a, b) => {
    const [x, y] = richPot(s, a, b, 2.8, 5, C.potWhite);
    foliage(s.c, x, y - 4, 5.5, 3.5, 3);
    // little flowers with a bright center, and a bud
    for (const [dx, dy, col] of [[-3, -5, 0xf2b3c4], [2, -7, K.mustard], [0, -3, 0xb9a3d9], [4, -3, 0xf2b3c4], [-2, -8, P.white]]) {
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) s.c.set(x + dx + ox, y + dy + oy, col);
      s.c.set(x + dx, y + dy, P.white);
    }
    s.c.set(x + 4, y - 7, 0xd9849b);
    s.c.set(x + 4, y - 6, K.leafMid);
  }),

  piece('snake-plant', (s, a, b) => {
    const [x, y] = richPot(s, a, b, 2.8, 5, C.potGray);
    const base = Math.round(y);
    for (const [dx, h, lean, w, col] of [[-3, 14, -3, 4, K.leafMid], [3, 13, 3, 4, K.leafMid], [-1, 21, -1, 4, K.leafSoft], [1, 18, 2, 4, K.leafMid], [0, 12, 0, 3, K.leafSoft], [-2, 16, -2, 3, K.leafMid], [2, 15, 1, 3, K.leafSoft]]) {
      blade(s.c, x + dx, base, h, lean, w, col);
    }
  }),

  piece('peace-lily', (s, a, b) => {
    const [x, y] = richPot(s, a, b, 2.8, 5, C.potGray);
    for (const [dx, tx, ty, w, col] of [[-1, -9, -7, 3, K.leafDeep], [1, 9, -7, 3, K.leafDeep], [-1, -6, -12, 3.2, K.leafMid], [1, 6, -11, 3.2, K.leafMid], [0, 0, -13, 3, K.leafSoft], [0, -3, -6, 2.5, K.leafSoft], [0, 3, -6, 2.5, K.leafMid]]) {
      leafShape(s.c, x + dx, y - 1, x + tx, y + ty, w, col, K.leafHi);
    }
    // two white blooms on tall stems: a curled white hood around a golden spike
    for (const [dx, dy, lean] of [[-3, -20, -1], [4, -17, 1]]) {
      s.c.line(x + (lean > 0 ? 1 : -1), y - 1, x + dx, y + dy + 3, K.leafSoft);
      s.c.ellipse(x + dx, y + dy, 2.3, 3.6, P.white);
      s.c.rect(x + dx + 1, y + dy - 2, 1, 5, P.creamShade); // the shaded side of the hood
      s.c.rect(x + dx, y + dy - 1, 1, 3, K.mustard); // the spike
    }
  }),

  piece('monstera', (s, a, b) => {
    const [x, y] = richPot(s, a, b, 3.2, 6, C.potBlack);
    const leaf = (tx, ty, w, col) => {
      s.c.line(x, y - 1, tx, ty + 2, K.leafDeep); // the stem
      leafShape(s.c, tx - (tx > x ? 4 : -4) * 0.4, ty + 3, tx + (tx > x ? 4 : -4) * 0.4, ty - 3, w, col, K.leafHi);
      s.c.ellipse(tx, ty, w + 0.8, w - 0.6, col);
      s.c.line(tx - w, ty + 1, tx + w, ty - 1, K.leafDeep); // the big vein
      // splits cut in from the edge and a couple of holes
      for (const k of [-3, 0, 3]) {
        s.c.line(tx + k, ty + w - 1, tx + k * 0.3, ty + 1, -1);
        s.c.line(tx + k, ty - w + 1, tx + k * 0.3, ty - 1, -1);
      }
      s.c.set(tx - 2, ty - 2, -1);
      s.c.set(tx + 2, ty + 2, -1);
    };
    leaf(x - 8, y - 12, 5, K.leafDeep);
    leaf(x + 8, y - 11, 5, K.leafDeep);
    leaf(x - 4, y - 21, 5.5, K.leafMid);
    leaf(x + 5, y - 19, 5, K.leafSoft);
    leaf(x, y - 12, 4.5, K.leafMid);
  }),

  piece('bonsai-tree', (s, a, b) => {
    s.box(0, 0, 0, a, b, 3, C.potBlack, { side: C.potBlackShade, top: tone(C.potBlack, 1.4) });
    s.flat(1, 1, 3, a - 2, b - 2, P.mossDark);
    const [x, y] = s.p(a / 2, b / 2, 3);
    for (let k = 0; k < 14; k++) s.c.set(x - 8 + k * 1.2 + (k % 3), y + 1 - (k % 2), k % 3 ? P.moss : P.mossLight); // moss on the soil
    s.c.rect(x + 4, y - 1, 3, 2, 0x8f8a86); // a little stone
    s.c.rect(x + 4, y - 1, 3, 1, 0xb0aaa6);
    // a twisty, flared trunk with bark
    s.c.line(x - 1, y, x - 4, y - 6, P.woodDark, 3);
    s.c.line(x - 4, y - 6, x + 1, y - 11, P.woodDark, 2);
    s.c.line(x + 1, y - 11, x + 6, y - 15, P.wood, 2);
    s.c.line(x - 2, y - 7, x - 9, y - 10, P.wood);
    for (const [bx, by] of [[x - 3, y - 4], [x, y - 9], [x - 5, y - 7], [x + 3, y - 13]]) s.c.set(bx, by, P.woodLight);
    // cloud-shaped pads of leaves
    foliage(s.c, x - 8, y - 10, 6, 2.8, 11);
    foliage(s.c, x + 7, y - 16, 7, 3.2, 12);
    foliage(s.c, x, y - 18, 5.5, 3, 13);
  }),

  piece('mini-palm', (s, a, b) => {
    const [x, y] = richPot(s, a, b, 3.4, 7, C.terracotta);
    s.c.rect(x - 1, y - 14, 3, 14, P.wood);
    s.c.rect(x - 1, y - 14, 1, 14, P.woodLight); // lit side of the trunk
    for (let k = 2; k < 14; k += 3) s.c.rect(x - 1, y - k, 3, 1, P.woodDark); // rings
    const ty = y - 15;
    for (const [dx, dy, len] of [[-1, 0.15, 15], [1, 0.15, 15], [-0.9, -0.35, 13], [0.9, -0.35, 13], [-0.4, -0.8, 11], [0.4, -0.8, 11], [0, -1, 8], [-1, 0.5, 11], [1, 0.5, 11]]) {
      frond(s.c, x, ty, dx, dy, len, 1);
    }
  }),

  piece('fiddle-leaf-fig', (s, a, b) => {
    const [x, y] = richPot(s, a, b, 3.4, 7, C.potWhite);
    s.c.line(x, y, x + 1, y - 30, P.woodDark, 2);
    s.c.line(x, y - 5, x, y - 28, P.woodLight);
    const leaves = [[-1, 12, -8, K.leafDeep], [1, 14, 8, K.leafDeep], [-1, 20, -9, K.leafMid], [1, 23, 9, K.leafMid], [-1, 28, -7, K.leafSoft], [1, 30, 7, K.leafSoft], [0, 35, 1, K.leafMid]];
    for (const [side, h, reach, col] of leaves) {
      const bx = x + (side > 0 ? 1 : 0);
      leafShape(s.c, bx, y - h + 2, x + reach, y - h - 4, 3.4, col, K.leafHi);
    }
  }),

  piece('lemon-tree', (s, a, b) => {
    const [x, y] = richPot(s, a, b, 3.4, 7, C.terracotta);
    s.c.line(x, y, x, y - 13, P.woodDark, 2);
    s.c.line(x - 1, y - 12, x - 6, y - 17, P.woodDark);
    s.c.line(x + 1, y - 12, x + 6, y - 17, P.woodDark);
    foliage(s.c, x, y - 22, 11, 9, 7);
    for (const [dx, dy] of [[-6, -17], [4, -21], [7, -15], [-2, -27], [-8, -24], [1, -16], [-4, -21]]) {
      s.c.ellipse(x + dx, y + dy, 2.2, 1.6, YELLOW); // a lemon...
      s.c.set(x + dx - 1, y + dy - 1, 0xfff0a0); // ...with a shine
      s.c.set(x + dx + 2, y + dy + 1, tone(YELLOW, 0.7));
      s.c.set(x + dx, y + dy - 2, K.leafMid); // its stalk leaf
    }
    for (const [dx, dy] of [[5, -26], [-5, -14], [8, -21]]) s.c.set(x + dx, y + dy, P.white); // blossoms
  }),

  piece('sakura-tree', (s, a, b) => {
    const [x, y] = richPot(s, a, b, 4, 7, C.potBlack);
    s.c.line(x, y, x - 2, y - 12, P.woodDark, 3);
    s.c.line(x - 2, y - 12, x - 8, y - 21, P.woodDark, 2);
    s.c.line(x - 1, y - 12, x + 7, y - 22, P.woodDark, 2);
    s.c.line(x - 2, y - 10, x - 2, y - 24, P.wood);
    for (const [bx, by] of [[x - 1, y - 6], [x - 4, y - 16], [x + 3, y - 17]]) s.c.set(bx, by, P.woodLight);
    foliage(s.c, x - 9, y - 22, 8, 5, 21, BLOSSOM);
    foliage(s.c, x + 8, y - 24, 8, 5, 22, BLOSSOM);
    foliage(s.c, x - 1, y - 28, 10, 7, 23, BLOSSOM);
    for (const [dx, dy] of [[-12, 2], [11, 0], [-15, -6], [14, -4], [5, 5], [-6, 6]]) s.c.set(x + dx, y + dy, BLOSSOM.hi); // falling petals
  }),

  piece('daisies', (s, a, b) => {
    planterBox(s, a, b);
    planterPlants(s, a, b, {
      stem: K.leafSoft,
      head: (c, x, y) => {
        for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]]) c.set(x + ox, y + oy, P.white);
        c.rect(x - 1, y - 1, 3, 3, K.mustard);
        c.set(x, y, 0xfff0a0);
      },
    });
  }),

  piece('tulips', (s, a, b) => {
    planterBox(s, a, b);
    planterPlants(s, a, b, {
      stem: K.leafSoft,
      head: (c, x, y, k) => {
        const col = k % 3 === 0 ? 0xf2b3c4 : k % 3 === 1 ? RED : 0xd9849b;
        c.rect(x - 2, y - 3, 5, 5, col); // a cup with a notched top
        c.rect(x - 2, y - 3, 1, 5, tone(col, 1.25));
        c.rect(x + 2, y - 3, 1, 5, tone(col, 0.7));
        c.set(x, y - 3, -1);
        c.set(x - 1, y - 4, col);
        c.set(x + 1, y - 4, tone(col, 0.85));
        c.set(x, y + 2, tone(col, 0.7));
      },
    });
  }),

  piece('sunflowers', (s, a, b) => {
    planterBox(s, a, b);
    planterPlants(s, a, b, {
      stem: K.leafMid,
      height: 9,
      head: (c, x, y) => {
        c.ellipse(x, y, 4.2, 4.2, tone(YELLOW, 0.8)); // back petals
        for (let k = 0; k < 8; k++) c.set(x + Math.cos((k * Math.PI) / 4) * 4, y + Math.sin((k * Math.PI) / 4) * 4, YELLOW);
        c.ellipse(x, y, 3.2, 3.2, YELLOW);
        c.ellipse(x, y, 1.8, 1.8, P.woodDark); // the seed head
        c.set(x - 1, y - 1, P.wood);
        c.set(x + 1, y + 1, P.wood);
      },
    });
  }),

  piece('lavender', (s, a, b) => {
    planterBox(s, a, b);
    planterPlants(s, a, b, {
      stem: P.sageShade,
      leaf: P.sage,
      height: 9,
      head: (c, x, y, k) => {
        for (let q = 0; q < 6; q++) {
          c.set(x + (q % 2), y + q - 1, q % 2 ? P.lilacShade : P.lilac); // a spike of tiny buds
          if (q % 2 === 0) c.set(x + (q % 2) - 1, y + q, P.lilacDark);
        }
        c.set(x, y - 2, 0xc8b8e8);
      },
    });
  }),

  piece('roses', (s, a, b) => {
    planterBox(s, a, b);
    planterPlants(s, a, b, {
      stem: K.leafDeep,
      leaf: K.leafMid,
      height: 8,
      head: (c, x, y) => {
        c.ellipse(x, y, 2.8, 2.5, RED); // the bloom, with petals curling in
        c.set(x - 1, y - 1, tone(RED, 1.3));
        c.rect(x, y - 1, 2, 1, tone(RED, 0.7));
        c.rect(x - 1, y, 2, 1, tone(RED, 0.7));
        c.set(x + 1, y + 1, tone(RED, 0.6));
        c.set(x - 3, y + 2, K.leafSoft); // a leaf under the bloom
        c.set(x + 3, y + 2, K.leafMid);
      },
    });
  }),
];

export const PACK_ISO = Object.fromEntries([...SEATS, ...TABLE_PIECES, ...STORAGE_PIECES, ...LAMP_PIECES, ...BED_PIECES, ...BEDROOM_PIECES, ...RUG_PIECES, ...PLANT_FIXES, ...RICH_PLANTS]);


// ---------- wall shelves (big pictures that hang straight on the wall) ----------

// A wall shelf seen from slightly above: a lighter top you can see, a front
// edge, a dark underside, two little iron brackets and a soft shadow on the
// wall. y is where the top face starts; things stand on y.
function shelfBoard(c, w, y) {
  c.see(75, () => c.rect(2, y + 7, w - 4, 3, 0x0d0a12)); // shadow on the wall under it
  for (const x of [5, w - 7]) {
    c.rect(x, y + 5, 2, 3, P.iron); // brackets
    c.rect(x + 2, y + 5, 1, 1, P.iron);
  }
  c.rect(0, y, w, 3, tone(K.oak, 1.22)); // the top, lit
  c.rect(0, y + 3, w, 2, K.oak); // the front edge
  c.rect(0, y + 5, w, 1, K.oakDark); // the underside
  c.rect(w - 1, y, 1, 5, tone(K.oak, 0.8));
  c.line(2, y, w - 6, y, tone(K.oak, 1.4)); // a glint along the top
}

// A little pot (a trapezoid with a lit rim and a shaded side) standing on y.
function shelfPot(c, x, y, w, h, color) {
  const shade = tone(color, 0.72);
  c.poly([[x, y - h], [x + w, y - h], [x + w - 1, y], [x + 1, y]], color);
  c.rect(x + w - 2, y - h + 1, 1, h - 1, shade);
  c.rect(x - 1, y - h, w + 2, 2, tone(color, 1.15));
  c.rect(x - 1, y - h + 1, w + 2, 1, shade);
  c.rect(x, y - h - 1, w, 1, 0x4a3426); // soil
}

// A bunch of leaves around (x, y): dark underneath, lighter on top.
function shelfLeaves(c, x, y, rx, ry, seed = 1) {
  const rand = rng(seed);
  c.ellipse(x, y, rx, ry, K.leafDeep);
  c.ellipse(x, y - 1, rx * 0.85, ry * 0.8, K.leafMid);
  for (let k = 0; k < 7; k++) {
    const px = x + (rand() - 0.5) * rx * 1.5;
    const py = y - 1 - rand() * ry * 0.8;
    c.ellipse(px, py, 1.6, 1.1, py < y - ry * 0.4 ? K.leafHi : K.leafSoft);
  }
}

function wallShelfPicture(w, h, draw) {
  return () => {
    const c = new Canvas(w, h);
    draw(c);
    c.outline(P.line);
    return c;
  };
}

// ---------- wall pictures: curtains and hanging plants ----------

// Curtains on a rod, 34 wide and 50 tall: two gathered panels with folds in
// three tones, a scalloped hem, tie-backs, a rod on brackets with round finials,
// and a soft drop shadow from the rod and down the side of each panel.
function curtains(cloth, shade, { lace = false, tie = null, rod = P.wood } = {}) {
  return () => {
    const W = 34;
    const H = 50;
    const c = new Canvas(W, H);
    const hi = tone(cloth, 1.22);
    const lo = tone(shade, 0.8);
    for (const side of [0, 1]) {
      for (let y = 5; y < H - 3; y++) {
        const pinch = tie ? Math.max(0, 1 - Math.abs(y - 30) / 14) * 4 : 0;
        const w = Math.round(12 - pinch + (y > 38 ? (y - 38) * 0.3 : 0));
        const x0 = side ? W - 2 - w : 2;
        for (let x = x0; x < x0 + w; x++) {
          const k = Math.floor((x - x0) / 2.5 + (y > 26 ? 0.5 : 0)) % 3; // folds: lit, mid, dark
          const t = (y - 5) / (H - 8); // a touch darker toward the hem
          const base = k === 0 ? hi : k === 1 ? cloth : shade;
          c.set(x, y, t > 0.7 && k !== 0 ? tone(base, 0.9) : base);
        }
        c.set(side ? x0 : x0 + w - 1, y, lo); // the inner edge
      }
      // a scalloped hem
      const xs = side ? W - 14 : 2;
      for (let x = xs; x < xs + 12; x += 2) c.set(x, H - 3, lo);
    }
    if (lace) for (let y = 7; y < H - 5; y += 4) for (let x = 3; x < W - 3; x += 4) if (c.get(x, y) !== -1) c.set(x + ((y >> 2) % 2) * 2, y, P.white);
    if (tie)
      for (const x of [6, W - 11]) {
        c.rect(x, 29, 5, 2, tie);
        c.set(x + 2, 31, tie);
        c.set(x + 2, 32, tone(tie, 0.7)); // a little tassel
      }
    // the rod on two brackets with finials
    c.rect(1, 2, W - 2, 2, tone(rod, 1.25));
    c.rect(1, 4, W - 2, 1, tone(rod, 0.65));
    c.circle(1, 3, 1.5, rod);
    c.circle(W - 2, 3, 1.5, rod);
    for (const bx of [6, W - 7]) c.rect(bx, 1, 1, 5, P.iron);
    c.outline(P.line);
    // soft shadows, added after the outline: under the rod and beside each panel
    const out = new Canvas(W, H);
    out.see(80, () => {
      out.rect(2, 5, W - 4, 2, 0x0d0a12);
      out.rect(14, 8, 2, H - 14, 0x0d0a12);
      out.rect(W - 16, 8, 2, H - 14, 0x0d0a12);
    });
    out.draw(c);
    return out;
  };
}

// A hanging plant on a little iron wall hook: 24 wide, 44 tall.
function hanger(draw) {
  return () => {
    const c = new Canvas(24, 44);
    c.rect(1, 1, 2, 6, P.iron); // the plate on the wall
    c.rect(3, 2, 10, 1, P.iron); // the arm
    c.line(4, 6, 9, 3, P.iron); // brace
    c.set(13, 3, P.iron); // the hook
    c.set(13, 4, P.iron);
    c.set(12, 5, P.iron);
    draw(c);
    c.outline(P.line);
    return c;
  };
}

// a hanging pot at (x, y) with ropes up to the hook
function hangPot(c, y, w, color, shade, rope = P.cream) {
  const x = 12 - w / 2;
  c.line(12, 5, x, y, rope);
  c.line(12, 5, x + w, y, rope);
  c.poly([[x, y], [x + w + 1, y], [x + w - 1, y + 6], [x + 2, y + 6]], color);
  c.rect(x - 1, y, w + 3, 2, tone(color, 1.12));
  c.rect(x + w - 2, y + 2, 1, 4, shade);
}

// Trailing vines from (x, y) down `len` pixels, with leaves on alternate sides.
function vine(c, x, y, len, leaf, stem = K.leafDeep) {
  for (let k = 0; k < len; k++) {
    const vx = x + Math.round(Math.sin(k / 3) * 1.2);
    c.set(vx, y + k, stem);
    if (k % 3 === 1) c.rect(vx + (k % 6 === 1 ? 1 : -2), y + k, 2, 2, leaf);
  }
}

const WALL_PICS = {
  'plant-shelf': wallShelfPicture(40, 30, (c) => {
    const y = 20;
    shelfBoard(c, 40, y);
    // a tall plant, a round one and a small succulent
    shelfPot(c, 4, y, 8, 6, C.terracotta);
    shelfLeaves(c, 8, y - 11, 6, 6, 2);
    c.line(8, y - 7, 8, y - 6, K.leafDeep);
    shelfPot(c, 16, y, 7, 5, C.potWhite);
    shelfLeaves(c, 19, y - 8, 5, 4, 5);
    shelfPot(c, 27, y, 6, 4, C.terracotta);
    c.ellipse(30, y - 7, 3, 2, K.succulent);
    c.set(30, y - 8, K.succulentTip);
    c.set(29, y - 7, K.succulentHi);
    // a vine spilling over the front edge
    vine(c, 35, y + 3, 7, K.leafSoft);
    c.rect(34, y - 2, 3, 2, K.leafMid);
    c.rect(33, y - 3, 2, 1, K.leafHi);
  }),
  'jar-shelf': wallShelfPicture(40, 28, (c) => {
    const y = 20;
    shelfBoard(c, 40, y);
    // jars of jam, honey and dried flowers, with cloth lids
    const jar = (x, h, w, fill, lid) => {
      c.rect(x, y - h, w, h, tone(fill, 0.85));
      c.rect(x + 1, y - h + 1, w - 3, h - 2, fill);
      c.rect(x + 1, y - h + 1, 1, h - 3, tone(fill, 1.3)); // glass shine
      c.rect(x - 1, y - h - 2, w + 2, 2, lid);
      c.rect(x - 1, y - h, w + 2, 1, tone(lid, 0.7));
    };
    jar(3, 10, 7, K.mustard, P.white);
    jar(13, 8, 6, 0x8f3f4a, P.cream);
    jar(22, 11, 7, 0x9f8cc0, P.white);
    c.rect(24, y - 15, 1, 4, K.leafSoft); // dried flower stems poking out
    c.set(24, y - 16, P.pink);
    c.set(26, y - 15, P.pink);
    c.line(25, y - 11, 26, y - 15, K.leafMid);
    // a small jar of honey with a wooden dipper
    c.rect(32, y - 6, 6, 6, tone(K.honey, 0.85));
    c.rect(33, y - 5, 3, 4, K.honey);
    c.rect(31, y - 8, 8, 2, K.oakDark);
    c.line(36, y - 8, 38, y - 13, K.oak);
  }),
  'wall-shelf': wallShelfPicture(36, 28, (c) => {
    const y = 20;
    shelfBoard(c, 36, y);
    [[3, 11, P.brick], [6, 9, K.leafMid], [9, 12, K.navy], [12, 10, P.lilac], [15, 8, K.mustard]].forEach(([x, h, col]) => {
      c.rect(x, y - h, 3, h, col);
      c.rect(x, y - h, 1, h, tone(col, 1.25)); // lit edge
      c.rect(x + 2, y - h, 1, h, tone(col, 0.75));
      c.rect(x, y - h + 2, 3, 1, tone(col, 0.7)); // a band on the spine
    });
    c.line(19, y, 23, y - 10, P.cream); // a book leaning on the others
    c.rect(19, y - 1, 4, 1, P.creamShade);
    // a candle in a little holder with a flame
    c.rect(27, y - 3, 5, 3, P.gold);
    c.rect(28, y - 9, 3, 6, P.white);
    c.rect(30, y - 9, 1, 6, P.creamShade);
    c.set(29, y - 10, P.glowWarm);
    c.set(29, y - 11, K.flame);
  }),
  'lace-curtains': curtains(0xece2cc, 0xd2c6ac, { lace: true, rod: P.white }),
  'velvet-curtains': curtains(K.plum, tone(K.plum, 0.72), { tie: P.gold, rod: P.gold }),
  'sage-curtains': curtains(P.sage, P.sageShade, { rod: P.wood }),
  'hanging-ivy': hanger((c) => {
    hangPot(c, 13, 9, C.potWhite, C.potWhiteShade);
    c.ellipse(12, 13, 6, 2.5, K.leafMid);
    c.ellipse(11, 12, 3, 1.3, K.leafSoft);
    vine(c, 7, 15, 22, K.leafSoft);
    vine(c, 12, 20, 18, K.leafMid);
    vine(c, 17, 15, 26, K.leafSoft);
  }),
  kokedama: hanger((c) => {
    c.line(12, 5, 12, 17, P.cream); // twine
    c.circle(12, 23, 6, 0x4f6b3a); // the moss ball
    c.ellipse(12, 25, 6, 3, 0x3e5630, (x, y) => y > 25);
    c.circle(10, 21, 2, 0x6a8a4f);
    c.line(6, 22, 18, 25, 0xc9b48a); // twine wrapped round
    c.line(8, 28, 16, 18, 0xc9b48a);
    // a little plant growing out of the top
    for (const [dx, dy] of [[-4, -4], [0, -6], [4, -4], [-2, -6], [2, -6]]) c.line(12, 17, 12 + dx, 17 + dy, K.leafSoft);
    c.ellipse(8, 13, 2, 1.2, K.leafHi);
    c.ellipse(16, 13, 2, 1.2, K.leafHi);
    c.ellipse(12, 11, 1.5, 1.5, K.leafSoft);
  }),
  'hanging-fern': hanger((c) => {
    hangPot(c, 15, 10, 0xb09060, 0x8a6e48, 0xb09060); // a woven basket
    for (let x = 8; x < 18; x += 3) c.rect(x, 17, 1, 4, 0x8a6e48);
    // fronds spilling out all round
    for (let k = 0; k < 12; k++) {
      const dir = k % 2 ? 1 : -1;
      const reach = 4 + (k % 6) * 1.6;
      for (let t = 0; t <= 12; t++) {
        const x = 12 + dir * (t / 12) * reach + (k % 3) - 1;
        const y = 15 + t * t * 0.14 - (k % 4);
        c.set(x, y, t % 3 === 0 ? K.leafHi : k % 3 ? K.leafSoft : K.leafMid);
        if (t % 2 === 1) c.set(x + dir, y + 1, K.leafMid);
      }
    }
    c.ellipse(12, 15, 6, 2, K.leafMid);
  }),
  'string-of-pearls': hanger((c) => {
    hangPot(c, 13, 9, C.terracotta, C.terracottaDark);
    c.ellipse(12, 13, 5, 1.8, K.leafMid);
    // strands of little round beads
    for (const [x, len] of [[8, 20], [11, 26], [14, 22], [17, 16]]) {
      for (let k = 0; k < len; k += 2) {
        const bx = x + Math.round(Math.sin((k + x) / 4));
        c.set(bx, 16 + k, K.leafDeep);
        c.rect(bx, 16 + k, 1, 1, k % 4 ? K.leafHi : K.succulent);
        if (k % 4 === 0) c.set(bx + 1, 16 + k, K.succulent);
      }
    }
  }),
};
export const PACK_WALL = Object.fromEntries(Object.entries(WALL_PICS).map(([id, draw]) => [wallArtTexture(id), draw]));

// ---------- shop pictures (16 x 16) ----------

const ic = (draw) =>
  icon((c) => {
    draw(c);
    c.outline(P.line);
  });
// ...with a soft floor shadow under it
const ics = (draw, rx = 6) =>
  icon((c) => {
    draw(c);
    c.outline(P.line);
    shadow(c, 8, 15, rx);
  });

function sofaIcon(color, { legs = P.woodDark, arms = 3, back = 5, tufts = false, pillows = [] } = {}) {
  const shade = tone(color, 0.75);
  return ics((c) => {
    c.rect(2, 4, 12, back, color); // back
    c.rect(1, 8, 14, 5, color); // seat
    c.rect(1, 12, 14, 1, shade);
    c.rect(0, 7, arms, 6, tone(color, 1.08)); // arms
    c.rect(16 - arms, 7, arms, 6, shade);
    c.rect(8, 8, 1, 4, shade);
    if (tufts) for (const x of [4, 7, 10]) c.set(x, 6, tone(color, 0.6));
    pillows.forEach((p, k) => c.rect(4 + k * 6, 6, 3, 3, p));
    c.rect(2, 13, 1, 2, legs).rect(13, 13, 1, 2, legs);
  });
}

function bedIcon(frame, quilt, { posts = false, puffy = false } = {}) {
  return ics((c) => {
    c.rect(1, 3, 2, 12, frame); // headboard
    if (posts) c.rect(1, 1, 2, 2, frame);
    c.rect(3, 8, 11, 4, P.cream); // mattress
    c.rect(4, 6, 4, 3, P.white); // pillow
    c.rect(8, puffy ? 7 : 8, 6, puffy ? 5 : 4, quilt);
    c.rect(8, 11, 6, 1, tone(quilt, 0.75));
    c.rect(3, 12, 11, 2, frame);
    c.rect(13, 6, 2, 9, frame); // footboard
  });
}

// A hanging plant's hook and two ropes (16 x 16 pictures).
function hook16(c) {
  c.set(8, 0, P.iron);
  c.line(8, 1, 4, 4, P.cream);
  c.line(8, 1, 11, 4, P.cream);
}
// A small bowl hanging under the ropes, rim at y = 4.
function bowl16(c, color, shade) {
  c.rect(3, 4, 9, 1, tone(color, 1.15)); // rim
  c.poly([[3, 5], [12, 5], [11, 9], [4, 9]], color);
  c.rect(10, 5, 1, 4, shade);
}

// A flower planter box (16 x 16): a wooden box, soil and five stems, with
// head(c, x, y, k) drawing each bloom. Matches the 3D planters at home.
function planterIcon(stem, head) {
  return ics((c) => {
    for (const [x, top] of [[3, 5], [6, 3], [8, 6], [10, 3], [13, 5]]) {
      c.line(x, top + 1, x, 10, stem);
    }
    c.rect(1, 9, 14, 6, K.oak); // the box
    c.rect(1, 9, 14, 1, tone(K.oak, 1.2));
    c.rect(1, 14, 14, 1, K.oakDark);
    c.rect(2, 10, 12, 1, P.woodDark); // soil showing at the top
    c.line(5, 11, 5, 13, K.oakDark).line(10, 11, 10, 13, K.oakDark); // planks
    [[3, 5], [6, 3], [8, 6], [10, 3], [13, 5]].forEach(([x, y], k) => head(c, x, y, k));
  }, 7);
}
const bloom4 = (petal, center) => (c, x, y) => {
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) c.set(x + dx, y + dy, petal);
  c.set(x, y, center);
};

const PACK_ICONS = {
  // sofas
  'moss-loveseat': sofaIcon(K.moss),
  'rose-settee': sofaIcon(K.rose, { legs: P.wood, back: 4 }),
  'plum-sofa': sofaIcon(K.plum, { pillows: [P.pink, K.mustard] }),
  chesterfield: sofaIcon(K.leather, { tufts: true, arms: 3 }),
  // chairs
  'wingback-chair': ics((c) => {
    c.rect(4, 1, 8, 9, P.sageDark);
    c.rect(2, 3, 2, 6, P.sageDark).rect(12, 3, 2, 6, tone(P.sageDark, 0.8)); // wings
    c.rect(3, 9, 10, 4, P.sageDark);
    c.rect(5, 9, 6, 2, P.sage);
    c.rect(4, 13, 1, 2, P.woodDark).rect(11, 13, 1, 2, P.woodDark);
  }, 5),
  'honey-armchair': sofaIcon(K.honey, { arms: 4, pillows: [P.cream] }),
  'wicker-chair': ics((c) => {
    c.circle(8, 6, 6, K.wicker);
    for (let k = 0; k < 7; k++) c.line(8, 11, 8 + Math.cos(Math.PI * (1.1 + k * 0.13)) * 6, 6 + Math.sin(Math.PI * (1.1 + k * 0.13)) * 6, K.wickerDark);
    c.rect(4, 9, 8, 3, P.cream);
    c.rect(5, 12, 6, 3, K.wicker);
    c.rect(5, 12, 6, 1, K.wickerDark);
  }, 4),
  'dining-chair': ics((c) => {
    c.rect(4, 1, 1, 14, K.oak).rect(11, 1, 1, 14, K.oak);
    for (const y of [2, 5]) c.rect(5, y, 6, 1, K.oak);
    c.rect(3, 9, 10, 2, P.creamShade);
    c.rect(11, 11, 1, 4, K.oakDark);
  }, 4),
  'spindle-chair': ics((c) => {
    c.rect(3, 1, 10, 2, K.sagePaint);
    for (let x = 4; x <= 11; x += 2) c.rect(x, 3, 1, 6, tone(K.sagePaint, 0.85));
    c.rect(3, 9, 10, 2, K.sagePaint);
    c.rect(4, 11, 1, 4, K.sagePaint).rect(11, 11, 1, 4, tone(K.sagePaint, 0.8));
  }, 4),
  'bean-bag': ics((c) => {
    c.ellipse(8, 10, 7, 4.5, tone(P.lilac, 0.85));
    c.ellipse(9, 6, 5, 4, P.lilac);
    c.ellipse(6, 9, 3, 1.5, tone(P.lilac, 1.15));
  }, 6),
  'bar-stool': ics((c) => {
    c.rect(3, 2, 10, 2, K.oak);
    c.rect(3, 4, 10, 1, K.oakDark);
    c.rect(4, 5, 1, 10, K.oak).rect(11, 5, 1, 10, K.oakDark);
    c.rect(4, 11, 8, 1, P.woodDark);
  }, 4),
  'mushroom-stool': ics((c) => {
    c.rect(6, 9, 4, 6, P.cream);
    c.rect(9, 9, 1, 6, P.creamShade);
    c.ellipse(8, 7, 7, 4.5, K.red, (x, y) => y <= 9);
    for (const [x, y] of [[4, 6], [8, 4], [11, 6]]) c.rect(x, y, 2, 1, P.white);
  }, 4),
  'knit-pouf': ics((c) => {
    c.ellipse(8, 9, 7, 5, K.oatmeal);
    c.ellipse(8, 6, 6, 2, tone(K.oatmeal, 1.12));
    for (const x of [3, 6, 9, 12]) c.line(x, 8, x, 13, tone(K.oatmeal, 0.85));
  }, 6),
  // tables
  'round-coffee-table': ics((c) => {
    c.ellipse(8, 7, 7, 2.5, K.oak);
    c.rect(1, 7, 14, 2, K.oakDark);
    c.ellipse(8, 6.5, 4, 1.5, P.white);
    c.rect(7, 9, 2, 5, P.woodDark);
    c.rect(4, 14, 8, 1, P.woodDark);
  }),
  'square-coffee-table': ics((c) => {
    c.rect(1, 6, 14, 2, K.oak);
    c.rect(1, 8, 14, 1, K.oakDark);
    c.rect(2, 9, 1, 6, P.woodDark).rect(13, 9, 1, 6, P.woodDark);
    c.rect(3, 12, 10, 1, P.wood);
    c.rect(4, 4, 4, 2, P.lilac);
  }),
  'glass-coffee-table': ics((c) => {
    c.rect(1, 7, 14, 1, K.glass);
    c.rect(1, 8, 14, 1, K.glassDark);
    for (const x of [2, 13]) {
      c.line(x, 9, x + (x < 8 ? 1 : -1), 12, P.iron);
      c.line(x + (x < 8 ? 1 : -1), 12, x, 14, P.iron);
    }
    c.rect(10, 5, 3, 2, K.navy);
  }),
  'stump-table': ics((c) => {
    c.rect(3, 6, 10, 8, P.woodDark);
    c.ellipse(8, 6, 5, 2, P.woodLight);
    c.ellipse(8, 6, 2.5, 1, tone(P.woodLight, 1.15));
    c.line(5, 8, 5, 13, tone(P.woodDark, 0.8));
    c.line(10, 8, 10, 13, tone(P.woodDark, 0.8));
    c.set(4, 12, P.mossLight);
  }),
  'end-table': ics((c) => {
    c.rect(3, 5, 10, 1, K.oak);
    c.rect(3, 6, 10, 4, P.wood);
    c.rect(4, 7, 8, 2, P.woodDark);
    c.set(8, 8, P.gold);
    c.rect(3, 10, 1, 5, P.woodDark).rect(12, 10, 1, 5, P.woodDark);
    c.rect(6, 2, 2, 3, P.cream);
    c.set(6, 1, P.glowWarm);
  }, 5),
  'crate-table': ics((c) => {
    c.rect(2, 5, 12, 10, K.wicker);
    c.rect(3, 6, 10, 8, P.woodDark);
    [P.brick, P.sage, P.lilac, K.navy, P.cream].forEach((col, k) => c.rect(3 + k * 2, 8 + (k % 2), 2, 6 - (k % 2), col));
  }),
  'dining-table': ics((c) => {
    c.rect(0, 7, 16, 2, K.oak);
    c.rect(0, 9, 16, 1, K.oakDark);
    c.rect(1, 10, 2, 5, P.woodDark).rect(13, 10, 2, 5, P.woodDark);
    c.rect(5, 6, 6, 1, P.sage);
    c.rect(7, 3, 2, 3, P.white);
    c.set(7, 2, P.pink);
    c.set(8, 1, K.mustard);
  }, 7),
  'bistro-table': ics((c) => {
    c.ellipse(8, 6, 6, 1.5, P.white);
    c.rect(2, 6, 12, 1, P.creamShade);
    c.rect(7, 7, 2, 7, P.iron);
    c.rect(5, 14, 6, 1, P.iron);
    c.rect(6, 3, 2, 2, P.pink);
  }, 4),
  'plant-stand': ics((c) => {
    c.rect(1, 12, 14, 3, K.oak);
    c.rect(3, 8, 10, 4, K.oak);
    c.rect(5, 4, 6, 4, K.oak);
    c.rect(1, 12, 14, 1, K.oakDark).rect(3, 8, 10, 1, K.oakDark).rect(5, 4, 6, 1, K.oakDark);
    for (const [x, y, col] of [[7, 1, K.leafSoft], [4, 5, K.leafMid], [11, 5, K.succulent], [2, 9, K.leafSoft], [13, 9, K.leafMid]]) c.rect(x, y, 2, 3, col);
  }),
  'iron-plant-stand': ics((c) => {
    c.line(4, 15, 7, 7, P.iron);
    c.line(12, 15, 9, 7, P.iron);
    c.rect(5, 7, 6, 1, P.iron);
    c.rect(5, 4, 6, 3, C.potWhite);
    for (let k = 0; k < 6; k++) c.line(8, 3, 8 + (k - 2.5) * 2.4, 3 + Math.abs(k - 2.5) * 2.2, k % 2 ? K.leafSoft : K.leafMid);
  }, 4),
  // shelves
  'small-bookshelf': ics((c) => {
    c.rect(2, 2, 12, 13, P.wood);
    c.rect(3, 3, 10, 11, P.woodDark);
    c.rect(3, 8, 10, 1, P.wood);
    BOOKS.forEach((col, k) => c.rect(3 + k, 4 + (k % 3 === 0 ? 1 : 0), 1, 4 - (k % 3 === 0 ? 1 : 0), col));
    [P.cream, P.brick, P.sage, K.navy, P.pink].forEach((col, k) => c.rect(3 + k * 1, 10 + (k % 2), 1, 4 - (k % 2), col));
    c.rect(4, 0, 1, 2, P.cream);
    c.rect(11, 0, 2, 2, K.leafMid);
  }),
  'tall-bookshelf': ic((c) => {
    c.rect(2, 0, 12, 16, P.woodDark);
    c.rect(3, 1, 10, 14, tone(P.woodDark, 0.7));
    for (const y of [1, 5, 9, 13]) {
      for (let x = 3; x < 13; x++) c.rect(x, y + ((x * 7 + y) % 3 === 0 ? 1 : 0), 1, 3 - ((x * 7 + y) % 3 === 0 ? 1 : 0), BOOKS[(x + y) % BOOKS.length]);
      c.rect(3, y + 3, 10, 1, P.woodDark);
    }
    c.line(4, 15, 6, 6, K.oak);
  }),
  'tv-cabinet': ics((c) => {
    c.rect(1, 9, 14, 5, K.oak);
    c.rect(2, 10, 5, 3, P.wood).rect(9, 10, 5, 3, P.wood);
    c.rect(3, 2, 10, 7, 0x8a8478);
    c.rect(4, 3, 6, 5, 0x5fa8a0);
    c.rect(4, 3, 2, 1, 0xa8e0d0);
    c.set(11, 4, P.brick);
    c.line(6, 2, 4, 0, P.iron);
    c.line(9, 2, 11, 0, P.iron);
  }),
  'curio-cabinet': ic((c) => {
    c.rect(3, 0, 10, 15, P.wood);
    c.rect(4, 1, 8, 12, K.glass);
    for (const y of [4, 8]) c.rect(4, y, 8, 1, P.woodLight);
    for (const [x, y, col] of [[5, 2, P.pink], [9, 2, P.white], [6, 6, P.lilac], [9, 6, P.pink], [5, 10, P.white], [8, 10, K.glassDark]]) c.rect(x, y, 2, 2, col);
    c.rect(8, 1, 1, 12, P.wood);
    c.rect(3, 15, 1, 1, P.woodDark).rect(12, 15, 1, 1, P.woodDark);
  }),
  // lamps
  'arc-lamp': ics((c) => {
    c.ellipse(4, 14, 3, 1, P.white);
    c.line(4, 13, 4, 6, K.mustard);
    c.line(4, 6, 6, 2, K.mustard);
    c.line(6, 2, 10, 1, K.mustard);
    c.line(10, 1, 12, 3, K.mustard);
    c.ellipse(12, 6, 3, 2.5, K.mustard, (x, y) => y <= 6);
    c.rect(10, 7, 5, 1, P.glow);
  }, 4),
  'lantern-lamp': ics((c) => {
    c.circle(8, 1, 1, P.iron);
    c.poly([[4, 5], [12, 5], [8, 2]], P.iron);
    c.rect(4, 5, 8, 9, P.iron);
    c.rect(5, 6, 6, 7, P.glow);
    c.rect(7, 9, 2, 3, P.cream);
    c.set(7, 8, P.glowWarm);
    c.rect(3, 14, 10, 1, P.iron);
  }, 5),
  candelabra: ics((c) => {
    c.rect(6, 14, 4, 1, P.gold);
    c.rect(7, 6, 2, 8, P.gold);
    c.rect(2, 7, 12, 1, P.gold);
    for (const [x, h] of [[2, 3], [7, 5], [12, 3]]) {
      c.rect(x, 7 - h, 2, h, P.white);
      c.set(x, 6 - h, P.glowWarm);
      c.set(x + 1, 5 - h, K.flame);
    }
  }, 4),
  'star-lamp': ics((c) => {
    const pts = [];
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 2.8 : 6.5;
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      pts.push([8 + Math.cos(ang) * r, 7 + Math.sin(ang) * r]);
    }
    c.poly(pts, 0xf7dc8a);
    c.circle(7.5, 6.5, 1.5, K.flame);
    c.rect(6, 13, 4, 2, P.woodDark);
  }, 4),
  // beds
  'single-bed': bedIcon(K.oak, P.sage),
  'double-bed': bedIcon(P.woodDark, P.sageLight),
  'iron-bed': ics((c) => {
    c.rect(1, 2, 1, 13, P.iron);
    c.rect(1, 2, 3, 1, P.iron);
    c.circle(3, 5, 1.5, P.iron, (x, y) => !(x === 3 && y === 5));
    c.rect(2, 9, 12, 3, P.cream);
    c.rect(3, 7, 4, 3, P.white);
    c.ellipse(10, 9, 5, 3, P.white);
    c.rect(6, 11, 8, 1, P.creamShade);
    c.rect(14, 6, 1, 9, P.iron);
    c.rect(2, 12, 12, 1, P.iron);
  }, 7),
  daybed: ics((c) => {
    c.rect(1, 3, 14, 2, P.white);
    for (let x = 3; x < 14; x += 2) c.rect(x, 5, 1, 3, P.creamShade);
    c.rect(1, 3, 2, 10, P.white).rect(13, 3, 2, 10, P.creamShade);
    c.rect(3, 8, 10, 4, P.pink);
    c.rect(3, 11, 10, 1, P.pinkShade);
    c.rect(4, 6, 3, 2, P.white).rect(9, 6, 3, 2, P.lilac);
    c.rect(1, 13, 1, 2, P.white).rect(14, 13, 1, 2, P.creamShade);
  }, 7),
  // bedroom
  nightstand: ics((c) => {
    c.rect(3, 4, 10, 1, K.oak);
    c.rect(3, 5, 10, 8, P.wood);
    c.rect(4, 6, 8, 2, P.woodDark);
    c.set(8, 7, P.gold);
    c.rect(4, 9, 8, 3, tone(P.wood, 0.75));
    c.rect(3, 13, 1, 2, P.woodDark).rect(12, 13, 1, 2, P.woodDark);
    c.rect(5, 2, 3, 2, P.lilac);
  }, 5),
  'round-nightstand': ics((c) => {
    c.ellipse(8, 4, 6, 1.5, P.white);
    c.poly([[2, 4], [14, 4], [15, 15], [1, 15]], P.pink);
    for (const x of [3, 6, 9, 12]) c.line(x, 6, x, 14, P.pinkShade);
    c.rect(8, 1, 2, 3, P.cream);
    c.set(8, 0, P.glowWarm);
  }, 7),
  'chest-of-drawers': ics((c) => {
    c.rect(1, 2, 14, 1, K.oak);
    c.rect(1, 3, 14, 11, K.oakDark);
    for (const y of [3, 6, 9, 12]) {
      c.rect(2, y, 12, 2, P.wood);
      c.set(5, y + 1, P.gold);
      c.set(10, y + 1, P.gold);
    }
    c.rect(2, 14, 1, 1, P.woodDark).rect(13, 14, 1, 1, P.woodDark);
    c.rect(11, 0, 2, 2, P.lilac);
  }, 7),
  vanity: ics((c) => {
    c.ellipse(8, 4, 3.5, 4, P.white);
    c.ellipse(8, 4, 2.5, 3, K.mirror);
    c.set(7, 2, K.shine);
    c.rect(1, 8, 14, 1, P.white);
    c.rect(1, 9, 4, 6, P.white).rect(11, 9, 4, 6, P.creamShade);
    c.rect(2, 10, 2, 1, P.pink).rect(2, 12, 2, 1, P.pink).rect(12, 10, 2, 1, P.pink).rect(12, 12, 2, 1, P.pink);
    c.rect(2, 6, 1, 2, P.lilac);
  }, 7),
  wardrobe: ic((c) => {
    c.rect(2, 1, 12, 14, K.sagePaint);
    c.rect(1, 0, 14, 1, tone(K.sagePaint, 0.8));
    c.rect(3, 2, 4, 12, tone(K.sagePaint, 1.1)).rect(9, 2, 4, 12, tone(K.sagePaint, 1.1));
    c.set(7, 8, P.gold);
    c.set(8, 8, P.gold);
    c.set(4, 3, P.pink);
    c.set(5, 4, P.leaf);
    c.set(11, 12, P.pink);
    c.set(10, 11, P.leaf);
    c.rect(3, 15, 1, 1, P.woodDark).rect(12, 15, 1, 1, P.woodDark);
  }),
  'bed-bench': ics((c) => {
    c.rect(1, 7, 14, 3, P.lilac);
    c.rect(1, 9, 14, 1, P.lilacShade);
    for (const x of [4, 8, 12]) c.set(x, 8, P.lilacDark);
    c.rect(1, 10, 14, 1, P.wood);
    c.rect(2, 11, 1, 4, P.woodDark).rect(13, 11, 1, 4, P.woodDark);
  }, 7),
  'storage-trunk': ics((c) => {
    c.rect(1, 4, 14, 10, P.brick);
    c.rect(1, 4, 14, 3, tone(P.brick, 1.1));
    c.rect(1, 7, 14, 1, P.brickDark);
    c.rect(3, 4, 1, 10, P.iron).rect(12, 4, 1, 10, P.iron);
    c.rect(7, 6, 2, 3, P.gold);
  }, 7),
  'floor-mirror': ics((c) => {
    c.ellipse(8, 7, 4.5, 7, K.oak);
    c.ellipse(8, 7, 3.5, 6, K.mirror);
    c.line(6, 5, 8, 2, K.shine);
    c.line(5, 15, 7, 12, P.wood);
    c.line(11, 15, 9, 12, P.wood);
  }, 4),
  // rugs
  'mushroom-rug': ic((c) => {
    c.ellipse(7.5, 9, 7, 4.5, K.red);
    for (const [x, y] of [[4, 8], [9, 7], [11, 10], [6, 11]]) c.rect(x, y, 2, 1, P.white);
  }),
  'moon-rug': ic((c) => {
    c.ellipse(7.5, 9, 7, 4.5, K.mustard);
    c.ellipse(7.5, 9, 6, 3.5, K.navy);
    c.ellipse(7.5, 9, 2.5, 2, 0xf7dc8a);
    c.ellipse(8.5, 8, 2, 1.5, K.navy);
    c.set(3, 8, P.white);
    c.set(12, 10, P.white);
  }),
  'woven-rug': ic((c) => {
    c.rect(1, 5, 14, 8, K.oatmeal);
    c.rect(1, 5, 14, 1, K.rust).rect(1, 12, 14, 1, K.rust);
    for (let x = 1; x < 15; x++) c.set(x, 8 + (x % 4 < 2 ? 0 : 1), K.rust);
    for (let x = 2; x < 15; x += 3) c.set(x, 10, P.woodDark);
  }),
  'rose-rug': ic((c) => {
    c.rect(1, 4, 14, 9, P.redDark);
    c.rect(2, 5, 12, 7, K.navy);
    c.rect(3, 6, 10, 5, P.red);
    c.rect(6, 7, 4, 3, P.pink);
    c.set(7, 8, P.white);
    c.set(8, 8, P.white);
    c.set(4, 7, P.pink);
    c.set(11, 9, P.pink);
  }),
  'checker-rug': ic((c) => {
    for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) c.rect(1 + x * 3.5, 4 + y * 3, 4, 3, (x + y) % 2 ? P.sage : P.cream);
  }),
  'floral-runner': ic((c) => {
    c.rect(1, 6, 14, 5, P.cream);
    c.rect(1, 6, 14, 1, P.sageShade).rect(1, 10, 14, 1, P.sageShade);
    for (const x of [3, 8, 13]) {
      c.set(x, 8, K.mustard);
      c.set(x - 1, 8, P.pink);
      c.set(x + 1, 8, P.pink);
    }
    for (let y = 7; y < 11; y += 2) {
      c.set(0, y, P.creamShade);
      c.set(15, y, P.creamShade);
    }
  }),
  'sage-runner': ic((c) => {
    c.rect(1, 6, 14, 5, P.sage);
    c.rect(2, 7, 12, 3, P.cream);
    c.rect(3, 8, 10, 1, P.sage);
  }),
  // wall things (also hung on the wall at twice the size)
  'round-mirror': ic((c) => {
    c.line(8, 0, 8, 3, P.woodDark);
    c.circle(8, 9, 6, K.oak);
    c.circle(8, 9, 5, K.mirror);
    c.line(5, 9, 8, 6, K.shine);
    c.line(6, 11, 10, 7, K.shine);
  }),
  'sunburst-mirror': ic((c) => {
    for (let k = 0; k < 16; k++) {
      const ang = (k * Math.PI) / 8;
      c.line(8 + Math.cos(ang) * 4, 8 + Math.sin(ang) * 4, 8 + Math.cos(ang) * (k % 2 ? 6 : 7.5), 8 + Math.sin(ang) * (k % 2 ? 6 : 7.5), P.gold);
    }
    c.circle(8, 8, 4, P.gold);
    c.circle(8, 8, 3, K.mirror);
    c.set(7, 7, K.shine);
    c.set(6, 8, K.shine);
  }),
  'wall-shelf': ic((c) => {
    c.rect(1, 10, 14, 2, K.oak);
    c.rect(2, 12, 1, 2, P.woodDark).rect(13, 12, 1, 2, P.woodDark);
    [P.brick, P.sage, K.navy, P.lilac].forEach((col, k) => c.rect(2 + k * 2, 4 + (k % 2), 2, 6 - (k % 2), col));
    c.line(10, 4, 12, 9, P.cream); // a leaning book
    c.rect(13, 7, 1, 3, P.cream);
    c.set(13, 6, P.glowWarm);
  }),
  'jar-shelf': ic((c) => {
    c.rect(0, 11, 16, 2, K.oak);
    c.rect(1, 13, 1, 2, P.woodDark).rect(14, 13, 1, 2, P.woodDark);
    for (const [x, h, col, lid] of [[1, 6, K.mustard, P.brick], [6, 5, P.brick, P.white], [11, 7, P.lilac, P.woodDark]]) {
      c.rect(x, 11 - h, 4, h, col);
      c.rect(x, 10 - h, 4, 1, lid);
      c.rect(x + 1, 12 - h, 1, h - 2, tone(col, 1.25));
    }
  }),
  'plant-shelf': ic((c) => {
    c.rect(0, 9, 16, 2, K.oak);
    c.rect(1, 11, 1, 2, P.woodDark).rect(14, 11, 1, 2, P.woodDark);
    for (const [x, col] of [[1, C.terracotta], [6, C.potWhite], [11, C.terracotta]]) c.rect(x, 6, 4, 3, col);
    c.ellipse(3, 4, 2.5, 2, K.leafMid);
    c.ellipse(8, 4, 2, 2.5, K.succulent);
    c.ellipse(13, 4, 2.5, 2, K.leafSoft);
    c.line(14, 8, 14, 15, K.leafDeep);
    for (const y of [10, 12, 14]) c.set(15, y, K.leafSoft);
  }),
  'frame-trio': ic((c) => {
    c.rect(0, 2, 7, 8, K.oak);
    c.rect(1, 3, 5, 6, P.sageLight);
    c.rect(2, 6, 3, 3, K.leafMid);
    c.rect(8, 1, 7, 6, P.white);
    c.rect(9, 2, 5, 4, P.pink);
    c.rect(8, 9, 6, 6, P.woodDark);
    c.rect(9, 10, 4, 4, K.navy);
    c.set(10, 11, P.glow);
  }),
  'forest-painting': ic((c) => {
    c.rect(0, 2, 16, 12, P.gold);
    c.rect(1, 3, 14, 10, 0x7f9fc8);
    c.rect(1, 9, 14, 4, K.leafDeep);
    for (const [x, h] of [[3, 6], [6, 8], [10, 7], [13, 5]]) c.poly([[x - 2, 12], [x + 2, 12], [x, 12 - h]], K.leafMid);
    c.rect(1, 7, 14, 1, 0xc8d4e0); // mist
  }),
  'cat-portrait': ic((c) => {
    c.ellipse(8, 8, 7, 7.5, P.gold);
    c.ellipse(8, 8, 5.5, 6, P.plum);
    c.ellipse(8, 10, 3.5, 3, 0x8a8478); // the cat
    c.poly([[5, 9], [6, 5], [7, 8]], 0x8a8478);
    c.poly([[9, 8], [10, 5], [11, 9]], 0x8a8478);
    c.set(7, 9, K.mustard);
    c.set(9, 9, K.mustard);
    c.rect(6, 12, 4, 1, P.white); // a little ruff collar
  }),
  'pressed-flowers': ic((c) => {
    c.rect(2, 0, 12, 16, P.wood);
    c.rect(3, 1, 10, 14, 0xe8dcc0);
    c.line(6, 13, 6, 4, P.sageShade);
    c.line(10, 13, 10, 6, P.sageShade);
    c.rect(5, 3, 3, 2, P.pink);
    c.rect(9, 5, 3, 2, P.lilac);
    c.set(7, 9, P.sage);
    c.set(9, 10, P.sage);
    c.set(4, 10, K.mustard);
  }),
  'moth-tapestry': ic((c) => {
    c.rect(1, 0, 14, 1, P.wood);
    c.rect(2, 1, 12, 13, K.navy);
    for (let x = 2; x < 14; x += 2) c.set(x, 14, K.navy); // fringe
    c.ellipse(5, 4, 2, 2, 0xf7dc8a);
    c.ellipse(6, 3.5, 1.5, 1.5, K.navy);
    c.poly([[8, 9], [4, 7], [5, 11]], P.cream); // moth wings
    c.poly([[8, 9], [12, 7], [11, 11]], P.cream);
    c.rect(8, 7, 1, 5, P.woodDark);
    c.set(5, 9, P.lilac);
    c.set(11, 9, P.lilac);
  }),
  'lace-curtains': ic((c) => {
    c.rect(0, 1, 16, 1, P.white);
    c.rect(1, 2, 5, 13, 0xece2cc).rect(10, 2, 5, 13, 0xece2cc);
    for (const x of [2, 4, 11, 13]) c.rect(x, 2, 1, 13, 0xd2c6ac);
    for (const [x, y] of [[1, 5], [3, 9], [12, 6], [14, 11]]) c.set(x, y, P.white);
  }),
  'velvet-curtains': ic((c) => {
    c.rect(0, 1, 16, 1, P.gold);
    c.poly([[1, 2], [6, 2], [4, 9], [6, 15], [1, 15]], K.plum);
    c.poly([[10, 2], [15, 2], [15, 15], [10, 15], [12, 9]], K.plum);
    c.line(2, 3, 2, 14, tone(K.plum, 0.72));
    c.line(13, 3, 13, 14, tone(K.plum, 0.72));
    c.rect(2, 9, 3, 1, P.gold).rect(11, 9, 3, 1, P.gold);
  }),
  'sage-curtains': ic((c) => {
    c.rect(0, 1, 16, 1, P.wood);
    c.rect(1, 2, 5, 13, P.sage).rect(10, 2, 5, 13, P.sage);
    for (const x of [3, 12]) c.rect(x, 2, 1, 13, P.sageShade);
  }),
  // flower planters (they used to be paper cones; now they match the 3D planters)
  daisies: planterIcon(P.leaf, bloom4(P.white, K.mustard)),
  tulips: planterIcon(P.leaf, (c, x, y, k) => {
    const col = k % 2 ? P.pink : K.red;
    c.rect(x - 1, y - 1, 3, 3, col);
    c.set(x, y - 1, -1);
    c.set(x - 1, y - 1, tone(col, 1.2));
  }),
  sunflowers: planterIcon(P.leaf, (c, x, y) => {
    c.ellipse(x, y, 1.6, 1.6, K.mustard);
    c.set(x, y, P.woodDark);
  }),
  lavender: planterIcon(P.sageShade, (c, x, y) => {
    for (let k = 0; k < 4; k++) c.set(x + (k % 2), y - 1 + k, k % 2 ? P.lilacShade : P.lilac);
  }),
  roses: planterIcon(P.leafDark, (c, x, y) => {
    c.rect(x - 1, y - 1, 3, 3, K.red);
    c.set(x, y, tone(K.red, 0.7));
  }),
  // the plant shop's hanging plants, redrawn: a hook, two thin ropes, a bowl
  // and leaves that spill over the rim and trail below
  'hanging-ivy': ic((c) => {
    hook16(c);
    bowl16(c, C.potWhite, C.potWhiteShade);
    c.ellipse(7.5, 5, 4, 1.8, K.leafMid); // leaves piled over the rim
    c.set(6, 4, K.leafHi);
    c.set(8, 4, K.leafHi);
    vine(c, 5, 9, 6, K.leafSoft);
    vine(c, 8, 9, 5, K.leafMid);
    vine(c, 11, 9, 6, K.leafSoft);
  }),
  kokedama: ic((c) => {
    c.rect(8, 0, 1, 1, P.iron);
    c.line(8, 1, 8, 5, P.cream); // one twine
    c.circle(8, 10, 4.5, 0x4f6b3a); // the moss ball
    c.circle(7, 8, 1.5, 0x6a8a4f);
    c.line(4, 9, 12, 11, 0xc9b48a); // twine wrapped round it
    c.line(5, 13, 11, 7, 0xc9b48a);
    c.line(8, 5, 5, 3, K.leafSoft); // sprouts
    c.line(8, 5, 11, 3, K.leafSoft);
    c.set(8, 4, K.leafHi);
    c.rect(4, 2, 2, 1, K.leafHi);
    c.rect(10, 2, 2, 1, K.leafHi);
  }),
  'hanging-fern': ic((c) => {
    hook16(c);
    bowl16(c, 0xb09060, 0x8a6e48);
    for (const x of [5, 8]) c.rect(x, 6, 1, 3, 0x8a6e48); // weave
    c.ellipse(7.5, 5, 4.5, 1.8, K.leafMid);
    for (const [x, y] of [[1, 9], [2, 12], [14, 9], [13, 12], [5, 14], [10, 14]]) c.line(x < 8 ? 4 : 11, 5, x, y, K.leafSoft);
    c.set(1, 8, K.leafHi);
    c.set(14, 8, K.leafHi);
  }),
  'string-of-pearls': ic((c) => {
    hook16(c);
    bowl16(c, C.terracotta, C.terracottaDark);
    c.ellipse(7.5, 5, 3.5, 1.5, K.leafMid);
    for (const [x, len] of [[4, 6], [6, 8], [9, 7], [11, 5]]) for (let y = 9; y < 9 + len; y += 2) {
      c.set(x, y, K.leafHi);
      c.set(x + 1, y, K.succulent); // each bead
    }
  }),
};

// The shop pictures, keyed by file name. Hanging plants from the plant shop
// replace their old pictures in items.js / items-more.js.
export const PACK_ITEMS = Object.fromEntries(Object.entries(PACK_ICONS).map(([id, draw]) => [`item-${id}`, draw]));

// Make sure every pack item has the pictures it needs.
for (const item of FURNITURE_PACK) {
  if (item.cat === 'walls' || item.cat === 'floors') continue; // wallpaper and flooring pictures come from homeStyles.js
  if (!PACK_ICONS[item.id]) throw new Error(`furniturePack.js: no shop picture for ${item.id}`);
  if (item.cat === 'wall' || item.cat === 'hanging') continue;
  if (!FOOTPRINT[item.id]) throw new Error(`furniturePack.js: ${item.id} has no FOOTPRINT (src/data/furniture.js)`);
  if (!PACK_ISO[`iso-${item.id}`]) throw new Error(`furniturePack.js: no 3D picture for ${item.id}`);
}
for (const id of Object.keys(WALL_ART)) if (!WALL_PICS[id]) throw new Error(`furniturePack.js: no wall picture for ${id}`);

