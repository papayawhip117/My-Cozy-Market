// The big wardrobe's pictures (the items themselves are in src/data/wardrobe.js).
// Every item gets two drawings:
//   wear-<id>.png   the layer on your character (32x40 frames, see character.js)
//   item-<id>.png   its 16x16 picture in the shop and backpack
// Long-sleeved tops also get wear-<id>-arms.png, the sleeves over your arms.
//
// Most clothes are made from a few "builders" (top, dress, pants, skirt...)
// so each item below is mostly just its colors plus a few pixels of detail.
//   wear(c, dy, f): extra pixels drawn on the character layer
//   icon(c):        extra pixels drawn on the shop picture
//
// Where things are on the character (one 32x40 frame, she faces right):
//   head  y 7-25 (eyes x 9-12 and 19-22, y 17-22)   neck x 14-17, y 25-26
//   shirt y 26-30 (shoulders reach x 10-21 at y 28) arms x 9-10 and 21-22, y 29-31
//   waist y 31-32  legs y 33-37  feet y 37-39
// `dy` is the little bounce while walking: add it to anything above the legs.
import { P } from './palette.js';
import { icon, shadow } from './items.js';
import { blank, twoSheets, piece, tintedPiece, SKIN, sparkle, shirtShape, pantsShape, eachFoot } from './character.js';
import { WARDROBE } from '../../src/data/wardrobe.js';

const SOFT = P.lineSoft;

// Colors only the wardrobe uses.
const K = {
  white: 0xf7f2e8,
  whiteShade: 0xd8d0c2,
  black: 0x2c2832,
  blackShade: 0x1d1a22,
  charcoal: 0x4a4652,
  charcoalShade: 0x36333c,
  gray: 0x9c9aa4,
  grayShade: 0x787680,
  oat: 0xd8c8a8,
  oatShade: 0xb09f82,
  pink: 0xf2b3c4,
  pinkShade: 0xd9849b,
  hotPink: 0xe0708f,
  babyBlue: 0xa8c4e6,
  babyBlueShade: 0x7f9fc8,
  dustyBlue: 0x7f96b8,
  dustyBlueShade: 0x5f7698,
  denim: 0x4f6fa0,
  denimShade: 0x38527e,
  lightDenim: 0x86a6cf,
  lightDenimShade: 0x6488b4,
  darkDenim: 0x34466e,
  darkDenimShade: 0x26344f,
  red: 0xb0453c,
  redShade: 0x84322c,
  yellow: 0xf2d27a,
  yellowShade: 0xd4ae52,
  straw: 0xe0c070,
  strawShade: 0xb8963e,
  olive: 0x6f6a3a,
  oliveShade: 0x54502a,
  brown: 0x8a5a3c,
  brownShade: 0x6a4430,
  rust: 0xa8583a,
  rustShade: 0x7f4028,
  plum: 0x6b3a5e,
  plumShade: 0x4a2640,
  navy: 0x3c4a6e,
  navyShade: 0x2a3452,
  lilac: 0xc4b0e0,
  lilacShade: 0x9f8cc0,
  champagne: 0xe8d2b0,
  champagneShade: 0xc9ae88,
  icy: 0xc8e0f0,
  icyShade: 0x9cc0dc,
  silver: 0xc8ccd4,
  silverShade: 0x8f94a0,
  gold: P.gold,
  glow: P.glow,
};

// ---------- little helpers ----------

// Draw a garment shape with a soft outline onto the character's fixed sheet.
function garment(out, draw) {
  out.fixed.draw(piece(draw, SOFT));
}

// Bare skin (tinted with your skin color in the game) under a top that shows
// some: shoulders, tummy...
function skinUnder(out, dy) {
  tintedPiece(out, (c) => shirtShape(c, dy, SKIN.main, SKIN.shade), P.skinLine);
}

// Replace every other pixel of `color` with see-through holes (mesh, fishnet).
function holes(c, color, x0 = 0, y0 = 0, x1 = c.w, y1 = c.h) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if ((x + y) % 2 === 0 && c.get(x, y) === color) c.set(x, y, -1);
}

// A small bow: two triangles and a knot, centered on (x, y).
function bow(c, x, y, color, knot) {
  c.poly([[x - 3, y - 2], [x, y], [x - 3, y + 2]], color);
  c.poly([[x + 4, y - 2], [x + 1, y], [x + 4, y + 2]], color);
  c.rect(x, y - 1, 1, 2, knot ?? color);
}

// ---------- tops (worn on the 'top' slot) ----------

// Torso shapes on the character: (c, dy, color, shade).
const SHAPES = {
  tee: (c, dy, col, sh) => shirtShape(c, dy, col, sh),
  crop: (c, dy, col, sh) => {
    shirtShape(c, dy, col, sh);
    c.rect(10, 30 + dy, 13, 1, -1); // tummy shows
  },
  tank: (c, dy, col, sh) => {
    c.rect(11, 28 + dy, 10, 3, col);
    c.rect(19, 28 + dy, 2, 3, sh);
    c.rect(12, 26 + dy, 1, 2, col); // straps
    c.rect(19, 26 + dy, 1, 2, col);
  },
  tube: (c, dy, col, sh) => {
    c.rect(11, 28 + dy, 10, 2, col);
    c.rect(19, 28 + dy, 2, 2, sh);
  },
  halter: (c, dy, col, sh) => {
    c.rect(12, 28 + dy, 8, 2, col);
    c.rect(18, 28 + dy, 2, 2, sh);
    c.line(13, 27 + dy, 15, 26 + dy, col); // ties up around the neck
    c.line(18, 27 + dy, 16, 26 + dy, col);
  },
  puff: (c, dy, col, sh) => {
    shirtShape(c, dy, col, sh);
    c.rect(9, 27 + dy, 3, 2, col); // big puffy sleeves
    c.rect(20, 27 + dy, 3, 2, col);
    c.rect(9, 28 + dy, 3, 1, sh);
    c.rect(20, 28 + dy, 3, 1, sh);
  },
  wide: (c, dy, col, sh) => {
    // oversized: a little wider and long enough to cover the waistband
    shirtShape(c, dy, col, sh);
    c.rect(10, 29 + dy, 12, 2, col);
    c.rect(11, 31 + dy, 10, 1, sh);
    c.rect(20, 29 + dy, 2, 2, sh);
  },
  off: (c, dy, col, sh) => {
    // off the shoulder: a straight neckline across
    c.rect(10, 28 + dy, 12, 1, col);
    c.rect(11, 29 + dy, 10, 2, col);
    c.rect(19, 29 + dy, 2, 2, sh);
  },
  turtle: (c, dy, col, sh) => {
    shirtShape(c, dy, col, sh);
    c.rect(13, 25 + dy, 6, 2, col); // the rolled-up collar
  },
};
const SHOWS_SKIN = new Set(['crop', 'tank', 'tube', 'halter', 'off']);

// Long sleeves over the arms (the wear-<id>-arms sheet). Her back arm (left)
// is a shade darker. `cuff` (optional) colors the bottom row.
function sleeveSheet(col, sh, cuff, extra) {
  return (f) => {
    const out = twoSheets();
    const { dy } = f;
    out.fixed.rect(9, 29 + dy, 2, 2, sh);
    out.fixed.rect(21, 29 + dy, 2, 2, col);
    if (cuff) {
      out.fixed.rect(9, 30 + dy, 2, 1, cuff);
      out.fixed.rect(21, 30 + dy, 2, 1, cuff);
    }
    extra?.(out.fixed, dy);
    return out;
  };
}

// Shop pictures of tops: the outline of the garment, flat, 16x16.
const TOP_ICONS = {
  tee: (c, col) => c.poly([[1, 5], [5, 2], [11, 2], [15, 5], [13, 8], [11, 7], [11, 14], [5, 14], [5, 7], [3, 8]], col),
  long: (c, col) => c.poly([[1, 5], [5, 2], [11, 2], [15, 5], [15, 13], [12, 13], [11, 8], [11, 14], [5, 14], [5, 8], [4, 13], [1, 13]], col),
  wide: (c, col) => c.poly([[0, 5], [4, 2], [12, 2], [16, 5], [16, 13], [13, 13], [12, 8], [12, 15], [4, 15], [4, 8], [3, 13], [0, 13]], col),
  tank: (c, col) => {
    c.rect(4, 5, 8, 9, col);
    c.rect(5, 1, 1, 4, col);
    c.rect(10, 1, 1, 4, col);
  },
  tube: (c, col) => c.rect(3, 5, 10, 7, col),
  halter: (c, col) => c.poly([[3, 7], [7, 1], [9, 1], [13, 7], [13, 12], [3, 12]], col),
  puff: (c, col) => {
    TOP_ICONS.tee(c, col);
    c.circle(2.5, 5.5, 2.5, col);
    c.circle(13.5, 5.5, 2.5, col);
  },
  off: (c, col) => {
    TOP_ICONS.long(c, col);
    c.rect(0, 0, 16, 4, -1); // a straight neckline, off the shoulders
  },
};

// A top. o = {
//   shape:  one of SHAPES (default 'tee')     color, shade: its colors
//   sleeves: true for long sleeves             sleeve, sleeveShade, cuff: sleeve colors
//   iconShape: one of TOP_ICONS (picked from the shape if left out)
//   crop: true = the shop picture is short     wear / icon: extra details
//   arms: extra pixels on the sleeves sheet }
function top(o) {
  const shape = o.shape ?? 'tee';
  const col = o.color;
  const sh = o.shade;
  const art = {
    wear(f) {
      const out = twoSheets();
      const { dy } = f;
      if (SHOWS_SKIN.has(shape) || o.skin) skinUnder(out, dy);
      garment(out, (c) => SHAPES[shape](c, dy, col, sh));
      o.wear?.(out.fixed, dy, f);
      return out;
    },
    icon: icon((c) => {
      const iconShape =
        o.iconShape ?? (shape === 'off' ? 'off' : shape === 'wide' ? 'wide' : o.sleeves ? 'long' : TOP_ICONS[shape] ? shape : 'tee');
      TOP_ICONS[iconShape](c, col);
      if (o.crop || shape === 'crop') c.rect(0, 11, 16, 5, -1);
      c.replace(col, sh, (x) => x >= 11 && x <= 12); // shading down the right side
      if (shape === 'turtle') c.rect(5, 0, 6, 3, col);
      c.outline(P.line);
      o.icon?.(c);
    }),
  };
  if (o.sleeves) art.arms = sleeveSheet(o.sleeve ?? col, o.sleeveShade ?? sh, o.cuff, o.arms);
  return art;
}

// A cardigan or jacket: open down the front, showing the top underneath.
// o = top options + inner (the color of the top underneath) + buttons (a color).
function opener(o) {
  return top({
    ...o,
    sleeves: true,
    wear(c, dy, f) {
      const bottom = o.shape === 'crop' ? 29 : o.shape === 'wide' ? 31 : 30;
      c.rect(15, 27 + dy, 2, bottom - 26, o.inner);
      c.rect(15, 27 + dy, 1, bottom - 26, o.shade); // the edge of the open front
      if (o.buttons) for (let y = 28; y <= bottom; y += 2) c.set(17, y + dy, o.buttons);
      o.wear?.(c, dy, f);
    },
    icon(c) {
      const bottom = o.shape === 'crop' ? 10 : o.shape === 'wide' ? 14 : 13;
      c.rect(7, 2, 2, bottom - 1, o.inner);
      if (o.buttons) for (let y = 4; y <= bottom; y += 3) c.set(9, y, o.buttons);
      o.icon?.(c);
    },
  });
}

// ---------- dresses and one-pieces (top slot, fullBody) ----------

