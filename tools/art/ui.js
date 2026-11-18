// Little on-screen (HUD) pieces: the coin and the wooden coin sign.
import { Canvas, sheet } from './canvas.js';
import { P } from './palette.js';

// Each frame of the coin sheet is this big.
export const COIN_SIZE = 14;

// The coin's face: a gold coin with a paw print pressed into it.
// Drawn without an outline so it can be squished for the spin frames.
function coinFace() {
  const c = new Canvas(COIN_SIZE, COIN_SIZE);
  c.circle(6.5, 6.5, 5.5, P.coinShade); // rim (and the shaded lower-right edge)
  c.circle(6.1, 6.1, 4.6, P.gold); // face
  // shine in the top-left
  c.set(4, 3, P.coinLight);
  c.set(3, 4, P.coinLight);
  c.set(5, 2, P.coinLight);
  // the paw print: four toes and a bean-shaped pad
  for (const x of [5, 8]) c.rect(x, 3, 1, 2, P.coinShade);
  for (const x of [3, 10]) c.rect(x, 5, 1, 2, P.coinShade);
  c.rect(6, 6, 2, 1, P.coinShade);
  c.rect(5, 7, 4, 2, P.coinShade);
  return c;
}

// Squish a canvas sideways around its center (k = 1 is normal, 0.5 is half as wide).
function squish(src, k) {
  const out = new Canvas(src.w, src.h);
  const cx = (src.w - 1) / 2;
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const sx = Math.round(cx + (x - cx) / k);
      const col = src.get(sx, y);
      if (col !== -1) out.set(x, y, col);
    }
  return out;
}

// 4 frames: face, turning, edge-on, turning back. Played in a loop it spins.
function coin() {
  const face = coinFace();
  const edge = new Canvas(COIN_SIZE, COIN_SIZE);
  edge.rect(6, 1, 2, 12, P.coinShade);
  edge.rect(6, 2, 1, 9, P.coinLight);
  return sheet([face, squish(face, 0.6), edge, squish(face, 0.6)].map((f) => f.outline(P.line)));
}

// ---------- panels ----------
// Framed panels for the coin counter now, and shop menus later.
// The game stretches them to any size with Phaser's NineSlice: the four
// PANEL_SLICE x PANEL_SLICE corners stay exactly as drawn (that's where the
// vines and flowers live), the edges stretch along one direction, and the
// middle fills the rest. So keep the edges and middle plain.
export const PANEL_SIZE = 36;
export const PANEL_SLICE = 12;
const MARGIN = 3; // empty space around the panel so leaves can poke out

// Mirror a canvas left-right and/or top-bottom.
function flip(src, fx, fy) {
  const out = new Canvas(src.w, src.h);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const i = y * src.w + x;
      if (src.px[i] !== -1) out.set(fx ? src.w - 1 - x : x, fy ? src.h - 1 - y : y, src.px[i], src.a[i]);
    }
  return out;
}

// A sprig of ivy hugging a top-left corner, with or without a flower.
function vineCorner(withFlower) {
  const c = new Canvas(PANEL_SLICE, PANEL_SLICE);
  // the vine runs along the top edge and down the left edge
  for (let i = 4; i < PANEL_SLICE; i++) {
    const wiggle = i % 6 === 2 || i % 6 === 3 ? 1 : 0;
    c.set(i, 2 + wiggle, P.leafDark);
    c.set(2 + wiggle, i, P.leafDark);
  }
  // pointed leaves sprouting off it
  const leafAcross = (x, y, flipV) => {
    const r = flipV ? 1 : 0;
    c.rect(x, y, 3, 2, P.leaf);
    c.set(x + 2, y + r, -1); // pointy tip
    c.set(x + 1, y + (1 - r), P.leafLight);
  };
  const leafDown = (x, y, flipH) => {
    const r = flipH ? 1 : 0;
    c.rect(x, y, 2, 3, P.leaf);
    c.set(x + r, y + 2, -1);
    c.set(x + (1 - r), y + 1, P.leafLight);
  };
  leafAcross(6, 0, false);
  leafAcross(9, 3, true);
  leafDown(0, 6, false);
  leafDown(3, 9, true);
  if (withFlower) {
    // four round dusty-rose petals around a warm glowing center
    c.rect(1, 1, 5, 5, P.pink);
    for (const [x, y] of [[1, 1], [5, 1], [1, 5], [5, 5], [3, 1], [1, 3], [5, 3], [3, 5]]) c.set(x, y, -1);
    c.set(2, 2, P.white);
    c.set(4, 4, P.pinkShade);
    c.set(4, 5, P.pinkShade);
    c.set(5, 4, P.pinkShade);
    c.set(3, 3, P.glow);
  } else {
    c.rect(1, 1, 3, 3, P.leaf); // a curled leaf bud
    c.set(1, 1, -1);
    c.set(2, 2, P.leafLight);
  }
  return c.outline(P.line);
}

// Draw a panel: `fill` is the inside, `ring` a lighter inner border,
// `flowers` picks which corners [TL, TR, BL, BR] get a flower.
function panel({ edge, fill, ring, top, bottom }, flowers) {
  const S = PANEL_SIZE;
  const m = MARGIN;
  const c = new Canvas(S, S);
  const n = S - m * 2;
  c.rect(m, m, n, n, edge); // frame
  c.rect(m + 1, m + 1, n - 2, n - 2, ring); // lighter inner border
  c.rect(m + 2, m + 2, n - 4, n - 4, fill);
  c.rect(m + 1, m + 1, n - 2, 1, top); // light along the top
  c.rect(m + 1, m + n - 2, n - 2, 1, bottom); // shadow along the bottom
  c.outline(P.line);

  const flower = vineCorner(true);
  const leaves = vineCorner(false);
  const k = S - PANEL_SLICE;
  c.draw(flip(flowers[0] ? flower : leaves, false, false), 0, 0);
  c.draw(flip(flowers[1] ? flower : leaves, true, false), k, 0);
  c.draw(flip(flowers[2] ? flower : leaves, false, true), 0, k);
  c.draw(flip(flowers[3] ? flower : leaves, true, true), k, k);
  return c;
}

// Warm wooden sign (the coin counter).
const panelWood = () =>
  panel({ edge: P.woodDark, ring: P.woodLight, fill: P.wood, top: P.cream, bottom: P.woodDark }, [false, true, true, false]);

// Soft mossy-green panel (for shop menus later).
const panelMoss = () =>
  panel({ edge: P.sageDark, ring: P.sageLight, fill: P.sageShade, top: P.white, bottom: P.sageDark }, [true, true, true, true]);

export const UI = {
  coin,
  'panel-wood': panelWood,
  'panel-moss': panelMoss,
};
