[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Putra-122/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Putra-122/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Neon Coast — GTA 6 Cover Studio

An offline web app that turns your photo and a caption into GTA 6-style
cover art: the iconic multi-panel poster and loading-screen look with a
Vice City neon-sunset grade. Export the cover as a PNG to share.

Built for the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01)
on [make.fun](https://make.fun).

## What it does

- **Upload any photo** (or try the two built-in samples) — the photo is
  read locally in your browser and never sent anywhere.
- **Four poster layouts**: four-panel grid, hero + three, full-bleed,
  tilted snapshot.
- **Five grades**: Vice Sunset, Neon Night, Palm Heat, Ocean Drive,
  Mono Noir — gradient-map washes, vignette and film grain on canvas.
- **Poster lettering**: heavy condensed title with a neon-glow subtitle,
  halftone title band, all rendered on canvas.
- **Export PNG** in three sizes: 1080&times;1080, 1080&times;1350,
  1920&times;1080.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Everything is static files under `app/` — no build step, no network
requests at runtime. Fonts (Noto Sans Black/Bold/Regular, SIL OFL) are
vendored under `app/fonts/` so the poster renders identically offline.

## Entry

`main.ts` (Node 22, standard library only) copies `app/` and
`screenshots/` to `$MAKEFUN_OUTPUT_DIR` (or `/output`) and writes
`dossier.json` with the vendored make.fun library.
