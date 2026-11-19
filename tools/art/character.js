// The player: a chibi girl with animal ears and a tail.
//
// She's split into LAYERS (separate sprite sheets stacked on top of each
// other in the game), so each part can be swapped or recolored:
//   tail, hairback, body, bottom, feet, top, bag, arms, eyes, hair, ears, head
//   (back -> front; the order lives in src/objects/CharacterLook.js)
//
// Every sheet is 5 frames wide and 2 rows tall, each frame 24x32 pixels:
//   columns: frame 0 = standing still, frames 1-4 = walk cycle
//   top row (frames 0-4):    the TINT part, drawn in gray so the game can
//                            recolor it (hair color, skin tone, eye color...)
//   bottom row (frames 5-9): the FIXED part, drawn on top and never
//                            recolored (outlines, eye shine, clothes...)
// Either row can be empty.
import { Canvas } from './canvas.js';
import { P, GRAY } from './palette.js';

export const FRAME_W = 24;
export const FRAME_H = 32;

// dy = body bob (up 1px on passing steps), sway = tail/ponytail swing.
const FRAMES = [
  { dy: 0, sway: 0, legs: { back: 9, front: 13 } }, // idle
  { dy: 0, sway: 0, legs: { back: 8, front: 14 } }, // step
  { dy: -1, sway: 1, legs: { back: 10, front: 12, frontLift: 1 } }, // pass
  { dy: 0, sway: 0, legs: { back: 14, front: 8 } }, // other step
  { dy: -1, sway: -1, legs: { back: 12, front: 10, backLift: 1 } }, // pass
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

// ---------- body (skin): legs + head + face ----------
function body(f) {
  const out = twoSheets();
  const { dy, legs } = f;

  // Legs (the back leg is a shade darker so the walk reads clearly).
  const leg = (x, lift, color) => tintedPiece(out, (c) => c.rect(x, 26 - lift, 2, 4, color), P.skinLine);
  leg(legs.back, legs.backLift || 0, SKIN.shade);
  leg(legs.front, legs.frontLift || 0, SKIN.main);

  // Head: a 12x12 square with the corners rounded off (chibi = big head).
  const insets = [2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3];
  tintedPiece(out, (c) => {
    insets.forEach((inset, row) => {
      c.rect(6 + inset, 7 + row + dy, 12 - inset * 2, 1, row === 11 ? SKIN.shade : SKIN.main);
    });
  }, P.skinLine);

  // Face (blush and mouth keep their own colors)
  out.fixed.rect(8, 16 + dy, 2, 1, P.blush);
  out.fixed.rect(15, 16 + dy, 2, 1, P.blush);
  out.fixed.set(12, 16 + dy, P.mouth);
  return out;
}

// ---------- arms (skin, in front of the clothes) ----------
function arms(f) {
  const out = twoSheets();
  const { dy } = f;
  tintedPiece(out, (c) => {
    c.rect(7, 21 + dy, 1, 3, SKIN.main);
    c.rect(16, 21 + dy, 1, 3, SKIN.main);
  }, P.skinLine);
  return out;
}

// ---------- clothes ----------
// A shirt shape: shoulders, little sleeves, body.
function shirtShape(c, dy, color, shade) {
  c.rect(9, 19 + dy, 6, 1, color);
  c.rect(8, 20 + dy, 8, 1, color);
  c.rect(9, 21 + dy, 6, 2, color);
  c.rect(14, 21 + dy, 1, 2, shade);
}

// Pants: a waist band and one leg over each of her legs.
function pantsShape(c, f, length, color, shade) {
  const { dy, legs } = f;
  c.rect(9, 23 + dy, 6, 1, color);
  c.rect(8, 24 + dy, 8, 1, color);
  c.rect(legs.back, 25 - (legs.backLift || 0), 2, length, shade);
  c.rect(legs.front, 25 - (legs.frontLift || 0), 2, length, color);
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
  out.fixed.draw(piece((c) => shirtShape(c, dy, P.shirt, P.shirtShade), P.line));
  out.fixed.set(11, 19 + dy, P.pinkShade); // a tiny pink bow at the collar
  out.fixed.set(12, 19 + dy, P.pinkShade);
  return out;
}

function skirt(f) {
  const out = twoSheets();
  const { dy } = f;
  out.tint.draw(piece((c) => {
    c.rect(9, 23 + dy, 6, 1, GRAY.main);
    c.rect(8, 24 + dy, 8, 1, GRAY.main);
    c.rect(7, 25 + dy, 10, 1, GRAY.dark);
  }, GRAY.line));
  return out;
}

function boots(f) {
  const out = twoSheets();
  eachFoot(f, (x, lift, back) =>
    out.fixed.draw(piece((c) => c.rect(x, 30 - lift, 3, 1, back ? P.shoeShade : P.shoe), P.line)),
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
      c.ellipse(12, 6 + dy, 6.5, 2, P.red);
      c.rect(7, 7 + dy, 11, 1, P.redDark);
      c.set(12, 3 + dy, P.redDark); // the little stalk on top
    }, P.line));
    out.fixed.rect(9, 5 + dy, 3, 1, 0xc0705a); // shine
    return out;
  },
  'sleep-mask'(f) {
    const out = twoSheets();
    const { dy } = f;
    // pushed up on her forehead, with sleepy eyes stitched on
    out.fixed.draw(piece((c) => {
      c.rect(6, 9 + dy, 12, 1, P.lilacDark); // the strap
      c.rect(8, 8 + dy, 8, 3, P.lilac);
    }, P.line));
    out.fixed.rect(9, 9 + dy, 2, 1, P.plum);
    out.fixed.rect(13, 9 + dy, 2, 1, P.plum);
    return out;
  },
  'striped-tee'(f) {
    const out = twoSheets();
    const { dy } = f;
    out.fixed.draw(piece((c) => shirtShape(c, dy, P.white, P.cream), P.line));
    out.fixed.rect(8, 20 + dy, 8, 1, P.pinkDark);
    out.fixed.rect(9, 22 + dy, 5, 1, P.pinkDark);
    out.fixed.set(14, 22 + dy, P.plum);
    return out;
  },
  'cloud-pajamas'(f) {
    const out = twoSheets();
    const { dy } = f;
    out.fixed.draw(piece((c) => {
      pantsShape(c, f, 4, P.lilac, P.lilacShade);
      shirtShape(c, dy, P.lilac, P.lilacShade);
    }, P.line));
    // little white clouds
    for (const [x, y] of [[10, 20], [13, 22], [9, 24], [14, 24]]) out.fixed.set(x, y + dy, P.white);
    return out;
  },
  'cargo-pants'(f) {
    const out = twoSheets();
    out.fixed.draw(piece((c) => pantsShape(c, f, 4, P.sageShade, P.sageDark), P.line));
    out.fixed.set(f.legs.front, 26 - (f.legs.frontLift || 0), P.sageDark); // pocket
    return out;
  },
  'fuzzy-socks'(f) {
    const out = twoSheets();
    eachFoot(f, (x, lift, back) =>
      out.fixed.draw(piece((c) => {
        c.rect(x, 28 - lift, 3, 3, back ? P.pinkShade : P.pink);
        c.rect(x, 28 - lift, 3, 1, P.white); // fluffy cuff
      }, P.line)),
    );
    return out;
  },
  'bunny-slippers'(f) {
    const out = twoSheets();
    eachFoot(f, (x, lift, back) =>
      out.fixed.draw(piece((c) => {
        c.rect(x, 29 - lift, 4, 2, back ? P.cream : P.white);
        c.set(x + 2, 28 - lift, back ? P.cream : P.white); // ear
      }, P.line)),
    );
    eachFoot(f, (x, lift) => out.fixed.set(x + 3, 29 - lift, P.pinkShade)); // nose
    return out;
  },
  'canvas-tote'(f) {
    const out = twoSheets();
    const { dy } = f;
    out.fixed.line(10, 19 + dy, 15, 23 + dy, P.woodLight); // strap over her shoulder
    out.fixed.draw(piece((c) => c.rect(14, 22 + dy, 5, 5, P.cream), P.line));
    out.fixed.set(16, 24 + dy, P.leaf); // a little leaf print
    out.fixed.set(17, 23 + dy, P.leafLight);
    return out;
  },
};

