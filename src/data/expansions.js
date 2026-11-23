// How your home is built: the kinds of rooms, and the LAYOUTS you can buy at
// Timber & Twig's Build counter (src/scenes/ShopScene.js, woodshop only).
//
// A layout is a ready-made set of rooms. Players can't move rooms around:
// customizing the home's shape is just buying (and switching between) layouts
// here, which keeps every home easy to walk around and decorate.
//   - a layout says which rooms you get and where they are (rooms are fixed
//     sizes, ROOM_KINDS); the living room is always at 0, 0 but each layout
//     picks how big it is (`main`);
//   - every floor is at the same level with no stairs, so nothing can break
//     (the code for raised floors and steps is still in src/world/IsoRoom.js,
//     unused, in case we want it back);
//   - tools/check-layouts.js checks every layout follows the rules (rooms
//     don't overlap and each one shares a doorway with another room).
// Switching layouts never deletes furniture: whatever no longer has a floor
// or wall goes back to "Your things".
//
// Saved in gameState: home.layoutId (the layout you're using), home.layoutsOwned,
// and home.addons (that layout's rooms: [{ uid, kind, at: { i, j } }]).
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
  entry: { name: 'Entryway', size: [32, 20], drop: 0, floor: 'floor-slate' },
  arm: { name: 'Bedroom', size: [64, 64], drop: 0, floor: 'floor-oak' }, // a quarter of the L-shaped home's big square
  garden: { name: 'Garden', size: [144, 48], drop: 0, floor: 'floor-grass', open: true }, // grass, no walls; as wide as the living room and both wings
  alcove: { name: 'Wing', size: [32, 80], drop: 0, floor: 'floor-oak' }, // as deep as the living room, so it lines up beside it
  lower: { name: 'Side Room', size: [40, 42], drop: 0, floor: 'floor-oak' }, // (from older saves; no layout uses it now)
};
export const ROOM_SIZE = Object.fromEntries(Object.entries(ROOM_KINDS).map(([k, v]) => [k, v.size]));

// The layouts. `rooms` start where `at` says (the living room is at 0, 0 and
// is always there). Positions follow the rules above (checked by
// tools/check-layouts.js). `glimmers` is the price (0 = free, everyone has it).
const room = (uid, kind, i, j, name) => ({ uid, kind, at: { i, j }, ...(name ? { name } : {}) });
// `main` = how big the living room is in this layout (floor units, it starts at 0, 0).
export const LAYOUTS = {
  cottage: {
    name: 'Cozy Cottage',
    glimmers: 0,
    desc: 'The home everyone starts with: one big square living room and a little entryway on the corner.',
    main: [88, 88],
    door: { j: 98 }, // the front door goes on the entryway's wall (the left wall, this far along)
    rooms: [room('entry', 'entry', 0, 88)], // the front-left corner of the living room
  },
  lshape: {
    name: 'L-Shaped Home',
    glimmers: 35,
    desc: 'A big square home with one quarter missing: the living room across the back and a bedroom on one side.',
    main: [128, 64], // the back half of the square (the missing quarter is the front-right)
    door: { j: 64 }, // in the middle of the long left wall
    rooms: [room('bedroom', 'arm', 0, 64, 'Bedroom')],
  },
  courtyard: {
    name: 'Courtyard',
    glimmers: 60,
    desc: 'The living room with a wing on each side, all around a grassy garden out front. Plant it however you like!',
    main: [80, 80],
    door: { line: -32, j: 40 }, // on the west wing's outer wall
    rooms: [room('garden', 'garden', -32, 80, 'Garden'), room('wing-w', 'alcove', -32, 0, 'West Wing'), room('wing-e', 'alcove', 80, 0, 'East Wing')],
  },
};
export const STARTER_LAYOUT = 'cottage';
// Bump this whenever a layout's rooms or sizes change: homes using it get the new rooms
// (furniture that no longer fits goes back to "Your things").
export const LAYOUT_REV = 9;

// Where the front door goes in a layout: on a left wall (at i = `line`, default 0), `j` units along it.
export const layoutDoor = (id) => (LAYOUTS[id] ?? LAYOUTS[STARTER_LAYOUT]).door ?? { j: Math.round(layoutMain(id)[1] * 0.45) };

// How big the living room is in a layout.
export const layoutMain = (id) => (LAYOUTS[id] ?? LAYOUTS[STARTER_LAYOUT]).main ?? [64, 64];

// The rooms of a layout, ready to save: [{ uid, kind, at: { i, j } }].
export function layoutRooms(id) {
  return (LAYOUTS[id] ?? LAYOUTS[STARTER_LAYOUT]).rooms.map((r) => ({ uid: r.uid, kind: r.kind, at: { ...r.at } }));
}

// What a room is called: the layout's own name for it ("Lantern Loft"), else its kind's.
export function roomLabel(layoutId, uid, kind) {
  return (LAYOUTS[layoutId] ?? LAYOUTS[STARTER_LAYOUT]).rooms.find((r) => r.uid === uid)?.name ?? ROOM_KINDS[kind]?.name ?? 'Room';
}
