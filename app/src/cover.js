// Vice City Cover Studio — poster renderer (v4 rewrite).
// Paints a GTA-style cover onto a canvas: a painted Vice City sky with a
// slatted retro sun and palm silhouettes, photo panels cut into it, and a
// bold stacked display title in a band at the bottom. Everything is drawn
// with canvas paths — no network, no external images.

export const PALETTES = {
  sunset: {
    sky: ['#2b1055', '#c94b7c', '#feb47b'],
    sun: '#ffd76a',
    glow: 'rgba(255, 183, 77, 0.55)',
    heading: ['#ffe259', '#ff7e5f'],
    ink: '#1c0b2e',
    band: ['#241040', '#160a24'],
    accent: '#ff2e88',
    frame: '#1c0b2e',
    star: '#ffd76a',
  },
  neon: {
    sky: ['#0b1035', '#5b2a9d', '#ff2e88'],
    sun: '#7df9ff',
    glow: 'rgba(125, 249, 255, 0.5)',
    heading: ['#7df9ff', '#ff7df2'],
    ink: '#0a0618',
    band: ['#100b26', '#0a0618'],
    accent: '#7df9ff',
    frame: '#0a0618',
    star: '#7df9ff',
  },
  vice: {
    sky: ['#3b0a4e', '#a4136b', '#ff5e8a'],
    sun: '#ffe259',
    glow: 'rgba(255, 94, 138, 0.55)',
    heading: ['#ffd6f2', '#ff2e88'],
    ink: '#2a0a1e',
    band: ['#2a0a2e', '#1a0618'],
    accent: '#ff5e8a',
    frame: '#2a0a1e',
    star: '#ffd76a',
  },
  teal: {
    sky: ['#062a33', '#0f6b6b', '#f2a65a'],
    sun: '#ffe9a3',
    glow: 'rgba(242, 166, 90, 0.5)',
    heading: ['#eafffb', '#7df9ff'],
    ink: '#062a33',
    band: ['#0a2e33', '#061e24'],
    accent: '#f2a65a',
    frame: '#062a33',
    star: '#ffe9a3',
  },
  noir: {
    sky: ['#101010', '#3a3a3a', '#8a8a8a'],
    sun: '#f5f5f5',
    glow: 'rgba(255, 255, 255, 0.35)',
    heading: ['#ffffff', '#c9c9c9'],
    ink: '#000000',
    band: ['#141414', '#000000'],
    accent: '#ffffff',
    frame: '#000000',
    star: '#ffffff',
  },
};

export const PRESETS = {
  keyart: { arrangement: 'slash', palette: 'sunset', stackedTitle: true, spacing: 2, label: 'Key Art' },
  neon: { arrangement: 'hero3', palette: 'neon', stackedTitle: true, spacing: 1, label: 'Neon Night' },
  sunset: { arrangement: 'slash', palette: 'sunset', stackedTitle: false, spacing: 4, label: 'Sunset Strip' },
};

export const ARRANGEMENTS = ['slash', 'hero3', 'grid4', 'grid9', 'bleed', 'tilt'];

export function freshDesign() {
  return {
    preset: 'keyart',
    arrangement: 'slash',
    palette: 'sunset',
    heading: 'VICE CITY',
    tagline: 'one last sunset heist',
    ribbon: 'VICE CITY',
    heat: 4,
    stackedTitle: true,
    spacing: 2,
    grain: true,
    vignette: true,
    photos: [],
    slots: slotsForArrangement('slash'),
  };
}

export function slotsForArrangement(arrangement) {
  switch (arrangement) {
    case 'slash': return [0, 1, -1, -1];
    case 'hero3': return [0, 1, 2, 0];
    case 'grid4': return [0, 1, 2, 0];
    case 'grid9': return [0, 1, 2, 0, 1, 2, 0, 1, 2];
    case 'bleed': return [0];
    case 'tilt': return [0, 1, 2];
    default: return [0, 1, -1, -1];
  }
}

// --- geometry ---------------------------------------------------------------

function cornersFor(cx, cy, w, h, angle, slant) {
  const raw = [
    [-w / 2 + slant, -h / 2],
    [w / 2 + slant, -h / 2],
    [w / 2 - slant, h / 2],
    [-w / 2 - slant, h / 2],
  ];
  const c = Math.cos(angle), s = Math.sin(angle);
  return raw.map(([dx, dy]) => [cx + dx * c - dy * s, cy + dx * s + dy * c]);
}

