import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT } from '../config.js';
import CoinHud from '../ui/CoinHud.js';
import MenuList from '../ui/MenuList.js';
import { TEXT, showToast } from '../ui/Dialog.js';
import { gameState } from '../state/gameState.js';
import { preloadLook, buildLook, setLookFrame } from '../objects/CharacterLook.js';
import { travel, arrive } from './travel.js';

// The photo booth, on the street where the matcha shop used to be.
// Free to use: pick a backdrop, strike a pose, and snap a photo of your pal
// (in whatever they're wearing). The photo downloads as a PNG with a
// little instant-camera frame around it.
//
// Keyboard: Up/Down picks a row, Left/Right (or Enter) changes it,
// Enter on "Snap photo!" takes the picture, Esc leaves.
// Mouse: click a row to change it.
//
// Started from the street with: travel(this, 'PhotoBooth', { x: player.x })

// The backdrops. `key` = public/assets/<key>.png, drawn by
// tools/art/photobooth.js. Add your own there, then list it here.
const BACKDROPS = [
  { key: 'backdrop-dusk', name: 'Dusk woods' },
  { key: 'backdrop-lanterns', name: 'Lanterns' },
  { key: 'backdrop-cafe', name: 'Cozy cafe' },
  { key: 'backdrop-starry', name: 'Starry sky' },
  { key: 'backdrop-flowers', name: 'Flowers' },
];

// Poses, made from your pal's own sprites: `frame` 0 = standing,
// 2 = mid-step. `y` lifts them off the floor, `angle` tilts, `flip` turns.
const POSES = [
  { name: 'Stand', frame: 0 },
  { name: 'Strut', frame: 2 },
  { name: 'Hop', frame: 0, y: -12 },
  { name: 'Lean', frame: 0, angle: -8 },
  { name: 'Turn', frame: 0, flip: true },
];

// Faces swap your eyes for one of the creator's eye styles for the photo
// (null = your usual eyes).
const FACES = [
  { name: 'Mine', eyes: null },
  { name: 'Happy', eyes: 'happy' },
  { name: 'Starry', eyes: 'sparkle' },
  { name: 'Sleepy', eyes: 'sleepy' },
];

// Little doodles around your pal. `frame` = which picture in
// booth-stickers.png (0 heart, 1 sparkle, 2 note, 3 zzz, 4 flower).
const STICKERS = [
  { name: 'None', frame: null },
  { name: 'Hearts', frame: 0 },
  { name: 'Sparkles', frame: 1 },
  { name: 'Music', frame: 2 },
  { name: 'Zzz', frame: 3 },
  { name: 'Flowers', frame: 4 },
];

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

// Where the stickers float, measured from your pal's feet.
const STICKER_SPOTS = [
  [-42, -112],
  [40, -100],
  [-50, -60],
  [48, -48],
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
  }

  create(data) {
    this.returnX = data.x ?? 300;
    // What's picked right now (indexes into the lists above).
    this.pick = { backdrop: 0, pose: 0, face: 0, sticker: 0, frame: 0 };

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
      .text(FRAME_X + FRAME_W / 2, PHOTO_Y + PHOTO_H + BORDER_BOTTOM / 2, '', { ...TEXT, fontSize: '12px' })
      .setOrigin(0.5, 0.5);
    this.backdrop = this.add.image(PHOTO_X, PHOTO_Y, BACKDROPS[0].key).setOrigin(0, 0).setScale(SCALE);

    // a soft shadow under your pal, then your pal
    this.shadow = this.add.ellipse(PHOTO_X + PHOTO_W / 2, FLOOR_Y, 54, 10, 0x0d0a12, 0.3);
    this.pal = this.add.container(PHOTO_X + PHOTO_W / 2, FLOOR_Y).setScale(SCALE);

    // stickers bob gently up and down
    this.stickers = STICKER_SPOTS.map(([dx, dy], i) => {
      const s = this.add.sprite(this.pal.x + dx, this.pal.y + dy, 'booth-stickers', 0).setScale(2).setVisible(false);
      this.tweens.add({ targets: s, y: s.y - 3, duration: 900 + i * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return s;
    });

    // Anything outside the photo (a hopping ear, a sticker) is cut off.
    const mask = this.make.graphics({}, false).fillRect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H).createGeometryMask();
    for (const obj of [this.backdrop, this.shadow, this.pal, ...this.stickers]) obj.setMask(mask);

    this.updatePhoto();
  }

  // Redraw the photo to match what's picked.
  updatePhoto() {
    const backdrop = BACKDROPS[this.pick.backdrop];
    const pose = POSES[this.pick.pose];
    const face = FACES[this.pick.face];
    const sticker = STICKERS[this.pick.sticker];
    const frame = FRAMES[this.pick.frame];

    this.backdrop.setTexture(backdrop.key);

    const look = gameState.look;
    if (face.eyes) look.eyes = face.eyes;
    setLookFrame(buildLook(this.pal, look), pose.frame);
    this.pal.y = FLOOR_Y + (pose.y ?? 0);
    this.pal.angle = pose.angle ?? 0;
    this.pal.scaleX = pose.flip ? -SCALE : SCALE;
    this.shadow.setScale(pose.y ? 0.7 : 1); // smaller shadow while hopping

    this.stickers.forEach((s) => {
      s.setVisible(sticker.frame !== null);
      if (sticker.frame !== null) s.setFrame(sticker.frame);
    });

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
      { label: 'Extra', field: 'sticker', list: STICKERS },
      { label: 'Frame', field: 'frame', list: FRAMES },
    ];
    const rows = [
      ...this.options.map((opt) => ({ label: this.optionLabel(opt), option: opt, action: () => this.change(1) })),
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
      .text(MENU_X + MENU_W / 2, this.menu.bottom + 6, '← → to change\nFree to use!', {
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
    this.updatePhoto();
  }

  // ---------- taking the photo ----------

  snap() {
    if (this.snapping) return;
    this.snapping = true;
    // Copy the frame + photo straight off the game's canvas...
    this.game.renderer.snapshotArea(FRAME_X - 1, FRAME_Y - 1, FRAME_W + 2, FRAME_H + 2, (image) => {
      download(image);
      // ...then flash, so the flash isn't in the picture.
      const flash = this.add.rectangle(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, 0xffffff, 0.9).setOrigin(0, 0);
      this.tweens.add({ targets: flash, alpha: 0, duration: 380, onComplete: () => flash.destroy() });
      showToast(this, 'Snap! Your photo is in your downloads');
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
    link.download = `paw-pal-photo-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, 'image/png');
}
