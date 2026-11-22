// Timber & Twig, the woodworking shop (src/data/woodshop.js): every piece gets
//   item-<id>.png   its 16 x 16 shop picture, seen from the front
//   iso-<id>.png    floor things: a 3D picture for your home (see furniture.js
//                   for how the iso() workspace works)
// Wall things (clocks, signs, birdhouses) hang on the wall as their shop
// picture, drawn twice as big and slanted to lie along the wall.
//
// Everything here is wood, so each piece leans on a different wood to stay
// readable: pale pine, honey oak, dark walnut, white birch, rough bark.
import { P } from './palette.js';
import { icon, shadow } from './items.js';
import { tone, piece, legs } from './furniture.js';
import { WOODSHOP_STOCK } from '../../src/data/woodshop.js';
import { FOOTPRINT } from '../../src/data/furniture.js';

// ---------- colors ----------

const W = {
  pine: 0xb08a5a,
  pineDark: 0x8a6a44,
  pineLight: 0xcaa874,
  oak: 0x9a6f48,
  oakDark: 0x6e4c32,
  walnut: 0x6e4c32,
  walnutDark: 0x4e3424,
  bark: 0x45302a,
  barkLight: 0x5e4236,
  twig: 0x8a6446,
  twigDark: 0x6b4a36,
  birch: 0xe6ddcc,
  birchMark: 0x34303a,
  sagePaint: 0x7f9a80,
  red: 0xb8404a,
  redDark: 0x82303a,
  rust: 0xa8583e,
  wine: 0x8b3f52,
  linen: 0xd8c8a8,
  rope: 0xc9b48a,
  steel: 0x9aa0a8,
  dapple: 0xd8d0c4,
  moss: 0x6a8a45,
};

// ---------- little 3D helpers ----------

// The rings on the cut end of a log, as a screen-space ellipse.
function logEnd(c, x, y, rx, ry, wood = P.woodLight) {
  c.ellipse(x, y, rx, ry, wood);
  c.ellipse(x, y, rx * 0.55, ry * 0.55, tone(wood, 1.15), (px, py) => (px - x) ** 2 / (rx * 0.55) ** 2 + (py - y) ** 2 / (ry * 0.55) ** 2 > 0.45);
  c.set(x, y, tone(wood, 0.8));
}

// A candle standing at (i, j, z), with a soft glow.
function candle(s, i, j, z, h = 4) {
  s.cyl(i, j, z, 0.8, h, P.cream, { side: P.creamShade });
  s.glow(i, j, z + h + 2, 6, P.glowWarm, 45);
  const [x, y] = s.p(i, j, z + h + 1);
  s.c.set(x, y - 1, 0xffe3a0);
  s.c.set(x, y, P.glowWarm);
}

// A pinecone at a screen spot.
function pinecone(c, x, y) {
  c.ellipse(x, y, 1.5, 2, W.walnut);
  c.set(x, y - 1, W.pine);
  c.set(x - 1, y + 1, W.pine);
}

// ---------- seats ----------

