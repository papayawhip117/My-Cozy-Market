// The five shops (well, four shops and a photo booth), drawn as cozy night-market shopfronts: a tiled roof
// with paper lanterns along the eave, an upper floor, a striped awning
// over a big arched cafe-style window (so you can see what each shop
// sells, lit by little pendant lamps), and a
// sliding lattice door with a cloth curtain (noren) over it.
//
// marketShop() draws the parts every shop shares. Each shop then passes
// its own colors, plus small functions that draw what makes it special:
//   upper(s)    windows and things on the upper floor
//   roofTop(s)  something sitting on the roof
//   counter(s)  what you see inside the big window
//   street(s)   things standing outside on the street
// `s` holds the canvas, the list of lights, and handy positions
// (wall edges, floor heights, the counter box, the door).
//
// The door's middle is shop.doorX pixels from the middle of the picture,
// see SHOPS in src/config.js.
import { Canvas } from './canvas.js';
import { P } from './palette.js';
import { seeded, part, glow, lantern, ivy, ferns, pot } from './scenery.js';

// ---------- texture helpers ----------

// Rows of curved roof tiles over every pixel of `color`.
function tiles(c, color, dark, light, rowH = 4) {
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (c.get(x, y) !== color) continue;
      if (y % rowH === rowH - 1) c.set(x, y, dark);
      else if (x % 4 === (Math.floor(y / rowH) % 2) * 2) c.set(x, y, dark);
      else if (y % rowH === 0 && x % 4 === 1) c.set(x, y, light);
    }
  }
}

// Vertical wooden boards over every pixel of `color`.
function planks(c, color, dark, light, every, seed) {
  const r = seeded(seed);
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (c.get(x, y) !== color) continue;
      if (x % every === 0) c.set(x, y, dark);
      else if (x % every === 1 && r() > 0.6) c.set(x, y, light);
      else if (r() > 0.97) c.set(x, y, dark); // knots
    }
  }
}

// Moss growing on whatever is drawn in a box.
function moss(c, x0, y0, x1, y1, amount, seed) {
  const r = seeded(seed);
  for (let i = 0; i < amount; i++) {
    const x = x0 + Math.floor(r() * (x1 - x0));
    const y = y0 + Math.floor(r() * (y1 - y0));
    const here = c.get(x, y);
    if (here === -1 || here === P.line) continue;
    c.set(x, y, r() > 0.5 ? P.moss : P.mossDark);
  }
}

// ---------- shared parts ----------

// Round paper lantern. `mark` = pixels of the symbol painted on it.
function paperLantern(c, x, y, col, mark, lights, ink = P.redDark) {
  c.draw(part(c.w, c.h, (d) => d.ellipse(x, y + 7, 6, 7, col), P.woodDark));
  c.rect(x - 3, y - 1, 7, 2, P.iron);
  c.rect(x - 3, y + 14, 7, 2, P.iron);
  // paper ribs glow a little warmer
  for (const yy of [y + 3, y + 11]) for (let xx = x - 5; xx <= x + 5; xx++) if (c.get(xx, yy) === col) c.set(xx, yy, P.glowWarm);
  for (const [ox, oy] of mark) c.set(x + ox, y + 7 + oy, ink);
  lights.push([x, y + 7, 14]);
}

