// One place for all the numbers and lists the game uses.
// Change a value here and every scene that imports it updates.
import { WARDROBE } from './data/wardrobe.js';
import { FURNITURE_PACK } from './data/furniturePack.js';
import { WOODSHOP_STOCK } from './data/woodshop.js';
import { SEASONAL_PLANTS, SEASONAL_FURNITURE } from './data/seasonal.js';

// The game draws at this small size, then scales up to fill the browser.
// Small numbers = chunky pixels.
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

// The street is 7 screens wide. The camera scrolls across it.
export const WORLD_WIDTH = GAME_WIDTH * 7;

// The y position where feet touch the ground (the top of the grass).
export const GROUND_Y = GAME_HEIGHT - 40;

// How fast the player walks, in pixels per second.
export const PLAYER_SPEED = 90;

// The font for all text: My Cozy Market's own pixel font (tools/art/font.js, loaded
// by src/ui/pixelFont.js). It's drawn on a 10-pixel grid, so only use sizes
// that are multiples of 10: '10px' for normal text, '20px' for big titles.
// Any other size makes the letters lumpy.
export const FONT_NAME = 'Cozy Market Pixel';
export const FONT = `'${FONT_NAME}', monospace`;

// Colors used by code (the art's colors live in tools/art/palette.js).
export const COLORS = {
  signBg: '#3a2a26', // dark wood sign
  signText: '#ffe3a0', // warm lantern-light letters
};

// The shops, left to right along the street.
// `x` is the center of each shop front in world pixels.
// `key` is the image name we will use once real pixel art exists
// (put a file in public/assets and load it with that key).
// `doorX` is how far the door is from the middle of the picture
// (every shop's door is on its right side, next to the counter).
// `scene` (optional) = a scene of its own to go into, instead of a shop
// menu. The photo booth (src/scenes/PhotoBoothScene.js) took over the old
// matcha shop's spot.
export const SHOPS = [
  { id: 'photobooth', name: 'Photo Booth', x: 300, width: 120, height: 110, color: 0x9cc48a, key: 'shop-photobooth', doorX: 43, scene: 'PhotoBooth' },
  { id: 'pjs', name: "PJ's Store", x: 820, width: 120, height: 110, color: 0xc7b3e6, key: 'shop-pjs', doorX: 39 },
  { id: 'furniture', name: 'Furniture', x: 1340, width: 140, height: 120, color: 0xd9a77a, key: 'shop-furniture', doorX: 50 },
  { id: 'plants', name: 'Plant Shop', x: 1860, width: 120, height: 110, color: 0x7fb88f, key: 'shop-plants', doorX: 40 },
  { id: 'clothes', name: 'Street Clothes', x: 2400, width: 130, height: 115, color: 0xf2a7b8, key: 'shop-clothes', doorX: 41 },
  { id: 'cart', name: 'Seasonal Cart', x: 1100, width: 84, height: 70, color: 0xb8404a, key: 'shop-cart', doorX: 0 },
  { id: 'woodshop', name: 'Timber & Twig', x: 2940, width: 140, height: 120, color: 0x9a6f48, key: 'shop-woodshop', doorX: 48 },
];

// Decorations that sit in the gaps between shops.
export const DECOR = [
  { id: 'lantern-tree', name: 'Lantern Tree', x: 560, width: 50, height: 90, color: 0x4f7a55, key: 'decor-lantern-tree' },
  { id: 'mushrooms', name: 'Mushrooms', x: 1016, width: 36, height: 20, color: 0xd96c5f, key: 'decor-mushrooms' },
  { id: 'fountain', name: 'Fountain', x: 1600, width: 70, height: 40, color: 0x9fc7d9, key: 'decor-fountain' },
  { id: 'flowers', name: 'Flowers', x: 2130, width: 44, height: 16, color: 0xf2c94c, key: 'decor-flowers' },
  { id: 'lantern-tree-2', name: 'Lantern Tree', x: 2700, width: 50, height: 90, color: 0x4f7a55, key: 'decor-lantern-tree' },
];

