/**
 * Integrity checks for the transcript data behind the /velra replay.
 *
 * Run with `npm test`. The aim is that a claim on the page cannot drift away
 * from the output it is based on, and that nothing private can be committed by
 * accident. The last group compares against the raw source pack, which is a
 * local, gitignored file, and is skipped on machines that do not have it.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import capturedJson from '../../data/velra/captured.json';
import {
  FORBIDDEN_PATTERNS,
  REDACTION_TOKEN,
  SOURCE_FILE,
  buildCaptured,
  findLeaks,
  privateStrings,
  type CapturedFile,
  type RedactionKind,
} from '../../lib/velra/sanitize';
import {
  MODES,
  MODE_ORDER,
  PLACEHOLDER,
  PLACEHOLDER_KIND,
  REDACTION_INFO,
  commandText,
  countRedactions,
  hasOutput,
  outputText,
  stepsFor,
} from '../../lib/velra/transcripts';
import type { Step } from '../../lib/velra/types';

const captured = capturedJson as CapturedFile;
const storySteps = MODES.story.steps;
const capturedSteps = MODES.captured.steps;
const documentedSteps = MODES.documented.steps;
const byId = (id: string) => {
  const step = capturedSteps.find((s) => s.id === id);
  assert.ok(step, `step ${id} should exist`);
  return step;
};
const linesOf = (step: Step) =>
  step.output.filter((o) => o.kind === 'line').map((o) => o.text);

/** Every string a visitor could be shown for a step. */
function visibleText(step: Step): string {
  return [
    step.title,
    step.explain,
    step.workspace,
    step.prompt,
    step.command ?? '',
    step.contextLabel ?? '',
    step.note ?? '',
    step.source.label,
    ...step.output.map((o) => o.text),
    step.inspector.heading,
    step.inspector.summary,
    ...step.inspector.fields.flatMap((f) => [f.label, f.value, f.detail ?? '', ...(f.evidence ?? [])]),
  ].join('\n');
}

const EM_DASH = new RegExp(String.fromCharCode(0x2014));

/* ---------------------------------------------------------------- coverage */

test('the generated data still holds every transcript section A through M', () => {
  const sections = new Set(captured.entries.map((e) => e.section));
  assert.deepEqual([...sections].sort(), 'ABCDEFGHIJKLM'.split(''));
  assert.equal(captured.entries.length, 23);
});

test('the walkthrough is eight steps, in source order, ending on the open handoff', () => {
  assert.deepEqual(
    storySteps.map((s) => s.id),
    ['A1', 'D', 'E', 'F', 'L', 'M1', 'M2', 'HANDOFF'],
  );
  assert.deepEqual(
    storySteps.map((s) => s.command),
    [
      'npm install -g velra',
      'velra enable',
      'velra doctor',
      'velra inspect',
      'velra restore --list --json',
      'velra inspect --session <session-id>',
      'velra restore --session <session-id>',
      null,
    ],
  );
  // Source order: each walkthrough step appears later in the full capture than the one before.
  const positions = storySteps.map((s) => capturedSteps.indexOf(s));
  assert.ok(positions.every((p, i) => p >= 0 && (i === 0 || p > positions[i - 1])));
});

test('the walkthrough reuses the captured steps, so the two views cannot disagree', () => {
  for (const step of storySteps) assert.equal(step, byId(step.id));
});

