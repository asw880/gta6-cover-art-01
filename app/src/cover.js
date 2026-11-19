// Vice City Cover Studio — render engine (v5).
// Paints a GTA-style multi-panel poster onto any canvas. Pure canvas, no
// network, no libraries. Deterministic: grain uses a fixed-seed PRNG, so the
// same design always paints the same pixels.

export const TONES = {
  sunset: {
    name: 'Sunset', skyTop: '#2b1055', skyMid: '#b83a5e', skyLow: '#ff8c42',
    horizon: '#ffd166', sun: '#ffd166', sunCore: '#fff3b0', titleTop: '#ffe259',
    titleBottom: '#ff7e5f', band: '#1d1033', ink: '#14082b', accent: '#ff2e63',
    badge: '#ff2e63', star: '#ffd166', frame: '#14082b', caption: '#ffe9f3',
  },
  neon: {
    name: 'Neon Night', skyTop: '#0b0620', skyMid: '#3b1d7a', skyLow: '#7b2fbe',
    horizon: '#00e5ff', sun: '#ff5ce1', sunCore: '#b6f6ff', titleTop: '#8ef7ff',
    titleBottom: '#ff5ce1', band: '#0d0722', ink: '#060214', accent: '#00e5ff',
    badge: '#00b8d4', star: '#8ef7ff', frame: '#060214', caption: '#d8f6ff',
  },
  vice: {
    name: 'Vice Pink', skyTop: '#3d0c4f', skyMid: '#a4133c', skyLow: '#ff4d6d',
    horizon: '#ffb3c1', sun: '#ff8fa3', sunCore: '#fff0f3', titleTop: '#ffc2d1',
    titleBottom: '#ff4d6d', band: '#2b0a3d', ink: '#1c0533', accent: '#ff4d6d',
    badge: '#ff4d6d', star: '#ffc2d1', frame: '#1c0533', caption: '#ffe5ec',
  },
  teal: {
    name: 'Teal Dusk', skyTop: '#06222b', skyMid: '#0f5e6e', skyLow: '#f4a261',
    horizon: '#f4d35e', sun: '#f4d35e', sunCore: '#fff8d6', titleTop: '#f4d35e',
    titleBottom: '#2a9d8f', band: '#082530', ink: '#04141c', accent: '#2a9d8f',
    badge: '#2a9d8f', star: '#f4d35e', frame: '#04141c', caption: '#e0fbfc',
  },
  mono: {
    name: 'Mono Noir', skyTop: '#111111', skyMid: '#3a3a3a', skyLow: '#8a8a8a',
    horizon: '#e8e8e8', sun: '#f2f2f2', sunCore: '#ffffff', titleTop: '#ffffff',
    titleBottom: '#9a9a9a', band: '#0a0a0a', ink: '#000000', accent: '#e8e8e8',
    badge: '#e8e8e8', star: '#ffffff', frame: '#000000', caption: '#f2f2f2',
  },
};