const SEATS = [
  piece('log-bench', (s, a, b) => {
    // two stumps holding up a split log
    for (const i of [3, a - 3]) s.cyl(i, b / 2, 0, 2.2, 6, W.bark, { side: tone(W.bark, 0.75), top: W.barkLight });
    s.box(0, 0.5, 6, a, b - 1, 3, W.twig, { top: P.woodLight, side: W.twigDark });
    s.front(0, b - 0.5, 6, a, 1.5, W.bark); // the bark still on the front
    for (let i = 2; i < a; i += 4) s.dot(i, b - 0.5, 7, W.barkLight);
    const [x, y] = s.p(a, b / 2, 7.5);
    logEnd(s.c, x, y, 2, 2.5, P.woodLight); // the cut end
    s.dot(1, b - 0.5, 6.5, W.moss).dot(1.5, b - 0.5, 6, P.mossLight);
  }),
  piece('twig-chair', (s, a, b) => {
    const tw = W.twig;
    const dk = W.twigDark;
    // back legs and the arched back, bent from willow
    s.line([0.5, 1, 0], [0.5, 1, 22], dk, 2).line([a - 0.5, 1, 0], [a - 0.5, 1, 22], tw, 2);
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      const t2 = (k + 1) / 8;
      const arch = (u) => 22 + 5 * Math.sin(u * Math.PI);
      if (k < 8) s.line([0.5 + (a - 1) * t, 1, arch(t)], [0.5 + (a - 1) * t2, 1, arch(t2)], tw, 2);
    }
    // a woven lattice on the back
    for (const [i0, i1] of [[1, a - 2], [a - 1, 2], [3, a - 1], [a - 3, 1]]) s.line([i0, 1, 10], [i1, 1, 22], tone(tw, 1.1));
    // seat and cushion
    s.box(0.5, 1, 8, a - 1, b - 1.5, 1.5, P.woodLight, { side: dk });
    s.box(1, 1.5, 9.5, a - 2, b - 2.5, 2, P.sage, { side: P.sageShade });
    // front legs and looping arms
    s.line([0.5, b - 0.5, 0], [0.5, b - 0.5, 14], tw, 2).line([a - 0.5, b - 0.5, 0], [a - 0.5, b - 0.5, 14], dk, 2);
    for (const i of [0.5, a - 0.5]) {
      s.line([i, 1, 18], [i, b / 2, 16], tw).line([i, b / 2, 16], [i, b - 0.5, 14], tw);
    }
    s.line([0.5, b - 0.5, 3], [a - 0.5, b - 0.5, 3], dk); // a low rung
  }),
  piece('settle-bench', (s, a, b) => {
    const wood = W.oak;
    const side = W.oakDark;
    s.box(0, 0, 0, a, 2, 26, wood, { side }); // the tall back
    for (let k = 0; k < 3; k++) {
      const w = (a - 4) / 3;
      s.front(2 + k * w, 2, 11, w - 1, 12, tone(wood, 0.88)); // raised panels
      s.front(2 + k * w, 2, 22, w - 1, 1, tone(wood, 1.15));
    }
    s.box(-0.5, -0.5, 26, a + 1, 3, 1.5, side); // crest
    s.box(0, 2, 0, 1.5, b - 2, 14, wood, { side }); // left arm
    s.box(0, 2, 0, a, b - 2, 8, wood, { side }); // seat box
    s.front(1.5, b, 1, a - 3, 5, tone(wood, 0.85));
    for (let i = a / 3; i < a - 1; i += a / 3) s.front(i, b, 1, 0.5, 5, side);
    s.box(1.5, 2.5, 8, a - 3, b - 3, 2, W.rust, { side: tone(W.rust, 0.75) }); // cushion
    s.box(a - 1.5, 2, 0, 1.5, b - 2, 14, wood, { side }); // right arm
  }),
  piece('milking-stool', (s, a, b) => {
    const m = a / 2;
    // three splayed legs
    s.line([m - 1.5, m - 1, 7], [0.5, b / 2 - 1, 0], W.oakDark, 2);
    s.line([m + 1, m - 1.5, 7], [a - 0.5, 0.5, 0], W.oakDark, 2);
    s.line([m, m + 1.5, 7], [m, b - 0.2, 0], W.oak, 2);
    s.cyl(m, b / 2, 7, 3, 1.5, W.oak, { side: W.oakDark });
    const [x, y] = s.p(m, b / 2, 8.5);
    s.c.ellipse(x, y, 3, 1.3, tone(W.oak, 1.3), (px, py) => (px - x) ** 2 / 9 + (py - y) ** 2 / 1.7 > 0.4); // grain ring
  }),
  piece('carved-throne', (s, a, b) => {
    const wood = W.walnut;
    const side = W.walnutDark;
    const hi = tone(wood, 1.35);
    // the tall back with a rounded, leafy top, drawn as columns
    for (let i = 0; i < a; i += 0.5) {
      const t = (i + 0.25 - a / 2) / (a / 2);
      const h = 30 + 6 * Math.sqrt(Math.max(0, 1 - t * t));
      s.front(i, 2.5, 0, 0.5, h, i < 0.5 || i >= a - 0.5 ? side : wood);
      s.front(i, 2.5, h - 1, 0.5, 1, hi);
    }
    // carved leaves climbing a vine up the middle
    const [vx, vy] = s.p(a / 2, 2.5, 13);
    for (let k = 0; k < 20; k++) s.c.set(vx + Math.round(Math.sin(k / 2.2) * 2), vy - k, hi);
    for (let k = 2; k < 20; k += 4) {
      const dir = (k / 4) % 2 < 1 ? -1 : 1;
      s.c.ellipse(vx + dir * 4, vy - k, 2, 1, tone(wood, 1.2));
    }
    s.c.ellipse(vx, vy - 23, 3, 2, tone(wood, 1.2)); // a big leaf at the top
    // seat, cushion and arms
    s.box(0, 2.5, 0, a, b - 2.5, 10, wood, { side });
    s.front(1, b, 2, a - 2, 6, tone(wood, 0.85));
    s.box(0.5, 3, 10, a - 1, b - 4, 2.5, W.wine, { side: tone(W.wine, 0.72) });
    s.box(0, 2.5, 10, 1.5, b - 3, 7, wood, { side });
    s.box(a - 1.5, 2.5, 10, 1.5, b - 3, 7, wood, { side });
    // acorn finials on the arms
    for (const i of [0.75, a - 0.75]) {
      s.ball(i, b - 1.2, 18.5, 1.5, 1.6, P.woodLight);
      s.ball(i, b - 1.2, 19.5, 1.5, 0.8, side);
    }
  }),
];

// ---------- tables ----------

