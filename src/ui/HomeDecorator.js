import Phaser from 'phaser';
import { HOME_SWATCHES, FIXTURE_ART } from '../config.js';
import { gameState } from '../state/gameState.js';
import { itemName, itemTexture, isDecor, isWallItem, decorScale } from '../state/catalog.js';
import { recolorKey, colorGroups } from '../world/Recolor.js';
import { clampToWall, clampFootprint, footprintAt, toFloor, wallSide, wallTexture, CX, FLOOR_Y } from '../world/IsoRoom.js';
import { FOOTPRINT } from '../data/furniture.js';
import { addPanel, PANEL_MARGIN } from './Panel.js';
import { TEXT, UI_DEPTH, woodButton } from './Dialog.js';
import { fitText } from './MenuList.js';

// Everything about the furniture in your home: drawing what you've placed,
// and "decorate mode" where you can arrange it.
//
//   const decorator = new HomeDecorator(scene);
//   decorator.setMode(true);   // show the panels; things can be dragged
//
// In decorate mode:
//   - the left panel lists furniture and plants you own that aren't placed
//     yet. Click one to put it in the room.
//   - drag anything anywhere (floor things on the floor, pictures and
//     hanging plants on the walls). Arrow keys nudge the selected thing.
//   - the right panel has Flip, Store (back to your things) and paint
//     swatches for each of the item's colors.
//
// Placed things are saved in gameState (see placeItem/updatePlaced/removePlaced).
//
// Floor things are 3D pictures (tools/art/furniture.js) that cover a patch of
// floor (FOOTPRINT in src/data/furniture.js). They snap to whole floor units,
// never poke through the walls, and are drawn back to front so nearer things
// cover farther ones. playerDepth() slots your pal in between them.

const PAD = PANEL_MARGIN + 6;
const TILE = 26;
const GAP = 4;
const COLS = 3;
const ROWS = 5;
const SWATCH = 12;
const SELECT_COLOR = 0xffe3a0;

export default class HomeDecorator {
  constructor(scene) {
    this.scene = scene;
    this.mode = false;
    this.objects = new Map(); // uid -> { data, sprite, shadow }
    this.selected = null;
    this.page = 0;
    this.leftPanel = null;
    this.rightPanel = null;

    this.outline = scene.add.graphics().setDepth(UI_DEPTH - 200);
    this.onUse = null; // the scene says what clicking the door or dresser does
    for (const data of gameState.placed) if (isDecor(data.id) || data.fixed) this.add(data);

    // Click on empty space = let go of whatever is selected.
    scene.input.on('pointerdown', (pointer, over) => {
      if (this.mode && over.length === 0) this.select(null);
    });

    // Arrow keys nudge the selected thing; F flips it; Delete stores it.
    const nudge = { LEFT: [-2, 0], RIGHT: [2, 0], UP: [0, -2], DOWN: [0, 2] };
    for (const [key, [dx, dy]] of Object.entries(nudge)) {
      scene.input.keyboard.on(`keydown-${key}`, () => this.selected && this.mode && this.nudge(dx, dy));
    }
    scene.input.keyboard.on('keydown-F', () => this.mode && this.flip());
    scene.input.keyboard.on('keydown-DELETE', () => this.mode && this.store());
    scene.input.keyboard.on('keydown-BACKSPACE', () => this.mode && this.store());
  }

  // ---------- placed things ----------

  // Set a thing's picture from its colors, flip and (for wall things) which wall it's on.
  refreshPicture(obj) {
    const { data, sprite } = obj;
    const base = recolorKey(this.scene, data.id, data.c1, data.c2);
    if (obj.wall) {
      sprite.setTexture(wallTexture(this.scene, base, obj.scale, obj.side || -1, data.flip));
    } else {
      sprite.setTexture(base);
      sprite.setFlipX(data.flip);
    }
  }

