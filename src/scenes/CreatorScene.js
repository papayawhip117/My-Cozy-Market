import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, LOOK_OPTIONS, LOOK_COLORS, WEAR_SLOTS } from '../config.js';
import { preloadLook, buildLook, setLookFrame, ownedWear, FRAME_W, FRAME_H } from '../objects/CharacterLook.js';
import { addPanel, preloadPanels, PANEL_MARGIN } from '../ui/Panel.js';
import { TEXT, woodButton } from '../ui/Dialog.js';
import { fitText } from '../ui/MenuList.js';
import { addNameField } from '../ui/NameField.js';
import { gameState } from '../state/gameState.js';
import { findItem, itemName } from '../state/catalog.js';
import { travel, arrive } from './travel.js';

// The character creator: pick your name, hairstyle, ears + tail, eyes,
// skin tone and clothes, and see your pal change as you click.
//
// It opens two ways:
//   1. Right after you log in for the very first time (main.js), before
//      the street:            scene.start('Creator', { from: 'start' })
//   2. From the dresser in your home (HomeScene):
//      travel(this, 'Creator', { from: 'home', returnX, x })
//
// Nothing is saved until you press Done. From the dresser, Back leaves
// without changing anything.

// The tabs along the top of the right-hand panel.
const TABS = [
  { id: 'hair', label: 'Hair' },
  { id: 'ears', label: 'Ears' },
  { id: 'eyes', label: 'Eyes' },
  { id: 'skin', label: 'Skin' },
  { id: 'clothes', label: 'Clothes' },
];

// What a style button shows: just part of the character, zoomed in.
// crop is in pixels of one 32x40 frame.
const THUMBS = {
  hair: { crop: { x: 3, y: 0, w: 26, h: 26 }, scale: 1.5 },
  ears: { crop: { x: 0, y: 0, w: 32, h: 26 }, scale: 1.5 },
  eyes: { crop: { x: 6, y: 14, w: 20, h: 12 }, scale: 3 },
};

// Names for the clothes you start with (when a slot has nothing bought on it).
const DEFAULT_WEAR = { head: 'None', top: 'Blouse', bottom: 'Skirt', feet: 'Boots', bag: 'None' };

const LIGHT = '#f2ead8';
const GOLD = '#ffe3a0';
const SELECTED = 0xffe3a0;
const CELL_BG = 0x2a1f1c;
const LINE = 0x1c1822;

const PREVIEW_SCALE = 4;
const NAME_MAX = 16; // longest name that fits under your pal (and on the sign-up form)