const TABLES = [
  piece('workbench', (s, a, b) => {
    const top = W.pine;
    // a pegboard along the back with tools on it
    s.box(0, 0, 12, a, 1, 13, W.pineDark, { side: tone(W.pineDark, 0.75) });
    for (let i = 2; i < a; i += 2) for (let z = 16; z < 25; z += 3) s.dot(i, 1, z, tone(W.pineDark, 0.7));
    s.line([3, 1, 23], [3, 1, 16], P.iron).line([2, 1, 23], [4, 1, 23], P.iron); // a hammer
    s.front(6, 1, 15, 5, 3, W.steel).front(6, 1, 18, 1.5, 4, P.woodDark); // a saw
    s.line([14, 1, 22], [16, 1, 16], W.red, 2); // a screwdriver
    legs(s, a, b, 0, 12, W.pineDark, 0.5, 2);
    s.box(1, 1, 3, a - 2, b - 2, 1, P.wood, { edge: false }); // lower shelf
    for (let i = 3; i < a - 3; i += 3) s.box(i, 2, 4, 2, b - 4, 2, i % 2 ? P.woodLight : W.oak, { edge: false }); // offcuts
    s.box(0, 0, 12, a, b, 3, top, { side: W.pineDark });
    for (let j = 2; j < b; j += 2) s.line([0, j, 15], [a, j, 15], tone(top, 0.9)); // butcher-block strips
    s.box(1, b - 0.5, 9, 4, 1.5, 5, P.iron, { top: 0x4a4a52 }); // the vise
    s.line([3, b + 1, 11], [3, b + 3, 11], W.steel);
    s.box(9, 3, 15, 4, 2, 2, P.woodDark, { top: W.oak }); // a hand plane
    s.box(14, 4, 15, 4, 1, 0.5, P.woodLight, { edge: false }); // curly shavings
    s.dot(15, 3.5, 16, W.pineLight).dot(17, 5, 16, W.pineLight);
  }),
  piece('trestle-table', (s, a, b) => {
    const wood = W.oak;
    for (const i of [2, a - 4]) {
      s.box(i - 0.5, 0.5, 0, 3, b - 1, 1.5, W.oakDark, { side: tone(W.oakDark, 0.75) }); // feet
      s.box(i, 2.5, 1.5, 2, b - 5, 9.5, wood, { side: W.oakDark }); // slab legs
    }
    s.box(4, b / 2 - 0.5, 5, a - 8, 1, 1.5, W.oakDark, { edge: false }); // stretcher
    s.box(0, 0, 11, a, b, 2.5, wood, { side: W.oakDark });
    for (const j of [b / 3, (2 * b) / 3]) s.line([0, j, 13.5], [a, j, 13.5], tone(wood, 0.88)); // planks
    s.cyl(a / 2 + 2, b / 2, 13.5, 1.5, 4, W.linen, { side: tone(W.linen, 0.8) }); // a jug
    s.ball(5, b / 2, 14.5, 3, 1.5, 0xc9963e); // a loaf of bread
    s.ball(5, b / 2, 15, 2, 0.6, tone(0xc9963e, 1.25));
    candle(s, a - 5, b / 2, 13.5, 4);
  }),
  piece('live-edge-table', (s, a, b) => {
    const wood = W.walnut;
    s.box(1, 1, 0, 1.5, b - 2, 7, W.walnutDark, { side: tone(W.walnutDark, 0.75) });
    s.box(a - 2.5, 1, 0, 1.5, b - 2, 7, W.walnutDark, { side: tone(W.walnutDark, 0.75) });
    // the slab: columns with a wavy front edge, pale sapwood along it
    for (let i = 0; i < a; i += 1) {
      const d = b - 1.6 + Math.sin(i * 0.85) * 0.9 + Math.sin(i * 0.3) * 0.5;
      s.box(i, 0.5, 7, 1, d, 2.5, wood, { side: W.walnutDark, edge: false });
      s.flat(i, 0.5 + d - 0.6, 9.5, 1, 0.6, 0xc9a070);
    }
    s.line([1, 3, 9.5], [a - 1, 3.5, 9.5], tone(wood, 1.25)); // grain
    s.line([2, 5, 9.5], [a - 3, 5.5, 9.5], tone(wood, 1.15));
    s.box(a - 6, 2, 9.5, 3, 2, 1, P.sage, { side: P.sageShade }); // a book
    s.cyl(4, 4, 9.5, 1.2, 2.5, P.cream, { side: P.creamShade }); // a mug
  }),
  piece('barrel-table', (s, a, b) => {
    const m = a / 2;
    const seg = (z, h, col, r = 3.5) => s.cyl(m, b / 2, z, r, h, col, { side: tone(col, 0.72) });
    seg(0, 2, W.oak, 3.2);
    seg(2, 1, P.iron, 3.5);
    seg(3, 5, W.oak, 3.7);
    seg(8, 1, P.iron, 3.6);
    seg(9, 2, W.oak, 3.3);
    const [x, y] = s.p(m, b / 2, 0);
    for (const dx of [-4, 0, 3]) s.c.line(x + dx, y - 1, x + dx, y - 10, W.oakDark); // staves
    s.cyl(m, b / 2, 11, 4.2, 1.5, W.pine, { side: W.pineDark }); // round top
    candle(s, m - 1, b / 2 - 1, 12.5, 3);
    s.cyl(m + 1.5, b / 2 + 1, 12.5, 1, 2, P.brick, { side: P.brickDark }); // a cup of cider
  }),
  piece('spool-table', (s, a, b) => {
    const m = a / 2;
    s.cyl(m, b / 2, 0, 5, 1.5, W.pine, { side: W.pineDark });
    s.cyl(m, b / 2, 1.5, 2.8, 7, W.rope, { side: tone(W.rope, 0.75) });
    const [x, y] = s.p(m, b / 2, 1.5);
    for (let z = 2; z < 8; z += 2) s.c.line(x - 5, y - z, x + 5, y - z + 1, tone(W.rope, 0.85)); // wound rope
    s.cyl(m, b / 2, 8.5, 5.5, 1.5, W.pine, { side: W.pineDark });
    const [tx, ty] = s.p(m, b / 2, 10);
    for (const [dx, dy] of [[-6, 0], [6, 0], [0, -3], [0, 3]]) s.c.set(tx + dx, ty + dy, P.iron); // bolts
    s.cyl(m, b / 2, 10, 1.5, 3, P.cream, { side: P.creamShade }); // a little pot
    s.c.ellipse(tx, ty - 4, 2.5, 2, P.leaf);
    s.c.set(tx - 1, ty - 5, P.leafLight);
  }),
];

// ---------- shelves ----------

