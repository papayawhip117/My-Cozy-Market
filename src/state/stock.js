import { SHOP_STOCK } from '../config.js';
import { forSaleNow } from './catalog.js';
import { SHOW_EVERYTHING } from './seasons.js';

// Stock rotation: shops don't sell everything at once. Every
// ROTATION_MINUTES all the shops restock together, each putting a random
// selection of its things on the shelves.
//
// Shops should always look FULL, so it's done tab by tab (each `cat`, like
// Lamps or Tops): a tab always shows at least MIN_PER_TAB things (a whole
// row of the grid), or all of them if it has fewer, and big tabs show about
// SHELF_SHARE of theirs. Every catalogue book is made of tabs, so no book
// ever looks empty. Small tabs show everything until we add more to them;
// rotation kicks in by itself as tabs grow.
//
// There's no server keeping time: the shelves are worked out from the
// clock. Rotation number = minutes since 1970 / ROTATION_MINUTES, and that
// number seeds the dice, so every player sees the same shelves at the same
// time, and coming back to a shop shows the same things until the restock.
//
// Each restock is random, but every tab big enough to rotate always brings
// at least one thing that wasn't out last time (see pickShelf). Out-of-season things
// never go on the shelves (src/state/seasons.js).
//
//   stockNow('plants')      -> the plant shop's items on the shelves right now
//   isNew('plants', 'tulips') -> true if it arrived in this restock
//   minutesToRestock()      -> 12
//   rotationNumber()        -> changes by 1 every restock (to notice one happening)
//
// Testing (npm run dev only):
//   While SHOW_EVERYTHING is on (seasons.js), rotation is OFF and every shop
//   sells everything. In a shop, press T to turn rotation on/off (to see
//   the shelves the way players do), and R to skip ahead to the next
//   restock. Or in the browser console: pawPalStock.toggle(), pawPalStock.restock().

export const ROTATION_MINUTES = 25;
export const SHELF_SHARE = 0.75; // big tabs show about 3 in 4 of their things...
export const MIN_PER_TAB = 4; // ...and every tab shows at least this many (one full row)

const PERIOD_MS = ROTATION_MINUTES * 60 * 1000;

// Dev controls. On the live site rotation is always on.
let rotating = !SHOW_EVERYTHING;
let skipped = 0; // restocks skipped ahead with R

export function rotationOn() {
  return rotating;
}

export const devStock = {
  toggle() {
    if (import.meta.env.DEV) rotating = !rotating;
    return rotating;
  },
  restock() {
    if (import.meta.env.DEV) skipped += 1;
    return rotationNumber();
  },
};

export function rotationNumber(now = Date.now()) {
  return Math.floor(now / PERIOD_MS) + skipped;
}

export function minutesToRestock(now = Date.now()) {
  return Math.max(1, Math.ceil((PERIOD_MS - (now % PERIOD_MS)) / 60000));
}

// ---------- the dice ----------

// A string -> a number to seed with.
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Seeded random numbers (mulberry32): the same seed rolls the same numbers.
function dice(seed) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickOne = (roll, list) => list[Math.floor(roll() * list.length)];

function pickSome(roll, list, n) {
  const bag = [...list];
  const out = [];
  while (out.length < n && bag.length) out.push(bag.splice(Math.floor(roll() * bag.length), 1)[0]);
  return out;
}

// ---------- the shelves ----------

// How a restock is picked, so there's always something new without having
// to remember past restocks:
//
// (This runs once per tab; "the shop's things" below means the tab's.)
// The shop's things are split into two halves (every other one). Restock n
// rolls a full shelf of random things from everything, except one thing
// from the OTHER half that's held back. Then it picks a "headliner" from
// its own half (n%2) that wasn't on restock n-1's rolled shelf (the held-back
// thing guarantees there's one), and swaps it in if it isn't already there.
// Restock n-1's own headliner came from the other half, so it can't be this
// one either: the headliner is always new. And restock n-1's rolled shelf
// can be rolled again from its number whenever we need it.

function rolledShelf(shopId, pool, n, size) {
  const roll = dice(`${shopId}:${n}:shelf`);
  const otherHalf = pool.filter((_, i) => i % 2 !== n % 2);
  const held = pickOne(roll, otherHalf);
  return pickSome(roll, pool.filter((id) => id !== held), size);
}

function pickShelf(shopId, pool, n, size) {
  const roll = dice(`${shopId}:${n}:headliner`);
  const before = rolledShelf(shopId, pool, n - 1, size);
  const shelf = rolledShelf(shopId, pool, n, size);
  const headliner = pickOne(roll, pool.filter((id, i) => i % 2 === n % 2 && !before.includes(id)));
  if (!shelf.includes(headliner)) shelf[Math.floor(roll() * shelf.length)] = headliner;
  return new Set(shelf);
}

// Ids that can go on the shelves (in season), sorted by tab, in SHOP_STOCK order:
//   { lamps: ['bedside-lamp', ...], chairs: [...] }
function poolsFor(shopId) {
  const pools = {};
  for (const item of SHOP_STOCK[shopId] ?? []) {
    if (forSaleNow(item.id)) (pools[item.cat] ??= []).push(item.id);
  }
  return pools;
}

function shelfSize(pool) {
  return Math.max(MIN_PER_TAB, Math.round(pool.length * SHELF_SHARE));
}

// The ids on a shop's shelves at restock n (null = everything, rotation off).
function shelfIds(shopId, n) {
  if (!rotating) return null;
  const ids = new Set();
  for (const [cat, pool] of Object.entries(poolsFor(shopId))) {
    const size = shelfSize(pool);
    const shelf = pool.length <= size ? pool : pickShelf(`${shopId}:${cat}`, pool, n, size); // small tab: all of it
    for (const id of shelf) ids.add(id);
  }
  return ids;
}

// The items on a shop's shelves right now, in SHOP_STOCK order.
// With rotation off (testing) that's everything the shop has.
export function stockNow(shopId) {
  const all = SHOP_STOCK[shopId] ?? [];
  const ids = shelfIds(shopId, rotationNumber());
  return ids ? all.filter((item) => ids.has(item.id)) : all;
}

// Is this item on the shelves now?
export function inStock(shopId, id) {
  return stockNow(shopId).some((item) => item.id === id);
}

// Did it arrive in this restock (it wasn't out last time)?
export function isNew(shopId, id) {
  const n = rotationNumber();
  const now = shelfIds(shopId, n);
  if (!now) return false;
  return now.has(id) && !shelfIds(shopId, n - 1).has(id);
}
