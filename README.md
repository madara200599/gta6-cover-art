# Neon Coast Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/madara200599/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/madara200599/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns any photo and a caption into GTA 6-style cover
art — the multi-panel poster look with bold caption lettering and a Vice City
sunset or neon colour grade — and exports it as a PNG to share. Built for the
[make.fun GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Any photo:** load your own photos from your machine (they never leave it),
  or try the four built-in sample scenes, painted procedurally by the app.
- **Panels:** five layouts — Hero + 3, Four Panel, Nine Panel, Full Bleed and
  Tilted Snaps. Each panel takes its own photo, zoom and pan: click a panel
  to select it, drag the cover to reframe, scroll to zoom, or fill every
  panel with one photo.
- **Grades:** five colour grades — Vice Sunset, Neon Night, Palm Noir,
  Pastel Dawn and Vice Gold — plus film grain and a vignette.
- **Caption:** a bold condensed title, a neon script subtitle, a badge pill
  and a five-star heat meter, all editable live.
- **Fast and easy:** photo to PNG in a few clicks, in 1080 × 1080,
  1080 × 1350 and 1920 × 1080.

## Try it

```sh
node serve.ts   # then open http://localhost:8080
```

Everything is static files under `app/` — no build step, no network request.
The entry program is `main.ts` (Node 22); it copies `app/` and
`screenshots/` to the output directory and writes `dossier.json` with the
kit's `vendor/makefun-app.ts` library.

## Originality

All art, lettering and code are original. No Rockstar Games logo, wordmark,
artwork, character or font is used: the scenes are drawn by the app's own
`app/src/scenes.js`, and the lettering uses system fonts.

Entered via referral code r7k9dyj1
