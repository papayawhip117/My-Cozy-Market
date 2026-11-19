// Little things that fill up the street between the shops: lamp posts,
// stone lanterns, crates, a bench, a vending machine and so on.
//
// Unlike the shops these are NOT trimmed: each prop is drawn centered in its
// picture, with the bottom row as the ground line. That way the game knows
// exactly where each lamp's light is (see LIGHTS in src/world/StreetProps.js:
// those numbers are pixels from the bottom-middle of the picture).
//
// FX are plain white shapes the game tints and fades at runtime: the soft
// glow around lamps, moonbeams, mist, falling leaves and paper lanterns.
import { Canvas } from './canvas.js';
import { P } from './palette.js';
import { seeded, part, ivy, ferns, pot } from './scenery.js';

// ================= PROPS =================

// Iron street lamp with a glass lantern, ivy climbing the post.
// The little crossbar near the top is where lantern garlands hang from.
function lampPost() {
  const W = 24;
  const H = 72;
  const c = new Canvas(W, H);
  const cx = 12;
  c.draw(part(W, H, (d) => {
    d.rect(cx - 1, 22, 3, 44, P.iron); // post
    d.rect(cx - 6, 26, 13, 2, P.iron); // crossbar
    d.rect(cx - 4, 62, 9, 4, P.iron); // base
    d.rect(cx - 5, 66, 11, 6, P.iron);
    d.rect(cx - 2, 18, 5, 4, P.iron); // collar
  }));
  c.rect(cx + 1, 23, 1, 39, 0x45454e); // moonlight on the post
  c.rect(cx - 4, 67, 9, 1, 0x45454e);
  // curly brackets under the crossbar
  for (const s of [-1, 1]) {
    c.set(cx + s * 4, 28, P.iron);
    c.set(cx + s * 3, 29, P.iron);
    c.set(cx + s * 2, 30, P.iron);
  }
  // lantern head: pointed cap, glowing glass, little finial
  c.draw(part(W, H, (d) => {
    d.poly([[cx - 6, 8], [cx + 7, 8], [cx + 0.5, 2]], P.iron);
    d.rect(cx - 4, 8, 9, 10, P.glow);
    d.rect(cx - 4, 14, 9, 4, P.glowWarm);
    d.rect(cx, 8, 1, 10, P.iron);
    d.rect(cx - 5, 17, 11, 1, P.iron);
  }, P.iron));
  c.set(cx, 0, P.iron);
  c.set(cx - 3, 9, P.white);
  ivy(c, cx - 1, 34, 66, 8, 2);
  ivy(c, cx + 2, 48, 66, 11, 1);
  ferns(c, cx - 7, H - 1, 6, 3);
  return c;
}

// A mossy stone shrine lantern (toro), glowing softly through its window.
function stoneLantern() {
  const W = 26;
  const H = 40;
  const c = new Canvas(W, H);
  const cx = 13;
  c.draw(part(W, H, (d) => {
    d.rect(cx - 8, 35, 17, 5, P.stoneShade); // base
    d.rect(cx - 3, 24, 7, 11, P.stone); // pillar
    d.rect(cx - 7, 21, 15, 3, P.stoneShade); // shelf
    d.rect(cx - 5, 12, 11, 9, P.stone); // light box
    d.poly([[cx - 11, 12], [cx + 12, 12], [cx + 6, 6], [cx - 5, 6]], P.stoneShade); // roof
    d.rect(cx - 1, 2, 3, 4, P.stone); // top knob
    d.circle(cx, 2, 2, P.stone);
  }, P.stoneDark));
  c.rect(cx - 3, 14, 7, 5, P.glowWarm); // window
  c.rect(cx - 2, 15, 5, 3, P.glow);
  c.rect(cx, 14, 1, 5, P.stoneDark);
  c.rect(cx + 2, 25, 1, 9, P.stoneShade); // shading
  c.rect(cx - 10, 12, 21, 1, P.stoneDark);
  // moss on the roof and base
  const r = seeded(5);
  for (let x = cx - 10; x <= cx + 11; x++) if (r() > 0.4) c.set(x, 11 - Math.floor(r() * 2), r() > 0.5 ? P.moss : P.mossLight);
  for (let x = cx - 8; x <= cx + 8; x++) if (r() > 0.5) c.set(x, 35 + Math.floor(r() * 3), P.moss);
  ferns(c, cx + 9, H - 1, 6, 7);
  return c;
}

