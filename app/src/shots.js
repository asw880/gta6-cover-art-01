// Vice City Cover Studio — shot runner (v4 rewrite).
// Reads the scene from the URL (?shot=cover|editor plus the same params
// the editor understands: look, layout, grade, title, subtitle, badge,
// stars, stacked, tracking, photos, slots and per-photo ox/oy/zoom),
// applies it through the editor, and raises window.__shotReady once fonts
// and photos are in and the cover is painted. The screenshot driver waits
// on that flag. With no ?shot= param this file does nothing: the editor
// boots alone.

import { renderPoster } from './cover.js';

const query = new URLSearchParams(location.search);
const kind = query.get('shot');

function waitForStudio() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.__coverStudio) resolve(window.__coverStudio);
      else setTimeout(check, 50);
    };
    check();
  });
}

async function ensureTypefaces() {
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('20px Pacifico'),
    ]);
    await document.fonts.ready;
  } catch {
    // A font that fails to load falls back to the canvas default; the
    // cover still paints.
  }
}

async function main() {
  if (!kind) return;
  const scene = Object.fromEntries(query.entries());
  const api = await waitForStudio();
  await api.applyScene(scene);
  await ensureTypefaces();
  const design = api.designSnapshot();
  for (const photo of design.photos) {
    if (photo.image && photo.image.decode) await photo.image.decode().catch(() => {});
  }
  if (kind === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('cover');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderPoster(canvas.getContext('2d'), api.designSnapshot(), canvas.width, canvas.height);
  } else {
    api.draw();
  }
  await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  window.__shotReady = true;
}

main();
