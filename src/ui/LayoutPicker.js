import Dialog, { TEXT } from './Dialog.js';
import { PANEL_MARGIN } from './Panel.js';
import LayoutPreview from './LayoutPreview.js';
import { gameState } from '../state/gameState.js';
import { LAYOUTS } from '../data/expansions.js';

// The Build button at home: pick which of your layouts to live in. Each one
// opens a preview of its rooms with a "Use this layout" button (buy more
// layouts at Timber & Twig's Build counter). Switching never deletes
// furniture: whatever no longer has a floor goes back to "Your things".
//
//   new LayoutPicker(scene, { onUse: (id) => ... });

const WIDTH = 190;
const PAD = PANEL_MARGIN + 8;

export default class LayoutPicker extends Dialog {
  constructor(scene, { onUse }) {
    const owned = Object.keys(LAYOUTS).filter((id) => gameState.ownsLayout(id));
    const rowH = 22;
    super(scene, { title: 'Your layouts', width: WIDTH, height: 30 + owned.length * rowH + 34 });
    owned.forEach((id, n) => {
      const here = id === gameState.layoutId;
      this.addButton(`${here ? '✓ ' : ''}${LAYOUTS[id].name}`, WIDTH / 2, 38 + n * rowH, () => {
        this.close();
        new LayoutPreview(scene, { layoutId: id, owned: true, current: here, onUse: () => onUse(id) });
      }, { width: WIDTH - PAD * 2 - 8, height: 18 });
    });
    this.add(scene.add.text(WIDTH / 2, 30 + owned.length * rowH + 10, 'More at Timber & Twig', { ...TEXT, color: '#c9bba0', align: 'center', wordWrap: { width: WIDTH - PAD * 2 } }).setOrigin(0.5, 0));
    this.keys = scene.input.keyboard;
    this.onEsc = () => this.close();
    this.keys.on('keydown-ESC', this.onEsc);
  }

  close() {
    this.keys?.off('keydown-ESC', this.onEsc);
    super.close();
  }
}
