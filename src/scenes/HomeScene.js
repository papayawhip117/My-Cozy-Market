import Phaser from 'phaser';
import { GAME_HEIGHT, GROUND_Y, HOME_ROOM, COLORS } from '../config.js';
import Player from '../objects/Player.js';
import CoinHud from '../ui/CoinHud.js';
import CornerMenu from '../ui/CornerMenu.js';
import { gameState } from '../state/gameState.js';
import { travel, arrive } from './travel.js';

// Inside your home: one cozy room to walk around in. Same player, same
// controls, same coins as the street. Open the corner menu and pick Town
// to go back outside.
//
// Stand at the dresser and press Up (or click it) to change your look:
// it opens the character creator (CreatorScene.js).
//
// The dotted outlines are empty spots for furniture (HOME_ROOM.slots in
// config.js). The shopping step will fill them in.
export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('Home');
  }

  preload() {
    // Art from `npm run art` (tools/art/home.js).
    for (const key of ['home-wall', 'home-floor', 'home-slot-floor', 'home-slot-wall']) {
      this.load.image(key, `assets/${key}.png`);
    }
    for (const prop of [...HOME_ROOM.props, HOME_ROOM.dresser]) this.load.image(prop.key, `assets/${prop.key}.png`);
    Player.preload(this);
    CoinHud.preload(this);
    CornerMenu.preload(this);
  }

  // data.returnX = where you were standing on the street, so Town can put you back.
  // data.x = where to stand (coming back from the dresser).
  create(data) {
    this.returnX = data.returnX;
    const W = HOME_ROOM.width;

    // The room: wall and floor repeat across its whole width.
    this.add.tileSprite(0, 0, W, GROUND_Y, 'home-wall').setOrigin(0, 0);
    this.add.tileSprite(0, GROUND_Y, W, GAME_HEIGHT - GROUND_Y, 'home-floor').setOrigin(0, 0);
    for (const prop of HOME_ROOM.props) this.add.image(prop.x, prop.bottom, prop.key).setOrigin(0.5, 1);
    this.addFireGlow();
    this.addSlots();
    this.addDresser();

    this.player = new Player(this, data.x ?? HOME_ROOM.startX);
    this.player.walkWidth = W;

    this.hud = new CoinHud(this);
    this.menu = new CornerMenu(this, {
      place: 'town',
      onPlace: () => travel(this, 'Street', { x: this.returnX }),
    });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, W, GAME_HEIGHT);
    cam.startFollow(this.player, true, 0.1, 0.1);
    arrive(this);
  }

  // Warm firelight that flickers over the hearth and floor.
  addFireGlow() {
    const fire = HOME_ROOM.props.find((p) => p.key === 'home-fireplace');
    if (!fire) return;
    const glow = this.add.circle(fire.x, fire.bottom - 22, 46, 0xf5b35a, 0.12).setBlendMode(Phaser.BlendModes.ADD);
    const floorGlow = this.add.ellipse(fire.x, GROUND_Y + 8, 150, 18, 0xf5b35a, 0.1).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: [glow, floorGlow],
      alpha: { from: 0.7, to: 1 },
      scale: { from: 0.96, to: 1.04 },
      duration: 140,
      yoyo: true,
      repeat: -1,
      repeatDelay: 60,
      ease: 'Stepped', // jumpy, like real flames
      easeParams: [3],
    });
  }

  // The dresser: click it, or stand in front of it and press Up/W/E.
  addDresser() {
    const { key, x, bottom } = HOME_ROOM.dresser;
    const dresser = this.add.image(x, bottom, key).setOrigin(0.5, 1);
    dresser.setInteractive({ useHandCursor: true });
    dresser.on('pointerover', () => dresser.setTint(0xfff0d8));
    dresser.on('pointerout', () => dresser.clearTint());
    dresser.on('pointerdown', () => this.openDresser());

    // The little sign that pops up over your head when you're close.
    this.dresserPrompt = this.add
      .text(0, 0, '↑ Dresser', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: COLORS.signText,
        backgroundColor: COLORS.signBg,
        padding: { x: 3, y: 1 },
        resolution: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(900)
      .setVisible(false);

    for (const k of ['UP', 'W', 'E']) {
      this.input.keyboard.on(`keydown-${k}`, () => {
        if (this.nearDresser) this.openDresser();
      });
    }
  }

  openDresser() {
    if (this.menu.busy) return;
    travel(this, 'Creator', { from: 'home', returnX: this.returnX, x: this.player.x });
  }

  // Show "↑ Dresser" while you're standing in front of it.
  updateDresserPrompt() {
    this.nearDresser = !this.menu.busy && Math.abs(this.player.x - HOME_ROOM.dresser.x) < 22;
    this.dresserPrompt.setVisible(this.nearDresser);
    if (this.nearDresser) {
      this.dresserPrompt.setPosition(Math.round(this.player.x), GROUND_Y - 44 + (Math.floor(this.time.now / 400) % 2));
    }
  }

  // Dotted outlines where furniture can go. They gently pulse.
  addSlots() {
    this.slots = HOME_ROOM.slots.map((slot) =>
      this.add.image(slot.x, slot.bottom, `home-slot-${slot.kind}`).setOrigin(0.5, 1).setData('slot', slot),
    );
    this.tweens.add({ targets: this.slots, alpha: 0.45, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  update(time, delta) {
    this.player.canMove = !this.menu.busy;
    this.player.update(delta);
    this.updateDresserPrompt();
    gameState.update(delta); // idle coins keep coming in at home too
  }
}