// Plank crate, used for the stacked crates prop.
function crate(c, x, y, w, h) {
  c.draw(part(c.w, c.h, (d) => {
    d.rect(x, y, w, h, P.wood);
    for (let yy = y + 3; yy < y + h; yy += 4) d.rect(x, yy, w, 1, P.woodDark);
    d.rect(x, y, 2, h, P.woodDark);
    d.rect(x + w - 2, y, 2, h, P.woodDark);
    d.line(x + 2, y + h - 1, x + w - 3, y, P.woodLight);
  }));
}

// Market crates full of fruit and tea, with a burlap sack.
function crates() {
  const W = 46;
  const H = 30;
  const c = new Canvas(W, H);
  crate(c, 4, 14, 18, 16);
  crate(c, 22, 18, 16, 12);
  crate(c, 8, 2, 14, 12);
  // apples and matcha tins peeking out of the top crates
  for (let x = 10; x < 21; x += 3) {
    c.circle(x, 2, 1.5, P.red);
    c.set(x - 1, 1, 0xd07a5a);
  }
  for (let x = 24; x < 37; x += 4) {
    c.rect(x, 15, 3, 3, P.sage);
    c.set(x, 15, P.sageLight);
  }
  // sack slumped against the side
  c.draw(part(W, H, (d) => {
    d.ellipse(40, 24, 5, 6, 0xb09f82);
    d.rect(38, 16, 4, 3, 0xb09f82);
  }));
  c.rect(37, 19, 6, 1, P.woodDark); // tie
  c.set(39, 23, P.creamShade);
  c.set(41, 26, P.creamShade);
  // a little chalk price tag
  c.draw(part(W, H, (d) => d.rect(11, 18, 7, 5, 0x2e3a33)));
  c.rect(12, 20, 4, 1, P.white);
  return c;
}

// Barrel with flowers spilling over the top.
function barrel() {
  const W = 22;
  const H = 30;
  const c = new Canvas(W, H);
  const cx = 11;
  c.draw(part(W, H, (d) => {
    d.ellipse(cx, 19, 8, 11, P.wood, (x, y) => y >= 9 && y <= H - 1);
    d.rect(cx - 7, 9, 15, 2, P.woodDark);
  }));
  for (let x = cx - 7; x <= cx + 7; x += 3) c.rect(x, 11, 1, 18, P.woodDark);
  for (const y of [13, 24]) {
    for (let x = cx - 8; x <= cx + 8; x++) if (c.get(x, y) !== -1 && c.get(x, y) !== P.line) c.set(x, y, P.iron);
  }
  c.rect(cx + 4, 12, 2, 16, P.woodLight);
  // flowers and leaves
  const r = seeded(12);
  c.draw(part(W, H, (d) => {
    d.ellipse(cx, 8, 9, 5, P.leaf);
    d.ellipse(cx - 4, 6, 4, 3, P.leafDark);
  }, P.leafDark));
  for (let i = 0; i < 9; i++) {
    const x = cx - 7 + Math.floor(r() * 15);
    const y = 4 + Math.floor(r() * 6);
    c.set(x, y, [P.pink, P.white, P.lilac][i % 3]);
  }
  ivy(c, cx - 7, 10, 18, 4, 1);
  return c;
}

