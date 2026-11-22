import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { WALLPAPERS, FLOORS, DEFAULT_WALLPAPER, DEFAULT_FLOORS } from '../data/homeStyles.js';

// Your home, seen from above at an angle (isometric). It has three parts,
// all on one screen:
//
//                        top (240,100)
//                      /              \
//    entryway        /   living room    \          right wall
//   (front door)    /      (main)         \ ____________
//        +------ left (112,164)    right (368,164)       \
//         \____/        \                 /  steps down   \
//                         \              /   to the lower room
//                          bottom (240,228)
//
//   - the living room ('main'): the big diamond in the middle. Its size
//     never changed, so homes from older saves look just like before (they
//     were only lifted up 20 pixels, see LIFT in src/state/gameState.js).
//   - the entryway ('entry'): a small stone-floored nook off the left wall,
//     where the front door is and where you arrive.
//   - the lower room ('lower'): three little steps down off the right.
//
// Positions on the floor are "floor units": i runs from the top corner
// toward the bottom-right, j toward the bottom-left. One unit is 2 pixels
// sideways and 1 pixel down. The living room is 64 x 64 units.
//
// A thing's screen position is just where it's drawn. Floor things stand by
// their bottom edge; wall things hang on the walls by their middle.

export const CX = GAME_WIDTH / 2; // 240: x of the living room's top corner
const TOP_Y = 100; // y of the living room's top corner (moved up 20 to fit the bigger lower room)
export const FLOOR_Y = 164; // the y of the living room's left and right corners
export const HALF_W = 128; // living room: middle to left/right corner
export const HALF_H = 64; // living room: middle to top/bottom corner
export const WALL_H = 80; // how tall the walls are (tall enough to slide a window up and down a little)
export const UNITS = HALF_H; // the living room is 64 x 64 floor units
const STEP = 3; // each step down to the lower room is this many pixels
const DEPTH = 9; // how thick the floor looks along its front edges

// The rooms, in floor units. `drop` is how many pixels lower the floor is.
export const ROOMS = {
  main: { i0: 0, j0: 0, i1: 64, j1: 64, drop: 0, name: 'Living room' },
  entry: { i0: 0, j0: 64, i1: 20, j1: 84, drop: 0, name: 'Entryway' },
  lower: { i0: 64, j0: 0, i1: 104, j1: 42, drop: 4 * STEP, name: 'Lower room' },
};
// The three steps are the first 6 units of the lower room (2 units each).
const STAIRS_END = 70;
// Where furniture can go (not on the steps).
const PLACE_AREAS = [ROOMS.main, ROOMS.entry, { ...ROOMS.lower, i0: STAIRS_END }];
// Where your pal can walk (a little in from the walls and edges; the
// rectangles overlap where rooms join, so you can walk between them).
const WALK = [
  { i0: 3, j0: 3, i1: 62, j1: 62 },
  { i0: 3, j0: 60, i1: 18, j1: 82 },
  { i0: 60, j0: 3, i1: 102, j1: 40 },
];
const LEFT_END = 84; // the left wall runs along j from 0 to here (living room + entryway)
const RIGHT_END = 104; // the right wall runs along i from 0 to here (living room + lower room)

// How many pixels lower the floor is at (i, j): 0 in the living room and
// entryway, a step at a time down the stairs, then the lower room.
export function dropAt(i, j) {
  if (i < ROOMS.lower.i0 || j > ROOMS.lower.j1) return 0;
  if (i >= STAIRS_END) return ROOMS.lower.drop;
  return STEP * (Math.floor((i - ROOMS.lower.i0) / 2) + 1);
}

// The living room's corners (screen pixels).
export const CORNER = {
  top: { x: CX, y: TOP_Y },
  right: { x: CX + HALF_W, y: FLOOR_Y },
  bottom: { x: CX, y: FLOOR_Y + HALF_H },
  left: { x: CX - HALF_W, y: FLOOR_Y },
};

