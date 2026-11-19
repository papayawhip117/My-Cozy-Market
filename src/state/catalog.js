import { SHOP_STOCK } from '../config.js';

// Look things up by id across every shop's stock (SHOP_STOCK in config.js).
//
//   findItem('matcha-latte')    -> { id, name, price, desc }  (or undefined)
//   itemName('matcha-latte')    -> 'Matcha Latte'
//   sellPrice('matcha-latte')   -> 4   (half price, at least 1 coin)
//   itemTexture(scene, 'matcha-latte') -> 'item-matcha-latte' (its picture, or null if none)

const ALL_ITEMS = Object.values(SHOP_STOCK).flat();

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
