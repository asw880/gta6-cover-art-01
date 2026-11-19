// Vice City Cover Studio — the entry program (Node 22, standard library only).
// It hands the app in: it copies this repository's app/ and screenshots/
// beside this file into /output and writes /output/dossier.json, the summary
// the judge reads, using the vendored make.fun library. The app itself is
// plain static files a desktop browser loads offline (app/index.html and its
// ES modules, Anton + Pacifico vendored under the OFL, no network request):
// a multi-panel cover maker — six layouts, five colour grades, one-click
// Looks, a painted sunset sky with slatted sun and palm silhouettes behind
// the panels, stacked gradient display lettering with a hard drop shadow,
// drag-to-crop panels, and one-click PNG export in 1080 x 1080,
// 1080 x 1350 and 1920 x 1080. Its three sample photos (app/samples/) were made
// for make.fun with an image model and are free to use.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of
// app files, in all, or a path under app/ over 1000 bytes: app/ counts beside
// /output's own 1000-entry cap, its screenshots/ and dossier.json). Keeping
// the app small on purpose — a handful of source files, two fonts, two sample
// photos — leaves the whole entry far inside every cap.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
