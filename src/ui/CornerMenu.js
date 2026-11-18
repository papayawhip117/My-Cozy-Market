import Phaser from 'phaser';
import { GAME_WIDTH } from '../config.js';
import { addPanel, preloadPanels, PANEL_MARGIN } from './Panel.js';
import Dialog, { TEXT, UI_DEPTH, pinToScreen, showToast } from './Dialog.js';
import BackpackPanel from './BackpackPanel.js';
import { logout } from '../state/account.js';

// The wooden menu button in the top-right corner. Click it (or press M)
// and a little list drops down:
//
//   Home / Town   go inside your home, or back out to the street
//   Backpack      everything you own
//   Log out       saves, signs out, back to the login screen (src/state/account.js)
//
// Each scene makes one and says what the first choice does:
//   new CornerMenu(scene, { place: 'home', onPlace: () => ... })

const BUTTON = 22; // menu-button.png frames are 22 x 22
const ICON = 12; // menu-icons.png frames are 12 x 12
const EDGE = 4; // gap from the edge of the screen
const ROW_H = 15;
const LIST_W = 88;

// Which picture in menu-icons.png (see tools/art/menu.js).
export const ICONS = { home: 0, town: 1, backpack: 2, logout: 3, item: 4 };

export default class CornerMenu {
  // Call from the scene's preload().
  static preload(scene) {
    scene.load.spritesheet('menu-button', 'assets/menu-button.png', { frameWidth: BUTTON, frameHeight: BUTTON });
    scene.load.spritesheet('menu-icons', 'assets/menu-icons.png', { frameWidth: ICON, frameHeight: ICON });
    scene.load.image('item-slot', 'assets/item-slot.png');
    preloadPanels(scene);
  }

  // place: 'home' (you're in town, so offer Home) or 'town' (you're home).
  constructor(scene, { place, onPlace }) {
    this.scene = scene;
    this.place = place;
    this.onPlace = onPlace;
    this.list = null; // the drop-down, while it's open
    this.dialog = null; // the backpack / log out pop-up, while it's open

    const x = GAME_WIDTH - EDGE - BUTTON;
    this.button = scene.add.sprite(x, EDGE, 'menu-button', 0).setOrigin(0, 0).setDepth(UI_DEPTH);
    pinToScreen(this.button);
    this.button.setInteractive({ useHandCursor: true });
    this.button.on('pointerover', () => this.button.setTint(0xfff0d8));
    this.button.on('pointerout', () => this.button.clearTint().setFrame(0));
    this.button.on('pointerdown', () => this.button.setFrame(1));
    this.button.on('pointerup', () => {
      this.button.setFrame(0);
      this.toggle();
    });

    // Keyboard: M opens/closes the menu, Esc closes whatever is open.
    scene.input.keyboard.on('keydown-M', () => this.toggle());
    scene.input.keyboard.on('keydown-ESC', () => {
      if (this.dialog) this.dialog.close();
      else this.closeList();
    });
  }

  // True while the list or a pop-up is open (the scene stops the player walking).
  get busy() {
    return Boolean(this.list || this.dialog);
  }

  toggle() {
    if (this.dialog) return;
    if (this.list) this.closeList();
    else this.openList();
  }

  openList() {
    const scene = this.scene;
    const choices = [
      this.place === 'home'
        ? { label: 'Home', icon: ICONS.home, action: () => this.onPlace() }
        : { label: 'Town', icon: ICONS.town, action: () => this.onPlace() },
      { label: 'Backpack', icon: ICONS.backpack, action: () => this.openBackpack() },
      { label: 'Log out', icon: ICONS.logout, action: () => this.openLogout() },
    ];

    const pad = PANEL_MARGIN + 5;
    const h = choices.length * ROW_H + pad * 2;
    const x = GAME_WIDTH - EDGE - LIST_W;
    const y = EDGE + BUTTON + 2;

    // An invisible layer over the whole screen: clicking off the list closes it.
    const away = scene.add.zone(0, 0, scene.scale.width, scene.scale.height).setOrigin(0, 0);
    away.setInteractive().on('pointerdown', () => this.closeList());

    const box = scene.add.container(x, y, [addPanel(scene, 0, 0, LIST_W, h, 'panel-wood')]);
    choices.forEach((choice, i) => box.add(this.makeRow(choice, pad, pad + i * ROW_H, LIST_W - pad * 2)));

    this.list = pinToScreen(scene.add.container(0, 0, [away, box]).setDepth(UI_DEPTH - 1));
    box.setAlpha(0).y -= 3; // slide in
    scene.tweens.add({ targets: box, alpha: 1, y, duration: 110, ease: 'Quad.easeOut' });
  }

  // One line in the list: a glow when hovered, the icon, the words.
  makeRow({ label, icon, action }, x, y, w) {
    const scene = this.scene;
    const glow = scene.add.rectangle(0, 0, w, ROW_H - 1, 0xffe3a0, 0).setOrigin(0, 0);
    const pic = scene.add.sprite(2, (ROW_H - 1) / 2, 'menu-icons', icon).setOrigin(0, 0.5);
    const text = scene.add.text(ICON + 6, (ROW_H - 1) / 2, label, TEXT).setOrigin(0, 0.5);
    const row = scene.add.container(x, y, [glow, pic, text]);
    row.setSize(w, ROW_H - 1).setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, w, ROW_H - 1),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    row.on('pointerover', () => glow.setFillStyle(0xffe3a0, 0.22));
    row.on('pointerout', () => glow.setFillStyle(0xffe3a0, 0));
    row.on('pointerup', () => {
      this.closeList();
      action();
    });
    return row;
  }

  closeList() {
    this.list?.destroy();
    this.list = null;
  }

  // ---------- the pop-ups ----------

  openBackpack() {
    this.dialog = new BackpackPanel(this.scene, { onClose: () => (this.dialog = null) });
  }

  openLogout() {
    const d = new Dialog(this.scene, { title: 'Log out?', width: 180, height: 96, onClose: () => (this.dialog = null) });
    d.add(
      this.scene.add
        .text(90, 30, 'Your coins and things\nare saved for next time.', { ...TEXT, color: '#f2ead8', align: 'center' })
        .setOrigin(0.5, 0),
    );
    d.addButton('Stay', 56, 70, () => d.close());
    d.addButton('Log out', 124, 70, async () => {
      d.close();
      const loggedOut = await logout();
      if (!loggedOut) showToast(this.scene, "You're playing as a guest,\nso there's nothing to log out of.");
    });
    this.dialog = d;
  }
}
