// The editor: wires the controls to the cover engine. Photos come from the
// person's own files (read on their machine, never uploaded) or from the
// built-in sample scenes; each panel takes its own photo, zoom and pan, the
// caption edits live, and Export writes the cover as a PNG at the chosen
// post size. No network request is ever made.

import { drawCover, panelCount, coverRects, LAYOUTS, GRADES, SIZES } from './cover.js';
import { SCENE_IDS, SCENE_NAMES, scenePhoto } from './scenes.js';

/** A fresh editor state: the hero layout, a sunset grade, the square size. */
export function defaultState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    sizeId: 'square',
    title: 'Sunset Heist',
    subtitle: 'Vice City Nights',
    badge: 'VICE CITY',
    heat: 5,
    grain: true,
    vignette: true,
    selectedPanel: 0,
    photos: [],
    panels: [],
  };
}

/** Loads an image file from the person's machine into an <img> element. */
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`could not read ${file.name}`));
    };
    img.src = url;
  });
}

/**
 * Boots the editor inside `root` (the page's <main>): builds the controls,
 * paints the live preview, and returns the editor API the screenshot scenes
 * and the export button drive.
 */
export function bootEditor(root) {
  const state = defaultState();
  const $ = (id) => root.querySelector(`#${id}`);
  const preview = $('preview');
  const status = $('status');

  let nextPhotoId = 1;

  /** The photo for a panel: the panel's own photo, else the first photo. */
  function panelPhoto(panel) {
    if (!panel) return null;
    const found = state.photos.find((p) => p.id === panel.photoId);
    return found ? found.source : state.photos[0] ? state.photos[0].source : null;
  }

  /** The cover state the engine draws: panels resolved to photo sources. */
  function coverState() {
    return {
      layout: state.layout,
      grade: state.grade,
      title: state.title,
      subtitle: state.subtitle,
      badge: state.badge,
      heat: state.heat,
      grain: state.grain,
      vignette: state.vignette,
      panels: state.panels.map((panel) => ({
        photo: panelPhoto(panel),
        zoom: panel.zoom,
        ox: panel.ox,
        oy: panel.oy,
      })),
    };
  }

  /** The chosen post size. */
  function currentSize() {
    return SIZES.find((s) => s.id === state.sizeId) ?? SIZES[0];
  }

  /** Repaints the live preview at the chosen post size. */
  function redraw() {
    const size = currentSize();
    preview.width = size.width;
    preview.height = size.height;
    drawCover(preview, coverState());
  }

  /** Adds a photo to the tray and, when no panel shows a real photo yet, fills them with it. */
  function addPhoto(source, label) {
    const photo = { id: nextPhotoId++, label, source };
    state.photos.push(photo);
    const placed = state.panels.some((panel) => state.photos.some((p) => p.id === panel.photoId));
    if (!placed) {
      fillPanels(photo.id);
    }
    renderTray();
    renderPanelEditor();
    redraw();
    return photo;
  }

  /** Fills every panel with one photo, keeping each panel's crop. */
  function fillPanels(photoId) {
    const count = panelCount(state.layout);
    state.panels = Array.from({ length: count }, (_, i) => ({
      photoId,
      zoom: state.panels[i] ? state.panels[i].zoom : 1,
      ox: state.panels[i] ? state.panels[i].ox : 0,
      oy: state.panels[i] ? state.panels[i].oy : 0,
    }));
  }

  /** The tray of photo thumbnails: click one to put it in the selected panel. */
  function renderTray() {
    const tray = $('tray');
    tray.replaceChildren();
    for (const photo of state.photos) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumb';
      button.title = `${photo.label} — put in the selected panel`;
      const thumb = document.createElement('canvas');
      thumb.width = 96;
      thumb.height = 96;
      const tctx = thumb.getContext('2d');
      const sw = photo.source.naturalWidth ?? photo.source.width;
      const sh = photo.source.naturalHeight ?? photo.source.height;
      const scale = Math.max(96 / sw, 96 / sh);
      tctx.drawImage(photo.source, (96 - sw * scale) / 2, (96 - sh * scale) / 2, sw * scale, sh * scale);
      button.append(thumb);
      const caption = document.createElement('span');
      caption.textContent = photo.label;
      button.append(caption);
      button.addEventListener('click', () => {
        assignPhoto(state.selectedPanel, photo.id);
      });
      tray.append(button);
    }
    const used = state.panels[state.selectedPanel];
    $('fillAll').disabled = state.photos.length === 0 || !used;
  }

  /** The panel editor: chips for each panel, photo picker, zoom and reset. */
  function renderPanelEditor() {
    const chips = $('panelChips');
    chips.replaceChildren();
    const count = panelCount(state.layout);
    for (let i = 0; i < count; i++) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (i === state.selectedPanel ? ' selected' : '');
      chip.textContent = state.layout === 'nine' && i === 4 ? 'Title' : `Panel ${i + 1}`;
      chip.disabled = state.layout === 'nine' && i === 4;
      chip.addEventListener('click', () => {
        state.selectedPanel = i;
        renderPanelEditor();
        renderTray();
      });
      chips.append(chip);
    }
    const picker = $('panelPhoto');
    picker.replaceChildren();
    for (const photo of state.photos) {
      const option = document.createElement('option');
      option.value = String(photo.id);
      option.textContent = photo.label;
      picker.append(option);
    }
    const panel = state.panels[state.selectedPanel];
    picker.value = panel ? String(panel.photoId) : '';
    picker.disabled = state.photos.length === 0;
    const zoom = $('zoom');
    zoom.value = panel ? String(panel.zoom) : '1';
    zoom.disabled = !panel;
    $('zoomValue').textContent = panel ? `${Math.round(panel.zoom * 100)}%` : '—';
    $('fillAll').disabled = state.photos.length === 0 || !panel;
  }

  /** Puts a photo in one panel and repaints. */
  function assignPhoto(panelIndex, photoId) {
    const panel = state.panels[panelIndex];
    if (!panel) return;
    panel.photoId = photoId;
    renderPanelEditor();
    redraw();
  }

  /** Applies a layout, keeping each panel's photo and crop where they fit. */
  function applyLayout(layoutId) {
    const old = state.panels;
    state.layout = layoutId;
    const count = panelCount(layoutId);
    state.panels = Array.from({ length: count }, (_, i) => {
      const keep = old[i];
      const fallback = old[0] ?? { photoId: state.photos[0] ? state.photos[0].id : 0, zoom: 1, ox: 0, oy: 0 };
      return keep ?? { ...fallback };
    });
    state.selectedPanel = 0;
    renderLayoutButtons();
    renderPanelEditor();
    redraw();
  }

  /** The layout picker buttons, with the active one marked. */
  function renderLayoutButtons() {
    const group = $('layoutGroup');
    group.replaceChildren();
    for (const [id, layout] of Object.entries(LAYOUTS)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pill' + (id === state.layout ? ' selected' : '');
      button.textContent = layout.label;
      button.addEventListener('click', () => applyLayout(id));
      group.append(button);
    }
  }

  /** The grade picker buttons, with the active one marked. */
  function renderGradeButtons() {
    const group = $('gradeGroup');
    group.replaceChildren();
    for (const [id, grade] of Object.entries(GRADES)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pill' + (id === state.grade ? ' selected' : '');
      button.textContent = grade.label;
      button.addEventListener('click', () => {
        state.grade = id;
        renderGradeButtons();
        redraw();
      });
      group.append(button);
    }
  }

  /** The size picker buttons, with the active one marked. */
  function renderSizeButtons() {
    const group = $('sizeGroup');
    group.replaceChildren();
    for (const size of SIZES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pill' + (size.id === state.sizeId ? ' selected' : '');
      button.textContent = size.label;
      button.addEventListener('click', () => {
        state.sizeId = size.id;
        renderSizeButtons();
        redraw();
      });
      group.append(button);
    }
  }

  /** The heat meter: five stars, click to set how hot the cover reads. */
  function renderHeat() {
    const group = $('heatGroup');
    group.replaceChildren();
    for (let k = 1; k <= 5; k++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'star' + (k <= state.heat ? ' lit' : '');
      button.textContent = '★';
      button.setAttribute('aria-label', `${k} star${k > 1 ? 's' : ''}`);
      button.addEventListener('click', () => {
        state.heat = k;
        renderHeat();
        redraw();
      });
      group.append(button);
    }
  }

  /** The sample-scene buttons: paint a scene and add it as a photo. */
  function renderSamples() {
    const group = $('sampleGroup');
    group.replaceChildren();
    for (const id of SCENE_IDS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pill';
      button.textContent = `Try ${SCENE_NAMES[id]}`;
      button.addEventListener('click', () => {
        addPhoto(scenePhoto(id), SCENE_NAMES[id]);
        status.textContent = `${SCENE_NAMES[id]} loaded — click a thumbnail to place it, or drag the cover to reframe.`;
      });
      group.append(button);
    }
  }

  // --- wiring ---------------------------------------------------------------

  $('photoFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const img = await loadImageFile(file);
      addPhoto(img, file.name.replace(/\.[^.]+$/, ''));
      status.textContent = `${file.name} loaded — click its thumbnail to place it in the selected panel.`;
    } catch {
      status.textContent = `Could not read ${file.name} as an image.`;
    }
    event.target.value = '';
  });

  $('title').addEventListener('input', (event) => {
    state.title = event.target.value;
    redraw();
  });
  $('subtitle').addEventListener('input', (event) => {
    state.subtitle = event.target.value;
    redraw();
  });
  $('badge').addEventListener('input', (event) => {
    state.badge = event.target.value;
    redraw();
  });

  $('panelPhoto').addEventListener('change', (event) => {
    assignPhoto(state.selectedPanel, Number(event.target.value));
  });
  $('zoom').addEventListener('input', (event) => {
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    panel.zoom = Number(event.target.value);
    $('zoomValue').textContent = `${Math.round(panel.zoom * 100)}%`;
    redraw();
  });
  $('resetCrop').addEventListener('click', () => {
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
    renderPanelEditor();
    redraw();
  });
  $('fillAll').addEventListener('click', () => {
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    fillPanels(panel.photoId);
    renderPanelEditor();
    redraw();
    status.textContent = 'Every panel now shows the same photo.';
  });

  $('grain').addEventListener('change', (event) => {
    state.grain = event.target.checked;
    redraw();
  });
  $('vignette').addEventListener('change', (event) => {
    state.vignette = event.target.checked;
    redraw();
  });

  $('export').addEventListener('click', () => {
    const size = currentSize();
    const offscreen = document.createElement('canvas');
    offscreen.width = size.width;
    offscreen.height = size.height;
    drawCover(offscreen, coverState());
    offscreen.toBlob((blob) => {
      if (!blob) {
        status.textContent = 'Export failed — the browser could not make the PNG.';
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cover-${size.width}x${size.height}.png`;
      a.click();
      status.textContent = `Saved cover-${size.width}x${size.height}.png`;
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
  });

  // --- drag to reframe, wheel to zoom --------------------------------------

  let drag = null;
  function canvasPoint(event) {
    const rect = preview.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * preview.width,
      y: ((event.clientY - rect.top) / rect.height) * preview.height,
    };
  }
  function hitPanel(point) {
    const rects = coverRects(preview.width, preview.height, state.layout);
    for (let i = rects.length - 1; i >= 0; i--) {
      const r = rects[i];
      if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) return i;
    }
    return -1;
  }
  preview.addEventListener('pointerdown', (event) => {
    const hit = hitPanel(canvasPoint(event));
    if (hit < 0) return;
    if (state.layout === 'nine' && hit === 4) return;
    state.selectedPanel = hit;
    renderPanelEditor();
    renderTray();
    const panel = state.panels[hit];
    drag = { panel, x: event.clientX, y: event.clientY, ox: panel.ox, oy: panel.oy };
    preview.setPointerCapture(event.pointerId);
  });
  preview.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const rect = preview.getBoundingClientRect();
    const scaleX = preview.width / rect.width;
    const scaleY = preview.height / rect.height;
    const dx = (event.clientX - drag.x) * scaleX;
    const dy = (event.clientY - drag.y) * scaleY;
    const rects = coverRects(preview.width, preview.height, state.layout);
    const r = rects[state.selectedPanel];
    if (!r) return;
    drag.panel.ox = Math.max(-1, Math.min(1, drag.ox - (dx / r.w) * 2));
    drag.panel.oy = Math.max(-1, Math.min(1, drag.oy - (dy / r.h) * 2));
    redraw();
  });
  preview.addEventListener('pointerup', () => {
    drag = null;
  });
  preview.addEventListener('wheel', (event) => {
    event.preventDefault();
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    panel.zoom = Math.max(1, Math.min(3, panel.zoom * (event.deltaY < 0 ? 1.08 : 0.93)));
    renderPanelEditor();
    redraw();
  }, { passive: false });

  // --- first paint ----------------------------------------------------------

  renderLayoutButtons();
  renderGradeButtons();
  renderSizeButtons();
  renderHeat();
  renderSamples();
  renderPanelEditor();
  renderTray();
  redraw();

  return {
    state,
    redraw,
    addPhoto,
    fillPanels,
    applyLayout,
    setGrade(gradeId) {
      if (GRADES[gradeId]) {
        state.grade = gradeId;
        renderGradeButtons();
        redraw();
      }
    },
    setSize(sizeId) {
      if (SIZES.some((s) => s.id === sizeId)) {
        state.sizeId = sizeId;
        renderSizeButtons();
        redraw();
      }
    },
    setTitle(text) {
      state.title = text;
      $('title').value = text;
      redraw();
    },
    setSubtitle(text) {
      state.subtitle = text;
      $('subtitle').value = text;
      redraw();
    },
    setBadge(text) {
      state.badge = text;
      $('badge').value = text;
      redraw();
    },
    /** Exports the cover at full size and hands the PNG blob to `receive`. */
    exportPng(receive) {
      const size = currentSize();
      const offscreen = document.createElement('canvas');
      offscreen.width = size.width;
      offscreen.height = size.height;
      drawCover(offscreen, coverState());
      offscreen.toBlob((blob) => receive(blob, size), 'image/png');
    },
  };
}
