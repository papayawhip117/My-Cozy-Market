// How much floor each piece of furniture (and each floor plant) covers in
// your isometric home, as [across, deep] in floor units.
//
// The living room floor is 64 x 64 units (8 x 8 boards of 8 units). One unit is
// 2 pixels sideways and 1 pixel down on screen, the usual isometric 2:1.
// "across" runs toward the bottom-right of the screen, "deep" toward the
// bottom-left, which is where every piece's front faces.
//
// tools/art/furniture.js draws each picture (iso-<id>.png) to exactly this
// size, and src/ui/HomeDecorator.js uses it to keep things on the floor and
// to work out what is in front of what. Change a size here, then run
// `npm run art` so the picture matches.
export const FOOTPRINT = {
  // furniture shop
  'cozy-bed': [16, 24],
  'canopy-bed': [16, 24],
  hammock: [10, 28],
  armchair: [12, 12],
  'rocking-chair': [10, 12],
  'wooden-stool': [6, 6],
  'floor-cushion': [9, 9],
  'side-table': [8, 8],
  'coffee-table': [16, 10],
  desk: [18, 9],
  'floor-lamp': [6, 6],
  'bedside-lamp': [5, 5],
  'mushroom-lamp': [7, 7],
  'paper-lantern': [7, 7],
  'book-stack': [6, 5],
  'round-rug': [16, 16],
  'striped-rug': [10, 24],
  'moss-rug': [20, 14],

  // the big furniture pack (src/data/furniturePack.js)
  'moss-loveseat': [16, 9],
  'rose-settee': [16, 9],
  'plum-sofa': [20, 10],
  chesterfield: [20, 10],
  'wingback-chair': [12, 12],
  'honey-armchair': [12, 12],
  'wicker-chair': [12, 12],
  'dining-chair': [7, 7],
  'spindle-chair': [7, 7],
  'bean-bag': [10, 10],
  'bar-stool': [6, 6],
  'mushroom-stool': [6, 6],
  'knit-pouf': [7, 7],
  'round-coffee-table': [14, 14],
  'square-coffee-table': [12, 12],
  'glass-coffee-table': [16, 10],
  'stump-table': [8, 8],
  'end-table': [7, 7],
  'crate-table': [8, 8],
  'dining-table': [24, 14],
  'bistro-table': [9, 9],
  'plant-stand': [12, 6],
  'iron-plant-stand': [6, 6],
  'small-bookshelf': [14, 6],
  'tall-bookshelf': [18, 7],
  'tv-cabinet': [16, 8],
  'curio-cabinet': [12, 7],
  'arc-lamp': [7, 7],
  'lantern-lamp': [6, 6],
  candelabra: [6, 6],
  'star-lamp': [6, 6],
  'single-bed': [12, 22],
  'double-bed': [18, 24],
  'iron-bed': [18, 24],
  daybed: [24, 11],
  nightstand: [7, 7],
  'round-nightstand': [7, 7],
  'chest-of-drawers': [16, 8],
  vanity: [16, 8],
  wardrobe: [16, 9],
  'bed-bench': [16, 6],
  'storage-trunk': [12, 7],
  'floor-mirror': [8, 4],
  'mushroom-rug': [14, 14],
  'moon-rug': [16, 16],
  'woven-rug': [24, 16],
  'rose-rug': [26, 18],
  'checker-rug': [20, 20],
  'floral-runner': [10, 26],
  'sage-runner': [9, 28],

  // Timber & Twig, the woodworking shop (src/data/woodshop.js)
  'log-bench': [18, 6],
  'twig-chair': [10, 10],
  'settle-bench': [18, 7],
  'milking-stool': [6, 6],
  'carved-throne': [12, 11],
  workbench: [20, 9],
  'trestle-table': [22, 12],
  'live-edge-table': [16, 10],
  'barrel-table': [8, 8],
  'spool-table': [11, 11],
  'blanket-ladder': [9, 4],
  'pine-hutch': [16, 7],
  'firewood-rack': [14, 5],
  'cubby-cabinet': [12, 6],
  'hall-tree': [7, 7],
  'carved-bear': [8, 8],
  'owl-totem': [5, 5],
  'rocking-horse': [14, 5],
  'log-lamp': [6, 6],
  'toy-wagon': [12, 7],

  // the Seasonal Cart's decorations (src/data/seasonal.js)
  'festive-tree': [10, 10],
  'pumpkin-patch': [12, 9],

  // plant shop
  'tiny-cactus': [5, 5],
  'succulent-trio': [8, 6],
  'flower-pot': [6, 6],
  'snake-plant': [6, 6],
  'peace-lily': [6, 6],
  'boston-fern': [7, 7],
  monstera: [8, 8],
  'bonsai-tree': [10, 7],
  'mini-palm': [8, 8],
  'fiddle-leaf-fig': [8, 8],
  'lemon-tree': [8, 8],
  'sakura-tree': [10, 10],
  daisies: [9, 5],
  tulips: [9, 5],
  sunflowers: [9, 5],
  lavender: [9, 5],
  roses: [9, 5],

  // the dresser that's always in your home
  dresser: [18, 8],
};

// Rugs lie flat: they're always under the furniture (and your pal), never in front.
export const FLAT = new Set([
  'round-rug', 'striped-rug', 'moss-rug',
  'mushroom-rug', 'moon-rug', 'woven-rug', 'rose-rug', 'checker-rug', 'floral-runner', 'sage-runner',
]);

// Wall things with a big picture of their own (wall-<id>.png, drawn at room
// size by tools/art/furniturePack.js) instead of their little shop picture
// blown up. `upright: true` = it hangs straight down in front of the wall
// (hanging plants on a hook) instead of lying flat against it.
export const WALL_ART = {
  'plant-shelf': {},
  'jar-shelf': {},
  'wall-shelf': {},
  'lace-curtains': {},
  'velvet-curtains': {},
  'sage-curtains': {},
  'hanging-ivy': { upright: true },
  kokedama: { upright: true },
  'hanging-fern': { upright: true },
  'string-of-pearls': { upright: true },
};
export const wallArtTexture = (id) => `wall-${id}`;

// The picture a floor thing uses at home.
export const isoTexture = (id) => (id === 'dresser' ? 'home-dresser' : `iso-${id}`);