export const COMPOSITIONS = {
  slash: {
    name: 'Slash Key Art', titleFrac: 0.30,
    panels(W, H, photoH) {
      const slant = photoH * 0.07;
      const cuts = [0, 0.42, 0.72, 1.0];
      const out = [];
      for (let i = 0; i < 3; i += 1) {
        out.push({
          x: cuts[i] * W, y: 0, w: (cuts[i + 1] - cuts[i]) * W, h: photoH,
          photo: i === 2 ? null : i, slant, sky: i === 2, rot: 0,
        });
      }
      return out;
    },
  },
  hero3: {
    name: 'Hero + 3', titleFrac: 0.30,
    panels(W, H, photoH) {
      const heroH = photoH * 0.58;
      const out = [{ x: 0, y: 0, w: W, h: heroH, photo: 0, slant: 0, sky: false, rot: 0 }];
      for (let i = 0; i < 3; i += 1) {
        out.push({
          x: (i * W) / 3, y: heroH, w: W / 3, h: photoH - heroH,
          photo: (i + 1) % 3, slant: 0, sky: false, rot: 0,
        });
      }
      return out;
    },
  },
  grid4: {
    name: '4-Panel Grid', titleFrac: 0.28,
    panels(W, H, photoH) {
      const out = [];
      for (let r = 0; r < 2; r += 1) {
        for (let c = 0; c < 2; c += 1) {
          out.push({
            x: (c * W) / 2, y: (r * photoH) / 2, w: W / 2, h: photoH / 2,
            photo: (r * 2 + c) % 3, slant: 0, sky: false, rot: 0,
          });
        }
      }
      return out;
    },
  },
  grid9: {
    name: '9-Panel Grid', titleFrac: 0.24,
    panels(W, H, photoH) {
      const out = [];
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          out.push({
            x: (c * W) / 3, y: (r * photoH) / 3, w: W / 3, h: photoH / 3,
            photo: (r * 3 + c) % 3, slant: 0, sky: false, rot: 0,
          });
        }
      }
      return out;
    },
  },
  bleed: {
    name: 'Full Bleed', titleFrac: 0,
    panels(W, H) {
      return [{ x: 0, y: 0, w: W, h: H, photo: 0, slant: 0, sky: false, rot: 0 }];
    },
  },
  tilt: {
    name: 'Tilted Collage', titleFrac: 0.30,
    panels(W, H, photoH) {
      return [
        { x: W * 0.02, y: photoH * 0.02, w: W * 0.52, h: photoH * 0.62, photo: 0, slant: 0, sky: false, rot: -0.07 },
        { x: W * 0.50, y: photoH * 0.04, w: W * 0.48, h: photoH * 0.60, photo: 1, slant: 0, sky: false, rot: 0.05 },
        { x: W * 0.18, y: photoH * 0.52, w: W * 0.64, h: photoH * 0.48, photo: 2, slant: 0, sky: false, rot: -0.025 },
      ];
    },
  },
};

export const SIGNATURES = {
  keyart: { name: 'Key Art', composition: 'slash', tone: 'sunset', stacked: true, tracking: 2 },
  neon: { name: 'Neon Night', composition: 'hero3', tone: 'neon', stacked: true, tracking: 3 },
  strip: { name: 'Sunset Strip', composition: 'tilt', tone: 'vice', stacked: true, tracking: 2 },
};

export function framesFor(compositionId, W, H) {
  const comp = COMPOSITIONS[compositionId] ?? COMPOSITIONS.slash;
  const titleH = Math.round(H * comp.titleFrac);
  const photoH = H - titleH;
  return { panels: comp.panels(W, H, photoH), titleH, photoH };
}

export function defaultDesign() {
  return {
    signature: 'keyart', composition: 'slash', tone: 'sunset',
    headline: 'VICE CITY', caption: 'one last sunset heist', sticker: 'VICE CITY',
    stars: 4, stacked: true, tracking: 2, grain: 0.05, vignette: true,
    size: [1280, 720], active: 0,
    pictures: [],
    frames: [],
  };
}

// Seeded PRNG so grain (and any jitter) is identical on every paint.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slattedSun(ctx, cx, cy, r, tone) {
  const bars = 8;
  const gap = r / 9;
  const barH = (r * 2 - gap * (bars - 1)) / bars;
  for (let i = 0; i < bars; i += 1) {
    const y = cy - r + i * (barH + gap);
    const dy = y + barH / 2 - cy;
    const half = Math.sqrt(Math.max(0, r * r - dy * dy));
    const t = i / Math.max(1, bars - 1);
    ctx.fillStyle = t < 0.5 ? tone.sunCore : tone.sun;
    ctx.fillRect(cx - half, y, half * 2, barH);
  }
}

