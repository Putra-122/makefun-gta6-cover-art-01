// Neon Coast Cover Studio — cover engine.
// Canvas 2D, system fonts only (no font files: "Arial Black" / DejaVu stack).
// A cover is: a photo arrangement (layout) + a grade wash + poster lettering.
// Every draw is deterministic for a given seed.

export const TITLE_FONT = '"Arial Black", "DejaVu Sans", "Liberation Sans", Arial, sans-serif';
export const BODY_FONT = '"DejaVu Sans", "Liberation Sans", Arial, sans-serif';

// Five neon-sunset grades. sky: [top, mid, horizon]; wash: tint over photos;
// sun: the disc colour; accent: subtitle glow; band: title-band background.
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    sky: ['#2b1055', '#7597de', '#ff7e5f'],
    wash: 'rgba(255, 126, 95, 0.16)',
    sun: '#ffe9a8',
    accent: '#ffd166',
    band: '#1b1035',
  },
  neon: {
    label: 'Neon Night',
    sky: ['#0b0221', '#3b0f6e', '#ff2e88'],
    wash: 'rgba(255, 46, 136, 0.18)',
    sun: '#ff9de2',
    accent: '#22e6ff',
    band: '#12042b',
  },
  palm: {
    label: 'Palm Heat',
    sky: ['#3a1c00', '#c96f2e', '#ffb347'],
    wash: 'rgba(255, 179, 71, 0.15)',
    sun: '#fff3c4',
    accent: '#ff5e3a',
    band: '#2a1503',
  },
  ocean: {
    label: 'Ocean Drive',
    sky: ['#062a3a', '#0e7c86', '#7fe7d2'],
    wash: 'rgba(127, 231, 210, 0.14)',
    sun: '#eafcff',
    accent: '#ffd166',
    band: '#04222e',
  },
  noir: {
    label: 'Mono Noir',
    sky: ['#0a0a0a', '#3d3d3d', '#8a8a8a'],
    wash: 'rgba(255, 255, 255, 0.08)',
    sun: '#f5f5f5',
    accent: '#ffffff',
    band: '#000000',
  },
};

export const LAYOUTS = {
  grid: 'Grid 2×2',
  hero: 'Hero',
  bleed: 'Full bleed',
  tilt: 'Tilt polaroid',
};

// Deterministic RNG (mulberry32) so a seed always paints the same scene.
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Procedural Vice City sunset: sky, glowing sun, skyline, palms, grain.
// Used for empty photo panels and as the no-photo fallback scene.
export function drawSunset(ctx, x, y, w, h, grade, seed) {
  const rand = rng(seed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  // Sun with a soft halo, sitting on the horizon line.
  const sx = x + w * (0.3 + rand() * 0.4);
  const sy = y + h * 0.58;
  const sr = Math.min(w, h) * 0.16;
  const halo = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 2.4);
  halo.addColorStop(0, grade.sun);
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = halo;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();

  // Skyline: a dark ground strip, then seeded towers rising from it,
  // each with a few lit windows. Towers stay short so the sky and sun read.
  const base = y + h * 0.74;
  ctx.fillStyle = 'rgba(16, 6, 32, 0.95)';
  ctx.fillRect(x, base, w, y + h - base);
  let bx = x;
  ctx.fillStyle = 'rgba(20, 8, 40, 0.92)';
  while (bx < x + w) {
    const bw = w * (0.06 + rand() * 0.1);
    const bh = h * (0.08 + rand() * 0.17);
    ctx.fillRect(bx, base - bh, bw, bh);
    ctx.fillStyle = 'rgba(255, 214, 130, 0.85)';
    for (let k = 0; k < 4; k++) {
      if (rand() < 0.5) ctx.fillRect(bx + bw * (0.15 + rand() * 0.6), base - bh + bh * (0.15 + rand() * 0.6), 2, 3);
    }
    ctx.fillStyle = 'rgba(20, 8, 40, 0.92)';
    bx += bw + w * 0.015;
  }

  // Palms: curved trunk + five drooping fronds, two or three of them.
  const palms = 2 + Math.floor(rand() * 2);
  for (let p = 0; p < palms; p++) {
    const px = x + w * (0.08 + rand() * 0.84);
    const py = y + h * 0.98;
    const ph = h * (0.2 + rand() * 0.14);
    ctx.strokeStyle = 'rgba(12, 5, 24, 0.95)';
    ctx.lineWidth = Math.max(3, w * 0.008);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + w * 0.02, py - ph * 0.6, px - w * 0.01, py - ph);
    ctx.stroke();
    const tx = px - w * 0.01, ty = py - ph;
    ctx.lineWidth = Math.max(2, w * 0.005);
    for (let f = 0; f < 5; f++) {
      const ang = Math.PI * (0.15 + f * 0.18);
      const len = w * (0.09 + rand() * 0.05);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(
        tx + Math.cos(ang) * len * 0.6, ty - Math.sin(ang) * len * 0.5 - h * 0.03,
        tx + Math.cos(ang) * len, ty + Math.sin(ang) * len * 0.35,
      );
      ctx.stroke();
    }
  }

  // Seeded grain so flat areas never look banded.
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let g = 0; g < 240; g++) {
    ctx.fillRect(x + rand() * w, y + rand() * h, 1.4, 1.4);
  }
  ctx.restore();
}

