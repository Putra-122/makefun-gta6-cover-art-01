// Boot: read ?shot= from the URL and run that scene, or start the editor.
// A plain page load (no ?shot) is the editor. Shot pages render a bare
// canvas so headless screenshots capture exactly the cover.

import { runCoverShot, runEditorShot, shotNames } from './shots.js';
import { createStudio } from './main.js';

async function boot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  try {
    if (shot === 'editor') {
      await runEditorShot();
    } else if (shot && shotNames().includes(shot)) {
      await runCoverShot(shot);
    } else {
      const studio = createStudio(document);
      await studio.start();
      document.body.dataset.ready = '1';
    }
  } catch (err) {
    document.body.dataset.error = String(err && err.message || err);
    throw err;
  }
}

boot();
