import { houseBounds, currentRooms, fromFloor } from '../world/IsoRoom.js';
import { addPanel } from './Panel.js';
import { UI_DEPTH, pinToScreen } from './Dialog.js';

// The little overview map of your home (the "Map" button, or the N key).
// It shows every room's floor in the same angle as the home, with your pal
// as a yellow dot and the part of the home you're looking at as a yellow
// box. Click a room (or anywhere on the map) to look over there.
//
//   const map = new HomeMap(scene, (x, y) => scene.lookAt(x, y));
//   map.toggle();   map.refresh();   // after rooms move
//   map.update(player, camera);      // every frame while it's showing
//
// Everything here is pinned to the screen (drawn by the UI camera).

const MAX_W = 130;
const MAX_H = 80;
const PAD = 9; // inside the panel (its vines poke out a little)

export default class HomeMap {
  constructor(scene, onJump) {
    this.scene = scene;
    this.onJump = onJump;
    this.root = null;
  }

  get visible() {
    return Boolean(this.root);
  }

  toggle() {
    if (this.root) this.close();
    else this.open();
  }

  open() {
    this.close();
    const scene = this.scene;
    const b = houseBounds();
    const s = Math.min(0.5, (MAX_W - 2 * PAD) / b.width, (MAX_H - 2 * PAD) / b.height);
    const w = Math.max(50, Math.ceil(b.width * s + 2 * PAD));
    const h = Math.max(36, Math.ceil(b.height * s + 2 * PAD));
    this.b = b;
    this.s = s;
    this.pad = PAD;
    const root = scene.add.container(480 - 4 - w, 270 - 4 - h).setDepth(UI_DEPTH - 1);
    root.add(addPanel(scene, 0, 0, w, h, 'panel-moss').setInteractive({ useHandCursor: true }));
    this.floors = scene.add.graphics();
    this.marks = scene.add.graphics();
    root.add([this.floors, this.marks]);
    root.panel = root.list[0];
    root.panel.on('pointerdown', (pointer) => this.click(pointer));
    this.root = pinToScreen(root);
    this.w = w;
    this.h = h;
    this.drawFloors();
  }

  close() {
    this.root?.destroy();
    this.root = null;
  }

  // The layout changed: draw it again.
  refresh() {
    if (this.root) this.open();
  }

  // Where a world point is on the screen's map, and back.
  toMap(x, y) {
    return { x: this.pad + (x - this.b.x) * this.s, y: this.pad + (y - this.b.y) * this.s };
  }

  drawFloors() {
    const g = this.floors.clear();
    const order = [...currentRooms()].sort((p, q) => p.i0 + p.j0 + p.i1 + p.j1 - (q.i0 + q.j0 + q.i1 + q.j1));
    for (const r of order) {
      const pts = [fromFloor(r.i0, r.j0), fromFloor(r.i1, r.j0), fromFloor(r.i1, r.j1), fromFloor(r.i0, r.j1)].map((p) => this.toMap(p.x, p.y + r.drop));
      const color = r.key === 'main' ? 0x9bc78d : r.drop < 0 ? 0xdcc684 : r.drop > 0 ? 0x587055 : 0x86a47a;
      g.fillStyle(color, 1).fillPoints(pts, true);
      g.lineStyle(1, 0x1c1822, 1).strokePoints(pts, true);
    }
  }

  // Every frame while it's open: your pal and the box for what you're looking at.
  update(player, cam) {
    if (!this.root) return;
    const g = this.marks.clear();
    const v = cam.worldView;
    const a = this.toMap(v.x, v.y);
    const z = this.toMap(v.right, v.bottom);
    const x0 = Math.max(2, a.x);
    const y0 = Math.max(2, a.y);
    const x1 = Math.min(this.w - 2, z.x);
    const y1 = Math.min(this.h - 2, z.y);
    g.lineStyle(1, 0xffe3a0, 1).strokeRect(Math.round(x0), Math.round(y0), Math.max(2, Math.round(x1 - x0)), Math.max(2, Math.round(y1 - y0)));
    const p = this.toMap(player.x, player.y - 8);
    g.fillStyle(0x1c1822, 1).fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 4, 4);
    g.fillStyle(0xffe040, 1).fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
  }

  // Clicked the map: look at that spot in the home.
  click(pointer) {
    const left = this.root.x;
    const top = this.root.y;
    const x = this.b.x + (pointer.x - left - this.pad) / this.s;
    const y = this.b.y + (pointer.y - top - this.pad) / this.s;
    this.onJump(x, y);
  }

  destroy() {
    this.close();
  }
}
