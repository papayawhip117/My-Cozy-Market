// Little pictures of every shop item (16 x 16 each), saved as
// public/assets/item-<id>.png. The shop catalogue shows them big next to
// the For sale list, and the backpack shows them in its slots.
//
// To add an item: add it to SHOP_STOCK in src/config.js, then add a
// function here with the same id and run `npm run art`.
import { Canvas } from './canvas.js';
import { P } from './palette.js';

export const ITEM_SIZE = 16;

// A few extra colors only the items use.
export const C = {
  matcha: 0x8fbf6a,
  matchaDark: 0x5f8f46,
  matchaLight: 0xb7d98e,
  bamboo: 0xd9c27a,
  bambooDark: 0xa8914e,
  terracotta: 0xb8694a,
  terracottaDark: 0x8a4a34,
  terracottaLight: 0xd08a64,
  potWhite: 0xe6ddcc,
  potWhiteShade: 0xb8ae9c,
  potGray: 0x8a8a90,
  potGrayShade: 0x66666c,
  potGreen: 0x5e7f6a,
  potGreenShade: 0x44604f,
  potBlack: 0x34303a,
  potBlackShade: 0x221f27,
  sky: 0xa8c4e6,
  skyShade: 0x7f9fc8,
  navy: 0x3c4a6e,
  khaki: 0x8f8a5a,
  khakiDark: 0x6a6640,
  beret: 0x8f3f4a,
  beretDark: 0x6a2c36,
  canvas: 0xe2d4b4,
  canvasShade: 0xbfae8a,
};

export const SHADOW = 0x0d0a12;

export function icon(draw) {
  return () => {
    const c = new Canvas(ITEM_SIZE, ITEM_SIZE);
    draw(c);
    return c;
  };
}

// A soft shadow on the floor under an item (drawn last, behind nothing).
export function shadow(c, cx, y, rx) {
  c.see(70, () => c.ellipse(cx, y, rx, 1, SHADOW, (x, yy) => c.get(x, yy) === -1));
}

// A plant pot: rim on top, slightly narrower at the bottom.
// Plants are drawn first, then the pot goes over their stems.
export function pot(c, { x, y, w, h, color, shade }) {
  c.poly([[x, y + 2], [x + w, y + 2], [x + w - 1, y + h], [x + 1, y + h]], color);
  c.rect(x + w - 2, y + 3, 1, h - 3, shade); // shading on the right
  c.rect(x - 1, y, w + 2, 2, color); // rim
  c.rect(x - 1, y + 1, w + 2, 1, shade);
}

// ---------- matcha shop ----------

const matchaLatte = icon((c) => {
  c.rect(3, 6, 8, 8, P.cream); // mug
  c.rect(9, 6, 2, 8, P.creamShade);
  c.rect(11, 8, 2, 1, P.cream); // handle
  c.rect(12, 8, 1, 4, P.cream);
  c.rect(11, 11, 2, 1, P.cream);
  c.rect(3, 6, 8, 2, C.matcha); // the drink
  c.rect(6, 6, 2, 1, P.white); // foam heart
  c.outline(P.line);
  c.see(110, () => {
    c.set(5, 2, P.white); // steam
    c.set(6, 3, P.white);
    c.set(8, 1, P.white);
    c.set(8, 3, P.white);
  });
});

const matchaMochi = icon((c) => {
  c.line(8, 0, 8, 15, P.woodLight); // the skewer
  const balls = [[3, C.matchaLight], [8, C.matcha], [13, C.matchaDark]];
  for (const [y, color] of balls) {
    c.circle(8, y - 0.5, 2.6, color);
    c.rect(6, y + 1, 5, 1, C.matchaDark); // shade under each ball
    c.set(7, y - 2, P.white); // shine
  }
  c.outline(P.line);
});

const bambooWhisk = icon((c) => {
  c.poly([[5, 7], [11, 7], [14, 14], [2, 14]], C.bamboo); // the tines fan out
  for (let x = 4; x <= 12; x += 2) c.line(8, 7, x, 14, C.bambooDark);
  c.rect(6, 1, 4, 7, C.bamboo); // handle
  c.rect(9, 1, 1, 7, C.bambooDark);
  c.rect(6, 4, 4, 1, C.bambooDark); // bamboo node
  c.outline(P.line);
});

