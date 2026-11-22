import { SHOP_STOCK, SHOP_TABS, RETIRED_ITEMS, FIXTURE_ART } from '../config.js';
import { CATALOGUES, ALL_BOOK } from '../data/catalogues.js';
import { WALLPAPERS, FLOORS, DOORS, styleKind } from '../data/homeStyles.js';
import { inSeason } from './seasons.js';
import { WALL_ART } from '../data/furniture.js';

// Look things up by id across every shop's stock (SHOP_STOCK in config.js),
// plus things no shop sells any more (RETIRED_ITEMS) so old saves still work.
//
//   findItem('matcha-latte')    -> { id, name, price, desc }  (or undefined)
//   itemName('matcha-latte')    -> 'Matcha Latte'
//   sellPrice('matcha-latte')   -> 4   (half price, at least 1 coin)
//   costOf(item)                -> { coins: 120, glimmers: 0 }   (what it costs)
//   sellValue('cardigan')       -> { coins: 0, glimmers: 1 }     (what selling it gives you)
//   traitsOf('cardigan')        -> { tags: ['cottagecore', 'forest'], season: 'autumn', rarity: 'rare' }
//   forSaleNow('sunflowers')    -> false outside summer (seasonal things only sell in season)
//   itemTexture(scene, 'matcha-latte') -> 'item-matcha-latte' (its picture, or null if none)
//   booksFor('furniture', items) -> the shop's catalogue books, each with
//                                   its tabs and which of `items` are in it

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

// Things you can put in your home: everything from the furniture, plant and
// wood shops, except wallpaper, flooring and doors (those are put up, see isHomeStyle).
const DECOR_SHOPS = ['furniture', 'plants', 'woodshop'];
export function isDecor(id) {
  return DECOR_SHOPS.includes(SHOP_OF[id]) && !styleKind(id);
}

// Wallpaper, flooring or a front door: 'wallpaper', 'floor', 'door' or null.
export const isHomeStyle = styleKind;

// Decor that hangs on a wall (pictures, mirrors, shelves, curtains, hanging
// plants) instead of standing on the floor.
export function isWallItem(id) {
  if (id === 'door' || id === 'window') return true; // the door and windows hang on walls too
  const item = findItem(id);
  return isDecor(id) && (item?.cat === 'hanging' || item?.cat === 'wall');
}

// How many times bigger than its 16x16 picture an item is drawn in your home.
export function decorScale(id) {
  if (FIXTURE_ART[id] || WALL_ART[id]) return 1; // the door, windows, dresser, curtains and hanging plants are already drawn big
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

// What something costs: `price` coins and/or `glimmers` Glimmers.
export function costOf(itemOrId) {
  const item = typeof itemOrId === 'string' ? findItem(itemOrId) : itemOrId;
  return { coins: item?.price ?? 0, glimmers: item?.glimmers ?? 0 };
}

// Selling gives back half of each (rounded down). Something worth only
// coins always gives at least 1 coin.
export function sellValue(id) {
  const { coins, glimmers } = costOf(id);
  const back = { coins: Math.floor(coins / 2), glimmers: Math.floor(glimmers / 2) };
  if (!back.coins && !back.glimmers && !glimmers) back.coins = 1;
  return back;
}

// "12 coins", "3 Glimmers" or "120 coins and 2 Glimmers", for messages.
export function costText({ coins = 0, glimmers = 0 }) {
  const parts = [];
  if (coins) parts.push(`${coins.toLocaleString('en-US')} coin${coins === 1 ? '' : 's'}`);
  if (glimmers) parts.push(`${glimmers} Glimmer${glimmers === 1 ? '' : 's'}`);
  return parts.join(' and ') || 'nothing';
}

// An item's style tags, season and rarity (see SHOP_STOCK in config.js),
// with the defaults filled in for anything that doesn't say.
export function traitsOf(id) {
  const item = findItem(id);
  return { tags: item?.tags ?? [], season: item?.season ?? null, rarity: item?.rarity ?? 'common' };
}

// Can a shop sell this right now? Seasonal things only sell in their season.
export function forSaleNow(id) {
  return inSeason(traitsOf(id).season);
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

// ---------- catalogue books (src/data/catalogues.js) ----------

function inBook(item, book) {
  return book.id === ALL_BOOK.id || book.tabs.includes(item.cat) || (item.books ?? []).includes(book.id);
}

// A shop's catalogue books, for the items it has on the shelf right now
// (`items`, usually just some of SHOP_STOCK[shopId]):
//   [{ id, name, tabs: [{ id, label }], items: [...] }, ...]
// Books the shop has never had anything for are left out. A book can still
// be empty right now (nothing from it in `items`); its tabs are only the
// ones with something on them.
export function booksFor(shopId, items) {
  const everything = SHOP_STOCK[shopId] ?? [];
  const tabs = SHOP_TABS[shopId] ?? [];
  const label = (id) => tabs.find((t) => t.id === id)?.label ?? id[0].toUpperCase() + id.slice(1);
  let books = (CATALOGUES[shopId] ?? []).filter((book) => everything.some((item) => inBook(item, book)));
  if (books.length > 1) books = [...books, { ...ALL_BOOK, tabs: tabs.map((t) => t.id) }];
  if (books.length === 0) books = [{ ...ALL_BOOK, tabs: tabs.map((t) => t.id) }]; // a shop with no books: one of everything

  return books.map((book) => {
    const mine = items.filter((item) => inBook(item, book));
    // Tabs in the book's order. Items put in by `books` whose cat isn't one
    // of the book's tabs get a tab for their own cat.
    const tabIds = [...book.tabs];
    for (const item of mine) if (!tabIds.includes(item.cat)) tabIds.push(item.cat);
    return {
      id: book.id,
      name: book.name,
      items: mine,
      tabs: tabIds.filter((id) => mine.some((item) => item.cat === id)).map((id) => ({ id, label: label(id) })),
    };
  });
}
