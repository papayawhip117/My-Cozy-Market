// The corner menu: its button, the little icons next to each choice,
// and the item slots in the backpack.
import { Canvas, sheet } from './canvas.js';
import { P } from './palette.js';

export const MENU_BUTTON_SIZE = 22;
export const ICON_SIZE = 12;
export const SLOT_SIZE = 20;

// One frame of the button. `pressed` sinks it 1px and darkens it.
function buttonFrame(pressed) {
  const S = MENU_BUTTON_SIZE;
  const c = new Canvas(S, S);
  const y = pressed ? 2 : 1;
  const h = S - 3;
  if (!pressed) c.rect(2, S - 2, S - 4, 1, P.woodDark); // its shadow underneath
  c.rect(1, y, S - 2, h, P.woodDark); // frame
  c.rect(2, y + 1, S - 4, h - 2, pressed ? P.woodDark : P.woodLight); // light inner ring
  c.rect(3, y + 2, S - 6, h - 4, pressed ? P.wood : P.wood); // face
  c.rect(3, y + 2, S - 6, 1, pressed ? P.wood : P.cream); // light along the top
  // round the corners off
  for (const [cx, cy] of [[1, y], [S - 2, y], [1, y + h - 1], [S - 2, y + h - 1]]) c.set(cx, cy, -1);
  // three cream bars (the "menu" sign)
  for (const by of [7, 10, 13]) {
    c.rect(6, y + by - 1, 10, 2, P.cream);
    c.rect(6, y + by, 10, 1, P.creamShade);
  }
  c.outline(P.line);
  // a little ivy leaf curling over the top-right corner
  c.rect(S - 6, y - 1, 3, 2, P.leaf);
  c.set(S - 5, y - 1, P.leafLight);
  c.set(S - 3, y, P.leafDark);
  c.set(S - 3, y + 1, P.leafDark);
  return c;
}

const menuButton = () => sheet([buttonFrame(false), buttonFrame(true)]);

// ---------- icons (12 x 12 each, in this order) ----------
// 0 home, 1 town, 2 backpack, 3 door (log out), 4 parcel (an item)

function iconHome() {
  const c = new Canvas(ICON_SIZE, ICON_SIZE);
  c.poly([[0, 6], [6, 0], [12, 6]], P.plum); // roof
  c.rect(2, 6, 8, 5, P.cream); // walls
  c.rect(2, 6, 8, 1, P.creamShade);
  c.rect(3, 7, 2, 2, P.glow); // glowing window
  c.rect(6, 8, 2, 3, P.wood); // door
  c.rect(8, 1, 2, 3, P.brick); // chimney
  return c.outline(P.line);
}

function iconTown() {
  // an iron street lantern on its post
  const c = new Canvas(ICON_SIZE, ICON_SIZE);
  c.rect(5, 5, 2, 7, P.iron);
  c.rect(3, 1, 6, 5, P.glowWarm);
  c.rect(4, 2, 4, 3, P.glow);
  c.rect(3, 0, 6, 1, P.iron);
  c.rect(3, 6, 6, 1, P.iron);
  c.rect(3, 11, 6, 1, P.iron);
  return c.outline(P.line);
}

function iconBackpack() {
  const c = new Canvas(ICON_SIZE, ICON_SIZE);
  c.rect(4, 0, 4, 2, P.woodDark); // handle loop
  c.rect(5, 1, 2, 1, -1);
  c.rect(2, 2, 8, 9, P.sage); // bag
  c.rect(2, 9, 8, 2, P.sageShade);
  c.rect(2, 2, 8, 4, P.sageDark); // flap
  c.rect(2, 2, 8, 1, P.sageLight);
  c.rect(5, 5, 2, 2, P.gold); // buckle
  return c.outline(P.line);
}

function iconDoor() {
  const c = new Canvas(ICON_SIZE, ICON_SIZE);
  c.rect(2, 3, 8, 9, P.stoneShade); // stone frame
  c.ellipse(5.5, 3, 4, 3, P.stoneShade, (x, y) => y <= 3);
  c.rect(3, 4, 6, 8, P.wood); // the door
  c.ellipse(5.5, 4, 3, 2, P.wood, (x, y) => y <= 4);
  c.rect(5, 3, 1, 9, P.woodDark);
  c.set(7, 8, P.gold); // knob
  return c.outline(P.line);
}

function iconParcel() {
  // a wrapped parcel, the stand-in picture for items until they have art
  const c = new Canvas(ICON_SIZE, ICON_SIZE);
  c.rect(1, 4, 10, 7, P.creamShade);
  c.rect(1, 3, 10, 2, P.cream);
  c.rect(5, 3, 2, 8, P.pink); // ribbon
  c.rect(3, 1, 2, 2, P.pink); // bow
  c.rect(7, 1, 2, 2, P.pink);
  c.set(5, 2, P.pinkShade);
  c.set(6, 2, P.pinkShade);
  return c.outline(P.line);
}

const menuIcons = () => sheet([iconHome(), iconTown(), iconBackpack(), iconDoor(), iconParcel()]);

// An empty, sunken square that an item sits in.
function itemSlot() {
  const S = SLOT_SIZE;
  const c = new Canvas(S, S);
  c.rect(0, 0, S, S, P.woodDark);
  c.rect(1, 1, S - 2, S - 2, 0x2a2420); // dark inside
  c.rect(1, 1, S - 2, 1, P.line); // shadow along the top
  c.rect(1, S - 2, S - 2, 1, P.wood); // light catching the bottom lip
  for (const [x, y] of [[0, 0], [S - 1, 0], [0, S - 1], [S - 1, S - 1]]) c.set(x, y, -1);
  return c;
}

export const MENU = {
  'menu-button': menuButton,
  'menu-icons': menuIcons,
  'item-slot': itemSlot,
};