function palmTree(ctx, x, baseY, s, color) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  // Trunk: a gently curving tapered quad.
  ctx.beginPath();
  ctx.moveTo(-s * 0.03, 0);
  ctx.quadraticCurveTo(-s * 0.10, -s * 0.55, -s * 0.02, -s * 0.95);
  ctx.lineTo(s * 0.05, -s * 0.95);
  ctx.quadraticCurveTo(s * 0.02, -s * 0.5, s * 0.06, 0);
  ctx.closePath();
  ctx.fill();
  // Fronds: seven arcs fanning out of the crown.
  const crownY = -s * 0.95;
  ctx.lineWidth = Math.max(1.5, s * 0.035);
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i += 1) {
    const a = (-Math.PI * 0.92) + (i * Math.PI * 0.84) / 6;
    const ex = Math.cos(a) * s * 0.62;
    const ey = crownY + Math.sin(a) * s * 0.42;
    const mx = Math.cos(a) * s * 0.38;
    const my = crownY + Math.sin(a) * s * 0.30 - s * 0.12;
    ctx.beginPath();
    ctx.moveTo(0, crownY);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function paintSky(ctx, W, H, tone, rng) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, tone.skyTop);
  sky.addColorStop(0.55, tone.skyMid);
  sky.addColorStop(0.85, tone.skyLow);
  sky.addColorStop(1, tone.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Horizon glow.
  const glow = ctx.createRadialGradient(W * 0.72, H * 0.52, 0, W * 0.72, H * 0.52, H * 0.55);
  glow.addColorStop(0, tone.horizon);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  // The retro sun lives in the backdrop, never on a face.
  slattedSun(ctx, W * 0.72, H * 0.38, Math.min(W, H) * 0.16, tone);
  // Palm silhouettes along the horizon.
  const palmColor = tone.ink;
  ctx.globalAlpha = 0.85;
  palmTree(ctx, W * 0.08, H * 0.72, H * 0.34, palmColor);
  palmTree(ctx, W * 0.94, H * 0.74, H * 0.42, palmColor);
  palmTree(ctx, W * 0.60, H * 0.70, H * 0.22, palmColor);
  ctx.globalAlpha = 1;
  void rng;
}

// Cover-fit a photo into a panel with a focus point and a pan, clamped so the
// panel is always fully covered — panning can never open a gap.
function paintPhoto(ctx, pic, rect, frame) {
  if (!pic || !pic.img) return;
  const img = pic.img;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const zoom = Math.max(1, frame?.zoom ?? 1);
  const fx = frame?.fx ?? 0.5;
  const fy = frame?.fy ?? 0.5;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const px = (frame?.panX ?? 0) * Math.max(0, (dw - rect.w) / 2);
  const py = (frame?.panY ?? 0) * Math.max(0, (dh - rect.h) / 2);
  let x = rect.x + rect.w / 2 - fx * dw + px;
  let y = rect.y + rect.h / 2 - fy * dh + py;
  x = Math.min(Math.max(x, rect.x + rect.w - dw), rect.x);
  y = Math.min(Math.max(y, rect.y + rect.h - dh), rect.y);
  ctx.drawImage(img, x, y, dw, dh);
}

function panelPath(ctx, p) {
  const s = p.slant || 0;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + p.w, p.y);
  ctx.lineTo(p.x + p.w - s, p.y + p.h);
  ctx.lineTo(p.x - s, p.y + p.h);
  ctx.closePath();
}

function fitHeadline(ctx, lines, maxW, startSize) {
  let size = startSize;
  for (let i = 0; i < 24; i += 1) {
    ctx.font = `900 ${size}px Anton, sans-serif`;
    let widest = 0;
    for (const line of lines) widest = Math.max(widest, ctx.measureText(line).width);
    if (widest <= maxW || size <= 12) return size;
    size = Math.floor(size * 0.92);
  }
  return size;
}

