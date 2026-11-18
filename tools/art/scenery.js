// Shops and street decorations. Each function returns one Canvas that
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

// Keep only pixels that land on something already drawn on `base`.
const on = (base) => (x, y) => base.get(x, y) !== -1;

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

// Light spilling out of a doorway or window onto the ground below it.
function spill(c, cx, y, w) {
  c.see(40, () => c.poly([[cx - w / 2, y], [cx + w / 2, y], [cx + w / 2 + 4, y + 3], [cx - w / 2 - 4, y + 3]], P.glowWarm));
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

// Moss dripping from a roof edge along row y.
function mossDrips(c, x0, x1, y, seed) {
  const r = seeded(seed);
  for (let x = x0; x < x1; x += 2) {
    const len = Math.floor(r() * r() * 7);
    c.rect(x, y, 2, len, r() > 0.5 ? P.mossDark : P.moss);
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

// Puffs of steam / chimney smoke rising from (x, y).
function steam(c, x, y) {
  c.draw(part(c.w, c.h, (d) => {
    d.circle(x, y, 2.5, P.stone);
    d.circle(x + 3, y - 6, 3, P.stone);
    d.circle(x + 1, y - 12, 2, P.stoneShade);
  }, P.stoneDark));
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

// Square window with glowing glass, crossbars and an optional flower box.
function windowBox(c, x, y, w, h, lights, { frame = P.woodDark, box = true } = {}) {
  c.draw(part(c.w, c.h, (d) => {
    d.rect(x, y, w, h, frame);
    d.rect(x + 2, y + 2, w - 4, h - 4, P.glow);
    d.rect(x + 2, y + h - 6, w - 4, 4, P.glowWarm);
    d.rect(x + 2, y + h - 3, w - 4, 1, P.glowDeep);
    d.rect(x + Math.floor(w / 2), y + 2, 1, h - 4, frame);
    d.rect(x + 2, y + Math.floor(h / 2), w - 4, 1, frame);
  }));
  c.set(x + 3, y + 3, P.white);
  if (box) {
    c.draw(part(c.w, c.h, (d) => d.rect(x - 2, y + h, w + 4, 4, P.woodDark)));
    const r = seeded(x * 7 + y);
    for (let i = x - 1; i < x + w + 1; i++) {
      c.set(i, y + h - 1, r() > 0.4 ? P.leaf : P.leafDark);
      if (r() > 0.6) c.set(i, y + h - 2, [P.pink, P.white, P.lilac][Math.floor(r() * 3)]);
      if (r() > 0.7) c.set(i, y + h + 4 + Math.floor(r() * 3), P.leafDark); // trailing leaves
    }
  }
  lights.push([x + w / 2, y + h / 2, Math.max(w, h) * 0.9]);
}

// Round porthole window.
function roundWindow(c, cx, cy, r, lights, frame = P.woodDark) {
  c.draw(part(c.w, c.h, (d) => {
    d.circle(cx, cy, r, frame);
    d.circle(cx, cy, r - 2, P.glow);
    d.circle(cx, cy + 3, r - 3, P.glowWarm, (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= (r - 2.5) ** 2);
    d.rect(cx - r + 2, cy, r * 2 - 3, 1, frame);
    d.rect(cx, cy - r + 2, 1, r * 2 - 3, frame);
  }));
  c.set(cx - Math.floor(r / 2), cy - Math.floor(r / 2), P.white);
  lights.push([cx, cy, r * 2]);
}

// Rows of roof shingles inside every pixel of `color`.
function shingles(c, color, shade, rowH = 5, seed = 1) {
  const r = seeded(seed);
  for (let y = 0; y < c.h; y++) {
    if (y % rowH !== rowH - 1) continue;
    const offset = (Math.floor(y / rowH) % 2) * 3;
    for (let x = 0; x < c.w; x++) {
      if (c.get(x, y) !== color) continue;
      if ((x + offset) % 6 !== 0) c.set(x, y, shade);
      else if (r() > 0.7) c.set(x, y - 1, shade);
    }
  }
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

// ================= SHOPS =================

// Matcha Shop: a giant, slightly overgrown teapot.
function shopMatcha() {
  const W = 168;
  const H = 150;
  const c = new Canvas(W, H);
  const lights = [];
  const cx = 78;

  // handle (behind the pot), wrapped in ivy
  c.draw(part(W, H, (d) => {
    d.ellipse(23, 92, 17, 25, P.cream);
    d.ellipse(23, 92, 9, 17, -1);
    d.replace(P.cream, P.creamShade, (x, y) => x < 12 || y > 110);
  }));
  ivy(c, 9, 74, 112, 3, 3);

  // spout (behind the pot) with steam
  c.draw(part(W, H, (d) => {
    d.line(118, 112, 146, 70, P.sageShade, 11);
    d.line(115, 108, 143, 68, P.sage, 5);
    d.ellipse(148, 66, 6, 3, P.sageDark);
  }));
  steam(c, 152, 52);

  // the pot
  const body = new Canvas(W, H);
  ball(body, cx, 103, 58, 45, P.sage, P.sageShade, P.sageLight);
  const inPot = on(body);
  // aged cream belly band with a dusty-rose blossom pattern
  for (let y = 107; y <= 115; y++) for (let x = 0; x < W; x++) if (inPot(x, y)) body.set(x, y, y === 115 || y === 107 ? P.creamShade : P.cream);
  for (let x = cx - 50; x < cx + 54; x += 9) {
    for (const [ox, oy, col] of [[0, 0, P.pinkDark], [-1, 0, P.pinkShade], [1, 0, P.pinkShade], [0, -1, P.pinkShade], [0, 1, P.pinkShade]]) {
      body.set(x + ox, 111 + oy, col);
    }
  }
  mossy(body, 20, 118, 136, 148, 220, 4);
  body.outline(P.line);
  c.draw(body);

  // base ring (stone)
  c.draw(part(W, H, (d) => d.rect(42, 141, 72, 8, P.stoneShade)));
  mossy(c, 42, 141, 114, 149, 60, 8);

  // lid + knob
  c.draw(part(W, H, (d) => {
    d.ellipse(cx, 60, 38, 9, P.creamShade);
    d.ellipse(cx, 58, 31, 15, P.cream, (x, y) => y <= 58);
    d.ellipse(cx - 12, 50, 6, 3, P.white, (x, y) => d.get(x, y) === P.cream);
  }));
  mossDrips(c, 44, 112, 64, 6);
  c.draw(part(W, H, (d) => {
    d.circle(cx, 40, 5, P.pinkShade);
    d.circle(cx - 1, 39, 2, P.pink);
  }));

  roundWindow(c, 45, 92, 10, lights);
  roundWindow(c, 111, 92, 10, lights);
  door(c, cx, 148, 24, 32);
  lantern(c, 140, 78, lights); // hanging from the spout
  c.rect(140, 74, 1, 4, P.iron);
  pot(c, 50, 148);
  ferns(c, 106, 148, 9, 2);
  ferns(c, 30, 148, 7, 5);
  spill(c, cx, 146, 22);
  lightUp(c, lights);
  return c;
}

// Plant Shop: a big mossy mushroom house.
function shopPlants() {
  const W = 160;
  const H = 172;
  const c = new Canvas(W, H);
  const lights = [];
  const cx = 78;

  // stem
  c.draw(part(W, H, (d) => {
    d.poly([[50, 90], [106, 90], [112, 172], [44, 172]], P.cream);
    d.poly([[96, 90], [106, 90], [112, 172], [101, 172]], P.creamShade);
    d.rect(44, 100, 70, 6, P.creamShade); // shadow under the cap
  }));
  mossy(c, 44, 130, 112, 171, 160, 2);
  ivy(c, 50, 104, 168, 1);
  ivy(c, 104, 106, 150, 4);

  // gills under the rim
  c.draw(part(W, H, (d) => {
    d.ellipse(cx, 99, 66, 7, 0xb8a688, (x, y) => y >= 99);
    for (let x = 16; x < 142; x += 4) d.set(x, 100, 0x8f7f66);
  }));

  // cap with pale spots and moss
  const cap = new Canvas(W, H);
  ball(cap, cx, 98, 76, 70, P.leafLight, P.leaf, P.mossLight, (x, y) => y <= 98);
  const inCap = on(cap);
  for (const [sx, sy, sr] of [[46, 56, 8], [92, 44, 6], [118, 74, 7], [70, 80, 5], [22, 86, 5], [134, 92, 4], [66, 36, 4]]) {
    cap.circle(sx, sy, sr, P.cream, inCap);
    cap.circle(sx + 1, sy + 1, sr - 1.5, P.creamShade, (x, y) => cap.get(x, y) === P.cream && x - sx + (y - sy) > sr * 0.6);
  }
  mossy(cap, 4, 60, 152, 98, 260, 6);
  cap.outline(P.line);
  c.draw(cap);
  mossDrips(c, 8, 150, 99, 3);

  roundWindow(c, 61, 122, 8, lights);
  roundWindow(c, 96, 122, 8, lights);
  door(c, cx, 171, 22, 30, P.sageDark, 0x33473a);
  lantern(c, 124, 104, lights);
  c.rect(124, 100, 1, 4, P.iron);
  pot(c, 28, 171);
  pot(c, 131, 171, P.mossDark);
  ferns(c, 146, 171, 9, 3);
  ferns(c, 16, 171, 8, 7);
  // tiny glowing mushrooms at the foot of the stem
  for (const [x, h] of [[40, 4], [116, 5], [120, 3]]) {
    c.rect(x, 171 - h, 1, h, P.cream);
    c.rect(x - 1, 170 - h, 3, 1, P.spirit);
    glow(c, x, 170 - h, 5, P.spirit);
  }
  spill(c, cx, 169, 20);
  lightUp(c, lights);
  return c;
}

// PJ's Store: half-timbered dusty-rose cottage dripping with wisteria.
function shopPJs() {
  const W = 164;
  const H = 160;
  const c = new Canvas(W, H);
  const lights = [];
  const cx = 78;

  // walls: rose plaster, dark timber beams, mossy stone base
  const walls = new Canvas(W, H);
  walls.rect(22, 84, 112, 76, P.pink);
  walls.rect(118, 84, 16, 76, P.pinkShade);
  for (const x of [22, 52, 104, 131]) walls.rect(x, 84, 3, 64, P.woodDark);
  walls.rect(22, 84, 112, 3, P.woodDark);
  walls.rect(22, 108, 112, 2, P.woodDark);
  walls.line(25, 110, 52, 145, P.woodDark, 2);
  walls.line(131, 110, 106, 145, P.woodDark, 2);
  walls.rect(22, 146, 112, 14, P.stone);
  stones(walls, P.stone, P.stoneShade, 4, 5);
  walls.outline(P.line);
  c.draw(walls);
  mossy(c, 22, 140, 134, 159, 120, 9);

  // roof
  const roof = new Canvas(W, H);
  roof.poly([[8, 92], [cx, 16], [148, 92]], P.lilac);
  roof.poly([[cx, 16], [148, 92], [118, 92]], P.lilacShade);
  shingles(roof, P.lilac, P.lilacShade, 6, 3);
  shingles(roof, P.lilacShade, P.lilacDark, 6, 4);
  mossy(roof, 10, 50, 146, 90, 140, 12);
  roof.rect(6, 90, 144, 4, P.plum);
  roof.outline(P.line);
  c.draw(roof);
  roundWindow(c, cx, 62, 8, lights);

  // wisteria hanging off the roof edge
  const r = seeded(11);
  for (let x = 10; x < 148; x += 4) {
    const len = 5 + Math.floor(r() * 12);
    for (let i = 0; i < len; i++) {
      const wide = i < len - 3 ? 1 : 0;
      const col = i % 3 === 0 ? P.lilacDark : i % 3 === 1 ? P.lilacShade : P.lilac;
      c.rect(x - wide, 94 + i, 1 + wide * 2, 1, col);
    }
    c.set(x, 94 + len, P.plum);
    c.set(x + 2, 94, P.leafDark);
    c.set(x + 2, 95, P.leaf);
  }

  // windows with shutters
  for (const wx of [30, 106]) {
    c.draw(part(W, H, (d) => {
      d.rect(wx - 6, 114, 5, 20, P.plum);
      d.rect(wx + 21, 114, 5, 20, P.plum);
    }));
    windowBox(c, wx, 114, 20, 20, lights);
  }

  // door with a little moon, lanterns either side
  door(c, cx, 159, 22, 36, P.plum, 0x33294a);
  c.circle(cx, 136, 3, P.glow);
  c.circle(cx + 2, 135, 2.5, P.plum);
  lantern(c, 62, 118, lights);
  lantern(c, 94, 118, lights);

  // hanging sign with a crescent moon
  c.rect(134, 104, 16, 1, P.iron);
  c.rect(139, 105, 1, 2, P.iron);
  c.rect(146, 105, 1, 2, P.iron);
  c.draw(part(W, H, (d) => d.rect(137, 107, 13, 11, P.woodLight)));
  c.circle(143, 112, 3.5, P.gold);
  c.circle(145, 111, 3, P.woodLight);

  ferns(c, 14, 159, 9, 4);
  ferns(c, 142, 159, 8, 6);
  spill(c, cx, 157, 20);
  lightUp(c, lights);
  return c;
}

// Furniture: mossy thatched cottage with a brick chimney.
function shopFurniture() {
  const W = 184;
  const H = 162;
  const c = new Canvas(W, H);
  const lights = [];
  const cx = 88;

  // chimney (behind the roof) + smoke
  c.draw(part(W, H, (d) => {
    d.rect(130, 22, 16, 60, P.brick);
    for (let y = 24; y < 82; y += 4) {
      d.rect(130, y, 16, 1, P.brickDark);
      const off = (y / 4) % 2 ? 4 : 0;
      for (let x = 130 + off; x < 146; x += 8) d.rect(x, y - 3, 1, 3, P.brickDark);
    }
    d.rect(127, 18, 22, 5, P.stoneDark);
  }));
  mossy(c, 130, 22, 146, 60, 30, 14);
  steam(c, 138, 12);

  // walls: weathered planks on top, big mossy stones below
  const walls = new Canvas(W, H);
  walls.rect(16, 86, 146, 76, P.wood);
  for (let x = 18; x < 162; x += 6) walls.rect(x, 86, 1, 46, P.woodDark);
  walls.rect(16, 130, 146, 32, P.stone);
  stones(walls, P.stone, P.stoneShade, 5, 7);
  walls.rect(16, 128, 146, 3, P.woodDark); // beam
  walls.outline(P.line);
  c.draw(walls);
  mossy(c, 16, 130, 162, 161, 260, 3);
  ivy(c, 20, 100, 158, 9);
  ivy(c, 158, 96, 150, 2);

  // big rounded mossy roof
  const roof = new Canvas(W, H);
  ball(roof, cx, 92, 88, 60, P.moss, P.mossDark, P.mossLight, (x, y) => y <= 92);
  const r = seeded(9);
  for (let i = 0; i < 320; i++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(r() * 92);
    if (roof.get(x, y) === P.moss) {
      roof.set(x, y, P.mossDark);
      roof.set(x, y + 1, P.mossDark);
    }
  }
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(r() * W);
    const y = 40 + Math.floor(r() * 46);
    if (roof.get(x, y) !== -1) roof.set(x, y, i % 2 ? P.pink : P.white);
  }
  roof.outline(P.line);
  c.draw(roof);
  mossDrips(c, 4, 174, 93, 9);

  // shop window with a little chair inside
  windowBox(c, 28, 102, 40, 24, lights, { box: false });
  c.rect(42, 109, 2, 14, P.woodDark);
  c.rect(42, 117, 10, 2, P.woodDark);
  c.rect(50, 119, 2, 6, P.woodDark);
  // second window with a lamp
  windowBox(c, 112, 102, 24, 20, lights);
  c.rect(123, 108, 1, 10, P.woodDark);
  c.poly([[119, 105], [128, 105], [130, 110], [117, 110]], P.pinkDark);

  door(c, cx, 161, 30, 40);
  lantern(c, 68, 124, lights);
  // crates outside
  c.draw(part(W, H, (d) => {
    d.rect(152, 147, 15, 14, P.woodLight);
    d.rect(152, 153, 15, 1, P.wood);
    d.line(153, 148, 165, 160, P.wood);
    d.rect(156, 137, 10, 10, P.wood);
  }));
  ferns(c, 10, 161, 10, 8);
  ferns(c, 174, 161, 8, 1);
  spill(c, cx, 159, 28);
  lightUp(c, lights);
  return c;
}

// Street Clothes: gothic wizard tower with a dusty-rose spire and a boutique.
function shopClothes() {
  const W = 160;
  const H = 210;
  const c = new Canvas(W, H);
  const lights = [];
  const tx = 100; // tower center

  // tower
  const tower = new Canvas(W, H);
  tower.rect(tx - 26, 74, 52, 136, P.stone);
  tower.rect(tx + 12, 74, 14, 136, P.stoneShade);
  stones(tower, P.stone, P.stoneDark, 3, 7);
  stones(tower, P.stoneShade, P.stoneDark, 3, 7);
  tower.outline(P.line);
  c.draw(tower);
  mossy(c, tx - 26, 150, tx + 26, 209, 200, 5);

  // spire
  const spire = new Canvas(W, H);
  spire.poly([[tx - 38, 80], [tx, 12], [tx + 38, 80]], P.pink);
  spire.poly([[tx, 12], [tx + 38, 80], [tx + 14, 80]], P.pinkShade);
  shingles(spire, P.pink, P.pinkShade, 5, 2);
  shingles(spire, P.pinkShade, P.pinkDark, 5, 8);
  mossy(spire, tx - 36, 55, tx + 36, 78, 70, 15);
  spire.rect(tx - 40, 78, 80, 4, P.pinkDark);
  spire.outline(P.line);
  c.draw(spire);
  // iron finial with a little moon on top
  c.rect(tx, 2, 1, 10, P.iron);
  c.circle(tx, 4, 2.5, P.gold);
  c.circle(tx + 1, 3, 2, -1);

  // arched windows
  for (const wy of [98, 132]) {
    c.draw(part(W, H, (d) => {
      d.rect(tx - 6, wy, 13, 18, P.stoneDark);
      d.ellipse(tx, wy, 6.5, 6, P.stoneDark, (x, y) => y <= wy);
      d.rect(tx - 4, wy, 9, 16, P.glow);
      d.ellipse(tx, wy, 4.5, 4, P.glow, (x, y) => y <= wy);
      d.rect(tx - 4, wy + 10, 9, 6, P.glowWarm);
      d.rect(tx, wy - 4, 1, 20, P.iron);
    }));
    lights.push([tx, wy + 6, 16]);
  }
  // little iron balcony under the top window
  c.rect(tx - 10, 117, 21, 1, P.iron);
  for (let x = tx - 10; x <= tx + 10; x += 3) c.rect(x, 117, 1, 4, P.iron);
  c.rect(tx - 10, 121, 21, 1, P.iron);

  ivy(c, tx + 22, 90, 208, 13, 3);
  ivy(c, tx - 22, 160, 208, 5);

  // the boutique on the left: timber and plaster
  const shop = new Canvas(W, H);
  shop.rect(6, 142, 66, 68, P.cream);
  shop.rect(6, 142, 66, 4, P.creamShade);
  for (const x of [6, 69]) shop.rect(x, 142, 3, 68, P.woodDark);
  shop.rect(6, 196, 66, 14, P.stone);
  stones(shop, P.stone, P.stoneShade, 7, 5);
  shop.outline(P.line);
  c.draw(shop);
  mossy(c, 6, 190, 72, 209, 80, 3);

  // striped awning with a scalloped edge
  const awning = new Canvas(W, H);
  awning.poly([[2, 147], [10, 132], [70, 132], [76, 147]], P.cream);
  const stripes = new Canvas(W, H);
  for (let x = 2; x < 78; x += 8) {
    const lean = (x - 39) * 0.2;
    stripes.poly([[x, 147], [x + 4, 147], [x + 4 - lean, 132], [x - lean, 132]], P.pinkShade);
  }
  stripes.replace(P.pinkShade, -1, (x, y) => awning.get(x, y) === -1);
  awning.draw(stripes);
  for (let x = 2; x < 76; x += 4) awning.circle(x + 2, 147, 2, x % 8 === 2 ? P.pinkShade : P.cream, (px, py) => py >= 147);
  awning.outline(P.line);
  c.draw(awning);

  // display window with a shirt on a hanger
  windowBox(c, 14, 158, 34, 30, lights, { frame: P.woodDark, box: false });
  c.rect(30, 163, 1, 3, P.iron);
  c.draw(part(W, H, (d) => {
    d.rect(26, 166, 9, 1, P.lilacDark);
    d.rect(23, 167, 15, 4, P.lilacShade);
    d.rect(26, 171, 9, 10, P.lilacShade);
  }, P.plum));
  c.rect(28, 173, 3, 3, P.white);

  door(c, 58, 209, 14, 26, P.pinkDark, 0x5a3c4c);
  door(c, tx, 209, 20, 32, P.plum, 0x33294a);
  lantern(c, tx - 18, 168, lights);
  ferns(c, 146, 209, 9, 2);
  spill(c, tx, 207, 18);
  lightUp(c, lights);
  return c;
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
  'shop-matcha': shopMatcha,
  'shop-pjs': shopPJs,
  'shop-furniture': shopFurniture,
  'shop-plants': shopPlants,
  'shop-clothes': shopClothes,
  'decor-lantern-tree': lanternTree,
  'decor-fountain': fountain,
  'decor-mushrooms': mushrooms,
  'decor-flowers': flowers,
};

// Helpers other art files can reuse (tools/art/home.js draws the inside
// of your home with the same windows, lanterns and plants).
export { seeded, part, ball, glow, lantern, ivy, ferns, pot, door, windowBox };
