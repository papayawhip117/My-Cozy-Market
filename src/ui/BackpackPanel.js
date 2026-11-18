import Dialog, { TEXT } from './Dialog.js';
import { PANEL_MARGIN } from './Panel.js';
import { gameState } from '../state/gameState.js';

// The backpack pop-up: a grid of slots showing everything you own
// (gameState.items). Hover a slot to see what's in it.
//
// Until items have their own pictures (the shopping step), every item
// shows as a little wrapped parcel.
//
// Try it: open the browser console while `npm run dev` is running and type
//   pawPal.addItem('matcha-latte')
// then open the backpack again.

const COLS = 5;
const SLOT = 20; // item-slot.png is 20 x 20
const GAP = 3;
const ITEM_ICON = 4; // the parcel in menu-icons.png

// 'matcha-latte' -> 'Matcha Latte' (until items have real names in a catalog).
const prettyName = (id) => id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());

export default class BackpackPanel extends Dialog {
  constructor(scene, { onClose }) {
    const items = gameState.items;
    const rows = Math.max(2, Math.ceil(items.length / COLS));
    const gridW = COLS * SLOT + (COLS - 1) * GAP;
    const gridH = rows * SLOT + (rows - 1) * GAP;
    const pad = PANEL_MARGIN + 9;
    const width = gridW + pad * 2;
    const top = 26; // room for the title
    const height = top + gridH + 30;
    super(scene, { title: 'Backpack', width, height, onClose });

    // The line under the grid: a hint, or the name of the hovered item.
    const hint = items.length
      ? `${items.length} thing${items.length === 1 ? '' : 's'}`
      : 'Empty for now!';
    const footer = this.add(
      scene.add.text(width / 2, top + gridH + 9, hint, { ...TEXT, color: '#f2ead8' }).setOrigin(0.5, 0),
    );

    for (let i = 0; i < rows * COLS; i++) {
      const x = pad + (i % COLS) * (SLOT + GAP);
      const y = top + Math.floor(i / COLS) * (SLOT + GAP);
      const slot = this.add(scene.add.image(x, y, 'item-slot').setOrigin(0, 0));
      const id = items[i];
      if (!id) continue;

      this.add(scene.add.sprite(x + SLOT / 2, y + SLOT / 2, 'menu-icons', ITEM_ICON));
      slot.setInteractive();
      slot.on('pointerover', () => {
        slot.setTint(0xffe3a0);
        footer.setText(prettyName(id));
      });
      slot.on('pointerout', () => {
        slot.clearTint();
        footer.setText(hint);
      });
    }
  }
}
