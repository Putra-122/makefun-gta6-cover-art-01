// Neon Coast Cover Studio — cover renderer (canvas 2D, offline, no network).
// One global: CoverArt. drawCover(canvas, state) paints a GTA-style poster
// from the state: four photo panels, a caption, a layout and a colour grade.
// Photos are drawn cover-fit with per-panel pan/zoom; panels without a photo
// fall back to a procedural Vice City sunset drawn from the state's seed.
// All randomness is seeded (mulberry32), so the same state paints the same
// bytes every time.
(function () {
  "use strict";

  // ------------------------------------------------------------------ data
  var GRADES = {
    vice: {
      name: "Vice Sunset",
      sky: ["#ff9a3d", "#ff5e7a", "#7b2fbe"],
      tint: "#ff7a45", tintAlpha: 0.16,
      glow: "#ffd166", band: "#1b1035", ink: "#ffffff",
    },
    neon: {
      name: "Neon Night",
      sky: ["#2b1055", "#7597de", "#00e5ff"],
      tint: "#7b2fbe", tintAlpha: 0.18,
      glow: "#00e5ff", band: "#0d0221", ink: "#ffffff",
    },
    palm: {
      name: "Palm Heat",
      sky: ["#ffe259", "#ffa751", "#e2543e"],
      tint: "#ffb347", tintAlpha: 0.15,
      glow: "#fff3b0", band: "#2b1608", ink: "#ffffff",
    },
    ocean: {
      name: "Ocean Drive",
      sky: ["#a8edea", "#2bb3a3", "#0b486b"],
      tint: "#2bb3a3", tintAlpha: 0.16,
      glow: "#a8edea", band: "#062a3a", ink: "#ffffff",
    },
    noir: {
      name: "Mono Noir",
      sky: ["#e8e8e8", "#8a8a8a", "#161616"],
      tint: "#000000", tintAlpha: 0.10,
      glow: "#f5f5f5", band: "#111111", ink: "#ffffff",
    },
  };

  var LAYOUTS = {
    quad: { name: "Grid 2x2" },
    hero: { name: "Hero" },
    bleed: { name: "Full bleed" },
    tilt: { name: "Tilt polaroid" },
  };

  var SIZES = {
    square: { name: "1080 x 1080", w: 1080, h: 1080 },
    portrait: { name: "1080 x 1350", w: 1080, h: 1350 },
    wide: { name: "1920 x 1080", w: 1920, h: 1080 },
  };

  // ------------------------------------------------------------- utilities
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function fitTitle(ctx, text, maxWidth, startSize, family) {
    var size = startSize;
    ctx.font = '900 ' + size + 'px ' + family;
    while (size > 24 && ctx.measureText(text).width > maxWidth) {
      size -= 4;
      ctx.font = '900 ' + size + 'px ' + family;
    }
    return size;
  }

  // ------------------------------------------------------------- geometry
  // Returns { panels: [r0..r3], band: r } for a layout. r = {x,y,w,h}.
  function layoutRects(layout, W, H) {
    var g = Math.round(W * 0.012) || 2;
    var bandH = Math.round(H * 0.20);
    var top = H - bandH;
    var panels = [];
    if (layout === "hero") {
      var lw = Math.round(W * 0.60);
      panels.push({ x: 0, y: 0, w: lw - g, h: top });
      var rw = W - lw;
      var rh = Math.floor((top - 2 * g) / 3);
      for (var i = 0; i < 3; i++) {
        panels.push({ x: lw, y: i * (rh + g), w: rw, h: rh });
      }
    } else if (layout === "bleed") {
      panels.push({ x: 0, y: 0, w: W, h: H });
      panels.push({ x: 0, y: 0, w: 0, h: 0 });
      panels.push({ x: 0, y: 0, w: 0, h: 0 });
      panels.push({ x: 0, y: 0, w: 0, h: 0 });
    } else if (layout === "tilt") {
      var pw = Math.round(W * 0.72);
      var ph = Math.round(top * 0.78);
      panels.push({ x: Math.round((W - pw) / 2), y: Math.round((top - ph) / 2), w: pw, h: ph });
      panels.push({ x: 0, y: 0, w: 0, h: 0 });
      panels.push({ x: 0, y: 0, w: 0, h: 0 });
      panels.push({ x: 0, y: 0, w: 0, h: 0 });
    } else { // quad
      var cw = Math.floor((W - g) / 2);
      var ch = Math.floor((top - g) / 2);
      panels.push({ x: 0, y: 0, w: cw, h: ch });
      panels.push({ x: cw + g, y: 0, w: W - cw - g, h: ch });
      panels.push({ x: 0, y: ch + g, w: cw, h: top - ch - g });
      panels.push({ x: cw + g, y: ch + g, w: W - cw - g, h: top - ch - g });
    }
    return { panels: panels, band: { x: 0, y: top, w: W, h: bandH } };
  }

  // ------------------------------------------------------- procedural scene
  // A Vice City sunset: gradient sky, glowing sun, skyline, palms. Seeded.
  function drawProcedural(ctx, r, grade, seed) {
    var rand = mulberry32(seed);
    var sky = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    sky.addColorStop(0, grade.sky[0]);
    sky.addColorStop(0.55, grade.sky[1]);
    sky.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // sun with halo
    var sunX = r.x + r.w * (0.3 + rand() * 0.4);
    var sunY = r.y + r.h * 0.42;
    var sunR = Math.min(r.w, r.h) * 0.13;
    var halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
    halo.addColorStop(0, "rgba(255,240,180,0.85)");
    halo.addColorStop(1, "rgba(255,240,180,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = "#fff3c4";
    ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();

    // skyline silhouettes
    var base = r.y + r.h * 0.78;
    ctx.fillStyle = "rgba(20,8,40,0.85)";
    var x = r.x;
    while (x < r.x + r.w) {
      var bw = r.w * (0.06 + rand() * 0.09);
      var bh = r.h * (0.12 + rand() * 0.22);
      ctx.fillRect(x, base - bh, bw, bh + r.h);
      // lit windows
      ctx.fillStyle = "rgba(255,214,102,0.9)";
      var wy = base - bh + 6;
      while (wy < base - 6) {
        if (rand() < 0.5) ctx.fillRect(x + 3 + rand() * (bw - 8), wy, 3, 4);
        wy += 9;
      }
      ctx.fillStyle = "rgba(20,8,40,0.85)";
      x += bw + 2;
    }
    // ground
    ctx.fillStyle = "rgba(12,4,28,0.95)";
    ctx.fillRect(r.x, base, r.w, r.y + r.h - base);

    // palms
    ctx.strokeStyle = "rgba(8,2,20,0.95)";
    ctx.lineWidth = Math.max(2, r.w * 0.006);
    for (var p = 0; p < 3; p++) {
      var px = r.x + r.w * (0.12 + p * 0.34 + rand() * 0.08);
      var py = r.y + r.h * (0.96 - rand() * 0.04);
      var ph = r.h * (0.16 + rand() * 0.10);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + 6, py - ph * 0.6, px - 4, py - ph);
      ctx.stroke();
      var tx = px - 4, ty = py - ph;
      for (var f = 0; f < 6; f++) {
        var a = -Math.PI * (0.08 + f * 0.16);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(
          tx + Math.cos(a) * ph * 0.32, ty + Math.sin(a) * ph * 0.32 - 4,
          tx + Math.cos(a) * ph * 0.55, ty + Math.sin(a) * ph * 0.55 + 10);
        ctx.stroke();
      }
    }
  }

  // ------------------------------------------------------------ photo draw
  // Draws img cover-fit into rect, with pan (0..1, 0.5 centred) and zoom.
  function drawPhoto(ctx, img, r, pan, zoom) {
    if (!img || !img.naturalWidth) return false;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var scale = Math.max(r.w / iw, r.h / ih) * (zoom || 1);
    var dw = iw * scale, dh = ih * scale;
    var px = clamp(pan && pan.x != null ? pan.x : 0.5, 0, 1);
    var py = clamp(pan && pan.y != null ? pan.y : 0.5, 0, 1);
    var dx = r.x + (r.w - dw) * px;
    var dy = r.y + (r.h - dh) * py;
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
    return true;
  }

  function gradeWash(ctx, r, grade) {
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = grade.tintAlpha;
    ctx.fillStyle = grade.tint;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    // vignette
    var vg = ctx.createRadialGradient(
      r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * 0.35,
      r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.32)");
    ctx.fillStyle = vg;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.restore();
  }

  function grain(ctx, r, seed, amount) {
    var rand = mulberry32(seed ^ 0x9e3779b9);
    var n = Math.floor((r.w * r.h) / 9000);
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    for (var i = 0; i < n; i++) {
      var v = rand();
      ctx.fillStyle = v < 0.5 ? "rgba(255,255,255," + amount + ")" : "rgba(0,0,0," + amount + ")";
      ctx.fillRect(r.x + rand() * r.w, r.y + rand() * r.h, 1.4, 1.4);
    }
    ctx.restore();
  }

  // ------------------------------------------------------------ title band
  function drawTitleBand(ctx, band, title, subtitle, grade, W) {
    ctx.save();
    // band background with halftone dots along its top edge
    ctx.fillStyle = grade.band;
    ctx.fillRect(band.x, band.y, band.w, band.h);
    var dotR = Math.max(2, band.h * 0.045);
    var gap = dotR * 3.2;
    ctx.fillStyle = grade.glow;
    for (var x = gap; x < band.w; x += gap) {
      var rr = dotR * (0.5 + 0.5 * Math.abs(Math.sin(x * 0.02)));
      ctx.beginPath();
      ctx.arc(x, band.y + dotR * 1.6, rr, 0, Math.PI * 2);
      ctx.fill();
    }
    var family = '"Noto Sans Black", "Arial Black", sans-serif';
    var pad = Math.max(16, W * 0.03);
    var maxW = band.w - pad * 2;
    var cx = band.x + band.w / 2;
    var titleText = (title || "UNTITLED").toUpperCase();
    var titleSize = fitTitle(ctx, titleText, maxW, Math.round(band.h * 0.52), family);
    // reserve a subtitle zone below the title so nothing overlaps
    var titleY = band.y + band.h * 0.44;
    var subY = band.y + band.h * 0.82;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, titleSize * 0.10);
    ctx.strokeStyle = "rgba(10,4,24,0.9)";
    ctx.strokeText(titleText, cx, titleY);
    ctx.fillStyle = grade.ink;
    ctx.fillText(titleText, cx, titleY);
    if (subtitle) {
      var subFamily = '"Noto Sans Bold", "Arial Bold", sans-serif';
      var subSize = Math.round(band.h * 0.17);
      ctx.font = "700 " + subSize + "px " + subFamily;
      ctx.shadowColor = grade.glow;
      ctx.shadowBlur = Math.round(subSize * 0.9);
      ctx.fillStyle = grade.glow;
      ctx.fillText(subtitle.toUpperCase(), cx, subY);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- render
  // state: { photos: [Image|null x4], pans: [{x,y} x4], zooms: [n x4],
  //          title, subtitle, layout, grade, seed }
  function drawCover(canvas, state) {
    var W = canvas.width, H = canvas.height;
    var ctx = canvas.getContext("2d");
    var grade = GRADES[state.grade] || GRADES.vice;
    var geo = layoutRects(state.layout || "quad", W, H);
    var seed = state.seed || 1337;

    // backdrop
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, grade.sky[0]);
    bg.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (state.layout === "tilt") {
      // tilted white polaroid frame around panel 0
      var r = geo.panels[0];
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(-0.07);
      ctx.fillStyle = "#fdfdf8";
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = Math.round(W * 0.03);
      ctx.shadowOffsetY = Math.round(W * 0.012);
      var fw = r.w + Math.round(W * 0.03);
      var fh = r.h + Math.round(H * 0.03);
      ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
      ctx.restore();
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(-0.07);
      var inner = { x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h };
      if (!drawPhoto(ctx, state.photos[0], inner, state.pans[0], state.zooms[0])) {
        drawProcedural(ctx, inner, grade, seed);
      }
      gradeWash(ctx, inner, grade);
      ctx.restore();
      grain(ctx, { x: 0, y: 0, w: W, h: H }, seed, 0.05);
      drawTitleBand(ctx, geo.band, state.title, state.subtitle, grade, W);
      return;
    }

    if (state.layout === "bleed") {
      var full = geo.panels[0];
      if (!drawPhoto(ctx, state.photos[0], full, state.pans[0], state.zooms[0])) {
        drawProcedural(ctx, full, grade, seed);
      }
      gradeWash(ctx, full, grade);
      // scrim behind the title band so the lettering stays readable
      var scrim = ctx.createLinearGradient(0, geo.band.y - H * 0.12, 0, H);
      scrim.addColorStop(0, "rgba(8,2,20,0)");
      scrim.addColorStop(1, "rgba(8,2,20,0.85)");
      ctx.fillStyle = scrim;
      ctx.fillRect(0, geo.band.y - H * 0.12, W, H - geo.band.y + H * 0.12);
      grain(ctx, { x: 0, y: 0, w: W, h: H }, seed, 0.05);
      drawTitleBand(ctx, geo.band, state.title, state.subtitle, grade, W);
      return;
    }

    for (var i = 0; i < 4; i++) {
      var pr = geo.panels[i];
      if (!pr.w || !pr.h) continue;
      ctx.save();
      ctx.beginPath(); ctx.rect(pr.x, pr.y, pr.w, pr.h); ctx.clip();
      if (!drawPhoto(ctx, state.photos[i], pr, state.pans[i], state.zooms[i])) {
        drawProcedural(ctx, pr, grade, seed + i * 101);
      }
      ctx.restore();
      gradeWash(ctx, pr, grade);
      // thin frame between panels
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = Math.max(1, W * 0.002);
      ctx.strokeRect(pr.x + 0.5, pr.y + 0.5, pr.w - 1, pr.h - 1);
    }
    grain(ctx, { x: 0, y: 0, w: W, h: geo.band.y }, seed, 0.045);
    drawTitleBand(ctx, geo.band, state.title, state.subtitle, grade, W);
  }

  window.CoverArt = {
    GRADES: GRADES,
    LAYOUTS: LAYOUTS,
    SIZES: SIZES,
    drawCover: drawCover,
    layoutRects: layoutRects,
    drawProcedural: drawProcedural,
  };
})();
