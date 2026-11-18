import { addPanel, PANEL_MARGIN } from './Panel.js';
import { TEXT, UI_DEPTH, pinToScreen } from './Dialog.js';

// A green panel with a list of choices, like an old handheld game menu.
// One row is "selected": it glows and a little arrow points at it.
//
//   const menu = new MenuList(scene, {
//     x: 4, y: 36, width: 80,
//     title: 'For sale',                       // optional
//     rows: [
//       { label: 'Shop', action: () => ... },
//       { label: 'Tea Set', price: 35, dim: () => true, action: () => ... },
//     ],
//     onCancel: () => ...,                     // Esc
//   });
//
// The mouse works by itself (hover selects, click chooses). For the keyboard,
// the scene calls menu.move(-1 / 1), menu.choose() and menu.cancel().

const ROW_H = 15;
const PAD = PANEL_MARGIN + 6;
const TITLE_H = 15;
const GLOW = 0xffe3a0;
const COIN = 14; // coin.png frame size (loaded by CoinHud.preload)

export default class MenuList {
  constructor(scene, { x, y, width, title, rows, onCancel, selected = 0 }) {
    this.scene = scene;
    this.rows = rows;
    this.onCancel = onCancel;
    this.index = -1;

    const top = PAD + (title ? TITLE_H : 0);
    const height = top + rows.length * ROW_H + PAD - 1;
    const innerW = width - PAD * 2;
    this.height = height;

    // The panel is interactive so clicks on it don't reach things behind it.
    const panel = addPanel(scene, 0, 0, width, height, 'panel-moss').setInteractive();
    this.root = scene.add.container(x, y, [panel]).setDepth(UI_DEPTH);
    if (title) {
      this.root.add(scene.add.text(width / 2, PAD - 1, title, { ...TEXT, color: '#f2ead8' }).setOrigin(0.5, 0));
    }

    this.parts = rows.map((row, i) => {
      const ry = top + i * ROW_H;
      const mid = ry + (ROW_H - 1) / 2;
      // The glow doubles as the row's click area.
      const glow = scene.add.rectangle(PAD, ry, innerW, ROW_H - 1, GLOW, 0).setOrigin(0, 0);
      glow.setInteractive({ useHandCursor: true });
      glow.on('pointerover', () => this.select(i));
      glow.on('pointerup', () => {
        this.select(i);
        this.choose();
      });
      const label = scene.add.text(PAD + 3, mid, row.label, TEXT).setOrigin(0, 0.5);
      this.root.add([glow, label]);

      // Price on the right: "12" and a coin, leaving room for the arrow.
      let price = null;
      if (row.price !== undefined) {
        const coinX = PAD + innerW - 12 - COIN / 2;
        this.root.add(scene.add.sprite(coinX, mid, 'coin', 0));
        price = scene.add.text(coinX - COIN / 2, mid, String(row.price), TEXT).setOrigin(1, 0.5);
        this.root.add(price);
      }
      return { glow, label, price, mid };
    });

    // The arrow that points at the selected row (it bobs side to side).
    this.arrowX = PAD + innerW - 7;
    this.arrow = scene.add.triangle(this.arrowX, 0, 0, 3, 5, 0, 5, 6, GLOW).setOrigin(0, 0.5);
    this.root.add(this.arrow);
    scene.tweens.add({ targets: this.arrow, x: this.arrowX + 2, duration: 350, yoyo: true, repeat: -1, ease: 'Stepped' });

    this.refresh();
    this.select(Math.min(selected, rows.length - 1));
    pinToScreen(this.root).setAlpha(0);
    scene.tweens.add({ targets: this.root, alpha: 1, duration: 110 });
  }

  get bottom() {
    return this.root.y + this.height;
  }

  select(i) {
    if (i === this.index || !this.rows[i]) return;
    this.index = i;
    this.parts.forEach((p, j) => p.glow.setFillStyle(GLOW, j === i ? 0.22 : 0));
    this.arrow.y = this.parts[i].mid;
  }

  // Up = -1, down = +1. Wraps around at the ends.
  move(step) {
    const n = this.rows.length;
    this.select((this.index + step + n) % n);
  }

  choose() {
    this.rows[this.index]?.action?.();
  }

  cancel() {
    this.onCancel?.();
  }

  // Re-check which rows are dimmed (row.dim() -> true = grayed out),
  // e.g. after coins change so you can now afford something.
  refresh() {
    this.rows.forEach((row, i) => {
      const dim = row.dim?.() ?? false;
      const { label, price } = this.parts[i];
      label.setColor(dim ? '#9a917e' : TEXT.color);
      price?.setColor(dim ? '#c98a7a' : '#f7dc8a');
    });
  }

  destroy() {
    this.root.destroy();
  }
}
