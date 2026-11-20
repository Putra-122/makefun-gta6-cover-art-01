// Neon Coast cover engine — vanilla 2D canvas, no network, no libraries.
// Renders a GTA-style poster cover from one photo + caption + subtitle.
// Layouts: grid (2x2), hero (big + three), bleed (full-bleed), tilt (polaroid).
// Grades: sunset, neon, palm, drive, noir. All drawing is deterministic
// for a given seed (grain + halftone use a seeded PRNG).

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image: ' + src));
    img.src = src;
  });
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    sky: ['#ff9a3d', '#ff2e88', '#7b2ff7'],
    wash: 'rgba(255, 122, 61, 0.20)',
    shadow: 'rgba(90, 20, 120, 0.28)',
    glow: '#ffb347',
    saturate: 1.35, contrast: 1.08,
  },
  neon: {
    label: 'Neon Night',
    sky: ['#ff2e88', '#7b2ff7', '#0a1030'],
    wash: 'rgba(255, 46, 136, 0.18)',
    shadow: 'rgba(10, 16, 48, 0.34)',
    glow: '#22e6ff',
    saturate: 1.45, contrast: 1.12,
  },
  palm: {
    label: 'Palm Heat',
    sky: ['#ffe259', '#ffa751', '#0e7c66'],
    wash: 'rgba(255, 210, 89, 0.16)',
    shadow: 'rgba(14, 124, 102, 0.30)',
    glow: '#7dffb0',
    saturate: 1.3, contrast: 1.06,
  },
  drive: {
    label: 'Ocean Drive',
    sky: ['#c86bfa', '#5b2ee5', '#0b1e4b'],
    wash: 'rgba(120, 80, 255, 0.20)',
    shadow: 'rgba(11, 30, 75, 0.32)',
    glow: '#c86bfa',
    saturate: 1.35, contrast: 1.1,
  },
  noir: {
    label: 'Mono Noir',
    sky: ['#e8e8e8', '#8a8a8a', '#111111'],
    wash: 'rgba(255, 255, 255, 0.06)',
    shadow: 'rgba(0, 0, 0, 0.30)',
    glow: '#ffffff',
    saturate: 0, contrast: 1.28,
  },
};

function coverFit(ctx, img, x, y, w, h, fx, fy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale, sh = h / scale;
  const sx = Math.min(Math.max((fx * iw) - sw / 2, 0), iw - sw);
  const sy = Math.min(Math.max((fy * ih) - sh / 2, 0), ih - sh);
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawPhotoOrScene(ctx, img, x, y, w, h, fx, fy, grade, rng) {
  if (img) {
    ctx.save();
    ctx.filter = `saturate(${grade.saturate}) contrast(${grade.contrast})`;
    coverFit(ctx, img, x, y, w, h, fx, fy);
    ctx.restore();
  } else {
    drawScene(ctx, x, y, w, h, grade, rng);
  }
}

// Procedural sunset scene used when no photo is loaded yet.
function drawScene(ctx, x, y, w, h, grade, rng) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  grade.sky.forEach((c, i) => g.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // Sun.
  const sunR = Math.min(w, h) * 0.16;
  const sunX = x + w * 0.68, sunY = y + h * 0.42;
  const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.2);
  sg.addColorStop(0, 'rgba(255, 244, 200, 0.95)');
  sg.addColorStop(0.45, 'rgba(255, 200, 120, 0.55)');
  sg.addColorStop(1, 'rgba(255, 200, 120, 0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Skyline.
  ctx.fillStyle = 'rgba(20, 8, 32, 0.85)';
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.08 + rng() * 0.1);
    const bh = h * (0.14 + rng() * 0.2);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    bx += bw + w * 0.015;
  }
  // Palm silhouettes (simple fronds).
  ctx.strokeStyle = 'rgba(12, 5, 20, 0.9)';
  ctx.lineWidth = Math.max(2, w * 0.008);
  ctx.lineCap = 'round';
  for (const px of [x + w * 0.14, x + w * 0.88]) {
    const py = y + h * 0.92;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + w * 0.02, y + h * 0.62, px - w * 0.03, y + h * 0.52);
    ctx.stroke();
    for (let f = 0; f < 6; f++) {
      const a = (-0.3 - f * 0.32) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(px - w * 0.03, y + h * 0.52);
      ctx.quadraticCurveTo(
        px - w * 0.03 + Math.cos(a) * w * 0.09, y + h * 0.52 + Math.sin(a) * w * 0.05,
        px - w * 0.03 + Math.cos(a) * w * 0.16, y + h * 0.52 + Math.sin(a) * w * 0.13,
      );
      ctx.stroke();
    }
  }
}

