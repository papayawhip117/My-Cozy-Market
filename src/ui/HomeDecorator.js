import { HOME_SWATCHES } from '../config.js';
import { gameState } from '../state/gameState.js';
import { itemName, itemTexture, isDecor, isWallItem, decorScale } from '../state/catalog.js';
import { recolorKey, colorGroups } from '../world/Recolor.js';
import { clampToFloor, clampToWall, wallSide, wallTexture, CX, FLOOR_Y } from '../world/IsoRoom.js';
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
    const scale = decorScale(data.id);
    const sprite = scene.add.image(data.x, data.y, recolorKey(scene, data.id, data.c1, data.c2));
    sprite.setOrigin(0.5, wall ? 0.5 : 1);
    if (!wall) sprite.setScale(scale);
    const obj = { data, sprite, shadow: null, wall, scale, side: wall ? wallSide(data.x) : 0 };
    this.refreshPicture(obj);
    obj.shadow = wall ? null : scene.add.ellipse(data.x, data.y, sprite.displayWidth * 0.8, 6 + sprite.displayWidth * 0.12, 0x0d0a12, 0.3);

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
    const pos = obj.wall ? clampToWall(x, y, sprite.displayWidth, sprite.displayHeight) : clampToFloor(x, y, 6);
    data.x = Math.round(pos.x);
    data.y = Math.round(pos.y);
    sprite.setPosition(data.x, data.y);
    sprite.setDepth(obj.wall ? 2 : data.y);
    if (obj.wall) {
      // lie flat along whichever wall it's on
      if (obj.side !== wallSide(data.x)) {
        obj.side = wallSide(data.x);
        this.refreshPicture(obj);
      }
    } else {
      shadow.setPosition(data.x, data.y - 1).setDepth(data.y - 0.5);
    }
    if (this.selected === obj) this.drawOutline();
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
    gameState.updatePlaced(obj.data.uid, { flip: obj.data.flip });
  }

  // Put the selected thing back in your backpack.
  store() {
    const obj = this.selected;
    if (!obj || obj.data.fixed) return; // the door, windows and dresser stay in the room
    this.select(null);
    obj.sprite.destroy();
    obj.shadow?.destroy();
    this.objects.delete(obj.data.uid);
    gameState.removePlaced(obj.data.uid);
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
    return [...counts].map(([id, n]) => [id, n - gameState.countPlaced(id)]).filter(([, n]) => n > 0);
  }

  // Put a new thing in the middle of the room and pick it up.
  put(id) {
    const wall = isWallItem(id);
    const data = gameState.placeItem(id, wall ? CX - 40 : CX, wall ? 100 : FLOOR_Y + 14);
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
      const key = itemTexture(scene, id);
      root.add([bg, scene.add.image(x + TILE / 2, y + TILE / 2, key ?? 'coin')]);
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
    if (obj.data.fixed) {
      // the door, windows and dresser can be moved, flipped and painted, but not stored
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
