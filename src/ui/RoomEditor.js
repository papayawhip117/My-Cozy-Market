import { gameState } from '../state/gameState.js';
import { ROOM_SIZE, ROOM_NAMES } from '../data/expansions.js';
import { currentRooms, attachSpots, reachableRooms, roomsTouched, toFloor, fromFloor, roomAt, WALL_H } from '../world/IsoRoom.js';
import { isStairs } from '../data/stairs.js';
import { addPanel, PANEL_MARGIN } from './Panel.js';
import { TEXT, UI_DEPTH, woodButton, pinToScreen, showToast } from './Dialog.js';

// The "Rooms" tab in decorate mode: put up the rooms you bought at Timber &
// Twig, move them to another side of the house, or pack them away.
//
//   - click a packed room in the panel, then click where it should go. It
//     snaps to the nearest spot where it joins the house (a yellow outline
//     shows where). Esc cancels.
//   - click a room that's up (in the panel, or the room itself) to pick it:
//     Move (same as above) or Pack away.
//   - the Top Floor is a room like any other, but its floor is raised, so it
//     draws higher up. Rooms at different heights only connect with stairs
//     from Timber & Twig, placed across the join (Things tab).
//
// Only the living room never moves. Every other room (the entryway and lower
// room too) can be moved or packed away, but you can't take away a room
// that other rooms are only reachable through (including through stairs):
// move those first. Furniture, pictures and windows in a room that moves or
// is packed away go back to "Your things" (HomeDecorator.reconcile), never
// lost. The house shape itself is in src/world/IsoRoom.js.

const PAD = PANEL_MARGIN + 6;
const TILE = 26;
const GAP = 4;
const COLS = 3;
const SELECT_COLOR = 0xffe3a0;

const nameOf = (kind) => ROOM_NAMES[kind] ?? 'Room';

export default class RoomEditor {
  constructor(scene, decorator) {
    this.scene = scene;
    this.decorator = decorator;
    this.moving = null; // { addon, spots, spot } while you're putting a room somewhere
    this.selected = null; // the bought room you picked
    this.panel = null; // the right panel for the picked room
    this.ghost = scene.add.graphics().setDepth(UI_DEPTH - 150); // where the room will go / which room is picked
  }

  // ---------- the left panel ----------