test('the full capture holds every Velra command in source order, then the handoff', () => {
  assert.deepEqual(
    capturedSteps.map((s) => s.id),
    ['A1', 'A2', 'A3', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K1', 'L', 'M1', 'M2', 'M3', 'HANDOFF'],
  );
});

test('only Velra commands are shown in any view', () => {
  for (const mode of Object.values(MODES)) {
    for (const step of mode.steps) {
      if (step.command === null) continue;
      assert.match(
        step.command,
        /^(velra\b|npm install -g velra$|claude$)/,
        `${mode.id}/${step.id}: ${step.command}`,
      );
    }
  }
  const shown = [...capturedSteps, ...storySteps].map((s) => s.command ?? '').join('\n');
  for (const unrelated of ['vhs', 'ffmpeg', 'ttyd', 'command -v', 'claude --version']) {
    assert.ok(!shown.includes(unrelated), `an unrelated command is shown: ${unrelated}`);
  }
  // The one `claude` command is in the documented example, where it is the handoff itself.
  assert.deepEqual(
    Object.values(MODES).flatMap((m) => m.steps.filter((s) => s.command === 'claude').map((s) => s.id)),
    ['DOC-CLAUDE'],
  );
});

test('every Velra command that was captured is still reachable', () => {
  const commands = capturedSteps.map((s) => s.command);
  for (const required of [
    'npm install -g velra',
    'velra --version',
    'velra status',
    'velra disable',
    'velra enable',
    'velra doctor',
    'velra inspect',
    'velra restore',
    'velra restore --list --json',
  ]) {
    assert.ok(commands.includes(required), `missing command: ${required}`);
  }
});

test('repeated commands stay separate executions with their own results', () => {
  assert.equal(byId('A1').command, byId('A2').command);
  assert.match(outputText(byId('A1')), /508ms/);
  assert.match(outputText(byId('A2')), /506ms/);

  // The empty-database warnings are not merged with the later results.
  assert.equal(byId('F').command, byId('H').command);
  assert.match(outputText(byId('F')), /No Velra database yet/);
  assert.match(outputText(byId('H')), /checkpoint="preview"/);
  assert.doesNotMatch(outputText(byId('H')), /No Velra database yet/);

  assert.equal(byId('G').command, byId('I').command);
  assert.match(outputText(byId('G')), /No Velra database yet/);
  assert.match(outputText(byId('I')), /no task state for any of this workspace's 20 session/);

  assert.equal(byId('J').command, byId('L').command);
  assert.equal(linesOf(byId('J')).filter((l) => l.includes('"session_id"')).length, 20);
  assert.equal(linesOf(byId('L')).filter((l) => l.includes('"session_id"')).length, 5);
  assert.equal(linesOf(byId('J')).filter((l) => l.includes('"has_state": true')).length, 0);
  assert.equal(linesOf(byId('L')).filter((l) => l.includes('"has_state": true')).length, 3);
});

test('long outputs are complete, not summarised', () => {
  assert.equal(linesOf(byId('J')).length, 126);
  assert.equal(linesOf(byId('L')).length, 36);
  assert.equal(linesOf(byId('H'))[0].startsWith('<VELRA_WORKSPACE_STATE'), true);
  assert.equal(linesOf(byId('H')).at(-1), '</VELRA_WORKSPACE_STATE>');
  assert.doesNotThrow(() => JSON.parse(outputText(byId('J'))));
  assert.doesNotThrow(() => JSON.parse(outputText(byId('L'))));
});

test('every step explains itself in plain words', () => {
  for (const step of [...capturedSteps, ...documentedSteps]) {
    assert.ok(step.title.length >= 8, `${step.id} has no real title`);
    assert.ok(step.explain.length >= 30, `${step.id} has no explanation`);
    assert.ok(step.explain.length <= 220, `${step.id}: the explanation is too long to scan`);
    assert.match(step.explain, /\.$/, `${step.id}: the explanation should be a sentence`);
  }
});

/* ------------------------------------------------------------ environments */

test('Windows and Linux captures are never placed in the same phase', () => {
  for (const step of capturedSteps) {
    const windows = step.phase === 'windows-setup';
    assert.equal(step.environment, windows ? 'windows' : 'linux', step.id);
    assert.equal(step.shell, windows ? 'PowerShell' : 'zsh', step.id);
  }
  const windowsIds = capturedSteps.filter((s) => s.environment === 'windows').map((s) => s.id);
  assert.deepEqual(windowsIds, ['A1', 'A2', 'A3', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
});

test('the environment changes exactly once in each captured view, Windows first', () => {
  for (const steps of [capturedSteps, storySteps]) {
    const envs = steps.map((s) => s.environment);
    assert.equal(envs.filter((e, i) => i > 0 && e !== envs[i - 1]).length, 1);
    assert.equal(envs[0], 'windows');
  }
});

test('each target triple stays with its own environment', () => {
  assert.match(outputText(byId('A3')), /x86_64-pc-windows-msvc/);
  assert.match(outputText(byId('K1')), /x86_64-unknown-linux-musl/);
  for (const step of capturedSteps) {
    const text = outputText(step);
    if (step.environment === 'windows') assert.doesNotMatch(text, /linux-musl/, step.id);
    else assert.doesNotMatch(text, /windows-msvc/, step.id);
  }
});

/* ------------------------------------------------------- nothing invented */

test('output that was not supplied is marked as missing, never filled in', () => {
  assert.equal(byId('M1').outputStatus, 'partial');
  assert.equal(byId('M1').output[0].kind, 'gap');
  assert.equal(linesOf(byId('M1'))[0].startsWith('[STATED_CONSTRAINTS]'), true);

  for (const id of ['M2', 'M3', 'HANDOFF']) {
    const step = byId(id);
    assert.equal(step.outputStatus, 'not-captured', id);
    assert.equal(hasOutput(step), false, `${id} must not contain output lines`);
    assert.ok(step.output.every((o) => o.kind === 'gap'), id);
  }
});

test('the handoff is an open stage, not a simulated success', () => {
  const handoff = byId('HANDOFF');
  assert.equal(handoff.provenance, 'pending');
  assert.equal(handoff.command, null);
  assert.equal(capturedSteps.at(-1), handoff);
  assert.equal(storySteps.at(-1), handoff);
  assert.doesNotMatch(visibleText(handoff), /Velra restored|✓/);
  assert.equal(MODES.captured.phases.at(-1)?.pending, true);
});

test("every inspector evidence line is quoted from that step's own output", () => {
  for (const step of [...capturedSteps, ...documentedSteps]) {
    const output = linesOf(step);
    for (const field of step.inspector.fields) {
      for (const quote of field.evidence ?? []) {
        assert.ok(
          output.some((line) => line.includes(quote)),
          `${step.id} / ${field.label}: evidence not found in output: ${quote}`,
        );
      }
    }
  }
});

/* ---------------------------------------------------------------- privacy */

test('no private pattern appears anywhere in the captured data', () => {
  const json = JSON.stringify(captured, null, 2);
  for (const { name, pattern } of FORBIDDEN_PATTERNS) {
    assert.doesNotMatch(json, pattern, `captured.json matches the ${name} pattern`);
  }
  for (const step of capturedSteps) {
    const text = visibleText(step);
    for (const { name, pattern } of FORBIDDEN_PATTERNS) {
      assert.doesNotMatch(text, pattern, `${step.id} matches the ${name} pattern`);
    }
  }
});

test('every redaction is explicit, counted and explained', () => {
  for (const step of capturedSteps) {
    const text = [step.prompt, step.command ?? '', ...linesOf(step)].join('\n');
    const declared = new Map(step.redactions.map((r) => [r.kind, r.count]));

    for (const kind of Object.keys(REDACTION_TOKEN) as RedactionKind[]) {
      assert.equal(
        countRedactions(text, kind),
        declared.get(kind) ?? 0,
        `${step.id}: ${kind} placeholders in the text do not match the redaction metadata`,
      );
      assert.ok(REDACTION_INFO[kind].label && REDACTION_INFO[kind].reason, `${kind} has no explanation`);
    }
    assert.equal(
      step.provenance,
      step.id === 'HANDOFF' ? 'pending' : declared.size ? 'captured-redacted' : 'captured',
      step.id,
    );
  }
});

test('placeholders are short, distinct, and cannot be confused with real output', () => {
  const tokens = Object.values(REDACTION_TOKEN);
  assert.equal(new Set(tokens).size, tokens.length);
  for (const token of Object.keys(PLACEHOLDER_KIND)) assert.match(token, /^<[a-z-]+>$/);
  // Velra prints `<name>` itself. That is output, and must not be drawn as a redaction.
  assert.doesNotMatch('velra inspect --section <name>', PLACEHOLDER);
  assert.match('velra inspect --session <session-id>', PLACEHOLDER);
});

test('session titles are redacted or null, and every session id is a placeholder', () => {
  for (const id of ['J', 'L']) {
    for (const line of linesOf(byId(id))) {
      if (line.includes('"title"')) assert.match(line, /"title": (null|"<session-title>"),$/);
      if (line.includes('"session_id"')) assert.match(line, /"session_id": "<session-id>",$/);
    }
  }
});

/* ---------------------------------------------------- captured vs documented */

test('the documented example and the captured run never share a figure', () => {
  for (const step of capturedSteps) {
    assert.doesNotMatch(visibleText(step), /\b711\b/, `${step.id} mentions the documented figure`);
    assert.equal(step.mode, 'captured');
    assert.notEqual(step.provenance, 'documented');
  }
  for (const step of documentedSteps) {
    assert.doesNotMatch(visibleText(step), /\b719\b/, `${step.id} mentions the captured figure`);
    assert.equal(step.mode, 'documented');
    assert.equal(step.provenance, 'documented');
    assert.ok(step.source.href?.startsWith('https://github.com/aryanghai12/Velra/'), step.id);
  }
  assert.match(visibleText(byId('M2')), /\b719\b/);
});

test('views have unique step ids and every step sits in a known phase', () => {
  assert.deepEqual(MODE_ORDER, ['story', 'captured', 'documented']);
  for (const mode of Object.values(MODES)) {
    assert.equal(stepsFor(mode.id), mode.steps);
    const ids = mode.steps.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, `${mode.id} has duplicate step ids`);
    const phases = new Set(mode.phases.map((p) => p.id));
    for (const step of mode.steps) assert.ok(phases.has(step.phase), `${step.id}: ${step.phase}`);
    for (const phase of mode.phases) {
      assert.ok(mode.steps.some((s) => s.phase === phase.id), `${mode.id}: phase ${phase.id} has no steps`);
    }
  }
});

/* ------------------------------------------------------------------- copy */

test('copy output returns exactly the supplied lines', () => {
  for (const step of capturedSteps.filter((s) => s.id !== 'HANDOFF')) {
    const entry = captured.entries.find((e) => e.id === step.id);
    assert.ok(entry, step.id);
    assert.equal(commandText(step), entry.command, step.id);
    assert.deepEqual(linesOf(step), entry.output, step.id);
    if (step.output.every((o) => o.kind === 'line')) {
      assert.equal(outputText(step), entry.output.join('\n'), step.id);
    }
  }
});

test('a copied partial output carries its marker, so it cannot pass for complete', () => {
  const copied = outputText(byId('M1'));
  assert.ok(copied.startsWith('[The start of this output was not supplied.'));
  assert.ok(copied.endsWith('</VELRA_WORKSPACE_STATE>'));
});

test('no em dash appears in anything written for this page', () => {
  // Quoted Velra output is exempt: two documented lines contain one, verbatim.
  for (const step of [...capturedSteps, ...documentedSteps]) {
    const written = [
      step.title,
      step.explain,
      step.note ?? '',
      step.contextLabel ?? '',
      step.source.label,
      step.inspector.heading,
      step.inspector.summary,
      ...step.inspector.fields.flatMap((f) => [f.label, f.value, f.detail ?? '']),
      ...step.output.filter((o) => o.kind === 'gap').map((o) => o.text),
    ].join('\n');
    assert.doesNotMatch(written, EM_DASH, `${step.id} has an em dash in written copy`);
  }
  for (const mode of Object.values(MODES)) {
    const written = [mode.label, mode.provenance, mode.description, ...mode.phases.flatMap((p) => [p.label, p.caption])];
    assert.doesNotMatch(written.join('\n'), EM_DASH);
  }
  for (const step of capturedSteps) {
    assert.doesNotMatch(outputText(step), EM_DASH, `${step.id}: captured output has no em dash`);
  }
});

/* -------------------------------------------------------------- sanitizer */

const FIXTURE = [
  '## Transcript A: sample',
  '```text',
  'PS C:\\Users\\sample\\Work> tool status',
  '',
  '  Binary:      C:\\Users\\sample\\\\.tool\\bin.exe',
  '',
  '  Database:    0 KiB',
  '',
  'PS C:\\Users\\sample\\Work> tool --version',
  '',
  'tool 1.0.0',
  '```',
  ...['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].flatMap((s) => [
    `## Transcript ${s}: sample`,
    '```text',
    'PS C:\\Users\\sample\\Work> tool noop',
    '',
    'ok',
    '```',
  ]),
  '## Transcript J: sample',
  '```json',
  '{',
  '  "workspace_id": "0123456789abcdef",',
  '  "workspace_root": "C:/Users/sample/Work",',
  '  "sessions": [{ "session_id": "11111111-2222-3333-4444-555555555555", "title": "Secret plan", "has_state": false }]',
  '}',
  '```',
  '## Transcript K: sample',
  '```text',
  'a', 'b', 'c', '', 'd', 'e', 'f', 'g',
  '```',
  '```text',
  'out-a', 'out-b', 'out-c', 'out-d', '/home/sample/bin/tool',
  '```',
  '## Transcript L: sample',
  '```json',
  '{',
  '  "workspace_root": "/home/sample/private-project",',
  '  "title": null',
  '}',
  '```',
  '## Transcript M: sample',
  '```text',
  '❯ tool inspect --session 11111111-2222-3333-4444-555555555555',
  '❯ tool restore --session 11111111-2222-3333-4444-555555555555',
  '```',
  '```text',
  '[STATED_CONSTRAINTS] (OBSERVED | user prompt)',
  '- turn 0 01:15 | "Never ship on a Friday."',
  '[LATEST_MESSAGE] (OBSERVED | user prompt | 01:16)',
  'Rewrite the confidential memo.',
  '[WORKSPACE_STATE]',
  'no git | 2 edits this task | last test run: none',
  '[RECENT_EDITS] (OBSERVED)',
  '- notes/confidential.md | +3/-1 lines | 01:24 | afterward: no test run yet',
  '</TOOL_STATE>',
  '```',
  '## Display requirements',
  '```text',
  'this block is not a transcript',
  '```',
].join('\r\n');

test('the sanitizer redacts, counts, and keeps everything else in order', () => {
  const built = buildCaptured(FIXTURE);
  const get = (id: string) => built.entries.find((e) => e.id === id)!;

  assert.deepEqual(get('A1'), {
    id: 'A1',
    section: 'A',
    prompt: 'PS ~\\Work>',
    command: 'tool status',
    // Interior blank lines are kept; the ones around the block are trimmed.
    output: ['  Binary:      ~\\\\.tool\\bin.exe', '', '  Database:    0 KiB'],
    redactions: { USER_HOME_REDACTED: 2 },
  });
  assert.deepEqual(get('A2').output, ['tool 1.0.0']);

  assert.deepEqual(get('J').output, [
    '{',
    '  "workspace_id": "<workspace-id>",',
    '  "workspace_root": "~/Work",',
    '  "sessions": [{ "session_id": "<session-id>", "title": "<session-title>", "has_state": false }]',
    '}',
  ]);

  // Pairing follows the manifest: the fifth and seventh commands printed nothing.
  assert.deepEqual(
    ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7'].map((id) => get(id).output),
    [['out-a'], ['out-b'], ['out-c'], ['out-d'], [], ['~/bin/tool'], []],
  );

  assert.deepEqual(get('L').output, [
    '{',
    '  "workspace_root": "<workspace-path>",',
    '  "title": null',
    '}',
  ]);

  assert.equal(get('M1').command, 'tool inspect --session <session-id>');
  assert.deepEqual(get('M1').output, [
    '[STATED_CONSTRAINTS] (OBSERVED | user prompt)',
    '- turn 0 01:15 | "<prompt-text>"',
    '[LATEST_MESSAGE] (OBSERVED | user prompt | 01:16)',
    '<prompt-text>',
    '[WORKSPACE_STATE]',
    'no git | 2 edits this task | last test run: none',
    '[RECENT_EDITS] (OBSERVED)',
    '- <file-path> | +3/-1 lines | 01:24 | afterward: no test run yet',
    '</TOOL_STATE>',
  ]);
  assert.deepEqual(get('M2').output, [], 'only the first command owns the excerpt');

  const json = JSON.stringify(built);
  assert.deepEqual(findLeaks(json, privateStrings(FIXTURE)), []);
  assert.equal(
    findLeaks('x C:\\\\Users\\\\sample y', privateStrings(FIXTURE)).length,
    1,
    'escaped spellings are caught',
  );
  assert.ok(privateStrings(FIXTURE).includes('Never ship on a Friday.'));
  assert.ok(privateStrings(FIXTURE).includes('notes/confidential.md'));
  assert.ok(privateStrings(FIXTURE).includes('/home/sample/private-project'));
  assert.ok(!json.includes('this block is not a transcript'));
});

test('the sanitizer refuses a source that does not match its manifest', () => {
  assert.throws(() => buildCaptured('## Transcript A: empty\n'), /Transcript A/);
});

/* ------------------------------------------------- parity with the raw pack */

const RAW = join(__dirname, '..', '..', SOURCE_FILE);
const haveRaw = existsSync(RAW);
const skip = haveRaw ? false : `${SOURCE_FILE} is local-only and not present`;

test('captured.json matches what the sanitizer produces from the raw pack', { skip }, () => {
  assert.deepEqual(buildCaptured(readFileSync(RAW, 'utf8')), captured);
});

test('no private value from the raw pack survives into any step', { skip }, () => {
  const secrets = privateStrings(readFileSync(RAW, 'utf8'));
  assert.ok(secrets.length > 40, 'the raw pack should yield a meaningful list of private values');
  const everything =
    JSON.stringify(captured) + '\n' + [...capturedSteps, ...documentedSteps].map(visibleText).join('\n');
  assert.equal(findLeaks(everything, secrets).length, 0, 'a private value from the raw pack is present in public data');
});

test('every shown output line is exactly what the raw pack yields', { skip }, () => {
  const built = buildCaptured(readFileSync(RAW, 'utf8'));
  for (const step of capturedSteps.filter((s) => s.id !== 'HANDOFF')) {
    const entry = built.entries.find((e) => e.id === step.id);
    assert.ok(entry, step.id);
    assert.deepEqual(linesOf(step), entry.output, step.id);
  }
  assert.equal(built.entries.length, 23);
});
