import Phaser from 'phaser';
import { COLORS, FONT, FIXTURE_ART } from '../config.js';
import Player from '../objects/Player.js';
import CoinHud from '../ui/CoinHud.js';
import CornerMenu from '../ui/CornerMenu.js';
import HomeDecorator from '../ui/HomeDecorator.js';
import { woodButton, UI_DEPTH } from '../ui/Dialog.js';
import { drawRoom, clampToFloor, wallEdges, wallSide } from '../world/IsoRoom.js';
import { gameState } from '../state/gameState.js';
import { FOOTPRINT, isoTexture } from '../data/furniture.js';
import { travel, arrive } from './travel.js';

// Inside your home: one cozy isometric room. Walk around with the arrow keys
// (or WASD), and press "Decorate" (or B) to arrange your furniture and plants
// anywhere you like and paint them in new colors. All of that lives in
// src/ui/HomeDecorator.js; the room's shape is in src/world/IsoRoom.js.
//
// The door takes you back to town, and the dresser opens the character
// creator (stand next to either and press E, or click it). Like the
// furniture, the door, windows and dresser can be moved and painted in
// decorate mode.

const WALK_SPEED = 70; // pixels per second sideways (up and down is half as fast, like the floor)
const WALK_FRAMES = [1, 2, 3, 4];
const WALK_FRAME_MS = 120;

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('Home');
  }

  preload() {
    // Art from `npm run art` (tools/art/home.js).
    for (const key of Object.values(FIXTURE_ART)) this.load.image(key, `assets/${key}.png`);
    // 3D furniture and floor plants (tools/art/furniture.js)
    for (const id of Object.keys(FOOTPRINT)) if (!FIXTURE_ART[id]) this.load.image(isoTexture(id), `assets/${isoTexture(id)}.png`);
    Player.preload(this);
    CoinHud.preload(this);
    CornerMenu.preload(this);
  }

  // data.returnX = where you were standing on the street, so Town can put you back.
  // data.x, data.y = where to stand (coming back from the dresser).
  create(data) {
    this.returnX = data.returnX;
    drawRoom(this);

    this.player = new Player(this, 0);
    const start = this.doorSpot();
    this.player.setPosition(data.x ?? start.x, data.y ?? start.y + 12);
    this.walkTime = 0;
    this.feet = new Phaser.Geom.Rectangle();
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
    // the door, windows and dresser are placed things too; clicking the door or dresser uses it
    this.decorator.onUse = (data) => (data.id === 'door' ? this.useDoor() : data.id === 'dresser' ? this.useDresser() : null);
    this.addDecorateButton();
    this.addPrompt();

    this.input.keyboard.on('keydown-E', () => this.interact());
    this.input.keyboard.on('keydown-B', () => this.toggleDecorating());
    this.input.keyboard.on('keydown-ESC', () => this.decorator.mode && this.toggleDecorating());
    this.events.once('shutdown', () => this.decorator.destroy());
    arrive(this);
  }

  // ---------- the room ----------

  // The little sign that pops up over your head when you stand by the door or dresser.
  addPrompt() {
    this.prompt = this.add
      .text(0, 0, '', {
        fontFamily: FONT,
        fontSize: '10px',
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

  // The patch of floor in front of the door, wherever you've moved it to.
  doorSpot() {
    const door = this.decorator?.fixture('door') ?? { x: 150 };
    const side = wallSide(door.x);
    return { x: door.x - side * 12, y: wallEdges(door.x).bottom + 10 };
  }

  // What you're standing next to, if anything.
  nearby() {
    const { x, y } = this.player;
    const spot = this.doorSpot();
    if (Phaser.Math.Distance.Between(x, y, spot.x, spot.y) < 30) return { label: 'E  Door', use: () => this.useDoor() };
    const dresser = this.decorator.fixture('dresser');
    if (dresser && Phaser.Math.Distance.Between(x, y, dresser.x, dresser.y + 4) < 30) return { label: 'E  Dresser', use: () => this.useDresser() };
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
    // stand in front of furniture you're past and behind furniture nearer the front
    this.feet.setTo(player.x - 9, player.y - 40, 18, 40);
    player.setDepth(this.decorator.playerDepth(player.x, player.y, this.feet));

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
