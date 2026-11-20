// Neon Coast Cover Studio — shot boot (classic script, runs last).
// With ?shot=cover|editor|tilt it stages that screenshot scene: it applies
// the preset, loads its photos, waits for the poster fonts, then paints once
// so a headless screenshot catches the finished frame. Without ?shot= it
// does nothing and the normal editor (main.js) runs.
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var shotName = params.get("shot");
  if (!shotName) return;
  window.__shotMode = true;

  function stageShot() {
    var shot = window.CoverShots.applyShot(shotName);
    var stage = document.getElementById("stage");
    if (shot.coverMode) {
      document.body.classList.add("shot-cover");
      // Let the canvas follow the export size matching the shot's aspect,
      // so paint() never resizes it back and the frame fills the viewport
      // instead of letterboxing.
      window.NeonCoast.state.size = shot.width === shot.height ? "square" : "portrait";
    }
    // Refresh the option rows so the editor (if visible) matches the shot.
    var rows = document.querySelectorAll("#layoutRow .chip, #gradeRow .chip, #sizeRow .chip");
    Array.prototype.forEach.call(rows, function (chip) {
      var kind = chip.parentElement.id;
      var want = kind === "layoutRow" ? shot.layout : kind === "gradeRow" ? shot.grade : null;
      if (want) chip.classList.toggle("on", chip.dataset.value === want);
    });
    window.CoverShots.loadShotPhotos(shot, function (slots) {
      window.NeonCoast.state.photos = slots;
      var paintWhenReady = function () { window.NeonCoast.paint(); };
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(paintWhenReady);
        // Paint once now too, so a slow font load never leaves a blank frame.
        paintWhenReady();
      } else {
        paintWhenReady();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", stageShot);
  } else {
    stageShot();
  }
})();
