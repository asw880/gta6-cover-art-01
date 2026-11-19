// Vice City Cover Studio — editor (v5).
// Owns the atelier state, the controls, drag-to-pan, undo/redo and PNG export.
// The render engine lives in cover.js; this file only drives it.

import { TONES, COMPOSITIONS, SIGNATURES, paintCover, framesFor, defaultDesign } from './cover.js';

const $ = (id) => document.getElementById(id);
const STOCK = [
  { name: 'boulevard', src: 'samples/boulevard.jpg' },
  { name: 'pier', src: 'samples/pier.jpg' },
  { name: 'palms', src: 'samples/palms.jpg' },
];
const EXPORT_SIZES = [
  { label: '1080 × 1080', w: 1080, h: 1080 },
  { label: '1080 × 1350', w: 1080, h: 1350 },
  { label: '1920 × 1080', w: 1920, h: 1080 },
];

const atelier = defaultDesign();
const picCache = new Map();
let undoStack = [];
let redoStack = [];
let dragging = null;

function loadPicture(desc) {
  if (picCache.has(desc.src)) return Promise.resolve(picCache.get(desc.src));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const pic = { name: desc.name, src: desc.src, img };
      picCache.set(desc.src, pic);
      resolve(pic);
    };
    img.onerror = () => reject(new Error(`cannot load ${desc.src}`));
    img.src = desc.src;
  });
}

function frameFor(photoIdx) {
  return { photo: photoIdx, fx: 0.5, fy: photoIdx === 0 ? 0.38 : 0.5, zoom: 1, panX: 0, panY: 0 };
}

function syncFrames() {
  const { panels } = framesFor(atelier.composition, ...atelier.size);
  const next = panels.map((p, i) => {
    const old = atelier.frames[i];
    if (old && typeof old.photo === 'number' && old.photo < atelier.pictures.length) {
      return { ...old };
    }
    const def = p.photo === null || p.photo === undefined ? 0 : p.photo;
    return frameFor(Math.min(def, Math.max(0, atelier.pictures.length - 1)));
  });
  atelier.frames = next;
  if (atelier.active >= next.length) atelier.active = 0;
}

async function loadStock() {
  atelier.pictures = [];
  for (const desc of STOCK) {
    try {
      atelier.pictures.push(await loadPicture(desc));
    } catch {
      // A missing sample just skips; the app still works with uploads.
    }
  }
  syncFrames();
}

function snapshotDesign() {
  return JSON.stringify({
    signature: atelier.signature, composition: atelier.composition, tone: atelier.tone,
    headline: atelier.headline, caption: atelier.caption, sticker: atelier.sticker,
    stars: atelier.stars, stacked: atelier.stacked, tracking: atelier.tracking,
    grain: atelier.grain, vignette: atelier.vignette, size: atelier.size, active: atelier.active,
    frames: atelier.frames,
    pictures: atelier.pictures.map((p) => ({ name: p.name, src: p.src })),
  });
}

async function restoreDesign(serialized) {
  const d = JSON.parse(serialized);
  Object.assign(atelier, {
    signature: d.signature, composition: d.composition, tone: d.tone,
    headline: d.headline, caption: d.caption, sticker: d.sticker, stars: d.stars,
    stacked: d.stacked, tracking: d.tracking, grain: d.grain, vignette: d.vignette,
    size: d.size, active: d.active, frames: d.frames,
  });
  atelier.pictures = [];
  for (const desc of d.pictures) {
    try {
      atelier.pictures.push(await loadPicture(desc));
    } catch {
      // Skip unloadable pictures; frames pointing at them fall back in render.
    }
  }
  syncPanel();
  render();
}

function checkpoint() {
  undoStack.push(snapshotDesign());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  syncUndoButtons();
}

function syncUndoButtons() {
  $('undoBtn').disabled = undoStack.length === 0;
  $('redoBtn').disabled = redoStack.length === 0;
}

function render() {
  const canvas = $('poster');
  const [w, h] = atelier.size;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  paintCover(atelier, ctx, w, h);
}

function chip(container, label, active, onPick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `chip${active ? ' on' : ''}`;
  b.textContent = label;
  b.addEventListener('click', onPick);
  container.appendChild(b);
  return b;
}

