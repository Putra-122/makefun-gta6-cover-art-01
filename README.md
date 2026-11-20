# Neon Coast Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Putra-122/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Putra-122/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline browser app that turns a photo and a caption into GTA 6-style
poster cover art — the iconic multi-panel poster and loading-screen look,
with a Vice City neon-sunset grade, exported as a PNG to share.

- **Four layouts:** Grid 2×2, Hero, Full bleed, Tilt polaroid.
- **Five grades:** Vice Sunset, Neon Night, Palm Heat, Ocean Drive, Mono Noir.
- **Per-panel photos:** upload your own, or use the two built-in samples.
  Drag to pan, zoom slider to crop. No photo? The app paints a procedural
  Vice City sunset (sky, sun, skyline, palms) instead.
- **Poster lettering:** big outlined title, glowing subtitle, halftone band.
- **Export:** Square 1080×1080, Portrait 1080×1350, Wide 1920×1080 PNG.
- **Fully offline:** no network requests, photos never leave the machine,
  system fonts only — nothing to download or install.

## Run it

```sh
node serve.ts        # serves the app at http://localhost:8080
```

## Build the dossier

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

An entry for the [make.fun bounty](https://make.fun/bounty/gta6-cover-art-01)
“Make GTA 6 Cover Art” (gta6-cover-art-01).
