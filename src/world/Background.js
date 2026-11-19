import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WORLD_WIDTH, GROUND_Y } from '../config.js';

// Parallax = far things move slower than near things when the camera scrolls.
// Phaser does this with setScrollFactor(n):
//   0   = glued to the screen (never moves, like the sky)
//   0.5 = moves at half the camera's speed (far away)
//   1   = moves with the world (normal objects, the ground)
//   1.2 = moves FASTER than the world (closer to you than the street)
//
// The layer images come from `npm run art` (tools/art/background.js).
// They repeat side to side, so a TileSprite can stretch them across the street.

// The background images, back to front.
export const BACKGROUND_LAYERS = [
  { key: 'bg-castle', factor: 0.12, bottom: GROUND_Y - 18 },
  { key: 'bg-forest-far', factor: 0.25, bottom: GROUND_Y - 10 },
  { key: 'bg-forest', factor: 0.4, bottom: GROUND_Y - 4 },
  { key: 'bg-grove', factor: 0.6, bottom: GROUND_Y + 2 },
  { key: 'bg-bushes', factor: 0.75, bottom: GROUND_Y + 2 },
];

// The ferns in front of the player.
const FOREGROUND = { key: 'fg-ferns', factor: 1.25, depth: 850 };

export function preloadBackground(scene) {
  scene.load.image('bg-sky', 'assets/bg-sky.png');
  scene.load.image('ground', 'assets/ground.png');
  scene.load.image(FOREGROUND.key, `assets/${FOREGROUND.key}.png`);
  for (const layer of BACKGROUND_LAYERS) scene.load.image(layer.key, `assets/${layer.key}.png`);
  // white shapes that get tinted: moonbeams, mist, leaves, twinkling stars
  scene.load.image('fx-shaft', 'assets/fx-shaft.png');
  scene.load.image('fx-mist', 'assets/fx-mist.png');
  scene.load.image('fx-star', 'assets/fx-star.png');
  scene.load.spritesheet('fx-leaf', 'assets/fx-leaf.png', { frameWidth: 4, frameHeight: 3 });
}

// A layer that moves at `factor` speed only needs to be this wide
// to cover the screen at every camera position.
function layerWidth(factor) {
  return GAME_WIDTH + (WORLD_WIDTH - GAME_WIDTH) * factor;
}

function addLayer(scene, key, factor, bottom) {
  const height = scene.textures.get(key).getSourceImage().height;
  return scene.add
    .tileSprite(0, bottom - height, layerWidth(factor), height, key)
    .setOrigin(0, 0)
    .setScrollFactor(factor);
}

export function createBackground(scene) {
  // 1. Sky: fixed to the screen, with a few stars that twinkle.
  scene.add.image(0, 0, 'bg-sky').setOrigin(0, 0).setScrollFactor(0);
  createTwinkles(scene);

  // 2. Castle, forests, big trees and bushes, each scrolling at its own speed.
  //    Mist and moonbeams go in between, so they look far away.
  for (const layer of BACKGROUND_LAYERS) {
    addLayer(scene, layer.key, layer.factor, layer.bottom);
    if (layer.key === 'bg-forest') createMist(scene, 0.45, GROUND_Y - 40, 0.35);
    if (layer.key === 'bg-grove') createMoonbeams(scene, layer.factor);
  }
  createMist(scene, 0.8, GROUND_Y - 22, 0.22);

  // 3. Ground: grass + cobblestone path, scrolls with the world.
  scene.add.tileSprite(0, GROUND_Y, WORLD_WIDTH, GAME_HEIGHT - GROUND_Y, 'ground').setOrigin(0, 0);
}

// Ferns, grass and falling leaves IN FRONT of the player.
// Call this after the player is added.
export function createForeground(scene) {
  addLayer(scene, FOREGROUND.key, FOREGROUND.factor, GAME_HEIGHT).setDepth(FOREGROUND.depth);
  createLeaves(scene);
}

// Slanted beams of moonlight falling through the trees. They slowly
// brighten and fade. ADD blending makes them lighten what's behind.
function createMoonbeams(scene, factor) {
  const width = layerWidth(factor);
  for (let x = 60; x < width; x += Phaser.Math.Between(170, 300)) {
    const beam = scene.add
      .image(x, -10, 'fx-shaft')
      .setOrigin(0.5, 0)
      .setScrollFactor(factor)
      .setTint(0xc8dce8)
      .setAlpha(0.18)
      .setScale(Phaser.Math.FloatBetween(0.8, 1.3), 1)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: beam,
      alpha: 0.38,
      duration: Phaser.Math.Between(3000, 6000),
      delay: Phaser.Math.Between(0, 3000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

// A band of mist that drifts slowly sideways. It's one screen wide and
// glued to the screen; we slide the picture inside it instead, which
// costs much less than a street-wide image.
function createMist(scene, factor, y, alpha) {
  const mist = scene.add
    .tileSprite(0, y, GAME_WIDTH, 28, 'fx-mist')
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setTint(0xa8bcc0)
    .setAlpha(alpha);
  const drift = (time) => {
    mist.tilePositionX = scene.cameras.main.scrollX * factor + time * 0.004;
  };
  scene.events.on('update', drift);
  // Scenes are reused when you come back from a shop, so stop listening
  // when this one closes (or the old mist would keep getting updated).
  scene.events.once('shutdown', () => scene.events.off('update', drift));
}

// A handful of brighter stars that twinkle in and out.
function createTwinkles(scene) {
  for (let i = 0; i < 14; i++) {
    const star = scene.add
      .image(Phaser.Math.Between(4, GAME_WIDTH - 4), Phaser.Math.Between(4, 110), 'fx-star')
      .setScrollFactor(0)
      .setTint(Phaser.Utils.Array.GetRandom([0xffffff, 0xffe3a0, 0xc8dcff]))
      .setAlpha(0);
    scene.tweens.add({
      targets: star,
      alpha: Phaser.Math.FloatBetween(0.6, 1),
      duration: Phaser.Math.Between(500, 1200),
      delay: Phaser.Math.Between(0, 6000),
      hold: Phaser.Math.Between(200, 1500),
      yoyo: true,
      repeat: -1,
      repeatDelay: Phaser.Math.Between(2000, 7000),
    });
  }
}

// Leaves drifting down out of the trees, all along the street.
function createLeaves(scene) {
  scene.add
    .particles(0, 0, 'fx-leaf', {
      frame: [0, 1],
      x: { min: 0, max: WORLD_WIDTH },
      y: -6,
      lifespan: 16000,
      speedY: { min: 10, max: 20 },
      speedX: { min: -14, max: -2 },
      accelerationX: { min: -3, max: 3 },
      tint: [0xa8623a, 0xb98a3e, 0x8f4f3f, 0x6f9a5c, 0xc99aa6],
      alpha: { start: 0.9, end: 0.4 },
      frequency: 90,
      maxAliveParticles: 180,
    })
    .setDepth(FOREGROUND.depth - 1);
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