// ---------- eyes ----------
// Two eyes, 2px wide, at x = 9 and x = 14. The iris is gray (tinted with
// the eye color); lashes and shine are fixed. `side` is -1 for her left
// eye and 1 for her right, for lash flicks that point outward.
function eyePair(f, drawEye) {
  const out = twoSheets();
  for (const x of [9, 14]) drawEye(out, x, f.dy, x === 9 ? -1 : 1);
  return out;
}

const EYES = {
  round: (f) =>
    eyePair(f, ({ tint, fixed }, x, dy) => {
      fixed.rect(x, 12 + dy, 2, 1, P.lash);
      fixed.set(x, 13 + dy, P.shine);
      tint.set(x + 1, 13 + dy, GRAY.dark);
      tint.rect(x, 14 + dy, 2, 1, GRAY.dark);
      tint.rect(x, 15 + dy, 2, 1, GRAY.light);
    }),
  sparkle: (f) =>
    eyePair(f, ({ tint, fixed }, x, dy, side) => {
      fixed.rect(x, 11 + dy, 2, 1, P.lash);
      fixed.set(side < 0 ? x - 1 : x + 2, 11 + dy, P.lash); // lash flick
      tint.rect(x, 12 + dy, 2, 3, GRAY.dark);
      tint.rect(x, 15 + dy, 2, 1, GRAY.light);
      fixed.set(x, 12 + dy, P.shine);
      fixed.set(x + 1, 14 + dy, P.shine);
    }),
  almond: (f) =>
    eyePair(f, ({ tint, fixed }, x, dy, side) => {
      fixed.rect(x, 13 + dy, 2, 1, P.lash);
      fixed.set(side < 0 ? x - 1 : x + 2, 12 + dy, P.lash); // winged tip
      tint.rect(x, 14 + dy, 2, 1, GRAY.dark);
      tint.set(side < 0 ? x : x + 1, 15 + dy, GRAY.light);
    }),
  sleepy: (f) =>
    eyePair(f, ({ tint, fixed }, x, dy) => {
      fixed.rect(x - 1, 13 + dy, 3, 1, P.lash); // heavy lid, with a little lash flick
      tint.rect(x, 14 + dy, 2, 1, GRAY.dark);
      tint.rect(x, 15 + dy, 2, 1, GRAY.light);
    }),
  happy: (f) =>
    eyePair(f, ({ fixed }, x, dy) => {
      // closed, smiling eyes: ^ ^
      fixed.set(x - 1, 14 + dy, P.lash);
      fixed.rect(x, 13 + dy, 2, 1, P.lash);
      fixed.set(x + 2, 14 + dy, P.lash);
    }),
  bead: (f) =>
    eyePair(f, ({ tint, fixed }, x, dy) => {
      tint.rect(x, 13 + dy, 2, 2, GRAY.dark);
      fixed.set(x, 13 + dy, P.shine);
    }),
};