// Painted symbols for lanterns.
const MARK = {
  leaf: [[0, -3], [-1, -2], [1, -2], [-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1], [0, 2], [0, 3]],
  cup: [[-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [-2, 0], [2, 0], [3, 0], [-1, 1], [1, 1], [0, 1], [0, -3], [1, -4]],
  swirl: [[-1, -2], [0, -2], [1, -2], [2, -1], [1, 0], [0, 0], [-1, 1], [-1, 2], [0, 2], [1, 2]],
  dot: [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]],
  moon: [[0, -3], [-1, -2], [-2, -1], [-2, 0], [-2, 1], [-1, 2], [0, 3], [1, 3], [-1, -1], [-1, 0], [-1, 1]],
  star: [[0, -2], [0, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [0, 1], [-1, 2], [1, 2]],
  heart: [[-2, -1], [-1, -2], [0, -1], [1, -2], [2, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]],
  camera: [[-1, -2], [0, -2], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [-2, 0], [2, 0], [-2, 1], [2, 1], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [0, 0], [0, 1]],
  acorn: [[-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2], [-1, -3], [0, -3], [1, -3], [0, -4], [-2, -1], [2, -1], [-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [0, 1]],
  chair: [[-2, -3], [-2, -2], [-2, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-2, 1], [2, 1], [-2, 2], [2, 2]],
};

// One shelf with a row of jars, tins, cups and tiny plants.
function jarShelf(c, x, y, w, seed, colors = [P.sage, P.cream, P.pink, P.glowWarm, P.lilac, P.mossLight]) {
  const r = seeded(seed);
  c.rect(x, y, w, 1, P.woodDark);
  let xx = x + 1;
  while (xx < x + w - 4) {
    const kind = Math.floor(r() * 4);
    const col = colors[Math.floor(r() * colors.length)];
    if (kind === 0) {
      c.rect(xx, y - 4, 3, 4, col); // tin with a lid
      c.rect(xx, y - 5, 3, 1, P.woodDark);
      xx += 4;
    } else if (kind === 1) {
      c.rect(xx, y - 3, 2, 3, col); // bottle
      c.set(xx, y - 4, col);
      xx += 3;
    } else if (kind === 2) {
      c.rect(xx, y - 2, 3, 2, P.white); // cup
      c.set(xx + 3, y - 2, P.white);
      xx += 5;
    } else {
      c.set(xx + 1, y - 1, P.brick); // tiny plant
      c.set(xx + 1, y - 2, P.leaf);
      c.set(xx, y - 3, P.leafLight);
      c.set(xx + 2, y - 3, P.leaf);
      xx += 4;
    }
  }
}

// Square window with paper (shoji) panes and a warm glow.
function shoji(c, x, y, w, h, frame, bar, lights) {
  c.draw(part(c.w, c.h, (d) => d.rect(x, y, w, h, P.glow), frame));
  for (let xx = x + 4; xx < x + w; xx += 5) c.rect(xx, y, 1, h, bar);
  c.rect(x, y + Math.floor(h / 2), w, 1, bar);
  lights.push([x + w / 2, y + h / 2, Math.max(w, h) * 0.8]);
}

// A chalkboard A-frame sign standing on the street.
function chalkboard(c, x, bottom, lines) {
  c.draw(part(c.w, c.h, (d) => d.poly([[x, bottom], [x + 5, bottom - 23], [x + 16, bottom - 23], [x + 21, bottom]], 0x2e3a33), P.woodDark));
  lines.forEach((col, i) => c.rect(x + 6 - (i % 2), bottom - 18 + i * 4, 9 + (i % 2) * 2, 1, col));
}

// Everything every shop has. See the notes at the top of the file.
function marketShop(o) {
  const upperH = o.upperH ?? 40;
  const W = o.W ?? 172;
  const headroom = o.headroom ?? 0; // extra sky above the roof, for things poking up
  const H = 120 + upperH + headroom;
  const c = new Canvas(W, H);
  const lights = [];
  const L = o.inset ?? 20; // left wall
  const R = W - (o.inset ?? 20); // right wall
  const [wood, woodD, woodL] = o.wood;
  const [roof, roofD, roofL] = o.roof;

  // heights, top to bottom
  const ridge = 14 + headroom;
  const eave = ridge + 30; // bottom edge of the main roof
  const up = eave - 2; // top of the upper floor
  const mid = up + upperH - 2; // top of the little roof between the floors
  const gt = mid + 12; // top of the ground floor
  const base = H - 6; // top of the stone foundation
  const doorW = o.doorW ?? 40;
  const doorL = R - doorW - 6;
  const box = { x0: L + 6, x1: doorL - 8, y0: gt + 14, y1: gt + 44 };
  const s = { c, lights, W, H, L, R, up, mid, gt, base, box, doorL, doorW, wood, woodD, woodL, eave, ridge };

  o.behind?.(s);

  // upper floor: wooden boards
  const upper = new Canvas(W, H);
  upper.rect(L, up, R - L, mid - up + 2, wood);
  planks(upper, wood, woodD, woodL, 6, o.seed ?? 1);
  upper.outline(P.line);
  c.draw(upper);
  o.upper?.(s);

  // main roof: wide tiles with curled-up corners and a ridge beam
  const rf = new Canvas(W, H);
  rf.poly([[L - 6, eave], [R + 6, eave], [R - 10, ridge + 4], [L + 10, ridge + 4]], roof);
  rf.poly([[L - 10, eave + 2], [L - 6, eave - 4], [L - 2, eave]], roof);
  rf.poly([[R + 10, eave + 2], [R + 6, eave - 4], [R + 2, eave]], roof);
  tiles(rf, roof, roofD, roofL, 4);
  rf.rect(L + 6, ridge, R - L - 12, 4, roofD);
  rf.outline(P.line);
  c.draw(rf);
  c.rect(L - 6, eave, R - L + 12, 2, roofD);
  if (o.mossyRoof) moss(c, L - 6, ridge, R + 6, eave + 2, o.mossyRoof, 5);
  o.roofTop?.(s);

  // lanterns hanging along the eave
  const marks = o.lanternMarks;
  const n = marks.length;
  for (let i = 0; i < n; i++) {
    const x = Math.round(L + 22 + ((R - L - 44) * i) / Math.max(1, n - 1));
    const col = Array.isArray(o.lantern) ? o.lantern[i % o.lantern.length] : o.lantern;
    paperLantern(c, x, eave - 18, col, MARK[marks[i]], lights, o.ink);
  }

  // little tiled roof between the floors
  const md = new Canvas(W, H);
  md.poly([[L - 8, gt], [R + 8, gt], [R, mid], [L, mid]], roof);
  tiles(md, roof, roofD, roofL, 3);
  md.outline(P.line);
  c.draw(md);

  // ground floor and stone foundation
  const g = new Canvas(W, H);
  g.rect(L, gt, R - L, base - gt, wood);
  g.rect(L - 2, base, R - L + 4, H - base, P.stoneShade);
  g.outline(P.line);
  c.draw(g);
  for (let x = L + 4; x < R; x += 9) c.rect(x, base + 1, 1, H - base - 1, P.stoneDark);
  moss(c, L - 2, base, R + 2, H, 40, 9);

  // the big shop window: a lit room inside, then whatever this shop sells
  const inside = o.inside ?? 0xf0d9a0;
  const insideTop = o.insideTop ?? 0xe0b878;
  c.rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0, inside);
  c.rect(box.x0, box.y0, box.x1 - box.x0, 6, insideTop);
  // faint brick pattern on the back wall
  for (let y = box.y0 + 7; y < box.y1; y++) {
    for (let x = box.x0; x < box.x1; x++) {
      if (y % 4 === 0 || (x + (Math.floor(y / 4) % 2) * 3) % 7 === 0) c.set(x, y, insideTop);
    }
  }
  o.counter(s);
  // pendant lamps hanging from the ceiling, like a cozy cafe
  const lamps = Math.max(2, Math.floor((box.x1 - box.x0) / 26));
  for (let i = 0; i < lamps; i++) {
    const lx = Math.round(box.x0 + ((box.x1 - box.x0) * (i + 0.5)) / lamps);
    const len = 3 + ((i * 2) % 4);
    c.rect(lx, box.y0, 1, len, P.iron);
    c.poly([[lx - 3, box.y0 + len + 3], [lx + 4, box.y0 + len + 3], [lx + 2, box.y0 + len], [lx - 1, box.y0 + len]], o.lampShade ?? P.gold);
    c.rect(lx - 1, box.y0 + len + 3, 3, 1, P.glow);
    lights.push([lx, box.y0 + len + 4, 10]);
  }
  lights.push([(box.x1 + box.x0) / 2, (box.y0 + box.y1) / 2, (box.x1 - box.x0) / 2]);
  // the window frame: an arched top, thin bars and a little shine on the glass
  const midX = (box.x0 + box.x1) / 2;
  const halfW = (box.x1 - box.x0) / 2;
  const archH = 8;
  const inArch = (x, y) => y >= box.y0 + archH || ((x + 0.5 - midX) / halfW) ** 2 + ((y - box.y0 - archH) / archH) ** 2 <= 1;
  for (let y = box.y0; y < box.y0 + archH; y++) {
    for (let x = box.x0; x < box.x1; x++) if (!inArch(x, y)) c.set(x, y, wood);
  }
  for (let y = box.y0 - 1; y < box.y1; y++) {
    for (let x = box.x0 - 1; x <= box.x1; x++) {
      if (inArch(x, y) && x >= box.x0 && x < box.x1 && y >= box.y0) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        return nx >= box.x0 && nx < box.x1 && ny >= box.y0 && ny < box.y1 && inArch(nx, ny);
      });
      if (near) c.set(x, y, woodD);
    }
  }
  for (const t of [1 / 3, 2 / 3]) {
    const bx = Math.round(box.x0 + (box.x1 - box.x0) * t);
    for (let y = box.y0; y < box.y1; y++) if (inArch(bx, y)) c.set(bx, y, woodD);
  }
  for (let i = 0; i < 5; i++) c.set(box.x0 + 3 + i, box.y1 - 6 - i * 2, P.white);
  for (let i = 0; i < 3; i++) c.set(box.x1 - 10 + i, box.y0 + 14 - i * 2, P.white);
  // counter top and front
  c.draw(part(W, H, (d) => d.rect(box.x0 - 4, box.y1, box.x1 - box.x0 + 8, 4, woodL)));
  const front = new Canvas(W, H);
  front.rect(box.x0 - 2, box.y1 + 4, box.x1 - box.x0 + 4, base - box.y1 - 4, wood);
  planks(front, wood, woodD, woodL, 6, 9);
  front.outline(P.line);
  c.draw(front);
  // flowers and trailing leaves spilling over the window sill
  const fr = seeded(o.seed ?? 1);
  for (let x = box.x0 - 3; x < box.x1 + 3; x++) {
    c.set(x, box.y1 + 4, fr() > 0.4 ? P.leaf : P.leafDark);
    if (fr() > 0.75) c.rect(x, box.y1 + 5, 1, 1 + Math.floor(fr() * 4), P.leafDark);
  }
  o.onCounter?.(s); // things standing on the window sill

  // striped awning over the window, with a scalloped edge
  const [a1, a2] = o.awning;
  const aw = new Canvas(W, H);
  const ax0 = box.x0 - 10;
  const ax1 = box.x1 + 10;
  const ay = gt + 1;
  aw.poly([[ax0 + 4, ay], [ax1 - 4, ay], [ax1, ay + 10], [ax0, ay + 10]], a1);
  for (let x = ax0; x < ax1; x++) {
    for (let y = ay; y < ay + 11; y++) if (aw.get(x, y) === a1 && Math.floor((x - ax0) / 6) % 2 === 0) aw.set(x, y, a2);
  }
  for (let x = ax0; x < ax1; x += 6) {
    aw.ellipse(x + 3, ay + 10, 3, 2, Math.floor((x - ax0) / 6) % 2 === 0 ? a2 : a1, (px, py) => py >= ay + 10 && px < ax1);
  }
  aw.outline(P.line);
  c.draw(aw);

  // sliding lattice door with a noren curtain
  const dTop = gt + 8;
  c.draw(part(W, H, (d) => d.rect(doorL, dTop, doorW, base - dTop, P.glow), woodD));
  for (let x = doorL + 5; x < doorL + doorW; x += 5) c.rect(x, dTop, 1, base - dTop, woodL);
  for (let y = dTop + 8; y < base; y += 8) c.rect(doorL, y, doorW, 1, woodL);
  c.rect(doorL + doorW / 2, dTop, 1, base - dTop, woodD);
  c.rect(doorL - 2, dTop - 1, doorW + 4, 2, woodD);
  const panel = Math.floor(doorW / 4);
  for (let x = doorL; x < doorL + doorW; x++) {
    if ((x - doorL) % panel === panel - 1) continue; // slits between the cloth panels
    for (let y = dTop + 1; y < dTop + 18; y++) c.set(x, y, o.noren);
  }
  for (let i = 0; i < 4; i++) {
    const nx = doorL + Math.floor(panel / 2) + i * panel;
    for (const [ox, oy] of MARK[o.norenMark]) c.set(nx + Math.round(ox * 0.7), dTop + 9 + Math.round(oy * 0.7), P.white);
  }
  lights.push([doorL + doorW / 2, (dTop + base) / 2, doorW * 0.8]);

  o.street?.(s);
  ivy(c, L, up + 4, base, 4, 2);
  ivy(c, R, mid + 4, base, 6, 2);
  // light spilling onto the street from the door
  c.see(40, () => c.poly([[doorL, H - 3], [doorL + doorW, H - 3], [doorL + doorW + 8, H], [doorL - 8, H]], P.glowWarm));
  for (const [x, y, r] of lights) glow(c, x, y, r);
  return c;
}

