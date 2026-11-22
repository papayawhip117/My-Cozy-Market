// The new seasonal decorations (src/data/seasonal.js): a festive tree, a
// pumpkin patch and a holly garland. Each gets a shop picture (16 x 16);
// the tree and pumpkins also get a 3D picture for your home.
import { P } from './palette.js';
import { icon, shadow } from './items.js';
import { tone, piece } from './furniture.js';
import { SEASONAL_PLANTS, SEASONAL_FURNITURE } from '../../src/data/seasonal.js';
import { FOOTPRINT } from '../../src/data/furniture.js';

const FIR = [0x24402e, 0x2f5a3c, 0x3f7a4a];
const PUMPKIN = 0xd9782a;
const ic = (draw, rx = 6) =>
  icon((c) => {
    draw(c);
    c.outline(P.line);
    shadow(c, 8, 15, rx);
  });

export const SEASONAL_ISO = Object.fromEntries([
  piece('festive-tree', (s, a, b) => {
    s.cyl(a / 2, b / 2, 0, 2.6, 4, 0x8a5a30, { side: 0x6b4a36 }); // pot
    s.cyl(a / 2, b / 2, 4, 0.6, 3, 0x6b4a36);
    // three tiers of fir branches
    for (const [z, rx, ry, col] of [[6, 11, 5, FIR[0]], [12, 9, 4, FIR[1]], [18, 7, 3.2, FIR[1]], [23, 4.5, 2.4, FIR[2]]]) {
      s.ball(a / 2, b / 2, z, rx, ry + 2, tone(col, 0.8));
      s.ball(a / 2, b / 2, z + 1.5, rx - 1, ry, col);
    }
    const [x, y] = s.p(a / 2, b / 2, 6);
    const ornaments = [[-6, 0, P.red ?? 0xb8404a], [4, 1, 0xd9a646], [-2, -6, 0x9ccfd4], [6, -5, 0xb8404a], [-3, -12, 0xd9a646], [2, -16, 0xf2b3c4]];
    for (const [dx, dy, col] of ornaments) s.c.rect(x + dx, y + dy - 2, 2, 2, col);
    s.c.line(x - 7, y - 3, x + 6, y - 9, 0xf2ead8); // a ribbon garland
    const [tx, ty] = s.p(a / 2, b / 2, 27);
    s.c.rect(tx - 1, ty - 2, 3, 2, 0xffe3a0); // the star
    s.c.set(tx, ty - 3, 0xffe3a0);
  }),
  piece('pumpkin-patch', (s, a, b) => {
    const pump = (i, j, rx, ry, col) => {
      s.ball(i, j, ry, rx, ry, tone(col, 0.8));
      s.ball(i - 0.4, j - 0.3, ry + 0.4, rx * 0.7, ry * 0.9, col);
      const [x, y] = s.p(i, j, ry);
      s.c.line(x, y - ry, x, y + ry - 1, tone(col, 0.7)); // ridge
      s.c.rect(x - 1, y - ry - 2, 2, 2, 0x4a6634); // stem
    };
    pump(a * 0.3, b * 0.35, 5, 3.5, PUMPKIN);
    pump(a * 0.7, b * 0.45, 4, 3, 0xe08a3a);
    pump(a * 0.45, b * 0.75, 3, 2.4, PUMPKIN);
    const [x, y] = s.p(a / 2, b / 2, 0);
    for (let k = 0; k < 12; k++) s.c.set(x - 6 + k, y + 2 + Math.round(Math.sin(k / 2)), 0x4a8a4a); // curly vine
    s.c.rect(x + 4, y + 4, 2, 2, 0x4a8a4a);
  }),
]);

const ICONS = {
  'festive-tree': ic((c) => {
    c.rect(6, 12, 4, 3, 0x8a5a30);
    c.poly([[8, 1], [13, 6], [3, 6]], FIR[1]);
    c.poly([[8, 4], [14, 10], [2, 10]], FIR[1]);
    c.poly([[8, 7], [15, 13], [1, 13]], FIR[0]);
    c.rect(7, 0, 2, 2, 0xffe3a0);
    for (const [x, y, col] of [[6, 7, 0xb8404a], [10, 9, 0xd9a646], [5, 11, 0x9ccfd4], [11, 12, 0xb8404a], [8, 5, 0xf2b3c4]]) c.rect(x, y, 2, 2, col);
  }, 7),
  'pumpkin-patch': ic((c) => {
    c.ellipse(5, 10, 4, 3.5, PUMPKIN);
    c.ellipse(11, 11, 3.5, 3, 0xe08a3a);
    c.line(5, 7, 5, 13, tone(PUMPKIN, 0.7));
    c.line(11, 9, 11, 13, tone(0xe08a3a, 0.7));
    c.rect(4, 5, 2, 2, 0x4a6634);
    c.rect(10, 7, 2, 2, 0x4a6634);
    c.line(6, 14, 14, 14, 0x4a8a4a);
  }, 7),
  'holly-garland': icon((c) => {
    for (let x = 0; x < 16; x++) c.set(x, 4 + Math.round(Math.sin(x / 16 * Math.PI) * 4), 0x6b4a36);
    for (const x of [1, 4, 7, 10, 13]) {
      const y = 5 + Math.round(Math.sin(x / 16 * Math.PI) * 4);
      c.ellipse(x, y, 2, 1.2, FIR[2]);
      c.ellipse(x + 1, y + 1, 2, 1.2, FIR[1]);
      c.rect(x, y + 1, 2, 2, 0xb8404a);
    }
    for (const x of [3, 9, 14]) c.set(x, 9 + Math.round(Math.sin(x / 16 * Math.PI) * 3), 0xffe3a0);
    c.outline(P.line);
  }),
};
export const SEASONAL_ITEMS = Object.fromEntries(Object.entries(ICONS).map(([id, draw]) => [`item-${id}`, draw]));

for (const item of [...SEASONAL_PLANTS, ...SEASONAL_FURNITURE]) {
  if (!ICONS[item.id]) throw new Error(`seasonal.js: no shop picture for ${item.id}`);
  if (item.cat === 'wall') continue;
  if (!FOOTPRINT[item.id]) throw new Error(`seasonal.js: ${item.id} has no FOOTPRINT`);
  if (!SEASONAL_ISO[`iso-${item.id}`]) throw new Error(`seasonal.js: no 3D picture for ${item.id}`);
}