// ---------- hair (front part, over the face) ----------
function hairCap(c, dy) {
  // Round cap over the top of the head.
  c.ellipse(11.5, 10.5 + dy, 7.2, 6, GRAY.main, (x, y) => y <= 10 + dy);
  // Bangs: uneven fringe so it looks like hair, swept toward the right.
  for (const x of [6, 7, 8, 9, 11, 12, 13, 15, 16, 17]) c.set(x, 11 + dy, GRAY.main);
  for (const x of [6, 7, 12, 17]) c.set(x, 12 + dy, GRAY.dark);
}

function hairShine(c, dy) {
  c.rect(8, 6 + dy, 4, 1, GRAY.light);
  c.set(7, 7 + dy, GRAY.light);
}

// Front hair with locks down each side, `sideLength` pixels long.
function frontHair(f, sideLength, extra) {
  const { dy } = f;
  const tint = piece((c) => {
    hairCap(c, dy);
    c.rect(5, 10 + dy, 2, sideLength, GRAY.main);
    c.rect(17, 10 + dy, 2, sideLength, GRAY.main);
    extra?.(c, dy);
  }, GRAY.line);
  hairShine(tint, dy);
  return { tint };
}

const HAIR = {
  bob: (f) =>
    frontHair(f, 7, (c, dy) => {
      c.rect(5, 16 + dy, 2, 1, GRAY.dark);
      c.rect(17, 16 + dy, 2, 1, GRAY.dark);
    }),
  long: (f) => frontHair(f, 9),
  ponytail: (f) => frontHair(f, 4),
  twintails: (f) => frontHair(f, 3),
  bun: (f) => frontHair(f, 5),
  pixie: (f) =>
    frontHair(f, 2, (c, dy) => {
      // short and choppy: little tufts at the sides
      c.set(4, 11 + dy, GRAY.dark);
      c.set(19, 11 + dy, GRAY.dark);
    }),
};