// Floor units -> screen (ignoring steps), and back.
export const fromFloor = (i, j) => ({ x: CX + 2 * (i - j), y: TOP_Y + i + j });
export function toFloor(x, y) {
  const dx = x - CX;
  const dy = y - TOP_Y;
  return { i: (dy + dx / 2) / 2, j: (dy - dx / 2) / 2 };
}
// Floor units -> screen, standing on the floor that's really there (steps included).
export function floorToScreen(i, j) {
  const p = fromFloor(i, j);
  return { x: p.x, y: p.y + dropAt(i, j) };
}

const inRect = (r, i, j, m = 0) => i >= r.i0 - m && i <= r.i1 + m && j >= r.j0 - m && j <= r.j1 + m;
const insideHouse = (i, j) => Object.values(ROOMS).some((r) => inRect(r, i, j));

// Screen -> floor units, working out which level the point is on.
export function screenToFloor(x, y) {
  for (const d of [ROOMS.lower.drop, 3 * STEP, 2 * STEP, STEP, 0]) {
    const f = toFloor(x, y - d);
    if (dropAt(f.i, f.j) === d && insideHouse(f.i, f.j)) return f;
  }
  return toFloor(x, y);
}

// Which room ('main', 'entry', 'lower') a screen point is in, or null.
export function roomAt(x, y) {
  const { i, j } = screenToFloor(x, y);
  return Object.keys(ROOMS).find((k) => inRect(ROOMS[k], i, j)) ?? null;
}

// ---------- walking ----------

export const walkable = (i, j) => WALK.some((r) => inRect(r, i, j));

// The nearest spot you can stand on to (i, j).
export function nearestWalkable(i, j) {
  let best = null;
  let bestD = Infinity;
  for (const r of WALK) {
    const ci = Math.min(Math.max(i, r.i0), r.i1);
    const cj = Math.min(Math.max(j, r.j0), r.j1);
    const d = (ci - i) ** 2 + (cj - j) ** 2;
    if (d < bestD) {
      bestD = d;
      best = { i: ci, j: cj };
    }
  }
  return best;
}

// Take a step from (i, j) by (di, dj), sliding along walls instead of
// stopping dead when the way is blocked.
export function walkStep(i, j, di, dj) {
  if (walkable(i + di, j + dj)) return { i: i + di, j: j + dj };
  if (walkable(i + di, j)) return { i: i + di, j };
  if (walkable(i, j + dj)) return { i, j: j + dj };
  return { i, j };
}

// ---------- walls ----------

// The wall's top and bottom edges at screen x (the left wall climbs toward
// the middle, the right wall slopes back down; past the steps the floor is
// lower, so the wall reaches further down).
export function wallEdges(x) {
  if (x <= CX) {
    const bottom = TOP_Y + (CX - x) / 2;
    return { top: bottom - WALL_H, bottom };
  }
  const i = (x - CX) / 2;
  return { top: TOP_Y + i - WALL_H, bottom: TOP_Y + i + dropAt(Math.min(i, RIGHT_END - 1), 0) };
}
const WALL_LEFT_X = CX - 2 * LEFT_END; // 72
const WALL_RIGHT_X = CX + 2 * RIGHT_END; // 432

// Keep a wall thing (w x h, placed by its middle) on the walls. Wall
// pictures are slanted to match their wall, so only the middle line matters
// for how high and low they can go.
export function clampToWall(x, y, w, h) {
  const nx = Math.min(WALL_RIGHT_X - w / 2 - 2, Math.max(WALL_LEFT_X + w / 2 + 2, x));
  const edge = wallEdges(nx);
  const top = edge.top + h / 2 + 2;
  const bottom = edge.bottom - h / 2 - 2;
  return { x: nx, y: Math.min(Math.max(y, top), Math.max(top, bottom)) };
}

// Which wall a screen x is on, as a slant for flat pictures: -1 left wall, 1 right.
export const wallSide = (x) => (x < CX ? -1 : 1);

// ---------- furniture ----------
//
// Furniture is measured in floor units too (src/data/furniture.js).

const SHADOW_DROP = 2; // a furniture picture's bottom edge is this far below its front corner (its floor shadow)