// 'pixie' -> 'Pixie' (and a few shorter names so the labels fit)
const SHORT = { ponytail: 'Pony', twintails: 'Twins' };
const title = (s) => SHORT[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

export default class CreatorScene extends Phaser.Scene {
  constructor() {
    super('Creator');
  }

  preload() {
    for (const key of ['bg-sky', 'bg-castle', 'bg-forest']) this.load.image(key, `assets/${key}.png`);
    preloadLook(this);
    preloadPanels(this);
  }

  // data.from: 'start' (first time) or 'home' (the dresser).
  create(data = {}) {
    this.from = data.from ?? 'start';
    this.returnData = { returnX: data.returnX, x: data.x };
    this.look = gameState.look; // a copy we can change freely
    // First time: start with the name you signed up with.
    if (!gameState.hasCharacter && gameState.signupName) this.look.name = gameState.signupName.slice(0, NAME_MAX);
    this.tab = 'hair';

    this.addBackdrop();
    this.addPreviewPanel();
    this.addOptionsPanel();
    this.refresh();

    // Keyboard: Left/Right turn her around, Enter = Done, Esc = Back.
    // (While you're typing your name, the text box keeps these keys.)
    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.turn(-1));
    kb.on('keydown-RIGHT', () => this.turn(1));
    kb.on('keydown-ENTER', () => this.done());
    kb.on('keydown-ESC', () => this.back());

    arrive(this);
  }

  // ---------- layout ----------

  // The dusk sky and forest behind the panels, dimmed a little.
  addBackdrop() {
    this.add.image(0, 0, 'bg-sky').setOrigin(0, 0);
    this.add.image(0, GAME_HEIGHT, 'bg-castle').setOrigin(0, 1);
    this.add.image(0, GAME_HEIGHT, 'bg-forest').setOrigin(0, 1);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d0a12, 0.35).setOrigin(0, 0);
  }

  // Left: a big preview of your pal, with arrows to turn her around.
  addPreviewPanel() {
    const x = 12;
    const y = 12;
    const w = 150;
    const h = GAME_HEIGHT - 24;
    addPanel(this, x, y, w, h, 'panel-moss');
    const cx = x + w / 2;

    const heading = this.from === 'home' ? 'Your dresser' : 'Make your pal!';
    this.add.text(cx, y + PANEL_MARGIN + 8, heading, { ...TEXT, color: GOLD }).setOrigin(0.5, 0);

    // A soft shadow and the character, 4x bigger than in the game.
    const feetY = y + 192;
    this.add.ellipse(cx, feetY, 60, 10, 0x0d0a12, 0.35);
    this.preview = this.add.container(cx, feetY).setScale(PREVIEW_SCALE);
    this.facing = 1;

    // Your name under her feet (it changes as you type).
    this.nameTag = this.add.text(cx, feetY + 8, this.look.name, { ...TEXT, color: LIGHT }).setOrigin(0.5, 0);

    // Arrows on each side of her turn her around (and she takes a few steps).
    const arrow = (label, ax, dir) => {
      const t = this.add.text(ax, feetY - 60, label, { ...TEXT, fontSize: '16px', color: GOLD }).setOrigin(0.5);
      t.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.turn(dir));
    };
    arrow('◀', x + 18, -1);
    arrow('▶', x + w - 18, 1);

    woodButton(this, 'Shuffle', cx, y + h - 22, () => this.shuffle(), { width: 70, height: 20 });
  }

  // Right: name, pronouns, tabs, and the options for the open tab.
  addOptionsPanel() {
    const x = 170;
    const y = 12;
    const w = GAME_WIDTH - x - 12;
    const h = GAME_HEIGHT - 24;
    addPanel(this, x, y, w, h, 'panel-wood');
    this.box = { x: x + 14, y: y + 12, w: w - 28 }; // the area inside the frame

    // Name box (a real text box, see NameField.js)
    const top = this.box.y + 4;
    this.add.text(this.box.x, top + 3, 'Name', { ...TEXT, color: LIGHT });
    this.nameField = addNameField(this, {
      x: this.box.x + 30,
      y: top,
      width: 110,
      height: 16,
      value: this.look.name,
      maxLength: NAME_MAX,
      onInput: (name) => this.nameTag.setText(name),
    });

    // Pronouns: click the arrows to cycle through them.
    const px = this.box.x + this.box.w - 52;
    this.pronouns = this.cycler(px, top + 8, () => this.look.pronouns, (dir) => {
      this.look.pronouns = this.step(LOOK_OPTIONS.pronouns, this.look.pronouns, dir);
    });

    // Tabs
    const tabY = top + 26;
    const tabW = Math.floor((this.box.w - 4 * 3) / TABS.length);
    this.tabButtons = TABS.map((tab, i) => {
      const tx = this.box.x + i * (tabW + 3);
      const bg = this.add.rectangle(tx, tabY, tabW, 16, CELL_BG).setOrigin(0, 0).setStrokeStyle(1, LINE);
      const label = this.add.text(tx + tabW / 2, tabY + 8, tab.label, TEXT).setOrigin(0.5);
      bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.tab = tab.id;
        this.refresh();
      });
      return { tab, bg, label };
    });

    this.contentTop = tabY + 24;
    this.content = this.add.container(0, 0);

    // Done (and Back, from the dresser)
    const by = y + h - 22;
    const right = this.box.x + this.box.w;
    woodButton(this, '✓ Done', right - 34, by, () => this.done(), { width: 68, height: 20 });
    if (this.from === 'home') woodButton(this, 'Back', right - 110, by, () => this.back(), { width: 56, height: 20 });
  }

  // ---------- redrawing ----------

  // Redraw everything that depends on the look or the open tab.
  refresh() {
    // the big preview
    this.previewLayers = buildLook(this.preview, this.look);
    this.preview.scaleX = PREVIEW_SCALE * this.facing;
    this.pronouns.setText(this.look.pronouns);

    for (const { tab, bg, label } of this.tabButtons) {
      const on = tab.id === this.tab;
      bg.setFillStyle(on ? 0x5a4038 : CELL_BG).setStrokeStyle(1, on ? SELECTED : LINE);
      label.setColor(on ? GOLD : LIGHT);
    }

    // the open tab's options (rebuilt from scratch, it's quick)
    this.content.removeAll(true);
    const y = this.contentTop;
    if (this.tab === 'hair') this.styleTab('hair', 'Hair color', 'hairColor', y);
    if (this.tab === 'ears') this.styleTab('ears', 'Ear + tail color', 'furColor', y);
    if (this.tab === 'eyes') this.styleTab('eyes', 'Eye color', 'eyeColor', y);
    if (this.tab === 'skin') this.swatches('Skin tone', 'skin', y, 22);
    if (this.tab === 'clothes') this.clothesTab(y);
  }

  // A row of style buttons (each a zoomed-in mini you), then color swatches.
  styleTab(part, colorLabel, colorKey, y) {
    const options = LOOK_OPTIONS[part];
    const { crop, scale } = THUMBS[part];
    const cellW = crop.w * scale + 4;
    const cellH = crop.h * scale + 4;
    // More than 6 styles? Two rows, so they all fit across the panel.
    const perRow = options.length > 6 ? Math.ceil(options.length / 2) : options.length;
    const gap = Math.max(0, Math.min(6, Math.floor((this.box.w - perRow * cellW) / Math.max(1, perRow - 1))));
    const rowW = perRow * cellW + (perRow - 1) * gap;
    const left = this.box.x + Math.floor((this.box.w - rowW) / 2);
    const rowH = cellH + 12; // the picture and its name

    options.forEach((option, i) => {
      const x = left + (i % perRow) * (cellW + gap);
      const cy = y + Math.floor(i / perRow) * rowH;
      const on = this.look[part] === option;
      const cell = this.add
        .rectangle(x, cy, cellW, cellH, on ? 0x5a4038 : CELL_BG)
        .setOrigin(0, 0)
        .setStrokeStyle(1, on ? SELECTED : LINE);
      cell.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.look[part] = option;
        this.refresh();
      });

      // A mini you wearing this option, cropped to just the part that changes.
      // Crop keeps the sprite where it is, so shift it so the crop lands in the cell.
      const mini = this.add.container(
        x + 2 + (FRAME_W / 2 - crop.x) * scale,
        cy + 2 + (FRAME_H - crop.y) * scale,
      );
      mini.setScale(scale);
      buildLook(mini, { ...this.look, [part]: option }, crop);

      const label = this.add
        .text(x + cellW / 2, cy + cellH + 1, title(option), { ...TEXT, fontSize: '8px', color: on ? GOLD : LIGHT })
        .setOrigin(0.5, 0);
      this.content.add([cell, mini, label]);
    });

    const rows = Math.ceil(options.length / perRow);
    this.swatches(colorLabel, colorKey, y + rows * rowH + 6);
  }

  // A label and a row of color squares. Click one to use that color.
  swatches(label, key, y, size = 14) {
    this.content.add(this.add.text(this.box.x, y, label, { ...TEXT, color: LIGHT }));
    const colors = LOOK_COLORS[key];
    const gap = 4;
    colors.forEach((color, i) => {
      const x = this.box.x + i * (size + gap);
      const on = this.look[key] === color;
      const sq = this.add
        .rectangle(x, y + 14, size, size, color)
        .setOrigin(0, 0)
        .setStrokeStyle(on ? 2 : 1, on ? SELECTED : LINE);
      sq.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.look[key] = color;
        this.refresh();
      });
      this.content.add(sq);
    });
  }

  // One row per body slot: ◀ name ▶ to switch between the clothes you own.
  clothesTab(y) {
    const owned = gameState.items;
    const rowH = 15;
    let anyOwned = false;

    WEAR_SLOTS.forEach((slot, i) => {
      const choices = [null, ...ownedWear(slot, owned)];
      if (choices.length > 1) anyOwned = true;
      const ry = y + i * rowH;
      this.content.add(this.add.text(this.box.x, ry, title(slot), { ...TEXT, color: LIGHT }));

      const covered = slot === 'bottom' && findItem(this.look.worn.top)?.fullBody;
      const name = () => (covered ? '(pajamas)' : this.look.worn[slot] ? itemName(this.look.worn[slot]) : DEFAULT_WEAR[slot]);
      const cycler = this.cycler(this.box.x + 130, ry + 5, name, (dir) => this.wear(slot, this.step(choices, this.look.worn[slot], dir)), choices.length > 1);
      this.content.add(cycler.parts);
    });

    const hy = y + WEAR_SLOTS.length * rowH + 2;
    if (!anyOwned) {
      this.content.add(
        this.add.text(this.box.x, hy, 'Buy clothes in town to\nwear them here!', { ...TEXT, color: GOLD, lineSpacing: 2 }),
      );
    }
    this.swatches('Skirt color', 'outfitColor', hy + (anyOwned ? 4 : 28));
  }

  // Put on `id` in `slot` (null = the clothes you started with).
  wear(slot, id) {
    const worn = this.look.worn;
    worn[slot] = id;
    // Pajamas cover top AND bottom: wearing them takes off pants, and
    // putting on pants takes off pajamas.
    if (slot === 'top' && findItem(id)?.fullBody) worn.bottom = null;
    if (slot === 'bottom' && id && findItem(worn.top)?.fullBody) worn.top = null;
  }

  // "◀ value ▶" centered on (x, y). getText() says what to show,
  // onStep(-1 or 1) changes it. Returns { parts, setText }.
  cycler(x, y, getText, onStep, enabled = true) {
    const color = enabled ? GOLD : '#8a7a6a';
    const value = fitText(this.add.text(x, y, getText(), { ...TEXT, color: LIGHT }).setOrigin(0.5), 92);
    const left = this.add.text(x - 52, y, '◀', { ...TEXT, color }).setOrigin(0.5);
    const right = this.add.text(x + 52, y, '▶', { ...TEXT, color }).setOrigin(0.5);
    if (enabled) {
      for (const [arrow, dir] of [[left, -1], [right, 1]]) {
        arrow.setPadding(4, 2).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          onStep(dir);
          this.refresh();
        });
      }
    }
    return { parts: [left, value, right], setText: (t) => fitText(value.setText(t), 92) };
  }

  // The next (dir = 1) or previous (dir = -1) item in a list, wrapping around.
  step(list, current, dir) {
    const i = Math.max(0, list.indexOf(current));
    return list[(i + dir + list.length) % list.length];
  }

  // ---------- actions ----------

  // Face left or right, and take a few steps so you can see her walk.
  turn(dir) {
    this.facing = dir;
    this.preview.scaleX = PREVIEW_SCALE * dir;
    this.walkTimer?.remove();
    let step = 0;
    this.walkTimer = this.time.addEvent({
      delay: 120,
      repeat: 7,
      callback: () => {
        step++;
        setLookFrame(this.previewLayers, step === 8 ? 0 : 1 + (step % 4));
      },
    });
  }

  // Random hair, ears, eyes and colors (keeps your name and clothes).
  shuffle() {
    const pick = (list) => Phaser.Utils.Array.GetRandom(list);
    for (const part of ['hair', 'ears', 'eyes']) this.look[part] = pick(LOOK_OPTIONS[part]);
    for (const key of Object.keys(LOOK_COLORS)) this.look[key] = pick(LOOK_COLORS[key]);
    this.refresh();
  }

  // Save and go: to the street the first time, back home from the dresser.
  done() {
    if (this.leaving) return;
    this.look.name = this.nameField.value || 'Pal';
    gameState.setLook(this.look);
    this.nameField.hide();
    if (this.from === 'home') travel(this, 'Home', this.returnData);
    else travel(this, 'Street', { x: 80 });
  }

  // Leave the dresser without saving (not on the very first visit).
  back() {
    if (this.from !== 'home' || this.leaving) return;
    this.nameField.hide();
    travel(this, 'Home', this.returnData);
  }
}
