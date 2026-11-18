import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WORLD_WIDTH, GROUND_Y } from '../config.js';

// Parallax = far things move slower than near things when the camera scrolls.
// Phaser does this with setScrollFactor(n):
//   0   = glued to the screen (never moves, like the sky)
//   0.5 = moves at half the camera's speed (far away)
//   1   = moves with the world (normal objects, the ground)
//
// The layer images come from `npm run art` (tools/art/background.js).
// They repeat side to side, so a TileSprite can stretch them across the street.

// The background images, back to front.
export const BACKGROUND_LAYERS = [
  { key: 'bg-castle', factor: 0.15, bottom: GROUND_Y - 18 },
  { key: 'bg-forest', factor: 0.4, bottom: GROUND_Y - 4 },
  { key: 'bg-bushes', factor: 0.7, bottom: GROUND_Y + 2 },
];

export function preloadBackground(scene) {
  scene.load.image('bg-sky', 'assets/bg-sky.png');
  scene.load.image('ground', 'assets/ground.png');
  for (const layer of BACKGROUND_LAYERS) scene.load.image(layer.key, `assets/${layer.key}.png`);
}

// A layer that moves at `factor` speed only needs to be this wide
// to cover the screen at every camera position.
function layerWidth(factor) {
  return GAME_WIDTH + (WORLD_WIDTH - GAME_WIDTH) * factor;
}

export function createBackground(scene) {
  // 1. Sky: fixed to the screen.
  scene.add.image(0, 0, 'bg-sky').setOrigin(0, 0).setScrollFactor(0);

  // 2. Castle, forest and bushes, each repeating and scrolling at its own speed.
  for (const layer of BACKGROUND_LAYERS) {
    const height = scene.textures.get(layer.key).getSourceImage().height;
    scene.add
      .tileSprite(0, layer.bottom - height, layerWidth(layer.factor), height, layer.key)
      .setOrigin(0, 0)
      .setScrollFactor(layer.factor);
  }

  // 3. Ground: grass + cobblestone path, scrolls with the world.
  scene.add.tileSprite(0, GROUND_Y, WORLD_WIDTH, GAME_HEIGHT - GROUND_Y, 'ground').setOrigin(0, 0);
}

// Little glowing fireflies drifting around the street.
// Call this after the shops are added so they float in front.
export function createFireflies(scene, count = 45) {
  const colors = [0x8ff0d6, 0xffe3a0, 0xf5b35a];
  for (let i = 0; i < count; i++) {
    const x = Phaser.Math.Between(0, WORLD_WIDTH);
    const y = Phaser.Math.Between(90, GROUND_Y - 6);
    const color = Phaser.Utils.Array.GetRandom(colors);
    const fly = scene.add.rectangle(x, y, 1, 1, color);
    const halo = scene.add.circle(x, y, 3, color, 0.18); // soft glow around it

    // Drift around and blink, each one on its own timing.
    scene.tweens.add({
      targets: [fly, halo],
      x: x + Phaser.Math.Between(-24, 24),
      y: y + Phaser.Math.Between(-14, 14),
      duration: Phaser.Math.Between(2500, 5000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: [fly, halo],
      alpha: 0.1,
      duration: Phaser.Math.Between(600, 1600),
      delay: Phaser.Math.Between(0, 2000),
      yoyo: true,
      repeat: -1,
    });
  }
}
