import { COINS, PLAYER_LOOK } from '../config.js';
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
  version: 3,
  coins: COINS.startingCoins,
  inventory: [], // ids of things you own, like 'matcha-latte' (newest last)
  look: null, // how your character looks; null until you've made one
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

  // ---------- your character ----------

  // True once you've been through the character creator.
  get hasCharacter() {
    return Boolean(this.data.look);
  }

  // How your character looks right now (PLAYER_LOOK in config.js fills
  // in anything missing). Clothes you've sold stop being worn.
  get look() {
    const look = { ...PLAYER_LOOK, ...this.data.look };
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