// How a brand-new player looks, before the character creator
// (src/scenes/CreatorScene.js). Hair, ears/tail, eyes, skin and the skirt
// are drawn in gray and tinted with these colors in-game, so any hex
// color works. Style names must match files in public/assets.
export const PLAYER_LOOK = {
  name: 'Pal',
  pronouns: 'she/her',
  hair: 'bob',
  hairColor: 0xf2b3c4,
  ears: 'cat', // the tail matches the ears
  furColor: 0xf2b3c4,
  eyes: 'round',
  eyeColor: 0x5fa86e,
  skin: 0xf6dccb,
  outfitColor: 0x56744e, // the skirt you start with
  // What you're wearing: an item id from SHOP_STOCK for each slot,
  // or null for the clothes you start with (or nothing, for head and bag).
  worn: {
    head: null, top: null, bottom: null, feet: null, bag: null,
    hair: null, face: null, neck: null, hands: null, waist: null, legs: null, charm: null,
  },
};

// Every style the art script draws (tools/art/character.js), in the
// order the character creator shows them.
export const LOOK_OPTIONS = {
  hair: ['bob', 'long', 'wavy', 'braid', 'ponytail', 'twintails', 'bun', 'pixie'],
  ears: ['cat', 'fox', 'wolf', 'bunny', 'bear'],
  eyes: ['round', 'sparkle', 'almond', 'sleepy', 'happy', 'bead'],
  pronouns: ['she/her', 'he/him', 'they/them'],
};

// The color swatches in the character creator.
export const LOOK_COLORS = {
  hairColor: [0xf2b3c4, 0x8a5a44, 0x3d3346, 0xf3e3c0, 0xb0563c, 0xd9a35a, 0x9db88f, 0xb9a3d9, 0xd4d4dc, 0x6a7fd0],
  furColor: [0xf2b3c4, 0x8a5a44, 0x3d3346, 0xf2ead8, 0xe8955f, 0xd9a35a, 0x7f9c78, 0xb9a3d9, 0xd4d4dc, 0xb0563c],
  eyeColor: [0x5fa86e, 0x6a7fd0, 0xd08a3a, 0x9a6ad0, 0x7a4a32, 0x3fa8a0, 0xc8607a, 0x8a8aa0],
  skin: [0xfbe6d8, 0xf6dccb, 0xe8bf9f, 0xc98e66, 0x9a6444, 0x6b4430],
  outfitColor: [0x56744e, 0x6b4a7c, 0xa8788a, 0x3c4a6e, 0x8f4f3f, 0xb08a3a, 0x3f6b6b, 0x3a3640],
};

// The body slots clothes go on. Items in SHOP_STOCK with `wear: 'top'`
// (etc.) can be worn; their art is public/assets/wear-<id>.png.
// The dresser shows WEAR_SLOTS on its Clothes tab and EXTRA_SLOTS (the
// little things: hair clips, glasses, necklaces...) on its Extras tab.
export const WEAR_SLOTS = ['head', 'top', 'bottom', 'feet', 'bag'];
export const EXTRA_SLOTS = ['hair', 'face', 'neck', 'hands', 'waist', 'legs', 'charm'];

// Idle coins: you earn these just by having the game open.
// Make shopping faster or slower by changing these numbers.
export const COINS = {
  startingCoins: 50, // what a brand-new player begins with
  perTick: 1, // coins earned each tick...
  tickSeconds: 10, // ...every this many seconds (1 per 10s = 6 a minute, 360 an hour)
  offlineRate: 0.5, // while away you earn at half speed
  offlineCapHours: 3, // and at most this many hours' worth
  offlineNoticeSeconds: 60, // only say "welcome back" if you were gone this long
  autosaveSeconds: 10, // how often coins are saved while playing
};

// Your home: a living room, a little entryway with the front door, and a
// lower room down three steps (src/scenes/HomeScene.js). Their shapes and
// sizes live in src/world/IsoRoom.js. Furniture can go anywhere you like.

// The parts of the room that are always there. They can be moved, flipped and
// painted like furniture, but not stored. `texture` is the picture
// (public/assets, from tools/art/home.js); x and y are screen positions in the
// room (wall things by their middle, floor things by their bottom edge).
export const FIXTURE_ART = { door: 'home-door', window: 'home-window', dresser: 'home-dresser' };
export const DEFAULT_FIXTURES = [
  { uid: 'fixed-door', id: 'door', x: 92, y: 139 }, // in the entryway
  { uid: 'fixed-window-1', id: 'window', x: 205, y: 75 },
  { uid: 'fixed-window-2', id: 'window', x: 300, y: 87 },
  { uid: 'fixed-dresser', id: 'dresser', x: 312, y: 154 },
];