  buildPanel() {
    const scene = this.scene;
    const d = this.decorator;
    const rooms = gameState.addons;
    const width = PAD * 2 + COLS * TILE + (COLS - 1) * GAP;
    const rows = Math.max(1, Math.ceil(rooms.length / COLS));
    const gridTop = PAD + 15;
    const height = d.folded ? PAD * 2 + 12 : gridTop + rows * (TILE + GAP) + 40 + PAD - 4;
    const root = scene.add.container(4, 34).setDepth(UI_DEPTH);
    root.add(addPanel(scene, 0, 0, width, height, 'panel-moss').setInteractive());
    d.addTitle(root, width);
    if (d.folded) return root;

    const footer = scene.add.text(width / 2, height - PAD - 26, '', { ...TEXT, fontSize: '10px', color: '#ffe3a0', align: 'center', lineSpacing: 1 }).setOrigin(0.5, 0);
    const hint = 'Click a room\nto put it up';
    footer.setText(hint);
    root.add(footer);

    rooms.forEach((addon, n) => {
      const x = PAD + (n % COLS) * (TILE + GAP);
      const y = gridTop + Math.floor(n / COLS) * (TILE + GAP);
      const picked = this.selected === addon || this.moving?.addon === addon;
      const rest = picked ? [2, SELECT_COLOR] : [1, 0x1c1822];
      const bg = scene.add.rectangle(x, y, TILE, TILE, addon.at ? 0x1c2a22 : 0x2a2230, 0.6).setOrigin(0, 0).setStrokeStyle(...rest);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        bg.setStrokeStyle(2, SELECT_COLOR);
        footer.setText(`${nameOf(addon.kind)}\n${addon.at ? 'up' : 'packed away'}`);
      });
      bg.on('pointerout', () => {
        bg.setStrokeStyle(...rest);
        footer.setText(hint);
      });
      bg.on('pointerup', () => this.pick(addon));
      root.add([bg, this.icon(addon.kind, x + TILE / 2, y + TILE / 2)]);
      if (addon.at) root.add(scene.add.text(x + TILE - 1, y + TILE, '✓', { ...TEXT, fontSize: '10px', color: '#a8e08a', stroke: '#1c1822', strokeThickness: 2 }).setOrigin(1, 1));
    });
    return root;
  }

  // A tiny room picture: a floor diamond with its two back walls (two stacked for the top floor).
  icon(kind, x, y) {
    const g = this.scene.add.graphics();
    const w = kind === 'small' || kind === 'entry' ? 6 : 9;
    const diamond = (cy, floor) => {
      g.fillStyle(0x3f5148, 1).fillPoints([{ x: x - w, y: cy }, { x, y: cy - w / 2 }, { x, y: cy - w / 2 - 6 }, { x: x - w, y: cy - 6 }], true);
      g.fillStyle(0x45594f, 1).fillPoints([{ x, y: cy - w / 2 }, { x: x + w, y: cy }, { x: x + w, y: cy - 6 }, { x, y: cy - w / 2 - 6 }], true);
      g.fillStyle(floor, 1).fillPoints([{ x, y: cy - w / 2 }, { x: x + w, y: cy }, { x, y: cy + w / 2 }, { x: x - w, y: cy }], true);
    };
    if (kind === 'top') {
      diamond(y + 6, 0x5a3f2e);
      diamond(y - 2, 0x7a5a40);
    } else diamond(y + 3, 0x7a5a40);
    return g;
  }

  // ---------- picking rooms ----------

  // Clicked a room in the panel.
  pick(addon) {
    if (addon.at) this.select(addon);
    else this.startMove(addon);
  }

  // Clicked the house (in world pixels).
  click(x, y) {
    if (this.moving) return this.drop();
    const key = roomAt(x, y);
    const addon = gameState.addons.find((a) => a.uid === key);
    if (addon) this.select(addon);
    else {
      if (key) showToast(this.scene, 'The living room stays put.\nEvery other room can move!');
      this.select(null);
    }
  }

  select(addon) {
    this.selected = addon;
    this.drawGhost();
    this.buildRightPanel();
    this.decorator.buildLeftPanel();
  }

  // The floor rectangle of a room that's up.
  rectOf(addon) {
    return currentRooms().find((r) => r.key === addon.uid) ?? null;
  }

  // Which pairs of rooms do the stairs you've placed join? [[keyA, keyB], ...]
  stairLinks() {
    const links = [];
    for (const obj of this.decorator.objects.values()) {
      if (isStairs(obj.data.id) && obj.box) links.push(...roomsTouched(obj.box));
    }
    return links;
  }

  // Can this room be taken away without cutting other rooms off from the house?
  // (Rooms you can already reach must stay reachable, counting stairs.)
  canLeave(addon) {
    if (!addon.at) return true;
    const all = currentRooms();
    const links = this.stairLinks();
    const before = reachableRooms(all, links);
    const after = reachableRooms(all.filter((r) => r.key !== addon.uid), links);
    if ([...before].every((key) => key === addon.uid || after.has(key))) return true;
    showToast(this.scene, 'Other rooms are only reachable\nthrough this one. Move those first!');
    return false;
  }

  // ---------- moving a room ----------

  startMove(addon) {
    if (!this.canLeave(addon)) return;
    const others = currentRooms().filter((r) => r.key !== addon.uid);
    const [wi, wj] = ROOM_SIZE[addon.kind];
    const spots = attachSpots(wi, wj, others, addon.kind);
    if (!spots.length) return showToast(this.scene, "There's no space to join it on");
    this.selected = null;
    this.buildRightPanel();
    this.moving = { addon, spots, spot: null };
    // start where it is now, or else near the middle of the screen
    const view = this.scene.cameras.main.worldView;
    const here = addon.at ? spots.find((s) => s.i0 === addon.at.i && s.j0 === addon.at.j) : null;
    if (here) this.moving.spot = here;
    else this.hover(view.centerX, view.centerY);
    this.drawGhost();
    this.decorator.setHint('Click to put the room here   Esc: cancel');
    this.decorator.buildLeftPanel();
  }

  // The mouse moved (world pixels): snap the room to the nearest spot.
  hover(x, y) {
    if (!this.moving) return;
    const f = toFloor(x, y);
    let best = null;
    let bestD = Infinity;
    for (const s of this.moving.spots) {
      const d = ((s.i0 + s.i1) / 2 - f.i) ** 2 + ((s.j0 + s.j1) / 2 - f.j) ** 2;
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    if (best !== this.moving.spot) {
      this.moving.spot = best;
      this.drawGhost();
    }
  }

  // Put the moving room down where the outline is.
  drop() {
    const { addon, spot } = this.moving;
    const same = addon.at && addon.at.i === spot.i0 && addon.at.j === spot.j0;
    this.clear();
    if (!same) {
      gameState.setAddonAt(addon.uid, { i: spot.i0, j: spot.j0 });
      this.afterChange();
      // a room at a different height than the rooms next to it needs stairs
      if (!reachableRooms(currentRooms(), this.stairLinks()).has(addon.uid)) {
        showToast(this.scene, 'This room is at a different height.\nPut stairs across the join to reach it!');
      }
    }
    this.select(addon);
  }

  // Pack the picked room away (it waits in the Rooms tab).
  packAway(addon) {
    if (!this.canLeave(addon)) return;
    gameState.setAddonAt(addon.uid, null);
    this.select(null);
    this.afterChange('Room packed away.');
  }

  // Redraw the house and put away anything that lost its floor or wall.
  afterChange(done = '') {
    const stored = this.decorator.onLayout?.() ?? 0;
    if (stored) showToast(this.scene, `${done ? `${done}\n` : ''}${stored} thing${stored > 1 ? 's were' : ' was'} in the way,\nso ${stored > 1 ? 'they' : 'it'} went back to Your things.`);
    else if (done) showToast(this.scene, done);
  }

  // ---------- drawing ----------

  // The yellow outline: where the moving room will go, or the picked room.
  drawGhost() {
    const g = this.ghost.clear();
    const r = this.moving?.spot ?? (this.selected?.at ? this.rectOf(this.selected) : null);
    if (!r) return;
    const d = r.drop ?? 0;
    const P = (i, j) => {
      const p = fromFloor(i, j);
      return { x: p.x, y: p.y + d };
    };
    const floor = [P(r.i0, r.j0), P(r.i1, r.j0), P(r.i1, r.j1), P(r.i0, r.j1)];
    if (this.moving) {
      g.fillStyle(SELECT_COLOR, 0.22).fillPoints(floor, true);
      // a hint of its back walls
      const [back, right, , left] = floor;
      g.fillStyle(SELECT_COLOR, 0.1).fillPoints([left, back, { x: back.x, y: back.y - WALL_H / 2 }, { x: left.x, y: left.y - WALL_H / 2 }], true);
      g.fillStyle(SELECT_COLOR, 0.1).fillPoints([back, right, { x: right.x, y: right.y - WALL_H / 2 }, { x: back.x, y: back.y - WALL_H / 2 }], true);
    }
    g.lineStyle(1, SELECT_COLOR, 1).strokePoints(floor, true);
  }

  // The panel for the picked room (top right, where the paint panel goes for furniture).
  buildRightPanel() {
    const scene = this.scene;
    this.panel?.destroy();
    this.panel = null;
    const addon = this.selected;
    if (!addon) return;
    const width = 96;
    const height = PAD * 2 + 12 + 40;
    const root = scene.add.container(480 - 4 - width, 34).setDepth(UI_DEPTH);
    root.add(addPanel(scene, 0, 0, width, height, 'panel-moss').setInteractive());
    root.add(scene.add.text(width / 2, PAD - 1, nameOf(addon.kind), { ...TEXT, color: '#ffe3a0' }).setOrigin(0.5, 0).setPadding(2, 2));
    const button = (label, n, fn) => root.add(woodButton(scene, label, width / 2, PAD + 22 + n * 20, fn, { width: width - PAD * 2, height: 16 }));
    button('Move', 0, () => this.startMove(addon));
    button('Pack away', 1, () => this.packAway(addon));
    this.panel = pinToScreen(root);
  }

  // Stop moving / let go of the picked room.
  clear() {
    const was = this.moving || this.selected;
    this.moving = null;
    this.selected = null;
    this.ghost.clear();
    this.panel?.destroy();
    this.panel = null;
    if (was) this.decorator.setHint(null);
  }

  // Esc: stop moving a room. Returns true if there was one to stop.
  cancel() {
    if (!this.moving) return false;
    this.clear();
    this.decorator.buildLeftPanel();
    return true;
  }

  destroy() {
    this.panel?.destroy();
    this.ghost.destroy();
  }
}