function applyGrade(ctx, w, h, grade, rng) {
  // Warm wash + shadow tint.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = grade.shadow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // Vignette.
  const v = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  // Grain (seeded, deterministic).
  const n = Math.floor((w * h) / 900);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = 0.03 + rng() * 0.06;
    ctx.fillStyle = rng() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    const s = 1 + rng() * 2.2;
    ctx.fillRect(rng() * w, rng() * h, s, s);
  }
  ctx.restore();
}

function halftone(ctx, x, y, w, h, color, rng) {
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(7, w * 0.014);
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    const row = Math.round((yy - y) / step);
    for (let xx = x + step / 2 + (row % 2 ? step / 2 : 0); xx < x + w; xx += step) {
      const r = step * (0.16 + rng() * 0.22);
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function fitLines(ctx, text, maxWidth, maxSize, fontFamily) {
  const words = String(text || '').toUpperCase().split(/\s+/).filter(Boolean);
  let size = maxSize;
  let lines = [];
  while (size > 18) {
    ctx.font = `900 ${size}px ${fontFamily}`;
    lines = [];
    let cur = '';
    for (const word of words) {
      const trial = cur ? cur + ' ' + word : word;
      if (ctx.measureText(trial).width <= maxWidth || !cur) cur = trial;
      else { lines.push(cur); cur = word; }
    }
    if (cur) lines.push(cur);
    if (lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= maxWidth)) break;
    size = Math.floor(size * 0.88);
  }
  return { lines, size };
}

function drawTitle(ctx, w, h, caption, subtitle, grade, band, rng) {
  const { x, y, w: bw, h: bh } = band;
  // Band background: dark gradient + halftone strip on top.
  const bg = ctx.createLinearGradient(x, y, x, y + bh);
  bg.addColorStop(0, 'rgba(10, 4, 22, 0.92)');
  bg.addColorStop(1, 'rgba(10, 4, 22, 0.78)');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, bw, bh);
  halftone(ctx, x, y, bw, Math.max(10, bh * 0.12), grade.glow, rng);
  ctx.fillStyle = grade.glow;
  ctx.fillRect(x, y + Math.max(10, bh * 0.12), bw, Math.max(2, bh * 0.012));

  const pad = bw * 0.05;
  const fam = '"PosterBlack", "Noto Sans", sans-serif';
  // Reserve a zone for the subtitle so it can never overlap the title.
  const subSize = subtitle ? Math.max(16, Math.min(bh * 0.16, bw * 0.032)) : 0;
  const titleAreaH = subtitle ? bh - subSize * 2.6 : bh;
  const { lines, size } = fitLines(ctx, caption, bw - pad * 2, Math.min(titleAreaH * 0.48, bw * 0.14), fam);
  const lineH = size * 1.04;
  const totalH = lineH * lines.length;
  let ty = y + (titleAreaH - totalH) / 2;
  ctx.save();
  ctx.translate(x + bw / 2, ty);
  ctx.rotate(-0.02);
  ctx.translate(-(x + bw / 2), -ty);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px ${fam}`;
  ctx.lineJoin = 'round';
  lines.forEach((line, i) => {
    const ly = ty + lineH * (i + 0.5);
    ctx.lineWidth = Math.max(3, size * 0.14);
    ctx.strokeStyle = 'rgba(8, 2, 16, 0.95)';
    ctx.strokeText(line, x + bw / 2, ly);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, x + bw / 2, ly);
  });
  ctx.restore();
  if (subtitle) {
    ctx.save();
    ctx.font = `italic 700 ${subSize}px "PosterBold", "Noto Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = subSize * 0.9;
    ctx.fillStyle = grade.glow;
    ctx.fillText(String(subtitle).toLowerCase(), x + bw / 2, y + bh - subSize * 1.15);
    ctx.restore();
  }
}

