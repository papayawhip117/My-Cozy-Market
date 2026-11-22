// Paint slots: which parts of a piece of furniture or a plant you can repaint.
//
// In Decorate mode each slot gets its own row of color swatches, and a slot
// repaints that WHOLE part (all of a sofa's fabric, all of a pot), keeping the
// shading so it still looks round and soft. A piece can have up to two slots.
//
//   'plum-sofa': [ { name: 'Sofa', color: 0x5d3f63 }, { name: 'Pillows', color: 0xd9a646 } ],
//
// `color` is roughly the main color of that part in the picture (any shade of
// it will do, the game matches by hue). Parts that aren't a slot (the white
// stem of a mushroom stool, glass, books) keep their own colors.
//
// Pieces missing from this list fall back to guessing their colors from the
// picture (src/world/Recolor.js), which is fine for simple things. An empty
// list means "this piece can't be painted".
//
// When you draw a new piece (tools/art/furniturePack.js), add it here too, and
// keep different slots in different color families (e.g. a green sofa with
// pink pillows) so the game can tell them apart.

const slot = (name, color) => ({ name, color });

export const PAINT = {
  // ----- sofas and chairs -----
  'moss-loveseat': [slot('Fabric', 0x5e7a4e)],
  'rose-settee': [slot('Fabric', 0xc98a96)],
  'plum-sofa': [slot('Sofa', 0x5d3f63), slot('Pillows', 0xd9a646)],
  chesterfield: [slot('Leather', 0x7a3f2e)],
  'wingback-chair': [slot('Fabric', 0x445e46)],
  'honey-armchair': [slot('Fabric', 0xc9963e)],
  'wicker-chair': [slot('Wicker', 0xc9a86a), slot('Cushions', 0xc99aa6)],
  'dining-chair': [slot('Wood', 0x9a6f48)],
  'spindle-chair': [slot('Paint', 0x7f9a80)],
  'bean-bag': [slot('Bean bag', 0x9f8cc0)],
  'bar-stool': [slot('Wood', 0x9a6f48)],
  'mushroom-stool': [slot('Cap', 0xb8404a)],
  'knit-pouf': [slot('Knit', 0xd8c8a8)],
  armchair: [slot('Fabric', 0xc99aa6)],
  'rocking-chair': [slot('Wood', 0x6b4a36), slot('Cushion', 0x7f9c78)],
  'wooden-stool': [slot('Wood', 0x6b4a36)],
  'floor-cushion': [slot('Cushion', 0xc99aa6)],
  hammock: [slot('Fabric', 0xf2b3c4), slot('Posts', 0x6b4a36)],

  // ----- tables and shelves -----
  'round-coffee-table': [slot('Wood', 0x9a6f48), slot('Vase', 0x7f9c78)],
  'square-coffee-table': [slot('Wood', 0x9a6f48)],
  'glass-coffee-table': [],
  'stump-table': [slot('Wood', 0x45302a)],
  'end-table': [slot('Wood', 0x9a6f48)],
  'crate-table': [slot('Crate', 0xc9a86a)],
  'dining-table': [slot('Wood', 0x9a6f48), slot('Runner', 0x7f9c78)],
  'bistro-table': [],
  'plant-stand': [slot('Wood', 0x9a6f48)],
  'iron-plant-stand': [slot('Fern', 0x5f8f5a)],
  'small-bookshelf': [slot('Wood', 0x6b4a36)],
  'tall-bookshelf': [slot('Wood', 0x45302a)],
  'tv-cabinet': [slot('Wood', 0x9a6f48)],
  'curio-cabinet': [slot('Wood', 0x6b4a36)],
  'side-table': [slot('Wood', 0x9a6f48)],
  'coffee-table': [slot('Wood', 0x9a6f48), slot('Books', 0x7f9c78)],
  desk: [slot('Wood', 0x6b4a36), slot('Lamp', 0x9f8cc0)],

  // ----- lamps -----
  'arc-lamp': [slot('Lamp', 0xd9a646)],
  candelabra: [slot('Brass', 0xd9a646)],

  // ----- beds and bedroom -----
  'single-bed': [slot('Frame', 0x9a6f48), slot('Quilt', 0x7f9c78)],
  'double-bed': [slot('Frame', 0x45302a), slot('Quilt', 0x9db88f)],
  daybed: [slot('Cover', 0xc99aa6)],
  'cozy-bed': [slot('Frame', 0x6b4a36), slot('Quilt', 0x9f8cc0)],
  nightstand: [slot('Wood', 0x6b4a36)],
  'round-nightstand': [slot('Cloth', 0xc99aa6)],
  'chest-of-drawers': [slot('Wood', 0x9a6f48)],
  vanity: [slot('Drawers', 0xc99aa6)],
  wardrobe: [slot('Paint', 0x7f9a80)],
  'bed-bench': [slot('Cushion', 0x9f8cc0), slot('Legs', 0x6b4a36)],
  'storage-trunk': [slot('Trunk', 0x8f4f3f)],
  'floor-mirror': [slot('Frame', 0x9a6f48)],

  // ----- rugs -----
  'striped-rug': [slot('Stripe 1', 0x7f9c78), slot('Stripe 2', 0x8f4f3f)],
  'mushroom-rug': [slot('Rug', 0xb8404a)],
  'moon-rug': [slot('Rug', 0x2c3352), slot('Border', 0xd9a646)],
  'woven-rug': [slot('Pattern', 0xa8583e), slot('Base', 0xd8c8a8)],
  'rose-rug': [slot('Rug', 0xa5503f), slot('Border', 0x2c3352)],
  'checker-rug': [slot('Squares', 0x7f9c78)],
  'floral-runner': [slot('Border', 0x5f7d5c), slot('Flowers', 0xc99aa6)],
  'sage-runner': [slot('Runner', 0x7f9c78)],
  'moss-rug': [slot('Rug', 0x6a8a45)],

  // ----- Timber & Twig (src/data/woodshop.js) -----
  'log-bench': [slot('Wood', 0x8a6446)],
  'twig-chair': [slot('Twigs', 0x8a6446), slot('Cushion', 0x7f9c78)],
  'settle-bench': [slot('Wood', 0x9a6f48), slot('Cushion', 0xa8583e)],
  'milking-stool': [slot('Wood', 0x9a6f48)],
  'carved-throne': [slot('Wood', 0x6e4c32), slot('Cushion', 0x8b3f52)],
  workbench: [slot('Wood', 0xb08a5a)],
  'stairs-short': [slot('Wood', 0xb08a5a)],
  'stairs-medium': [slot('Wood', 0xb08a5a)],
  'stairs-long': [slot('Wood', 0xb08a5a)],
  'stairs-spiral': [slot('Wood', 0xb08a5a)],
  'trestle-table': [slot('Wood', 0x9a6f48)],
  'live-edge-table': [slot('Wood', 0x6e4c32)],
  'barrel-table': [slot('Wood', 0x9a6f48)],
  'spool-table': [slot('Wood', 0xb08a5a)],
  'blanket-ladder': [slot('Wood', 0x9a6f48), slot('Quilts', 0x7f9c78)],
  'pine-hutch': [slot('Paint', 0x7f9a80)],
  'firewood-rack': [slot('Rack', 0x45302a)],
  'cubby-cabinet': [slot('Wood', 0x9a6f48)],
  'hall-tree': [slot('Wood', 0x6e4c32)],
  'carved-bear': [slot('Wood', 0x8a6446)],
  'owl-totem': [slot('Wood', 0x9a6f48)],
  'rocking-horse': [slot('Saddle', 0xb8404a)],
  'log-lamp': [slot('Shade', 0xd8c8a8)],
  'toy-wagon': [slot('Wagon', 0xb8404a)],
  'cuckoo-clock': [slot('Wood', 0x6e4c32)],
  'welcome-sign': [slot('Wood', 0x9a6f48)],
  birdhouse: [slot('House', 0x7f9a80)],
  'spoon-rack': [slot('Wood', 0x9a6f48)],
  'peg-rail': [slot('Wood', 0x9a6f48)],

  // ----- the window (always in your home) -----
  window: [slot('Frame', 0x8a6a4c), slot('Curtains', 0x7e6aa6)],

  // ----- wall pieces -----
  'plant-shelf': [slot('Wood', 0x9a6f48)],
  'jar-shelf': [slot('Wood', 0x9a6f48)],
  'wall-shelf': [slot('Wood', 0x9a6f48)],
  'lace-curtains': [slot('Cloth', 0xece2cc)],
  'velvet-curtains': [slot('Cloth', 0x5d3f63), slot('Rod', 0xd9a646)],
  'sage-curtains': [slot('Cloth', 0x7f9c78)],

  // ----- plants -----
  'tiny-cactus': [slot('Cactus', 0x5f8f5a), slot('Pot', 0xb8694a)],
  'succulent-trio': [slot('Plants', 0x7fa89a), slot('Pot', 0xb8694a)],
  'flower-pot': [slot('Leaves', 0x4f7a4a), slot('Pot', 0xe6ddcc)],
  'snake-plant': [slot('Leaves', 0x4f7a4a), slot('Pot', 0x8a8a90)],
  'peace-lily': [slot('Leaves', 0x4f7a4a), slot('Pot', 0x8a8a90)],
  'boston-fern': [slot('Fronds', 0x3f6b4a), slot('Pot', 0xb8694a)],
  monstera: [slot('Leaves', 0x4f7a4a), slot('Pot', 0x34303a)],
  'bonsai-tree': [slot('Leaves', 0x4f7a4a), slot('Tray', 0x34303a)],
  'mini-palm': [slot('Leaves', 0x4f7a4a), slot('Pot', 0xb8694a)],
  'fiddle-leaf-fig': [slot('Leaves', 0x4f7a4a), slot('Pot', 0xe6ddcc)],
  'lemon-tree': [slot('Leaves', 0x4f7a4a), slot('Pot', 0xb8694a)],
  'sakura-tree': [slot('Blossom', 0xf2b3c4), slot('Pot', 0x34303a)],
  daisies: [slot('Planter', 0x9a6f48)],
  tulips: [slot('Planter', 0x9a6f48), slot('Flowers', 0xb8404a)],
  sunflowers: [slot('Planter', 0x9a6f48), slot('Flowers', 0xf2c94c)],
  lavender: [slot('Planter', 0x9a6f48), slot('Flowers', 0x9f8cc0)],
  roses: [slot('Planter', 0x9a6f48), slot('Flowers', 0xb8404a)],
};

// The name of a piece's paint slot (for the swatch rows), or a plain
// "Main" / "Accent" for pieces that are guessed from their picture.
export function slotName(id, index) {
  return PAINT[id]?.[index]?.name ?? (index === 0 ? 'Main' : 'Accent');
}
