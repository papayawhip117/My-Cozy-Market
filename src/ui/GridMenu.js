import { addPanel, PANEL_MARGIN } from './Panel.js';
import { TEXT, UI_DEPTH, pinToScreen } from './Dialog.js';
import { itemTexture, costOf, forSaleNow } from '../state/catalog.js';
import { gameState } from '../state/gameState.js';
import { priceTag } from './PriceTag.js';

// A catalogue grid: one picture tile per item with its price underneath,
// like a market stall. The selected tile glows; a green tick marks things
// you already own, and things you can't afford yet (or that are out of
// season) are dimmed. Prices can be coins, Glimmers or both.
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
// costs nothing), scroll the wheel to see more rows.
//
// A tab with more than MAX_ROWS rows scrolls: moving past the last row on
// show slides the next one in, and little arrows show there's more.
// Tab names that don't fit in one row (lots of tabs, long names) are packed
// tighter, and if they still don't fit they go on two rows.

const TILE_W = 36;
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
    this.rows = Math.max(1, Math.min(MAX_ROWS, Math.max(...this.pages.map((p) => Math.ceil(p.length / cols)))));
    this.scroll = 0; // the first row on show
    this.width = PAD * 2 + cols * TILE_W + (cols - 1) * GAP;
    const tabsTop = PAD + (title ? TITLE_H : 0);

    this.root = scene.add.container(x, y).setDepth(UI_DEPTH);
    if (title) this.root.add(scene.add.text(this.width / 2, PAD - 1, title, { ...TEXT, color: '#f2ead8' }).setOrigin(0.5, 0));

    // The tabs, sized to their words.
    this.tabParts = [];
    const tabRows = this.tabs ? this.addTabs(tabsTop) : 0;
    this.gridTop = tabsTop + (tabRows ? tabRows * (TAB_H + 2) + 1 : 0);
    this.backY = this.gridTop + this.rows * (TILE_H + GAP);
    this.height = this.backY + BACK_H + PAD - 1;
    const panel = addPanel(scene, 0, 0, this.width, this.height, 'panel-moss').setInteractive();
    this.root.addAt(panel, 0); // behind everything else

    // One tile per item (all built now; only the open tab's are shown). Each
    // tile is a little container, so scrolling just moves it up or down.
    this.tiles = [];
    this.pages.forEach((page, p) => {
      page.forEach((item, i) => {
        const tile = scene.add.container(PAD + (i % cols) * (TILE_W + GAP), 0);
        const bg = scene.add.rectangle(0, 0, TILE_W, TILE_H, CELL_BG, 0.6).setOrigin(0, 0).setStrokeStyle(1, LINE);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => this.select(i));
        bg.on('pointerup', () => {
          this.select(i);
          this.onChoose?.(item);
        });
        const key = itemTexture(scene, item.id);
        const icon = key
          ? scene.add.image(TILE_W / 2, 18, key).setScale(2)
          : scene.add.sprite(TILE_W / 2, 18, 'menu-icons', 4).setScale(2);
        // the price (coin + number, or sparkle + number), centered under the picture
        const price = priceTag(scene, costOf(item), { scale: 0.6 });
        price.setPosition(Math.round((TILE_W - price.w) / 2), TILE_H - 7);
        const tick = scene.add.text(TILE_W - 3, 2, '', { ...TEXT, fontSize: '10px', color: '#9ae6a0' }).setOrigin(1, 0);
        tile.add([bg, icon, price, tick]);
        this.root.add(tile);
        this.tiles.push({ page: p, i, row: Math.floor(i / cols), tile, bg, icon, price, tick, item });
      });
    });

    // "More this way" arrows for tabs that scroll.
    const ax = this.width - PAD + 3;
    this.moreUp = scene.add.text(ax, this.gridTop - 1, '▲', { ...TEXT, color: '#ffe3a0' }).setOrigin(0.5, 0);
    this.moreDown = scene.add.text(ax, this.backY - 10, '▼', { ...TEXT, color: '#ffe3a0' }).setOrigin(0.5, 0);
    for (const [arrow, dir] of [[this.moreUp, -1], [this.moreDown, 1]]) {
      arrow.setPadding(2, 2).setInteractive({ useHandCursor: true }).on('pointerup', () => this.scrollBy(dir));
    }
    this.root.add([this.moreUp, this.moreDown]);
    this.onWheel = (pointer, over, dx, dy) => {
      const b = panel.getBounds();
      if (b.contains(pointer.x, pointer.y)) this.scrollBy(Math.sign(dy));
    };
    scene.input.on('wheel', this.onWheel);

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

  // Lay the tab buttons out across the panel: roomy if they fit, packed
  // tighter if not, on two rows if even that's too wide. Returns how many rows.
  addTabs(top) {
    const scene = this.scene;
    const labels = this.tabs.map((t) => scene.add.text(0, 0, t.label, { ...TEXT, fontSize: '10px' }).setOrigin(0.5));
    const inner = this.width - PAD * 2;
    const widths = labels.map((l) => Math.ceil(l.width));
    const fits = (list, pad, gap) => list.reduce((a, w) => a + w + pad, 0) + gap * (list.length - 1) <= inner;
    let rows = [labels.map((_, i) => i)];
    let pad = 6;
    let gap = GAP;
    const roomy = [[6, 2], [4, 2], [2, 2], [2, 1]].find(([p, g]) => fits(widths, p, g));
    if (roomy) [pad, gap] = roomy;
    else {
      const half = Math.ceil(labels.length / 2);
      rows = [rows[0].slice(0, half), rows[0].slice(half)];
      pad = 4;
    }
    rows.forEach((row, r) => {
      const need = row.map((i) => widths[i] + pad);
      const extra = Math.max(0, inner - gap * (row.length - 1) - need.reduce((a, b) => a + b, 0));
      let tx = PAD;
      const y = top + r * (TAB_H + 2);
      row.forEach((i, k) => {
        // share leftover room out evenly (the last tab takes any odd pixels)
        const w = k === row.length - 1 ? PAD + inner - tx : need[k] + Math.floor(extra / row.length);
        const bg = scene.add.rectangle(tx, y, w, TAB_H, CELL_BG, 0.6).setOrigin(0, 0).setStrokeStyle(1, LINE);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerup', () => this.setTab(i));
        const label = labels[i].setPosition(Math.round(tx + w / 2), y + TAB_H / 2);
        this.root.add([bg, label]);
        this.tabParts[i] = { bg, label };
        tx += w + gap;
      });
    });
    return rows.length;
  }

  // Put the open tab's tiles where they belong for the current scroll.
  layout() {
    const lastRow = Math.max(0, Math.ceil(this.items.length / this.cols) - this.rows);
    this.scroll = Math.max(0, Math.min(this.scroll, lastRow));
    for (const t of this.tiles) {
      const row = t.row - this.scroll;
      const show = t.page === this.tab && row >= 0 && row < this.rows;
      t.tile.setVisible(show).setY(this.gridTop + row * (TILE_H + GAP));
      if (show) t.bg.setInteractive();
      else t.bg.disableInteractive();
    }
    this.moreUp.setVisible(this.scroll > 0);
    this.moreDown.setVisible(this.scroll < lastRow);
  }

  // Scroll the open tab by whole rows (+1 = down).
  scrollBy(dir) {
    const before = this.scroll;
    this.scroll += dir;
    this.layout();
    if (this.scroll !== before && this.index >= 0 && this.index < this.items.length) {
      // keep the selection on show
      const row = Math.floor(this.index / this.cols);
      const keepRow = Math.min(Math.max(row, this.scroll), this.scroll + this.rows - 1);
      if (keepRow !== row) this.select(Math.min(this.items.length - 1, keepRow * this.cols + this.col));
    }
  }

  // Scroll just enough to show item i.
  reveal(i) {
    const row = Math.floor(i / this.cols);
    if (row < this.scroll) this.scroll = row;
    else if (row >= this.scroll + this.rows) this.scroll = row - this.rows + 1;
    else return;
    this.layout();
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
    this.scroll = 0;
    this.layout();
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
    if (i >= 0 && i < n) {
      this.col = i % this.cols;
      this.reveal(i);
    }
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

  // Re-check what you own and what you can afford (and what's in season).
  refresh() {
    const owned = new Set(gameState.items);
    for (const { icon, price, tick, item } of this.tiles) {
      const inSeason = forSaleNow(item.id);
      const dim = !inSeason || !gameState.canAffordCost(costOf(item));
      icon.setAlpha(!inSeason ? 0.35 : dim ? 0.65 : 1);
      price.setColor(!inSeason ? '#9a917e' : dim ? '#e89a88' : null);
      tick.setText(owned.has(item.id) ? '✓' : '');
    }
  }

  destroy() {
    this.scene.input.off('wheel', this.onWheel);
    this.root.destroy();
  }
}
