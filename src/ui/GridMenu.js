import { addPanel, PANEL_MARGIN } from './Panel.js';
import { TEXT, UI_DEPTH, pinToScreen } from './Dialog.js';
import { itemTexture } from '../state/catalog.js';
import { gameState } from '../state/gameState.js';

// A catalogue grid: one picture tile per item with its price underneath,
// like a market stall. The selected tile glows; a green tick marks things
// you already own, and things you can't afford yet are dimmed.
//
//   const grid = new GridMenu(scene, {
//     x: 4, y: 36, title: 'For sale', cols: 4,
//     items: [{ id: 'beret', price: 15, cat: 'hats' }, ...],
//     tabs: [{ id: 'hats', label: 'Hats' }, ...],   // optional: sort items into tabs by `cat`
//     onSelect: (item) => ...,      // item is null on the Back button
//     onChoose: (item) => ...,      // Enter on a tile (the shop buys it)
//     onCancel: () => ...,          // Esc or the Back button
//   });
//
// Controls (the scene forwards the keys):
//   move(+1/-1)   down/up a row. Up from the top row reaches the tabs,
//                 down from the bottom row reaches Back.
//   moveH(+1/-1)  right/left across tiles. On the tabs row it switches tab.
//   choose()      Enter. cancel() is Esc.
// The mouse: hover a tile to select it, click a tab to switch (just looking
// costs nothing).

const TILE_W = 34;
const TILE_H = 42;
const GAP = 2;
const PAD = PANEL_MARGIN + 6;
const TITLE_H = 15;
const TAB_H = 14;
const BACK_H = 14;
const MAX_ROWS = 2; // most rows any one tab shows (4 columns x 2 = 8 things)
const GLOW = 0xffe3a0;
const CELL_BG = 0x1c2a22;
const LINE = 0x1c1822;
const TABS = -1; // the index while the tabs row is selected

export default class GridMenu {
  constructor(scene, { x, y, title, items, tabs, cols = 4, onSelect, onChoose, onCancel, selected = 0 }) {
    this.scene = scene;
    this.cols = cols;
    this.onSelect = onSelect;
    this.onChoose = onChoose;
    this.onCancel = onCancel;
    this.tabs = tabs?.length > 1 ? tabs : null;
    this.tab = 0;
    this.index = -2; // nothing selected yet
    this.col = 0;

    // Each tab shows its own items (no tabs = everything on one page).
    this.pages = this.tabs ? this.tabs.map((t) => items.filter((i) => i.cat === t.id)) : [items];
    const rows = Math.min(MAX_ROWS, Math.max(...this.pages.map((p) => Math.ceil(p.length / cols))));
    this.width = PAD * 2 + cols * TILE_W + (cols - 1) * GAP;
    const tabsTop = PAD + (title ? TITLE_H : 0);
    const gridTop = tabsTop + (this.tabs ? TAB_H + 3 : 0);
    this.backY = gridTop + rows * (TILE_H + GAP);
    this.height = this.backY + BACK_H + PAD - 1;

    const panel = addPanel(scene, 0, 0, this.width, this.height, 'panel-moss').setInteractive();
    this.root = scene.add.container(x, y, [panel]).setDepth(UI_DEPTH);
    if (title) this.root.add(scene.add.text(this.width / 2, PAD - 1, title, { ...TEXT, color: '#f2ead8' }).setOrigin(0.5, 0));

    // The tabs, sized to their words.
    this.tabParts = [];
    if (this.tabs) {
      const labels = this.tabs.map((t) => scene.add.text(0, 0, t.label, { ...TEXT, fontSize: '8px' }).setOrigin(0.5));
      const inner = this.width - PAD * 2;
      let need = labels.map((l) => Math.ceil(l.width) + 6);
      if (need.reduce((a, b) => a + b, 0) + GAP * (labels.length - 1) > inner) {
        // too many words for the panel: use slightly smaller letters
        for (const l of labels) l.setFontSize('7px');
        need = labels.map((l) => Math.ceil(l.width) + 4);
      }
      const extra = Math.max(0, inner - GAP * (labels.length - 1) - need.reduce((a, b) => a + b, 0));
      let tx = PAD;
      labels.forEach((label, i) => {
        const w = need[i] + Math.floor(extra / labels.length); // share leftover room out evenly
        const bg = scene.add.rectangle(tx, tabsTop, w, TAB_H, CELL_BG, 0.6).setOrigin(0, 0).setStrokeStyle(1, LINE);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerup', () => this.setTab(i));
        label.setPosition(tx + w / 2, tabsTop + TAB_H / 2);
        this.root.add([bg, label]);
        this.tabParts.push({ bg, label });
        tx += w + GAP;
      });
    }

    // One tile per item (all built now; only the open tab's are shown).
    this.tiles = [];
    this.pages.forEach((page, p) => {
      page.forEach((item, i) => {
        const tx = PAD + (i % cols) * (TILE_W + GAP);
        const ty = gridTop + Math.floor(i / cols) * (TILE_H + GAP);
        const bg = scene.add.rectangle(tx, ty, TILE_W, TILE_H, CELL_BG, 0.6).setOrigin(0, 0).setStrokeStyle(1, LINE);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => this.select(i));
        bg.on('pointerup', () => {
          this.select(i);
          this.onChoose?.(item);
        });
        const key = itemTexture(scene, item.id);
        const icon = key
          ? scene.add.image(tx + TILE_W / 2, ty + 18, key).setScale(2)
          : scene.add.sprite(tx + TILE_W / 2, ty + 18, 'menu-icons', 4).setScale(2);
        const coin = scene.add.sprite(0, ty + TILE_H - 7, 'coin', 0).setScale(0.6);
        const price = scene.add.text(0, ty + TILE_H - 7, String(item.price), { ...TEXT, fontSize: '8px' }).setOrigin(0, 0.5);
        // coin + number, centered together under the picture
        const total = 9 + price.width;
        coin.x = tx + (TILE_W - total) / 2 + 4;
        price.x = coin.x + 5;
        const tick = scene.add.text(tx + TILE_W - 3, ty + 2, '', { ...TEXT, fontSize: '8px', color: '#9ae6a0' }).setOrigin(1, 0);
        const parts = [bg, icon, coin, price, tick];
        this.root.add(parts);
        this.tiles.push({ page: p, i, bg, icon, price, tick, item, parts });
      });
    });

