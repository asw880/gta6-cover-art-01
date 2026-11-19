// Vice City Cover Studio — canvas cover engine (v2).
// Paints a multi-panel poster (key-art look) from photos and a caption:
// a painted sunset sky with a slatted sun and palm silhouettes behind
// slashed / inked panels, a strong sunset-or-neon grade, a halftone title
// band and huge gradient display lettering with a hard drop shadow, drawn
// over the photo. One-click Looks presets set layout + grade + title
// treatment together.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.45) contrast(1.12) brightness(1.04)',
    washes: [
      ['overlay', 'rgba(255, 110, 60, 0.20)'],
      ['soft-light', 'rgba(255, 60, 140, 0.30)'],
    ],
    sky: ['#ff9a3d', '#ff4d6d', '#7b2d8b'],
    title: ['#ffe259', '#ffa751', '#ff5e62'],
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.6) contrast(1.18) brightness(0.92)',
    washes: [
      ['overlay', 'rgba(0, 229, 255, 0.18)'],
      ['soft-light', 'rgba(255, 0, 153, 0.34)'],
    ],
    sky: ['#00e5ff', '#ff0099', '#2b0a4d'],
    title: ['#7df9ff', '#ff7ad9', '#ff2e88'],
  },
  pink: {
    label: 'Vice Pink',
    filter: 'saturate(1.55) contrast(1.08) brightness(1.05)',
    washes: [
      ['overlay', 'rgba(255, 120, 200, 0.26)'],
      ['soft-light', 'rgba(255, 80, 160, 0.30)'],
    ],
    sky: ['#ffb6e6', '#ff5ea8', '#8b1e6b'],
    title: ['#fff0f6', '#ffb6e6', '#ff5ea8'],
  },
  teal: {
    label: 'Teal Dusk',
    filter: 'saturate(1.35) contrast(1.14) brightness(0.96)',
    washes: [
      ['overlay', 'rgba(0, 180, 180, 0.22)'],
      ['soft-light', 'rgba(255, 140, 60, 0.22)'],
    ],
    sky: ['#5eead4', '#0ea5a5', '#123a5c'],
    title: ['#d1fae5', '#5eead4', '#fb923c'],
  },
  noir: {
    label: 'Mono Noir',
    filter: 'grayscale(1) contrast(1.28) brightness(1.02)',
    washes: [
      ['overlay', 'rgba(255, 255, 255, 0.10)'],
      ['soft-light', 'rgba(0, 0, 0, 0.25)'],
    ],
    sky: ['#e5e5e5', '#9a9a9a', '#111111'],
    title: ['#ffffff', '#d4d4d4', '#9a9a9a'],
  },
};

export const LAYOUTS = {
  hero3: { label: 'Hero + 3', panels: 4 },
  slash: { label: 'Slash Key Art', panels: 3 },
  grid4: { label: '4-Panel Grid', panels: 4 },
  fullbleed: { label: 'Full Bleed', panels: 1 },
  collage: { label: 'Tilted Collage', panels: 3 },
  grid9: { label: '9-Panel Grid', panels: 9 },
};

/** One-click Looks: layout + grade + title treatment, set together. */
export const LOOKS = {
  keyart: { label: 'Key Art', layout: 'slash', grade: 'sunset', stacked: true, tracking: 2 },
  neon: { label: 'Neon Night', layout: 'hero3', grade: 'neon', stacked: true, tracking: 4 },
  strip: { label: 'Sunset Strip', layout: 'grid4', grade: 'pink', stacked: false, tracking: 1 },
};

export const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  landscape: { label: 'Landscape 1920 x 1080', w: 1920, h: 1080 },
};

