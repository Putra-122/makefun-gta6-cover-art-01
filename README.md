# Neon Coast Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Putra-122/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Putra-122/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns a photo and a caption into GTA 6-style poster
cover art — the multi-panel poster look with bold caption lettering and a
Vice City sunset or neon colour grade — exported as a PNG to share.

Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Any photo:** upload your own photos from your machine (never sent
  anywhere) or use the two kit samples; fill four panels with one photo or
  several, and drag to crop and position each panel, zoom per panel.
- **Four layouts:** Grid 2x2, Hero (big + three), Full bleed, Tilt polaroid.
- **Five colour grades:** Vice Sunset, Neon Night, Palm Heat, Ocean Drive,
  Mono Noir — gradient-map washes, vignette and seeded grain.
- **Caption:** title + subtitle in poster lettering (vendored Noto Sans,
  SIL Open Font License), with a halftone title band and neon-glow subtitle.
- **No photo?** The app paints a procedural Vice City sunset (sky, sun,
  skyline, palms) so a cover is always one click away.
- **Export:** one click to a PNG in 1080 x 1080, 1080 x 1350 or 1920 x 1080.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Everything is static files under `app/` with no build step and no network
request: every script, image and font it loads is a file under `app/`.

## Entry program

`main.ts` (Node 22 stdlib) copies `app/` and `screenshots/` to
`$MAKEFUN_OUTPUT_DIR` and writes `dossier.json` with `buildDossier` from
`vendor/makefun-app.ts` (the kit's copy, unchanged).

## License

MIT — see [LICENSE](LICENSE). No Rockstar Games logo, artwork or font is
used anywhere in this app.
