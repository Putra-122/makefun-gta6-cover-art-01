// Neon Coast Cover Studio — entrypoint (Node 22, standard library only).
// Hands the app in: copies app/ and screenshots/ into the output dir and
// writes dossier.json with buildDossier from vendor/makefun-app.ts.
// Deliberately never removes the output dir: the grader's /output may be a
// mount point, so this only creates it and writes into it.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repo = resolve(dirname(fileURLToPath(import.meta.url)));
const out = resolve(process.env.MAKEFUN_OUTPUT_DIR || join(repo, 'out'));

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

mkdirSync(out, { recursive: true });
cpSync(join(repo, 'app'), join(out, 'app'), { recursive: true });
cpSync(join(repo, 'screenshots'), join(out, 'screenshots'), { recursive: true });
const dossier = buildDossier(out, caps);
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`dossier written: ${dossier.length} bytes -> ${join(out, 'dossier.json')}`);
