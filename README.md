# Neon Coast Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Putra-122/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Putra-122/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns a photo and a caption into GTA 6-style
poster cover art: four panel layouts, five sunset/neon colour grades,
bold poster lettering with a halftone title band, and PNG export in the
three common post sizes (1080×1080, 1080×1350, 1920×1080).

Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).

## How it works

- Pick up to four photos (one per panel) or use the two bundled samples;
  with no photo the app paints a procedural Vice City sunset instead.
- Type a title and subtitle, pick a layout and a grade, and the live
  preview re-renders on a `<canvas>`. Export downloads a full-size PNG.
- Photos are read on your own machine and never uploaded. The app makes
  no network request at all: every script, font and sample is a file
  under `app/`, and the type is Noto Sans (SIL Open Font License).
- All artwork and lettering are original — no Rockstar Games logo,
  artwork or fonts.

## Try it

```sh
node serve.ts            # app/ on http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library. Running it
twice produces byte-identical output.
