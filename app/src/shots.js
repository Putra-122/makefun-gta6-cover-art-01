// Shot scenes for screenshots: ?shot=cover renders one exported cover
// full-page; ?shot=editor renders the editor with a photo loaded.
// Each shot is deterministic (fixed seed, fixed sample photos).

import { renderCover } from './cover.js';
import { createStudio } from './main.js';

const SHOTS = {
  cover: {
    width: 1080, height: 1080, layout: 'grid', grade: 'sunset',
    title: 'SUNSET HEIST', subtitle: 'Leonida Nights', seed: 7,
    photos: ['samples/boulevard.jpg', 'samples/pier.jpg'],
  },
  tilt: {
    width: 1024, height: 1280, layout: 'tilt', grade: 'ocean',
    title: 'BOULEVARD QUEEN', subtitle: 'Leonida Nights', seed: 11,
    photos: ['samples/pier.jpg'],
  },
  editor: null, // the editor scene is built by boot.js via createStudio
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('shot image failed: ' + src));
    img.src = src;
  });
}

// Paint a cover shot into the page's #shot canvas and mark the page ready.
// The editor chrome is hidden so the screenshot captures only the cover.
export async function runCoverShot(name) {
  const shot = SHOTS[name];
  if (!shot) throw new Error('unknown shot: ' + name);
  document.querySelector('main.layout')?.remove();
  document.querySelector('header.top')?.remove();
  const canvas = document.getElementById('shot');
  canvas.hidden = false;
  const photos = [];
  for (let i = 0; i < 4; i++) {
    const src = shot.photos[i];
    photos.push(src ? { img: await loadImage(src), zoom: 1, dx: 0, dy: 0 } : null);
  }
  renderCover(canvas, {
    photos, layout: shot.layout, grade: shot.grade,
    title: shot.title, subtitle: shot.subtitle, seed: shot.seed,
    width: shot.width, height: shot.height,
  });
  document.body.dataset.ready = '1';
  return { width: shot.width, height: shot.height };
}

// Editor scene: boot the full studio, then load a sample into panel 1
// and switch to the hero layout so the screenshot shows the working UI.
export async function runEditorShot() {
  const studio = createStudio(document);
  await studio.start();
  studio.state.layout = 'hero';
  studio.state.grade = 'neon';
  studio.state.title = 'BOULEVARD QUEEN';
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === 'hero'));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === 'neon'));
  const title = document.getElementById('title');
  if (title) title.value = 'BOULEVARD QUEEN';
  studio.render();
  document.body.dataset.ready = '1';
  return { width: 1280, height: 800 };
}

export function shotNames() {
  return Object.keys(SHOTS).filter((k) => SHOTS[k]);
}
