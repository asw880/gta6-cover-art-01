// Vice City Cover Studio — entry program (v4, written fresh).
// Hands the app in: copies app/ and screenshots/ beside this file into
// the output directory and writes dossier.json with the kit's vendored
// buildDossier. Node 22, standard library only; no network.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(name) {
  const src = join(repoRoot, name);
  if (!existsSync(src)) return;
  cpSync(src, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree('app');
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
copyTree('screenshots');

// The scorer's own caps: text is capped at 160 KiB in the dossier; the
// other limits refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB
// of app files in all; any path under app/ over 1000 bytes).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
