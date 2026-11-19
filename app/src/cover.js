// Vice City Cover Studio — cover renderer.
//
// Paints a GTA-style multi-panel poster onto any canvas: a painted sunset
// sky (gradient, slatted sun, horizon glow) sits behind
// the photo panels, a bold stacked display title anchors the foot, and a
// badge ribbon plus a star meter finish the poster. Everything is drawn
// with the canvas 2D API; no image leaves the machine and nothing here
// touches the network.
//
// The public surface is small on purpose:
//   GRADES  — the five colour grades, each a sky, a sun and a title ramp.
//   LOOKS   — one-click presets: layout + grade + title treatment together.
//   LAYOUTS — the six panel arrangements.
//   paintCover(canvas, art) — draws one poster. `art` is a plain object:
//     { images, slots, pans, layout, grade, title, subtitle, badge,
//       stars, stacked, tracking, grain, vignette }
//     images: up to four loaded photos (or null); slots: one photo index
//     per panel (-1 leaves a panel as painted sky); pans: one {x, y, zoom}
//     per panel, each axis 0..1, zoom >= 1.

export const INK = '#160a18';

export const GRADES = {
  sunset: {
    label: 'Sunset',
    sky: ['#2a1052', '#b83a6b', '#ff7a3d', '#ffc46b'],
    sun: '#ffd76e',
    glow: 'rgba(255, 150, 60, 0.55)',
    tint: '#ff5a2a', tintAlpha: 0.10,
    title: ['#ffe259', '#ff7a3d'],
    accent: '#ffd76e',
    band: '#150818',
  },
  neon: {
    label: 'Neon Night',
    sky: ['#0b0630', '#3b1a7a', '#c62b8e', '#ff5fa2'],
    sun: '#ff7ad9',
    glow: 'rgba(190, 60, 255, 0.55)',
    tint: '#7a2bff', tintAlpha: 0.12,
    title: ['#7df9ff', '#ff5fa2'],
    accent: '#7df9ff',
    band: '#0a0618',
  },
  pink: {
    label: 'Vice Pink',
    sky: ['#3d0a3d', '#a4136b', '#ff4d8d', '#ffb3c8'],
    sun: '#ffe3ee',
    glow: 'rgba(255, 77, 141, 0.55)',
    tint: '#ff2e7e', tintAlpha: 0.10,
    title: ['#ffffff', '#ff8fb8'],
    accent: '#ff8fb8',
    band: '#1c0616',
  },
  teal: {
    label: 'Teal Dusk',
    sky: ['#041e2e', '#0b4a5e', '#1899a2', '#7fe0c3'],
    sun: '#e8fff6',
    glow: 'rgba(40, 200, 180, 0.5)',
    tint: '#0b6e7a', tintAlpha: 0.12,
    title: ['#d8fff4', '#54d8b8'],
    accent: '#7fe0c3',
    band: '#04141c',
  },
  noir: {
    label: 'Mono Noir',
    sky: ['#0c0c0e', '#2c2c34', '#6a6a78', '#c9c9d4'],
    sun: '#f2f2f5',
    glow: 'rgba(220, 220, 230, 0.4)',
    tint: '#000000', tintAlpha: 0.08,
    title: ['#ffffff', '#b9b9c4'],
    accent: '#e8e8ee',
    band: '#0a0a0c',
  },
};

export const LAYOUTS = ['slash', 'hero3', 'grid4', 'grid9', 'bleed', 'collage'];

export const LOOKS = {
  keyart: { label: 'Key Art', layout: 'slash', grade: 'sunset', stacked: true, tracking: 2 },
  neon: { label: 'Neon Night', layout: 'hero3', grade: 'neon', stacked: true, tracking: 3 },
  strip: { label: 'Sunset Strip', layout: 'collage', grade: 'sunset', stacked: true, tracking: 2 },
};