// The skirt part: rows from the waist down, wider as they go (`flare`
// pixels per row on each side). pattern(c, x, y, row) can recolor pixels.
function skirtRows(c, dy, { len, flare = 1, color, shade, top = 31 }) {
  for (let i = 0; i < len; i++) {
    const w = Math.round(i * flare);
    c.rect(11 - w, top + i + dy, 10 + 2 * w, 1, i === len - 1 ? shade : color);
  }
}

// Shop picture bodices for dresses.
const BODICE = {
  tank: (c, col) => {
    c.rect(5, 3, 6, 5, col);
    c.rect(5, 0, 1, 3, col);
    c.rect(10, 0, 1, 3, col);
  },
  tee: (c, col) => c.poly([[2, 4], [5, 1], [11, 1], [14, 4], [12, 6], [11, 5], [11, 8], [5, 8], [5, 5], [4, 6]], col),
  puff: (c, col) => {
    BODICE.tee(c, col);
    c.circle(3, 3.5, 2.2, col);
    c.circle(13, 3.5, 2.2, col);
  },
  long: (c, col) => c.poly([[1, 4], [5, 1], [11, 1], [15, 4], [15, 11], [12, 11], [11, 6], [11, 8], [5, 8], [5, 6], [4, 11], [1, 11]], col),
};

// A dress. o = {
//   shape: torso shape (SHAPES)  color, shade: the top half
//   skirt: { len, flare, color, shade }  (color/shade default to the top's)
//   sleeves: true for long sleeves  bodice: shop picture top (BODICE key)
//   wear / icon: extra details }
function dress(o) {
  const shape = o.shape ?? 'tee';
  const skirt = { color: o.color, shade: o.shade, ...o.skirt };
  const art = {
    wear(f) {
      const out = twoSheets();
      const { dy } = f;
      if (SHOWS_SKIN.has(shape) || o.skin) skinUnder(out, dy);
      garment(out, (c) => {
        SHAPES[shape](c, dy, o.color, o.shade);
        skirtRows(c, dy, skirt);
      });
      o.wear?.(out.fixed, dy, f);
      return out;
    },
    icon: icon((c) => {
      const bodice = o.bodice ?? (o.sleeves ? 'long' : shape === 'puff' ? 'puff' : SHOWS_SKIN.has(shape) ? 'tank' : 'tee');
      BODICE[bodice](c, o.color);
      const fl = Math.min(4, Math.round(skirt.flare * 4) + 1);
      const len = Math.min(8, skirt.len + 2);
      c.poly([[5, 8], [11, 8], [11 + fl, 8 + len], [5 - fl, 8 + len]], skirt.color);
      c.rect(5 - fl, 7 + len, 6 + 2 * fl, 1, skirt.shade);
      c.outline(P.line);
      o.icon?.(c, 8 + len);
    }),
  };
  if (o.sleeves) art.arms = sleeveSheet(o.sleeve ?? o.color, o.sleeveShade ?? o.shade, o.cuff);
  return art;
}

// Overalls / shortalls: a tee under a bib with straps, and pant legs.
function overalls({ color, shade, tee, teeShade, legLen, wear, icon: iconDetail }) {
  return {
    wear(f) {
      const out = twoSheets();
      const { dy } = f;
      garment(out, (c) => {
        shirtShape(c, dy, tee, teeShade);
        pantsShape(c, f, legLen, color, shade);
      });
      const c = out.fixed;
      c.rect(13, 28 + dy, 6, 3, color); // the bib
      c.rect(13, 28 + dy, 6, 1, shade);
      c.rect(13, 26 + dy, 1, 2, shade); // straps
      c.rect(18, 26 + dy, 1, 2, shade);
      c.set(13, 28 + dy, P.gold);
      c.set(18, 28 + dy, P.gold);
      wear?.(c, dy, f);
      return out;
    },
    icon: icon((c) => {
      const legs = legLen > 3 ? 15 : 11;
      c.rect(3, 7, 10, 2, color);
      c.rect(3, 9, 4, legs - 8, color);
      c.rect(9, 9, 4, legs - 8, color);
      c.rect(7, 9, 2, 2, color);
      c.rect(5, 2, 6, 6, color); // bib
      c.rect(4, 0, 1, 3, shade);
      c.rect(11, 0, 1, 3, shade);
      c.rect(6, 4, 4, 2, shade); // pocket
      c.outline(P.line);
      c.set(5, 3, P.gold);
      c.set(10, 3, P.gold);
      iconDetail?.(c);
    }),
  };
}

// ---------- bottoms ----------

// Pants and shorts. o = { color, shade, len (5 = full length, 2 = shorts),
//   width (2 or 3 = baggy), flare (true = bell bottoms), wear, icon }
function pants(o) {
  const len = o.len ?? 5;
  return {
    wear(f) {
      const out = twoSheets();
      garment(out, (c) => {
        pantsShape(c, f, len, o.color, o.shade);
        const { legs } = f;
        for (const [x, lift, col] of [[legs.back, legs.backLift || 0, o.shade], [legs.front, legs.frontLift || 0, o.color]]) {
          if (o.width === 3) c.rect(x, 33 - lift, 3, len, col);
          if (o.flare) c.rect(x - 1, 33 - lift + len - 2, 4, 2, col);
        }
      });
      o.wear?.(out.fixed, f.dy, f);
      return out;
    },
    icon: icon((c) => {
      const bottom = len >= 5 ? 15 : len >= 3 ? 10 : 8;
      const wide = o.width === 3 ? 1 : 0;
      c.rect(3 - wide, 1, 10 + 2 * wide, 2, o.shade);
      c.rect(3 - wide, 3, 4 + wide, bottom - 3, o.color);
      c.rect(9, 3, 4 + wide, bottom - 3, o.color);
      c.rect(7, 3, 2, 4, o.color);
      if (o.flare) {
        c.rect(2, bottom - 3, 5, 3, o.color);
        c.rect(9, bottom - 3, 5, 3, o.color);
      }
      c.rect(9, 3, 1, bottom - 3, o.shade);
      c.outline(P.line);
      o.icon?.(c, bottom);
    }),
  };
}

// Skirts. o = { color, shade, len, flare, wear, icon }
function skirt(o) {
  return {
    wear(f) {
      const out = twoSheets();
      const { dy } = f;
      garment(out, (c) => skirtRows(c, dy, o));
      o.wear?.(out.fixed, dy, f);
      return out;
    },
    icon: icon((c) => {
      const fl = Math.min(5, Math.round(o.flare * 4) + 1);
      const len = Math.min(12, o.len * 2);
      c.rect(4, 2, 8, 2, o.shade);
      c.poly([[4, 4], [12, 4], [12 + fl, 4 + len], [4 - fl, 4 + len]], o.color);
      c.rect(4 - fl, 3 + len, 8 + 2 * fl, 1, o.shade);
      c.outline(P.line);
      o.icon?.(c, 4 + len);
    }),
  };
}

// ---------- shoes ----------

// shoe(draw, iconOpts): draw(c, x, lift, back) draws one foot on the
// character (x = left edge of the leg, back = the far foot).
// iconOpts = { shaft (how tall above the foot), color, shade, sole, soleH, detail }
function shoe(draw, ic) {
  return {
    wear(f) {
      const out = twoSheets();
      eachFoot(f, (x, lift, back) => out.fixed.draw(piece((c) => draw(c, x, lift, back), SOFT)));
      return out;
    },
    icon: shoeIcon(ic),
  };
}

function shoeIcon({ shaft = 0, color, shade, sole, soleH = 1, detail }) {
  return icon((c) => {
    const base = 14 - soleH; // where the sole starts
    const top = base - 4 - shaft;
    c.rect(3, top, 6, base - top, color); // ankle / shaft
    c.rect(3, base - 3, 11, 3, color); // the foot
    c.set(13, base - 3, -1); // round toe
    c.rect(7, base - 1, 6, 1, shade);
    c.rect(2, base, 13, soleH, sole);
    c.outline(P.line);
    detail?.(c, base, top);
    shadow(c, 8, 15, 7);
  });
}

// Simple worn items with just a few pixels (hats, clips, glasses...).
// wear(c, dy, f) draws on the fixed sheet; outlined = an outline is added.
function bits(wear, iconDraw, { outlined = true } = {}) {
  return {
    wear(f) {
      const out = twoSheets();
      if (outlined) garment(out, (c) => wear(c, f.dy, f));
      else wear(out.fixed, f.dy, f);
      return out;
    },
    icon: icon(iconDraw),
  };
}

// For things drawn in two passes on the character: a shape (outlined) then details.
function layered(shapeFn, detailFn, iconDraw) {
  return {
    wear(f) {
      const out = twoSheets();
      garment(out, (c) => shapeFn(c, f.dy, f));
      detailFn?.(out.fixed, f.dy, f);
      return out;
    },
    icon: icon(iconDraw),
  };
}

// ---------- hats (head slot) ----------
// The top of her head (hair included) is at about y 4; the hairline at y 13.

// A knit beanie: color, shade, and extra(c, dy) for ears or a pom.
function beanie(color, shade, extra, iconExtra) {
  return layered(
    (c, dy) => {
      c.ellipse(15.5, 9 + dy, 10.5, 6.5, color, (x, y) => y <= 9 + dy);
      c.rect(5, 9 + dy, 22, 3, shade); // folded cuff
      extra?.(c, dy);
    },
    (c, dy) => {
      for (let x = 6; x < 26; x += 2) c.set(x, 10 + dy, color); // ribbing
    },
    (c) => {
      c.ellipse(8, 9, 7, 6, color, (x, y) => y <= 10);
      c.rect(1, 10, 14, 4, shade);
      iconExtra?.(c);
      c.outline(P.line);
      for (let x = 2; x < 14; x += 2) c.set(x, 11, color);
      shadow(c, 8, 15, 6);
    },
  );
}

// ---------- the art for every item ----------