// Wooden bench with iron legs, and a little cat asleep on it.
function bench() {
  const W = 44;
  const H = 24;
  const c = new Canvas(W, H);
  c.draw(part(W, H, (d) => {
    d.rect(6, 17, 3, 7, P.iron);
    d.rect(35, 17, 3, 7, P.iron);
    d.rect(3, 14, 38, 3, P.wood); // seat
    d.rect(6, 6, 2, 9, P.iron);
    d.rect(36, 6, 2, 9, P.iron);
    d.rect(4, 6, 36, 2, P.wood); // backrest planks
    d.rect(4, 10, 36, 2, P.wood);
  }));
  c.rect(3, 14, 38, 1, P.woodLight);
  c.rect(4, 6, 36, 1, P.woodLight);
  // sleepy cat curled up
  c.draw(part(W, H, (d) => {
    d.ellipse(27, 11, 6, 3.5, 0x6e6a74);
    d.circle(21, 11, 3, 0x6e6a74);
    d.poly([[19, 9], [20, 6], [21, 9]], 0x6e6a74);
    d.poly([[22, 9], [23, 6], [24, 9]], 0x6e6a74);
    d.rect(29, 13, 6, 1, 0x6e6a74); // tail
  }));
  c.set(20, 11, P.line);
  c.set(22, 11, P.line);
  c.rect(25, 9, 5, 1, 0x8a8690);
  return c;
}

// Wooden signpost with arrows pointing to the shops, and a hanging lantern.
function signpost() {
  const W = 40;
  const H = 52;
  const c = new Canvas(W, H);
  const cx = 18;
  c.draw(part(W, H, (d) => d.rect(cx - 1, 6, 4, 46, P.woodDark)));
  const arrows = [[10, 1, P.pinkShade], [20, -1, P.sageShade], [30, 1, P.creamShade]];
  for (const [y, dir, col] of arrows) {
    const x0 = dir > 0 ? cx - 6 : cx - 12;
    const x1 = dir > 0 ? cx + 12 : cx + 8;
    c.draw(part(W, H, (d) => {
      d.rect(x0, y, x1 - x0, 6, col);
      if (dir > 0) d.poly([[x1, y - 1], [x1 + 5, y + 3], [x1, y + 7]], col);
      else d.poly([[x0, y - 1], [x0 - 5, y + 3], [x0, y + 7]], col);
    }));
    // painted "writing"
    for (let x = x0 + 2; x < x1 - 1; x += 2) c.set(x, y + 3, P.woodDark);
  }
  c.rect(cx - 2, 4, 6, 2, P.woodDark); // little cap
  ivy(c, cx, 30, 51, 9, 2);
  ferns(c, cx + 5, H - 1, 7, 2);
  return c;
}

// A retro tea vending machine, gone a bit mossy, its window glowing.
function vending() {
  const W = 30;
  const H = 48;
  const c = new Canvas(W, H);
  c.draw(part(W, H, (d) => {
    d.rect(2, 4, 26, 42, P.sageShade);
    d.rect(2, 46, 26, 2, P.iron); // feet
  }));
  c.rect(3, 5, 2, 40, P.sage);
  c.rect(26, 5, 1, 40, P.sageDark);
  // glowing sign on top
  c.rect(5, 6, 20, 5, P.glow);
  c.rect(7, 8, 16, 1, P.glowDeep);
  // display window with three shelves of bottles
  c.rect(5, 13, 20, 18, 0x2e3a33);
  c.rect(6, 14, 18, 16, 0xf3e3b0);
  const bottles = [P.sage, P.pink, P.lilac, P.glowWarm, P.mossLight, P.white];
  for (let row = 0; row < 3; row++) {
    const y = 15 + row * 5;
    for (let i = 0; i < 5; i++) {
      const col = bottles[(row * 2 + i) % bottles.length];
      c.rect(7 + i * 4, y + 1, 2, 3, col);
      c.set(7 + i * 4, y, col);
    }
    c.rect(6, y + 4, 18, 1, P.creamShade); // shelf
  }
  // buttons, coin slot and the pick-up flap
  for (let i = 0; i < 5; i++) c.set(8 + i * 4, 32, i % 2 ? P.red : P.glow);
  c.rect(21, 34, 3, 4, P.iron);
  c.set(22, 35, P.stone);
  c.rect(6, 39, 18, 5, P.iron);
  c.rect(7, 40, 16, 1, 0x45454e);
  // moss on top, ivy creeping up the side
  const r = seeded(14);
  for (let x = 2; x < 28; x++) if (r() > 0.35) c.set(x, 3 - Math.floor(r() * 2), r() > 0.5 ? P.moss : P.mossDark);
  ivy(c, 2, 20, 46, 6, 1);
  return c;
}

