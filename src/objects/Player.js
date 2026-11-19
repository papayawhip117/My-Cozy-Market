import Phaser from 'phaser';
import { GROUND_Y, WORLD_WIDTH, PLAYER_SPEED } from '../config.js';
import { gameState } from '../state/gameState.js';
import { FRAME_W, preloadLook, buildLook, setLookFrame } from './CharacterLook.js';

// The player is a stack of sprite sheets (hair, ears, clothes...). Which
// sheets and colors come from her "look", saved in gameState; the layer
// list lives in CharacterLook.js so the character creator can share it.

// Frame 0 = standing, frames 1-4 = walking.
const WALK_FRAMES = [1, 2, 3, 4];
const WALK_FRAME_MS = 120;

// A Container is a group of game objects that move together.
export default class Player extends Phaser.GameObjects.Container {
  // Call from the scene's preload(): queues every player sprite sheet.
  static preload(scene) {
    preloadLook(scene);
  }

  constructor(scene, x, look = gameState.look) {
    super(scene, x, GROUND_Y);
    scene.add.existing(this);

    this.look = look;
    this.buildLayers();

    // Arrow keys + A/D
    this.keys = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.walkTime = 0;
    this.walkWidth = WORLD_WIDTH; // how far right she can go (rooms set their own)
    this.canMove = true; // false while a menu is open
  }

  // (Re)creates the sprites. Call again after changing this.look.
  buildLayers() {
    this.layers = buildLook(this, this.look);
  }

  setFrame(frame) {
    setLookFrame(this.layers, frame);
  }

  // Phaser calls this every frame (we call it from the scene's update).
  // `delta` = milliseconds since last frame, so speed is the same on any screen.
  update(delta) {
    const left = this.keys.left.isDown || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;
    const dir = this.canMove ? (right ? 1 : 0) - (left ? 1 : 0) : 0;

    if (dir !== 0) {
      this.x += dir * PLAYER_SPEED * (delta / 1000);
      // The art faces right. Flipping the whole container's x scale
      // mirrors every layer at once, so she faces the way she walks.
      this.scaleX = dir;

      this.walkTime += delta;
      const step = Math.floor(this.walkTime / WALK_FRAME_MS) % WALK_FRAMES.length;
      this.setFrame(WALK_FRAMES[step]);
    } else {
      this.walkTime = 0;
      this.setFrame(0);
    }

    // Don't walk off either end of the street (or room).
    const half = FRAME_W / 2;
    this.x = Phaser.Math.Clamp(this.x, half, this.walkWidth - half);
  }
}
