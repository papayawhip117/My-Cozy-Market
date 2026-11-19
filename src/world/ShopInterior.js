import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT } from '../config.js';
import { addPanel } from '../ui/Panel.js';

// The inside of a shop, drawn with shapes (no image files yet).
// Every shop has the same layout but its own colors (THEMES below):
//
//   striped back wall, a hanging plant, wooden shelves with little things
//   on them, a lantern, a curtain on the right, the shopkeeper behind a
//   long counter with a cash register and a tips jar.
//
// Later this can be swapped for real pixel art, one image per shop.

// Dusky, muted colors to match the street at night.
const THEMES = {
  matcha: { wall: [0x3f5a42, 0x46644a], curtain: 0xb47c8a, things: [0x9cc48a, 0xe8dcc0, 0x6f9a5c, 0xc9b48a] },
  pjs: { wall: [0x55476a, 0x5e4f75], curtain: 0xd49ab0, things: [0xc7b3e6, 0xf2c4d4, 0xa8c4e6, 0xf2ead8] },
  furniture: { wall: [0x5e4636, 0x684e3d], curtain: 0xb07a72, things: [0xd9a77a, 0xa87850, 0xe8cfa0, 0x8a6a8a] },
  plants: { wall: [0x38503f, 0x3f5946], curtain: 0xc0868e, things: [0x7fb88f, 0x5a8a5a, 0xd96c5f, 0xf2c94c] },
  clothes: { wall: [0x4b3c5c, 0x544467], curtain: 0xc98aa8, things: [0xb08ad0, 0xf2a7b8, 0x8ab0d0, 0xf2ead8] },
};

// Shared wood and shadow colors.
const WOOD = 0x6b4a33;
const WOOD_LIGHT = 0x8a6444;
const WOOD_DARK = 0x4a3222;
const LINE = 0x1e1620; // outlines
const SHADOW = 0x0d0a12;
const GLOW = 0xf5b35a; // warm lantern light

// Which shapes sit on the shelves in each shop.
const SHELF_THINGS = {
  matcha: ['mug', 'jar', 'tin', 'mug', 'jar', 'tin'],
  pjs: ['folded', 'folded', 'jar', 'folded', 'books', 'folded'],
  furniture: ['books', 'lamp', 'box', 'books', 'box', 'lamp'],
  plants: ['pot', 'pot', 'jar', 'pot', 'pot', 'pot'],
  clothes: ['folded', 'hat', 'folded', 'box', 'hat', 'folded'],
};

const COUNTER_TOP = 192; // y of the counter's top edge
const CURTAIN_X = 420;

// Draw the whole room for `shop` (an entry from SHOPS in config.js).
export function drawShopInterior(scene, shop) {
  const theme = THEMES[shop.id] ?? THEMES.matcha;
  const g = scene.add.graphics();

  drawWall(g, theme);
  drawHangingPlant(g, 150, 10);
  drawShelf(g, 110, 200, 146, shop.id, theme, 0);
  drawShelf(g, 286, 404, 84, shop.id, theme, 2);
  drawShelf(g, 286, 404, 132, shop.id, theme, 4);
  drawLantern(scene, g, 345, 10);
  drawCurtain(g, theme);
  drawShopkeeper(g, 330, COUNTER_TOP);
  drawCounter(g);
  drawRegister(g, 368, COUNTER_TOP);
  drawTipsJar(scene, g, 286, COUNTER_TOP);
  drawNameSign(scene, shop.name, 250);
}

function drawWall(g, theme) {
  // Vertical stripes.
  const STRIPE = 10;
  for (let x = 0; x < GAME_WIDTH; x += STRIPE) {
    g.fillStyle(theme.wall[(x / STRIPE) % 2], 1).fillRect(x, 0, STRIPE, COUNTER_TOP);
  }
  // Darker toward the ceiling, like the light comes from below.
  for (let i = 0; i < 6; i++) g.fillStyle(SHADOW, 0.07).fillRect(0, 0, GAME_WIDTH, 60 - i * 10);
  // Wooden trim along the ceiling.
  g.fillStyle(WOOD_DARK, 1).fillRect(0, 0, GAME_WIDTH, 8);
  g.fillStyle(WOOD, 1).fillRect(0, 8, GAME_WIDTH, 2);
  g.fillStyle(LINE, 0.5).fillRect(0, 10, GAME_WIDTH, 1);
}

