// The big furniture pack: everything the furniture shop sells on top of the
// first few pieces in SHOP_STOCK (src/config.js adds this list to
// SHOP_STOCK.furniture, so everything that works for shop items works here).
//
// Same fields as SHOP_STOCK (see the long comment above it in config.js):
//   id, name, desc, price (coins) or glimmers, cat (shop tab), books,
//   tags (style labels, ONLY for us, never shown to players), season, rarity.
//
// Where things go in your home:
//   - floor things have a size in FOOTPRINT (src/data/furniture.js) and a 3D
//     picture iso-<id>.png
//   - cat 'wall' things hang on a wall (shelves, frames, mirrors, curtains)
//   - rugs (cat 'rugs') lie flat under everything (FLAT in furniture.js)
//
// Pictures: tools/art/furniturePack.js draws every one of these (the shop
// picture item-<id>.png, plus iso-<id>.png or wall-<id>.png). `npm run art`
// stops with an error if an item here has no drawing there.
//
// Prices: everyday things 30-150 coins; big, fancy or rare pieces 2-5 Glimmers.

// ---------- living room ----------

const SOFAS = [
  { id: 'moss-loveseat', name: 'Moss Loveseat', price: 120, tags: ['forest', 'cottagecore'], desc: 'A little two-seater in soft moss velvet.' },
  { id: 'rose-settee', name: 'Rose Settee', price: 130, tags: ['girly', 'cottagecore'], desc: 'Dusty pink with carved wooden feet.' },
  { id: 'plum-sofa', name: 'Plum Sofa', price: 145, tags: ['emo', 'casual'], desc: 'Long, deep and very good for naps.' },
  { id: 'chesterfield', name: 'Chesterfield', glimmers: 3, rarity: 'rare', tags: ['emo', 'cottagecore'], desc: 'Tufted leather, rolled arms, old library smell.' },
];

const CHAIRS = [
  { id: 'wingback-chair', name: 'Wingback Chair', price: 100, tags: ['cottagecore', 'forest'], desc: 'A tall green chair that hugs you back.' },
  { id: 'honey-armchair', name: 'Honey Armchair', price: 95, tags: ['cottagecore', 'casual'], desc: 'Round, squashy and the color of honey.' },
  { id: 'wicker-chair', name: 'Wicker Chair', price: 90, tags: ['forest', 'girly'], rarity: 'uncommon', desc: 'A woven chair with a big round back.' },
  { id: 'dining-chair', name: 'Ladder Chair', price: 45, tags: ['cottagecore', 'casual'], desc: 'A plain wooden chair with a rush seat.' },
  { id: 'spindle-chair', name: 'Spindle Chair', price: 50, tags: ['cottagecore'], desc: 'Painted sage, with a tall spindle back.' },
  { id: 'bean-bag', name: 'Bean Bag', price: 60, tags: ['casual', 'y2k'], desc: 'Flop down and sink right in.' },
  { id: 'bar-stool', name: 'Tall Stool', price: 45, tags: ['casual'], desc: 'A tall oak stool with a footrest.' },
  { id: 'mushroom-stool', name: 'Mushroom Stool', price: 40, tags: ['forest', 'girly'], desc: 'A red toadstool you can actually sit on.' },
  { id: 'knit-pouf', name: 'Knit Pouf', price: 40, tags: ['cottagecore', 'casual'], desc: 'A chunky knitted footstool in oatmeal.' },
];

const TABLES = [
  { id: 'round-coffee-table', name: 'Round Coffee Table', price: 70, tags: ['cottagecore', 'casual'], desc: 'A round oak table with a lace doily.' },
  { id: 'square-coffee-table', name: 'Square Coffee Table', price: 70, tags: ['casual'], desc: 'A sturdy square table with a shelf below.' },
  { id: 'glass-coffee-table', name: 'Glass Coffee Table', price: 95, rarity: 'uncommon', tags: ['y2k', 'emo'], desc: 'A glass top on curly iron legs.' },
  { id: 'stump-table', name: 'Stump Table', price: 55, tags: ['forest'], desc: 'A cut tree stump. You can count the rings.' },
  { id: 'end-table', name: 'End Table', price: 50, tags: ['casual', 'cottagecore'], desc: 'A small table with a drawer for odds and ends.' },
  { id: 'crate-table', name: 'Crate Table', price: 40, tags: ['forest', 'casual'], desc: 'An old fruit crate, flipped and full of books.' },
  { id: 'dining-table', name: 'Farmhouse Table', price: 120, tags: ['cottagecore'], desc: 'A long table for big suppers with friends.' },
  { id: 'bistro-table', name: 'Bistro Table', price: 60, tags: ['girly', 'cottagecore'], desc: 'A tiny round cafe table for two.' },
  { id: 'plant-stand', name: 'Plant Stand', price: 60, tags: ['forest', 'cottagecore'], desc: 'Three wooden steps of little potted plants.' },
  { id: 'iron-plant-stand', name: 'Iron Plant Stand', price: 65, tags: ['emo', 'forest'], desc: 'A tall black stand with a trailing fern.' },
];

