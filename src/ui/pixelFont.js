import Phaser from 'phaser';
import { FONT_NAME } from '../config.js';

// Paw Pal's pixel font (drawn in tools/art/font.js, saved by `npm run art`
// as public/fonts/pawpal-pixel.ttf).
//
// The font is built on a 10-pixel grid: at font-size 10px every letter's
// pixels land exactly on the game's pixels. Use 10px for normal text and
// 20px for big titles (see TEXT_SIZE in config.js).

// Load the font before anything draws text (the login page uses it too).
export async function loadPixelFont() {
  const face = new FontFace(FONT_NAME, `url(${import.meta.env.BASE_URL}fonts/pawpal-pixel.ttf)`);
  document.fonts.add(await face.load());
}

// Browsers draw text with soft, blurry edges. Our letters are made of whole
// pixels, so after Phaser draws a piece of text we make every pixel either
// fully there or fully gone. That keeps letters as crisp as the rest of the art.
const updateText = Phaser.GameObjects.Text.prototype.updateText;
Phaser.GameObjects.Text.prototype.updateText = function crispUpdateText() {
  const result = updateText.call(this);
  const { canvas, context } = this;
  if (!canvas.width || !canvas.height) return result;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const px = image.data;
  for (let i = 3; i < px.length; i += 4) {
    const a = px[i];
    if (a === 0 || a === 255) continue;
    px[i] = a < 110 ? 0 : 255;
  }
  context.putImageData(image, 0, 0);
  if (this.renderer?.gl) this.frame.source.glTexture = this.renderer.canvasToTexture(canvas, this.frame.source.glTexture, true);
  return result;
};