  // Make the picture for one placed thing.
  add(data) {
    const scene = this.scene;
    const wall = isWallItem(data.id);
    const footprint = wall ? null : FOOTPRINT[data.id];
    const scale = footprint ? 1 : decorScale(data.id); // 3D pictures are drawn at room size already
    const sprite = scene.add.image(data.x, data.y, recolorKey(scene, data.id, data.c1, data.c2));
    sprite.setOrigin(0.5, wall ? 0.5 : 1);
    if (!wall) sprite.setScale(scale);
    const obj = { data, sprite, shadow: null, wall, footprint, scale, side: wall ? wallSide(data.x) : 0 };
    this.refreshPicture(obj);
    // (3D pictures have their shadow drawn in; anything else gets a soft round one)
    obj.shadow = wall || footprint ? null : scene.add.ellipse(data.x, data.y, sprite.displayWidth * 0.8, 6 + sprite.displayWidth * 0.12, 0x0d0a12, 0.3);

    sprite.setInteractive({ useHandCursor: true, draggable: true });
    scene.input.setDraggable(sprite);
    sprite.on('pointerdown', () => {
      if (this.mode) this.select(obj);
      else if (data.fixed) this.onUse?.(data); // clicking the door or dresser uses it
    });
    if (data.fixed) {
      sprite.on('pointerover', () => !this.mode && sprite.setTint(0xfff0d8));
      sprite.on('pointerout', () => sprite.clearTint());
    }
    sprite.on('drag', (pointer, x, y) => this.mode && this.moveTo(obj, x, y));
    sprite.on('dragend', () => this.save(obj));

    this.objects.set(data.uid, obj);
    this.place(obj, data.x, data.y);
    return obj;
  }

  // Move a thing to (x, y), keeping it inside the room (on the floor or on a wall).
  place(obj, x, y) {
    const { sprite, shadow, data } = obj;
    // (a wall picture's slanted copy is half its width taller than the picture itself)
    let pos;
    if (obj.wall) pos = clampToWall(x, y, sprite.displayWidth, sprite.displayHeight - sprite.displayWidth / 2);
    else pos = clampFootprint(x, y, ...this.size(obj));
    data.x = Math.round(pos.x);
    data.y = Math.round(pos.y);
    sprite.setPosition(data.x, data.y);
    if (obj.wall) sprite.setDepth(2);
    else this.sortDepths();
    if (obj.wall) {
      // lie flat along whichever wall it's on
      if (obj.side !== wallSide(data.x)) {
        obj.side = wallSide(data.x);
        this.refreshPicture(obj);
      }
    } else if (shadow) {
      shadow.setPosition(data.x, data.y - 1).setDepth(sprite.depth - 0.5);
    }
    if (this.selected === obj) this.drawOutline();
  }

  // How much floor a thing covers, [across, deep]. Flipping it swaps the two.
  // (Things without a 3D picture count as a small 8 x 8 patch.)
  size(obj) {
    const [a, b] = obj.footprint ?? [8, 8];
    return obj.data.flip ? [b, a] : [a, b];
  }

  // ---------- what's in front of what ----------

  // Give every floor thing a depth so things nearer the front cover things
  // behind them. Two pieces only need an order if their pictures overlap; one
  // is behind the other if it ends before the other starts along i or j.
  sortDepths() {
    const things = [...this.objects.values()].filter((o) => !o.wall);
    for (const o of things) {
      o.box = footprintAt(o.data.x, o.data.y, ...this.size(o));
      o.bounds = o.sprite.getBounds();
    }
    const middle = (o) => o.box.i0 + o.box.i1 + o.box.j0 + o.box.j1;
    const endsBefore = (p, q) => p.box.i1 <= q.box.i0 || p.box.j1 <= q.box.j0;
    // must p be drawn before q?
    const before = (p, q) => {
      if (!Phaser.Geom.Rectangle.Overlaps(p.bounds, q.bounds)) return false;
      const pq = endsBefore(p, q);
      const qp = endsBefore(q, p);
      return pq === qp ? middle(p) < middle(q) : pq;
    };
    // draw back to front: each time, take a thing nothing left has to go behind
    const left = [...things];
    let rank = 0;
    while (left.length) {
      let k = left.findIndex((q) => !left.some((p) => p !== q && before(p, q)));
      if (k < 0) k = left.reduce((best, o, n) => (middle(o) < middle(left[best]) ? n : best), 0); // (a tangle: nearest the back first)
      const [o] = left.splice(k, 1);
      o.sprite.setDepth(10 + rank * 2);
      o.shadow?.setDepth(9 + rank * 2);
      rank++;
    }
  }

