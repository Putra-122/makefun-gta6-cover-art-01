# gta6-cover-art-01 — build notes

Built 2026-11-20 in a fresh recorded session. Competition: offline web app
that turns a photo + caption into GTA 6 poster-style cover art, $250 escrowed,
top 50, closes Sat 21 Nov 2026 17:30 WIB.

## Harness check (done first)

Kit downloaded from `https://make.fun/c/gta6-cover-art-01/kit` into
`~/workspace/makefun/gta6-cover-art-01-kit/`. The competition.yaml
"Recorded harnesses" list explicitly includes **Muse app** (alongside
Claude Code, Codex, Gemini CLI, Superbot, …) — Muse is ALLOWED, so the
build proceeded. Entry contract: `main.ts` (Node 22 stdlib) copies `app/`
+ `screenshots/` to `$MAKEFUN_OUTPUT_DIR` and writes `dossier.json` via
the vendored `vendor/makefun-app.ts` library. Gate caps: app/ ≤993 files /
48 MiB, index.html ≤1 MiB, 3–4 screenshots ≤256 KiB each, long side ≤1280,
short side ≥480.

## The app — "Neon Coast Cover Studio" (all code written in this session)

- `app/index.html` + `app/style.css`: editor UI (upload/drop, 2 samples,
  caption/subtitle, 4 layouts, 5 grades, 3 export sizes, Export PNG).
- `app/src/cover.js` (419 lines): canvas 2D cover engine. Layouts: grid
  (2×2), hero (big + three), bleed (full-bleed + scrim), tilt (polaroid on
  gradient). Grades: Vice Sunset, Neon Night, Palm Heat, Ocean Drive,
  Mono Noir (gradient-map washes, vignette, seeded grain — deterministic
  per seed). Poster lettering: vendored Noto Sans Black (OFL) with
  outline + neon-glow subtitle + halftone title band. No-photo fallback:
  procedural sunset scene (sky, sun, skyline, palms).
- `app/src/main.js`: UI wiring; photo via FileReader (local only, never
  sent); export = `canvas.toBlob('image/png')` download.
- `app/src/shots.js` + `app/src/boot.js`: `?shot=cover` (full-bleed cover)
  and `?shot=editor` (editor UI) scenes for screenshots.
- `app/fonts/`: Noto Sans Black/Bold/Regular vendored (OFL) so the poster
  renders identically offline. `app/samples/`: the kit starter's two
  sample photos (made for make.fun, free to use).
- `main.ts` / `serve.ts` / `shots.json` / `vendor/makefun-app.ts`
  (kit library, verbatim) / `README.md` (3 live make.fun badges + bounty
  link) / `LICENSE` (MIT) / `.makefun/owner.json` (wallet
  xfazjnk39LekFTxvEGhGVcAtmdpCtQYbx4KzztVeFbU).

## Verification (headless Chromium, local serve.ts)

Screenshots (all ≤256 KiB, visually checked at full size):
- `1-cover.jpg` 1080×1080, 203,352 B — grid + sunset, "SUNSET HEIST"
- `2-editor.jpg` 1280×900, 194,495 B — editor UI, hero + neon
- `3-cover.jpg` 1024×1280, 124,231 B — tilt + drive, "BOULEVARD QUEEN"

Two bugs found by visual check and fixed: (1) subtitle overlapped a
2-line title — drawTitle now reserves a subtitle zone; (2) tilt layout
left the bottom half empty on portrait — composition is now vertically
centered. Extra paths spot-checked after the fix: bleed + noir at
1920×1080 ("MIDNIGHT RUN", renders correctly) and grid + palm at
1080×1350 (renders, mean brightness 85.5).

Determinism: `main.ts` run twice into separate dirs — byte-identical
output (15 files, dossier.json sha256
5d18a842da7eac0c68658c079e5e81e3f684b2bbd4f1cf3a860038e06351108c,
keys cover/images/schema/text).

## Status

NOT committed, NOT pushed, NOT bundled, NOT submitted. Ready for the
parent to create repo Putra-122/makefun-gta6-cover-art-01, commit + push,
bundle, and submit after the user's second GAS. Repo About per
requirements: homepage https://make.fun/bounty/gta6-cover-art-01, topic
makefun. Note: this competition is escrowed — submit likely needs
--keypair like the GTA6 meme entry.
