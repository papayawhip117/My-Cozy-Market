// How your home is built: the kinds of rooms, and the LAYOUTS you can buy at
// Timber & Twig's Build counter (src/scenes/ShopScene.js, woodshop only).
//
// A layout is a set of rooms with rules, so your home can't be broken:
//   - it says which rooms you get (and how many), and where they start;
//   - rooms are fixed sizes and heights (ROOM_KINDS), the living room never moves;
//   - in the floor plan (src/ui/FloorPlan.js) you can drag the other rooms
//     around, but each one has to touch the house through a doorway
//     (DOOR_MIN of shared wall), can't overlap another room, and a RAISED room
//     has to sit behind the room it opens onto, so stairs can climb up to it.
//     Stairs are added for you wherever rooms at different heights join
//     (src/world/AutoStairs.js).
// Switching layouts never deletes furniture: whatever no longer has a floor
// or wall goes back to "Your things".
//
// Saved in gameState: home.layout (the layout you're using), home.layoutsOwned,
// and home.addons (the rooms right now: [{ uid, kind, at: { i, j } }]).
//
// BUILD_OPEN: while false, regular players see everything on the counter but
// can't buy yet (testers and `npm run dev` can).
export const BUILD_OPEN = false;

// The Top Floor / lofts have a floor this many pixels higher (as high as the
// long and spiral stairs climb, see src/data/stairs.js).
export const TOP_RAISE = 26;

// Room kinds. size = [across (i), deep (j)] in floor units (the living room is
// 64 x 64). drop = how many pixels lower the floor is (negative = raised).
// open = no walls (a garden). floor = the flooring it starts with (an id from
// src/data/homeStyles.js).
export const ROOM_KINDS = {
  entry: { name: 'Entryway', size: [20, 20], drop: 0, floor: 'floor-slate' },
  lower: { name: 'Lower Room', size: [40, 42], drop: 12, floor: 'floor-oak' },
  nook: { name: 'Nook', size: [28, 28], drop: 0, floor: 'floor-oak' },
  parlor: { name: 'Parlor', size: [44, 44], drop: 0, floor: 'floor-oak' },
  garden: { name: 'Garden', size: [44, 44], drop: 0, floor: 'floor-slate', open: true },
  loft: { name: 'Loft', size: [40, 40], drop: -TOP_RAISE, floor: 'floor-oak' },
  attic: { name: 'Attic', size: [28, 28], drop: -TOP_RAISE, floor: 'floor-oak' },
};
export const ROOM_SIZE = Object.fromEntries(Object.entries(ROOM_KINDS).map(([k, v]) => [k, v.size]));

// The layouts. `rooms` start where `at` says (the living room is at 0, 0 and
// is always there). Positions follow the rules above (checked by
// tools/check-layouts.js). `glimmers` is the price (0 = free, everyone has it).
const room = (uid, kind, i, j, name) => ({ uid, kind, at: { i, j }, ...(name ? { name } : {}) });
export const LAYOUTS = {
  cottage: {
    name: 'Cozy Cottage',
    glimmers: 0,
    desc: 'The home everyone starts with: a living room, a stone entryway and a sunken lower room.',
    rooms: [room('entry', 'entry', 0, 64), room('lower', 'lower', 64, 0)],
  },
  tower: {
    name: 'Tower',
    glimmers: 45,
    desc: 'A living room with stairs up to a raised loft.',
    rooms: [room('loft', 'loft', 12, -40, 'Loft')],
  },
  courtyard: {
    name: 'Courtyard',
    glimmers: 60,
    desc: 'A stone garden out front with a cozy nook on each side.',
    rooms: [room('garden', 'garden', 10, 64), room('nook-w', 'nook', -18, 72, 'West Nook'), room('nook-e', 'nook', 54, 72, 'East Nook')],
  },
  mushroom: {
    name: 'Mushroom Cottage',
    glimmers: 30,
    desc: 'A snug cottage with a little nook and a toadstool attic.',
    rooms: [room('nook', 'nook', 64, 8), room('attic', 'attic', -28, 18, 'Toadstool Attic')],
  },
  treehouse: {
    name: 'Treehouse Nook',
    glimmers: 40,
    desc: 'Climb up to a cozy raised nook tucked behind the living room, and an entryway.',
    rooms: [room('attic', 'attic', 18, -28, 'Treehouse'), room('entry', 'entry', 0, 64)],
  },
  teahouse: {
    name: 'Tea House',
    glimmers: 25,
    desc: 'A big parlor for tea parties, with an entryway.',
    rooms: [room('parlor', 'parlor', 64, 10, 'Tea Room'), room('entry', 'entry', 0, 64)],
  },
  lantern: {
    name: 'Lantern Loft',
    glimmers: 50,
    desc: 'A raised loft above the living room and a nook off to the side.',
    rooms: [room('loft', 'loft', 12, -40, 'Lantern Loft'), room('nook', 'nook', 64, 20)],
  },
  greenhouse: {
    name: 'Greenhouse Wing',
    glimmers: 35,
    desc: 'A garden wing to the side of the living room, and an entryway.',
    rooms: [room('garden', 'garden', 64, 10, 'Greenhouse'), room('entry', 'entry', 0, 64)],
  },
};
export const STARTER_LAYOUT = 'cottage';

// The rooms of a layout, ready to save: [{ uid, kind, at: { i, j } }].
export function layoutRooms(id) {
  return (LAYOUTS[id] ?? LAYOUTS[STARTER_LAYOUT]).rooms.map((r) => ({ uid: r.uid, kind: r.kind, at: { ...r.at } }));
}

// What a room is called: the layout's own name for it ("Lantern Loft"), else its kind's.
export function roomLabel(layoutId, uid, kind) {
  return (LAYOUTS[layoutId] ?? LAYOUTS[STARTER_LAYOUT]).rooms.find((r) => r.uid === uid)?.name ?? ROOM_KINDS[kind]?.name ?? 'Room';
}