const teaSet = icon((c) => {
  c.ellipse(6.5, 9.5, 4.5, 3.5, P.sage); // pot
  c.ellipse(6.5, 10.5, 4.5, 2.5, P.sageShade, (x, y) => y > 10);
  c.rect(4, 5, 6, 1, P.sageShade); // lid
  c.set(6, 4, P.sageDark);
  c.line(2, 9, 1, 6, P.sage); // spout
  c.rect(11, 8, 1, 3, P.sageDark); // handle
  c.rect(11, 12, 4, 3, P.cream); // a little cup
  c.rect(14, 12, 1, 3, P.creamShade);
  c.rect(11, 12, 4, 1, C.matcha);
  c.outline(P.line);
});

// ---------- PJ's store ----------

const fuzzySocks = icon((c) => {
  const sock = (x, color, cuff) => {
    c.rect(x, 2, 4, 9, color); // leg
    c.rect(x, 9, 6, 3, color); // foot
    c.set(x + 6, 10, color);
    c.rect(x, 2, 4, 2, cuff); // fuzzy cuff
    c.rect(x, 6, 4, 1, cuff); // stripe
  };
  sock(2, P.pink, P.white);
  sock(7, P.lilac, P.white);
  c.outline(P.line);
});

const sleepMask = icon((c) => {
  c.rect(0, 7, 16, 1, P.plum); // strap
  c.ellipse(5, 8, 4, 3.5, P.lilac);
  c.ellipse(10.5, 8, 4, 3.5, P.lilac);
  c.rect(2, 10, 12, 1, P.lilacShade);
  c.outline(P.line);
  for (const x of [3, 9]) {
    // closed sleepy eyes
    c.set(x, 7, P.plum);
    c.set(x + 1, 8, P.plum);
    c.set(x + 2, 8, P.plum);
    c.set(x + 3, 7, P.plum);
  }
  c.set(4, 10, P.pink); // little blush
  c.set(11, 10, P.pink);
});

const bunnySlippers = icon((c) => {
  c.ellipse(5, 4.5, 1.5, 3.5, P.white); // ears
  c.ellipse(9, 4.5, 1.5, 3.5, P.white);
  c.rect(5, 3, 1, 4, P.pink);
  c.rect(9, 3, 1, 4, P.pink);
  c.ellipse(8, 11, 6, 3, P.white); // the slipper
  c.rect(2, 12, 13, 2, P.cream);
  c.outline(P.line);
  c.set(5, 10, P.line); // eyes
  c.set(9, 10, P.line);
  c.set(7, 11, P.pink); // nose
});

const cloudPajamas = icon((c) => {
  c.poly([[1, 5], [5, 2], [11, 2], [15, 5], [13, 8], [11, 7], [11, 14], [5, 14], [5, 7], [3, 8]], C.sky);
  c.rect(10, 3, 1, 11, C.skyShade);
  c.rect(7, 2, 2, 2, C.skyShade); // collar
  for (const [x, y] of [[6, 6], [8, 10], [4, 4]]) {
    // little clouds
    c.rect(x, y, 3, 1, P.white);
    c.set(x + 1, y - 1, P.white);
  }
  c.outline(P.line);
});

// ---------- furniture ----------

const bookStack = icon((c) => {
  const book = (x, y, w, color, shade) => {
    c.rect(x, y, w, 3, color);
    c.rect(x + w - 2, y + 1, 2, 1, P.cream); // pages
    c.rect(x, y + 2, w, 1, shade);
  };
  book(2, 11, 12, P.red, P.redDark);
  book(3, 8, 10, P.sage, P.sageShade);
  book(2, 5, 11, P.lilac, P.lilacShade);
  c.outline(P.line);
  c.rect(6, 4, 1, 1, P.gold); // ribbon bookmark
  c.rect(6, 8, 1, 2, P.gold);
});

const floorCushion = icon((c) => {
  c.ellipse(8, 9.5, 7, 4.5, P.pink);
  c.ellipse(8, 11, 7, 3, P.pinkShade, (x, y) => y > 10);
  c.outline(P.line);
  c.set(8, 9, P.pinkDark); // button tuft
  c.line(4, 7, 7, 9, P.pinkShade);
  c.line(12, 7, 9, 9, P.pinkShade);
  for (const x of [0, 15]) c.set(x, 9, P.gold); // tassels
});

const woodenStool = icon((c) => {
  c.line(4, 7, 3, 14, P.wood, 2); // legs
  c.line(11, 7, 12, 14, P.wood, 2);
  c.line(8, 7, 8, 13, P.woodDark);
  c.rect(4, 11, 8, 1, P.woodDark); // rung
  c.ellipse(7.5, 5, 6, 2, P.woodLight); // seat
  c.rect(2, 5, 12, 2, P.wood);
  c.outline(P.line);
});

