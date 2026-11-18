// The player: a chibi girl with animal ears and a tail.
//
// She's split into LAYERS (separate sprite sheets stacked on top of each
// other in the game), so each part can be swapped or recolored:
//   tail, hairback, body, outfit, arms, eyes, hair, ears   (back -> front)
//
// Every sheet has 5 frames, each 24x32 pixels:
//   frame 0 = standing still, frames 1-4 = walk cycle.
//
// Hair, ears, tail and eye color are drawn in GRAY so the game can tint
// them any color. Bits that must keep their own color (white eye shine,
// pink inner ear, white fox-tail tip) go in a separate "-fixed" sheet.
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

// Draw one piece on its own little canvas, outline it, then paste it.
function piece(drawFn, lineColor) {
  const c = blank();
  drawFn(c);
  return c.outline(lineColor);
}

// ---------- body (skin): legs + head + face ----------
function body(f) {
  const out = blank();
  const { dy, legs } = f;

  // Legs (the back leg is a shade darker so the walk reads clearly).
  const leg = (x, lift, color) =>
    piece((c) => c.rect(x, 26 - lift, 2, 4, color), P.skinLine);
  out.draw(leg(legs.back, legs.backLift || 0, P.skinShade));
  out.draw(leg(legs.front, legs.frontLift || 0, P.skin));

  // Head: a 12x12 square with the corners rounded off (chibi = big head).
  const insets = [2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3];
  const head = piece((c) => {
    insets.forEach((inset, row) => {
      const color = row === 11 ? P.skinShade : P.skin;
      c.rect(6 + inset, 7 + row + dy, 12 - inset * 2, 1, color);
    });
  }, P.skinLine);
  out.draw(head);

  // Face
  out.rect(8, 16 + dy, 2, 1, P.blush);
  out.rect(15, 16 + dy, 2, 1, P.blush);
  out.set(12, 16 + dy, P.mouth);
  return { tint: out };
}

// ---------- arms (skin, in front of the outfit) ----------
function arms(f) {
  const { dy } = f;
  const out = piece((c) => {
    c.rect(7, 21 + dy, 1, 3, P.skin);
    c.rect(16, 21 + dy, 1, 3, P.skin);
  }, P.skinLine);
  return { tint: out };
}

// ---------- outfit: shirt, skirt, shoes ----------
function outfit(f) {
  const out = blank();
  const { dy, legs } = f;

  const shoe = (x, lift, color) => piece((c) => c.rect(x, 30 - lift, 3, 1, color), P.line);
  out.draw(shoe(legs.back, legs.backLift || 0, P.shoeShade));
  out.draw(shoe(legs.front, legs.frontLift || 0, P.shoe));

  const top = piece((c) => {
    // shirt
    c.rect(9, 19 + dy, 6, 1, P.shirt);
    c.rect(8, 20 + dy, 8, 1, P.shirt); // little sleeves
    c.rect(9, 21 + dy, 6, 2, P.shirt);
    c.rect(14, 21 + dy, 1, 2, P.shirtShade);
    // skirt (flares out)
    c.rect(9, 23 + dy, 6, 1, P.skirt);
    c.rect(8, 24 + dy, 8, 1, P.skirt);
    c.rect(7, 25 + dy, 10, 1, P.skirtShade);
  }, P.line);
  out.draw(top);
  // a tiny pink bow at the collar
  out.set(11, 19 + dy, P.pinkShade);
  out.set(12, 19 + dy, P.pinkShade);
  return { tint: out };
}

