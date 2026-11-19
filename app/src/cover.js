// The cover engine: lays photos out in GTA-poster panel grids, grades them
// with a Vice City sunset or neon colour grade, and letters the caption in
// bold condensed capitals with a neon script subtitle. Everything is drawn
// with the canvas 2D API; nothing is fetched, and the same state always
// paints the same cover.

import { seededRandom } from './scenes.js';

/** The post sizes the app exports, in the order the size picker shows them. */
export const SIZES = [
  { id: 'square', label: 'Square · 1080 × 1080', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait · 1080 × 1350', width: 1080, height: 1350 },
  { id: 'wide', label: 'Wide · 1920 × 1080', width: 1920, height: 1080 },
];

/** The panel layouts, each a function of the content box returning panel rects. */
export const LAYOUTS = {
  hero: {
    label: 'Hero + 3',
    panels(box) {
      const heroH = box.h * 0.6;
      const rowY = box.y + heroH + box.gap;
      const rowH = box.y + box.h - rowY;
      const cw = (box.w - box.gap * 2) / 3;
      return [
        { x: box.x, y: box.y, w: box.w, h: heroH },
        { x: box.x, y: rowY, w: cw, h: rowH },
        { x: box.x + cw + box.gap, y: rowY, w: cw, h: rowH },
        { x: box.x + (cw + box.gap) * 2, y: rowY, w: cw, h: rowH },
      ];
    },
  },
  grid4: {
    label: 'Four Panel',
    panels(box) {
      const cw = (box.w - box.gap) / 2;
      const ch = (box.h - box.gap) / 2;
      return [
        { x: box.x, y: box.y, w: cw, h: ch },
        { x: box.x + cw + box.gap, y: box.y, w: cw, h: ch },
        { x: box.x, y: box.y + ch + box.gap, w: cw, h: ch },
        { x: box.x + cw + box.gap, y: box.y + ch + box.gap, w: cw, h: ch },
      ];
    },
  },
  nine: {
    label: 'Nine Panel',
    panels(box) {
      const cw = (box.w - box.gap * 2) / 3;
      const ch = (box.h - box.gap * 2) / 3;
      const rects = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          rects.push({ x: box.x + c * (cw + box.gap), y: box.y + r * (ch + box.gap), w: cw, h: ch });
        }
      }
      return rects;
    },
  },
  bleed: {
    label: 'Full Bleed',
    panels(box) {
      return [{ x: box.x, y: box.y, w: box.w, h: box.h }];
    },
  },
  tilt: {
    label: 'Tilted Snaps',
    panels(box) {
      const cw = box.w * 0.42;
      const ch = box.h * 0.52;
      const cy = box.y + box.h * 0.06;
      return [
        { x: box.x + box.w * 0.04, y: cy, w: cw, h: ch, tilt: -0.07 },
        { x: box.x + box.w * 0.3, y: cy + box.h * 0.1, w: cw, h: ch, tilt: 0.05 },
        { x: box.x + box.w * 0.54, y: cy + box.h * 0.02, w: cw, h: ch, tilt: -0.03 },
      ];
    },
  },
};

/** The colour grades: a wash, an overlay gradient and an accent for lettering. */
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    wash: 'rgba(255, 110, 60, 0.16)',
    overlay: [[0, 'rgba(255, 190, 90, 0.10)'], [0.6, 'rgba(255, 110, 80, 0.05)'], [1, 'rgba(160, 30, 110, 0.28)']],
    accent: '#ff9e2e',
    band: '#1c0b33',
  },
  neon: {
    label: 'Neon Night',
    wash: 'rgba(255, 46, 136, 0.14)',
    overlay: [[0, 'rgba(25, 227, 255, 0.12)'], [0.55, 'rgba(120, 40, 200, 0.08)'], [1, 'rgba(255, 46, 136, 0.26)']],
    accent: '#19e3ff',
    band: '#0d0a24',
  },
  noir: {
    label: 'Palm Noir',
    wash: 'rgba(20, 20, 30, 0.22)',
    overlay: [[0, 'rgba(255, 255, 255, 0.06)'], [1, 'rgba(0, 0, 0, 0.34)']],
    accent: '#f5f0e6',
    band: '#101014',
  },
  dawn: {
    label: 'Pastel Dawn',
    wash: 'rgba(255, 190, 210, 0.14)',
    overlay: [[0, 'rgba(255, 220, 180, 0.14)'], [0.6, 'rgba(255, 170, 200, 0.08)'], [1, 'rgba(150, 110, 220, 0.22)']],
    accent: '#ff7eb6',
    band: '#3a2140',
  },
  vice: {
    label: 'Vice Gold',
    wash: 'rgba(255, 180, 40, 0.14)',
    overlay: [[0, 'rgba(255, 210, 110, 0.12)'], [0.6, 'rgba(200, 120, 40, 0.06)'], [1, 'rgba(90, 20, 90, 0.3)']],
    accent: '#ffd24d',
    band: '#221036',
  },
};