// The colors you can paint any piece of furniture or plant (the first entry,
// null, means "put it back to its original colors").
export const HOME_SWATCHES = [
  null,
  0x8be8cb, // aquamarine
  0x888da7, // lavender grey
  0x9c7a97, // dusty mauve
  0x303633, // gunmetal
  0xb8883a, // honey
  0x6f86b8, // dusty blue
  0x65743a, // fern
  0x394f49, // dark slate
  0xb8694a, // terracotta
  0xd9849b, // rose
  0x8b3f52, // wine
  0xd8c8a8, // cream
  0x8fa888, // soft sage
];

// What each shop sells (src/scenes/ShopScene.js).
// `price` is in coins (everyday things cost about 30 to 150). Rare things
// cost `glimmers` instead (the second currency, src/data/economy.js); an
// item can have both. Selling something back gives you half of each.
// `id` is what goes in your backpack, so keep ids unique across all shops.
// `desc` is the blurb in the shop catalogue (keep it under about 50 letters).
// `cat` is which tab it's on (see SHOP_TABS below), which also decides
//   which catalogue books it's in (src/data/catalogues.js).
// `books` (optional): extra catalogue books to put it in, e.g. ['bedroom'].
// `wear` marks clothes: which body slot they go on (see WEAR_SLOTS).
// `tags` are style labels just for us (never shown to players): any of STYLE_TAGS.
// `season` (optional): 'spring', 'summer', 'autumn' or 'winter'. Shops only
//   sell it in that season (real-world dates, src/state/seasons.js).
// `rarity` (optional): 'uncommon' or 'rare'. Leave it out for common.
// Each item's picture is public/assets/item-<id>.png (tools/art/items.js);
// clothes also need a character layer wear-<id>.png (tools/art/character.js).
// The big wardrobe (about 100 more clothes) lives in src/data/wardrobe.js
// and is added to the clothes shop and PJ store lists below. The big
// furniture pack (about 70 more pieces) lives in src/data/furniturePack.js,
// and Timber & Twig's wooden things in src/data/woodshop.js.
export const STYLE_TAGS = ['cottagecore', 'emo', 'girly', 'y2k', 'casual', 'forest'];

