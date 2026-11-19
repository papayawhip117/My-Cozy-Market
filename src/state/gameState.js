import { COINS, PLAYER_LOOK, DEFAULT_FIXTURES } from '../config.js';
import { localStorageBackend } from './storage.js';

// The game's memory: how many coins you have, what's in your backpack
// (and later: what you're wearing, how your home looks).
//
// This is the ONE place that changes coins. Scenes, shops and the HUD
// never touch the number directly; they call addCoins/spendCoins and
// listen with onChange. That keeps saving and the coin counter in sync.

// What a brand-new save looks like. Bump `version` if the shape changes,
// so old saves can be upgraded instead of breaking.
const NEW_SAVE = () => ({
  version: 4,
  coins: COINS.startingCoins,
  inventory: [], // ids of things you own, like 'matcha-latte' (newest last)
  look: null, // how your character looks; null until you've made one
  // Furniture and plants you've put in your home. Each one is
  // { uid, id, x, y, flip, c1, c2 }: where it is (in the room's screen
  // coordinates), whether it's mirrored, and its two paint colors (null = original).
  home: { placed: [], storedWindows: 0 },
  lastSeen: null, // when the game was last open (ms since 1970)
});

class GameState {
  constructor(backend) {
    this.backend = backend;
    this.data = NEW_SAVE();
    this.listeners = new Set();
    this.idleMs = 0; // time saved up toward the next idle tick
    this.saveMs = 0; // time since the last autosave
    // Filled in by collectOffline(): what you earned while away.
    this.welcomeBack = { earned: 0, seconds: 0 };
  }

  // ---------- reading ----------

  get coins() {
    return this.data.coins;
  }

  canAfford(price) {
    return this.data.coins >= price;
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

  // How many of `id` are in your home right now.
  countPlaced(id) {
    return this.placed.filter((p) => p.id === id && !p.fixed).length;
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

    this.saveMs += deltaMs;
    if (this.saveMs >= COINS.autosaveSeconds * 1000) this.save();
  }

  // Coins for time the game wasn't running (closed, or in a hidden tab).
  // Slower than playing, and capped so a week away isn't a fortune.
  collectOffline(now = Date.now()) {
    const { lastSeen } = this.data;
    if (!lastSeen || now <= lastSeen) return { earned: 0, seconds: 0 };

    const seconds = Math.min((now - lastSeen) / 1000, COINS.offlineCapHours * 3600);
    const earned = Math.floor((seconds / COINS.tickSeconds) * COINS.perTick * COINS.offlineRate);
    this.data.lastSeen = now;
    this.welcomeBack = { earned, seconds };
    this.addCoins(earned, 'offline');
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
    this.data.home = { placed: [], storedWindows: 0, ...this.data.home };
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
    this.collectOffline();
    this.save();

    // Switching tabs pauses the game. Save on the way out, and pay
    // offline coins for the time away on the way back.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.save();
      else this.collectOffline();
    });
    window.addEventListener('pagehide', () => this.save());
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
    this.save();
  }
}

// The one shared copy the whole game uses. It starts out saving to this
// browser; main.js switches it to the cloud save after you log in.
export const gameState = new GameState(localStorageBackend);