// Little roofed notice board with pinned papers and posters.
function noticeBoard() {
  const W = 40;
  const H = 44;
  const c = new Canvas(W, H);
  c.draw(part(W, H, (d) => {
    d.rect(6, 10, 3, 34, P.woodDark);
    d.rect(31, 10, 3, 34, P.woodDark);
    d.rect(5, 12, 30, 20, P.wood); // board
    d.poly([[1, 12], [39, 12], [33, 4], [7, 4]], P.brickDark); // little roof
  }));
  c.rect(7, 14, 26, 16, 0x7a5a40);
  const papers = [[9, 15, 7, 8, P.cream], [17, 16, 8, 6, P.pink], [26, 15, 6, 9, P.white], [12, 24, 9, 5, P.lilac], [23, 25, 7, 4, P.cream]];
  for (const [x, y, w, h, col] of papers) {
    c.rect(x, y, w, h, col);
    for (let yy = y + 2; yy < y + h - 1; yy += 2) c.rect(x + 1, yy, w - 3, 1, 0x9a8a78);
    c.set(x + Math.floor(w / 2), y, P.red); // pin
  }
  // moss on the roof edge
  const r = seeded(19);
  for (let x = 2; x < 38; x++) if (r() > 0.45) c.set(x, 12 + Math.floor(r() * 2), P.moss);
  ferns(c, 20, H - 1, 8, 6);
  return c;
}

// Stepped wooden plant stand covered in pots, with a trailing plant.
function plantStand() {
  const W = 44;
  const H = 34;
  const c = new Canvas(W, H);
  c.draw(part(W, H, (d) => {
    d.rect(4, 22, 36, 3, P.wood); // bottom shelf
    d.rect(10, 12, 24, 3, P.wood); // top shelf
    d.rect(5, 22, 2, 12, P.woodDark);
    d.rect(37, 22, 2, 12, P.woodDark);
    d.rect(11, 12, 2, 10, P.woodDark);
    d.rect(31, 12, 2, 10, P.woodDark);
  }));
  pot(c, 10, 21, P.leaf);
  pot(c, 22, 21, P.sageShade);
  pot(c, 34, 21, P.leafLight);
  pot(c, 16, 11, P.mossDark);
  pot(c, 28, 11, P.leaf);
  // trailing ivy off the shelves
  ivy(c, 33, 13, 22, 5, 1);
  ivy(c, 39, 24, 33, 2, 1);
  return c;
}

// A puddle on the path. The moon and lamplight shimmer in it.
function puddle() {
  const W = 40;
  const H = 6;
  const c = new Canvas(W, H);
  c.ellipse(20, 3, 19, 2.6, 0x26343c);
  c.ellipse(19, 2.5, 16, 1.8, 0x34505a);
  c.rect(13, 2, 9, 1, 0x7a92a0); // reflection streak
  c.rect(16, 3, 4, 1, 0xc8d6dc);
  c.set(27, 2, P.glowWarm);
  c.set(28, 3, P.glow);
  c.set(5, 3, 0x7a92a0);
  return c;
}

// ================= FX (white, tinted in-game) =================

