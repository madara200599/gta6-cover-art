// Fixed scenes for screenshots: the page's only entry module. With no query
// it boots the editor with a sample scene already loaded; `?shot=editor`
// loads the named scenes into the panels for a shot of the app at work, and
// `?shot=cover` draws the cover alone, full frame, for a shot of the cover
// the app exported. `window.__shotReady` is set once the scene is painted.

import { bootEditor } from './main.js';
import { SCENE_IDS, SCENE_NAMES, scenePhoto } from './scenes.js';

/** The scenes a shot loads, from the `scenes` query (comma-separated ids). */
function shotScenes(query) {
  const named = (query.get('scenes') ?? '').split(',').map((s) => s.trim()).filter((s) => SCENE_IDS.includes(s));
  if (named.length > 0) return named;
  const single = query.get('photo');
  if (single && SCENE_IDS.includes(single)) return [single];
  return ['boulevard', 'neon', 'pier', 'rooftop'];
}

/** Applies the shot's layout, grade, size and caption from the query. */
function applyShotOptions(editor, query) {
  const layout = query.get('layout');
  if (layout) editor.applyLayout(layout);
  const grade = query.get('grade');
  if (grade) editor.setGrade(grade);
  const size = query.get('size');
  if (size) editor.setSize(size);
  const title = query.get('title');
  if (title !== null) editor.setTitle(title);
  const subtitle = query.get('subtitle');
  if (subtitle !== null) editor.setSubtitle(subtitle);
  const badge = query.get('badge');
  if (badge !== null) editor.setBadge(badge);
}

/** Boots the editor and, when a shot is asked for, stages its fixed scene. */
export function runShot() {
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  const editor = bootEditor(document.querySelector('main'));
  window.__editor = editor;

  if (!shot) {
    const photo = editor.addPhoto(scenePhoto('boulevard'), SCENE_NAMES.boulevard);
    editor.fillPanels(photo.id);
    editor.redraw();
    return editor;
  }

  const scenes = shotScenes(query);
  const photos = scenes.map((id) => editor.addPhoto(scenePhoto(id), SCENE_NAMES[id]));
  applyShotOptions(editor, query);
  // Deal the scenes round-robin over the panels, so a nine-panel cover
  // varies across all nine cells instead of repeating the first photo.
  editor.state.panels.forEach((panel, i) => {
    panel.photoId = photos[i % photos.length].id;
  });
  if (shot === 'cover') document.body.classList.add('shot-cover');
  editor.redraw();
  // The canvas lettering needs the condensed face loaded; paint again once
  // the fonts are ready so the shot shows the real lettering.
  document.fonts.ready.then(() => {
    editor.redraw();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__shotReady = true;
    }));
  });
  return editor;
}

runShot();