export const SHOP_STOCK = {
  pjs: [
    { id: 'cloud-pajamas', name: 'Cloud Pajamas', price: 60, cat: 'sets', wear: 'top', fullBody: true, tags: ['girly', 'casual'], desc: 'A comfy one-piece covered in little clouds.' },
    { id: 'star-pajamas', name: 'Star Pajamas', glimmers: 2, cat: 'sets', wear: 'top', fullBody: true, tags: ['emo', 'y2k'], rarity: 'rare', desc: 'Midnight blue with a sprinkle of golden stars.' },
    { id: 'fuzzy-socks', name: 'Fuzzy Socks', price: 35, cat: 'feet', wear: 'feet', tags: ['cottagecore', 'casual'], season: 'winter', desc: 'Soft striped socks for cold wooden floors.' },
    { id: 'bunny-slippers', name: 'Bunny Slippers', price: 50, cat: 'feet', wear: 'feet', tags: ['girly', 'y2k'], desc: 'Fluffy slippers with floppy ears. Hop around!' },
    { id: 'sleep-mask', name: 'Sleep Mask', price: 40, cat: 'head', wear: 'head', tags: ['girly', 'casual'], desc: 'Sleepy eyes on the outside, sweet dreams inside.' },
    { id: 'sleep-cap', name: 'Sleep Cap', price: 40, cat: 'head', wear: 'head', tags: ['cottagecore'], desc: 'A droopy nightcap with a fluffy white pom.' },
    ...WARDROBE.pjs,
  ],
  furniture: [
    { id: 'bedside-lamp', name: 'Bedside Lamp', price: 60, cat: 'lamps', books: ['bedroom'], tags: ['cottagecore', 'casual'], desc: 'Gives off a warm glow, like a tiny sunset.' },
    { id: 'paper-lantern', name: 'Paper Lantern', price: 50, cat: 'lamps', tags: ['forest', 'cottagecore'], desc: 'A round paper lantern that hums with light.' },
    { id: 'mushroom-lamp', name: 'Mushroom Lamp', price: 60, cat: 'lamps', tags: ['forest', 'cottagecore'], season: 'autumn', rarity: 'uncommon', desc: 'A glowing toadstool straight from the grove.' },
    { id: 'floor-lamp', name: 'Floor Lamp', price: 70, cat: 'lamps', tags: ['casual'], desc: 'Tall and elegant with a cream silk shade.' },
    { id: 'floor-cushion', name: 'Floor Cushion', price: 40, cat: 'chairs', tags: ['cottagecore', 'casual'], desc: 'A plump tufted cushion with golden tassels.' },
    { id: 'wooden-stool', name: 'Wooden Stool', price: 50, cat: 'chairs', tags: ['forest', 'casual'], desc: 'Sturdy, simple and made from forest oak.' },
    { id: 'armchair', name: 'Armchair', price: 85, cat: 'chairs', tags: ['cottagecore', 'casual'], desc: 'Deep, soft and perfect for reading in.' },
    { id: 'rocking-chair', name: 'Rocking Chair', price: 80, cat: 'chairs', tags: ['cottagecore'], desc: 'Rock gently while the fireplace crackles.' },
    { id: 'cozy-bed', name: 'Cozy Bed', price: 105, cat: 'beds', tags: ['cottagecore', 'casual'], desc: 'A quilted bed with two very fluffy pillows.' },
    { id: 'canopy-bed', name: 'Canopy Bed', glimmers: 5, cat: 'beds', tags: ['girly', 'cottagecore'], rarity: 'rare', desc: 'Dreamy curtains for the fanciest of naps.' },
    { id: 'hammock', name: 'Hammock', price: 90, cat: 'beds', tags: ['forest', 'casual'], desc: 'Sway gently between two sturdy posts.' },
    { id: 'book-stack', name: 'Book Stack', price: 35, cat: 'storage', tags: ['cottagecore', 'emo'], desc: 'Well-loved books, piled up for rainy days.' },
    { id: 'moon-print', name: 'Moon Print', price: 45, cat: 'wall', tags: ['emo', 'forest'], desc: 'A framed crescent moon over a starry sky.' },
    { id: 'botanical-print', name: 'Botanical Print', price: 50, cat: 'wall', tags: ['cottagecore', 'forest'], desc: 'A framed fern pressed on cream paper.' },
    { id: 'wall-mirror', name: 'Wall Mirror', price: 60, cat: 'wall', tags: ['girly'], desc: 'An arched mirror with a mossy wooden frame.' },
    { id: 'wreath', name: 'Wreath', price: 50, cat: 'wall', tags: ['cottagecore', 'forest'], season: 'winter', desc: 'Leaves and little flowers to hang by the door.' },
    { id: 'wall-clock', name: 'Wall Clock', price: 55, cat: 'wall', tags: ['cottagecore'], desc: 'Ticks softly. Always right on forest time.' },
    { id: 'side-table', name: 'Side Table', price: 55, cat: 'tables', tags: ['casual'], desc: 'Just big enough for a teacup and a candle.' },
    { id: 'coffee-table', name: 'Coffee Table', price: 75, cat: 'tables', tags: ['casual'], desc: 'A low oak table for snacks and board games.' },
    { id: 'desk', name: 'Writing Desk', price: 100, cat: 'tables', tags: ['cottagecore', 'emo'], rarity: 'uncommon', books: ['bedroom'], desc: 'A desk with a drawer for secret letters.' },
    // rugs lie flat on the floor, under everything else
    { id: 'round-rug', name: 'Braided Rug', price: 35, cat: 'rugs', tags: ['cottagecore'], desc: 'A round rag rug, braided from old scarves.' },
    { id: 'striped-rug', name: 'Striped Runner', price: 40, cat: 'rugs', tags: ['casual'], desc: 'A long woven runner for hallways and stairs.' },
    { id: 'moss-rug', name: 'Moss Rug', price: 40, cat: 'rugs', tags: ['forest'], desc: 'Soft and green, like stepping on a forest floor.' },
    // wallpaper, flooring and doors are put up, not placed (see src/data/homeStyles.js)
    { id: 'wallpaper-rose', name: 'Rose Dots', price: 45, cat: 'walls', tags: ['girly'], desc: 'Wallpaper: dusty pink with tiny rosy dots.' },
    { id: 'wallpaper-sage', name: 'Sage Stripes', price: 45, cat: 'walls', tags: ['cottagecore'], desc: 'Wallpaper: calm green stripes for any room.' },
    { id: 'wallpaper-night', name: 'Starry Night', price: 50, cat: 'walls', tags: ['emo'], desc: 'Wallpaper: deep blue with little gold stars.' },
    { id: 'floor-birch', name: 'Birch Boards', price: 50, cat: 'floors', tags: ['forest'], desc: 'Flooring: pale birch planks, sanded smooth.' },
    { id: 'floor-checker', name: 'Checker Tiles', price: 50, cat: 'floors', tags: ['y2k', 'cottagecore'], desc: 'Flooring: cream and sage checkerboard tiles.' },
    { id: 'floor-terracotta', name: 'Terracotta', price: 50, cat: 'floors', tags: ['cottagecore'], desc: 'Flooring: warm clay tiles, cool underfoot.' },
    { id: 'door-round', name: 'Round Door', price: 60, cat: 'doors', tags: ['forest', 'cottagecore'], desc: 'A round oak front door with a brass knob.' },
    { id: 'door-red', name: 'Cottage Door', price: 60, cat: 'doors', tags: ['casual'], desc: 'A sturdy oak front door with a little window.' },
    { id: 'door-blue', name: 'Arched Door', price: 60, cat: 'doors', tags: ['emo'], desc: 'A tall arched walnut front door.' },
    { id: 'door-birch', name: 'Light Oak Door', price: 65, cat: 'doors', tags: ['forest'], desc: 'A light oak front door with a round window.' },
    ...FURNITURE_PACK,
    ...SEASONAL_FURNITURE,
  ],
  plants: [
    { id: 'tiny-cactus', name: 'Tiny Cactus', price: 30, cat: 'potted', tags: ['casual'], desc: 'Small, prickly and blooming. Hardly needs water.' },
    { id: 'succulent-trio', name: 'Succulent Trio', price: 40, cat: 'potted', tags: ['casual'], desc: 'Three plump little rosettes in one pot.' },
    { id: 'flower-pot', name: 'Flower Pot', price: 35, cat: 'potted', tags: ['girly', 'cottagecore'], desc: 'Pink, gold and lilac blooms in a white pot.' },
    { id: 'snake-plant', name: 'Snake Plant', price: 40, cat: 'potted', tags: ['casual'], desc: 'Tall, striped leaves that stand up straight.' },
    { id: 'peace-lily', name: 'Peace Lily', price: 50, cat: 'potted', tags: ['cottagecore'], desc: 'Glossy leaves and elegant white blooms.' },
    { id: 'boston-fern', name: 'Boston Fern', price: 50, cat: 'potted', tags: ['forest'], desc: 'A big, bushy fern that loves a shady corner.' },
    { id: 'monstera', name: 'Monstera', price: 55, cat: 'potted', tags: ['forest', 'casual'], desc: 'Huge split leaves. Makes any room feel wild.' },
    { id: 'hanging-ivy', name: 'Hanging Ivy', price: 45, cat: 'hanging', tags: ['forest', 'cottagecore'], desc: 'Trailing vines that spill over a hanging pot.' },
    { id: 'kokedama', name: 'Kokedama', price: 40, cat: 'hanging', tags: ['forest'], desc: 'A little moss ball hung on twine.' },
    { id: 'hanging-fern', name: 'Hanging Fern', price: 50, cat: 'hanging', tags: ['forest'], desc: 'Feathery fronds in a woven basket.' },
    { id: 'string-of-pearls', name: 'String of Pearls', price: 55, cat: 'hanging', tags: ['girly', 'forest'], desc: 'Strands of round green beads that dangle.' },
    { id: 'bonsai-tree', name: 'Bonsai Tree', price: 75, cat: 'trees', tags: ['forest'], rarity: 'uncommon', desc: 'A tiny old tree in a shallow tray. Very wise.' },
    { id: 'mini-palm', name: 'Mini Palm', price: 75, cat: 'trees', tags: ['casual'], desc: 'A leafy palm for a sunny little corner.' },
    { id: 'fiddle-leaf-fig', name: 'Fiddle Leaf Fig', price: 90, cat: 'trees', tags: ['casual'], desc: 'Big, glossy leaves on a slender trunk.' },
    { id: 'lemon-tree', name: 'Lemon Tree', price: 100, cat: 'trees', tags: ['cottagecore'], season: 'summer', rarity: 'uncommon', desc: 'Bright lemons and a lovely fresh scent.' },
    { id: 'sakura-tree', name: 'Sakura Tree', glimmers: 4, cat: 'trees', tags: ['girly', 'forest'], season: 'spring', rarity: 'rare', desc: 'Soft pink blossoms that drift down like snow.' },
    { id: 'daisies', name: 'Daisies', price: 35, cat: 'flowers', tags: ['cottagecore'], desc: 'A cheerful bunch of white daisies.' },
    { id: 'tulips', name: 'Tulips', price: 35, cat: 'flowers', tags: ['girly'], season: 'spring', desc: 'Pink and red tulips tied with a ribbon.' },
    { id: 'sunflowers', name: 'Sunflowers', price: 40, cat: 'flowers', tags: ['cottagecore'], season: 'summer', desc: 'Big golden blooms that follow the light.' },
    { id: 'lavender', name: 'Lavender', price: 40, cat: 'flowers', tags: ['cottagecore', 'girly'], desc: 'Calming purple spikes that smell dreamy.' },
    { id: 'roses', name: 'Roses', price: 45, cat: 'flowers', tags: ['girly', 'emo'], desc: 'Velvety red roses with deep green leaves.' },
    ...SEASONAL_PLANTS,
  ],
  clothes: [
    { id: 'beret', name: 'Beret', price: 40, cat: 'hats', wear: 'head', tags: ['girly', 'cottagecore'], desc: 'A soft wool beret in deep berry red.' },
    { id: 'bucket-hat', name: 'Bucket Hat', price: 45, cat: 'hats', wear: 'head', tags: ['casual', 'y2k'], desc: 'A sage bucket hat with a little stitched leaf.' },
    { id: 'flower-crown', name: 'Flower Crown', glimmers: 2, cat: 'hats', wear: 'head', tags: ['cottagecore', 'girly'], rarity: 'rare', desc: 'Woven blossoms for your very own fairy tale.' },
    { id: 'striped-tee', name: 'Striped Tee', price: 50, cat: 'tops', wear: 'top', tags: ['casual'], desc: 'A navy and white tee that goes with anything.' },
    { id: 'hoodie', name: 'Moss Hoodie', price: 60, cat: 'tops', wear: 'top', tags: ['casual', 'emo', 'forest'], desc: 'Soft, slouchy and the color of a mossy log.' },
    { id: 'cardigan', name: 'Cream Cardigan', glimmers: 3, cat: 'tops', wear: 'top', tags: ['cottagecore', 'forest'], season: 'autumn', rarity: 'rare', desc: 'A chunky knit with big wooden buttons.' },
    { id: 'cargo-pants', name: 'Cargo Pants', price: 60, cat: 'bottoms', wear: 'bottom', tags: ['casual', 'y2k'], desc: 'Baggy and comfy, with pockets for acorns.' },
    { id: 'jeans', name: 'Blue Jeans', price: 55, cat: 'bottoms', wear: 'bottom', tags: ['casual'], desc: 'Classic denim that gets better with wear.' },
    { id: 'plaid-skirt', name: 'Plaid Skirt', price: 55, cat: 'skirts', wear: 'bottom', tags: ['emo', 'girly', 'y2k'], desc: 'A pleated plaid skirt in plum and green.' },
    { id: 'sneakers', name: 'Sneakers', price: 55, cat: 'shoes', wear: 'feet', tags: ['casual'], desc: 'White sneakers made for long forest walks.' },
    { id: 'rain-boots', name: 'Rain Boots', price: 60, cat: 'shoes', wear: 'feet', tags: ['cottagecore', 'casual'], season: 'spring', desc: 'Yellow boots, perfect for puddle jumping.' },
    { id: 'canvas-tote', name: 'Canvas Tote', price: 35, cat: 'bags', wear: 'bag', tags: ['casual', 'cottagecore'], desc: 'Roomy enough for snacks, books and a plant.' },
    { id: 'backpack', name: 'Backpack', price: 50, cat: 'bags', wear: 'bag', tags: ['casual', 'forest'], desc: 'A little green pack with a brass buckle.' },
    ...WARDROBE.clothes,
  ],
  woodshop: WOODSHOP_STOCK,
};

