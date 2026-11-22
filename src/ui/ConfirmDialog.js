import Dialog, { TEXT } from './Dialog.js';
import { PANEL_MARGIN } from './Panel.js';

// "Are you sure?" with a message and two buttons.
//
//   new ConfirmDialog(scene, {
//     title: 'Sell it?',
//     message: "You can't buy it back until winter.",
//     yes: 'Sell', no: 'Keep',
//     onYes: () => ...,
//     onClose: () => ...,   // optional: runs either way, after it closes
//   });
//
// Esc, clicking outside or the "no" button just closes it.

const WIDTH = 200;
const PAD = PANEL_MARGIN + 8;
const TOP = 24; // room for the title

export default class ConfirmDialog extends Dialog {
  constructor(scene, { title, message, yes = 'Yes', no = 'No', onYes, onClose }) {
    const text = scene.add.text(PAD, TOP, message, {
      ...TEXT,
      color: '#f2ead8',
      align: 'center',
      lineSpacing: 1,
      wordWrap: { width: WIDTH - PAD * 2 },
    });
    text.x = Math.round((WIDTH - text.width) / 2);
    const buttonsY = TOP + Math.ceil(text.height) + 18;
    super(scene, { title, width: WIDTH, height: buttonsY + 12 + PAD, onClose });
    this.add(text);
    this.addButton(yes, WIDTH / 2 - 36, buttonsY, () => {
      this.close();
      onYes?.();
    });
    this.addButton(no, WIDTH / 2 + 36, buttonsY, () => this.close());

    // While it's open, Esc closes it and Enter means yes.
    this.keys = scene.input.keyboard;
    this.onEsc = () => this.close();
    this.onEnter = () => {
      this.close();
      onYes?.();
    };
    this.keys.on('keydown-ESC', this.onEsc);
    this.keys.on('keydown-ENTER', this.onEnter);
  }

  close() {
    this.keys?.off('keydown-ESC', this.onEsc);
    this.keys?.off('keydown-ENTER', this.onEnter);
    super.close();
  }
}
