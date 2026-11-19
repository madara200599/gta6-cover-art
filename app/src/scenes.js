// Procedural sample scenes for Neon Coast Cover Studio. Every scene is drawn
// with canvas vector shapes and gradients only — no photo files, no network,
// no borrowed art. Each scene is deterministic: the same seed paints the same
// pixels on every run, so the sample "photos" never change between exports.

/** A small deterministic PRNG (mulberry32) so a scene paints identically every time. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A vertical linear gradient from color stops [[offset, color], ...]. */
function vgrad(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** A soft radial glow disc: color at the middle fading to transparent. */
function glowDisc(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** A city skyline silhouette along a base line, with a few lit windows. */
function skyline(ctx, w, baseY, topY, color, lit, rng) {
  ctx.fillStyle = color;
  let x = -w * 0.02;
  while (x < w * 1.02) {
    const bw = w * (0.05 + rng() * 0.07);
    const bh = (baseY - topY) * (0.25 + rng() * 0.75);
    const by = baseY - bh;
    ctx.fillRect(x, by, bw, bh);
    if (rng() < 0.4) ctx.fillRect(x + bw * 0.3, by - bh * 0.12, bw * 0.25, bh * 0.12);
    ctx.fillStyle = lit;
    const cols = Math.max(1, Math.floor(bw / (w * 0.022)));
    const rows = Math.max(1, Math.floor(bh / (w * 0.03)));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rng() < 0.22) {
          ctx.fillRect(x + w * 0.008 + c * w * 0.022, by + w * 0.01 + r * w * 0.03, w * 0.009, w * 0.013);
        }
      }
    }
    ctx.fillStyle = color;
    x += bw + w * 0.008;
  }
}

/** A palm tree silhouette: a leaning trunk and seven drooping fronds. */
function palm(ctx, x, y, s, color, lean, rng) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.045);
  ctx.lineCap = 'round';
  const topX = x + lean * s;
  const topY = y - s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * s * 0.3, y - s * 0.55, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, s * 0.02);
  for (let k = 0; k < 7; k++) {
    const a = (-0.15 - k * 0.24) * Math.PI + (rng() - 0.5) * 0.1;
    const len = s * (0.42 + rng() * 0.18);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + s * 0.16;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY + Math.sin(a) * len * 0.4 - s * 0.08, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX, topY, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
}

/** A few soft cloud blobs drifting across the sky. */
function clouds(ctx, w, h, rng, color, count, yTop, yBottom) {
  ctx.fillStyle = color;
  for (let k = 0; k < count; k++) {
    const cx = rng() * w;
    const cy = yTop + rng() * (yBottom - yTop);
    const cw = w * (0.12 + rng() * 0.16);
    const ch = h * (0.012 + rng() * 0.02);
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + cw * 0.4, cy - ch * 0.5, cw * 0.55, ch * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A standing figure silhouette with a wide-brim hat, facing the scene. */
function figure(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.03);
  ctx.beginPath();
  ctx.arc(x, y - s * 0.86, s * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.79, s * 0.16, s * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.1, y - s * 0.78);
  ctx.quadraticCurveTo(x - s * 0.13, y - s * 0.4, x - s * 0.08, y);
  ctx.lineTo(x + s * 0.08, y);
  ctx.quadraticCurveTo(x + s * 0.13, y - s * 0.4, x + s * 0.1, y - s * 0.78);
  ctx.closePath();
  ctx.fill();
}

/** A low convertible silhouette seen from the side, parked on the boulevard. */
function convertible(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x - s * 0.92, y - s * 0.28);
  ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.42, x - s * 0.1, y - s * 0.4);
  ctx.lineTo(x + s * 0.35, y - s * 0.38);
  ctx.quadraticCurveTo(x + s * 0.85, y - s * 0.34, x + s * 0.98, y - s * 0.08);
  ctx.lineTo(x + s, y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - s * 0.58, y, s * 0.2, 0, Math.PI * 2);
  ctx.arc(x + s * 0.6, y, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

/** A neon sign bar with a glow halo and a dark backing plate. */
function neonSign(ctx, x, y, w, h, color, vertical) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = w * 0.08;
  ctx.fillStyle = color;
  if (vertical) {
    ctx.fillRect(x - w * 0.06, y, w * 0.12, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - w * 0.02, y + h * 0.08, w * 0.04, h * 0.84);
  } else {
    ctx.fillRect(x, y - h * 0.06, w, h * 0.12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w * 0.06, y - h * 0.02, w * 0.88, h * 0.04);
  }
  ctx.restore();
}

