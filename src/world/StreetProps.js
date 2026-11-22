import Phaser from 'phaser';
import { GROUND_Y } from '../config.js';

// The little things that make the street feel lived-in: lamp posts,
// stone lanterns, crates, benches... plus the light they give off and
// paper lantern garlands strung between lamp posts.
//
// Art: tools/art/props.js (run `npm run art`). Each picture stands on the
// grass by its bottom-middle, like the shops do.

// Where everything goes, left to right. `x` = middle of the prop in world
// pixels. `y` (optional) = where its bottom edge sits, if not on the grass.
// `flip: true` mirrors it. `id` (optional) names a prop the street scene
// needs to find again, like the bulletin board you can read.
// Move things around freely!
export const STREET_PROPS = [
  // the start of the street
  { key: 'prop-barrel', x: 40 },
  { key: 'prop-puddle', x: 92, y: GROUND_Y + 19 },
  { key: 'prop-signpost', x: 128 },
  { key: 'prop-bench', x: 166 },
  { key: 'prop-lamppost', x: 205 },
  // Photo Booth -> PJ's Store
  { key: 'prop-crates', x: 412 },
  { key: 'prop-lamppost', x: 465 },
  { key: 'prop-lamppost', x: 655 },
  { key: 'prop-stone-lantern', x: 696 },
  { key: 'prop-barrel', x: 727, flip: true },
  // PJ's Store -> Furniture
  { key: 'prop-vending', x: 926 },
  { key: 'prop-lamppost', x: 980 },
  { key: 'prop-puddle', x: 1030, y: GROUND_Y + 21 },
  { key: 'prop-lamppost', x: 1170 },
  { key: 'prop-noticeboard', x: 1214, id: 'board' },
  // Furniture -> Plant Shop
  { key: 'prop-plants', x: 1466 },
  { key: 'prop-lamppost', x: 1520 },
  { key: 'prop-lamppost', x: 1690 },
  { key: 'prop-bench', x: 1736, flip: true },
  // Plant Shop -> Street Clothes
  { key: 'prop-stone-lantern', x: 1962 },
  { key: 'prop-lamppost', x: 2010 },
  { key: 'prop-crates', x: 2062, flip: true },
  { key: 'prop-lamppost', x: 2200 },
  { key: 'prop-barrel', x: 2240 },
  { key: 'prop-vending', x: 2292 },
  // the end of the street
  { key: 'prop-lamppost', x: 2512 },
  { key: 'prop-signpost', x: 2560, flip: true },
  { key: 'prop-puddle', x: 2598, y: GROUND_Y + 20 },
  { key: 'prop-lamppost', x: 2630 },
  { key: 'prop-plants', x: 2770 },
  { key: 'prop-stone-lantern', x: 2806 },
  // Street Clothes -> Timber & Twig, and past it
  { key: 'prop-lamppost', x: 3076 },
  { key: 'prop-crates', x: 3116 },
  { key: 'prop-barrel', x: 3150, flip: true },
  { key: 'prop-signpost', x: 3190 },
  { key: 'prop-puddle', x: 3228, y: GROUND_Y + 20 },
  { key: 'prop-lamppost', x: 3262 },
  { key: 'prop-bench', x: 3300, flip: true },
  { key: 'prop-stone-lantern', x: 3336 },
];

// Paper lantern garlands: strung between the lamp posts at these x's.
export const GARLANDS = [
  [465, 655],
  [980, 1170],
  [1520, 1690],
  [2010, 2200],
  [2512, 2630],
  [3076, 3262],
];

// Where each prop gives off light, in pixels from its bottom-middle
// (negative y = up). These match the drawings in tools/art/props.js.
const LIGHTS = {
  'prop-lamppost': [{ x: 0, y: -59, size: 1.4, pool: true }],
  'prop-stone-lantern': [{ x: 0, y: -24, size: 0.8, pool: true }],
  // core: false = no bright middle (the machine's window is already lit)
  'prop-vending': [
    { x: 0, y: -26, size: 0.9, color: 0x9fd6b8, core: false },
    { x: 0, y: -40, size: 0.5, core: false },
  ],
};

const WARM = 0xf5b35a; // lantern light (P.glowWarm in the art palette)
const BRIGHT = 0xffe3a0; // the hot middle of a flame (P.glow)
const LANTERN_COLORS = [0xe89aa0, 0xffe3a0, 0xb9a3d9, 0xf5b35a, 0x9fd6b8];

