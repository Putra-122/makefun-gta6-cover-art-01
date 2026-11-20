// Neon Coast Cover Studio — canvas cover engine.
//
// Renders a GTA-poster-style cover into a <canvas>: four panel layouts,
// five colour grades, bold poster lettering, a halftone title band and
// seeded film grain. Every render with the same inputs is byte-identical:
// the grain seed is derived from the caption, layout and grade, never
// from Math.random or the clock. When no photo is supplied a procedural
// Vice City sunset scene is painted instead, so the app always has
// something to show.

export const LAYOUTS = [
  { id: 'grid', label: 'Grid 2×2', hint: 'Four panels, one photo each' },
  { id: 'hero', label: 'Hero', hint: 'One big panel, three small' },
  { id: 'bleed', label: 'Full bleed', hint: 'One photo edge to edge' },
  { id: 'tilt', label: 'Tilt polaroid', hint: 'Photo on a gradient' },
];

export const GRADES = [
  { id: 'sunset', label: 'Vice Sunset' },
  { id: 'neon', label: 'Neon Night' },
  { id: 'palm', label: 'Palm Heat' },
  { id: 'ocean', label: 'Ocean Drive' },
  { id: 'noir', label: 'Mono Noir' },
];

export const SIZES = [
  { id: 'square', label: '1080 × 1080 · square', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350 · portrait', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080 · landscape', w: 1920, h: 1080 },
];

// Per-grade look: sky colours for the procedural scene, the wash laid
// over photos, title / subtitle ink and the neon glow colour.
const GRADE_STYLE = {
  sunset: {
    sky: ['#ff9a3d', '#ff5e78', '#7b2f8b'],
    wash: ['rgba(255,110,60,0.20)', 'rgba(255,45,120,0.16)'],
    title: '#fff3d6', sub: '#ffd166', glow: '#ff7a18',
  },
  neon: {
    sky: ['#12082e', '#3b0f66', '#ff2d95'],
    wash: ['rgba(255,45,149,0.22)', 'rgba(0,229,255,0.14)'],
    title: '#ffffff', sub: '#00e5ff', glow: '#ff2d95',
  },
  palm: {
    sky: ['#f7b733', '#fc4a1a', '#2d6a4f'],
    wash: ['rgba(255,190,40,0.18)', 'rgba(20,120,70,0.16)'],
    title: '#fffbe6', sub: '#b7ff5e', glow: '#ffb703',
  },
  ocean: {
    sky: ['#0f2027', '#2c5364', '#00c9b7'],
    wash: ['rgba(0,201,183,0.16)', 'rgba(20,90,160,0.20)'],
    title: '#eafcff', sub: '#7ef0e0', glow: '#00c9b7',
  },
  noir: {
    sky: ['#e8e8e8', '#8a8a8a', '#1c1c1c'],
    wash: ['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.18)'],
    title: '#ffffff', sub: '#d8d8d8', glow: '#ffffff',
  },
};

// FNV-1a hash of a string -> uint32 seed.
export function hashSeed(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// mulberry32: small deterministic PRNG.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Draw an image covering rect (x, y, w, h), cropping the overflow.
function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// Procedural Vice City sunset: gradient sky, low sun with glow, a
// blocky skyline, palm silhouettes and a glittering sea strip.
function drawSunsetScene(ctx, x, y, w, h, seed, style) {
  const rnd = mulberry32(seed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const sky = ctx.createLinearGradient(0, y, 0, y + h * 0.72);
  sky.addColorStop(0, style.sky[0]);
  sky.addColorStop(0.55, style.sky[1]);
  sky.addColorStop(1, style.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h * 0.72);

  // Sun with halo.
  const sunR = w * 0.11;
  const sunX = x + w * (0.3 + rnd() * 0.4);
  const sunY = y + h * 0.42;
  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.6);
  halo.addColorStop(0, 'rgba(255,240,180,0.85)');
  halo.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x, y, w, h * 0.72);
  ctx.fillStyle = '#fff6c9';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Skyline.
  ctx.fillStyle = 'rgba(20,8,32,0.92)';
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.06 + rnd() * 0.1);
    const bh = h * (0.08 + rnd() * 0.2);
    ctx.fillRect(bx, y + h * 0.72 - bh, bw, bh);
    // Lit windows.
    ctx.fillStyle = 'rgba(255,214,120,0.9)';
    const floors = Math.floor(bh / (h * 0.045));
    for (let f = 0; f < floors; f++) {
      if (rnd() < 0.4) {
        ctx.fillRect(bx + bw * 0.2, y + h * 0.72 - bh + f * h * 0.045, bw * 0.14, h * 0.02);
      }
    }
    ctx.fillStyle = 'rgba(20,8,32,0.92)';
    bx += bw + w * 0.015;
  }

  // Sea with sun glitter.
  const sea = ctx.createLinearGradient(0, y + h * 0.72, 0, y + h);
  sea.addColorStop(0, style.sky[2]);
  sea.addColorStop(1, '#0a0618');
  ctx.fillStyle = sea;
  ctx.fillRect(x, y + h * 0.72, w, h * 0.28);
  ctx.fillStyle = 'rgba(255,220,140,0.5)';
  for (let i = 0; i < 26; i++) {
    const gy = y + h * 0.74 + rnd() * h * 0.22;
    const gw = w * (0.02 + rnd() * 0.09);
    ctx.fillRect(sunX - gw / 2 + (rnd() - 0.5) * w * 0.2, gy, gw, Math.max(1.5, h * 0.004));
  }

  // Two palm silhouettes at the edges.
  ctx.strokeStyle = 'rgba(12,6,20,0.95)';
  ctx.lineWidth = Math.max(3, w * 0.008);
  ctx.lineCap = 'round';
  for (const px of [x + w * 0.06, x + w * 0.94]) {
    const topY = y + h * (0.42 + rnd() * 0.1);
    ctx.beginPath();
    ctx.moveTo(px, y + h * 0.74);
    ctx.quadraticCurveTo(px + (px < x + w / 2 ? w * 0.03 : -w * 0.03), y + h * 0.6, px, topY);
    ctx.stroke();
    for (let f = 0; f < 6; f++) {
      const a = (-0.25 - f * 0.22) * Math.PI + (px < x + w / 2 ? 0 : Math.PI * 0.1);
      const fx = px + Math.cos(a) * w * 0.09;
      const fy = topY + Math.sin(a) * h * 0.045 + h * 0.02;
      ctx.beginPath();
      ctx.moveTo(px, topY);
      ctx.quadraticCurveTo(px + (fx - px) * 0.5, topY + h * 0.02, fx, fy);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Fill a panel: photo if one is given, else the procedural scene.
function fillPanel(ctx, img, x, y, w, h, seed, style, noir) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    if (noir) ctx.filter = 'grayscale(1) contrast(1.12) brightness(1.06)';
    drawCover(ctx, img, x, y, w, h);
    ctx.filter = 'none';
  } else {
    drawSunsetScene(ctx, x, y, w, h, seed, style);
  }
  ctx.restore();
}