function paintTitle(ctx, design, W, H, titleH, photoH, tone) {
  const bleed = design.composition === 'bleed';
  const bandY = bleed ? H - titleH : photoH;
  if (!bleed) {
    ctx.fillStyle = tone.band;
    ctx.fillRect(0, bandY, W, titleH);
    ctx.fillStyle = tone.accent;
    ctx.fillRect(0, bandY, W, Math.max(2, H * 0.004));
  } else {
    const scrim = ctx.createLinearGradient(0, H - titleH, 0, H);
    scrim.addColorStop(0, 'rgba(0,0,0,0)');
    scrim.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H - titleH, W, titleH);
  }
  const words = design.headline.split(/\s+/).filter(Boolean);
  let lines;
  if (!design.stacked || words.length <= 1) {
    lines = [design.headline];
  } else if (words.length === 2) {
    lines = [words[0], words[1]];
  } else {
    const half = Math.ceil(words.length / 2);
    lines = [words.slice(0, half).join(' '), words.slice(half).join(' ')];
  }
  const maxW = W * 0.92;
  const startSize = design.stacked ? titleH * 0.34 : titleH * 0.52;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${design.tracking ?? 2}px`;
  const size = fitHeadline(ctx, lines, maxW, startSize);
  const grad = ctx.createLinearGradient(0, bandY + titleH * 0.08, 0, bandY + titleH * 0.92);
  grad.addColorStop(0, tone.titleTop);
  grad.addColorStop(1, tone.titleBottom);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineH = size * 1.04;
  const blockH = lines.length * lineH + (design.caption ? size * 0.62 : 0);
  let cy = bandY + (titleH - blockH) / 2 + lineH / 2;
  const shadow = Math.max(2, size * 0.055);
  for (const line of lines) {
    ctx.font = `900 ${size}px Anton, sans-serif`;
    ctx.fillStyle = tone.ink;
    ctx.fillText(line, W / 2 + shadow, cy + shadow);
    ctx.fillStyle = grad;
    ctx.fillText(line, W / 2, cy);
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tone.ink;
    ctx.strokeText(line, W / 2, cy);
    cy += lineH;
  }
  if (design.caption) {
    ctx.font = `${Math.max(14, size * 0.34)}px Pacifico, cursive`;
    ctx.fillStyle = tone.caption;
    ctx.fillText(design.caption, W / 2, bandY + titleH - size * 0.34);
  }
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

function paintChrome(ctx, design, W, H, photoH, tone) {
  // Badge, top-left; stars, top-right — both sit on the photo area.
  const pad = Math.max(10, W * 0.015);
  const bh = Math.max(20, H * 0.035);
  ctx.save();
  ctx.font = `900 ${Math.round(bh * 0.52)}px Anton, sans-serif`;
  const bw = ctx.measureText(design.sticker).width + bh * 1.2;
  ctx.translate(pad, pad);
  ctx.rotate(-0.02);
  ctx.fillStyle = tone.badge;
  ctx.fillRect(0, 0, bw, bh);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(design.sticker, bh * 0.6, bh / 2 + 1);
  ctx.restore();
  if (design.stars > 0) {
    ctx.font = `900 ${Math.round(bh * 0.85)}px sans-serif`;
    ctx.fillStyle = tone.star;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('★'.repeat(Math.min(4, design.stars)), W - pad, pad + bh / 2);
  }
}

function paintGrain(ctx, W, H, amount, rng) {
  if (!amount || amount <= 0) return;
  const n = Math.floor((W * H * amount) / 90);
  ctx.save();
  for (let i = 0; i < n; i += 1) {
    const v = rng();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(Math.floor(rng() * W), Math.floor(rng() * H), 1.5, 1.5);
  }
  ctx.restore();
}

function paintVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function paintCover(design, ctx, W, H) {
  const tone = TONES[design.tone] ?? TONES.sunset;
  const rng = mulberry32(1337);
  const { panels, titleH, photoH } = framesFor(design.composition, W, H);
  const bleedTitleH = design.composition === 'bleed' ? Math.round(H * 0.30) : titleH;
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  paintSky(ctx, W, H, tone, rng);
  const gap = Math.max(2, W * 0.004);
  for (let i = 0; i < panels.length; i += 1) {
    const p = panels[i];
    const frame = design.frames?.[i];
    const pic = p.photo === null || p.photo === undefined
      ? null
      : design.pictures?.[p.photo] ?? null;
    ctx.save();
    if (p.rot) {
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rot);
      ctx.translate(-p.w / 2, -p.h / 2);
      panelPath(ctx, { ...p, x: 0, y: 0 });
    } else {
      panelPath(ctx, p);
    }
    ctx.clip();
    if (pic) {
      const r = p.rot ? { x: 0, y: 0, w: p.w, h: p.h } : p;
      paintPhoto(ctx, pic, r, frame);
    }
    ctx.restore();
    // Ink frame around the panel.
    ctx.save();
    if (p.rot) {
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rot);
      ctx.translate(-p.w / 2, -p.h / 2);
      panelPath(ctx, { ...p, x: 0, y: 0 });
    } else {
      panelPath(ctx, p);
    }
    ctx.lineWidth = Math.max(2, gap * 1.4);
    ctx.strokeStyle = tone.frame;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }
  paintTitle(ctx, design, W, H, bleedTitleH, photoH, tone);
  paintChrome(ctx, design, W, H, photoH, tone);
  paintGrain(ctx, W, H, design.grain ?? 0.05, rng);
  if (design.vignette) paintVignette(ctx, W, H);
  ctx.restore();
}
