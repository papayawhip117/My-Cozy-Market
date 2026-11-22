import { TEXT } from './Dialog.js';
import { ensureGlimmerIcon } from './glimmerIcon.js';

// A price drawn as icons and numbers: (coin) 120, (sparkle) 3, or both.
// Coins need 'coin' loaded (CoinHud.preload); the sparkle draws itself.
//
//   const tag = priceTag(scene, { coins: 120, glimmers: 2 }, { scale: 0.6 });
//   tag.x = 10;              // a Container; (0, 0) is its left edge, middle
//   tag.w                    // how wide it is, for centering or right-aligning
//   tag.setColor('#e89a88')  // recolor the numbers (e.g. can't afford it)

const COIN_COLOR = '#f7dc8a';
const GLIMMER_COLOR = '#d8d0ff';

export function priceTag(scene, { coins = 0, glimmers = 0 }, { scale = 1, color } = {}) {
  const tag = scene.add.container(0, 0);
  const texts = [];
  const icon = Math.round(14 * scale); // icon width
  let x = 0;
  const part = (key, frame, number, partColor) => {
    if (x > 0) x += 4; // gap between coins and Glimmers
    tag.add(scene.add.sprite(x + Math.round(icon / 2), 0, key, frame).setScale(scale));
    const text = scene.add.text(x + icon + 1, 0, number.toLocaleString('en-US'), { ...TEXT, color: color ?? partColor }).setOrigin(0, 0.5);
    text.baseColor = partColor;
    tag.add(text);
    texts.push(text);
    x = Math.ceil(text.x + text.width);
  };
  if (coins || !glimmers) part('coin', 0, coins, COIN_COLOR);
  if (glimmers) part(ensureGlimmerIcon(scene), undefined, glimmers, GLIMMER_COLOR);
  tag.w = x;
  // null puts each number back to its own color.
  tag.setColor = (c) => {
    for (const t of texts) t.setColor(c ?? t.baseColor);
    return tag;
  };
  return tag;
}
