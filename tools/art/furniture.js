// Furniture and floor plants for your isometric home: iso-<id>.png.
//
// The shop pictures (item-<id>.png) are flat, seen from the front. In your
// home the room is seen from above at an angle, so every floor thing gets a
// second picture drawn the same way: real boxes and cylinders in 3D, with a
// lit top, a mid-tone front and a darker side.
//
// How the drawing works: `iso()` gives a workspace where p(i, j, z) turns a
// spot in the room into a pixel. i runs toward the bottom-right of the
// screen, j toward the bottom-left, z straight up. One unit of i or j is
// 2 pixels sideways and 1 pixel down; one unit of z is 1 pixel up.
//
// Each piece covers FOOTPRINT[id] = [across (i), deep (j)] units of floor
// (src/data/furniture.js; the game uses the same numbers to place it). The
// front of every piece faces +j, toward the bottom-left. Draw back to front:
// later shapes cover earlier ones.
//
// The finished picture is cut so the footprint's middle is the middle of the
// picture and its front corner is the bottom row. The game stands it there.
import { Canvas } from './canvas.js';
import { P } from './palette.js';
import { C, SHADOW } from './items.js';
import { FOOTPRINT, isoTexture } from '../../src/data/furniture.js';

const WORK = 220; // the scratch canvas is this big
const O = { x: 110, y: 160 }; // where p(0, 0, 0) lands on it

// ---------- colors ----------

// Lighter (f > 1) or darker (f < 1) version of a color.
export function tone(c, f) {
  const ch = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)));
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

const OAK = 0x9a6f48;
const PINK = 0xf2b3c4;
const PINK_DEEP = 0xd9849b;
const YELLOW = 0xf2c94c;
const ORANGE = 0xf0a040;
const RED = 0xb8404a;
const TEAL_GLASS = 0x6fa8b0;

// ---------- the 3D workspace ----------

function iso() {
  const c = new Canvas(WORK, WORK);
  const p = (i, j, z = 0) => [O.x + 2 * i - 2 * j, O.y + i + j - z];

  const quad = (pts, color) => c.poly(pts, color);

  const s = {
    c,
    p,
    // A box from (i, j, z) that is a across, b deep and h tall. `color` is
    // the front; the top is lighter and the right side darker.
    box(i, j, z, a, b, h, color, { top = tone(color, 1.18), side = tone(color, 0.75), edge = true } = {}) {
      if (h > 0) {
        quad([p(i + a, j, z), p(i + a, j + b, z), p(i + a, j + b, z + h), p(i + a, j, z + h)], side); // right side
        quad([p(i, j + b, z), p(i + a, j + b, z), p(i + a, j + b, z + h), p(i, j + b, z + h)], color); // front
      }
      quad([p(i, j, z + h), p(i + a, j, z + h), p(i + a, j + b, z + h), p(i, j + b, z + h)], top);
      if (edge && h > 0) {
        // a light line along the top's front edges makes the shape read clearly
        const hi = tone(top, 1.15);
        c.line(...p(i, j + b, z + h), ...p(i + a, j + b, z + h), hi);
        c.line(...p(i + a, j + b, z + h), ...p(i + a, j, z + h), tone(side, 1.2));
      }
      return s;
    },
    // A flat diamond lying at height z.
    flat(i, j, z, a, b, color) {
      quad([p(i, j, z), p(i + a, j, z), p(i + a, j + b, z), p(i, j + b, z)], color);
      return s;
    },
    // A rectangle drawn on the front face plane (j fixed), e.g. a drawer.
    front(i, j, z, a, h, color) {
      quad([p(i, j, z), p(i + a, j, z), p(i + a, j, z + h), p(i, j, z + h)], color);
      return s;
    },
    // A rectangle drawn on the right side plane (i fixed).
    side(i, j, z, b, h, color) {
      quad([p(i, j, z), p(i, j + b, z), p(i, j + b, z + h), p(i, j, z + h)], color);
      return s;
    },
    // A round cylinder standing at (ci, cj): radius r, from z up h. The left
    // half is `color`, the right half darker, the top lighter.
    cyl(ci, cj, z, r, h, color, { top = tone(color, 1.18), side = tone(color, 0.75), r2 = r } = {}) {
      const [bx, by] = p(ci, cj, z);
      const [tx, ty] = p(ci, cj, z + h);
      // body: a trapezoid between the bottom and top ellipses, plus the bottom curve
      c.ellipse(bx, by, r * 2, r, color);
      c.poly([[tx - r2 * 2, ty], [tx + r2 * 2, ty], [bx + r * 2, by], [bx - r * 2, by]], color);
      // darker right half
      for (let y = Math.floor(ty - r2); y <= Math.ceil(by + r); y++)
        for (let x = Math.round(bx + r * 0.6); x <= Math.round(Math.max(bx + r * 2, tx + r2 * 2)); x++) {
          if (c.get(x, y) === color) c.set(x, y, side);
        }
      c.ellipse(tx, ty, r2 * 2, r2, top);
      return s;
    },
    // A round blob (leaves, a lampshade, a cushion) centered on a 3D point.
    ball(i, j, z, rx, ry, color, keep) {
      const [x, y] = p(i, j, z);
      c.ellipse(x, y, rx, ry, color, keep);
      return s;
    },
    // A straight line between two 3D points.
    line(a, b, color, size = 1) {
      c.line(...p(...a), ...p(...b), color, size);
      return s;
    },
    // A vertical post, 1 or 2 pixels wide.
    post(i, j, z, h, color, w = 2) {
      const [x, y] = p(i, j, z);
      c.rect(Math.round(x - w / 2), y - h, w, h + 1, color);
      return s;
    },
    dot(i, j, z, color) {
      const [x, y] = p(i, j, z);
      c.set(x, y, color);
      return s;
    },
    glow(i, j, z, r, color = P.glow, alpha = 45) {
      const [x, y] = p(i, j, z);
      c.see(alpha, () => c.ellipse(x, y, r, r * 0.8, color, (px, py) => c.get(px, py) === -1));
      return s;
    },
  };
  return s;
}