// The patch of floor an a x b piece covers when its picture's bottom-middle is
// at (x, y) on a floor `drop` pixels down: { i0, j0, i1, j1 } in floor units.
export function footprintAt(x, y, a, b, drop = 0) {
  const { i, j } = toFloor(x - (a - b), y - drop - SHADOW_DROP - (a + b));
  return { i0: i, j0: j, i1: i + a, j1: j + b };
}

// Slide an a x b piece so all of it is on a floor (whichever room is
// nearest), snapped to whole units. Returns where its picture's bottom-middle
// goes, plus that floor's `drop`.
export function clampFootprint(x, y, a, b, margin = 1) {
  let best = null;
  for (const area of PLACE_AREAS) {
    if (area.i1 - area.i0 < a + margin * 2 || area.j1 - area.j0 < b + margin * 2) continue; // too big for this room
    const f = footprintAt(x, y, a, b, area.drop);
    const i = Math.round(Math.min(Math.max(f.i0, area.i0 + margin), area.i1 - a - margin));
    const j = Math.round(Math.min(Math.max(f.j0, area.j0 + margin), area.j1 - b - margin));
    const back = fromFloor(i, j);
    const spot = { x: back.x + (a - b), y: back.y + (a + b) + SHADOW_DROP + area.drop, drop: area.drop };
    const d = Math.hypot(spot.x - x, spot.y - y);
    if (!best || d < best.d) best = { ...spot, d };
  }
  return best;
}

// A copy of a picture, scaled up and slanted so it lies flat along a wall
// (the left wall climbs to the right, the right wall slopes down). Phaser
// sprites can't slant, so we draw the slanted copy ourselves, with crisp
// pixels. `side` is -1 for the left wall, 1 for the right. Returns a texture key.
export function wallTexture(scene, key, scale, side, flip = false) {
  const name = `${key}@wall${side}x${scale}${flip ? 'f' : ''}`;
  if (scene.textures.exists(name)) return name;
  const source = scene.textures.get(key).getSourceImage();
  const w = source.width * scale;
  const h = source.height * scale;
  const extra = Math.ceil(w * 0.5); // the slant makes the picture this much taller
  const texture = scene.textures.createCanvas(name, w, h + extra);
  const ctx = texture.getContext();
  ctx.imageSmoothingEnabled = false;
  // columns shift down (right wall) or up (left wall) by half a pixel per pixel across
  ctx.setTransform(flip ? -1 : 1, 0.5 * side, 0, 1, flip ? w : 0, side > 0 ? 0 : extra);
  ctx.drawImage(source, 0, 0, w, h);
  texture.refresh();
  return name;
}

// ---------- drawing the house ----------

const TRIM = 0x2b1f1a;
const SKIRT = 0x5a3f2e;
const EDGE_LINE = 0x1c1822;
const FACE_L = 0x3b2a1f; // floor edges facing the bottom-left
const FACE_R = 0x2c1f17; // floor edges facing the bottom-right

// Lighter (f > 1) or darker (f < 1) version of a color.
function tone(c, f) {
  const ch = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)));
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

