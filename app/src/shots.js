// Fixed scenes for screenshots, reproducible from the app's own drawing:
// ?shot=cover draws one exported cover full-frame (params: look, layout,
// grade, size, photo, caption, subtitle, badge, heat, stacked, tracking);
// ?shot=editor shows the editor with sample photos loaded.
// window.__shotReady is set once painted.
import { defaultState } from './main.js';
import { LOOKS } from './cover.js';

const PHOTOS = {
  pier: 'pier',
  boulevard: 'boulevard',
  palms: 'palms',
};

function panelsFor(photos, count) {
  const list = photos.length ? photos : [0];
  const zooms = [1.0, 1.0, 1.3, 1.1, 1.2, 1.05, 1.25, 1.0, 1.15];
  // Panel 0 is the hero: no horizontal pan (its face is centred; a pan
  // only inflates the scale and crops the face out of the frame).
  const pans = [0, 0.1, 0.4, -0.15, 0.3, -0.4, 0.2, -0.05, 0.35];
  return Array.from({ length: 9 }, (_, i) => ({
    photo: list[i % list.length],
    zoom: zooms[i],
    ox: pans[i],
    // Panel 0 is the hero: shift the photo down so a portrait photo's
    // face stays in frame instead of being cropped off the top.
    // (paintPanel scales for exact coverage, so the pan never opens a gap.)
    oy: i === 0 ? 0.8 : (i % 3 === 1 ? 0.15 : 0),
  }));
}

export async function runShot(shot, query, app) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const names = (query.get('photo') ?? 'pier').split(',').map((s) => PHOTOS[s.trim()] ?? 'pier');
  await app.loadSamples(names);
  const state = defaultState();
  // A Look sets layout + grade + title treatment together; explicit query
  // params override the Look's values one by one.
  const look = LOOKS[query.get('look') ?? ''] ?? null;
  if (look) {
    state.look = query.get('look');
    state.layout = look.layout;
    state.grade = look.grade;
    state.stacked = look.stacked;
    state.tracking = look.tracking;
  }
  state.layout = query.get('layout') ?? state.layout;
  state.grade = query.get('grade') ?? state.grade;
  state.size = query.get('size') ?? 'landscape';
  state.title = query.get('caption') ?? 'VICE CITY';
  state.subtitle = query.get('subtitle') ?? 'one last sunset heist';
  state.badge = query.get('badge') ?? 'VICE CITY';
  state.heat = Number(query.get('heat') ?? 4);
  state.stacked = query.get('stacked') !== null ? query.get('stacked') !== '0' : state.stacked;
  state.tracking = Number(query.get('tracking') ?? state.tracking);
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