// ================= THE SHOPS =================

// The photo booth (it took over the old matcha shop's spot on the street).
function shopPhotoBooth() {
  return marketShop({
    W: 172,
    seed: 4,
    wood: [0x4a3530, 0x33241f, 0x5e463c],
    roof: [0x45375e, 0x30264a, 0x5d4c85],
    lantern: [P.cream, P.pink, P.cream, P.pink],
    lanternMarks: ['camera', 'heart', 'star', 'camera'],
    awning: [P.white, P.pinkShade],
    noren: P.plum,
    norenMark: 'star',
    inside: 0xf0dcc8,
    insideTop: 0xdcb8b0,
    behind: ({ c, up }) => {
      // tall glowing sign on the side of the building, in rose neon
      c.draw(part(c.w, c.h, (d) => d.rect(6, up + 28, 9, 36, 0x5a3048)));
      for (let y = up + 31; y < up + 61; y += 5) c.rect(8, y, 5, 3, 0xffb8c8);
      c.see(40, () => c.rect(3, up + 24, 15, 44, 0xff9ab0));
    },
    upper: ({ c, lights, L, R, up, woodD, woodL }) => {
      shoji(c, L + 14, up + 8, 20, 14, woodD, woodL, lights);
      shoji(c, R - 34, up + 8, 20, 14, woodD, woodL, lights);
      // a big round camera lens in the middle of the upper floor
      const cx = Math.round((L + R) / 2);
      const cy = up + 18;
      c.draw(part(c.w, c.h, (d) => d.rect(cx - 13, cy - 9, 26, 19, 0x2e2a36)));
      c.rect(cx - 9, cy - 11, 7, 2, 0x2e2a36); // the viewfinder bump
      c.rect(cx + 7, cy - 7, 3, 2, P.glow); // the flash
      c.circle(cx, cy + 1, 7, P.gold);
      c.circle(cx, cy + 1, 5, 0x3c4a6e);
      c.circle(cx, cy + 1, 3, 0x26304e);
      c.set(cx - 2, cy - 1, P.white);
      c.set(cx - 1, cy - 2, P.white);
      lights.push([cx + 8, cy - 6, 6]);
    },
    roofTop: ({ c }) => {
      // a black cat on the roof, with glowing eyes
      const cat = 0x22202a;
      c.draw(part(c.w, c.h, (d) => {
        d.ellipse(118, 10, 4, 3, cat);
        d.circle(114, 8, 2.5, cat);
        d.poly([[112, 6], [113, 3], [114, 6]], cat);
        d.poly([[115, 6], [116, 3], [117, 6]], cat);
        d.rect(122, 7, 1, 5, cat);
      }, cat));
      c.set(113, 8, P.glow);
    },
    counter: ({ c, box }) => {
      // a string of photo strips pegged across the window
      c.rect(box.x0, box.y0 + 9, box.x1 - box.x0, 1, P.woodDark);
      const tints = [0x9fb8d8, P.pink, P.sageLight, 0xe8c890];
      for (let i = 0; i < 4; i++) {
        const x = box.x0 + 4 + i * 9;
        c.rect(x, box.y0 + 10, 6, 15, P.white);
        for (let k = 0; k < 3; k++) c.rect(x + 1, box.y0 + 11 + k * 5, 4, 4, tints[(i + k) % 4]);
        c.set(x + 2, box.y0 + 9, P.red); // the peg
      }
      // the booth itself: a little cabin with a plum curtain pulled half shut
      const bx = box.x1 - 22;
      c.draw(part(c.w, c.h, (d) => d.rect(bx, box.y0 + 8, 20, box.y1 - box.y0 - 8, 0x5e463c)));
      c.rect(bx + 2, box.y0 + 11, 16, box.y1 - box.y0 - 11, 0xfff0d0);
      for (let x = bx + 2; x < bx + 12; x++) {
        for (let y = box.y0 + 11; y < box.y1; y++) c.set(x, y, x % 3 === 0 ? P.plum : P.lilacDark);
      }
      c.rect(bx + 1, box.y0 + 8, 18, 3, P.gold); // the sign over the booth
      c.set(bx + 6, box.y0 + 9, P.redDark);
      c.set(bx + 10, box.y0 + 9, P.redDark);
      c.set(bx + 14, box.y0 + 9, P.redDark);
    },
    onCounter: ({ c, box }) => {
      // a little stack of photos and a vase of flowers on the sill
      c.draw(part(c.w, c.h, (d) => d.rect(box.x0 + 6, box.y1 - 3, 8, 3, P.white)));
      c.rect(box.x0 + 8, box.y1 - 2, 4, 1, P.pink);
      c.draw(part(c.w, c.h, (d) => d.rect(box.x0 + 22, box.y1 - 5, 4, 5, 0x9fb8d8)));
      c.set(box.x0 + 22, box.y1 - 7, P.pink);
      c.set(box.x0 + 25, box.y1 - 8, P.white);
      c.set(box.x0 + 24, box.y1 - 6, P.leaf);
    },
    street: ({ c, H, R }) => {
      chalkboard(c, 0, H - 1, [P.white, P.pink, P.white]);
      // an old camera on a wooden tripod, ready for a snap
      for (const [x1, x2] of [[R + 5, R], [R + 6, R + 6], [R + 7, R + 13]]) c.line(x1, H - 15, x2, H - 1, P.woodDark);
      c.draw(part(c.w, c.h, (d) => d.rect(R - 1, H - 22, 14, 8, 0x2e2a36)));
      c.rect(R + 1, H - 24, 4, 2, 0x2e2a36);
      c.circle(R + 6, H - 18, 2.5, P.gold);
      c.set(R + 6, H - 18, 0x3c4a6e);
      c.set(R + 10, H - 21, P.glow);
      pot(c, R - 52, H - 1, P.leaf);
      ferns(c, 30, H - 1, 7, 2);
    },
  });
}

