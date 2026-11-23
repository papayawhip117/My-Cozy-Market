import Phaser from 'phaser';
import Dialog, { TEXT, pinToScreen, showToast, woodButton } from './Dialog.js';
import { PANEL_MARGIN } from './Panel.js';
import { fitText } from './MenuList.js';
import { priceTag } from './PriceTag.js';
import { mailbox } from '../state/mailbox.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { itemTexture, itemName } from '../state/catalog.js';

// The mailbox pop-up (Mail in the corner menu). Two tabs:
//
//   Letters        your letters on the left; click one to read it on the
//                  paper on the right, and Claim its gift if it has one
//   Achievements   every goal, how far along you are, and its reward
//
//   new MailboxPanel(scene, { onClose: () => ... });
//
// Letters and achievements live in src/state/mailbox.js; the news in
// src/data/news.js and the goals in src/data/achievements.js.

const WIDTH = 340;
const HEIGHT = 236;
const PAD = PANEL_MARGIN + 8;
const TOP = 40; // where the tab's content starts (under the title and tabs)

const LIST_W = 118;
const ROW_H = 17;
const LETTERS_PER_PAGE = 9;
const PAPER_X = PAD + LIST_W + 6;
const PAPER_W = WIDTH - PAPER_X - PAD;
const PAPER_H = 156;

const GOAL_W = (WIDTH - PAD * 2 - 6) / 2; // two columns of achievements
const GOAL_H = 28;
const GOALS_PER_PAGE = 12;

const LIGHT = '#f2ead8';
const GOLD = '#ffe3a0';
const MUTED = '#b0a088';
const INK = '#3a3040';
const INK_SOFT = '#7d566a';
const SELECTED = 0xffe3a0;
const CELL_BG = 0x2a1f1c;
const LINE = 0x1c1822;

export default class MailboxPanel extends Dialog {
  constructor(scene, { onClose }) {
    super(scene, { title: 'Mailbox', width: WIDTH, height: HEIGHT, onClose });
    this.tab = 'letters';
    this.page = 0;
    this.open = mailbox.letters[0] ?? null; // the letter on the paper
    if (this.open) mailbox.read(this.open);

    this.content = scene.add.container(0, 0);
    this.add(this.content);

    // a little ✕ in the top corner (clicking outside or Esc closes it too)
    const x = this.add(scene.add.text(WIDTH - PAD - 2, PAD - 2, '✕', { ...TEXT, color: GOLD }).setOrigin(1, 0));
    x.setPadding(3, 2).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.close());

