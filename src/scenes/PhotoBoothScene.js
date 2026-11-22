import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT } from '../config.js';
import CoinHud from '../ui/CoinHud.js';
import MenuList from '../ui/MenuList.js';
import { TEXT, showToast } from '../ui/Dialog.js';
import { gameState } from '../state/gameState.js';
import { preloadLook, buildLook, setLookFrame } from '../objects/CharacterLook.js';
import { travel, arrive } from './travel.js';

// The photo booth, on the street where the matcha shop used to be.
// Free to use: pick a backdrop, strike a pose, stick on hearts, sparkles
// and plants wherever you like, and snap a photo of your pal (in whatever
// they're wearing). The photo downloads as a PNG with a little
// instant-camera frame around it.
//
// Keyboard: Up/Down picks a row, Left/Right (or Enter) changes it,
// Enter on "Snap photo!" takes the picture, Esc leaves.
// Mouse: click a row to change it. Drag stickers around the photo;
// drag one off the photo to throw it away.
//
// Started from the street with: travel(this, 'PhotoBooth', { x: player.x })

// The backdrops. `key` = public/assets/<key>.png, drawn by
// tools/art/photobooth.js. Add your own there, then list it here.
const BACKDROPS = [
  { key: 'backdrop-dusk', name: 'Dusk woods' },
  { key: 'backdrop-studio', name: 'Pink studio' },
  { key: 'backdrop-lanterns', name: 'Lanterns' },
  { key: 'backdrop-cafe', name: 'Cozy cafe' },
  { key: 'backdrop-starry', name: 'Starry sky' },
  { key: 'backdrop-flowers', name: 'Flowers' },
];

// Poses. `frame` = which body frame (0 standing, 3 mid-step: a kicked leg).
// `arms` = [sheet, frame]: posing arms in place of the usual ones, drawn in
// tools/art/character.js (poseArms / poseArms2):
//   player-arms-pose:  0 wave, 1 hands up, 2 cheeks, 3 peace sign, 4 neko paws
//   player-arms-pose2: 0 heart hands
// `arms: 'hidden'` tucks the hands behind the back.
// `y` lifts them off the floor, `angle` tilts their head to one side,
// `flip` turns them around.
const POSES = [
  { name: 'Stand', frame: 0 },
  { name: 'Peace!', frame: 0, arms: ['player-arms-pose', 3], angle: -6 },
  { name: 'Neko paws', frame: 0, arms: ['player-arms-pose', 4] },
  { name: 'Heart hands', frame: 0, arms: ['player-arms-pose2', 0] },
  { name: 'Squish', frame: 0, arms: ['player-arms-pose', 2], angle: 5 },
  { name: 'Hi hi!', frame: 0, arms: ['player-arms-pose', 0] },
  { name: 'Shy', frame: 0, arms: 'hidden', angle: -5, flip: true },
  { name: 'Hop!', frame: 3, arms: ['player-arms-pose', 1], y: -14 },
];
const ARM_SHEETS = ['player-arms-pose', 'player-arms-pose2'];

// Faces swap your eyes for another eye style for the photo
// (null = the eyes you picked in the character creator).
// `mark` = a booth-stickers.png frame that pops up by your pal's head.
const FACES = [
  { name: 'Just me', eyes: null },
  { name: 'Happy', eyes: 'happy' },
  { name: 'Starry', eyes: 'sparkle' },
  { name: 'Sleepy', eyes: 'sleepy' },
  { name: 'Grumpy', eyes: 'angry', mark: 10 },
];
const MARK_SPOT = [12, -36]; // where the mark sits, in your pal's own pixels from their feet

