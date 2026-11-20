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
export const FLAT = new Set(['round-rug', 'striped-rug', 'moss-rug']);

// The picture a floor thing uses at home.
export const isoTexture = (id) => (id === 'dresser' ? 'home-dresser' : `iso-${id}`);
