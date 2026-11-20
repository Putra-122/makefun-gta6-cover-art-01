// Neon Coast Cover Studio — editor wiring.
//
// Owns the page state (photos, caption, layout, grade, export size),
// renders the live preview through the cover engine, and exports the
// finished cover as a PNG. Photos are read on this machine only
// (FileReader / data URLs) and are never uploaded anywhere.

import { GRADES, LAYOUTS, SIZES, renderCover } from './cover.js';

const $ = (id) => document.getElementById(id);

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

async function waitForFonts() {
  try {
    await Promise.all([
      document.fonts.load('900 100px "NeonCoast Black"'),
      document.fonts.load('700 40px "NeonCoast Bold"'),
      document.fonts.load('400 40px "NeonCoast"'),
    ]);
    await document.fonts.ready;
  } catch {
    // Fallback fonts still render; the cover never blocks on fonts.
  }
}

export async function startEditor(query) {
  const state = {
    images: [null, null, null, null],
    caption: query.get('caption') || 'SUNSET HEIST',
    subtitle: query.get('subtitle') || 'Leonida Nights',
    layout: LAYOUTS.some((l) => l.id === query.get('layout')) ? query.get('layout') : 'grid',
    grade: GRADES.some((g) => g.id === query.get('grade')) ? query.get('grade') : 'sunset',
    size: SIZES.find((s) => s.id === query.get('size')) || SIZES[0],
  };

  // Build the option buttons from the engine's own tables, so the UI
  // can never drift out of sync with what the engine supports.
  const layoutBox = $('layout-options');
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = layout.label;
    btn.title = layout.hint;
    btn.dataset.value = layout.id;
    btn.addEventListener('click', () => {
      state.layout = layout.id;
      refresh();
    });
    layoutBox.appendChild(btn);
  }
  const gradeBox = $('grade-options');
  for (const grade of GRADES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = grade.label;
    btn.dataset.value = grade.id;
    btn.addEventListener('click', () => {
      state.grade = grade.id;
      refresh();
    });
    gradeBox.appendChild(btn);
  }
  const sizeSel = $('size-select');
  for (const size of SIZES) {
    const opt = document.createElement('option');
    opt.value = size.id;
    opt.textContent = size.label;
    sizeSel.appendChild(opt);
  }
  sizeSel.value = state.size.id;

  const preview = $('preview');
  const meta = $('preview-meta');

  function render() {
    renderCover(preview, {
      images: state.images,
      caption: state.caption,
      subtitle: state.subtitle,
      layout: state.layout,
      grade: state.grade,
      width: state.size.w,
      height: state.size.h,
    });
    meta.textContent = `${state.size.w} × ${state.size.h} · ${state.layout} · ${state.grade}`;
    for (const btn of layoutBox.children) {
      btn.classList.toggle('active', btn.dataset.value === state.layout);
    }
    for (const btn of gradeBox.children) {
      btn.classList.toggle('active', btn.dataset.value === state.grade);
    }
  }

  function refresh() {
    render();
  }

  // Caption / subtitle editing.
  const captionInput = $('caption-input');
  const subtitleInput = $('subtitle-input');
  captionInput.value = state.caption;
  subtitleInput.value = state.subtitle;
  captionInput.addEventListener('input', () => {
    state.caption = captionInput.value.trim() || 'UNTITLED';
    render();
  });
  subtitleInput.addEventListener('input', () => {
    state.subtitle = subtitleInput.value.trim();
    render();
  });

  sizeSel.addEventListener('change', () => {
    state.size = SIZES.find((s) => s.id === sizeSel.value) || SIZES[0];
    render();
  });

  // Photo slots: four thumbnails; clicking one arms it for replacement.
  const slotsBox = $('photo-slots');
  let armedSlot = 0;
  const slotEls = [];
  for (let i = 0; i < 4; i++) {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'slot';
    slot.textContent = `Panel ${i + 1}`;
    slot.addEventListener('click', () => {
      armedSlot = i;
      paintSlots();
      $('file-input').click();
    });
    slotsBox.appendChild(slot);
    slotEls.push(slot);
  }
  function paintSlots() {
    slotEls.forEach((el, i) => {
      el.classList.toggle('armed', i === armedSlot);
      el.classList.toggle('filled', !!state.images[i]);
      if (state.images[i]) {
        el.style.backgroundImage = `url(${state.images[i].src})`;
        el.textContent = '';
      } else {
        el.style.backgroundImage = '';
        el.textContent = `Panel ${i + 1}`;
      }
    });
  }

  $('file-input').addEventListener('change', async (event) => {
    const files = [...event.target.files].slice(0, 4);
    for (const file of files) {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      try {
        state.images[armedSlot] = await loadImage(dataUrl);
        armedSlot = (armedSlot + 1) % 4;
      } catch {
        // A file that is not an image is skipped, the rest still load.
      }
    }
    event.target.value = '';
    paintSlots();
    render();
  });

  $('sample-boulevard').addEventListener('click', async () => {
    state.images[0] = await loadImage('samples/boulevard.jpg');
    paintSlots();
    render();
  });
  $('sample-pier').addEventListener('click', async () => {
    state.images[0] = await loadImage('samples/pier.jpg');
    paintSlots();
    render();
  });
  $('clear-photos').addEventListener('click', () => {
    state.images = [null, null, null, null];
    paintSlots();
    render();
  });

  // Export: render offscreen at the chosen size, download the PNG.
  $('export-btn').addEventListener('click', () => {
    const off = document.createElement('canvas');
    renderCover(off, {
      images: state.images,
      caption: state.caption,
      subtitle: state.subtitle,
      layout: state.layout,
      grade: state.grade,
      width: state.size.w,
      height: state.size.h,
    });
    off.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neon-coast-cover-${state.size.w}x${state.size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 'image/png');
  });

  // Preset photo for screenshot scenes (?photo=boulevard|pier).
  await waitForFonts();
  const preset = query.get('photo');
  if (preset === 'boulevard' || preset === 'pier') {
    try {
      state.images[0] = await loadImage(`samples/${preset}.jpg`);
    } catch {
      // No photo: the procedural scene covers for it.
    }
  }
  paintSlots();
  render();
}