export function preloadProps(scene) {
  const keys = new Set(STREET_PROPS.map((p) => p.key));
  for (const key of keys) scene.load.image(key, `assets/${key}.png`);
  scene.load.image('fx-glow', 'assets/fx-glow.png');
  scene.load.image('fx-paper-lantern', 'assets/fx-paper-lantern.png');
}

// A soft blob of light. ADD blending brightens whatever is behind it,
// which is what makes it look like light instead of a yellow circle.
export function addGlow(scene, x, y, size, color = WARM, alpha = 0.5) {
  return scene.add
    .image(x, y, 'fx-glow')
    .setScale(size)
    .setTint(color)
    .setAlpha(alpha)
    .setBlendMode(Phaser.BlendModes.ADD);
}

// Make a glow flicker gently, like a candle, each on its own rhythm.
function flicker(scene, glow) {
  const base = glow.alpha;
  scene.tweens.add({
    targets: glow,
    alpha: base * Phaser.Math.FloatBetween(0.7, 0.85),
    scale: glow.scale * 0.94,
    duration: Phaser.Math.Between(180, 420),
    delay: Phaser.Math.Between(0, 1500),
    yoyo: true,
    repeat: -1,
    repeatDelay: Phaser.Math.Between(200, 2200),
    ease: 'Sine.easeInOut',
  });
}

// A string sagging between two points, with paper lanterns hanging off it.
function addGarland(scene, x1, x2) {
  const y = GROUND_Y - 46; // the lamp posts' crossbars
  const left = x1 + 6;
  const right = x2 - 6;
  const sag = Math.min(18, (right - left) * 0.12);
  // Height of the string at position t (0 = left end, 1 = right end).
  const at = (t) => ({ x: left + (right - left) * t, y: y + sag * 4 * t * (1 - t) });

  const g = scene.add.graphics();
  g.fillStyle(0x5a4a40, 1); // twine
  const steps = Math.ceil(right - left);
  for (let i = 0; i <= steps; i++) {
    const p = at(i / steps);
    g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); // 1px dots = crisp pixel line
  }

  const count = Math.max(3, Math.floor((right - left) / 24));
  for (let i = 1; i <= count; i++) {
    const p = at(i / (count + 1));
    const color = LANTERN_COLORS[(i + Math.floor(x1 / 10)) % LANTERN_COLORS.length];
    const glow = addGlow(scene, Math.round(p.x), Math.round(p.y) + 5, 0.45, color, 0.55);
    const lantern = scene.add.image(Math.round(p.x), Math.round(p.y), 'fx-paper-lantern').setOrigin(0.5, 0).setTint(color);
    flicker(scene, glow);
    // a little sway in the breeze
    scene.tweens.add({
      targets: lantern,
      angle: { from: -6, to: 6 },
      duration: Phaser.Math.Between(1400, 2000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: i * 150,
    });
  }
}

// Call after createBackground and before the shops, so props stand
// behind the shops' signs but in front of the trees.
// Returns the props that have an `id`, like { board: <image> }.
export function createProps(scene) {
  const named = {};
  for (const prop of STREET_PROPS) {
    if (!scene.textures.exists(prop.key)) continue;
    const img = scene.add.image(prop.x, prop.y ?? GROUND_Y + 1, prop.key).setOrigin(0.5, 1);
    if (prop.flip) img.setFlipX(true);
    if (prop.id) named[prop.id] = img;

    for (const light of LIGHTS[prop.key] ?? []) {
      const lx = prop.x + (prop.flip ? -light.x : light.x);
      const ly = GROUND_Y + 1 + light.y;
      // a pool of light on the ground beneath it
      if (light.pool) addGlow(scene, lx, GROUND_Y + 8, 1, WARM, 0.3).setScale(light.size * 1.6, light.size * 0.3);
      const outer = addGlow(scene, lx, ly, light.size, light.color ?? WARM, light.core === false ? 0.3 : 0.45);
      if (light.core !== false) addGlow(scene, lx, ly, light.size * 0.35, BRIGHT, 0.55);
      flicker(scene, outer);
    }
  }
  for (const [x1, x2] of GARLANDS) addGarland(scene, x1, x2);
  return named;
}
