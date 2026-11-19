// Background layers for the street. These are not trimmed, and every layer
// except the sky tiles side to side (its left edge matches its right edge),
// so the game can repeat it along the whole street.
//
// Back to front (the far ones scroll slowest, see src/world/Background.js):
//   bg-sky         dusk sky: stars, wispy clouds and a big moon (fixed to the screen)
//   bg-castle      misty hills and far-off castle towers
//   bg-forest-far  pale, misty pines far away
//   bg-forest      dark treeline with a few lanterns
//   bg-grove       huge mossy trunks with hanging vines, close behind the shops
//   bg-bushes      near ferns, flowers and glowing mushrooms just behind the street
//   ground         grass edge + mossy cobblestone path (scrolls with the world)
//   fg-ferns       dark ferns in FRONT of everything, at the bottom of the screen
import { Canvas } from './canvas.js';
import { P } from './palette.js';

const W = 480;

function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Draw with fn(c, offsetX) three times so shapes crossing an edge wrap around.
function wrap(c, fn) {
  for (const ox of [-c.w, 0, c.w]) fn(c, ox);
}

// A drooping strand of vine / moss hanging from (x, y), `len` pixels long.
function strand(c, x, y, len, seed, color = 0x23392c, leaf = 0x2f4a36) {
  const r = seeded(seed);
  for (let i = 0; i < len; i++) {
    const vx = Math.round(x + Math.sin(i / 7 + seed) * 1.5);
    c.set(vx, y + i, color);
    if (r() > 0.6) c.set(vx + (r() > 0.5 ? 1 : -1), y + i, leaf);
  }
  c.set(x, y + len, leaf);
}

function sky() {
  const H = 270;
  const c = new Canvas(W, H);
  // Color bands from the top down, blended with a checker pattern (dithering).
  const bands = [0x121c28, 0x16232f, 0x1c2d3a, 0x22374a, 0x2a4250, 0x34505a, 0x45585f, 0x5e5f68, 0x7a6670, 0x96727a];
  const bandH = H / bands.length;
  for (let y = 0; y < H; y++) {
    const b = Math.min(bands.length - 1, Math.floor(y / bandH));
    const t = (y % bandH) / bandH;
    for (let x = 0; x < W; x++) {
      const next = bands[Math.min(bands.length - 1, b + 1)];
      // two steps of dithering: sparse checker, then full checker
      const useNext = (t > 0.55 && x % 2 === 0 && y % 2 === 0) || (t > 0.78 && (x + y) % 2 === 0);
      c.set(x, y, useNext ? next : bands[b]);
    }
  }

  // A faint band of the milky way, sweeping across the sky.
  const r = seeded(17);
  for (let i = 0; i < 900; i++) {
    const t = r();
    const x = Math.floor(t * W);
    const y = Math.floor(20 + t * 70 + (r() - 0.5) * 34 * (1 - Math.abs(t - 0.5)));
    c.see(26, () => c.set(x, y, 0xb8c8e0));
    if (r() > 0.9) c.see(90, () => c.set(x, y, 0xdce6f0));
  }

  // Stars: lots of tiny ones, some brighter, a few with sparkle crosses.
  for (let i = 0; i < 170; i++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(r() * r() * 150);
    const bright = r();
    c.set(x, y, bright > 0.85 ? P.glow : bright > 0.4 ? 0xc8d6dc : 0x7d93a0);
    if (bright > 0.93) {
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.set(x + ox, y + oy, 0x6d8590);
    }
  }

  // Wispy clouds, lit from below by the moon and the last of the sunset.
  for (const [cx, cy, len] of [[300, 70, 120], [70, 52, 90], [420, 96, 80], [180, 110, 140]]) {
    for (let k = 0; k < 3; k++) {
      const y = cy + k * 3;
      const x0 = cx - len / 2 + k * 9;
      const x1 = cx + len / 2 - k * 13;
      c.see(55, () => c.rect(Math.round(x0), y, Math.round(x1 - x0), 2, 0x3b4a5a));
      c.see(70, () => c.rect(Math.round(x0 + 6), y + 2, Math.round(x1 - x0 - 14), 1, 0x8a7480));
    }
  }

  // The moon: craters, a darker shaded edge and rings of soft light.
  const mx = 392;
  const my = 44;
  c.see(14, () => c.circle(mx, my, 34, 0xe8e0c8));
  c.see(18, () => c.circle(mx, my, 25, 0xe8e0c8));
  c.see(30, () => c.circle(mx, my, 18, 0xf0e6c8));
  c.circle(mx, my, 12, 0xe2d6b6);
  c.circle(mx - 1, my - 1, 11, 0xf3ead0);
  for (const [ox, oy, rad] of [[-4, -3, 2.5], [3, 3, 2], [-2, 5, 1.5], [5, -4, 1.2], [-6, 2, 1]]) {
    c.circle(mx + ox, my + oy, rad, 0xd8ccae);
    c.set(mx + ox - 1, my + oy - 1, 0xc9bc9c);
  }
  c.set(mx - 6, my - 6, 0xffffff);
  return c;
}

