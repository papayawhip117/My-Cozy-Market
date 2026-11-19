import Phaser from 'phaser';
import { COLORS, FONT } from '../config.js';
import Player from '../objects/Player.js';
import CoinHud from '../ui/CoinHud.js';
import CornerMenu from '../ui/CornerMenu.js';
import HomeDecorator from '../ui/HomeDecorator.js';
import { woodButton, UI_DEPTH } from '../ui/Dialog.js';
import { drawRoom, clampToFloor, wallEdges, wallSide, wallTexture } from '../world/IsoRoom.js';
import { gameState } from '../state/gameState.js';
import { travel, arrive } from './travel.js';

// Inside your home: one cozy isometric room. Walk around with the arrow keys
// (or WASD), and press "Decorate" (or B) to arrange your furniture and plants
// anywhere you like and paint them in new colors. All of that lives in
// src/ui/HomeDecorator.js; the room's shape is in src/world/IsoRoom.js.
//
// The door on the left wall takes you back to town, and the dresser opens
// the character creator (stand next to either and press E, or click it).

const WALK_SPEED = 70; // pixels per second sideways (up and down is half as fast, like the floor)
const WALK_FRAMES = [1, 2, 3, 4];
const WALK_FRAME_MS = 120;

// Parts of the room that are always there.
const DOOR = { x: 150, spot: { x: 160, y: 172 } }; // x on the left wall; `spot` is the floor in front of it
const DRESSER = { x: 312, y: 174 }; // stands on the floor
const WINDOWS = [205, 300]; // x on the walls

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('Home');
  }

  preload() {
    // Art from `npm run art` (tools/art/home.js).
    for (const key of ['home-door', 'home-window', 'home-dresser']) this.load.image(key, `assets/${key}.png`);
    Player.preload(this);
    CoinHud.preload(this);
    CornerMenu.preload(this);
  }

  // data.returnX = where you were standing on the street, so Town can put you back.
  // data.x, data.y = where to stand (coming back from the dresser).
  create(data) {
    this.returnX = data.returnX;
    drawRoom(this);
    this.addFixtures();

    this.player = new Player(this, 0);
    this.player.setPosition(data.x ?? DOOR.spot.x, data.y ?? DOOR.spot.y + 12);
    this.walkTime = 0;
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
    });

    this.hud = new CoinHud(this);
    this.menu = new CornerMenu(this, {
      place: 'town',
      onPlace: () => travel(this, 'Street', { x: this.returnX }),
    });
    this.decorator = new HomeDecorator(this);
    this.addDecorateButton();
    this.addPrompt();

    this.input.keyboard.on('keydown-E', () => this.interact());
    this.input.keyboard.on('keydown-B', () => this.toggleDecorating());
    this.input.keyboard.on('keydown-ESC', () => this.decorator.mode && this.toggleDecorating());
    this.events.once('shutdown', () => this.decorator.destroy());
    arrive(this);
  }

  // ---------- the room ----------

  // The door, windows and dresser. They lie along the walls like the furniture does.
  addFixtures() {
    // the door on the left wall: click it to go out
    const doorY = wallEdges(DOOR.x).bottom;
    const door = this.add.image(DOOR.x, doorY + 9, wallTexture(this, 'home-door', 1, -1)).setOrigin(0.5, 1).setDepth(1);
    this.makeClickable(door, () => this.useDoor());

    for (const x of WINDOWS) {
      const bottom = wallEdges(x).bottom - 14;
      this.add.image(x, bottom + 12, wallTexture(this, 'home-window', 1, wallSide(x))).setOrigin(0.5, 1).setDepth(1);
      // cool moonlight falling across the wall below the window
      const light = this.add.ellipse(x, wallEdges(x).bottom - 4, 56, 8, 0xbfd8e0, 0.08).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: light, alpha: 0.14, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // the dresser stands on the floor and opens the character creator
    const dresser = this.add.image(DRESSER.x, DRESSER.y, 'home-dresser').setOrigin(0.5, 1).setDepth(DRESSER.y);
    this.makeClickable(dresser, () => this.useDresser());
  }

  makeClickable(obj, action) {
    obj.setInteractive({ useHandCursor: true });
    obj.on('pointerover', () => obj.setTint(0xfff0d8));
    obj.on('pointerout', () => obj.clearTint());
    // pointerdown (not up), so the click that closes a menu doesn't also use the door
    obj.on('pointerdown', action);
  }

  // The little sign that pops up over your head when you stand by the door or dresser.
  addPrompt() {
    this.prompt = this.add
      .text(0, 0, '', {
        fontFamily: FONT,
        fontSize: '12px',
        color: COLORS.signText,
        backgroundColor: COLORS.signBg,
        padding: { x: 3, y: 1 },
        resolution: 1,
      })
      .setOrigin(0.5, 1)
      .setDepth(900)
      .setVisible(false);
  }

  addDecorateButton() {
    this.decorateButton = woodButton(this, 'Decorate', 240, 17, () => this.toggleDecorating(), { width: 76, height: 20 });
    this.decorateButton.setDepth(UI_DEPTH);
  }

  toggleDecorating() {
    if (this.menu.busy) return;
    const on = !this.decorator.mode;
    this.decorator.setMode(on);
    this.decorateButton.list[1].setText(on ? 'Done' : 'Decorate');
  }

  // ---------- door and dresser ----------

  useDoor() {
    if (this.menu.busy || this.decorator.mode) return;
    travel(this, 'Street', { x: this.returnX });
  }

  useDresser() {
    if (this.menu.busy || this.decorator.mode) return;
    travel(this, 'Creator', { from: 'home', returnX: this.returnX, x: this.player.x, y: this.player.y });
  }

  // What you're standing next to, if anything.
  nearby() {
    const { x, y } = this.player;
    if (Phaser.Math.Distance.Between(x, y, DOOR.spot.x, DOOR.spot.y) < 30) return { label: 'E  Door', use: () => this.useDoor() };
    if (Phaser.Math.Distance.Between(x, y, DRESSER.x, DRESSER.y + 8) < 30) return { label: 'E  Dresser', use: () => this.useDresser() };
    return null;
  }

  interact() {
    if (!this.menu.busy && !this.decorator.mode) this.nearby()?.use();
  }

  // ---------- walking ----------

  update(time, delta) {
    const busy = this.menu.busy || this.decorator.mode;
    const k = this.keys;
    const dx = busy ? 0 : (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
    const dy = busy ? 0 : (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
    const player = this.player;

    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      const step = (WALK_SPEED * delta) / 1000;
      const pos = clampToFloor(player.x + (dx / len) * step, player.y + ((dy / len) * step) / 2, 4);
      player.setPosition(pos.x, pos.y);
      if (dx) player.scaleX = dx; // the art faces right; flip to face the way she walks
      this.walkTime += delta;
      player.setFrame(WALK_FRAMES[Math.floor(this.walkTime / WALK_FRAME_MS) % WALK_FRAMES.length]);
    } else {
      this.walkTime = 0;
      player.setFrame(0);
    }
    player.setDepth(player.y);

    // "E Door" / "E Dresser" while you're standing next to one
    const near = busy ? null : this.nearby();
    this.prompt.setVisible(Boolean(near));
    if (near) {
      this.prompt.setText(near.label);
      this.prompt.setPosition(Math.round(player.x), Math.round(player.y) - 46 + (Math.floor(time / 400) % 2));
    }
    gameState.update(delta); // idle coins keep coming in at home too
  }
}