  // The depth your pal needs to stand at (x, y) between the furniture: in
  // front of things she's past, behind things that are nearer the front.
  playerDepth(x, y, bounds) {
    const { i, j } = toFloor(x, y);
    let low = -Infinity;
    let high = Infinity;
    for (const o of this.objects.values()) {
      if (o.wall || !o.box || !Phaser.Geom.Rectangle.Overlaps(bounds, o.bounds)) continue;
      const b = o.box;
      let inFront;
      if (i >= b.i1 || j >= b.j1) inFront = true;
      else if (i <= b.i0 || j <= b.j0) inFront = false;
      else inFront = i + j > (b.i0 + b.i1 + b.j0 + b.j1) / 2; // standing inside it: the nearer half counts as in front
      if (inFront) low = Math.max(low, o.sprite.depth);
      else high = Math.min(high, o.sprite.depth);
    }
    if (low > -Infinity) return low + 1;
    if (high < Infinity) return high - 1;
    return 9;
  }

  moveTo(obj, x, y) {
    this.place(obj, x, y);
  }

  nudge(dx, dy) {
    const obj = this.selected;
    this.place(obj, obj.data.x + dx, obj.data.y + dy);
    this.save(obj);
  }

  save(obj) {
    gameState.updatePlaced(obj.data.uid, { x: obj.data.x, y: obj.data.y });
  }

  // The door, a window or the dresser (the first one with that id), or undefined.
  fixture(id) {
    return [...this.objects.values()].find((o) => o.data.fixed && o.data.id === id)?.data;
  }

  // ---------- selecting ----------

  select(obj) {
    this.selected = obj;
    this.drawOutline();
    this.buildRightPanel();
  }

  drawOutline() {
    this.outline.clear();
    const obj = this.selected;
    if (!obj) return;
    const b = obj.sprite.getBounds();
    this.outline.lineStyle(1, SELECT_COLOR, 1);
    this.outline.strokeRect(Math.round(b.x) - 1, Math.round(b.y) - 1, Math.round(b.width) + 2, Math.round(b.height) + 2);
    this.outline.setDepth(obj.sprite.depth + 0.4);
  }

  flip() {
    const obj = this.selected;
    if (!obj) return;
    obj.data.flip = !obj.data.flip;
    this.refreshPicture(obj);
    if (!obj.wall) this.place(obj, obj.data.x, obj.data.y); // a flipped piece covers the floor the other way round
    gameState.updatePlaced(obj.data.uid, { flip: obj.data.flip, x: obj.data.x, y: obj.data.y });
  }

  // Put the selected thing back in your backpack.
  store() {
    const obj = this.selected;
    if (!obj || (obj.data.fixed && obj.data.id !== 'window')) return; // the door and dresser stay in the room
    this.select(null);
    obj.sprite.destroy();
    obj.shadow?.destroy();
    this.objects.delete(obj.data.uid);
    this.sortDepths();
    if (obj.data.id === 'window') gameState.storeWindow(obj.data.uid);
    else gameState.removePlaced(obj.data.uid);
    this.buildLeftPanel();
  }

  // Paint one of the item's two color families (which = 'c1' or 'c2').
  paint(which, color) {
    const obj = this.selected;
    if (!obj) return;
    obj.data[which] = color;
    gameState.updatePlaced(obj.data.uid, { [which]: color });
    this.refreshPicture(obj);
    this.buildRightPanel();
  }

  // ---------- decorate mode ----------

  setMode(on) {
    this.mode = on;
    if (on) {
      this.buildLeftPanel();
    } else {
      this.select(null);
      this.leftPanel?.destroy();
      this.leftPanel = null;
    }
  }