function shopPJs() {
  return marketShop({
    W: 168,
    seed: 6,
    wood: [0x4e3a48, 0x362838, 0x64506a],
    roof: [0x4a3e66, 0x332a4a, 0x5d4c85],
    lantern: 0xf3e3b0,
    ink: P.lilacDark,
    lanternMarks: ['moon', 'star', 'moon'],
    awning: [P.white, P.lilacShade],
    noren: P.plum,
    norenMark: 'moon',
    inside: 0xf0dcc0,
    insideTop: 0xd8b8b0,
    upper: ({ c, lights, L, R, up, woodD, woodL }) => {
      // round moon window in the middle, a small window each side
      const cx = Math.round((L + R) / 2);
      c.draw(part(c.w, c.h, (d) => d.circle(cx, up + 18, 9, P.glow), woodD));
      c.rect(cx - 8, up + 18, 17, 1, woodL);
      c.rect(cx, up + 10, 1, 17, woodL);
      lights.push([cx, up + 18, 18]);
      shoji(c, L + 8, up + 10, 14, 14, woodD, woodL, lights);
      shoji(c, R - 22, up + 10, 14, 14, woodD, woodL, lights);
      // a sleepy cat in the left window
      c.ellipse(L + 15, up + 22, 4, 2, 0x6e6a74);
      c.poly([[L + 11, up + 21], [L + 12, up + 18], [L + 13, up + 21]], 0x6e6a74);
      // pajamas and socks on a clothesline
      const y0 = up + 30;
      for (let x = L + 2; x < R - 2; x++) c.set(x, y0 + Math.round(Math.sin(((x - L) / (R - L)) * Math.PI) * 2), P.white);
      const hang = [[L + 8, P.pink, 'top'], [L + 24, P.lilac, 'pants'], [L + 40, P.white, 'sock'], [R - 44, 0xa8c8e0, 'top'], [R - 28, P.pink, 'sock'], [R - 18, P.lilac, 'sock']];
      for (const [x, col, kind] of hang) {
        const y = y0 + Math.round(Math.sin(((x - L) / (R - L)) * Math.PI) * 2) + 1;
        c.draw(part(c.w, c.h, (d) => {
          if (kind === 'top') { d.rect(x, y, 9, 6, col); d.rect(x - 2, y, 2, 3, col); d.rect(x + 9, y, 2, 3, col); }
          else if (kind === 'pants') { d.rect(x, y, 8, 3, col); d.rect(x, y + 3, 3, 4, col); d.rect(x + 5, y + 3, 3, 4, col); }
          else { d.rect(x, y, 2, 4, col); d.rect(x, y + 4, 4, 2, col); }
        }, P.lineSoft));
        if (kind === 'top') for (let i = 0; i < 9; i += 3) c.set(x + i + 1, y + 2, P.white);
      }
    },
    roofTop: ({ c, L, R }) => {
      // crescent moon weathervane
      const cx = Math.round((L + R) / 2);
      c.rect(cx, 2, 1, 12, P.iron);
      c.circle(cx, 3, 3.5, P.gold);
      c.circle(cx + 2, 2, 3, -1);
    },
    counter: ({ c, box }) => {
      // shelves of folded pajamas, pillows and slippers
      const r = seeded(13);
      const cols = [P.pink, P.lilac, P.white, 0xa8c8e0, P.pinkShade, P.sageLight];
      for (let x = box.x0 + 3; x < box.x1 - 8; x += 9) {
        const n = 2 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) {
          const col = cols[Math.floor(r() * cols.length)];
          c.rect(x, box.y0 + 22 - i * 3, 7, 3, col);
          c.rect(x, box.y0 + 22 - i * 3 + 2, 7, 1, P.lineSoft);
        }
      }
      for (let x = box.x0 + 4; x < box.x1 - 6; x += 8) {
        c.rect(x, box.y0 + 27, 3, 2, P.pink); // slippers
        c.rect(x + 3, box.y0 + 27, 3, 2, P.pink);
        c.set(x, box.y0 + 26, P.white);
        c.set(x + 3, box.y0 + 26, P.white);
      }
    },
    onCounter: ({ c, box }) => {
      // fluffy pillows and a sleeping cat
      c.draw(part(c.w, c.h, (d) => {
        d.ellipse(box.x0 + 8, box.y1 - 3, 6, 3, P.white);
        d.ellipse(box.x0 + 20, box.y1 - 3, 6, 3, P.lilac);
      }, P.lineSoft));
      c.draw(part(c.w, c.h, (d) => {
        d.ellipse(box.x1 - 12, box.y1 - 2, 5, 2.5, 0xe8955f);
        d.circle(box.x1 - 17, box.y1 - 3, 2, 0xe8955f);
      }));
    },
    street: ({ c, H, R, L }) => {
      // basket of pillows and potted lavender
      c.draw(part(c.w, c.h, (d) => {
        d.ellipse(L - 6, H - 14, 6, 4, P.pink);
        d.ellipse(L + 2, H - 13, 6, 4, P.white);
        d.rect(L - 12, H - 11, 20, 10, P.woodLight);
      }));
      for (let x = L - 10; x < L + 7; x += 3) c.rect(x, H - 11, 1, 10, P.wood);
      for (const px of [R + 4]) {
        c.draw(part(c.w, c.h, (d) => d.poly([[px - 5, H - 9], [px + 5, H - 9], [px + 4, H - 1], [px - 4, H - 1]], P.brick)));
        for (let i = -3; i <= 3; i += 2) {
          c.rect(px + i, H - 18, 1, 9, P.leafDark);
          c.rect(px + i, H - 19, 1, 3, P.lilac);
        }
      }
    },
  });
}