const bedsideLamp = icon((c) => {
  c.poly([[5, 1], [11, 1], [14, 8], [2, 8]], P.glowWarm); // shade
  c.rect(3, 7, 10, 1, P.glowDeep);
  c.rect(7, 9, 2, 4, P.woodDark); // stem
  c.rect(4, 13, 8, 2, P.wood); // base
  c.outline(P.line);
  c.see(120, () => c.rect(5, 2, 4, 5, P.glow)); // it glows
});

// ---------- plant shop (lots of pots and leaf shapes) ----------

const tinyCactus = icon((c) => {
  c.ellipse(8, 6.5, 2.5, 4, P.leafLight); // cactus
  c.rect(4, 5, 2, 3, P.leafLight); // arms
  c.rect(4, 4, 1, 2, P.leafLight);
  c.rect(11, 6, 2, 2, P.leafLight);
  c.rect(12, 5, 1, 2, P.leafLight);
  c.rect(9, 4, 1, 6, P.leaf);
  pot(c, { x: 4, y: 10, w: 8, h: 4, color: C.terracotta, shade: C.terracottaDark });
  c.outline(P.line);
  c.set(8, 1, P.pink); // a flower on top
  shadow(c, 8, 15, 5);
});

const flowerPot = icon((c) => {
  c.line(5, 4, 6, 9, P.leaf); // stems
  c.line(8, 2, 8, 9, P.leaf);
  c.line(11, 5, 10, 9, P.leaf);
  c.rect(3, 7, 2, 1, P.leafLight); // leaves
  c.rect(11, 7, 2, 1, P.leafLight);
  c.circle(5, 4, 1.5, P.pink);
  c.circle(8, 2, 1.5, P.gold);
  c.circle(11, 5, 1.5, P.lilac);
  pot(c, { x: 4, y: 9, w: 8, h: 5, color: C.potWhite, shade: C.potWhiteShade });
  c.outline(P.line);
  shadow(c, 8, 15, 5);
});

const hangingIvy = icon((c) => {
  c.line(8, 0, 4, 4, P.cream); // ropes
  c.line(8, 0, 11, 4, P.cream);
  // trailing vines with leaves
  for (const [x, len] of [[4, 10], [7, 8], [11, 11]]) {
    c.line(x, 7, x, 7 + len - 2, P.leafDark);
    for (let y = 8; y < 7 + len - 1; y += 2) c.set(x + ((y >> 1) % 2 ? 1 : -1), y, P.leafLight);
  }
  pot(c, { x: 3, y: 4, w: 9, h: 4, color: C.potGreen, shade: C.potGreenShade });
  c.outline(P.line);
});

const monstera = icon((c) => {
  c.line(8, 12, 4, 7, P.leafDark); // stems
  c.line(8, 12, 12, 6, P.leafDark);
  c.ellipse(4, 6, 3.5, 3, P.leaf); // big split leaves
  c.ellipse(11.5, 5, 3.5, 3, P.leafLight);
  c.ellipse(7.5, 3, 2.5, 2.5, P.leaf);
  // the famous splits: gaps cut in from the edges (the outline darkens them)
  c.line(1, 5, 3, 6, -1);
  c.line(2, 8, 3, 7, -1);
  c.line(14, 3, 12, 5, -1);
  c.line(15, 6, 13, 6, -1);
  pot(c, { x: 4, y: 10, w: 8, h: 4, color: C.potBlack, shade: C.potBlackShade });
  c.outline(P.line);
  shadow(c, 8, 15, 5);
});

const snakePlant = icon((c) => {
  // tall pointy leaves with yellow edges
  for (const [x, top] of [[5, 4], [7, 1], [9, 2], [11, 5]]) {
    c.poly([[x - 1, 11], [x + 1, 11], [x + 0.5, top], [x - 0.5, top]], P.leaf);
    c.line(x, top + 2, x, 10, P.leafLight);
  }
  c.rect(4, 6, 1, 4, P.gold);
  c.rect(12, 7, 1, 3, P.gold);
  pot(c, { x: 4, y: 10, w: 8, h: 4, color: C.potGray, shade: C.potGrayShade });
  c.outline(P.line);
  shadow(c, 8, 15, 5);
});

