import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT } from '../config.js';
import { addPanel, PANEL_MARGIN } from './Panel.js';

// A pop-up window in the middle of the screen, with a dark see-through
// layer behind it. Click outside it (or press Esc) to close it.
//
//   const d = new Dialog(scene, { title: 'Backpack', width: 160, height: 100 });
//   d.add(scene.add.text(...));        // things inside, placed from the box's top-left
//   d.addButton('OK', 60, 70, () => d.close());

export const UI_DEPTH = 1100; // in front of the coin HUD (1000)

// Pixel font at 12px with resolution 1: drawn exactly pixel for pixel, so it
// stays sharp when the game is scaled up (blurry text came from resolution 2).
export const TEXT = {
  fontFamily: FONT,
  fontSize: '10px',
  color: COLORS.signText,
  resolution: 1,
};

// Stick something to the screen (not the world), along with everything
// inside it, so it stays put and stays clickable while the camera scrolls.
export function pinToScreen(obj) {
  obj.setScrollFactor(0, 0);
  if (obj.list) for (const child of obj.list) pinToScreen(child); // containers
  return obj;
}

export default class Dialog {
  constructor(scene, { title, width, height, panel = 'panel-moss', onClose }) {
    this.scene = scene;
    this.onClose = onClose;
    this.width = width;
    this.height = height;

    // The dark layer. Clicking it closes the dialog.
    const shade = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d0a12, 0.55).setOrigin(0, 0);
    shade.setInteractive().on('pointerdown', () => this.close());

    // The box itself. It's interactive too, so clicks on it don't fall
    // through to the dark layer and close it.
    const x = Math.round((GAME_WIDTH - width) / 2);
    const y = Math.round((GAME_HEIGHT - height) / 2);
    const box = addPanel(scene, 0, 0, width, height, panel).setInteractive();
    this.box = scene.add.container(x, y, [box]);
    this.root = scene.add.container(0, 0, [shade, this.box]).setDepth(UI_DEPTH + 10);

    if (title) {
      this.add(scene.add.text(width / 2, PANEL_MARGIN + 6, title, { ...TEXT, color: '#f2ead8' }).setOrigin(0.5, 0));
    }

    pinToScreen(this.root).setAlpha(0);
    scene.tweens.add({ targets: this.root, alpha: 1, duration: 120 });
  }

  // Put a game object inside the box (x, y measured from the box's corner).
  add(obj) {
    this.box.add(obj);
    pinToScreen(this.root); // keep new children stuck to the screen too
    return obj;
  }

  // A small wooden button centered on (x, y).
  addButton(label, x, y, onClick, options) {
    return this.add(woodButton(this.scene, label, x, y, onClick, options));
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.root.destroy();
    this.onClose?.();
  }
}

// A small wooden button centered on (x, y). Returns a Container.
// Dialogs use it through addButton; other screens can use it directly.
export function woodButton(scene, label, x, y, onClick, { width = 40, height = 24 } = {}) {
  const text = scene.add.text(0, 0, label, TEXT).setOrigin(0.5, 0.5);
  const w = Math.max(width, Math.ceil(text.width) + 16);
  const h = height;
  const plate = addPanel(scene, -w / 2, -h / 2, w, h, 'panel-wood');
  const button = scene.add.container(x, y, [plate, text]);
  button.setSize(w, h).setInteractive({ useHandCursor: true });
  button.on('pointerover', () => plate.setTint(0xfff0d8));
  button.on('pointerout', () => {
    plate.clearTint();
    button.y = y;
  });
  button.on('pointerdown', () => (button.y = y + 1)); // sinks when pressed
  button.on('pointerup', () => {
    button.y = y;
    onClick();
  });
  return button;
}

// A little note that fades in near the bottom of the screen, then away.
export function showToast(scene, message) {
  const pad = PANEL_MARGIN + 7;
  const text = scene.add.text(pad, pad - 1, message, { ...TEXT, color: '#f2ead8', align: 'center' });
  const w = Math.ceil(text.width) + pad * 2;
  const h = Math.ceil(text.height) + pad * 2 - 2;
  const box = addPanel(scene, 0, 0, w, h, 'panel-moss');
  const toast = scene.add.container(Math.round((GAME_WIDTH - w) / 2), GAME_HEIGHT - h - 12, [box, text]);
  pinToScreen(toast).setDepth(UI_DEPTH + 20).setAlpha(0);
  scene.tweens.chain({
    targets: toast,
    tweens: [
      { alpha: 1, duration: 200 },
      { alpha: 0, delay: 2600, duration: 500, onComplete: () => toast.destroy() },
    ],
  });
  return toast;
}