// ---------- eyes ----------
const EYES = {
  round(f) {
    const tint = blank();
    const fixed = blank();
    const { dy } = f;
    for (const x of [9, 14]) {
      fixed.rect(x, 12 + dy, 2, 1, P.lash);
      fixed.set(x, 13 + dy, P.shine);
      tint.set(x + 1, 13 + dy, GRAY.dark);
      tint.rect(x, 14 + dy, 2, 1, GRAY.dark);
      tint.rect(x, 15 + dy, 2, 1, GRAY.light);
    }
    return { tint, fixed };
  },
  sleepy(f) {
    const tint = blank();
    const fixed = blank();
    const { dy } = f;
    for (const x of [9, 14]) {
      fixed.rect(x - 1, 13 + dy, 3, 1, P.lash); // heavy lid, with a little lash flick
      tint.rect(x, 14 + dy, 2, 1, GRAY.dark);
      tint.rect(x, 15 + dy, 2, 1, GRAY.light);
    }
    return { tint, fixed };
  },
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

const HAIR = {
  bob(f) {
    const { dy } = f;
    const tint = piece((c) => {
      hairCap(c, dy);
      c.rect(5, 10 + dy, 2, 7, GRAY.main);
      c.rect(17, 10 + dy, 2, 7, GRAY.main);
      c.rect(5, 16 + dy, 2, 1, GRAY.dark);
      c.rect(17, 16 + dy, 2, 1, GRAY.dark);
    }, GRAY.line);
    hairShine(tint, dy);
    return { tint };
  },
  long(f) {
    const { dy } = f;
    const tint = piece((c) => {
      hairCap(c, dy);
      c.rect(5, 10 + dy, 2, 9, GRAY.main);
      c.rect(17, 10 + dy, 2, 9, GRAY.main);
    }, GRAY.line);
    hairShine(tint, dy);
    return { tint };
  },
  ponytail(f) {
    const { dy } = f;
    const tint = piece((c) => {
      hairCap(c, dy);
      c.rect(5, 10 + dy, 2, 4, GRAY.main);
      c.rect(17, 10 + dy, 2, 4, GRAY.main);
    }, GRAY.line);
    hairShine(tint, dy);
    return { tint };
  },
};

// ---------- hair (back part, behind the body) ----------
const HAIRBACK = {
  bob: () => ({ tint: blank() }),
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
};

// ---------- ears ----------
const EARS = {
  cat(f) {
    const { dy } = f;
    const left = [[5, 10 + dy], [6.5, 2.5 + dy], [11, 7 + dy]];
    const right = [[13, 7 + dy], [17.5, 2.5 + dy], [19, 10 + dy]];
    const tint = piece((c) => {
      c.poly(left, GRAY.main);
      c.poly(right, GRAY.main);
    }, GRAY.line);
    const fixed = blank();
    fixed.poly([[6.5, 8 + dy], [7, 5 + dy], [9, 7.5 + dy]], P.pinkShade);
    fixed.poly([[15, 7.5 + dy], [17, 5 + dy], [17.5, 8 + dy]], P.pinkShade);
    return { tint, fixed };
  },
  fox(f) {
    const { dy } = f;
    const left = [[4.5, 10 + dy], [5.5, 0.5 + dy], [11, 7 + dy]];
    const right = [[13, 7 + dy], [18.5, 0.5 + dy], [19.5, 10 + dy]];
    const tint = piece((c) => {
      c.poly(left, GRAY.main);
      c.poly(right, GRAY.main);
    }, GRAY.line);
    // darker ear tips
    tint.replace(GRAY.main, GRAY.dark, (x, y) => y <= 3 + dy);
    const fixed = blank();
    fixed.poly([[6, 8.5 + dy], [6.5, 4 + dy], [9, 7.5 + dy]], P.cream);
    fixed.poly([[15, 7.5 + dy], [17.5, 4 + dy], [18, 8.5 + dy]], P.cream);
    return { tint, fixed };
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
};

// Every sheet the game loads: name -> function(frame) -> { tint, fixed? }
export const CHARACTER_PARTS = {
  'player-body': body,
  'player-arms': arms,
  'player-outfit-basic': outfit,
  ...Object.fromEntries(Object.entries(EYES).map(([k, fn]) => [`player-eyes-${k}`, fn])),
  ...Object.fromEntries(Object.entries(HAIR).map(([k, fn]) => [`player-hair-${k}`, fn])),
  ...Object.fromEntries(Object.entries(HAIRBACK).map(([k, fn]) => [`player-hairback-${k}`, fn])),
  ...Object.fromEntries(Object.entries(EARS).map(([k, fn]) => [`player-ears-${k}`, fn])),
  ...Object.fromEntries(Object.entries(TAIL).map(([k, fn]) => [`player-tail-${k}`, fn])),
};

export { FRAMES };