const SHELVES = [
  piece('blanket-ladder', (s, a, b) => {
    const rail = W.oak;
    const at = (z) => b - 0.5 - ((b - 1) * z) / 32; // leaning back as it goes up
    // quilts draped over the rungs (behind the front rail)
    s.line([0.5, at(0), 0], [0.5, at(32), 32], W.oakDark, 2);
    for (const [z, col] of [[26, W.rust], [18, P.sage], [10, P.cream]]) {
      const j = at(z);
      s.front(1, j + 0.5, z - 7, a - 2, 7, col);
      s.front(1, j + 0.5, z - 7, a - 2, 1, tone(col, 0.75));
      s.flat(1, j - 0.5, z, a - 2, 1, tone(col, 1.15));
      if (col === P.cream) for (let i = 2; i < a - 1; i += 2) s.dot(i, j + 0.5, z - 3, P.pink);
      if (col === P.sage) for (let i = 1.5; i < a - 1; i += 1.5) s.dot(i, j + 0.5, z - 7, P.cream); // fringe
    }
    for (let z = 4; z < 32; z += 8) s.line([0.5, at(z), z], [a - 0.5, at(z), z], rail);
    s.line([a - 0.5, at(0), 0], [a - 0.5, at(32), 32], rail, 2);
  }),
  piece('pine-hutch', (s, a, b) => {
    const paint = W.sagePaint;
    const side = tone(paint, 0.72);
    // upper rack of plates (behind the counter)
    s.box(0, 0, 15.5, a, 3, 20, paint, { side });
    s.front(1, 3, 16.5, a - 2, 18, tone(paint, 0.55));
    for (const z of [22.5, 29]) s.front(1, 3, z, a - 2, 1, paint);
    const plates = [P.cream, 0xa8c4e6, P.cream, P.pink];
    for (const [z, k0] of [[17, 0], [23.5, 1], [30, 2]]) {
      for (let k = 0; k < 4; k++) {
        const [x, y] = s.p(2.5 + k * 3.3, 3, z + 3);
        const col = plates[(k + k0) % 4];
        s.c.ellipse(x, y, 2.5, 3, col);
        s.c.set(x, y, tone(col, 0.7));
      }
    }
    s.box(-0.5, -0.5, 35.5, a + 1, 4, 1.5, W.oak); // crown
    // the cupboard base
    s.box(0, 0, 0, a, b, 14, paint, { side });
    s.front(1, b, 1, a / 2 - 1.5, 11, tone(paint, 0.9)).front(a / 2 + 0.5, b, 1, a / 2 - 1.5, 11, tone(paint, 0.9));
    s.dot(a / 2 - 1.5, b, 7, P.gold).dot(a / 2 + 1.5, b, 7, P.gold);
    s.box(-0.5, -0.5, 14, a + 1, b + 1, 1.5, W.oak, { side: W.oakDark }); // countertop
    s.cyl(3, b / 2, 15.5, 1.3, 3, P.cream, { side: P.creamShade }); // a jug of flowers
    const [x, y] = s.p(3, b / 2, 19);
    s.c.set(x, y - 1, P.pink);
    s.c.set(x + 1, y - 2, P.white);
  }),
  piece('firewood-rack', (s, a, b) => {
    const frame = W.bark;
    s.box(0, 0, 0, a, b, 1, frame, { edge: false }); // base
    s.box(0, 0, 0, 1, b, 17, frame);
    s.box(1, 0.5, 1, a - 2, b - 1, 13, W.barkLight, { side: frame }); // the stacked logs
    // log ends on the front, row by row
    for (let z = 3, row = 0; z < 14; z += 3.2, row++) {
      for (let i = 2 + (row % 2); i < a - 1.5; i += 2.4) {
        const [x, y] = s.p(i, b - 0.5, z);
        logEnd(s.c, x, y, 2, 1.6, (i + row) % 3 < 1 ? 0xcaa874 : P.woodLight);
      }
    }
    s.box(a - 1, 0, 0, 1, b, 17, frame);
    s.line([0, b, 17], [a, b, 17], tone(frame, 1.3)); // top rail
    s.dot(3, b - 0.5, 14.5, W.moss);
  }),
  piece('cubby-cabinet', (s, a, b) => {
    const wood = W.oak;
    legs(s, a, b, 0, 2, W.oakDark, 0.5);
    s.box(0, 0, 2, a, b, 22, wood, { side: W.oakDark });
    s.front(1, b, 3, a - 2, 20, W.oakDark);
    const cols = 3;
    const rows = 4;
    const cw = (a - 2) / cols;
    const rh = 20 / rows;
    const stuff = [P.cream, P.sage, P.pink, 0xa8c4e6, P.lilac, W.rope, P.brick];
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        const i = 1 + k * cw;
        const z = 3 + r * rh;
        const col = stuff[(r * cols + k) % stuff.length];
        if ((r + k) % 4 !== 3) s.front(i + 0.8, b, z + 0.5, cw - 1.8, rh - 2 - ((r + k) % 2), col); // letters, packets, jars
      }
      s.front(1, b, 3 + r * rh, a - 2, 0.6, wood); // shelves
    }
    for (let k = 1; k < cols; k++) s.front(1 + k * cw - 0.3, b, 3, 0.6, 20, wood); // dividers
    s.box(-0.5, -0.5, 24, a + 1, b + 1, 1, tone(wood, 1.1), { side: W.oakDark });
  }),
  piece('hall-tree', (s, a, b) => {
    const m = a / 2;
    const wood = W.walnut;
    // crossed feet
    s.line([0.5, m, 0], [a - 0.5, m, 0], wood, 2).line([m, 0.5, 0], [m, b - 0.5, 0], W.walnutDark, 2);
    s.post(m, b / 2, 0, 34, wood, 2);
    // branchy hooks at the top
    for (const [di, dj, z] of [[-3, 0, 32], [3, 0, 30], [0, 3, 31], [0, -3, 33]]) s.line([m, b / 2, z - 3], [m + di, b / 2 + dj, z], wood);
    s.ball(m, b / 2, 37, 1.2, 1.2, tone(wood, 1.2)); // knob
    // a hat on one hook, a scarf and a bag on others
    s.ball(m - 3, b / 2, 31.5, 3.5, 1.2, P.brick);
    s.ball(m - 3, b / 2, 33, 2, 1.5, P.brick);
    const [sx, sy] = s.p(m + 3, b / 2, 30);
    s.c.rect(sx - 1, sy, 2, 12, P.sage);
    s.c.rect(sx + 1, sy, 2, 9, P.sageShade);
    for (const dx of [-1, 0, 1, 2]) s.c.set(sx + dx, sy + 12 + (dx % 2), P.cream);
    const [bx, by] = s.p(m, b / 2 + 3, 30);
    s.c.line(bx, by, bx - 2, by + 5, P.woodDark);
    s.c.line(bx, by, bx + 2, by + 5, P.woodDark);
    s.c.rect(bx - 3, by + 5, 6, 5, W.rope);
  }),
];

// ---------- carvings and little things ----------

