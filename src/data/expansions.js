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
export const ROOM_SIZE = { small: 28, big: 44, top: 64 };
// Each room you own makes the next one cost more (ROOM_CURVE).
export const ROOM_CURVE = [20, 30, 45, 65, 90]; // Glimmers for your 1st, 2nd, 3rd... add-on
export const ADDONS = [
  { kind: 'small', name: 'Small Room', mult: 1, extra: 0, max: 6, desc: 'A cozy nook, tacked on to any side.' },
  { kind: 'big', name: 'Big Room', mult: 1.5, extra: 0, max: 4, desc: 'Lots of space for big furniture.' },
  { kind: 'top', name: 'Top Floor', mult: 1, extra: 15, max: 1, desc: 'A whole new floor above the house.' },
];

// What the next add-on of this kind costs, given how many you own already.
export function addonCost(kind, owned) {
  const a = ADDONS.find((x) => x.kind === kind);
  const base = ROOM_CURVE[Math.min(owned, ROOM_CURVE.length - 1)];
  return { glimmers: Math.ceil(base * a.mult) + a.extra };
}
