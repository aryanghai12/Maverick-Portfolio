/**
 * Checks on the words /velra says in its own voice.
 *
 * Run with `npm test`. The page's rule is plain copy with no em dashes and no
 * claims Velra's documentation does not make. These keep that rule from
 * eroding one edit at a time.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as content from '../../lib/velra/content';
import { DOCS, VELRA_REPO } from '../../lib/velra/documented';
import { MODES } from '../../lib/velra/transcripts';

const ROOT = join(__dirname, '..', '..');

/** U+2014, built from its code point so this file never contains one itself. */
const EM_DASH = new RegExp(String.fromCharCode(0x2014));

/** Every string reachable from a value, however deeply it is nested. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const copy = strings(content);

test('the copy file holds a meaningful amount of text', () => {
  assert.ok(copy.length > 100);
});

test('no em dash in any written copy', () => {
  for (const s of copy) assert.doesNotMatch(s, EM_DASH, s);
});

test('no em dash in any page source, outside the file of verbatim quotes', () => {
  // lib/velra/documented.ts quotes Velra's own output, which contains two.
  const files = [
    ...readdirSync(join(ROOT, 'components', 'velra')).map((f) => join('components', 'velra', f)),
    ...readdirSync(join(ROOT, 'app', 'velra')).map((f) => join('app', 'velra', f)),
    ...readdirSync(join(ROOT, 'lib', 'velra'))
      .filter((f) => f !== 'documented.ts')
      .map((f) => join('lib', 'velra', f)),
  ];
  assert.ok(files.length >= 15);
  for (const file of files) {
    assert.doesNotMatch(readFileSync(join(ROOT, file), 'utf8'), EM_DASH, file);
  }
});

test('the only em dashes on the page are inside quoted documentation output', () => {
  const quoted = MODES.documented.steps.flatMap((s) =>
    s.output.filter((o) => o.kind === 'line' && EM_DASH.test(o.text)).map(() => s.id),
  );
  assert.deepEqual(quoted, ['DOC-STATUS', 'DOC-CLAUDE']);
});

test('none of the claims the brief rules out appear', () => {
  const banned = [
    /perfect memory/i,
    /never loses? anything/i,
    /remembers everything/i,
    /infinite context/i,
    /zero context loss/i,
    /revolutionar/i,
    /game[- ]chang/i,
    /seamless/i,
    /supercharge/i,
    /\blive (terminal|shell)\b/i,
  ];
  for (const s of copy) for (const pattern of banned) assert.doesNotMatch(s, pattern, s);
});

test('the page says plainly what Velra is not', () => {
  const all = copy.join('\n');
  assert.match(all, /Not a replay of the conversation/);
  assert.match(all, /never recorded/);
  assert.match(all, /Merged sessions/);
  assert.match(all, /Nothing on this page runs on your machine/);
  assert.match(all, /pattern matching/);
});

test('the tagline is the project\'s own', () => {
  assert.deepEqual([...content.cta.title], ['Clear the context.', 'Keep the state.', 'Continue working.']);
});

test('the install command is the one that was actually captured', () => {
  assert.equal(content.INSTALL_COMMAND, MODES.captured.steps[0].command);
});

test('every link goes to the confirmed Velra repository', () => {
  assert.equal(VELRA_REPO, 'https://github.com/aryanghai12/Velra');
  const links = [
    ...Object.values(DOCS),
    ...content.trust.links.map((l) => l.href),
    ...content.cta.links.map((l) => l.href),
    content.footer.repo,
    content.footer.licence,
  ];
  for (const href of links) assert.ok(href.startsWith(`${VELRA_REPO}`), href);
  for (const item of content.nav) assert.match(item.href, /^#[a-z]+$/);
});

test('every property and trust item is paired with its text', () => {
  assert.equal(content.properties.length, 4);
  assert.equal(content.how.steps.length, 5);
  assert.equal(content.trust.items.length, 8);
  for (const item of content.trust.items) {
    assert.ok(item.limit.length > 20, `${item.title} has no stated limit`);
  }
});
