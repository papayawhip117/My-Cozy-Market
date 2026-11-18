// A tiny pixel canvas: a grid of colored pixels we can draw on with code,
// then save as a PNG. Colors are hex numbers like 0xf2b3c4.
// Pixels are solid by default. Inside c.see(alpha, () => {...}) everything
// is drawn see-through (alpha 0-255), which is how lantern glow is made.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

export class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    // -1 means "empty" (transparent).
    this.px = new Int32Array(w * h).fill(-1);
    this.a = new Uint8Array(w * h); // how solid each pixel is (0-255)
    this.alpha = 255; // current drawing alpha (see `see`)
  }

  // Draw see-through: c.see(80, () => c.circle(...)).
  see(alpha, fn) {
    const old = this.alpha;
    this.alpha = alpha;
    fn();
    this.alpha = old;
    return this;
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x, y) {
    return this.inside(x, y) ? this.px[y * this.w + x] : -1;
  }

  set(x, y, c, alpha = this.alpha) {
    x = Math.round(x);
    y = Math.round(y);
    if (!this.inside(x, y)) return;
    const i = y * this.w + x;
    if (c === -1) {
      this.px[i] = -1;
      this.a[i] = 0;
    } else if (alpha >= 255 || this.px[i] === -1) {
      this.px[i] = c;
      this.a[i] = alpha;
    } else {
      // Blend the see-through color over what's already there.
      const k = alpha / 255;
      const ek = this.a[i] / 255;
      const outA = k + ek * (1 - k);
      const ch = (s) => Math.round((((c >> s) & 255) * k + ((this.px[i] >> s) & 255) * ek * (1 - k)) / outA);
      this.px[i] = (ch(16) << 16) | (ch(8) << 8) | ch(0);
      this.a[i] = Math.round(outA * 255);
    }
  }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }

  // Filled ellipse centered on (cx, cy). Use .5 centers for even sizes.
  ellipse(cx, cy, rx, ry, c, keep = () => true) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - (cx + 0.5)) / rx;
        const dy = (y + 0.5 - (cy + 0.5)) / ry;
        if (dx * dx + dy * dy <= 1 && keep(x, y)) this.set(x, y, c);
      }
    }
    return this;
  }

  circle(cx, cy, r, c, keep) {
    return this.ellipse(cx, cy, r, r, c, keep);
  }

  // Filled polygon from a list of [x, y] points.
  poly(points, c) {
    const ys = points.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const xs = [];
      for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length];
        const sy = y + 0.5;
        if ((y1 <= sy && y2 > sy) || (y2 <= sy && y1 > sy)) {
          xs.push(x1 + ((sy - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c);
      }
    }
    return this;
  }

  // Straight line, `size` pixels thick.
  line(x1, y1, x2, y2, c, size = 1) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(x1 + ((x2 - x1) * s) / steps);
      const y = Math.round(y1 + ((y2 - y1) * s) / steps);
      this.rect(x - Math.floor(size / 2), y - Math.floor(size / 2), size, size, c);
    }
    return this;
  }

  // Paste another canvas on top of this one at (dx, dy).
  draw(other, dx = 0, dy = 0) {
    for (let y = 0; y < other.h; y++) {
      for (let x = 0; x < other.w; x++) {
        const c = other.px[y * other.w + x];
        if (c !== -1) this.set(x + dx, y + dy, c, other.a[y * other.w + x]);
      }
    }
    return this;
  }

  // Adds a 1px border of color `c` around everything drawn so far.
  // This is what gives pixel art its clean dark outlines.
  outline(c) {
    const copy = Int32Array.from(this.px);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (copy[y * this.w + x] !== -1) continue;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => {
          const nx = x + ox;
          const ny = y + oy;
          return this.inside(nx, ny) && copy[ny * this.w + nx] !== -1;
        });
        if (near) this.set(x, y, c, 255);
      }
    }
    return this;
  }

  // Recolor every pixel of color `from` that `where(x, y)` approves.
  replace(from, to, where = () => true) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        if (this.px[i] !== from || !where(x, y)) continue;
        this.px[i] = to;
        if (to === -1) this.a[i] = 0;
      }
    }
    return this;
  }

  // Copy with empty rows/columns cut off the top, left and right
  // (the bottom stays, because that's the ground line).
  trimmed() {
    let top = 0;
    let left = this.w;
    let right = -1;
    while (top < this.h && this.px.subarray(top * this.w, (top + 1) * this.w).every((c) => c === -1)) top++;
    for (let y = top; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (this.px[y * this.w + x] !== -1) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
    if (right < 0) return this;
    const out = new Canvas(right - left + 1, this.h - top);
    out.draw(this, -left, -top);
    return out;
  }

  isEmpty() {
    return this.px.every((c) => c === -1);
  }

  // Bigger copy (each pixel becomes `n` x `n`) — for previews only.
  scaled(n) {
    const out = new Canvas(this.w * n, this.h * n);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const c = this.px[y * this.w + x];
        if (c !== -1) out.see(this.a[y * this.w + x], () => out.rect(x * n, y * n, n, n, c));
      }
    return out;
  }

  savePNG(path) {
    writeFileSync(path, encodePNG(this));
  }
}

// Put several same-size canvases side by side = a sprite sheet.
export function sheet(frames) {
  const { w, h } = frames[0];
  const out = new Canvas(w * frames.length, h);
  frames.forEach((f, i) => out.draw(f, i * w, 0));
  return out;
}

// ---- PNG file format (no libraries needed) ----
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function encodePNG(cv) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(cv.w, 0);
  ihdr.writeUInt32BE(cv.h, 4);
  ihdr[8] = 8; // bits per channel
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((cv.w * 4 + 1) * cv.h);
  let o = 0;
  for (let y = 0; y < cv.h; y++) {
    raw[o++] = 0; // no filter
    for (let x = 0; x < cv.w; x++) {
      const c = cv.px[y * cv.w + x];
      if (c === -1) {
        o += 4;
      } else {
        raw[o++] = (c >> 16) & 255;
        raw[o++] = (c >> 8) & 255;
        raw[o++] = c & 255;
        raw[o++] = cv.a[y * cv.w + x];
      }
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