// Outline, add the floor shadow, and cut the picture to its footprint (see top).
function finish(s, id) {
  const [a, b] = FOOTPRINT[id];
  const { c, p } = s;
  // glows were drawn see-through; keep them out of the outline
  const soft = [];
  for (let k = 0; k < c.px.length; k++) if (c.px[k] !== -1 && c.a[k] < 255) soft.push([k, c.px[k], c.a[k]]);
  for (const [k] of soft) {
    c.px[k] = -1;
    c.a[k] = 0;
  }
  c.outline(P.line);
  for (const [k, col, al] of soft) if (c.px[k] === -1) {
    c.px[k] = col;
    c.a[k] = al;
  }
  // a soft shadow on the floor, a little bigger than the footprint
  const pts = [p(-1, -1), p(a + 1, -1), p(a + 1, b + 1), p(-1, b + 1)];
  const shade = new Canvas(c.w, c.h).poly(pts, SHADOW);
  for (let k = 0; k < c.px.length; k++) if (shade.px[k] !== -1 && c.px[k] === -1) {
    c.px[k] = SHADOW;
    c.a[k] = 80;
  }

  // cut it out: the footprint's middle is the picture's middle, its front corner the bottom row
  const ax = O.x + a - b;
  const ay = O.y + a + b + 1; // (+1: the shadow reaches one unit past the front)
  let top = c.h;
  let left = c.w;
  let right = 0;
  for (let y = 0; y < c.h; y++)
    for (let x = 0; x < c.w; x++)
      if (c.px[y * c.w + x] !== -1) {
        top = Math.min(top, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
  const half = Math.max(ax - left, right + 1 - ax);
  const out = new Canvas(half * 2, ay - top + 1);
  out.draw(c, half - ax, -top);
  return out;
}

const piece = (id, draw) => [
  isoTexture(id),
  () => {
    const s = iso();
    draw(s, ...FOOTPRINT[id]);
    return finish(s, id);
  },
];

// little helpers used by several pieces
function legs(s, a, b, z, h, color, inset = 1, w = 2) {
  // back legs first, then the front ones
  s.box(inset, inset, z, w, w, h, color, { edge: false });
  s.box(a - inset - w, inset, z, w, w, h, color, { edge: false });
  s.box(inset, b - inset - w, z, w, w, h, color, { edge: false });
  s.box(a - inset - w, b - inset - w, z, w, w, h, color, { edge: false });
}

function pillow(s, i, j, z, a, b) {
  s.box(i, j, z, a, b, 2, P.white, { top: 0xfffaf0, side: P.creamShade });
}

// A plant pot (round, slightly narrower at the bottom) at the middle of an
// a x b footprint. Returns the height of its rim.
function plantPot(s, a, b, r, h, color, shade) {
  s.cyl(a / 2, b / 2, 0, r - 0.6, h, color, { side: shade, r2: r, top: tone(shade, 0.7) });
  // rim
  const [x, y] = s.p(a / 2, b / 2, h);
  s.c.ellipse(x, y, r * 2 + 0.5, r + 0.3, tone(color, 1.12), (px, py) => py >= y - 0.5 || (px - x) ** 2 / (r * 2 - 1) ** 2 + (py - y) ** 2 / (r - 1) ** 2 > 1);
  s.c.ellipse(x, y, r * 2 - 1, r - 1, P.woodDark); // soil
  return h;
}

// Leaves: lots of small blobs, darker underneath and lighter on top.
function leafy(s, i, j, z, rx, ry, dark, mid, light, seed = 1) {
  let r = seed * 9301 + 49297;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  s.ball(i, j, z, rx, ry, dark);
  s.ball(i, j, z + 1, rx * 0.8, ry * 0.7, mid);
  const [cx, cy] = s.p(i, j, z);
  for (let k = 0; k < 12; k++) {
    const ang = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * 0.75;
    const x = cx + Math.cos(ang) * rx * d;
    const y = cy + Math.sin(ang) * ry * d - 1;
    s.c.ellipse(x, y, 2.2, 1.6, y < cy ? light : mid);
  }
}

// ---------- furniture shop ----------

const FURNITURE = [
  piece('cozy-bed', (s, a, b) => {
    const wood = P.wood;
    s.box(0, 0, 0, a, 2, 18, wood); // headboard
    s.box(1, 0, 14, a - 2, 1, 3, P.woodLight, { edge: false });
    s.box(0, 2, 0, a, b - 4, 6, wood); // frame
    s.box(1, 2, 6, a - 2, b - 5, 3, P.cream); // mattress
    pillow(s, 2, 3, 9, 5, 4);
    pillow(s, 9, 3, 9, 5, 4);
    s.box(0, 9, 6, a, b - 11, 5, P.lilac, { side: P.lilacShade }); // the quilt, tucked over the sides
    s.line([0, 9, 11], [a, 9, 11], P.lilacDark); // folded-down edge
    for (let j = 12; j < b - 3; j += 4) s.line([0, j, 11], [a, j, 11], P.lilacShade); // quilt stitching
    s.box(0, b - 2, 0, a, 2, 12, wood); // footboard
  }),

  piece('canopy-bed', (s, a, b) => {
    const wood = P.woodDark;
    s.box(0, 0, 0, 2, 2, 40, wood, { edge: false }); // back posts
    s.box(a - 2, 0, 0, 2, 2, 40, wood, { edge: false });
    s.box(2, 0, 8, a - 4, 1, 30, P.plum, { side: P.plum }); // curtain behind the pillows
    for (let i = 4; i < a - 2; i += 3) s.line([i, 1, 9], [i, 1, 37], tone(P.plum, 1.2));
    s.box(0, 2, 0, a, b - 4, 6, P.wood); // frame
    s.box(1, 2, 6, a - 2, b - 5, 3, P.cream);
    pillow(s, 2, 3, 9, 5, 4);
    pillow(s, 9, 3, 9, 5, 4);
    s.box(0, 9, 6, a, b - 11, 5, P.pink, { side: P.pinkShade });
    s.line([0, 9, 11], [a, 9, 11], P.pinkDark);
    s.box(0, b - 2, 0, a, 2, 8, P.wood);
    s.box(0, b - 2, 0, 2, 2, 40, wood, { edge: false }); // front posts
    s.box(a - 2, b - 2, 0, 2, 2, 40, wood, { edge: false });
    // the canopy frame and its drape
    s.box(0, 0, 40, a, 2, 2, wood);
    s.box(0, b - 2, 40, a, 2, 2, wood);
    s.box(0, 0, 40, 2, b, 2, wood);
    s.box(a - 2, 0, 40, 2, b, 2, wood);
    s.box(2, 2, 41, a - 4, b - 4, 1, P.lilac, { top: tone(P.lilac, 1.1) });
    for (let i = 1; i < a; i += 4) s.ball(i + 1, b - 1, 38, 3, 2.5, P.lilac); // scalloped edge
    // curtains tied to the front posts
    s.box(2, b - 2, 14, 2, 1, 26, P.lilacShade, { edge: false });
    s.box(a - 4, b - 2, 14, 2, 1, 26, P.lilacShade, { edge: false });
    s.box(1, b - 2, 18, 3, 1, 2, P.gold, { edge: false });
    s.box(a - 4, b - 2, 18, 3, 1, 2, P.gold, { edge: false });
  }),

  piece('hammock', (s, a, b) => {
    const mid = a / 2;
    s.box(mid - 1, 0, 0, 2, 2, 22, P.wood); // back post
    s.box(mid - 3, 0, 0, 6, 2, 1, P.woodDark, { edge: false });
    // the fabric sags in the middle
    for (let j = 3; j <= b - 3; j++) {
      const t = (j - b / 2) / (b / 2 - 3);
      const z = 6 + 9 * t * t;
      const color = j % 4 < 2 ? PINK : P.pink;
      s.line([1, j, z], [a - 1, j, z], color);
      s.line([1, j, z + 1], [a - 1, j, z + 1], color);
    }
    s.line([mid, 1, 20], [1, 3, 15], P.cream).line([mid, 1, 20], [a - 1, 3, 15], P.cream); // ropes
    s.line([mid, b - 1, 20], [1, b - 3, 15], P.cream).line([mid, b - 1, 20], [a - 1, b - 3, 15], P.cream);
    s.box(mid - 1, b - 2, 0, 2, 2, 22, P.wood); // front post
    s.box(mid - 3, b - 2, 0, 6, 2, 1, P.woodDark, { edge: false });
  }),

  piece('armchair', (s, a, b) => {
    const pink = P.pink;
    legs(s, a, b, 0, 2, P.woodDark, 1);
    s.box(0, 0, 2, a, 4, 16, pink, { side: P.pinkShade }); // back
    s.box(0, 0, 2, a, b, 6, pink, { side: P.pinkShade }); // base
    s.box(3, 3, 8, a - 6, b - 4, 2, tone(pink, 1.1), { side: P.pinkShade }); // seat cushion
    s.box(0, 2, 8, 3, b - 2, 5, pink, { side: P.pinkShade }); // arms
    s.box(a - 3, 2, 8, 3, b - 2, 5, pink, { side: P.pinkShade });
  }),

  piece('rocking-chair', (s, a, b) => {
    const wood = P.wood;
    // curved rockers
    for (const i of [1, a - 2]) {
      for (let j = -1; j <= b + 1; j++) {
        const t = (j - b / 2) / (b / 2 + 1);
        s.box(i, j, 2 * t * t, 1, 1, 1, P.woodDark, { edge: false });
      }
    }
    s.box(1, 1, 2, 1, 1, 6, wood, { edge: false }).box(a - 2, 1, 2, 1, 1, 6, wood, { edge: false });
    s.box(0, 0, 3, a, 2, 22, wood); // tall back
    for (let i = 2; i < a - 1; i += 3) s.front(i, 2, 10, 1, 13, P.woodDark); // slats
    s.box(0, 2, 7, a, b - 2, 2, wood); // seat
    s.box(1, 3, 9, a - 2, b - 5, 1, P.sage, { side: P.sageShade, edge: false }); // a little cushion
    s.box(1, b - 2, 2, 1, 1, 6, wood, { edge: false }).box(a - 2, b - 2, 2, 1, 1, 6, wood, { edge: false });
    s.box(0, 3, 13, 1, b - 3, 1, P.woodLight, { edge: false }).box(a - 1, 3, 13, 1, b - 3, 1, P.woodLight, { edge: false }); // arm rails
  }),

  piece('wooden-stool', (s, a, b) => {
    legs(s, a, b, 0, 9, P.woodDark, 0, 1);
    s.box(0, 0, 4, a, b, 0, P.woodDark, { top: P.woodDark, edge: false }); // rung
    s.cyl(a / 2, b / 2, 9, 3.6, 2, P.wood);
  }),

  piece('floor-cushion', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 4.5, 3, P.pink, { side: P.pinkShade, top: tone(P.pink, 1.12) });
    s.dot(a / 2, b / 2, 3, P.pinkDark); // tuft
    for (const [i, j] of [[0.5, 0.5], [a - 0.5, 0.5], [0.5, b - 0.5], [a - 0.5, b - 0.5]]) s.dot(i, j, 2, P.gold); // tassels
  }),

  piece('side-table', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 2.5, 1, P.woodDark);
    s.post(a / 2, b / 2, 1, 9, P.woodDark);
    s.cyl(a / 2, b / 2, 10, 4, 2, OAK);
    s.cyl(a / 2, b / 2, 12, 1, 4, P.cream); // candle
    s.dot(a / 2, b / 2, 17, P.glowWarm);
    s.glow(a / 2, b / 2, 18, 4);
  }),

  piece('coffee-table', (s, a, b) => {
    legs(s, a, b, 0, 6, P.woodDark, 1);
    s.box(0, 0, 6, a, b, 2, OAK);
    s.box(2, 2, 8, 5, 4, 1, P.lilac, { side: P.lilacShade }); // a book
    s.box(2, 2, 9, 5, 4, 1, P.sage, { side: P.sageShade });
    s.cyl(11, 5, 8, 1.2, 3, P.cream); // a mug
  }),

  piece('desk', (s, a, b) => {
    s.box(1, 1, 0, 2, 2, 12, P.woodDark, { edge: false }); // back-left leg
    s.box(a - 7, 0, 0, 7, b, 12, P.wood); // drawers on the right
    s.front(a - 6, b, 2, 5, 4, P.woodDark).front(a - 6, b, 7, 5, 4, P.woodDark);
    s.dot(a - 3.5, b, 4, P.gold).dot(a - 3.5, b, 9, P.gold);
    s.box(1, b - 3, 0, 2, 2, 12, P.woodDark, { edge: false }); // front-left leg
    s.box(0, 0, 12, a, b, 2, P.wood); // top
    s.box(3, 2, 14, 5, 4, 2, P.lilac, { side: P.lilacShade }); // books
    s.cyl(12, 3, 14, 1.5, 4, P.gold); // a little lamp
    s.ball(12, 3, 21, 3, 2, P.lilac);
  }),

  piece('floor-lamp', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 2.5, 1, P.iron);
    s.post(a / 2, b / 2, 1, 32, P.iron, 1);
    s.glow(a / 2, b / 2, 32, 11, P.glow, 40);
    // the shade: wide at the bottom, narrow at the top
    const [x, y] = s.p(a / 2, b / 2, 30);
    s.c.poly([[x - 5, y - 9], [x + 5, y - 9], [x + 8, y], [x - 8, y]], P.cream);
    s.c.ellipse(x, y, 8, 2, P.cream, (px, py) => py >= y);
    s.c.ellipse(x, y - 9, 5, 1.5, P.creamShade);
    for (let yy = y - 9; yy <= y + 2; yy++) for (let xx = x + 2; xx <= x + 8; xx++) if (s.c.get(xx, yy) === P.cream) s.c.set(xx, yy, P.creamShade);
    s.c.rect(x - 6, y + 1, 12, 1, P.glow); // light spilling out under it
  }),

  piece('bedside-lamp', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 2.2, 1, P.woodDark);
    s.post(a / 2, b / 2, 1, 6, P.woodDark);
    s.glow(a / 2, b / 2, 10, 8, P.glowWarm, 45);
    const [x, y] = s.p(a / 2, b / 2, 7);
    s.c.poly([[x - 3, y - 6], [x + 3, y - 6], [x + 5, y], [x - 5, y]], ORANGE);
    for (let yy = y - 6; yy <= y; yy++) for (let xx = x + 1; xx <= x + 5; xx++) if (s.c.get(xx, yy) === ORANGE) s.c.set(xx, yy, P.glowDeep);
    s.c.rect(x - 4, y, 8, 1, P.glow);
  }),

  piece('mushroom-lamp', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 2, 8, P.cream, { side: P.creamShade });
    s.glow(a / 2, b / 2, 8, 12, P.spirit, 40);
    const [x, y] = s.p(a / 2, b / 2, 8);
    s.c.ellipse(x, y, 8, 6, PINK_DEEP, (px, py) => py <= y);
    s.c.ellipse(x, y, 8, 2, tone(PINK_DEEP, 0.75), (px, py) => py >= y);
    s.c.ellipse(x - 2, y - 3, 3, 1.5, PINK);
    for (const [dx, dy] of [[-4, -2], [2, -4], [4, -1], [-1, -1]]) s.c.set(x + dx, y + dy, P.white); // spots
    s.c.rect(x - 6, y + 1, 12, 1, P.spirit); // a glowing ring under the cap
  }),

  piece('paper-lantern', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 3, 1, P.woodDark);
    s.post(a / 2, b / 2, 1, 3, P.woodDark);
    s.glow(a / 2, b / 2, 12, 12, P.glowWarm, 40);
    const [x, y] = s.p(a / 2, b / 2, 12);
    s.c.ellipse(x, y, 6, 8, ORANGE);
    s.c.ellipse(x - 1, y, 3, 6, P.glow);
    for (const dy of [-5, 0, 5]) s.c.rect(x - 5, y + dy, 11, 1, P.glowDeep); // ribs
    s.c.rect(x - 3, y - 9, 7, 2, P.iron); // caps
    s.c.rect(x - 3, y + 8, 7, 2, P.iron);
  }),

  piece('book-stack', (s, a, b) => {
    s.box(0, 0, 0, a, b, 2, P.brick, { side: P.brickDark });
    s.box(0, 0, 2, a - 1, b, 2, P.sage, { side: P.sageShade });
    s.box(1, 0, 4, a - 1, b - 1, 2, P.lilac, { side: P.lilacShade });
    s.box(0, 1, 6, a - 2, b - 1, 1, P.cream, { side: P.creamShade });
    s.line([a - 1, 0, 3], [a - 1, b, 3], P.white); // page edges
  }),
];

