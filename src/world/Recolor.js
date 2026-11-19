// Paint an item's picture in new colors while the game runs.
//
// Every item picture (public/assets/item-<id>.png) is looked at once to find
// its main color families. For most things that's two: say a cushion's pink
// and its gold tassels, or a plant's leaves and its pot. Each family can be
// repainted separately:
//
//   const key = recolorKey(scene, 'floor-cushion', 0x8be8cb, null);
//   sprite.setTexture(key);
//
// A repainted family keeps its shading: lighter and darker pixels stay
// lighter and darker, just around the new color.

import { FIXTURE_ART } from '../config.js';

const analysed = new Map(); // item id -> { w, h, data, groups }

// The picture an id uses: shop items are item-<id>; the door, windows and
// dresser have their own art.
export const textureOf = (id) => FIXTURE_ART[id] ?? `item-${id}`;
const BIN = 20; // hue bucket size in degrees

// Glass can't be repainted: any blue/teal pixel in these pictures (the
// window panes, the dresser's mirror, the wall mirror) keeps its color.
const GLASS_HUES = new Set(['window', 'dresser', 'wall-mirror']);
const isGlass = (id, hue) => GLASS_HUES.has(id) && hue >= 140 && hue <= 215;
// Is this pixel a paintable color (not an outline, a gray, or glass)?
const paintable = (id, px) => px[1] > 0.18 && px[2] > 0.18 && px[2] < 0.93 && !isGlass(id, px[0]);
const MIN_ACCENT = 0.1; // a second family must cover at least this much of the colored pixels

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

const hueGap = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

// Finds the one or two main color families in an item's picture.
function analyse(scene, id) {
  if (analysed.has(id)) return analysed.get(id);
  const source = scene.textures.get(textureOf(id)).getSourceImage();
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;

  // Count colored pixels (not outlines, not grays) in hue buckets.
  const bins = new Array(360 / BIN).fill(0);
  const hsl = [];
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) {
      hsl.push(null);
      continue;
    }
    const px = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    hsl.push(px);
    if (paintable(id, px)) {
      bins[Math.floor(px[0] / BIN) % bins.length]++;
      total++;
    }
  }

  // The biggest bucket is the main family; the biggest bucket far from it is the accent.
  const centerOf = (b) => b * BIN + BIN / 2;
  const order = bins.map((n, b) => ({ n, hue: centerOf(b) })).sort((a, b) => b.n - a.n);
  const groups = [];
  if (total > 0 && order[0].n > 0) groups.push({ hue: order[0].hue });
  const second = order.find((o) => groups[0] && hueGap(o.hue, groups[0].hue) >= 50 && o.n / total >= MIN_ACCENT);
  if (second) groups.push({ hue: second.hue });

  // Put every colored pixel in its nearest family, and note each family's average look.
  const member = new Array(hsl.length).fill(-1);
  groups.forEach((g) => Object.assign(g, { s: 0, l: 0, n: 0 }));
  hsl.forEach((px, i) => {
    if (!px || !paintable(id, px)) return;
    let best = -1;
    let gap = 40;
    groups.forEach((g, gi) => {
      const d = hueGap(px[0], g.hue);
      if (d < gap) {
        gap = d;
        best = gi;
      }
    });
    if (best < 0) return;
    member[i] = best;
    groups[best].s += px[1];
    groups[best].l += px[2];
    groups[best].n++;
  });
  for (const g of groups) {
    g.s = g.n ? g.s / g.n : 0.5;
    g.l = g.n ? g.l / g.n : 0.5;
  }

  const result = { w: canvas.width, h: canvas.height, data, hsl, member, groups };
  analysed.set(id, result);
  return result;
}

// How many paintable color families an item has (0, 1 or 2).
export function colorGroups(scene, id) {
  return analyse(scene, id).groups.length;
}

// The texture key for `id` painted with colors c1 and c2 (hex numbers, or null
// to leave that family alone). Makes the picture the first time it's needed.
export function recolorKey(scene, id, c1, c2) {
  const base = textureOf(id);
  if (c1 == null && c2 == null) return base;
  const key = `${base}-${c1 ?? 'x'}-${c2 ?? 'x'}`;
  if (scene.textures.exists(key)) return key;

  const { w, h, data, hsl, member, groups } = analyse(scene, id);
  const targets = [c1, c2].map((c) => (c == null ? null : rgbToHsl((c >> 16) & 255, (c >> 8) & 255, c & 255)));
  const texture = scene.textures.createCanvas(key, w, h);
  const ctx = texture.getContext();
  const out = ctx.createImageData(w, h);
  out.data.set(data);
  for (let p = 0; p < hsl.length; p++) {
    const gi = member[p];
    const target = gi >= 0 ? targets[gi] : null;
    if (!target) continue;
    const [, s, l] = hsl[p];
    const g = groups[gi];
    const ns = Math.min(1, target[1] * (s / Math.max(g.s, 0.1)));
    const nl = Math.min(0.95, Math.max(0.06, target[2] + (l - g.l)));
    const [r, gr, b] = hslToRgb(target[0], ns, nl);
    out.data[p * 4] = r;
    out.data[p * 4 + 1] = gr;
    out.data[p * 4 + 2] = b;
  }
  ctx.putImageData(out, 0, 0);
  texture.refresh();
  return key;
}