const ART = {
  // ----- tees -----
  'basic-tee': top({ color: K.white, shade: K.whiteShade }),
  'cropped-tee': top({ shape: 'crop', color: P.sageLight, shade: P.sage }),
  'baby-tee': top({
    shape: 'crop', color: K.pink, shade: K.pinkShade,
    wear: (c, dy) => {
      c.rect(14, 26 + dy, 4, 1, K.white); // contrast collar
      c.set(16, 28 + dy, K.hotPink); // little heart
      c.set(15, 28 + dy, K.hotPink);
    },
    icon: (c) => {
      c.rect(6, 2, 4, 1, K.white);
      c.set(7, 6, K.hotPink);
      c.set(9, 6, K.hotPink);
      c.set(8, 7, K.hotPink);
    },
  }),
  'ringer-tee': top({
    color: K.oat, shade: K.oatShade,
    wear: (c, dy) => {
      c.rect(14, 26 + dy, 4, 1, K.red); // trim at the neck and sleeves
      c.set(10, 28 + dy, K.red);
      c.set(21, 28 + dy, K.red);
    },
    icon: (c) => {
      c.rect(5, 2, 6, 1, K.red);
      c.line(1, 5, 3, 8, K.red);
      c.line(15, 5, 13, 8, K.red);
    },
  }),
  'graphic-tee': top({
    color: K.charcoal, shade: K.charcoalShade,
    wear: (c, dy) => {
      c.rect(14, 28 + dy, 4, 1, K.oat); // a little moth
      c.set(15, 29 + dy, K.oat);
      c.set(16, 29 + dy, K.oat);
    },
    icon: (c) => {
      c.rect(5, 6, 6, 2, K.oat);
      c.rect(6, 8, 4, 1, K.oat);
      c.rect(7, 5, 2, 5, K.oatShade);
    },
  }),
  'band-tee': top({
    color: K.black, shade: K.blackShade,
    wear: (c, dy) => {
      c.rect(14, 28 + dy, 4, 2, K.white); // a skull-ish logo
      c.set(15, 28 + dy, K.black);
      c.set(16, 29 + dy, K.black);
    },
    icon: (c) => {
      c.rect(6, 5, 4, 3, K.white);
      c.set(6, 6, K.black);
      c.set(9, 6, K.black);
      c.rect(7, 8, 2, 1, K.white);
      c.line(4, 10, 11, 10, K.hotPink); // band name
    },
  }),
  'tank-top': top({ shape: 'tank', color: K.dustyBlue, shade: K.dustyBlueShade, icon: (c) => c.rect(5, 6, 6, 1, K.dustyBlueShade) }),
  camisole: top({
    shape: 'tank', color: K.pink, shade: K.pinkShade,
    wear: (c, dy) => {
      for (let x = 11; x < 21; x += 2) c.set(x, 28 + dy, K.white); // lace edge
    },
    icon: (c) => {
      for (let x = 4; x < 12; x += 2) c.set(x, 5, K.white);
    },
  }),
  'halter-top': top({
    shape: 'halter', color: K.hotPink, shade: 0xb85070,
    wear: (c, dy) => c.set(15, 28 + dy, K.white), // a little rhinestone
    icon: (c) => {
      c.set(8, 7, K.white);
      c.rect(3, 11, 10, 1, 0xb85070);
    },
  }),
  'tube-top': top({
    shape: 'tube', color: K.lilac, shade: K.lilacShade,
    wear: (c, dy) => c.rect(11, 29 + dy, 8, 1, 0xd8c8f0),
    icon: (c) => {
      c.rect(3, 7, 10, 1, 0xd8c8f0);
      c.rect(3, 9, 10, 1, K.lilacShade);
    },
  }),
  'long-sleeve': top({ sleeves: true, color: K.oat, shade: K.oatShade }),
  'striped-long-sleeve': top({
    sleeves: true, color: K.white, shade: K.whiteShade,
    wear: (c, dy) => {
      for (const y of [27, 29]) for (let x = 10; x < 22; x++) if (c.get(x, y + dy) === K.white || c.get(x, y + dy) === K.whiteShade) c.set(x, y + dy, K.black);
    },
    arms: (c, dy) => {
      c.rect(9, 29 + dy, 2, 1, K.black);
      c.rect(21, 29 + dy, 2, 1, K.black);
    },
    icon: (c) => {
      for (const y of [4, 7, 10, 13]) c.replace(K.white, K.black, (x, yy) => yy === y);
      for (const y of [4, 7, 10, 13]) c.replace(K.whiteShade, K.blackShade, (x, yy) => yy === y);
    },
  }),
  'mesh-top': (() => {
    const base = top({ sleeves: true, color: K.black, shade: K.black, skin: true });
    return {
      wear(f) {
        const out = base.wear(f);
        holes(out.fixed, K.black, 11, 27 + f.dy, 21, 31 + f.dy);
        return out;
      },
      arms(f) {
        const out = base.arms(f);
        holes(out.fixed, K.black);
        return out;
      },
      icon: icon((c) => {
        TOP_ICONS.long(c, K.black);
        c.outline(P.line);
        for (let y = 3; y < 14; y++) for (let x = 2; x < 15; x++) if ((x + y) % 2 === 0 && c.get(x, y) === K.black) c.set(x, y, K.charcoal);
      }),
    };
  })(),
  'fishnet-layer': (() => {
    const base = top({ shape: 'tank', sleeves: true, color: K.black, shade: K.blackShade });
    return {
      wear(f) {
        const out = base.wear(f);
        const net = blank();
        shirtShape(net, f.dy, K.black, K.black);
        for (let y = 0; y < net.h; y++)
          for (let x = 0; x < net.w; x++)
            if (net.get(x, y) !== -1 && out.fixed.get(x, y) === -1 && (x + y) % 2 === 0) out.fixed.set(x, y, K.black);
        return out;
      },
      arms(f) {
        const out = base.arms(f);
        holes(out.fixed, K.black);
        holes(out.fixed, K.blackShade);
        return out;
      },
      icon: icon((c) => {
        TOP_ICONS.long(c, K.charcoal);
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 2 === 0 && c.get(x, y) !== -1) c.set(x, y, -1);
        TOP_ICONS.tank(c, K.black);
        c.outline(P.line);
      }),
    };
  })(),

  // ----- blouses -----
  'peasant-blouse': top({
    shape: 'puff', color: K.white, shade: K.whiteShade,
    wear: (c, dy) => {
      c.set(14, 27 + dy, K.red); // stitched flowers at the neckline
      c.set(17, 27 + dy, 0x6a8ad0);
      c.set(16, 27 + dy, P.leafLight);
    },
    icon: (c) => {
      c.set(6, 3, K.red);
      c.set(8, 3, 0x6a8ad0);
      c.set(10, 3, K.red);
      c.set(7, 4, P.leafLight);
      c.set(9, 4, P.leafLight);
    },
  }),
  'puff-sleeve-blouse': top({
    shape: 'puff', color: 0xf6e0e6, shade: K.pinkShade,
    wear: (c, dy) => c.rect(15, 27 + dy, 2, 1, K.hotPink), // tiny bow
    icon: (c) => c.rect(7, 3, 2, 1, K.hotPink),
  }),
  'lace-blouse': top({
    color: K.oat, shade: K.oatShade,
    wear: (c, dy) => {
      c.rect(13, 26 + dy, 6, 1, K.white); // lacy collar
      c.set(13, 27 + dy, K.white);
      c.set(18, 27 + dy, K.white);
      c.set(15, 27 + dy, K.white);
    },
    icon: (c) => {
      for (let x = 5; x < 11; x++) c.set(x, 2, K.white);
      for (let x = 5; x < 11; x += 2) c.set(x, 3, K.white);
    },
  }),
  'ruffle-blouse': top({
    color: K.pink, shade: K.pinkShade,
    wear: (c, dy) => {
      for (let y = 27; y <= 30; y++) c.set(15 + (y % 2), y + dy, 0xfad6e0); // ruffles down the front
    },
    icon: (c) => {
      for (let y = 3; y <= 13; y++) c.set(7 + (y % 2), y, 0xfad6e0);
      for (let y = 3; y <= 13; y += 2) c.set(9, y, K.pinkShade);
    },
  }),
  'corset-top': top({
    shape: 'puff', color: K.white, shade: K.whiteShade,
    wear: (c, dy) => {
      c.rect(12, 29 + dy, 8, 2, K.plum); // the corset over a white blouse
      c.rect(18, 29 + dy, 2, 2, K.plumShade);
      c.set(15, 29 + dy, K.white); // laces
      c.set(16, 30 + dy, K.white);
    },
    icon: (c) => {
      c.rect(5, 7, 6, 7, K.plum);
      for (let y = 8; y < 14; y += 2) {
        c.set(7, y, K.white);
        c.set(8, y + 1, K.white);
      }
    },
  }),

  // ----- sweaters -----
  turtleneck: top({ shape: 'turtle', sleeves: true, color: K.plum, shade: K.plumShade }),
  'off-shoulder-sweater': top({ shape: 'off', sleeves: true, color: 0xd9a0ae, shade: 0xb47c8c }),
  'chunky-knit': top({
    shape: 'wide', sleeves: true, color: K.oat, shade: K.oatShade,
    wear: (c, dy) => {
      for (const x of [13, 18]) for (let y = 27; y <= 30; y++) c.set(x, y + dy, y % 2 ? K.oatShade : K.white); // cables
    },
    arms: (c, dy) => {
      c.set(21, 30 + dy, K.oatShade);
      c.set(22, 29 + dy, K.oatShade);
    },
    icon: (c) => {
      for (const x of [6, 10]) for (let y = 3; y < 15; y++) c.set(x, y, y % 2 ? K.oatShade : K.white);
    },
  }),
  'cropped-sweater': top({ shape: 'crop', sleeves: true, crop: true, color: K.babyBlue, shade: K.babyBlueShade }),
  'zip-hoodie': top({
    sleeves: true, color: K.gray, shade: K.grayShade,
    wear: (c, dy) => {
      c.rect(11, 25 + dy, 10, 2, 0xb0aeb8); // hood bunched at the neck
      c.rect(15, 27 + dy, 1, 4, K.silver); // zip
    },
    icon: (c) => {
      c.poly([[5, 2], [11, 2], [9, 6], [7, 6]], 0xb0aeb8);
      c.rect(8, 6, 1, 8, K.silver);
      c.outline(P.line);
    },
  }),
  'sweater-vest': top({
    color: K.white, shade: K.whiteShade,
    wear: (c, dy) => {
      c.rect(11, 28 + dy, 10, 3, K.brown); // the vest over a white tee
      c.rect(19, 28 + dy, 2, 3, K.brownShade);
      c.set(15, 28 + dy, K.white); // V neck
      c.set(16, 28 + dy, K.white);
      c.set(13, 29 + dy, K.yellow); // argyle
      c.set(18, 29 + dy, K.yellow);
      c.set(15, 30 + dy, K.yellow);
    },
    icon: (c) => {
      c.rect(4, 4, 8, 10, K.brown);
      c.poly([[6, 3], [10, 3], [8, 7]], K.white);
      for (const [x, y] of [[5, 9], [8, 11], [11, 9], [8, 8]]) c.set(x, y, K.yellow);
      c.rect(4, 13, 8, 1, K.brownShade);
    },
  }),
  'cozy-shawl': {
    wear(f) {
      const out = twoSheets();
      const { dy } = f;
      garment(out, (c) => shirtShape(c, dy, P.shirt, P.shirtShade)); // a blouse underneath
      garment(out, (c) => {
        c.poly([[9, 27 + dy], [23, 27 + dy], [16, 33 + dy]], P.moss); // the shawl over her shoulders
        c.rect(10, 26 + dy, 12, 1, P.moss);
      });
      out.fixed.rect(10, 27 + dy, 12, 1, P.mossLight); // knit edge
      out.fixed.set(16, 33 + dy, P.mossDark); // fringe
      out.fixed.set(15, 32 + dy, P.mossDark);
      out.fixed.set(17, 32 + dy, P.mossDark);
      return out;
    },
    icon: icon((c) => {
      c.poly([[0, 3], [16, 3], [8, 13]], P.moss);
      c.rect(0, 3, 16, 1, P.mossLight);
      c.outline(P.line);
      for (let x = 3; x < 14; x += 2) c.set(x, 6 + Math.floor((8 - Math.abs(x - 8)) / 2), P.mossDark); // knit pattern
      for (const [x, y] of [[8, 14], [7, 13], [9, 13]]) c.set(x, y, P.mossDark); // fringe
    }),
  },
  'reindeer-sweater': top({
    sleeves: true, color: K.red, shade: K.redShade, cuff: K.white,
    wear: (c, dy) => {
      c.rect(15, 28 + dy, 2, 2, K.brown); // reindeer face
      c.set(14, 27 + dy, K.brownShade); // antlers
      c.set(17, 27 + dy, K.brownShade);
      c.set(16, 30 + dy, 0xff6060); // red nose
      c.rect(11, 30 + dy, 3, 1, K.white);
      c.rect(19, 30 + dy, 2, 1, K.white);
    },
    icon: (c) => {
      c.rect(6, 6, 4, 4, K.brown);
      c.line(6, 6, 4, 3, K.brownShade);
      c.line(9, 6, 11, 3, K.brownShade);
      c.set(7, 8, K.black);
      c.set(8, 10, 0xff6060);
      c.rect(5, 13, 6, 1, K.white);
      c.rect(1, 12, 3, 1, K.white);
      c.rect(12, 12, 3, 1, K.white);
    },
  }),
  'ugly-sweater': top({
    sleeves: true, color: P.leaf, shade: P.leafDark, cuff: K.red,
    wear: (c, dy) => {
      for (let x = 11; x < 21; x++) c.set(x, 28 + dy + (x % 2), K.red); // zigzag
      c.set(13, 30 + dy, K.yellow); // lights
      c.set(16, 30 + dy, K.white);
      c.set(19, 30 + dy, K.yellow);
    },
    icon: (c) => {
      for (let x = 1; x < 15; x++) c.set(x, 6 + (x % 2), K.red);
      for (const [x, y, col] of [[6, 10, K.yellow], [9, 11, K.white], [7, 13, K.red], [3, 3, K.white], [12, 3, K.white]]) c.set(x, y, col);
    },
  }),

  // ----- cardigans and jackets -----
  'cropped-cardigan': opener({ shape: 'crop', color: K.pink, shade: K.pinkShade, inner: K.white, buttons: K.white, crop: true }),
  'oversized-cardigan': opener({ shape: 'wide', color: K.oat, shade: K.oatShade, inner: P.shirt, buttons: K.brown }),
  'floral-cardigan': opener({
    color: P.sage, shade: P.sageShade, inner: K.white, buttons: K.white,
    wear: (c, dy) => {
      for (const [x, y, col] of [[12, 28, K.pink], [19, 29, K.yellow], [13, 30, K.white], [18, 27, K.pink]]) c.set(x, y + dy, col);
    },
    icon: (c) => {
      for (const [x, y, col] of [[3, 6, K.pink], [12, 5, K.yellow], [5, 10, K.white], [11, 11, K.pink], [2, 11, K.yellow], [13, 9, K.white]]) c.set(x, y, col);
    },
  }),
  'star-cardigan': opener({
    color: K.black, shade: K.blackShade, inner: K.charcoal, buttons: K.gold,
    wear: (c, dy) => {
      for (const [x, y] of [[12, 28], [19, 29], [13, 30]]) c.set(x, y + dy, K.glow);
    },
    icon: (c) => {
      for (const [x, y] of [[3, 7], [12, 6], [5, 11], [11, 11]]) {
        c.set(x, y, K.gold);
        c.set(x, y - 1, K.glow);
      }
    },
  }),
  flannel: top({
    sleeves: true, color: K.red, shade: K.redShade,
    wear: (c, dy) => {
      for (const x of [12, 15, 18]) for (let y = 27; y <= 30; y++) if (c.get(x, y + dy) !== -1 && c.get(x, y + dy) !== SOFT) c.set(x, y + dy, K.black);
      for (let x = 11; x < 21; x++) if (c.get(x, 29 + dy) !== SOFT) c.set(x, 29 + dy, K.redShade);
    },
    arms: (c, dy) => {
      c.set(9, 30 + dy, K.black);
      c.set(22, 30 + dy, K.black);
    },
    icon: (c) => {
      for (const x of [3, 6, 9, 12]) for (let y = 2; y < 15; y++) if (c.get(x, y) === K.red || c.get(x, y) === K.redShade) c.set(x, y, K.black);
      for (const y of [6, 10]) for (let x = 0; x < 16; x++) if (c.get(x, y) === K.red) c.set(x, y, K.redShade);
      c.rect(7, 2, 2, 12, K.black);
    },
  }),
  'denim-jacket': opener({ color: K.denim, shade: K.denimShade, inner: K.white, buttons: P.gold, cuff: K.denimShade }),
  'bomber-jacket': opener({ color: K.olive, shade: K.oliveShade, inner: K.black, cuff: K.rust,
    wear: (c, dy) => c.rect(13, 26 + dy, 6, 1, K.rust),
    icon: (c) => {
      c.rect(5, 2, 6, 1, K.rust);
      c.rect(4, 13, 8, 1, K.rust);
    },
  }),

  // ----- dresses -----
  sundress: dress({
    shape: 'tank', color: K.yellow, shade: K.yellowShade, skirt: { len: 4, flare: 1 },
    wear: (c, dy) => {
      for (const [x, y] of [[12, 32], [17, 33], [14, 34], [20, 34]]) c.set(x, y + dy, K.white);
    },
    icon: (c) => {
      for (const [x, y] of [[4, 11], [9, 12], [7, 10], [11, 14], [5, 14]]) c.set(x, y, K.white);
    },
  }),
  'pinafore-dress': dress({
    color: P.shirt, shade: P.shirtShade, skirt: { len: 4, flare: 0.8, color: P.sage, shade: P.sageShade },
    wear: (c, dy) => {
      c.rect(13, 28 + dy, 6, 3, P.sage); // pinafore bib
      c.rect(13, 26 + dy, 1, 2, P.sageShade);
      c.rect(18, 26 + dy, 1, 2, P.sageShade);
    },
    icon: (c) => {
      c.rect(6, 3, 4, 5, P.sage);
      c.rect(6, 1, 1, 2, P.sageShade);
      c.rect(9, 1, 1, 2, P.sageShade);
    },
  }),
  'prairie-dress': dress({
    shape: 'puff', color: 0xe8c8b8, shade: 0xc8a090, skirt: { len: 6, flare: 0.6 },
    wear: (c, dy) => {
      for (const [x, y] of [[12, 28], [18, 30], [13, 33], [19, 32], [11, 35], [16, 35], [20, 35]]) c.set(x, y + dy, x % 3 ? K.red : P.leafLight);
    },
    icon: (c, bottom) => {
      for (const [x, y] of [[7, 3], [4, 10], [10, 11], [6, 13], [12, 14], [2, 14]]) c.set(x, y, y % 2 ? K.red : P.leafLight);
      for (let x = 1; x < 16; x += 2) c.set(x, bottom - 1, K.white); // ruffle hem
    },
  }),
  'mushroom-dress': dress({
    shape: 'puff', color: K.white, shade: K.whiteShade, skirt: { len: 4, flare: 1.3, color: K.red, shade: K.redShade },
    wear: (c, dy) => {
      for (const [x, y] of [[11, 32], [15, 31], [19, 32], [13, 33], [17, 33], [21, 33]]) c.set(x, y + dy, K.white);
    },
    icon: (c) => {
      for (const [x, y] of [[5, 10], [9, 10], [3, 13], [7, 12], [11, 13], [13, 14]]) c.set(x, y, K.white);
    },
  }),
  'puff-dress': dress({
    shape: 'puff', color: K.pink, shade: K.pinkShade, skirt: { len: 4, flare: 1.2 },
    wear: (c, dy) => {
      c.rect(14, 30 + dy, 4, 1, K.white); // sash
      c.set(15, 29 + dy, K.white);
    },
    icon: (c) => {
      c.rect(5, 8, 6, 1, K.white);
      c.rect(7, 7, 2, 3, K.white);
    },
  }),
  'tutu-dress': dress({
    shape: 'tank', color: 0xf6d0dc, shade: K.pinkShade, skirt: { len: 3, flare: 2.2, color: 0xfae4ec, shade: 0xe8b4c4 },
    wear: (c, dy) => {
      for (let x = 7; x < 25; x += 2) c.set(x, 33 + dy, 0xfae4ec); // fluffy tulle
      c.set(16, 28 + dy, K.white);
    },
    icon: (c) => {
      for (let x = 1; x < 16; x += 2) c.set(x, 12, 0xe8b4c4);
      for (let x = 2; x < 15; x += 3) c.set(x, 10, K.white);
    },
  }),
  'sailor-dress': dress({
    color: K.white, shade: K.whiteShade, skirt: { len: 4, flare: 1, color: K.navy, shade: K.navyShade },
    wear: (c, dy) => {
      c.rect(11, 27 + dy, 10, 1, K.navy); // sailor collar
      c.rect(14, 28 + dy, 4, 1, K.red); // bow
      c.set(15, 29 + dy, K.red);
      for (const x of [12, 15, 18]) c.set(x, 33 + dy, K.navyShade); // pleats
    },
    icon: (c) => {
      c.rect(3, 3, 10, 2, K.navy);
      c.rect(6, 5, 4, 1, K.red);
      c.rect(7, 6, 2, 1, K.red);
    },
  }),
  'layered-dress': dress({
    shape: 'tank', color: K.black, shade: K.blackShade, skirt: { len: 5, flare: 0.9, color: K.charcoal, shade: K.black },
    wear: (c, dy) => {
      for (let x = 10; x < 23; x++) if (c.get(x, 33 + dy) === K.charcoal) c.set(x, 33 + dy, K.black); // tiers
      for (let x = 7; x < 25; x += 2) if (c.get(x, 35 + dy) !== -1) c.set(x, 35 + dy, K.charcoalShade); // lace hem
    },
    icon: (c) => {
      for (let x = 0; x < 16; x++) if (c.get(x, 11) === K.charcoal) c.set(x, 11, K.black);
      for (let x = 0; x < 16; x++) if (c.get(x, 13) === K.charcoal) c.set(x, 13, K.black);
    },
  }),
  'plaid-dress': dress({
    color: K.black, shade: K.blackShade, skirt: { len: 4, flare: 1, color: K.red, shade: K.redShade },
    wear: (c, dy) => {
      for (const x of [11, 14, 17, 20]) for (let y = 31; y < 34; y++) if (c.get(x, y + dy) === K.red) c.set(x, y + dy, K.black);
      for (let x = 9; x < 23; x++) if (c.get(x, 32 + dy) === K.red) c.set(x, 32 + dy, K.redShade);
    },
    icon: (c) => {
      for (const x of [3, 6, 9, 12]) for (let y = 9; y < 15; y++) if (c.get(x, y) === K.red) c.set(x, y, K.black);
      for (let x = 0; x < 16; x++) if (c.get(x, 12) === K.red) c.set(x, 12, K.redShade);
    },
  }),
  'slip-dress': dress({
    shape: 'tank', color: K.champagne, shade: K.champagneShade, skirt: { len: 5, flare: 0.4 },
    wear: (c, dy) => {
      c.set(13, 29 + dy, 0xfaf0dc); // satin shine
      c.set(13, 32 + dy, 0xfaf0dc);
    },
    icon: (c) => {
      c.rect(6, 4, 1, 8, 0xfaf0dc);
    },
  }),
  'babydoll-dress': dress({
    shape: 'puff', color: K.lilac, shade: K.lilacShade, skirt: { len: 3, flare: 1.5 },
    wear: (c, dy) => c.rect(11, 29 + dy, 10, 1, K.white), // ribbon under the bust
    icon: (c) => c.rect(4, 7, 8, 1, K.white),
  }),
  'jumper-dress': dress({
    sleeves: true, color: P.brick, shade: P.brickDark, skirt: { len: 5, flare: 0.4 },
    wear: (c, dy) => {
      c.rect(13, 25 + dy, 6, 2, P.brick); // big cozy collar
      for (let y = 31; y < 35; y += 2) c.set(15, y + dy, P.brickDark); // ribbing
    },
    icon: (c) => c.rect(6, 0, 4, 2, P.brick),
  }),
  'witch-dress': dress({
    sleeves: true, color: K.black, shade: K.blackShade, skirt: { len: 6, flare: 0.7 },
    wear: (c, dy) => {
      c.rect(9, 26 + dy, 2, 9, K.plum); // the cape, open at the front
      c.rect(21, 26 + dy, 2, 9, K.plumShade);
      c.rect(11, 26 + dy, 10, 1, K.plum);
      c.set(15, 27 + dy, P.gold); // clasp
      c.set(16, 27 + dy, P.gold);
    },
    icon: (c, bottom) => {
      c.rect(4, 1, 8, 2, K.plum); // cape collar
      for (let y = 3; y < bottom; y++) for (const x of [1, 2, 13, 14]) if (c.get(x, y) === K.black || c.get(x, y) === K.blackShade) c.set(x, y, K.plum);
      c.rect(7, 2, 2, 1, P.gold);
    },
  }),
  'snowflake-dress': dress({
    shape: 'puff', color: K.icy, shade: K.icyShade, skirt: { len: 4, flare: 1.1 },
    wear: (c, dy) => {
      c.rect(9, 27 + dy, 3, 1, K.white); // fluffy trim
      c.rect(20, 27 + dy, 3, 1, K.white);
      for (let x = 8; x < 24; x++) if (c.get(x, 34 + dy) !== -1) c.set(x, 34 + dy, K.white);
      sparkle(c, 13, 32 + dy, K.white, K.icy);
      sparkle(c, 18, 30 + dy, K.white, K.icy);
    },
    icon: (c, bottom) => {
      for (let x = 0; x < 16; x++) if (c.get(x, bottom - 1) !== -1) c.set(x, bottom - 1, K.white);
      sparkle(c, 5, 11, K.white, K.icy);
      sparkle(c, 10, 12, K.white, K.icy);
      sparkle(c, 8, 4, K.white, K.icy);
    },
  }),
  'kimono-robe': dress({
    sleeves: true, color: K.plum, shade: K.plumShade, skirt: { len: 6, flare: 0.3 },
    wear: (c, dy) => {
      c.line(13, 27 + dy, 16, 30 + dy, K.pink); // wrap collar
      c.line(19, 27 + dy, 16, 30 + dy, K.pinkShade);
      c.rect(11, 31 + dy, 10, 1, K.pink); // sash
      for (const [x, y] of [[12, 33], [18, 34], [14, 35]]) c.set(x, y + dy, K.pink); // blossoms
    },
    icon: (c) => {
      c.line(5, 1, 8, 6, K.pink);
      c.line(11, 1, 8, 6, K.pink);
      c.rect(4, 8, 8, 1, K.pink);
      for (const [x, y] of [[3, 11], [11, 12], [6, 14], [2, 5], [13, 6]]) c.set(x, y, K.pink);
    },
  }),
  'denim-overalls': overalls({
    color: K.denim, shade: K.denimShade, tee: K.white, teeShade: K.whiteShade, legLen: 5,
    wear: (c, dy) => {
      for (const x of [11, 13, 15, 17, 19]) if (c.get(x, 27 + dy) === K.white) c.set(x, 27 + dy, K.red); // striped tee
    },
  }),
  'corduroy-overalls': overalls({
    color: K.rust, shade: K.rustShade, tee: K.oat, teeShade: K.oatShade, legLen: 5,
    wear: (c, dy, f) => {
      for (const x of [14, 16]) c.set(x, 30 + dy, K.rustShade); // cord lines
      c.set(f.legs.front + 1, 34 - (f.legs.frontLift || 0), K.rustShade);
    },
    icon: (c) => {
      for (const x of [4, 10]) for (let y = 9; y < 15; y += 2) c.set(x, y, K.rustShade);
    },
  }),
  shortalls: overalls({ color: K.lightDenim, shade: K.lightDenimShade, tee: K.pink, teeShade: K.pinkShade, legLen: 2 }),

  // ----- pants -----
  'flared-jeans': pants({ color: K.denim, shade: K.denimShade, flare: true, wear: (c, dy) => c.set(15, 31 + dy, P.gold) }),
  'baggy-jeans': pants({ color: K.lightDenim, shade: K.lightDenimShade, width: 3, wear: (c, dy) => c.set(15, 31 + dy, P.gold) }),
  'low-rise-jeans': pants({
    color: K.darkDenim, shade: K.darkDenimShade,
    wear: (c, dy) => {
      c.rect(11, 32 + dy, 10, 1, K.hotPink); // butterfly belt
      c.set(15, 32 + dy, K.babyBlue);
      c.set(16, 32 + dy, K.babyBlue);
    },
    icon: (c) => {
      c.rect(3, 2, 10, 1, K.hotPink);
      c.rect(7, 1, 2, 3, K.babyBlue);
    },
  }),
  'black-cargo': pants({
    color: K.charcoal, shade: K.charcoalShade, width: 3,
    wear: (c, dy, f) => {
      const x = f.legs.front;
      const y = 34 - (f.legs.frontLift || 0);
      c.rect(x, y, 2, 2, K.charcoalShade); // pocket
      c.set(x + 2, y + 2, K.silver); // dangly strap
    },
    icon: (c) => {
      c.rect(2, 7, 4, 3, K.charcoalShade);
      c.rect(10, 7, 4, 3, K.charcoalShade);
      c.line(13, 10, 15, 13, K.silver);
    },
  }),
  'patchwork-pants': pants({
    color: P.sage, shade: P.sageShade,
    wear: (c, dy, f) => {
      const { legs } = f;
      c.rect(legs.front, 33 - (legs.frontLift || 0), 2, 2, K.rust);
      c.rect(legs.back, 35 - (legs.backLift || 0), 2, 2, K.denim);
      c.rect(12, 31 + dy, 3, 1, K.yellow);
    },
    icon: (c) => {
      c.rect(3, 4, 4, 4, K.rust);
      c.rect(9, 9, 4, 4, K.denim);
      c.rect(3, 10, 4, 3, K.yellow);
      c.rect(9, 3, 4, 3, K.pink);
    },
  }),
  leggings: pants({ color: K.black, shade: K.blackShade, wear: (c, dy, f) => c.set(f.legs.front, 34 - (f.legs.frontLift || 0), K.charcoal) }),
  sweatpants: pants({
    color: K.gray, shade: K.grayShade,
    wear: (c, dy, f) => {
      eachFoot(f, (x, lift) => c.rect(x, 37 - lift, 2, 1, K.whiteShade)); // cuffs
      c.set(15, 32 + dy, K.white); // drawstring
      c.set(16, 32 + dy, K.white);
    },
    icon: (c, bottom) => {
      c.rect(3, bottom - 2, 4, 2, K.whiteShade);
      c.rect(9, bottom - 2, 4, 2, K.whiteShade);
      c.line(7, 3, 6, 6, K.white);
      c.line(9, 3, 10, 6, K.white);
    },
  }),
  'pajama-pants': pants({
    color: P.sageLight, shade: P.sage,
    wear: (c, dy, f) => {
      eachFoot(f, (x, lift) => {
        c.rect(x, 35 - lift, 2, 1, P.sageDark);
        c.set(x, 34 - lift, P.cream);
      });
      c.rect(12, 32 + dy, 8, 1, P.sageDark);
    },
    icon: (c) => {
      for (const y of [5, 9, 13]) for (let x = 0; x < 16; x++) if (c.get(x, y) === P.sageLight) c.set(x, y, P.sageDark);
      for (const x of [4, 11]) for (let y = 3; y < 15; y++) if (c.get(x, y) === P.sageLight) c.set(x, y, P.cream);
    },
  }),
  'denim-shorts': pants({
    len: 2, color: K.lightDenim, shade: K.lightDenimShade,
    wear: (c, dy, f) => eachFoot(f, (x, lift) => c.set(x, 34 - lift, K.white)), // frayed edge
    icon: (c, bottom) => {
      for (const x of [3, 5, 10, 12]) c.set(x, bottom - 1, K.white);
    },
  }),
  'bike-shorts': pants({ len: 3, color: K.black, shade: K.blackShade }),
  'athletic-shorts': pants({
    len: 2, color: K.red, shade: K.redShade,
    wear: (c, dy, f) => eachFoot(f, (x, lift) => c.set(x + 1, 33 - lift, K.white)),
    icon: (c) => {
      c.rect(3, 3, 1, 5, K.white);
      c.rect(12, 3, 1, 5, K.white);
    },
  }),
  'ruffle-shorts': pants({
    len: 2, color: K.pink, shade: K.pinkShade,
    wear: (c, dy, f) => eachFoot(f, (x, lift) => c.rect(x - 1, 34 - lift, 4, 1, 0xfad6e0)), // frilly hem
    icon: (c, bottom) => {
      for (let x = 2; x < 15; x++) if (x !== 7 && x !== 8) c.set(x, bottom - 1, 0xfad6e0);
    },
  }),

  // ----- skirts -----
  'mini-skirt': skirt({ len: 3, flare: 0.6, color: K.denim, shade: K.denimShade, wear: (c, dy) => c.set(15, 31 + dy, P.gold), icon: (c) => c.rect(8, 4, 1, 4, K.denimShade) }),
  'pleated-skirt': skirt({
    len: 4, flare: 0.8, color: K.pink, shade: K.pinkShade,
    wear: (c, dy) => {
      for (const x of [11, 13, 16, 18, 20]) c.set(x, 33 + dy, K.pinkShade);
    },
    icon: (c, bottom) => {
      for (const x of [3, 6, 9, 12]) c.line(x + 1, 5, x + (x > 7 ? 2 : 0), bottom - 2, K.pinkShade);
    },
  }),
  'tiered-skirt': skirt({
    len: 5, flare: 0.8, color: 0xe8dcc0, shade: 0xc8b490,
    wear: (c, dy) => {
      for (let x = 7; x < 25; x++) if (c.get(x, 33 + dy) === 0xe8dcc0) c.set(x, 33 + dy, 0xc8b490);
      for (const [x, y] of [[12, 32], [17, 32], [14, 34], [19, 34]]) c.set(x, y + dy, K.red);
    },
    icon: (c) => {
      for (const y of [7, 11]) for (let x = 0; x < 16; x++) if (c.get(x, y) === 0xe8dcc0) c.set(x, y, 0xc8b490);
      for (const [x, y] of [[6, 5], [10, 9], [4, 9], [8, 12], [12, 13]]) c.set(x, y, K.red);
    },
  }),
  'tulle-skirt': skirt({
    len: 4, flare: 1.8, color: K.lilac, shade: K.lilacShade,
    wear: (c, dy) => {
      for (let x = 7; x < 25; x += 2) if (c.get(x, 32 + dy) !== -1) c.set(x, 32 + dy, 0xe0d4f4);
    },
    icon: (c) => {
      for (let y = 5; y < 15; y += 2) for (let x = (y % 4) ? 1 : 2; x < 16; x += 3) if (c.get(x, y) === K.lilac) c.set(x, y, 0xe0d4f4);
    },
  }),
  'long-skirt': skirt({
    len: 7, flare: 0.5, color: P.moss, shade: P.mossDark,
    wear: (c, dy) => {
      c.set(13, 33 + dy, P.mossDark); // soft folds
      c.set(12, 35 + dy, P.mossDark);
      c.set(18, 34 + dy, P.mossDark);
    },
    icon: (c) => {
      c.line(6, 5, 4, 14, P.mossDark);
      c.line(10, 5, 12, 14, P.mossDark);
    },
  }),

  // ----- hats -----
  'baseball-cap': layered(
    (c, dy) => {
      c.ellipse(15.5, 9 + dy, 9.5, 5.5, K.navy, (x, y) => y <= 9 + dy);
      c.poly([[18, 8 + dy], [29, 9 + dy], [28, 11 + dy], [18, 10 + dy]], K.navyShade); // the brim
    },
    (c, dy) => {
      c.set(15, 3 + dy, K.navyShade); // button on top
      c.set(12, 6 + dy, K.brown); // acorn
      c.set(12, 5 + dy, K.brownShade);
    },
    (c) => {
      c.ellipse(7, 9, 6, 6, K.navy, (x, y) => y <= 10);
      c.poly([[9, 8], [16, 9], [15, 12], [9, 11]], K.navyShade);
      c.outline(P.line);
      c.set(5, 6, K.brown);
      c.set(5, 5, K.brownShade);
      shadow(c, 8, 14, 7);
    },
  ),
  'trucker-hat': layered(
    (c, dy) => {
      c.ellipse(15.5, 9 + dy, 9.5, 5.5, K.pink, (x, y) => y <= 9 + dy);
      c.poly([[18, 8 + dy], [29, 9 + dy], [28, 11 + dy], [18, 10 + dy]], K.hotPink);
    },
    (c, dy) => {
      for (let y = 4; y <= 9; y++) for (let x = 6; x < 13; x++) if ((x + y) % 2 && c.get(x, y + dy) === K.pink) c.set(x, y + dy, K.white); // mesh back
      c.set(18, 6 + dy, K.white); // a star patch
    },
    (c) => {
      c.ellipse(7, 9, 6, 6, K.pink, (x, y) => y <= 10);
      c.poly([[9, 8], [16, 9], [15, 12], [9, 11]], K.hotPink);
      c.outline(P.line);
      for (let y = 4; y <= 10; y++) for (let x = 1; x < 5; x++) if ((x + y) % 2 && c.get(x, y) === K.pink) c.set(x, y, K.white);
      c.set(8, 6, K.white);
      shadow(c, 8, 14, 7);
    },
  ),
  beanie: beanie(K.charcoal, K.charcoalShade),
  'pom-beanie': beanie(K.oat, K.oatShade, (c, dy) => c.circle(15.5, 2 + dy, 2.5, K.white), (c) => c.circle(8, 2.5, 2.5, K.white)),
  'cat-beanie': beanie(
    K.black, K.blackShade,
    (c, dy) => {
      c.poly([[6, 7 + dy], [8, 0 + dy], [12, 4 + dy]], K.black);
      c.poly([[19, 4 + dy], [23, 0 + dy], [25, 7 + dy]], K.black);
    },
    (c) => {
      c.poly([[1, 6], [2, 0], [6, 4]], K.black);
      c.poly([[10, 4], [14, 0], [15, 6]], K.black);
    },
  ),
  'newsboy-cap': layered(
    (c, dy) => {
      c.ellipse(15.5, 7 + dy, 11, 4.5, K.brown);
      c.poly([[17, 9 + dy], [27, 10 + dy], [26, 12 + dy], [17, 11 + dy]], K.brownShade);
    },
    (c, dy) => {
      for (const [x, y] of [[9, 6], [13, 5], [17, 7], [21, 5], [11, 8], [20, 8]]) c.set(x, y + dy, K.oat); // tweed flecks
      c.set(15, 3 + dy, K.brownShade);
    },
    (c) => {
      c.ellipse(8, 8, 7.5, 4.5, K.brown);
      c.poly([[8, 10], [16, 11], [15, 13], [8, 12]], K.brownShade);
      c.outline(P.line);
      for (const [x, y] of [[4, 7], [7, 6], [10, 8], [5, 9]]) c.set(x, y, K.oat);
      shadow(c, 8, 15, 7);
    },
  ),
  'cowl-hood': layered(
    (c, dy) => {
      c.ellipse(15.5, 16 + dy, 13, 12.5, P.fern);
      c.poly([[10, 6 + dy], [15, 1 + dy], [21, 6 + dy]], P.fern); // the point
      c.rect(7, 24 + dy, 18, 5, P.fern); // drapes over her shoulders
      c.ellipse(15.5, 19 + dy, 9, 7.5, -1); // her face peeks out
    },
    (c, dy) => {
      c.ellipse(15.5, 19 + dy, 10, 8.5, P.leafDark, (x, y) => c.get(x, y) === P.fern && y < 26 + dy); // shadowy inside edge
      c.rect(7, 28 + dy, 18, 1, P.leafDark);
    },
    (c) => {
      c.ellipse(8, 8, 7, 7, P.fern);
      c.poly([[4, 3], [8, 0], [12, 3]], P.fern);
      c.rect(1, 11, 14, 4, P.fern);
      c.ellipse(8, 9, 4, 4, P.leafDark);
      c.outline(P.line);
      c.ellipse(8, 9.5, 3, 3, K.black);
    },
  ),
  'sun-hat': layered(
    (c, dy) => {
      c.ellipse(15.5, 9 + dy, 15, 2.5, K.straw);
      c.ellipse(15.5, 6 + dy, 8, 4, K.straw, (x, y) => y <= 9 + dy);
    },
    (c, dy) => {
      c.rect(8, 8 + dy, 16, 1, K.pink); // ribbon
      c.rect(23, 8 + dy, 2, 3, K.pinkShade); // ribbon tails
      for (const [x, y] of [[4, 10], [10, 4], [14, 3], [19, 5], [27, 9], [6, 9]]) c.set(x, y + dy, K.strawShade);
      c.rect(1, 10 + dy, 30, 1, K.strawShade);
    },
    (c) => {
      c.ellipse(8, 10, 7.5, 2.5, K.straw);
      c.ellipse(8, 7, 4.5, 4, K.straw, (x, y) => y <= 9);
      c.rect(4, 8, 9, 1, K.pink);
      c.outline(P.line);
      for (const [x, y] of [[2, 10], [6, 5], [10, 6], [13, 11]]) c.set(x, y, K.strawShade);
      c.rect(12, 9, 2, 3, K.pinkShade);
      shadow(c, 8, 14, 7);
    },
  ),
  'witch-hat': layered(
    (c, dy) => {
      c.ellipse(15.5, 9 + dy, 14, 2, K.black);
      c.poly([[9, 9 + dy], [22, 9 + dy], [19, 3 + dy], [24, 0 + dy], [16, 1 + dy]], K.black);
    },
    (c, dy) => {
      c.rect(10, 7 + dy, 11, 1, K.plum); // band
      c.rect(15, 7 + dy, 2, 1, P.gold); // buckle
      c.set(18, 4 + dy, K.charcoal);
    },
    (c) => {
      c.ellipse(8, 13, 8, 2, K.black);
      c.poly([[3, 13], [13, 13], [10, 5], [14, 1], [7, 3]], K.black);
      c.rect(4, 11, 8, 1, K.plum);
      c.rect(7, 11, 2, 1, P.gold);
      c.outline(P.line);
    },
  ),
  'princess-hat': layered(
    (c, dy) => {
      c.poly([[10, 9 + dy], [21, 9 + dy], [16, 0 + dy], [15, 0 + dy]], K.pink);
      c.rect(10, 8 + dy, 11, 2, P.gold);
    },
    (c, dy) => {
      c.see(150, () => {
        c.line(15, 1 + dy, 9, 6 + dy, K.white, 2); // the floaty veil
        c.line(9, 6 + dy, 5, 14 + dy, K.white, 2);
      });
      c.set(17, 4 + dy, 0xfad6e0);
      c.set(14, 9 + dy, K.hotPink);
    },
    (c) => {
      c.poly([[4, 14], [12, 14], [9, 1], [7, 1]], K.pink);
      c.rect(4, 13, 8, 2, P.gold);
      c.outline(P.line);
      c.see(150, () => c.line(8, 1, 1, 12, K.white, 2));
      c.set(9, 6, 0xfad6e0);
    },
  ),
  'bow-headband': layered(
    (c, dy) => {
      c.ellipse(15.5, 14 + dy, 11.5, 9.5, K.hotPink, (x, y) => y <= 11 + dy && Math.hypot((x - 15.5) / 11.5, (y - 15 - dy) / 9.5) > 0.93);
      bow(c, 10, 6 + dy, K.pink, K.hotPink);
    },
    null,
    (c) => {
      c.ellipse(8, 12, 7, 7, K.hotPink, (x, y) => y <= 13 && Math.hypot((x - 8) / 7, (y - 13) / 7) > 0.8);
      bow(c, 8, 5, K.pink, K.hotPink);
      c.outline(P.line);
    },
  ),
  'mushroom-hat': layered(
    (c, dy) => c.ellipse(15.5, 9 + dy, 13, 7, K.red, (x, y) => y <= 10 + dy),
    (c, dy) => {
      c.rect(4, 10 + dy, 24, 1, K.oat); // gills under the cap
      for (const [x, y] of [[9, 5], [15, 4], [21, 6], [12, 8], [19, 9], [6, 9], [25, 9]]) c.rect(x, y + dy, 2, 1, K.white);
    },
    (c) => {
      c.ellipse(8, 9, 7.5, 6.5, K.red, (x, y) => y <= 10);
      c.rect(1, 10, 15, 2, K.oat);
      c.rect(6, 12, 4, 2, K.oat);
      c.outline(P.line);
      for (const [x, y] of [[4, 6], [8, 4], [11, 7], [6, 8]]) c.rect(x, y, 2, 1, K.white);
    },
  ),
  'bunny-hat': layered(
    (c, dy) => {
      c.ellipse(15.5, 10 + dy, 11, 7, K.white, (x, y) => y <= 12 + dy);
      c.ellipse(4.5, 14 + dy, 2.2, 6, K.white); // floppy ears
      c.ellipse(26.5, 14 + dy, 2.2, 6, K.white);
    },
    (c, dy) => {
      c.rect(4, 11 + dy, 1, 6, K.pink);
      c.rect(26, 11 + dy, 1, 6, K.pink);
      c.rect(9, 5 + dy, 5, 1, K.whiteShade);
    },
    (c) => {
      c.ellipse(8, 8, 6, 5, K.white);
      c.ellipse(2, 10, 1.8, 5, K.white);
      c.ellipse(14, 10, 1.8, 5, K.white);
      c.outline(P.line);
      c.rect(2, 8, 1, 4, K.pink);
      c.rect(14, 8, 1, 4, K.pink);
      c.set(6, 8, K.black);
      c.set(10, 8, K.black);
      c.set(8, 9, K.pinkShade);
    },
  ),
  earmuffs: layered(
    (c, dy) => {
      c.ellipse(15.5, 14 + dy, 11.5, 9.5, K.charcoal, (x, y) => y <= 14 + dy && Math.hypot((x - 15.5) / 11.5, (y - 15 - dy) / 9.5) > 0.93);
      c.circle(4.5, 17 + dy, 3.2, K.pink);
      c.circle(26.5, 17 + dy, 3.2, K.pink);
    },
    (c, dy) => {
      c.set(3, 16 + dy, K.white);
      c.set(25, 16 + dy, K.white);
      c.set(5, 19 + dy, K.pinkShade);
      c.set(27, 19 + dy, K.pinkShade);
    },
    (c) => {
      c.ellipse(8, 10, 6, 7, K.charcoal, (x, y) => y <= 10 && Math.hypot((x - 8) / 6, (y - 11) / 7) > 0.75);
      c.circle(2.5, 11, 2.5, K.pink);
      c.circle(13.5, 11, 2.5, K.pink);
      c.outline(P.line);
      c.set(2, 10, K.white);
      c.set(13, 10, K.white);
    },
  ),
  'santa-hat': layered(
    (c, dy, f) => {
      c.ellipse(15.5, 7 + dy, 9.5, 4.5, K.red);
      c.line(21, 5 + dy, 26 + f.sway, 8 + dy, K.red, 3);
      c.line(26 + f.sway, 8 + dy, 27 + f.sway, 12 + dy, K.red, 3);
      c.rect(5, 8 + dy, 22, 3, K.white);
      c.circle(27 + f.sway, 14 + dy, 2.2, K.white);
    },
    (c, dy) => c.rect(10, 4 + dy, 4, 1, 0xd06058),
    (c) => {
      c.poly([[2, 11], [10, 3], [14, 8], [13, 11]], K.red);
      c.rect(1, 10, 14, 3, K.white);
      c.circle(13.5, 7.5, 2, K.white);
      c.outline(P.line);
      shadow(c, 8, 14, 7);
    },
  ),

  // ----- shoes -----
  'platform-sneakers': shoe(
    (c, x, lift, back) => {
      c.rect(x, 35 - lift, 4, 2, back ? K.whiteShade : K.white);
      c.rect(x, 37 - lift, 4, 3, back ? K.pinkShade : K.pink);
    },
    { color: K.white, shade: K.whiteShade, sole: K.pink, soleH: 3, detail: (c, base) => c.rect(2, base + 1, 13, 1, K.white) },
  ),
  'ankle-boots': shoe(
    (c, x, lift, back) => {
      c.rect(x, 35 - lift, 3, 5, back ? K.brownShade : K.brown);
      c.rect(x, 38 - lift, 4, 2, back ? K.brownShade : K.brown);
    },
    { shaft: 2, color: K.brown, shade: K.brownShade, sole: K.blackShade },
  ),
  'combat-boots': {
    wear(f) {
      const out = twoSheets();
      eachFoot(f, (x, lift, back) =>
        out.fixed.draw(piece((c) => {
          c.rect(x, 34 - lift, 3, 5, back ? K.blackShade : K.black);
          c.rect(x, 37 - lift, 4, 2, back ? K.blackShade : K.black);
          c.rect(x, 39 - lift, 4, 1, K.charcoal); // chunky sole
        }, SOFT)),
      );
      eachFoot(f, (x, lift) => {
        out.fixed.set(x + 1, 35 - lift, K.grayShade); // laces
        out.fixed.set(x + 1, 37 - lift, K.grayShade);
      });
      return out;
    },
    icon: shoeIcon({
      shaft: 4, color: K.black, shade: K.blackShade, sole: K.charcoal, soleH: 2,
      detail: (c, base, top) => {
        for (let y = top + 1; y < base - 1; y += 2) c.rect(6, y, 2, 1, K.gray);
      },
    }),
  },
  'mary-janes': {
    wear(f) {
      const out = twoSheets();
      eachFoot(f, (x, lift, back) =>
        out.fixed.draw(piece((c) => {
          c.rect(x, 35 - lift, 2, 3, back ? K.whiteShade : K.white); // frilly socks
          c.rect(x, 38 - lift, 4, 2, back ? K.blackShade : K.black);
        }, SOFT)),
      );
      eachFoot(f, (x, lift) => {
        out.fixed.rect(x, 37 - lift, 2, 1, K.black); // strap
        out.fixed.set(x + 2, 38 - lift, K.charcoal); // shine
      });
      return out;
    },
    icon: shoeIcon({ shaft: -1, color: K.black, shade: K.blackShade, sole: K.blackShade, detail: (c, base) => {
      c.rect(4, base - 5, 5, 2, K.white);
      c.rect(9, base - 3, 1, 1, K.charcoal);
      c.rect(4, base - 3, 1, 1, K.white);
    } }),
  },
  'ballet-flats': {
    wear(f) {
      const out = twoSheets();
      eachFoot(f, (x, lift, back) => out.fixed.draw(piece((c) => c.rect(x, 38 - lift, 4, 2, back ? K.pinkShade : K.pink), SOFT)));
      eachFoot(f, (x, lift) => {
        out.fixed.set(x, 37 - lift, K.pinkShade); // ribbons crossing up the ankle
        out.fixed.set(x + 1, 36 - lift, K.pinkShade);
        out.fixed.set(x, 35 - lift, K.pinkShade);
      });
      return out;
    },
    icon: shoeIcon({ shaft: -2, color: K.pink, shade: K.pinkShade, sole: K.pinkShade, detail: (c, base) => {
      c.line(4, base - 4, 6, base - 9, K.pinkShade);
      c.line(7, base - 4, 5, base - 9, K.pinkShade);
      c.set(10, base - 3, K.hotPink);
    } }),
  },
  clogs: shoe(
    (c, x, lift, back) => {
      c.rect(x, 37 - lift, 4, 2, back ? K.rustShade : K.rust);
      c.rect(x, 39 - lift, 4, 1, P.woodLight);
    },
    { shaft: -1, color: K.rust, shade: K.rustShade, sole: P.woodLight, soleH: 2, detail: (c, base) => c.set(8, base - 3, K.white) },
  ),
  'fuzzy-boots': {
    wear(f) {
      const out = twoSheets();
      eachFoot(f, (x, lift, back) =>
        out.fixed.draw(piece((c) => {
          c.rect(x - 1, 34 - lift, 4, 6, back ? K.oatShade : K.oat);
          c.rect(x - 1, 38 - lift, 5, 2, back ? K.oatShade : K.oat);
        }, SOFT)),
      );
      eachFoot(f, (x, lift) => {
        out.fixed.rect(x - 1, 34 - lift, 4, 1, K.white); // fluffy cuff
        out.fixed.set(x, 36 - lift, K.white);
      });
      return out;
    },
    icon: shoeIcon({ shaft: 5, color: K.oat, shade: K.oatShade, sole: K.brownShade, detail: (c, base, top) => {
      c.rect(2, top, 8, 2, K.white);
      c.set(5, top + 4, K.white);
      c.set(7, top + 6, K.white);
    } }),
  },
  slippers: shoe(
    (c, x, lift, back) => c.rect(x, 37 - lift, 4, 3, back ? P.mossDark : P.moss),
    { shaft: -2, color: P.moss, shade: P.mossDark, sole: K.oat, detail: (c, base) => c.rect(4, base - 4, 4, 1, P.mossLight) },
  ),

  // ----- bags -----
  'shoulder-bag': bits(
    (c, dy) => {
      c.line(13, 27 + dy, 19, 30 + dy, K.hotPink);
      c.rect(19, 30 + dy, 6, 3, K.pink);
    },
    (c) => {
      c.line(3, 6, 8, 1, K.hotPink);
      c.line(8, 1, 13, 6, K.hotPink);
      c.rect(2, 6, 12, 7, K.pink);
      c.rect(2, 6, 12, 2, K.pinkShade);
      c.outline(P.line);
      c.rect(7, 7, 2, 2, P.gold);
      shadow(c, 8, 15, 6);
    },
  ),

  // ----- hair bits (drawn on the left side of her head) -----
  'butterfly-clips': bits(
    (c, dy) => {
      for (const [x, y, col] of [[8, 10, K.babyBlue], [12, 7, K.pink]]) {
        c.rect(x - 1, y - 1 + dy, 1, 2, col);
        c.rect(x + 1, y - 1 + dy, 1, 2, col);
        c.set(x, y + dy, K.charcoal);
      }
    },
    (c) => {
      for (const [x, y, col] of [[5, 6, K.babyBlue], [11, 10, K.pink]]) {
        c.rect(x - 3, y - 3, 3, 3, col);
        c.rect(x + 1, y - 3, 3, 3, col);
        c.rect(x - 2, y, 2, 2, col);
        c.rect(x + 1, y, 2, 2, col);
        c.rect(x, y - 3, 1, 5, K.charcoal);
      }
      c.outline(P.line);
    },
  ),
  'star-clips': bits(
    (c, dy) => {
      sparkle(c, 8, 10 + dy, P.gold, K.glow);
      sparkle(c, 12, 7 + dy, P.gold, K.glow);
    },
    (c) => {
      for (const [x, y] of [[5, 5], [11, 11]]) {
        c.poly([[x, y - 4], [x + 1, y - 1], [x + 4, y], [x + 1, y + 1], [x, y + 4], [x - 1, y + 1], [x - 4, y], [x - 1, y - 1]], P.gold);
      }
      c.outline(P.line);
      c.set(5, 5, K.glow);
      c.set(11, 11, K.glow);
    },
    { outlined: false },
  ),
  'pearl-clips': bits(
    (c, dy) => {
      for (const [x, y] of [[5, 12], [8, 10], [11, 8]]) c.rect(x, y + dy, 2, 1, K.white);
    },
    (c) => {
      for (const [x, y] of [[3, 12], [6, 9], [9, 6], [12, 3]]) c.circle(x, y, 1.6, K.white);
      c.outline(P.line);
      for (const [x, y] of [[3, 12], [6, 9], [9, 6], [12, 3]]) c.set(x - 1, y - 1, 0xffffff);
    },
  ),
  scrunchie: bits(
    (c, dy) => {
      c.circle(6.5, 8.5 + dy, 2.5, K.hotPink);
      c.set(6, 8 + dy, 0xb85070);
      c.set(7, 9 + dy, 0xb85070);
    },
    (c) => {
      c.circle(8, 8, 6, K.hotPink);
      c.circle(8, 8, 2.5, -1);
      c.outline(P.line);
      for (const [x, y] of [[4, 4], [11, 4], [3, 9], [12, 10], [7, 13]]) c.set(x, y, 0xb85070);
      for (const [x, y] of [[6, 3], [13, 7], [5, 12]]) c.set(x, y, K.pink);
    },
  ),
  'hair-ribbon': bits(
    (c, dy) => {
      bow(c, 7, 8 + dy, K.red, K.redShade);
      c.set(6, 10 + dy, K.red); // tails
      c.set(8, 10 + dy, K.red);
    },
    (c) => {
      c.poly([[1, 3], [7, 7], [1, 11]], K.red);
      c.poly([[15, 3], [9, 7], [15, 11]], K.red);
      c.rect(7, 6, 2, 3, K.redShade);
      c.line(7, 9, 5, 14, K.red);
      c.line(8, 9, 10, 14, K.red);
      c.outline(P.line);
    },
  ),

  // ----- glasses (face) -----
  'round-glasses': bits(
    (c, dy) => {
      for (const cx of [10.5, 20.5]) {
        c.circle(cx, 19.5 + dy, 3.6, P.gold);
        c.circle(cx, 19.5 + dy, 2.6, -1);
      }
      c.rect(14, 19 + dy, 3, 1, P.gold);
    },
    (c) => {
      for (const cx of [4, 12]) {
        c.circle(cx, 8, 3.6, P.gold);
        c.circle(cx, 8, 2.6, -1);
      }
      c.rect(7, 7, 2, 1, P.gold);
      c.outline(P.line);
      c.set(3, 7, K.white);
      c.set(11, 7, K.white);
    },
    { outlined: false },
  ),
  'cat-eye-glasses': bits(
    (c, dy) => {
      for (const [x, flick] of [[8, -1], [18, 1]]) {
        c.rect(x, 17 + dy, 6, 1, K.black);
        c.rect(x, 21 + dy, 6, 1, K.black);
        c.rect(x, 17 + dy, 1, 5, K.black);
        c.rect(x + 5, 17 + dy, 1, 5, K.black);
        c.set(flick < 0 ? x - 1 : x + 6, 16 + dy, K.black); // the flicky corners
      }
      c.rect(14, 18 + dy, 4, 1, K.black);
    },
    (c) => {
      for (const [x, flick] of [[1, -1], [9, 1]]) {
        c.rect(x, 6, 6, 1, K.black);
        c.rect(x, 10, 6, 1, K.black);
        c.rect(x, 6, 1, 5, K.black);
        c.rect(x + 5, 6, 1, 5, K.black);
        c.rect(flick < 0 ? x - 1 : x + 5, 4, 2, 2, K.black);
        c.see(90, () => c.rect(x + 1, 7, 4, 3, K.babyBlue));
      }
      c.rect(7, 7, 2, 1, K.black);
      c.outline(P.line);
    },
    { outlined: false },
  ),
  'tinted-shades': bits(
    (c, dy) => {
      c.see(150, () => {
        c.rect(9, 18 + dy, 4, 4, K.hotPink);
        c.rect(19, 18 + dy, 4, 4, K.hotPink);
      });
      c.rect(13, 18 + dy, 6, 1, K.silver);
      c.set(9, 18 + dy, K.white);
      c.set(19, 18 + dy, K.white);
    },
    (c) => {
      c.see(200, () => {
        c.ellipse(4, 8, 3, 2.5, K.hotPink);
        c.ellipse(12, 8, 3, 2.5, K.hotPink);
      });
      c.rect(7, 7, 2, 1, K.silver);
      c.outline(P.line);
      c.set(3, 7, K.white);
      c.set(11, 7, K.white);
    },
    { outlined: false },
  ),

  // ----- neck -----
  choker: bits(
    (c, dy) => {
      c.rect(14, 26 + dy, 4, 1, K.black);
      c.set(15, 27 + dy, K.silver);
    },
    (c) => {
      c.ellipse(8, 7, 6, 4, K.black);
      c.ellipse(8, 7, 5, 3, -1);
      c.circle(8, 12, 1.5, K.silver);
      c.circle(8, 12, 0.5, -1);
      c.outline(P.line);
    },
    { outlined: false },
  ),
  'bell-collar': bits(
    (c, dy) => {
      c.rect(13, 26 + dy, 6, 1, K.hotPink);
      c.rect(15, 27 + dy, 2, 2, P.gold);
    },
    (c) => {
      c.ellipse(8, 6, 6, 4, K.hotPink);
      c.ellipse(8, 6, 5, 3, -1);
      c.circle(8, 11.5, 2.5, P.gold);
      c.outline(P.line);
      c.set(7, 10, K.glow);
      c.rect(7, 13, 3, 1, P.coinShade);
    },
  ),
  bandana: layered(
    (c, dy) => {
      c.poly([[12, 26 + dy], [20, 26 + dy], [16, 31 + dy]], K.red);
      c.rect(13, 25 + dy, 6, 1, K.red);
    },
    (c, dy) => {
      c.set(14, 27 + dy, K.white);
      c.set(17, 27 + dy, K.white);
      c.set(16, 29 + dy, K.white);
    },
    (c) => {
      c.poly([[1, 3], [15, 3], [8, 14]], K.red);
      c.outline(P.line);
      for (const [x, y] of [[4, 5], [8, 6], [11, 5], [6, 8], [10, 9], [8, 11]]) c.set(x, y, K.white);
    },
  ),
  scarf: layered(
    (c, dy) => {
      c.rect(12, 25 + dy, 8, 3, P.cream);
      c.rect(17, 28 + dy, 2, 5, P.cream); // the long end
    },
    (c, dy) => {
      c.rect(13, 26 + dy, 6, 1, K.red);
      c.rect(17, 29 + dy, 2, 1, K.red);
      c.rect(17, 31 + dy, 2, 1, K.red);
      c.set(17, 33 + dy, K.red); // fringe
    },
    (c) => {
      c.rect(1, 2, 14, 4, P.cream);
      c.rect(9, 6, 4, 9, P.cream);
      c.outline(P.line);
      for (const x of [4, 8, 12]) c.rect(x, 2, 1, 4, K.red);
      for (const y of [8, 11]) c.rect(9, y, 4, 1, K.red);
      c.rect(9, 14, 1, 1, K.red);
      c.rect(11, 14, 1, 1, K.red);
    },
  ),

  // ----- hands -----
  mittens: bits(
    (c, dy) => {
      c.rect(8, 30 + dy, 3, 2, K.redShade);
      c.rect(21, 30 + dy, 3, 2, K.red);
      c.set(10, 32 + dy, K.white);
      c.set(21, 32 + dy, K.white);
    },
    (c) => {
      for (const [x, col] of [[1, K.redShade], [9, K.red]]) {
        c.rect(x, 4, 5, 7, col);
        c.ellipse(x + 2, 4, 2.5, 2, col);
        c.rect(x + (x > 5 ? -1 : 5), 6, 1, 3, col); // thumbs
        c.rect(x, 11, 5, 2, K.white);
      }
      c.line(3, 3, 8, 0, K.whiteShade);
      c.line(8, 0, 11, 3, K.whiteShade);
      c.outline(P.line);
    },
  ),
  'arm-warmers': bits(
    (c, dy) => {
      c.rect(9, 29 + dy, 2, 1, K.black);
      c.rect(21, 29 + dy, 2, 1, K.black);
      c.rect(9, 30 + dy, 2, 1, K.hotPink);
      c.rect(21, 30 + dy, 2, 1, K.hotPink);
    },
    (c) => {
      for (const x of [2, 9]) for (let y = 1; y < 15; y++) c.rect(x, y, 5, 1, y % 4 < 2 ? K.black : K.hotPink);
      c.outline(P.line);
    },
    { outlined: false },
  ),

  // ----- belts (waist) -----
  belt: bits(
    (c, dy) => {
      c.rect(11, 31 + dy, 10, 1, K.brown);
      c.rect(15, 31 + dy, 2, 1, P.gold);
    },
    (c) => {
      c.ellipse(8, 8, 7, 4, K.brown);
      c.ellipse(8, 8, 6, 3, -1);
      c.rect(10, 10, 4, 3, P.gold);
      c.rect(11, 11, 2, 1, -1);
      c.outline(P.line);
    },
    { outlined: false },
  ),
  'chain-belt': bits(
    (c, dy) => {
      for (let x = 10; x < 22; x += 2) c.set(x, 32 + dy, K.silver);
      c.set(21, 33 + dy, K.silver);
      c.set(20, 34 + dy, K.silver);
      c.set(19, 33 + dy, K.silverShade);
    },
    (c) => {
      for (let i = 0; i < 7; i++) {
        const x = 2 + i * 2;
        const y = 4 + Math.round(Math.sin(i / 2) * 2);
        c.rect(x, y, 2, 2, i % 2 ? K.silverShade : K.silver);
      }
      for (let y = 6; y < 13; y += 2) c.rect(13, y, 2, 2, K.silver);
      c.outline(P.line);
    },
  ),

  // ----- legs (under your shoes) -----
  tights: legwear(K.black, K.blackShade, null, (c) => c.rect(4, 2, 1, 12, K.charcoal)),
  'striped-stockings': legwear(K.white, K.whiteShade, (y) => (y % 2 ? K.black : null), (c) => {
    for (let y = 1; y < 15; y += 2) for (let x = 0; x < 16; x++) if (c.get(x, y) === K.white || c.get(x, y) === K.whiteShade) c.set(x, y, K.black);
  }),
  'lace-stockings': legwear(K.white, K.whiteShade, (y, top) => (y === top ? K.whiteShade : null), (c) => {
    for (let x = 2; x < 14; x += 2) c.set(x, 1, K.whiteShade);
  }),

  // ----- charms (behind you) -----
  'fairy-wings': {
    wear(f) {
      const out = twoSheets();
      const { dy, sway } = f;
      const wing = (c, x, y, rx, ry) => c.ellipse(x, y + dy, rx, ry, 0xc8f0e8);
      const w = blank();
      wing(w, 6 + sway, 20, 5, 6); // the back wing, big
      wing(w, 7, 28, 4, 3);
      wing(w, 25 - sway, 21, 3.5, 5); // the far wing, peeking out
      w.outline(K.lilacShade);
      for (let y = 0; y < 40; y++) for (let x = 0; x < 32; x++) if (w.get(x, y) === 0xc8f0e8) w.set(x, y, -1);
      out.fixed.see(150, () => {
        wing(out.fixed, 6 + sway, 20, 5, 6);
        wing(out.fixed, 7, 28, 4, 3);
        wing(out.fixed, 25 - sway, 21, 3.5, 5);
      });
      out.fixed.draw(w);
      out.fixed.set(5 + sway, 18 + dy, K.white);
      out.fixed.set(7 + sway, 21 + dy, K.lilac);
      return out;
    },
    icon: icon((c) => {
      c.see(170, () => {
        c.ellipse(4, 6, 4, 5, 0xc8f0e8);
        c.ellipse(12, 6, 4, 5, 0xc8f0e8);
        c.ellipse(5, 12, 3, 3, 0xc8f0e8);
        c.ellipse(11, 12, 3, 3, 0xc8f0e8);
      });
      c.outline(K.lilacShade);
      c.rect(8, 4, 1, 10, K.lilacShade);
      c.set(3, 4, K.white);
      c.set(12, 4, K.white);
      c.set(5, 7, K.lilac);
      c.set(11, 7, K.lilac);
    }),
  },
  'tail-bow': bits(
    (c, dy) => {
      bow(c, 8, 33 + dy, K.pink, K.hotPink);
      c.set(8, 35 + dy, P.gold); // bell
    },
    (c) => {
      bow(c, 8, 6, K.pink, K.hotPink);
      c.poly([[2, 3], [7, 6], [2, 10]], K.pink);
      c.poly([[14, 3], [9, 6], [14, 10]], K.pink);
      c.rect(7, 5, 2, 3, K.hotPink);
      c.circle(8, 11.5, 2, P.gold);
      c.outline(P.line);
      c.set(7, 11, K.glow);
    },
  ),
};