// Soft round glow: solid in the middle fading to nothing at the edge.
function fxGlow() {
  const S = 64;
  const c = new Canvas(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x + 0.5 - S / 2, y + 0.5 - S / 2) / (S / 2);
      if (d >= 1) continue;
      c.set(x, y, 0xffffff, Math.round((1 - d) ** 2 * 255));
    }
  }
  return c;
}

// A slanted beam of moonlight, brightest at the top and fading downward.
function fxShaft() {
  const W = 70;
  const H = 230;
  const c = new Canvas(W, H);
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const left = 40 - t * 34; // leans left as it comes down
    const width = 14 + t * 22;
    for (let x = 0; x < W; x++) {
      const u = (x - left) / width;
      if (u < 0 || u > 1) continue;
      const edge = Math.sin(u * Math.PI); // soft sides
      const a = edge * (1 - t) ** 1.4 * 150;
      if (a >= 1) c.set(x, y, 0xffffff, Math.round(a));
    }
  }
  return c;
}

// A wide band of soft mist that tiles side to side.
function fxMist() {
  const W = 256;
  const H = 28;
  const c = new Canvas(W, H);
  const r = seeded(91);
  const puffs = [];
  for (let x = 0; x < W; x += 18 + Math.floor(r() * 20)) puffs.push([x, 12 + Math.floor(r() * 8), 24 + Math.floor(r() * 20)]);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let a = 0;
      for (const [px, py, rad] of puffs) {
        for (const ox of [-W, 0, W]) {
          const d = Math.hypot((x - px - ox) / rad, (y - py) / (rad * 0.35));
          if (d < 1) a = Math.max(a, (1 - d) ** 1.5);
        }
      }
      if (a > 0.02) c.set(x, y, 0xffffff, Math.round(a * 120));
    }
  }
  return c;
}

// A tiny falling leaf (two frames: flat and turned).
function fxLeaf() {
  const c = new Canvas(8, 3);
  c.rect(0, 1, 3, 1, 0xffffff);
  c.set(1, 0, 0xdddddd);
  c.set(2, 2, 0xbbbbbb);
  c.rect(5, 0, 1, 3, 0xffffff);
  c.set(6, 1, 0xbbbbbb);
  return c;
}

// A round paper lantern for the garlands strung between lamp posts.
function fxPaperLantern() {
  const c = new Canvas(5, 8);
  c.rect(1, 0, 3, 1, 0x555555); // cap
  c.rect(0, 1, 5, 5, 0xffffff);
  c.rect(0, 2, 5, 1, 0xdddddd); // ribs
  c.rect(0, 4, 5, 1, 0xdddddd);
  c.rect(1, 6, 3, 1, 0x555555);
  c.set(2, 7, 0x999999); // tassel
  return c;
}

// A four-point star that twinkles.
function fxStar() {
  const c = new Canvas(5, 5);
  c.set(2, 2, 0xffffff);
  for (const [x, y] of [[1, 2], [3, 2], [2, 1], [2, 3]]) c.set(x, y, 0xffffff, 170);
  for (const [x, y] of [[0, 2], [4, 2], [2, 0], [2, 4]]) c.set(x, y, 0xffffff, 60);
  return c;
}

export const PROPS = {
  'prop-lamppost': lampPost,
  'prop-stone-lantern': stoneLantern,
  'prop-crates': crates,
  'prop-barrel': barrel,
  'prop-bench': bench,
  'prop-signpost': signpost,
  'prop-vending': vending,
  'prop-noticeboard': noticeBoard,
  'prop-plants': plantStand,
  'prop-puddle': puddle,
};

export const FX = {
  'fx-glow': fxGlow,
  'fx-shaft': fxShaft,
  'fx-mist': fxMist,
  'fx-leaf': fxLeaf,
  'fx-paper-lantern': fxPaperLantern,
  'fx-star': fxStar,
};
