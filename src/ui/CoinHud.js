import { COINS, COLORS, FONT } from '../config.js';
import { gameState } from '../state/gameState.js';
import { addPanel, preloadPanels, PANEL_MARGIN } from './Panel.js';
import { ensureGlimmerIcon } from './glimmerIcon.js';

// The coin counter in the top-left corner: a vine-wrapped wooden sign with a
// spinning paw coin and your coin count, then a sparkle and your Glimmers. It's glued to the screen with
// setScrollFactor(0), so it stays put while the camera follows you.
//
// It never changes coins itself. It just listens to gameState.

const X = 4; // where the sign sits on screen
const Y = 4;
const SIGN_W = 80; // the sign's narrowest; it stretches for big numbers
const SIGN_H = 26;
const MID_Y = SIGN_H / 2; // vertical middle of the sign
const COIN_SIZE = 14; // frame size of coin.png (see tools/art/ui.js)

const GLIMMER_GAP = 8; // space between the coin number and the Glimmer sparkle
const GLIMMER_COLOR = '#d8d0ff';

const TEXT_STYLE = {
  fontFamily: FONT,
  fontSize: '10px',
  color: COLORS.signText,
  resolution: 1,
};

export default class CoinHud {
  // Call from the scene's preload().
  static preload(scene) {
    scene.load.spritesheet('coin', 'assets/coin.png', { frameWidth: COIN_SIZE, frameHeight: COIN_SIZE });
    preloadPanels(scene);
  }

  constructor(scene) {
    this.scene = scene;
    this.shown = gameState.coins; // the number on screen (rolls toward the real one)

    if (!scene.anims.exists('coin-spin')) {
      scene.anims.create({
        key: 'coin-spin',
        frames: scene.anims.generateFrameNumbers('coin', { frames: [0, 1, 2, 3, 0] }),
        frameRate: 14,
      });
    }

    // Everything lives in one container so it can be moved together.
    // Depth 1000 keeps it in front of the street and fireflies.
    this.root = scene.add.container(X, Y).setScrollFactor(0).setDepth(1000);
    const sign = (this.sign = addPanel(scene, 0, 0, SIGN_W, SIGN_H, 'panel-wood'));
    this.coin = scene.add.sprite(16, MID_Y, 'coin', 0);
    this.label = scene.add.text(26, MID_Y, '', TEXT_STYLE).setOrigin(0, 0.5);
    this.glimmer = scene.add.image(0, MID_Y, ensureGlimmerIcon(scene));
    this.glimmerLabel = scene.add.text(0, MID_Y, '', { ...TEXT_STYLE, color: GLIMMER_COLOR }).setOrigin(0, 0.5);
    this.root.add([sign, this.coin, this.label, this.glimmer, this.glimmerLabel]);
    this.render();

    // Listen for coin and Glimmer changes, and stop listening when the scene shuts down.
    const stop = gameState.onChange((coins, change, reason) => this.onCoins(change, reason));
    const stopGlimmers = gameState.onGlimmers((glimmers, change, reason) => this.onGlimmers(change, reason));
    scene.events.once('shutdown', () => {
      stop();
      stopGlimmers();
    });

    // Coins earned while the game was closed, before this HUD existed.
    this.welcomeBack();
  }

  onCoins(change, reason) {
    if (reason === 'offline') this.welcomeBack();
    else if (change > 0) this.pop(`+${change}`);
    else this.roll(gameState.coins);
  }

  onGlimmers(change, reason) {
    if (reason === 'offline') this.welcomeBack();
    this.render();
    if (change > 0 && reason !== 'offline') {
      // the sparkle bounces and "+5" floats up under it
      this.scene.tweens.add({ targets: this.glimmer, y: MID_Y - 3, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
      this.floatUp(this.glimmer.x, `+${change}`, GLIMMER_COLOR);
    }
  }

  // Small reward feedback: the coin spins and bounces, "+1" floats up.
  pop(text) {
    this.roll(gameState.coins, 150);
    this.coin.play('coin-spin');
    this.scene.tweens.add({ targets: this.coin, y: MID_Y - 3, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
    this.floatUp(16, text, '#f7dc8a');
  }

  // A little "+1" that drifts down from the sign and fades.
  floatUp(x, text, color) {
    const plus = this.scene.add
      .text(X + x, Y + SIGN_H - 4, text, { ...TEXT_STYLE, color })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1000);
    this.scene.tweens.add({
      targets: plus,
      y: plus.y + 10,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => plus.destroy(),
    });
  }

  // "Welcome back" note for coins earned while you were away.
  welcomeBack() {
    const { earned, glimmers = 0, seconds } = gameState.welcomeBack;
    if (earned <= 0 && glimmers <= 0) return this.roll(gameState.coins);
    gameState.welcomeBack = { earned: 0, glimmers: 0, seconds: 0 }; // only show it once

    this.roll(gameState.coins, 1200);
    if (seconds < COINS.offlineNoticeSeconds) return;

    if (this.note?.active) {
      // Replace an older note that's still showing.
      this.scene.tweens.killTweensOf(this.note);
      this.note.destroy();
    }
    // A green vine panel sized to fit the message.
    const pad = PANEL_MARGIN + 7;
    const coins = `${earned.toLocaleString('en-US')} coin${earned === 1 ? '' : 's'}`;
    const sparkles = `${glimmers} Glimmer${glimmers === 1 ? '' : 's'}`;
    const what = earned > 0 && glimmers > 0 ? `${coins}\nand ${sparkles}` : earned > 0 ? coins : sparkles;
    const text = this.scene.add.text(pad, pad - 1, `While you were away\nyou earned ${what}!`, {
      ...TEXT_STYLE,
      color: '#f2ead8',
    });
    const box = addPanel(this.scene, 0, 0, text.width + pad * 2, text.height + pad * 2 - 2, 'panel-moss');
    const note = (this.note = this.scene.add
      .container(X, Y + SIGN_H + 6, [box, text])
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0));
    this.scene.tweens.chain({
      targets: note,
      tweens: [
        { alpha: 1, duration: 300 },
        { alpha: 0, delay: 3500, duration: 600, onComplete: () => note.destroy() },
      ],
    });
  }

  // Count the shown number up (or down) to `target` over `ms`.
  roll(target, ms = 0) {
    this.rolling?.stop();
    if (!ms) {
      this.shown = target;
      return this.render();
    }
    this.rolling = this.scene.tweens.addCounter({
      from: this.shown,
      to: target,
      duration: ms,
      onUpdate: (t) => {
        this.shown = Math.round(t.getValue());
        this.render();
      },
    });
  }

  render() {
    this.label.setText(this.shown.toLocaleString('en-US'));
    this.glimmer.x = Math.ceil(this.label.x + this.label.width) + GLIMMER_GAP + 6;
    this.glimmerLabel.setText(gameState.glimmers.toLocaleString('en-US'));
    this.glimmerLabel.x = this.glimmer.x + 9;
    // Big numbers (like 1,234,567) stretch the sign so they still fit inside.
    const width = Math.max(SIGN_W, Math.ceil(this.glimmerLabel.x + this.glimmerLabel.width) + 10);
    if (this.sign.width !== width) this.sign.setSize(width, SIGN_H);
  }
}
