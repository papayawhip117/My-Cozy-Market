// What you can buy at Timber & Twig's "Build" counter: room add-ons for your
// home. (New buildings, like a cafe or florist, will come later.) Shown by
// src/scenes/ShopScene.js (woodshop only), remembered by gameState (home.addons).
//
// BUILD_OPEN: while false, regular players see everything on the counter but
// can't buy yet (testers and `npm run dev` can). Bought rooms wait in
// storage until you put them up at home (Decorate -> Rooms), see
// src/ui/RoomEditor.js.
export const BUILD_OPEN = false;

// Room add-ons can go on any side of your home. The main room can't be
// removed; add-ons can be taken away again (you keep them in storage).
// ROOM_SIZE = how big each kind is, in floor units (the living room is 64 x 64).
// The entryway and the lower room are rooms you can move too (they start out
// joined to the living room); only the living room stays put.
// The Top Floor is an ordinary room with a floor this many pixels higher
// (as high as the long and spiral stairs climb, see src/data/stairs.js).
export const TOP_RAISE = 26;
export const ROOM_SIZE = { small: [28, 28], big: [44, 44], top: [64, 64], entry: [20, 20], lower: [40, 42] };
export const ROOM_NAMES = { small: 'Small Room', big: 'Big Room', top: 'Top Floor', entry: 'Entryway', lower: 'Lower Room' };
// Where the entryway and lower room sit in every home that starts out the standard way.
export const STARTER_ROOMS = [
  { uid: 'entry', kind: 'entry', at: { i: 0, j: 64 } },
  { uid: 'lower', kind: 'lower', at: { i: 64, j: 0 } },
];
// Each room you own makes the next one cost more (ROOM_CURVE).
export const ROOM_CURVE = [20, 30, 45, 65, 90]; // Glimmers for your 1st, 2nd, 3rd... add-on
export const ADDONS = [
  { kind: 'small', name: 'Small Room', mult: 1, extra: 0, max: 6, desc: 'A cozy nook, tacked on to any side.' },
  { kind: 'big', name: 'Big Room', mult: 1.5, extra: 0, max: 4, desc: 'Lots of space for big furniture.' },
  { kind: 'top', name: 'Top Floor', mult: 1, extra: 15, max: 1, desc: 'A raised room. Join it on with stairs!' },
];

// What the next add-on of this kind costs, given how many you own already.
export function addonCost(kind, owned) {
  const a = ADDONS.find((x) => x.kind === kind);
  const base = ROOM_CURVE[Math.min(owned, ROOM_CURVE.length - 1)];
  return { glimmers: Math.ceil(base * a.mult) + a.extra };
}
