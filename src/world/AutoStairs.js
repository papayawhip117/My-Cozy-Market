import { currentRooms, joinKind, fromFloor, clampFootprint } from './IsoRoom.js';
import { FOOTPRINT } from '../data/furniture.js';

// Stairs that put themselves where rooms at different heights join.
//
// Whenever a raised room (a loft, an attic) sits behind the room it opens
// onto, or any two rooms at different heights share a doorway, the game puts
// a staircase across the join so your pal can walk between them. They're
// ordinary placed things (stairs-long, stairs-spiral or stairs-medium from
// src/data/stairs.js), saved in gameState.home.placed with `auto: true`, but
// they're locked in place: the floor plan (src/ui/FloorPlan.js) lets you
// swap Long for Spiral. syncAutoStairs() makes the list match the rooms; call
// it after setLayout() whenever rooms change.
//
// Straight stairs climb toward the back (smaller i, or flipped, smaller j),
// which is why a raised room has to sit behind the room it opens onto (see
// joinKind in src/world/IsoRoom.js).

const IN_HIGH = 12; // how far a straight flight reaches into the higher room (its top end)

// What a join needs: [{ uid, hi, lo, id, flip, x, y }] (x, y = where the picture stands).
export function neededStairs(stairKinds = {}) {
  const rooms = currentRooms();
  const out = [];
  for (let n = 0; n < rooms.length; n++) {
    for (let m = n + 1; m < rooms.length; m++) {
      const join = joinKind(rooms[n], rooms[m]);
      if (join?.kind !== 'stairs') continue;
      const { hi, lo, along } = join;
      const uid = `auto-${hi.key}-${lo.key}`;
      const diff = lo.drop - hi.drop; // 26 for a raised room, 12 for a sunken one
      const id = diff > 20 ? (stairKinds[uid] === 'stairs-spiral' ? 'stairs-spiral' : 'stairs-long') : 'stairs-medium';
      const spiral = id === 'stairs-spiral';
      const flip = along === 'j';
      const [a, b] = FOOTPRINT[id];
      const size = flip ? [b, a] : [a, b];
      // the doorway: where the two rooms' walls overlap, and its middle
      const mid = along === 'i' ? (Math.max(hi.j0, lo.j0) + Math.min(hi.j1, lo.j1)) / 2 : (Math.max(hi.i0, lo.i0) + Math.min(hi.i1, lo.i1)) / 2;
      const line = along === 'i' ? lo.i0 : lo.j0; // the join
      let i0;
      let j0;
      if (spiral) {
        i0 = along === 'i' ? line - size[0] / 2 : mid - size[0] / 2;
        j0 = along === 'i' ? mid - size[1] / 2 : line - size[1] / 2;
      } else if (along === 'i') {
        i0 = line - IN_HIGH;
        j0 = mid - size[1] / 2;
      } else {
        i0 = mid - size[0] / 2;
        j0 = line - IN_HIGH;
      }
      i0 = 2 * Math.round(i0 / 2);
      j0 = 2 * Math.round(j0 / 2);
      const back = fromFloor(i0, j0);
      const spot = clampFootprint(back.x + (size[0] - size[1]), back.y + (size[0] + size[1]) + 2 + lo.drop, size[0], size[1], 1, { span: true, low: spiral ? null : along });
      if (!spot) continue;
      out.push({ uid, hi: hi.key, lo: lo.key, id, flip, x: Math.round(spot.x), y: Math.round(spot.y) });
    }
  }
  return out;
}

// Make home.placed match: add the stairs the rooms need, move or swap ones that
// changed, and take away ones nothing needs any more. Returns true if anything changed.
export function syncAutoStairs(gameState) {
  const want = neededStairs(gameState.data.home.stairKinds);
  const placed = gameState.placed;
  let changed = false;
  for (let k = placed.length - 1; k >= 0; k--) {
    if (placed[k].auto && !want.some((w) => w.uid === placed[k].uid)) {
      placed.splice(k, 1);
      changed = true;
    }
  }
  for (const w of want) {
    const have = placed.find((p) => p.uid === w.uid);
    if (!have) {
      placed.push({ uid: w.uid, id: w.id, x: w.x, y: w.y, flip: w.flip, c1: null, c2: null, fixed: true, auto: true });
      changed = true;
    } else if (have.id !== w.id || have.x !== w.x || have.y !== w.y || Boolean(have.flip) !== w.flip) {
      Object.assign(have, { id: w.id, x: w.x, y: w.y, flip: w.flip });
      changed = true;
    }
  }
  if (changed) gameState.save();
  return changed;
}
