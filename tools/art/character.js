// The player: a chibi girl with animal ears and a tail.
//
// She's split into LAYERS (separate sprite sheets stacked on top of each
// other in the game), so each part can be swapped or recolored:
//   tail, hairback, body, bottom, feet, top, bag, arms, eyes, hair, ears, head
//   (back -> front; the order lives in src/objects/CharacterLook.js)
//
// Every sheet is 5 frames wide and 2 rows tall, each frame 32x40 pixels:
//   columns: frame 0 = standing still, frames 1-4 = walk cycle
//   top row (frames 0-4):    the TINT part, drawn in gray so the game can
//                            recolor it (hair color, skin tone, eye color...)
//   bottom row (frames 5-9): the FIXED part, drawn on top and never
//                            recolored (outlines, eye shine, clothes...)
// Either row can be empty.
import { Canvas } from './canvas.js';
import { P, GRAY } from './palette.js';

export const FRAME_W = 32;
export const FRAME_H = 40;

// dy = body bob (up 1px on passing steps), sway = tail/ponytail swing.
const FRAMES = [
  { dy: 0, sway: 0, legs: { back: 13, front: 17 } }, // idle
  { dy: 0, sway: 0, legs: { back: 12, front: 18 } }, // step
  { dy: -1, sway: 1, legs: { back: 14, front: 16, frontLift: 1 } }, // pass
  { dy: 0, sway: 0, legs: { back: 18, front: 12 } }, // other step
  { dy: -1, sway: -1, legs: { back: 16, front: 14, backLift: 1 } }, // pass
];

const blank = () => new Canvas(FRAME_W, FRAME_H);
const twoSheets = () => ({ tint: blank(), fixed: blank() });

// Draw one piece on its own little canvas, outline it, then paste it.
function piece(drawFn, lineColor) {
  const c = blank();
  drawFn(c);
  return c.outline(lineColor);
}

// Like piece(), but the fill goes on the TINT sheet (so it can be recolored)
// and the outline goes on the FIXED sheet (so it stays the same dark line).
// Later pieces cover earlier pieces' outlines, just like piece() does.
function tintedPiece(out, drawFn, lineColor) {
  const fill = blank();
  drawFn(fill);
  const line = blank().draw(fill).outline(lineColor);
  for (let y = 0; y < FRAME_H; y++)
    for (let x = 0; x < FRAME_W; x++) {
      if (fill.get(x, y) !== -1) {
        out.tint.set(x, y, fill.get(x, y));
        out.fixed.set(x, y, -1); // the fill hides any older outline here
      } else if (line.get(x, y) !== -1 && out.tint.get(x, y) === -1) {
        out.fixed.set(x, y, lineColor);
      }
    }
}


// Skin is drawn in these grays and tinted with the chosen skin tone.
const SKIN = { main: GRAY.light, shade: 0xdcdcdc };

// Soft outline colors (instead of near-black) keep everything gentle.
const SOFT = P.lineSoft;

// Mirror a polygon left-to-right across the middle of the frame.
const mirror = (pts) => pts.map(([x, y]) => [FRAME_W - x, y]);

