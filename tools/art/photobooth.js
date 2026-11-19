// Art for the photo booth (src/scenes/PhotoBoothScene.js):
//   backdrop-<id>   the painted scenes you stand in front of (80 x 60,
//                   the game shows them 3x bigger, same pixel size as your pal)
//   booth-stickers  little doodles that float around you in the photo
//                   (one 12 x 12 frame each, see STICKERS below)
//
// The floor in every backdrop starts around y = 50, which is where your
// pal's feet go. Want another backdrop? Add a function here, put it in
// BOOTH at the bottom, and add it to BACKDROPS in src/scenes/PhotoBoothScene.js.
import { Canvas } from './canvas.js';
import { P } from './palette.js';
import { seeded, part, glow } from './scenery.js';

const W = 80;
const H = 60;

// Bands of color from top to bottom, with a dithered (checkered) row where
// two bands meet so the sky fades softly instead of in hard stripes.
function sky(c, bands) {
  let y = 0;
  bands.forEach(([color, h], i) => {
    c.rect(0, y, W, h, color);
    const next = bands[i + 1];
    if (next) for (let x = 0; x < W; x += 2) c.set(x + ((y + h) % 2), y + h - 1, next[0]);
    y += h;
  });
}

// Twinkly stars: single pixels, a few with a little cross of light.
function stars(c, n, seed, maxY, colors = [P.white, P.glow, 0xc8d0f0]) {
  const r = seeded(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(r() * maxY);
    const col = colors[Math.floor(r() * colors.length)];
    c.set(x, y, col);
    if (r() > 0.88) {
      c.see(120, () => {
        c.set(x - 1, y, col);
        c.set(x + 1, y, col);
        c.set(x, y - 1, col);
        c.set(x, y + 1, col);
      });
    }
  }
}

// A row of pine trees standing on `base`.
function pines(c, base, color, seed, minH, maxH, gap) {
  const r = seeded(seed);
  for (let x = -4; x < W + 4; x += gap + Math.floor(r() * 4)) {
    const h = minH + Math.floor(r() * (maxH - minH));
    const w = Math.round(h * 0.42);
    c.poly([[x - w, base], [x + w, base], [x, base - h]], color);
  }
}

// Grass on the ground with tiny flowers dotted through it.
function meadow(c, top, seed, flowers = [P.pink, P.white, P.glow]) {
  const r = seeded(seed);
  c.rect(0, top, W, H - top, P.leafDark);
  c.rect(0, top, W, 2, P.leaf);
  for (let x = 0; x < W; x++) {
    if (r() > 0.5) c.set(x, top - 1, P.leaf);
    if (r() > 0.8) c.set(x, top - 2, P.leafLight);
  }
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(r() * W);
    const y = top + 2 + Math.floor(r() * (H - top - 2));
    c.set(x, y, r() > 0.5 ? P.leaf : P.fern);
    if (r() > 0.55) c.set(x, y - 1, flowers[Math.floor(r() * flowers.length)]);
  }
}

// Glowing specks of light (fireflies / sparkles).
function fireflies(c, n, seed, top, bottom, color = P.spirit) {
  const r = seeded(seed);
  for (let i = 0; i < n; i++) {
    const x = 3 + Math.floor(r() * (W - 6));
    const y = top + Math.floor(r() * (bottom - top));
    c.see(70, () => c.circle(x, y, 2, color));
    c.set(x, y, P.white);
  }
}

// ---------- the backdrops ----------

// Dusk in the woods: a violet-to-peach sky, the moon, layers of pine trees.
function dusk() {
  const c = new Canvas(W, H);
  sky(c, [[0x2e2646, 10], [0x45375e, 9], [0x6e5682, 8], [0x9c7a97, 7], [0xd09a8e, 6], [0xe8b48e, 20]]);
  stars(c, 18, 3, 20);
  c.circle(62, 11, 5, P.white);
  c.circle(64, 10, 4, 0xd8d0c0); // the moon's shadowy side
  c.circle(62, 11, 5, P.white, (x) => x < 61);
  glow(c, 62, 11, 12, P.glow);
  pines(c, 46, 0x4a4466, 7, 10, 18, 7);
  pines(c, 49, 0x2f3346, 11, 14, 26, 9);
  // big dark trees framing the left and right edges
  c.poly([[-6, 52], [14, 52], [4, 8]], 0x1e2430);
  c.poly([[64, 52], [86, 52], [76, 4]], 0x1e2430);
  meadow(c, 50, 5);
  fireflies(c, 7, 9, 22, 48);
  return c;
}

