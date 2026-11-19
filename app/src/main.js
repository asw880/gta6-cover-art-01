// Vice City Cover Studio — editor (v4 rewrite).
// Wires the controls in index.html to the poster renderer: photo uploads
// and samples, one-click Looks, layout and grade pickers, caption fields,
// per-panel pan/zoom, undo/redo, live preview and PNG export. The shot
// runner (shots.js) drives this same state through window.__coverStudio.

import {
  PALETTES, PRESETS, ARRANGEMENTS,
  freshDesign, slotsForArrangement, arrangementBoxes, hitPanel, renderPoster,
} from './cover.js';

const el = (id) => document.getElementById(id);

const SAMPLE_NAMES = ['boulevard', 'pier', 'palms'];
const OUT_SIZES = [
  { label: '1080 × 1080', size: [1080, 1080] },
  { label: '1080 × 1350', size: [1080, 1350] },
  { label: '1920 × 1080', size: [1920, 1080] },
];

// The working state: the design fields cover.js renders, plus the editor's
// own bits (export size and which panel is selected).
const studio = {
  ...freshDesign(),
  outSize: OUT_SIZES[0].size,
  activePanel: 0,
};

let past = [];
let future = [];

// --- pictures ---------------------------------------------------------------

function loadPicture(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function registerPhoto(desc) {
  const image = await loadPicture(desc.src);
  const photo = {
    label: desc.name,
    src: desc.src,
    image,
    panX: desc.panX ?? 0.5,
    panY: desc.panY ?? 0.5,
    scale: desc.scale ?? 1,
  };
  studio.photos.push(photo);
  return photo;
}

async function fetchSamples() {
  studio.photos = [];
  for (const name of SAMPLE_NAMES) {
    try { await registerPhoto({ name, src: `samples/${name}.jpg` }); } catch { /* a missing sample skips */ }
  }
  studio.slots = slotsForArrangement(studio.arrangement);
}

// --- design snapshot + history ----------------------------------------------

function designSnapshot() {
  return {
    preset: studio.preset,
    arrangement: studio.arrangement,
    palette: studio.palette,
    heading: studio.heading,
    tagline: studio.tagline,
    ribbon: studio.ribbon,
    heat: studio.heat,
    stackedTitle: studio.stackedTitle,
    spacing: studio.spacing,
    grain: studio.grain,
    vignette: studio.vignette,
    photos: studio.photos,
    slots: [...studio.slots],
  };
}

function snapshotJSON() {
  return JSON.stringify({
    preset: studio.preset, arrangement: studio.arrangement, palette: studio.palette,
    heading: studio.heading, tagline: studio.tagline, ribbon: studio.ribbon,
    heat: studio.heat, stackedTitle: studio.stackedTitle, spacing: studio.spacing,
    grain: studio.grain, vignette: studio.vignette,
    outSize: studio.outSize, activePanel: studio.activePanel, slots: studio.slots,
    photos: studio.photos.map((p) => ({ name: p.label, src: p.src, panX: p.panX, panY: p.panY, scale: p.scale })),
  });
}

function remember() {
  past.push(snapshotJSON());
  if (past.length > 60) past.shift();
  future = [];
  refreshUndoState();
}

async function recall(serialized) {
  const d = JSON.parse(serialized);
  Object.assign(studio, {
    preset: d.preset, arrangement: d.arrangement, palette: d.palette,
    heading: d.heading, tagline: d.tagline, ribbon: d.ribbon,
    heat: d.heat, stackedTitle: d.stackedTitle, spacing: d.spacing,
    grain: d.grain, vignette: d.vignette,
    outSize: d.outSize, activePanel: d.activePanel, slots: d.slots,
  });
  studio.photos = [];
  for (const desc of d.photos) {
    try { await registerPhoto(desc); } catch { /* skip unloadable */ }
  }
  refreshUI();
  draw();
}

function refreshUndoState() {
  el('undoBtn').disabled = past.length === 0;
  el('redoBtn').disabled = future.length === 0;
}

// --- painting ---------------------------------------------------------------

function draw() {
  const canvas = el('cover');
  const [w, h] = studio.outSize;
  canvas.width = w;
  canvas.height = h;
  renderPoster(canvas.getContext('2d'), designSnapshot(), w, h);
  // Selection outline: preview only, never in exports.
  const boxes = arrangementBoxes(studio.arrangement, w, h);
  const box = boxes[studio.activePanel];
  if (box) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setLineDash([10, 6]);
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.beginPath();
    box.corners.forEach(([x, y], j) => (j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

function activePhoto() {
  const slot = studio.slots[studio.activePanel];
  return slot != null && slot >= 0 ? studio.photos[slot] : null;
}

// --- controls ---------------------------------------------------------------

function buildChips(container, items, current, onPick) {
  container.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + ((item.value ?? item) === current ? ' active' : '');
    b.textContent = item.label ?? item;
    b.addEventListener('click', () => onPick(item.value ?? item));
    container.appendChild(b);
  });
}

function refreshPanelChoices() {
  const box = el('panelPhotos');
  box.innerHTML = '';
  studio.photos.forEach((photo, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (studio.slots[studio.activePanel] === i ? ' active' : '');
    b.textContent = photo.label;
    b.addEventListener('click', () => {
      remember();
      studio.slots[studio.activePanel] = i;
      refreshUI();
      draw();
    });
    box.appendChild(b);
  });
  const photo = activePhoto();
  el('zoomInput').value = photo ? Math.round(photo.scale * 100) : 100;
  el('zoomVal').textContent = `${el('zoomInput').value}%`;
}

function refreshUI() {
  const boxes = arrangementBoxes(studio.arrangement, studio.outSize[0], studio.outSize[1]);
  if (studio.activePanel >= boxes.length) studio.activePanel = 0;
  buildChips(el('lookRow'), Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label })), studio.preset, (v) => {
    remember();
    usePreset(v);
    refreshUI();
    draw();
  });
  buildChips(el('layoutRow'), ARRANGEMENTS.map((a) => ({ value: a, label: a })), studio.arrangement, (v) => {
    remember();
    studio.arrangement = v;
    studio.slots = slotsForArrangement(v);
    studio.activePanel = 0;
    refreshUI();
    draw();
  });
  buildChips(el('gradeRow'), Object.keys(PALETTES).map((g) => ({ value: g, label: g })), studio.palette, (v) => {
    remember();
    studio.palette = v;
    refreshUI();
    draw();
  });
  buildChips(el('sizeRow'), OUT_SIZES.map((o) => ({ value: o.size, label: o.label })), studio.outSize, (v) => {
    remember();
    studio.outSize = v;
    refreshUI();
    draw();
  });
  el('titleInput').value = studio.heading;
  el('subtitleInput').value = studio.tagline;
  el('badgeInput').value = studio.ribbon;
  el('starsInput').value = studio.heat;
  el('starsVal').textContent = `${studio.heat} ★`;
  el('stackedInput').checked = studio.stackedTitle;
  el('trackingInput').value = studio.spacing;
  el('trackingVal').textContent = `${studio.spacing}px`;
  el('grainInput').checked = studio.grain;
  el('vignetteInput').checked = studio.vignette;
  refreshPanelChoices();
  refreshUndoState();
}

function usePreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  studio.preset = name;
  studio.arrangement = p.arrangement;
  studio.palette = p.palette;
  studio.stackedTitle = p.stackedTitle;
  studio.spacing = p.spacing;
  studio.slots = slotsForArrangement(p.arrangement);
  studio.activePanel = 0;
}

// --- pointer: click to select, drag to pan ---------------------------------

function spareRoom(photo, w, h) {
  const img = photo.image;
  const fit = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const scale = fit * (photo.scale || 1);
  return [Math.max(0, img.naturalWidth * scale - w), Math.max(0, img.naturalHeight * scale - h)];
}

function wireCanvas() {
  const canvas = el('cover');
  let drag = null;
  canvas.addEventListener('pointerdown', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((ev.clientY - rect.top) / rect.height) * canvas.height;
    const idx = hitPanel(x, y, canvas.width, canvas.height, designSnapshot());
    if (idx < 0) return;
    // Snapshot before the drag so undo returns to the pre-drag state.
    remember();
    studio.activePanel = idx;
    const photo = activePhoto();
    drag = photo ? { photo, startX: ev.clientX, startY: ev.clientY, panX: photo.panX, panY: photo.panY, rect } : null;
    refreshUI();
    draw();
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const boxes = arrangementBoxes(studio.arrangement, canvas.width, canvas.height);
    const box = boxes[studio.activePanel];
    if (!box) return;
    const [spareX, spareY] = spareRoom(drag.photo, box.width, box.height);
    const dx = ((ev.clientX - drag.startX) / drag.rect.width) * canvas.width;
    const dy = ((ev.clientY - drag.startY) / drag.rect.height) * canvas.height;
    // Grab-and-drag: the photo follows the pointer.
    drag.photo.panX = Math.min(1, Math.max(0, drag.panX - dx / Math.max(1, spareX)));
    drag.photo.panY = Math.min(1, Math.max(0, drag.panY - dy / Math.max(1, spareY)));
    draw();
  });
  const endDrag = () => { drag = null; refreshUI(); draw(); };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', () => { drag = null; });
}

// --- export -----------------------------------------------------------------

function savePNG(w, h) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  renderPoster(off.getContext('2d'), designSnapshot(), w, h);
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

// --- wiring -----------------------------------------------------------------