// Lay the grade wash + vignette over the whole cover.
function applyGrade(ctx, w, h, style) {
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, style.wash[0]);
  wash.addColorStop(1, style.wash[1]);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

// Seeded film grain: a scatter of 1px specks, deterministic per seed.
function applyGrain(ctx, w, h, seed) {
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  const count = Math.floor((w * h) / 220);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.5
      ? `rgba(255,255,255,${(v - 0.5) * 0.16})`
      : `rgba(0,0,0,${(0.5 - v) * 0.2})`;
    ctx.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * h), 1, 1);
  }
  ctx.restore();
}

// Wrap the caption into at most two lines that fit maxWidth, shrinking
// the font until they do. Returns { lines, size }.
function fitCaption(ctx, caption, maxWidth, startSize) {
  const words = caption.toUpperCase().split(/\s+/).filter(Boolean);
  let size = startSize;
  while (size > 18) {
    ctx.font = `900 ${size}px "NeonCoast Black", "Arial Black", sans-serif`;
    const lines = [];
    let line = '';
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width <= maxWidth || !line) {
        line = trial;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    if (lines.length <= 2) return { lines, size };
    size = Math.floor(size * 0.88);
  }
  ctx.font = `900 ${size}px "NeonCoast Black", "Arial Black", sans-serif`;
  return { lines: [caption.toUpperCase()], size };
}