// A pot on a rope with ivy spilling over the edge.
function drawHangingPlant(g, x, top) {
  g.fillStyle(0xc9b48a, 1);
  g.fillRect(x - 6, top, 1, 30).fillRect(x + 5, top, 1, 30); // ropes
  g.fillTriangle(x - 6, top + 30, x + 6, top + 30, x, top);
  const potY = top + 30;
  g.fillStyle(LINE, 1).fillRect(x - 10, potY - 1, 21, 15);
  g.fillStyle(0xb06a4a, 1).fillRect(x - 9, potY, 19, 13);
  g.fillStyle(0xc98260, 1).fillRect(x - 9, potY, 19, 3);
  // Leaves: two clumps on top and vines hanging down.
  const leaf = (lx, ly, c) => g.fillStyle(c, 1).fillEllipse(lx, ly, 6, 4);
  for (const [lx, ly] of [[-8, -2], [-3, -4], [3, -3], [8, -1], [0, -6]]) leaf(x + lx, potY + ly, 0x5a8a5a);
  for (const [vx, len] of [[-9, 34], [-4, 22], [7, 40], [10, 26]]) {
    for (let i = 0; i < len; i += 5) leaf(x + vx + (i % 10 ? 1 : -1), potY + 8 + i, i % 10 ? 0x6f9a5c : 0x4f7a4f);
  }
}

// A plank with brackets, and little things standing on it.
function drawShelf(g, left, right, y, shopId, theme, start) {
  // Things first, so they sit on top of the plank.
  const kinds = SHELF_THINGS[shopId] ?? SHELF_THINGS.matcha;
  const count = 5;
  const step = (right - left) / count;
  for (let i = 0; i < count; i++) {
    const kind = kinds[(start + i) % kinds.length];
    const color = theme.things[(start + i) % theme.things.length];
    drawThing(g, kind, Math.round(left + step * (i + 0.5)), y, color);
  }
  g.fillStyle(LINE, 1).fillRect(left - 1, y - 1, right - left + 2, 7);
  g.fillStyle(WOOD_LIGHT, 1).fillRect(left, y, right - left, 2);
  g.fillStyle(WOOD, 1).fillRect(left, y + 2, right - left, 3);
  g.fillStyle(SHADOW, 0.3).fillRect(left, y + 6, right - left, 3); // shadow on the wall
  g.fillStyle(WOOD_DARK, 1);
  for (const bx of [left + 6, right - 10]) g.fillTriangle(bx, y + 5, bx + 4, y + 5, bx, y + 13);
}

// One small object standing on a shelf at (x, bottom).
function drawThing(g, kind, x, bottom, color) {
  const box = (bx, by, w, h, c) => {
    g.fillStyle(LINE, 1).fillRect(bx - 1, by - 1, w + 2, h + 2);
    g.fillStyle(c, 1).fillRect(bx, by, w, h);
  };
  const light = Phaser.Display.Color.IntegerToColor(color).brighten(15).color;
  switch (kind) {
    case 'mug':
      box(x - 4, bottom - 8, 8, 8, color);
      g.lineStyle(1, LINE, 1).strokeRect(x + 4, bottom - 6, 2, 3);
      break;
    case 'jar':
      box(x - 4, bottom - 11, 8, 11, color);
      box(x - 3, bottom - 13, 6, 2, WOOD);
      g.fillStyle(0xf2ead8, 0.8).fillRect(x - 3, bottom - 7, 6, 3); // label
      break;
    case 'tin':
      box(x - 3, bottom - 9, 7, 9, color);
      g.fillStyle(light, 1).fillRect(x - 3, bottom - 9, 7, 2);
      break;
    case 'folded':
      box(x - 7, bottom - 4, 14, 4, color);
      box(x - 6, bottom - 9, 12, 4, light);
      box(x - 7, bottom - 14, 14, 4, color);
      break;
    case 'books':
      box(x - 6, bottom - 12, 3, 12, color);
      box(x - 2, bottom - 10, 3, 10, 0xf2ead8);
      box(x + 2, bottom - 13, 3, 13, light);
      break;
    case 'box':
      box(x - 6, bottom - 9, 12, 9, color);
      g.fillStyle(LINE, 0.4).fillRect(x - 1, bottom - 9, 2, 9); // ribbon
      break;
    case 'lamp':
      box(x - 1, bottom - 8, 2, 8, WOOD_DARK);
      g.fillStyle(LINE, 1).fillTriangle(x - 7, bottom - 7, x + 7, bottom - 7, x, bottom - 17);
      g.fillStyle(color, 1).fillTriangle(x - 5, bottom - 8, x + 5, bottom - 8, x, bottom - 15);
      break;
    case 'hat':
      box(x - 7, bottom - 3, 14, 3, color);
      box(x - 4, bottom - 8, 8, 5, color);
      break;
    case 'pot':
    default:
      box(x - 4, bottom - 7, 8, 7, 0xb06a4a);
      g.fillStyle(0x5a8a5a, 1).fillEllipse(x, bottom - 10, 10, 7);
      g.fillStyle(color, 1).fillEllipse(x - 2, bottom - 12, 4, 4);
  }
}