// A lantern-lit night market: paper lanterns strung over a wooden boardwalk.
function lanterns() {
  const c = new Canvas(W, H);
  sky(c, [[0x161a2e, 14], [0x1f2240, 14], [0x2c2a4a, 32]]);
  stars(c, 14, 21, 18);
  // rooftops of the market across the way
  const roofs = [[0, 34, 18], [16, 30, 22], [36, 33, 16], [50, 28, 20], [68, 32, 14]];
  for (const [x, y, w] of roofs) {
    c.rect(x, y, w, 50 - y, 0x252840);
    c.poly([[x - 3, y], [x + w + 3, y], [x + w - 2, y - 5], [x + 2, y - 5]], 0x34304e);
    c.rect(x + 4, y + 5, 3, 3, P.glowWarm); // a lit window
    c.see(60, () => c.rect(x + 3, y + 4, 5, 5, P.glow));
  }
  // two strings of lanterns, sagging
  const colors = [0xe89aa0, P.glow, 0xb9a3d9, P.glowWarm, 0x9fd6b8];
  for (const [y0, sag, seed] of [[6, 7, 0], [16, 5, 2]]) {
    for (let x = 0; x < W; x++) c.set(x, y0 + Math.round(sag * 4 * (x / W) * (1 - x / W)), 0x5a4a40);
    for (let i = 0; i < 6; i++) {
      const x = 6 + i * 14 + (seed ? 7 : 0);
      if (x > W - 3) continue;
      const y = y0 + Math.round(sag * 4 * (x / W) * (1 - x / W)) + 1;
      const col = colors[(i + seed) % colors.length];
      glow(c, x, y + 3, 7, col);
      c.draw(part(W, H, (d) => d.ellipse(x, y + 3, 2, 3, col), P.woodDark));
      c.set(x, y + 2, P.white);
    }
  }
  // the boardwalk
  c.rect(0, 50, W, H - 50, P.wood);
  for (let y = 50; y < H; y += 3) c.rect(0, y, W, 1, P.woodDark);
  for (let y = 51, k = 0; y < H; y += 3, k++) for (let x = (k * 7) % 13; x < W; x += 13) c.set(x, y, P.woodDark);
  c.rect(0, 50, W, 1, P.woodLight);
  c.see(50, () => c.rect(0, 51, W, 3, P.glowWarm)); // lantern light on the boards
  return c;
}

// Inside a cozy cafe: a warm wall, a window onto the night, a hanging lamp.
function cafe() {
  const c = new Canvas(W, H);
  c.rect(0, 0, W, H, 0xd8b890); // warm plaster
  for (let y = 2; y < 36; y += 6) for (let x = (y / 6) % 2 ? 3 : 0; x < W; x += 6) c.set(x, y, 0xc8a47c); // little wallpaper dots
  c.rect(0, 36, W, 14, P.woodLight); // wood panels on the lower wall
  for (let x = 0; x < W; x += 8) c.rect(x, 36, 1, 14, P.wood);
  c.rect(0, 36, W, 2, P.woodDark);
  // the window
  c.draw(part(W, H, (d) => d.rect(6, 8, 24, 22, 0x26304e), P.woodDark));
  stars(c, 6, 31, 22);
  for (let i = 0; i < 6; i++) c.set(8 + ((i * 7) % 20), 10 + ((i * 5) % 18), P.white);
  c.circle(24, 13, 3, P.white);
  c.circle(25, 12, 2, 0x26304e);
  c.rect(17, 8, 2, 22, P.woodDark);
  c.rect(6, 18, 24, 2, P.woodDark);
  c.rect(4, 30, 28, 2, P.woodLight); // window sill, with a little plant
  c.rect(8, 27, 4, 3, P.brick);
  c.set(9, 26, P.leaf);
  c.set(11, 25, P.leafLight);
  c.set(10, 24, P.leaf);
  // a shelf of cups and jars on the right
  c.rect(52, 20, 24, 2, P.woodDark);
  const cups = [[54, P.white], [59, P.pink], [64, P.sage], [69, P.glowWarm]];
  for (const [x, col] of cups) {
    c.rect(x, 16, 4, 4, col);
    c.set(x + 4, 17, col);
  }
  // the hanging lamp, with its glow
  c.rect(42, 0, 1, 6, P.iron);
  c.poly([[37, 11], [48, 11], [45, 6], [40, 6]], P.gold);
  c.rect(40, 11, 5, 1, P.glow);
  glow(c, 42, 13, 18, P.glow);
  // wooden floor
  c.rect(0, 50, W, H - 50, P.wood);
  for (let y = 52; y < H; y += 3) c.rect(0, y, W, 1, P.woodDark);
  c.rect(0, 50, W, 1, P.woodDark);
  // a big potted plant in the corner
  c.draw(part(W, H, (d) => d.rect(68, 44, 9, 7, P.brick)));
  c.draw(part(W, H, (d) => {
    d.ellipse(72, 38, 6, 6, P.leaf);
    d.ellipse(68, 33, 3, 4, P.leafLight);
    d.ellipse(76, 34, 3, 4, P.leaf);
  }, P.leafDark));
  return c;
}