function buildChips() {
  const lookRow = $('lookRow');
  lookRow.innerHTML = '';
  for (const [id, look] of Object.entries(SIGNATURES)) {
    chip(lookRow, look.name, atelier.signature === id, () => applySignature(id));
  }
  const layoutRow = $('layoutRow');
  layoutRow.innerHTML = '';
  for (const [id, comp] of Object.entries(COMPOSITIONS)) {
    chip(layoutRow, comp.name, atelier.composition === id, () => {
      checkpoint();
      atelier.composition = id;
      atelier.signature = '';
      syncFrames();
      syncPanel();
      render();
    });
  }
  const gradeRow = $('gradeRow');
  gradeRow.innerHTML = '';
  for (const [id, tone] of Object.entries(TONES)) {
    chip(gradeRow, tone.name, atelier.tone === id, () => {
      checkpoint();
      atelier.tone = id;
      atelier.signature = '';
      syncPanel();
      render();
    });
  }
}

function applySignature(id) {
  const look = SIGNATURES[id];
  if (!look) return;
  checkpoint();
  atelier.signature = id;
  atelier.composition = look.composition;
  atelier.tone = look.tone;
  atelier.stacked = look.stacked;
  atelier.tracking = look.tracking;
  syncFrames();
  syncPanel();
  render();
}

function syncPanel() {
  buildChips();
  $('headline').value = atelier.headline;
  $('caption').value = atelier.caption;
  $('sticker').value = atelier.sticker;
  $('stars').value = String(atelier.stars);
  $('stacked').checked = atelier.stacked;
  $('tracking').value = String(atelier.tracking);
  $('grain').checked = atelier.grain > 0;
  $('vignette').checked = atelier.vignette;
  const zoom = $('zoom');
  const frame = atelier.frames[atelier.active];
  zoom.value = String(frame ? frame.zoom : 1);
  $('zoomVal').textContent = `${frame ? frame.zoom.toFixed(2) : '1.00'}×`;
  const picker = $('panelPhoto');
  picker.innerHTML = '';
  atelier.pictures.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = p.name;
    picker.appendChild(opt);
  });
  if (frame) picker.value = String(frame.photo);
  document.querySelectorAll('#sizeRow .chip').forEach((b) => {
    const [w, h] = b.dataset.size.split('x').map(Number);
    b.classList.toggle('on', w === atelier.size[0] && h === atelier.size[1]);
  });
}