// ---------- hair (back part, behind the body) ----------
const HAIRBACK = {
  bob: () => ({ tint: blank() }),
  pixie: () => ({ tint: blank() }),
  long(f) {
    const { dy } = f;
    const tint = piece((c) => {
      // A rounded curtain of hair behind the shoulders, with a wavy hem.
      c.ellipse(11.5, 13 + dy, 7.5, 10, GRAY.dark, (x, y) => y >= 8 + dy && y <= 22 + dy);
      for (const x of [5, 8, 11, 14, 17]) c.rect(x, 23 + dy, 2, 1, GRAY.dark);
    }, GRAY.line);
    return { tint };
  },
  ponytail(f) {
    const { dy, sway } = f;
    const tint = piece((c) => {
      c.ellipse(4, 9 + dy, 1.5, 1.5, GRAY.dark); // the tie point
      c.ellipse(3 - sway * 0.5, 15 + dy, 2.4, 5.5, GRAY.main);
      c.rect(2 - Math.round(sway * 0.5), 12 + dy, 1, 4, GRAY.light);
    }, GRAY.line);
    tint.set(4, 9 + dy, GRAY.light); // hair tie highlight
    return { tint };
  },
  twintails(f) {
    const { dy, sway } = f;
    const tint = piece((c) => {
      // one tail on each side of her head
      for (const [x, s] of [[3, -1], [20, 1]]) {
        c.ellipse(x + s * 0.5, 15 + dy, 2, 6, GRAY.main);
        c.ellipse(x + s - sway * 0.5, 21 + dy, 1.5, 2, GRAY.dark);
      }
    }, GRAY.line);
    tint.set(3, 11 + dy, GRAY.light);
    tint.set(20, 11 + dy, GRAY.light);
    return { tint };
  },
  bun(f) {
    const { dy } = f;
    const tint = piece((c) => {
      c.circle(11.5, 3.5 + dy, 3, GRAY.main); // a round bun on top
      c.ellipse(11.5, 13 + dy, 7, 5, GRAY.dark, (x, y) => y >= 10 + dy);
    }, GRAY.line);
    tint.rect(10, 2 + dy, 2, 1, GRAY.light);
    return { tint };
  },
};

