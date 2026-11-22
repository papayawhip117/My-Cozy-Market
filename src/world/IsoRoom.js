import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { WALLPAPERS, FLOORS, DEFAULT_WALLPAPER, DEFAULT_FLOORS, ADDON_FLOOR } from '../data/homeStyles.js';

// Your home, seen from above at an angle (isometric).
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
// Only the living room ('main': the big diamond in the middle) never moves.
// Its size never changed, so homes from older saves look just like before
// (they were only lifted up 20 pixels, see LIFT in src/state/gameState.js).
// Every other room can be moved to any side of the house (or packed away):
//   - the entryway ('entry'): a small stone-floored nook, where the front
//     door starts out and where you arrive.
//   - the lower room ('lower'): sunk 12 pixels, with three little steps
//     down into it whenever a room joins its front-left edge.
//   - rooms bought at Timber & Twig (src/data/expansions.js), by their uid.
// All of them are saved in gameState (home.addons) and handed to setLayout().
// The top floor is a floor of its own: when you're up there, it's the only room.
//
// Positions on the floor are "floor units": i runs from the top corner
// toward the bottom-right, j toward the bottom-left. One unit is 2 pixels
// sideways and 1 pixel down. The living room is 64 x 64 units. Rooms
// behind the living room have negative i or j.
//
// Walls only stand along the BACK edges of the house (where i or j is
// smallest), so you can see in. A wall that would hide another room behind
// it isn't drawn at all (that side is left open).
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
export const DOOR_MIN = 12; // rooms must share at least this much edge (the doorway between them)

// The living room, in floor units. `drop` is how many pixels lower the floor is.
export const BASE_ROOMS = [{ key: 'main', i0: 0, j0: 0, i1: 64, j1: 64, drop: 0, name: 'Living room' }];
const LOWER_DROP = 4 * STEP; // the lower room's floor is this far down
export const TOP_ROOM = { key: 'top', i0: 0, j0: 0, i1: 64, j1: 64, drop: 0, name: 'Top floor' };
// The three steps are the first 6 units of the lower room (2 units each).
const STAIRS = 6;
const LEFT_END = 84; // (only keeps the wallpaper pattern lined up the way it always was)

// ---------- the layout of the floor you're on ----------

let rooms = BASE_ROOMS; // every room on this floor
let walls = []; // wall runs, see buildWalls()
let pieces = []; // full walls things can hang on, see buildWalls()

const inRect = (r, i, j, m = 0) => i >= r.i0 - m && i <= r.i1 + m && j >= r.j0 - m && j <= r.j1 + m;
// the room a floor point is in (the starting rooms win on a shared edge)
const roomOf = (i, j, list = rooms) => list.find((r) => inRect(r, i, j));
const insideHouse = (i, j) => Boolean(roomOf(i, j));

// Do two rooms overlap (more than touching)?
export const overlaps = (a, b) => a.i0 < b.i1 && b.i0 < a.i1 && a.j0 < b.j1 && b.j0 < a.j1;

// How long an edge two rooms share (0 if they don't touch side by side).
export function sharedEdge(a, b) {
  if (a.i1 === b.i0 || b.i1 === a.i0) return Math.max(0, Math.min(a.j1, b.j1) - Math.max(a.j0, b.j0));
  if (a.j1 === b.j0 || b.j1 === a.j0) return Math.max(0, Math.min(a.i1, b.i1) - Math.max(a.i0, b.i0));
  return 0;
}

// Can you walk from the living room to every room in the list?
export function isConnected(list) {
  const seen = new Set([list.find((r) => r.key === 'main') ?? list[0]]);
  const todo = [...seen];
  while (todo.length) {
    const r = todo.pop();
    for (const o of list) {
      if (!seen.has(o) && sharedEdge(r, o) >= DOOR_MIN) {
        seen.add(o);
        todo.push(o);
      }
    }
  }
  return seen.size === list.length;
}

// A moved room's floor is level with the room it shares the most edge with
// (so one tacked onto the lower room is sunken too). The lower room is
// always sunk, wherever it is.
function dropFor(r, list) {
  if (r.kind === 'lower') return LOWER_DROP;
  let best = null;
  for (const o of list) {
    const n = o === r ? 0 : sharedEdge(r, o);
    if (n >= DOOR_MIN && (!best || n > best.n)) best = { n, drop: o.drop };
  }
  return best?.drop ?? 0;
}

