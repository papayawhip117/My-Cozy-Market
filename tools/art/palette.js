// The palette: dark cottagecore at dusk. Weathered wood, mossy stone,
// deep forest greens, dusty rose and lilac, and warm lantern light.
// Every color the art uses lives here, so changing one value recolors
// it everywhere when you rerun `npm run art`.

export const P = {
  // outlines
  line: 0x1c1822, // near-black plum, the main outline
  lineSoft: 0x3a3040,

  // skin
  skin: 0xf6dccb,
  skinShade: 0xe0b8a4,
  skinLine: 0x5a3a3e,
  blush: 0xe89aa0,
  mouth: 0xa8505c,

  // eyes (the colored iris is tinted in-game, see GRAY below)
  lash: 0x2a1f28,
  shine: 0xffffff,

  // default outfit: cream blouse, moss pinafore, dark boots
  shirt: 0xe9dcc4,
  shirtShade: 0xc7b597,
  skirt: 0x56744e,
  skirtShade: 0x415a3c,
  shoe: 0x4a3226,
  shoeShade: 0x33231b,

  // weathered wood
  wood: 0x6b4a36,
  woodDark: 0x45302a,
  woodLight: 0x8a6446,

  // old plaster
  cream: 0xd8c8a8,
  creamShade: 0xb09f82,

  // greens
  sage: 0x7f9c78,
  sageShade: 0x5f7d5c,
  sageDark: 0x445e46,
  sageLight: 0x9db88f,
  leaf: 0x4f7a4a,
  leafDark: 0x31523a,
  leafLight: 0x6f9a5c,
  moss: 0x6a8a45,
  mossDark: 0x4a6634,
  mossLight: 0x8aab58,
  fern: 0x3f6b43,

  // dusty pinks & purples
  pink: 0xc99aa6,
  pinkShade: 0xa8788a,
  pinkDark: 0x7d566a,
  lilac: 0x9f8cc0,
  lilacShade: 0x7e6aa6,
  lilacDark: 0x5d4c85,
  plum: 0x45375e,

  // aged stone & brick
  stone: 0x8f8a86,
  stoneShade: 0x6e6a68,
  stoneDark: 0x4f4c4d,
  brick: 0x8f4f3f,
  brickDark: 0x673629,
  iron: 0x2b2b30,

  // light & water
  glow: 0xffe3a0,
  glowWarm: 0xf5b35a,
  glowDeep: 0xd9823a,
  water: 0x6fa8b0,
  waterDark: 0x47808c,
  white: 0xf2ead8,
  spirit: 0x8ff0d6, // glowing mushroom / firefly teal

  // accents
  gold: 0xd9a646,
  coinLight: 0xf7dc8a,
  coinShade: 0xa8772e,
  red: 0xa5503f,
  redDark: 0x7a3a30,
};

// Grays for parts the game recolors ("tints") at runtime, like hair and ears.
// Phaser multiplies each pixel by the tint color: white becomes exactly the
// tint, darker grays become darker versions of it. So we draw these parts in
// gray and pick the real color in src/config.js.
export const GRAY = {
  light: 0xffffff,
  main: 0xe4e4e4,
  dark: 0xb8b8b8,
  line: 0x5e5e5e,
};
