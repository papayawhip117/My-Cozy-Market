import { COINS, PLAYER_LOOK, DEFAULT_FIXTURES } from '../config.js';
import { GLIMMERS } from '../data/economy.js';
import { localStorageBackend } from './storage.js';

// The game's memory: how many coins and Glimmers you have, what's in your
// backpack, what you're wearing and how your home looks.
//
// This is the ONE place that changes coins and Glimmers. Scenes, shops and
// the HUD never touch the numbers directly; they call addCoins/spendCoins
// (addGlimmers/spendGlimmers) and listen with onChange (onGlimmers). That
// keeps saving and the counters in sync.

// What a brand-new save looks like. Bump `version` if the shape changes,
// so old saves can be upgraded instead of breaking.
const NEW_SAVE = () => ({
  version: 6,
  coins: COINS.startingCoins,
  glimmers: 0, // the rarer currency (src/data/economy.js)
  // Time saved up toward the next Glimmers, so it isn't lost when you close the game.
  // passiveMs: toward the next passive Glimmer. activeMs: toward the next active
  // bonus. day + dayMs: how much active play has counted today (it's capped).
  glimmerTime: { passiveMs: 0, activeMs: 0, day: null, dayMs: 0 },
  inventory: [], // ids of things you own, like 'matcha-latte' (newest last)
  look: null, // how your character looks; null until you've made one
  // Furniture and plants you've put in your home. Each one is
  // { uid, id, x, y, flip, c1, c2 }: where it is (in the room's screen
  // coordinates), whether it's mirrored, and its two paint colors (null = original).
  // wallpaper, floors and doorStyle are ids from src/data/homeStyles.js
  // (null = what every home starts with). floors has one per room.
  home: { placed: [], storedWindows: 0, wallpaper: null, floors: { main: null, entry: null, lower: null }, doorStyle: null },
  lastSeen: null, // when the game was last open (ms since 1970)
});

// How far the house moved up the screen when the lower room got bigger.
const LIFT = 20;

class GameState {
  constructor(backend) {
    this.backend = backend;
    this.data = NEW_SAVE();
    this.listeners = new Set();
    this.glimmerListeners = new Set();
    this.lastInput = Date.now(); // when you last pressed a key or moved the mouse
    this.idleMs = 0; // time saved up toward the next idle tick
    this.saveMs = 0; // time since the last autosave
    // Filled in by collectOffline(): what you earned while away.
    this.welcomeBack = { earned: 0, glimmers: 0, seconds: 0 };
  }

  // ---------- reading ----------

  get coins() {
    return this.data.coins;
  }

  canAfford(price) {
    return this.data.coins >= price;
  }

  get glimmers() {
    return this.data.glimmers;
  }

  // A price in both currencies: { coins, glimmers } (see costOf in catalog.js).
  canAffordCost({ coins = 0, glimmers = 0 }) {
    return this.data.coins >= coins && this.data.glimmers >= glimmers;
  }

  // Call fn(coins, change, reason) whenever coins change.
  // Returns a function that stops listening (use it when a scene closes).
  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ---------- changing coins ----------

  // reason says where coins came from: 'idle', 'offline', 'gift'...
  addCoins(amount, reason = 'gift') {
    if (amount <= 0) return;
    this.data.coins += amount;
    this.emit(amount, reason);
  }

  // Returns true if you could afford it (and takes the coins), else false.
  spendCoins(amount, reason = 'shop') {
    if (!this.canAfford(amount)) return false;
    this.data.coins -= amount;
    this.emit(-amount, reason);
    this.save(); // spending is important, save right away
    return true;
  }

  emit(change, reason) {
    for (const fn of this.listeners) fn(this.data.coins, change, reason);
  }

  // ---------- changing Glimmers ----------

  // Call fn(glimmers, change, reason) whenever Glimmers change.
  // Returns a function that stops listening.
  onGlimmers(fn) {
    this.glimmerListeners.add(fn);
    return () => this.glimmerListeners.delete(fn);
  }

