// Shot scenes for screenshots + judging (no user interaction).
//   ?shot=cover&photo=pier&caption=Sunset%20Heist  -> full-bleed cover
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen -> editor UI
// Query params: photo (pier|boulevard), caption, subtitle, layout, grade.
import { loadImage, renderCover } from './cover.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot') || 'cover';

const SAMPLES = { pier: 'samples/pier.jpg', boulevard: 'samples/boulevard.jpg' };

async function boot() {
  await document.fonts.ready;
  const photo = params.get('photo') || 'pier';
  const caption = params.get('caption') || 'Sunset Heist';
  const subtitle = params.get('subtitle') || 'welcome to vice city';
  const layout = params.get('layout') || 'grid';
  const grade = params.get('grade') || 'sunset';
  let img = null;
  try { img = await loadImage(SAMPLES[photo] || SAMPLES.pier); } catch { img = null; }

  if (shot === 'editor') {
    // Editor scene: reuse the main UI with the requested photo/caption.
    document.body.classList.remove('shot');
    const mod = await import('./main.js');
    void mod;
    // main.js boots with the default sample; override after a tick.
    setTimeout(async () => {
      const cap = document.getElementById('caption');
      const sub = document.getElementById('subtitle');
      if (cap) { cap.value = caption; cap.dispatchEvent(new Event('input')); }
      if (sub) { sub.value = subtitle; sub.dispatchEvent(new Event('input')); }
      const btn = document.querySelector(`[data-sample="${SAMPLES[photo] || SAMPLES.pier}"]`);
      if (btn) btn.click();
      const lay = document.querySelector(`[data-layout="${layout}"]`);
      if (lay) lay.click();
      const grd = document.querySelector(`[data-grade="${grade}"]`);
      if (grd) grd.click();
    }, 300);
    return;
  }

  // Cover scene: full-viewport canvas, no chrome.
  document.body.classList.add('shot');
  const stage = document.getElementById('stage');
  stage.width = window.innerWidth;
  stage.height = window.innerHeight;
  renderCover(stage, { img, caption, subtitle, layout, grade, seed: 20261120 });
  document.title = 'shot:cover';
}

boot();
