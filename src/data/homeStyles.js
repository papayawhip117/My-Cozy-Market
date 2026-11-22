// Wallpaper, flooring and front doors for your home.
//
// These aren't things you place: you buy them in the furniture shop, then in
// decorate mode click one in "Your things" to put it up. Wallpaper covers
// every wall, flooring goes on whichever room you click, and a door style
// swaps the look of your front door.
//
// The game draws walls and floors from these patterns while it runs
// (src/world/IsoRoom.js), and tools/art/homeStyles.js uses the same numbers
// to draw the little shop pictures, so they always match.
//
// Each shop item with the same id lives in SHOP_STOCK.furniture
// (src/config.js) with cat 'walls', 'floors' or 'doors'.

// Wallpaper: `a` is the main color, `b` the pattern color.
//   stripes - wide stripes of a and b
//   dots    - little b dots on a
//   stars   - tiny b stars scattered on a
//   plain   - plain a, with a b wooden rail across
//   damask  - faint little b diamonds (c centers) on a
//   brick   - a bricks with b mortar
//   stone   - big a stone blocks, b gaps, a little c moss
//   flowers - tiny b flowers with c leaves on a
//   panels  - upright a boards, b seams, c knots
//   gingham - a checks crossed with b, c where they meet
export const WALLPAPERS = {
  'wallpaper-moss': { name: 'Moss Stripes', pattern: 'stripes', a: 0x3f5148, b: 0x45594f }, // the one every home starts with
  'wallpaper-rose': { name: 'Rose Dots', pattern: 'dots', a: 0x8a5a66, b: 0xd9a3ad },
  'wallpaper-sage': { name: 'Sage Stripes', pattern: 'stripes', a: 0x6b7f5e, b: 0x7d9170 },
  'wallpaper-night': { name: 'Starry Night', pattern: 'stars', a: 0x2c3352, b: 0xefdd8d },
  'wallpaper-black': { name: 'Ink Black', pattern: 'damask', a: 0x1e1b22, b: 0x2f2a36, c: 0x4a3f55 },
  'wallpaper-white': { name: 'Milk White', pattern: 'plain', a: 0xcfc4ae, b: 0x8a6446 },
  'wallpaper-brick': { name: 'Red Brick', pattern: 'brick', a: 0x8f4a3a, b: 0x5a3a32 },
  'wallpaper-stone': { name: 'Mossy Stone', pattern: 'stone', a: 0x6e6a6a, b: 0x45424a, c: 0x5f7d4a },
  'wallpaper-floral': { name: 'Wildflowers', pattern: 'flowers', a: 0xd9c9a6, b: 0xc97a8a, c: 0x6f8a5e },
  'wallpaper-panel': { name: 'Wood Panels', pattern: 'panels', a: 0x9a6c46, b: 0x6b4a36, c: 0x5a3e2c },
  'wallpaper-plum': { name: 'Plum Velvet', pattern: 'damask', a: 0x43324f, b: 0x5a4268, c: 0xc9a646 },
  'wallpaper-garden': { name: 'Midnight Garden', pattern: 'flowers', a: 0x2f4a3c, b: 0xe0a0b0, c: 0x6f9a5c },
  'wallpaper-dusk': { name: 'Dusk Dots', pattern: 'dots', a: 0x3a4a6a, b: 0x8fa4cc },
  'wallpaper-cream': { name: 'Cream Stripes', pattern: 'stripes', a: 0xd9cdb4, b: 0xc9b998 },
  'wallpaper-gingham': { name: 'Butter Gingham', pattern: 'gingham', a: 0xeedd9e, b: 0xdcc47a, c: 0xc9ac5e },
};

// Flooring: `a` and `b` are the two main colors, `line` the gaps between.
//   boards  - long wooden planks
//   tiles   - square stone tiles, a little uneven
//   checker - a checkerboard of a and b
//   carpet  - soft a carpet with b flecks and lighter `line` flecks, no seams
export const FLOORS = {
  'floor-oak': { name: 'Oak Boards', pattern: 'boards', a: 0x7a5a40, b: 0x70523a, line: 0x4a3426 }, // the living room and lower room start with this
  'floor-slate': { name: 'Slate Tiles', pattern: 'tiles', a: 0x56565e, b: 0x4e4e57, line: 0x2e2d34 }, // the entryway starts with this
  'floor-birch': { name: 'Birch Boards', pattern: 'boards', a: 0xc9a77c, b: 0xbd9a70, line: 0x8a6a4a },
  'floor-checker': { name: 'Checker Tiles', pattern: 'checker', a: 0xe6dcc4, b: 0x6b7f5e, line: 0x4a4a40 },
  'floor-terracotta': { name: 'Terracotta', pattern: 'tiles', a: 0xb8694a, b: 0xa95f42, line: 0x6a3a28 },
  'floor-dark': { name: 'Dark Walnut', pattern: 'boards', a: 0x4a3426, b: 0x413022, line: 0x24170f },
  'floor-carpet': { name: 'Plush Carpet', pattern: 'carpet', a: 0x9c7a8a, b: 0x8a6a7a, line: 0xb89aa8 },
};

// Front doors. Each one is a picture home-<id>.png (36 x 66, same size as
// the plum door every home starts with) drawn by tools/art/homeStyles.js.
// `color`/`dark` are the paint and its shading, `shape` the outline:
//   arch  - tall with a rounded top
//   round - a short, completely round door
//   pane  - arched, with a little round window
export const DOORS = {
  // every door starts out brown, the same oak as the oak floor (0x7a5a40); paint it any color at home.
  // (the ids still say plum, red and blue from when the doors had those colors, so old saves keep working)
  'door-plum': { name: 'Oak Door', shape: 'arch', color: 0x7a5a40, dark: 0x5a4030 }, // every home starts with this one (home-door.png)
  'door-round': { name: 'Round Door', shape: 'round', color: 0x7a5a40, dark: 0x5a4030 },
  'door-red': { name: 'Cottage Door', shape: 'pane', color: 0x7a5a40, dark: 0x5a4030 },
  'door-blue': { name: 'Arched Door', shape: 'arch', color: 0x6b4c36, dark: 0x4a3426 },
  'door-birch': { name: 'Light Oak Door', shape: 'pane', color: 0xa8825a, dark: 0x846240 },
};

// What a home has before you buy anything.
export const DEFAULT_WALLPAPER = 'wallpaper-moss';
export const DEFAULT_DOOR = 'door-plum';
export const DEFAULT_FLOORS = { main: 'floor-oak', entry: 'floor-slate', lower: 'floor-oak' };

// The picture a door style uses at home.
export const doorTexture = (id) => (id && id !== DEFAULT_DOOR && DOORS[id] ? `home-${id}` : 'home-door');

// Which kind of home style an id is: 'wallpaper', 'floor', 'door' or null.
export function styleKind(id) {
  if (WALLPAPERS[id]) return 'wallpaper';
  if (FLOORS[id]) return 'floor';
  if (DOORS[id]) return 'door';
  return null;
}
