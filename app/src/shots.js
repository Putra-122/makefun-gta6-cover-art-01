// Neon Coast Cover Studio — screenshot scenes (classic script).
// Each shot is a preset state for one screenshot: which layout, grade,
// caption and photos it shows. boot.js applies the shot named by ?shot=.
// The photos are the kit's own samples (free to use) or procedural scenes.
(function () {
  "use strict";

  var SHOTS = {
    cover: {
      coverMode: true,
      width: 1080, height: 1080,
      title: "SUNSET HEIST",
      subtitle: "Leonida Nights",
      layout: "quad",
      grade: "vice",
      photos: ["boulevard", "pier", null, null],
      seed: 20261120,
    },
    editor: {
      coverMode: false,
      width: 1280, height: 800,
      title: "BOULEVARD QUEEN",
      subtitle: "Leonida Nights",
      layout: "hero",
      grade: "neon",
      photos: ["boulevard", "pier", "boulevard", "pier"],
      seed: 20261120,
    },
    tilt: {
      coverMode: true,
      width: 1024, height: 1280,
      title: "BOULEVARD QUEEN",
      subtitle: "Leonida Nights",
      layout: "tilt",
      grade: "ocean",
      photos: ["pier", null, null, null],
      seed: 20261121,
    },
  };

  // Loads a shot's photos (kit samples by name, null = procedural) then
  // calls done with the filled photo slots. Photos load from app/samples/.
  function loadShotPhotos(shot, done) {
    var slots = [null, null, null, null];
    var pending = 0;
    shot.photos.forEach(function (name, i) {
      if (!name) return;
      pending++;
      var img = new Image();
      img.onload = function () { slots[i] = img; if (--pending === 0) done(slots); };
      img.onerror = function () { if (--pending === 0) done(slots); };
      img.src = "samples/" + name + ".jpg";
    });
    if (pending === 0) done(slots);
  }

  // Applies a shot preset to the editor state and returns the shot.
  function applyShot(name) {
    var shot = SHOTS[name] || SHOTS.cover;
    var st = window.NeonCoast.state;
    st.title = shot.title;
    st.subtitle = shot.subtitle;
    st.layout = shot.layout;
    st.grade = shot.grade;
    st.seed = shot.seed;
    st.photos = [null, null, null, null];
    st.pans = [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }];
    st.zooms = [1, 1, 1, 1];
    var titleInput = document.getElementById("titleInput");
    var subInput = document.getElementById("subInput");
    if (titleInput) titleInput.value = shot.title;
    if (subInput) subInput.value = shot.subtitle;
    return shot;
  }

  window.CoverShots = { SHOTS: SHOTS, loadShotPhotos: loadShotPhotos, applyShot: applyShot };
})();
