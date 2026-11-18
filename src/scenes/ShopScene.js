import Phaser from 'phaser';
import { SHOPS, SHOP_STOCK } from '../config.js';
import CoinHud from '../ui/CoinHud.js';
import MenuList from '../ui/MenuList.js';
import { showToast } from '../ui/Dialog.js';
import { gameState } from '../state/gameState.js';
import { itemName, sellPrice } from '../state/catalog.js';
import { drawShopInterior } from '../world/ShopInterior.js';
import { travel, arrive } from './travel.js';

// Inside a shop. No walking here: you stand at the counter and pick from
// a menu in the top-left corner.
//
//   Shop   see what's for sale and buy things
//   Sell   sell things from your backpack for half price
//   Leave  back out to the street, right where you were
//
// Keyboard: Up/Down (or W/S) to move, Enter/Space to pick, Esc to go back.
// Mouse: hover a row to select it, click to pick it.
//
// Started from the street with: travel(this, 'Shop', { shopKey: 'matcha', x: player.x })

const MENU_X = 4;
const MENU_Y = 36; // just under the coin counter
const MAIN_W = 72;
const LIST_X = MENU_X + MAIN_W + 4; // the buy/sell list opens beside the menu
const LIST_W = 176;
const MAX_SELL_ROWS = 7;

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('Shop');
  }

  preload() {
    CoinHud.preload(this); // coin art and the green/wood panels
  }

  create(data) {
    this.shop = SHOPS.find((s) => s.id === data.shopKey) ?? SHOPS[0];
    this.returnX = data.x ?? this.shop.x;

    drawShopInterior(this, this.shop);
    this.hud = new CoinHud(this);

    this.main = new MenuList(this, {
      x: MENU_X,
      y: MENU_Y,
      width: MAIN_W,
      rows: [
        { label: 'Shop', action: () => this.openStock() },
        { label: 'Sell', action: () => this.openSell() },
        { label: 'Leave', action: () => this.leave() },
      ],
      onCancel: () => this.leave(),
    });
    this.list = null; // the buy or sell list, while it's open
    this.focus = this.main; // which menu the keyboard drives

    // Keyboard goes to whichever menu has focus.
    const keys = { UP: -1, W: -1, DOWN: 1, S: 1 };
    for (const [key, step] of Object.entries(keys)) this.input.keyboard.on(`keydown-${key}`, () => this.focus.move(step));
    for (const key of ['ENTER', 'SPACE']) this.input.keyboard.on(`keydown-${key}`, () => this.focus.choose());
    this.input.keyboard.on('keydown-ESC', () => this.focus.cancel());

    // Coins keep ticking up while you shop, so re-check what you can afford.
    const stop = gameState.onChange(() => this.list?.refresh());
    this.events.once('shutdown', stop);

    arrive(this);
  }

  // ---------- buying ----------

  openStock() {
    const stock = SHOP_STOCK[this.shop.id] ?? [];
    this.openList({
      title: 'For sale',
      rows: stock.map((item) => ({
        label: item.name,
        price: item.price,
        dim: () => !gameState.canAfford(item.price),
        action: () => this.buy(item),
      })),
    });
  }

  buy(item) {
    if (!gameState.spendCoins(item.price)) {
      showToast(this, 'Not enough coins');
      return;
    }
    gameState.addItem(item.id);
    showToast(this, `You bought ${item.name}!`);
    this.list.refresh();
  }

  // ---------- selling ----------

  openSell(selected = 0) {
    // Count duplicates so 2 lattes show as one row: "Matcha Latte x2".
    const counts = new Map();
    for (const id of gameState.items) counts.set(id, (counts.get(id) ?? 0) + 1);
    if (counts.size === 0) {
      this.closeList();
      showToast(this, 'Nothing to sell yet');
      return;
    }
    const rows = [...counts].slice(0, MAX_SELL_ROWS).map(([id, n]) => ({
      label: n > 1 ? `${itemName(id)} x${n}` : itemName(id),
      price: sellPrice(id),
      action: () => this.sell(id),
    }));
    this.openList({ title: 'Sell for half price', rows, selected });
  }

  sell(id) {
    if (!gameState.removeItem(id)) return;
    const price = sellPrice(id);
    gameState.addCoins(price, 'sell');
    showToast(this, `Sold ${itemName(id)} for ${price} coins`);
    if (gameState.items.length) this.openSell(this.list.index); // rebuild the list, keep your place
    else this.closeList(); // sold your last thing
  }

  // ---------- the side list ----------

  // Opens a list beside the main menu (replacing any open one), with a Back row.
  openList({ title, rows, selected = 0 }) {
    this.closeList();
    this.list = new MenuList(this, {
      x: LIST_X,
      y: MENU_Y,
      width: LIST_W,
      title,
      rows: [...rows, { label: 'Back', action: () => this.closeList() }],
      onCancel: () => this.closeList(),
      selected,
    });
    this.focus = this.list;
  }

  closeList() {
    this.list?.destroy();
    this.list = null;
    this.focus = this.main;
  }

  leave() {
    travel(this, 'Street', { x: this.returnX });
  }

  update(time, delta) {
    gameState.update(delta); // idle coins keep coming in while you shop
  }
}