/** Deterministic film grain: tiny light and dark specks over the whole frame. */
function grain(ctx, w, h, rng, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const step = Math.max(3, Math.round(w / 360));
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (rng() < 0.5) {
        ctx.fillStyle = rng() < 0.5 ? '#ffffff' : '#000000';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  ctx.restore();
}

const SCENES = {
  boulevard(ctx, w, h, rng) {
    ctx.fillStyle = vgrad(ctx, w, h, [[0, '#2a1052'], [0.42, '#c33a7a'], [0.62, '#ff7e3d'], [0.78, '#ffc46b']]);
    ctx.fillRect(0, 0, w, h);
    glowDisc(ctx, w * 0.62, h * 0.56, w * 0.34, 'rgba(255, 190, 90, 0.55)');
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.56, w * 0.085, 0, Math.PI * 2);
    ctx.fill();
    clouds(ctx, w, h, rng, 'rgba(255, 190, 150, 0.5)', 5, h * 0.08, h * 0.3);
    skyline(ctx, w, h * 0.62, h * 0.34, '#3a1c5e', '#ffd98a', rng);
    ctx.fillStyle = '#241040';
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.fillStyle = '#1d0b33';
    ctx.beginPath();
    ctx.moveTo(w * 0.36, h);
    ctx.lineTo(w * 0.47, h * 0.62);
    ctx.lineTo(w * 0.53, h * 0.62);
    ctx.lineTo(w * 0.64, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    for (let k = 0; k < 5; k++) {
      const y = h * (0.68 + k * 0.06);
      const t = (y - h * 0.62) / (h * 0.38);
      const cw = w * 0.012 * (0.6 + t);
      const cx = w * 0.5;
      ctx.fillRect(cx - cw / 2, y, cw, h * 0.014 * (0.6 + t));
    }
    palm(ctx, w * 0.08, h * 0.66, h * 0.34, '#160a2b', 0.22, rng);
    palm(ctx, w * 0.2, h * 0.64, h * 0.26, '#160a2b', -0.18, rng);
    palm(ctx, w * 0.9, h * 0.66, h * 0.32, '#160a2b', -0.22, rng);
    palm(ctx, w * 0.99, h * 0.64, h * 0.22, '#160a2b', 0.16, rng);
    convertible(ctx, w * 0.68, h * 0.86, h * 0.085, '#12081f');
    const haze = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.66);
    haze.addColorStop(0, 'rgba(255, 180, 110, 0)');
    haze.addColorStop(1, 'rgba(255, 180, 110, 0.28)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, h * 0.55, w, h * 0.11);
    grain(ctx, w, h, rng, 0.05);
  },

  neon(ctx, w, h, rng) {
    ctx.fillStyle = vgrad(ctx, w, h, [[0, '#0b1030'], [0.5, '#1c0f45'], [0.75, '#3d1157'], [1, '#12081f']]);
    ctx.fillRect(0, 0, w, h);
    glowDisc(ctx, w * 0.2, h * 0.2, w * 0.3, 'rgba(255, 46, 136, 0.22)');
    glowDisc(ctx, w * 0.85, h * 0.3, w * 0.3, 'rgba(25, 227, 255, 0.2)');
    skyline(ctx, w, h * 0.66, h * 0.1, '#0d0a24', '#ffd98a', rng);
    ctx.fillStyle = '#0a0618';
    ctx.fillRect(0, h * 0.66, w, h * 0.34);
    const signs = [
      [0.06, 0.3, '#ff2e88', false],
      [0.3, 0.22, '#19e3ff', false],
      [0.55, 0.34, '#ff9e2e', false],
      [0.78, 0.26, '#ff2e88', false],
      [0.16, 0.18, '#19e3ff', true],
      [0.68, 0.2, '#b26bff', true],
    ];
    for (const [fx, fw, color, vertical] of signs) {
      const sx = w * fx;
      const sw = w * fw;
      const sy = h * (0.3 + rng() * 0.22);
      neonSign(ctx, sx, sy, sw, h * 0.05, color, vertical);
      const refl = ctx.createLinearGradient(0, h * 0.66, 0, h);
      refl.addColorStop(0, color);
      refl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = refl;
      ctx.fillRect(sx, h * 0.66, sw, h * 0.34);
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    for (let k = 0; k < 9; k++) {
      const y = h * (0.7 + rng() * 0.26);
      ctx.fillRect(w * rng(), y, w * (0.02 + rng() * 0.05), 2);
    }
    figure(ctx, w * 0.42, h * 0.86, h * 0.3, '#05030c');
    figure(ctx, w * 0.56, h * 0.88, h * 0.27, '#05030c');
    grain(ctx, w, h, rng, 0.06);
  },

  pier(ctx, w, h, rng) {
    ctx.fillStyle = vgrad(ctx, w, h, [[0, '#7ec8e3'], [0.45, '#cfeef2'], [0.52, '#ffe9a8'], [0.62, '#19b5a6'], [1, '#0a7d8c']]);
    ctx.fillRect(0, 0, w, h);
    glowDisc(ctx, w * 0.7, h * 0.2, w * 0.3, 'rgba(255, 240, 180, 0.5)');
    ctx.fillStyle = '#fff6cf';
    ctx.beginPath();
    ctx.arc(w * 0.7, h * 0.2, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
    clouds(ctx, w, h, rng, 'rgba(255,255,255,0.75)', 6, h * 0.06, h * 0.34);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let k = 0; k < 26; k++) {
      const y = h * (0.54 + rng() * 0.4);
      const x = rng() * w;
      ctx.fillRect(x, y, w * (0.03 + rng() * 0.09), 2);
    }
    ctx.fillStyle = '#5a3a22';
    ctx.beginPath();
    ctx.moveTo(w * 0.38, h);
    ctx.lineTo(w * 0.47, h * 0.52);
    ctx.lineTo(w * 0.53, h * 0.52);
    ctx.lineTo(w * 0.62, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3d2716';
    ctx.lineWidth = Math.max(2, w * 0.004);
    for (let k = 0; k < 9; k++) {
      const t = k / 8;
      const y = h * (0.55 + t * 0.45);
      const half = w * (0.03 + t * 0.12);
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - half, y);
      ctx.lineTo(w * 0.5 + half, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#3d2716';
    ctx.fillRect(w * 0.44, h * 0.62, w * 0.012, h * 0.2);
    ctx.fillRect(w * 0.55, h * 0.62, w * 0.012, h * 0.2);
    figure(ctx, w * 0.5, h * 0.66, h * 0.2, '#241408');
    ctx.strokeStyle = '#241408';
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.beginPath();
    ctx.moveTo(w * 0.52, h * 0.56);
    ctx.quadraticCurveTo(w * 0.72, h * 0.42, w * 0.78, h * 0.62);
    ctx.stroke();
    ctx.strokeStyle = '#241408';
    ctx.lineWidth = 1.5;
    for (const [bx, by, s] of [[0.24, 0.16, 0.02], [0.3, 0.12, 0.016], [0.36, 0.18, 0.014]]) {
      ctx.beginPath();
      ctx.moveTo(w * (bx - s), h * by);
      ctx.quadraticCurveTo(w * bx, h * (by - s * 0.7), w * (bx + s), h * by);
      ctx.stroke();
    }
    grain(ctx, w, h, rng, 0.04);
  },

  rooftop(ctx, w, h, rng) {
    ctx.fillStyle = vgrad(ctx, w, h, [[0, '#2c1450'], [0.4, '#7a2a6d'], [0.58, '#ff8a5c'], [0.72, '#ffc46b'], [1, '#1a0b2e']]);
    ctx.fillRect(0, 0, w, h);
    glowDisc(ctx, w * 0.5, h * 0.58, w * 0.4, 'rgba(255, 170, 90, 0.4)');
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.56, w * 0.055, 0, Math.PI * 2);
    ctx.fill();
    clouds(ctx, w, h, rng, 'rgba(255, 170, 130, 0.45)', 5, h * 0.1, h * 0.36);
    skyline(ctx, w, h * 0.72, h * 0.3, '#241040', '#ffd98a', rng);
    ctx.fillStyle = '#160a2b';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = '#0f0720';
    ctx.fillRect(0, h * 0.86, w, h * 0.14);
    ctx.strokeStyle = '#ffd98a';
    ctx.lineWidth = Math.max(1.5, w * 0.003);
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h * 0.74);
    ctx.quadraticCurveTo(w * 0.5, h * 0.82, w * 0.95, h * 0.74);
    ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    ctx.save();
    ctx.shadowColor = '#ffb347';
    ctx.shadowBlur = w * 0.02;
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      const x = w * (0.05 + t * 0.9);
      const y = h * (0.74 + Math.sin(t * Math.PI) * 0.045);
      ctx.beginPath();
      ctx.arc(x, y, w * 0.006, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    palm(ctx, w * 0.88, h * 0.74, h * 0.3, '#0d0518', -0.2, rng);
    ctx.fillStyle = '#0d0518';
    ctx.fillRect(w * 0.06, h * 0.6, w * 0.05, h * 0.14);
    ctx.beginPath();
    ctx.moveTo(w * 0.055, h * 0.6);
    ctx.lineTo(w * 0.085, h * 0.56);
    ctx.lineTo(w * 0.115, h * 0.6);
    ctx.closePath();
    ctx.fill();
    grain(ctx, w, h, rng, 0.05);
  },
};

/** The sample scenes the app ships, in the order the tray shows them. */
export const SCENE_IDS = ['boulevard', 'neon', 'pier', 'rooftop'];

/** The friendly name of a scene, shown in the photo tray. */
export const SCENE_NAMES = {
  boulevard: 'Boulevard Sunset',
  neon: 'Neon Street',
  pier: 'The Pier',
  rooftop: 'Rooftop Dusk',
};

/** The fixed seed each scene paints from, so it never changes. */
const SCENE_SEEDS = { boulevard: 20261119, neon: 20261120, pier: 20261121, rooftop: 20261122 };

/**
 * Paints a sample scene onto a canvas's 2D context at the canvas's own size.
 * The scene is drawn from its fixed seed, so the result is deterministic.
 */
export function paintScene(canvas, sceneId) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const paint = SCENES[sceneId];
  if (!paint) throw new Error(`unknown scene ${sceneId}`);
  paint(ctx, w, h, seededRandom(SCENE_SEEDS[sceneId]));
}

/** A scene painted onto a fresh offscreen canvas, usable as a photo source. */
export function scenePhoto(sceneId, width = 1080, height = 1350) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paintScene(canvas, sceneId);
  return canvas;
}
