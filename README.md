# Vice City Cover Studio

[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/asw880/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/asw880/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

A GTA-style cover maker for the [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty on [make.fun](https://make.fun). Turn your photos and a caption into a Vice City poster — multi-panel layouts, a painted sunset sky, bold stacked lettering — and export it as a PNG to share.

## What it does

- **The art**: six layouts (Slash Key Art, Hero+3, 4-Panel Grid, 9-Panel Grid, Full Bleed, Tilted Collage) over a painted sunset-sky backdrop with a retro slatted sun and palm silhouettes, thick ink frames, and stacked display titles with a hard drop shadow.
- **Any photo**: upload up to 4 of your own photos or use the 3 samples. Click a panel to select it, drag to reposition the photo inside, zoom per panel, and pick which photo fills each panel. Photos stay on your machine — nothing is uploaded.
- **Fast and easy**: pick a Look (Key Art, Neon Night, Sunset Strip) for a one-click poster, or tune layout, grade, caption and effects yourself, then export a PNG in 1080×1080, 1080×1350 or 1920×1080 with one click.
- **Polish**: live preview, undo/redo, five colour grades (Sunset, Neon Night, Vice Pink, Teal Dusk, Mono Noir), film grain and vignette toggles, letter-spacing control, and a 4-star heat meter.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. The app is plain static files under `app/` — no build step, no network requests. Fonts (Anton and Pacifico, SIL Open Font License) are vendored under `app/fonts/`.

## Shots

`screenshots/` holds the cover (the slash key-art poster) and the editor at work, taken with `?shot=` scenes:

```sh
node serve.ts # then open app/index.html?shot=cover, ?shot=editor, ?shot=portrait, ?shot=square
```

## License

MIT — see [LICENSE](LICENSE).
