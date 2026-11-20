// Neon Coast Cover Studio — editor wiring.
// State lives in one object; every control change re-renders the preview.
// Photos never leave the machine: FileReader data URLs, no network calls.

import { renderCover, GRADES, LAYOUTS } from './cover.js';

export const SIZES = {
  square: { label: 'Square 1080 × 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait 1080 × 1350', width: 1080, height: 1350 },
  wide: { label: 'Wide 1920 × 1080', width: 1920, height: 1080 },
};

const SAMPLES = [
  { name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { name: 'Pier', src: 'samples/pier.jpg' },
];

export function createStudio(root) {
  const state = {
    photos: [null, null, null, null],
    selected: 0,
    layout: 'grid',
    grade: 'sunset',
    title: 'SUNSET HEIST',
    subtitle: 'Leonida Nights',
    size: 'square',
    seed: 7,
  };

  const canvas = root.querySelector('#cover');
  const $ = (sel) => root.querySelector(sel);

  function currentPhoto() {
    return state.photos[state.selected];
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('could not load image'));
      img.src = src;
    });
  }

  async function setPhoto(slot, src) {
    const img = await loadImage(src);
    state.photos[slot] = { img, zoom: 1, dx: 0, dy: 0 };
    render();
  }

  function render() {
    const size = SIZES[state.size];
    renderCover(canvas, {
      photos: state.photos,
      layout: state.layout,
      grade: state.grade,
      title: state.title,
      subtitle: state.subtitle,
      seed: state.seed,
      width: size.width,
      height: size.height,
    });
    const meta = $('#meta');
    if (meta) meta.textContent = `${size.width} × ${size.height} · ${LAYOUTS[state.layout]} · ${GRADES[state.grade].label}`;
    refreshSlots();
  }

  function refreshSlots() {
    root.querySelectorAll('[data-slot]').forEach((el) => {
      const i = Number(el.dataset.slot);
      el.classList.toggle('active', i === state.selected);
      const thumb = el.querySelector('img');
      const label = el.querySelector('.slot-label');
      const photo = state.photos[i];
      if (photo) {
        if (thumb) { thumb.src = photo.img.src; thumb.style.display = ''; }
        if (label) label.style.display = 'none';
      } else {
        if (thumb) thumb.style.display = 'none';
        if (label) label.style.display = '';
      }
    });
  }

  function bind() {
    // Photo slots: click to select, drag on the cover to pan the selected photo.
    root.querySelectorAll('[data-slot]').forEach((el) => {
      el.addEventListener('click', () => { state.selected = Number(el.dataset.slot); render(); });
    });
    let dragging = false, lastX = 0, lastY = 0;
    canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const photo = currentPhoto();
      if (!photo) return;
      photo.dx += (e.clientX - lastX) / canvas.clientWidth;
      photo.dy += (e.clientY - lastY) / canvas.clientHeight;
      lastX = e.clientX; lastY = e.clientY;
      render();
    });
    canvas.addEventListener('pointerup', () => { dragging = false; });

    const zoom = $('#zoom');
    if (zoom) zoom.addEventListener('input', () => {
      const photo = currentPhoto();
      if (photo) { photo.zoom = Number(zoom.value); render(); }
    });

    const file = $('#upload');
    if (file) file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => setPhoto(state.selected, String(reader.result));
      reader.readAsDataURL(f);
    });

    root.querySelectorAll('[data-sample]').forEach((el) => {
      el.addEventListener('click', () => setPhoto(state.selected, el.dataset.sample));
    });
    const clear = $('#clear');
    if (clear) clear.addEventListener('click', () => { state.photos[state.selected] = null; render(); });

    const title = $('#title');
    if (title) title.addEventListener('input', () => { state.title = title.value; render(); });
    const subtitle = $('#subtitle');
    if (subtitle) subtitle.addEventListener('input', () => { state.subtitle = subtitle.value; render(); });

    root.querySelectorAll('[data-layout]').forEach((el) => {
      el.addEventListener('click', () => {
        state.layout = el.dataset.layout;
        root.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === el));
        render();
      });
    });
    root.querySelectorAll('[data-grade]').forEach((el) => {
      el.addEventListener('click', () => {
        state.grade = el.dataset.grade;
        root.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === el));
        render();
      });
    });
    root.querySelectorAll('[data-size]').forEach((el) => {
      el.addEventListener('click', () => {
        state.size = el.dataset.size;
        root.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b === el));
        render();
      });
    });

    const exportBtn = $('#export');
    if (exportBtn) exportBtn.addEventListener('click', () => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `neon-coast-${state.layout}-${SIZES[state.size].width}x${SIZES[state.size].height}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }, 'image/png');
    });
  }

  async function start() {
    bind();
    // Preload the first sample into panel 1 and the second into panel 2,
    // so the editor opens with a real cover instead of an empty grid.
    try { await setPhoto(0, SAMPLES[0].src); } catch { /* keep the sunset fallback */ }
    try { await setPhoto(1, SAMPLES[1].src); } catch { /* keep the sunset fallback */ }
    render();
  }

  return { state, render, setPhoto, start };
}
