// Wallpaper, flooring, rugs and front doors for your home.
//
//   home-door-<style>.png   a front door (36 x 66, the same size as home-door.png)
//   item-<id>.png           the little 16 x 16 shop pictures
//
// The colors and patterns come from src/data/homeStyles.js, the same list
// the game uses to draw your walls and floors, so a shop picture always
// matches what goes up at home. Rugs' 3D pictures are in furniture.js.
import { Canvas } from './canvas.js';
import { P } from './palette.js';
import { door, part } from './scenery.js';
import { icon, shadow } from './items.js';
import { WALLPAPERS, FLOORS, DOORS, DEFAULT_DOOR } from '../../src/data/homeStyles.js';

const GLASS = 0x6fa8b0;
const GLASS_SHINE = 0xc8e0e4;

// Lighter (f > 1) or darker (f < 1) version of a color.
function tone(c, f) {
  const ch = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)));
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

// ---------- front doors ----------

// The doormat every door has in front of it.
function doormat(c) {
  c.rect(5, 65, 26, 1, P.woodDark);
  c.draw(part(36, 66, (d) => d.rect(6, 63, 24, 2, P.pinkDark)));
}

// A short, completely round door in a round stone frame.
function roundDoor(c, color, dark) {
  const cx = 17.5;
  const cy = 47;
  c.draw(part(36, 66, (d) => d.circle(cx, cy, 16, P.stoneShade, (x, y) => y <= 64)));
  c.draw(part(36, 66, (d) => {
    d.circle(cx, cy, 14, color, (x, y) => y <= 63);
    for (let x = 8; x < 30; x += 5) for (let y = 33; y < 64; y++) if (d.get(x, y) === color) d.set(x, y, dark); // planks
  }));
  c.circle(cx, cy, 2, P.gold); // a big round knob in the middle
  c.set(17, 46, tone(P.gold, 1.3));
  for (const hy of [40, 55]) c.rect(4, hy, 10, 2, P.iron); // hinges
  c.rect(2, 64, 32, 1, P.stoneDark); // step
}

// A little round window near the top of an arched door.
function porthole(c, y) {
  c.circle(17.5, y, 5, P.woodDark);
  c.circle(17.5, y, 4, GLASS);
  c.rect(17, y - 4, 1, 9, P.woodDark); // cross bars
  c.rect(13, y, 9, 1, P.woodDark);
  c.set(15, y - 2, GLASS_SHINE);
  c.set(16, y - 3, GLASS_SHINE);
}

function frontDoor(style) {
  return () => {
    const c = new Canvas(36, 66);
    if (style.shape === 'round') roundDoor(c, style.color, style.dark);
    else door(c, 18, 64, 26, 58, style.color, style.dark);
    if (style.shape === 'pane') porthole(c, 20);
    doormat(c);
    return c;
  };
}

// ---------- shop pictures ----------

// A mini door.
const doorIcon = (style) =>
  icon((c) => {
    if (style.shape === 'round') {
      c.circle(7.5, 9, 6, style.color);
      c.rect(5, 4, 1, 11, style.dark).rect(10, 4, 1, 11, style.dark);
      c.set(8, 9, P.gold);
      c.rect(1, 15, 14, 1, P.stoneDark);
    } else {
      c.rect(3, 6, 10, 9, style.color);
      c.ellipse(7.5, 6, 5, 4, style.color, (x, y) => y <= 6);
      c.rect(6, 3, 1, 12, style.dark).rect(9, 3, 1, 12, style.dark);
      if (style.shape === 'pane') c.rect(7, 5, 2, 2, GLASS);
      c.set(11, 10, P.gold);
      c.rect(2, 15, 12, 1, P.stoneDark);
    }
    c.outline(P.line);
  });

