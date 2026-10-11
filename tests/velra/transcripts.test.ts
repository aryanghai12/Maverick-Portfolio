/**
 * Integrity checks for the transcript data behind the /velra replay.
 *
 * Run with `npm test`. The aim is that a claim on the page cannot drift away
 * from the output it is based on, that the command lists stay clean, and that
 * nothing private can be committed by accident. The last group compares
 * against the raw source pack, which is a local, gitignored file, and is
 * skipped on machines that do not have it.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import capturedJson from '../../data/velra/captured.json';
import { HANDOFF_GUIDE, STATUS_COMMAND, VERIFICATION_PROMPT } from '../../lib/velra/handoff';
import { PUBLISHED } from '../../lib/velra/published';
import {
  FORBIDDEN_PATTERNS,
  REDACTION_TOKEN,
  SOURCE_FILE,
  buildCaptured,
  findLeaks,
  privateStrings,
  publish,
  type CapturedFile,
  type RedactionKind,
} from '../../lib/velra/sanitize';
import {
  CAPSULE_LIMITS,
  MODES,
  MODE_ORDER,
  PLACEHOLDER,
  PLACEHOLDER_KIND,
  REDACTION_INFO,
  STAGING_STEP,
  commandText,
  countRedactions,
  hasOutput,
  outputText,
  stagedSummary,
  stepsFor,
} from '../../lib/velra/transcripts';
import type { Guide, Step } from '../../lib/velra/types';

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

/** Every string a guide puts on screen, the text it offers to copy included. */
function guideText(guide: Guide | undefined): string[] {
  if (!guide) return [];
  return [
    guide.label,
    guide.lead.kicker,
    ...guide.lead.headline,
    guide.lead.body,
    guide.lead.note,
    ...guide.parts.flatMap((p) => [
      p.id,
      p.title,
      ...p.body,
      ...(p.requirements ?? []),
      ...(p.snippet ? [p.snippet.caption, p.snippet.text, p.snippet.copyLabel, p.snippet.copied] : []),
      ...(p.after ?? []),
      ...(p.establishes ?? []).flatMap((e) => [e.check, e.shows]),
      p.caveat ?? '',
    ]),
    guide.disclaimer,
  ];
}