// A clear night full of stars: the Milky Way, a crescent moon, a grassy hill.
function starry() {
  const c = new Canvas(W, H);
  sky(c, [[0x101530, 16], [0x161c3e, 16], [0x20284e, 28]]);
  // the Milky Way: a soft band of light across the sky
  for (let x = 0; x < W; x++) {
    const y = Math.round(40 - x * 0.45);
    c.see(40, () => c.rect(x, y - 5, 1, 10, 0x6a6aa8));
    c.see(40, () => c.rect(x, y - 2, 1, 4, 0x9f9ad0));
  }
  stars(c, 70, 41, 46);
  stars(c, 30, 43, 46, [P.white]);
  // a shooting star
  for (let i = 0; i < 8; i++) c.see(255 - i * 28, () => c.set(18 + i, 8 + Math.round(i / 2), P.white));
  // the crescent moon
  c.circle(64, 12, 6, P.glow);
  c.circle(67, 10, 5, 0x101530);
  glow(c, 62, 13, 10, P.glow);
  // a dark hill with grass on top
  c.ellipse(40, 66, 56, 18, 0x15201e);
  meadow(c, 52, 13, [P.white, 0xb9a3d9]);
  c.ellipse(40, 66, 56, 18, P.leafDark, (x, y) => y >= 52);
  return c;
}

// A field of flowers at sunset: soft pink sky, rolling hills, blooms everywhere.
function flowers() {
  const c = new Canvas(W, H);
  sky(c, [[0x7e6aa6, 9], [0x9f8cc0, 8], [0xc99aa6, 8], [0xe8b4b8, 7], [0xf3d0a8, 18]]);
  // the sun sinking behind the hills, and a couple of soft clouds
  glow(c, 40, 40, 16, P.glow);
  c.circle(40, 40, 6, 0xfff0c8);
  for (const [x, y, w] of [[8, 12, 14], [52, 8, 18], [30, 20, 10]]) {
    c.rect(x, y, w, 2, 0xf2dce0);
    c.rect(x + 2, y - 1, w - 5, 1, 0xf2dce0);
  }
  // rolling hills, far to near
  c.ellipse(16, 52, 36, 12, P.sageLight);
  c.ellipse(70, 54, 34, 12, P.sage);
  c.rect(0, 46, W, H - 46, P.sageShade);
  c.ellipse(40, 66, 60, 20, P.leaf);
  // flowers: tiny and sparse far away, bigger and thicker up close
  const r = seeded(57);
  const cols = [P.pink, P.white, P.glow, 0xb9a3d9, 0xe89aa0];
  for (let i = 0; i < 160; i++) {
    const y = 44 + Math.floor(r() * (H - 44));
    const x = Math.floor(r() * W);
    if (c.get(x, y) === -1) continue;
    const col = cols[Math.floor(r() * cols.length)];
    c.set(x, y, col);
    if (y > 52 && r() > 0.4) {
      c.set(x - 1, y, col);
      c.set(x + 1, y, col);
      c.set(x, y - 1, col);
      c.set(x, y + 1, col);
      c.set(x, y, P.gold); // the middle
    }
  }
  // grass blades in front
  for (let x = 0; x < W; x += 2) c.set(x + (x % 3 === 0 ? 1 : 0), H - 1 - (x % 4 === 0 ? 1 : 0), P.leafDark);
  return c;
}

// A soft pink photo studio, like a real booth: plain backdrop with faint
// sparkles printed on it, and a light spot on the floor.
function studio() {
  const c = new Canvas(W, H);
  sky(c, [[0xd09aac, 12], [0xd9a8b8, 14], [0xe2b6c2, 24], [0xc890a4, 10]]);
  for (let y = 4; y < 48; y += 8) {
    for (let x = (y / 8) % 2 ? 6 : 2; x < W; x += 9) {
      c.see(110, () => {
        c.set(x, y, P.white);
        c.set(x - 1, y, 0xf2dce0);
        c.set(x + 1, y, 0xf2dce0);
        c.set(x, y - 1, 0xf2dce0);
        c.set(x, y + 1, 0xf2dce0);
      });
    }
  }
  c.see(90, () => c.ellipse(40, 54, 26, 4, 0xf2dce0)); // a spot of light on the floor
  return c;
}