/** Panel rectangles (with slash / tilt info) for a layout at canvas size w x h. */
export function layoutPanels(layout, w, h) {
  const gap = Math.round(Math.min(w, h) * 0.012);
  const g = gap;
  switch (layout) {
    case 'grid4':
      return [
        { x: g, y: g, w: w / 2 - g * 1.5, h: h / 2 - g * 1.5 },
        { x: w / 2 + g / 2, y: g, w: w / 2 - g * 1.5, h: h / 2 - g * 1.5 },
        { x: g, y: h / 2 + g / 2, w: w / 2 - g * 1.5, h: h / 2 - g * 1.5 },
        { x: w / 2 + g / 2, y: h / 2 + g / 2, w: w / 2 - g * 1.5, h: h / 2 - g * 1.5 },
      ];
    case 'grid9': {
      const cw = w / 3, ch = h / 3, out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        out.push({ x: c * cw + g / 2, y: r * ch + g / 2, w: cw - g, h: ch - g });
      }
      return out;
    }
    case 'fullbleed':
      return [{ x: 0, y: 0, w, h }];
    case 'slash': {
      // Three tall panels cut by big diagonal slashes, with thin strips of
      // the painted sky showing between them — the poster torn in strips.
      const cut = w * 0.10;
      return [
        { x: 0, y: 0, w: w * 0.36, h, slash: cut, side: 'right' },
        { x: w * 0.375, y: 0, w: w * 0.295, h, slash: cut, side: 'both' },
        { x: w * 0.685, y: 0, w: w * 0.315, h, slash: cut, side: 'left' },
      ];
    }
    case 'collage': {
      const pw = w * 0.52, ph = h * 0.52;
      return [
        { x: w * 0.06, y: h * 0.05, w: pw, h: ph, rot: -4 },
        { x: w * 0.44, y: h * 0.10, w: pw, h: ph, rot: 3 },
        { x: w * 0.24, y: h * 0.44, w: pw, h: ph, rot: -1.5 },
      ];
    }
    case 'hero3':
    default: {
      const heroH = h * 0.62;
      const bw = (w - g * 4) / 3;
      return [
        { x: g, y: g, w: w - g * 2, h: heroH - g },
        { x: g, y: heroH + g / 2, w: bw, h: h - heroH - g * 1.5 },
        { x: g * 2 + bw, y: heroH + g / 2, w: bw, h: h - heroH - g * 1.5 },
        { x: g * 3 + bw * 2, y: heroH + g / 2, w: bw, h: h - heroH - g * 1.5 },
      ];
    }
  }
}

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Retro slatted sun: horizontal bands of warm gradient, gaps widening down. */
function drawSun(ctx, cx, cy, r) {
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grad.addColorStop(0, 'rgba(255, 246, 200, 0.95)');
  grad.addColorStop(0.45, 'rgba(255, 170, 90, 0.92)');
  grad.addColorStop(1, 'rgba(255, 90, 120, 0.88)');
  ctx.fillStyle = grad;
  const bands = 7;
  for (let i = 0; i < bands; i++) {
    const y0 = cy - r + (i * 2 * r) / bands;
    const y1 = cy - r + ((i + 1) * 2 * r) / bands;
    // No gap in the top two bands; widening cuts through the lower half.
    const gap = i < 2 ? 0 : (i - 1) * r * 0.035;
    const ym = (y0 + y1) / 2;
    const dy = ym - cy;
    const half = Math.sqrt(Math.max(0, r * r - dy * dy));
    ctx.fillRect(cx - half, y0 + gap / 2, half * 2, Math.max(1, (y1 - y0) - gap));
  }
}

/** One palm-tree silhouette: curved trunk, drooping fronds from the crown. */
function drawPalm(ctx, x, y, s, colour) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.06, y - s * 0.55, x + s * 0.14, y - s * 0.92);
  ctx.stroke();
  const tx = x + s * 0.14, ty = y - s * 0.92;
  for (let i = 0; i < 7; i++) {
    const a = (-168 + i * 28) * Math.PI / 180;
    const len = s * (0.40 + 0.10 * Math.sin(i * 2.1));
    const ex = tx + Math.cos(a) * len;
    const ey = ty + Math.sin(a) * len * 0.5 + len * 0.30;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(
      tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.5 - len * 0.14,
      ex, ey,
    );
    ctx.lineWidth = Math.max(2, s * 0.035);
    ctx.stroke();
  }
  ctx.restore();
}