/** The condensed heavy stack the cover lettering uses (system fonts, offline). */
export const TITLE_FONT = '"Noto Sans ExtraCondensed", "Noto Sans Condensed", "Arial Narrow", sans-serif';
/** The script-style subtitle stack (italic serif, offline). */
export const SCRIPT_FONT = 'italic 700 "Noto Serif", Georgia, serif';
/** The plain stack for small labels and the badge. */
export const LABEL_FONT = '"Noto Sans", "DejaVu Sans", sans-serif';

/** How many stars the heat meter shows, out of five. */
const HEAT_STARS = 5;

/**
 * A photo source's natural size: an image's natural size, a canvas's own size.
 */
function photoSize(photo) {
  if (!photo) return null;
  if (typeof photo.naturalWidth === 'number' && photo.naturalWidth > 0) {
    return { w: photo.naturalWidth, h: photo.naturalHeight };
  }
  return { w: photo.width, h: photo.height };
}

/**
 * Draws one photo into a panel rect, cover-fit, with the panel's zoom and
 * pan. `zoom` 1 fills the panel; `ox`/`oy` pan from -1 (one edge) to 1.
 */
export function drawPanelPhoto(ctx, rect, photo, zoom, ox, oy) {
  const size = photoSize(photo);
  if (!size) return;
  const scale = Math.max(rect.w / size.w, rect.h / size.h) * zoom;
  const pw = size.w * scale;
  const ph = size.h * scale;
  const maxX = Math.max(0, (pw - rect.w) / 2);
  const maxY = Math.max(0, (ph - rect.h) / 2);
  const dx = rect.x + (rect.w - pw) / 2 - ox * maxX;
  const dy = rect.y + (rect.h - ph) / 2 - oy * maxY;
  ctx.drawImage(photo, dx, dy, pw, ph);
}

