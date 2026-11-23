import { SHOP_STOCK } from '../config.js';
import { traitsOf, findItem } from '../state/catalog.js';

// Achievements: goals that send you a reward letter when you reach them
// (src/state/mailbox.js checks them every few seconds and whenever your
// coins or Glimmers change). See them in the mailbox's Achievements tab.
//
//   id      unique name (never change it, saves remember it)
//   name    short title
//   desc    what to do (keep it under about 28 letters so it fits)
//   target  the number to reach
//   count   (game, mail) -> how far along you are right now.
//           game = gameState (coins, glimmers, items, look, placed...)
//           mail = the mailbox, for counters: mail.stat('photos')
//   reward  { coins, glimmers, items: ['item-id', ...] }, sent by letter
//
// Most goals look at your save as it is now, so things you did before
// achievements existed count too. Counters (mail.stat) start at 0:
//   'photos'        photos snapped in the Photo Booth (PhotoBoothScene.snap)
//   'sold'          things sold back to a shop (ShopScene.sellNow)
//   'coinsSpent'    coins spent on anything (mailbox.js counts these itself)
//   'glimmersSpent' Glimmers spent on anything
//
// Reward items should be things that are always in the shops (not seasonal).

const ids = (shop) => new Set(SHOP_STOCK[shop].map((item) => item.id));
const PLANTS = ids('plants');
const WOOD = ids('woodshop');
const PJS = ids('pjs');

const owned = (game, set) => game.items.filter((id) => set.has(id)).length;
const worn = (game) => Object.values(game.look.worn).filter(Boolean);
const decorPlaced = (game) => game.placed.filter((p) => !p.fixed && !p.auto);

export const ACHIEVEMENTS = [
  // ---------- shopping ----------
  {
    id: 'first-find',
    name: 'First Find',
    desc: 'Get your very first thing',
    target: 1,
    count: (game) => game.items.length,
    reward: { coins: 50 },
  },
  {
    id: 'collector',
    name: 'Collector',
    desc: 'Own 25 things',
    target: 25,
    count: (game) => game.items.length,
    reward: { glimmers: 10 },
  },
  {
    id: 'treasure-trove',
    name: 'Treasure Trove',
    desc: 'Own 100 things',
    target: 100,
    count: (game) => game.items.length,
    reward: { glimmers: 25, items: ['lantern-lamp'] },
  },
  {
    id: 'big-spender',
    name: 'Big Spender',
    desc: 'Spend 2,000 coins',
    target: 2000,
    count: (game, mail) => mail.stat('coinsSpent'),
    reward: { glimmers: 10 },
  },
  {
    id: 'sparkle-shopper',
    name: 'Sparkle Shopper',
    desc: 'Spend 25 Glimmers',
    target: 25,
    count: (game, mail) => mail.stat('glimmersSpent'),
    reward: { coins: 300 },
  },
  {
    id: 'rare-find',
    name: 'Rare Find',
    desc: 'Own something rare',
    target: 1,
    count: (game) => game.items.filter((id) => traitsOf(id).rarity !== 'common').length,
    reward: { glimmers: 5 },
  },
  {
    id: 'in-season',
    name: 'In Season',
    desc: 'Own a seasonal treat',
    target: 1,
    count: (game) => game.items.filter((id) => traitsOf(id).season).length,
    reward: { coins: 150 },
  },
  {
    id: 'garage-sale',
    name: 'Garage Sale',
    desc: 'Sell 5 things to a shop',
    target: 5,
    count: (game, mail) => mail.stat('sold'),
    reward: { coins: 100 },
  },

  // ---------- savings ----------
  {
    id: 'nest-egg',
    name: 'Nest Egg',
    desc: 'Save up 1,000 coins',
    target: 1000,
    count: (game) => game.coins,
    reward: { glimmers: 5 },
  },
  {
    id: 'stargazer',
    name: 'Stargazer',
    desc: 'Save up 50 Glimmers',
    target: 50,
    count: (game) => game.glimmers,
    reward: { items: ['moon-print'] },
  },

  // ---------- your pal ----------
  {
    id: 'dress-up',
    name: 'Dress Up',
    desc: 'Wear 3 things you bought',
    target: 3,
    count: (game) => worn(game).length,
    reward: { coins: 100 },
  },
  {
    id: 'head-to-toe',
    name: 'Head to Toe',
    desc: 'Wear 6 things at once',
    target: 6,
    count: (game) => worn(game).length,
    reward: { glimmers: 10 },
  },
  {
    id: 'closet-full',
    name: 'Closet Full',
    desc: 'Own 20 clothes',
    target: 20,
    count: (game) => game.items.filter((id) => findItem(id)?.wear).length,
    reward: { glimmers: 10 },
  },
  {
    id: 'pj-party',
    name: 'PJ Party',
    desc: 'Wear something from PJs',
    target: 1,
    count: (game) => worn(game).filter((id) => PJS.has(id)).length,
    reward: { items: ['star-lamp'] },
  },
  {
    id: 'say-cheese',
    name: 'Say Cheese!',
    desc: 'Snap a photo in the booth',
    target: 1,
    count: (game, mail) => mail.stat('photos'),
    reward: { coins: 100 },
  },
  {
    id: 'photo-album',
    name: 'Photo Album',
    desc: 'Snap 10 photos',
    target: 10,
    count: (game, mail) => mail.stat('photos'),
    reward: { glimmers: 10 },
  },

  // ---------- your home ----------
  {
    id: 'cozy-corner',
    name: 'Cozy Corner',
    desc: 'Put 5 things in your home',
    target: 5,
    count: (game) => decorPlaced(game).length,
    reward: { glimmers: 5 },
  },
  {
    id: 'interior-designer',
    name: 'Interior Designer',
    desc: 'Put 20 things in your home',
    target: 20,
    count: (game) => decorPlaced(game).length,
    reward: { glimmers: 15 },
  },
  {
    id: 'fresh-paint',
    name: 'Fresh Paint',
    desc: 'Put up wallpaper or a floor',
    target: 1,
    count: (game) => {
      const style = game.homeStyle;
      return style.wallpaper || style.doorStyle || Object.values(style.floors).some(Boolean) ? 1 : 0;
    },
    reward: { coins: 150 },
  },
  {
    id: 'paint-pal',
    name: 'Paint Pal',
    desc: 'Repaint a piece of decor',
    target: 1,
    count: (game) => game.placed.filter((p) => p.c1 != null || p.c2 != null).length,
    reward: { coins: 100 },
  },
  {
    id: 'green-thumb',
    name: 'Green Thumb',
    desc: 'Own 5 plants',
    target: 5,
    count: (game) => owned(game, PLANTS),
    reward: { items: ['tiny-cactus'] },
  },
  {
    id: 'woodworker',
    name: 'Woodworker',
    desc: 'Own 5 woodshop pieces',
    target: 5,
    count: (game) => owned(game, WOOD),
    reward: { coins: 200 },
  },
  {
    id: 'moving-up',
    name: 'Moving Up',
    desc: 'Buy a new home layout',
    target: 1,
    count: (game) => game.data.home.layoutsOwned.length - 1,
    reward: { glimmers: 10 },
  },
];