// Set up the floor you're on. `addons` = the rooms that are put up besides
// the living room, [{ key, kind, i0, j0, i1, j1 }]; level 1 = the top floor.
// Call before drawing, walking or placing anything, and again whenever a
// room moves.
export function setLayout(addons = [], level = 0) {
  if (level === 1) rooms = [TOP_ROOM];
  else {
    rooms = [...BASE_ROOMS, ...addons.map((a) => ({ ...a, drop: a.kind === 'lower' ? LOWER_DROP : 0, addon: true }))];
    // rooms joined to other rooms take their level from them, so go round a few times
    for (let pass = 0; pass < 4; pass++) for (const r of rooms) if (r.addon) r.drop = dropFor(r, rooms);
    // the lower room gets its three steps when a room that's level with the floor joins its front-left edge
    for (const r of rooms) {
      r.stairs = r.kind === 'lower' && rooms.some((o) => o !== r && o.drop === 0 && o.i1 === r.i0 && sharedEdge(o, r) >= DOOR_MIN);
    }
  }
  buildWalls();
}

// The rooms on this floor (don't change them).
export const currentRooms = () => rooms;

// Where a room of size wi x wj (in floor units) could go, joined to the
// house: every spot where it shares at least DOOR_MIN of an edge with a room
// in `others` and overlaps none of them. [{ i0, j0, i1, j1, drop }]
export function attachSpots(wi, wj, others, kind = null) {
  const spots = [];
  const seen = new Set();
  const tryAt = (i0, j0) => {
    const r = { i0, j0, i1: i0 + wi, j1: j0 + wj, kind };
    const key = `${i0},${j0}`;
    if (seen.has(key) || others.some((o) => overlaps(r, o))) return;
    seen.add(key);
    r.drop = dropFor(r, others);
    spots.push(r);
  };
  // slide along a side from `from` to `to` (2 units at a time), plus lined up with each end
  const along = (from, to, at) => {
    for (let t = from; t <= to; t += 2) at(t);
  };
  for (const o of others) {
    along(o.j0 - wj + DOOR_MIN, o.j1 - DOOR_MIN, (j) => tryAt(o.i0 - wi, j)); // behind its left wall
    along(o.j0 - wj + DOOR_MIN, o.j1 - DOOR_MIN, (j) => tryAt(o.i1, j)); // off its front-right edge
    along(o.i0 - wi + DOOR_MIN, o.i1 - DOOR_MIN, (i) => tryAt(i, o.j0 - wj)); // behind its right wall
    along(o.i0 - wi + DOOR_MIN, o.i1 - DOOR_MIN, (i) => tryAt(i, o.j1)); // off its front-left edge
  }
  return spots;
}