  // The things you own that aren't in the room yet: [[id, how many], ...]
  unplaced() {
    const counts = new Map();
    for (const id of gameState.items) if (isDecor(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
    const things = [...counts].map(([id, n]) => [id, n - gameState.countPlaced(id)]).filter(([, n]) => n > 0);
    if (gameState.storedWindows > 0) things.push(['window', gameState.storedWindows]); // windows you've taken down
    return things;
  }

  // Put a new thing in the middle of the room and pick it up.
  put(id) {
    const wall = isWallItem(id);
    const [x, y] = wall ? [CX - 40, 100] : [CX, FLOOR_Y + 14];
    const data = id === 'window' ? gameState.placeWindow(x, y) : gameState.placeItem(id, x, y);
    if (!data) return;
    const obj = this.add(data);
    this.select(obj);
    this.buildLeftPanel();
  }

  // ---------- the panels ----------

  buildLeftPanel() {
    const scene = this.scene;
    this.leftPanel?.destroy();
    const stuff = this.unplaced();
    const perPage = COLS * ROWS;
    const pages = Math.max(1, Math.ceil(stuff.length / perPage));
    this.page = Math.min(this.page, pages - 1);

    const width = PAD * 2 + COLS * TILE + (COLS - 1) * GAP;
    const rows = Math.max(2, Math.min(ROWS, Math.ceil(stuff.length / COLS)));
    const gridTop = PAD + 15;
    const height = gridTop + rows * (TILE + GAP) + 16 + PAD - 4;
    const root = scene.add.container(4, 34).setDepth(UI_DEPTH);
    const panel = addPanel(scene, 0, 0, width, height, 'panel-moss').setInteractive();
    root.add(panel);
    root.add(scene.add.text(width / 2, PAD - 1, 'Your things', { ...TEXT, color: '#f2ead8' }).setOrigin(0.5, 0));

    // the footer line: the name of the thing under the mouse
    const footer = scene.add.text(width / 2, height - PAD - 4, '', { ...TEXT, fontSize: '10px', color: '#ffe3a0' }).setOrigin(0.5, 0);
    const hint = stuff.length ? 'Click to place' : '';
    footer.setText(hint);
    root.add(footer);

    if (!stuff.length) {
      root.add(
        scene.add
          .text(width / 2, gridTop + 6, 'Nothing to\nplace yet!\n\nBuy furniture\nand plants in\ntown.', { ...TEXT, fontSize: '10px', color: '#f2ead8', align: 'center', lineSpacing: 2 })
          .setOrigin(0.5, 0),
      );
    }

    stuff.slice(this.page * perPage, (this.page + 1) * perPage).forEach(([id, n], i) => {
      const x = PAD + (i % COLS) * (TILE + GAP);
      const y = gridTop + Math.floor(i / COLS) * (TILE + GAP);
      const bg = scene.add.rectangle(x, y, TILE, TILE, 0x1c2a22, 0.6).setOrigin(0, 0).setStrokeStyle(1, 0x1c1822);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        bg.setStrokeStyle(2, SELECT_COLOR);
        footer.setText(itemName(id));
        fitText(footer, width - PAD * 2);
      });
      bg.on('pointerout', () => {
        bg.setStrokeStyle(1, 0x1c1822);
        footer.setText(hint);
      });
      bg.on('pointerup', () => this.put(id));
      const key = FIXTURE_ART[id] ?? itemTexture(scene, id);
      const icon = scene.add.image(x + TILE / 2, y + TILE / 2, key ?? 'coin');
      if (FIXTURE_ART[id]) icon.setScale(Math.min(1, (TILE - 4) / Math.max(icon.width, icon.height))); // shrink the big window picture to fit
      root.add([bg, icon]);
      if (n > 1) {
        root.add(scene.add.text(x + TILE - 2, y + TILE - 1, String(n), { ...TEXT, fontSize: '10px', color: '#f2ead8', stroke: '#1c1822', strokeThickness: 2 }).setOrigin(1, 1));
      }
    });

    // page arrows
    if (pages > 1) {
      const arrow = (label, ax, dir) => {
        const t = scene.add.text(ax, height - PAD - 17, label, { ...TEXT, color: '#ffe3a0' }).setOrigin(0.5, 0);
        t.setPadding(4, 2).setInteractive({ useHandCursor: true }).on('pointerup', () => {
          this.page = (this.page + dir + pages) % pages;
          this.buildLeftPanel();
        });
        root.add(t);
      };
      arrow('◀', PAD + 6, -1);
      arrow('▶', width - PAD - 6, 1);
    }
    this.leftPanel = root;
  }