const STORAGE = [
  { id: 'small-bookshelf', name: 'Small Bookshelf', price: 110, tags: ['cottagecore', 'casual'], desc: 'Two shelves of favorite books and a candle.' },
  { id: 'tall-bookshelf', name: 'Library Shelf', glimmers: 4, rarity: 'rare', tags: ['cottagecore', 'emo'], desc: 'Floor to ceiling books. Smells like old paper.' },
  { id: 'tv-cabinet', name: 'TV Cabinet', price: 120, tags: ['y2k', 'casual'], desc: 'A chunky old TV on a wooden cabinet.' },
  { id: 'curio-cabinet', name: 'Curio Cabinet', glimmers: 3, rarity: 'rare', tags: ['cottagecore', 'girly'], desc: 'Glass doors, teacups and tiny treasures.' },
];

const LAMPS = [
  { id: 'arc-lamp', name: 'Arc Lamp', price: 85, tags: ['casual', 'y2k'], desc: 'Bends over the sofa like a sleepy flower.' },
  { id: 'lantern-lamp', name: 'Iron Lantern', price: 55, tags: ['forest', 'emo'], desc: 'A black lantern with a candle inside.' },
  { id: 'candelabra', name: 'Candelabra', price: 70, tags: ['emo', 'cottagecore'], desc: 'Three tall candles on a twisty stand.' },
  { id: 'star-lamp', name: 'Star Lamp', price: 50, tags: ['girly', 'y2k'], desc: 'A glowing star that sits on the floor.' },
];

// ---------- bedroom ----------

const BEDS = [
  { id: 'single-bed', name: 'Single Bed', price: 90, tags: ['casual', 'cottagecore'], desc: 'A narrow bed with a patchwork quilt.' },
  { id: 'double-bed', name: 'Double Bed', price: 140, tags: ['cottagecore', 'casual'], desc: 'Big enough to starfish. Sage linen sheets.' },
  { id: 'iron-bed', name: 'Iron Bed', glimmers: 3, rarity: 'rare', tags: ['emo', 'cottagecore'], desc: 'Curly black iron and a cloud of a duvet.' },
  { id: 'daybed', name: 'Daybed', price: 130, rarity: 'uncommon', tags: ['girly', 'cottagecore'], desc: 'Half sofa, half bed, all afternoon naps.' },
];

// Bedroom furniture shows in the Bedroom book (its own tab, 'dressers').
const DRESSERS = [
  { id: 'nightstand', name: 'Nightstand', price: 55, tags: ['cottagecore', 'casual'], desc: 'A bedside table with one little drawer.' },
  { id: 'round-nightstand', name: 'Round Nightstand', price: 50, tags: ['girly'], desc: 'A round table with a skirt of pink cloth.' },
  { id: 'chest-of-drawers', name: 'Chest of Drawers', price: 120, tags: ['cottagecore'], desc: 'Four deep drawers with brass handles.' },
  { id: 'vanity', name: 'Vanity', glimmers: 4, rarity: 'rare', tags: ['girly', 'cottagecore'], desc: 'A mirror, a stool and room for every ribbon.' },
  { id: 'wardrobe', name: 'Wardrobe', glimmers: 3, rarity: 'rare', tags: ['cottagecore', 'forest'], desc: 'A tall painted wardrobe. Is there a forest inside?' },
  { id: 'bed-bench', name: 'Bed Bench', price: 70, tags: ['cottagecore', 'casual'], desc: 'A cushioned bench for the end of your bed.' },
  { id: 'storage-trunk', name: 'Storage Trunk', price: 75, tags: ['forest', 'emo'], desc: 'An old trunk with iron corners. Full of quilts.' },
  { id: 'floor-mirror', name: 'Standing Mirror', price: 90, tags: ['girly'], desc: 'A tall oval mirror for checking your outfit.' },
];

// ---------- all over the house ----------

// rugs lie flat on the floor, under everything else
const RUGS = [
  { id: 'mushroom-rug', name: 'Mushroom Rug', price: 50, tags: ['forest', 'girly'], desc: 'A round red rug with cream spots.' },
  { id: 'moon-rug', name: 'Moon Rug', price: 55, tags: ['emo'], desc: 'Midnight blue with a sleepy golden moon.' },
  { id: 'woven-rug', name: 'Woven Rug', price: 60, tags: ['cottagecore', 'casual'], desc: 'A big flatweave rug in rust and cream.' },
  { id: 'rose-rug', name: 'Rose Rug', glimmers: 2, rarity: 'rare', tags: ['cottagecore', 'girly'], desc: 'An old rug with roses woven in the middle.' },
  { id: 'checker-rug', name: 'Checker Rug', price: 55, tags: ['y2k', 'casual'], desc: 'Fuzzy squares of cream and sage.' },
  { id: 'floral-runner', name: 'Floral Runner', price: 45, tags: ['cottagecore'], desc: 'A long hall runner with little flowers.' },
  { id: 'sage-runner', name: 'Sage Runner', price: 45, tags: ['forest', 'casual'], desc: 'A soft green runner with a cream border.' },
];

