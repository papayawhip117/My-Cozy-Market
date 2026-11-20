import { GROUND_Y, SHOPS, DECOR, COLORS, FONT } from '../config.js';

// Places every shop and decoration from config.js along the street.
//
// Each one checks: "has real art been loaded with my `key`?"
//   yes -> show the image
//   no  -> draw a colored placeholder box with a label
// So when you add real pixel art later, you only need to load it
// (in preload) with the matching key. Nothing here has to change.

function addLabel(scene, x, y, text) {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: '10px',
      color: COLORS.signText,
      backgroundColor: COLORS.signBg,
      padding: { x: 3, y: 1 },
      resolution: 1,
    })
    .setOrigin(0.5);
}

function addShop(scene, shop) {
  const left = shop.x - shop.width / 2;
  const top = GROUND_Y - shop.height;

  if (scene.textures.exists(shop.key)) {
    // Origin (0.5, 1) = bottom-center, so the shop sits on the ground.
    const img = scene.add.image(shop.x, GROUND_Y, shop.key).setOrigin(0.5, 1);
    // Name sign floating just above the roof.
    addLabel(scene, shop.x, GROUND_Y - img.height - 8, shop.name);
    return img; // StreetScene makes this clickable
  }

  const g = scene.add.graphics();
  // Walls
  g.fillStyle(shop.color, 1);
  g.fillRect(left, top, shop.width, shop.height);
  // Roof (a triangle on top)
  g.fillStyle(0x6e4f3a, 1);
  g.fillTriangle(left - 8, top, left + shop.width + 8, top, shop.x, top - 30);
  // Door
  g.fillStyle(0x5a3e2b, 1);
  g.fillRect(shop.x - 10, GROUND_Y - 34, 20, 34);
  // Two windows
  g.fillStyle(0xfff6d6, 1);
  g.fillRect(left + 12, top + 40, 24, 20);
  g.fillRect(left + shop.width - 36, top + 40, 24, 20);

  // Sign above the door
  addLabel(scene, shop.x, top + 16, shop.name);
  // An invisible box over the placeholder, so it can be clicked too.
  return scene.add.zone(left, top - 30, shop.width, shop.height + 30).setOrigin(0, 0);
}

function addDecor(scene, item) {
  if (scene.textures.exists(item.key)) {
    scene.add.image(item.x, GROUND_Y, item.key).setOrigin(0.5, 1);
    return;
  }

  const g = scene.add.graphics();
  g.fillStyle(item.color, 0.9);
  g.fillRect(item.x - item.width / 2, GROUND_Y - item.height, item.width, item.height);
  addLabel(scene, item.x, GROUND_Y - item.height - 8, item.name).setAlpha(0.8);
}

// Returns [{ shop, target }]: each shop and the thing on screen you click to go in.
export function createStreet(scene) {
  DECOR.forEach((item) => addDecor(scene, item));
  return SHOPS.map((shop) => ({ shop, target: addShop(scene, shop) }));
}
