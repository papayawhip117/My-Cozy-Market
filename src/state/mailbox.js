import { gameState } from './gameState.js';
import { NEWS, MARKET_KEEPERS } from '../data/news.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { findItem } from './catalog.js';

// Your mailbox: letters with update news (src/data/news.js) and rewards for
// achievements (src/data/achievements.js). Everything is kept in the save,
// in gameState.data.mail:
//
//   letters       [{ id, title, from, date, text, gift, read, claimed }], newest first
//   news          ids of the news letters already delivered (so each comes once)
//   achievements  { 'first-find': 1732300000000, ... } when each was reached
//   stats         counters for things the save can't show by itself
//                 (photos taken, things sold...), see mailbox.count()
//
// main.js calls mailbox.start() once the save has loaded. The corner menu
// listens with mailbox.onChange to show how many letters are unread.
//
//   mailbox.letters          the letters, newest first
//   mailbox.unread           how many you haven't opened
//   mailbox.read(letter)     mark one as opened
//   mailbox.claim(letter)    take its gift (coins, Glimmers, items)
//   mailbox.progress(a)      { count, target, done } for an achievement
//   mailbox.count('photos')  add 1 to a counter (shops, photo booth... call this)

const MAX_LETTERS = 40; // old opened letters with nothing left to claim are thrown out past this
const CHECK_MS = 3000; // how often achievements are checked

class Mailbox {
  constructor() {
    this.listeners = new Set();
  }

  get mail() {
    return gameState.data.mail;
  }

  get letters() {
    return this.mail.letters;
  }

  get unread() {
    return this.letters.filter((l) => !l.read).length;
  }

  // Call fn(newLetters) whenever the mailbox changes (newLetters = letters
  // that just arrived, or [] for a read/claim). Returns a stop function.
  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(arrived = []) {
    for (const fn of this.listeners) fn(arrived);
  }

  // Deliver any news you haven't had, then keep an eye on achievements.
  start() {
    if (this.started) return;
    this.started = true;
    // oldest first, so the newest news ends up on top
    for (const news of [...NEWS].reverse()) {
      if (this.mail.news.includes(news.id)) continue;
      this.mail.news.push(news.id);
      this.send({ id: `news-${news.id}`, title: news.title, date: news.date, text: news.text, gift: news.gift });
    }
    this.check();
    // (spending is counted here, so the shops don't have to)
    gameState.onChange((coins, change) => (change < 0 ? this.count('coinsSpent', -change) : this.check()));
    gameState.onGlimmers((glimmers, change) => (change < 0 ? this.count('glimmersSpent', -change) : this.check()));
    setInterval(() => this.check(), CHECK_MS);
  }

  // ---------- counters and achievements ----------

  // Add to one of the counters in mail.stats, like mailbox.count('photos').
  count(stat, amount = 1) {
    this.mail.stats[stat] = (this.mail.stats[stat] ?? 0) + amount;
    this.check();
  }

  stat(stat) {
    return this.mail.stats[stat] ?? 0;
  }

  progress(achievement) {
    const done = Boolean(this.mail.achievements[achievement.id]);
    let count = 0;
    try {
      count = achievement.count(gameState, this);
    } catch (err) {
      console.warn(`[mailbox] could not check ${achievement.id}`, err);
    }
    return { count: done ? achievement.target : Math.min(count, achievement.target), target: achievement.target, done };
  }

  // Look for achievements you've just reached and mail their rewards.
  check() {
    if (this.checking || !this.started) return; // (a reward changing your coins calls check again)
    this.checking = true;
    for (const a of ACHIEVEMENTS) {
      if (this.mail.achievements[a.id]) continue;
      if (this.progress(a).count < a.target) continue;
      this.mail.achievements[a.id] = Date.now();
      this.send({
        id: `achievement-${a.id}`,
        title: a.name.endsWith('!') ? a.name : `${a.name}!`,
        text: `Achievement reached: ${a.desc.charAt(0).toLowerCase()}${a.desc.slice(1)}. Here is a little something to celebrate. Keep it cozy!`,
        gift: a.reward,
      });
    }
    this.checking = false;
  }

  // ---------- letters ----------

  send({ id, title, from = MARKET_KEEPERS, date = today(), text, gift = null }) {
    const letter = { id, title, from, date, text, gift: cleanGift(gift), read: false, claimed: false };
    this.letters.unshift(letter);
    // throw out the oldest letters you've finished with, if there are too many
    for (let i = this.letters.length - 1; this.letters.length > MAX_LETTERS && i >= 0; i--) {
      const old = this.letters[i];
      if (old.read && (!old.gift || old.claimed)) this.letters.splice(i, 1);
    }
    gameState.save();
    this.emit([letter]);
    return letter;
  }

  read(letter) {
    if (letter.read) return;
    letter.read = true;
    gameState.save();
    this.emit();
  }

  // Take a letter's gift. Returns false if there's nothing (left) to take.
  claim(letter) {
    if (!letter.gift || letter.claimed) return false;
    const { coins = 0, glimmers = 0, items = [] } = letter.gift;
    letter.claimed = true;
    letter.read = true;
    for (const id of items) gameState.addItem(id);
    gameState.addCoins(coins, 'mail');
    gameState.addGlimmers(glimmers, 'mail');
    gameState.save();
    this.emit();
    return true;
  }
}

// Drop items that don't exist (so a typo can't put junk in your backpack).
function cleanGift(gift) {
  if (!gift) return null;
  const items = (gift.items ?? []).filter((id) => findItem(id));
  if (!gift.coins && !gift.glimmers && !items.length) return null;
  return { coins: gift.coins ?? 0, glimmers: gift.glimmers ?? 0, items };
}

// '2026-11-23' in your own time zone
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const mailbox = new Mailbox();
