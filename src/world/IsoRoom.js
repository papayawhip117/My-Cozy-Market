import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

// Your home as an isometric room: a diamond-shaped floor with a wall on each
// of the two back edges, seen from above at an angle.
//
//             top (240,120)
//            /            \\
//      left wall        right wall
//          /                \\
//   left (112,184)      right (368,184)
//          \\                /
//            bottom (240,248)
//
// Everything is measured in screen pixels, so a thing's position is just
// where it's drawn. Floor things stand on the floor by their bottom edge;
// wall things hang on the walls by their middle.

export const CX = GAME_WIDTH / 2; // 240: the middle of the screen
export const FLOOR_Y = 184; // the y of the floor's left and right corners
export const HALF_W = 128; // from the middle to the left/right corners
export const HALF_H = 64; // from the middle to the top/bottom corners
export const WALL_H = 72; // how tall the walls are
const TILES = 8; // the floor is 8 x 8 boards
const TILE_X = HALF_W / TILES; // 16
const TILE_Y = HALF_H / TILES; // 8

// The floor corners.
export const CORNER = {
  top: { x: CX, y: FLOOR_Y - HALF_H },
  right: { x: CX + HALF_W, y: FLOOR_Y },
  bottom: { x: CX, y: FLOOR_Y + HALF_H },
  left: { x: CX - HALF_W, y: FLOOR_Y },
};

// Floor coordinates (i, j) in boards -> screen position. (0,0) is the top
// corner, i grows toward the right corner, j toward the left corner.
export const iso = (i, j) => ({ x: CX + (i - j) * TILE_X, y: CORNER.top.y + (i + j) * TILE_Y });

// ---------- where things can go ----------

// How far out from the middle of the floor a point is: 1 = right on the edge.
const floorDistance = (x, y) => Math.abs(x - CX) / HALF_W + Math.abs(y - FLOOR_Y) / HALF_H;

export function onFloor(x, y) {
  return floorDistance(x, y) <= 1;
}

// Pull a point back inside the floor (`margin` pixels worth of room from the edge).
export function clampToFloor(x, y, margin = 6) {
  const limit = 1 - margin / HALF_H;
  const d = floorDistance(x, y);
  if (d <= limit) return { x, y };
  return { x: CX + ((x - CX) / d) * limit, y: FLOOR_Y + ((y - FLOOR_Y) / d) * limit };
}

// The wall's top and bottom edges at screen x (the left wall climbs toward
// the middle, the right wall slopes back down).
export function wallEdges(x) {
  if (x <= CX) return { top: CORNER.left.y - WALL_H - (x - CORNER.left.x) * 0.5, bottom: CORNER.left.y - (x - CORNER.left.x) * 0.5 };
  return { top: CORNER.top.y - WALL_H + (x - CX) * 0.5, bottom: CORNER.top.y + (x - CX) * 0.5 };
}

// Keep a wall thing (w x h, placed by its middle) inside the two walls.
export function clampToWall(x, y, w, h) {
  const nx = Math.min(CORNER.right.x - w / 2 - 2, Math.max(CORNER.left.x + w / 2 + 2, x));
  const a = wallEdges(nx - w / 2);
  const b = wallEdges(nx + w / 2);
  const top = Math.max(a.top, b.top) + h / 2 + 2;
  const bottom = Math.min(a.bottom, b.bottom) - h / 2 - 2;
  return { x: nx, y: Math.min(Math.max(y, top), Math.max(top, bottom)) };
}

// Which wall a screen x is on, as a slant for flat pictures: -1 left wall, 1 right.
export const wallSide = (x) => (x < CX ? -1 : 1);

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

// ---------- drawing the room ----------

const WOOD = [0x7a5a40, 0x70523a];
const WOOD_LINE = 0x4a3426;
const WALL_LEFT = [0x3f5148, 0x45594f];
const WALL_RIGHT = [0x4b6358, 0x526b60];
const TRIM = 0x2b1f1a;
const SKIRT = 0x5a3f2e;

export function drawRoom(scene) {
  const g = scene.add.graphics().setDepth(0);

  // a soft pool of dark around the room
  g.fillStyle(0x0d0a12, 0.35).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // The walls: striped wallpaper, a trim along the top and a skirting board.
  const wall = (x0, x1, colors, edges) => {
    for (let x = x0, k = 0; x < x1; x += 8, k++) {
      const xe = Math.min(x + 8, x1);
      const a = edges(x);
      const b = edges(xe);
      g.fillStyle(colors[k % 2], 1);
      g.fillPoints([{ x, y: a.top }, { x: xe, y: b.top }, { x: xe, y: b.bottom }, { x, y: a.bottom }], true);
      g.fillStyle(SKIRT, 1); // skirting board
      g.fillPoints([{ x, y: a.bottom - 7 }, { x: xe, y: b.bottom - 7 }, { x: xe, y: b.bottom }, { x, y: a.bottom }], true);
      g.fillStyle(TRIM, 1); // trim
      g.fillPoints([{ x, y: a.top }, { x: xe, y: b.top }, { x: xe, y: b.top + 3 }, { x, y: a.top + 3 }], true);
    }
  };
  wall(CORNER.left.x, CX, WALL_LEFT, wallEdges);
  wall(CX, CORNER.right.x, WALL_RIGHT, wallEdges);
  g.lineStyle(1, TRIM, 1).lineBetween(CX, CORNER.top.y - WALL_H, CX, CORNER.top.y); // the inside corner

  // The floor: wooden boards running along one direction, with a few seams.
  for (let j = 0; j < TILES; j++) {
    const p = [iso(0, j), iso(TILES, j), iso(TILES, j + 1), iso(0, j + 1)];
    g.fillStyle(WOOD[j % 2], 1);
    g.fillPoints(p, true);
    g.lineStyle(1, WOOD_LINE, 0.55).lineBetween(p[3].x, p[3].y, p[2].x, p[2].y);
    for (let i = 1 + ((j * 3) % 4); i < TILES; i += 3 + (j % 2)) {
      const a = iso(i, j);
      const b = iso(i, j + 1);
      g.lineStyle(1, WOOD_LINE, 0.4).lineBetween(a.x, a.y, b.x, b.y);
    }
  }

  // The thickness of the floor along its two front edges.
  const L = CORNER.left;
  const B = CORNER.bottom;
  const R = CORNER.right;
  g.fillStyle(0x3b2a1f, 1).fillPoints([L, B, { x: B.x, y: B.y + 9 }, { x: L.x, y: L.y + 9 }], true);
  g.fillStyle(0x2c1f17, 1).fillPoints([B, R, { x: R.x, y: R.y + 9 }, { x: B.x, y: B.y + 9 }], true);
  g.lineStyle(1, 0x1c1822, 1).strokePoints([L, B, R], false);
  return g;
}