function castle() {
  const H = 140;
  const c = new Canvas(W, H);
  const hill = 0x2f444c;
  const far = 0x3a525a;
  const r = seeded(31);
  // far misty hills
  wrap(c, (c, ox) => {
    for (const [x, ry] of [[40, 40], [170, 52], [300, 44], [420, 48]]) c.ellipse(x + ox, H, 110, ry, far);
  });
  // castle silhouettes: towers with pointed roofs and lit windows
  const towers = [[70, 16, 70], [92, 12, 50], [110, 20, 86], [134, 14, 58], [300, 14, 60], [318, 18, 78], [338, 12, 48]];
  wrap(c, (c, ox) => {
    for (const [x, w, h] of towers) {
      const left = x + ox - w / 2;
      c.rect(left, H - h, w, h, hill);
      c.poly([[left - 2, H - h], [x + ox, H - h - w * 1.3], [left + w + 2, H - h]], hill);
      c.rect(x + ox, H - h - w * 1.3 - 5, 1, 5, hill); // flag pole
    }
    c.rect(70 + ox, H - 46, 70, 46, hill); // castle wall
    for (let x = 70; x < 140; x += 6) c.rect(x + ox, H - 49, 3, 3, hill); // battlements
    c.rect(296 + ox, H - 40, 46, 40, hill);
  });
  for (const [x, w, h] of towers) {
    for (let i = 0; i < 2; i++) {
      if (r() > 0.4) {
        const wx = Math.floor(x - 1 + (r() - 0.5) * (w - 6));
        const wy = H - h + 8 + Math.floor(r() * (h - 24));
        c.rect(wx, wy, 2, 3, P.glowWarm);
        c.see(40, () => c.circle(wx, wy + 1, 4, P.glowWarm));
      }
    }
  }
  // closer hills in front
  wrap(c, (c, ox) => {
    for (const [x, ry] of [[0, 26], [120, 34], [240, 24], [360, 32]]) c.ellipse(x + ox, H, 90, ry, hill);
  });
  // mist band
  c.see(50, () => c.rect(0, H - 22, W, 22, 0x5c6e72));
  return c;
}

function pine(c, x, base, h, color, dark) {
  for (let i = 0; i < 4; i++) {
    const top = base - h + i * (h / 5);
    const half = 4 + i * (h / 9);
    c.poly([[x - half, top + h / 4], [x, top], [x + half, top + h / 4]], i % 2 ? dark : color);
  }
  c.rect(x - 1, base - h / 4, 3, h / 4, dark);
}

// Pale pines far away, half hidden in mist (far things look lighter and bluer).
function forestFar() {
  const H = 120;
  const c = new Canvas(W, H);
  const col = 0x2f4a4e;
  const dark = 0x29403f;
  const r = seeded(37);
  const trees = [];
  for (let x = 0; x < W; x += 7 + Math.floor(r() * 10)) trees.push([x, 40 + Math.floor(r() * 60)]);
  wrap(c, (c, ox) => {
    c.rect(0, H - 26, W, 26, dark);
    for (const [x, h] of trees) pine(c, x + ox, H - 18, h, col, dark);
  });
  // mist rising between the trees
  c.see(36, () => c.rect(0, H - 40, W, 40, 0x6a7e80));
  c.see(30, () => c.rect(0, H - 22, W, 22, 0x7d8e8e));
  return c;
}

