// The inside of your home: a cozy room in the dusk forest.
//
//   home-wall       wallpaper + wood panels + ceiling beam (tiles side to side)
//   home-floor      wooden floorboards (tiles side to side)
//   home-window     arched window looking out at the moonlit forest
//   home-fireplace  mossy stone fireplace with a crackling fire (and its
//                   chimney, which goes all the way up to the ceiling)
//   home-door       the front door (on the left wall)
//   home-lantern    a lantern hanging from the ceiling on a chain
//   (the dresser is drawn in 3D with the furniture: tools/art/furniture.js)
//   home-slot-floor / home-slot-wall
//                   dotted outlines showing where furniture can go later
import { Canvas } from './canvas.js';
import { P } from './palette.js';
import { seeded, part, glow, lantern, ivy, pot, door } from './scenery.js';

const WALL_H = 230; // GROUND_Y in src/config.js: the floor starts here
const TILE = 64; // wall and floor tiles are this wide

// Wallpaper colors: deep forest green with faded vine stripes.
const PAPER = 0x2d3d35;
const PAPER_STRIPE = 0x34473c;
const PAPER_DARK = 0x243129;

function wall() {
  const c = new Canvas(TILE, WALL_H);
  const PANEL_TOP = 168; // where the wood panelling starts

  // wallpaper with vertical stripes and little vines + flowers
  c.rect(0, 0, TILE, PANEL_TOP, PAPER);
  for (const x of [8, 40]) c.rect(x, 0, 16, PANEL_TOP, PAPER_STRIPE);
  for (let y = 18; y < PANEL_TOP - 6; y += 22) {
    for (const x of [16, 48]) {
      const sx = x + (y % 44 === 18 ? 0 : 0);
      c.set(sx, y, P.sageDark);
      c.set(sx - 1, y + 1, P.sageDark);
      c.set(sx + 1, y + 1, P.sageDark);
      c.set(sx, y + 2, P.sageDark);
      c.set(sx, y + 1, y % 44 === 18 ? P.pinkDark : 0x6b5a7c); // tiny flower
    }
    for (const x of [0, 32]) {
      c.set(x, y + 11, P.sageDark);
      c.set(x, y + 12, PAPER_DARK);
    }
  }
  // the wallpaper is darker up near the ceiling (lamp light doesn't reach)
  for (let y = 12; y < 40; y++)
    for (let x = 0; x < TILE; x++) if ((x + y) % (y < 26 ? 2 : 4) === 0) c.set(x, y, PAPER_DARK);

  // ceiling beam
  c.rect(0, 0, TILE, 12, P.woodDark);
  c.rect(0, 10, TILE, 2, P.line);
  c.rect(0, 2, TILE, 1, P.wood);
  c.rect(31, 0, 2, 10, P.line); // joint between beams
  c.set(28, 5, P.iron);
  c.set(36, 5, P.iron);

  // chair rail along the top of the panels
  c.rect(0, PANEL_TOP - 3, TILE, 2, P.woodLight);
  c.rect(0, PANEL_TOP - 1, TILE, 1, P.line);

  // wood panels: two raised panels per tile
  c.rect(0, PANEL_TOP, TILE, WALL_H - PANEL_TOP, P.wood);
  for (const x of [3, 35]) {
    c.rect(x, PANEL_TOP + 6, 26, 40, P.woodDark);
    c.rect(x + 1, PANEL_TOP + 7, 24, 38, P.wood);
    c.rect(x + 1, PANEL_TOP + 7, 24, 1, P.woodLight);
  }
  const r = seeded(9);
  for (let i = 0; i < 30; i++) c.set(Math.floor(r() * TILE), PANEL_TOP + 2 + Math.floor(r() * 50), P.woodDark); // grain

  // skirting board
  c.rect(0, WALL_H - 6, TILE, 6, P.woodDark);
  c.rect(0, WALL_H - 6, TILE, 1, P.woodLight);
  return c;
}

