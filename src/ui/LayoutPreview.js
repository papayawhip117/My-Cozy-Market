import Dialog, { TEXT } from './Dialog.js';
import { PANEL_MARGIN } from './Panel.js';
import { LAYOUTS, ROOM_KINDS } from '../data/expansions.js';
import { FLOORS } from '../data/homeStyles.js';

// A look at a home layout before you buy it: a little picture of the home
// from the same angle as the game (floors, walls and the grass garden),
// what it is, and what it costs.
// Used by the Build counter in src/scenes/ShopScene.js.
//
//   new LayoutPreview(scene, { layoutId, owned, current, costText, onBuy, onUse, onClose });
//   (not owned: a Buy button; owned: a Use button, or "In use" for the one you're in)
//

const WIDTH = 236;
const PAD = PANEL_MARGIN + 8;
const BTN = { width: 98, height: 18 }; // both buttons the same size, side by side
const PLAN = { x: PAD, y: 24, w: WIDTH - PAD * 2, h: 112 };

export default class LayoutPreview extends Dialog {
  constructor(scene, { layoutId, owned = false, current = false, costText = '', onBuy, onUse, onClose }) {
    const layout = LAYOUTS[layoutId];
    const desc = scene.add.text(PAD, PLAN.y + PLAN.h + 8, layout.desc, { ...TEXT, color: '#f2ead8', align: 'center', lineSpacing: 1, wordWrap: { width: WIDTH - PAD * 2 } });
    desc.x = Math.round((WIDTH - desc.width) / 2);
    const buttonsY = Math.ceil(desc.y + desc.height) + 20;
    super(scene, { title: layout.name, width: WIDTH, height: buttonsY + 12 + PAD, onClose });

    // the picture: your home as it will look, in the same angle as the game
    // (floors, and walls along the back edges where no other room is behind)
    const main = layout.main ?? [64, 64];
    const rooms = [{ i0: 0, j0: 0, i1: main[0], j1: main[1], open: false, floor: FLOORS['floor-oak'].a }];
    for (const r of layout.rooms) {
      const kind = ROOM_KINDS[r.kind];
      const [w, h] = kind.size;
      rooms.push({ i0: r.at.i, j0: r.at.j, i1: r.at.i + w, j1: r.at.j + h, open: Boolean(kind.open), floor: (FLOORS[kind.floor] ?? FLOORS['floor-oak']).a });
    }
    const P = (i, j, up = 0) => ({ x: 2 * (i - j), y: i + j - up }); // one unit = 2 pixels across, 1 down
    const inside = (i, j) => rooms.some((r) => i >= r.i0 && i <= r.i1 && j >= r.j0 && j <= r.j1);
    const WALL = 56;
    const pts = rooms.flatMap((r) => [P(r.i0, r.j0, WALL), P(r.i1, r.j0, WALL), P(r.i1, r.j1), P(r.i0, r.j1), P(r.i0, r.j1, WALL)]);
    const minX = Math.min(...pts.map((p) => p.x));
    const maxX = Math.max(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    const maxY = Math.max(...pts.map((p) => p.y));
    const u = Math.min(1.2, (PLAN.w - 12) / (maxX - minX), (PLAN.h - 12) / (maxY - minY));
    const at = (i, j, up = 0) => {
      const p = P(i, j, up);
      return { x: Math.round(PLAN.x + PLAN.w / 2 + (p.x - (minX + maxX) / 2) * u), y: Math.round(PLAN.y + PLAN.h / 2 + (p.y - (minY + maxY) / 2) * u) };
    };
    const g = scene.add.graphics();
    g.fillStyle(0x16232f, 1).fillRect(PLAN.x, PLAN.y, PLAN.w, PLAN.h);
    this.add(g);
    const quad = (a, b, c, d, color) => g.fillStyle(color, 1).fillPoints([a, b, c, d], true);
    const back = [...rooms].sort((p, q) => p.i0 + p.j0 - (q.i0 + q.j0));
    for (const r of back) {
      if (r.open) continue;
      for (let j = r.j0; j < r.j1; j += 4) {
        if (!inside(r.i0 - 1, j + 2)) quad(at(r.i0, j, WALL), at(r.i0, j + 4, WALL), at(r.i0, j + 4), at(r.i0, j), 0x3f5148); // left wall
      }
      for (let i = r.i0; i < r.i1; i += 4) {
        if (!inside(i + 2, r.j0 - 1)) quad(at(i, r.j0, WALL), at(i + 4, r.j0, WALL), at(i + 4, r.j0), at(i, r.j0), 0x4e6458); // right wall
      }
    }
    for (const r of back) {
      quad(at(r.i0, r.j0), at(r.i1, r.j0), at(r.i1, r.j1), at(r.i0, r.j1), r.floor);
      g.lineStyle(1, 0x1c1822, 0.8).strokePoints([at(r.i0, r.j0), at(r.i1, r.j0), at(r.i1, r.j1), at(r.i0, r.j1)], true);
    }
    g.lineStyle(1, 0x1c1822, 1).strokeRect(PLAN.x + 0.5, PLAN.y + 0.5, PLAN.w - 1, PLAN.h - 1);
    this.add(desc);
    if (owned && onUse && !current) {
      this.addButton('Use this layout', WIDTH / 2 - 52, buttonsY, () => {
        this.close();
        onUse();
      }, BTN);
      this.addButton('Back', WIDTH / 2 + 52, buttonsY, () => this.close(), BTN);
    } else if (owned) {
      this.addButton(current ? 'In use' : 'You have it', WIDTH / 2 - 52, buttonsY, () => this.close(), BTN);
      this.addButton('Back', WIDTH / 2 + 52, buttonsY, () => this.close(), BTN);
    } else {
      this.addButton(costText ? `Buy: ${costText}` : 'Get it', WIDTH / 2 - 52, buttonsY, () => {
        this.close();
        onBuy?.();
      }, BTN);
      this.addButton('Back', WIDTH / 2 + 52, buttonsY, () => this.close(), BTN);
    }
    this.keys = scene.input.keyboard;
    this.onEsc = () => this.close();
    this.keys.on('keydown-ESC', this.onEsc);
  }

  close() {
    this.keys?.off('keydown-ESC', this.onEsc);
    super.close();
  }
}
