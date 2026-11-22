// The Glimmer icon: a little four-pointed sparkle, drawn from the map
// below the first time it's needed (no PNG file).
//
//   ensureGlimmerIcon(scene);
//   scene.add.image(x, y, GLIMMER_ICON);

export const GLIMMER_ICON = 'glimmer';

// One letter per pixel: . = see-through, o = outline, m/l/w = dark to light.
const PIXELS = [
  '......o......',
  '.....omo.....',
  '.....olo.....',
  '....omlmo....',
  '...omllwmo...',
  '.oomllwwlmoo.',
  'omlllwwwlllmo',
  '.oomllwllmoo.',
  '...omllmmo...',
  '....omlmo....',
  '.....olo.....',
  '.....omo.....',
  '......o......',
];

const COLORS = {
  o: '#3e3262', // outline
  m: '#9a8ad8', // lavender
  l: '#c9c2f2', // light lavender
  w: '#ffffff', // the shine
};

export function ensureGlimmerIcon(scene) {
  if (scene.textures.exists(GLIMMER_ICON)) return GLIMMER_ICON;
  const size = PIXELS.length;
  const canvas = scene.textures.createCanvas(GLIMMER_ICON, size, size);
  const ctx = canvas.getContext();
  PIXELS.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (!COLORS[ch]) return;
      ctx.fillStyle = COLORS[ch];
      ctx.fillRect(x, y, 1, 1);
    });
  });
  canvas.refresh();
  return GLIMMER_ICON;
}
