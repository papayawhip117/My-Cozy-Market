// One place for all the numbers and lists the game uses.
// Change a value here and every scene that imports it updates.

// The game draws at this small size, then scales up to fill the browser.
// Small numbers = chunky pixels.
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

// The street is 6 screens wide. The camera scrolls across it.
export const WORLD_WIDTH = GAME_WIDTH * 6;

// The y position where feet touch the ground (the top of the grass).
export const GROUND_Y = GAME_HEIGHT - 40;

// How fast the player walks, in pixels per second.
export const PLAYER_SPEED = 90;

// Colors used by code (the art's colors live in tools/art/palette.js).
export const COLORS = {
  signBg: '#3a2a26', // dark wood sign
  signText: '#ffe3a0', // warm lantern-light letters
};

// The five shops, left to right along the street.
// `x` is the center of each shop front in world pixels.
// `key` is the image name we will use once real pixel art exists
// (put a file in public/assets and load it with that key).
export const SHOPS = [
  { id: 'matcha', name: 'Matcha Shop', x: 300, width: 120, height: 110, color: 0x9cc48a, key: 'shop-matcha' },
  { id: 'pjs', name: "PJ's Store", x: 820, width: 120, height: 110, color: 0xc7b3e6, key: 'shop-pjs' },
  { id: 'furniture', name: 'Furniture', x: 1340, width: 140, height: 120, color: 0xd9a77a, key: 'shop-furniture' },
  { id: 'plants', name: 'Plant Shop', x: 1860, width: 120, height: 110, color: 0x7fb88f, key: 'shop-plants' },
  // doorX: how far the door is from the middle of the picture (the tower door is off to the right).
  { id: 'clothes', name: 'Street Clothes', x: 2400, width: 130, height: 115, color: 0xf2a7b8, key: 'shop-clothes', doorX: 19 },
];

// Decorations that sit in the gaps between shops.
export const DECOR = [
  { id: 'lantern-tree', name: 'Lantern Tree', x: 560, width: 50, height: 90, color: 0x4f7a55, key: 'decor-lantern-tree' },
  { id: 'mushrooms', name: 'Mushrooms', x: 1080, width: 36, height: 20, color: 0xd96c5f, key: 'decor-mushrooms' },
  { id: 'fountain', name: 'Fountain', x: 1600, width: 70, height: 40, color: 0x9fc7d9, key: 'decor-fountain' },
  { id: 'flowers', name: 'Flowers', x: 2130, width: 44, height: 16, color: 0xf2c94c, key: 'decor-flowers' },
  { id: 'lantern-tree-2', name: 'Lantern Tree', x: 2700, width: 50, height: 90, color: 0x4f7a55, key: 'decor-lantern-tree' },
];

// How the player looks. Hair, ears/tail and eyes are drawn in gray and
// tinted with these colors in-game, so any hex color works.
// The style names must match files in public/assets (see LOOK_OPTIONS).
export const PLAYER_LOOK = {
  hair: 'bob',
  hairColor: 0xf2b3c4,
  ears: 'cat', // the tail matches the ears
  furColor: 0xf2b3c4,
  eyes: 'round',
  eyeColor: 0x5fa86e,
};

// Every style the art script draws. A customization screen can list these later.
export const LOOK_OPTIONS = {
  hair: ['bob', 'long', 'ponytail'],
  ears: ['cat', 'fox'],
  eyes: ['round', 'sleepy'],
};

// Idle coins: you earn these just by having the game open.
// Make shopping faster or slower by changing these numbers.
export const COINS = {
  startingCoins: 25, // what a brand-new player begins with
  perTick: 1, // coins earned each tick...
  tickSeconds: 2, // ...every this many seconds (1 per 2s = 30 a minute)
  offlineRate: 0.5, // while away you earn at half speed
  offlineCapHours: 3, // and at most this many hours' worth
  offlineNoticeSeconds: 60, // only say "welcome back" if you were gone this long
  autosaveSeconds: 10, // how often coins are saved while playing
};

// Your home: one cozy room you can walk around in (src/scenes/HomeScene.js).
// It's a screen and a half wide, so the camera scrolls a little.
// Things sit on the floor by their bottom edge: `bottom` is the y of that edge.
export const HOME_ROOM = {
  width: Math.round(GAME_WIDTH * 1.5),
  startX: 72, // where you appear (just inside the front door)

  // Fixed parts of the room, drawn back to front. Art: tools/art/home.js
  props: [
    { key: 'home-door', x: 36, bottom: GROUND_Y + 1 },
    { key: 'home-window', x: 180, bottom: 150 },
    { key: 'home-fireplace', x: 360, bottom: GROUND_Y + 1 },
    { key: 'home-window', x: 560, bottom: 150 },
    { key: 'home-lantern', x: 110, bottom: 56 },
    { key: 'home-lantern', x: 650, bottom: 56 },
  ],

  // Empty spots where furniture and decor will go once you can buy them.
  // `kind` says what fits there: 'floor' things stand on the floor,
  // 'wall' things hang on the wall.
  slots: [
    { id: 'wall-1', kind: 'wall', x: 270, bottom: 132 },
    { id: 'floor-1', kind: 'floor', x: 240, bottom: GROUND_Y + 2 },
    { id: 'floor-2', kind: 'floor', x: 480, bottom: GROUND_Y + 2 },
    { id: 'wall-2', kind: 'wall', x: 460, bottom: 132 },
    { id: 'floor-3', kind: 'floor', x: 640, bottom: GROUND_Y + 2 },
  ],
};

// What each shop sells (src/scenes/ShopScene.js). Prices are in coins.
// Selling something back gives you half its price.
// `id` is what goes in your backpack, so keep ids unique across all shops.
export const SHOP_STOCK = {
  matcha: [
    { id: 'matcha-latte', name: 'Matcha Latte', price: 8 },
    { id: 'matcha-mochi', name: 'Matcha Mochi', price: 12 },
    { id: 'bamboo-whisk', name: 'Bamboo Whisk', price: 20 },
    { id: 'tea-set', name: 'Tea Set', price: 35 },
  ],
  pjs: [
    { id: 'fuzzy-socks', name: 'Fuzzy Socks', price: 10 },
    { id: 'sleep-mask', name: 'Sleep Mask', price: 14 },
    { id: 'bunny-slippers', name: 'Bunny Slippers', price: 22 },
    { id: 'cloud-pajamas', name: 'Cloud Pajamas', price: 30 },
  ],
  furniture: [
    { id: 'book-stack', name: 'Book Stack', price: 12 },
    { id: 'floor-cushion', name: 'Floor Cushion', price: 15 },
    { id: 'wooden-stool', name: 'Wooden Stool', price: 20 },
    { id: 'bedside-lamp', name: 'Bedside Lamp', price: 28 },
  ],
  plants: [
    { id: 'tiny-cactus', name: 'Tiny Cactus', price: 8 },
    { id: 'flower-pot', name: 'Flower Pot', price: 12 },
    { id: 'hanging-ivy', name: 'Hanging Ivy', price: 18 },
    { id: 'monstera', name: 'Monstera', price: 25 },
  ],
  clothes: [
    { id: 'canvas-tote', name: 'Canvas Tote', price: 10 },
    { id: 'beret', name: 'Beret', price: 15 },
    { id: 'striped-tee', name: 'Striped Tee', price: 20 },
    { id: 'cargo-pants', name: 'Cargo Pants', price: 28 },
  ],
};
