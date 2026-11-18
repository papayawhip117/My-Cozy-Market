// Generates all of Paw Pal's pixel art as PNG files in public/assets/.
//
//   npm run art                 -> redraw everything
//   npm run art -- --preview    -> also save big preview images in tools/preview/
//
// Hand-editing a PNG in Aseprite/Piskel? Add its file name to KEEP below,
// otherwise the next `npm run art` will draw over your changes.
import { mkdirSync } from 'node:fs';
import { Canvas, sheet } from './art/canvas.js';
import { CHARACTER_PARTS, FRAMES, FRAME_W, FRAME_H } from './art/character.js';
import { SCENERY } from './art/scenery.js';
import { BACKGROUND } from './art/background.js';
import { UI } from './art/ui.js';
import { MENU } from './art/menu.js';
import { HOME } from './art/home.js';

const KEEP = new Set([
  // 'shop-matcha.png',
]);

const OUT = 'public/assets';
const PREVIEW = process.argv.includes('--preview');
mkdirSync(OUT, { recursive: true });

let count = 0;
function save(canvas, file) {
  if (KEEP.has(file)) {
    console.log(`  kept    ${file} (hand-edited)`);
    return;
  }
  canvas.savePNG(`${OUT}/${file}`);
  count++;
}

// 1. Character layers: one sprite sheet per part (+ a "-fixed" sheet if needed).
const characterSheets = {};
for (const [name, draw] of Object.entries(CHARACTER_PARTS)) {
  const frames = FRAMES.map((f) => draw(f));
  const tint = sheet(frames.map((fr) => fr.tint));
  save(tint, `${name}.png`);
  characterSheets[name] = { tint };
  const fixedFrames = frames.map((fr) => fr.fixed).filter(Boolean);
  if (fixedFrames.length && !fixedFrames.every((c) => c.isEmpty())) {
    const fixed = sheet(fixedFrames);
    save(fixed, `${name}-fixed.png`);
    characterSheets[name].fixed = fixed;
  }
}

// 2. Shops and decorations: one image each.
const scenery = {};
for (const [name, draw] of Object.entries(SCENERY)) {
  scenery[name] = draw().trimmed();
  save(scenery[name], `${name}.png`);
}

// 3. Background layers (not trimmed: they tile across the street).
for (const [name, draw] of Object.entries(BACKGROUND)) save(draw(), `${name}.png`);

// 4. HUD pieces (the coin sprite sheet and the framed panels).
const ui = {};
for (const [name, draw] of Object.entries(UI)) {
  ui[name] = draw();
  save(ui[name], `${name}.png`);
}

// 5. The corner menu (button, icons, backpack slots).
for (const [name, draw] of Object.entries(MENU)) save(draw(), `${name}.png`);

// 6. Inside your home (not trimmed: walls and floor tile side to side).
const home = {};
for (const [name, draw] of Object.entries(HOME)) {
  home[name] = draw();
  save(home[name], `${name}.png`);
}

console.log(`Drew ${count} images into ${OUT}/`);

// ---------- previews (not used by the game) ----------
if (PREVIEW) {
  mkdirSync('tools/preview', { recursive: true });

  // Multiply a gray canvas by a color, the same way Phaser's tint works.
  const tinted = (c, color) => {
    const out = new Canvas(c.w, c.h);
    for (let i = 0; i < c.px.length; i++) {
      const p = c.px[i];
      if (p === -1) continue;
      const ch = (s) => Math.round((((p >> s) & 255) * ((color >> s) & 255)) / 255);
      out.px[i] = (ch(16) << 16) | (ch(8) << 8) | ch(0);
    }
    return out;
  };

  const looks = [
    { hair: 'bob', hairColor: 0xf2b3c4, ears: 'cat', fur: 0xf2b3c4, eyes: 'round', eyeColor: 0x5fa86e },
    { hair: 'long', hairColor: 0x8a5a44, ears: 'fox', fur: 0xe8955f, eyes: 'round', eyeColor: 0x6a7fd0 },
    { hair: 'ponytail', hairColor: 0x3d3346, ears: 'cat', fur: 0x3d3346, eyes: 'sleepy', eyeColor: 0xd08a3a },
    { hair: 'long', hairColor: 0xf3e3c0, ears: 'fox', fur: 0xc9c2d9, eyes: 'sleepy', eyeColor: 0x9a6ad0 },
  ];

  const bg = 0x2f4a52;
  const strip = new Canvas(FRAME_W * FRAMES.length, FRAME_H * looks.length);
  strip.rect(0, 0, strip.w, strip.h, bg);
  looks.forEach((l, row) => {
    const layers = [
      [`player-tail-${l.ears}`, l.fur],
      [`player-hairback-${l.hair}`, l.hairColor],
      ['player-body'],
      ['player-outfit-basic'],
      ['player-arms'],
      [`player-eyes-${l.eyes}`, l.eyeColor],
      [`player-hair-${l.hair}`, l.hairColor],
      [`player-ears-${l.ears}`, l.fur],
    ];
    for (const [name, color] of layers) {
      const s = characterSheets[name];
      strip.draw(color ? tinted(s.tint, color) : s.tint, 0, row * FRAME_H);
      if (s.fixed) strip.draw(s.fixed, 0, row * FRAME_H);
    }
  });
  strip.scaled(8).savePNG('tools/preview/character.png');

  // All scenery side by side on a grass strip.
  const items = Object.values(scenery);
  const gap = 12;
  const w = items.reduce((s, c) => s + c.w + gap, gap);
  const h = Math.max(...items.map((c) => c.h)) + 16;
  const row = new Canvas(w, h);
  row.rect(0, 0, w, h, bg);
  row.rect(0, h - 12, w, 12, 0x34503a);
  let x = gap;
  for (const c of items) {
    row.draw(c, x, h - 12 - c.h);
    x += c.w + gap;
  }
  row.scaled(3).savePNG('tools/preview/scenery.png');

  // The HUD pieces, big.
  const pieces = [ui['panel-wood'], ui['panel-moss'], ui.coin];
  const hud = new Canvas(pieces.reduce((s, c) => s + c.w + 4, 4), Math.max(...pieces.map((c) => c.h)) + 8);
  hud.rect(0, 0, hud.w, hud.h, bg);
  let hx = 4;
  for (const c of pieces) {
    hud.draw(c, hx, 4);
    hx += c.w + 4;
  }
  hud.scaled(8).savePNG('tools/preview/hud.png');

  // A quick mock-up of the home room, about how the game lays it out.
  const room = new Canvas(480, 270);
  for (let x = 0; x < 480; x += home['home-wall'].w) {
    room.draw(home['home-wall'], x, 0);
    room.draw(home['home-floor'], x, 230);
  }
  const put = (name, x, bottom) => room.draw(home[name], Math.round(x - home[name].w / 2), bottom - home[name].h);
  put('home-door', 40, 231);
  put('home-window', 150, 150);
  put('home-fireplace', 300, 231);
  put('home-lantern', 220, 44);
  put('home-slot-wall', 410, 130);
  put('home-slot-floor', 410, 232);
  room.scaled(3).savePNG('tools/preview/home.png');
  console.log('Previews saved in tools/preview/');
}