// Cover-fit an image into a rect, with per-panel zoom and pan (fractions).
function drawPhoto(ctx, photo, x, y, w, h) {
  if (!photo || !photo.img || !photo.img.naturalWidth) return false;
  const img = photo.img;
  const zoom = photo.zoom || 1;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = x + (w - dw) / 2 + (photo.dx || 0) * w;
  const dy = y + (h - dh) / 2 + (photo.dy || 0) * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
  return true;
}

// One panel: photo if present, else the procedural sunset. Then the grade wash.
function panel(ctx, photo, x, y, w, h, grade, seed) {
  const painted = drawPhoto(ctx, photo, x, y, w, h);
  if (!painted) drawSunset(ctx, x, y, w, h, grade, seed);
  ctx.fillStyle = grade.wash;
  ctx.fillRect(x, y, w, h);
}

// Halftone dot strip that separates the artwork from the title band.
function halftone(ctx, x, y, w, grade) {
  ctx.fillStyle = grade.accent;
  const step = 26;
  for (let i = 0; i * step < w; i++) {
    const r = 4 + ((i * 7) % 3) * 2;
    ctx.beginPath();
    ctx.arc(x + i * step + step / 2, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Poster lettering: big outlined title + glowing subtitle, subtitle zone reserved.
function lettering(ctx, title, subtitle, x, y, w, h, grade) {
  ctx.save();
  ctx.fillStyle = grade.band;
  ctx.fillRect(x, y, w, h);
  halftone(ctx, x, y + 4, w, grade);

  const text = (title || 'UNTITLED').toUpperCase();
  let size = Math.min(h * 0.42, (w * 1.9) / Math.max(text.length, 4));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Shrink until the title fits the band.
  for (;;) {
    ctx.font = `900 ${size}px ${TITLE_FONT}`;
    if (ctx.measureText(text).width <= w * 0.94 || size <= 18) break;
    size *= 0.92;
  }
  const titleY = y + h * 0.42;
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(text, x + w / 2, titleY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x + w / 2, titleY);

  if (subtitle) {
    ctx.font = `700 ${Math.max(14, h * 0.2)}px ${BODY_FONT}`;
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = 18;
    ctx.fillStyle = grade.accent;
    ctx.fillText(subtitle.toUpperCase(), x + w / 2, y + h * 0.8);
  }
  ctx.restore();
}

// Layout painters. Each gets the full canvas and the band height.
const painters = {
  grid(ctx, W, H, photos, grade, seed, bandH) {
    const artH = H - bandH, gap = 8;
    const pw = (W - gap) / 2, ph = (artH - gap) / 2;
    panel(ctx, photos[0], 0, 0, pw, ph, grade, seed + 1);
    panel(ctx, photos[1], pw + gap, 0, pw, ph, grade, seed + 2);
    panel(ctx, photos[2], 0, ph + gap, pw, ph, grade, seed + 3);
    panel(ctx, photos[3], pw + gap, ph + gap, pw, ph, grade, seed + 4);
  },
  hero(ctx, W, H, photos, grade, seed, bandH) {
    const artH = H - bandH, gap = 8;
    const bigW = W * 0.62;
    panel(ctx, photos[0], 0, 0, bigW, artH, grade, seed + 1);
    const sw = W - bigW - gap, sh = (artH - gap * 2) / 3;
    panel(ctx, photos[1], bigW + gap, 0, sw, sh, grade, seed + 2);
    panel(ctx, photos[2], bigW + gap, sh + gap, sw, sh, grade, seed + 3);
    panel(ctx, photos[3], bigW + gap, (sh + gap) * 2, sw, sh, grade, seed + 4);
  },
  bleed(ctx, W, H, photos, grade, seed, bandH) {
    const artH = H - bandH;
    panel(ctx, photos[0], 0, 0, W, artH, grade, seed + 1);
    const scrim = ctx.createLinearGradient(0, artH * 0.45, 0, artH);
    scrim.addColorStop(0, 'rgba(0,0,0,0)');
    scrim.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, W, artH);
  },
  tilt(ctx, W, H, photos, grade, seed, bandH) {
    const artH = H - bandH;
    drawSunset(ctx, 0, 0, W, artH, grade, seed + 9);
    // Polaroid: white frame, photo inside, slight rotation, soft shadow.
    const pw = W * 0.72, ph = artH * 0.68;
    const px = (W - pw) / 2, py = (artH - ph) / 2 - artH * 0.02;
    ctx.save();
    ctx.translate(W / 2, artH / 2);
    ctx.rotate(-0.045);
    ctx.translate(-W / 2, -artH / 2);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#fdfdf8';
    ctx.fillRect(px - 14, py - 14, pw + 28, ph + 72);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const painted = drawPhoto(ctx, photos[0], px, py, pw, ph);
    if (!painted) drawSunset(ctx, px, py, pw, ph, grade, seed + 1);
    ctx.fillStyle = grade.wash;
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
  },
};

// Render a cover into a canvas. opts: { photos, layout, grade, title,
// subtitle, seed, width, height }. photos: array of {img, zoom, dx, dy} | null.
export function renderCover(canvas, opts) {
  const W = opts.width, H = opts.height;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[opts.grade] || GRADES.sunset;
  const bandH = Math.round(H * 0.17);
  const painter = painters[opts.layout] || painters.grid;
  painter(ctx, W, H, opts.photos || [], grade, opts.seed || 7, bandH);
  lettering(ctx, opts.title, opts.subtitle, 0, H - bandH, W, bandH, grade);
  return canvas;
}
