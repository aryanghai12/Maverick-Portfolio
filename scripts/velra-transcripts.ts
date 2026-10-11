/**
 * Regenerates data/velra/captured.json, the public-safe transcript data behind
 * the /velra replay, and audits what is about to be published.
 *
 * The source pack holds everything that was ever run. The page shows each
 * distinct Velra command once (lib/velra/published.ts), and only those
 * executions are written out.
 *
 *   npm run velra:transcripts            rewrite data/velra/captured.json
 *   npm run velra:transcripts -- --check verify without writing anything
 *
 * The input is VELRA-ALL-PROVIDED-TERMINAL-OUTPUTS.md in the repository root.
 * That file holds raw session ids, a local account name and private prompt
 * text, so it is gitignored and exists only on the machine that captured it.
 * Like scripts/make-og.ts, this is therefore not part of `next build`: a deploy
 * builds from the committed JSON and never needs the raw file.
 *
 * --check does three things:
 *   1. regenerates the data in memory and confirms the committed JSON matches;
 *   2. confirms no private value from the raw pack appears in that JSON;
 *   3. if ./out exists, confirms none appears anywhere in the built site.
 */

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SOURCE_FILE,
  buildCaptured,
  privateStrings,
  findLeaks,
  publish,
  FORBIDDEN_PATTERNS,
} from '../lib/velra/sanitize';
import { PUBLISHED } from '../lib/velra/published';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, SOURCE_FILE);
const OUT = join(ROOT, 'data', 'velra', 'captured.json');
const SITE = join(ROOT, 'out');

const TEXT_FILE = /\.(html|js|css|json|txt|map|xml|svg)$/i;

async function walk(dir: string): Promise<string[]> {
  const found: string[] = [];
  for (const name of await readdir(dir)) {
    const path = join(dir, name);
    if ((await stat(path)).isDirectory()) found.push(...(await walk(path)));
    else if (TEXT_FILE.test(name)) found.push(path);
  }
  return found;
}

async function main() {
  const check = process.argv.includes('--check');

  if (!existsSync(SOURCE)) {
    console.error(
      `✕ ${SOURCE_FILE} is not in the repository root.\n` +
        '  It is a local, gitignored file. The committed data/velra/captured.json\n' +
        '  is what the site builds from, so nothing needs regenerating without it.',
    );
    process.exit(check ? 0 : 1);
  }

  const raw = await readFile(SOURCE, 'utf8');
  // The whole pack is parsed and checked. Only the published selection is written.
  const everything = buildCaptured(raw);
  const next = JSON.stringify(publish(everything, PUBLISHED), null, 2) + '\n';
  const needles = privateStrings(raw);
  const problems: string[] = [];

  for (const hit of findLeaks(next, needles)) {
    problems.push(`generated data still contains a private value (${hit.length} chars)`);
  }
  for (const { name, pattern } of FORBIDDEN_PATTERNS) {
    if (pattern.test(next)) problems.push(`generated data matches the ${name} pattern`);
  }

  if (check) {
    const current = existsSync(OUT) ? (await readFile(OUT, 'utf8')).replace(/\r\n/g, '\n') : '';
    if (current !== next) {
      problems.push('data/velra/captured.json is out of date. Run npm run velra:transcripts.');
    }
    if (existsSync(SITE)) {
      const files = await walk(SITE);
      for (const file of files) {
        const hits = findLeaks(await readFile(file, 'utf8'), needles);
        if (hits.length) {
          problems.push(`${relative(ROOT, file)} contains ${hits.length} private value(s)`);
        }
      }
      console.log(`  scanned ${files.length} built files in ./out`);
    } else {
      console.log('  ./out not found, so the built site was not scanned. Run a build first.');
    }
  }

  if (problems.length) {
    console.error('✕ Velra transcript audit failed:\n' + problems.map((p) => `  - ${p}`).join('\n'));
    process.exit(1);
  }

  if (!check) {
    await mkdir(dirname(OUT), { recursive: true });
    await writeFile(OUT, next, 'utf8');
  }

  const parsed = JSON.parse(next) as ReturnType<typeof buildCaptured>;
  const redactions = parsed.entries.reduce(
    (n, e) => n + Object.values(e.redactions).reduce((a, b) => a + (b ?? 0), 0),
    0,
  );
  console.log(
    `✓ ${check ? 'verified' : 'wrote'} data/velra/captured.json\n` +
      `  ${parsed.entries.length} published of ${everything.entries.length} captured, ${redactions} redactions, ` +
      `${needles.length} private values checked and absent`,
  );
}

main().catch((err) => {
  console.error('✕ velra transcripts failed:', err.message ?? err);
  process.exit(1);
});
