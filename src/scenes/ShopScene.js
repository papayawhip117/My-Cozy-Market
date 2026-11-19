import Phaser from 'phaser';
import { SHOPS, SHOP_STOCK, SHOP_TABS } from '../config.js';
import CoinHud from '../ui/CoinHud.js';
import MenuList from '../ui/MenuList.js';
import GridMenu from '../ui/GridMenu.js';
import ItemCard from '../ui/ItemCard.js';
import CornerMenu from '../ui/CornerMenu.js';
import { showToast } from '../ui/Dialog.js';
import { gameState } from '../state/gameState.js';
import { itemName, sellPrice } from '../state/catalog.js';
import { preloadLook } from '../objects/CharacterLook.js';
import { drawShopInterior } from '../world/ShopInterior.js';
import { travel, arrive } from './travel.js';

// Inside a shop. No walking here: you stand at the counter and pick from
// a menu in the top-left corner.
//
//   Shop   look through what's for sale and buy things
//   Sell   sell things from your backpack for half price
//   Leave  back out to the street, right where you were
//
// Shop opens a picture grid of everything for sale, sorted into tabs
// (src/ui/GridMenu.js; tabs come from SHOP_TABS in config.js) and
// Sell opens a list of your things. Beside either one is a catalogue card
// (src/ui/ItemCard.js) showing the selected item up close: its picture
// (clothes are shown on your pal), price, how many you own and a
// description. Looking is free; you only pay when you press Buy.
//
// Keyboard: arrow keys (or WASD) to move, Enter/Space to pick, Esc to go back.
// Mouse: hover a tile or row to look at it, then press Buy (or Sell).
//
// Started from the street with: travel(this, 'Shop', { shopKey: 'matcha', x: player.x })