// Stickers you can put anywhere on the photo. `frame` = which picture in
// booth-stickers.png (same order as STICKERS in tools/art/photobooth.js).
const STICKERS = [
  { name: 'Heart', frame: 0 },
  { name: 'Sparkle', frame: 1 },
  { name: 'Twinkles', frame: 2 },
  { name: 'Star', frame: 3 },
  { name: 'Music', frame: 4 },
  { name: 'Zzz', frame: 5 },
  { name: 'Daisy', frame: 6 },
  { name: 'Sprout', frame: 7 },
  { name: 'Mushroom', frame: 8 },
  { name: 'Bow', frame: 9 },
];
const MAX_STICKERS = 24;
const STICKER_SCALE = 2;

// Frame colors: the border, its darker edge, and the caption's text color.
const FRAMES = [
  { name: 'Cream', color: 0xf2ead8, edge: 0xc8b896, text: '#5a4a40' },
  { name: 'Rose', color: 0xe8b4bc, edge: 0xb07e8a, text: '#5a3048' },
  { name: 'Sage', color: 0xb8c8a8, edge: 0x7f9c78, text: '#33452f' },
  { name: 'Night', color: 0x45375e, edge: 0x2a2140, text: '#f2ead8' },
];

// Where things go on screen.
const MENU_X = 4;
const MENU_Y = 36; // just under the coin counter
const MENU_W = 150;
const SCALE = 3; // backdrops (80 x 60) and your pal are drawn 3x
const PHOTO_W = 80 * SCALE;
const PHOTO_H = 60 * SCALE;
const BORDER = 10; // frame thickness...
const BORDER_BOTTOM = 26; // ...with a wider strip at the bottom for the caption
const FRAME_W = PHOTO_W + BORDER * 2;
const FRAME_H = PHOTO_H + BORDER + BORDER_BOTTOM;
const FRAME_X = Math.round(MENU_X + MENU_W + (GAME_WIDTH - MENU_X - MENU_W - FRAME_W) / 2);
const FRAME_Y = Math.round((GAME_HEIGHT - FRAME_H) / 2);
const PHOTO_X = FRAME_X + BORDER;
const PHOTO_Y = FRAME_Y + BORDER;
const FLOOR_Y = PHOTO_Y + 53 * SCALE; // where your pal's feet go
const DOWNLOAD_SCALE = 4; // the saved PNG is 4x the game's pixels (crisp, not blurry)

// Where new stickers land (measured from the middle of the photo's floor),
// around your pal's head first, then anywhere.
const STICKER_SPOTS = [
  [-44, -118],
  [42, -104],
  [-54, -64],
  [52, -50],
  [-20, -138],
  [26, -140],
  [-90, -20],
  [90, -26],
];

export default class PhotoBoothScene extends Phaser.Scene {
  constructor() {
    super('PhotoBooth');
  }

  preload() {
    CoinHud.preload(this);
    preloadLook(this);
    for (const b of BACKDROPS) this.load.image(b.key, `assets/${b.key}.png`);
    this.load.spritesheet('booth-stickers', 'assets/booth-stickers.png', { frameWidth: 12, frameHeight: 12 });
    for (const key of [...ARM_SHEETS, 'player-eyes-angry']) {
      this.load.spritesheet(key, `assets/${key}.png`, { frameWidth: 32, frameHeight: 40 });
    }
  }

  create(data) {
    this.returnX = data.x ?? 300;
    // What's picked right now (indexes into the lists above).
    this.pick = { backdrop: 0, pose: 0, face: 0, sticker: 0, frame: 0 };
    this.placed = []; // stickers on the photo

    this.drawRoom();
    this.hud = new CoinHud(this);
    this.drawPhoto();
    this.openMenu();

    const keys = { UP: -1, W: -1, DOWN: 1, S: 1 };
    for (const [key, step] of Object.entries(keys)) this.input.keyboard.on(`keydown-${key}`, () => this.menu.move(step));
    const sideKeys = { LEFT: -1, A: -1, RIGHT: 1, D: 1 };
    for (const [key, dir] of Object.entries(sideKeys)) this.input.keyboard.on(`keydown-${key}`, () => this.change(dir));
    for (const key of ['ENTER', 'SPACE']) this.input.keyboard.on(`keydown-${key}`, () => this.menu.choose());
    this.input.keyboard.on('keydown-ESC', () => this.leave());

    arrive(this);
  }