function wireUI() {
  el('useSamples').addEventListener('click', async () => {
    remember();
    await fetchSamples();
    refreshUI();
    draw();
  });
  el('photoInput').addEventListener('change', async (ev) => {
    const files = [...ev.target.files].slice(0, 4);
    if (!files.length) return;
    remember();
    studio.photos = [];
    for (const f of files) {
      const src = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(f);
      });
      try { await registerPhoto({ name: f.name.replace(/\.[^.]+$/, ''), src }); } catch { /* skip */ }
    }
    studio.slots = slotsForArrangement(studio.arrangement);
    refreshUI();
    draw();
  });
  const commit = (fn) => () => { remember(); fn(); refreshUI(); draw(); };
  el('titleInput').addEventListener('change', commit(() => { studio.heading = el('titleInput').value; }));
  el('subtitleInput').addEventListener('change', commit(() => { studio.tagline = el('subtitleInput').value; }));
  el('badgeInput').addEventListener('change', commit(() => { studio.ribbon = el('badgeInput').value; }));
  el('stackedInput').addEventListener('change', commit(() => { studio.stackedTitle = el('stackedInput').checked; }));
  el('grainInput').addEventListener('change', commit(() => { studio.grain = el('grainInput').checked; }));
  el('vignetteInput').addEventListener('change', commit(() => { studio.vignette = el('vignetteInput').checked; }));
  // Sliders: snapshot on the first movement of a gesture, live-update after.
  const wireSlider = (inputId, labelId, format, apply) => {
    const input = el(inputId);
    let armed = false;
    input.addEventListener('input', () => {
      if (!armed) { remember(); armed = true; }
      apply(Number(input.value));
      el(labelId).textContent = format(input.value);
      draw();
    });
    input.addEventListener('change', () => { armed = false; refreshUI(); draw(); });
  };
  wireSlider('starsInput', 'starsVal', (v) => `${v} ★`, (v) => { studio.heat = v; });
  wireSlider('trackingInput', 'trackingVal', (v) => `${v}px`, (v) => { studio.spacing = v; });
  wireSlider('zoomInput', 'zoomVal', (v) => `${v}%`, (v) => {
    const photo = activePhoto();
    if (photo) photo.scale = v / 100;
  });
  el('undoBtn').addEventListener('click', async () => {
    if (!past.length) return;
    future.push(snapshotJSON());
    await recall(past.pop());
    refreshUndoState();
  });
  el('redoBtn').addEventListener('click', async () => {
    if (!future.length) return;
    past.push(snapshotJSON());
    await recall(future.pop());
    refreshUndoState();
  });
  el('export1080').addEventListener('click', () => savePNG(1080, 1080));
  el('export1350').addEventListener('click', () => savePNG(1080, 1350));
  el('export1920').addEventListener('click', () => savePNG(1920, 1080));
  wireCanvas();
}

// --- shot mode hook (used by shots.js) --------------------------------------

async function applyScene(p) {
  if (p.look && PRESETS[p.look]) usePreset(p.look);
  if (p.layout && ARRANGEMENTS.includes(p.layout)) {
    studio.arrangement = p.layout;
    studio.slots = slotsForArrangement(p.layout);
  }
  if (p.grade && PALETTES[p.grade]) studio.palette = p.grade;
  if (p.title !== undefined) studio.heading = p.title;
  if (p.subtitle !== undefined) studio.tagline = p.subtitle;
  if (p.badge !== undefined) studio.ribbon = p.badge;
  if (p.stars !== undefined) studio.heat = Number(p.stars);
  if (p.stacked !== undefined) studio.stackedTitle = p.stacked === '1' || p.stacked === 'true';
  if (p.tracking !== undefined) studio.spacing = Number(p.tracking);
  if (p.photos) {
    studio.photos = [];
    for (const raw of p.photos.split(',')) {
      const name = raw.trim();
      try { await registerPhoto({ name, src: `samples/${name}.jpg` }); } catch { /* skip */ }
    }
    studio.slots = slotsForArrangement(studio.arrangement);
  }
  if (p.slots) studio.slots = p.slots.split(',').map((n) => Number(n));
  const setPan = (i) => {
    const photo = studio.photos[i];
    if (!photo) return;
    if (p[`ox${i}`] !== undefined) photo.panX = Number(p[`ox${i}`]);
    if (p[`oy${i}`] !== undefined) photo.panY = Number(p[`oy${i}`]);
    if (p[`zoom${i}`] !== undefined) photo.scale = Number(p[`zoom${i}`]);
  };
  if (p.ox !== undefined && studio.photos[0]) studio.photos[0].panX = Number(p.ox);
  if (p.oy !== undefined && studio.photos[0]) studio.photos[0].panY = Number(p.oy);
  if (p.zoom !== undefined && studio.photos[0]) studio.photos[0].scale = Number(p.zoom);
  for (let i = 1; i < 4; i++) setPan(i);
  refreshUI();
  draw();
}

window.__coverStudio = { studio, draw, applyScene, designSnapshot };

// --- start ------------------------------------------------------------------

wireUI();
refreshUI();
draw(); // immediate paint (backdrop + title) so the canvas is never blank
// In shot mode the shots runner owns photo loading (it knows exactly which
// photos the scene wants); loading the samples here too would race it and
// scramble the photo order. Editor mode loads the samples itself.
if (!new URLSearchParams(location.search).get('shot')) {
  fetchSamples().then(() => { refreshUI(); draw(); });
}
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => draw());
  Promise.all([
    document.fonts.load('40px Anton'),
    document.fonts.load('20px Pacifico'),
  ]).then(() => draw()).catch(() => {});
}