function floor() {
  const H = 40;
  const c = new Canvas(TILE, H);
  const r = seeded(4);
  const rowH = 6;
  for (let row = 0; row * rowH < H; row++) {
    const y = row * rowH;
    const shade = row % 2 ? P.wood : 0x60432f;
    c.rect(0, y, TILE, rowH, shade);
    c.rect(0, y, TILE, 1, P.woodDark); // gap between boards
    const seam = (row * 23) % TILE; // stagger the board ends
    c.rect(seam, y, 1, rowH, P.woodDark);
    c.rect((seam + 32) % TILE, y, 1, rowH, P.woodDark);
    if (r() > 0.4) c.set(Math.floor(r() * TILE), y + 3, P.woodDark); // knot
    if (r() > 0.5) c.rect(Math.floor(r() * (TILE - 6)), y + 2, 5, 1, P.woodLight); // sheen
  }
  // darker toward the front so the room feels deep
  for (let y = H - 10; y < H; y++)
    for (let x = 0; x < TILE; x++) if ((x + y) % (y > H - 5 ? 2 : 3) === 0) c.set(x, y, P.woodDark);
  return c;
}

// Lighter (f > 1) or darker (f < 1) version of a color.
function shade(c, f) {
  const ch = (sh) => {
    const v = (c >> sh) & 255;
    return Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)));
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