// ---------- stickers ----------

const S = 12; // each sticker is 12 x 12

function sticker(fn, line = P.line) {
  return part(S, S, fn, line);
}

// In the order PhotoBoothScene's STICKERS list uses them.
const STICKERS = [
  // heart
  () => sticker((d) => {
    d.circle(4, 4.5, 2.6, 0xe8798e);
    d.circle(7.5, 4.5, 2.6, 0xe8798e);
    d.poly([[1.5, 5], [10, 5], [5.8, 10]], 0xe8798e);
    d.set(3, 3, 0xffd0d8);
  }),
  // big soft sparkle (four points, pink-white)
  () => sticker((d) => {
    d.poly([[6, 0], [7.4, 4.6], [12, 6], [7.4, 7.4], [6, 12], [4.6, 7.4], [0, 6], [4.6, 4.6]], 0xffd6e0);
    d.rect(5, 5, 2, 2, P.white);
  }, 0xe8a0b4),
  // three tiny twinkles
  () => {
    const c = new Canvas(S, S);
    const tw = (x, y, col) => {
      for (const [ox, oy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) c.set(x + ox, y + oy, col);
      c.set(x, y, P.white);
    };
    tw(3, 3, P.glow);
    tw(8, 5, 0xffd6e0);
    tw(4, 9, 0xc8d0f0);
    return c;
  },
  // star
  () => sticker((d) => {
    d.poly([[6, 0.5], [7.6, 4.4], [11.5, 4.6], [8.5, 7.2], [9.6, 11.2], [6, 9], [2.4, 11.2], [3.5, 7.2], [0.5, 4.6], [4.4, 4.4]], P.glow);
    d.set(5, 4, P.white);
  }, P.glowDeep),
  // music note
  () => sticker((d) => {
    d.ellipse(4, 9, 2.4, 1.8, 0xb9a3d9);
    d.rect(6, 2, 1, 7, 0xb9a3d9);
    d.rect(6, 2, 4, 2, 0xb9a3d9);
  }, P.plum),
  // zzz
  () => {
    const c = new Canvas(S, S);
    const z = (x, y, s) => {
      c.rect(x, y, s, 1, 0xc8d0f0);
      for (let i = 1; i < s - 1; i++) c.set(x + s - 1 - i, y + i, 0xc8d0f0);
      c.rect(x, y + s - 1, s, 1, 0xc8d0f0);
    };
    z(1, 6, 5);
    z(6, 1, 4);
    return c.outline(P.plum);
  },
  // daisy
  () => sticker((d) => {
    for (const [x, y] of [[6, 3], [9, 6], [6, 9], [3, 6]]) d.circle(x, y, 2, P.white);
    d.circle(6, 6, 1.6, P.gold);
  }, P.pinkShade),
  // little sprout in a pot
  () => sticker((d) => {
    d.rect(3, 8, 6, 3, P.brick);
    d.rect(2, 7, 8, 1, 0xb0654f);
    d.rect(6, 3, 1, 4, P.leaf);
    d.ellipse(4, 3.5, 2, 1.4, P.leafLight);
    d.ellipse(8.5, 2.5, 2, 1.4, P.leaf);
  }, P.leafDark),
  // mushroom
  () => sticker((d) => {
    d.rect(5, 6, 3, 5, P.white);
    d.ellipse(6, 5, 5, 3.5, 0xd96c5f, (x, y) => y <= 6);
    d.set(4, 3, P.white);
    d.set(8, 4, P.white);
    d.set(6, 2, P.white);
  }, P.redDark),
  // bow
  () => sticker((d) => {
    d.poly([[0.5, 2.5], [5.5, 5.5], [0.5, 9.5]], 0xe8a0b4);
    d.poly([[11.5, 2.5], [6.5, 5.5], [11.5, 9.5]], 0xe8a0b4);
    d.rect(5, 4, 2, 3, 0xd07890);
  }, P.pinkDark),
];

function stickerSheet() {
  const out = new Canvas(S * STICKERS.length, S);
  STICKERS.forEach((draw, i) => out.draw(draw(), i * S, 0));
  return out;
}

export const BOOTH = {
  'backdrop-dusk': dusk,
  'backdrop-studio': studio,
  'backdrop-lanterns': lanterns,
  'backdrop-cafe': cafe,
  'backdrop-starry': starry,
  'backdrop-flowers': flowers,
  'booth-stickers': stickerSheet,
};