// these hang on a wall
const WALL = [
  { id: 'round-mirror', name: 'Round Mirror', price: 55, tags: ['casual', 'girly'], desc: 'A round mirror hung on a leather strap.' },
  { id: 'sunburst-mirror', name: 'Sunburst Mirror', glimmers: 2, rarity: 'rare', tags: ['girly', 'cottagecore'], desc: 'A golden sun with a mirror for a face.' },
  { id: 'wall-shelf', name: 'Book Shelf', price: 45, tags: ['cottagecore', 'casual'], desc: 'A little shelf with books and a candle.' },
  { id: 'jar-shelf', name: 'Jar Shelf', price: 55, tags: ['cottagecore'], desc: 'Jars of jam, honey and dried flowers.' },
  { id: 'plant-shelf', name: 'Plant Shelf', price: 60, tags: ['forest'], desc: 'A shelf of tiny plants with a trailing vine.' },
  { id: 'frame-trio', name: 'Frame Trio', price: 50, tags: ['casual', 'cottagecore'], desc: 'Three little frames of happy memories.' },
  { id: 'forest-painting', name: 'Forest Painting', price: 65, tags: ['forest'], desc: 'An oil painting of a misty pine forest.' },
  { id: 'cat-portrait', name: 'Cat Portrait', price: 60, tags: ['cottagecore', 'girly'], desc: 'A very serious cat in a very fancy frame.' },
  { id: 'pressed-flowers', name: 'Pressed Flowers', price: 45, tags: ['cottagecore', 'girly'], desc: 'Wildflowers pressed under glass.' },
  { id: 'moth-tapestry', name: 'Moth Tapestry', price: 70, tags: ['emo', 'forest'], desc: 'A woven moth under a crescent moon.' },
  { id: 'lace-curtains', name: 'Lace Curtains', price: 50, tags: ['cottagecore', 'girly'], desc: 'Hang them by a window, or anywhere at all.' },
  { id: 'velvet-curtains', name: 'Velvet Curtains', price: 75, tags: ['emo'], desc: 'Heavy plum velvet with golden tiebacks.' },
  { id: 'sage-curtains', name: 'Sage Curtains', price: 50, tags: ['forest', 'casual'], desc: 'Soft green linen on a wooden rod.' },
];

// wallpaper is put up, not placed (patterns in src/data/homeStyles.js)
const WALLPAPERS = [
  { id: 'wallpaper-black', name: 'Ink Black', price: 50, tags: ['emo'], desc: 'Wallpaper: deep black with a faint pattern.' },
  { id: 'wallpaper-white', name: 'Milk White', price: 45, tags: ['casual', 'cottagecore'], desc: 'Wallpaper: soft creamy white. Fresh and bright.' },
  { id: 'wallpaper-brick', name: 'Red Brick', price: 55, tags: ['casual', 'emo'], desc: 'Wallpaper: old red brick, like a city loft.' },
  { id: 'wallpaper-stone', name: 'Mossy Stone', price: 55, tags: ['forest'], desc: 'Wallpaper: gray castle stone with moss.' },
  { id: 'wallpaper-floral', name: 'Wildflowers', price: 50, tags: ['cottagecore', 'girly'], desc: 'Wallpaper: little flowers on warm cream.' },
  { id: 'wallpaper-panel', name: 'Wood Panels', price: 55, tags: ['cottagecore', 'forest'], desc: 'Wallpaper: honey wood boards, cabin style.' },
  { id: 'wallpaper-gingham', name: 'Butter Gingham', price: 50, tags: ['cottagecore', 'girly'], desc: 'Wallpaper: buttery yellow checks.' },
];

const tab = (cat, list, extra = {}) => list.map((item) => ({ cat, ...extra, ...item }));

export const FURNITURE_PACK = [
  ...tab('sofas', SOFAS),
  ...tab('chairs', CHAIRS),
  ...tab('tables', TABLES),
  ...tab('storage', STORAGE),
  ...tab('lamps', LAMPS),
  ...tab('beds', BEDS),
  ...tab('dressers', DRESSERS),
  ...tab('rugs', RUGS),
  ...tab('wall', WALL),
  ...tab('walls', WALLPAPERS),
];
