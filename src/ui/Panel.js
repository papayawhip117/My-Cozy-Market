// Framed panels with vines in the corners (art: tools/art/ui.js).
// One small image can be stretched to any size: Phaser's NineSlice keeps
// the 4 corners as drawn and only stretches the plain edges and middle.
//
//   addPanel(scene, x, y, 120, 80)                 -> wooden sign
//   addPanel(scene, x, y, 120, 80, 'panel-moss')   -> green panel (shop menus)

export const PANEL_KEYS = ['panel-wood', 'panel-moss'];

const SLICE = 12; // corner size in pixels (PANEL_SLICE in tools/art/ui.js)
export const PANEL_MARGIN = 3; // see-through border where leaves poke out

// Call from a scene's preload().
export function preloadPanels(scene) {
  for (const key of PANEL_KEYS) scene.load.image(key, `assets/${key}.png`);
}

// A panel with its top-left corner at (x, y). Keep it at least 24 x 24.
export function addPanel(scene, x, y, width, height, key = 'panel-wood') {
  return scene.add.nineslice(x, y, key, undefined, width, height, SLICE, SLICE, SLICE, SLICE).setOrigin(0, 0);
}
