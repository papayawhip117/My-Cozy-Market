// Street decorations and the drawing helpers the other art files share
// (the shops themselves live in shops.js). Each function returns one Canvas that
// becomes public/assets/<name>.png. The bottom row of each image is the
// ground line (the game stands them on the grass by their bottom edge).
//
// Style: dark cottagecore at dusk. Weathered wood, mossy stone, ivy,
// iron hinges, and warm light glowing out of every window and lantern.
import { Canvas } from './canvas.js';
import { P } from './palette.js';

// Same "random" numbers every run, so the art doesn't change each time.
function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Draw something on its own layer, give it an outline, return it.
function part(w, h, fn, line = P.line) {
  const c = new Canvas(w, h);
  fn(c);
  return c.outline(line);
}

// Ellipse with a shaded lower-right side and a light spot top-left.
function ball(c, cx, cy, rx, ry, main, shade, light, keep = () => true) {
  const inBall = (x, y) => {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1 && keep(x, y);
  };
  c.ellipse(cx, cy, rx, ry, shade, keep);
  c.ellipse(cx - rx * 0.08, cy - ry * 0.1, rx * 0.95, ry * 0.92, main, inBall);
  if (light) c.ellipse(cx - rx * 0.45, cy - ry * 0.45, Math.min(rx * 0.22, 7), Math.min(ry * 0.14, 3), light, inBall);
}

// ---------- light ----------

// A soft see-through halo of light. Call these LAST so they glow over everything.
function glow(c, cx, cy, r, color = P.glowWarm) {
  c.see(30, () => c.circle(cx, cy, r, color));
  c.see(40, () => c.circle(cx, cy, r * 0.62, color));
  c.see(48, () => c.circle(cx, cy, r * 0.32, P.glow));
}

// Hanging iron lantern. (x, y) is the hook at the top.
function lantern(c, x, y, lights) {
  c.draw(part(c.w, c.h, (d) => {
    d.rect(x - 2, y + 1, 5, 6, P.glowWarm);
    d.rect(x - 1, y + 2, 3, 3, P.glow);
  }, P.iron));
  c.rect(x - 3, y, 7, 1, P.iron);
  c.rect(x - 3, y + 7, 7, 1, P.iron);
  c.set(x, y - 1, P.iron);
  lights.push([x, y + 4, 13]);
}

// ---------- nature ----------

// A vine of ivy growing from (x, y0) down to y1.
function ivy(c, x, y0, y1, seed, sway = 2) {
  const r = seeded(seed);
  for (let y = y0; y < y1; y++) {
    const vx = x + Math.round(Math.sin(y / 5 + seed) * sway);
    c.set(vx, y, P.leafDark);
    if (r() > 0.5) c.set(vx + (r() > 0.5 ? 1 : -1), y, P.leaf);
    if (r() > 0.85) c.set(vx + (r() > 0.5 ? 2 : -2), y, P.leafLight);
  }
}

// Speckles of moss over whatever is drawn in a box (thicker toward the bottom).
function mossy(c, x0, y0, x1, y1, amount, seed) {
  const r = seeded(seed);
  for (let i = 0; i < amount; i++) {
    const x = x0 + Math.floor(r() * (x1 - x0));
    const y = y1 - Math.floor(r() * r() * (y1 - y0)); // r()*r() bunches them low
    if (c.get(x, y) === -1 || c.get(x, y) === P.line) continue;
    c.set(x, y, r() > 0.6 ? P.mossLight : P.moss);
    if (r() > 0.5) c.set(x + 1, y, P.mossDark);
  }
}

// A clump of ferns growing up from (cx, bottom).
function ferns(c, cx, bottom, size = 8, seed = 1) {
  const r = seeded(seed);
  for (let i = -2; i <= 2; i++) {
    const tipX = cx + i * size * 0.45;
    const tipY = bottom - size + Math.abs(i) * 2;
    const steps = size;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = Math.round(cx + (tipX - cx) * t + i * t * t * 2);
      const y = Math.round(bottom - (bottom - tipY) * t);
      c.set(x, y, i % 2 ? P.fern : P.leaf);
      if (s % 2 === 0 && s > 1) {
        c.set(x - 1, y + 1, P.fern);
        c.set(x + 1, y + 1, r() > 0.5 ? P.leafLight : P.leaf);
      }
    }
  }
}