function forest() {
  const H = 110;
  const c = new Canvas(W, H);
  const col = 0x223830;
  const dark = 0x1a2c26;
  const r = seeded(41);
  const trees = [];
  for (let x = 0; x < W; x += 12 + Math.floor(r() * 14)) trees.push([x, 50 + Math.floor(r() * 50), r() > 0.45]);
  wrap(c, (c, ox) => {
    c.rect(0, H - 30, W, 30, dark);
    for (const [x, h, isPine] of trees) {
      if (isPine) pine(c, x + ox, H - 20, h, col, dark);
      else {
        c.rect(x + ox - 1, H - h / 2, 3, h / 2, dark);
        c.ellipse(x + ox, H - h * 0.6, 12 + h / 8, h / 3, col);
        c.ellipse(x + ox + 4, H - h * 0.55, 8, h / 5, dark);
      }
    }
  });
  // moonlight catching the right-hand edge of the leaves
  for (let y = 1; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (c.get(x, y) === col && c.get(x + 1, y) === -1 && r() > 0.4) c.set(x, y, 0x2e4a40);
    }
  }
  // a few distant lanterns glowing between the trees
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(r() * (W - 10)) + 5;
    const y = H - 24 - Math.floor(r() * 30);
    c.see(45, () => c.circle(x, y, 4, P.glowWarm));
    c.rect(x, y, 1, 2, P.glow);
  }
  return c;
}

// Huge old trees right behind the street: thick mossy trunks with flared
// roots, a dark canopy across the top of the screen, and vines hanging down.
function grove() {
  const H = 236;
  const c = new Canvas(W, H);
  const bark = 0x1a2721;
  const barkLit = 0x2a3c33; // moonlit side
  const barkDeep = 0x121c18;
  const leaf = 0x15231d;
  const leafLit = 0x223a2c;
  const r = seeded(71);
  const trunks = [[70, 22], [250, 16], [400, 26]];

  wrap(c, (c, ox) => {
    for (const [x, w] of trunks) {
      const tx = x + ox;
      // trunk, a little wider at the bottom
      c.poly([[tx - w / 2, 20], [tx + w / 2, 20], [tx + w / 2 + 4, H - 10], [tx - w / 2 - 4, H - 10]], bark);
      // flared roots
      c.poly([[tx - w / 2 - 4, H - 22], [tx - w / 2 - 16, H], [tx - w / 2 + 4, H]], bark);
      c.poly([[tx + w / 2 + 4, H - 22], [tx + w / 2 + 18, H], [tx + w / 2 - 4, H]], bark);
      c.rect(tx - w / 2 - 6, H - 10, w + 12, 10, bark);
      // a branch reaching out toward the canopy
      c.line(tx, 70, tx + w + 18, 34, bark, 4);
      c.line(tx, 90, tx - w - 14, 52, bark, 3);
    }
    // canopy: overlapping leaf clumps along the top
    for (let x = -10; x < W + 10; x += 26) {
      const y = ((x * 7) % 11) - 2;
      c.ellipse(x + ox, y, 26, 12, leaf);
    }
    for (const [x] of trunks) {
      c.ellipse(x + ox, 14, 46, 18, leaf);
      c.ellipse(x + ox + 30, 26, 24, 10, leaf);
      c.ellipse(x + ox - 26, 30, 20, 9, leaf);
    }
  });

  // bark texture: vertical grooves, moonlit right edge, moss near the roots
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (c.get(x, y) !== bark) continue;
      if (c.get(x + 2, y) === -1 || c.get(x + 1, y) === -1) c.set(x, y, barkLit);
      else if ((x * 3 + Math.floor(y / 9)) % 7 === 0) c.set(x, y, barkDeep);
      else if (y > H - 50 && r() > 0.86) c.set(x, y, r() > 0.5 ? 0x2c4a30 : 0x3a5a36);
    }
  }
  // leaf texture: light speckles on the tops of clumps, dark holes below
  for (let y = 1; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (c.get(x, y) !== leaf) continue;
      if (c.get(x, y - 2) === -1 && r() > 0.3) c.set(x, y, leafLit);
      else if (r() > 0.94) c.set(x, y, leafLit);
    }
  }

  // vines and moss hanging from the canopy (more near the trunks)
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(r() * W);
    let top = 0;
    while (top < 70 && c.get(x, top + 1) !== -1) top++;
    const len = 8 + Math.floor(r() * r() * 70);
    strand(c, x, top, len, i + 3);
    if (x < 6) strand(c, x + W, top, len, i + 3);
    if (x > W - 6) strand(c, x - W, top, len, i + 3);
  }

  // glowing shelf fungus and a hanging lantern on the trunks
  for (const [x, y] of [[62, 150], [80, 176], [244, 128], [410, 160], [394, 188]]) {
    c.rect(x - 2, y, 5, 1, 0x3d6a62);
    c.rect(x - 1, y - 1, 3, 1, P.spirit);
    c.see(40, () => c.circle(x, y, 5, P.spirit));
  }
  c.rect(286, 46, 1, 10, P.iron);
  c.rect(284, 56, 5, 6, P.glowWarm);
  c.rect(285, 57, 3, 3, P.glow);
  c.rect(283, 55, 7, 1, P.iron);
  c.rect(283, 62, 7, 1, P.iron);
  c.see(30, () => c.circle(286, 59, 14, P.glowWarm));
  c.see(45, () => c.circle(286, 59, 7, P.glowWarm));
  return c;
}

