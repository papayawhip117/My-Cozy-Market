import Phaser from 'phaser';
import { COLORS, FONT, FIXTURE_ART } from '../config.js';
import Player from '../objects/Player.js';
import CoinHud from '../ui/CoinHud.js';
import CornerMenu from '../ui/CornerMenu.js';
import HomeDecorator from '../ui/HomeDecorator.js';
import { woodButton, UI_DEPTH, pinToScreen } from '../ui/Dialog.js';
import { drawRoom, wallInfo, screenToFloor, floorToScreen, fromFloor, footprintAt, nearestWalkable, walkStep, setLayout, houseBounds, UNITS } from '../world/IsoRoom.js';
import { gameState } from '../state/gameState.js';
import { FOOTPRINT, isoTexture, WALL_ART, wallArtTexture } from '../data/furniture.js';
import { STAIRS, isStairs, stairProgress, stairSpot, GO_UP_AT, GO_DOWN_AT } from '../data/stairs.js';
import { DOORS, doorTexture } from '../data/homeStyles.js';
import { travel, arrive } from './travel.js';

// Inside your home: a cozy living room, a little entryway where the front
// door is (you arrive there), and a lower room down three steps. Walk around
// with the arrow keys (or WASD), and press "Decorate" (or B) to arrange your
// furniture, plants and rugs anywhere you like, paint them in new colors, and
// put up wallpaper, flooring and a new front door. All of that lives in
// src/ui/HomeDecorator.js; the house's shape is in src/world/IsoRoom.js.
//
// The door takes you back to town, and the dresser opens the character
// creator (stand next to either and press E, or click it). Like the
// furniture, the door, windows and dresser can be moved and painted in
// decorate mode.
//
// Rooms bought at Timber & Twig join on to the house (decorate mode, Rooms
// tab: src/ui/RoomEditor.js). A big house is zoomed out so all of it is on
// screen at once (setupCamera). With a top floor, the Up button (or U), or
// walking up tall stairs from Timber & Twig (src/data/stairs.js) that stand
// in the living room, takes you up there (this.level: 0 downstairs, 1
// upstairs); upstairs, those stairs show as an opening in the floor you can
// walk back down.

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
    // front door styles (tools/art/homeStyles.js)
    for (const id of Object.keys(DOORS)) if (doorTexture(id) !== FIXTURE_ART.door) this.load.image(doorTexture(id), `assets/${doorTexture(id)}.png`);
    // 3D furniture and floor plants (tools/art/furniture.js)
    for (const id of Object.keys(FOOTPRINT)) if (!FIXTURE_ART[id]) this.load.image(isoTexture(id), `assets/${isoTexture(id)}.png`);
    // curtains and hanging plants (tools/art/furniturePack.js)
    for (const id of Object.keys(WALL_ART)) this.load.image(wallArtTexture(id), `assets/${wallArtTexture(id)}.png`);
    Player.preload(this);
    CoinHud.preload(this);
    CornerMenu.preload(this);
  }

  // data.returnX = where you were standing on the street, so Town can put you back.
  // data.x, data.y = where to stand (coming back from the dresser).
  create(data) {
    this.returnX = data.returnX;
    this.level = 0; // you always come in downstairs
    this.lift = 0; // how high she is on stairs
    this.stairLockUntil = 0; // (after changing floors, don't change straight back)
    this.changingLevel = false;
    this.uiCam = this.cameras.add(0, 0, 480, 270); // draws the panels and buttons; the main camera zooms to fit the house
    setLayout(gameState.roomRects, this.level);
    this.room = drawRoom(this, gameState.homeStyle);

    this.player = new Player(this, 0);
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
    this.decorator = new HomeDecorator(this, this.level);
    this.windowLight = this.add.graphics().setDepth(3.5); // moonlight spilling in through each window
    // the door, windows and dresser are placed things too; clicking the door or dresser uses it
    this.decorator.onUse = (data) => (data.id === 'door' ? this.useDoor() : data.id === 'dresser' ? this.useDresser() : null);
    this.decorator.onRestyle = () => this.redraw();
    this.decorator.onLayout = () => this.relayout();
    // You start just inside the front door (or back where you were, coming from the dresser).
    const start = this.doorSpot();
    this.standAt(data.x ?? start.x, data.y ?? start.y);
    this.addDecorateButton();
    this.refreshFloorButton();
    this.addPrompt();
    this.setupCamera();
    this.syncCameras();

    this.input.keyboard.on('keydown-E', () => this.interact());
    this.input.keyboard.on('keydown-B', () => this.toggleDecorating());
    this.input.keyboard.on('keydown-U', () => gameState.hasTopFloor && !this.menu.busy && this.goToLevel(1 - this.level));
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.decorator.rooms.cancel()) return; // stop moving a room first
      if (this.decorator.pendingFloor) this.decorator.setPendingFloor(null); // stop laying flooring first
      else if (this.decorator.mode) this.toggleDecorating();
    });
    this.events.once('shutdown', () => this.decorator.destroy());
    arrive(this);
  }

  // ---------- the room ----------

  // Redraw the walls and floors (after new wallpaper or flooring).
  redraw() {
    this.room.destroy();
    this.room = drawRoom(this, gameState.homeStyle);
  }

  // A room was put up, moved or packed away: work out the new house shape,
  // redraw it, and put away anything left without a floor or wall. Returns
  // how many things went back to "Your things".
  relayout() {
    setLayout(gameState.roomRects, this.level);
    this.redraw();
    const stored = this.decorator.reconcile();
    this.windowLightKey = null;
    this.standAt(this.player.x, this.player.y);
    this.setupCamera();
    return stored;
  }

  // Go up to the top floor (1) or back down (0). `at` = where to stand, in
  // floor units (by default: the middle upstairs, by the front door downstairs).
  goToLevel(level, at = null) {
    if (level === this.level || (level === 1 && !gameState.hasTopFloor) || this.changingLevel) return;
    this.changingLevel = true;
    this.cameras.main.fadeOut(150, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.level = level;
      setLayout(gameState.roomRects, level);
      this.redraw();
      this.decorator.setLevel(level);
      this.drawStairwells();
      this.windowLightKey = null;
      if (at) this.standAtFloor(at.i, at.j);
      else {
        const spot = level === 1 ? floorToScreen(32, 40) : this.doorSpot();
        this.standAt(spot.x, spot.y);
      }
      this.refreshFloorButton();
      this.setupCamera();
      this.cameras.main.fadeIn(150, 0, 0, 0);
      this.stairLockUntil = this.time.now + 900;
      this.changingLevel = false;
    });
  }

  // ---------- stairs between floors ----------

  // Tall stairs (stairs-long, spiral) that stand in the living room, under
  // the top floor, lead up to it: [{ id, flip, box }].
  linkedStairs() {
    const out = [];
    for (const p of gameState.placed) {
      if ((p.level ?? 0) !== 0 || !isStairs(p.id) || !STAIRS[p.id].link) continue;
      const [a, b] = FOOTPRINT[p.id];
      const size = p.flip ? [b, a] : [a, b];
      const box = footprintAt(p.x, p.y, ...size, 0);
      const e = 0.6; // (rounding)
      if (box.i0 < -e || box.j0 < -e || box.i1 > UNITS + e || box.j1 > UNITS + e) continue;
      out.push({ id: p.id, flip: Boolean(p.flip), box });
    }
    return out;
  }

  // Upstairs: each of those stairs is an opening in the floor, with the
  // steps going down into it. (Drawn again whenever you come up.)
  drawStairwells() {
    this.holes?.destroy();
    this.holes = null;
    if (this.level !== 1) return;
    const g = this.add.graphics().setDepth(3);
    this.holes = g;
    const P = (i, j) => fromFloor(i, j);
    const quad = (pts, color) => g.fillStyle(color, 1).fillPoints(pts, true);
    for (const { id, flip, box } of this.linkedStairs()) {
      const { i0, j0, i1, j1 } = box;
      quad([P(i0, j0), P(i1, j0), P(i1, j1), P(i0, j1)], 0x0d0a12);
      if (STAIRS[id].spiral) {
        for (let k = 0; k < 4; k++) {
          const m = 1.4 * k;
          quad([P(i0 + m, j0 + m), P(i1 - m, j0 + m), P(i1 - m, j1 - m), P(i0 + m, j1 - m)], k % 2 ? 0x4a3a2c : 0x2a2018);
        }
        continue;
      }
      // the steps, from the top one (nearest the edge you climb up to) going down
      const n = STAIRS[id].steps;
      for (let k = 0; k < n; k++) {
        const t0 = k / n;
        const t1 = (k + 1) / n;
        const shade = [0x8a6a44, 0x7a5c3c, 0x6a4e34, 0x5a4230, 0x4a362a, 0x3a2c22, 0x2c2119, 0x1f1812][Math.min(k, 7)];
        if (flip) quad([P(i0 + 1, j0 + t0 * (j1 - j0)), P(i1 - 1, j0 + t0 * (j1 - j0)), P(i1 - 1, j0 + t1 * (j1 - j0)), P(i0 + 1, j0 + t1 * (j1 - j0))], shade);
        else quad([P(i0 + t0 * (i1 - i0), j0 + 1), P(i0 + t1 * (i1 - i0), j0 + 1), P(i0 + t1 * (i1 - i0), j1 - 1), P(i0 + t0 * (i1 - i0), j1 - 1)], shade);
      }
    }
  }

  // Walking on stairs: lifts your pal up the steps, and at the top of tall
  // stairs in the living room takes you up (or, upstairs, down the opening).
  // Returns how many pixels up she is.
  walkStairs(moving) {
    const { i, j } = this.spot;
    let target = 0;
    if (this.level === 0) {
      const on = this.decorator.stairsAt(i, j);
      target = on?.height ?? 0;
      if (moving && on && STAIRS[on.id].link && on.p > GO_UP_AT && gameState.hasTopFloor && this.time.now > this.stairLockUntil) {
        const l = this.linkedStairs().find((s) => stairProgress(s.id, s.flip, s.box, i, j) > GO_UP_AT);
        if (l) this.goToLevel(1, stairSpot(l.id, l.flip, l.box, 0.93));
      }
    } else if (moving && this.time.now > this.stairLockUntil) {
      const l = this.linkedStairs().find((s) => {
        const p = stairProgress(s.id, s.flip, s.box, i, j);
        return p !== null && p < GO_DOWN_AT;
      });
      if (l) this.goToLevel(0, stairSpot(l.id, l.flip, l.box, 0.72));
    }
    // she steps up and down smoothly
    this.lift += (target - this.lift) * 0.35;
    if (Math.abs(target - this.lift) < 0.4) this.lift = target;
    return Math.round(this.lift);
  }

  // The camera. The whole house is always on screen: a home that fits in the
  // normal 480 x 270 view is shown exactly like before; a bigger one is
  // zoomed out to fit (and centered below the coin sign). Panels, buttons
  // and the coin sign stay full size, because they're drawn by a second
  // camera (syncCameras).
  setupCamera() {
    const cam = this.cameras.main;
    const b = houseBounds();
    if (b.x >= 0 && b.y >= 0 && b.x + b.width <= 480 && b.y + b.height <= 270) {
      cam.setZoom(1).setScroll(0, 0);
      return;
    }
    const top = 36;
    const side = 10;
    const bottom = 8;
    const fit = Math.min(1, (480 - 2 * side) / b.width, (270 - top - bottom) / b.height);
    const zoom = Math.max(0.25, Math.floor(fit * 20) / 20); // (steps of 0.05 keep the pixels fairly even)
    cam.setZoom(zoom);
    // put the middle of the house in the middle of the free space
    cam.centerOn(b.x + b.width / 2, b.y + b.height / 2 - (top - bottom) / 2 / zoom);
  }

  // Everything pinned to the screen (scrollFactor 0: coin sign, buttons,
  // panels, toasts, dialogs) is drawn by the UI camera only, and everything
  // else by the world camera only. Run every frame, so new things are sorted
  // too (and things added to a pinned container later).
  syncCameras() {
    const worldId = this.cameras.main.id;
    const uiId = this.uiCam.id;
    const mark = (obj, ui) => {
      obj.cameraFilter |= ui ? worldId : uiId;
      if (obj.list) for (const child of obj.list) mark(child, ui);
    };
    for (const obj of this.children.list) mark(obj, obj.scrollFactorX === 0);
  }

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
    pinToScreen(this.decorateButton).setDepth(UI_DEPTH);
  }

  toggleDecorating() {
    if (this.menu.busy) return;
    const on = !this.decorator.mode;
    this.decorator.setMode(on);
    this.decorateButton.list[1].setText(on ? 'Done' : 'Decorate');
    this.refreshFloorButton();
  }

  // The Upstairs / Downstairs button, once you have a top floor.
  refreshFloorButton() {
    this.floorButton?.destroy();
    this.floorButton = null;
    if (!gameState.hasTopFloor) return;
    const up = this.level === 1;
    this.floorButton = woodButton(this, up ? '▼ Down' : '▲ Up', 316, 17, () => this.goToLevel(up ? 0 : 1), { width: 56, height: 20 });
    pinToScreen(this.floorButton).setDepth(UI_DEPTH);
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
    const door = this.decorator?.fixture('door') ?? { x: 92, y: 139 };
    const wall = wallInfo(door.x, door.y);
    return { x: door.x - wall.side * 12, y: wall.bottom + 10 };
  }

  // Put your pal on the nearest bit of floor to screen spot (x, y). Where she
  // stands is kept in floor units (this.spot), so walking down the steps
  // works; see src/world/IsoRoom.js.
  standAt(x, y) {
    const f = screenToFloor(x, y);
    this.standAtFloor(f.i, f.j);
  }

  // The same, from a spot in floor units.
  standAtFloor(i, j) {
    this.spot = nearestWalkable(i, j);
    this.lift = 0;
    const p = floorToScreen(this.spot.i, this.spot.j);
    this.player.setPosition(p.x, p.y);
  }

  // What you're standing next to, if anything.
  nearby() {
    const { x, y } = this.player;
    const spot = this.doorSpot();
    if (this.level === 0 && Phaser.Math.Distance.Between(x, y, spot.x, spot.y) < 30) return { label: 'E  Door', use: () => this.useDoor() };
    const dresser = this.decorator.fixture('dresser');
    if (dresser && Phaser.Math.Distance.Between(x, y, dresser.x, dresser.y + 4) < 30) return { label: 'E  Dresser', use: () => this.useDresser() };
    return null;
  }

  interact() {
    if (!this.menu.busy && !this.decorator.mode) this.nearby()?.use();
  }

  // ---------- walking ----------

  // A soft patch of pale light on the floor in front of each window (redrawn
  // only when a window moves, so it follows them in decorate mode).
  drawWindowLight() {
    const windows = [...this.decorator.objects.values()].filter((o) => o.data.id === 'window');
    const key = windows.map((o) => `${o.data.x},${o.data.y}`).join('|');
    if (key === this.windowLightKey) return;
    this.windowLightKey = key;
    const g = this.windowLight.clear();
    for (const w of windows) {
      const x = w.data.x;
      const wall = wallInfo(x, w.data.y);
      const left = wall.side < 0;
      const base = { x, y: wall.bottom };
      // along the wall, and straight out from it into the room (2:1 isometric steps)
      const along = left ? [2, -1] : [2, 1];
      const out = left ? [2, 1] : [-2, 1];
      for (const [scale, alpha] of [[1, 0.04], [0.6, 0.04]]) {
        const half = 7 * scale;
        const len = 12 * scale;
        const pts = [
          { x: base.x - along[0] * half, y: base.y - along[1] * half },
          { x: base.x + along[0] * half, y: base.y + along[1] * half },
          { x: base.x + along[0] * half + out[0] * len, y: base.y + along[1] * half + out[1] * len },
          { x: base.x - along[0] * half + out[0] * len, y: base.y - along[1] * half + out[1] * len },
        ];
        g.fillStyle(0xa8c8dc, alpha).fillPoints(pts, true);
      }
    }
  }

  update(time, delta) {
    this.syncCameras();
    this.drawWindowLight();
    const busy = this.menu.busy || this.decorator.mode;
    const k = this.keys;
    const dx = busy ? 0 : (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
    const dy = busy ? 0 : (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
    const player = this.player;

    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      const step = (WALK_SPEED * delta) / 1000;
      // the step on screen, turned into floor units (one unit = 2 pixels across, 1 down)
      const sx = (dx / len) * step;
      const sy = ((dy / len) * step) / 2;
      this.spot = walkStep(this.spot.i, this.spot.j, (sy + sx / 2) / 2, (sy - sx / 2) / 2);
      if (dx) player.scaleX = dx; // the art faces right; flip to face the way she walks
      this.walkTime += delta;
      player.setFrame(WALK_FRAMES[Math.floor(this.walkTime / WALK_FRAME_MS) % WALK_FRAMES.length]);
    } else {
      this.walkTime = 0;
      player.setFrame(0);
    }
    // (up on any stairs she's standing on)
    const lift = this.walkStairs(Boolean(dx || dy));
    const pos = floorToScreen(this.spot.i, this.spot.j);
    player.setPosition(pos.x, pos.y - lift);
    // stand in front of furniture you're past and behind furniture nearer the front
    this.feet.setTo(player.x - 9, player.y - 40, 18, 40);
    player.setDepth(this.decorator.playerDepth(this.spot.i, this.spot.j, this.feet));

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
