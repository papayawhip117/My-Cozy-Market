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

function windowArch() {
  const W = 48;
  const H = 66;
  const c = new Canvas(W, H);
  const cx = W / 2 - 0.5;
  const left = 8;
  const right = W - 9;
  const archY = 22;
  const inArch = (x, y) => y >= archY || (x - cx) ** 2 / 15.5 ** 2 + (y - archY) ** 2 / 14 ** 2 <= 1;

  // the view outside: night sky, moon, dark pines
  c.draw(part(W, H, (d) => {
    d.rect(left - 2, archY, right - left + 5, 36, P.woodDark);
    d.ellipse(cx, archY, 17.5, 16, P.woodDark, (x, y) => y <= archY);
  }));
  for (let y = 0; y < 58; y++)
    for (let x = left; x <= right; x++) {
      if (!inArch(x, y) || y < archY - 14) continue;
      c.set(x, y, y < 30 ? 0x1c2d3a : y < 44 ? 0x243a46 : 0x2e4950);
    }
  const r = seeded(31);
  for (let i = 0; i < 9; i++) {
    const x = left + 1 + Math.floor(r() * (right - left - 1));
    const y = archY - 10 + Math.floor(r() * 22);
    if (inArch(x, y)) c.set(x, y, r() > 0.7 ? P.glow : 0xc8d6dc);
  }
  c.see(40, () => c.circle(30, 20, 7, 0xe8e0c8));
  c.circle(30, 20, 4, 0xf0e6c8);
  c.set(29, 19, 0xd8ccae);
  for (const [px, h] of [[left + 3, 16], [left + 10, 22], [right - 4, 18], [right - 11, 12]]) {
    for (let j = 0; j < h; j++) {
      const half = Math.floor(j / 3);
      c.rect(px - half, 57 - h + j, half * 2 + 1, 1, 0x182620);
    }
  }
  // crossbars
  c.rect(cx, archY - 14, 2, 44, P.woodDark);
  c.rect(left, 38, right - left + 1, 2, P.woodDark);

  // curtains (dusty lilac), tied back
  const curtain = (x0, dir) => {
    c.draw(part(W, H, (d) => {
      d.poly(dir > 0
        ? [[x0, 4], [x0 + 9, 4], [x0 + 4, 34], [x0 + 7, 60], [x0, 60]]
        : [[x0, 4], [x0 - 9, 4], [x0 - 4, 34], [x0 - 7, 60], [x0, 60]], P.lilacShade);
    }));
    for (let y = 6; y < 58; y += 1) if (y % 7 < 2) c.set(x0 + dir * 2, y, P.lilac);
    c.rect(dir > 0 ? x0 + 1 : x0 - 5, 33, 5, 2, P.gold); // tie-back
  };
  curtain(1, 1);
  curtain(W - 2, -1);
  // curtain rod
  c.rect(0, 2, W, 2, P.iron);
  c.set(0, 1, P.iron);
  c.set(W - 1, 1, P.iron);

  // sill with a little pot
  c.draw(part(W, H, (d) => d.rect(4, 58, W - 8, 3, P.woodLight)));
  pot(c, 15, 57, P.leaf);
  c.see(50, () => c.rect(left, 61, right - left, 1, P.line)); // shadow under the sill
  // a soft blue moonlight sheen on the glass
  c.see(28, () => c.poly([[left + 4, 52], [left + 12, 52], [right - 2, 14], [right - 8, 10]], 0x8fb4c8));
  return c;
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
  door(c, 18, 64, 26, 58, P.lilacDark, P.plum); // a painted plum door
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