const bostonFern = icon((c) => {
  // fronds arching out in every direction
  const fronds = [[1, 9], [2, 5], [5, 2], [8, 1], [11, 2], [14, 5], [14, 9]];
  for (const [x, y] of fronds) {
    c.line(8, 9, x, y, P.fern);
    c.line(8, 9, (x + 8) / 2, (y + 9) / 2 - 1, P.mossLight);
  }
  c.ellipse(8, 8, 3, 2, P.moss);
  pot(c, { x: 4, y: 10, w: 8, h: 4, color: C.terracotta, shade: C.terracottaDark });
  c.outline(P.line);
  shadow(c, 8, 15, 5);
});

const bonsaiTree = icon((c) => {
  c.line(8, 11, 7, 6, P.woodDark, 2); // twisty trunk
  c.line(7, 7, 11, 5, P.woodDark);
  c.ellipse(5, 4, 3.5, 2, P.leaf); // leaf clouds
  c.ellipse(11, 4, 3, 2, P.leafLight);
  c.ellipse(8, 2, 2.5, 1.5, P.leaf);
  c.rect(2, 11, 12, 1, C.potBlack); // shallow tray pot
  c.rect(3, 12, 10, 2, C.potBlack);
  c.rect(3, 13, 10, 1, C.potBlackShade);
  c.outline(P.line);
  c.set(4, 3, P.mossLight);
  c.set(11, 3, P.mossLight);
  shadow(c, 8, 15, 6);
});

// ---------- street clothes ----------

const canvasTote = icon((c) => {
  c.rect(3, 6, 10, 9, C.canvas);
  c.rect(11, 6, 2, 9, C.canvasShade);
  c.line(5, 6, 5, 2, P.woodLight); // handle
  c.line(5, 2, 10, 2, P.woodLight);
  c.line(10, 2, 10, 6, P.woodLight);
  c.outline(P.line);
  c.rect(6, 9, 3, 2, P.leaf); // a leaf print
  c.set(8, 8, P.leafLight);
});

const beret = icon((c) => {
  c.ellipse(8, 9, 7, 3.5, C.beret);
  c.ellipse(8, 10.5, 7, 2, C.beretDark, (x, y) => y >= 11);
  c.rect(7, 4, 2, 2, C.beret); // the little stalk on top
  c.outline(P.line);
  c.set(5, 8, 0xb05a64); // shine
  c.set(6, 7, 0xb05a64);
});

const stripedTee = icon((c) => {
  c.poly([[1, 5], [5, 2], [11, 2], [15, 5], [13, 8], [11, 7], [11, 14], [5, 14], [5, 7], [3, 8]], P.white);
  for (let y = 4; y < 15; y += 3) c.replace(P.white, C.navy, (x, yy) => yy === y);
  c.rect(7, 2, 2, 1, P.creamShade); // neck
  c.outline(P.line);
});

const cargoPants = icon((c) => {
  c.rect(3, 1, 10, 2, C.khakiDark); // waistband
  c.rect(3, 3, 4, 12, C.khaki); // legs
  c.rect(9, 3, 4, 12, C.khaki);
  c.rect(7, 3, 2, 3, C.khaki);
  c.rect(3, 8, 2, 3, C.khakiDark); // side pockets
  c.rect(11, 8, 2, 3, C.khakiDark);
  c.outline(P.line);
  c.set(8, 2, P.gold); // button
});

// The file names: item-<id>.png (ids match SHOP_STOCK in src/config.js).
export const ITEMS = {
  'item-matcha-latte': matchaLatte,
  'item-matcha-mochi': matchaMochi,
  'item-bamboo-whisk': bambooWhisk,
  'item-tea-set': teaSet,
  'item-fuzzy-socks': fuzzySocks,
  'item-sleep-mask': sleepMask,
  'item-bunny-slippers': bunnySlippers,
  'item-cloud-pajamas': cloudPajamas,
  'item-book-stack': bookStack,
  'item-floor-cushion': floorCushion,
  'item-wooden-stool': woodenStool,
  'item-bedside-lamp': bedsideLamp,
  'item-tiny-cactus': tinyCactus,
  'item-flower-pot': flowerPot,
  'item-hanging-ivy': hangingIvy,
  'item-monstera': monstera,
  'item-snake-plant': snakePlant,
  'item-boston-fern': bostonFern,
  'item-bonsai-tree': bonsaiTree,
  'item-canvas-tote': canvasTote,
  'item-beret': beret,
  'item-striped-tee': stripedTee,
  'item-cargo-pants': cargoPants,
};