  // ---------- the booth around you ----------

  // A plum curtain with a scalloped top and warm light, behind everything.
  drawRoom() {
    const g = this.add.graphics();
    g.fillStyle(0x1f1828, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (let x = 0; x < GAME_WIDTH; x += 12) {
      g.fillStyle(0x3a2e50, 1).fillRect(x, 0, 7, GAME_HEIGHT);
      g.fillStyle(0x45375e, 1).fillRect(x + 1, 0, 4, GAME_HEIGHT);
    }
    // the valance along the top, with a gold trim
    g.fillStyle(0x5a3048, 1).fillRect(0, 0, GAME_WIDTH, 10);
    for (let x = 0; x < GAME_WIDTH; x += 16) g.fillCircle(x + 8, 10, 8);
    g.fillStyle(0xd9a646, 1).fillRect(0, 1, GAME_WIDTH, 1);
    // floor
    g.fillStyle(0x33241f, 1).fillRect(0, GAME_HEIGHT - 14, GAME_WIDTH, 14);
    g.fillStyle(0x45302a, 1).fillRect(0, GAME_HEIGHT - 14, GAME_WIDTH, 2);
    // a soft pool of light on the photo
    this.add
      .ellipse(FRAME_X + FRAME_W / 2, FRAME_Y + FRAME_H / 2, FRAME_W + 70, FRAME_H + 50, 0xf5b35a, 0.12)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  // ---------- the photo ----------

  drawPhoto() {
    // the frame (redrawn when you change its color)
    this.frame = this.add.graphics();
    this.caption = this.add
      .text(FRAME_X + FRAME_W / 2, PHOTO_Y + PHOTO_H + BORDER_BOTTOM / 2, '', { ...TEXT, fontSize: '10px' })
      .setOrigin(0.5, 0.5);
    this.backdrop = this.add.image(PHOTO_X, PHOTO_Y, BACKDROPS[0].key).setOrigin(0, 0).setScale(SCALE);

    // a soft shadow under your pal, then your pal
    this.shadow = this.add.ellipse(PHOTO_X + PHOTO_W / 2, FLOOR_Y, 54, 10, 0x0d0a12, 0.3);
    this.pal = this.add.container(PHOTO_X + PHOTO_W / 2, FLOOR_Y).setScale(SCALE);

    // Anything poking out of the photo (a tilted ear, a sticker) is cut off.
    this.photoMask = this.make.graphics({}, false).fillRect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H).createGeometryMask();
    for (const obj of [this.backdrop, this.shadow, this.pal]) obj.setMask(this.photoMask);

    // Dragging stickers: they follow the pointer, and land back inside the
    // photo, unless you let go outside it (then they're thrown away).
    this.input.on('drag', (pointer, obj, x, y) => obj.setPosition(Math.round(x), Math.round(y)));
    this.input.on('dragend', (pointer, obj) => {
      const inside = Phaser.Geom.Rectangle.Contains(this.photoRect, pointer.x, pointer.y);
      if (inside) obj.setPosition(this.clampX(obj.x), this.clampY(obj.y));
      else this.removeSticker(obj);
    });
    this.photoRect = new Phaser.Geom.Rectangle(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);

    this.updatePhoto();
  }

  // Redraw the photo to match what's picked.
  updatePhoto() {
    const backdrop = BACKDROPS[this.pick.backdrop];
    const pose = POSES[this.pick.pose];
    const face = FACES[this.pick.face];
    const frame = FRAMES[this.pick.frame];

    this.backdrop.setTexture(backdrop.key);

    const look = gameState.look;
    if (face.eyes) look.eyes = face.eyes;
    const pairs = buildLook(this.pal, look);
    setLookFrame(pairs, pose.frame);
    if (pose.arms) {
      // swap the usual arms for posing arms (or hide them)
      for (const [tinted, fixed] of pairs) {
        // long sleeves, mittens... are drawn for hanging arms, so hide them
        if (tinted.isArm) {
          tinted.setVisible(false);
          fixed.setVisible(false);
          continue;
        }
        if (tinted.texture.key !== 'player-arms') continue;
        if (pose.arms === 'hidden') {
          tinted.setVisible(false);
          fixed.setVisible(false);
          continue;
        }
        const [sheet, armFrame] = pose.arms;
        tinted.setTexture(sheet, armFrame);
        fixed.setTexture(sheet, armFrame + 5);
        // raised hands go in front of hair and ears
        this.pal.bringToTop(tinted);
        this.pal.bringToTop(fixed);
      }
    }
    this.pal.y = FLOOR_Y + (pose.y ?? 0);
    this.pal.angle = pose.angle ?? 0;
    this.pal.scaleX = pose.flip ? -SCALE : SCALE;
    this.shadow.setScale(pose.y ? 0.7 : 1); // smaller shadow while hopping
    if (face.mark !== undefined) {
      // e.g. a little anger mark by a grumpy pal's head (it moves with them)
      this.pal.add(this.add.sprite(MARK_SPOT[0], MARK_SPOT[1], 'booth-stickers', face.mark).setScale(2 / 3)); // 2 screen pixels per sticker pixel, same as placed stickers
    }

    // the frame: a border with a darker edge, a thin line around the photo,
    // and a tiny paw stamp in the corner
    const g = this.frame.clear();
    g.fillStyle(frame.edge, 1).fillRect(FRAME_X - 1, FRAME_Y - 1, FRAME_W + 2, FRAME_H + 2);
    g.fillStyle(frame.color, 1).fillRect(FRAME_X, FRAME_Y, FRAME_W, FRAME_H);
    g.fillStyle(frame.edge, 1).fillRect(PHOTO_X - 1, PHOTO_Y - 1, PHOTO_W + 2, PHOTO_H + 2);
    const px = FRAME_X + FRAME_W - 16;
    const py = PHOTO_Y + PHOTO_H + 9;
    g.fillStyle(frame.edge, 1).fillCircle(px, py + 3, 3);
    for (const [ox, oy] of [[-4, -2], [-1, -4], [2, -4], [5, -2]]) g.fillRect(px + ox - 1, py + oy - 1, 2, 2);

    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    this.caption.setText(`${look.name} · ${date}`).setColor(frame.text);
  }

  // ---------- the menu ----------

  // Rows that change something have `list` (what to pick from) and `field`.
  openMenu(selected = 0) {
    this.options = [
      { label: 'Scene', field: 'backdrop', list: BACKDROPS },
      { label: 'Pose', field: 'pose', list: POSES },
      { label: 'Face', field: 'face', list: FACES },
      { label: 'Frame', field: 'frame', list: FRAMES },
      { label: 'Sticker', field: 'sticker', list: STICKERS },
    ];
    const rows = [
      ...this.options.map((opt) => ({ label: this.optionLabel(opt), option: opt, action: () => this.change(1) })),
      { label: '+ Add sticker', action: () => this.addSticker() },
      { label: 'Clear stickers', action: () => this.clearStickers() },
      { label: 'Snap photo!', action: () => this.snap() },
      { label: 'Leave', action: () => this.leave() },
    ];
    this.menu = new MenuList(this, {
      x: MENU_X,
      y: MENU_Y,
      width: MENU_W,
      title: 'Photo Booth',
      rows,
      onCancel: () => this.leave(),
      selected,
    });
    this.add
      .text(MENU_X + MENU_W / 2, this.menu.bottom + 5, '← → to change. Drag stickers\naround, or off the photo\nto remove them. Free to use!', {
        ...TEXT,
        fontFamily: FONT,
        fontSize: '10px',
        color: '#d2c7b0',
        align: 'center',
      })
      .setOrigin(0.5, 0);
  }

  optionLabel(opt) {
    return `${opt.label}: ${opt.list[this.pick[opt.field]].name}`;
  }

  // Step the selected row's choice left (-1) or right (+1).
  change(dir) {
    const row = this.menu.rows[this.menu.index];
    const opt = row?.option;
    if (!opt || this.snapping) return;
    const n = opt.list.length;
    this.pick[opt.field] = (this.pick[opt.field] + dir + n) % n;
    this.menu.parts[this.menu.index].label.setText(this.optionLabel(opt));
    if (opt.field !== 'sticker') this.updatePhoto(); // the sticker row only picks which one to add
  }

  // ---------- stickers ----------

  // Pop the picked sticker onto the photo, at the next free spot.
  addSticker() {
    if (this.placed.length >= MAX_STICKERS) {
      showToast(this, 'That\'s a lot of stickers! Clear some first');
      return;
    }
    const n = this.placed.length;
    const [dx, dy] = STICKER_SPOTS[n] ?? [Phaser.Math.Between(-100, 100), Phaser.Math.Between(-150, -10)];
    const x = this.clampX(PHOTO_X + PHOTO_W / 2 + dx);
    const y = this.clampY(FLOOR_Y + dy);
    const s = this.add.sprite(x, y, 'booth-stickers', STICKERS[this.pick.sticker].frame).setScale(0);
    s.setInteractive({ useHandCursor: true, draggable: true });
    s.on('pointerover', () => s.setTint(0xfff0d8));
    s.on('pointerout', () => s.clearTint());
    s.on('dragstart', () => this.children.bringToTop(s)); // the one you hold goes on top
    this.tweens.add({ targets: s, scale: STICKER_SCALE, duration: 160, ease: 'Back.easeOut' });
    this.placed.push(s);
  }

  removeSticker(s) {
    this.placed = this.placed.filter((p) => p !== s);
    this.tweens.add({ targets: s, scale: 0, duration: 120, onComplete: () => s.destroy() });
  }

  clearStickers() {
    for (const s of [...this.placed]) this.removeSticker(s);
  }

  // Keep a sticker's middle inside the photo.
  clampX(x) {
    return Phaser.Math.Clamp(Math.round(x), PHOTO_X + 8, PHOTO_X + PHOTO_W - 8);
  }

  clampY(y) {
    return Phaser.Math.Clamp(Math.round(y), PHOTO_Y + 8, PHOTO_Y + PHOTO_H - 8);
  }

  // ---------- taking the photo ----------

  snap() {
    if (this.snapping) return;
    this.snapping = true;
    this.toast?.destroy(); // the last "Snap!" note would cover the bottom of the frame
    // Copy the frame + photo straight off the game's canvas...
    this.game.renderer.snapshotArea(FRAME_X - 1, FRAME_Y - 1, FRAME_W + 2, FRAME_H + 2, (image) => {
      download(image);
      // ...then flash, so the flash isn't in the picture.
      const flash = this.add.rectangle(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, 0xffffff, 0.9).setOrigin(0, 0);
      this.tweens.add({ targets: flash, alpha: 0, duration: 380, onComplete: () => flash.destroy() });
      this.toast = showToast(this, 'Snap! Your photo is in your downloads');
      this.time.delayedCall(500, () => (this.snapping = false));
    });
  }

  leave() {
    travel(this, 'Street', { x: this.returnX });
  }
}

// Blow the snapshot up with sharp pixels (no blur) and save it as a PNG.
function download(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width * DOWNLOAD_SCALE;
  canvas.height = image.height * DOWNLOAD_SCALE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  canvas.toBlob((blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `my-cozy-market-photo-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, 'image/png');
}
