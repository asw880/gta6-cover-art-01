// Vice City Cover Studio — page wiring: photos, controls, drag-to-crop,
// undo/redo, live preview and one-click PNG export in three post sizes.
import { drawCoverArt, GRADES, LAYOUTS, LOOKS, SIZES, layoutPanels } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const $ = (id) => document.getElementById(id);

const SAMPLES = ['samples/boulevard.jpg', 'samples/pier.jpg', 'samples/palms.jpg'];

/** Fresh default state: 9 panel slots (layouts use the first N). */
export function defaultState() {
  return {
    look: 'keyart',
    layout: 'slash',
    grade: 'sunset',
    size: 'landscape',
    title: 'VICE CITY',
    subtitle: 'one last sunset heist',
    badge: 'VICE CITY',
    heat: 4,
    stacked: true,
    tracking: 2,
    grain: true,
    vignette: true,
    halftone: true,
    selected: 0,
    panels: Array.from({ length: 9 }, (_, i) => ({
      photo: i % 3, zoom: 1, ox: 0, oy: 0,
    })),
  };
}

let state = defaultState();
let photos = []; // HTMLImageElement per upload slot (0..3); samples fill 0 and 1.
let rects = [];
let undoStack = [];
let redoStack = [];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function snapshot() {
  return JSON.stringify({ ...state, panels: state.panels.map((p) => ({ ...p })) });
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}
function restore(json) {
  state = JSON.parse(json);
  syncControls();
  redraw();
}
function updateUndoButtons() {
  $('undo').disabled = undoStack.length === 0;
  $('redo').disabled = redoStack.length === 0;
}

function redraw() {
  const size = SIZES[state.size] || SIZES.landscape;
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  rects = drawCoverArt(canvas, state, photos);
}

function setStatus(text) {
  statusEl.textContent = text;
}

/** Apply a Look: layout + grade + title treatment, set together in one click. */
function applyLook(key) {
  const look = LOOKS[key];
  if (!look) return;
  state.look = key;
  state.layout = look.layout;
  state.grade = look.grade;
  state.stacked = look.stacked;
  state.tracking = look.tracking;
}

/** Build the layout / grade / size / look picker buttons from cover.js tables. */
function buildPickers() {
  const mk = (holder, entries, current, onPick) => {
    const box = $(holder);
    box.innerHTML = '';
    for (const [key, def] of Object.entries(entries)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick' + (key === current ? ' active' : '');
      b.textContent = def.label;
      b.dataset.key = key;
      b.addEventListener('click', () => { pushUndo(); onPick(key); syncControls(); redraw(); });
      box.appendChild(b);
    }
  };
  mk('looks', LOOKS, state.look, applyLook);
  mk('layouts', LAYOUTS, state.layout, (k) => { state.layout = k; });
  mk('grades', GRADES, state.grade, (k) => { state.grade = k; });
  mk('sizes', SIZES, state.size, (k) => { state.size = k; });
}

function syncControls() {
  document.querySelectorAll('#looks .pick').forEach((b) => b.classList.toggle('active', b.dataset.key === state.look));
  document.querySelectorAll('#layouts .pick').forEach((b) => b.classList.toggle('active', b.dataset.key === state.layout));
  document.querySelectorAll('#grades .pick').forEach((b) => b.classList.toggle('active', b.dataset.key === state.grade));
  document.querySelectorAll('#sizes .pick').forEach((b) => b.classList.toggle('active', b.dataset.key === state.size));
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('badge').value = state.badge;
  $('heat').value = String(state.heat);
  $('stacked').checked = !!state.stacked;
  $('tracking').value = String(state.tracking ?? 2);
  $('trackingVal').textContent = `${state.tracking ?? 2}px`;
  $('grain').checked = state.grain;
  $('vignette').checked = state.vignette;
  $('halftone').checked = state.halftone;
  const cfg = state.panels[state.selected] || { photo: 0, zoom: 1 };
  $('panelPhoto').value = String(cfg.photo);
  $('zoom').value = String(cfg.zoom);
  $('zoomVal').textContent = `${Math.round(cfg.zoom * 100)}%`;
  $('panelLabel').textContent = `Panel ${state.selected + 1} of ${rects.length || layoutPanels(state.layout, 1, 1).length}`;
}