function shopFurniture() {
  return marketShop({
    W: 190,
    seed: 8,
    doorW: 36,
    wood: [0x5a3a26, 0x3e2818, 0x74503a],
    roof: [0x6b4030, 0x4a2a20, 0x8a5a40],
    lantern: [P.cream, P.glowWarm],
    lanternMarks: ['chair', 'dot', 'chair', 'dot', 'chair'],
    awning: [P.cream, P.red],
    noren: P.brickDark,
    norenMark: 'dot',
    inside: 0xe8cfa0,
    insideTop: 0xc89a70,
    upper: ({ c, lights, L, R, up, woodD, woodL }) => {
      // balcony doors and a railing with pots
      shoji(c, L + 14, up + 6, 18, 22, woodD, woodL, lights);
      shoji(c, R - 32, up + 6, 18, 22, woodD, woodL, lights);
      shoji(c, Math.round((L + R) / 2) - 10, up + 6, 20, 22, woodD, woodL, lights);
      c.draw(part(c.w, c.h, (d) => {
        d.rect(L - 2, up + 28, R - L + 4, 2, woodL);
        for (let x = L; x <= R; x += 4) d.rect(x, up + 30, 1, 6, woodL);
      }));
      for (const x of [L + 8, L + 40, R - 40, R - 8]) pot(c, x, up + 28, P.leaf);
    },
    behind: ({ c, R, up }) => {
      // hanging shop sign on an iron bracket
      c.rect(R + 2, up + 6, 14, 1, P.iron);
      c.rect(R + 5, up + 7, 1, 3, P.iron);
      c.rect(R + 13, up + 7, 1, 3, P.iron);
      c.draw(part(c.w, c.h, (d) => d.rect(R + 3, up + 10, 13, 11, P.woodLight)));
      for (const [ox, oy] of MARK.chair) c.set(R + 9 + ox, up + 15 + oy, P.woodDark);
    },
    counter: ({ c, lights, box }) => {
      // a little showroom: framed picture, rug, armchair, side table, floor lamp
      c.draw(part(c.w, c.h, (d) => d.rect(box.x0 + 10, box.y0 + 7, 12, 8, P.sageLight), P.woodDark));
      c.rect(box.x0 + 12, box.y0 + 11, 8, 2, P.leaf);
      c.rect(box.x0 + 2, box.y1 - 2, box.x1 - box.x0 - 4, 2, P.pinkShade);
      c.draw(part(c.w, c.h, (d) => {
        d.rect(box.x0 + 28, box.y0 + 14, 14, 10, P.sage); // armchair back
        d.rect(box.x0 + 26, box.y0 + 20, 18, 7, P.sageShade);
        d.rect(box.x0 + 26, box.y0 + 27, 2, 2, P.woodDark);
        d.rect(box.x0 + 42, box.y0 + 27, 2, 2, P.woodDark);
      }));
      c.draw(part(c.w, c.h, (d) => {
        d.rect(box.x0 + 50, box.y0 + 22, 10, 2, P.woodLight);
        d.rect(box.x0 + 54, box.y0 + 24, 2, 5, P.woodDark);
      }));
      const lx = box.x1 - 10;
      c.rect(lx, box.y0 + 12, 1, 17, P.iron);
      c.draw(part(c.w, c.h, (d) => d.poly([[lx - 4, box.y0 + 12], [lx + 5, box.y0 + 12], [lx + 3, box.y0 + 6], [lx - 2, box.y0 + 6]], P.cream)));
      lights.push([lx, box.y0 + 12, 12]);
    },
    onCounter: ({ c, box }) => {
      c.draw(part(c.w, c.h, (d) => d.rect(box.x0 + 4, box.y1 - 5, 10, 5, P.red))); // books
      c.rect(box.x0 + 4, box.y1 - 3, 10, 1, P.cream);
      c.draw(part(c.w, c.h, (d) => d.rect(box.x0 + 6, box.y1 - 8, 7, 3, P.lilacShade)));
    },
    street: ({ c, H, L, R }) => {
      // stacked stools and lumber leaning on the wall
      for (let i = 0; i < 3; i++) {
        const y = H - 4 - i * 6;
        c.draw(part(c.w, c.h, (d) => {
          d.rect(L - 14, y - 2, 12, 2, P.woodLight);
          d.rect(L - 13, y, 2, 4, P.wood);
          d.rect(L - 5, y, 2, 4, P.wood);
        }));
      }
      for (const [x, col] of [[R + 2, P.woodLight], [R + 6, P.wood], [R + 10, P.woodLight]]) {
        c.draw(part(c.w, c.h, (d) => d.line(x, H - 1, x - 6, H - 40, col, 3)));
      }
      ferns(c, L + 22, H - 1, 6, 3);
    },
  });
}