// ---------------------------------------------------------------------------
// Panel geometry. Every layout returns panels in a local frame where the
// photo zone is (0, 0, W, P) and the title band is the strip below it.
// A panel is { x, y, w, h, slant, rot }: slant shears the top edge right,
// rot turns the whole panel about its centre (collage only).
// ---------------------------------------------------------------------------

function panelRects(layout, W, P) {
  const gap = Math.max(6, W * 0.012);
  const slant = W * 0.055;
  switch (layout) {
    case 'slash': {
      const shares = [0.31, 0.23, 0.24, 0.22];
      const total = shares.reduce((a, b) => a + b, 0);
      const usable = W - gap * (shares.length - 1);
      let x = 0;
      return shares.map((s) => {
        const w = (usable * s) / total;
        const p = { x, y: 0, w, h: P, slant, rot: 0 };
        x += w + gap;
        return p;
      });
    }
    case 'hero3': {
      const heroH = P * 0.60;
      const rowH = P - heroH - gap;
      const third = (W - gap * 2) / 3;
      return [
        { x: 0, y: 0, w: W, h: heroH, slant: 0, rot: 0 },
        { x: 0, y: heroH + gap, w: third, h: rowH, slant: 0, rot: 0 },
        { x: third + gap, y: heroH + gap, w: third, h: rowH, slant: 0, rot: 0 },
        { x: (third + gap) * 2, y: heroH + gap, w: third, h: rowH, slant: 0, rot: 0 },
      ];
    }
    case 'grid4': {
      const cw = (W - gap) / 2;
      const ch = (P - gap) / 2;
      return [
        { x: 0, y: 0, w: cw, h: ch, slant: 0, rot: 0 },
        { x: cw + gap, y: 0, w: cw, h: ch, slant: 0, rot: 0 },
        { x: 0, y: ch + gap, w: cw, h: ch, slant: 0, rot: 0 },
        { x: cw + gap, y: ch + gap, w: cw, h: ch, slant: 0, rot: 0 },
      ];
    }
    case 'grid9': {
      const cw = (W - gap * 2) / 3;
      const ch = (P - gap * 2) / 3;
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({ x: c * (cw + gap), y: r * (ch + gap), w: cw, h: ch, slant: 0, rot: 0 });
        }
      }
      return out;
    }
    case 'bleed':
      return [{ x: 0, y: 0, w: W, h: P, slant: 0, rot: 0 }];
    case 'collage': {
      const w1 = W * 0.52;
      const h1 = P * 0.72;
      const w2 = W * 0.56;
      const h2 = P * 0.66;
      const w3 = W * 0.60;
      const h3 = P * 0.52;
      return [
        { x: W * 0.03, y: P * 0.04, w: w1, h: h1, slant: 0, rot: -0.05 },
        { x: W * 0.42, y: P * 0.02, w: w2, h: h2, slant: 0, rot: 0.045 },
        { x: W * 0.20, y: P * 0.46, w: w3, h: h3, slant: 0, rot: -0.025 },
      ];
    }
    default:
      return panelRects('slash', W, P);
  }
}

// ---------------------------------------------------------------------------
// Small drawing helpers.
// ---------------------------------------------------------------------------

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// Draws `img` into rect (rx, ry, rw, rh) with cover math on each axis:
// the photo always fills the rect, panning never opens a gap, and zoom
// never crops harder than the rect needs. pan.x / pan.y are 0..1.
function drawPhotoInto(ctx, img, rx, ry, rw, rh, pan) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const base = Math.max(rw / iw, rh / ih);
  const s = base * Math.max(1, pan.zoom || 1);
  const dw = iw * s;
  const dh = ih * s;
  const dx = rx - (dw - rw) * clamp(pan.x ?? 0.5, 0, 1);
  const dy = ry - (dh - rh) * clamp(pan.y ?? 0.5, 0, 1);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function tracePanelPath(ctx, p) {
  const s = p.slant || 0;
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(p.w + s, 0);
  ctx.lineTo(p.w, p.h);
  ctx.lineTo(0, p.h);
  ctx.closePath();
}