    // The Back button under the grid (selectable like a tile).
    const bw = this.width - PAD * 2;
    this.back = scene.add.rectangle(PAD, this.backY, bw, BACK_H, CELL_BG, 0.6).setOrigin(0, 0).setStrokeStyle(1, LINE);
    this.back.setInteractive({ useHandCursor: true });
    this.back.on('pointerover', () => this.select(this.items.length));
    this.back.on('pointerup', () => this.cancel());
    this.backLabel = scene.add.text(PAD + bw / 2, this.backY + BACK_H / 2, 'Back', TEXT).setOrigin(0.5);
    this.root.add([this.back, this.backLabel]);

    this.showTab(0);
    pinToScreen(this.root).setAlpha(0);
    this.select(Math.min(selected, this.items.length - 1));
    scene.tweens.add({ targets: this.root, alpha: 1, duration: 110 });
  }

  // The items on the open tab.
  get items() {
    return this.pages[this.tab];
  }

  get bottom() {
    return this.root.y + this.height;
  }

  // Show only the open tab's tiles and light up its tab.
  showTab(t) {
    this.tab = t;
    for (const tile of this.tiles) for (const part of tile.parts) part.setVisible(tile.page === t);
    this.tabParts.forEach(({ bg, label }, i) => {
      const on = i === t;
      bg.setFillStyle(on ? GLOW : CELL_BG, on ? 0.32 : 0.6).setStrokeStyle(1, on ? GLOW : LINE);
      label.setColor(on ? '#fff3c8' : TEXT.color);
    });
    this.refresh();
  }

  // Switch tab (by click or the arrow keys) and look at its first item.
  setTab(t) {
    if (!this.tabs) return;
    this.showTab((t + this.tabs.length) % this.tabs.length);
    const keepTabs = this.index === TABS;
    this.index = -2; // force select() to redraw
    this.select(keepTabs ? TABS : 0);
  }

  select(i) {
    if (i === this.index) return;
    this.index = i;
    const n = this.items.length;
    const onBack = i === n;
    this.tiles.forEach((t) => {
      const on = t.page === this.tab && t.i === i;
      t.bg.setFillStyle(on ? GLOW : CELL_BG, on ? 0.3 : 0.6).setStrokeStyle(on ? 2 : 1, on ? GLOW : LINE);
    });
    this.back.setFillStyle(onBack ? GLOW : CELL_BG, onBack ? 0.3 : 0.6).setStrokeStyle(onBack ? 2 : 1, onBack ? GLOW : LINE);
    this.tabParts.forEach(({ bg }, j) => bg.setStrokeStyle(i === TABS && j === this.tab ? 2 : 1, j === this.tab ? GLOW : LINE));
    if (i >= 0 && i < n) this.col = i % this.cols;
    // The card shows the selected item (the open tab's first one while on the tabs row).
    const item = onBack ? null : this.items[i < 0 ? 0 : i] ?? null;
    this.onSelect?.(item, i);
  }

  // Up = -1, down = +1 (a whole row). Up from the top row reaches the tabs;
  // down from the bottom row reaches Back.
  move(step) {
    const n = this.items.length;
    const rows = Math.ceil(n / this.cols);
    if (this.index === TABS) {
      if (step > 0) return this.select(Math.min(n - 1, this.col));
      return this.select(n); // up from the tabs wraps around to Back
    }
    if (this.index === n) {
      if (step > 0) return this.select(this.tabs ? TABS : Math.min(n - 1, this.col));
      return this.select(Math.min(n - 1, (rows - 1) * this.cols + this.col));
    }
    const row = Math.floor(this.index / this.cols) + step;
    if (row < 0) return this.select(this.tabs ? TABS : n);
    if (row >= rows) return this.select(n);
    this.select(Math.min(n - 1, row * this.cols + (this.index % this.cols)));
  }

  // Right = +1, left = -1. On the tabs row this switches tab.
  moveH(dir) {
    const n = this.items.length;
    if (this.index === TABS) return this.setTab(this.tab + dir);
    if (this.index === n) return;
    this.select((this.index + dir + n) % n);
  }

  choose() {
    if (this.index === TABS) return;
    if (this.index === this.items.length) return this.cancel();
    this.onChoose?.(this.items[this.index]);
  }

  cancel() {
    this.onCancel?.();
  }

  // Re-check what you own and what you can afford.
  refresh() {
    const owned = new Set(gameState.items);
    for (const { icon, price, tick, item } of this.tiles) {
      const dim = !gameState.canAfford(item.price);
      icon.setAlpha(dim ? 0.65 : 1);
      price.setColor(dim ? '#e89a88' : '#f7dc8a');
      tick.setText(owned.has(item.id) ? '✓' : '');
    }
  }

  destroy() {
    this.root.destroy();
  }
}
