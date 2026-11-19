// Fixed scenes for screenshots: ?shot=cover shows the cover alone,
// ?shot=editor shows the page with a sample photo loaded. Every scene is
// driven by the query string, so the same URL always paints the same
// poster. window.__shotReady is set once the scene has painted.
//
// Query params (all optional):
//   look, layout, grade        — a Look preset, or a layout and a grade
//   title, subtitle, badge     — the poster's words
//   stars                      — how many stars the meter shows (0-5)
//   stacked (1/0), tracking    — the title treatment
//   photos                     — comma list of sample names (boulevard,
//                               pier, palms); each becomes one loaded photo
//   slots                      — comma list of photo indexes, one per panel
//                               (-1 leaves a panel as painted sky)
//   pan                        — semicolon list of "x,y,zoom" triples, one
//                               per panel; x/y are 0..1, zoom is >= 1
//   ox, oy, zoom               — shorthand pan for the first panel

import { LOOKS } from './cover.js';

function blankPan() {
  return { x: 0.5, y: 0.5, zoom: 1 };
}

function blankPans() {
  return Array.from({ length: 9 }, blankPan);
}

function parsePans(raw) {
  const pans = blankPans();
  if (!raw) return pans;
  raw.split(';').forEach((triple, i) => {
    if (i >= pans.length) return;
    const parts = triple.split(',').map(Number);
    if (parts.length < 2 || parts.some((v) => Number.isNaN(v))) return;
    pans[i] = {
      x: parts[0] ?? 0.5,
      y: parts[1] ?? 0.5,
      zoom: parts[2] ?? 1,
    };
  });
  return pans;
}

function parseSlots(raw, photoCount, panelCount) {
  if (raw) {
    const slots = raw.split(',').map((v) => Number(v));
    while (slots.length < panelCount) slots.push(-1);
    return slots.slice(0, panelCount);
  }
  const slots = [];
  for (let i = 0; i < panelCount; i++) {
    slots.push(i < photoCount ? i : -1);
  }
  return slots;
}

export async function runShot(shot, query, ctx) {
  const names = (query.get('photos') || query.get('photo') || 'pier').split(',');
  const images = [];
  for (const name of names) {
    try {
      images.push(await ctx.loadSample(name.trim()));
    } catch (e) {
      images.push(null);
    }
  }

  const patch = { images };
  const lookName = query.get('look');
  if (lookName && LOOKS[lookName]) {
    const look = LOOKS[lookName];
    patch.look = lookName;
    patch.layout = look.layout;
    patch.grade = look.grade;
    patch.stacked = look.stacked;
    patch.tracking = look.tracking;
  }
  if (query.get('layout')) patch.layout = query.get('layout');
  if (query.get('grade')) patch.grade = query.get('grade');
  if (query.get('title')) patch.title = query.get('title');
  if (query.get('subtitle')) patch.subtitle = query.get('subtitle');
  if (query.get('badge')) patch.badge = query.get('badge');
  if (query.get('stars') !== null) patch.stars = Number(query.get('stars'));
  if (query.get('stacked') !== null) patch.stacked = query.get('stacked') === '1';
  if (query.get('tracking') !== null) patch.tracking = Number(query.get('tracking'));
  if (query.get('grain') !== null) patch.grain = query.get('grain') === '1';
  if (query.get('vignette') !== null) patch.vignette = query.get('vignette') === '1';

  // Panels: 9 at most (the 3x3 grid); scenes name their slots explicitly.
  patch.slots = parseSlots(query.get('slots'), images.length, 9);
  patch.pans = parsePans(query.get('pan'));
  const ox = query.get('ox');
  const oy = query.get('oy');
  const zoom = query.get('zoom');
  if (ox !== null || oy !== null || zoom !== null) {
    patch.pans[0] = {
      x: ox !== null ? Number(ox) : 0.5,
      y: oy !== null ? Number(oy) : 0.5,
      zoom: zoom !== null ? Number(zoom) : 1,
    };
  }

  if (shot === 'cover') ctx.coverOnly();
  ctx.setArt(patch);
  ctx.syncControls();
  ctx.repaint();
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  ctx.ready();
}