// Little potted plant.
function pot(c, cx, bottom, leaf = P.leaf) {
  c.draw(part(c.w, c.h, (d) => {
    d.poly([[cx - 4, bottom - 6], [cx + 4, bottom - 6], [cx + 3, bottom], [cx - 3, bottom]], P.brick);
    d.rect(cx - 5, bottom - 7, 10, 2, P.brickDark);
    d.ellipse(cx, bottom - 11, 5, 4.5, leaf);
    d.ellipse(cx + 2, bottom - 13, 2.5, 2.5, P.leafDark);
  }));
  c.set(cx - 2, bottom - 13, P.pinkShade);
  c.set(cx + 1, bottom - 10, P.pinkShade);
}

// ---------- building parts ----------

// Arched door with iron strap hinges. (cx, bottom) = middle of the doorstep.
function door(c, cx, bottom, w, h, color = P.wood, dark = P.woodDark) {
  const left = Math.round(cx - w / 2);
  const archY = bottom - h + Math.round(w / 2);
  c.draw(part(c.w, c.h, (d) => {
    // stone door frame
    d.rect(left - 2, archY, w + 4, bottom - archY + 1, P.stoneShade);
    d.ellipse(cx - 0.5, archY, w / 2 + 2, w / 2.2 + 2, P.stoneShade, (x, y) => y <= archY);
  }));
  c.draw(part(c.w, c.h, (d) => {
    d.rect(left, archY, w, bottom - archY + 1, color);
    d.ellipse(cx - 0.5, archY, w / 2, w / 2.2, color, (x, y) => y <= archY);
    for (let x = left + 4; x < left + w - 1; x += 5) d.rect(x, bottom - h + 4, 1, h - 4, dark);
  }));
  // iron strap hinges with nail heads
  for (const hy of [archY + 2, bottom - 7]) {
    c.rect(left, hy, Math.round(w * 0.6), 2, P.iron);
    c.set(left + Math.round(w * 0.6), hy, P.iron);
    for (let x = left + 2; x < left + w * 0.6; x += 4) c.set(x, hy, P.stoneShade);
  }
  c.rect(left + w - 5, bottom - Math.round(h / 2.4), 2, 2, P.gold); // knob
  c.rect(left - 1, bottom, w + 2, 1, P.stoneDark); // step
}

// Stone blocks: mortar lines over every pixel of `color`.
function stones(c, color, mortar, seed, rowH = 6) {
  const r = seeded(seed);
  for (let y = 0; y < c.h; y += rowH) {
    let x = Math.floor(r() * 8);
    for (let xx = 0; xx < c.w; xx++) if (c.get(xx, y) === color) c.set(xx, y, mortar);
    while (x < c.w) {
      for (let yy = y; yy < y + rowH; yy++) if (c.get(x, yy) === color) c.set(x, yy, mortar);
      x += 8 + Math.floor(r() * 7);
    }
  }
}

function lightUp(c, lights) {
  for (const [x, y, r] of lights) glow(c, x, y, r);
}

// ================= DECORATIONS =================

function lanternTree() {
  const W = 76;
  const H = 120;
  const c = new Canvas(W, H);
  const lights = [];
  c.draw(part(W, H, (d) => {
    d.poly([[33, 60], [43, 60], [45, 110], [52, 120], [24, 120], [31, 110]], P.wood);
    d.rect(40, 60, 3, 54, P.woodDark);
  }));
  mossy(c, 24, 90, 52, 119, 50, 3);
  const leaves = new Canvas(W, H);
  for (const [x, y, rad] of [[38, 44, 24], [18, 54, 14], [58, 54, 14], [38, 24, 18], [24, 32, 12], [52, 32, 12]]) {
    ball(leaves, x, y, rad, rad * 0.9, P.leaf, P.leafDark, P.leafLight);
  }
  leaves.outline(P.line);
  c.draw(leaves);
  // hanging lanterns
  for (const [x, y, len] of [[14, 64, 8], [60, 64, 6], [32, 66, 12], [48, 66, 4], [24, 60, 3]]) {
    c.rect(x, y, 1, len, P.iron);
    lantern(c, x, y + len, lights);
  }
  ferns(c, 16, 119, 8, 4);
  lightUp(c, lights);
  return c;
}

