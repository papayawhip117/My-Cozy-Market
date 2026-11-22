import Phaser from 'phaser';
import { COLORS, FONT, FIXTURE_ART } from '../config.js';
import Player from '../objects/Player.js';
import CoinHud from '../ui/CoinHud.js';
import CornerMenu from '../ui/CornerMenu.js';
import HomeDecorator from '../ui/HomeDecorator.js';
import HomeMap from '../ui/HomeMap.js';
import { woodButton, UI_DEPTH, pinToScreen } from '../ui/Dialog.js';
import { drawRoom, wallInfo, screenToFloor, fromFloor, floorHeight, nearestWalkable, walkStep, setLayout, houseBounds, overviewZoom, VIEW_TOP, VIEW_BOTTOM } from '../world/IsoRoom.js';
import { gameState } from '../state/gameState.js';
import { FOOTPRINT, isoTexture, WALL_ART, wallArtTexture } from '../data/furniture.js';
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
// The home is one continuous place: the living room plus every room you've
// put up (decorate mode, Rooms tab: src/ui/RoomEditor.js), all on one grid.
// The Top Floor is just a room whose floor is raised. Rooms at different
// heights connect with stairs from Timber & Twig (src/data/stairs.js): your
// pal walks up and down them, no screen change.
//
// Everything is drawn at full size, always, so the pixel art stays crisp. A
// home bigger than the screen scrolls: the camera follows your pal, you can
// drag (or use the arrow keys) to look around while decorating, and the Map
// button (or N) shows a small overview of the whole home; click a room on it
// to look there. Only the Rooms tab has an optional zoom-out (in whole-number
// steps) for arranging rooms.

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
    this.lift = 0; // how high she is above the living room floor (on stairs, in raised or sunken rooms)
    this.uiCam = this.cameras.add(0, 0, 480, 270); // draws the panels and buttons (the main camera can zoom out in the Rooms tab)
    this.previewZoom = 1; // 1 = full size; less while previewing your rooms zoomed out
    setLayout(gameState.roomRects);
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
    this.map = new HomeMap(this, (x, y) => this.lookAt(x, y));
    this.decorator = new HomeDecorator(this);
    this.windowLight = this.add.graphics().setDepth(3.5); // moonlight spilling in through each window
    // the door, windows and dresser are placed things too; clicking the door or dresser uses it
    this.decorator.onUse = (data) => (data.id === 'door' ? this.useDoor() : data.id === 'dresser' ? this.useDresser() : null);
    this.decorator.onRestyle = () => this.redraw();
    this.decorator.onLayout = () => this.relayout();
    // You start just inside the front door (or back where you were, coming from the dresser).
    const start = this.doorSpot();
    this.standAt(data.x ?? start.x, data.y ?? start.y);
    this.addDecorateButton();
    this.addMapButton();
    this.addPrompt();
    this.setupCamera();
    this.syncCameras();

    this.input.keyboard.on('keydown-E', () => this.interact());
    this.input.keyboard.on('keydown-B', () => this.toggleDecorating());
    this.input.keyboard.on('keydown-N', () => !this.menu.busy && this.toggleMap());
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.map.visible) return this.toggleMap(); // close the map first
      if (this.decorator.rooms.cancel()) return; // stop moving a room first
      if (this.decorator.pendingFloor) this.decorator.setPendingFloor(null); // stop laying flooring first
      else if (this.decorator.mode) this.toggleDecorating();
    });
    this.events.once('shutdown', () => {
      this.decorator.destroy();
      this.map.destroy();
    });
    arrive(this);
  }

  // ---------- the room ----------

  // Redraw the walls and floors (after new wallpaper or flooring).
  redraw() {
    this.room.destroy();
    this.room = drawRoom(this, gameState.homeStyle, this.previewZoom);
  }

  // A room was put up, moved or packed away: work out the new house shape,
  // redraw it, and put away anything left without a floor or wall. Returns
  // how many things went back to "Your things".
  relayout() {
    setLayout(gameState.roomRects);
    if (this.previewZoom !== 1) this.previewZoom = overviewZoom(); // (the home got bigger or smaller)
    this.redraw();
    const stored = this.decorator.reconcile();
    this.windowLightKey = null;
    this.standAt(this.player.x, this.player.y);
    this.setupCamera();
    this.map.refresh();
    return stored;
  }

  // How high she stands at floor spot (i, j): on stairs, the steps; else the
  // floor (the lower room is down, a raised room up). In pixels above the
  // living room floor. Walking only works between spots this close in height.
  heightAt = (i, j) => this.decorator.stairsAt(i, j)?.elev ?? floorHeight(i, j);

  // The camera: always full size. A home that fits in the normal 480 x 270
  // view sits still, exactly like it always did; a bigger one scrolls: it
  // follows your pal, or (while decorating, or after you've picked a spot on
  // the Map) stays where you look. In the Rooms tab you can zoom out
  // (this.previewZoom, in whole-number steps) to see all of it.
  setupCamera() {
    const cam = this.cameras.main;
    const b = houseBounds();
    cam.setRoundPixels(true);
    this.fitsScreen = b.x >= 0 && b.y >= 0 && b.x + b.width <= 480 && b.y + b.height <= 270;
    if (this.fitsScreen) {
      this.previewZoom = 1;
      cam.stopFollow();
      cam.removeBounds();
      cam.setZoom(1).setScroll(0, 0);
      return;
    }
    const x0 = Math.min(0, b.x - 40);
    const y0 = Math.min(0, b.y - 44); // (room for the coin sign and buttons at the top)
    const x1 = Math.max(480, b.x + b.width + 40);
    const y1 = Math.max(270, b.y + b.height + 30);
    this.bounds = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    this.applyCamera();
  }

  // Follow your pal, or stay put (decorating, looking around, zoomed out).
  applyCamera() {
    const cam = this.cameras.main;
    if (this.fitsScreen) return;
    if (this.previewZoom !== 1) {
      const b = houseBounds();
      const even = (n) => 2 * Math.round(n / 2); // (whole pixels, so the art lines up with the screen's)
      cam.stopFollow();
      cam.removeBounds();
      cam.setZoom(this.previewZoom);
      cam.centerOn(even(b.x + b.width / 2), even(b.y + b.height / 2 - (VIEW_TOP - VIEW_BOTTOM) / 2 / this.previewZoom));
      return;
    }
    const was = { x: cam.scrollX, y: cam.scrollY };
    cam.setZoom(1);
    const { x, y, width, height } = this.bounds;
    cam.setBounds(x, y, width, height);
    if (this.decorator?.mode || this.lookingAround) {
      cam.stopFollow();
      cam.setScroll(was.x, was.y);
    } else cam.startFollow(this.player, true, 0.15, 0.15, 0, 20);
  }

  // Look at a spot in the home (from the Map): the camera stays there until you move.
  lookAt(x, y) {
    if (this.fitsScreen) return;
    this.lookingAround = true;
    const cam = this.cameras.main;
    cam.stopFollow();
    if (this.previewZoom !== 1) return;
    cam.pan(x, y, 250, 'Sine.easeInOut');
  }

  // Back to following your pal.
  stopLooking() {
    if (!this.lookingAround) return;
    this.lookingAround = false;
    this.applyCamera();
  }

  // The optional zoom-out in the Rooms tab (on = whole-number steps to fit the home).
  setPreview(on) {
    const zoom = on && !this.fitsScreen ? overviewZoom() : 1;
    if (zoom === this.previewZoom) return;
    this.previewZoom = zoom;
    this.redraw(); // (lines are drawn to suit the zoom)
    this.applyCamera();
  }

  toggleMap() {
    this.map.toggle();
    if (!this.map.visible) this.stopLooking();
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

  addMapButton() {
    this.mapButton = woodButton(this, 'Map', 316, 17, () => this.toggleMap(), { width: 44, height: 20 });
    pinToScreen(this.mapButton).setDepth(UI_DEPTH);
  }

  toggleDecorating() {
    if (this.menu.busy) return;
    const on = !this.decorator.mode;
    this.decorator.setMode(on);
    this.decorateButton.list[1].setText(on ? 'Done' : 'Decorate');
    if (!on) this.setPreview(false);
    this.lookingAround = false;
    this.applyCamera();
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
    this.lift = this.heightAt(this.spot.i, this.spot.j);
    const p = fromFloor(this.spot.i, this.spot.j);
    this.player.setPosition(p.x, p.y - this.lift);
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
    // decorating with nothing picked: the arrow keys (and WASD) look around the home
    if (this.decorator.mode && !this.decorator.selected && !this.menu.busy && !this.fitsScreen) {
      const px = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
      const py = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
      const cam = this.cameras.main;
      if (px || py) cam.setScroll(cam.scrollX + (px * 200 * delta) / 1000 / this.previewZoom, cam.scrollY + (py * 200 * delta) / 1000 / this.previewZoom);
    }
    const dx = busy ? 0 : (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
    const dy = busy ? 0 : (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
    const player = this.player;

    if (dx || dy) {
      if (this.lookingAround) this.stopLooking(); // walking brings the camera back to your pal
      const len = Math.hypot(dx, dy);
      const step = (WALK_SPEED * delta) / 1000;
      // the step on screen, turned into floor units (one unit = 2 pixels across, 1 down)
      const sx = (dx / len) * step;
      const sy = ((dy / len) * step) / 2;
      this.spot = walkStep(this.spot.i, this.spot.j, (sy + sx / 2) / 2, (sy - sx / 2) / 2, this.heightAt);
      if (dx) player.scaleX = dx; // the art faces right; flip to face the way she walks
      this.walkTime += delta;
      player.setFrame(WALK_FRAMES[Math.floor(this.walkTime / WALK_FRAME_MS) % WALK_FRAMES.length]);
    } else {
      this.walkTime = 0;
      player.setFrame(0);
    }
    // she steps up and down smoothly (stairs, raised and sunken floors)
    const target = this.heightAt(this.spot.i, this.spot.j);
    this.lift += (target - this.lift) * 0.35;
    if (Math.abs(target - this.lift) < 0.4) this.lift = target;
    const pos = fromFloor(this.spot.i, this.spot.j);
    player.setPosition(pos.x, pos.y - Math.round(this.lift));
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
    this.map.update(this.player, this.cameras.main);
    gameState.update(delta); // idle coins keep coming in at home too
  }
}
