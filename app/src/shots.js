// Screenshot scene: ?shot=cover draws one exported-style cover across
// the whole window, so the screenshot is the cover itself, not a page
// around it. The query carries the photo, caption, layout and grade.
import { GRADES, LAYOUTS, renderCover } from './cover.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

export async function shootCover(query) {
  document.body.classList.add('shot');
  const caption = query.get('caption') || 'SUNSET HEIST';
  const subtitle = query.get('subtitle') || 'Leonida Nights';
  const layout = LAYOUTS.some((l) => l.id === query.get('layout'))
    ? query.get('layout') : 'grid';
  const grade = GRADES.some((g) => g.id === query.get('grade'))
    ? query.get('grade') : 'sunset';

  // The editor markup is static HTML: drop it so the shot is only the
  // cover, edge to edge, with nothing above or below it.
  const canvas = document.createElement('canvas');
  canvas.id = 'shot-canvas';
  document.body.replaceChildren(canvas);

  try {
    await Promise.all([
      document.fonts.load('900 100px "NeonCoast Black"'),
      document.fonts.load('700 40px "NeonCoast Bold"'),
      document.fonts.ready,
    ]);
  } catch {
    // Fallback fonts still render.
  }

  const images = [null, null, null, null];
  const photo = query.get('photo');
  if (photo === 'boulevard' || photo === 'pier') {
    try {
      const img = await loadImage(`samples/${photo}.jpg`);
      images[0] = img;
      images[1] = img;
      images[2] = img;
      images[3] = img;
    } catch {
      // No photo: the procedural sunset scene covers for it.
    }
  }

  renderCover(canvas, {
    images,
    caption,
    subtitle,
    layout,
    grade,
    width: window.innerWidth,
    height: window.innerHeight,
  });
  document.title = `cover · ${caption}`;
}
