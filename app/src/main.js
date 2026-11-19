// Vice City Cover Studio — editor wiring.
//
// Owns the page: loads photos, keeps the poster's state, paints the live
// preview, and exports PNGs. The drawing itself lives in cover.js; the
// fixed screenshot scenes live in shots.js. A `?shot=` query hands the
// page to a scene instead of the interactive editor.
//
// State shape (all of it serialisable except the loaded images):
//   art: { images, slots, pans, layout, grade, title, subtitle, badge,
//          stars, stacked, tracking, grain, vignette, look }
//   images: up to four loaded <img> elements (or null), in upload order.
// Undo/redo snapshots everything except the image elements themselves.

import { paintCover, defaultArt, LOOKS, LAYOUTS, GRADES, panelAt } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');

const SAMPLE_NAMES = ['boulevard', 'pier', 'palms'];

let art = defaultArt([]);
let selected = 0;
let undoStack = [];
let redoStack = [];

function snapshot() {
  const { images, ...rest } = art;
  return JSON.parse(JSON.stringify(rest));
}

function restore(snap) {
  const images = art.images;
  art = { ...snap, images };
  syncControls();
  repaint();
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

function updateUndoButtons() {
  document.getElementById('undoBtn').disabled = undoStack.length === 0;
  document.getElementById('redoBtn').disabled = redoStack.length === 0;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function loadSample(name) {
  return loadImage(`samples/${name}.jpg`);
}

async function useSamples() {
  const loaded = [];
  for (const name of SAMPLE_NAMES) {
    try {
      loaded.push(await loadSample(name));
    } catch (e) {
      loaded.push(null);
    }
  }
  pushHistory();
  art.images = loaded;
  art.slots = [0, 1, 2, 2];
  art.pans = defaultArt([]).pans;
  syncPhotoPicker();
  repaint();
  statusEl.textContent = 'Sample photos loaded.';
}

function repaint() {
  paintCover(canvas, art);
}

function setLook(name) {
  const look = LOOKS[name];
  if (!look) return;
  pushHistory();
  art.look = name;
  art.layout = look.layout;
  art.grade = look.grade;
  art.stacked = look.stacked;
  art.tracking = look.tracking;
  syncControls();
  repaint();
}

function setLayout(name) {
  if (!LAYOUTS.includes(name)) return;
  pushHistory();
  art.layout = name;
  art.look = '';
  syncControls();
  repaint();
}

function setGrade(name) {
  if (!GRADES[name]) return;
  pushHistory();
  art.grade = name;
  art.look = '';
  syncControls();
  repaint();
}

function syncControls() {
  document.querySelectorAll('#lookRow [data-look]').forEach((b) => {
    b.classList.toggle('active', b.dataset.look === art.look);
  });
  document.querySelectorAll('#layoutRow [data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === art.layout);
  });
  document.querySelectorAll('#gradeRow [data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === art.grade);
  });
  document.getElementById('titleText').value = art.title;
  document.getElementById('subtitleText').value = art.subtitle;
  document.getElementById('badgeText').value = art.badge;
  document.getElementById('starCount').value = art.stars;
  document.getElementById('starLabel').textContent = `${art.stars} ★`;
  document.getElementById('stackedBox').checked = art.stacked;
  document.getElementById('trackingRange').value = art.tracking;
  document.getElementById('grainBox').checked = art.grain !== false;
  document.getElementById('vignetteBox').checked = art.vignette !== false;
  syncPhotoPicker();
  updateUndoButtons();
}