function bushes() {
  const H = 44;
  const c = new Canvas(W, H);
  const col = 0x1c2e27;
  const light = 0x27403a;
  const r = seeded(51);
  const blobs = [];
  for (let x = 0; x < W; x += 10 + Math.floor(r() * 16)) blobs.push([x, 8 + Math.floor(r() * 14)]);
  wrap(c, (c, ox) => {
    c.rect(0, H - 8, W, 8, col);
    for (const [x, rad] of blobs) {
      c.ellipse(x + ox, H - 6, rad, rad * 0.9, col);
      c.ellipse(x + ox - 2, H - 8, rad * 0.6, rad * 0.5, light);
    }
  });
  // leafy texture
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (c.get(x, y) === col && r() > 0.92) c.set(x, y, light);
      if (c.get(x, y) === light && r() > 0.9) c.set(x, y, 0x31503f);
    }
  }
  // fern fronds poking up
  for (let x = 4; x < W - 4; x += 9 + Math.floor(r() * 9)) {
    const h = 6 + Math.floor(r() * 8);
    for (let i = 0; i < h; i++) c.set(x + Math.round((i * i) / 30), H - 12 - i, light);
  }
  // little flowers dotted through the bushes
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(r() * W);
    const y = H - 4 - Math.floor(r() * 14);
    if (c.get(x, y) === -1) continue;
    c.set(x, y, [P.pinkShade, P.lilacShade, 0xb8b0a0][Math.floor(r() * 3)]);
  }
  // glowing spirit mushrooms at the roots
  for (let i = 0; i < 6; i++) {
    const x = 6 + Math.floor(r() * (W - 12));
    c.rect(x, H - 4, 1, 3, 0x9a9488);
    c.rect(x - 1, H - 5, 3, 1, P.plum);
    c.set(x, H - 6, P.spirit);
    c.see(36, () => c.circle(x, H - 5, 4, P.spirit));
  }
  return c;
}