export function arrangementBoxes(arrangement, W, H) {
  const bandH = Math.round(H * 0.30);
  const ph = H - bandH;
  const gap = Math.max(2, Math.round(W * 0.008));
  const box = (x, y, w, h, angle = 0, slant = 0) => ({
    x: x + w / 2,
    y: y + h / 2,
    width: w,
    height: h,
    angle,
    slant,
    corners: cornersFor(x + w / 2, y + h / 2, w, h, angle, slant),
  });
  switch (arrangement) {
    case 'hero3': {
      const heroH = Math.round(ph * 0.60);
      const out = [box(0, 0, W, heroH)];
      const bw = (W - gap * 2) / 3;
      for (let i = 0; i < 3; i++) out.push(box(i * (bw + gap), heroH + gap, bw, ph - heroH - gap));
      return out;
    }
    case 'grid4': {
      const out = [];
      const cw = (W - gap) / 2, ch = (ph - gap) / 2;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) out.push(box(c * (cw + gap), r * (ch + gap), cw, ch));
      return out;
    }
    case 'grid9': {
      const out = [];
      const cw = (W - gap * 2) / 3, ch = (ph - gap * 2) / 3;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(box(c * (cw + gap), r * (ch + gap), cw, ch));
      return out;
    }
    case 'bleed':
      return [box(0, 0, W, ph)];
    case 'tilt':
      return [
        box(W * 0.03, ph * 0.04, W * 0.44, ph * 0.58, -0.07),
        box(W * 0.50, ph * 0.02, W * 0.47, ph * 0.52, 0.05),
        box(W * 0.18, ph * 0.48, W * 0.64, ph * 0.48, -0.026),
      ];
    case 'slash':
    default: {
      const out = [];
      const slant = W * 0.035;
      const sw = W / 4;
      for (let i = 0; i < 4; i++) {
        const x0 = i * sw + gap / 2;
        const x1 = (i + 1) * sw - gap / 2;
        out.push(box(x0, 0, x1 - x0, ph, 0, slant));
      }
      return out;
    }
  }
}

export function hitPanel(px, py, W, H, design) {
  const boxes = arrangementBoxes(design.arrangement, W, H);
  for (let i = boxes.length - 1; i >= 0; i--) {
    const c = boxes[i].corners;
    let inside = false;
    for (let a = 0, b = c.length - 1; a < c.length; b = a++) {
      const [ax, ay] = c[a];
      const [bx, by] = c[b];
      if ((ay > py) !== (by > py) && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) inside = !inside;
    }
    if (inside) return i;
  }
  return -1;
}

// --- painted sky ------------------------------------------------------------

function drawSun(ctx, cx, cy, r, pal) {
  const halo = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.7);
  halo.addColorStop(0, pal.glow);
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(cx - r * 1.7, cy - r * 1.7, r * 3.4, r * 3.4);
  // Slatted disc: eight bars, each as wide as the circle is at that height.
  ctx.fillStyle = pal.sun;
  const bars = 8;
  for (let i = 0; i < bars; i++) {
    const top = cy - r + (i * 2 * r) / bars;
    const bottom = cy - r + ((i + 0.62) * 2 * r) / bars;
    const mid = (top + bottom) / 2;
    const half = Math.sqrt(Math.max(0, r * r - (mid - cy) * (mid - cy)));
    ctx.fillRect(cx - half, top, half * 2, bottom - top);
  }
}