function syncPhotoPicker() {
  const picker = document.getElementById('panelPhoto');
  const current = picker.value;
  picker.innerHTML = '';
  const sky = document.createElement('option');
  sky.value = '-1';
  sky.textContent = 'Painted sky (no photo)';
  picker.appendChild(sky);
  art.images.forEach((img, i) => {
    if (!img) return;
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Photo ${i + 1}`;
    picker.appendChild(opt);
  });
  const slot = (art.slots && art.slots[selected]) ?? -1;
  picker.value = String(slot);
  if (picker.value !== String(slot)) picker.value = current;
  const pan = (art.pans && art.pans[selected]) || { x: 0.5, y: 0.5, zoom: 1 };
  document.getElementById('zoomRange').value = pan.zoom || 1;
  document.getElementById('zoomLabel').textContent = `${(pan.zoom || 1).toFixed(1)}×`;
  document.getElementById('panelHint').textContent =
    `Panel ${selected + 1} selected — drag it to reposition its photo.`;
}

// --- photo uploads ----------------------------------------------------------

document.getElementById('photoFile').addEventListener('change', async (e) => {
  const files = [...e.target.files].slice(0, 4);
  if (files.length === 0) return;
  const loaded = [];
  for (const f of files) {
    try {
      loaded.push(await loadImage(URL.createObjectURL(f)));
    } catch (err) {
      loaded.push(null);
    }
  }
  pushHistory();
  const next = [...art.images];
  loaded.forEach((img, i) => {
    if (img) next[i] = img;
  });
  art.images = next.slice(0, 4);
  art.slots = [0, 1, 2, 3].map((i) => (art.images[i] ? i : -1));
  syncPhotoPicker();
  repaint();
  statusEl.textContent = `${loaded.filter(Boolean).length} photo(s) loaded.`;
});

document.getElementById('useSamples').addEventListener('click', useSamples);

// --- looks, layout, grade ---------------------------------------------------

document.getElementById('lookRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-look]');
  if (b) setLook(b.dataset.look);
});
document.getElementById('layoutRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-layout]');
  if (b) setLayout(b.dataset.layout);
});
document.getElementById('gradeRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-grade]');
  if (b) setGrade(b.dataset.grade);
});

// --- caption -----------------------------------------------------------------

function bindText(id, key) {
  document.getElementById(id).addEventListener('input', (e) => {
    art[key] = e.target.value;
    repaint();
  });
  document.getElementById(id).addEventListener('change', pushHistory);
}
bindText('titleText', 'title');
bindText('subtitleText', 'subtitle');
bindText('badgeText', 'badge');

document.getElementById('starCount').addEventListener('input', (e) => {
  art.stars = Number(e.target.value);
  document.getElementById('starLabel').textContent = `${art.stars} ★`;
  repaint();
});
document.getElementById('starCount').addEventListener('change', pushHistory);

document.getElementById('stackedBox').addEventListener('change', (e) => {
  pushHistory();
  art.stacked = e.target.checked;
  repaint();
});
document.getElementById('trackingRange').addEventListener('input', (e) => {
  art.tracking = Number(e.target.value);
  repaint();
});
document.getElementById('trackingRange').addEventListener('change', pushHistory);

// --- panel editing -----------------------------------------------------------

document.getElementById('panelPhoto').addEventListener('change', (e) => {
  pushHistory();
  if (!art.slots) art.slots = [];
  art.slots[selected] = Number(e.target.value);
  repaint();
});

document.getElementById('zoomRange').addEventListener('input', (e) => {
  if (!art.pans[selected]) art.pans[selected] = { x: 0.5, y: 0.5, zoom: 1 };
  art.pans[selected].zoom = Number(e.target.value);
  document.getElementById('zoomLabel').textContent = `${art.pans[selected].zoom.toFixed(1)}×`;
  repaint();
});
document.getElementById('zoomRange').addEventListener('change', pushHistory);

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAt(art.layout, canvas.width, canvas.height, p.x, p.y);
  if (hit >= 0) {
    selected = hit;
    dragging = { x: p.x, y: p.y, moved: false };
    syncPhotoPicker();
    canvas.setPointerCapture(e.pointerId);
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const dx = p.x - dragging.x;
  const dy = p.y - dragging.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) dragging.moved = true;
  if (!dragging.moved) return;
  if (!art.pans[selected]) art.pans[selected] = { x: 0.5, y: 0.5, zoom: 1 };
  const pan = art.pans[selected];
  // Dragging moves the photo inside its panel; the cover math clamps it,
  // so a pan can never open a gap at the panel's edge.
  pan.x = Math.min(1, Math.max(0, pan.x + dx / canvas.width));
  pan.y = Math.min(1, Math.max(0, pan.y + dy / canvas.height));
  dragging.x = p.x;
  dragging.y = p.y;
  repaint();
});
canvas.addEventListener('pointerup', () => {
  if (dragging && dragging.moved) pushHistory();
  dragging = null;
});

// --- effects -----------------------------------------------------------------

document.getElementById('grainBox').addEventListener('change', (e) => {
  pushHistory();
  art.grain = e.target.checked;
  repaint();
});
document.getElementById('vignetteBox').addEventListener('change', (e) => {
  pushHistory();
  art.vignette = e.target.checked;
  repaint();
});

// --- undo / redo ---------------------------------------------------------------

document.getElementById('undoBtn').addEventListener('click', () => {
  if (undoStack.length === 0) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
});
document.getElementById('redoBtn').addEventListener('click', () => {
  if (redoStack.length === 0) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
});

// --- export --------------------------------------------------------------------

function exportPNG(w, h) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  paintCover(off, art);
  off.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — the browser refused the PNG.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Saved cover-${w}x${h}.png`;
  }, 'image/png');
}

document.getElementById('exportSquare').addEventListener('click', () => exportPNG(1080, 1080));
document.getElementById('exportPortrait').addEventListener('click', () => exportPNG(1080, 1350));
document.getElementById('exportWide').addEventListener('click', () => exportPNG(1920, 1080));

// --- boot ----------------------------------------------------------------------

async function boot() {
  try {
    await Promise.all([
      document.fonts.load('16px Anton'),
      document.fonts.load('16px Pacifico'),
      document.fonts.ready,
    ]);
  } catch (e) {
    // The poster still paints with fallback fonts.
  }
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, {
      loadImage,
      loadSample,
      getArt: () => art,
      setArt: (patch) => {
        art = { ...art, ...patch };
      },
      repaint,
      syncControls,
      ready: () => { window.__shotReady = true; },
      coverOnly: () => document.body.classList.add('shot-cover'),
    });
  } else {
    await useSamples();
    syncControls();
    repaint();
  }
}

boot();