    // redraw when a letter arrives while it's open
    this.stopListening = mailbox.onChange(() => !this.closed && this.render());
    this.render();
  }

  close() {
    this.stopListening?.();
    super.close();
  }

  // ---------- drawing ----------

  render() {
    this.content.removeAll(true);
    this.drawTabs();
    if (this.tab === 'letters') this.drawLetters();
    else this.drawGoals();
    pinToScreen(this.root); // (new things must stick to the screen too)
  }

  // Put a game object in the tab's content (redrawn from scratch each time).
  put(obj) {
    this.content.add(obj);
    return obj;
  }

  drawTabs() {
    const unread = mailbox.unread;
    const done = ACHIEVEMENTS.filter((a) => mailbox.progress(a).done).length;
    const tabs = [
      { id: 'letters', label: unread ? `Letters (${unread})` : 'Letters' },
      { id: 'goals', label: `Achievements ${done}/${ACHIEVEMENTS.length}` },
    ];
    const w = 110;
    tabs.forEach((tab, i) => {
      const on = this.tab === tab.id;
      const x = PAD + i * (w + 4);
      const bg = this.put(this.scene.add.rectangle(x, 20, w, 15, on ? 0x5a4038 : CELL_BG).setOrigin(0, 0).setStrokeStyle(1, on ? SELECTED : LINE));
      this.put(this.scene.add.text(x + w / 2, 27, tab.label, { ...TEXT, color: on ? GOLD : LIGHT }).setOrigin(0.5));
      bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (this.tab === tab.id) return;
        this.tab = tab.id;
        this.page = 0;
        this.render();
      });
    });
  }

  // ◀ 1/3 ▶ centered on (x, y), when there's more than one page.
  drawPager(x, y, pages) {
    if (pages < 2) return;
    this.page = Phaser.Math.Clamp(this.page, 0, pages - 1);
    this.put(this.scene.add.text(x, y, `${this.page + 1}/${pages}`, { ...TEXT, color: LIGHT }).setOrigin(0.5));
    for (const [label, dir] of [['◀', -1], ['▶', 1]]) {
      const enabled = this.page + dir >= 0 && this.page + dir < pages;
      const arrow = this.put(this.scene.add.text(x + dir * 26, y, label, { ...TEXT, color: enabled ? GOLD : '#6a5a4a' }).setOrigin(0.5));
      if (!enabled) continue;
      arrow.setPadding(4, 2).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.page += dir;
        this.render();
      });
    }
  }

  // ---------- letters ----------

  drawLetters() {
    const scene = this.scene;
    const letters = mailbox.letters;
    if (!letters.length) {
      this.put(scene.add.text(WIDTH / 2, TOP + 60, 'No letters yet.\nCheck back soon!', { ...TEXT, color: LIGHT, align: 'center' }).setOrigin(0.5));
      return;
    }
    const pages = Math.ceil(letters.length / LETTERS_PER_PAGE);
    this.drawPager(PAD + LIST_W / 2, HEIGHT - 18, pages);
    const first = this.page * LETTERS_PER_PAGE;

    letters.slice(first, first + LETTERS_PER_PAGE).forEach((letter, i) => {
      const y = TOP + i * ROW_H;
      const on = letter === this.open;
      const row = this.put(scene.add.rectangle(PAD, y, LIST_W, ROW_H - 2, on ? 0x5a4038 : CELL_BG).setOrigin(0, 0).setStrokeStyle(1, on ? SELECTED : LINE));
      row.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.open = letter;
        mailbox.read(letter); // (this redraws the panel)
        this.render();
      });
      // the envelope: bright while unopened
      this.put(scene.add.sprite(PAD + 3, y + (ROW_H - 2) / 2, 'menu-icons', 6).setOrigin(0, 0.5).setAlpha(letter.read ? 0.45 : 1));
      const gift = letter.gift && !letter.claimed;
      const title = scene.add.text(PAD + 18, y + (ROW_H - 2) / 2, letter.title, { ...TEXT, color: letter.read ? MUTED : GOLD }).setOrigin(0, 0.5);
      this.put(fitText(title, LIST_W - (gift ? 34 : 22)));
      // a little parcel when there's a gift waiting
      if (gift) this.put(scene.add.sprite(PAD + LIST_W - 3, y + (ROW_H - 2) / 2, 'menu-icons', 4).setOrigin(1, 0.5));
    });

    if (this.open) this.drawPaper(this.open);
  }

  // The open letter, on a sheet of cream paper.
  drawPaper(letter) {
    const scene = this.scene;
    const x = PAPER_X;
    const y = TOP;
    const g = this.put(scene.add.graphics());
    g.fillStyle(0xc8b896, 1).fillRect(x - 1, y - 1, PAPER_W + 2, PAPER_H + 2); // edge
    g.fillStyle(0xf2ead8, 1).fillRect(x, y, PAPER_W, PAPER_H);
    g.fillStyle(0x0d0a12, 0.18).fillRect(x + 2, y + PAPER_H + 1, PAPER_W, 1); // shadow
    g.fillStyle(0xe8dcc0, 1);
    for (let ly = y + 30; ly < y + PAPER_H - 30; ly += 11) g.fillRect(x + 8, ly, PAPER_W - 16, 1); // faint ruled lines
    g.fillStyle(0xc99aa6, 1).fillCircle(x + PAPER_W - 10, y + 9, 4); // a wax seal
    g.fillStyle(0xe89aa0, 1).fillRect(x + PAPER_W - 12, y + 7, 2, 2);

    const inner = PAPER_W - 16;
    this.put(fitText(scene.add.text(x + 8, y + 6, letter.title, { ...TEXT, color: INK }), inner - 12));
    this.put(scene.add.text(x + 8, y + 18, `${letter.from} · ${prettyDate(letter.date)}`, { ...TEXT, color: INK_SOFT }));
    this.put(
      scene.add.text(x + 8, y + 31, letter.text, {
        ...TEXT,
        color: INK,
        wordWrap: { width: inner },
        lineSpacing: 1,
      }),
    );

    if (!letter.gift) return;
    // the gift along the bottom of the paper, and the Claim button under it
    const gy = y + PAPER_H - 12;
    this.put(scene.add.text(x + 8, gy, 'Gift:', { ...TEXT, color: INK_SOFT }).setOrigin(0, 0.5));
    const reward = this.drawReward(letter.gift, x + 36, gy, INK);
    if (letter.claimed) reward.setAlpha(0.5);
    const by = HEIGHT - 18;
    if (letter.claimed) {
      this.put(scene.add.text(x + PAPER_W / 2, by, 'Claimed ✓', { ...TEXT, color: MUTED }).setOrigin(0.5));
    } else {
      this.put(woodButton(scene, 'Claim', x + PAPER_W / 2, by, () => this.claim(letter), { width: 60, height: 18 }));
    }
  }

  // Coins and Glimmers as a price tag, then a picture of each item.
  // Returns a Container with its left edge at (x, y middle).
  drawReward({ coins = 0, glimmers = 0, items = [] }, x, y, color) {
    const scene = this.scene;
    const box = this.put(scene.add.container(x, y));
    let w = 0;
    if (coins || glimmers) {
      const tag = priceTag(scene, { coins, glimmers }, { scale: 0.7, color });
      box.add(tag);
      w = tag.w + 4;
    }
    for (const id of items) {
      const key = itemTexture(scene, id);
      if (key) box.add(scene.add.image(w + 6, 0, key).setScale(0.75));
      else box.add(scene.add.text(w, 0, itemName(id), { ...TEXT, color }).setOrigin(0, 0.5));
      w += key ? 14 : 60;
    }
    box.w = w;
    return box;
  }

  claim(letter) {
    if (!mailbox.claim(letter)) return;
    const { coins, glimmers, items } = letter.gift;
    const parts = [];
    if (coins) parts.push(`${coins} coins`);
    if (glimmers) parts.push(`${glimmers} Glimmers`);
    for (const id of items) parts.push(`the ${itemName(id)}`);
    showToast(this.scene, `You got ${parts.join(', ')}!`);
  }

  // ---------- achievements ----------

  drawGoals() {
    const scene = this.scene;
    const pages = Math.ceil(ACHIEVEMENTS.length / GOALS_PER_PAGE);
    this.drawPager(WIDTH / 2, HEIGHT - 18, pages);
    const first = this.page * GOALS_PER_PAGE;
    const rows = GOALS_PER_PAGE / 2;

    ACHIEVEMENTS.slice(first, first + GOALS_PER_PAGE).forEach((a, i) => {
      const x = PAD + Math.floor(i / rows) * (GOAL_W + 6);
      const y = TOP + (i % rows) * GOAL_H;
      const { count, target, done } = mailbox.progress(a);
      this.put(scene.add.rectangle(x, y, GOAL_W, GOAL_H - 3, done ? 0x3e4a32 : CELL_BG).setOrigin(0, 0).setStrokeStyle(1, done ? 0x9db88f : LINE));

      // name (with a tick once it's done), and the reward on the right
      const reward = this.drawReward(a.reward, 0, y + 7, done ? MUTED : LIGHT);
      reward.x = x + GOAL_W - 3 - reward.w;
      const name = scene.add.text(x + 4, y + 7, `${done ? '✓ ' : ''}${a.name}`, { ...TEXT, color: done ? '#c8e0b0' : GOLD }).setOrigin(0, 0.5);
      this.put(fitText(name, reward.x - x - 8));

      // what to do, and how far along you are
      const status = done ? 'Done!' : `${fmt(count)}/${fmt(target)}`;
      const statusText = this.put(scene.add.text(x + GOAL_W - 4, y + 17, status, { ...TEXT, color: done ? '#c8e0b0' : LIGHT }).setOrigin(1, 0.5));
      this.put(fitText(scene.add.text(x + 4, y + 17, a.desc, { ...TEXT, color: MUTED }).setOrigin(0, 0.5), GOAL_W - statusText.width - 12));

      // a thin progress bar along the bottom
      const barW = GOAL_W - 8;
      this.put(scene.add.rectangle(x + 4, y + GOAL_H - 6, barW, 1, 0x4a3a30).setOrigin(0, 0));
      const fill = Math.round(barW * Math.min(1, count / target));
      if (fill > 0) this.put(scene.add.rectangle(x + 4, y + GOAL_H - 6, fill, 1, done ? 0x9db88f : 0xffe3a0).setOrigin(0, 0));
    });
  }
}

// 1234 -> '1,234'
const fmt = (n) => Math.floor(n).toLocaleString('en-US');

// '2026-11-23' -> 'Nov 23'
function prettyDate(date) {
  const [y, m, d] = String(date).split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
