import Dialog, { TEXT } from './Dialog.js';
import { PANEL_MARGIN } from './Panel.js';
import { LAYOUTS, ROOM_KINDS, roomLabel } from '../data/expansions.js';

// A look at a home layout before you buy it: a little top-down plan of its
// rooms (the living room in the middle), what it is, and what it costs.
// Used by the Build counter in src/scenes/ShopScene.js.
//
//   new LayoutPreview(scene, { layoutId, owned, costText, onBuy, onClose });
//
// The plan is drawn like the floor plan you build with (src/ui/FloorPlan.js):
// i runs to the right and j runs down.

const WIDTH = 236;
const PAD = PANEL_MARGIN + 8;
const PLAN = { x: PAD, y: 24, w: WIDTH - PAD * 2, h: 96 };

export default class LayoutPreview extends Dialog {
  constructor(scene, { layoutId, owned = false, costText = '', onBuy, onClose }) {
    const layout = LAYOUTS[layoutId];
    const desc = scene.add.text(PAD, PLAN.y + PLAN.h + 8, layout.desc, { ...TEXT, color: '#f2ead8', align: 'center', lineSpacing: 1, wordWrap: { width: WIDTH - PAD * 2 } });
    desc.x = Math.round((WIDTH - desc.width) / 2);
    const buttonsY = Math.ceil(desc.y + desc.height) + 20;
    super(scene, { title: layout.name, width: WIDTH, height: buttonsY + 12 + PAD, onClose });

    // the plan: every room as a colored block with its name
    const rooms = [{ i0: 0, j0: 0, i1: 64, j1: 64, name: 'Living room', color: 0x6e9a63 }];
    for (const r of layout.rooms) {
      const [w, h] = ROOM_KINDS[r.kind].size;
      rooms.push({ i0: r.at.i, j0: r.at.j, i1: r.at.i + w, j1: r.at.j + h, name: roomLabel(layoutId, r.uid, r.kind), color: ROOM_KINDS[r.kind].open ? 0x5a9a6a : 0x8a7a5a });
    }
    const minI = Math.min(...rooms.map((r) => r.i0));
    const maxI = Math.max(...rooms.map((r) => r.i1));
    const minJ = Math.min(...rooms.map((r) => r.j0));
    const maxJ = Math.max(...rooms.map((r) => r.j1));
    const u = Math.min(2.2, (PLAN.w - 8) / (maxI - minI), (PLAN.h - 8) / (maxJ - minJ));
    const ox = Math.round(PLAN.x + (PLAN.w - (maxI - minI) * u) / 2);
    const oy = Math.round(PLAN.y + (PLAN.h - (maxJ - minJ) * u) / 2);
    const g = scene.add.graphics();
    g.fillStyle(0x16232f, 1).fillRect(PLAN.x, PLAN.y, PLAN.w, PLAN.h);
    g.lineStyle(1, 0x1c1822, 1).strokeRect(PLAN.x + 0.5, PLAN.y + 0.5, PLAN.w - 1, PLAN.h - 1);
    this.add(g);
    for (const r of rooms) {
      const x0 = Math.round(ox + (r.i0 - minI) * u);
      const y0 = Math.round(oy + (r.j0 - minJ) * u);
      const w = Math.round(ox + (r.i1 - minI) * u) - x0;
      const h = Math.round(oy + (r.j1 - minJ) * u) - y0;
      g.fillStyle(r.color, 1).fillRect(x0, y0, w, h);
      g.lineStyle(1, 0x1c1822, 1).strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
      const label = scene.add.text(x0 + w / 2, y0 + h / 2, r.name, { ...TEXT, color: '#1c1822', align: 'center', wordWrap: { width: Math.max(10, w - 2) } }).setOrigin(0.5);
      if (label.height <= h) this.add(label);
      else label.destroy();
    }
    this.add(desc);
    if (owned) {
      this.addButton('You have it', WIDTH / 2 - 40, buttonsY, () => this.close());
      this.addButton('Back', WIDTH / 2 + 50, buttonsY, () => this.close());
    } else {
      this.addButton(costText ? `Buy: ${costText}` : 'Get it', WIDTH / 2 - 46, buttonsY, () => {
        this.close();
        onBuy?.();
      });
      this.addButton('Back', WIDTH / 2 + 66, buttonsY, () => this.close());
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