/** Every string a visitor could be shown for a step. */
function visibleText(step: Step): string {
  return [
    ...guideText(step.guide),
    step.inspector.kicker ?? '',
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
const SETUP = ['A1', 'A3', 'C', 'D'];
const SESSION = ['N2', 'N3', 'N4', 'N5', 'N10', 'N11', 'N12', 'N13'];

/* ------------------------------------------------------- what is published */

test('the data holds exactly the published executions, in the order they were run', () => {
  assert.deepEqual([...PUBLISHED], [...SETUP, ...SESSION]);
  assert.deepEqual(captured.entries.map((e) => e.id), [...PUBLISHED]);
});

test('the walkthrough is eight steps, in the order they were run, ending on the handoff guide', () => {
  assert.deepEqual(
    storySteps.map((s) => s.id),
    ['A1', 'D', 'N2', 'N4', 'N5', 'N11', 'N13', 'HANDOFF'],
  );
  assert.deepEqual(
    storySteps.map((s) => s.command),
    [
      'npm install -g velra',
      'velra enable',
      'velra doctor',
      'velra restore --list --json',
      'velra inspect --session <session-id>',
      'velra restore --session <session-id>',
      'velra status',
      null,
    ],
  );
  const positions = storySteps.map((s) => capturedSteps.indexOf(s));
  assert.ok(positions.every((p, i) => p >= 0 && (i === 0 || p > positions[i - 1])));
});

test('all commands: every distinct Velra command, once, in order, then the handoff', () => {
  assert.deepEqual(capturedSteps.map((s) => s.id), [...SETUP, ...SESSION, 'HANDOFF']);
  assert.deepEqual(
    capturedSteps.map((s) => s.command),
    [
      'npm install -g velra',
      'velra --version',
      'velra disable',
      'velra enable',
      'velra doctor',
      'velra inspect',
      'velra restore --list --json',
      'velra inspect --session <session-id>',
      'velra restore --session <session-id> --dry-run',
      'velra restore --session <session-id>',
      'velra restore',
      'velra status',
      null,
    ],
  );
});

test('no command appears twice in any view', () => {
  for (const mode of Object.values(MODES)) {
    const commands = mode.steps.map((s) => s.command).filter((c): c is string => c !== null);
    const repeated = commands.filter((c, i) => commands.indexOf(c) !== i);
    assert.deepEqual(repeated, [], `${mode.id} repeats: ${repeated.join(', ')}`);
    const titles = mode.steps.map((s) => s.title);
    assert.equal(new Set(titles).size, titles.length, `${mode.id} repeats a step title`);
  }
});

test('nothing mistyped, failed or unrelated is shown', () => {
  for (const mode of Object.values(MODES)) {
    for (const step of mode.steps) {
      if (step.command === null) continue;
      assert.match(
        step.command,
        /^(velra\b|npm install -g velra$|claude$)/,
        `${mode.id}/${step.id}: ${step.command}`,
      );
      // Every flag used is one Velra has.
      for (const flag of step.command.match(/--[^\s]*/g) ?? []) {
        assert.ok(
          ['--version', '--list', '--json', '--session', '--dry-run', '--section'].includes(flag),
          `${mode.id}/${step.id} uses an unknown flag: ${flag}`,
        );
      }
    }
  }
  for (const step of capturedSteps) {
    const text = outputText(step);
    assert.doesNotMatch(text, /^error:/m, `${step.id} is a failed command`);
    assert.doesNotMatch(text, /unexpected argument|command not found|Cancelled/, step.id);
    assert.doesNotMatch(text, /No Velra database yet|no task state for any/, `${step.id} is an early warning`);
  }
  const shown = capturedSteps.map((s) => s.command ?? '').join('\n');
  for (const unrelated of ['vhs', 'ffmpeg', 'ttyd', 'command -v', 'claude --version']) {
    assert.ok(!shown.includes(unrelated), `an unrelated command is shown: ${unrelated}`);
  }
  // The one `claude` command is in the documented example, where it is the handoff itself.
  assert.deepEqual(
    Object.values(MODES).flatMap((m) => m.steps.filter((s) => s.command === 'claude').map((s) => s.id)),
    ['DOC-CLAUDE'],
  );
});

test('every published step has complete, real output and no editorial markers', () => {
  for (const id of PUBLISHED) {
    const step = byId(id);
    assert.equal(step.outputStatus, 'complete', id);
    assert.ok(hasOutput(step), id);
    assert.ok(step.output.every((o) => o.kind === 'line'), `${id} carries an editorial marker`);
    assert.equal(step.note, undefined, `${id} needs a caveat, so its output is not clean`);
  }
  for (const step of storySteps.slice(0, -1)) assert.equal(step.outputStatus, 'complete', step.id);
  assert.equal(storySteps.at(-1)?.outputStatus, 'not-captured');
});

test('the walkthrough reuses the captured steps, so the two views cannot disagree', () => {
  for (const step of storySteps) assert.equal(step, byId(step.id));
});

test('doctor shows the healthy run, with the database present', () => {
  const doctor = storySteps.find((s) => s.command === 'velra doctor');
  assert.ok(doctor);
  assert.equal(doctor.id, 'N2');
  assert.deepEqual(linesOf(doctor), [
    '✓ settings parse: ~\\.claude\\settings.json',
    '✓ binary: ~\\.velra\\cache\\v0.1.2\\x86_64-pc-windows-msvc\\velra.exe',
    '✓ 13 hook handlers registered across 10 events',
    '✓ database: WAL, schema v3',
    '✓ last hook event 1m ago',
    '✓ no recent errors',
  ]);
  assert.ok(linesOf(doctor).every((l) => l.startsWith('✓')), 'every check passes');
});

test('status shows the capsule staged, and each staging result is its own file', () => {
  assert.match(outputText(byId('N13')), /Staged: {6}objective, 2 dead ends, 8 files \(706 tokens\)/);
  assert.match(outputText(byId('N12')), /Select \[1-1\] \(q to cancel\): 1/);
  assert.match(outputText(byId('N12')), /✓ Staged objective/);
  assert.notEqual(linesOf(byId('N11'))[1], linesOf(byId('N12')).at(-3));
  assert.match(outputText(byId('N5')), /checkpoint="preview"/);
  assert.match(outputText(byId('N10')), /checkpoint="restore"/);
});

test('long outputs are complete, not summarised', () => {
  assert.doesNotThrow(() => JSON.parse(outputText(byId('N4'))));
  for (const id of ['N3', 'N5', 'N10']) {
    const lines = linesOf(byId(id));
    assert.equal(lines.length, 19, id);
    assert.ok(lines[0].startsWith('<VELRA_WORKSPACE_STATE'), id);
    assert.equal(lines.at(-1), '</VELRA_WORKSPACE_STATE>', id);
    const headers = lines.filter((l) => /^\[[A-Z_]+\]/.test(l)).map((l) => l.split(']')[0] + ']');
    assert.deepEqual(headers, [
      '[ABOUT_THIS_RECORD]',
      '[FIRST_MESSAGE]',
      '[STATED_CONSTRAINTS]',
      '[LATEST_MESSAGE]',
      '[WORKSPACE_STATE]',
      '[REVERTED_EDITS]',
      '[RECORD_DETAIL]',
    ], id);
  }
});

test('every step explains itself in plain words', () => {
  for (const step of [...capturedSteps, ...documentedSteps]) {
    assert.ok(step.title.length >= 8, `${step.id} has no real title`);
    assert.ok(step.explain.length >= 30, `${step.id} has no explanation`);
    assert.ok(step.explain.length <= 220, `${step.id}: the explanation is too long to scan`);
    assert.match(step.explain, /\.$/, `${step.id}: the explanation should be a sentence`);
    assert.ok(step.inspector.fields.length >= 2, `${step.id}: the inspector has nothing to say`);
  }
});

/* --------------------------------------------------------------- staging */

test('the staging figures are read from the output, never typed', () => {
  assert.equal(STAGING_STEP, byId('N11'));
  assert.deepEqual(stagedSummary(STAGING_STEP), {
    tokens: 706,
    parts: ['objective', '2 dead ends', '8 files'],
  });
  assert.deepEqual(stagedSummary(byId('N12')), stagedSummary(byId('N11')));
  assert.equal(stagedSummary(documentedSteps[0]).tokens, 711);
  // A step that staged nothing has no figure to show, and says so loudly.
  assert.throws(() => stagedSummary(byId('N10')), /does not read as a staging result/);
  assert.throws(() => stagedSummary(byId('N2')), /does not read as a staging result/);
  const { tokens } = stagedSummary(STAGING_STEP);
  assert.ok(tokens <= CAPSULE_LIMITS.target && CAPSULE_LIMITS.target < CAPSULE_LIMITS.ceiling);
});

/* ---------------------------------------------------------------- captures */

test('each capture keeps its own phase, and both are Windows', () => {
  const inPhase = (phase: string) => capturedSteps.filter((s) => s.phase === phase).map((s) => s.id);
  assert.deepEqual(inPhase('windows-setup'), SETUP);
  assert.deepEqual(inPhase('windows-session'), SESSION);
  assert.deepEqual(inPhase('handoff'), ['HANDOFF']);
  for (const step of capturedSteps) {
    assert.deepEqual([step.environment, step.shell], ['windows', 'PowerShell'], step.id);
    if (step.command) assert.doesNotMatch(outputText(step), /linux-musl/, step.id);
  }
  assert.match(outputText(byId('A3')), /x86_64-pc-windows-msvc/);
});

test('captures are never interleaved: each phase is one unbroken run', () => {
  for (const mode of [MODES.story, MODES.captured]) {
    const order = mode.steps.map((s) => s.phase).filter((p, i, all) => i === 0 || p !== all[i - 1]);
    assert.deepEqual(order, ['windows-setup', 'windows-session', 'handoff'], mode.id);
  }
});

/* ------------------------------------------------------- nothing invented */

test('the handoff is a guide, not a simulated success', () => {
  const handoff = byId('HANDOFF');
  assert.equal(handoff.provenance, 'guide');
  assert.equal(handoff.command, null);
  assert.equal(handoff.outputStatus, 'not-captured');
  // No output of any kind: nothing printed, and no marker standing in for it.
  assert.deepEqual(handoff.output, []);
  assert.equal(hasOutput(handoff), false);
  assert.equal(outputText(handoff), '');
  assert.equal(commandText(handoff), '');
  assert.equal(handoff.guide, HANDOFF_GUIDE);
  assert.equal(capturedSteps.at(-1), handoff);
  assert.equal(storySteps.at(-1), handoff);
  assert.equal(MODES.captured.phases.at(-1)?.guide, true);
  // It is the only guide. Every other step is a transcript.
  for (const step of [...capturedSteps, ...documentedSteps]) {
    assert.equal(step.guide !== undefined, step.id === 'HANDOFF', step.id);
    assert.equal(step.provenance === 'guide', step.id === 'HANDOFF', step.id);
  }
  // No captured step claims a delivery. Only the documented example shows one.
  for (const step of capturedSteps) assert.doesNotMatch(outputText(step), /Velra restored/, step.id);
});

test('the guide invents no output: no delivery line, no status listing, no reply', () => {
  const handoff = byId('HANDOFF');
  const written = [...guideText(handoff.guide), handoff.title, handoff.explain, handoff.source.label].join('\n');
  assert.doesNotMatch(written, /Velra restored|[✓✗⚡]/);
  assert.doesNotMatch(written, /VELRA_WORKSPACE_STATE|Last continuation|Continuations:|Staged:|ATTACHED|CONFIRMED/);
  assert.doesNotMatch(written, /\d+ (estimated )?tokens|\b706\b|\b711\b/);
  // Nothing is claimed to have been delivered, received or confirmed in this run.
  assert.doesNotMatch(written, /\b(was|has been|were) (delivered|received|confirmed|restored)\b/i);
  assert.doesNotMatch(written, /perfect memory|zero context loss|guaranteed|never forgets|flawless/i);
  // The only lines that look like output are quoted from the step that printed them.
  const quoted = handoff.inspector.fields.flatMap((f) => f.evidence ?? []);
  assert.equal(quoted.length, 2);
  for (const field of handoff.inspector.fields) {
    assert.equal(field.evidence !== undefined, field.tag === 'recorded', field.label);
  }
});

test('the guide says what it is, and that this run has no recording of the new session', () => {
  const handoff = byId('HANDOFF');
  assert.equal(
    handoff.explain,
    'The handoff is silent by design. Open a fresh Claude Code session in the same workspace. Velra delivers the staged capsule at startup, carrying forward the engineering context from your previous session.',
  );
  assert.equal(handoff.title, 'Start a new session');
  assert.match(HANDOFF_GUIDE.disclaimer, /a guide, not a recording/);
  assert.match(HANDOFF_GUIDE.disclaimer, /no capture of the new session/);
  assert.match(handoff.source.label, /No recording of the new session exists in this run/);
  assert.match(MODES.story.description, /then a guide/);
  assert.match(MODES.captured.description, /a guide, not a capture/);
  // Silence is expected, and is not treated as failure.
  assert.deepEqual(HANDOFF_GUIDE.lead.headline, [
    'No popup.',
    'No manual copy-paste.',
    'No need to explain the task all over again.',
  ]);
  assert.match(HANDOFF_GUIDE.lead.note, /does not, by itself, mean the handoff failed/);
});

test('the guide is three steps: open a session, ask Claude, check status', () => {
  const [open, ask, verify] = HANDOFF_GUIDE.parts;
  assert.deepEqual(HANDOFF_GUIDE.parts.map((p) => p.id), ['A', 'B', 'C']);
  assert.deepEqual(
    HANDOFF_GUIDE.parts.map((p) => p.title),
    ['Open Claude Code', 'Ask Claude what it received', 'Verify delivery independently'],
  );

  assert.deepEqual(open.requirements, ['Same workspace', 'New session']);
  assert.equal(open.snippet, undefined, 'opening a session is not a command to copy');
  assert.match((open.after ?? []).join(' '), /do not run `velra restore` again/);

  assert.equal(ask.snippet?.kind, 'prompt');
  assert.equal(ask.snippet?.text, VERIFICATION_PROMPT);
  assert.equal(ask.snippet?.copyLabel, 'Copy verification prompt');
  assert.match((ask.after ?? []).join(' '), /absent, that is useful evidence too/);
  assert.match((ask.after ?? []).join(' '), /do not expect perfect recall/);

  assert.equal(verify.snippet?.kind, 'command');
  assert.equal(verify.snippet?.text, STATUS_COMMAND);
  assert.equal(STATUS_COMMAND, 'velra status');
  assert.match(verify.body.join(' '), /PowerShell after the new session has started/);
  assert.match((verify.after ?? []).join(' '), /continuation delivery confirmation associated with `session_start`/);
  // Delivery and reported context are two different things, and neither is understanding.
  assert.deepEqual(verify.establishes, [
    { check: '`velra status`', shows: 'Evidence of delivery.' },
    { check: "Claude's answer", shows: 'Evidence of what context it can report.' },
  ]);
  assert.equal(
    verify.caveat,
    'A delivery confirmation alone does not prove that the model understood or used every detail.',
  );
  // The only command the guide asks for is the status check. Restore is not run again.
  const snippets = HANDOFF_GUIDE.parts.flatMap((p) => (p.snippet ? [p.snippet.text] : []));
  assert.deepEqual(snippets, [VERIFICATION_PROMPT, 'velra status']);
});

test('the verification prompt is copied exactly as written', () => {
  assert.equal(
    VERIFICATION_PROMPT,
    [
      'Before inspecting the repository, opening files, running commands, or using git, summarize the task context that was supplied to you at the start of this session.',
      '',
      'Include:',
      '1. The original task objective.',
      '2. Important constraints and requirements.',
      '3. Relevant files and the work already attempted.',
      '4. Failures, test results, and rejected approaches.',
      '5. The current state and the intended next step.',
      '',
      'Use only the context available to you before inspecting the repository. Clearly identify information that is missing or uncertain. Do not fill gaps with assumptions. Stop after giving this report.',
    ].join('\n'),
  );
  assert.doesNotMatch(VERIFICATION_PROMPT, /<[a-z-]+>|\r/, 'no placeholder and no stray carriage return');
});

test('the verification sequence marks only what this run recorded', () => {
  const { inspector } = byId('HANDOFF');
  assert.equal(inspector.kicker, 'How to verify');
  assert.equal(inspector.sequence, true);
  assert.deepEqual(
    inspector.fields.map((f) => [f.value, f.tag]),
    [
      ['Capsule staged by the previous session', 'recorded'],
      ['Fresh session opened in the same workspace', 'to-verify'],
      ['Delivery checked with velra status', 'to-verify'],
      ["Context checked through Claude's response", 'to-verify'],
    ],
  );
  // The one recorded item is backed by the real staging result, read from that step.
  const [staged] = inspector.fields;
  assert.equal(staged.evidenceFrom, STAGING_STEP.id);
  assert.deepEqual(staged.evidence, [linesOf(STAGING_STEP)[0], linesOf(STAGING_STEP).at(-1)]);
  assert.match(staged.evidence?.[0] ?? '', /^✓ Staged objective/);
  // Only a guide uses these two tags, and no other inspector is a numbered sequence.
  for (const step of [...capturedSteps, ...documentedSteps]) {
    if (step.id === 'HANDOFF') continue;
    assert.notEqual(step.inspector.sequence, true, step.id);
    for (const field of step.inspector.fields) {
      assert.ok(field.tag !== 'recorded' && field.tag !== 'to-verify', `${step.id} / ${field.label}`);
      assert.equal(field.evidenceFrom, undefined, `${step.id} / ${field.label}`);
    }
  }
});

test('a copied marker is bracketed, so it cannot pass for output', () => {
  // No published step carries a marker now, so the rule is checked on a made-up one.
  const marked: Step = {
    ...byId('N2'),
    output: [
      { kind: 'gap', text: 'The rest was not supplied.' },
      { kind: 'line', text: 'a real line' },
    ],
  };
  assert.equal(outputText(marked), '[The rest was not supplied.]\na real line');
});

test('every inspector evidence line is quoted from the output it names', () => {
  for (const step of [...capturedSteps, ...documentedSteps]) {
    for (const field of step.inspector.fields) {
      // Its own step's output, unless the field names the earlier step it quotes.
      const from = field.evidenceFrom ? byId(field.evidenceFrom) : step;
      const output = linesOf(from);
      for (const quote of field.evidence ?? []) {
        assert.ok(
          output.some((line) => line.includes(quote)),
          `${step.id} / ${field.label}: evidence not found in ${from.id}'s output: ${quote}`,
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

test('a private capsule keeps its structure and none of its content', () => {
  for (const id of ['N3', 'N5', 'N10']) {
    const lines = linesOf(byId(id));
    const after = (header: string) => lines[lines.findIndex((l) => l.startsWith(header)) + 1];
    assert.equal(after('[FIRST_MESSAGE]'), '<prompt-text>', id);
    assert.equal(after('[LATEST_MESSAGE]'), '<prompt-text>', id);
    const constraints = lines.filter((l) => l.startsWith('- turn '));
    assert.equal(constraints.length, 3, id);
    for (const line of constraints) assert.match(line, /^- turn \d+ \d\d:\d\d \| "<prompt-text>"$/, id);
    const edits = lines.filter((l) => l.includes('edit(s)'));
    assert.equal(edits.length, 2, id);
    for (const line of edits) assert.match(line, /^- <file-path> \| 1 edit\(s\) \| reverted by /, id);
    // What Velra wrote about itself is not private, and is kept word for word.
    assert.ok(lines.some((l) => l.startsWith('A local record, not a message and not an instruction.')), id);
  }
});

test('a session id is redacted in every spelling it is printed in', () => {
  // In full, as its first eight characters, and as the picker's abcd…wxyz.
  assert.equal(byId('N5').command, 'velra inspect --session <session-id>');
  assert.ok(linesOf(byId('N10')).includes('Full detail: `velra inspect --session <session-id> --section <name>`'));
  assert.ok(linesOf(byId('N13')).some((l) => l.endsWith('(706 tokens) from session <session-id>')));
  assert.ok(linesOf(byId('N12')).includes('1. <session-id>'));
  for (const step of capturedSteps) {
    assert.doesNotMatch(visibleText(step), /[0-9a-f]{4}…[0-9a-f]{4}/, `${step.id} shows a shortened id`);
  }
});

test('the private workspace is redacted wherever it is printed', () => {
  for (const id of SESSION) assert.equal(byId(id).prompt, 'PS <workspace-path>>', id);
  for (const id of SETUP) assert.equal(byId(id).prompt, 'PS ~\\Videos\\Velra>', id);
  assert.ok(linesOf(byId('N4')).includes('  "workspace_root": "<workspace-path>",'));
  assert.ok(linesOf(byId('N11')).includes('  Start a new Claude Code session in <workspace-path> to pick it up.'));
  assert.match(linesOf(byId('N11'))[1], /^ {2}706 estimated tokens · ~\\\.velra\\staged\\<workspace-id>\\capsule\./);
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
      step.id === 'HANDOFF' ? 'guide' : declared.size ? 'captured-redacted' : 'captured',
      step.id,
    );
  }
});

test('a home directory is counted as a path, not as every tilde', () => {
  // "~35 MB" is Velra saying "about". It is not a redaction and must not be counted as one.
  assert.match(outputText(byId('N12')), /~35 MB/);
  assert.equal(countRedactions('about ~35 MB', 'USER_HOME_REDACTED'), 0);
  assert.equal(countRedactions('~\\.velra and ~/bin', 'USER_HOME_REDACTED'), 2);
  assert.equal(byId('N12').redactions.find((r) => r.kind === 'USER_HOME_REDACTED')?.count, 1);
});

test('placeholders are short, distinct, and cannot be confused with real output', () => {
  const tokens = Object.values(REDACTION_TOKEN);
  assert.equal(new Set(tokens).size, tokens.length);
  for (const token of Object.keys(PLACEHOLDER_KIND)) assert.match(token, /^<[a-z-]+>$/);
  // Velra prints `<name>` itself. That is output, not a redaction.
  assert.doesNotMatch('velra inspect --section <name>', PLACEHOLDER);
  assert.doesNotMatch('Usage: velra.exe restore --session <SESSION> --dry-run', PLACEHOLDER);
  assert.match('velra inspect --session <session-id>', PLACEHOLDER);
  assert.ok(linesOf(byId('N5')).includes('Full detail for any section: `velra inspect --section <name>`'));
});

test('session ids and titles in a listing are placeholders or null', () => {
  const lines = linesOf(byId('N4'));
  assert.ok(lines.includes('      "session_id": "<session-id>",'));
  assert.ok(lines.includes('      "title": null,'));
  assert.ok(lines.includes('  "workspace_id": "<workspace-id>",'));
});

test('the copy artifact in the first capture is undone', () => {
  // Rendered Markdown wrote "\." as "\\.". The later plain-text capture shows the real form.
  for (const step of capturedSteps) {
    assert.doesNotMatch(outputText(step), /\\\\\./, `${step.id} still has a doubled backslash`);
  }
  assert.ok(linesOf(byId('D')).some((l) => l.startsWith('  Settings: ~\\.claude\\settings.json')));
  assert.ok(linesOf(byId('N2')).includes('✓ settings parse: ~\\.claude\\settings.json'));
});

/* ---------------------------------------------------- captured vs documented */

test('the documented example and the captured run never share a figure', () => {
  for (const step of capturedSteps) {
    assert.doesNotMatch(visibleText(step), /\b711\b/, `${step.id} mentions the documented figure`);
    assert.equal(step.mode, 'captured');
    assert.notEqual(step.provenance, 'documented');
  }
  for (const step of documentedSteps) {
    assert.doesNotMatch(visibleText(step), /\b706\b/, `${step.id} mentions the captured figure`);
    assert.equal(step.mode, 'documented');
    assert.equal(step.provenance, 'documented');
    assert.ok(step.source.href?.startsWith('https://github.com/aryanghai12/Velra/'), step.id);
  }
  assert.match(visibleText(byId('N11')), /\b706\b/);
  for (const step of capturedSteps.filter((s) => s.phase !== 'windows-session')) {
    assert.doesNotMatch(visibleText(step), /\b706\b/, `${step.id} borrows the session figure`);
  }
});

test('views have unique step ids and every phase has steps', () => {
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
  for (const entry of captured.entries) {
    const step = byId(entry.id);
    assert.equal(commandText(step), entry.command, entry.id);
    assert.deepEqual(linesOf(step), entry.output, entry.id);
    assert.equal(outputText(step), entry.output.join('\n'), entry.id);
  }
});

test('no em dash appears in anything written for this page', () => {
  for (const step of [...capturedSteps, ...documentedSteps]) {
    const written = [
      step.title,
      step.explain,
      step.note ?? '',
      step.contextLabel ?? '',
      step.source.label,
      step.inspector.kicker ?? '',
      step.inspector.heading,
      step.inspector.summary,
      ...step.inspector.fields.flatMap((f) => [f.label, f.value, f.detail ?? '']),
      ...step.output.filter((o) => o.kind === 'gap').map((o) => o.text),
      ...guideText(step.guide),
    ].join('\n');
    assert.doesNotMatch(written, EM_DASH, `${step.id} has an em dash in written copy`);
  }
  for (const mode of Object.values(MODES)) {
    const written = [mode.label, mode.provenance, mode.description, ...mode.phases.flatMap((p) => [p.label, p.caption])];
    assert.doesNotMatch(written.join('\n'), EM_DASH);
  }
});

test('the only em dashes are in lines Velra itself printed', () => {
  // Velra's picker title and its Staged line both use one. They are output, quoted exactly.
  const withDash = (steps: Step[]) => steps.filter((s) => EM_DASH.test(outputText(s))).map((s) => s.id);
  assert.deepEqual(withDash(capturedSteps), ['N12', 'N13']);
  assert.deepEqual(withDash(documentedSteps), ['DOC-STATUS', 'DOC-CLAUDE']);
  assert.ok(linesOf(byId('N12'))[0].startsWith('Velra '));
});

/* -------------------------------------------------------------- sanitizer */

const UUID_A = '11111111-2222-3333-4444-555555555555';
const UUID_B = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

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
  '## Transcript B: sample, copied through rendered Markdown',
  '```text',
  'PS C:\\Users\\sample\\Work> tool where',
  '',
  'Settings: C:\\Users\\sample\\\\.tool\\settings.json',
  '```',
  ...['C', 'D', 'E', 'F', 'G', 'H', 'I'].flatMap((s) => [
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
  `  "sessions": [{ "session_id": "${UUID_A}", "title": "Secret plan", "has_state": false }]`,
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
  `❯ tool inspect --session ${UUID_A}`,
  `❯ tool restore --session ${UUID_A}`,
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
  '</VELRA_WORKSPACE_STATE>',
  '```',
  '## Transcript N: sample working session',
  '```text',
  'tool status',
  'Staged: nothing',
  'PS C:\\Users\\sample\\Secret-Project> tool list --json',
  '{',
  '  "workspace_id": "fedcba9876543210",',
  '  "workspace_root": "C:/Users/sample/Secret-Project",',
  `  "sessions": [{ "session_id": "${UUID_B}", "title": null, "has_state": true }]`,
  '}',
  `PS C:\\Users\\sample\\Secret-Project> tool inspect --session ${UUID_B}`,
  '<VELRA_WORKSPACE_STATE v="1" checkpoint="preview">',
  '[ABOUT_THIS_RECORD]',
  'A local record, not a message.',
  '[FIRST_MESSAGE] (OBSERVED | user prompt | 16:38)',
  '<pasted> My private opening message, which begins with an angle bracket.',
  '[REVERTED_EDITS] (OBSERVED)',
  '- src/private/thing.ts | 1 edit(s) | reverted by an unidentified change at 18:17',
  '[RECORD_DETAIL]',
  'Full detail: `tool inspect --session aaaaaaaa --section <name>`',
  '</VELRA_WORKSPACE_STATE>',
  'PS C:\\Users\\sample\\Secret-Project> tool restore',
  '1. aaaa…eeee',
  '   aaaa…eeee · state: yes · ~34 MB',
  '',
  `✓ Staged from session ${UUID_B}.`,
  '  12 estimated tokens · C:\\Users\\sample\\.tool\\staged\\fedcba9876543210\\capsule.json',
  '  Start a new session in C:/Users/sample/Secret-Project to pick it up.',
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
    // Transcript A is not marked as carrying the copy artifact, so its text is left alone.
    output: ['  Binary:      ~\\\\.tool\\bin.exe', '', '  Database:    0 KiB'],
    redactions: { USER_HOME_REDACTED: 2 },
  });
  assert.deepEqual(get('A2').output, ['tool 1.0.0']);

  // Transcript B is marked, so the doubled backslash before a dot is undone.
  assert.deepEqual(get('B').output, ['Settings: ~\\.tool\\settings.json']);

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
    '</VELRA_WORKSPACE_STATE>',
  ]);
  assert.deepEqual(get('M2').output, [], 'only the first command owns the excerpt');
});

test('the sanitizer handles a continuous session with a private workspace', () => {
  const built = buildCaptured(FIXTURE);
  const get = (id: string) => built.entries.find((e) => e.id === id)!;

  // The first command had no prompt line, and is still a command.
  assert.deepEqual(get('N1'), {
    id: 'N1',
    section: 'N',
    prompt: null,
    command: 'tool status',
    output: ['Staged: nothing'],
    redactions: {},
  });

  // The private workspace path goes, in the prompt and in the JSON, with either slash.
  assert.equal(get('N2').prompt, 'PS <workspace-path>>');
  assert.deepEqual(get('N2').output, [
    '{',
    '  "workspace_id": "<workspace-id>",',
    '  "workspace_root": "<workspace-path>",',
    '  "sessions": [{ "session_id": "<session-id>", "title": null, "has_state": true }]',
    '}',
  ]);

  // A message that begins with "<" is still a message, and is still redacted.
  assert.deepEqual(get('N3').output, [
    '<VELRA_WORKSPACE_STATE v="1" checkpoint="preview">',
    '[ABOUT_THIS_RECORD]',
    'A local record, not a message.',
    '[FIRST_MESSAGE] (OBSERVED | user prompt | 16:38)',
    '<prompt-text>',
    '[REVERTED_EDITS] (OBSERVED)',
    '- <file-path> | 1 edit(s) | reverted by an unidentified change at 18:17',
    '[RECORD_DETAIL]',
    'Full detail: `tool inspect --session <session-id> --section <name>`',
    '</VELRA_WORKSPACE_STATE>',
  ]);

  // Short ids, a workspace id inside a path, and a tilde that is not a home directory.
  assert.deepEqual(get('N4').output, [
    '1. <session-id>',
    '   <session-id> · state: yes · ~34 MB',
    '',
    '✓ Staged from session <session-id>.',
    '  12 estimated tokens · ~\\.tool\\staged\\<workspace-id>\\capsule.json',
    '  Start a new session in <workspace-path> to pick it up.',
  ]);
  assert.deepEqual(get('N4').redactions, {
    LOCAL_PATH_REDACTED: 2,
    SESSION_ID_REDACTED: 3,
    WORKSPACE_ID_REDACTED: 1,
    USER_HOME_REDACTED: 1,
  });
});

test('nothing private in the fixture survives, in any spelling', () => {
  const built = buildCaptured(FIXTURE);
  const secrets = privateStrings(FIXTURE);
  const json = JSON.stringify(built);
  assert.deepEqual(findLeaks(json, secrets), []);
  for (const { name, pattern } of FORBIDDEN_PATTERNS) {
    assert.doesNotMatch(JSON.stringify(built, null, 2), pattern, `the fixture output matches the ${name} pattern`);
  }
  for (const expected of [
    UUID_B,
    'aaaaaaaa',
    'aaaa…eeee',
    'fedcba9876543210',
    'C:/Users/sample/Secret-Project',
    'C:\\Users\\sample\\Secret-Project',
    '/home/sample/private-project',
    'Never ship on a Friday.',
    'notes/confidential.md',
    'src/private/thing.ts',
    '<pasted> My private opening message, which begins with an angle bracket.',
    'Secret plan',
  ]) {
    assert.ok(secrets.includes(expected), `the audit list is missing: ${expected}`);
  }
  // Velra's own words about itself are not secrets, and are not treated as such.
  assert.ok(!secrets.includes('A local record, not a message.'));
  assert.equal(findLeaks('x C:\\\\Users\\\\sample y', secrets).length, 1, 'escaped spellings are caught');
  assert.ok(!json.includes('this block is not a transcript'));
});

test('publishing keeps only the chosen executions, and refuses a bad selection', () => {
  const built = buildCaptured(FIXTURE);
  const chosen = publish(built, ['N3', 'A1', 'K5']);
  // Pack order, whatever order they were asked for in.
  assert.deepEqual(chosen.entries.map((e) => e.id), ['A1', 'K5', 'N3']);
  assert.equal(chosen.source, built.source);
  assert.deepEqual(chosen.entries[0], built.entries[0]);
  assert.throws(() => publish(built, ['A1', 'Z9']), /not found in the source pack: Z9/);
  assert.throws(() => publish(built, ['A1', 'A1']), /repeats an id/);
});

test('the sanitizer refuses a source that does not match its manifest', () => {
  assert.throws(() => buildCaptured('## Transcript A: empty\n'), /Transcript A/);
});

/* ------------------------------------------------- parity with the raw pack */

const RAW = join(__dirname, '..', '..', SOURCE_FILE);
const haveRaw = existsSync(RAW);
const skip = haveRaw ? false : `${SOURCE_FILE} is local-only and not present`;

test('captured.json matches what the sanitizer publishes from the raw pack', { skip }, () => {
  const everything = buildCaptured(readFileSync(RAW, 'utf8'));
  assert.equal(everything.entries.length, 38, 'the whole pack is still parsed and checked');
  assert.deepEqual(publish(everything, PUBLISHED), captured);
});

test('no private value from the raw pack survives into any step', { skip }, () => {
  // Every private value in the whole pack, published or not, must be absent.
  const secrets = privateStrings(readFileSync(RAW, 'utf8'));
  assert.ok(secrets.length > 100, 'the raw pack should yield a meaningful list of private values');
  const everything =
    JSON.stringify(captured) + '\n' + [...capturedSteps, ...documentedSteps].map(visibleText).join('\n');
  assert.equal(findLeaks(everything, secrets).length, 0, 'a private value from the raw pack is present in public data');
});

test('the unpublished executions really are the untidy ones', { skip }, () => {
  // A record of what was left out and why, so the selection can be re-examined.
  const everything = buildCaptured(readFileSync(RAW, 'utf8'));
  const left = everything.entries.filter((e) => !PUBLISHED.includes(e.id));
  const shownCommands = new Set(captured.entries.map((e) => e.command));
  for (const entry of left) {
    const text = entry.output.join('\n');
    const reason =
      !/^(velra\b|npm install -g velra$)/.test(entry.command) ? 'not a Velra command'
      : /--dry run|--dry-run-/.test(entry.command) ? 'a mistyped flag'
      : shownCommands.has(entry.command) ? 'a repeat of a published command'
      : entry.output.length === 0 || /^\[STATED/.test(text) ? 'output never fully supplied'
      : null;
    assert.ok(reason, `${entry.id} (${entry.command}) is unpublished without a reason`);
  }
});
