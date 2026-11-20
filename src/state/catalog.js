import { SHOP_STOCK, RETIRED_ITEMS, FIXTURE_ART } from '../config.js';
import { WALLPAPERS, FLOORS, DOORS, styleKind } from '../data/homeStyles.js';

// Look things up by id across every shop's stock (SHOP_STOCK in config.js),
// plus things no shop sells any more (RETIRED_ITEMS) so old saves still work.
//
//   findItem('matcha-latte')    -> { id, name, price, desc }  (or undefined)
//   itemName('matcha-latte')    -> 'Matcha Latte'
//   sellPrice('matcha-latte')   -> 4   (half price, at least 1 coin)
//   itemTexture(scene, 'matcha-latte') -> 'item-matcha-latte' (its picture, or null if none)

const SOLD = [...Object.values(SHOP_STOCK).flat(), ...RETIRED_ITEMS];
// The wallpaper, floors and door every home starts with aren't sold, but
// they still need names and pictures for decorate mode.
const STARTERS = Object.entries({ ...WALLPAPERS, ...FLOORS, ...DOORS })
  .filter(([id]) => !SOLD.some((item) => item.id === id))
  .map(([id, style]) => ({ id, name: style.name, price: 0, desc: '' }));
const ALL_ITEMS = [...SOLD, ...STARTERS];

// Which shop sells what, so we can tell furniture and plants (home decor)
// from food and clothes.
const SHOP_OF = {};
for (const [shop, items] of Object.entries(SHOP_STOCK)) for (const item of items) SHOP_OF[item.id] = shop;

// Things you can put in your home: everything from the furniture and plant
// shops, except wallpaper, flooring and doors (those are put up, see isHomeStyle).
export function isDecor(id) {
  return (SHOP_OF[id] === 'furniture' || SHOP_OF[id] === 'plants') && !styleKind(id);
}

// Wallpaper, flooring or a front door: 'wallpaper', 'floor', 'door' or null.
export const isHomeStyle = styleKind;

// Decor that hangs on a wall (pictures, mirrors, hanging plants) instead of
// standing on the floor.
export function isWallItem(id) {
  if (id === 'door' || id === 'window') return true; // the door and windows hang on walls too
  const item = findItem(id);
  return isDecor(id) && (item?.cat === 'hanging' || (item?.cat === 'art' && id !== 'book-stack'));
}

// How many times bigger than its 16x16 picture an item is drawn in your home.
export function decorScale(id) {
  if (FIXTURE_ART[id]) return 1; // the door, windows and dresser are already drawn big
  const cat = findItem(id)?.cat;
  if (isWallItem(id)) return 2;
  if (cat === 'beds' || cat === 'tables' || cat === 'trees') return 3;
  return 2;
}

export function findItem(id) {
  return ALL_ITEMS.find((item) => item.id === id);
}

// Things not in any shop (like test items) get a name made from their id:
// 'mystery-box' -> 'Mystery Box'.
export function itemName(id) {
  return findItem(id)?.name ?? id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function sellPrice(id) {
  const price = findItem(id)?.price ?? 0;
  return Math.max(1, Math.floor(price / 2));
}

// Every item's picture (public/assets/item-<id>.png, drawn by tools/art/items.js).
// Call from a scene's preload().
export function preloadItems(scene) {
  for (const item of ALL_ITEMS) {
    const key = `item-${item.id}`;
    if (!scene.textures.exists(key)) scene.load.image(key, `assets/${key}.png`);
  }
}

// The texture key for an item's picture, or null if there isn't one loaded.
export function itemTexture(scene, id) {
  const key = `item-${id}`;
  return scene.textures.exists(key) ? key : null;
}

// How many of an item you have in your backpack.
export function countOf(items, id) {
  return items.filter((i) => i === id).length;
}
