// More 16 x 16 shop item pictures: the plant shop's trees and
// flowers, the furniture shop's lamps, chairs, beds, decor and tables, and the
// new clothes. (The first batch lives in items.js.) Same rules: the file name
// is item-<id>.png and the id must match SHOP_STOCK in src/config.js.
import { P } from './palette.js';
import { C, icon, shadow, pot } from './items.js';

const WOOD_OAK = 0x9a6f48;
const PINK_PETAL = 0xf2b3c4;
const PINK_DEEP = 0xd9849b;
const YELLOW = 0xf2c94c;
const NAVY = 0x2a2a4a;
const DENIM = 0x4f6fa0;
const DENIM_DARK = 0x38527e;
const PLUM_PLAID = 0x6b3a5e;

// A little bundle of stems wrapped in paper: heads(c) draws the blooms.
function bouquet(c, stems, heads, wrap = P.cream, ribbon = P.pink) {
  for (const [x, top] of stems) c.line(x, top, 8, 12, P.leaf);
  heads(c);
  c.poly([[3, 9], [13, 9], [8, 15]], wrap); // paper cone
  c.rect(5, 10, 6, 1, ribbon);
  c.outline(P.line);
}

// A round flower: petals around a center.
function bloom(c, x, y, petals, center) {
  for (const [ox, oy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) c.set(x + ox, y + oy, petals);
  c.set(x, y, center);
}

// ---------- plants ----------

const succulentTrio = icon((c) => {
  c.circle(4, 8, 2.3, P.sage);
  c.circle(12, 8, 2.3, P.sage);
  c.circle(8, 6, 3, P.leafLight);
  for (const [x, y] of [[4, 8], [12, 8], [8, 6]]) c.set(x, y, P.pinkShade); // rosette centers
  pot(c, { x: 2, y: 10, w: 12, h: 4, color: C.potWhite, shade: C.potWhiteShade });
  c.outline(P.line);
  shadow(c, 8, 15, 6);
});

const peaceLily = icon((c) => {
  c.ellipse(5, 8, 2.2, 4, P.leaf);
  c.ellipse(11, 8, 2.2, 4, P.leaf);
  c.ellipse(8, 7, 1.8, 4, P.leafLight);
  c.ellipse(8, 3.5, 2, 3, P.white); // the white bloom
  c.rect(8, 3, 1, 3, P.gold);
  pot(c, { x: 4, y: 10, w: 8, h: 4, color: C.potGray, shade: C.potGrayShade });
  c.outline(P.line);
  shadow(c, 8, 15, 5);
});

const miniPalm = icon((c) => {
  c.rect(7, 6, 2, 7, P.wood);
  c.line(8, 5, 2, 4, P.leaf, 2);
  c.line(8, 5, 14, 4, P.leaf, 2);
  c.line(8, 5, 3, 9, P.leafLight, 2);
  c.line(8, 5, 13, 9, P.leafLight, 2);
  c.line(8, 5, 8, 1, P.leaf, 2);
  pot(c, { x: 4, y: 11, w: 8, h: 4, color: C.terracotta, shade: C.terracottaDark });
  c.outline(P.line);
});

const fiddleLeafFig = icon((c) => {
  c.line(8, 13, 8, 3, P.woodDark);
  c.ellipse(5, 10, 2.2, 2.6, P.leaf);
  c.ellipse(11, 8, 2.2, 2.6, P.leafLight);
  c.ellipse(5, 6, 2.2, 2.6, P.leafLight);
  c.ellipse(11, 4, 2.2, 2.6, P.leaf);
  c.ellipse(8, 2, 2, 2, P.leaf);
  pot(c, { x: 5, y: 11, w: 6, h: 4, color: C.potWhite, shade: C.potWhiteShade });
  c.outline(P.line);
  shadow(c, 8, 15, 4);
});

const lemonTree = icon((c) => {
  c.rect(7, 8, 2, 5, P.wood);
  c.ellipse(8, 5, 6, 4.2, P.leaf);
  c.ellipse(6, 3, 3, 2, P.leafLight);
  for (const [x, y] of [[4, 5], [9, 3], [11, 6], [7, 7]]) c.rect(x, y, 2, 2, YELLOW); // lemons
  pot(c, { x: 4, y: 11, w: 8, h: 4, color: C.terracotta, shade: C.terracottaDark });
  c.outline(P.line);
  shadow(c, 8, 15, 5);
});

const sakuraTree = icon((c) => {
  c.line(8, 14, 8, 8, P.woodDark, 2);
  c.line(8, 10, 4, 6, P.woodDark);
  c.line(8, 9, 12, 5, P.woodDark);
  c.ellipse(8, 5, 7, 4.5, PINK_PETAL);
  c.ellipse(4, 7, 3, 2, PINK_PETAL);
  c.ellipse(12, 7, 3, 2, PINK_PETAL);
  for (const [x, y] of [[5, 4], [9, 3], [11, 6], [7, 7], [3, 7]]) c.set(x, y, PINK_DEEP);
  c.outline(P.line);
  c.set(2, 12, PINK_PETAL); // drifting petals
  c.set(13, 13, PINK_PETAL);
  c.set(5, 14, PINK_PETAL);
});

const daisies = icon((c) => {
  bouquet(c, [[4, 3], [8, 2], [12, 4]], (g) => {
    for (const [x, y] of [[4, 3], [8, 2], [12, 4]]) bloom(g, x, y, P.white, YELLOW);
  });
});

const tulips = icon((c) => {
  bouquet(c, [[4, 4], [8, 3], [12, 4]], (g) => {
    for (const [x, y, color] of [[4, 4, PINK_DEEP], [8, 3, P.red], [12, 4, PINK_PETAL]]) {
      g.rect(x - 1, y - 1, 3, 3, color);
      g.set(x - 1, y - 2, color);
      g.set(x + 1, y - 2, color);
    }
  });
});

const sunflowers = icon((c) => {
  bouquet(c, [[4, 4], [11, 3]], (g) => {
    for (const [x, y] of [[4, 4], [11, 3]]) {
      g.circle(x, y, 3, YELLOW);
      g.circle(x, y, 1.2, P.woodDark);
    }
  }, P.creamShade, P.leaf);
});

const lavender = icon((c) => {
  bouquet(c, [[4, 3], [8, 1], [12, 3]], (g) => {
    for (const [x, y] of [[4, 3], [8, 1], [12, 3]]) {
      for (let k = 0; k < 4; k++) {
        g.set(x - 1, y + k * 2, P.lilac);
        g.set(x + (k % 2), y + k * 2 - 1, P.lilacShade);
        g.set(x, y + k * 2, P.lilac);
      }
    }
  }, P.cream, P.lilacShade);
});

const roses = icon((c) => {
  bouquet(c, [[4, 4], [8, 2], [12, 4]], (g) => {
    for (const [x, y] of [[4, 4], [8, 2], [12, 4]]) {
      g.circle(x, y, 2, P.red);
      g.set(x, y, P.redDark);
      g.set(x + 1, y - 1, P.redDark);
    }
  }, P.creamShade, P.red);
});

// ---------- furniture: lamps ----------

const paperLantern = icon((c) => {
  c.ellipse(8, 8, 5, 5.5, P.glowWarm);
  c.ellipse(8, 8, 3, 4, P.glow);
  for (const x of [4, 8, 12]) c.line(x, 4, x, 12, P.glowDeep);
  c.rect(5, 1, 6, 1, P.woodDark);
  c.rect(5, 14, 6, 1, P.woodDark);
  c.line(8, 0, 8, 1, P.iron);
  c.outline(P.line);
  c.line(8, 15, 8, 15, P.red);
});

const mushroomLamp = icon((c) => {
  c.rect(6, 8, 4, 6, P.cream);
  c.rect(9, 8, 1, 6, P.creamShade);
  c.ellipse(8, 6, 6, 4, PINK_DEEP);
  c.rect(2, 7, 12, 1, P.pinkDark);
  for (const [x, y] of [[5, 4], [9, 3], [11, 6]]) c.rect(x, y, 2, 1, P.white); // spots
  c.outline(P.line);
  c.see(90, () => c.ellipse(8, 5, 7, 5, P.spirit, (x, y) => c.get(x, y) === -1));
  shadow(c, 8, 15, 4);
});

const floorLamp = icon((c) => {
  c.poly([[5, 1], [11, 1], [14, 6], [2, 6]], P.cream);
  c.poly([[11, 1], [14, 6], [11, 6]], P.creamShade);
  c.rect(8, 6, 1, 8, P.woodDark);
  c.rect(5, 14, 7, 1, P.woodDark);
  c.outline(P.line);
  c.see(120, () => c.rect(5, 2, 6, 3, P.glow));
});

// ---------- furniture: chairs ----------

const armchair = icon((c) => {
  c.rect(3, 2, 10, 8, P.pinkShade); // back
  c.rect(1, 6, 3, 7, P.pink); // arms
  c.rect(12, 6, 3, 7, P.pink);
  c.rect(4, 8, 8, 5, P.pink); // seat
  c.rect(4, 12, 8, 1, P.pinkDark);
  c.rect(5, 3, 6, 1, P.pink); // back highlight
  c.rect(2, 14, 2, 1, P.woodDark);
  c.rect(12, 14, 2, 1, P.woodDark);
  c.outline(P.line);
});

const rockingChair = icon((c) => {
  c.rect(4, 1, 2, 9, WOOD_OAK); // tall back
  for (const y of [2, 4, 6]) c.rect(6, y, 3, 1, WOOD_OAK); // slats
  c.rect(4, 9, 9, 2, P.woodLight); // seat
  c.rect(11, 9, 2, 5, WOOD_OAK); // front leg
  c.rect(5, 11, 2, 3, WOOD_OAK);
  c.line(2, 14, 8, 15, P.wood); // curved rocker
  c.line(8, 15, 14, 14, P.wood);
  c.outline(P.line);
});

// ---------- furniture: beds ----------

const cozyBed = icon((c) => {
  c.rect(1, 3, 2, 11, P.woodDark); // headboard
  c.rect(2, 8, 13, 4, P.cream); // mattress
  c.rect(5, 7, 10, 5, P.lilac); // quilt
  c.rect(5, 7, 10, 1, P.lilacShade);
  for (const x of [8, 11]) c.rect(x, 8, 1, 4, P.lilacShade); // quilt stitches
  c.ellipse(4, 7, 2, 1.5, P.white); // pillow
  c.rect(13, 12, 2, 2, P.woodDark);
  c.rect(2, 12, 1, 2, P.woodDark);
  c.outline(P.line);
});

const canopyBed = icon((c) => {
  c.rect(1, 1, 14, 2, P.plum); // canopy top
  c.rect(1, 1, 1, 13, P.woodDark); // posts
  c.rect(14, 1, 1, 13, P.woodDark);
  c.poly([[2, 3], [5, 3], [3, 11]], P.lilac); // drapes
  c.poly([[11, 3], [14, 3], [13, 11]], P.lilac);
  c.rect(2, 10, 12, 3, P.pink);
  c.rect(2, 10, 12, 1, P.cream);
  c.ellipse(6, 9.5, 2, 1, P.white);
  c.outline(P.line);
});

const hammock = icon((c) => {
  c.rect(1, 1, 1, 14, P.woodDark); // posts
  c.rect(14, 1, 1, 14, P.woodDark);
  c.line(2, 3, 6, 9, P.cream);
  c.line(13, 3, 10, 9, P.cream);
  c.ellipse(8, 9, 5, 2, P.pink); // the sagging hammock
  c.rect(4, 8, 8, 1, P.pinkShade);
  c.rect(5, 10, 6, 1, P.pinkDark);
  c.outline(P.line);
});

// ---------- furniture: wall art and decor ----------

const moonPrint = icon((c) => {
  c.rect(2, 1, 12, 14, WOOD_OAK);
  c.rect(3, 2, 10, 12, NAVY);
  c.circle(8, 7, 3, P.glow);
  c.circle(9, 6, 2.6, NAVY); // bites out a crescent
  for (const [x, y] of [[5, 4], [11, 5], [6, 11], [10, 11], [8, 3]]) c.set(x, y, P.white);
  c.outline(P.line);
});

const botanicalPrint = icon((c) => {
  c.rect(2, 1, 12, 14, WOOD_OAK);
  c.rect(3, 2, 10, 12, P.cream);
  c.line(8, 13, 8, 4, P.leafDark);
  for (const y of [5, 7, 9, 11]) {
    c.line(8, y, 5, y - 1, P.leaf);
    c.line(8, y, 11, y - 1, P.leaf);
  }
  c.set(8, 3, P.leafLight);
  c.outline(P.line);
});

const wallMirror = icon((c) => {
  c.ellipse(8, 5.5, 5.5, 4, P.mossDark);
  c.rect(2, 5, 12, 10, P.mossDark);
  c.ellipse(8, 5.5, 4, 3, 0xbfd8e0);
  c.rect(4, 5, 8, 9, 0xbfd8e0);
  c.line(5, 12, 8, 6, P.white); // shine
  c.line(7, 12, 9, 9, P.white);
  c.set(3, 14, P.leafLight);
  c.set(12, 14, P.leafLight);
  c.outline(P.line);
});

const wreath = icon((c) => {
  c.circle(8, 8, 6.5, P.leaf);
  c.circle(8, 8, 3.5, -1); // the hole
  for (const [x, y] of [[3, 7], [5, 3], [11, 3], [13, 8], [10, 13], [4, 12]]) c.set(x, y, P.leafLight);
  for (const [x, y] of [[4, 5], [12, 5], [12, 11], [3, 10]]) c.rect(x, y, 2, 2, [PINK_PETAL, YELLOW][(x + y) % 2]);
  c.outline(P.line);
  c.rect(7, 13, 2, 2, P.red); // ribbon bow
  c.set(6, 14, P.red);
  c.set(9, 14, P.red);
});

const wallClock = icon((c) => {
  c.circle(8, 8, 6.5, P.woodDark);
  c.circle(8, 8, 5, P.cream);
  c.line(8, 8, 8, 4, P.iron);
  c.line(8, 8, 11, 9, P.iron);
  for (const [x, y] of [[8, 3], [13, 8], [8, 13], [3, 8]]) c.set(x, y, P.creamShade);
  c.set(8, 8, P.red);
  c.outline(P.line);
});

// ---------- furniture: tables ----------

const sideTable = icon((c) => {
  c.ellipse(8, 5, 6.5, 2, P.woodLight);
  c.rect(2, 5, 13, 1, P.wood);
  c.rect(7, 6, 2, 7, P.wood);
  c.ellipse(8, 14, 4, 1, P.woodDark);
  c.rect(6, 2, 3, 3, P.cream); // a little candle
  c.set(7, 1, P.glowWarm);
  c.outline(P.line);
});

const coffeeTable = icon((c) => {
  c.rect(1, 6, 14, 2, P.woodLight);
  c.rect(1, 8, 14, 1, P.wood);
  c.rect(2, 9, 2, 5, P.woodDark);
  c.rect(12, 9, 2, 5, P.woodDark);
  c.rect(5, 3, 3, 3, P.cream); // a teacup
  c.rect(8, 4, 1, 1, P.cream);
  c.set(6, 2, P.white);
  c.outline(P.line);
});

const desk = icon((c) => {
  c.rect(1, 5, 14, 2, P.woodLight);
  c.rect(1, 7, 14, 1, P.wood);
  c.rect(2, 8, 5, 6, P.wood); // drawers
  c.rect(3, 9, 3, 2, P.woodLight);
  c.rect(4, 10, 1, 1, P.gold);
  c.rect(3, 12, 3, 1, P.woodLight);
  c.rect(12, 8, 2, 6, P.woodDark);
  c.rect(8, 3, 4, 2, P.lilac); // a little book
  c.rect(9, 2, 3, 1, P.lilacShade);
  c.outline(P.line);
});

// ---------- clothes ----------

const bucketHat = icon((c) => {
  c.ellipse(8, 11, 7, 2.5, P.sageShade); // brim
  c.rect(4, 5, 8, 6, P.sage); // crown
  c.rect(4, 9, 8, 1, P.sageDark);
  c.rect(5, 6, 2, 3, P.sageLight);
  c.rect(9, 7, 2, 2, P.leafLight); // stitched leaf
  c.outline(P.line);
});

const flowerCrown = icon((c) => {
  c.ellipse(8, 9, 6.5, 3, P.leaf);
  c.ellipse(8, 10, 5, 2, -1);
  for (const [x, y, color] of [[3, 8, PINK_PETAL], [6, 6, P.white], [10, 6, YELLOW], [13, 8, PINK_DEEP], [8, 12, P.lilac]]) {
    c.rect(x - 1, y - 1, 3, 3, color);
    c.set(x, y, P.gold);
  }
  c.outline(P.line);
});

const sleepCap = icon((c) => {
  c.poly([[2, 13], [11, 13], [7, 2]], P.lilac);
  c.line(7, 2, 12, 3, P.lilac, 2); // the droopy tip
  c.line(12, 3, 13, 7, P.lilac, 2);
  c.rect(2, 11, 10, 3, P.white); // fluffy brim
  c.circle(13, 9, 1.8, P.white); // pom
  c.rect(6, 7, 1, 1, P.white);
  c.rect(8, 9, 1, 1, P.white);
  c.outline(P.line);
});

const hoodie = icon((c) => {
  c.poly([[1, 6], [5, 2], [11, 2], [15, 6], [14, 12], [12, 11], [11, 14], [5, 14], [4, 11], [2, 12]], P.mossDark);
  c.poly([[5, 2], [11, 2], [9, 7], [7, 7]], P.moss); // hood
  c.rect(6, 9, 4, 3, P.mossDark); // pocket
  c.rect(6, 9, 4, 1, P.moss);
  c.line(7, 7, 7, 10, P.cream);
  c.line(9, 7, 9, 10, P.cream);
  c.outline(P.line);
});

const cardigan = icon((c) => {
  c.poly([[1, 5], [5, 2], [11, 2], [15, 5], [14, 13], [11, 13], [11, 14], [5, 14], [5, 13], [2, 13]], P.cream);
  c.rect(7, 3, 2, 11, P.creamShade); // opening
  for (const y of [5, 8, 11]) c.rect(7, y, 2, 1, WOOD_OAK); // wooden buttons
  c.rect(2, 12, 3, 1, P.creamShade);
  c.rect(11, 12, 3, 1, P.creamShade);
  c.outline(P.line);
});

const jeans = icon((c) => {
  c.rect(3, 1, 10, 2, DENIM_DARK);
  c.rect(3, 3, 4, 12, DENIM);
  c.rect(9, 3, 4, 12, DENIM);
  c.rect(7, 3, 2, 4, DENIM);
  c.rect(3, 13, 4, 2, DENIM_DARK);
  c.rect(9, 13, 4, 2, DENIM_DARK);
  c.line(4, 5, 5, 5, P.cream); // stitching
  c.line(10, 5, 11, 5, P.cream);
  c.set(8, 2, P.gold);
  c.outline(P.line);
});

const plaidSkirt = icon((c) => {
  c.poly([[4, 3], [12, 3], [15, 13], [1, 13]], PLUM_PLAID);
  c.rect(4, 2, 8, 2, P.plum);
  for (const x of [3, 6, 9, 12]) c.line(x, 4, x - 1 + (x > 8 ? 2 : 0), 12, P.leafDark);
  for (const y of [7, 10]) c.rect(2, y, 12, 1, P.leaf);
  c.rect(1, 13, 14, 1, P.plum);
  c.outline(P.line);
});

const sneakers = icon((c) => {
  c.rect(2, 7, 8, 5, P.white); // upper
  c.rect(8, 9, 6, 3, P.white); // toe
  c.rect(2, 12, 13, 2, P.cream); // sole
  c.rect(2, 13, 13, 1, P.creamShade);
  c.rect(4, 5, 5, 2, P.white); // collar
  c.rect(6, 8, 3, 1, P.sage); // stripe + laces
  c.rect(6, 9, 1, 1, P.creamShade);
  c.rect(8, 9, 1, 1, P.creamShade);
  c.outline(P.line);
});

const rainBoots = icon((c) => {
  c.rect(3, 1, 5, 11, YELLOW);
  c.rect(3, 10, 11, 4, YELLOW);
  c.rect(3, 1, 5, 2, C.bamboo);
  c.rect(6, 3, 2, 8, 0xc9a02f);
  c.rect(3, 13, 11, 1, 0x8a6a1c);
  c.rect(5, 4, 1, 4, P.white); // shine
  c.outline(P.line);
});

const backpack = icon((c) => {
  c.rect(3, 4, 10, 11, P.sageShade);
  c.ellipse(8, 4, 5, 2.5, P.sageShade);
  c.rect(5, 9, 6, 5, P.sage); // front pocket
  c.rect(5, 9, 6, 1, P.sageDark);
  c.rect(7, 11, 2, 1, P.gold); // brass buckle
  c.rect(6, 1, 4, 2, P.woodDark); // top handle
  c.rect(4, 5, 1, 9, P.sageDark);
  c.outline(P.line);
});

const starPajamas = icon((c) => {
  c.poly([[1, 5], [5, 2], [11, 2], [15, 5], [13, 8], [11, 7], [11, 14], [5, 14], [5, 7], [3, 8]], NAVY);
  c.rect(10, 3, 1, 11, 0x1c1c36);
  for (const [x, y] of [[6, 5], [9, 9], [7, 11], [3, 5]]) {
    c.set(x, y, YELLOW);
    c.set(x - 1, y, P.glow);
    c.set(x + 1, y, P.glow);
    c.set(x, y - 1, P.glow);
  }
  c.outline(P.line);
});

export const MORE_ITEMS = {
  'item-succulent-trio': succulentTrio,
  'item-peace-lily': peaceLily,
  'item-mini-palm': miniPalm,
  'item-fiddle-leaf-fig': fiddleLeafFig,
  'item-lemon-tree': lemonTree,
  'item-sakura-tree': sakuraTree,
  'item-daisies': daisies,
  'item-tulips': tulips,
  'item-sunflowers': sunflowers,
  'item-lavender': lavender,
  'item-roses': roses,
  'item-paper-lantern': paperLantern,
  'item-mushroom-lamp': mushroomLamp,
  'item-floor-lamp': floorLamp,
  'item-armchair': armchair,
  'item-rocking-chair': rockingChair,
  'item-cozy-bed': cozyBed,
  'item-canopy-bed': canopyBed,
  'item-hammock': hammock,
  'item-moon-print': moonPrint,
  'item-botanical-print': botanicalPrint,
  'item-wall-mirror': wallMirror,
  'item-wreath': wreath,
  'item-wall-clock': wallClock,
  'item-side-table': sideTable,
  'item-coffee-table': coffeeTable,
  'item-desk': desk,
  'item-bucket-hat': bucketHat,
  'item-flower-crown': flowerCrown,
  'item-sleep-cap': sleepCap,
  'item-hoodie': hoodie,
  'item-cardigan': cardigan,
  'item-jeans': jeans,
  'item-plaid-skirt': plaidSkirt,
  'item-sneakers': sneakers,
  'item-rain-boots': rainBoots,
  'item-backpack': backpack,
  'item-star-pajamas': starPajamas,
};
