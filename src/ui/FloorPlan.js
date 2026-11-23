import { gameState } from '../state/gameState.js';
import { LAYOUTS, ROOM_KINDS, roomLabel } from '../data/expansions.js';
import { currentRooms, checkRoom, joinKind } from '../world/IsoRoom.js';
import { addPanel } from './Panel.js';
import { TEXT, UI_DEPTH, woodButton, pinToScreen, showToast } from './Dialog.js';
import ConfirmDialog from './ConfirmDialog.js';
import { fitText } from './MenuList.js';

// The floor plan: a flat, top-down map of your rooms where you build your
// home (the Build button, or the R key). Back at the cozy view, nothing
// changes until you've put a room down.
//
//   - drag any room (except the living room, which never moves). A green
//     outline means it fits there, red means it doesn't, and the little
//     message says why: rooms can't overlap, each needs a doorway (12 or more
//     of a shared wall) to another room, and a raised room (loft, attic)
//     has to go above or to the left of the room it opens onto, so stairs can
//     climb up to it. (The rules live in checkRoom, src/world/IsoRoom.js.)
//   - stairs are added for you where rooms at different heights join
//     (src/world/AutoStairs.js). Click the little stairs to swap Long and Spiral.
//   - "Layouts" switches to another layout you own (buy more at Timber &
//     Twig's Build counter). "Reset rooms" puts the layout's rooms back.
//   - furniture is never deleted: whatever loses its floor goes back to
//     "Your things".
//
// In the plan, i runs to the right and j runs down. The living room is in
// the middle; "behind" in the cozy view means up and to the left here.

const AREA = { x: 8, y: 36, w: 464, h: 184 }; // where the plan is drawn
const PAD_UNITS = 16; // empty space around the rooms, so you can drag them out
const GREEN = 0x59c46a;
const RED = 0xd9534f;
const DEPTH = UI_DEPTH - 10; // over the home and its HUD, under dialogs and toasts

export default class FloorPlan {
  constructor(scene) {
    this.scene = scene;
    this.root = null;
    this.drag = null;
    scene.input.on('pointermove', (pointer) => this.root && this.drag && this.onMove(pointer));
    scene.input.on('pointerup', () => this.root && this.drag && this.onDrop());
  }

  get open() {
    return Boolean(this.root);
  }

  toggle() {
    if (this.open) this.close();
    else this.show();
  }

  show() {
    if (this.root) return;
    const scene = this.scene;
    if (scene.decorator.mode) scene.toggleDecorating();
    scene.showButtons(false);
    const root = scene.add.container(0, 0).setDepth(DEPTH);
    // a backdrop that catches clicks, so nothing underneath is touched
    root.add(scene.add.rectangle(0, 0, 480, 270, 0x16232f).setOrigin(0, 0).setInteractive());
    this.root = root;
    this.title = scene.add.text(10, 11, '', { ...TEXT, color: '#f2ead8' });
    this.hint = scene.add.text(240, 224, '', { ...TEXT, color: '#c9bba0', align: 'center', wordWrap: { width: 460 }, lineSpacing: 1 }).setOrigin(0.5, 0);
    root.add([this.title, this.hint]);
    root.add(woodButton(scene, 'Back to home', 416, 17, () => this.close(), { width: 100, height: 20 }));
    root.add(woodButton(scene, 'Layouts', 52, 258, () => this.openLayouts(), { width: 80, height: 18 }));
    root.add(woodButton(scene, 'Reset rooms', 148, 258, () => this.confirmLayout(gameState.layoutId, 'Reset rooms?'), { width: 92, height: 18 }));
    this.board = scene.add.container(0, 0);
    root.add(this.board);
    pinToScreen(root);
    this.rebuild();
  }

  close() {
    if (!this.root) return;
    this.drag = null;
    this.menu?.destroy();
    this.menu = null;
    this.root.destroy();
    this.root = null;
    this.scene.showButtons(true);
  }

  // ---------- drawing the plan ----------

  // Plan coordinates: where a floor spot (i, j) is on the screen, and back.
  toPx(i, j) {
    return { x: Math.round(this.ox + (i - this.minI + PAD_UNITS) * this.u), y: Math.round(this.oy + (j - this.minJ + PAD_UNITS) * this.u) };
  }

  // A patch of floor as a rectangle in whole screen pixels (so edges stay crisp).
  rectPx(i0, j0, i1, j1) {
    const a = this.toPx(i0, j0);
    const b = this.toPx(i1, j1);
    return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
  }

  toUnits(x, y) {
    return { i: (x - this.ox) / this.u + this.minI - PAD_UNITS, j: (y - this.oy) / this.u + this.minJ - PAD_UNITS };
  }

  roomColor(r) {
    if (r.key === 'main') return 0x6e9a63;
    if (r.open) return 0x5a9a6a;
    if (r.drop < 0) return 0xd5c07a;
    if (r.drop > 0) return 0x4f6a52;
    return 0x8a7a5a;
  }