// Halftone dot strip behind the title.
function halftoneStrip(ctx, x, y, w, h, seed) {
  const rnd = mulberry32(seed ^ 0x51ed);
  const gap = Math.max(9, Math.round(w / 90));
  ctx.save();
  for (let row = 0; row * gap < h; row++) {
    for (let col = 0; col * gap < w; col++) {
      const fade = 1 - row * gap / h;
      if (rnd() < fade * 0.75) {
        ctx.fillStyle = `rgba(255,255,255,${0.10 + fade * 0.16})`;
        ctx.beginPath();
        ctx.arc(x + col * gap + gap / 2, y + row * gap + gap / 2, gap * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// Draw the title block (caption + subtitle) inside the band. The block
// is laid out top-down from a measured height — title lines first, then
// the subtitle below them — so a two-line title can never push the
// subtitle past the band's bottom edge. If the block would not fit, the
// title shrinks until it does.
function drawTitleBlock(ctx, w, bandY, bandH, caption, subtitle, style, seed) {
  const padX = w * 0.06;
  const maxW = w - padX * 2;
  const subSize = Math.max(16, Math.round(w * 0.026));
  let { lines, size } = fitCaption(ctx, caption, maxW, Math.round(w * 0.085));
  // Height fit: shrink the title until title lines + subtitle fit the band.
  while (size > 18) {
    const lineH = size * 1.06;
    const blockH = lines.length * lineH + (subtitle ? subSize * 1.55 : 0);
    if (blockH <= bandH * 0.94) break;
    size = Math.floor(size * 0.9);
    ctx.font = `900 ${size}px "NeonCoast Black", "Arial Black", sans-serif`;
    const re = fitCaption(ctx, caption, maxW, size);
    lines = re.lines;
    size = re.size;
  }
  const lineH = size * 1.06;
  const blockH = lines.length * lineH + (subtitle ? subSize * 1.55 : 0);
  const top = bandY + (bandH - blockH) / 2;
  let ty = top + size * 0.78;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = `${Math.round(size * 0.045)}px`; } catch { /* older canvas */ }
  for (const line of lines) {
    // Outline + fill for poster punch.
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = 'rgba(10,4,20,0.9)';
    ctx.lineJoin = 'round';
    ctx.strokeText(line, w / 2, ty);
    ctx.fillStyle = style.title;
    ctx.fillText(line, w / 2, ty);
    ty += lineH;
  }
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  if (subtitle) {
    ctx.font = `700 ${subSize}px "NeonCoast Bold", Arial, sans-serif`;
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = subSize * 0.9;
    ctx.fillStyle = style.sub;
    // Subtitle baseline: just below the title block, inside the band.
    ctx.fillText(subtitle.toUpperCase(), w / 2, top + lines.length * lineH + subSize * 0.87);
  }
  ctx.restore();
  return { lines, size };
}

// The main entry point. opts: { images, caption, subtitle, layout,
// grade, width, height, seed }. images is an array of up to 4
// HTMLImageElement-or-null; missing slots fall back to the scene.
export function renderCover(canvas, opts) {
  const w = opts.width;
  const h = opts.height;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const style = GRADE_STYLE[opts.grade] || GRADE_STYLE.sunset;
  const seed = opts.seed ?? hashSeed(
    `${opts.caption}|${opts.layout}|${opts.grade}|${w}x${h}`,
  );
  const imgs = opts.images || [];
  const pick = (i) => imgs[i] || imgs[0] || null;
  const noir = opts.grade === 'noir';
  const pad = Math.max(6, Math.round(w * 0.012));
  const bandH = Math.round(h * 0.20);

  // Base.
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, style.sky[0]);
  base.addColorStop(1, style.sky[2]);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const panelAreaH = h - bandH;

  if (opts.layout === 'grid') {
    const cw = (w - pad * 3) / 2;
    const ch = (panelAreaH - pad * 3) / 2;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        fillPanel(ctx, pick(r * 2 + c), pad + c * (cw + pad), pad + r * (ch + pad),
          cw, ch, seed + r * 2 + c, style, noir);
      }
    }
  } else if (opts.layout === 'hero') {
    const bigW = Math.round(w * 0.60);
    const smallX = bigW + pad;
    const smallW = w - smallX - pad;
    const smallH = (panelAreaH - pad * 4) / 3;
    fillPanel(ctx, pick(0), pad, pad, bigW - pad, panelAreaH - pad * 2,
      seed + 1, style, noir);
    for (let i = 0; i < 3; i++) {
      fillPanel(ctx, pick(i + 1), smallX, pad + i * (smallH + pad),
        smallW, smallH, seed + 2 + i, style, noir);
    }
  } else if (opts.layout === 'bleed') {
    fillPanel(ctx, pick(0), 0, 0, w, h, seed + 1, style, noir);
    const scrim = ctx.createLinearGradient(0, h * 0.35, 0, h);
    scrim.addColorStop(0, 'rgba(8,4,18,0)');
    scrim.addColorStop(1, 'rgba(8,4,18,0.88)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, h);
  } else { // tilt: polaroid on a gradient, title below, centred vertically
    const deco = ctx.createRadialGradient(w * 0.8, h * 0.1, 10, w * 0.8, h * 0.1, w * 0.7);
    deco.addColorStop(0, style.wash[0].replace(/[\d.]+\)$/, '0.55)'));
    deco.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = deco;
    ctx.fillRect(0, 0, w, h);
    const pw = Math.round(w * 0.74);
    const ph = Math.round(panelAreaH * 0.62);
    const px = Math.round((w - pw) / 2);
    const py = Math.round(panelAreaH * 0.07);
    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.rotate(-0.07);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = Math.round(w * 0.03);
    ctx.shadowOffsetY = Math.round(h * 0.012);
    ctx.fillStyle = '#fdfbf6';
    const border = Math.max(10, Math.round(w * 0.016));
    ctx.fillRect(-pw / 2 - border, -ph / 2 - border, pw + border * 2, ph + border * 2 + Math.round(h * 0.05));
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.translate(-pw / 2, -ph / 2);
    fillPanel(ctx, pick(0), 0, 0, pw, ph, seed + 1, style, noir);
    ctx.restore();
  }

  applyGrade(ctx, w, h, style);

  // Title band: dark strip + halftone dots + caption + subtitle.
  const bandY = h - bandH;
  const bandGrad = ctx.createLinearGradient(0, bandY, 0, h);
  bandGrad.addColorStop(0, 'rgba(8,4,18,0.55)');
  bandGrad.addColorStop(1, 'rgba(8,4,18,0.92)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY, w, bandH);
  halftoneStrip(ctx, 0, bandY, w, bandH, seed);
  drawTitleBlock(ctx, w, bandY, bandH, opts.caption || 'UNTITLED', opts.subtitle || '', style, seed);

  applyGrain(ctx, w, h, seed);
  return { seed, width: w, height: h };
}
