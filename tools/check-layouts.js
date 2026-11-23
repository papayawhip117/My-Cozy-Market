// Checks that every home layout (src/data/expansions.js) follows the building
// rules: no overlaps, every room joined by a doorway, raised rooms behind.
//   node tools/check-layouts.js
import { LAYOUTS, ROOM_KINDS, layoutRooms } from '../src/data/expansions.js';
import { setLayout, currentRooms, checkRoom } from '../src/world/IsoRoom.js';
import { neededStairs } from '../src/world/AutoStairs.js';

let bad = 0;
for (const [id, layout] of Object.entries(LAYOUTS)) {
  const rects = layoutRooms(id).map((a) => ({ key: a.uid, kind: a.kind, i0: a.at.i, j0: a.at.j, i1: a.at.i + ROOM_KINDS[a.kind].size[0], j1: a.at.j + ROOM_KINDS[a.kind].size[1] }));
  setLayout(rects);
  const all = currentRooms();
  for (const r of all.filter((x) => x.key !== 'main')) {
    const res = checkRoom(r, all.filter((x) => x !== r));
    if (!res.ok) {
      bad++;
      console.log(`${id}: ${r.key} -> ${res.why}`);
    }
  }
  console.log(`${id}: ${all.length} rooms, stairs: ${neededStairs().length}`);
}
process.exit(bad ? 1 : 0);