// The Seasonal Cart sells everything that has a `season`, from every shop
// (those things are NOT sold in their own shops: see stock.js). Its tabs
// are 'wear' (clothes) and 'decor' (home things), so each item here is a
// copy with the cart's tab as its `cat`. Winter things also go in the
// Frosty Finds book.
export const CART_ID = 'cart';
SHOP_STOCK[CART_ID] = Object.values(SHOP_STOCK)
  .flat()
  .filter((item) => item.season)
  .map((item) => ({ ...item, cat: item.wear ? 'wear' : 'decor', books: item.season === 'winter' ? ['winter'] : [] }));

// Things no shop sells any more (the old matcha shop's stock). Players who
// bought them still have them: they keep their names and pictures, and any
// shop will buy them back for half price.
export const RETIRED_ITEMS = [
  { id: 'matcha-latte', name: 'Matcha Latte', price: 8, desc: 'Frothy, earthy and warm. Comes with a foam heart.' },
  { id: 'matcha-mochi', name: 'Matcha Mochi', price: 12, desc: 'Three chewy mochi on a stick. Best shared.' },
  { id: 'bamboo-whisk', name: 'Bamboo Whisk', price: 20, desc: 'For whisking your own matcha nice and foamy.' },
  { id: 'tea-set', name: 'Tea Set', price: 35, desc: 'A sage teapot and cup for slow evenings.' },
];