// Tights and stockings: color over both legs. stripe(y, top) can return
// another color for a row (or null). iconDetail adds pattern to the picture.
function legwear(color, shade, stripe, iconDetail) {
  return {
    wear(f) {
      const out = twoSheets();
      const { legs } = f;
      for (const [x, lift, col] of [[legs.back, legs.backLift || 0, shade], [legs.front, legs.frontLift || 0, color]]) {
        const top = 33 - lift;
        for (let y = top; y < top + 7 && y < 40; y++) out.fixed.rect(x, y, 2, 1, stripe?.(y, top) ?? col);
      }
      return out;
    },
    icon: icon((c) => {
      c.rect(3, 1, 4, 13, color);
      c.rect(9, 1, 4, 13, shade);
      c.rect(3, 12, 6, 3, color);
      c.rect(9, 12, 6, 3, shade);
      iconDetail?.(c);
      c.outline(P.line);
    }),
  };
}

// ---------- what make-art.js saves ----------

// Make sure every item in src/data/wardrobe.js has a drawing (and nothing extra).
const items = [...WARDROBE.clothes, ...WARDROBE.pjs];
const missing = items.filter((item) => !ART[item.id]).map((item) => item.id);
if (missing.length) throw new Error(`tools/art/wardrobe.js has no drawing for: ${missing.join(', ')}`);
const extra = Object.keys(ART).filter((id) => !items.some((item) => item.id === id));
if (extra.length) throw new Error(`tools/art/wardrobe.js draws items that aren't in src/data/wardrobe.js: ${extra.join(', ')}`);
const noSleeves = items.filter((item) => item.sleeves && !ART[item.id].arms).map((item) => item.id);
if (noSleeves.length) throw new Error(`these have sleeves: true but no sleeve drawing: ${noSleeves.join(', ')}`);

// Character layers: wear-<id> (+ wear-<id>-arms for long sleeves).
export const WARDROBE_PARTS = {};
// Shop pictures: item-<id>.
export const WARDROBE_ITEMS = {};
for (const item of items) {
  const art = ART[item.id];
  WARDROBE_PARTS[`wear-${item.id}`] = art.wear;
  if (item.sleeves) WARDROBE_PARTS[`wear-${item.id}-arms`] = art.arms;
  WARDROBE_ITEMS[`item-${item.id}`] = art.icon;
}
