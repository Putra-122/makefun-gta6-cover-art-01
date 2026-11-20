// Neon Coast Cover Studio — entry program (Node 22 stdlib, no deps).
// Copies app/ and screenshots/ into $MAKEFUN_OUTPUT_DIR (or /output) and
// writes dossier.json with buildDossier from vendor/makefun-app.ts.
// It never deletes the output dir: the grader's sandbox owns it, so this
// program only creates what it needs and overwrites its own files.
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(out, { recursive: true });
cpSync(join(root, "app"), join(out, "app"), { recursive: true });
cpSync(join(root, "screenshots"), join(out, "screenshots"), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, "dossier.json"), dossier);
console.log("wrote " + join(out, "dossier.json") + " (" + dossier.length + " bytes)");