// The tabs along the top of each shop's catalogue grid, left to right.
// Labels are kept short so they fit across the panel.
export const SHOP_TABS = {
  pjs: [
    { id: 'sets', label: 'Sets' },
    { id: 'lounge', label: 'Lounge' },
    { id: 'feet', label: 'Feet' },
    { id: 'head', label: 'Head' },
  ],
  furniture: [
    { id: 'sofas', label: 'Sofas' },
    { id: 'chairs', label: 'Chairs' },
    { id: 'tables', label: 'Tables' },
    { id: 'storage', label: 'Shelves' },
    { id: 'lamps', label: 'Lamps' },
    { id: 'beds', label: 'Beds' },
    { id: 'dressers', label: 'Dressers' },
    { id: 'wall', label: 'On Wall' },
    { id: 'rugs', label: 'Rugs' },
    { id: 'walls', label: 'Paper' },
    { id: 'floors', label: 'Floors' },
    { id: 'doors', label: 'Doors' },
  ],
  plants: [
    { id: 'potted', label: 'Potted' },
    { id: 'hanging', label: 'Hang' },
    { id: 'trees', label: 'Trees' },
    { id: 'flowers', label: 'Flowers' },
  ],
  clothes: [
    { id: 'hats', label: 'Hats' },
    { id: 'tops', label: 'Tops' },
    { id: 'dresses', label: 'Dresses' },
    { id: 'bottoms', label: 'Pants' },
    { id: 'skirts', label: 'Skirts' },
    { id: 'shoes', label: 'Shoes' },
    { id: 'bags', label: 'Bags' },
    { id: 'acc', label: 'Bits' },
    { id: 'extras', label: 'Extras' },
  ],
  cart: [
    { id: 'wear', label: 'Wear' },
    { id: 'decor', label: 'Home' },
  ],
  woodshop: [
    { id: 'seats', label: 'Seats' },
    { id: 'tables', label: 'Tables' },
    { id: 'shelves', label: 'Shelves' },
    { id: 'carvings', label: 'Carvings' },
    { id: 'wall', label: 'On Wall' },
  ],
};