function drawPalmTree(ctx, x, y, s, color) {
  // Silhouette palm: a trunk of three tapering blocks and six filled blades.
  ctx.fillStyle = color;
  const lean = s * 0.16;
  let bx = x, by = y, bw = s * 0.05;
  for (let i = 0; i < 3; i++) {
    const ny = by - s / 3;
    const nx = bx + lean / 3;
    const nw = bw * 0.75;
    ctx.beginPath();
    ctx.moveTo(bx - bw, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(nx + nw, ny);
    ctx.lineTo(nx - nw, ny);
    ctx.closePath();
    ctx.fill();
    bx = nx; by = ny; bw = nw;
  }
  for (const a of [-2.5, -1.9, -1.3, -0.7, -0.1, 0.5]) {
    const tipX = bx + Math.cos(a) * s * 0.46;
    const tipY = by + Math.sin(a) * s * 0.30 + s * 0.14;
    const midX = bx + Math.cos(a) * s * 0.28;
    const midY = by + Math.sin(a) * s * 0.06 - s * 0.06;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.quadraticCurveTo(midX + s * 0.03, midY + s * 0.05, bx, by);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSky(ctx, W, H, pal) {
  const bandH = Math.round(H * 0.30);
  const photoH = H - bandH;
  const sky = ctx.createLinearGradient(0, 0, 0, photoH);
  sky.addColorStop(0, pal.sky[0]);
  sky.addColorStop(0.55, pal.sky[1]);
  sky.addColorStop(1, pal.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, photoH);
  const glow = ctx.createRadialGradient(W * 0.7, photoH * 0.9, 0, W * 0.7, photoH * 0.9, W * 0.55);
  glow.addColorStop(0, pal.glow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, photoH);
  // The sun and palms live in the backdrop only — photos cover them where
  // panels sit, so they never land on a face.
  drawSun(ctx, W * 0.70, photoH * 0.34, Math.min(W, H) * 0.16, pal);
  drawPalmTree(ctx, W * 0.08, photoH * 0.98, H * 0.30, 'rgba(20, 8, 32, 0.85)');
  drawPalmTree(ctx, W * 0.94, photoH * 0.95, H * 0.22, 'rgba(20, 8, 32, 0.85)');
  drawPalmTree(ctx, W * 0.86, photoH * 0.99, H * 0.16, 'rgba(20, 8, 32, 0.7)');
}

// --- photos -----------------------------------------------------------------

function photoReady(photo) {
  return !!photo && !!photo.image && photo.image.complete && photo.image.naturalWidth > 0;
}

function drawPhoto(ctx, photo, w, h) {
  // Cover-fit inside a w x h box whose origin is the panel center (the
  // caller translated there). Pan is a 0..1 fraction of the spare room, so
  // the image can never slide far enough to open a gap, and zoom only
  // magnifies the cover — it can never shrink a photo below the panel.
  const img = photo.image;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const fit = Math.max(w / iw, h / ih);
  const scale = fit * (photo.scale || 1);
  const dw = iw * scale, dh = ih * scale;
  const spareX = Math.max(0, dw - w), spareY = Math.max(0, dh - h);
  const dx = -w / 2 - (photo.panX ?? 0.5) * spareX;
  const dy = -h / 2 - (photo.panY ?? 0.5) * spareY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function localCorners(w, h, slant) {
  return [
    [-w / 2 + slant, -h / 2],
    [w / 2 + slant, -h / 2],
    [w / 2 - slant, h / 2],
    [-w / 2 - slant, h / 2],
  ];
}

function paintPanels(ctx, design, boxes, slots, pal, W) {
  boxes.forEach((b, i) => {
    const slot = slots[i];
    const photo = slot != null && slot >= 0 ? design.photos[slot] : null;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);
    ctx.beginPath();
    localCorners(b.width, b.height, b.slant).forEach(([x, y], j) => (j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.clip();
    if (photoReady(photo)) drawPhoto(ctx, photo, b.width, b.height);
    const shade = ctx.createLinearGradient(0, -b.height / 2, 0, b.height / 2);
    shade.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
    shade.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
    ctx.fillStyle = shade;
    ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
    ctx.restore();
    // Ink frame around the same slanted outline.
    ctx.save();
    ctx.beginPath();
    b.corners.forEach(([x, y], j) => (j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.strokeStyle = pal.frame;
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.stroke();
    ctx.restore();
  });
}

// --- title band -------------------------------------------------------------

function fitText(ctx, text, family, cap, start) {
  // Shrink-to-fit in one step: measure once, scale directly.
  ctx.font = `${start}px ${family}`;
  const w = ctx.measureText(text).width;
  if (w <= cap) return start;
  return Math.max(12, Math.floor((start * cap) / w));
}

function drawTitleLine(ctx, line, x, y, size, grad, ink) {
  ctx.font = `${size}px Anton`;
  ctx.lineJoin = 'round';
  // Hard offset shadow, then a thick ink outline, then the gradient fill.
  ctx.fillStyle = ink;
  ctx.fillText(line, x + size * 0.06, y + size * 0.06);
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(2, size * 0.10);
  ctx.strokeText(line, x, y);
  ctx.fillStyle = grad;
  ctx.fillText(line, x, y);
}

function paintTitleBand(ctx, design, W, H, pal) {
  const bandH = Math.round(H * 0.30);
  const photoH = H - bandH;
  const band = ctx.createLinearGradient(0, photoH, 0, H);
  band.addColorStop(0, pal.band[0]);
  band.addColorStop(1, pal.band[1]);
  ctx.fillStyle = band;
  ctx.fillRect(0, photoH, W, bandH);
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(0, photoH, W, Math.max(2, H * 0.004));
  // Halftone dots.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
  const step = Math.max(10, W * 0.012);
  for (let y = photoH + step; y < H - step / 2; y += step) {
    for (let x = step / 2; x < W; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, step * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const lines = design.stackedTitle ? design.heading.split(/\s+/).filter(Boolean) : [design.heading];
  const cap = W * 0.86;
  const subSize = Math.round(bandH * 0.17);
  const reserved = design.tagline ? subSize * 1.6 : 0;
  const startSize = bandH * (design.stackedTitle ? 0.42 : 0.52);
  // The subtitle sits below the title, so the title size is capped by the
  // height budget of the whole block: first-baseline offset + title lines
  // + subtitle must stay inside the band, with room for descenders.
  const fitCap = design.tagline
    ? (bandH / 2 + subSize * 0.15) / (lines.length * 0.51 + 0.82)
    : (bandH / 2) / (lines.length * 0.51 + 0.1);
  let size = Math.min(startSize, fitCap);
  for (const line of lines) size = Math.min(size, fitText(ctx, line, 'Anton', cap, startSize));
  ctx.font = `${size}px Anton`;
  const lineH = size * 1.02;
  const blockH = lines.length * lineH + reserved;
  let y = photoH + (bandH - blockH) / 2 + size * 0.82;
  const grad = ctx.createLinearGradient(0, y - size, 0, y + (lines.length - 1) * lineH);
  grad.addColorStop(0, pal.heading[0]);
  grad.addColorStop(1, pal.heading[1]);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = `${design.spacing || 0}px`; } catch { /* older canvas: no tracking */ }
  for (const line of lines) {
    drawTitleLine(ctx, line, W / 2, y, size, grad, pal.ink);
    y += lineH;
  }
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas: no tracking */ }
  if (design.tagline) {
    ctx.font = `${subSize}px Pacifico`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillText(design.tagline, W / 2, y + subSize * 0.35);
  }
  ctx.textAlign = 'left';
}

// --- chrome: ribbon + stars -------------------------------------------------

function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function paintChrome(ctx, design, W, H, pal) {
  if (design.ribbon) {
    const fs = Math.max(13, Math.round(W * 0.016));
    ctx.save();
    ctx.translate(W * 0.025, H * 0.028);
    ctx.rotate(-0.035);
    ctx.font = `${fs}px Anton`;
    const tw = ctx.measureText(design.ribbon).width;
    const padX = fs * 0.7, padY = fs * 0.45;
    ctx.fillStyle = pal.accent;
    ctx.fillRect(0, 0, tw + padX * 2, fs + padY * 2);
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(0, fs + padY * 2, tw + padX * 2, Math.max(2, fs * 0.12));
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(design.ribbon, padX, fs + padY * 0.55);
    ctx.restore();
  }
  const heat = Math.max(0, Math.min(5, design.heat || 0));
  const r = Math.max(8, W * 0.011);
  const gap = r * 2.5;
  const total = heat * gap;
  let x = W - total - W * 0.02;
  const y = H * 0.028 + r;
  ctx.fillStyle = pal.star;
  for (let i = 0; i < heat; i++) {
    starPath(ctx, x + r, y, r);
    ctx.fill();
    x += gap;
  }
}

// --- grain + vignette -------------------------------------------------------

let noiseCanvas = null;
function noiseTile() {
  if (noiseCanvas) return noiseCanvas;
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 128;
  noiseCanvas.height = 128;
  const nctx = noiseCanvas.getContext('2d');
  const data = nctx.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  return noiseCanvas;
}

// --- entry ------------------------------------------------------------------

export function renderPoster(ctx, design, W, H) {
  const pal = PALETTES[design.palette] || PALETTES.sunset;
  const boxes = arrangementBoxes(design.arrangement, W, H);
  const slots = design.slots || slotsForArrangement(design.arrangement);
  drawSky(ctx, W, H, pal);
  paintPanels(ctx, design, boxes, slots, pal, W);
  paintTitleBand(ctx, design, W, H, pal);
  paintChrome(ctx, design, W, H, pal);
  if (design.grain) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = ctx.createPattern(noiseTile(), 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (design.vignette) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.34)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
}
