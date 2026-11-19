import Dialog, { TEXT } from './Dialog.js';
import { PANEL_MARGIN } from './Panel.js';
import { COMING_SOON } from '../data/comingSoon.js';

// The pop-up you see when you read the bulletin board on the street:
// a paper note for each "coming soon" announcement, pinned to a green
// panel. The notes themselves live in src/data/comingSoon.js.
//
//   new BulletinPanel(scene, { onClose: () => ... });

const WIDTH = 280;
const PAD = PANEL_MARGIN + 10;
const NOTE_W = WIDTH - PAD * 2;
const GAP = 6; // space between notes
const TOP = 26; // room for the title

// Paper colors: [paper, its darker edge].
const PAPER = {
  cream: [0xf2ead8, 0xc8b896],
  pink: [0xf0d0d4, 0xc99aa6],
  lilac: [0xdcd2ec, 0x9f8cc0],
  sage: [0xd4e0c8, 0x9db88f],
};

const INK = '#3a3040';

export default class BulletinPanel extends Dialog {
  constructor(scene, { onClose }) {
    // Make the text first, so we know how tall each note needs to be.
    const notes = COMING_SOON.map((note) => {
      const title = scene.add.text(0, 0, note.title, { ...TEXT, color: INK, fontStyle: 'bold' });
      const body = scene.add.text(0, 0, note.text, {
        ...TEXT,
        fontSize: '10px',
        color: INK,
        wordWrap: { width: NOTE_W - 16 },
        lineSpacing: 1,
      });
      return { note, title, body, h: Math.ceil(title.height + body.height) + 10 };
    });
    const notesH = notes.reduce((sum, n) => sum + n.h + GAP, 0);
    const height = TOP + notesH + 30; // + the Close button
    super(scene, { title: 'Coming soon!', width: WIDTH, height, onClose });

    let y = TOP;
    notes.forEach(({ note, title, body, h }, i) => {
      const [paper, edge] = PAPER[note.paper] ?? PAPER.cream;
      // a slightly crooked paper note with a red pin at the top
      const g = scene.add.graphics();
      g.fillStyle(edge, 1).fillRect(PAD - 1, y - 1, NOTE_W + 2, h + 2);
      g.fillStyle(paper, 1).fillRect(PAD, y, NOTE_W, h);
      g.fillStyle(0x0d0a12, 0.18).fillRect(PAD + 2, y + h + 1, NOTE_W, 1); // shadow
      g.fillStyle(0xa5503f, 1).fillCircle(PAD + 8, y + 4, 2);
      g.fillStyle(0xe89aa0, 1).fillRect(PAD + 7, y + 3, 1, 1);
      g.setAngle(i % 2 ? 0.6 : -0.6);
      this.add(g);
      this.add(title.setPosition(PAD + 14, y + 4));
      this.add(body.setPosition(PAD + 14, y + 5 + title.height));
      y += h + GAP;
    });

    this.addButton('Close', WIDTH / 2, height - 18, () => this.close());
  }
}
