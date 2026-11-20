// Neon Coast Cover Studio — editor wiring (classic script, no modules).
// Owns the editor state, binds every control, paints the live preview and
// exports the finished cover as a PNG. Photos never leave the machine:
// uploads are read with FileReader, samples are files under app/samples/.
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var state = {
    photos: [null, null, null, null],
    pans: [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }],
    zooms: [1, 1, 1, 1],
    title: "SUNSET HEIST",
    subtitle: "Leonida Nights",
    layout: "quad",
    grade: "vice",
    size: "square",
    seed: 20261120,
    selected: 0,
  };

  var stage = null;
  var drag = null;

  // ------------------------------------------------------------ painting
  function paint() {
    if (!stage) return;
    // preview canvas follows the chosen export size, scaled by CSS
    var size = CoverArt.SIZES[state.size];
    if (stage.width !== size.w || stage.height !== size.h) {
      stage.width = size.w;
      stage.height = size.h;
    }
    CoverArt.drawCover(stage, state);
    paintThumbs();
    var line = $("sizeLine");
    if (line) {
      line.textContent = size.name + " · " + CoverArt.LAYOUTS[state.layout].name.toLowerCase() +
        " · " + CoverArt.GRADES[state.grade].name.toLowerCase();
    }
  }

  function paintThumbs() {
    for (var i = 0; i < 4; i++) {
      var thumb = $("panel-" + i);
      if (!thumb) continue;
      thumb.classList.toggle("active", state.selected === i);
      thumb.classList.toggle("empty", !state.photos[i]);
      var label = thumb.querySelector("span");
      if (label) label.style.display = state.photos[i] ? "none" : "";
      var img = thumb.querySelector("img");
      if (state.photos[i]) {
        if (!img) {
          img = document.createElement("img");
          thumb.appendChild(img);
        }
        if (img.src !== state.photos[i].src) img.src = state.photos[i].src;
      } else if (img) {
        img.remove();
      }
    }
  }

  // -------------------------------------------------------------- panels
  function loadImage(src, done) {
    var img = new Image();
    img.onload = function () { done(img); };
    img.onerror = function () { done(null); };
    img.src = src;
  }

  function fillPanel(i, src) {
    loadImage(src, function (img) {
      if (!img) { setStatus("Could not load that photo."); return; }
      state.photos[i] = img;
      state.pans[i] = { x: 0.5, y: 0.5 };
      state.zooms[i] = 1;
      state.selected = i;
      paint();
      setStatus("Panel " + (i + 1) + " filled.");
    });
  }

  function pickSample(name) {
    fillPanel(state.selected, "samples/" + name + ".jpg");
  }

  function clearPanel() {
    state.photos[state.selected] = null;
    state.pans[state.selected] = { x: 0.5, y: 0.5 };
    state.zooms[state.selected] = 1;
    paint();
    setStatus("Panel " + (state.selected + 1) + " cleared — procedural sunset instead.");
  }

  function panelAt(px, py) {
    var rect = stage.getBoundingClientRect();
    var x = (px - rect.left) * (stage.width / rect.width);
    var y = (py - rect.top) * (stage.height / rect.height);
    var geo = CoverArt.layoutRects(state.layout, stage.width, stage.height);
    for (var i = 0; i < 4; i++) {
      var r = geo.panels[i];
      if (r.w > 0 && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i;
    }
    return -1;
  }

  function bindPointer() {
    stage.addEventListener("pointerdown", function (ev) {
      var i = panelAt(ev.clientX, ev.clientY);
      if (i < 0) return;
      state.selected = i;
      paintThumbs();
      if (!state.photos[i]) return;
      drag = { i: i, x: ev.clientX, y: ev.clientY, pan: { x: state.pans[i].x, y: state.pans[i].y } };
      stage.setPointerCapture(ev.pointerId);
    });
    stage.addEventListener("pointermove", function (ev) {
      if (!drag) return;
      var rect = stage.getBoundingClientRect();
      var geo = CoverArt.layoutRects(state.layout, stage.width, stage.height);
      var r = geo.panels[drag.i];
      var dx = (ev.clientX - drag.x) * (stage.width / rect.width) / Math.max(1, r.w);
      var dy = (ev.clientY - drag.y) * (stage.height / rect.height) / Math.max(1, r.h);
      state.pans[drag.i] = {
        x: Math.min(1, Math.max(0, drag.pan.x - dx)),
        y: Math.min(1, Math.max(0, drag.pan.y - dy)),
      };
      paint();
    });
    stage.addEventListener("pointerup", function () { drag = null; });
    stage.addEventListener("pointercancel", function () { drag = null; });
  }

  // -------------------------------------------------------------- export
  function exportPNG() {
    var size = CoverArt.SIZES[state.size];
    var off = document.createElement("canvas");
    off.width = size.w;
    off.height = size.h;
    CoverArt.drawCover(off, state);
    setStatus("Exporting " + size.name + "…");
    off.toBlob(function (blob) {
      if (!blob) { setStatus("Export failed in this browser."); return; }
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      var slug = state.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cover";
      a.download = "neon-coast-" + slug + "-" + size.w + "x" + size.h + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      setStatus("Exported " + size.name + " PNG.");
    }, "image/png");
  }

  function setStatus(msg) {
    var el = $("statusLine");
    if (el) el.textContent = msg;
  }

  // ------------------------------------------------------------ option rows
  function buildOptions(rowId, items, current, onPick) {
    var row = $(rowId);
    if (!row) return;
    row.innerHTML = "";
    Object.keys(items).forEach(function (key) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (key === current ? " on" : "");
      b.textContent = items[key].name;
      b.dataset.value = key;
      b.addEventListener("click", function () {
        onPick(key);
        Array.prototype.forEach.call(row.children, function (c) {
          c.classList.toggle("on", c.dataset.value === key);
        });
      });
      row.appendChild(b);
    });
  }

  function refreshOptions() {
    buildOptions("layoutRow", CoverArt.LAYOUTS, state.layout, function (k) { state.layout = k; paint(); });
    buildOptions("gradeRow", CoverArt.GRADES, state.grade, function (k) { state.grade = k; paint(); });
    buildOptions("sizeRow", CoverArt.SIZES, state.size, function (k) { state.size = k; paint(); });
  }

  // ------------------------------------------------------------------ boot
  function init() {
    stage = $("stage");
    if (!stage || !window.CoverArt) return;
    refreshOptions();

    $("titleInput").addEventListener("input", function (ev) {
      state.title = ev.target.value;
      paint();
    });
    $("subInput").addEventListener("input", function (ev) {
      state.subtitle = ev.target.value;
      paint();
    });
    $("zoomRange").addEventListener("input", function (ev) {
      state.zooms[state.selected] = parseFloat(ev.target.value) || 1;
      paint();
    });
    $("uploadBtn").addEventListener("click", function () { $("fileInput").click(); });
    $("fileInput").addEventListener("change", function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { fillPanel(state.selected, reader.result); };
      reader.readAsDataURL(file);
      ev.target.value = "";
    });
    $("sampleBoulevard").addEventListener("click", function () { pickSample("boulevard"); });
    $("samplePier").addEventListener("click", function () { pickSample("pier"); });
    $("clearBtn").addEventListener("click", clearPanel);
    $("exportBtn").addEventListener("click", exportPNG);
    for (var i = 0; i < 4; i++) {
      (function (n) {
        $("panel-" + n).addEventListener("click", function () {
          state.selected = n;
          $("zoomRange").value = String(state.zooms[n]);
          paintThumbs();
        });
      })(i);
    }
    bindPointer();

    // Start with the two kit samples so the first paint already shows art.
    // In shot mode (?shot=) boot.js stages its own photos instead.
    if (!window.__shotMode) {
      loadImage("samples/boulevard.jpg", function (img) {
        if (img) { state.photos[0] = img; paint(); }
      });
      loadImage("samples/pier.jpg", function (img) {
        if (img) { state.photos[1] = img; paint(); }
      });
    }
    paint();
    setStatus("Runs fully offline — photos never leave this machine.");
  }

  window.NeonCoast = { state: state, paint: paint, init: init, exportPNG: exportPNG };
  document.addEventListener("DOMContentLoaded", init);
})();
