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

// The font for all in-game text: a pixel font (bundled by main.js), so letters
// stay sharp even though the game is drawn tiny and scaled up.
export const FONT = "'Pixelify Sans', monospace";

// Colors used by code (the art's colors live in tools/art/palette.js).
export const COLORS = {
  signBg: '#3a2a26', // dark wood sign
  signText: '#ffe3a0', // warm lantern-light letters
};

// The five shops, left to right along the street.
// `x` is the center of each shop front in world pixels.
// `key` is the image name we will use once real pixel art exists
// (put a file in public/assets and load it with that key).
// `doorX` is how far the door is from the middle of the picture
// (every shop's door is on its right side, next to the counter).
export const SHOPS = [
  { id: 'matcha', name: 'Matcha Shop', x: 300, width: 120, height: 110, color: 0x9cc48a, key: 'shop-matcha', doorX: 43 },
  { id: 'pjs', name: "PJ's Store", x: 820, width: 120, height: 110, color: 0xc7b3e6, key: 'shop-pjs', doorX: 39 },
  { id: 'furniture', name: 'Furniture', x: 1340, width: 140, height: 120, color: 0xd9a77a, key: 'shop-furniture', doorX: 50 },
  { id: 'plants', name: 'Plant Shop', x: 1860, width: 120, height: 110, color: 0x7fb88f, key: 'shop-plants', doorX: 40 },
  { id: 'clothes', name: 'Street Clothes', x: 2400, width: 130, height: 115, color: 0xf2a7b8, key: 'shop-clothes', doorX: 41 },
];

