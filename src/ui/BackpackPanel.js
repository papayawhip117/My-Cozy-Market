import Dialog, { TEXT } from './Dialog.js';
import { PANEL_MARGIN } from './Panel.js';
import { gameState } from '../state/gameState.js';
import { itemName, itemTexture } from '../state/catalog.js';
import { fitText } from './MenuList.js';

// The backpack pop-up: a grid of slots showing everything you own
// (gameState.items). Hover a slot to see what's in it. Two of the same
// thing share a slot, with a little "2" in the corner.
//
// Each item shows its picture (public/assets/item-<id>.png); anything
// without one shows as a little wrapped parcel.
//
// Try it: open the browser console while `npm run dev` is running and type
//   pawPal.addItem('matcha-latte')
// then open the backpack again.

const COLS = 5;
const SLOT = 20; // item-slot.png is 20 x 20
const GAP = 3;
const ITEM_ICON = 4; // the parcel in menu-icons.png

export default class BackpackPanel extends Dialog {
  constructor(scene, { onClose }) {
    // One slot per kind of thing: [id, how many].
    const counts = new Map();
    for (const id of gameState.items) counts.set(id, (counts.get(id) ?? 0) + 1);
    const slots = [...counts];
    const total = gameState.items.length;
    const rows = Math.max(2, Math.ceil(slots.length / COLS));
    const gridW = COLS * SLOT + (COLS - 1) * GAP;
    const gridH = rows * SLOT + (rows - 1) * GAP;
    const pad = PANEL_MARGIN + 9;
    const width = gridW + pad * 2;
    const top = 26; // room for the title
    const height = top + gridH + 30;
    super(scene, { title: 'Backpack', width, height, onClose });

    // The line under the grid: a hint, or the name of the hovered item.
    const hint = total ? `${total} thing${total === 1 ? '' : 's'}` : 'Empty for now!';
    const footer = this.add(
      scene.add.text(width / 2, top + gridH + 9, hint, { ...TEXT, color: '#f2ead8' }).setOrigin(0.5, 0),
    );

    for (let i = 0; i < rows * COLS; i++) {
      const x = pad + (i % COLS) * (SLOT + GAP);
      const y = top + Math.floor(i / COLS) * (SLOT + GAP);
      const slot = this.add(scene.add.image(x, y, 'item-slot').setOrigin(0, 0));
      if (!slots[i]) continue;
      const [id, n] = slots[i];

      const key = itemTexture(scene, id);
      this.add(key ? scene.add.image(x + SLOT / 2, y + SLOT / 2, key) : scene.add.sprite(x + SLOT / 2, y + SLOT / 2, 'menu-icons', ITEM_ICON));
      if (n > 1) {
        const count = { ...TEXT, fontSize: '8px', color: '#f2ead8', stroke: '#1c1822', strokeThickness: 2 };
        this.add(scene.add.text(x + SLOT - 1, y + SLOT, String(n), count).setOrigin(1, 1));
      }
      slot.setInteractive();
      slot.on('pointerover', () => {
        slot.setTint(0xffe3a0);
        footer.setText(n > 1 ? `${itemName(id)} x${n}` : itemName(id));
        fitText(footer, width - pad * 2);
      });
      slot.on('pointerout', () => {
        slot.clearTint();
        footer.setText(hint);
      });
    }
  }
}