// How many pixels lower the floor is at (i, j): a step at a time down the
// stairs into the lower room, else that room's drop.
export function dropAt(i, j) {
  const r = roomOf(i, j);
  if (!r) return 0;
  if (r.stairs && i < r.i0 + STAIRS) return STEP * (Math.floor(Math.max(0, i - r.i0) / 2) + 1);
  return r.drop;
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

// Screen -> floor units, working out which level the point is on.
export function screenToFloor(x, y) {
  const drops = new Set([0, STEP, 2 * STEP, 3 * STEP]);
  for (const r of rooms) drops.add(r.drop);
  for (const d of [...drops].sort((a, b) => b - a)) {
    const f = toFloor(x, y - d);
    if (dropAt(f.i, f.j) === d && insideHouse(f.i, f.j)) return f;
  }
  return toFloor(x, y);
}

// Which room ('main', 'entry', 'lower', 'top' or a bought room's uid) a screen point is in, or null.
export function roomAt(x, y) {
  const { i, j } = screenToFloor(x, y);
  return roomOf(i, j)?.key ?? null;
}

// The whole house on screen (walls included): { x, y, width, height }.
export function houseBounds() {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const r of rooms) {
    x0 = Math.min(x0, fromFloor(r.i0, r.j1).x);
    x1 = Math.max(x1, fromFloor(r.i1, r.j0).x);
    y0 = Math.min(y0, fromFloor(r.i0, r.j0).y - WALL_H);
    y1 = Math.max(y1, fromFloor(r.i1, r.j1).y + r.drop + DEPTH);
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

// ---------- walking ----------

// You can stand where there's floor all round you: 3 units toward the walls
// at the back, 2 toward the front edges. (Where rooms join, the floor
// carries on, so you can walk from one into the next.)
const AROUND = [
  [-3, 0], [2, 0], [0, -3], [0, 2],
  [-3, -3], [2, 2], [-3, 2], [2, -3],
];
export const walkable = (i, j) => AROUND.every(([a, b]) => insideHouse(i + a, j + b));

// The nearest spot you can stand on to (i, j).
export function nearestWalkable(i, j) {
  if (walkable(i, j)) return { i, j };
  let best = null;
  let bestD = Infinity;
  for (const r of rooms) {
    const ci = Math.min(Math.max(i, r.i0 + 3), r.i1 - 2);
    const cj = Math.min(Math.max(j, r.j0 + 3), r.j1 - 2);
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
//
// A "run" is a straight stretch of wall: side -1 = a left wall (along j, at
// i = line), side 1 = a right wall (along i, at j = line), from t0 to t1
// along it.
// A "piece" is what a picture can hang on: one run, or a left and a right
// run that meet in a corner (so a picture can sit across the corner, like it
// always could in the living room).
//
// A wall only stands where it's the edge of the house: not where another
// room joins on behind it, and not where it would hide part of another
// room's floor (that stretch is left open instead, so nothing is ever drawn
// as a stray strip or a floating piece).

// Is there floor (of another room) up the screen from floor point (i, j),
// where a tall wall standing there would hide it?
function hidesRoom(i, j) {
  for (let t = 1; t <= WALL_H / 2; t++) if (rooms.some((r) => inRect(r, i - t, j - t, -0.5))) return true;
  return false;
}

function buildWalls() {
  const cols = [];
  for (const r of rooms) {
    for (let j = r.j0; j < r.j1; j += 2) {
      if (!insideHouse(r.i0 - 1, j + 1) && !hidesRoom(r.i0, j + 1)) cols.push({ side: -1, line: r.i0, t: j });
    }
    for (let i = r.i0; i < r.i1; i += 2) {
      if (!insideHouse(i + 1, r.j0 - 1) && !hidesRoom(i + 1, r.j0)) cols.push({ side: 1, line: r.j0, t: i });
    }
  }
  // join the columns into runs
  cols.sort((a, b) => a.side - b.side || a.line - b.line || a.t - b.t);
  walls = [];
  for (const c of cols) {
    const last = walls[walls.length - 1];
    if (last && last.side === c.side && last.line === c.line && last.t1 === c.t) last.t1 = c.t + 2;
    else walls.push({ side: c.side, line: c.line, t0: c.t, t1: c.t + 2 });
  }
  // pair up left and right walls that meet in a corner
  pieces = [];
  const used = new Set();
  for (const left of walls.filter((w) => w.side < 0)) {
    // a left wall at i = a starting at j = b meets a right wall at j = b starting at i = a
    const right = walls.find((w) => w.side > 0 && w.line === left.t0 && w.t0 === left.line && !used.has(w));
    if (right) used.add(right);
    pieces.push(right ? [left, right] : [left]);
  }
  for (const w of walls) if (w.side > 0 && !used.has(w)) pieces.push([w]);
}

// Where a run is on screen, left to right.
const runX = (w) => (w.side < 0 ? [CX + 2 * (w.line - w.t1), CX + 2 * (w.line - w.t0)] : [CX + 2 * (w.t0 - w.line), CX + 2 * (w.t1 - w.line)]);

// The top and bottom of wall run w at screen x (the bottom reaches further
// down where the floor in front of it is lower).
function runEdges(w, x) {
  const clampT = (t) => Math.min(Math.max(t, w.t0 + 0.5), w.t1 - 0.5);
  let base;
  let drop;
  if (w.side < 0) {
    const j = w.line - (x - CX) / 2;
    base = TOP_Y + w.line + j;
    drop = dropAt(w.line + 0.5, clampT(j));
  } else {
    const i = w.line + (x - CX) / 2;
    base = TOP_Y + i + w.line;
    drop = dropAt(clampT(i), w.line + 0.5);
  }
  return { top: base - WALL_H, bottom: base + drop };
}

const pieceX = (p) => [runX(p[0])[0], runX(p[p.length - 1])[1]];
// the run of a piece that's at screen x
const runAtX = (p, x) => (p.length > 1 && x > runX(p[0])[1] ? p[1] : p[0]);

// Keep a wall thing (w x h, placed by its middle) on a wall: the nearest spot
// on any wall it fits on. Wall pictures are slanted to match their wall,
// so only the middle line matters for how high and low they can go.
// Returns { x, y, side, bottom } (side -1 = a left wall, 1 = a right wall;
// bottom = where that wall meets the floor), or null if no wall is big enough.
export function clampToWall(x, y, w, h) {
  let best = null;
  for (const p of pieces) {
    const [x0, x1] = pieceX(p);
    const lo = x0 + w / 2 + 2;
    const hi = x1 - w / 2 - 2;
    if (lo > hi) continue;
    const nx = Math.min(hi, Math.max(lo, x));
    const run = runAtX(p, nx);
    const edge = runEdges(run, nx);
    const top = edge.top + h / 2 + 2;
    const bottom = edge.bottom - h / 2 - 2;
    const ny = Math.min(Math.max(y, top), Math.max(top, bottom));
    const d = Math.hypot(nx - x, ny - y);
    if (!best || d < best.d) best = { x: nx, y: ny, side: run.side, bottom: edge.bottom, d };
  }
  return best;
}

// Which wall a screen spot is on: { side, bottom } (see clampToWall).
export const wallInfo = (x, y) => clampToWall(x, y, 0, 0) ?? { x, y, side: x < CX ? -1 : 1, bottom: y };

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
// nearest; not on the steps), snapped to whole units. Returns where its
// picture's bottom-middle goes, plus that floor's `drop`.
// With `span: true` (stairs), the piece may also sit across the join between
// rooms: it only has to be on floor everywhere, whichever rooms that is.
// `low` ('i' or 'j') says which end is its bottom, so it takes that end's floor level.
export function clampFootprint(x, y, a, b, margin = 1, { span = false, low = null } = {}) {
  if (span) return clampSpanning(x, y, a, b, margin, low);
  let best = null;
  for (const room of rooms) {
    const area = room.stairs ? { ...room, i0: room.i0 + STAIRS } : room;
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

// Is there floor (not the steps into the lower room) at (i, j)?
const placeable = (i, j) => {
  const r = roomOf(i, j);
  return Boolean(r) && !(r.stairs && i < r.i0 + STAIRS);
};

// Is every bit of an a x b piece at (i0, j0), plus a margin all round, on floor?
function covered(i0, j0, a, b, m) {
  const x1 = i0 + a + m;
  const y1 = j0 + b + m;
  for (let i = i0 - m; ; i = Math.min(i + 2, x1)) {
    for (let j = j0 - m; ; j = Math.min(j + 2, y1)) {
      if (!placeable(i, j)) return false;
      if (j >= y1) break;
    }
    if (i >= x1) break;
  }
  return true;
}

// The nearest spot (looking outward ring by ring) where the piece is on floor all over.
function clampSpanning(x, y, a, b, margin, low) {
  const f = footprintAt(x, y, a, b, 0);
  const ti = Math.round(f.i0);
  const tj = Math.round(f.j0);
  for (let r = 0; r <= 70; r++) {
    let best = null;
    for (let di = -r; di <= r; di++) {
      for (let dj = -r; dj <= r; dj++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const d = di * di + dj * dj;
        if (best && d >= best.d) continue;
        if (covered(ti + di, tj + dj, a, b, margin)) best = { i: ti + di, j: tj + dj, d };
      }
    }
    if (best) {
      const { i, j } = best;
      const [si, sj] = low === 'i' ? [i + a - 1, j + b / 2] : low === 'j' ? [i + a / 2, j + b - 1] : [i + a / 2, j + b / 2];
      const drop = dropAt(si, sj);
      const back = fromFloor(i, j);
      return { x: back.x + (a - b), y: back.y + (a + b) + SHADOW_DROP + drop, drop, d: 0 };
    }
  }
  return null;
}

setLayout();


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

// Draws the house (the floor you're on). `style` = { wallpaper, floors }
// where floors has one flooring id per room key (ids from
// src/data/homeStyles.js; anything missing uses the defaults).
// Returns the Graphics, so the scene can redraw it after you redecorate.
export function drawRoom(scene, style = {}) {
  const g = scene.add.graphics().setDepth(0);
  const paper = WALLPAPERS[style.wallpaper] ?? WALLPAPERS[DEFAULT_WALLPAPER];
  const floorOf = (room) => FLOORS[style.floors?.[room]] ?? FLOORS[DEFAULT_FLOORS[room] ?? ADDON_FLOOR];
  const P = (i, j, d = 0) => {
    const p = fromFloor(i, j);
    return { x: p.x, y: p.y + d };
  };
  const quad = (pts, color) => g.fillStyle(color, 1).fillPoints(pts, true);
  // The front face of a floor edge from a to b (screen points), hanging from d0 down to d1 pixels.
  const face = (a, b, d0, d1, color) => quad([{ x: a.x, y: a.y + d0 }, { x: b.x, y: b.y + d0 }, { x: b.x, y: b.y + d1 }, { x: a.x, y: a.y + d1 }], color);

  // a soft pool of dark around the house
  const box = houseBounds();
  const x0 = Math.min(0, box.x - 900);
  const y0 = Math.min(0, box.y - 900);
  g.fillStyle(0x0d0a12, 0.35).fillRect(x0, y0, Math.max(GAME_WIDTH, box.x + box.width + 900) - x0, Math.max(GAME_HEIGHT, box.y + box.height + 900) - y0);

  // ----- the walls -----
  // Drawn in 2-unit (4 pixel) columns. at(t) is the wall's bottom point t
  // units along it, drop(t) how far the floor under that column has dropped.
  const wall = (t0, t1, at, drop, light, height = WALL_H) => {
    const A = tone(paper.a, light);
    const B = tone(paper.b, light);
    for (let t = t0; t < t1; t += 2) {
      const d = drop(t);
      const p0 = at(t);
      const p1 = at(t + 2);
      const top0 = { x: p0.x, y: p0.y - height };
      const top1 = { x: p1.x, y: p1.y - height };
      const bot0 = { x: p0.x, y: p0.y + d };
      const bot1 = { x: p1.x, y: p1.y + d };
      const stripe = Math.floor(t / 4) % 2;
      quad([top0, top1, bot1, bot0], paper.pattern === 'stripes' && stripe ? B : A);
      // the pattern on top
      const xm = Math.min(p0.x, p1.x) + 1;
      const yAt = (dy) => Math.round((top0.y + top1.y) / 2 + dy);
      const H = height + d - 7; // down to the skirting board
      // a slanted strip across this column, dy pixels below the top and h tall
      const band = (dy, h, color) => quad([{ x: p0.x, y: top0.y + dy }, { x: p1.x, y: top1.y + dy }, { x: p1.x, y: top1.y + dy + h }, { x: p0.x, y: top0.y + dy + h }], color);
      // a 1-pixel upright line at this column's left edge, from dy0 to dy1 below the top
      const joint = (dy0, dy1, color) => g.fillStyle(color, 1).fillRect(p0.x, top0.y + dy0, 1, Math.max(0, Math.min(dy1, H) - dy0));
      const C = paper.c === undefined ? B : tone(paper.c, light);
      if (paper.pattern === 'dots' && t % 4 === 0) {
        for (let dy = 9 + ((t / 4) % 2) * 6; dy < height + d - 12; dy += 12) g.fillStyle(B, 1).fillRect(xm, yAt(dy), 2, 2);
      } else if (paper.pattern === 'stars') {
        for (let dy = 8; dy < height + d - 12; dy += 7) {
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
      if (f.pattern === 'carpet') {
        // soft carpet: one flat color with tiny darker and lighter flecks, no seams
        quad([P(i0, b0, d), P(i1, b0, d), P(i1, b1, d), P(i0, b1, d)], f.a);
        for (let j = b0; j < b1; j++)
          for (let i = i0; i < i1; i++) {
            const h = hash(i * 7 + 3, j * 13 + 5);
            if (h < 0.1 || h > 0.93) {
              const p = P(i, j, d);
              g.fillStyle(h < 0.1 ? f.b : f.line, 1).fillRect(p.x, p.y, 2, 1);
            }
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


  // One wall run: left walls along j (lit a little less), right walls along i.
  // t counts along the wall the way it always did, so the wallpaper pattern
  // in the living room lines up just like before.
  const drawRun = (w) => {
    const height = WALL_H;
    if (w.side < 0) {
      // left wall at i = line, drawn from its far (front) end back toward the corner
      wall(LEFT_END - w.t1, LEFT_END - w.t0, (t) => P(w.line, LEFT_END - t), (t) => dropAt(w.line + 0.5, LEFT_END - t - 1), 1, height);
    } else {
      wall(w.t0, w.t1, (t) => P(t, w.line), (t) => dropAt(t + 1, w.line + 0.5), 1.12, height);
    }
  };
  // the cut end of a wall, a few pixels thick (toward -x or +x)
  const cap = (p, d, height, dir) => {
    const x2 = p.x + 3 * dir;
    quad([{ x: p.x, y: p.y - height }, { x: x2, y: p.y - height + 1 }, { x: x2, y: p.y + d + 1 }, { x: p.x, y: p.y + d }], TRIM);
  };

  // ----- the walls (behind everything) -----
  for (const w of walls) drawRun(w);

  // ----- the floors -----
  for (const r of rooms) {
    const f = floorOf(r.key);
    if (r.stairs) {
      // three steps down, then the rest of the room
      for (let k = 0; k < 3; k++) {
        const i0 = r.i0 + 2 * k;
        const d = STEP * (k + 1);
        face(P(i0, r.j0), P(i0, r.j1), d - STEP, d, FACE_R); // the riser below the step above
        quad([P(i0, r.j0, d), P(i0 + 2, r.j0, d), P(i0 + 2, r.j1, d), P(i0, r.j1, d)], tone(f.a, 1.08));
      }
      face(P(r.i0 + STAIRS, r.j0), P(r.i0 + STAIRS, r.j1), 3 * STEP, r.drop, FACE_R); // the last riser
      floorPatch(f, r.i0 + STAIRS, r.j0, r.i1, r.j1, r.drop);
    } else {
      floorPatch(f, r.i0, r.j0, r.i1, r.j1, r.drop);
    }
  }

  // ----- the front edges of the floors -----
  // Along each room's two front edges, 2 units at a time: open to the dark
  // outside = the thick edge of the floor; a lower room in front = a step
  // down; a room on the same level = nothing at all (the floor just carries on).
  const edges = [];
  for (const r of rooms) {
    for (let i = r.i0; i < r.i1; i += 2) edges.push({ r, a: [i, r.j1], b: [i + 2, r.j1], own: [i + 1, r.j1 - 0.5], next: [i + 1, r.j1 + 0.5], color: FACE_L });
    for (let j = r.j1; j > r.j0; j -= 2) edges.push({ r, a: [r.i1, j], b: [r.i1, j - 2], own: [r.i1 - 0.5, j - 1], next: [r.i1 + 0.5, j - 1], color: FACE_R });
  }
  for (const e of edges) {
    const d = dropAt(...e.own);
    const next = roomOf(...e.next);
    const a = P(...e.a);
    const b = P(...e.b);
    if (!next) {
      face(a, b, d, e.r.drop + DEPTH, e.color);
      g.lineStyle(1, EDGE_LINE, 1).lineBetween(a.x, a.y + d, b.x, b.y + d);
    } else if (next !== e.r) {
      const nd = dropAt(...e.next);
      if (nd > d) face(a, b, d, nd, e.color);
    }
  }

  // ----- corners and the cut ends of walls -----
  for (const p of pieces) {
    const [first, last] = [p[0], p[p.length - 1]];
    if (p.length > 1) {
      const c = P(first.line, first.t0); // where the two walls meet
      g.lineStyle(1, TRIM, 1).lineBetween(c.x, c.y - WALL_H, c.x, c.y);
    }
    // the far left end of the piece, and the far right end
    const l = first.side < 0 ? [first.line, first.t1] : [first.t0, first.line];
    const rt = last.side < 0 ? [last.line, last.t0] : [last.t1, last.line];
    cap(P(...l), dropAt(l[0] + 0.5, l[1] - 0.5), WALL_H, -1);
    cap(P(...rt), dropAt(rt[0] - 0.5, rt[1] + 0.5), WALL_H, 1);
  }
  return g;
}