// The window: a thick wooden frame with a lit top-left edge and a shaded
// bottom-right one, glass set deep inside it (a shadow along the top and left
// inside, a sheen across it), a ledge of a sill that sticks out of the wall
// with a shadow under it, curtains with folds hung from a rod on brackets, and
// a soft wash of moonlight on the wall around it. The curtains are the
// "Curtains" paint slot, the wood the "Frame" slot (src/data/paint.js).
function windowArch() {
  const W = 60;
  const H = 82;
  const c = new Canvas(W, H);
  const u = new Canvas(W, H); // the see-through things on the wall behind it (moonlight, shadows), kept out of the outline
  const cx = W / 2 - 0.5;
  const archY = 29; // where the arch's curve meets the straight sides
  const FRAME = 0x8a6a4c;
  const x0 = 12; // the frame's left and right edges
  const x1 = W - 13;
  const bottom = 66; // bottom of the frame (the sill sits just under it)
  const rx = (x1 - x0) / 2 + 0.5;
  const outer = (x, y) => (y >= archY ? x >= x0 && x <= x1 && y <= bottom : ((x - cx) / rx) ** 2 + ((y - archY) / 17) ** 2 <= 1);
  const inner = (x, y) => (y >= archY ? x >= x0 + 4 && x <= x1 - 4 && y <= bottom - 4 : ((x - cx) / (rx - 4)) ** 2 + ((y - archY) / 13) ** 2 <= 1);

  // moonlight washed on the wall around the window
  u.see(26, () => u.ellipse(cx, 44, 28, 38, 0x8fb4c8));
  u.see(18, () => u.ellipse(cx, 50, 20, 28, 0xcfe0e8));

  // the thick frame, shaded like a raised molding
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!outer(x, y)) continue;
      const edgeUL = !outer(x - 1, y) || !outer(x, y - 1) || !outer(x - 1, y - 1);
      const edgeDR = !outer(x + 1, y) || !outer(x, y + 1);
      const ring = !inner(x, y) && (inner(x - 3, y) || inner(x, y - 3) || inner(x + 3, y) || inner(x, y + 3) || inner(x - 2, y - 2) || inner(x + 2, y + 2));
      c.set(x, y, edgeUL ? shade(FRAME, 1.4) : edgeDR ? shade(FRAME, 0.6) : ring ? shade(FRAME, 1.18) : FRAME);
    }
  // the inside edge of the frame (a dark groove where the glass sits)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!inner(x, y)) continue;
      if (!inner(x - 1, y) || !inner(x, y - 1) || !inner(x + 1, y) || !inner(x, y + 1)) c.set(x, y, shade(FRAME, 0.4));
    }

  // the glass: a night sky that gets lighter toward the bottom
  const bands = [0x16253a, 0x1c2d3a, 0x203648, 0x243a46, 0x2a4450, 0x2e4950];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!inner(x, y) || !inner(x - 1, y) || !inner(x, y - 1) || !inner(x + 1, y) || !inner(x, y + 1)) continue;
      const t = (y - 14) / (bottom - 18);
      const k = Math.max(0, Math.min(bands.length - 1, Math.floor(t * bands.length + ((x + y) % 2 ? 0.35 : 0))));
      c.set(x, y, bands[k]);
    }
  const r = seeded(31);
  for (let i = 0; i < 12; i++) {
    const x = x0 + 5 + Math.floor(r() * (x1 - x0 - 9));
    const y = 16 + Math.floor(r() * 26);
    if (inner(x, y) && inner(x - 1, y) && inner(x + 1, y)) c.set(x, y, r() > 0.7 ? P.glow : 0xc8d6dc);
  }
  // the moon, with a halo
  c.see(34, () => c.circle(cx + 6, 29, 8, 0xe8e0c8, (x, y) => inner(x, y)));
  c.circle(cx + 6, 29, 4.5, 0xf0e6c8, (x, y) => inner(x, y));
  c.set(cx + 4, 27, 0xd8ccae);
  // dark pines at the bottom
  for (const [px, h] of [[x0 + 7, 17], [x0 + 14, 23], [x1 - 7, 19], [x1 - 15, 12]]) {
    for (let j = 0; j < h; j++) {
      const half = Math.floor(j / 3);
      for (let x = px - half; x <= px + half; x++) if (inner(x, bottom - 6 - h + j + 1)) c.set(x, bottom - 6 - h + j + 1, 0x182620);
    }
  }
  // the glass sits deep: a shadow inside along the top and left, a faint light on the bottom
  c.see(110, () => {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!inner(x, y) || !inner(x - 1, y) || !inner(x, y - 1) || !inner(x + 1, y) || !inner(x, y + 1)) continue;
        if (!inner(x, y - 3) || !inner(x - 3, y) || !inner(x - 2, y - 2)) c.set(x, y, 0x0a1118);
      }
  });
  // a sheen across the glass
  c.see(30, () => c.poly([[x0 + 6, bottom - 8], [x0 + 14, bottom - 8], [x1 - 3, 26], [x1 - 11, 22]], 0xb4d4e0));
  c.see(20, () => c.poly([[x0 + 16, bottom - 8], [x0 + 19, bottom - 8], [x1 - 1, 34], [x1 - 4, 31]], 0xb4d4e0));
  // crossbars with a lit left edge and a shaded right edge
  const bar = (x, y, w, h) => {
    c.rect(x, y, w, h, shade(FRAME, 0.85));
    if (w > h) c.rect(x, y, w, 1, shade(FRAME, 1.3));
    else c.rect(x, y, 1, h, shade(FRAME, 1.3));
    if (w > h) c.rect(x, y + h - 1, w, 1, shade(FRAME, 0.55));
    else c.rect(x + w - 1, y, 1, h, shade(FRAME, 0.55));
  };
  bar(Math.round(cx) - 1, 17, 3, bottom - 4 - 17);
  bar(x0 + 4, 46, x1 - x0 - 7, 3);

  // the sill: a ledge that sticks out, with a lit top, a front edge and a shadow below
  u.see(90, () => u.rect(x0 - 2, bottom + 6, x1 - x0 + 5, 2, 0x0d0a12));
  u.see(55, () => u.rect(x0, bottom + 8, x1 - x0 + 1, 2, 0x0d0a12));
  c.rect(x0 - 5, bottom + 1, x1 - x0 + 11, 2, shade(FRAME, 1.45)); // the top of the ledge
  c.rect(x0 - 5, bottom + 3, x1 - x0 + 11, 2, shade(FRAME, 1.05)); // its front
  c.rect(x0 - 5, bottom + 5, x1 - x0 + 11, 1, shade(FRAME, 0.5)); // its underside
  c.rect(x1 + 6, bottom + 1, 1, 5, shade(FRAME, 0.6)); // the shaded end
  pot(c, 19, bottom + 1, P.leaf);

  // curtains: folds in three tones, a tie-back, a hem, and a shadow on the wall beside them
  const CLOTH = P.lilacShade;
  const panel = (xa, dir) => {
    for (let y = 8; y < bottom + 1; y++) {
      const t = (y - 8) / (bottom - 8);
      const pinch = Math.max(0, 1 - Math.abs(y - 40) / 14) * 4;
      const w = Math.round(10 - pinch + (y > 52 ? (y - 52) * 0.25 : 0));
      for (let k = 0; k < w; k++) {
        const x = dir > 0 ? xa + k : xa - k;
        const fold = Math.floor(k / 2.5 + (y > 40 ? 0.5 : 0)) % 3;
        c.set(x, y, fold === 0 ? shade(CLOTH, 1.25) : fold === 1 ? CLOTH : shade(CLOTH, 0.72));
      }
      c.set(dir > 0 ? xa + w : xa - w, y, shade(CLOTH, 0.45)); // the inner edge
    }
    for (let k = 0; k < 10; k += 2) c.set(dir > 0 ? xa + k : xa - k, bottom, shade(CLOTH, 0.5)); // scalloped hem
    c.see(80, () => c.rect(dir > 0 ? xa + 11 : xa - 12, 9, 2, bottom - 8, 0x0d0a12)); // its shadow on the glass
    c.rect(dir > 0 ? xa : xa - 5, 39, 6, 2, P.gold); // tie-back
    c.set(dir > 0 ? xa + 2 : xa - 3, 41, P.coinShade);
    c.set(dir > 0 ? xa + 2 : xa - 3, 42, P.gold);
  };
  panel(4, 1);
  panel(W - 5, -1);
  // the rod on two brackets, with a drop shadow, and round finials
  u.see(80, () => u.rect(3, 8, W - 6, 2, 0x0d0a12));
  c.rect(2, 4, W - 4, 2, shade(P.gold, 1.2));
  c.rect(2, 6, W - 4, 1, shade(P.gold, 0.6));
  c.circle(2, 5, 1.5, P.gold);
  c.circle(W - 3, 5, 1.5, P.gold);
  for (const bx of [8, W - 9]) c.rect(bx, 3, 1, 4, P.iron);
  c.outline(P.line);
  const out = new Canvas(W, H);
  out.draw(u);
  out.draw(c);
  return out;
}

