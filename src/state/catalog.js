import { SHOP_STOCK } from '../config.js';

// Look things up by id across every shop's stock (SHOP_STOCK in config.js).
//
//   findItem('matcha-latte')  -> { id, name, price }  (or undefined)
//   itemName('matcha-latte')  -> 'Matcha Latte'
//   sellPrice('matcha-latte') -> 4   (half price, at least 1 coin)

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