// ---------- ears ----------
const EARS = {
  cat(f) {
    const { dy } = f;
    const tint = piece((c) => {
      c.poly([[5, 10 + dy], [6.5, 2.5 + dy], [11, 7 + dy]], GRAY.main);
      c.poly([[13, 7 + dy], [17.5, 2.5 + dy], [19, 10 + dy]], GRAY.main);
    }, GRAY.line);
    const fixed = blank();
    fixed.poly([[6.5, 8 + dy], [7, 5 + dy], [9, 7.5 + dy]], P.pinkShade);
    fixed.poly([[15, 7.5 + dy], [17, 5 + dy], [17.5, 8 + dy]], P.pinkShade);
    return { tint, fixed };
  },
  fox(f) {
    const { dy } = f;
    const tint = piece((c) => {
      c.poly([[4.5, 10 + dy], [5.5, 0.5 + dy], [11, 7 + dy]], GRAY.main);
      c.poly([[13, 7 + dy], [18.5, 0.5 + dy], [19.5, 10 + dy]], GRAY.main);
    }, GRAY.line);
    tint.replace(GRAY.main, GRAY.dark, (x, y) => y <= 3 + dy); // darker ear tips
    const fixed = blank();
    fixed.poly([[6, 8.5 + dy], [6.5, 4 + dy], [9, 7.5 + dy]], P.cream);
    fixed.poly([[15, 7.5 + dy], [17.5, 4 + dy], [18, 8.5 + dy]], P.cream);
    return { tint, fixed };
  },
  bunny(f) {
    const { dy } = f;
    const tint = piece((c) => {
      c.ellipse(7.5, 4.5 + dy, 2, 4.5, GRAY.main);
      c.ellipse(16.5, 4.5 + dy, 2, 4.5, GRAY.main);
    }, GRAY.line);
    const fixed = blank();
    fixed.rect(7, 2 + dy, 1, 5, P.pinkShade);
    fixed.rect(16, 2 + dy, 1, 5, P.pinkShade);
    return { tint, fixed };
  },
  bear(f) {
    const { dy } = f;
    const tint = piece((c) => {
      c.circle(6.5, 6.5 + dy, 2.6, GRAY.main);
      c.circle(17.5, 6.5 + dy, 2.6, GRAY.main);
    }, GRAY.line);
    const fixed = blank();
    fixed.rect(6, 6 + dy, 2, 2, P.pinkShade);
    fixed.rect(17, 6 + dy, 2, 2, P.pinkShade);
    return { tint, fixed };
  },
  leaf(f) {
    // Leafy ears that stick out sideways, with a vein down the middle.
    const { dy } = f;
    const tint = piece((c) => {
      c.poly([[7, 9 + dy], [3, 5 + dy], [0.5, 3 + dy], [2, 8 + dy], [6, 11 + dy]], GRAY.main);
      c.poly([[17, 9 + dy], [21, 5 + dy], [23.5, 3 + dy], [22, 8 + dy], [18, 11 + dy]], GRAY.main);
    }, GRAY.line);
    tint.line(2, 5 + dy, 6, 9 + dy, GRAY.dark);
    tint.line(22, 5 + dy, 18, 9 + dy, GRAY.dark);
    return { tint };
  },
};

// ---------- tails (named after the ear type they go with) ----------
const TAIL = {
  cat(f) {
    const { dy, sway } = f;
    const tint = piece((c) => {
      const pts = [[8, 24], [5, 24], [3, 22], [2, 19], [3 + sway, 16], [5 + sway, 15]];
      for (let i = 0; i + 1 < pts.length; i++) {
        c.line(pts[i][0], pts[i][1] + dy, pts[i + 1][0], pts[i + 1][1] + dy, GRAY.main, 2);
      }
    }, GRAY.line);
    return { tint };
  },
  fox(f) {
    const { dy, sway } = f;
    const blobs = [[8, 24, 2], [5, 23, 3], [3.5, 19.5, 3.5], [3.5 + sway * 0.5, 15.5, 3], [4.5 + sway, 12.5, 2.2]];
    const tint = piece((c) => {
      for (const [x, y, r] of blobs) c.circle(x, y + dy, r, GRAY.main);
    }, GRAY.line);
    tint.replace(GRAY.main, GRAY.dark, (x, y) => x >= 5 && y >= 21 + dy); // shadow near the body
    const fixed = blank();
    const [tx, ty, tr] = blobs[4];
    fixed.circle(tx, ty + dy, tr, P.white);
    return { tint, fixed };
  },
  bunny(f) {
    const { dy } = f;
    const tint = piece((c) => c.circle(6.5, 23.5 + dy, 2.2, GRAY.light), GRAY.line); // a fluffy puff
    return { tint };
  },
  bear(f) {
    const { dy } = f;
    const tint = piece((c) => c.circle(7, 24 + dy, 1.7, GRAY.main), GRAY.line);
    return { tint };
  },
  leaf(f) {
    // A curly vine with leaves on it.
    const { dy, sway } = f;
    const tint = piece((c) => {
      c.line(8, 24 + dy, 4, 22 + dy, GRAY.dark);
      c.line(4, 22 + dy, 3 + sway, 17 + dy, GRAY.dark);
      c.ellipse(3 + sway, 15 + dy, 1.5, 2.5, GRAY.main);
      c.ellipse(5.5, 20 + dy, 1.5, 1, GRAY.main);
      c.ellipse(2, 21 + dy, 1, 1.5, GRAY.main);
    }, GRAY.line);
    return { tint };
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
