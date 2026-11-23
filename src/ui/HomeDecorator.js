import Phaser from 'phaser';
import { HOME_SWATCHES, FIXTURE_ART } from '../config.js';
import { gameState } from '../state/gameState.js';
import { itemName, itemTexture, isDecor, isWallItem, decorScale, isHomeStyle } from '../state/catalog.js';
import { recolorKey, colorGroups, textureOf } from '../world/Recolor.js';
import { clampToWall, clampFootprint, footprintAt, wallTexture, roomAt, currentRooms, defaultFloor } from '../world/IsoRoom.js';
import { FOOTPRINT, FLAT, WALL_ART } from '../data/furniture.js';
import { STAIRS, isStairs, stairProgress, stairHeight } from '../data/stairs.js';
import { slotName } from '../data/paint.js';
import { WALLPAPERS, FLOORS, DOORS, DEFAULT_WALLPAPER, DEFAULT_DOOR, DEFAULT_FLOORS, doorTexture } from '../data/homeStyles.js';
import { addPanel, PANEL_MARGIN } from './Panel.js';
import { TEXT, UI_DEPTH, woodButton, pinToScreen } from './Dialog.js';
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
//   - wallpaper, flooring and front doors you've bought are in "Your things"
//     too. Wallpaper and doors go up as soon as you click them; for flooring,
//     click it, then click the room to lay it in.
//
// Rooms themselves are moved in the floor plan (src/ui/FloorPlan.js).
// Anything a moved room leaves without a floor or wall to stand on goes back
// to "Your things" (see reconcile()).
//
// A home bigger than the screen scrolls (everything is always drawn at full
// size): drag empty space, use the arrow keys, or pick a spot on the Map
// (src/ui/HomeMap.js) to look around.
//
// Placed things are saved in gameState (see placeItem/updatePlaced/removePlaced).
//
// Floor things are 3D pictures (tools/art/furniture.js) that cover a patch of
// floor (FOOTPRINT in src/data/furniture.js). They snap to whole floor units,
// never poke through the walls, and are drawn back to front so nearer things
// cover farther ones. playerDepth() slots your pal in between them. Rugs
// (FLAT) always lie underneath everything.

const PAD = PANEL_MARGIN + 6;
const TILE = 26;
const GAP = 4;
const COLS = 3;
const ROWS = 5;
const SWATCH = 10;
const SELECT_COLOR = 0xffe3a0;