/** The app object the ?shot= scenes drive (see shots.js). */
export const app = {
  async loadSamples(names) {
    photos = [];
    for (const name of names) photos.push(await loadImage(`samples/${name}.jpg`));
    return photos;
  },
  async loadUploadSlot(slot, file) {
    photos[slot] = await loadImage(URL.createObjectURL(file));
    return photos[slot];
  },
  setState(patch) {
    Object.assign(state, patch);
    if (patch.panels) state.panels = patch.panels;
    syncControls();
    redraw();
  },
  getState() { return state; },
  redraw,
  canvas,
};

/** Export the current cover at its chosen size as a PNG download. */
export function exportPNG() {
  redraw();
  const size = SIZES[state.size] || SIZES.landscape;
  canvas.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved vice-city-cover-${size.w}x${size.h}.png`);
  }, 'image/png');
}

// ---- controls ----
$('photo').addEventListener('change', async (e) => {
  const files = [...e.target.files].slice(0, 4);
  if (!files.length) return;
  pushUndo();
  for (let i = 0; i < files.length; i++) {
    await app.loadUploadSlot(i, files[i]);
  }
  // New photos fill the panels in order.
  state.panels.forEach((p, i) => { if (i < files.length) p.photo = i; });
  syncControls();
  redraw();
  setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} loaded — drag a panel to reposition it.`);
});
$('useSamples').addEventListener('click', async () => {
  pushUndo();
  await app.loadSamples(['boulevard', 'pier', 'palms']);
  state.panels.forEach((p, i) => { p.photo = i % 3; });
  syncControls();
  redraw();
  setStatus('Sample photos loaded.');
});
$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
$('heat').addEventListener('input', (e) => { state.heat = Number(e.target.value); redraw(); });
$('stacked').addEventListener('change', (e) => { pushUndo(); state.stacked = e.target.checked; redraw(); });
$('tracking').addEventListener('input', (e) => {
  state.tracking = Number(e.target.value);
  $('trackingVal').textContent = `${state.tracking}px`;
  redraw();
});
$('tracking').addEventListener('change', pushUndo);
$('grain').addEventListener('change', (e) => { pushUndo(); state.grain = e.target.checked; redraw(); });
$('vignette').addEventListener('change', (e) => { pushUndo(); state.vignette = e.target.checked; redraw(); });
$('halftone').addEventListener('change', (e) => { pushUndo(); state.halftone = e.target.checked; redraw(); });
$('panelPhoto').addEventListener('change', (e) => {
  pushUndo();
  state.panels[state.selected].photo = Number(e.target.value);
  redraw();
});
$('zoom').addEventListener('input', (e) => {
  state.panels[state.selected].zoom = Number(e.target.value);
  $('zoomVal').textContent = `${Math.round(state.panels[state.selected].zoom * 100)}%`;
  redraw();
});
$('zoom').addEventListener('change', pushUndo);
$('export').addEventListener('click', exportPNG);
$('undo').addEventListener('click', () => {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  updateUndoButtons();
});
$('redo').addEventListener('click', () => {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  updateUndoButtons();
});
$('shuffle').addEventListener('click', () => {
  pushUndo();
  const keys = Object.keys(GRADES);
  state.grade = keys[Math.floor(Math.random() * keys.length)];
  const layouts = Object.keys(LAYOUTS);
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  syncControls();
  redraw();
});

// ---- drag to pan the photo inside its panel; click selects the panel ----
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const idx = rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (idx < 0) return;
  state.selected = idx;
  syncControls();
  pushUndo();
  const cfg = state.panels[idx];
  drag = { idx, startX: p.x, startY: p.y, ox: cfg.ox, oy: cfg.oy, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const rect = rects[drag.idx];
  const cfg = state.panels[drag.idx];
  const dx = (p.x - drag.startX) / rect.w;
  const dy = (p.y - drag.startY) / rect.h;
  if (Math.abs(dx) + Math.abs(dy) > 0.01) drag.moved = true;
  cfg.ox = Math.max(-1, Math.min(1, drag.ox + dx * 2));
  cfg.oy = Math.max(-1, Math.min(1, drag.oy + dy * 2));
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});

// ---- boot ----
buildPickers();
syncControls();
updateUndoButtons();
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), app);
} else {
  // Load the samples so the first paint already looks like a cover.
  document.fonts.load('16px Anton').catch(() => {});
  document.fonts.load('16px Pacifico').catch(() => {});
  app.loadSamples(['boulevard', 'pier', 'palms']).then(() => {
    document.fonts.ready.then(() => redraw());
    redraw();
  });
  redraw();
}