// ---------- plant shop ----------

const pots = {
  terracotta: [C.terracotta, C.terracottaDark],
  white: [C.potWhite, C.potWhiteShade],
  gray: [C.potGray, C.potGrayShade],
  green: [C.potGreen, C.potGreenShade],
  black: [C.potBlack, C.potBlackShade],
};

// A wooden planter box with flowers growing in it (the flower bunches).
function planter(s, a, b, stem, head) {
  s.box(0, 0, 0, a, b, 5, OAK, { side: tone(OAK, 0.72) });
  s.flat(1, 1, 5, a - 2, b - 2, P.woodDark);
  for (let k = 0; k < 7; k++) {
    const i = 1.5 + (k % 4) * 2 + (k > 3 ? 1 : 0);
    const j = k > 3 ? b - 2 : 1.6;
    const h = 7 + ((k * 5) % 4);
    s.line([i, j, 5], [i, j, 5 + h], stem);
    head(i, j, 5 + h, k);
  }
  s.box(0, b - 1, 0, a, 1, 5, OAK, { side: tone(OAK, 0.72) }); // the planter's front, over the stems
  s.front(0, b, 2, a, 1, tone(OAK, 0.8));
}

const PLANTS = [
  piece('tiny-cactus', (s, a, b) => {
    const top = plantPot(s, a, b, 2.4, 4, C.terracotta, C.terracottaDark);
    const [x, y] = s.p(a / 2, b / 2, top);
    s.c.ellipse(x, y - 4, 2.5, 4.5, P.sage);
    s.c.rect(x + 1, y - 8, 1, 8, P.sageShade);
    s.c.rect(x - 4, y - 5, 2, 3, P.sage); // arm
    s.c.rect(x - 4, y - 3, 2, 1, P.sageShade);
    s.c.set(x, y - 9, PINK); // a flower
    s.c.set(x - 1, y - 9, PINK_DEEP);
  }),

  piece('succulent-trio', (s, a, b) => {
    s.box(0.5, 0.5, 0, a - 1, b - 1, 4, C.potWhite, { side: C.potWhiteShade });
    s.flat(1, 1, 4, a - 2, b - 2, P.woodDark);
    for (const [i, j, color] of [[2, 2, P.sage], [6, 2, P.leafLight], [4, 4.5, P.sage]]) {
      const [x, y] = s.p(i, j, 5);
      s.c.ellipse(x, y, 3, 2, tone(color, 0.85));
      s.c.ellipse(x, y - 1, 2, 1.3, color);
      s.c.set(x, y - 1, P.pinkShade);
    }
  }),

  piece('flower-pot', (s, a, b) => {
    const top = plantPot(s, a, b, 2.8, 5, C.potWhite, C.potWhiteShade);
    leafy(s, a / 2, b / 2, top + 3, 5, 3, P.leafDark, P.leaf, P.leafLight, 3);
    const [x, y] = s.p(a / 2, b / 2, top + 4);
    for (const [dx, dy, color] of [[-3, -2, PINK], [2, -3, P.gold], [0, 0, P.lilac], [3, 0, PINK], [-2, 1, P.gold]]) {
      s.c.rect(x + dx - 1, y + dy, 3, 1, color);
      s.c.rect(x + dx, y + dy - 1, 1, 3, color);
      s.c.set(x + dx, y + dy, P.white);
    }
  }),

  piece('snake-plant', (s, a, b) => {
    const top = plantPot(s, a, b, 2.8, 5, C.potGray, C.potGrayShade);
    const [x, y] = s.p(a / 2, b / 2, top);
    for (const [dx, h, lean] of [[-3, 14, -2], [3, 13, 2], [-1, 19, -1], [1, 17, 1], [0, 11, 0]]) {
      s.c.poly([[x + dx - 1, y], [x + dx + 2, y], [x + dx + lean + 1, y - h], [x + dx + lean, y - h + 1]], P.leaf);
      s.c.line(x + dx, y - 2, x + dx + lean, y - h + 2, P.leafLight);
      for (let k = 3; k < h - 1; k += 4) s.c.set(x + dx + Math.round((lean * k) / h) + 1, y - k, P.leafDark); // stripes
    }
  }),

  piece('peace-lily', (s, a, b) => {
    const top = plantPot(s, a, b, 2.8, 5, C.potGray, C.potGrayShade);
    const [x, y] = s.p(a / 2, b / 2, top);
    for (const [dx, dy, rx, ry, color] of [[-4, -5, 2.5, 5, P.leafDark], [4, -5, 2.5, 5, P.leafDark], [-2, -7, 2.5, 6, P.leaf], [2, -6, 2.5, 6, P.leaf], [0, -4, 2, 4, P.leafLight]]) {
      s.c.ellipse(x + dx, y + dy, rx, ry, color);
    }
    for (const [dx, dy] of [[-2, -14], [3, -12]]) {
      s.c.ellipse(x + dx, y + dy, 1.8, 3, P.white);
      s.c.rect(x + dx, y + dy, 1, 2, P.gold);
    }
  }),

  piece('boston-fern', (s, a, b) => {
    const top = plantPot(s, a, b, 3, 6, C.terracotta, C.terracottaDark);
    const [x, y] = s.p(a / 2, b / 2, top);
    // fronds arch up and droop over the rim
    for (let k = 0; k < 11; k++) {
      const ang = Math.PI * (0.05 + (k / 10) * 0.9);
      const len = 9 + (k % 3) * 2;
      let px = x;
      let py = y - 1;
      for (let t = 0; t < len; t++) {
        const f = t / len;
        px = x - Math.cos(ang) * t * 1.1;
        py = y - 2 - Math.sin(ang) * t * 0.9 + f * f * 9;
        s.c.set(px, py, k % 2 ? P.fern : P.leaf);
        if (t % 2) s.c.set(px, py - 1, P.leafLight);
      }
    }
  }),

  piece('monstera', (s, a, b) => {
    const top = plantPot(s, a, b, 3.2, 6, C.potBlack, C.potBlackShade);
    const [x, y] = s.p(a / 2, b / 2, top);
    const leaf = (cx, cy, rx, ry, color) => {
      s.c.line(x, y, cx, cy, P.leafDark);
      s.c.ellipse(cx, cy, rx, ry, color);
      // the splits
      s.c.line(cx - rx + 1, cy - 1, cx - 1, cy, -1);
      s.c.line(cx + rx - 1, cy + 1, cx + 1, cy, -1);
    };
    leaf(x - 7, y - 10, 5, 4, P.leafDark);
    leaf(x + 7, y - 9, 5, 4, P.leafDark);
    leaf(x - 2, y - 17, 5, 4, P.leaf);
    leaf(x + 4, y - 14, 5, 3.5, P.leafLight);
    leaf(x - 5, y - 5, 4, 3, P.leaf);
  }),

  piece('bonsai-tree', (s, a, b) => {
    s.box(0, 0, 0, a, b, 3, C.potBlack, { side: C.potBlackShade, top: tone(C.potBlack, 1.4) }); // shallow tray
    s.flat(1, 1, 3, a - 2, b - 2, P.mossDark);
    const [x, y] = s.p(a / 2, b / 2, 3);
    s.c.line(x, y, x - 3, y - 6, P.woodDark, 2); // a twisty trunk
    s.c.line(x - 3, y - 6, x + 2, y - 11, P.woodDark, 2);
    s.c.line(x + 2, y - 11, x + 6, y - 14, P.wood);
    for (const [dx, dy, rx] of [[-6, -9, 5], [5, -14, 6], [0, -17, 4]]) {
      s.c.ellipse(x + dx, y + dy, rx, 2.5, P.leafDark);
      s.c.ellipse(x + dx - 1, y + dy - 1, rx - 1.5, 1.5, P.leaf);
    }
  }),

  piece('mini-palm', (s, a, b) => {
    const top = plantPot(s, a, b, 3.4, 7, C.terracotta, C.terracottaDark);
    const [x, y] = s.p(a / 2, b / 2, top);
    s.c.rect(x - 1, y - 14, 2, 14, P.wood);
    for (let k = 2; k < 14; k += 3) s.c.rect(x - 1, y - k, 2, 1, P.woodDark);
    const ty = y - 15;
    for (const [dx, dy] of [[-11, 3], [11, 3], [-8, -5], [8, -5], [-2, -9], [3, 6], [-4, 6]]) {
      s.c.line(x, ty, x + dx, ty + dy, P.leaf, 2);
      s.c.line(x, ty - 1, x + dx * 0.8, ty + dy * 0.8 - 1, P.leafLight);
    }
  }),

  piece('fiddle-leaf-fig', (s, a, b) => {
    const top = plantPot(s, a, b, 3.4, 7, C.potWhite, C.potWhiteShade);
    const [x, y] = s.p(a / 2, b / 2, top);
    s.c.line(x, y, x, y - 30, P.woodDark);
    for (const [dx, dy, color] of [[-4, -10, P.leafDark], [4, -14, P.leafDark], [-4, -19, P.leaf], [4, -23, P.leaf], [-3, -28, P.leafLight], [3, -31, P.leafLight], [0, -34, P.leaf]]) {
      s.c.ellipse(x + dx, y + dy, 3.5, 2.6, color);
      s.c.set(x + dx - Math.sign(dx), y + dy, tone(color, 0.8)); // the vein
    }
  }),

  piece('lemon-tree', (s, a, b) => {
    const top = plantPot(s, a, b, 3.4, 7, C.terracotta, C.terracottaDark);
    const [x, y] = s.p(a / 2, b / 2, top);
    s.c.rect(x - 1, y - 12, 2, 12, P.wood);
    leafy(s, a / 2, b / 2, top + 20, 10, 9, P.leafDark, P.leaf, P.leafLight, 7);
    for (const [dx, dy] of [[-5, -18], [4, -22], [6, -15], [-2, -25], [-7, -24], [1, -16]]) {
      s.c.rect(x + dx, y + dy, 2, 2, YELLOW);
      s.c.set(x + dx, y + dy, 0xfff0a0);
    }
  }),

  piece('sakura-tree', (s, a, b) => {
    const top = plantPot(s, a, b, 4, 7, C.potBlack, C.potBlackShade);
    const [x, y] = s.p(a / 2, b / 2, top);
    s.c.line(x, y, x - 2, y - 12, P.woodDark, 2);
    s.c.line(x - 2, y - 12, x - 7, y - 20, P.woodDark);
    s.c.line(x - 1, y - 12, x + 6, y - 21, P.woodDark);
    leafy(s, a / 2, b / 2, top + 26, 13, 9, PINK_DEEP, P.pink, PINK, 5);
    for (const [dx, dy] of [[-9, 4], [10, 2], [-14, 0], [12, -3]]) s.c.set(x + dx, y + dy, PINK); // falling petals
  }),

  piece('daisies', (s, a, b) =>
    planter(s, a, b, P.leaf, (i, j, z) => {
      const [x, y] = s.p(i, j, z);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) s.c.set(x + dx, y + dy, P.white);
      s.c.set(x, y, YELLOW);
    })),

  piece('tulips', (s, a, b) =>
    planter(s, a, b, P.leaf, (i, j, z, k) => {
      const [x, y] = s.p(i, j, z);
      const color = k % 2 ? PINK : RED;
      s.c.rect(x - 1, y - 2, 3, 3, color);
      s.c.set(x, y - 2, -1);
      s.c.set(x - 1, y - 2, tone(color, 1.15));
    })),

  piece('sunflowers', (s, a, b) =>
    planter(s, a, b, P.leaf, (i, j, z) => {
      const [x, y] = s.p(i, j, z);
      s.c.ellipse(x, y, 2.5, 2.5, YELLOW);
      s.c.rect(x - 1, y - 1, 2, 2, P.woodDark);
    })),

  piece('lavender', (s, a, b) =>
    planter(s, a, b, P.sageShade, (i, j, z) => {
      const [x, y] = s.p(i, j, z);
      for (let k = 0; k < 5; k++) s.c.set(x + (k % 2), y + k, k % 2 ? P.lilacShade : P.lilac);
    })),

  piece('roses', (s, a, b) =>
    planter(s, a, b, P.leafDark, (i, j, z) => {
      const [x, y] = s.p(i, j, z);
      s.c.rect(x - 1, y - 1, 3, 3, RED);
      s.c.set(x, y, tone(RED, 0.7));
      s.c.set(x - 1, y + 2, P.leaf);
    })),
];