// A five-point star centred at (cx, cy) with outer radius r.
function traceStar(ctx, cx, cy, r) {
  const inner = r * 0.45;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Backdrop: painted sky, slatted sun, horizon glow.
// ---------------------------------------------------------------------------

function paintSky(ctx, W, H, P, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, P);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, P);

  // Horizon glow.
  const glow = ctx.createRadialGradient(W * 0.66, P * 0.86, 0, W * 0.66, P * 0.86, W * 0.55);
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, P);

  // Slatted retro sun, high in the sky so it never sits on a face.
  const sx = W * 0.68;
  const sy = P * 0.30;
  const sr = Math.min(W, P) * 0.17;
  const halo = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 2.1);
  halo.addColorStop(0, grade.glow);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sx - sr * 2.2, sy - sr * 2.2, sr * 4.4, sr * 4.4);
  ctx.save();
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = grade.sun;
  ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  // Slats: sky-coloured bands cut across the lower half of the disc.
  ctx.fillStyle = grade.sky[1];
  let bandY = sy + sr * 0.05;
  let bandH = sr * 0.07;
  while (bandY < sy + sr) {
    ctx.fillRect(sx - sr, bandY, sr * 2, bandH);
    bandY += bandH * 2.6;
    bandH *= 1.25;
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// One panel: photo (or painted sky), grade tint, depth shading, ink frame.
// ---------------------------------------------------------------------------

function paintPanel(ctx, panel, img, pan, grade, W) {
  ctx.save();
  ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
  if (panel.rot) ctx.rotate(panel.rot);
  ctx.translate(-panel.w / 2, -panel.h / 2);
  tracePanelPath(ctx, panel);
  ctx.clip();
  if (img) {
    drawPhotoInto(ctx, img, 0, 0, panel.w, panel.h, pan);
  } else {
    // Empty panel stays painted sky: soften it so it reads as a backdrop.
    const soft = ctx.createLinearGradient(0, 0, 0, panel.h);
    soft.addColorStop(0, grade.sky[1]);
    soft.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = soft;
    ctx.fillRect(0, 0, panel.w, panel.h);
  }
  // Grade tint over the photo.
  ctx.fillStyle = grade.tint;
  ctx.globalAlpha = grade.tintAlpha;
  ctx.fillRect(-2, -2, panel.w + 4, panel.h + 4);
  ctx.globalAlpha = 1;
  // Top light, bottom ink: gives each photo a little depth.
  const shade = ctx.createLinearGradient(0, 0, 0, panel.h);
  shade.addColorStop(0, 'rgba(255,255,255,0.10)');
  shade.addColorStop(0.55, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(10,4,12,0.28)');
  ctx.fillStyle = shade;
  ctx.fillRect(-2, -2, panel.w + 4, panel.h + 4);
  ctx.restore();

  // Ink frame, same path.
  ctx.save();
  ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
  if (panel.rot) ctx.rotate(panel.rot);
  ctx.translate(-panel.w / 2, -panel.h / 2);
  tracePanelPath(ctx, panel);
  ctx.lineWidth = Math.max(3, W * 0.004);
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Poster furniture: badge ribbon, star meter, title band, grain, vignette.
// ---------------------------------------------------------------------------

function paintBadge(ctx, W, grade, badge) {
  const text = (badge || '').trim().toUpperCase();
  if (!text) return;
  const h = Math.max(26, W * 0.038);
  const w = Math.max(120, W * 0.20);
  ctx.save();
  ctx.translate(W * 0.02, W * 0.022);
  ctx.rotate(-0.03);
  ctx.fillStyle = '#ff2e7e';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffd76e';
  ctx.fillRect(0, h - Math.max(3, h * 0.12), w, Math.max(3, h * 0.12));
  ctx.font = `${Math.round(h * 0.52)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  try { ctx.letterSpacing = '2px'; } catch (e) { /* older canvas: ignore */ }
  ctx.fillText(text, w / 2, h * 0.44);
  try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas: ignore */ }
  ctx.restore();
}

function paintStars(ctx, W, count) {
  const n = clamp(Math.round(count || 0), 0, 5);
  if (n === 0) return;
  const r = Math.max(10, W * 0.014);
  const gap = r * 2.35;
  const total = n * gap;
  let x = W - total - W * 0.02 + gap / 2;
  const y = W * 0.038;
  for (let i = 0; i < n; i++) {
    traceStar(ctx, x, y, r);
    ctx.fillStyle = '#ffd76e';
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.14);
    ctx.strokeStyle = INK;
    ctx.stroke();
    x += gap;
  }
}

function splitTitle(title) {
  const words = (title || 'VICE CITY').trim().toUpperCase().split(/\s+/);
  if (words.length <= 1) return [words[0] || 'VICE'];
  // Balance the words across two stacked lines.
  let best = null;
  for (let cut = 1; cut < words.length; cut++) {
    const a = words.slice(0, cut).join(' ');
    const b = words.slice(cut).join(' ');
    const score = Math.abs(a.length - b.length);
    if (!best || score < best.score) best = { score, lines: [a, b] };
  }
  return best.lines;
}

function paintTitleBand(ctx, W, H, bandY, bandH, art, grade) {
  // Dark band with a halftone dot field and a bright top rule.
  const band = ctx.createLinearGradient(0, bandY, 0, H);
  band.addColorStop(0, grade.band);
  band.addColorStop(1, '#050308');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, H - bandY);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandY, W, Math.max(3, H * 0.004));
  // Halftone dots, faint, across the band.
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  const step = Math.max(14, W * 0.014);
  for (let y = bandY + step * 0.7; y < H - step * 0.4; y += step) {
    for (let x = step * 0.5; x < W; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.2, step * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const titleLines = art.stacked ? splitTitle(art.title) : [(art.title || 'VICE CITY').trim().toUpperCase()];
  const sub = (art.subtitle || '').trim();
  const availH = bandH * (sub ? 0.66 : 0.82);
  let size = availH / Math.max(1, titleLines.length);
  const measure = (s) => {
    ctx.font = `${s}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${art.tracking || 0}px`; } catch (e) { /* ignore */ }
    return Math.max(...titleLines.map((l) => ctx.measureText(l).width));
  };
  while (measure(size) > W * 0.9 && size > 12) size -= 2;
  const grad = ctx.createLinearGradient(0, bandY, 0, bandY + size * titleLines.length);
  grad.addColorStop(0, grade.title[0]);
  grad.addColorStop(1, grade.title[1]);
  const lineH = size * 1.02;
  const blockH = lineH * titleLines.length;
  let ty = bandY + (availH - blockH) / 2 + size * 0.86;
  if (!sub) ty = bandY + (bandH - blockH) / 2 + size * 0.86;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${size}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${art.tracking || 0}px`; } catch (e) { /* ignore */ }
  ctx.lineJoin = 'round';
  for (const line of titleLines) {
    // Hard ink drop shadow, then the gradient face with an ink outline.
    ctx.fillStyle = INK;
    ctx.fillText(line, W / 2 + size * 0.045, ty + size * 0.055);
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(2, size * 0.085);
    ctx.strokeText(line, W / 2, ty);
    ctx.fillStyle = grad;
    ctx.fillText(line, W / 2, ty);
    ty += lineH;
  }
  try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }
  if (sub) {
    ctx.font = `${Math.round(Math.max(16, size * 0.34))}px Pacifico, cursive`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(sub, W / 2, bandY + bandH * 0.92);
  }
}

let noisePattern = null;
function paintGrain(ctx, W, H) {
  if (!noisePattern) {
    const n = 140;
    const c = document.createElement('canvas');
    c.width = n;
    c.height = n;
    const nctx = c.getContext('2d');
    const img = nctx.createImageData(n, n);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.floor(Math.random() * 90);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
    noisePattern = ctx.createPattern(c, 'repeat');
  }
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = noisePattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function paintVignette(ctx, W, H) {
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(5,2,8,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

// Which panel, if any, holds the point (px, py) in canvas pixels?
// Checks front panels first so overlaps pick the panel on top. Returns
// the panel index, or -1. The title band is not a panel.
export function panelAt(layout, W, H, px, py) {
  const bandH = H * 0.30;
  const photoH = H - bandH;
  const panels = panelRects(layout, W, layout === 'bleed' ? H : photoH);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    let lx = px - (p.x + p.w / 2);
    let ly = py - (p.y + p.h / 2);
    if (p.rot) {
      const c = Math.cos(-p.rot);
      const s = Math.sin(-p.rot);
      const rx = lx * c - ly * s;
      const ry = lx * s + ly * c;
      lx = rx;
      ly = ry;
    }
    lx += p.w / 2;
    ly += p.h / 2;
    if (lx < 0 || lx > p.w || ly < 0 || ly > p.h) continue;
    const t = ly / p.h;
    const shift = (p.slant || 0) * (1 - t);
    if (lx >= shift && lx <= p.w + shift) return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// The poster itself.
// ---------------------------------------------------------------------------

export function paintCover(canvas, art) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[art.grade] || GRADES.sunset;
  const bleed = art.layout === 'bleed';
  const bandH = H * 0.30;
  const photoH = H - bandH;

  // 1. Painted sky behind everything.
  paintSky(ctx, W, H, bleed ? H : photoH, grade);

  // 2. Photo panels.
  const panels = panelRects(art.layout || 'slash', W, bleed ? H : photoH);
  const slots = art.slots || [];
  const pans = art.pans || [];
  panels.forEach((p, i) => {
    const slot = slots[i] ?? (i < (art.images || []).length ? i : -1);
    const img = slot >= 0 ? (art.images || [])[slot] : null;
    const pan = pans[i] || { x: 0.5, y: 0.5, zoom: 1 };
    paintPanel(ctx, p, img, pan, grade, W);
  });

  // 3. Title band (over the photo bottom for bleed, its own strip otherwise).
  const bandY = bleed ? H - bandH : photoH;
  if (!bleed) {
    paintTitleBand(ctx, W, H, bandY, bandH, art, grade);
  } else {
    ctx.fillStyle = 'rgba(8,3,10,0.55)';
    ctx.fillRect(0, bandY, W, bandH);
    paintTitleBand(ctx, W, H, bandY, bandH, art, grade);
  }

  // 4. Badge ribbon and star meter.
  paintBadge(ctx, W, grade, art.badge);
  paintStars(ctx, W, art.stars);

  // 5. Grain and vignette, if the artist wants them.
  if (art.grain !== false) paintGrain(ctx, W, H);
  if (art.vignette !== false) paintVignette(ctx, W, H);
}

// A fresh default poster for a set of loaded photos.
export function defaultArt(images) {
  const n = (images || []).length;
  return {
    images: images || [],
    slots: [0, 1, 2, 3].slice(0, Math.max(1, n)),
    pans: [
      { x: 0.5, y: 0.5, zoom: 1 },
      { x: 0.5, y: 0.5, zoom: 1 },
      { x: 0.5, y: 0.5, zoom: 1 },
      { x: 0.5, y: 0.5, zoom: 1 },
      { x: 0.5, y: 0.5, zoom: 1 },
      { x: 0.5, y: 0.5, zoom: 1 },
      { x: 0.5, y: 0.5, zoom: 1 },
      { x: 0.5, y: 0.5, zoom: 1 },
      { x: 0.5, y: 0.5, zoom: 1 },
    ],
    layout: 'slash',
    grade: 'sunset',
    title: 'VICE CITY',
    subtitle: 'one last sunset heist',
    badge: 'VICE CITY',
    stars: 4,
    stacked: true,
    tracking: 2,
    grain: true,
    vignette: true,
  };
}