function ground() {
  const TW = 128;
  const H = 40;
  const c = new Canvas(TW, H);
  const r = seeded(61);
  // soil and grass
  c.rect(0, 0, TW, H, 0x2a3a2c);
  c.rect(0, 0, TW, 9, 0x34503a);
  for (let x = 0; x < TW; x++) {
    if (r() > 0.5) c.set(x, 0, 0x4a6a44);
    if (r() > 0.6) c.set(x, 1, 0x4a6a44);
    if (r() > 0.85) c.set(x, 2, P.moss);
    if (r() > 0.8) c.set(x, 4 + Math.floor(r() * 4), 0x2c4632); // grass shadows
  }
  // tiny flowers and clover in the grass
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(r() * TW);
    const y = 2 + Math.floor(r() * 5);
    c.set(x, y, [P.white, P.pink, P.lilac, P.glow][Math.floor(r() * 4)]);
    c.set(x, y + 1, P.leafDark);
  }
  // cobblestone path: rows of rounded stones of different sizes, edges overgrown
  const mortar = 0x262328;
  c.rect(0, 9, TW, 17, mortar);
  const rows = [[10, 0, 4], [15, 3, 4], [20, 1, 5]];
  for (const [y, off, h] of rows) {
    let x = -off;
    while (x < TW) {
      const w = 5 + Math.floor(r() * 4);
      const col = [0x6e6a68, 0x625e5e, 0x7a7470, 0x5c6460][Math.floor(r() * 4)];
      c.rect(x + 1, y, w, h, col);
      c.set(x + 1, y, mortar);
      c.set(x + w, y + h - 1, mortar);
      c.rect(x + 2, y, w - 3, 1, 0x8f8a86); // light on top
      c.rect(x + 2, y + h - 1, w - 2, 1, 0x4f4c4d); // shadow underneath
      if (r() > 0.55) c.set(x + 2 + Math.floor(r() * (w - 2)), y + h - 1, P.mossDark);
      if (r() > 0.85) c.set(x + 2 + Math.floor(r() * (w - 2)), y + 1, 0x9c9690); // moonlit glint
      x += w + 1;
    }
  }
  // moss creeping into the cracks, and a few fallen leaves
  for (let x = 0; x < TW; x++) {
    if (r() > 0.5) c.set(x, 9, P.mossDark);
    if (r() > 0.7) c.set(x, 10, P.moss);
    if (r() > 0.5) c.set(x, 25, P.mossDark);
    for (const y of [14, 19]) if (c.get(x, y) === mortar && r() > 0.6) c.set(x, y, P.mossDark);
  }
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(r() * (TW - 2));
    const y = 11 + Math.floor(r() * 13);
    const col = [0xa8623a, 0x8f4f3f, 0xb98a3e][Math.floor(r() * 3)];
    c.set(x, y, col);
    c.set(x + 1, y, col);
  }
  // darker earth below the path, with little pebbles and roots
  c.rect(0, 26, TW, 14, 0x223024);
  for (let i = 0; i < 18; i++) c.set(Math.floor(r() * TW), 28 + Math.floor(r() * 11), r() > 0.5 ? 0x34503a : 0x2d2a26);
  return c;
}

// Dark ferns and grass along the very bottom of the screen. The game draws
// this layer IN FRONT of the player and moves it a bit faster than the
// world, so it feels like you're looking through the plants.
function foreground() {
  const H = 34;
  const c = new Canvas(W, H);
  const dark = 0x0e1712;
  const mid = 0x152219;
  const r = seeded(81);
  // clumps with gaps between them, so the path still shows
  for (let x = 10; x < W - 10; x += 40 + Math.floor(r() * 50)) {
    const size = 12 + Math.floor(r() * 14);
    for (let f = -3; f <= 3; f++) {
      const tipX = x + f * size * 0.5;
      const tipY = H - size + Math.abs(f) * 3;
      for (let s = 0; s <= size; s++) {
        const t = s / size;
        const fx = Math.round(x + (tipX - x) * t + f * t * t * 3);
        const fy = Math.round(H - (H - tipY) * t);
        c.set(fx, fy, f % 2 ? mid : dark);
        if (s % 2 === 0 && s > 2) {
          c.set(fx - 1, fy + 1, dark);
          c.set(fx + 1, fy + 1, mid);
        }
      }
    }
    // tall grass blades beside the fern
    for (let g = 0; g < 5; g++) {
      const gx = x + size + 2 + g * 2;
      const gh = 6 + Math.floor(r() * 12);
      for (let i = 0; i < gh; i++) c.set(gx + Math.round((i * i) / 60), H - 1 - i, dark);
    }
    if (r() > 0.6) {
      // a glowing mushroom peeking out
      const mx = x - size / 2;
      c.rect(mx, H - 5, 1, 5, 0x3a3a36);
      c.rect(mx - 2, H - 7, 5, 2, 0x2a2240);
      c.set(mx, H - 8, P.spirit);
      c.see(40, () => c.circle(mx, H - 6, 5, P.spirit));
    }
  }
  c.rect(0, H - 3, W, 3, dark);
  return c;
}

export const BACKGROUND = {
  'bg-sky': sky,
  'bg-castle': castle,
  'bg-forest-far': forestFar,
  'bg-forest': forest,
  'bg-grove': grove,
  'bg-bushes': bushes,
  ground,
  'fg-ferns': foreground,
};
