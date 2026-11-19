import { addPanel, PANEL_MARGIN } from './Panel.js';
import { TEXT, UI_DEPTH, pinToScreen, woodButton } from './Dialog.js';
import { buildLook } from '../objects/CharacterLook.js';
import { gameState } from '../state/gameState.js';
import { findItem, itemName, itemTexture, countOf, sellPrice } from '../state/catalog.js';
import { fitText } from './MenuList.js';

// The shop catalogue card: a close-up of whichever item is selected in the
// buy or sell list, so you can look before you spend anything.
//
//   ┌──────────────────────┐
//   │      Bunny Slippers   │
//   │ ┌──────┐  (coin) 22   │
//   │ │ you, │  Not owned   │
//   │ │ in   │              │
//   │ │ them │  [  Buy  ]   │
//   │ └──────┘              │
//   │ Fluffy slippers with  │
//   │ floppy ears. Hop...   │
//   └──────────────────────┘
//
// Clothes are shown ON your pal (the same layers as the real character),
// everything else shows its picture from tools/art/items.js, 3x bigger.
//
//   const card = new ItemCard(scene, { x, y, onBuy: (item) => ..., onSell: (id) => ... });
//   card.show('bunny-slippers', 'buy')    // or 'sell'
//   card.refresh()                        // re-check coins / how many you own
//   card.hide()

export const CARD_W = 152;
export const CARD_H = 162;

const PAD = PANEL_MARGIN + 6;
const PIC = { x: PAD, y: 24, w: 52, h: 88 }; // the picture frame
const COL_X = PIC.x + PIC.w + 6; // the column right of the picture
const COL_W = CARD_W - COL_X - PAD;
const DESC_Y = PIC.y + PIC.h + 6;

const LIGHT = '#f2ead8';
const GOLD = '#ffe3a0';
const WARN = '#e8a090';

export default class ItemCard {
  constructor(scene, { x, y, onBuy, onSell }) {
    this.scene = scene;
    this.onBuy = onBuy;
    this.onSell = onSell;
    this.id = null;
    this.mode = 'buy';

    const panel = addPanel(scene, 0, 0, CARD_W, CARD_H, 'panel-moss').setInteractive();
    const frame = scene.add
      .rectangle(PIC.x, PIC.y, PIC.w, PIC.h, 0x1c2a22, 0.55)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x1c1822);
    this.content = scene.add.container(0, 0);
    this.root = scene.add.container(x, y, [panel, frame, this.content]).setDepth(UI_DEPTH).setVisible(false);
  }

  show(id, mode = 'buy') {
    this.id = id;
    this.mode = mode;
    this.draw();
    if (!this.root.visible) {
      this.root.setVisible(true).setAlpha(0);
      this.scene.tweens.add({ targets: this.root, alpha: 1, duration: 110 });
    }
  }

  hide() {
    this.id = null;
    this.root.setVisible(false);
  }

  // Coins or your backpack changed: redraw what depends on them.
  refresh() {
    if (this.id && this.root.visible) this.draw();
  }

  destroy() {
    this.root.destroy();
  }

  // ---------- drawing ----------

  draw() {
    const scene = this.scene;
    const item = findItem(this.id);
    const selling = this.mode === 'sell';
    const price = selling ? sellPrice(this.id) : item?.price ?? 0;
    const owned = countOf(gameState.items, this.id);
    const affordable = selling || gameState.canAfford(price);
    this.content.removeAll(true);
    const add = (obj) => this.content.add(obj) && obj;

    // Name across the top (cut short with "…" if it's very long).
    add(fitText(scene.add.text(CARD_W / 2, PAD - 1, itemName(this.id), { ...TEXT, color: GOLD }).setOrigin(0.5, 0), CARD_W - PAD * 2));

    this.drawPicture(item, add);

    // Price: a coin and the number.
    const priceY = PIC.y + 7;
    add(scene.add.sprite(COL_X + 7, priceY, 'coin', 0));
    add(scene.add.text(COL_X + 16, priceY, price.toLocaleString('en-US'), { ...TEXT, color: affordable ? '#f7dc8a' : WARN }).setOrigin(0, 0.5));

    // How many you have (and whether you're wearing it).
    const wearing = item?.wear && gameState.look.worn?.[item.wear] === this.id;
    let status = owned === 0 ? 'Not owned' : owned === 1 ? 'You own one' : `You own ${owned}`;
    if (wearing) status = 'Wearing it';
    if (selling) status = `You have ${owned}`;
    add(scene.add.text(COL_X, PIC.y + 18, status, { ...TEXT, color: LIGHT }));

    if (!affordable) {
      const short = price - gameState.coins;
      const need = add(scene.add.text(COL_X, PIC.y + 32, `Need ${short.toLocaleString('en-US')} more`, { ...TEXT, color: WARN }));
      if (need.width > COL_W) need.setText(`Need ${short.toLocaleString('en-US')}`);
    } else if (item?.wear && !selling) {
      add(scene.add.text(COL_X, PIC.y + 32, 'Trying it on', { ...TEXT, color: GOLD }));
    }

    // Buy / Sell button.
    const label = selling ? 'Sell' : 'Buy';
    const button = woodButton(scene, label, COL_X + COL_W / 2, PIC.y + PIC.h - 11, () => this.press(), { width: COL_W, height: 20 });
    if (!affordable) button.setAlpha(0.55);
    add(button);

    // The description at the bottom.
    if (item?.desc) {
      add(scene.add.text(PAD, DESC_Y, item.desc, { ...TEXT, color: LIGHT, lineSpacing: 1, wordWrap: { width: CARD_W - PAD * 2 } }));
    }

    pinToScreen(this.root);
  }

  // Clothes: your pal wearing them. Anything else: the item's picture.
  drawPicture(item, add) {
    const scene = this.scene;
    const cx = PIC.x + PIC.w / 2;
    if (item?.wear) {
      const pal = scene.add.container(cx, PIC.y + PIC.h - 3).setScale(2);
      buildLook(pal, tryOn(gameState.look, item));
      add(pal);
      return;
    }
    const key = itemTexture(scene, this.id);
    if (key) add(scene.add.image(cx, PIC.y + PIC.h / 2, key).setScale(3));
    else add(scene.add.sprite(cx, PIC.y + PIC.h / 2, 'menu-icons', 4).setScale(3)); // a wrapped parcel
  }

  press() {
    if (this.mode === 'sell') this.onSell?.(this.id);
    else this.onBuy?.(findItem(this.id));
  }
}

// Your look with `item` put on (taking off whatever it can't be worn with).
export function tryOn(look, item) {
  const worn = { ...look.worn, [item.wear]: item.id };
  if (item.fullBody) worn.bottom = null; // pajamas cover your legs too
  if (item.wear === 'bottom' && findItem(worn.top)?.fullBody) worn.top = null;
  return { ...look, worn };
}