// Decorations that sit in the gaps between shops.
export const DECOR = [
  { id: 'lantern-tree', name: 'Lantern Tree', x: 560, width: 50, height: 90, color: 0x4f7a55, key: 'decor-lantern-tree' },
  { id: 'mushrooms', name: 'Mushrooms', x: 1080, width: 36, height: 20, color: 0xd96c5f, key: 'decor-mushrooms' },
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
  worn: { head: null, top: null, bottom: null, feet: null, bag: null },
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
export const WEAR_SLOTS = ['head', 'top', 'bottom', 'feet', 'bag'];

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

// Your home: one isometric room (src/scenes/HomeScene.js). The room's shape
// and size live in src/world/IsoRoom.js. Furniture can go anywhere you like.

// The parts of the room that are always there. They can be moved, flipped and
// painted like furniture, but not stored. `texture` is the picture
// (public/assets, from tools/art/home.js); x and y are screen positions in the
// room (wall things by their middle, floor things by their bottom edge).
export const FIXTURE_ART = { door: 'home-door', window: 'home-window', dresser: 'home-dresser' };
export const DEFAULT_FIXTURES = [
  { uid: 'fixed-door', id: 'door', x: 150, y: 132 },
  { uid: 'fixed-window-1', id: 'window', x: 205, y: 91 },
  { uid: 'fixed-window-2', id: 'window', x: 300, y: 103 },
  { uid: 'fixed-dresser', id: 'dresser', x: 312, y: 174 },
];

// The colors you can paint any piece of furniture or plant (the first entry,
// null, means "put it back to its original colors").
export const HOME_SWATCHES = [
  null,
  0x8be8cb, // aquamarine
  0x888da7, // lavender grey
  0x9c7a97, // dusty mauve
  0x303633, // gunmetal
  0xf4fdaf, // lime cream
  0xefdd8d, // light gold
  0x65743a, // fern
  0x394f49, // dark slate
  0xb8694a, // terracotta
  0xd9849b, // rose
  0xf2ead8, // cream
];

// What each shop sells (src/scenes/ShopScene.js). Prices are in coins.
// Selling something back gives you half its price.
// `id` is what goes in your backpack, so keep ids unique across all shops.
// `desc` is the blurb in the shop catalogue (keep it under about 50 letters).
// `cat` is which tab it's on (see SHOP_TABS below).
// `wear` marks clothes: which body slot they go on (see WEAR_SLOTS).
// Each item's picture is public/assets/item-<id>.png (tools/art/items.js);
// clothes also need a character layer wear-<id>.png (tools/art/character.js).
export const SHOP_STOCK = {
  matcha: [
    { id: 'matcha-latte', name: 'Matcha Latte', price: 8, desc: 'Frothy, earthy and warm. Comes with a foam heart.' },
    { id: 'matcha-mochi', name: 'Matcha Mochi', price: 12, desc: 'Three chewy mochi on a stick. Best shared.' },
    { id: 'bamboo-whisk', name: 'Bamboo Whisk', price: 20, desc: 'For whisking your own matcha nice and foamy.' },
    { id: 'tea-set', name: 'Tea Set', price: 35, desc: 'A sage teapot and cup for slow evenings.' },
  ],
  pjs: [
    { id: 'cloud-pajamas', name: 'Cloud Pajamas', price: 30, cat: 'sets', wear: 'top', fullBody: true, desc: 'A comfy one-piece covered in little clouds.' },
    { id: 'star-pajamas', name: 'Star Pajamas', price: 34, cat: 'sets', wear: 'top', fullBody: true, desc: 'Midnight blue with a sprinkle of golden stars.' },
    { id: 'fuzzy-socks', name: 'Fuzzy Socks', price: 10, cat: 'feet', wear: 'feet', desc: 'Soft striped socks for cold wooden floors.' },
    { id: 'bunny-slippers', name: 'Bunny Slippers', price: 22, cat: 'feet', wear: 'feet', desc: 'Fluffy slippers with floppy ears. Hop around!' },
    { id: 'sleep-mask', name: 'Sleep Mask', price: 14, cat: 'head', wear: 'head', desc: 'Sleepy eyes on the outside, sweet dreams inside.' },
    { id: 'sleep-cap', name: 'Sleep Cap', price: 16, cat: 'head', wear: 'head', desc: 'A droopy nightcap with a fluffy white pom.' },
  ],
  furniture: [
    { id: 'bedside-lamp', name: 'Bedside Lamp', price: 28, cat: 'lamps', desc: 'Gives off a warm glow, like a tiny sunset.' },
    { id: 'paper-lantern', name: 'Paper Lantern', price: 22, cat: 'lamps', desc: 'A round paper lantern that hums with light.' },
    { id: 'mushroom-lamp', name: 'Mushroom Lamp', price: 30, cat: 'lamps', desc: 'A glowing toadstool straight from the grove.' },
    { id: 'floor-lamp', name: 'Floor Lamp', price: 36, cat: 'lamps', desc: 'Tall and elegant with a cream silk shade.' },
    { id: 'floor-cushion', name: 'Floor Cushion', price: 15, cat: 'chairs', desc: 'A plump tufted cushion with golden tassels.' },
    { id: 'wooden-stool', name: 'Wooden Stool', price: 20, cat: 'chairs', desc: 'Sturdy, simple and made from forest oak.' },
    { id: 'armchair', name: 'Armchair', price: 45, cat: 'chairs', desc: 'Deep, soft and perfect for reading in.' },
    { id: 'rocking-chair', name: 'Rocking Chair', price: 42, cat: 'chairs', desc: 'Rock gently while the fireplace crackles.' },
    { id: 'cozy-bed', name: 'Cozy Bed', price: 60, cat: 'beds', desc: 'A quilted bed with two very fluffy pillows.' },
    { id: 'canopy-bed', name: 'Canopy Bed', price: 90, cat: 'beds', desc: 'Dreamy curtains for the fanciest of naps.' },
    { id: 'hammock', name: 'Hammock', price: 50, cat: 'beds', desc: 'Sway gently between two sturdy posts.' },
    { id: 'book-stack', name: 'Book Stack', price: 12, cat: 'art', desc: 'Well-loved books, piled up for rainy days.' },
    { id: 'moon-print', name: 'Moon Print', price: 18, cat: 'art', desc: 'A framed crescent moon over a starry sky.' },
    { id: 'botanical-print', name: 'Botanical Print', price: 20, cat: 'art', desc: 'A framed fern pressed on cream paper.' },
    { id: 'wall-mirror', name: 'Wall Mirror', price: 30, cat: 'art', desc: 'An arched mirror with a mossy wooden frame.' },
    { id: 'wreath', name: 'Wreath', price: 22, cat: 'art', desc: 'Leaves and little flowers to hang by the door.' },
    { id: 'wall-clock', name: 'Wall Clock', price: 26, cat: 'art', desc: 'Ticks softly. Always right on forest time.' },
    { id: 'side-table', name: 'Side Table', price: 25, cat: 'tables', desc: 'Just big enough for a teacup and a candle.' },
    { id: 'coffee-table', name: 'Coffee Table', price: 40, cat: 'tables', desc: 'A low oak table for snacks and board games.' },
    { id: 'desk', name: 'Writing Desk', price: 55, cat: 'tables', desc: 'A desk with a drawer for secret letters.' },
  ],
  plants: [
    { id: 'tiny-cactus', name: 'Tiny Cactus', price: 8, cat: 'potted', desc: 'Small, prickly and blooming. Hardly needs water.' },
    { id: 'succulent-trio', name: 'Succulent Trio', price: 14, cat: 'potted', desc: 'Three plump little rosettes in one pot.' },
    { id: 'flower-pot', name: 'Flower Pot', price: 12, cat: 'potted', desc: 'Pink, gold and lilac blooms in a white pot.' },
    { id: 'snake-plant', name: 'Snake Plant', price: 16, cat: 'potted', desc: 'Tall, striped leaves that stand up straight.' },
    { id: 'peace-lily', name: 'Peace Lily', price: 20, cat: 'potted', desc: 'Glossy leaves and elegant white blooms.' },
    { id: 'boston-fern', name: 'Boston Fern', price: 22, cat: 'potted', desc: 'A big, bushy fern that loves a shady corner.' },
    { id: 'monstera', name: 'Monstera', price: 25, cat: 'potted', desc: 'Huge split leaves. Makes any room feel wild.' },
    { id: 'hanging-ivy', name: 'Hanging Ivy', price: 18, cat: 'hanging', desc: 'Trailing vines that spill over a hanging pot.' },
    { id: 'kokedama', name: 'Kokedama', price: 16, cat: 'hanging', desc: 'A little moss ball hung on twine.' },
    { id: 'hanging-fern', name: 'Hanging Fern', price: 20, cat: 'hanging', desc: 'Feathery fronds in a woven basket.' },
    { id: 'string-of-pearls', name: 'String of Pearls', price: 24, cat: 'hanging', desc: 'Strands of round green beads that dangle.' },
    { id: 'bonsai-tree', name: 'Bonsai Tree', price: 40, cat: 'trees', desc: 'A tiny old tree in a shallow tray. Very wise.' },
    { id: 'mini-palm', name: 'Mini Palm', price: 38, cat: 'trees', desc: 'A leafy palm for a sunny little corner.' },
    { id: 'fiddle-leaf-fig', name: 'Fiddle Leaf Fig', price: 48, cat: 'trees', desc: 'Big, glossy leaves on a slender trunk.' },
    { id: 'lemon-tree', name: 'Lemon Tree', price: 55, cat: 'trees', desc: 'Bright lemons and a lovely fresh scent.' },
    { id: 'sakura-tree', name: 'Sakura Tree', price: 65, cat: 'trees', desc: 'Soft pink blossoms that drift down like snow.' },
    { id: 'daisies', name: 'Daisies', price: 10, cat: 'flowers', desc: 'A cheerful bunch of white daisies.' },
    { id: 'tulips', name: 'Tulips', price: 12, cat: 'flowers', desc: 'Pink and red tulips tied with a ribbon.' },
    { id: 'sunflowers', name: 'Sunflowers', price: 14, cat: 'flowers', desc: 'Big golden blooms that follow the light.' },
    { id: 'lavender', name: 'Lavender', price: 16, cat: 'flowers', desc: 'Calming purple spikes that smell dreamy.' },
    { id: 'roses', name: 'Roses', price: 18, cat: 'flowers', desc: 'Velvety red roses with deep green leaves.' },
  ],
  clothes: [
    { id: 'beret', name: 'Beret', price: 15, cat: 'hats', wear: 'head', desc: 'A soft wool beret in deep berry red.' },
    { id: 'bucket-hat', name: 'Bucket Hat', price: 18, cat: 'hats', wear: 'head', desc: 'A sage bucket hat with a little stitched leaf.' },
    { id: 'flower-crown', name: 'Flower Crown', price: 24, cat: 'hats', wear: 'head', desc: 'Woven blossoms for your very own fairy tale.' },
    { id: 'striped-tee', name: 'Striped Tee', price: 20, cat: 'tops', wear: 'top', desc: 'A navy and white tee that goes with anything.' },
    { id: 'hoodie', name: 'Moss Hoodie', price: 30, cat: 'tops', wear: 'top', desc: 'Soft, slouchy and the color of a mossy log.' },
    { id: 'cardigan', name: 'Cream Cardigan', price: 32, cat: 'tops', wear: 'top', desc: 'A chunky knit with big wooden buttons.' },
    { id: 'cargo-pants', name: 'Cargo Pants', price: 28, cat: 'bottoms', wear: 'bottom', desc: 'Baggy and comfy, with pockets for acorns.' },
    { id: 'jeans', name: 'Blue Jeans', price: 26, cat: 'bottoms', wear: 'bottom', desc: 'Classic denim that gets better with wear.' },
    { id: 'plaid-skirt', name: 'Plaid Skirt', price: 24, cat: 'bottoms', wear: 'bottom', desc: 'A pleated plaid skirt in plum and green.' },
    { id: 'sneakers', name: 'Sneakers', price: 25, cat: 'shoes', wear: 'feet', desc: 'White sneakers made for long forest walks.' },
    { id: 'rain-boots', name: 'Rain Boots', price: 28, cat: 'shoes', wear: 'feet', desc: 'Yellow boots, perfect for puddle jumping.' },
    { id: 'canvas-tote', name: 'Canvas Tote', price: 10, cat: 'bags', wear: 'bag', desc: 'Roomy enough for snacks, books and a plant.' },
    { id: 'backpack', name: 'Backpack', price: 22, cat: 'bags', wear: 'bag', desc: 'A little green pack with a brass buckle.' },
  ],
};

// The tabs along the top of each shop's catalogue grid, left to right.
// (The matcha shop has no tabs: its few things sit on one page.)
// Labels are kept short so they fit across the panel.
export const SHOP_TABS = {
  pjs: [
    { id: 'sets', label: 'Sets' },
    { id: 'feet', label: 'Feet' },
    { id: 'head', label: 'Head' },
  ],
  furniture: [
    { id: 'lamps', label: 'Lamps' },
    { id: 'chairs', label: 'Chairs' },
    { id: 'beds', label: 'Beds' },
    { id: 'art', label: 'Decor' },
    { id: 'tables', label: 'Tables' },
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
    { id: 'bottoms', label: 'Pants' },
    { id: 'shoes', label: 'Shoes' },
    { id: 'bags', label: 'Bags' },
  ],
};