  // reason: 'passive', 'active', 'offline', 'sell'...
  addGlimmers(amount, reason = 'gift') {
    if (amount <= 0) return;
    this.data.glimmers += amount;
    this.emitGlimmers(amount, reason);
  }

  spendGlimmers(amount, reason = 'shop') {
    if (this.data.glimmers < amount) return false;
    this.data.glimmers -= amount;
    this.emitGlimmers(-amount, reason);
    this.save();
    return true;
  }

  emitGlimmers(change, reason) {
    for (const fn of this.glimmerListeners) fn(this.data.glimmers, change, reason);
  }

  // Pay a { coins, glimmers } price. Takes both or neither: returns false
  // (and takes nothing) if you can't afford all of it.
  payCost(cost) {
    if (!this.canAffordCost(cost)) return false;
    if (cost.coins) this.spendCoins(cost.coins);
    if (cost.glimmers) this.spendGlimmers(cost.glimmers);
    return true;
  }

  // ---------- your stuff (the backpack) ----------

  // A copy of the list, so nobody changes the real one by accident.
  get items() {
    return [...this.data.inventory];
  }

  hasItem(id) {
    return this.data.inventory.includes(id);
  }

  // Put something in the backpack (shops will call this after spendCoins).
  addItem(id) {
    this.data.inventory.push(id);
    this.save();
  }

  // Take one of something out of the backpack (selling it).
  // Returns false if you didn't have one.
  removeItem(id) {
    const i = this.data.inventory.lastIndexOf(id);
    if (i === -1) return false;
    this.data.inventory.splice(i, 1);
    this.save();
    return true;
  }

  // ---------- your home ----------

  // The things in your home (the real list: change items with the methods below).
  get placed() {
    return this.data.home.placed;
  }

  // How many of `id` are in your home right now (wallpaper, flooring and a
  // door style count while they're up, so you can't sell them off the walls).
  countPlaced(id) {
    const home = this.data.home;
    const up = (home.wallpaper === id ? 1 : 0) + (home.doorStyle === id ? 1 : 0) + (Object.values(home.floors).includes(id) ? 1 : 0);
    return this.placed.filter((p) => p.id === id && !p.fixed).length + up;
  }

  // ---------- wallpaper, flooring, front door ----------

  // The look of the house: { wallpaper, floors: { main, entry, lower }, doorStyle }.
  // Anything you no longer own goes back to how it started.
  get homeStyle() {
    const { wallpaper, floors, doorStyle } = this.data.home;
    const own = (id) => (id && this.hasItem(id) ? id : null);
    return {
      wallpaper: own(wallpaper),
      floors: { main: own(floors.main), entry: own(floors.entry), lower: own(floors.lower) },
      doorStyle: own(doorStyle),
    };
  }

  // Put up wallpaper (null = the starting wallpaper).
  setWallpaper(id) {
    this.data.home.wallpaper = id;
    this.save();
  }

  // Lay flooring in one room ('main', 'entry' or 'lower'; null = how it started).
  setFloor(room, id) {
    this.data.home.floors[room] = id;
    this.save();
  }

  // Change the front door (null = the starting door).
  setDoorStyle(id) {
    this.data.home.doorStyle = id;
    this.save();
  }

  // How many of `id` you own that are NOT in your home (so can be placed or sold).
  available(id) {
    return this.data.inventory.filter((i) => i === id).length - this.countPlaced(id);
  }

  // Put a thing from your backpack into the room. Returns the new placed item.
  placeItem(id, x, y) {
    if (this.available(id) < 1) return null;
    const item = { uid: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, id, x, y, flip: false, c1: null, c2: null };
    this.placed.push(item);
    this.save();
    return item;
  }

  // Change a placed item (position, flip, colors).
  updatePlaced(uid, patch) {
    const item = this.placed.find((p) => p.uid === uid);
    if (item) Object.assign(item, patch);
    this.save();
  }

