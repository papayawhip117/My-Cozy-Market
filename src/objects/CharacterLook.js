import { LOOK_OPTIONS, WEAR_SLOTS, EXTRA_SLOTS, SHOP_STOCK } from '../config.js';
import { findItem } from '../state/catalog.js';

// Turns a "look" (hair style, colors, clothes... see PLAYER_LOOK in
// config.js) into a stack of sprites. Used by the Player and by the
// character creator's preview and style buttons.
//
// Each sprite sheet has two rows (see tools/art/character.js):
//   frames 0-4 = the gray part, tinted with one of the look's colors
//   frames 5-9 = the part that keeps its own colors (outlines, clothes...)
// so every layer is two sprites: a tinted one with a fixed one on top.

export const FRAME_W = 32;
export const FRAME_H = 40;
export const FRAME_COUNT = 5; // frames per row
const FIXED = FRAME_COUNT; // add this to a frame number to get its fixed half

// Which item (if any) is worn on a slot. Pajamas cover the bottom slot too.
function worn(look, slot) {
  const id = look.worn?.[slot];
  if (slot === 'bottom' && findItem(look.worn?.top)?.fullBody) return 'covered';
  return id ? `wear-${id}` : null;
}

// Long sleeves: tops with `sleeves: true` have a second sheet that goes over
// your arms (wear-<id>-arms), so the sleeves cover them.
function sleeves(look) {
  const id = look.worn?.top;
  return findItem(id)?.sleeves ? `wear-${id}-arms` : null;
}

// The layers, back to front.
//   sheet(look) -> which sprite sheet to use (null = nothing on this layer)
//   tint        -> which color in the look recolors it (none = keep its colors)
//   arm         -> true for layers on your arms (the photo booth hides
//                  them when you strike a pose with your arms up)
export const LAYERS = [
  { sheet: (l) => `player-tail-${l.ears}`, tint: 'furColor' },
  { sheet: (l) => `player-hairback-${l.hair}`, tint: 'hairColor' },
  { sheet: (l) => worn(l, 'charm') }, // wings and tail charms, behind you
  { sheet: () => 'player-body', tint: 'skin' },
  { sheet: (l) => worn(l, 'legs') }, // tights and stockings, under everything
  // The bottom tint only matters for the starting skirt; bought clothes
  // are drawn in the fixed row, so tinting their empty gray row does nothing.
  { sheet: (l) => (worn(l, 'bottom') === 'covered' ? null : worn(l, 'bottom') ?? 'player-bottom-skirt'), tint: 'outfitColor' },
  { sheet: (l) => worn(l, 'feet') ?? 'player-feet-boots' },
  // Tops are tinted with your skin color: crop tops and strappy tops draw
  // your tummy and shoulders in gray on their tint row.
  { sheet: (l) => worn(l, 'top') ?? 'player-top-blouse', tint: 'skin' },
  { sheet: (l) => worn(l, 'waist') },
  { sheet: (l) => worn(l, 'neck') },
  { sheet: (l) => worn(l, 'bag') },
  { sheet: () => 'player-arms', tint: 'skin' },
  { sheet: (l) => sleeves(l), arm: true },
  { sheet: (l) => worn(l, 'hands'), arm: true },
  { sheet: (l) => `player-eyes-${l.eyes}`, tint: 'eyeColor' },
  { sheet: (l) => `player-hair-${l.hair}`, tint: 'hairColor' },
  { sheet: (l) => worn(l, 'face') }, // glasses
  { sheet: (l) => worn(l, 'hair') }, // clips, bows, scrunchies
  { sheet: (l) => `player-ears-${l.ears}`, tint: 'furColor' },
  { sheet: (l) => worn(l, 'head') },
];

// Every sprite sheet any look could need.
function allSheets() {
  const keys = new Set(['player-body', 'player-arms', 'player-top-blouse', 'player-bottom-skirt', 'player-feet-boots']);
  for (const hair of LOOK_OPTIONS.hair) keys.add(`player-hair-${hair}`).add(`player-hairback-${hair}`);
  for (const ears of LOOK_OPTIONS.ears) keys.add(`player-ears-${ears}`).add(`player-tail-${ears}`);
  for (const eyes of LOOK_OPTIONS.eyes) keys.add(`player-eyes-${eyes}`);
  for (const item of Object.values(SHOP_STOCK).flat()) {
    if (item.wear) keys.add(`wear-${item.id}`);
    if (item.sleeves) keys.add(`wear-${item.id}-arms`);
  }
  return keys;
}

// Call from a scene's preload().
export function preloadLook(scene) {
  for (const key of allSheets()) {
    if (scene.textures.exists(key)) continue; // another scene already loaded it
    scene.load.spritesheet(key, `assets/${key}.png`, { frameWidth: FRAME_W, frameHeight: FRAME_H });
  }
}

// Fills a Container with the sprites for `look`. Returns the sprites as
// pairs [tinted, fixed], so setLookFrame can animate them.
// `crop` (optional) = { x, y, w, h } to show only part of each frame,
// like just the head for the creator's little style buttons.
export function buildLook(container, look, crop) {
  const scene = container.scene;
  container.removeAll(true);
  const pairs = [];
  for (const layer of LAYERS) {
    const key = layer.sheet(look);
    if (!key) continue;
    // Origin (0.5, 1) = bottom-center, so her feet sit on the ground line.
    const tinted = scene.add.sprite(0, 0, key, 0).setOrigin(0.5, 1);
    const fixed = scene.add.sprite(0, 0, key, FIXED).setOrigin(0.5, 1);
    if (layer.tint) tinted.setTint(look[layer.tint]);
    tinted.isArm = fixed.isArm = !!layer.arm;
    if (crop) {
      tinted.setCrop(crop.x, crop.y, crop.w, crop.h);
      fixed.setCrop(crop.x, crop.y, crop.w, crop.h);
    }
    container.add([tinted, fixed]);
    pairs.push([tinted, fixed]);
  }
  return pairs;
}

// Show frame 0 (standing) or 1-4 (walking) on every layer.
export function setLookFrame(pairs, frame) {
  for (const [tinted, fixed] of pairs) {
    tinted.setFrame(frame);
    fixed.setFrame(frame + FIXED);
  }
}

// The clothes you own that go on `slot` (item ids), for the dresser.
export function ownedWear(slot, ownedIds) {
  return Object.values(SHOP_STOCK)
    .flat()
    .filter((item) => item.wear === slot && ownedIds.includes(item.id))
    .map((item) => item.id);
}

export { WEAR_SLOTS, EXTRA_SLOTS };
