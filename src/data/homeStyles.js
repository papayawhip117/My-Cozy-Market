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
export const WALLPAPERS = {
  'wallpaper-moss': { name: 'Moss Stripes', pattern: 'stripes', a: 0x3f5148, b: 0x45594f }, // the one every home starts with
  'wallpaper-rose': { name: 'Rose Dots', pattern: 'dots', a: 0x8a5a66, b: 0xd9a3ad },
  'wallpaper-sage': { name: 'Sage Stripes', pattern: 'stripes', a: 0x6b7f5e, b: 0x7d9170 },
  'wallpaper-night': { name: 'Starry Night', pattern: 'stars', a: 0x2c3352, b: 0xefdd8d },
};

// Flooring: `a` and `b` are the two main colors, `line` the gaps between.
//   boards  - long wooden planks
//   tiles   - square stone tiles, a little uneven
//   checker - a checkerboard of a and b
export const FLOORS = {
  'floor-oak': { name: 'Oak Boards', pattern: 'boards', a: 0x7a5a40, b: 0x70523a, line: 0x4a3426 }, // the living room and lower room start with this
  'floor-slate': { name: 'Slate Tiles', pattern: 'tiles', a: 0x56565e, b: 0x4e4e57, line: 0x2e2d34 }, // the entryway starts with this
  'floor-birch': { name: 'Birch Boards', pattern: 'boards', a: 0xc9a77c, b: 0xbd9a70, line: 0x8a6a4a },
  'floor-checker': { name: 'Checker Tiles', pattern: 'checker', a: 0xe6dcc4, b: 0x6b7f5e, line: 0x4a4a40 },
  'floor-terracotta': { name: 'Terracotta', pattern: 'tiles', a: 0xb8694a, b: 0xa95f42, line: 0x6a3a28 },
};

// Front doors. Each one is a picture home-<id>.png (36 x 66, same size as
// the plum door every home starts with) drawn by tools/art/homeStyles.js.
// `color`/`dark` are the paint and its shading, `shape` the outline:
//   arch  - tall with a rounded top
//   round - a short, completely round door
//   pane  - arched, with a little round window
export const DOORS = {
  'door-plum': { name: 'Plum Door', shape: 'arch', color: 0x5d4c85, dark: 0x45375e }, // every home starts with this one (home-door.png)
  'door-round': { name: 'Round Door', shape: 'round', color: 0x5e8f5a, dark: 0x3f6a3c },
  'door-red': { name: 'Red Door', shape: 'pane', color: 0xb8404a, dark: 0x82303a },
  'door-blue': { name: 'Blue Door', shape: 'arch', color: 0x4f6f9e, dark: 0x384f74 },
  'door-birch': { name: 'Birch Door', shape: 'pane', color: 0xd9c4a0, dark: 0xa8916e },
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