// A sheet of wallpaper with its roll at the bottom.
const wallpaperIcon = (w) =>
  icon((c) => {
    c.rect(3, 1, 10, 11, w.a);
    if (w.pattern === 'stripes') for (let x = 5; x < 13; x += 4) c.rect(x, 1, 2, 11, w.b);
    if (w.pattern === 'dots') for (const [x, y] of [[4, 2], [8, 2], [6, 5], [10, 5], [4, 8], [8, 8], [11, 9]]) c.set(x, y, w.b);
    if (w.pattern === 'stars') for (const [x, y] of [[5, 3], [10, 6], [6, 9]]) c.rect(x - 1, y, 3, 1, w.b).rect(x, y - 1, 1, 3, w.b);
    c.rect(2, 12, 12, 3, tone(w.a, 0.8)); // the roll
    c.rect(2, 12, 12, 1, tone(w.a, 1.15));
    c.rect(13, 12, 1, 3, P.cream); // its paper-white end
    c.outline(P.line);
    shadow(c, 8, 15, 6);
  });

// A little diamond of flooring, seen from above like the room.
const floorIcon = (f) =>
  icon((c) => {
    const cx = 7.5;
    const cy = 8;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const dx = (x - cx) / 7.5;
        const dy = (y - cy) / 4;
        if (Math.abs(dx) + Math.abs(dy) > 1) continue;
        // floor units across this little diamond (4 units = 1 tile)
        const i = (y - cy + (x - cx) / 2 + 8) / 2;
        const j = (y - cy - (x - cx) / 2 + 8) / 2;
        const row = Math.floor(j / 2);
        const col = Math.floor(i / 2);
        let color;
        if (f.pattern === 'boards') color = row % 2 ? f.b : f.a;
        else if (f.pattern === 'checker') color = (row + col) % 2 ? f.b : f.a;
        else color = (row * 3 + col) % 2 ? f.b : f.a;
        c.set(x, y, color);
      }
    // its thickness along the front edges
    for (let x = 0; x < 16; x++) {
      const bottom = Math.round(cy + 4 * (1 - Math.abs(x - cx) / 7.5));
      c.set(x, bottom + 1, x < cx ? P.woodDark : tone(P.woodDark, 0.8));
    }
    c.outline(P.line);
  });

// Rugs, flat on the floor.
const RUG_ICONS = {
  'item-round-rug': icon((c) => {
    [P.pinkShade, P.cream, P.sage, P.pink, P.gold].forEach((color, k) => c.ellipse(7.5, 9, 7 - k * 1.3, 4 - k * 0.75, color));
    c.outline(P.line);
  }),
  'item-striped-rug': icon((c) => {
    c.rect(2, 5, 12, 7, P.cream);
    for (let x = 4; x < 13; x += 4) c.rect(x, 5, 2, 7, P.sageShade).rect(x + 2, 5, 1, 7, P.brick);
    c.outline(P.line);
    for (let y = 6; y < 12; y += 2) {
      c.set(0, y, P.creamShade); // fringe
      c.set(15, y, P.creamShade);
    }
  }),
  'item-moss-rug': icon((c) => {
    c.ellipse(7.5, 9, 7, 4.5, P.moss);
    for (const [x, y] of [[4, 8], [9, 7], [11, 10], [6, 11], [3, 10], [12, 8]]) c.set(x, y, P.mossLight);
    for (const [x, y] of [[7, 9], [10, 11], [5, 6]]) c.set(x, y, P.mossDark);
    c.set(8, 8, P.pink);
    c.outline(P.line);
  }),
};

export const HOME_STYLES = {
  ...Object.fromEntries(Object.entries(DOORS).filter(([id]) => id !== DEFAULT_DOOR).map(([id, style]) => [`home-${id}`, frontDoor(style)])),
};

export const HOME_STYLE_ITEMS = {
  ...RUG_ICONS,
  ...Object.fromEntries(Object.entries(WALLPAPERS).map(([id, w]) => [`item-${id}`, wallpaperIcon(w)])),
  ...Object.fromEntries(Object.entries(FLOORS).map(([id, f]) => [`item-${id}`, floorIcon(f)])),
  ...Object.fromEntries(Object.entries(DOORS).map(([id, d]) => [`item-${id}`, doorIcon(d)])),
};