export default class HomeDecorator {
  constructor(scene) {
    this.scene = scene;
    this.mode = false;
    this.objects = new Map(); // uid -> { data, sprite, shadow }
    this.selected = null;
    this.page = 0;
    this.rightFolded = false; // the paint panel folded away
    this.folded = false; // "Your things" folded away, so you can reach things under it
    this.leftPanel = null;
    this.rightPanel = null;

    this.outline = scene.add.graphics().setDepth(UI_DEPTH - 200);
    this.onUse = null; // the scene says what clicking the door or dresser does
    this.onRestyle = null; // ...and how to redraw the walls and floors
    this.onLayout = null; // ...and what to do when a room is put up, moved or packed away
    this.pendingFloor = null; // flooring waiting for you to click a room
    this.hint = pinToScreen(scene.add.text(240, 266, '', { ...TEXT, fontSize: '10px', color: '#ffe3a0', backgroundColor: '#1c1822', padding: { x: 4, y: 2 } }).setOrigin(0.5, 1).setDepth(UI_DEPTH).setVisible(false));
    this.addAll();

    // Click on empty space = let go of whatever is selected. With flooring
    // picked, clicking a room lays it there instead. Dragging empty space looks around a home that's
    // bigger than the screen (the arrow keys and the Map button do too, see
    // HomeScene).
    const onUI = (over) => over.some((o) => o.scrollFactorX === 0); // the panels and buttons
    scene.input.on('pointerdown', (pointer, over) => {
      if (!this.mode || onUI(over) || over.length > 0) return;
      const cam = scene.cameras.main;
      this.press = { x: pointer.x, y: pointer.y, sx: cam.scrollX, sy: cam.scrollY, panned: false };
    });
    scene.input.on('pointermove', (pointer) => {
      if (!this.mode) return;
      const press = this.press;
      if (press && pointer.isDown && !scene.fitsScreen) {
        const dx = pointer.x - press.x;
        const dy = pointer.y - press.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) {
          if (!press.panned) scene.lookingAround = true;
          press.panned = true;
        }
        if (press.panned) {
          const cam = scene.cameras.main;
          cam.stopFollow();
          cam.setScroll(press.sx - dx / cam.zoom, press.sy - dy / cam.zoom);
        }
      }
    });
    scene.input.on('pointerup', (pointer) => {
      const press = this.press;
      this.press = null;
      if (!this.mode || !press || press.panned) return;
      const { x, y } = this.worldPoint(pointer);
      if (this.pendingFloor) this.layFloor(roomAt(x, y));
      else this.select(null);
    });
    scene.input.on('wheel', (pointer, over, dx, dy) => {
      if (!this.mode || onUI(over) || scene.fitsScreen) return;
      const cam = scene.cameras.main;
      scene.lookingAround = true;
      cam.stopFollow();
      cam.setScroll(cam.scrollX + dx * 0.4, cam.scrollY + dy * 0.4);
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

  // Where a pointer is in the house (the world camera may be zoomed out).
  worldPoint(pointer) {
    return this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  }

  // Make pictures for everything placed in the home.
  addAll() {
    for (const data of gameState.placed) if (isDecor(data.id) || data.fixed) this.add(data);
  }

  // After the layout changed: take down pictures of things that are gone (stairs
  // the game took away) and put up the ones that are new or moved.
  refreshObjects() {
    const live = new Set(gameState.placed.map((p) => p.uid));
    for (const [uid, obj] of [...this.objects]) {
      if (!live.has(uid) || obj.data.auto) {
        if (this.selected === obj) this.select(null);
        obj.sprite.destroy();
        obj.shadow?.destroy();
        this.objects.delete(uid);
      }
    }
    for (const data of gameState.placed) if (!this.objects.has(data.uid) && (isDecor(data.id) || data.fixed)) this.add(data);
    this.sortDepths();
  }

  // After rooms move: anything left without a floor or wall under it goes
  // back to "Your things" (windows too). The door and dresser never leave:
  // they move to the nearest wall or floor instead. Returns how many things
  // were put away.
  reconcile() {
    let stored = 0;
    for (const obj of [...this.objects.values()]) {
      const { data } = obj;
      const pos = this.clampSpot(obj, data.x, data.y);
      const fits = pos && Math.abs(Math.round(pos.x) - data.x) <= 1 && Math.abs(Math.round(pos.y) - data.y) <= 1;
      if (fits || (data.fixed && data.id !== 'window')) {
        this.place(obj, data.x, data.y);
        this.save(obj);
      } else {
        this.takeAway(obj);
        stored++;
      }
    }
    this.sortDepths();
    this.clearOfStairs();
    if (this.leftPanel) this.buildLeftPanel();
    return stored;
  }

  // The dresser comes with the home and is never put away, so if the game
  // puts stairs where it stands, slide it to the nearest free spot.
  clearOfStairs() {
    const stairs = [...this.objects.values()].filter((o) => isStairs(o.data.id) && o.box);
    if (!stairs.length) return;
    const blocked = (o) => {
      const b = footprintAt(o.data.x, o.data.y, ...this.size(o), o.drop);
      return stairs.some((st) => b.i0 < st.box.i1 && st.box.i0 < b.i1 && b.j0 < st.box.j1 && st.box.j0 < b.j1);
    };
    for (const o of this.objects.values()) {
      if (o.data.id !== 'dresser' || !blocked(o)) continue;
      const { x, y } = o.data;
      search: for (let r = 6; r <= 160; r += 6) {
        for (const [dx, dy] of [[r, 0], [-r, 0], [0, r / 2], [0, -r / 2], [r, r / 2], [-r, r / 2], [r, -r / 2], [-r, -r / 2]]) {
          this.place(o, x + dx, y + dy);
          if (!blocked(o)) break search;
        }
        this.place(o, x, y);
      }
      this.save(o);
    }
  }

  // Set a thing's picture from its colors, flip and (for wall things) which wall it's on.
  refreshPicture(obj) {
    const { data, sprite } = obj;
    const base = recolorKey(this.scene, data.id, data.c1, data.c2, this.pictureOf(data));
    if (obj.wall && !obj.upright) {
      sprite.setTexture(wallTexture(this.scene, base, obj.scale, obj.side || -1, data.flip));
    } else {
      sprite.setTexture(base);
      sprite.setFlipX(data.flip);
    }
  }

  // The unpainted picture of a placed thing (the door's depends on its style).
  pictureOf(data) {
    return data.id === 'door' ? doorTexture(gameState.homeStyle.doorStyle) : textureOf(data.id);
  }

  // Make the picture for one placed thing.
  add(data) {
    const scene = this.scene;
    const wall = isWallItem(data.id);
    const footprint = wall ? null : FOOTPRINT[data.id];
    const scale = footprint ? 1 : decorScale(data.id); // 3D pictures are drawn at room size already
    const sprite = scene.add.image(data.x, data.y, recolorKey(scene, data.id, data.c1, data.c2, this.pictureOf(data)));
    sprite.setOrigin(0.5, wall ? 0.5 : 1);
    if (!wall) sprite.setScale(scale);
    // hanging plants hang straight down from a hook instead of lying flat on the wall
    const upright = wall && !!WALL_ART[data.id]?.upright;
    const obj = { data, sprite, shadow: null, wall, upright, footprint, scale, side: wall ? clampToWall(data.x, data.y, 0, 0)?.side ?? -1 : 0, flat: FLAT.has(data.id), drop: 0 };
    this.refreshPicture(obj);
    // (3D pictures have their shadow drawn in; anything else gets a soft round one)
    obj.shadow = wall || footprint ? null : scene.add.ellipse(data.x, data.y, sprite.displayWidth * 0.8, 6 + sprite.displayWidth * 0.12, 0x0d0a12, 0.3);

    if (data.auto) {
      // stairs the game put between rooms: locked (the floor plan lets you swap their kind)
      this.objects.set(data.uid, obj);
      this.place(obj, data.x, data.y);
      return obj;
    }
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
    const dragging = () => this.mode;
    sprite.on('drag', (pointer, x, y) => dragging() && this.moveTo(obj, x, y));
    // the paint panel steps aside while you drag, so it never covers where you're putting things
    sprite.on('dragstart', () => dragging() && this.rightPanel?.setVisible(false));
    sprite.on('dragend', () => {
      if (!dragging()) return;
      this.save(obj);
      this.rightPanel?.setVisible(true);
    });

    this.objects.set(data.uid, obj);
    this.place(obj, data.x, data.y);
    return obj;
  }

  // The nearest spot to (x, y) a thing can be: on a floor, or on a wall
  // (with which wall it's on). null if there's nowhere it fits.
  clampSpot(obj, x, y) {
    const { sprite } = obj;
    // (a wall picture's slanted copy is half its width taller than the picture itself)
    if (obj.upright) return clampToWall(x, y, sprite.displayWidth, sprite.displayHeight);
    if (obj.wall) return clampToWall(x, y, sprite.displayWidth, sprite.displayHeight - sprite.displayWidth / 2);
    // stairs may stand across the join between two rooms
    if (isStairs(obj.data.id)) return clampFootprint(x, y, ...this.size(obj), 1, { span: true, low: STAIRS[obj.data.id].spiral ? null : obj.data.flip ? 'j' : 'i' });
    return clampFootprint(x, y, ...this.size(obj));
  }

  // The stairs under floor spot (i, j), if any: { obj, id, p (0 bottom .. 1 top), height (pixels up the steps), elev (how high she stands in the home) }.
  // (Pieces' footprints are worked out by sortDepths.)
  stairsAt(i, j) {
    let best = null;
    for (const obj of this.objects.values()) {
      const { id, flip } = obj.data;
      if (!isStairs(id) || !obj.box) continue;
      const p = stairProgress(id, Boolean(flip), obj.box, i, j);
      if (p === null) continue;
      const height = stairHeight(id, p);
      const elev = height - obj.drop; // how high she stands: the floor under the foot of the stairs, plus the steps
      if (!best || elev > best.elev) best = { obj, id, p, height, elev };
    }
    return best;
  }

  // Move a thing to (x, y), keeping it inside the room (on the floor or on a wall).
  place(obj, x, y) {
    const { sprite, shadow, data } = obj;
    const pos = this.clampSpot(obj, x, y);
    if (!pos) return;
    if (!obj.wall) obj.drop = pos.drop; // how far down that room's floor is
    data.x = Math.round(pos.x);
    data.y = Math.round(pos.y);
    sprite.setPosition(data.x, data.y);
    if (obj.wall) sprite.setDepth(2);
    else this.sortDepths();
    if (obj.wall) {
      // lie flat along whichever wall it's on
      if (!obj.upright && obj.side !== pos.side) {
        obj.side = pos.side;
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
    const all = [...this.objects.values()].filter((o) => !o.wall);
    for (const o of all) {
      o.box = footprintAt(o.data.x, o.data.y, ...this.size(o), o.drop);
      o.bounds = o.sprite.getBounds();
    }
    // rugs lie under everything, bigger ones first
    all.filter((o) => o.flat).sort((p, q) => q.bounds.width - p.bounds.width).forEach((o, n) => o.sprite.setDepth(4 + n * 0.01));
    const things = all.filter((o) => !o.flat);
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

  // The depth your pal needs to stand at floor spot (i, j) between the
  // furniture: in front of things she's past, behind things nearer the front.
  playerDepth(i, j, bounds) {
    let low = -Infinity;
    let high = Infinity;
    for (const o of this.objects.values()) {
      if (o.wall || o.flat || !o.box || !Phaser.Geom.Rectangle.Overlaps(bounds, o.bounds)) continue;
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
    this.takeAway(obj);
    this.sortDepths();
    this.buildLeftPanel();
  }

  // Take a thing out of the room and back to "Your things".
  takeAway(obj) {
    if (this.selected === obj) this.select(null);
    obj.sprite.destroy();
    obj.shadow?.destroy();
    this.objects.delete(obj.data.uid);
    if (obj.data.id === 'window') gameState.storeWindow(obj.data.uid);
    else gameState.removePlaced(obj.data.uid);
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
    this.setPendingFloor(null);
    this.press = null;
    if (on) {
      this.buildLeftPanel();
    } else {
      this.select(null);
      this.leftPanel?.destroy();
      this.leftPanel = null;
    }
  }

  // A message along the bottom of the screen (null hides it).
  setHint(text) {
    this.hint.setText(text ?? '').setVisible(Boolean(text));
  }

  // The panel's title. Click it (or the arrow) to fold the panel up (the front door sits behind it).
  addTitle(root, width) {
    const scene = this.scene;
    const title = scene.add.text(width / 2, PAD - 1, `Your things ${this.folded ? '▼' : '▲'}`, { ...TEXT, color: '#f2ead8' }).setOrigin(0.5, 0);
    title.setPadding(4, 2).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      this.folded = !this.folded;
      this.buildLeftPanel();
    });
    root.add(title);
  }

  // The things you own that aren't in the room yet: [[id, how many], ...]
  unplaced() {
    const counts = new Map();
    for (const id of gameState.items) if (isDecor(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
    const things = [...counts].map(([id, n]) => [id, n - gameState.countPlaced(id)]).filter(([, n]) => n > 0);
    if (gameState.storedWindows > 0) things.push(['window', gameState.storedWindows]); // windows you've taken down
    return [...things, ...this.styles().map((id) => [id, 0])];
  }

  // Wallpaper, flooring and doors you own, plus the ones your home started
  // with (so you can always change back), once you own any of that kind.
  styles() {
    const owned = [...new Set(gameState.items.filter((id) => isHomeStyle(id)))];
    const list = [];
    for (const [all, starters] of [
      [WALLPAPERS, [DEFAULT_WALLPAPER]],
      [FLOORS, [...new Set(Object.values(DEFAULT_FLOORS))]],
      [DOORS, [DEFAULT_DOOR]],
    ]) {
      const mine = owned.filter((id) => all[id] && !starters.includes(id));
      if (mine.length) list.push(...starters, ...mine);
    }
    return list;
  }

  // Is this wallpaper / flooring / door up right now? (Flooring: in any room.)
  styleInUse(id) {
    const style = gameState.homeStyle;
    if (WALLPAPERS[id]) return (style.wallpaper ?? DEFAULT_WALLPAPER) === id;
    if (DOORS[id]) return (style.doorStyle ?? DEFAULT_DOOR) === id;
    return currentRooms().some((r) => (style.floors[r.key] ?? defaultFloor(r.key)) === id);
  }

  // Clicked a wallpaper, flooring or door in "Your things".
  useStyle(id) {
    const saved = (starter) => (id === starter ? null : id); // starters are saved as null
    if (WALLPAPERS[id]) {
      gameState.setWallpaper(saved(DEFAULT_WALLPAPER));
      this.onRestyle?.();
      this.buildLeftPanel();
    } else if (DOORS[id]) {
      gameState.setDoorStyle(saved(DEFAULT_DOOR));
      const door = [...this.objects.values()].find((o) => o.data.id === 'door');
      if (door) {
        // a new door starts out in its own colors
        Object.assign(door.data, { c1: null, c2: null });
        gameState.updatePlaced(door.data.uid, { c1: null, c2: null });
        this.refreshPicture(door);
        this.place(door, door.data.x, door.data.y);
        if (this.selected === door) this.buildRightPanel();
      }
      this.buildLeftPanel();
    } else if (FLOORS[id]) {
      this.select(null);
      this.setPendingFloor(this.pendingFloor === id ? null : id);
    }
  }

  setPendingFloor(id) {
    if (!id && !this.pendingFloor) return;
    this.pendingFloor = id;
    this.setHint(id ? `Click a room to lay ${itemName(id)}   Esc: cancel` : null);
    if (this.leftPanel) this.buildLeftPanel();
  }

  // Lay the picked flooring in a room (a room key from src/world/IsoRoom.js; null = missed).
  layFloor(room) {
    const id = this.pendingFloor;
    if (!id || !room) return;
    gameState.setFloor(room, id === defaultFloor(room) ? null : id);
    this.onRestyle?.();
    this.setPendingFloor(null);
  }

  // Put a new thing in the middle of what you're looking at and pick it up.
  put(id) {
    const wall = isWallItem(id);
    const view = this.scene.cameras.main.worldView;
    const [x, y] = wall ? [view.centerX - 40, view.centerY - 55] : [view.centerX, view.centerY + 30];
    const data = id === 'window' ? gameState.placeWindow(x, y) : gameState.placeItem(id, x, y);
    if (!data) return;
    const obj = this.add(data);
    this.save(obj); // (it was snapped onto a floor or wall)
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
    if (this.folded) {
      root.add(addPanel(scene, 0, 0, width, PAD * 2 + 12, 'panel-moss').setInteractive());
      this.addTitle(root, width);
      this.leftPanel = pinToScreen(root);
      return;
    }
    const panel = addPanel(scene, 0, 0, width, height, 'panel-moss').setInteractive();
    root.add(panel);
    this.addTitle(root, width);

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
      const style = isHomeStyle(id); // wallpaper, flooring or a door
      const rest = style && this.pendingFloor === id ? [2, SELECT_COLOR] : [1, 0x1c1822];
      const bg = scene.add.rectangle(x, y, TILE, TILE, style ? 0x2a2230 : 0x1c2a22, 0.6).setOrigin(0, 0).setStrokeStyle(...rest);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        bg.setStrokeStyle(2, SELECT_COLOR);
        footer.setText(itemName(id));
        fitText(footer, width - PAD * 2);
      });
      bg.on('pointerout', () => {
        bg.setStrokeStyle(...rest);
        footer.setText(hint);
      });
      bg.on('pointerup', () => (style ? this.useStyle(id) : this.put(id)));
      const key = FIXTURE_ART[id] ?? itemTexture(scene, id);
      const icon = scene.add.image(x + TILE / 2, y + TILE / 2, key ?? 'coin');
      if (FIXTURE_ART[id]) icon.setScale(Math.min(1, (TILE - 4) / Math.max(icon.width, icon.height))); // shrink the big window picture to fit
      root.add([bg, icon]);
      if (style && this.styleInUse(id)) {
        root.add(scene.add.text(x + TILE - 1, y + TILE, '✓', { ...TEXT, fontSize: '10px', color: '#a8e08a', stroke: '#1c1822', strokeThickness: 2 }).setOrigin(1, 1)); // up right now
      } else if (n > 1) {
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
    this.leftPanel = pinToScreen(root);
  }

  // The panel for the selected thing: Flip, Store and paint swatches. It's
  // small, sits in the top right corner, and folds up when you click its title
  // (it also hides while you drag something).
  buildRightPanel() {
    const scene = this.scene;
    this.rightPanel?.destroy();
    this.rightPanel = null;
    const obj = this.selected;
    if (!obj) return;

    const groups = colorGroups(scene, obj.data.id, this.pictureOf(obj.data));
    const perRow = 7;
    const swatchW = perRow * (SWATCH + 2) - 2;
    const width = swatchW + PAD * 2;
    const swatchRows = Math.ceil(HOME_SWATCHES.length / perRow);
    const swatchBlock = swatchRows * (SWATCH + 2) + 12; // label + swatches
    const full = PAD + 14 + 20 + groups * swatchBlock + PAD - 4 + (groups ? 0 : 12);
    const height = this.rightFolded ? PAD * 2 + 10 : full;
    const root = scene.add.container(480 - 4 - width, 34).setDepth(UI_DEPTH);
    root.add(addPanel(scene, 0, 0, width, height, 'panel-moss').setInteractive());
    const name = scene.add.text(width / 2, PAD - 1, `${itemName(obj.data.id)} ${this.rightFolded ? '▼' : '▲'}`, { ...TEXT, color: '#ffe3a0' }).setOrigin(0.5, 0);
    fitText(name, width - PAD * 2);
    name.setPadding(2, 2).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      this.rightFolded = !this.rightFolded;
      this.buildRightPanel();
    });
    root.add(name);
    this.rightPanel = root;
    if (this.rightFolded) {
      pinToScreen(root);
      return;
    }

    const half = (width - PAD * 2) / 2;
    if (obj.data.fixed && obj.data.id !== 'window') {
      // the door and dresser can be moved, flipped and painted, but not stored
      root.add(woodButton(scene, 'Flip', width / 2, PAD + 22, () => this.flip(), { width: width - PAD * 2, height: 16 }));
    } else {
      root.add(woodButton(scene, 'Flip', PAD + half / 2, PAD + 22, () => this.flip(), { width: half - 2, height: 16 }));
      root.add(woodButton(scene, 'Store', PAD + half * 1.5, PAD + 22, () => this.store(), { width: half - 2, height: 16 }));
    }

    // paint swatches for each color family
    let y = PAD + 14 + 20;
    if (!groups) root.add(scene.add.text(width / 2, y, 'Drag to move', { ...TEXT, fontSize: '10px', color: '#f2ead8' }).setOrigin(0.5, 0));
    for (let g = 0; g < groups; g++) {
      const which = g === 0 ? 'c1' : 'c2';
      root.add(scene.add.text(PAD, y, slotName(obj.data.id, g), { ...TEXT, fontSize: '10px', color: '#f2ead8' }));
      HOME_SWATCHES.forEach((color, i) => {
        const sx = PAD + (i % perRow) * (SWATCH + 2);
        const sy = y + 11 + Math.floor(i / perRow) * (SWATCH + 2);
        const on = obj.data[which] === color;
        const fill = color ?? 0x2a1f1c;
        const box = scene.add.rectangle(sx, sy, SWATCH, SWATCH, fill).setOrigin(0, 0).setStrokeStyle(on ? 2 : 1, on ? SELECT_COLOR : 0x1c1822);
        box.setInteractive({ useHandCursor: true }).on('pointerup', () => this.paint(which, color));
        root.add(box);
        if (color === null) root.add(scene.add.text(sx + SWATCH / 2, sy + SWATCH / 2, '×', { ...TEXT, fontSize: '10px', color: '#c9bba0' }).setOrigin(0.5)); // "original"
      });
      y += swatchBlock;
    }
    pinToScreen(root);
  }

  destroy() {
    this.hint.destroy();
    this.leftPanel?.destroy();
    this.rightPanel?.destroy();
    this.outline.destroy();
  }
}
