// Fixed scenes for screenshots, reproducible from the app's own drawing:
// ?shot=cover draws one exported cover full-frame (params: layout, grade,
// size, photo, caption, subtitle, badge, heat); ?shot=editor shows the
// editor with sample photos loaded. window.__shotReady is set once painted.
import { defaultState } from './main.js';

const PHOTOS = {
  pier: 'pier',
  boulevard: 'boulevard',
};

function panelsFor(photos, count) {
  const list = photos.length ? photos : [0];
  const zooms = [1.0, 1.0, 1.3, 1.1, 1.2, 1.05, 1.25, 1.0, 1.15];
  const pans = [-0.35, 0.1, 0.4, -0.15, 0.3, -0.4, 0.2, -0.05, 0.35];
  return Array.from({ length: 9 }, (_, i) => ({
    photo: list[i % list.length],
    zoom: zooms[i],
    ox: pans[i],
    // Panel 0 is the hero: shift the photo down so a portrait photo's
    // face stays in frame instead of being cropped off the top.
    oy: i === 0 ? 0.8 : (i % 3 === 1 ? 0.15 : 0),
  }));
}

export async function runShot(shot, query, app) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const names = (query.get('photo') ?? 'pier').split(',').map((s) => PHOTOS[s.trim()] ?? 'pier');
  await app.loadSamples(names);
  const state = defaultState();
  state.layout = query.get('layout') ?? 'slash';
  state.grade = query.get('grade') ?? 'sunset';
  state.size = query.get('size') ?? 'landscape';
  state.title = query.get('caption') ?? 'VICE CITY';
  state.subtitle = query.get('subtitle') ?? 'one last sunset heist';
  state.badge = query.get('badge') ?? 'VICE CITY';
  state.heat = Number(query.get('heat') ?? 4);
  state.grain = query.get('grain') !== '0';
  state.vignette = query.get('vignette') !== '0';
  state.halftone = query.get('halftone') !== '0';
  state.panels = panelsFor([...new Set(names)].map((n) => names.indexOf(n)), 9);
  // Panels cycle the loaded photos in order, with varied crops.
  state.panels = state.panels.map((p, i) => ({ ...p, photo: i % names.length }));
  await document.fonts.load('16px Anton').catch(() => {});
  await document.fonts.load('16px Pacifico').catch(() => {});
  await document.fonts.ready.catch(() => {});
  app.setState(state);
  app.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