  // Draw everything that depends on where the rooms are.
  rebuild() {
    const scene = this.scene;
    this.board.removeAll(true);
    this.title.setText(`Floor plan: ${LAYOUTS[gameState.layoutId]?.name ?? 'Your home'}`);
    this.setHint(null);
    const rooms = currentRooms();
    const minI = Math.min(...rooms.map((r) => r.i0));
    const maxI = Math.max(...rooms.map((r) => r.i1));
    const minJ = Math.min(...rooms.map((r) => r.j0));
    const maxJ = Math.max(...rooms.map((r) => r.j1));
    const spanI = maxI - minI + 2 * PAD_UNITS;
    const spanJ = maxJ - minJ + 2 * PAD_UNITS;
    this.u = Math.min(4, AREA.w / spanI, AREA.h / spanJ); // screen pixels per floor unit
    this.minI = minI;
    this.minJ = minJ;
    this.ox = Math.floor(AREA.x + (AREA.w - spanI * this.u) / 2);
    this.oy = Math.floor(AREA.y + (AREA.h - spanJ * this.u) / 2);
    const g = scene.add.graphics();
    this.board.add(g);
    // a soft grid, every 8 floor units
    g.lineStyle(1, 0xffffff, 0.06);
    for (let i = Math.ceil((minI - PAD_UNITS) / 8) * 8; i <= maxI + PAD_UNITS; i += 8) {
      const a = this.toPx(i, minJ - PAD_UNITS);
      const b = this.toPx(i, maxJ + PAD_UNITS);
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
    for (let j = Math.ceil((minJ - PAD_UNITS) / 8) * 8; j <= maxJ + PAD_UNITS; j += 8) {
      const a = this.toPx(minI - PAD_UNITS, j);
      const b = this.toPx(maxI + PAD_UNITS, j);
      g.lineBetween(a.x, a.y, b.x, b.y);
    }

    for (const r of rooms) {
      const { x: px, y: py, w, h } = this.rectPx(r.i0, r.j0, r.i1, r.j1);
      const p = { x: px, y: py };
      g.fillStyle(this.roomColor(r), 1).fillRect(p.x, p.y, w, h);
      g.lineStyle(1, 0x1c1822, 1).strokeRect(p.x + 0.5, p.y + 0.5, w - 1, h - 1);
      const name = r.key === 'main' ? 'Living room' : roomLabel(gameState.layoutId, r.key, r.kind);
      const label = scene.add.text(p.x + w / 2, p.y + h / 2, `${r.drop < 0 ? '▲ ' : ''}${name}${r.key === 'main' ? '\n(stays put)' : ''}`, { ...TEXT, color: '#1c1822', align: 'center', lineSpacing: 1 }).setOrigin(0.5);
      label.setWordWrapWidth(Math.max(10, w - 4), true);
      if (label.height > h - 2) fitText(label, w - 4);
      this.board.add(label);
      if (r.key !== 'main') {
        const zone = scene.add.zone(p.x, p.y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', (pointer) => this.startDrag(r, pointer));
        zone.on('pointerover', () => !this.drag && this.setHint(`${name}: drag it somewhere new`));
        zone.on('pointerout', () => !this.drag && this.setHint(null));
        this.board.add(zone);
      }
    }

    // the stairs the game put where rooms at different heights join
    const spiral = (uid) => gameState.data.home.stairKinds[uid] === 'stairs-spiral';
    for (let n = 0; n < rooms.length; n++) {
      for (let m = n + 1; m < rooms.length; m++) {
        const join = joinKind(rooms[n], rooms[m]);
        if (join?.kind !== 'stairs' && join?.kind !== 'steps') continue;
        const { hi, lo, along } = join;
        const uid = `auto-${hi.key}-${lo.key}`;
        const mid = along === 'i' ? (Math.max(hi.j0, lo.j0) + Math.min(hi.j1, lo.j1)) / 2 : (Math.max(hi.i0, lo.i0) + Math.min(hi.i1, lo.i1)) / 2;
        const at = along === 'i' ? this.toPx(lo.i0, mid) : this.toPx(mid, lo.j0);
        const tall = lo.drop - hi.drop > 20;
        g.fillStyle(0x1c1822, 1).fillRect(at.x - 6, at.y - 6, 12, 12);
        g.fillStyle(0xffe3a0, 1).fillRect(at.x - 5, at.y - 5, 10, 10);
        g.fillStyle(0x1c1822, 1);
        for (let k = 0; k < 3; k++) g.fillRect(at.x - 4 + k * 3, at.y + 3 - k * 3, 8 - k * 3, 1);
        if (join.kind === 'stairs' && tall) {
          const hit = scene.add.zone(at.x - 6, at.y - 6, 12, 12).setOrigin(0, 0).setInteractive({ useHandCursor: true });
          hit.on('pointerup', () => this.swapStairs(uid));
          hit.on('pointerover', () => !this.drag && this.setHint(`${spiral(uid) ? 'Spiral' : 'Long'} stairs: click to swap`));
          hit.on('pointerout', () => !this.drag && this.setHint(null));
          this.board.add(hit);
        }
      }
    }
    this.ghost = scene.add.graphics();
    this.board.add(this.ghost);
    pinToScreen(this.board);
  }

  setHint(text) {
    this.hint.setText(text ?? 'Drag a room. Green = it fits, red = it does not. Raised rooms (▲) go above or left of the room they open onto, and stairs are added for you.');
    this.hint.setColor(text ? '#ffe3a0' : '#c9bba0');
  }

  // ---------- moving a room ----------

  startDrag(room, pointer) {
    if (this.drag || this.menu) return;
    const cell = this.toUnits(pointer.x, pointer.y);
    this.drag = { uid: room.key, kind: room.kind, di: cell.i - room.i0, dj: cell.j - room.j0, w: room.i1 - room.i0, h: room.j1 - room.j0, start: { i: room.i0, j: room.j0 }, cand: null };
    this.onMove(pointer);
  }

  onMove(pointer) {
    const d = this.drag;
    const cell = this.toUnits(pointer.x, pointer.y);
    const snap = (n) => 2 * Math.round(n / 2); // (rooms sit on a 2-unit grid)
    const i0 = snap(cell.i - d.di);
    const j0 = snap(cell.j - d.dj);
    const rect = { key: d.uid, kind: d.kind, i0, j0, i1: i0 + d.w, j1: j0 + d.h, drop: ROOM_KINDS[d.kind].drop };
    const result = checkRoom(rect, currentRooms().filter((r) => r.key !== d.uid));
    d.cand = { i0, j0, ...result };
    const r = this.rectPx(i0, j0, i0 + d.w, j0 + d.h);
    const g = this.ghost.clear();
    const color = result.ok ? GREEN : RED;
    g.fillStyle(color, 0.35).fillRect(r.x, r.y, r.w, r.h);
    g.lineStyle(2, color, 1).strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    this.setHint(result.ok ? 'Let go to put it here' : result.why);
  }

  onDrop() {
    const d = this.drag;
    this.drag = null;
    this.ghost.clear();
    const cand = d.cand;
    if (!cand) return;
    if (!cand.ok) {
      this.setHint(null);
      return showToast(this.scene, `Can't go there.\n${cand.why}`);
    }
    if (cand.i0 === d.start.i && cand.j0 === d.start.j) return this.setHint(null);
    gameState.setAddonAt(d.uid, { i: cand.i0, j: cand.j0 });
    this.afterChange('Room moved.');
  }

  // Rooms changed: redraw the home, put away what lost its floor, and say so.
  afterChange(done) {
    const stored = this.scene.relayout();
    this.rebuild();
    if (stored) showToast(this.scene, `${done}\n${stored} thing${stored > 1 ? 's' : ''} went back to Your things.`);
    else showToast(this.scene, done);
  }

  swapStairs(uid) {
    const now = gameState.data.home.stairKinds[uid] === 'stairs-spiral';
    gameState.setStairsKind(uid, now ? 'stairs-long' : 'stairs-spiral');
    this.afterChange(now ? 'Long stairs.' : 'Spiral stairs.');
  }

  // ---------- layouts ----------

  openLayouts() {
    if (this.menu || this.drag) return;
    const scene = this.scene;
    const owned = Object.keys(LAYOUTS).filter((id) => gameState.ownsLayout(id));
    const rowH = 21;
    const w = 190;
    const h = 30 + owned.length * rowH + 30;
    const menu = scene.add.container(Math.round((480 - w) / 2), Math.round((270 - h) / 2)).setDepth(DEPTH + 5);
    menu.add(addPanel(scene, 0, 0, w, h, 'panel-moss').setInteractive());
    menu.add(scene.add.text(w / 2, 11, 'Your layouts', { ...TEXT, color: '#ffe3a0' }).setOrigin(0.5, 0));
    owned.forEach((id, n) => {
      const here = id === gameState.layoutId;
      menu.add(woodButton(scene, `${here ? '✓ ' : ''}${LAYOUTS[id].name}`, w / 2, 36 + n * rowH, () => (here ? this.closeMenu() : this.confirmLayout(id, `Use ${LAYOUTS[id].name}?`)), { width: w - 30, height: 18 }));
    });
    menu.add(woodButton(scene, 'Close', w / 2, h - 18, () => this.closeMenu(), { width: 60, height: 16 }));
    this.menu = pinToScreen(menu);
  }

  closeMenu() {
    this.menu?.destroy();
    this.menu = null;
  }

  confirmLayout(id, title) {
    if (this.drag) return;
    this.closeMenu();
    new ConfirmDialog(this.scene, {
      title,
      message: `Your rooms go to the ${LAYOUTS[id].name} layout. Furniture with no floor left goes back to Your things; nothing is deleted.`,
      yes: 'Do it',
      no: 'Not now',
      onYes: () => {
        gameState.useLayout(id);
        this.afterChange(`${LAYOUTS[id].name} ready!`);
      },
    });
  }

  destroy() {
    this.close();
  }
}