function fireplace() {
  const W = 84;
  const H = 220; // tall enough for the chimney to reach the ceiling beam
  const c = new Canvas(W, H);
  const lights = [];

  // stone chimney breast + hearth
  c.draw(part(W, H, (d) => {
    d.rect(12, 0, W - 24, H - 16, P.stoneShade); // chimney going up
    d.rect(2, H - 52, W - 4, 52, P.stoneShade); // body
  }));
  // stone blocks
  const r = seeded(12);
  for (let y = H - 50; y < H; y += 6) {
    let x = 3 + Math.floor(r() * 7);
    c.rect(3, y, W - 6, 1, P.stoneDark);
    while (x < W - 4) {
      c.rect(x, y, 1, 6, P.stoneDark);
      x += 9 + Math.floor(r() * 6);
    }
  }
  for (let y = 2; y < H - 52; y += 6) {
    c.rect(13, y, W - 26, 1, P.stoneDark);
    for (let x = 13 + ((y / 6) % 2 ? 6 : 1); x < W - 13; x += 11) c.rect(x, y, 1, 6, P.stoneDark);
  }
  // moss creeping on the stones
  for (let i = 0; i < 70; i++) {
    const x = 3 + Math.floor(r() * (W - 6));
    const y = H - 1 - Math.floor(r() * r() * 50);
    if (c.get(x, y) === P.stoneShade) c.set(x, y, r() > 0.5 ? P.moss : P.mossDark);
  }
  ivy(c, 15, H - 120, H - 56, 3, 1);

  // mantel shelf
  c.draw(part(W, H, (d) => d.rect(0, H - 54, W, 5, P.woodDark)));
  c.rect(1, H - 54, W - 2, 1, P.woodLight);
  // candles on the mantel
  for (const x of [8, 14, W - 12]) {
    const h = x === 14 ? 5 : 7;
    c.draw(part(W, H, (d) => d.rect(x, H - 55 - h, 3, h, P.white)));
    c.set(x + 1, H - 57 - h, P.glowWarm);
    c.set(x + 1, H - 58 - h, P.glow);
    lights.push([x + 1, H - 58 - h, 7]);
  }
  // a little framed picture of the moon on the mantel
  c.draw(part(W, H, (d) => {
    d.rect(W / 2 - 7, H - 68, 14, 13, P.woodLight);
    d.rect(W / 2 - 5, H - 66, 10, 9, 0x243a46);
  }));
  c.circle(W / 2 + 1, H - 63, 2, P.glow);

  // the firebox opening (an arch)
  const fx = W / 2 - 0.5;
  const top = H - 38;
  const fire = (x, y) => y >= top || (x - fx) ** 2 / 17 ** 2 + (y - top) ** 2 / 9 ** 2 <= 1;
  for (let y = H - 47; y < H - 4; y++) for (let x = 20; x < W - 20; x++) if (fire(x, y)) c.set(x, y, 0x1a1418);
  // logs + flames
  c.rect(28, H - 10, 28, 3, P.woodDark);
  c.rect(30, H - 12, 22, 2, P.wood);
  c.poly([[30, H - 11], [36, H - 30], [40, H - 18], [44, H - 34], [48, H - 20], [54, H - 11]], P.glowDeep);
  c.poly([[33, H - 11], [38, H - 24], [42, H - 15], [45, H - 27], [51, H - 11]], P.glowWarm);
  c.poly([[37, H - 11], [41, H - 20], [44, H - 11]], P.glow);
  lights.push([42, H - 20, 26]);

  // hearth stone in front
  c.draw(part(W, H, (d) => d.rect(4, H - 4, W - 8, 4, P.stoneDark)));
  c.rect(5, H - 4, W - 10, 1, P.stone);

  for (const [x, y, rr] of lights) glow(c, x, y, rr);
  return c;
}

