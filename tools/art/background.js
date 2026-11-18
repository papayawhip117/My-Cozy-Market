// Background layers for the street. These are not trimmed, and every layer
// except the sky tiles side to side (its left edge matches its right edge),
// so the game can repeat it along the whole street.
//
//   bg-sky     dusk sky with stars and a moon (fixed to the screen)
//   bg-castle  misty hills and far-off castle towers (scroll slowly)
//   bg-forest  dark treeline with a few lanterns (scroll a bit faster)
//   bg-bushes  near ferns and bushes just behind the street
//   ground     grass edge + mossy cobblestone path (scrolls with the world)
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

function sky() {
  const H = 270;
  const c = new Canvas(W, H);
  // Color bands from the top down, blended with a checker pattern (dithering).
  const bands = [0x16232f, 0x1c2d3a, 0x243a46, 0x2e4950, 0x3e5658, 0x5a5f66, 0x7a6670, 0x96727a];
  const bandH = H / bands.length;
  for (let y = 0; y < H; y++) {
    const b = Math.min(bands.length - 1, Math.floor(y / bandH));
    const t = (y % bandH) / bandH;
    for (let x = 0; x < W; x++) {
      const next = bands[Math.min(bands.length - 1, b + 1)];
      const useNext = t > 0.75 && (x + y) % 2 === 0;
      c.set(x, y, useNext ? next : bands[b]);
    }
  }
  const r = seeded(17);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(r() * r() * 130);
    c.set(x, y, r() > 0.8 ? P.glow : 0xc8d6dc);
    if (r() > 0.92) {
      c.set(x - 1, y, 0x6d8590);
      c.set(x + 1, y, 0x6d8590);
      c.set(x, y - 1, 0x6d8590);
      c.set(x, y + 1, 0x6d8590);
    }
  }
  // moon with a soft halo
  c.see(20, () => c.circle(392, 44, 22, 0xe8e0c8));
  c.see(30, () => c.circle(392, 44, 15, 0xe8e0c8));
  c.circle(392, 44, 9, 0xf0e6c8);
  c.circle(389, 42, 2, 0xd8ccae);
  c.circle(395, 47, 1.5, 0xd8ccae);
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
  // a few distant lanterns glowing between the trees
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(r() * (W - 10)) + 5;
    const y = H - 24 - Math.floor(r() * 30);
    c.see(45, () => c.circle(x, y, 4, P.glowWarm));
    c.rect(x, y, 1, 2, P.glow);
  }
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
  // fern fronds poking up
  for (let x = 4; x < W; x += 9 + Math.floor(r() * 9)) {
    const h = 6 + Math.floor(r() * 8);
    for (let i = 0; i < h; i++) c.set(x + Math.round((i * i) / 30), H - 12 - i, light);
  }
  return c;
}

function ground() {
  const TW = 64;
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
  }
  // cobblestone path: rows of rounded stones, edges overgrown
  c.rect(0, 9, TW, 17, 0x262328);
  const rows = [[10, 0], [15, 4], [20, 1]];
  for (const [y, off] of rows) {
    for (let x = -off; x < TW; x += 8) {
      const col = [0x6e6a68, 0x625e5e, 0x7a7470][Math.floor(r() * 3)];
      c.rect(x + 1, y, 6, 4, col);
      c.set(x + 1, y, 0x262328);
      c.set(x + 6, y + 3, 0x262328);
      c.set(x + 2, y, 0x8f8a86); // highlight
      if (r() > 0.6) c.set(x + 3 + Math.floor(r() * 3), y + 3, P.mossDark);
    }
  }
  for (let x = 0; x < TW; x++) {
    if (r() > 0.5) c.set(x, 9, P.mossDark);
    if (r() > 0.5) c.set(x, 25, P.mossDark);
  }
  // darker earth below the path, with little pebbles
  c.rect(0, 26, TW, 14, 0x223024);
  for (let i = 0; i < 10; i++) c.set(Math.floor(r() * TW), 28 + Math.floor(r() * 11), 0x34503a);
  return c;
}

export const BACKGROUND = {
  'bg-sky': sky,
  'bg-castle': castle,
  'bg-forest': forest,
  'bg-bushes': bushes,
  ground,
};