/** A colour grade over a rect: wash, then a vertical overlay gradient. */
function gradeRect(ctx, rect, grade) {
  ctx.save();
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  for (const [o, c] of grade.overlay) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** A thin white frame and a soft inner shadow around a panel. */
function frameRect(ctx, rect, frame) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = frame;
  ctx.strokeRect(rect.x + frame / 2, rect.y + frame / 2, rect.w - frame, rect.h - frame);
  const shade = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(0,0,0,0.16)');
  shade.addColorStop(0.12, 'rgba(0,0,0,0)');
  shade.addColorStop(0.88, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Deterministic grain over the whole cover, from a fixed seed. */
function grainCover(ctx, w, h) {
  const rng = seededRandom(424242);
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(160, 160);
  for (let k = 0; k < img.data.length; k += 4) {
    const v = Math.floor(rng() * 255);
    img.data[k] = v;
    img.data[k + 1] = v;
    img.data[k + 2] = v;
    img.data[k + 3] = 14;
  }
  tctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** A dark vignette that pulls the eye to the middle of the cover. */
function vignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Fits a title to a width, shrinking the font until it fits or hits the floor. */
function fitFont(ctx, text, maxWidth, startSize, family, weight) {
  let size = startSize;
  for (;;) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth || size <= 12) return size;
    size = Math.max(12, size - 2);
  }
}

/** Draws the title block: badge, big condensed title, neon script subtitle. */
function drawTitleBlock(ctx, band, state, grade, w) {
  const { title, subtitle, badge, heat } = state;
  ctx.save();
  ctx.fillStyle = grade.band;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  const top = ctx.createLinearGradient(0, band.y, 0, band.y + band.h * 0.35);
  top.addColorStop(0, grade.accent);
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = top;
  ctx.fillRect(band.x, band.y, band.w, band.h * 0.35);
  ctx.globalAlpha = 1;
  const pad = band.w * 0.045;
  const cx = band.x + band.w / 2;

  // The block is a vertical stack of slots, centred in the band so nothing
  // ever runs past its bottom edge: badge, title, subtitle, stars.
  const slots = [];
  if (badge) {
    const bSize = Math.max(11, band.h * 0.105);
    slots.push({
      h: band.h * 0.2,
      draw(y0, h) {
        ctx.font = `700 ${bSize}px ${LABEL_FONT}`;
        const bw = ctx.measureText(badge).width + bSize * 1.6;
        const bh = bSize * 1.9;
        const bx = cx - bw / 2;
        ctx.fillStyle = grade.accent;
        ctx.beginPath();
        ctx.roundRect(bx, y0 + (h - bh) / 2, bw, bh, bh / 2);
        ctx.fill();
        ctx.fillStyle = grade.band;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badge, cx, y0 + h / 2 + bSize * 0.04);
      },
    });
  }

  const titleText = (title || 'UNTITLED').trim().toUpperCase();
  const titleSize = fitFont(ctx, titleText, band.w - pad * 2, band.h * 0.3, TITLE_FONT, 900);
  slots.push({
    h: band.h * 0.34,
    draw(y0, h) {
      ctx.font = `900 ${titleSize}px ${TITLE_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = Math.max(2, titleSize * 0.07);
      ctx.strokeText(titleText, cx, y0 + h / 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(titleText, cx, y0 + h / 2);
    },
  });

  const subText = (subtitle || '').trim();
  if (subText) {
    const subSize = fitFont(ctx, subText, band.w - pad * 2, band.h * 0.13, SCRIPT_FONT, 700);
    slots.push({
      h: band.h * 0.16,
      draw(y0, h) {
        ctx.font = `italic 700 ${subSize}px ${SCRIPT_FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.save();
        ctx.shadowColor = grade.accent;
        ctx.shadowBlur = subSize * 0.5;
        ctx.fillStyle = grade.accent;
        ctx.fillText(subText, cx, y0 + h / 2);
        ctx.restore();
      },
    });
  }

  const starSize = Math.max(11, band.h * 0.085);
  slots.push({
    h: band.h * 0.1,
    draw(y0, h) {
      const starGap = starSize * 1.5;
      const total = HEAT_STARS * starGap - starSize * 0.4;
      let sx = cx - total / 2;
      const sy = y0 + h / 2;
      ctx.font = `${starSize}px ${LABEL_FONT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (let k = 0; k < HEAT_STARS; k++) {
        ctx.fillStyle = k < heat ? grade.accent : 'rgba(255,255,255,0.28)';
        ctx.fillText('★', sx, sy);
        sx += starGap;
      }
    },
  });

  const gap = band.h * 0.025;
  const total = slots.reduce((n, s) => n + s.h, 0) + gap * (slots.length - 1);
  let y = band.y + (band.h - total) / 2;
  for (const slot of slots) {
    slot.draw(y, slot.h);
    y += slot.h + gap;
  }
  ctx.restore();
}

/** The nine-panel layout's centre cell: a dark title card with stars. */
function drawNineCentre(ctx, rect, state, grade) {
  ctx.save();
  ctx.fillStyle = grade.band;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const titleText = (state.title || 'UNTITLED').trim().toUpperCase();
  const size = fitFont(ctx, titleText, rect.w * 0.86, rect.h * 0.24, TITLE_FONT, 900);
  ctx.font = `900 ${size}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  const words = titleText.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > rect.w * 0.86 && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const lineH = size * 1.05;
  let y = rect.y + rect.h / 2 - ((lines.length - 1) * lineH) / 2;
  for (const ln of lines) {
    ctx.fillText(ln, rect.x + rect.w / 2, y);
    y += lineH;
  }
  const starSize = Math.max(11, rect.h * 0.09);
  ctx.font = `${starSize}px ${LABEL_FONT}`;
  ctx.fillStyle = grade.accent;
  let stars = '';
  for (let k = 0; k < HEAT_STARS; k++) stars += k < state.heat ? '★' : '☆';
  ctx.fillText(stars, rect.x + rect.w / 2, rect.y + rect.h - rect.h * 0.1);
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` (its own size) from the editor state:
 *   layout, grade, size (implicit in the canvas), title, subtitle, badge,
 *   heat, panels: [{ photo, zoom, ox, oy }], grain, vignette.
 * The centre cell of the nine-panel layout is a title card, so its panel is
 * skipped; every other layout draws a title band under the panels.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.hero;
  const gap = Math.max(3, Math.round(Math.min(w, h) * 0.007));
  const frame = Math.max(2, Math.round(Math.min(w, h) * 0.004));

  ctx.save();
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, 0, w, h);

  const isNine = state.layout === 'nine';
  const bandH = isNine ? 0 : Math.round(h * 0.17);
  const content = { x: gap, y: gap, w: w - gap * 2, h: h - bandH - gap * (isNine ? 1 : 2), gap };

  if (state.layout === 'tilt') {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, grade.band);
    sky.addColorStop(0.55, GRADES[state.grade].overlay[1][1]);
    sky.addColorStop(1, grade.band);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h - bandH);
  }

  const rects = layout.panels(content);
  rects.forEach((rect, index) => {
    if (isNine && index === 4) {
      drawNineCentre(ctx, rect, state, grade);
      frameRect(ctx, rect, frame);
      return;
    }
    const panel = state.panels[index] ?? state.panels[0];
    ctx.save();
    if (rect.tilt) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.tilt);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      ctx.fillStyle = '#fdf8ef';
      ctx.fillRect(-frame * 3, -frame * 3, rect.w + frame * 6, rect.h + frame * 7);
      ctx.beginPath();
      ctx.rect(0, 0, rect.w, rect.h);
      ctx.clip();
      if (panel && panel.photo) drawPanelPhoto(ctx, { x: 0, y: 0, w: rect.w, h: rect.h }, panel.photo, panel.zoom, panel.ox, panel.oy);
      gradeRect(ctx, { x: 0, y: 0, w: rect.w, h: rect.h }, grade);
      ctx.restore();
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.tilt);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      frameRect(ctx, { x: 0, y: 0, w: rect.w, h: rect.h }, frame);
      ctx.restore();
      return;
    }
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (panel && panel.photo) drawPanelPhoto(ctx, rect, panel.photo, panel.zoom, panel.ox, panel.oy);
    gradeRect(ctx, rect, grade);
    ctx.restore();
    frameRect(ctx, rect, frame);
  });

  if (!isNine) {
    drawTitleBlock(ctx, { x: 0, y: h - bandH, w, h: bandH }, state, grade, w);
  }
  if (state.vignette !== false) vignette(ctx, w, h);
  if (state.grain !== false) grainCover(ctx, w, h);
  ctx.restore();
}

/** A layout's panel count, for the editor's panel list. */
export function panelCount(layoutId) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.hero;
  const box = { x: 0, y: 0, w: 100, h: 100, gap: 1 };
  return layout.panels(box).length;
}

/**
 * The panel rects a layout draws at a canvas of `w` by `h`, in the same
 * geometry drawCover uses, so the editor can hit-test its preview.
 */
export function coverRects(w, h, layoutId) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.hero;
  const gap = Math.max(3, Math.round(Math.min(w, h) * 0.007));
  const isNine = layoutId === 'nine';
  const bandH = isNine ? 0 : Math.round(h * 0.17);
  const content = { x: gap, y: gap, w: w - gap * 2, h: h - bandH - gap * (isNine ? 1 : 2), gap };
  return layout.panels(content);
}