  // The panel for the selected thing: Flip, Store and paint swatches.
  buildRightPanel() {
    const scene = this.scene;
    this.rightPanel?.destroy();
    this.rightPanel = null;
    const obj = this.selected;
    if (!obj) return;

    const groups = colorGroups(scene, obj.data.id);
    const perRow = 6;
    const swatchW = perRow * (SWATCH + 2) - 2;
    const width = Math.max(104, swatchW + PAD * 2);
    const swatchRows = Math.ceil(HOME_SWATCHES.length / perRow);
    const swatchBlock = swatchRows * (SWATCH + 2) + 14; // label + swatches
    const height = PAD + 15 + 24 + groups * swatchBlock + PAD - 2 + (groups ? 0 : 14);
    const root = scene.add.container(480 - 4 - width, 34).setDepth(UI_DEPTH);
    root.add(addPanel(scene, 0, 0, width, height, 'panel-moss').setInteractive());
    const name = scene.add.text(width / 2, PAD - 1, itemName(obj.data.id), { ...TEXT, color: '#ffe3a0' }).setOrigin(0.5, 0);
    fitText(name, width - PAD * 2);
    root.add(name);

    const half = (width - PAD * 2) / 2;
    if (obj.data.fixed && obj.data.id !== 'window') {
      // the door and dresser can be moved, flipped and painted, but not stored
      root.add(woodButton(scene, 'Flip', width / 2, PAD + 26, () => this.flip(), { width: width - PAD * 2, height: 18 }));
    } else {
      root.add(woodButton(scene, 'Flip', PAD + half / 2, PAD + 26, () => this.flip(), { width: half - 2, height: 18 }));
      root.add(woodButton(scene, 'Store', PAD + half * 1.5, PAD + 26, () => this.store(), { width: half - 2, height: 18 }));
    }

    // paint swatches for each color family
    let y = PAD + 15 + 24;
    if (!groups) root.add(scene.add.text(width / 2, y, 'Drag to move', { ...TEXT, fontSize: '10px', color: '#f2ead8' }).setOrigin(0.5, 0));
    for (let g = 0; g < groups; g++) {
      const which = g === 0 ? 'c1' : 'c2';
      root.add(scene.add.text(PAD, y, g === 0 ? 'Main color' : 'Accent color', { ...TEXT, fontSize: '10px', color: '#f2ead8' }));
      HOME_SWATCHES.forEach((color, i) => {
        const sx = PAD + (i % perRow) * (SWATCH + 2);
        const sy = y + 13 + Math.floor(i / perRow) * (SWATCH + 2);
        const on = obj.data[which] === color;
        const fill = color ?? 0x2a1f1c;
        const box = scene.add.rectangle(sx, sy, SWATCH, SWATCH, fill).setOrigin(0, 0).setStrokeStyle(on ? 2 : 1, on ? SELECT_COLOR : 0x1c1822);
        box.setInteractive({ useHandCursor: true }).on('pointerup', () => this.paint(which, color));
        root.add(box);
        if (color === null) root.add(scene.add.text(sx + SWATCH / 2, sy + SWATCH / 2, '×', { ...TEXT, fontSize: '10px', color: '#c9bba0' }).setOrigin(0.5)); // "original"
      });
      y += swatchBlock;
    }
    this.rightPanel = root;
  }

  destroy() {
    this.leftPanel?.destroy();
    this.rightPanel?.destroy();
    this.outline.destroy();
  }
}