function panelBorders(ctx, panels, w) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(3, w * 0.004);
  for (const p of panels) ctx.strokeRect(p.x, p.y, p.w, p.h);
  ctx.restore();
}

export function renderCover(canvas, opts) {
  const { img = null, caption = 'SUNSET HEIST', subtitle = 'welcome to vice city',
    layout = 'grid', grade: gradeName = 'sunset', seed = 20261120 } = opts;
  const grade = GRADES[gradeName] || GRADES.sunset;
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext('2d');
  const rng = mulberry32(seed);
  const gutter = Math.max(4, Math.round(w * 0.008));
  const wide = w > h * 1.15;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0d0714';
  ctx.fillRect(0, 0, w, h);

  if (layout === 'grid') {
    const bandH = Math.round(h * 0.30);
    const ph = h - bandH - gutter;
    const pw = (w - gutter) / 2;
    const panels = [
      { x: 0, y: 0, w: pw, h: ph / 2 - gutter / 2, fx: 0.3, fy: 0.3 },
      { x: pw + gutter, y: 0, w: pw, h: ph / 2 - gutter / 2, fx: 0.7, fy: 0.3 },
      { x: 0, y: ph / 2 + gutter / 2, w: pw, h: ph / 2 - gutter / 2, fx: 0.3, fy: 0.7 },
      { x: pw + gutter, y: ph / 2 + gutter / 2, w: pw, h: ph / 2 - gutter / 2, fx: 0.7, fy: 0.7 },
    ];
    for (const p of panels) drawPhotoOrScene(ctx, img, p.x, p.y, p.w, p.h, p.fx, p.fy, grade, rng);
    panelBorders(ctx, panels, w);
    applyGrade(ctx, w, h, grade, rng);
    drawTitle(ctx, w, h, caption, subtitle, grade, { x: 0, y: h - bandH, w, h: bandH }, rng);
  } else if (layout === 'hero') {
    const bandH = Math.round(h * 0.26);
    let hero, small;
    if (wide) {
      hero = { x: 0, y: 0, w, h: Math.round(h * 0.62), fx: 0.5, fy: 0.4 };
      const sw = (w - gutter * 2) / 3, sy = hero.h + gutter, sh = h - hero.h - gutter - bandH;
      small = [0, 1, 2].map((i) => ({ x: i * (sw + gutter), y: sy, w: sw, h: sh, fx: 0.25 + i * 0.25, fy: 0.6 }));
    } else {
      hero = { x: 0, y: 0, w: Math.round(w * 0.62), h: h - bandH, fx: 0.4, fy: 0.5 };
      const sx = hero.w + gutter, sw = w - hero.w - gutter, sh = (h - bandH - gutter * 2) / 3;
      small = [0, 1, 2].map((i) => ({ x: sx, y: i * (sh + gutter), w: sw, h: sh, fx: 0.6, fy: 0.25 + i * 0.25 }));
    }
    drawPhotoOrScene(ctx, img, hero.x, hero.y, hero.w, hero.h, hero.fx, hero.fy, grade, rng);
    for (const p of small) drawPhotoOrScene(ctx, img, p.x, p.y, p.w, p.h, p.fx, p.fy, grade, rng);
    panelBorders(ctx, [hero, ...small], w);
    applyGrade(ctx, w, h, grade, rng);
    drawTitle(ctx, w, h, caption, subtitle, grade, { x: 0, y: h - bandH, w, h: bandH }, rng);
  } else if (layout === 'bleed') {
    drawPhotoOrScene(ctx, img, 0, 0, w, h, 0.5, 0.45, grade, rng);
    const scrim = ctx.createLinearGradient(0, h * 0.45, 0, h);
    scrim.addColorStop(0, 'rgba(8,2,16,0)');
    scrim.addColorStop(1, 'rgba(8,2,16,0.88)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, h);
    applyGrade(ctx, w, h, grade, rng);
    const bandH = Math.round(h * 0.34);
    const pad = w * 0.05;
    const fam = '"PosterBlack", "Noto Sans", sans-serif';
    const { lines, size } = fitLines(ctx, caption, w - pad * 2, Math.min(bandH * 0.5, w * 0.13), fam);
    const lineH = size * 1.04;
    let ty = h - bandH + (bandH - lineH * lines.length) / 2 + size * 0.1;
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${size}px ${fam}`;
    ctx.lineJoin = 'round';
    lines.forEach((line, i) => {
      const ly = ty + lineH * (i + 0.5);
      ctx.lineWidth = Math.max(3, size * 0.14);
      ctx.strokeStyle = 'rgba(8, 2, 16, 0.95)';
      ctx.strokeText(line, pad, ly);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, pad, ly);
    });
    ctx.restore();
    if (subtitle) {
      const subSize = Math.max(16, Math.min(bandH * 0.15, w * 0.03));
      ctx.save();
      ctx.font = `italic 700 ${subSize}px "PosterBold", "Noto Sans", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = grade.glow;
      ctx.shadowBlur = subSize * 0.9;
      ctx.fillStyle = grade.glow;
      ctx.fillText(String(subtitle).toLowerCase(), pad, h - subSize * 1.3);
      ctx.restore();
    }
  } else { // tilt
    const g = ctx.createLinearGradient(0, 0, w, h);
    grade.sky.forEach((c, i) => g.addColorStop(i / (grade.sky.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Soft light blobs.
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = grade.glow;
    ctx.beginPath(); ctx.arc(w * 0.85, h * 0.12, Math.min(w, h) * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.1, h * 0.85, Math.min(w, h) * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Vertically center the whole composition (title + card + subtitle).
    const cardW = Math.min(w * 0.86, (h * 0.60) * (wide ? 1.4 : 0.9));
    const cardH = cardW * (wide ? 0.62 : 0.78);
    const border = Math.max(8, w * 0.012);
    const fam = '"PosterBlack", "Noto Sans", sans-serif';
    const { lines, size } = fitLines(ctx, caption, w * 0.9, Math.min(h * 0.07, w * 0.09), fam);
    const lineH = size * 1.04;
    const subSize = subtitle ? Math.max(16, Math.min(h * 0.028, w * 0.028)) : 0;
    const totalH = lineH * lines.length + h * 0.03 + cardH + border * 2 + (subtitle ? subSize * 3 : 0);
    let cy = Math.max(h * 0.02, (h - totalH) / 2 + lineH * lines.length + h * 0.03);
    const cx = (w - cardW) / 2;
    ctx.save();
    ctx.translate(w / 2, cy + cardH / 2);
    ctx.rotate(-0.06);
    ctx.translate(-w / 2, -(cy + cardH / 2));
    ctx.fillStyle = '#fdf8ef';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    ctx.fillRect(cx - border, cy - border, cardW + border * 2, cardH + border * 2);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    drawPhotoOrScene(ctx, img, cx, cy, cardW, cardH, 0.5, 0.45, grade, rng);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, cy, cardW, cardH);
    ctx.restore();
    applyGrade(ctx, w, h, grade, rng);
    // Title above the card.
    const topY = Math.max(h * 0.02, (h - totalH) / 2 + size * 0.3);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${size}px ${fam}`;
    ctx.lineJoin = 'round';
    lines.forEach((line, i) => {
      const ly = topY + lineH * i;
      ctx.lineWidth = Math.max(3, size * 0.14);
      ctx.strokeStyle = 'rgba(8, 2, 16, 0.9)';
      ctx.strokeText(line, w / 2, ly);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, w / 2, ly);
    });
    ctx.restore();
    if (subtitle) {
      const subSize = Math.max(16, Math.min(h * 0.028, w * 0.028));
      ctx.save();
      ctx.font = `italic 700 ${subSize}px "PosterBold", "Noto Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = grade.glow;
      ctx.shadowBlur = subSize;
      ctx.fillStyle = grade.glow;
      ctx.fillText(String(subtitle).toLowerCase(), w / 2, cy + cardH + border + subSize * 2.2);
      ctx.restore();
    }
  }
}