// A little four-point sparkle centered on (x, y).
function sparkle(c, x, y, color, center) {
  for (const [ox, oy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) c.set(x + ox, y + oy, color);
  c.set(x, y, center ?? color);
}

// ---------- body (skin): legs + neck + big round head + face ----------
function body(f) {
  const out = twoSheets();
  const { dy, legs } = f;

  // Legs (the back leg is a shade darker so the walk reads clearly).
  const leg = (x, lift, color) => tintedPiece(out, (c) => c.rect(x, 33 - lift, 2, 5, color), P.skinLine);
  leg(legs.back, legs.backLift || 0, SKIN.shade);
  leg(legs.front, legs.frontLift || 0, SKIN.main);

  // Neck
  tintedPiece(out, (c) => c.rect(14, 25 + dy, 4, 2, SKIN.shade), P.skinLine);

  // Head: a big, soft oval (chibi = huge head) with a shaded chin.
  tintedPiece(out, (c) => {
    c.ellipse(15.5, 16.5 + dy, 10, 9, SKIN.main);
    for (let y = 24 + dy; y < 27; y++)
      for (let x = 0; x < FRAME_W; x++) if (c.get(x, y) !== -1) c.set(x, y, SKIN.shade);
  }, P.skinLine);

  // Face (blush and mouth keep their own colors)
  for (const [x, w] of [[9, 2], [21, 2]]) {
    out.fixed.rect(x, 21 + dy, w, 1, P.blush);
    out.fixed.rect(x - 1 + (x > 16 ? 1 : 0), 22 + dy, w + 1, 1, P.blush);
  }
  out.fixed.set(15, 23 + dy, P.mouth);
  out.fixed.set(16, 23 + dy, P.mouth);
  return out;
}

// ---------- arms (skin, in front of the clothes) ----------
function arms(f) {
  const out = twoSheets();
  const { dy } = f;
  tintedPiece(out, (c) => {
    c.rect(9, 29 + dy, 2, 3, SKIN.main);
    c.rect(21, 29 + dy, 2, 3, SKIN.main);
  }, P.skinLine);
  return out;
}

// ---------- clothes ----------
// A shirt shape: shoulders, little sleeves, body.
function shirtShape(c, dy, color, shade) {
  c.rect(13, 26 + dy, 6, 1, color);
  c.rect(11, 27 + dy, 10, 1, color);
  c.rect(10, 28 + dy, 12, 1, color);
  c.rect(11, 29 + dy, 10, 2, color);
  c.rect(19, 29 + dy, 2, 2, shade);
  c.rect(10, 28 + dy, 2, 1, shade);
  c.rect(20, 28 + dy, 2, 1, shade);
}

// Pants: a waist band and one leg over each of her legs.
function pantsShape(c, f, length, color, shade) {
  const { dy, legs } = f;
  c.rect(11, 31 + dy, 10, 1, color);
  c.rect(10, 32 + dy, 12, 1, color);
  c.rect(legs.back, 33 - (legs.backLift || 0), 2, length, shade);
  c.rect(legs.front, 33 - (legs.frontLift || 0), 2, length, color);
}

// Shoes / socks / slippers: fn(x, lift, isBackFoot) for each foot.
function eachFoot(f, fn) {
  const { legs } = f;
  fn(legs.back, legs.backLift || 0, true);
  fn(legs.front, legs.frontLift || 0, false);
}

// The clothes you start with. The skirt's color is picked in the
// character creator (so it's tinted); the blouse and boots are not.
function blouse(f) {
  const out = twoSheets();
  const { dy } = f;
  out.fixed.draw(piece((c) => shirtShape(c, dy, P.shirt, P.shirtShade), SOFT));
  // a pink sailor bow at the collar
  out.fixed.rect(14, 27 + dy, 4, 1, P.pink);
  out.fixed.rect(15, 28 + dy, 2, 1, P.pinkShade);
  out.fixed.set(14, 29 + dy, P.pinkShade);
  out.fixed.set(17, 29 + dy, P.pinkShade);
  return out;
}

function skirt(f) {
  const out = twoSheets();
  const { dy } = f;
  out.tint.draw(piece((c) => {
    c.rect(11, 31 + dy, 10, 1, GRAY.main);
    c.rect(10, 32 + dy, 12, 1, GRAY.main);
    c.rect(9, 33 + dy, 14, 1, GRAY.dark);
  }, GRAY.line));
  return out;
}

function boots(f) {
  const out = twoSheets();
  eachFoot(f, (x, lift, back) =>
    out.fixed.draw(piece((c) => c.rect(x, 38 - lift, 3, 2, back ? P.shoeShade : P.shoe), SOFT)),
  );
  return out;
}

// Things you can buy and wear. The names match the item ids in
// SHOP_STOCK (src/config.js), and each item there says which body
// slot it goes on with `wear: 'head' | 'top' | 'bottom' | 'feet' | 'bag'`.
const WEAR = {
  beret(f) {
    const out = twoSheets();
    const { dy } = f;
    out.fixed.draw(piece((c) => {
      c.ellipse(15.5, 6 + dy, 10, 3, P.red);
      c.rect(7, 8 + dy, 18, 1, P.redDark);
      c.rect(15, 2 + dy, 2, 2, P.redDark); // the little stalk on top
    }, SOFT));
    out.fixed.rect(10, 5 + dy, 5, 1, 0xc0705a); // shine
    return out;
  },
  'sleep-mask'(f) {
    const out = twoSheets();
    const { dy } = f;
    // pushed up on her forehead, with sleepy eyes stitched on
    out.fixed.draw(piece((c) => {
      c.rect(5, 10 + dy, 22, 1, P.lilacDark); // the strap
      c.rect(10, 8 + dy, 12, 5, P.lilac);
      c.rect(10, 12 + dy, 12, 1, P.lilacShade);
    }, SOFT));
    out.fixed.rect(11, 10 + dy, 3, 1, P.plum);
    out.fixed.rect(18, 10 + dy, 3, 1, P.plum);
    return out;
  },
  'striped-tee'(f) {
    const out = twoSheets();
    const { dy } = f;
    out.fixed.draw(piece((c) => shirtShape(c, dy, P.white, P.cream), SOFT));
    out.fixed.rect(10, 28 + dy, 12, 1, 0x3c4a6e);
    out.fixed.rect(11, 30 + dy, 10, 1, 0x3c4a6e);
    return out;
  },
  'cloud-pajamas'(f) {
    const out = twoSheets();
    const { dy } = f;
    out.fixed.draw(piece((c) => {
      pantsShape(c, f, 5, 0xa8c4e6, 0x7f9fc8);
      shirtShape(c, dy, 0xa8c4e6, 0x7f9fc8);
    }, SOFT));
    // little white clouds
    for (const [x, y] of [[13, 28], [17, 30], [12, 32], [19, 32]]) {
      out.fixed.rect(x, y + dy, 2, 1, P.white);
      out.fixed.set(x, y - 1 + dy, P.white);
    }
    return out;
  },
  'cargo-pants'(f) {
    const out = twoSheets();
    out.fixed.draw(piece((c) => pantsShape(c, f, 5, 0x8f8a5a, 0x6a6640), SOFT));
    out.fixed.rect(f.legs.front, 34 - (f.legs.frontLift || 0), 2, 2, 0x6a6640); // pocket
    out.fixed.set(15, 31 + f.dy, P.gold); // button
    return out;
  },
  'fuzzy-socks'(f) {
    const out = twoSheets();
    eachFoot(f, (x, lift, back) =>
      out.fixed.draw(piece((c) => {
        c.rect(x, 36 - lift, 3, 4, back ? P.pinkShade : P.pink);
        c.rect(x, 36 - lift, 3, 1, P.white); // fluffy cuff
      }, SOFT)),
    );
    return out;
  },
  'bunny-slippers'(f) {
    const out = twoSheets();
    eachFoot(f, (x, lift, back) =>
      out.fixed.draw(piece((c) => {
        c.rect(x, 37 - lift, 4, 3, back ? P.cream : P.white);
        c.rect(x + 1, 35 - lift, 1, 2, back ? P.cream : P.white); // ear
        c.rect(x + 2, 35 - lift, 1, 2, back ? P.cream : P.white);
      }, SOFT)),
    );
    eachFoot(f, (x, lift) => out.fixed.set(x + 3, 38 - lift, P.pinkShade)); // nose
    return out;
  },
  'canvas-tote'(f) {
    const out = twoSheets();
    const { dy } = f;
    out.fixed.line(13, 28 + dy, 20, 33 + dy, P.woodLight); // strap over her shoulder
    out.fixed.draw(piece((c) => c.rect(19, 31 + dy, 6, 6, P.cream), SOFT));
    out.fixed.set(21, 33 + dy, P.leaf); // a little leaf print
    out.fixed.set(22, 32 + dy, P.leafLight);
    out.fixed.set(22, 33 + dy, P.leaf);
    return out;
  },
};

// ---------- eyes ----------
// Two big shiny eyes, 4px wide, at x = 9 and x = 19. The iris is gray (tinted
// with the eye color); lashes and shine are fixed. `side` is -1 for her left
// eye and 1 for her right, for lash flicks that point outward.
function eyePair(f, drawEye) {
  const out = twoSheets();
  for (const x of [9, 19]) drawEye(out, x, f.dy, x === 9 ? -1 : 1);
  return out;
}

const EYES = {
  round: (f) =>
    eyePair(f, ({ tint, fixed }, x, dy) => {
      fixed.rect(x, 18 + dy, 4, 1, P.lash);
      tint.rect(x, 19 + dy, 4, 2, GRAY.dark);
      tint.rect(x, 21 + dy, 4, 1, GRAY.main);
      tint.rect(x + 1, 22 + dy, 2, 1, GRAY.light);
      fixed.rect(x, 19 + dy, 2, 2, P.shine);
      fixed.set(x + 3, 21 + dy, P.shine);
    }),
  sparkle: (f) =>
    eyePair(f, ({ tint, fixed }, x, dy, side) => {
      fixed.rect(x, 17 + dy, 4, 1, P.lash);
      fixed.set(side < 0 ? x - 1 : x + 4, 17 + dy, P.lash); // lash flick
      tint.rect(x, 18 + dy, 4, 3, GRAY.dark);
      tint.rect(x, 21 + dy, 4, 1, GRAY.main);
      tint.rect(x + 1, 22 + dy, 2, 1, GRAY.light);
      fixed.rect(x, 18 + dy, 2, 2, P.shine);
      fixed.set(x + 3, 20 + dy, P.shine);
      fixed.set(x + 2, 21 + dy, P.shine);
    }),
  almond: (f) =>
    eyePair(f, ({ tint, fixed }, x, dy, side) => {
      fixed.rect(x, 19 + dy, 4, 1, P.lash);
      fixed.set(side < 0 ? x - 1 : x + 4, 18 + dy, P.lash); // winged tip
      tint.rect(x, 20 + dy, 4, 2, GRAY.dark);
      tint.rect(x + 1, 22 + dy, 2, 1, GRAY.light);
      fixed.set(x + 1, 20 + dy, P.shine);
    }),
  sleepy: (f) =>
    eyePair(f, ({ tint, fixed }, x, dy, side) => {
      fixed.rect(x - 1, 19 + dy, 6, 1, P.lash); // heavy lid
      fixed.set(side < 0 ? x - 2 : x + 5, 20 + dy, P.lash);
      tint.rect(x, 20 + dy, 4, 2, GRAY.dark);
      tint.rect(x + 1, 22 + dy, 2, 1, GRAY.light);
      fixed.set(x, 20 + dy, P.shine);
    }),
  happy: (f) =>
    eyePair(f, ({ fixed }, x, dy) => {
      // closed, smiling eyes: ^ ^
      fixed.set(x - 1, 21 + dy, P.lash);
      fixed.set(x, 20 + dy, P.lash);
      fixed.rect(x + 1, 19 + dy, 2, 1, P.lash);
      fixed.set(x + 3, 20 + dy, P.lash);
      fixed.set(x + 4, 21 + dy, P.lash);
    }),
  bead: (f) =>
    eyePair(f, ({ tint, fixed }, x, dy) => {
      tint.rect(x + 1, 19 + dy, 3, 3, GRAY.dark);
      tint.rect(x, 20 + dy, 5, 1, GRAY.dark);
      fixed.set(x + 1, 19 + dy, P.shine);
    }),
};

// ---------- hair (front part, over the face) ----------
function hairCap(c, dy) {
  // A big round cap over the top of the head. The fringe is parted in the
  // middle and sweeps down toward the sides, so it curves like real bangs.
  const hairline = (x) => 13 + dy + Math.round((3 * Math.abs(x - 15.5)) / 10);
  c.ellipse(15.5, 14 + dy, 11.5, 9.5, GRAY.main, (x, y) => y <= hairline(x));
  // two curtain-bang locks either side of the part
  for (const [x, y] of [[13, 15], [13, 16], [18, 15], [18, 16]]) c.set(x, y + dy, GRAY.main);
  // ahoge: one whimsical curl sticking up
  c.rect(15, 3 + dy, 1, 3, GRAY.main);
  c.rect(16, 2 + dy, 2, 1, GRAY.main);
  c.set(18, 3 + dy, GRAY.main);
}

function hairShine(c, dy) {
  c.rect(10, 7 + dy, 7, 1, GRAY.light);
  c.rect(8, 8 + dy, 2, 1, GRAY.light);
  c.rect(17, 8 + dy, 2, 1, GRAY.light);
  c.set(7, 9 + dy, GRAY.light);
}

// Front hair with locks down each side, `sideLength` pixels long.
function frontHair(f, sideLength, extra) {
  const { dy } = f;
  const tint = piece((c) => {
    hairCap(c, dy);
    for (const side of [-1, 1]) {
      // each side lock starts wide at the temple and tapers to a soft point
      for (let i = 0; i < sideLength; i++) {
        const w = i < sideLength - 2 ? 3 : i < sideLength - 1 ? 2 : 1;
        const edge = side < 0 ? 4 : 28 - w; // outer edge sits at x=4 (left) / x=27 (right)
        c.rect(edge + (side < 0 ? Math.floor((3 - w) / 2) : 0), 14 + i + dy, w, 1, i > sideLength / 2 ? GRAY.dark : GRAY.main);
      }
    }
    extra?.(c, dy);
  }, GRAY.line);
  hairShine(tint, dy);
  // a tiny star hair pin (it keeps its own colors)
  const fixed = blank();
  sparkle(fixed, 22, 12 + dy, P.white, P.glow);
  return { tint, fixed };
}

const HAIR = {
  bob: (f) => frontHair(f, 9),
  long: (f) => frontHair(f, 12),
  ponytail: (f) => frontHair(f, 6),
  twintails: (f) => frontHair(f, 5),
  bun: (f) => frontHair(f, 7),
  pixie: (f) =>
    frontHair(f, 3, (c, dy) => {
      // short and choppy: little tufts at the sides
      c.set(3, 16 + dy, GRAY.dark);
      c.set(28, 16 + dy, GRAY.dark);
    }),
};

// ---------- hair (back part, behind the body) ----------
const HAIRBACK = {
  bob(f) {
    const { dy } = f;
    // a soft rounded bob swinging behind the cheeks
    const tint = piece((c) => c.ellipse(15.5, 17 + dy, 11.5, 9, GRAY.dark, (x, y) => y >= 12 + dy), GRAY.line);
    return { tint };
  },
  pixie: () => ({ tint: blank() }),
  long(f) {
    const { dy } = f;
    const tint = piece((c) => {
      // A long curtain of hair behind the shoulders, with a wavy hem.
      c.ellipse(15.5, 23 + dy, 12, 13, GRAY.dark, (x, y) => y >= 10 + dy && y <= 34 + dy);
      for (const x of [5, 9, 13, 17, 21, 25]) c.rect(x, 35 + dy, 3, 1, GRAY.dark);
      for (const x of [9, 15, 22]) c.rect(x, 20 + dy, 1, 12, GRAY.main); // strands
    }, GRAY.line);
    return { tint };
  },
  ponytail(f) {
    const { dy, sway } = f;
    const tint = piece((c) => {
      c.ellipse(5, 12 + dy, 2, 2, GRAY.dark); // the tie point
      c.ellipse(3.5 - sway * 0.5, 21 + dy, 3, 8, GRAY.main);
      c.rect(2 - Math.round(sway * 0.5), 16 + dy, 1, 6, GRAY.light);
      c.ellipse(3.5 - sway, 28 + dy, 2, 2, GRAY.dark);
    }, GRAY.line);
    const fixed = blank();
    fixed.rect(4, 11 + dy, 3, 2, P.pink); // a hair ribbon
    fixed.set(3, 12 + dy, P.pinkShade);
    return { tint, fixed };
  },
  twintails(f) {
    const { dy, sway } = f;
    const tint = piece((c) => {
      // one long tail on each side of her head
      for (const [x, s] of [[3, -1], [28, 1]]) {
        c.ellipse(x + s * 0.5, 21 + dy, 2.4, 7.5, GRAY.main);
        c.ellipse(x + s * 0.5 + s * sway * 0.5, 28 + dy, 1.8, 3, GRAY.dark);
        c.rect(x + (s < 0 ? -1 : 0), 15 + dy, 1, 8, GRAY.light);
      }
    }, GRAY.line);
    const fixed = blank();
    for (const x of [2, 28]) {
      fixed.rect(x, 12 + dy, 2, 2, P.pink); // ribbons
      fixed.set(x + (x < 10 ? -1 : 2), 13 + dy, P.pinkShade);
    }
    return { tint, fixed };
  },
  bun(f) {
    const { dy } = f;
    const tint = piece((c) => {
      c.circle(15.5, 4.5 + dy, 4, GRAY.main); // a round bun on top
      c.ellipse(15.5, 15 + dy, 11, 8, GRAY.dark, (x, y) => y >= 11 + dy);
    }, GRAY.line);
    tint.rect(13, 2 + dy, 3, 1, GRAY.light);
    const fixed = blank();
    fixed.rect(13, 8 + dy, 5, 1, P.pink); // bun ribbon
    return { tint, fixed };
  },
};

// ---------- ears ----------
const EARS = {
  cat(f) {
    const { dy } = f;
    const left = [[5, 11 + dy], [6, 1.5 + dy], [13, 7 + dy]];
    const tint = piece((c) => {
      c.poly(left, GRAY.main);
      c.poly(mirror(left), GRAY.main);
    }, GRAY.line);
    const fixed = blank();
    const inner = [[7.5, 8.5 + dy], [7.5, 4.5 + dy], [11, 7 + dy]];
    fixed.poly(inner, P.pinkShade);
    fixed.poly(mirror(inner), P.pinkShade);
    return { tint, fixed };
  },
  fox(f) {
    const { dy } = f;
    const left = [[4.5, 11 + dy], [5.5, 0 + dy], [13, 7 + dy]];
    const tint = piece((c) => {
      c.poly(left, GRAY.main);
      c.poly(mirror(left), GRAY.main);
    }, GRAY.line);
    tint.replace(GRAY.main, GRAY.dark, (x, y) => y <= 3 + dy); // darker ear tips
    const fixed = blank();
    const inner = [[7, 9 + dy], [6.8, 4 + dy], [10.5, 7.2 + dy]];
    fixed.poly(inner, P.cream);
    fixed.poly(mirror(inner), P.cream);
    return { tint, fixed };
  },
  bunny(f) {
    const { dy } = f;
    const tint = piece((c) => {
      c.ellipse(10.5, 4.5 + dy, 2.7, 5, GRAY.main);
      c.ellipse(20.5, 4.5 + dy, 2.7, 5, GRAY.main);
    }, GRAY.line);
    const fixed = blank();
    fixed.ellipse(10.5, 5 + dy, 1, 3.2, P.pinkShade);
    fixed.ellipse(20.5, 5 + dy, 1, 3.2, P.pinkShade);
    return { tint, fixed };
  },
  bear(f) {
    const { dy } = f;
    const tint = piece((c) => {
      c.circle(8.5, 6.5 + dy, 3.4, GRAY.main);
      c.circle(22.5, 6.5 + dy, 3.4, GRAY.main);
    }, GRAY.line);
    const fixed = blank();
    fixed.circle(8.5, 7 + dy, 1.6, P.pinkShade);
    fixed.circle(22.5, 7 + dy, 1.6, P.pinkShade);
    return { tint, fixed };
  },
  wolf(f) {
    // Big, tall, thick-furred ears with dark tips, plus fluffy cheek tufts.
    const { dy } = f;
    const left = [[4, 12 + dy], [4, 4 + dy], [6.5, 0 + dy], [9, 0.5 + dy], [13.5, 7.5 + dy]];
    const cheek = [[5, 18 + dy], [1.5, 24 + dy], [4, 24 + dy], [6, 23 + dy]];
    const tint = piece((c) => {
      for (const pts of [left, mirror(left)]) c.poly(pts, GRAY.main);
      for (const pts of [cheek, mirror(cheek)]) c.poly(pts, GRAY.light);
    }, GRAY.line);
    tint.replace(GRAY.main, GRAY.dark, (x, y) => y <= 3 + dy); // dark tips
    const fixed = blank();
    const inner = [[6.5, 10.5 + dy], [6.5, 5.5 + dy], [8, 3 + dy], [11, 7.5 + dy]];
    for (const pts of [inner, mirror(inner)]) fixed.poly(pts, P.cream);
    for (const [x, y] of [[10, 9], [8, 11], [11, 8]]) {
      fixed.set(x, y + dy, P.creamShade); // shaggy fur in the ear
      fixed.set(FRAME_W - 1 - x, y + dy, P.creamShade);
    }
    return { tint, fixed };
  },
};

// ---------- tails (named after the ear type they go with) ----------
const TAIL = {
  cat(f) {
    const { dy, sway } = f;
    const tint = piece((c) => {
      const pts = [[11, 34], [7, 34], [4, 31], [3, 27], [4 + sway, 23], [6 + sway, 22]];
      for (let i = 0; i + 1 < pts.length; i++) {
        c.line(pts[i][0], pts[i][1] + dy, pts[i + 1][0], pts[i + 1][1] + dy, GRAY.main, 3);
      }
    }, GRAY.line);
    return { tint };
  },
  fox(f) {
    const { dy, sway } = f;
    const blobs = [[10, 34, 2.5], [6.5, 33, 3.5], [4.5, 29, 4], [4.5 + sway * 0.5, 24, 3.5], [5.5 + sway, 20.5, 2.6]];
    const tint = piece((c) => {
      for (const [x, y, r] of blobs) c.circle(x, y + dy, r, GRAY.main);
    }, GRAY.line);
    tint.replace(GRAY.main, GRAY.dark, (x, y) => x >= 7 && y >= 31 + dy); // shadow near the body
    const fixed = blank();
    const [tx, ty, tr] = blobs[4];
    fixed.circle(tx, ty + dy, tr, P.white);
    return { tint, fixed };
  },
  bunny(f) {
    const { dy } = f;
    const tint = piece((c) => c.circle(8.5, 33.5 + dy, 3, GRAY.light), GRAY.line); // a fluffy puff
    return { tint };
  },
  bear(f) {
    const { dy } = f;
    const tint = piece((c) => c.circle(9.5, 34 + dy, 2.3, GRAY.main), GRAY.line);
    return { tint };
  },
  wolf(f) {
    // A big bushy tail hanging down behind her legs.
    const { dy, sway } = f;
    const blobs = [[10, 31, 2.6], [8, 33, 3.4], [6.5 + sway * 0.5, 35.5, 3.6], [6 + sway * 0.7, 37.5, 2.6]];
    const tint = piece((c) => {
      for (const [x, y, r] of blobs) c.circle(x, y + dy, r, GRAY.main);
    }, GRAY.line);
    tint.replace(GRAY.main, GRAY.dark, (x, y) => y <= 33 + dy && x >= 9); // darker along the top
    const fixed = blank();
    const [tx, ty, tr] = blobs[3];
    fixed.circle(tx, ty + dy, tr - 0.3, P.cream); // pale tip
    return { tint, fixed };
  },
};

// Every sheet the game loads: name -> function(frame) -> { tint?, fixed? }
const named = (prefix, parts) => Object.fromEntries(Object.entries(parts).map(([k, fn]) => [`${prefix}-${k}`, fn]));

export const CHARACTER_PARTS = {
  'player-body': body,
  'player-arms': arms,
  'player-top-blouse': blouse,
  'player-bottom-skirt': skirt,
  'player-feet-boots': boots,
  ...named('player-eyes', EYES),
  ...named('player-hair', HAIR),
  ...named('player-hairback', HAIRBACK),
  ...named('player-ears', EARS),
  ...named('player-tail', TAIL),
  ...named('wear', WEAR),
};

export { FRAMES };
