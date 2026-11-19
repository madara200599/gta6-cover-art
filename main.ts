// Neon Coast Cover Studio's entry program (Node 22, standard library only).
// It hands the app in: copies this repository's app/ and screenshots/ into
// the output directory and writes /output/dossier.json with the kit's
// buildDossier library, so the gate can check the entry and the judge can
// read it. Run it locally with MAKEFUN_OUTPUT_DIR set:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program writes the same bytes on every run: it only copies files and
// builds the dossier from them, and never reads the clock or the network.

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

// The gate's own caps from the kit: only text_max_bytes shapes the dossier's
// bytes, the rest refuse an entry the gate would refuse (more than 4
// screenshots, one over 256 KiB, app/ past 993 entries or 48 MiB, or a path
// over 1000 bytes).
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