const MENU_X = 4;
const MENU_Y = 36; // just under the coin counter
const MAIN_W = 72;
const LIST_W = 170; // the buy/sell list takes the main menu's place...
const CARD_X = MENU_X + LIST_W + 4; // ...with the catalogue card beside it
const SELL_PAGE = 6; // more things than this to sell? the list gets pages

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('Shop');
  }

  preload() {
    CoinHud.preload(this); // coin art and the green/wood panels
    CornerMenu.preload(this); // item pictures (and a parcel for items with none)
    preloadLook(this); // your pal, for trying clothes on
  }

  create(data) {
    this.shop = SHOPS.find((s) => s.id === data.shopKey) ?? SHOPS[0];
    this.returnX = data.x ?? this.shop.x;

    drawShopInterior(this, this.shop);
    this.hud = new CoinHud(this);

    this.card = new ItemCard(this, {
      x: CARD_X,
      y: MENU_Y,
      onBuy: (item) => this.buy(item),
      onSell: (id) => this.sell(id),
    });
    this.list = null; // the buy or sell list, while it's open
    this.openMain(0);

    // Keyboard goes to whichever menu has focus.
    const keys = { UP: -1, W: -1, DOWN: 1, S: 1 };
    for (const [key, step] of Object.entries(keys)) this.input.keyboard.on(`keydown-${key}`, () => this.focus.move(step));
    const sideKeys = { LEFT: -1, A: -1, RIGHT: 1, D: 1 }; // only the grid uses these
    for (const [key, dir] of Object.entries(sideKeys)) this.input.keyboard.on(`keydown-${key}`, () => this.focus.moveH?.(dir));
    for (const key of ['ENTER', 'SPACE']) this.input.keyboard.on(`keydown-${key}`, () => this.focus.choose());
    this.input.keyboard.on('keydown-ESC', () => this.focus.cancel());

    // Coins keep ticking up while you shop, so re-check what you can afford.
    const stop = gameState.onChange(() => {
      this.list?.refresh();
      this.card.refresh();
    });
    this.events.once('shutdown', stop);

    arrive(this);
  }

  // ---------- buying ----------

  // The main menu: Shop, Sell, Leave.
  openMain(selected) {
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
      selected,
    });
    this.focus = this.main; // which menu the keyboard drives
  }

  openStock() {
    const stock = SHOP_STOCK[this.shop.id] ?? [];
    this.openGrid({ title: 'For sale', items: stock, tabs: SHOP_TABS[this.shop.id] });
  }

  buy(item) {
    if (!gameState.spendCoins(item.price)) {
      const short = item.price - gameState.coins;
      showToast(this, `You need ${short} more coin${short === 1 ? '' : 's'}`);
      return;
    }
    gameState.addItem(item.id);
    showToast(this, `You bought the ${item.name}!`);
    this.list?.refresh();
    this.card.refresh();
  }

  // ---------- selling ----------

  // `page`: with lots of different things, the list shows SELL_PAGE at a
  // time and a "More..." row flips to the next page.
  openSell(selected = 0, page = 0) {
    // Count duplicates so 2 lattes show as one row: "Matcha Latte x2".
    const counts = new Map();
    for (const id of gameState.items) counts.set(id, (counts.get(id) ?? 0) + 1);
    // Things in your home aren't for sale (store them first).
    for (const [id, n] of counts) {
      const free = n - gameState.countPlaced(id);
      if (free > 0) counts.set(id, free);
      else counts.delete(id);
    }
    if (counts.size === 0) {
      this.closeList();
      showToast(this, 'You have nothing to sell yet');
      return;
    }
    const pages = Math.ceil(counts.size / SELL_PAGE);
    page = Math.min(page, pages - 1);
    this.sellPage = page;
    const rows = [...counts].slice(page * SELL_PAGE, (page + 1) * SELL_PAGE).map(([id, n]) => ({
      id,
      label: n > 1 ? `${itemName(id)} x${n}` : itemName(id),
      price: sellPrice(id),
      clickSelects: true,
      action: () => this.sell(id),
    }));
    if (pages > 1) rows.push({ label: 'More...', action: () => this.openSell(0, (page + 1) % pages) });
    const title = pages > 1 ? `Sell (${page + 1}/${pages})` : 'Sell for half price';
    this.openList({ title, mode: 'sell', rows, selected });
  }

  sell(id) {
    if (gameState.available(id) < 1 || !gameState.removeItem(id)) return;
    const price = sellPrice(id);
    gameState.addCoins(price, 'sell');
    showToast(this, `Sold the ${itemName(id)} for ${price} coin${price === 1 ? '' : 's'}`);
    if (gameState.items.length - gameState.placed.length > 0) this.openSell(this.list?.index ?? 0, this.sellPage); // rebuild the list, keep your place
    else this.closeList(); // sold your last thing
  }

  // ---------- the side list ----------

  // Opens a list in place of the main menu (replacing any open one), with a
  // Back row. Selecting a row with an item `id` shows it on the card.
  openList({ title, mode, rows, selected = 0 }) {
    this.list?.destroy();
    this.main?.destroy();
    this.main = null;
    this.listMode = mode;
    this.list = new MenuList(this, {
      x: MENU_X,
      y: MENU_Y,
      width: LIST_W,
      title,
      rows: [...rows, { label: 'Back', action: () => this.closeList() }],
      onCancel: () => this.closeList(),
      onSelect: (row) => (row.id ? this.card.show(row.id, mode) : this.card.hide()),
      selected,
    });
    this.card.root.setX(CARD_X);
    this.focus = this.list;
  }

  // The picture grid for buying (replaces the main menu, like openList).
  openGrid({ title, items, tabs, selected = 0 }) {
    this.list?.destroy();
    this.main?.destroy();
    this.main = null;
    this.listMode = 'buy';
    this.list = new GridMenu(this, {
      x: MENU_X,
      y: MENU_Y,
      title,
      items,
      tabs,
      onChoose: (item) => this.buy(item), // Enter on a tile buys it
      onCancel: () => this.closeList(),
      onSelect: (item) => {
        if (item) this.card.show(item.id, 'buy');
        else this.card.hide();
      },
      selected,
    });
    this.card.root.setX(MENU_X + this.list.width + 4);
    this.focus = this.list;
  }

  // Back to the main menu, with Shop or Sell still selected.
  closeList() {
    if (!this.list) return;
    this.list.destroy();
    this.list = null;
    this.card.hide();
    this.openMain(this.listMode === 'sell' ? 1 : 0);
  }

  leave() {
    travel(this, 'Street', { x: this.returnX });
  }

  update(time, delta) {
    gameState.update(delta); // idle coins keep coming in while you shop
  }
}