const CARVINGS = [
  piece('carved-bear', (s, a, b) => {
    const wood = W.twig;
    const dk = W.twigDark;
    const lt = tone(wood, 1.2);
    s.cyl(a / 2, b / 2, 0, 3.5, 2, W.bark, { side: tone(W.bark, 0.75), top: W.barkLight }); // stump base
    const [x, y] = s.p(a / 2, b / 2, 2);
    const { c } = s;
    c.ellipse(x, y - 6, 6, 6, wood); // body
    c.ellipse(x + 2, y - 6, 4, 5, dk, (px) => px > x + 2);
    c.ellipse(x - 3, y - 2, 2.5, 1.8, lt); // feet
    c.ellipse(x + 3, y - 2, 2.5, 1.8, wood);
    c.ellipse(x, y - 14, 4.5, 4, wood); // head
    c.ellipse(x + 2, y - 14, 2.5, 3, dk, (px) => px > x + 2);
    c.circle(x - 3, y - 18, 1.5, wood); // ears
    c.circle(x + 3, y - 18, 1.5, dk);
    c.ellipse(x - 1, y - 12, 2, 1.3, lt); // snout
    c.set(x - 1, y - 13, P.line);
    c.set(x - 2, y - 15, P.line); // eyes
    c.set(x + 1, y - 15, P.line);
    for (const [dx, dy] of [[-4, -8], [-2, -5], [3, -9], [1, -4], [-3, -11]]) c.set(x + dx, y + dy, dk); // chisel marks
    c.ellipse(x - 1, y - 7, 2.5, 2, lt); // tummy
  }),
  piece('owl-totem', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 2, 12, W.bark, { side: tone(W.bark, 0.75), top: W.barkLight });
    const [x, y] = s.p(a / 2, b / 2, 12);
    const { c } = s;
    const wood = W.oak;
    c.ellipse(x, y - 5, 4.5, 6, wood); // body
    c.ellipse(x + 2, y - 4, 2.5, 4.5, W.oakDark, (px) => px > x + 1); // wing
    c.ellipse(x - 2, y - 4, 2, 4, tone(wood, 0.85), (px) => px < x - 1);
    c.poly([[x - 4, y - 10], [x - 3, y - 14], [x - 1, y - 10]], wood); // ear tufts
    c.poly([[x + 4, y - 10], [x + 3, y - 14], [x + 1, y - 10]], W.oakDark);
    for (const dx of [-2, 2]) {
      c.circle(x + dx, y - 8, 1.6, W.linen); // eyes
      c.set(x + dx, y - 8, P.line);
    }
    c.set(x, y - 6, 0xd9a646); // beak
    for (const [dx, dy] of [[-1, -3], [1, -3], [0, -1], [-1, 0], [1, 0]]) c.set(x + dx, y + dy, tone(wood, 1.25)); // feathers
    c.ellipse(x, y + 1, 3, 1, P.woodDark); // feet gripping the post
  }),
  piece('rocking-horse', (s, a, b) => {
    const rocker = (j, col) => {
      let prev = null;
      for (let i = 0; i <= a; i += 1) {
        const z = 2.5 * ((i - a / 2) / (a / 2)) ** 2;
        const pt = [i, j, z];
        if (prev) s.line(prev, pt, col, 2);
        prev = pt;
      }
    };
    const body = W.dapple;
    const shade = tone(body, 0.82);
    const mane = W.rust;
    rocker(0.8, W.oakDark);
    const { c } = s;
    const [x, y] = s.p(a / 2, b / 2, 11);
    // back legs, down to the back rocker
    c.line(x - 5, y + 1, ...s.p(3.5, 1, 1.5), W.oakDark, 2);
    c.line(x + 3, y + 1, ...s.p(a - 3.5, 1, 1.5), W.oakDark, 2);
    c.line(x - 8, y - 1, x - 11, y + 5, mane, 2); // yarn tail
    c.ellipse(x, y, 8, 4, body); // body
    c.ellipse(x + 1, y + 2, 7, 2, shade, (px, py) => py > y + 1);
    for (const [dx, dy] of [[-4, -1], [-1, 1], [2, -2], [4, 1], [-6, 1]]) c.set(x + dx, y + dy, 0x9a9aa4); // dapples
    // neck and head
    c.poly([[x + 4, y - 2], [x + 8, y - 3], [x + 11, y - 8], [x + 7, y - 9]], body);
    c.ellipse(x + 10, y - 9, 3.5, 2.5, body);
    c.ellipse(x + 13, y - 7, 2, 1.6, shade); // muzzle
    c.set(x + 10, y - 10, P.line); // eye
    c.poly([[x + 8, y - 11], [x + 9, y - 14], [x + 10, y - 11]], body); // ear
    c.line(x + 7, y - 11, x + 3, y - 3, mane, 2); // mane
    c.line(x + 12, y - 7, x + 1, y - 4, W.red); // rein
    // saddle
    c.ellipse(x - 1, y - 3, 3.5, 1.5, W.red);
    c.rect(x - 1, y - 2, 1, 4, W.redDark);
    rocker(b - 0.8, W.oak);
    // front legs, down to the front rocker
    c.line(x - 4, y + 2, ...s.p(3.5, b - 1, 1.5), W.oak, 2);
    c.line(x + 4, y + 2, ...s.p(a - 3.5, b - 1, 1.5), W.oak, 2);
  }),
  piece('log-lamp', (s, a, b) => {
    const m = a / 2;
    s.cyl(m, b / 2, 0, 2.2, 12, W.birch, { side: tone(W.birch, 0.82) });
    const [x, y] = s.p(m, b / 2, 0);
    for (const [dx, dy, w] of [[-3, -3, 2], [1, -6, 3], [-2, -9, 2], [2, -11, 1], [-4, -7, 1]]) s.c.rect(x + dx, y + dy, w, 1, W.birchMark);
    s.line([m, b / 2, 12], [m, b / 2, 14], P.iron);
    s.glow(m, b / 2, 14, 13, P.glowWarm, 45);
    s.cyl(m, b / 2, 13, 3.8, 7, W.linen, { side: tone(W.linen, 0.85), top: tone(W.linen, 0.7), r2: 2.6 });
    const [lx, ly] = s.p(m, b / 2, 13);
    s.c.ellipse(lx, ly, 7, 1.5, P.glow, (px, py) => py >= ly); // light under the shade
  }),
  piece('toy-wagon', (s, a, b) => {
    const wheel = (i, j) => {
      const [x, y] = s.p(i, j, 2);
      s.c.ellipse(x, y, 2.5, 3, P.iron);
      s.c.ellipse(x, y, 1.5, 2, W.oak);
      s.c.set(x, y, P.iron);
    };
    wheel(2.5, 0.5);
    wheel(a - 2.5, 0.5);
    s.box(1, 1, 3, a - 2, b - 2, 4.5, W.red, { side: W.redDark });
    s.flat(1.5, 1.5, 7.5, a - 3, b - 3, tone(W.red, 0.6)); // inside
    for (const [i, j] of [[3, 2.5], [5.5, 3.5], [8, 2.5], [4, 4.5], [7, 4.5]]) {
      const [x, y] = s.p(i, j, 8.5);
      pinecone(s.c, x, y);
    }
    s.front(1.5, b - 1, 4, a - 3, 0.8, P.cream); // a painted stripe
    wheel(2.5, b - 0.5);
    wheel(a - 2.5, b - 0.5);
    s.line([a - 1, b / 2, 5], [a + 3, b / 2 + 2, 10], P.iron); // the handle
    s.line([a + 2, b / 2 + 2, 10], [a + 4, b / 2 + 2, 10], W.oak, 2);
  }),
];