function panelAt(mx, my) {
  const canvas = $('poster');
  const rect = canvas.getBoundingClientRect();
  const x = (mx - rect.left) * (canvas.width / rect.width);
  const y = (my - rect.top) * (canvas.height / rect.height);
  const { panels } = framesFor(atelier.composition, canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i -= 1) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

function bindCanvas() {
  const canvas = $('poster');
  canvas.addEventListener('pointerdown', (e) => {
    const idx = panelAt(e.clientX, e.clientY);
    if (idx < 0) return;
    checkpoint();
    atelier.active = idx;
    dragging = { x: e.clientX, y: e.clientY, idx };
    canvas.setPointerCapture(e.pointerId);
    syncPanel();
    render();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const frame = atelier.frames[dragging.idx];
    if (!frame) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - dragging.x) * (canvas.width / rect.width);
    const dy = (e.clientY - dragging.y) * (canvas.height / rect.height);
    const { panels } = framesFor(atelier.composition, canvas.width, canvas.height);
    const p = panels[dragging.idx];
    frame.panX = Math.max(-1, Math.min(1, frame.panX + (dx / Math.max(1, p.w)) * 2));
    frame.panY = Math.max(-1, Math.min(1, frame.panY + (dy / Math.max(1, p.h)) * 2));
    dragging.x = e.clientX;
    dragging.y = e.clientY;
    render();
  });
  const endDrag = () => { dragging = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
}

function exportPNG(w, h) {
  return new Promise((resolve, reject) => {
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const keep = atelier.size;
    atelier.size = [w, h];
    try {
      paintCover(atelier, off.getContext('2d'), w, h);
    } finally {
      atelier.size = keep;
    }
    off.toBlob((blob) => {
      if (!blob) {
        reject(new Error('export produced no blob'));
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-city-cover-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

function buildScene(spec) {
  if (spec.signature) applySignature(spec.signature);
  if (spec.composition) atelier.composition = spec.composition;
  if (spec.tone) atelier.tone = spec.tone;
  if (spec.headline !== undefined) atelier.headline = spec.headline;
  if (spec.caption !== undefined) atelier.caption = spec.caption;
  if (spec.sticker !== undefined) atelier.sticker = spec.sticker;
  if (spec.stars !== undefined) atelier.stars = spec.stars;
  if (spec.stacked !== undefined) atelier.stacked = spec.stacked;
  if (spec.tracking !== undefined) atelier.tracking = spec.tracking;
  if (spec.size) atelier.size = spec.size;
  if (spec.frames) {
    atelier.frames = spec.frames.map((f) => ({
      photo: f.photo, fx: f.fx ?? 0.5, fy: f.fy ?? 0.5,
      zoom: f.zoom ?? 1, panX: f.panX ?? 0, panY: f.panY ?? 0,
    }));
  } else {
    syncFrames();
  }
  syncPanel();
  render();
}

function bindControls() {
  $('upload').addEventListener('change', async (e) => {
    const files = [...e.target.files].slice(0, 4);
    if (!files.length) return;
    checkpoint();
    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        const pic = await loadPicture({ name: file.name.replace(/\.[^.]+$/, ''), src: url });
        atelier.pictures.push(pic);
      } catch {
        // Skip files that fail to load.
      }
    }
    syncFrames();
    syncPanel();
    render();
  });
  $('useSamples').addEventListener('click', async () => {
    checkpoint();
    await loadStock();
    syncPanel();
    render();
  });
  const text = (id, key) => {
    $(id).addEventListener('input', () => {
      atelier[key] = $(id).value;
      render();
    });
    $(id).addEventListener('change', () => checkpoint());
  };
  text('headline', 'headline');
  text('caption', 'caption');
  text('sticker', 'sticker');
  $('stars').addEventListener('change', () => {
    checkpoint();
    atelier.stars = Number($('stars').value);
    render();
  });
  $('stacked').addEventListener('change', () => {
    checkpoint();
    atelier.stacked = $('stacked').checked;
    render();
  });
  $('tracking').addEventListener('input', () => {
    atelier.tracking = Number($('tracking').value);
    render();
  });
  $('tracking').addEventListener('change', () => checkpoint());
  $('grain').addEventListener('change', () => {
    checkpoint();
    atelier.grain = $('grain').checked ? 0.05 : 0;
    render();
  });
  $('vignette').addEventListener('change', () => {
    checkpoint();
    atelier.vignette = $('vignette').checked;
    render();
  });
  $('zoom').addEventListener('input', () => {
    const frame = atelier.frames[atelier.active];
    if (!frame) return;
    frame.zoom = Number($('zoom').value);
    $('zoomVal').textContent = `${frame.zoom.toFixed(2)}×`;
    render();
  });
  $('zoom').addEventListener('change', () => checkpoint());
  $('panelPhoto').addEventListener('change', () => {
    checkpoint();
    const frame = atelier.frames[atelier.active];
    if (frame) frame.photo = Number($('panelPhoto').value);
    render();
  });
  $('undoBtn').addEventListener('click', async () => {
    if (!undoStack.length) return;
    redoStack.push(snapshotDesign());
    await restoreDesign(undoStack.pop());
    syncUndoButtons();
  });
  $('redoBtn').addEventListener('click', async () => {
    if (!redoStack.length) return;
    undoStack.push(snapshotDesign());
    await restoreDesign(redoStack.pop());
    syncUndoButtons();
  });
  const sizeRow = $('sizeRow');
  sizeRow.innerHTML = '';
  for (const s of EXPORT_SIZES) {
    const b = chip(sizeRow, s.label, false, () => {
      checkpoint();
      atelier.size = [s.w, s.h];
      syncPanel();
      render();
    });
    b.dataset.size = `${s.w}x${s.h}`;
  }
  $('exportBtn').addEventListener('click', async () => {
    const [w, h] = atelier.size;
    try {
      await exportPNG(w, h);
      $('hint').textContent = `Exported ${w}×${h} PNG — check your downloads.`;
    } catch (err) {
      $('hint').textContent = `Export failed: ${err.message}`;
    }
  });
}

async function boot() {
  bindControls();
  bindCanvas();
  await loadStock();
  syncPanel();
  render();
  window.__viceStudio = {
    design: atelier, render, exportPNG, applySignature, buildScene,
    ready: Promise.resolve(true),
  };
}

boot();