function shopPlants() {
  return marketShop({
    W: 172,
    seed: 3,
    wood: [0x3e4a3a, 0x2a3428, 0x55644e],
    roof: [0x3f5a3e, 0x2c4030, 0x557a4e],
    mossyRoof: 260,
    lantern: [0xd8ecc0, P.cream],
    ink: P.leafDark,
    lanternMarks: ['leaf', 'leaf', 'leaf'],
    awning: [P.cream, P.leaf],
    noren: P.fern,
    norenMark: 'leaf',
    inside: 0xe6e8b8,
    insideTop: 0xc8d090,
    upper: ({ c, lights, L, R, up, woodD }) => {
      // a long greenhouse window full of plants
      c.draw(part(c.w, c.h, (d) => d.rect(L + 8, up + 6, R - L - 16, 22, 0xe6f0c0), woodD));
      for (let x = L + 8; x < R - 8; x += 10) c.rect(x, up + 6, 1, 22, woodD);
      c.rect(L + 8, up + 17, R - L - 16, 1, woodD);
      const r = seeded(17);
      for (let x = L + 11; x < R - 10; x += 5) {
        const h = 4 + Math.floor(r() * 8);
        c.ellipse(x, up + 27 - h / 2, 2.5, h / 2, r() > 0.5 ? P.leaf : P.leafDark);
      }
      lights.push([(L + R) / 2, up + 16, 30]);
      // hanging baskets under the little roof
      for (const x of [L + 12, Math.round((L + R) / 2), R - 12]) {
        c.rect(x, up + 30, 1, 3, P.iron);
        c.draw(part(c.w, c.h, (d) => d.ellipse(x, up + 35, 5, 3, P.woodLight)));
        ivy(c, x - 3, up + 34, up + 44, x, 1);
        ivy(c, x + 3, up + 34, up + 42, x + 1, 1);
      }
    },
    roofTop: ({ c, L, R }) => {
      // little plants and grass growing on the roof
      for (const x of [L + 16, L + 40, R - 30]) ferns(c, x, 18, 5, x);
      c.set(L + 41, 12, P.pink);
    },
    counter: ({ c, box }) => {
      jarShelf(c, box.x0 + 2, box.y0 + 9, box.x1 - box.x0 - 4, 21, [P.leaf, P.leafLight, P.mossLight, P.sageLight]);
      // rows of seedlings in little pots
      for (let x = box.x0 + 3; x < box.x1 - 3; x += 5) {
        c.rect(x, box.y0 + 24, 3, 3, P.brick);
        c.set(x + 1, box.y0 + 23, P.leafLight);
        c.set(x, box.y0 + 22, P.leaf);
        c.set(x + 2, box.y0 + 22, P.leaf);
      }
      ivy(c, box.x0 + 6, box.y0, box.y0 + 12, 2, 1);
      ivy(c, box.x1 - 6, box.y0, box.y0 + 10, 3, 1);
    },
    onCounter: ({ c, box }) => {
      // watering can and a big potted fern
      c.draw(part(c.w, c.h, (d) => {
        d.rect(box.x0 + 4, box.y1 - 5, 8, 5, P.water);
        d.line(box.x0 + 12, box.y1 - 4, box.x0 + 16, box.y1 - 8, P.water);
      }));
      pot(c, box.x1 - 12, box.y1, P.leaf);
    },
    street: ({ c, H, L, R }) => {
      // tiers of pots outside, and a monstera
      c.draw(part(c.w, c.h, (d) => {
        d.rect(L - 18, H - 12, 18, 2, P.woodLight);
        d.rect(L - 17, H - 10, 2, 9, P.wood);
        d.rect(L - 4, H - 10, 2, 9, P.wood);
      }));
      pot(c, L - 13, H - 12, P.leafLight);
      pot(c, L - 5, H - 12, P.sageShade);
      pot(c, L - 10, H - 1, P.leaf);
      c.draw(part(c.w, c.h, (d) => {
        d.poly([[R + 2, H - 8], [R + 12, H - 8], [R + 10, H - 1], [R + 4, H - 1]], P.brick);
        d.ellipse(R + 2, H - 18, 6, 8, P.leaf);
        d.ellipse(R + 12, H - 20, 6, 8, P.leafDark);
        d.ellipse(R + 7, H - 26, 5, 6, P.leafLight);
      }));
      c.set(R + 2, H - 18, P.leafDark);
      c.set(R + 12, H - 21, P.leaf);
    },
  });
}

function shopClothes() {
  return marketShop({
    W: 172,
    upperH: 64,
    seed: 10,
    wood: [0x5a3a44, 0x3e2630, 0x76505a],
    roof: [0xa8788a, 0x7d566a, 0xc99aa6],
    lantern: [P.pink, P.cream],
    ink: P.pinkDark,
    lanternMarks: ['heart', 'star', 'heart'],
    awning: [P.white, P.pinkShade],
    noren: 0x2e2a3a,
    norenMark: 'star',
    inside: 0xf2e2d0,
    insideTop: 0xdcc0b8,
    behind: ({ c, R, up }) => {
      // tall pink sign on the side
      c.draw(part(c.w, c.h, (d) => d.rect(R + 6, up + 20, 9, 44, 0x4a2a3a)));
      for (let y = up + 23; y < up + 61; y += 6) c.rect(R + 8, y, 5, 4, P.pink);
      c.see(36, () => c.rect(R + 3, up + 16, 15, 52, P.pink));
    },
    upper: ({ c, lights, L, R, up, woodD, woodL }) => {
      // two rows of windows; a mannequin peeks out of one
      for (const x of [L + 10, Math.round((L + R) / 2) - 8, R - 26]) {
        c.draw(part(c.w, c.h, (d) => {
          d.rect(x, up + 10, 16, 14, P.glow);
          d.ellipse(x + 7.5, up + 10, 8, 5, P.glow, (px, py) => py <= up + 10);
        }, woodD));
        c.rect(x + 8, up + 6, 1, 18, woodL);
        lights.push([x + 8, up + 15, 14]);
      }
      c.circle(L + 18, up + 15, 2, P.cream);
      c.rect(L + 15, up + 18, 7, 6, P.pink);
      // cloth banners hanging from a pole
      c.rect(L + 4, up + 30, R - L - 8, 1, P.iron);
      const cols = [P.pink, P.cream, P.lilac, P.pinkShade, P.white];
      for (let i = 0; i < 5; i++) {
        const x = L + 10 + i * Math.floor((R - L - 24) / 4);
        c.draw(part(c.w, c.h, (d) => d.poly([[x, up + 31], [x + 8, up + 31], [x + 8, up + 48], [x + 4, up + 45], [x, up + 48]], cols[i]), P.lineSoft));
        c.set(x + 4, up + 36, P.pinkDark);
        c.set(x + 4, up + 39, P.pinkDark);
      }
      shoji(c, L + 20, up + 52, 14, 8, woodD, woodL, lights);
      shoji(c, R - 34, up + 52, 14, 8, woodD, woodL, lights);
    },
    counter: ({ c, box }) => {
      // display window: mannequin in a striped tee and beret, a rail of clothes, a mirror
      const mx = box.x0 + 10;
      c.circle(mx, box.y0 + 9, 3, P.cream);
      c.rect(mx - 4, box.y0 + 5, 8, 2, P.red); // beret
      c.set(mx, box.y0 + 4, P.red);
      c.rect(mx - 4, box.y0 + 12, 9, 10, P.white);
      for (let y = box.y0 + 13; y < box.y0 + 22; y += 2) c.rect(mx - 4, y, 9, 1, 0x3c4a6e);
      c.rect(mx, box.y0 + 22, 1, 7, P.iron);
      c.rect(mx - 3, box.y0 + 29, 7, 1, P.iron);
      c.rect(box.x0 + 20, box.y0 + 8, box.x1 - box.x0 - 34, 1, P.iron);
      const cols = [P.pink, 0x3c4a6e, P.sage, P.cream, P.lilac, P.brick, P.white];
      let i = 0;
      for (let x = box.x0 + 22; x < box.x1 - 16; x += 4) {
        c.set(x + 1, box.y0 + 9, P.iron);
        c.rect(x, box.y0 + 10, 3, 10 + (i % 3) * 2, cols[i % cols.length]);
        i++;
      }
      c.draw(part(c.w, c.h, (d) => d.ellipse(box.x1 - 7, box.y0 + 17, 4, 9, 0xc8dce8), P.gold));
      c.set(box.x1 - 8, box.y0 + 13, P.white);
    },
    onCounter: ({ c, box }) => {
      c.draw(part(c.w, c.h, (d) => d.rect(box.x0 + 26, box.y1 - 4, 12, 4, P.pink))); // shoe box
      c.draw(part(c.w, c.h, (d) => d.rect(box.x0 + 42, box.y1 - 6, 8, 6, P.cream))); // tote bag
      c.rect(box.x0 + 44, box.y1 - 8, 4, 1, P.woodDark);
    },
    street: ({ c, H, L }) => {
      // a clothes rack out on the street
      c.draw(part(c.w, c.h, (d) => {
        d.rect(L - 18, H - 30, 1, 29, P.iron);
        d.rect(L - 2, H - 30, 1, 29, P.iron);
        d.rect(L - 19, H - 31, 19, 1, P.iron);
        d.rect(L - 20, H - 1, 4, 1, P.iron);
        d.rect(L - 4, H - 1, 4, 1, P.iron);
      }, P.iron));
      const cols = [P.lilac, P.pink, P.sage, 0x3c4a6e];
      cols.forEach((col, i) => {
        const x = L - 16 + i * 4;
        c.draw(part(c.w, c.h, (d) => d.rect(x, H - 28, 3, 12 + (i % 2) * 3, col), P.lineSoft));
      });
      ferns(c, L + 16, H - 1, 6, 4);
    },
  });
}