function homeDoor() {
  const c = new Canvas(36, 66);
  door(c, 18, 64, 26, 58, 0x7a5a40, 0x5a4030); // an oak door, the same brown as the oak floor
  c.rect(5, 65, 26, 1, P.woodDark); // doormat edge
  c.draw(part(36, 66, (d) => d.rect(6, 63, 24, 2, P.pinkDark)));
  return c;
}

function homeLantern() {
  const c = new Canvas(16, 44);
  for (let y = 0; y < 30; y += 2) c.set(8, y, P.iron); // chain
  for (let y = 1; y < 30; y += 2) c.set(8, y, P.stoneDark);
  const lights = [];
  lantern(c, 8, 31, lights);
  for (const [x, y] of lights) glow(c, x, y, 7);
  return c;
}

// Dotted outline with a "+" in the middle: "something can go here".
function slot(w, h) {
  const c = new Canvas(w, h);
  c.see(150, () => {
    for (let x = 1; x < w - 1; x++) if (x % 3 !== 0) {
      c.set(x, 0, P.cream);
      c.set(x, h - 1, P.cream);
    }
    for (let y = 1; y < h - 1; y++) if (y % 3 !== 0) {
      c.set(0, y, P.cream);
      c.set(w - 1, y, P.cream);
    }
    const mx = Math.floor(w / 2);
    const my = Math.floor(h / 2);
    c.rect(mx - 3, my, 7, 1, P.cream);
    c.rect(mx, my - 3, 1, 7, P.cream);
  });
  return c;
}

export const HOME = {
  'home-wall': wall,
  'home-floor': floor,
  'home-window': windowArch,
  'home-fireplace': fireplace,
  'home-door': homeDoor,
  'home-lantern': homeLantern,
  'home-slot-floor': () => slot(44, 34),
  'home-slot-wall': () => slot(30, 30),
};
