import { addPanel, PANEL_MARGIN } from './Panel.js';
import { TEXT, UI_DEPTH, pinToScreen } from './Dialog.js';
import { priceTag } from './PriceTag.js';

// A green panel with a list of choices, like an old handheld game menu.
// One row is "selected": it glows and a little arrow points at it.
//
//   const menu = new MenuList(scene, {
//     x: 4, y: 36, width: 80,
//     title: 'For sale',                       // optional
//     rows: [
//       { label: 'Shop', action: () => ... },
//       { label: 'Tea Set', price: 35, dim: () => true, action: () => ... },
//       { label: 'Cardigan', cost: { glimmers: 1 }, action: () => ... },  // or a price in both currencies
//     ],
//     onCancel: () => ...,                     // Esc
//     onSelect: (row, i) => ...,               // optional: the selected row changed
//   });
//
// The mouse works by itself (hover selects, click chooses). For the keyboard,
// the scene calls menu.move(-1 / 1), menu.choose() and menu.cancel().
// Clicking a row with `clickSelects: true` just selects it (so you can
// look at it before you buy); Enter still chooses it.
// Labels too long for the row are cut short with "…".

const ROW_H = 15;
const PAD = PANEL_MARGIN + 6;
const TITLE_H = 15;
const GLOW = 0xffe3a0;

export default class MenuList {
  constructor(scene, { x, y, width, title, rows, onCancel, onSelect, selected = 0 }) {
    this.scene = scene;
    this.rows = rows;
    this.onCancel = onCancel;
    this.onSelect = onSelect;
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
        if (!row.clickSelects) this.choose();
      });
      const label = scene.add.text(PAD + 3, mid, row.label, TEXT).setOrigin(0, 0.5);
      this.root.add([glow, label]);

      // Price on the right (a coin and "12", or Glimmers), leaving room for the arrow.
      let price = null;
      let labelEnd = PAD + innerW - 12; // where the arrow starts
      const cost = row.cost ?? (row.price !== undefined ? { coins: row.price } : null);
      if (cost) {
        price = priceTag(scene, cost);
        price.setPosition(labelEnd - 2 - price.w, mid);
        this.root.add(price);
        labelEnd = price.x - 4;
      }
      fitText(label, labelEnd - label.x);
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
    this.refresh(); // a grayed-out row gets a bit lighter while selected
    this.onSelect?.(this.rows[i], i);
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
      const selected = i === this.index;
      label.setColor(dim ? (selected ? '#d2c7b0' : '#9a917e') : TEXT.color);
      price?.setColor(dim ? '#c98a7a' : null);
    });
  }

  destroy() {
    this.root.destroy();
  }
}

// Shorten a text object with "…" until it fits in `maxWidth` pixels.
export function fitText(text, maxWidth) {
  let s = text.text;
  if (text.width <= maxWidth) return text;
  while (s.length > 1 && text.width > maxWidth) {
    s = s.slice(0, -1).trimEnd();
    text.setText(`${s}…`);
  }
  return text;
}