function fountain() {
  const W = 92;
  const H = 72;
  const c = new Canvas(W, H);
  const cx = 46;
  // basin
  const basin = new Canvas(W, H);
  basin.rect(6, 50, 80, 22, P.stone);
  stones(basin, P.stone, P.stoneShade, 2, 7);
  basin.ellipse(cx, 50, 42, 8, P.stoneShade);
  basin.ellipse(cx, 49, 40, 7, P.stone);
  basin.ellipse(cx, 50, 35, 5, P.water);
  basin.ellipse(cx, 51, 30, 3, P.waterDark, (x, y) => y >= 52);
  basin.outline(P.line);
  c.draw(basin);
  mossy(c, 6, 54, 86, 71, 120, 4);
  // column and two bowls
  c.draw(part(W, H, (d) => {
    d.rect(cx - 4, 16, 9, 34, P.stone);
    d.rect(cx + 2, 16, 3, 34, P.stoneShade);
    d.rect(cx - 6, 40, 13, 3, P.stoneShade); // carved ring
  }));
  c.draw(part(W, H, (d) => {
    d.ellipse(cx, 30, 18, 5, P.stone);
    d.ellipse(cx, 29, 15, 2.5, P.water);
  }));
  c.draw(part(W, H, (d) => {
    d.ellipse(cx, 16, 10, 3.5, P.stone);
    d.ellipse(cx, 15, 8, 1.5, P.water);
    d.rect(cx - 1, 6, 3, 8, P.stone);
    d.circle(cx, 5, 2.5, P.stone);
  }));
  mossy(c, cx - 18, 26, cx + 18, 44, 40, 9);
  // water spilling down
  for (const s of [-1, 1]) {
    for (let i = 0; i <= 18; i++) {
      const x = cx + s * (17 + i * 0.9);
      const y = 31 + Math.round((i * i) / 18);
      c.set(x, y, i % 3 ? P.water : P.white);
      c.set(x, y + 1, P.waterDark);
    }
    for (let i = 0; i <= 8; i++) {
      c.set(cx + s * (9 + i), 17 + Math.round((i * i) / 5), i % 3 ? P.water : P.white);
    }
  }
  return c;
}

// Glowing spirit mushrooms.
function mushrooms() {
  const W = 44;
  const H = 30;
  const c = new Canvas(W, H);
  for (const [x, h, rad] of [[11, 10, 7], [26, 14, 9], [37, 7, 5]]) {
    c.draw(part(W, H, (d) => d.rect(x - 2, H - h - 1, 4, h + 1, P.cream)));
    c.draw(part(W, H, (d) => {
      d.ellipse(x, H - h - 1, rad, rad * 0.75, P.plum, (px, py) => py <= H - h);
      d.rect(x - rad + 1, H - h - 1, rad * 2 - 1, 1, 0x33294a);
    }));
    for (const [ox, oy] of [[-Math.floor(rad / 2), -Math.floor(rad / 2)], [Math.floor(rad / 3), -Math.floor(rad / 1.6)], [Math.floor(rad / 1.5), -2]]) {
      c.set(x + ox, H - h - 1 + oy, P.spirit);
    }
    glow(c, x, H - h - 2, rad + 5, P.spirit);
  }
  ferns(c, 4, H - 1, 6, 3);
  return c;
}

// Ferns with a few bluebells and wildflowers.
function flowers() {
  const W = 56;
  const H = 18;
  const c = new Canvas(W, H);
  const r = seeded(21);
  ferns(c, 10, H - 1, 10, 1);
  ferns(c, 34, H - 1, 12, 2);
  ferns(c, 50, H - 1, 8, 3);
  const colors = [P.lilacShade, P.pink, P.white, P.lilac];
  for (let x = 4; x < W - 2; x += 6) {
    const y = H - 6 - Math.floor(r() * 7);
    c.rect(x, y + 1, 1, H - y - 1, P.leafDark);
    const col = colors[Math.floor(r() * colors.length)];
    c.set(x, y, col);
    c.set(x + 1, y + 1, col);
    c.set(x - 1, y + 1, col);
  }
  return c;
}

export const SCENERY = {
  'decor-lantern-tree': lanternTree,
  'decor-fountain': fountain,
  'decor-mushrooms': mushrooms,
  'decor-flowers': flowers,
};

// Helpers other art files reuse (home.js, shops.js and props.js draw
// with the same lanterns, ivy and plants).
export { seeded, part, ball, glow, lantern, ivy, ferns, pot, door };
