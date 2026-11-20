// Neon Coast editor UI — wires the controls to the cover engine.
// Offline: the photo is read locally (FileReader / sample files), never sent.
import { loadImage, renderCover, GRADES } from './cover.js';

const stage = document.getElementById('stage');
const state = {
  img: null,
  caption: 'SUNSET HEIST',
  subtitle: 'welcome to vice city',
  layout: 'grid',
  grade: 'sunset',
  size: '1080x1080',
};

const SAMPLES = ['samples/pier.jpg', 'samples/boulevard.jpg'];

function draw() {
  const [w, h] = state.size.split('x').map(Number);
  if (stage.width !== w || stage.height !== h) {
    stage.width = w;
    stage.height = h;
  }
  renderCover(stage, state);
}

function note(msg) {
  document.getElementById('export-note').textContent = msg;
}

async function setPhoto(src, label) {
  try {
    state.img = await loadImage(src);
    draw();
    note(label ? `Photo loaded: ${label}` : 'Photo loaded.');
  } catch {
    note('Could not load that photo — try another file.');
  }
}

function bindPills(id, key) {
  const root = document.getElementById(id);
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-' + key + ']');
    if (!btn) return;
    root.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
    btn.classList.add('on');
    state[key] = btn.dataset[key];
    draw();
  });
}

bindPills('layouts', 'layout');
bindPills('grades', 'grade');
bindPills('sizes', 'size');

document.getElementById('caption').addEventListener('input', (e) => {
  state.caption = e.target.value || 'UNTITLED';
  draw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  draw();
});

const drop = document.getElementById('drop');
const fileInput = document.getElementById('file');
drop.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => setPhoto(reader.result, file.name);
  reader.readAsDataURL(file);
});
['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => {
  e.preventDefault();
  drop.classList.add('drag');
}));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => {
  e.preventDefault();
  drop.classList.remove('drag');
}));
drop.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => setPhoto(reader.result, file.name);
  reader.readAsDataURL(file);
});

document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', () => setPhoto(btn.dataset.sample, btn.textContent.trim()));
});

document.getElementById('export').addEventListener('click', () => {
  draw();
  stage.toBlob((blob) => {
    if (!blob) { note('Export failed — try again.'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gta6-cover-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    note(`Exported gta6-cover-${state.size}.png (${Math.round(blob.size / 1024)} KiB).`);
  }, 'image/png');
});

// Boot: load the first sample so the preview is never blank, then draw.
document.fonts.ready.then(() => {
  setPhoto(SAMPLES[0], 'Pier sunset (sample)');
  draw();
});
draw();