// A lantern on a chain with a soft flickering glow.
function drawLantern(scene, g, x, top) {
  g.fillStyle(LINE, 1).fillRect(x, top, 1, 18);
  const y = top + 18;
  g.fillStyle(LINE, 1).fillRect(x - 5, y, 11, 14);
  g.fillStyle(0xf7dc8a, 1).fillRect(x - 3, y + 2, 7, 10);
  g.fillStyle(GLOW, 1).fillRect(x - 3, y + 8, 7, 4);
  g.fillStyle(WOOD_DARK, 1).fillRect(x - 6, y - 1, 13, 2).fillRect(x - 6, y + 13, 13, 2);
  const glow = scene.add.circle(x, y + 7, 40, GLOW, 0.12).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: glow, alpha: 0.7, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

// A curtain on a rod, tied back in the middle.
function drawCurtain(g, theme) {
  const x = CURTAIN_X;
  const dark = Phaser.Display.Color.IntegerToColor(theme.curtain).darken(18).color;
  const tie = 120;
  const shape = [
    { x, y: 12 }, { x: GAME_WIDTH, y: 12 }, { x: GAME_WIDTH, y: COUNTER_TOP },
    { x: x + 8, y: COUNTER_TOP }, { x: x + 30, y: tie }, { x: x + 8, y: 60 },
  ];
  g.fillStyle(LINE, 1).fillPoints(shape.map((p) => ({ x: p.x - 1, y: p.y })), true);
  g.fillStyle(theme.curtain, 1).fillPoints(shape, true);
  // Folds: darker lines that pinch in at the tie.
  g.lineStyle(2, dark, 1);
  for (let f = 0; f < 4; f++) {
    const top = x + 6 + f * 14;
    const mid = x + 34 + f * 11;
    g.lineBetween(top, 14, mid, tie);
    g.lineBetween(mid, tie, top + 4, COUNTER_TOP);
  }
  // Rod and tie-back.
  g.fillStyle(WOOD_DARK, 1).fillRect(x - 6, 10, GAME_WIDTH - x + 6, 4);
  g.fillStyle(WOOD_LIGHT, 1).fillCircle(x - 6, 12, 3);
  g.fillStyle(0xf2c94c, 1).fillRect(x + 28, tie - 2, GAME_WIDTH - x - 28, 3);
}

// The shopkeeper: a cat-eared shadow with glowing eyes (placeholder art).
function drawShopkeeper(g, x, counterTop) {
  const c = 0x231b2c;
  g.fillStyle(c, 1);
  g.fillRoundedRect(x - 20, counterTop - 46, 40, 50, 10); // body
  g.fillCircle(x, counterTop - 56, 14); // head
  g.fillTriangle(x - 13, counterTop - 62, x - 4, counterTop - 68, x - 12, counterTop - 78); // ears
  g.fillTriangle(x + 13, counterTop - 62, x + 4, counterTop - 68, x + 12, counterTop - 78);
  g.fillStyle(0xffe3a0, 1).fillRect(x - 6, counterTop - 58, 3, 2).fillRect(x + 4, counterTop - 58, 3, 2); // eyes
}

// The long counter across the bottom of the screen.
function drawCounter(g) {
  const top = COUNTER_TOP;
  g.fillStyle(LINE, 1).fillRect(0, top - 1, GAME_WIDTH, 10);
  g.fillStyle(WOOD_LIGHT, 1).fillRect(0, top, GAME_WIDTH, 3);
  g.fillStyle(WOOD, 1).fillRect(0, top + 3, GAME_WIDTH, 5);
  g.fillStyle(WOOD_DARK, 1).fillRect(0, top + 9, GAME_WIDTH, GAME_HEIGHT - top - 9);
  g.fillStyle(SHADOW, 0.45).fillRect(0, top + 9, GAME_WIDTH, 3); // shadow under the lip
  // Planks on the front.
  g.fillStyle(LINE, 0.5);
  for (let x = 12; x < GAME_WIDTH; x += 24) g.fillRect(x, top + 12, 1, GAME_HEIGHT - top - 12);
  // Panels with a lighter frame, every few planks.
  g.lineStyle(1, WOOD, 1);
  for (let x = 24; x < GAME_WIDTH - 40; x += 96) g.strokeRect(x, top + 22, 72, 36);
}

// An old brass-and-iron cash register sitting on the counter.
function drawRegister(g, x, counterTop) {
  const b = counterTop;
  g.fillStyle(LINE, 1).fillRect(x - 19, b - 23, 38, 23);
  g.fillStyle(0x6a5a62, 1).fillRect(x - 18, b - 22, 36, 22); // body
  g.fillStyle(0x7d6b74, 1).fillRect(x - 18, b - 22, 36, 3);
  // Keys
  for (let r = 0; r < 2; r++)
    for (let k = 0; k < 6; k++) g.fillStyle(0xe8dcc0, 1).fillRect(x - 15 + k * 5, b - 16 + r * 5, 3, 3);
  g.fillStyle(0xb08a50, 1).fillRect(x - 18, b - 5, 36, 5); // drawer
  g.fillStyle(LINE, 1).fillRect(x - 2, b - 3, 4, 1);
  // Price display on top.
  g.fillStyle(LINE, 1).fillRect(x - 11, b - 33, 22, 11);
  g.fillStyle(0x9cc48a, 1).fillRect(x - 10, b - 32, 20, 8);
  g.fillStyle(0x5a8a5a, 1).fillRect(x - 8, b - 30, 2, 4).fillRect(x - 4, b - 30, 2, 4).fillRect(x + 2, b - 30, 2, 4);
}

// A glass jar with a few coins in it and a little "Tips" tag.
function drawTipsJar(scene, g, x, counterTop) {
  const b = counterTop;
  g.fillStyle(LINE, 1).fillRect(x - 12, b - 25, 24, 25);
  g.fillStyle(0xbcd3dc, 0.45).fillRect(x - 11, b - 22, 22, 22); // glass
  g.fillStyle(0xf2c94c, 1);
  for (const [cx, cy] of [[-7, 4], [-2, 3], [3, 4], [7, 3], [-4, 7], [1, 7], [5, 7]]) g.fillRect(x + cx, b - cy - 2, 4, 2);
  g.fillStyle(0xffffff, 0.5).fillRect(x - 9, b - 20, 2, 12); // shine
  g.fillStyle(WOOD, 1).fillRect(x - 12, b - 25, 24, 3); // lid rim
  // Paper tag on the front.
  g.fillStyle(0xf2ead8, 1).fillRect(x - 9, b - 16, 18, 9);
  scene.add
    .text(x, b - 12, 'Tips', { fontFamily: FONT, fontSize: '10px', color: '#3a2a26', resolution: 1 })
    .setOrigin(0.5, 0.5);
}

// The shop's name on a wooden sign hanging from the ceiling.
function drawNameSign(scene, name, x) {
  const text = scene.add
    .text(0, 0, name, { fontFamily: FONT, fontSize: '12px', color: COLORS.signText, resolution: 1 })
    .setOrigin(0.5, 0.5);
  const w = Math.ceil(text.width) + 22;
  const h = 22;
  const sign = scene.add.container(x, 52);
  const g = scene.add.graphics();
  g.fillStyle(LINE, 1).fillRect(-w / 2 + 8, -h / 2 - 42, 1, 42).fillRect(w / 2 - 9, -h / 2 - 42, 1, 42); // chains
  sign.add([g, addPanel(scene, -w / 2, -h / 2, w, h, 'panel-wood'), text]);
  // A gentle sway.
  scene.tweens.add({ targets: sign, angle: { from: -1.2, to: 1.2 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return sign;
}