  // Take a window down (the door and dresser can't be stored). It waits in
  // "Your things" until you put it up again.
  storeWindow(uid) {
    const i = this.placed.findIndex((p) => p.uid === uid && p.id === 'window');
    if (i === -1) return;
    this.placed.splice(i, 1);
    this.data.home.storedWindows++;
    this.save();
  }

  get storedWindows() {
    return this.data.home.storedWindows;
  }

  // Put a stored window back in the room. Returns the placed window, or null if none are stored.
  placeWindow(x, y) {
    if (this.data.home.storedWindows < 1) return null;
    this.data.home.storedWindows--;
    const item = { uid: `window-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, id: 'window', x, y, flip: false, c1: null, c2: null, fixed: true };
    this.placed.push(item);
    this.save();
    return item;
  }

  // Take a thing out of the room and back into your backpack.
  removePlaced(uid) {
    const i = this.placed.findIndex((p) => p.uid === uid);
    if (i !== -1) this.placed.splice(i, 1);
    this.save();
  }

  // ---------- your character ----------

  // True once you've been through the character creator.
  get hasCharacter() {
    return Boolean(this.data.look);
  }

  // How your character looks right now (PLAYER_LOOK in config.js fills
  // in anything missing). Clothes you've sold stop being worn.
  get look() {
    const look = { ...PLAYER_LOOK, ...this.data.look };
    if (look.ears === 'leaf') look.ears = 'wolf'; // leaf ears were replaced by wolf ears
    look.worn = { ...PLAYER_LOOK.worn, ...look.worn };
    for (const slot in look.worn) {
      if (look.worn[slot] && !this.hasItem(look.worn[slot])) look.worn[slot] = null;
    }
    return look;
  }

  // Save a new look (the character creator calls this).
  setLook(look) {
    this.data.look = { ...look, worn: { ...look.worn } };
    this.save();
  }

  // ---------- idle earning ----------

  // Call every frame with the milliseconds since the last frame.
  update(deltaMs) {
    this.idleMs += deltaMs;
    const tickMs = COINS.tickSeconds * 1000;
    while (this.idleMs >= tickMs) {
      this.idleMs -= tickMs;
      this.addCoins(COINS.perTick, 'idle');
    }

    this.updateGlimmers(deltaMs);

    this.saveMs += deltaMs;
    if (this.saveMs >= COINS.autosaveSeconds * 1000) this.save();
  }

  // Passive Glimmers come with time; the active bonus only while you're
  // really playing (see src/data/economy.js).
  updateGlimmers(deltaMs) {
    const t = this.data.glimmerTime;
    const passiveMs = 3600000 / GLIMMERS.passivePerHour; // one Glimmer every 12 minutes
    t.passiveMs += deltaMs;
    const passive = Math.floor(t.passiveMs / passiveMs);
    t.passiveMs -= passive * passiveMs;
    this.addGlimmers(passive, 'passive');

    // Active play: the tab is showing and you touched a key or the mouse lately.
    const now = Date.now();
    const playing = !document.hidden && now - this.lastInput < GLIMMERS.idleAfterSeconds * 1000;
    if (!playing) return;
    const today = new Date(now).toDateString();
    if (t.day !== today) Object.assign(t, { day: today, dayMs: 0 }); // a new day, a fresh cap
    const capMs = GLIMMERS.activeCapHours * 3600000;
    const counted = Math.min(Math.min(deltaMs, 1000), capMs - t.dayMs); // big jumps (a laggy frame) count as 1s at most
    if (counted <= 0) return;
    t.dayMs += counted;
    t.activeMs += counted;
    const stretchMs = GLIMMERS.activeMinutes * 60000;
    while (t.activeMs >= stretchMs) {
      t.activeMs -= stretchMs;
      this.addGlimmers(GLIMMERS.activeBonus, 'active');
    }
  }

  // Coins for time the game wasn't running (closed, or in a hidden tab).
  // Slower than playing, and capped so a week away isn't a fortune.
  // Passive Glimmers keep coming too (up to GLIMMERS.offlineCapHours' worth).
  collectOffline(now = Date.now()) {
    const { lastSeen } = this.data;
    if (!lastSeen || now <= lastSeen) return { earned: 0, glimmers: 0, seconds: 0 };

    const awayMs = now - lastSeen;
    const seconds = Math.min(awayMs / 1000, COINS.offlineCapHours * 3600);
    const earned = Math.floor((seconds / COINS.tickSeconds) * COINS.perTick * COINS.offlineRate);

    const t = this.data.glimmerTime;
    const passiveMs = 3600000 / GLIMMERS.passivePerHour;
    t.passiveMs += Math.min(awayMs, GLIMMERS.offlineCapHours * 3600000);
    const glimmers = Math.floor(t.passiveMs / passiveMs);
    t.passiveMs -= glimmers * passiveMs;

    this.data.lastSeen = now;
    this.welcomeBack = { earned, glimmers, seconds: awayMs / 1000 };
    this.addCoins(earned, 'offline');
    this.addGlimmers(glimmers, 'offline');
    return this.welcomeBack;
  }

  // ---------- saving ----------

  // Where saves go (see storage.js). main.js calls this before load().
  useBackend(backend) {
    this.backend = backend;
  }

  // Call once before the game starts.
  async load() {
    const saved = await this.backend.load();
    // Old saves are missing newer fields; NEW_SAVE fills them in.
    this.data = { ...NEW_SAVE(), ...saved, version: NEW_SAVE().version };
    const fresh = NEW_SAVE().home;
    this.data.home = { ...fresh, ...this.data.home };
    this.data.home.floors = { ...fresh.floors, ...this.data.home.floors };
    this.data.glimmerTime = { ...NEW_SAVE().glimmerTime, ...this.data.glimmerTime };
    const firstTime = !this.data.home.fixturesMade;
    // The house was moved up the screen to make room for a bigger lower
    // room. Homes saved before that get lifted the same amount, once.
    if (this.data.home.layout !== 2) {
      for (const p of this.data.home.placed) p.y -= LIFT;
      this.data.home.layout = 2;
    }
    // The first time (or when an old save has none), the room gets its door,
    // windows and dresser. Windows can be stored later, so only add them once.
    if (!this.data.home.fixturesMade) {
      for (const f of DEFAULT_FIXTURES) {
        if (!this.data.home.placed.some((p) => p.uid === f.uid)) {
          this.data.home.placed.push({ ...f, flip: false, c1: null, c2: null, fixed: true });
        }
      }
      this.data.home.fixturesMade = true;
    }
    // Homes from before the entryway existed: the front door moves into the
    // new entryway (everything else stays exactly where it was).
    if (!this.data.home.hasEntryway) {
      const door = this.data.home.placed.find((p) => p.uid === 'fixed-door');
      const spot = DEFAULT_FIXTURES.find((f) => f.uid === 'fixed-door');
      if (door && !firstTime) Object.assign(door, { x: spot.x, y: spot.y });
      this.data.home.hasEntryway = true;
    }
    this.collectOffline();
    this.save();

    // Switching tabs pauses the game. Save on the way out, and pay
    // offline coins for the time away on the way back.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.save();
      else this.collectOffline();
    });
    window.addEventListener('pagehide', () => this.save());

    // Any key, click, mouse move or scroll counts as "playing" (for the active Glimmer bonus).
    const touched = () => (this.lastInput = Date.now());
    for (const type of ['keydown', 'pointerdown', 'pointermove', 'wheel']) window.addEventListener(type, touched, { passive: true });
  }

  save() {
    this.saveMs = 0;
    this.data.lastSeen = Date.now();
    return this.backend.save(this.data);
  }

  // Wipe the save and start over (handy while testing).
  async reset() {
    await this.backend.clear();
    this.data = NEW_SAVE();
    this.emit(0, 'reset');
    this.emitGlimmers(0, 'reset');
    this.save();
  }
}

// The one shared copy the whole game uses. It starts out saving to this
// browser; main.js switches it to the cloud save after you log in.
export const gameState = new GameState(localStorageBackend);
