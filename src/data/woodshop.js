// Timber & Twig, the woodworking shop at the far end of the street.
// Everything here is hand-made from forest wood: log benches, carved
// critters, workbenches, cuckoo clocks... (src/config.js adds this list to
// SHOP_STOCK.woodshop, so everything that works for shop items works here).
//
// Same fields as SHOP_STOCK (see the long comment above it in config.js):
//   id, name, desc, price (coins) or glimmers, cat (shop tab), books,
//   tags (style labels, ONLY for us, never shown to players), season, rarity.
//
// Where things go in your home:
//   - floor things have a size in FOOTPRINT (src/data/furniture.js) and a 3D
//     picture iso-<id>.png
//   - cat 'wall' things hang on a wall (clocks, signs, birdhouses)
// Paint slots (which parts you can recolor) are in src/data/paint.js.
//
// Pictures: tools/art/woodshop.js draws every one of these (the shop picture
// item-<id>.png, plus iso-<id>.png for floor things). `npm run art` stops
// with an error if an item here has no drawing there.
//
// Every tab has 5 or more things, so stock rotation always has something
// new to bring out (src/state/stock.js).
//
// Prices: everyday things 35-120 coins; big, fancy or rare pieces 3 Glimmers.

const SEATS = [
  { id: 'log-bench', name: 'Log Bench', price: 55, tags: ['forest', 'casual'], desc: 'A split log on two stumps. Seats three.' },
  { id: 'twig-chair', name: 'Twig Chair', price: 70, rarity: 'uncommon', tags: ['forest', 'cottagecore'], desc: 'Bent willow branches, woven into a chair.' },
  { id: 'settle-bench', name: 'Settle Bench', price: 95, tags: ['cottagecore'], desc: 'A tall-backed oak bench with a plump cushion.' },
  { id: 'milking-stool', name: 'Three-Leg Stool', price: 35, tags: ['cottagecore', 'casual'], desc: 'A little round stool that never wobbles.' },
  { id: 'carved-throne', name: 'Carved Throne', glimmers: 3, rarity: 'rare', tags: ['forest', 'emo'], desc: 'A grand oak chair with leaves carved up the back.' },
];

const TABLES = [
  { id: 'workbench', name: 'Workbench', price: 110, tags: ['forest', 'casual'], desc: 'A sturdy bench with a vise and a few tools.' },
  { id: 'trestle-table', name: 'Trestle Table', price: 90, tags: ['cottagecore', 'forest'], desc: 'Thick planks on crossed legs, made for feasts.' },
  { id: 'live-edge-table', name: 'Live Edge Table', price: 85, tags: ['forest', 'casual'], desc: 'A slab of walnut that keeps its wavy edge.' },
  { id: 'barrel-table', name: 'Barrel Table', price: 60, tags: ['casual', 'forest'], desc: 'An old cider barrel with a round top.' },
  { id: 'spool-table', name: 'Spool Table', price: 50, tags: ['casual', 'y2k'], desc: 'A big wooden cable spool, rolled indoors.' },
];

const SHELVES = [
  { id: 'blanket-ladder', name: 'Blanket Ladder', price: 50, tags: ['cottagecore', 'casual'], desc: 'A leaning ladder for your softest quilts.' },
  { id: 'pine-hutch', name: 'Pine Hutch', glimmers: 3, rarity: 'rare', tags: ['cottagecore'], desc: 'A cupboard with a rack of painted plates.' },
  { id: 'firewood-rack', name: 'Firewood Rack', price: 55, tags: ['forest', 'cottagecore'], desc: 'Neatly stacked logs. Smells like a campfire.' },
  { id: 'cubby-cabinet', name: 'Cubby Cabinet', price: 80, tags: ['casual', 'cottagecore'], desc: 'Lots of little cubbies for letters and seeds.' },
  { id: 'hall-tree', name: 'Hall Tree', price: 50, tags: ['cottagecore', 'emo'], desc: 'A branchy coat stand with a scarf and hat.' },
];

const CARVINGS = [
  { id: 'carved-bear', name: 'Carved Bear', price: 65, tags: ['forest'], desc: 'A chunky bear, chiseled from one log.' },
  { id: 'owl-totem', name: 'Owl Totem', price: 55, tags: ['forest', 'emo'], desc: 'A wise wooden owl perched on a post.' },
  { id: 'rocking-horse', name: 'Rocking Horse', price: 75, rarity: 'uncommon', tags: ['cottagecore', 'girly'], desc: 'A dappled horse with a yarn mane.' },
  { id: 'log-lamp', name: 'Birch Log Lamp', price: 55, tags: ['forest', 'casual'], desc: 'A birch log with a soft linen shade.' },
  { id: 'toy-wagon', name: 'Toy Wagon', price: 45, tags: ['cottagecore', 'casual'], desc: 'A little red wagon full of pinecones.' },
];

// these hang on a wall
const WALL = [
  { id: 'cuckoo-clock', name: 'Cuckoo Clock', price: 70, rarity: 'uncommon', tags: ['cottagecore', 'forest'], desc: 'A little bird pops out every hour. Cuckoo!' },
  { id: 'welcome-sign', name: 'Welcome Sign', price: 40, tags: ['cottagecore', 'girly'], desc: 'A painted plank with flowers round the edge.' },
  { id: 'birdhouse', name: 'Birdhouse', price: 45, tags: ['forest', 'cottagecore'], desc: 'A tiny house with a round door for a wren.' },
  { id: 'spoon-rack', name: 'Spoon Rack', price: 40, tags: ['cottagecore'], desc: 'Hand-carved spoons on a little wooden rail.' },
  { id: 'tree-slice', name: 'Tree Ring Slice', price: 45, tags: ['forest', 'casual'], desc: 'A polished log slice. Count the rings!' },
  { id: 'peg-rail', name: 'Peg Rail', price: 50, tags: ['cottagecore', 'casual'], desc: 'Wooden pegs hung with mugs and a basket.' },
];

// Stairs and steps (see src/data/stairs.js): they connect rooms, climb up to
// the top floor, or just make your home a maze.
const STAIRS = [
  { id: 'stairs-short', name: 'Short Stairs', price: 60, tags: ['forest', 'casual'], desc: 'Three little steps. Perfect between two rooms.' },
  { id: 'stairs-medium', name: 'Medium Stairs', price: 90, tags: ['cottagecore', 'casual'], desc: 'Five oak steps to climb up or down.' },
  { id: 'stairs-long', name: 'Long Stairs', price: 140, rarity: 'uncommon', tags: ['cottagecore', 'forest'], desc: 'A long, grand staircase. Reaches the top floor!' },
  { id: 'stairs-spiral', name: 'Spiral Stairs', glimmers: 4, rarity: 'rare', tags: ['forest', 'emo'], desc: 'A winding staircase round a tree trunk. Reaches the top floor!' },
];

const tab = (cat, list) => list.map((item) => ({ cat, ...item }));

export const WOODSHOP_STOCK = [
  ...tab('seats', SEATS),
  ...tab('tables', TABLES),
  ...tab('shelves', SHELVES),
  ...tab('carvings', CARVINGS),
  ...tab('wall', WALL),
  ...tab('stairs', STAIRS),
];