export const WOOD_ISO = Object.fromEntries([...SEATS, ...TABLES, ...SHELVES, ...CARVINGS]);

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

const WOOD_ICONS = {
  // seats
  'log-bench': ics((c) => {
    c.rect(3, 11, 3, 4, W.bark).rect(11, 11, 3, 4, W.bark);
    c.rect(0, 7, 16, 2, P.woodLight);
    c.rect(0, 9, 16, 2, W.bark);
    c.set(4, 10, W.barkLight);
    c.set(10, 10, W.barkLight);
    c.ellipse(15, 8, 1, 1.5, tone(P.woodLight, 1.15));
    c.set(1, 9, W.moss);
  }, 7),
  'twig-chair': ics((c) => {
    c.line(2, 15, 2, 3, W.twigDark).line(13, 15, 13, 3, W.twig);
    c.line(2, 3, 5, 1, W.twig).line(5, 1, 10, 1, W.twig).line(10, 1, 13, 3, W.twig);
    c.line(3, 4, 12, 8, tone(W.twig, 1.1)).line(12, 4, 3, 8, tone(W.twig, 1.1));
    c.rect(2, 9, 12, 2, P.sage);
    c.rect(2, 11, 12, 1, W.twigDark);
    c.line(1, 6, 1, 10, W.twig).line(14, 6, 14, 10, W.twigDark); // arm loops
  }),
  'settle-bench': ics((c) => {
    c.rect(1, 1, 14, 9, W.oak);
    c.rect(0, 0, 16, 1, W.oakDark);
    for (const x of [2, 7, 11]) c.rect(x, 3, 3, 5, tone(W.oak, 0.85));
    c.rect(1, 9, 14, 2, W.rust);
    c.rect(1, 11, 14, 4, W.oak);
    c.rect(2, 12, 12, 2, tone(W.oak, 0.85));
    c.rect(0, 6, 1, 9, W.oakDark).rect(15, 6, 1, 9, W.oakDark);
  }, 7),
  'milking-stool': ics((c) => {
    c.line(5, 9, 2, 15, W.oakDark).line(11, 9, 14, 15, W.oakDark).line(8, 9, 8, 15, W.oak);
    c.ellipse(8, 8, 6, 2, W.oak);
    c.ellipse(8, 7, 4, 1, tone(W.oak, 1.25));
  }),
  'carved-throne': ics((c) => {
    c.ellipse(8, 3, 6, 3, W.walnut);
    c.rect(2, 3, 12, 8, W.walnut);
    c.line(8, 9, 8, 2, tone(W.walnut, 1.35));
    for (const [x, y] of [[6, 4], [10, 5], [6, 7], [10, 8]]) c.set(x, y, tone(W.walnut, 1.25));
    c.rect(2, 9, 12, 2, W.wine);
    c.rect(1, 8, 2, 5, W.walnutDark).rect(13, 8, 2, 5, W.walnutDark);
    c.rect(1, 7, 2, 1, P.woodLight).rect(13, 7, 2, 1, P.woodLight);
    c.rect(2, 11, 12, 4, W.walnut);
    c.rect(3, 12, 10, 2, W.walnutDark);
  }),
  // tables
  workbench: ics((c) => {
    c.rect(0, 1, 16, 6, W.pineDark);
    c.line(2, 2, 2, 5, P.iron).rect(1, 2, 3, 1, P.iron);
    c.rect(6, 3, 4, 2, W.steel);
    c.line(12, 2, 13, 5, W.red);
    c.rect(0, 7, 16, 2, W.pine);
    c.rect(1, 9, 2, 6, W.pineDark).rect(13, 9, 2, 6, W.pineDark);
    c.rect(3, 12, 10, 1, P.wood);
    c.rect(1, 9, 3, 3, P.iron);
  }, 7),
  'trestle-table': ics((c) => {
    c.rect(0, 6, 16, 2, W.oak);
    c.rect(0, 8, 16, 1, W.oakDark);
    c.line(2, 9, 5, 15, W.oakDark).line(5, 9, 2, 15, W.oak);
    c.line(11, 9, 14, 15, W.oakDark).line(14, 9, 11, 15, W.oak);
    c.ellipse(4, 5, 2.5, 1.2, 0xc9963e);
    c.rect(10, 2, 2, 4, W.linen);
    c.rect(13, 3, 1, 3, P.cream);
    c.set(13, 2, P.glowWarm);
  }, 7),
  'live-edge-table': ics((c) => {
    c.poly([[0, 7], [4, 6], [8, 7], [12, 6], [16, 7], [16, 9], [0, 9]], W.walnut);
    c.line(0, 7, 3, 6, 0xc9a070).line(4, 6, 7, 7, 0xc9a070).line(9, 7, 12, 6, 0xc9a070);
    c.line(2, 8, 13, 8, tone(W.walnut, 1.2));
    c.rect(2, 9, 2, 6, W.walnutDark).rect(12, 9, 2, 6, W.walnutDark);
    c.rect(10, 4, 3, 2, P.sage);
    c.rect(3, 4, 2, 2, P.cream);
  }, 7),
  'barrel-table': ics((c) => {
    c.ellipse(8, 4, 6, 1.5, W.pine);
    c.rect(3, 5, 10, 10, W.oak);
    c.rect(2, 7, 12, 1, P.iron).rect(2, 12, 12, 1, P.iron);
    c.line(6, 5, 6, 14, W.oakDark).line(10, 5, 10, 14, W.oakDark);
    c.rect(6, 1, 2, 3, P.cream);
    c.set(6, 0, P.glowWarm);
    c.rect(9, 2, 2, 2, P.brick);
  }, 5),
  'spool-table': ics((c) => {
    c.ellipse(8, 4, 7, 2, W.pine);
    c.rect(5, 6, 6, 7, W.rope);
    for (const y of [7, 9, 11]) c.rect(5, y, 6, 1, tone(W.rope, 0.82));
    c.rect(1, 13, 14, 2, W.pine);
    c.rect(1, 14, 14, 1, W.pineDark);
    c.rect(7, 1, 2, 2, P.cream);
    c.set(7, 0, P.leaf);
    c.set(8, 0, P.leafLight);
  }, 7),
  // shelves
  'blanket-ladder': ics((c) => {
    c.rect(3, 0, 1, 15, W.oak).rect(12, 0, 1, 15, W.oak); // the two rails
    for (const y of [2, 6, 10, 14]) c.rect(3, y, 10, 1, W.oakDark); // rungs
    c.rect(2, 2, 12, 3, W.rust); // quilts draped over the rungs
    c.rect(2, 5, 12, 1, tone(W.rust, 0.7));
    c.rect(2, 6, 12, 3, P.sage);
    c.rect(2, 9, 12, 1, P.sageShade);
    c.rect(2, 10, 12, 3, P.cream);
    c.set(5, 11, P.pink);
    c.set(8, 11, P.pink);
    c.set(11, 11, P.pink);
  }, 6),
  'pine-hutch': ic((c) => {
    c.rect(2, 0, 12, 7, W.sagePaint);
    c.rect(3, 1, 10, 5, tone(W.sagePaint, 0.55));
    for (const [x, col] of [[4, P.cream], [7, 0xa8c4e6], [10, P.pink]]) {
      c.circle(x + 1, 3, 1.5, col);
    }
    c.rect(1, 7, 14, 1, W.oak);
    c.rect(2, 8, 12, 7, W.sagePaint);
    c.rect(3, 9, 4, 5, tone(W.sagePaint, 0.88)).rect(9, 9, 4, 5, tone(W.sagePaint, 0.88));
    c.set(7, 11, P.gold);
    c.set(8, 11, P.gold);
  }),
  'firewood-rack': ics((c) => {
    c.rect(1, 2, 1, 13, W.bark).rect(14, 2, 1, 13, W.bark);
    c.rect(1, 2, 14, 1, W.bark);
    c.rect(2, 4, 12, 11, W.barkLight);
    for (let y = 5, r = 0; y < 15; y += 3, r++) for (let x = 3 + (r % 2); x < 13; x += 3) {
      c.circle(x, y, 1.2, (x + r) % 2 ? P.woodLight : 0xcaa874);
      c.set(x, y, tone(P.woodLight, 0.8));
    }
  }, 7),
  'cubby-cabinet': ics((c) => {
    c.rect(2, 1, 12, 13, W.oak);
    c.rect(3, 2, 10, 11, W.oakDark);
    for (const y of [5, 8, 11]) c.rect(3, y, 10, 1, W.oak);
    for (const x of [6, 9]) c.rect(x, 2, 1, 11, W.oak);
    const stuff = [P.cream, P.sage, P.pink, 0xa8c4e6, P.lilac, W.rope, P.brick];
    let k = 0;
    for (const y of [3, 6, 9, 12]) for (const x of [4, 7, 10]) if ((k++ % 4) !== 3) c.rect(x, y, 2, 2, stuff[k % stuff.length]);
    c.rect(2, 14, 1, 1, W.oakDark).rect(13, 14, 1, 1, W.oakDark);
  }),
  'hall-tree': ics((c) => {
    c.rect(7, 2, 2, 13, W.walnut);
    c.line(4, 15, 11, 15, W.walnutDark);
    c.line(7, 4, 4, 1, W.walnut).line(8, 3, 12, 1, W.walnut).line(8, 6, 12, 4, W.walnut);
    c.ellipse(4, 2, 3, 1.5, P.brick);
    c.rect(11, 4, 2, 6, P.sage);
    c.rect(12, 10, 1, 1, P.cream);
    c.rect(3, 7, 3, 4, W.rope);
    c.line(4, 6, 6, 4, P.woodDark);
  }, 4),
  // carvings
  'carved-bear': ics((c) => {
    c.rect(3, 13, 10, 2, W.bark);
    c.ellipse(8, 10, 5, 4, W.twig);
    c.ellipse(8, 5, 4, 3.5, W.twig);
    c.circle(5, 2, 1.5, W.twig).circle(11, 2, 1.5, W.twigDark);
    c.ellipse(8, 6, 1.5, 1, tone(W.twig, 1.2));
    c.set(8, 6, P.line);
    c.set(6, 4, P.line);
    c.set(10, 4, P.line);
    c.ellipse(8, 10, 2, 2, tone(W.twig, 1.2));
  }),
  'owl-totem': ics((c) => {
    c.rect(6, 10, 4, 5, W.bark);
    c.ellipse(8, 6, 4, 5, W.oak);
    c.poly([[4, 3], [5, 0], [6, 2]], W.oak).poly([[12, 3], [11, 0], [10, 2]], W.oakDark);
    c.circle(6, 4, 1.5, W.linen).circle(10, 4, 1.5, W.linen);
    c.set(6, 4, P.line);
    c.set(10, 4, P.line);
    c.set(8, 6, 0xd9a646);
    c.line(11, 5, 11, 9, W.oakDark);
  }, 4),
  'rocking-horse': ics((c) => {
    c.line(0, 12, 3, 14, W.oak).line(3, 14, 12, 14, W.oak).line(12, 14, 15, 12, W.oak);
    c.line(4, 9, 3, 13, W.oakDark).line(10, 9, 11, 13, W.oakDark);
    c.ellipse(7, 8, 5, 2.5, W.dapple);
    c.set(5, 8, 0x8a8a90);
    c.set(8, 9, 0x8a8a90);
    c.rect(6, 6, 3, 2, W.red);
    c.line(11, 7, 13, 3, W.dapple).ellipse(13, 3, 2, 1.5, W.dapple);
    c.set(14, 3, P.line);
    c.line(11, 2, 10, 6, W.rust);
    c.line(2, 7, 1, 10, W.rust);
  }, 7),
  'log-lamp': ics((c) => {
    c.rect(6, 8, 4, 7, W.birch);
    c.rect(6, 10, 2, 1, W.birchMark).rect(8, 12, 2, 1, W.birchMark).rect(7, 14, 1, 1, W.birchMark);
    c.poly([[5, 1], [11, 1], [13, 7], [3, 7]], W.linen);
    c.rect(3, 7, 10, 1, P.glow);
  }, 4),
  'toy-wagon': ics((c) => {
    c.rect(1, 7, 12, 5, W.red);
    c.rect(1, 10, 12, 1, P.cream);
    for (const x of [3, 6, 9]) pinecone(c, x, 6);
    c.circle(3, 13, 2, P.iron).circle(11, 13, 2, P.iron);
    c.set(3, 13, W.oak);
    c.set(11, 13, W.oak);
    c.line(13, 9, 15, 4, P.iron);
  }, 7),
  // on the wall
  'cuckoo-clock': ic((c) => {
    c.poly([[8, 0], [15, 5], [1, 5]], W.walnutDark); // roof
    c.rect(2, 5, 12, 8, W.walnut);
    c.rect(6, 5, 4, 2, P.woodDark); // the little door
    c.set(7, 5, P.gold); // the bird
    c.circle(8, 9, 2.5, P.cream);
    c.line(8, 9, 8, 7, P.line).line(8, 9, 9, 9, P.line);
    for (const [x, y] of [[3, 6], [12, 6], [3, 11], [12, 11]]) c.set(x, y, P.leaf);
    c.line(6, 13, 6, 15, 0xd9a646).line(10, 13, 10, 14, 0xd9a646); // pinecone weights
    c.rect(5, 15, 2, 1, W.oakDark).rect(9, 14, 2, 2, W.oakDark);
  }),
  'welcome-sign': ic((c) => {
    c.line(4, 0, 2, 4, W.rope).line(11, 0, 13, 4, W.rope);
    c.rect(0, 4, 16, 8, W.oak);
    c.rect(0, 7, 16, 1, W.oakDark);
    for (let x = 3; x < 13; x += 2) c.set(x, 6, P.cream);
    for (let x = 4; x < 12; x += 2) c.set(x, 9, P.cream);
    for (const [x, y, col] of [[1, 5, P.pink], [14, 5, P.lilac], [1, 10, P.lilac], [14, 10, P.pink]]) {
      c.set(x, y, col);
      c.set(x, y + 1, P.leaf);
    }
  }),
  birdhouse: ic((c) => {
    c.poly([[8, 0], [15, 6], [1, 6]], W.oakDark);
    c.rect(3, 6, 10, 8, W.sagePaint);
    c.circle(8, 9, 1.8, P.line);
    c.rect(8, 12, 1, 1, W.oak);
    c.rect(6, 13, 5, 1, W.oak); // perch
    c.rect(7, 14, 2, 2, W.oak);
    c.set(4, 13, W.moss);
  }),
  'spoon-rack': ic((c) => {
    c.rect(0, 3, 16, 2, W.oak);
    c.rect(0, 5, 16, 1, W.oakDark);
    for (const [x, len, col] of [[2, 9, P.woodLight], [6, 10, W.oak], [10, 8, 0xcaa874], [13, 9, P.woodLight]]) {
      c.rect(x, 5, 1, len - 3, col);
      c.ellipse(x, 5 + len - 2, 1.5, 2, col);
    }
  }),
  'tree-slice': ic((c) => {
    c.circle(8, 8, 7, W.bark);
    c.circle(8, 8, 6, 0xcaa874);
    c.circle(8, 8, 4.5, P.woodLight, (x, y) => (x - 8) ** 2 + (y - 8) ** 2 > 12);
    c.circle(8, 8, 2.5, P.woodLight, (x, y) => (x - 8) ** 2 + (y - 8) ** 2 > 3);
    c.set(8, 8, W.oakDark);
    c.line(9, 9, 13, 12, tone(0xcaa874, 0.8)); // a little crack
  }),
  'peg-rail': ic((c) => {
    c.rect(0, 2, 16, 2, W.oak);
    for (const x of [2, 7, 12]) c.rect(x, 4, 2, 2, W.oakDark);
    c.rect(1, 6, 4, 4, P.cream); // a mug
    c.rect(5, 7, 1, 2, P.cream);
    c.line(8, 6, 6, 9, W.rope).line(8, 6, 10, 9, W.rope);
    c.rect(5, 9, 6, 5, W.rope); // a basket
    c.rect(5, 11, 6, 1, tone(W.rope, 0.8));
    c.rect(12, 6, 3, 7, P.sage); // a tea towel
    c.rect(12, 9, 3, 1, P.cream);
  }),
};

export const WOOD_ITEMS = Object.fromEntries(Object.entries(WOOD_ICONS).map(([id, draw]) => [`item-${id}`, draw]));

// Make sure every woodshop item has the pictures it needs.
for (const item of WOODSHOP_STOCK) {
  if (!WOOD_ICONS[item.id]) throw new Error(`woodshop.js: no shop picture for ${item.id}`);
  if (item.cat === 'wall') continue;
  if (!FOOTPRINT[item.id]) throw new Error(`woodshop.js: ${item.id} has no FOOTPRINT (src/data/furniture.js)`);
  if (!WOOD_ISO[`iso-${item.id}`]) throw new Error(`woodshop.js: no 3D picture for ${item.id}`);
}