/** Painted sky inside rect (x, y, w, h): gradient, big sun, palm silhouettes. */
function paintSky(ctx, x, y, w, h, grade, seed) {
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // Warm glow low in the sky, behind the sun.
  const glow = ctx.createRadialGradient(
    x + w * 0.5, y + h * 0.34, 0, x + w * 0.5, y + h * 0.34, Math.min(w, h) * 0.55,
  );
  glow.addColorStop(0, 'rgba(255, 220, 140, 0.45)');
  glow.addColorStop(1, 'rgba(255, 220, 140, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  if (grade !== GRADES.noir) {
    drawSun(ctx, x + w * 0.5, y + h * 0.30, Math.min(w, h) * 0.26);
  } else {
    // Noir gets a pale moon instead of a sunset sun.
    ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.26, Math.min(w, h) * 0.10, 0, Math.PI * 2);
    ctx.fill();
  }
  // Palm silhouettes along the bottom edge, deterministic per seed.
  const rnd = seededRandom(seed);
  const ink = 'rgba(18, 8, 28, 0.88)';
  const count = Math.max(2, Math.round(w / (Math.min(w, h) * 0.55)));
  for (let i = 0; i < count; i++) {
    const px = x + w * (0.06 + (0.88 * (i + rnd() * 0.4)) / count);
    const ps = h * (0.22 + rnd() * 0.14);
    drawPalm(ctx, px, y + h * 1.02, ps, ink);
  }
}

