// What you can buy at Timber & Twig's "Build" counter: blueprints for new
// places, and room add-ons for your home. Shown by src/scenes/ShopScene.js
// (woodshop only), remembered by gameState (home.blueprints, home.addons).
//
// BUILD_OPEN: while false, regular players see everything on the counter but
// can't buy yet (testers and `npm run dev` can). The home doesn't draw the
// new rooms yet, so don't switch this on until it does.
export const BUILD_OPEN = false;

// Blueprints unlock a new building. A blueprint with `soon: true` is for a
// feature that isn't in the game yet, so it can't be bought, only looked at.
// Prices: new shops 150-300 Glimmers; the seasonal cart costs lots of coins.
export const BLUEPRINTS = [
  { id: 'bp-cart', name: 'Seasonal Cart', cost: { coins: 1500 }, soon: true, desc: 'A little cart selling things from this season only.' },
  { id: 'bp-florist', name: 'Florist', cost: { glimmers: 150 }, soon: true, desc: 'A flower shop. Build your own bouquets.' },
  { id: 'bp-cafe', name: 'Cozy Cafe', cost: { glimmers: 220 }, soon: true, desc: 'Brew drinks and serve visitors.' },
  { id: 'bp-pets', name: 'Pet Store', cost: { glimmers: 300 }, soon: true, desc: 'Adopt a critter to follow you around.' },
];

// Room add-ons can go on any side of your home. The main room can't be
// removed; add-ons can be taken away again (you keep them in storage).
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
