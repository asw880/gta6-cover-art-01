// Vice City Cover Studio — entry program (v5).
// Hands the app in: copies app/ and screenshots/ from this repository into
// the output directory and writes /output/dossier.json with the kit's
// vendored library. Node 22, standard library only, no network, runs twice
// and must write the same bytes both times.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function countEntries(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    total += 1;
    if (statSync(p).isDirectory()) total += countEntries(p);
  }
  return total;
}

function copyInputs() {
  const appSrc = join(repoRoot, 'app');
  const appDst = join(outDir, 'app');
  if (!existsSync(appSrc)) throw new Error('app/ is missing from the repository');
  mkdirSync(outDir, { recursive: true });
  cpSync(appSrc, appDst, { recursive: true });
  const shotsSrc = join(repoRoot, 'screenshots');
  const shotsDst = join(outDir, 'screenshots');
  mkdirSync(shotsDst, { recursive: true });
  if (existsSync(shotsSrc)) cpSync(shotsSrc, shotsDst, { recursive: true });
  return { appFiles: countEntries(appDst), shotFiles: countEntries(shotsDst) };
}

function writeDossier() {
  // The scorer's own caps (reference/gate.json): only text_max_bytes shapes
  // the bytes; the others refuse an entry the scorer would refuse.
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  return dossier.length;
}

const { appFiles, shotFiles } = copyInputs();
const dossierBytes = writeDossier();
console.log(`handed in ${appFiles} app entries and ${shotFiles} screenshots; dossier.json is ${dossierBytes} bytes`);
