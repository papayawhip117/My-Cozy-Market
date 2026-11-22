// Stairs from Timber & Twig (src/data/woodshop.js, tab "Stairs"). They're
// floor things like furniture, with two extra tricks:
//
//   - they can sit across the join between two rooms (see `span` in
//     clampFootprint, src/world/IsoRoom.js), so stairs can connect rooms
//     that are on different levels, or make your home feel like a maze;
//   - your pal climbs them: her feet rise as she walks up (stairHeight).
//
// Stairs are how rooms at different heights connect (there's no separate
// upstairs: the Top Floor is just a raised room, TOP_RAISE = 26 pixels up).
// Put the foot of the stairs on the lower room's floor and the top on the
// higher one. The tall ones (`link: true`: long and spiral, 26 px) reach the
// raised Top Floor; short and medium ones (9 and 15 px) bridge the lower
// room (12 px down); any of them just add steps between level rooms.
//
// Straight stairs climb toward the back-left (toward smaller i, see
// IsoRoom.js); flipping them makes them climb toward the back-right.
// `rise` is how many pixels high the top step is, `steps` how many steps.
// The 3D pictures are drawn by tools/art/woodshop.js (STAIRS), sized by
// FOOTPRINT in src/data/furniture.js.

export const STAIRS = {
  'stairs-short': { steps: 3, rise: 9 },
  'stairs-medium': { steps: 5, rise: 15 },
  'stairs-long': { steps: 8, rise: 26, link: true },
  'stairs-spiral': { steps: 8, rise: 26, link: true, spiral: true },
};

export const isStairs = (id) => id in STAIRS;

// How far up the stairs a floor spot is: 0 at the bottom, 1 at the top, or
// null if the spot isn't on them. `box` is the patch of floor they cover,
// { i0, j0, i1, j1 } (HomeDecorator.sortDepths works it out).
export function stairProgress(id, flip, box, i, j) {
  if (i < box.i0 || i > box.i1 || j < box.j0 || j > box.j1) return null;
  if (STAIRS[id].spiral) {
    const r = (box.i1 - box.i0) / 2;
    const dist = Math.hypot(i - (box.i0 + box.i1) / 2, j - (box.j0 + box.j1) / 2);
    return Math.min(1, Math.max(0, (1 - dist / r) * 1.5));
  }
  return flip ? 1 - (j - box.j0) / (box.j1 - box.j0) : 1 - (i - box.i0) / (box.i1 - box.i0);
}

// How many pixels higher than the floor your pal stands at progress p
// (stepping up a whole step at a time, like the picture).
export function stairHeight(id, p) {
  const { steps, rise } = STAIRS[id];
  return (rise * Math.max(1, Math.ceil(p * steps - 1e-6))) / steps;
}

// Walking this far up (or, on the top floor, this far down the stairwell) takes you to the other floor.
export const GO_UP_AT = 0.85;
export const GO_DOWN_AT = 0.78;

// Where (i, j) is at progress p on these stairs: the inverse of stairProgress.
export function stairSpot(id, flip, box, p) {
  const mi = (box.i0 + box.i1) / 2;
  const mj = (box.j0 + box.j1) / 2;
  if (STAIRS[id].spiral) return { i: mi + (1 - p) * 3, j: mj };
  return flip ? { i: mi, j: box.j0 + (1 - p) * (box.j1 - box.j0) } : { i: box.i0 + (1 - p) * (box.i1 - box.i0), j: mj };
}
