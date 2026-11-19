// Vice City Cover Studio — shot runner (v5).
// Applies a reproducible scene for ?shot=cover|editor|portrait|square, waits
// for the typefaces, paints once, then raises __shotReady for the driver.
// Scenes are hardcoded here so a shot never depends on a fetch; shots.json at
// the repository root mirrors them for the record.
import './main.js';

const SCENES = {
  cover: {
    signature: 'keyart', composition: 'slash', tone: 'sunset',
    headline: 'VICE CITY', caption: 'one last sunset heist', sticker: 'VICE CITY',
    stars: 4, stacked: true, tracking: 2, size: [1280, 720],
    frames: [
      { photo: 0, fx: 0.5, fy: 0.38, zoom: 1, panX: 0, panY: 0 },
      { photo: 1, fx: 0.5, fy: 0.5, zoom: 1, panX: 0, panY: 0 },
      { photo: 0, fx: 0.5, fy: 0.5, zoom: 1, panX: 0, panY: 0 },
    ],
  },
  editor: {
    signature: 'keyart', composition: 'hero3', tone: 'sunset',
    headline: 'BOULEVARD QUEEN', caption: 'queen of the boulevard', sticker: 'VICE CITY',
    stars: 4, stacked: true, tracking: 2, size: [1280, 720],
    frames: [
      { photo: 0, fx: 0.5, fy: 0.20, zoom: 1, panX: 0, panY: 0 },
      { photo: 1, fx: 0.5, fy: 0.5, zoom: 1, panX: 0, panY: 0 },
      { photo: 2, fx: 0.5, fy: 0.5, zoom: 1, panX: 0, panY: 0 },
      { photo: 0, fx: 0.5, fy: 0.38, zoom: 1, panX: 0, panY: 0 },
    ],
  },
  portrait: {
    signature: 'neon', composition: 'hero3', tone: 'neon',
    headline: 'NEON SHORE', caption: 'vice after dark', sticker: 'VICE CITY',
    stars: 4, stacked: true, tracking: 3, size: [1024, 1280],
    frames: [
      { photo: 0, fx: 0.5, fy: 0.30, zoom: 1, panX: 0, panY: 0 },
      { photo: 1, fx: 0.5, fy: 0.5, zoom: 1, panX: 0, panY: 0 },
      { photo: 2, fx: 0.5, fy: 0.5, zoom: 1, panX: 0, panY: 0 },
      { photo: 0, fx: 0.5, fy: 0.38, zoom: 1, panX: 0, panY: 0 },
    ],
  },
  square: {
    signature: 'strip', composition: 'tilt', tone: 'vice',
    headline: 'PIER PRESSURE', caption: 'cast off at golden hour', sticker: 'VICE CITY',
    stars: 4, stacked: true, tracking: 2, size: [1024, 1024],
    frames: [
      { photo: 0, fx: 0.5, fy: 0.38, zoom: 1, panX: 0, panY: 0 },
      { photo: 1, fx: 0.5, fy: 0.5, zoom: 1, panX: 0, panY: 0 },
      { photo: 2, fx: 0.5, fy: 0.5, zoom: 1, panX: 0, panY: 0 },
    ],
  },
};

async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('900 40px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
    await document.fonts.ready;
  } catch {
    // If a face fails to load, the canvas still paints with its fallback.
  }
}

async function awaitStudio() {
  for (let i = 0; i < 120; i += 1) {
    if (window.__viceStudio) return window.__viceStudio;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('studio never booted');
}

async function runShot() {
  const params = new URLSearchParams(location.search);
  const id = params.get('shot');
  if (!id) return; // No shot requested: the editor runs as-is, untouched.
  const scene = SCENES[id] ?? SCENES.cover;
  const studio = await awaitStudio();
  await fontsReady();
  if (id !== 'editor') document.body.classList.add('solo');
  studio.buildScene(scene);
  await fontsReady();
  studio.render();
  await new Promise((r) => setTimeout(r, 150));
  window.__shotReady = true;
}

runShot().catch((err) => {
  window.__shotError = String(err && err.message ? err.message : err);
});
