import Phaser from 'phaser';
import { GAME_HEIGHT, GROUND_Y, WORLD_WIDTH, SHOPS, DECOR, COLORS, FONT } from '../config.js';
import { preloadBackground, createBackground, createForeground, createFireflies } from '../world/Background.js';
import { preloadProps, createProps } from '../world/StreetProps.js';
import { createStreet } from '../world/Street.js';
import Player from '../objects/Player.js';
import CoinHud from '../ui/CoinHud.js';
import CornerMenu from '../ui/CornerMenu.js';
import BulletinPanel from '../ui/BulletinPanel.js';
import { gameState } from '../state/gameState.js';
import { travel, arrive } from './travel.js';

// How close (in pixels) you need to stand to a shop's door to go in,
// or to the bulletin board to read it.
const DOOR_RANGE = 18;
const BOARD_RANGE = 22;

// The main street. This file just puts the pieces together;
// each piece lives in its own file.
export default class StreetScene extends Phaser.Scene {
  constructor() {
    super('Street');
  }

  preload() {
    // Load the pixel art made by `npm run art` (files in public/assets).
    // Each shop/decoration loads the image named by its `key` in config.js.
    // If a file is missing, Street.js draws a placeholder box instead.
    for (const item of [...SHOPS, ...DECOR]) {
      this.load.image(item.key, `assets/${item.key}.png`);
    }
    Player.preload(this);
    preloadBackground(this);
    preloadProps(this);
    CoinHud.preload(this);
    CornerMenu.preload(this);
  }

  // data.x = where to stand (coming back from home puts you where you left).
  create(data) {
    // Draw order matters: things added later appear in front.
    createBackground(this);
    const props = createProps(this); // lamp posts, crates, benches... and their light
    this.shops = createStreet(this);
    this.player = new Player(this, data.x ?? 80);
    createFireflies(this);
    createForeground(this); // ferns and falling leaves in front of you
    this.hud = new CoinHud(this); // added last so it's on top
    this.menu = new CornerMenu(this, {
      place: 'home',
      onPlace: () => travel(this, 'Home', { returnX: this.player.x }),
    });

    // Camera: follow the player, but never show past the street's ends.
    // centerOn first, so coming back from home doesn't swoop across the street.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    cam.centerOn(this.player.x, GAME_HEIGHT / 2);
    cam.startFollow(this.player, true, 0.1, 0.1);
    this.addShopDoors();
    this.addBulletinBoard(props.board);
    arrive(this);
  }

  // Shops you can go into: click a shop, or stand at its door and press Up/W/E.
  addShopDoors() {
    for (const { shop, target } of this.shops) {
      target.setInteractive({ useHandCursor: true });
      target.on('pointerover', () => target.setTint?.(0xfff0d8)); // placeholder zones can't tint
      target.on('pointerout', () => target.clearTint?.());
      // pointerdown (not up), so the click that closes the corner menu
      // doesn't also walk you into a shop.
      target.on('pointerdown', () => this.enterShop(shop, shop.x + (shop.doorX ?? 0)));
    }

    // The little "↑ Enter" sign that pops up over your head at a door.
    this.enterPrompt = this.add
      .text(0, 0, '↑ Enter', {
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

    const tryEnter = () => {
      if (this.bulletin) return; // reading the board
      if (this.nearShop) this.enterShop(this.nearShop, this.player.x);
      else if (this.nearBoard) this.readBoard();
    };
    for (const key of ['UP', 'W', 'E']) this.input.keyboard.on(`keydown-${key}`, tryEnter);
  }

  enterShop(shop, x) {
    if (this.menu.busy || this.bulletin) return;
    // The photo booth has a scene of its own; the rest share the Shop scene.
    if (shop.scene) travel(this, shop.scene, { x });
    else travel(this, 'Shop', { shopKey: shop.id, x });
  }

  // The bulletin board (StreetProps.js) shows "coming soon" news
  // (src/data/comingSoon.js). Click it, or stand by it and press Up/W/E.
  addBulletinBoard(board) {
    this.boardX = board?.x ?? null;
    if (!board) return;
    board.setInteractive({ useHandCursor: true });
    board.on('pointerover', () => board.setTint(0xfff0d8));
    board.on('pointerout', () => board.clearTint());
    board.on('pointerdown', () => this.readBoard());
    // Esc closes it (the corner menu listens to Esc too, but it has nothing open)
    this.input.keyboard.on('keydown-ESC', () => this.bulletin?.close());
  }

  readBoard() {
    if (this.menu.busy || this.bulletin) return;
    this.bulletin = new BulletinPanel(this, { onClose: () => (this.bulletin = null) });
  }

  // Which shop's door (or the board) you're standing at, and show the prompt there.
  updateDoorPrompt() {
    const busy = this.menu.busy || this.bulletin;
    const near = busy
      ? null
      : this.shops.find(({ shop }) => Math.abs(this.player.x - (shop.x + (shop.doorX ?? 0))) < DOOR_RANGE);
    this.nearShop = near?.shop ?? null;
    this.nearBoard = !busy && !near && this.boardX !== null && Math.abs(this.player.x - this.boardX) < BOARD_RANGE;
    this.enterPrompt.setText(this.nearBoard ? '↑ Read' : '↑ Enter');
    this.enterPrompt.setVisible(Boolean(near) || this.nearBoard);
    if (near || this.nearBoard) this.enterPrompt.setPosition(Math.round(this.player.x), GROUND_Y - 44 + (Math.floor(this.time.now / 400) % 2));
  }

  update(time, delta) {
    this.player.canMove = !this.menu.busy && !this.bulletin; // stand still while a menu is open
    this.player.update(delta);
    this.updateDoorPrompt();
    gameState.update(delta); // idle coins tick up while the game runs
  }
}