/** Draw one photo into a panel rect, honouring zoom and pan, then grade it. */
function paintPanel(ctx, rect, photo, cfg, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  if (rect.slash) {
    // Parallelogram clip: top edge shifted by the slash amount.
    const s = rect.slash;
    ctx.moveTo(x + (rect.side === 'left' || rect.side === 'both' ? s : 0), y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - (rect.side === 'right' || rect.side === 'both' ? s : 0), y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  } else if (rect.rot) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((rect.rot * Math.PI) / 180);
    ctx.rect(-w / 2, -h / 2, w, h);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.clip();
  // In a rotated (collage) panel the frame's top-left is (-w/2, -h/2).
  const cx = rect.rot ? -w / 2 : x;
  const cy = rect.rot ? -h / 2 : y;
  if (photo) {
    const zoom = cfg.zoom ?? 1;
    // Exact coverage: panning shifts the photo by up to a quarter of the
    // panel, so the photo must be scaled to cover the panel plus twice
    // that shift on each axis — otherwise a gap opens and the backdrop
    // shows through (v1's empty orange strip in shot 1). The old uniform
    // overscan over-zoomed portrait photos and cropped faces out of frame.
    const ox = (cfg.ox ?? 0) * w * 0.25;
    const oy = (cfg.oy ?? 0) * h * 0.25;
    const base = Math.max(
      (w * (1 + 0.5 * Math.abs(cfg.ox ?? 0))) / photo.naturalWidth,
      (h * (1 + 0.5 * Math.abs(cfg.oy ?? 0))) / photo.naturalHeight,
    ) * zoom;
    const pw = photo.naturalWidth * base;
    const ph = photo.naturalHeight * base;
    ctx.filter = grade.filter;
    ctx.drawImage(photo, cx + (w - pw) / 2 + ox, cy + (h - ph) / 2 + oy, pw, ph);
    ctx.filter = 'none';
  } else {
    paintSky(ctx, cx, cy, w, h, grade, 7);
  }
  // Grade washes: warm / neon colour laid over the photo, poster style.
  for (const [mode, colour] of grade.washes) {
    ctx.globalCompositeOperation = mode;
    ctx.fillStyle = colour;
    ctx.fillRect(cx - w, cy - h, w * 3, h * 3);
  }
  ctx.globalCompositeOperation = 'source-over';
  // Top light + bottom ink: depth that pushes the photo toward a painting.
  const topLight = ctx.createLinearGradient(0, cy, 0, cy + h * 0.5);
  topLight.addColorStop(0, 'rgba(255, 240, 200, 0.14)');
  topLight.addColorStop(1, 'rgba(255, 240, 200, 0)');
  ctx.fillStyle = topLight;
  ctx.fillRect(cx, cy, w, h * 0.5);
  const bottomInk = ctx.createLinearGradient(0, cy + h * 0.55, 0, cy + h);
  bottomInk.addColorStop(0, 'rgba(14, 6, 24, 0)');
  bottomInk.addColorStop(1, 'rgba(14, 6, 24, 0.34)');
  ctx.fillStyle = bottomInk;
  ctx.fillRect(cx, cy + h * 0.55, w, h * 0.45);
  // No sun disc over a photo panel: it lands on faces as often as on sky.
  // The painted sun lives in the backdrop sky (seen through the slash
  // gaps) and in empty panels, which paintSky fills with sun and palms.
  ctx.restore();

  // Inked frame: thick dark edge, thin pale inner line — the painted-poster edge.
  ctx.save();
  ctx.lineJoin = 'miter';
  const lw = Math.max(4, Math.min(w, h) * 0.016);
  ctx.strokeStyle = '#12081c';
  ctx.lineWidth = lw;
  ctx.beginPath();
  if (rect.slash) {
    const s = rect.slash;
    ctx.moveTo(x + (rect.side === 'left' || rect.side === 'both' ? s : 0), y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - (rect.side === 'right' || rect.side === 'both' ? s : 0), y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  } else if (rect.rot) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((rect.rot * Math.PI) / 180);
    ctx.rect(-w / 2, -h / 2, w, h);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1, lw * 0.28);
  ctx.stroke();
  ctx.restore();
}

/** Halftone dot field inside a rect, used on the title band. */
function halftone(ctx, x, y, w, h, colour) {
  const step = Math.max(10, w * 0.014);
  ctx.fillStyle = colour;
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const r = step * 0.16 * (0.6 + 0.4 * Math.sin(xx * 0.05));
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Split a title into two stacked lines at the space nearest the middle. */
function splitTitle(title) {
  const words = title.split(/\s+/);
  if (words.length < 2) return [title];
  let best = 1, bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ').length;
    const b = words.slice(i).join(' ').length;
    const d = Math.abs(a - b);
    if (d < bestDiff) { bestDiff = d; best = i; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/** One display line: hard ink drop shadow, thick outline, gradient fill. */
function paintTitleLine(ctx, text, cx, cy, size, grade, tracking) {
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  ctx.letterSpacing = `${tracking}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const dx = size * 0.055, dy = size * 0.06;
  // Hard drop shadow first — the flat poster shadow, no blur.
  ctx.fillStyle = '#12081c';
  ctx.fillText(text, cx + dx, cy + dy);
  // Thick ink outline.
  ctx.strokeStyle = '#12081c';
  ctx.lineWidth = Math.max(5, size * 0.16);
  ctx.strokeText(text, cx, cy);
  // Gradient lettering.
  const grad = ctx.createLinearGradient(0, cy - size * 0.6, 0, cy + size * 0.6);
  grade.title.forEach((c, i) => grad.addColorStop(i / (grade.title.length - 1), c));
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, cy);
}

/** Big display title with sunset gradient fill, ink outline and drop shadow. */
function paintTitle(ctx, state, w, h, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  const tracking = state.tracking ?? 2;
  const stacked = state.stacked && title.includes(' ');
  const bandH = h * (stacked ? (sub ? 0.30 : 0.27) : (sub ? 0.23 : 0.20));
  const bandY = h - bandH;
  // Title band: dark ink slab with a sunset stripe on top.
  ctx.fillStyle = 'rgba(14, 6, 24, 0.92)';
  ctx.fillRect(0, bandY, w, bandH);
  const stripe = ctx.createLinearGradient(0, 0, w, 0);
  grade.title.forEach((c, i) => stripe.addColorStop(i / (grade.title.length - 1), c));
  ctx.fillStyle = stripe;
  ctx.fillRect(0, bandY, w, Math.max(6, h * 0.008));
  if (state.halftone) halftone(ctx, 0, bandY + bandH * 0.55, w, bandH * 0.45, 'rgba(255,255,255,0.16)');

  if (!title) return;
  const cx = w / 2;
  if (stacked) {
    const lines = splitTitle(title);
    let size = bandH * (sub ? 0.38 : 0.42);
    const fit = (s) => {
      ctx.font = `${s}px Anton, 'Arial Black', sans-serif`;
      ctx.letterSpacing = `${tracking}px`;
      return Math.max(...lines.map((l) => ctx.measureText(l).width));
    };
    while (fit(size) > w * 0.92 && size > 16) size -= 4;
    const lineH = size * 1.02;
    const y0 = bandY + bandH * (sub ? 0.30 : 0.50) - lineH / 2;
    lines.forEach((line, i) => paintTitleLine(ctx, line, cx, y0 + i * lineH, size, grade, tracking));
  } else {
    let size = bandH * (sub ? 0.58 : 0.66);
    const fit = (s) => {
      ctx.font = `${s}px Anton, 'Arial Black', sans-serif`;
      ctx.letterSpacing = `${tracking}px`;
      return ctx.measureText(title).width;
    };
    while (fit(size) > w * 0.92 && size > 16) size -= 4;
    const cy = bandY + bandH * (sub ? 0.38 : 0.54);
    paintTitleLine(ctx, title, cx, cy, size, grade, tracking);
  }
  ctx.letterSpacing = '0px';

  if (sub) {
    let ss = bandH * (stacked ? 0.17 : 0.23);
    ctx.font = `${ss}px Pacifico, cursive`;
    while (ctx.measureText(sub).width > w * 0.8 && ss > 12) {
      ss -= 2;
      ctx.font = `${ss}px Pacifico, cursive`;
    }
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(18,8,28,0.7)';
    ctx.lineWidth = Math.max(2, ss * 0.08);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const sy = bandY + bandH * (stacked ? 0.88 : 0.80);
    ctx.strokeText(sub, cx, sy);
    ctx.fillText(sub, cx, sy);
  }
}

/** Ribbon badge (top-left) and star heat meter (top-right). */
function paintChrome(ctx, state, w, h) {
  const u = Math.min(w, h);
  if (state.badge) {
    const bw = w * 0.32, bh = h * 0.05;
    ctx.save();
    ctx.translate(w * 0.02, h * 0.03);
    ctx.rotate(-3 * Math.PI / 180);
    ctx.fillStyle = '#ff2e88';
    ctx.fillRect(0, 0, bw, bh);
    ctx.fillStyle = '#ffd319';
    ctx.fillRect(0, bh, bw, Math.max(3, bh * 0.14));
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${bh * 0.54}px Anton, 'Arial Black', sans-serif`;
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.badge.toUpperCase(), bw / 2, bh * 0.52);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }
  const heat = state.heat ?? 0;
  if (heat > 0) {
    const s = u * 0.032;
    const x0 = w - (heat * s * 1.25) - w * 0.02;
    const y0 = h * 0.03;
    for (let i = 0; i < heat; i++) drawStar(ctx, x0 + i * s * 1.25 + s / 2, y0 + s / 2, s / 2);
  }
}

function drawStar(ctx, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + rr * Math.cos(a), py = cy + rr * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd319';
  ctx.strokeStyle = '#12081c';
  ctx.lineWidth = Math.max(2, r * 0.14);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Film grain + vignette over the whole cover. */
function paintEffects(ctx, state, w, h) {
  if (state.grain) {
    const rnd = seededRandom(20261119);
    ctx.save();
    ctx.globalAlpha = 0.13;
    for (let i = 0; i < w * h / 700; i++) {
      const v = rnd() > 0.5 ? 255 : 0;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
    }
    ctx.restore();
  }
  if (state.vignette) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(10,4,20,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
}

/**
 * Draw the whole cover onto `canvas` at its own size.
 * state: { layout, grade, title, subtitle, badge, heat, grain, vignette,
 *          halftone, stacked, tracking, panels: [{photo, zoom, ox, oy}] }
 * photos: array of HTMLImageElement (or null) indexed by panel.photo.
 */
export function drawCoverArt(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  // Backdrop: the painted sunset sky itself — sun, palms and all — so the
  // gaps between slashed panels read as sky, never as a flat colour.
  paintSky(ctx, 0, 0, w, h, grade, 20261119);
  ctx.fillStyle = 'rgba(14,6,24,0.18)';
  ctx.fillRect(0, 0, w, h);

  const rects = layoutPanels(state.layout || 'hero3', w, h);
  const panels = state.panels || [];
  rects.forEach((rect, i) => {
    const cfg = panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    paintPanel(ctx, rect, photos[cfg.photo] ?? null, cfg, grade);
  });

  // The title band sits over the foot of the cover, overlapping the panels.
  paintTitle(ctx, state, w, h, grade);
  paintChrome(ctx, state, w, h);
  paintEffects(ctx, state, w, h);
  // Outer ink frame.
  ctx.strokeStyle = '#12081c';
  ctx.lineWidth = Math.max(4, Math.min(w, h) * 0.008);
  ctx.strokeRect(0, 0, w, h);
  return rects;
}