// ---------- the dresser (click it at home to change your look) ----------

const DRESSER = [
  piece('dresser', (s, a, b) => {
    const wood = P.wood;
    // the mirror stands at the back of the top
    s.box(3, 0, 17, a - 6, 2, 24, P.woodDark);
    s.front(5, 2, 20, a - 10, 18, TEAL_GLASS);
    s.line([6, 2, 36], [9, 2, 33], 0xc8e0e4).line([7, 2, 37], [11, 2, 33], 0xc8e0e4); // shine
    // body with three rows of drawers on the front
    s.box(0, 0, 0, a, b, 17, wood);
    s.box(0, 0, 17, a, b, 1, P.woodLight, { edge: false });
    for (const z of [2, 7, 12]) {
      s.front(1, b, z, a / 2 - 1.5, 4, P.woodDark).front(a / 2 + 0.5, b, z, a / 2 - 1.5, 4, P.woodDark);
      s.front(2, b, z + 1, a / 2 - 3.5, 2, tone(wood, 1.05)).front(a / 2 + 1.5, b, z + 1, a / 2 - 3.5, 2, tone(wood, 1.05));
      s.dot(a / 4, b, z + 2, P.gold).dot((a * 3) / 4, b, z + 2, P.gold);
    }
    s.cyl(a - 4, 4, 18, 1.2, 3, P.lilac); // a little perfume bottle
    s.box(2, 4, 18, 4, 3, 1, P.pink, { side: P.pinkShade }); // a folded scarf
  }),
];

export const FURNITURE_ART = Object.fromEntries([...FURNITURE, ...PLANTS, ...DRESSER]);