// Timber & Twig, the woodworking shop: a workshop built against an old oak,
// so it feels a bit like a treehouse. Logs stacked outside, a sawhorse,
// and a workbench in the window.
function shopWoodshop() {
  const bark = 0x3e2a22;
  const barkL = 0x55392c;
  return marketShop({
    W: 204,
    inset: 34, // room on the left for the old oak's trunk
    headroom: 16, // and above the roof for its leaves
    seed: 12,
    doorW: 36,
    wood: [0x6a4a2c, 0x4a321e, 0x86603c],
    roof: [0x4e5a38, 0x36402a, 0x66744a],
    mossyRoof: 180,
    lantern: [P.cream, P.glowWarm],
    lanternMarks: ['acorn', 'leaf', 'acorn', 'leaf', 'acorn'],
    awning: [0xd9c49a, 0x56744e],
    noren: 0x3f5a3e,
    norenMark: 'acorn',
    inside: 0xecd4a4,
    insideTop: 0xc8a070,
    behind: ({ c, lights, L, up, ridge }) => {
      // the old oak the workshop leans on: a thick trunk with roots up the
      // left side, and a branch reaching over the roof (leaves: roofTop)
      c.draw(part(c.w, c.h, (d) => {
        d.poly([[L - 32, c.h], [L - 2, c.h], [L - 8, c.h - 10], [L - 6, ridge + 10], [L - 2, ridge - 2], [L - 14, ridge - 4], [L - 22, ridge + 12], [L - 24, c.h - 10]], bark);
        d.line(L - 10, ridge + 4, L + 44, ridge - 8, bark, 3);
        d.line(L - 20, ridge + 14, L - 34, ridge, bark, 2);
      }, P.line));
      for (let y = ridge + 14; y < c.h - 4; y += 6) c.rect(L - 20 + ((y / 6) % 3) * 3, y, 1, 4, barkL); // bark lines
      c.rect(L - 12, c.h - 30, 1, 1, P.line); // a knot hole
      c.circle(L - 12, c.h - 30, 1.5, 0x2a1c18);
      moss(c, L - 32, c.h - 14, L - 2, c.h, 40, 33);
      // a rope ladder down from a little lookout platform, and a birdhouse
      c.draw(part(c.w, c.h, (d) => d.rect(L - 30, ridge + 26, 22, 3, P.woodLight)));
      for (let x = L - 28; x < L - 10; x += 4) c.rect(x, ridge + 29, 1, 3, P.woodDark);
      for (const x of [L - 28, L - 22]) c.rect(x, ridge + 32, 1, 44, 0xc9b48a);
      for (let y = ridge + 36; y < ridge + 76; y += 6) c.rect(L - 28, y, 7, 1, P.woodLight);
      c.draw(part(c.w, c.h, (d) => {
        d.poly([[L - 18, up + 30], [L - 12, up + 25], [L - 6, up + 30]], P.woodDark);
        d.rect(L - 17, up + 30, 10, 9, 0x7f9a80);
      }));
      c.circle(L - 12, up + 34, 1.5, P.line);
      // a lantern hanging under the lookout
      c.rect(L - 12, ridge + 29, 1, 5, P.iron);
      c.draw(part(c.w, c.h, (d) => d.rect(L - 14, ridge + 34, 5, 6, P.glow)));
      lights.push([L - 12, ridge + 37, 12]);
    },
    upper: ({ c, lights, L, R, up, woodD, woodL }) => {
      // a big tree-ring sign in the middle and a window each side
      shoji(c, L + 10, up + 8, 18, 18, woodD, woodL, lights);
      shoji(c, R - 28, up + 8, 18, 18, woodD, woodL, lights);
      const cx = Math.round((L + R) / 2);
      const cy = up + 18;
      c.draw(part(c.w, c.h, (d) => d.circle(cx, cy, 13, bark), P.line));
      c.circle(cx, cy, 11, 0xcaa874);
      for (const r of [8, 5, 2]) c.circle(cx, cy, r, r % 2 ? P.woodLight : 0xcaa874, (x, y) => (x - cx) ** 2 + (y - cy) ** 2 > (r - 1) ** 2);
      for (const [ox, oy] of MARK.acorn) c.set(cx + ox, cy + oy + 1, P.woodDark);
      // a crosscut saw and a mallet hung on pegs
      c.rect(L + 32, up + 10, 2, 2, woodD);
      c.poly([[L + 34, up + 12], [L + 44, up + 12], [L + 44, up + 15], [L + 34, up + 22]], 0x9aa0a8);
      for (let x = L + 35; x < L + 44; x += 2) c.set(x, up + 16 + Math.floor((44 - x) / 2), 0x6a7078);
      c.rect(L + 44, up + 11, 3, 5, P.woodDark);
    },
    roofTop: ({ c, L, R, ridge }) => {
      // a stone chimney with a curl of smoke from the stove
      c.draw(part(c.w, c.h, (d) => d.rect(R - 30, ridge - 8, 9, 14, P.stoneShade), P.line));
      for (let y = ridge - 6; y < ridge + 6; y += 3) c.rect(R - 30 + ((y / 3) % 2) * 3, y, 3, 1, P.stoneDark);
      c.see(110, () => {
        c.circle(R - 25, ridge - 12, 2.5, 0xc8c0d0);
        c.circle(R - 21, ridge - 15, 2, 0xc8c0d0);
        c.circle(R - 16, ridge - 16, 1.5, 0xc8c0d0);
      });
      // the oak's leafy crown, spilling over the left of the roof
      const r = seeded(31);
      const clump = (x, y, rx, ry) => {
        c.draw(part(c.w, c.h, (d) => d.ellipse(x, y, rx, ry, 0x2c4a36), P.line));
        for (let k = 0; k < rx * ry * 0.6; k++) {
          const a = r() * Math.PI * 2;
          const d = Math.sqrt(r());
          const px = x + Math.cos(a) * d * (rx - 1.5);
          const py = y + Math.sin(a) * d * (ry - 1.5);
          c.ellipse(px, py, 1.5, 1, py < y - ry * 0.2 ? P.leafLight : py < y + ry * 0.3 ? P.leaf : P.leafDark);
        }
      };
      clump(L - 34, ridge + 6, 10, 7);
      clump(L + 30, ridge - 4, 12, 7);
      clump(L - 22, ridge - 4, 15, 10);
      clump(L + 8, ridge - 7, 16, 9);
      clump(L - 6, ridge - 9, 14, 8);
      clump(L - 14, ridge + 8, 13, 7);
      clump(L + 12, ridge + 4, 10, 5);
      for (const [x, y] of [[L - 24, ridge + 6], [L + 4, ridge - 4], [L + 24, ridge - 2]]) {
        c.rect(x, y, 2, 2, 0x8a5a30); // acorns
        c.set(x, y - 1, P.woodDark);
        c.set(x + 1, y - 1, P.woodDark);
      }
    },
    counter: ({ c, lights, box }) => {
      // a workbench with a half-carved chair leg in the vise, tools on the wall
      c.rect(box.x0 + 2, box.y0 + 10, box.x1 - box.x0 - 4, 1, P.woodDark); // tool rail
      for (const [x, h, col] of [[6, 8, 0x9aa0a8], [10, 6, P.woodDark], [14, 9, 0x9aa0a8], [19, 7, P.brick], [24, 8, P.woodDark]]) {
        c.rect(box.x0 + x, box.y0 + 11, 1, h, col);
        c.rect(box.x0 + x - 1, box.y0 + 11, 3, 1, col);
      }
      c.draw(part(c.w, c.h, (d) => {
        d.rect(box.x0 + 3, box.y0 + 22, 36, 3, 0xcaa874); // bench top
        d.rect(box.x0 + 5, box.y0 + 25, 2, 6, P.woodDark);
        d.rect(box.x0 + 35, box.y0 + 25, 2, 6, P.woodDark);
      }));
      c.rect(box.x0 + 30, box.y0 + 19, 5, 3, P.iron); // vise
      c.rect(box.x0 + 31, box.y0 + 13, 2, 6, P.woodLight); // the chair leg
      for (const x of [8, 13, 20]) c.set(box.x0 + x, box.y0 + 21, 0xe8cfa0); // shavings
      // a rocking horse and a stack of carved bowls
      const hx = box.x1 - 18;
      c.draw(part(c.w, c.h, (d) => {
        d.ellipse(hx, box.y0 + 20, 6, 3, 0xd8d0c4);
        d.ellipse(hx + 6, box.y0 + 15, 2.5, 2, 0xd8d0c4);
        d.line(hx + 4, box.y0 + 19, hx + 6, box.y0 + 15, 0xd8d0c4, 2);
        d.line(hx - 7, box.y0 + 28, hx + 7, box.y0 + 28, P.woodDark);
      }));
      c.rect(hx - 1, box.y0 + 18, 3, 1, P.red);
      c.line(hx - 4, box.y0 + 22, hx - 5, box.y0 + 27, P.woodDark);
      c.line(hx + 4, box.y0 + 22, hx + 5, box.y0 + 27, P.woodDark);
      lights.push([box.x0 + 20, box.y0 + 16, 12]);
    },
    onCounter: ({ c, box }) => {
      // carved bowls and a little wooden duck on the sill
      c.draw(part(c.w, c.h, (d) => {
        d.ellipse(box.x0 + 9, box.y1 - 2, 5, 2, P.woodLight, (x, y) => y >= box.y1 - 2);
        d.ellipse(box.x0 + 9, box.y1 - 4, 4, 1.5, 0xcaa874, (x, y) => y >= box.y1 - 4);
      }));
      c.draw(part(c.w, c.h, (d) => {
        d.ellipse(box.x1 - 14, box.y1 - 2, 4, 2, 0xd9a646);
        d.circle(box.x1 - 11, box.y1 - 5, 2, 0xd9a646);
      }));
      c.set(box.x1 - 9, box.y1 - 5, P.brick);
    },
    street: ({ c, H, R, L }) => {
      // a stack of logs, a sawhorse with a plank, and an axe in a stump
      const logs = [[R + 4, H - 4], [R + 12, H - 4], [R + 20, H - 4], [R + 8, H - 11], [R + 16, H - 11], [R + 12, H - 18]];
      for (const [x, y] of logs) {
        c.draw(part(c.w, c.h, (d) => d.circle(x, y, 4, bark), P.line));
        c.circle(x, y, 3, 0xcaa874);
        c.circle(x, y, 1.5, P.woodLight);
        c.set(x, y, P.woodDark);
      }
      c.draw(part(c.w, c.h, (d) => {
        d.line(L - 28, H - 1, L - 22, H - 12, P.woodLight, 2);
        d.line(L - 16, H - 1, L - 22, H - 12, P.woodLight, 2);
        d.rect(L - 36, H - 14, 28, 3, 0xcaa874);
      }));
      c.draw(part(c.w, c.h, (d) => d.rect(L + 12, H - 8, 10, 8, bark), P.line));
      c.ellipse(L + 17, H - 8, 5, 1.5, 0xcaa874);
      c.line(L + 16, H - 9, L + 21, H - 20, P.woodLight, 2); // axe handle
      c.draw(part(c.w, c.h, (d) => d.poly([[L + 13, H - 10], [L + 17, H - 12], [L + 16, H - 8]], 0x9aa0a8)));
      ferns(c, L + 34, H - 1, 6, 5);
    },
  });
}

export const SHOP_ART = {
  'shop-photobooth': shopPhotoBooth,
  'shop-pjs': shopPJs,
  'shop-furniture': shopFurniture,
  'shop-plants': shopPlants,
  'shop-clothes': shopClothes,
  'shop-woodshop': shopWoodshop,
};