// A number from 0 to 1 for a grid spot, so patterns look random but never change.
function hash(a, b) {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Draws the whole house. `style` = { wallpaper, floors: { main, entry, lower } }
// (ids from src/data/homeStyles.js; anything missing uses the defaults).
// Returns the Graphics, so the scene can redraw it after you redecorate.
export function drawRoom(scene, style = {}) {
  const g = scene.add.graphics().setDepth(0);
  const paper = WALLPAPERS[style.wallpaper] ?? WALLPAPERS[DEFAULT_WALLPAPER];
  const floorOf = (room) => FLOORS[style.floors?.[room]] ?? FLOORS[DEFAULT_FLOORS[room]];
  const P = (i, j, d = 0) => {
    const p = fromFloor(i, j);
    return { x: p.x, y: p.y + d };
  };
  const quad = (pts, color) => g.fillStyle(color, 1).fillPoints(pts, true);
  // The front face of a floor edge from a to b (screen points), hanging from d0 down to d1 pixels.
  const face = (a, b, d0, d1, color) => quad([{ x: a.x, y: a.y + d0 }, { x: b.x, y: b.y + d0 }, { x: b.x, y: b.y + d1 }, { x: a.x, y: a.y + d1 }], color);

  // a soft pool of dark around the house
  g.fillStyle(0x0d0a12, 0.35).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // ----- the walls -----
  // Drawn in 2-unit (4 pixel) columns. at(t) is the wall's bottom point t
  // units along it, drop(t) how far the floor under that column has dropped.
  const wall = (length, at, drop, light) => {
    const A = tone(paper.a, light);
    const B = tone(paper.b, light);
    for (let t = 0; t < length; t += 2) {
      const d = drop(t);
      const p0 = at(t);
      const p1 = at(t + 2);
      const top0 = { x: p0.x, y: p0.y - WALL_H };
      const top1 = { x: p1.x, y: p1.y - WALL_H };
      const bot0 = { x: p0.x, y: p0.y + d };
      const bot1 = { x: p1.x, y: p1.y + d };
      const stripe = Math.floor(t / 4) % 2;
      quad([top0, top1, bot1, bot0], paper.pattern === 'stripes' && stripe ? B : A);
      // the pattern on top
      const xm = Math.min(p0.x, p1.x) + 1;
      const yAt = (dy) => Math.round((top0.y + top1.y) / 2 + dy);
      const H = WALL_H + d - 7; // down to the skirting board
      // a slanted strip across this column, dy pixels below the top and h tall
      const band = (dy, h, color) => quad([{ x: p0.x, y: top0.y + dy }, { x: p1.x, y: top1.y + dy }, { x: p1.x, y: top1.y + dy + h }, { x: p0.x, y: top0.y + dy + h }], color);
      // a 1-pixel upright line at this column's left edge, from dy0 to dy1 below the top
      const joint = (dy0, dy1, color) => g.fillStyle(color, 1).fillRect(p0.x, top0.y + dy0, 1, Math.max(0, Math.min(dy1, H) - dy0));
      const C = paper.c === undefined ? B : tone(paper.c, light);
      if (paper.pattern === 'dots' && t % 4 === 0) {
        for (let dy = 9 + ((t / 4) % 2) * 6; dy < WALL_H + d - 12; dy += 12) g.fillStyle(B, 1).fillRect(xm, yAt(dy), 2, 2);
      } else if (paper.pattern === 'stars') {
        for (let dy = 8; dy < WALL_H + d - 12; dy += 7) {
          if (hash(t, dy) > 0.16) continue;
          g.fillStyle(B, 1).fillRect(xm + 1, yAt(dy) - 1, 1, 3).fillRect(xm, yAt(dy), 3, 1);
        }
      } else if (paper.pattern === 'plain') {
        // plain paint with a wooden rail across the wall
        band(Math.round(H * 0.62), 2, B);
        band(Math.round(H * 0.62) + 2, 1, tone(B, 0.8));
      } else if (paper.pattern === 'damask') {
        // little diamonds in offset rows, very faint
        if (t % 6 === 0) {
          const off = (t / 6) % 2 ? 7 : 0;
          for (let dy = 6 + off; dy < H - 6; dy += 14) {
            const y = yAt(dy);
            g.fillStyle(B, 1).fillRect(xm + 1, y - 2, 1, 5).fillRect(xm, y - 1, 3, 3);
            g.fillStyle(C, 1).fillRect(xm + 1, y, 1, 1);
          }
        }
      } else if (paper.pattern === 'brick' || paper.pattern === 'stone') {
        // rows of bricks (or big stone blocks), each row shifted half a brick
        const stone = paper.pattern === 'stone';
        const rowH = stone ? 10 : 6;
        const len = stone ? 12 : 8; // units long
        for (let row = 0, dy = 3; dy < H; row++, dy += rowH) {
          const k = Math.floor((t + (row % 2) * (len / 2)) / len);
          const shade = hash(k, row);
          band(dy, Math.min(rowH - 1, H - dy), shade > 0.66 ? tone(A, 1.08) : shade < 0.25 ? tone(A, 0.9) : A);
          band(dy + rowH - 1, 1, B); // mortar under the row
          if ((t + (row % 2) * (len / 2)) % len === 0) joint(dy, dy + rowH - 1, B);
          if (stone && shade > 0.8) band(dy + rowH - 3, 2, C); // a little moss
        }
      } else if (paper.pattern === 'flowers') {
        // tiny five-dot flowers with a leaf, scattered in offset rows
        if (t % 4 === 0) {
          const off = (t / 4) % 2 ? 6 : 0;
          for (let dy = 6 + off; dy < H - 4; dy += 12) {
            const y = yAt(dy);
            const petal = hash(t, dy) > 0.5 ? B : tone(B, 0.85);
            g.fillStyle(petal, 1).fillRect(xm, y - 1, 3, 3);
            g.fillStyle(0xf2e6c0, 1).fillRect(xm + 1, y, 1, 1);
            g.fillStyle(C, 1).fillRect(xm + 2, y + 2, 1, 1).fillRect(xm + 3, y + 1, 1, 1);
          }
        }
      } else if (paper.pattern === 'panels') {
        // upright wooden boards with a seam every 3 columns and the odd knot
        if (t % 6 === 0) joint(0, H, B);
        if (hash(t, 3) > 0.85) g.fillStyle(C, 1).fillRect(xm, yAt(10 + Math.floor(hash(t, 9) * (H - 20))), 2, 1);
        if (t % 6 === 2) band(0, H, tone(A, 1.04));
      } else if (paper.pattern === 'gingham') {
        // checks: darker bands across, darker columns down, darkest where they cross
        const col = Math.floor(t / 4) % 2;
        if (col) band(0, H, B);
        for (let dy = 0; dy < H; dy += 8) band(dy, Math.min(4, H - dy), col ? C : B);
      }
      quad([{ x: bot0.x, y: bot0.y - 7 }, { x: bot1.x, y: bot1.y - 7 }, bot1, bot0], SKIRT); // skirting board
      quad([top0, top1, { x: top1.x, y: top1.y + 3 }, { x: top0.x, y: top0.y + 3 }], TRIM); // trim along the top
    }
  };
  // left wall: along j, from the far end of the entryway back to the corner
  wall(LEFT_END, (t) => P(0, LEFT_END - t), () => 0, 1);
  // right wall: along i, from the corner out past the steps
  wall(RIGHT_END, (t) => P(t, 0), (t) => dropAt(t, 0), 1.12);
  g.lineStyle(1, TRIM, 1).lineBetween(CX, TOP_Y - WALL_H, CX, TOP_Y); // the inside corner
  // the cut ends of the two walls
  const le = P(0, LEFT_END);
  quad([{ x: le.x - 3, y: le.y - WALL_H + 1 }, { x: le.x, y: le.y - WALL_H }, { x: le.x, y: le.y }, { x: le.x - 3, y: le.y + 1 }], TRIM);
  const re = P(RIGHT_END, 0);
  const rd = ROOMS.lower.drop;
  quad([{ x: re.x, y: re.y - WALL_H }, { x: re.x + 3, y: re.y - WALL_H + 1 }, { x: re.x + 3, y: re.y + rd + 1 }, { x: re.x, y: re.y + rd }], TRIM);

  // ----- the floors -----
  // Fill i0..i1 x j0..j1 (floor units), d pixels down, with flooring f.
  // Patterns line up with the living room, so they carry on across rooms.
  const G = 8; // boards are 8 units wide, tiles 8 x 8
  const floorPatch = (f, i0, j0, i1, j1, d) => {
    for (let tj = Math.floor(j0 / G) * G; tj < j1; tj += G) {
      const row = tj / G;
      const b0 = Math.max(tj, j0);
      const b1 = Math.min(tj + G, j1);
      if (f.pattern === 'boards') {
        // one long board per row, a seam along it and a few board ends
        quad([P(i0, b0, d), P(i1, b0, d), P(i1, b1, d), P(i0, b1, d)], row % 2 ? f.b : f.a);
        const s0 = P(i0, b1, d);
        const s1 = P(i1, b1, d);
        g.lineStyle(1, f.line, 0.55).lineBetween(s0.x, s0.y, s1.x, s1.y);
        for (let i = G * (1 + ((row * 3) % 4)); i < i1; i += G * (3 + (row % 2))) {
          if (i <= i0) continue;
          const p = P(i, b0, d);
          const q = P(i, b1, d);
          g.lineStyle(1, f.line, 0.4).lineBetween(p.x, p.y, q.x, q.y);
        }
        continue;
      }
      for (let ti = Math.floor(i0 / G) * G; ti < i1; ti += G) {
        const col = ti / G;
        const a0 = Math.max(ti, i0);
        const a1 = Math.min(ti + G, i1);
        const pts = [P(a0, b0, d), P(a1, b0, d), P(a1, b1, d), P(a0, b1, d)];
        const checker = f.pattern === 'checker';
        quad(pts, checker ? ((row + col) % 2 ? f.b : f.a) : hash(col, row) > 0.5 ? f.b : f.a);
        g.lineStyle(1, f.line, checker ? 0.35 : 0.6).strokePoints(pts, true);
      }
    }
  };

  // the living room and the entryway
  const main = ROOMS.main;
  const entry = ROOMS.entry;
  const lower = ROOMS.lower;
  floorPatch(floorOf('main'), main.i0, main.j0, main.i1, main.j1, 0);
  floorPatch(floorOf('entry'), entry.i0, entry.j0, entry.i1, entry.j1, 0);
  const t0 = P(0, entry.j0);
  const t1 = P(entry.i1, entry.j0);
  g.lineStyle(2, SKIRT, 1).lineBetween(t0.x, t0.y, t1.x, t1.y); // a wooden threshold between them
  face(P(0, entry.j1), P(entry.i1, entry.j1), 0, DEPTH, FACE_L); // their front edges
  face(P(entry.i1, entry.j1), P(entry.i1, entry.j0), 0, DEPTH, FACE_R);
  face(P(entry.i1, main.j1), P(main.i1, main.j1), 0, DEPTH, FACE_L);
  face(P(main.i1, main.j1), P(main.i1, lower.j1), 0, DEPTH, FACE_R);

  // three steps down, then the lower room
  const lf = floorOf('lower');
  for (let k = 0; k < 3; k++) {
    const i0 = lower.i0 + 2 * k;
    const d = STEP * (k + 1);
    face(P(i0, lower.j0), P(i0, lower.j1), d - STEP, d, FACE_R); // the riser below the step above
    quad([P(i0, lower.j0, d), P(i0 + 2, lower.j0, d), P(i0 + 2, lower.j1, d), P(i0, lower.j1, d)], tone(lf.a, 1.08));
    face(P(i0, lower.j1), P(i0 + 2, lower.j1), d, lower.drop + DEPTH, FACE_L); // the side of the steps
  }
  face(P(STAIRS_END, lower.j0), P(STAIRS_END, lower.j1), 3 * STEP, lower.drop, FACE_R); // the last riser
  floorPatch(lf, STAIRS_END, lower.j0, lower.i1, lower.j1, lower.drop);
  face(P(STAIRS_END, lower.j1), P(lower.i1, lower.j1), lower.drop, lower.drop + DEPTH, FACE_L);
  face(P(lower.i1, lower.j1), P(lower.i1, lower.j0), lower.drop, lower.drop + DEPTH, FACE_R);

  // a dark line along the outside front edges
  g.lineStyle(1, EDGE_LINE, 1);
  g.strokePoints([P(0, entry.j1), P(entry.i1, entry.j1), P(entry.i1, main.j1), P(main.i1, main.j1), P(main.i1, lower.j1)], false);
  g.strokePoints([P(STAIRS_END, lower.j1, lower.drop), P(lower.i1, lower.j1, lower.drop), P(lower.i1, lower.j0, lower.drop)], false);
  return g;
}
