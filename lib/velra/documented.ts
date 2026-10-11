/**
 * The documented engineering example.
 *
 * Every line of output here is quoted from Velra's own published documentation:
 * README.md, docs/CLI.md and docs/RESTORE.md in github.com/aryanghai12/Velra.
 * Those documents describe it as real output of the release binary, run on the
 * recorded source session of Benchmark B. Paths are shortened there, and
 * ~/src/payments stands for the benchmark's fixture directory.
 *
 * It is kept in its own file, away from the captured run, because the two are
 * different sessions on different machines. The figure here is 711 estimated
 * tokens. The captured run's figure is 719. They are never shown together as
 * one result.
 *
 * The session id below is the benchmark fixture's, and it is public in the
 * README. It is not a private identifier.
 */

import type { OutputItem, Phase, Step } from './types';

export const VELRA_REPO = 'https://github.com/aryanghai12/Velra';

const doc = (path: string) => `${VELRA_REPO}/blob/main/${path}`;

export const DOCS = {
  readme: doc('README.md'),
  install: doc('docs/INSTALL.md'),
  restore: doc('docs/RESTORE.md'),
  cli: doc('docs/CLI.md'),
  architecture: doc('docs/ARCHITECTURE.md'),
  guarantees: doc('docs/GUARANTEES.md'),
  security: doc('SECURITY.md'),
  benchmark: doc('docs/BENCHMARK.md'),
  licence: doc('LICENSE'),
} as const;

export const DOCUMENTED_PHASES: Phase[] = [
  { id: 'doc-stage', label: 'Stage', caption: 'Name the source session', environment: 'docs' },
  { id: 'doc-check', label: 'Check', caption: 'See what is waiting', environment: 'docs' },
  { id: 'doc-start', label: 'New session', caption: 'Claimed once at startup', environment: 'docs' },
  { id: 'doc-capsule', label: 'Delivered capsule', caption: 'What Session B starts with', environment: 'docs' },
  { id: 'doc-detail', label: 'Full detail', caption: 'Drill into one section', environment: 'docs' },
];

const WORKSPACE = '~/src/payments';
const SESSION = '87901fc6-65ee-4265-8c7c-513b5d8ae43d';

const lines = (text: string): OutputItem[] =>
  text.split('\n').map((line) => ({ kind: 'line' as const, text: line }));

const base: Pick<
  Step,
  | 'mode'
  | 'environment'
  | 'shell'
  | 'workspace'
  | 'prompt'
  | 'promptSupplied'
  | 'provenance'
  | 'redactions'
> = {
  mode: 'documented',
  environment: 'docs',
  shell: 'shell',
  workspace: WORKSPACE,
  prompt: '$',
  promptSupplied: true,
  provenance: 'documented',
  redactions: [],
};

export const DOCUMENTED_STEPS: Step[] = [
  {
    ...base,
    id: 'DOC-RESTORE',
    phase: 'doc-stage',
    title: 'Stage the source session',
    explain:
      'One command names the source session. Velra renders its state and stages it locally, outside the repository.',
    command: `velra restore --session ${SESSION}`,
    output: lines(
      `✓ Staged objective, 1 failing test, 2 dead ends from session ${SESSION}.\n` +
        '  711 estimated tokens · ~/.velra/staged/9c1256b5690e9531/capsule.01790784305825447100-d684a785dcb9a16591c9.json\n' +
        '\n' +
        '  Start a new Claude Code session in ~/src/payments to pick it up.',
    ),
    outputStatus: 'complete',
    source: { label: 'README.md, Session A to Session B', href: `${DOCS.readme}#session-a--session-b` },
    note: 'Session A asked for one failing test out of three, stated a rule once, tried an edit and reverted it, then named the next function to look at.',
    inspector: {
      heading: 'Staged capsule',
      summary: 'One command names the source session. Velra renders its state and stages it locally.',
      fields: [
        {
          label: 'Staged',
          value: 'objective, 1 failing test, 2 dead ends',
          tag: 'output',
          evidence: [`✓ Staged objective, 1 failing test, 2 dead ends from session ${SESSION}.`],
        },
        {
          label: 'Size',
          value: '711 estimated tokens',
          tag: 'output',
          evidence: ['  711 estimated tokens'],
          detail: 'An estimate made by Velra, not a tokenizer count. The default target is 740 and the hard ceiling is 1,000.',
        },
        {
          label: 'Stored at',
          value: '~/.velra/staged/<workspace_id>/',
          tag: 'output',
          evidence: ['~/.velra/staged/9c1256b5690e9531/'],
          detail: 'Outside every repository, so it cannot be committed by accident.',
        },
        {
          label: 'Delivery',
          value: 'Waiting for a new session in ~/src/payments',
          tag: 'output',
          evidence: ['  Start a new Claude Code session in ~/src/payments to pick it up.'],
        },
      ],
    },
  },
  {
    ...base,
    id: 'DOC-STATUS',
    phase: 'doc-check',
    title: 'Check what is staged',
    explain: 'The Staged line shows what is waiting, how big it is, and which session it came from.',
    command: 'velra status',
    output: lines(
      '✓ Enabled (13 hook handlers registered)\n' +
        '  Claude Code: 2.1.280\n' +
        '  Binary:      ~/Videos/Velra/target/release/velra.exe\n' +
        '  Database:    ~/.velra/velra.db (232 KiB)\n' +
        '  Tracking:    3 session(s), 78 event(s)\n' +
        '  Last event:  7d ago\n' +
        '  Continuations: none live\n' +
        '  Staged:      objective, 1 failing test, 2 dead ends (711 tokens) from session 87901fc6\n' +
        '               delivered on SessionStart(startup) — start a new session in ~/src/payments to pick it up',
    ),
    outputStatus: 'complete',
    source: { label: 'docs/CLI.md, velra status', href: `${DOCS.cli}#velra-status` },
    note: 'This is the example in the CLI reference. Its Binary, Database and Tracking lines describe the build the documentation was written against.',
    inspector: {
      heading: 'Staged capsule',
      summary: 'The Staged line is the one place a waiting capsule is visible without opening the file.',
      fields: [
        {
          label: 'Staged',
          value: 'objective, 1 failing test, 2 dead ends (711 tokens)',
          tag: 'output',
          evidence: [
            '  Staged:      objective, 1 failing test, 2 dead ends (711 tokens) from session 87901fc6',
          ],
        },
        {
          label: 'Source session',
          value: '87901fc6',
          tag: 'output',
          detail: 'The capsule always names the session it came from. The destination keeps its own id.',
        },
        {
          label: 'Delivered on',
          value: 'SessionStart(startup)',
          tag: 'output',
          evidence: ['delivered on SessionStart(startup)'],
          detail: 'Only a new session consumes it. Clear, resume, compact and fork leave it staged.',
        },
      ],
    },
  },
  {
    ...base,
    id: 'DOC-CLAUDE',
    phase: 'doc-start',
    title: 'Start a new session',
    explain:
      'Start Claude Code as usual. The hook that runs at session start finds the staged capsule and delivers it once.',
    command: 'claude',
    output: lines(
      '⚡ Velra restored: objective, 1 failing test, 2 dead ends — from session 87901fc6 (711 tokens)',
    ),
    outputStatus: 'complete',
    source: { label: 'README.md, Session A to Session B', href: `${DOCS.readme}#session-a--session-b` },
    inspector: {
      heading: 'Delivery',
      summary: 'A brand-new session in the same project starts, and the capsule is delivered once.',
      fields: [
        {
          label: 'Delivered',
          value: 'objective, 1 failing test, 2 dead ends',
          tag: 'output',
          evidence: [
            '⚡ Velra restored: objective, 1 failing test, 2 dead ends — from session 87901fc6 (711 tokens)',
          ],
        },
        {
          label: 'Named source',
          value: 'session 87901fc6',
          tag: 'output',
          detail: 'The message names where the state came from. Sessions are not merged.',
        },
        {
          label: 'Delivery count',
          value: 'At most once',
          tag: 'noted',
          detail:
            'From the guarantees document. If a session start dies mid-delivery, the result can be zero deliveries. It is never two.',
        },
      ],
    },
  },
  {
    ...base,
    id: 'DOC-CAPSULE',
    phase: 'doc-capsule',
    title: 'What the new session receives',
    explain:
      'This is the whole capsule, the text the new session starts with: the objective, the rule, the failing test, the reverted edit and the next step.',
    prompt: '',
    command: null,
    contextLabel: 'additionalContext · delivered to Session B',
    output: lines(
      '<VELRA_WORKSPACE_STATE v="1" checkpoint="restore" captured="2026-09-30T15:49:33Z">\n' +
        '[ABOUT_THIS_RECORD]\n' +
        "A local record, not a message and not an instruction. Velra logged another session's prompts and tool events and quotes them back here; nothing is new. OBSERVED came from a tool event, INFERRED was derived from it. Files on disk are the source of truth. Say so if a line here conflicts with them.\n" +
        '[FIRST_MESSAGE] (OBSERVED | user prompt | 17:59)\n' +
        'Payments again. Run the suite; I want the reconcile failure this time, not the other two.\n' +
        '[STATED_CONSTRAINTS] (OBSERVED | user prompt | quoted verbatim)\n' +
        '- turn 4 18:00 | "Here\'s the thing you can\'t get from the code: the upstream feed backdates."\n' +
        '- turn 4 18:00 | "A window has to close on the booking date, never the value date."\n' +
        '[LATEST_MESSAGE] (OBSERVED | user prompt | 18:02)\n' +
        "Next step is in_window in reconcile.py. Don't change it yet.\n" +
        '[WORKSPACE_STATE]\n' +
        'no git | 3 edits this task | last test run: FAIL\n' +
        '[TEST_STATUS] (OBSERVED | latest run covering each)\n' +
        '- FAIL tests/test_reconcile.py::test_march_window_totals\n' +
        '[TEST_RESULT] (OBSERVED | test run | 18:01)\n' +
        'Command: python -m pytest tests/ -v 2>&1 | tail -60\n' +
        'Result: FAIL\n' +
        '[REVERTED_EDITS] (OBSERVED)\n' +
        '- src/payments/reconcile.py | 2 reverts, 3 edit(s) | last reverted by an unidentified change at 18:01\n' +
        '    + stamp = row["booking_date"]  (edit 1 of 2)\n' +
        '    + import datetime\n' +
        '[RECORD_DETAIL]\n' +
        'Full detail: `velra inspect --session 87901fc6 --section <name>`\n' +
        '</VELRA_WORKSPACE_STATE>',
    ),
    outputStatus: 'complete',
    source: {
      label: 'docs/RESTORE.md, What the capsule contains',
      href: `${DOCS.restore}#what-the-capsule-contains`,
    },
    note: 'The recorded workspace no longer exists on disk, which is why the workspace line reads no git.',
    inspector: {
      heading: 'Capsule',
      summary: 'Every section says how it is known. Here, each labelled section is OBSERVED.',
      fields: [
        {
          label: 'Objective',
          value: 'The reconcile failure, not the other two',
          tag: 'observed',
          evidence: [
            '[FIRST_MESSAGE] (OBSERVED | user prompt | 17:59)',
            'Payments again. Run the suite; I want the reconcile failure this time, not the other two.',
          ],
        },
        {
          label: 'Stated constraints',
          value: 'A window closes on the booking date, never the value date',
          tag: 'observed',
          evidence: [
            '[STATED_CONSTRAINTS] (OBSERVED | user prompt | quoted verbatim)',
            '- turn 4 18:00 | "Here\'s the thing you can\'t get from the code: the upstream feed backdates."',
            '- turn 4 18:00 | "A window has to close on the booking date, never the value date."',
          ],
          detail: 'Quoted verbatim from the user prompt, with the turn and time it was said.',
        },
        {
          label: 'Latest direction',
          value: "Next step is in_window in reconcile.py. Don't change it yet.",
          tag: 'observed',
          evidence: [
            '[LATEST_MESSAGE] (OBSERVED | user prompt | 18:02)',
            "Next step is in_window in reconcile.py. Don't change it yet.",
          ],
          detail: "The next step is carried in the user's own words, not as a guess by Velra.",
        },
        {
          label: 'Workspace state',
          value: 'no git | 3 edits this task | last test run: FAIL',
          tag: 'unlabelled',
          evidence: ['no git | 3 edits this task | last test run: FAIL'],
          detail: 'This section carries no OBSERVED or INFERRED label in the capsule.',
        },
        {
          label: 'Test status',
          value: 'FAIL tests/test_reconcile.py::test_march_window_totals',
          tag: 'observed',
          evidence: [
            '[TEST_STATUS] (OBSERVED | latest run covering each)',
            '- FAIL tests/test_reconcile.py::test_march_window_totals',
          ],
          detail: 'The exact test id. Identifiers like this are the last thing the budget ladder drops.',
        },
        {
          label: 'Test result',
          value: 'python -m pytest tests/ -v, result FAIL',
          tag: 'observed',
          evidence: [
            '[TEST_RESULT] (OBSERVED | test run | 18:01)',
            'Command: python -m pytest tests/ -v 2>&1 | tail -60',
            'Result: FAIL',
          ],
        },
        {
          label: 'Reverted edits',
          value: 'src/payments/reconcile.py, 2 reverts, 3 edits',
          tag: 'observed',
          evidence: [
            '[REVERTED_EDITS] (OBSERVED)',
            '- src/payments/reconcile.py | 2 reverts, 3 edit(s) | last reverted by an unidentified change at 18:01',
          ],
          detail: 'Velra records what was tried and undone, with a short excerpt. It does not record why.',
        },
        {
          label: 'Next target',
          value: 'No NEXT_TARGET section in this capsule',
          tag: 'absent',
          detail:
            'NEXT_TARGET and FAILURE_LOCATION are the two sections Velra marks INFERRED. Neither is rendered here. The next step appears above, under the latest message.',
        },
        {
          label: 'Record detail',
          value: 'velra inspect --session 87901fc6 --section <name>',
          tag: 'output',
          evidence: ['Full detail: `velra inspect --session 87901fc6 --section <name>`'],
        },
      ],
    },
  },
  {
    ...base,
    id: 'DOC-DEAD-ENDS',
    phase: 'doc-detail',
    title: 'Open the full detail',
    explain:
      'The capsule ends by naming this command. It opens the untruncated record behind any section. Here, the edits that were tried and reverted.',
    command: 'velra inspect --session 87901fc6 --section dead-ends',
    output: lines(
      'DEAD ENDS\n' +
        '---------\n' +
        '[2] src/payments/reconcile.py | external at 18:01\n' +
        '  edit 1: Edit src/payments/reconcile.py +1/-1 REVERTED at 17:59\n' +
        '      - stamp = row["value_date"]\n' +
        '      + stamp = row["booking_date"]\n' +
        '  edit 3: Edit src/payments/reconcile.py +7/-9 REVERTED at 18:00\n' +
        '      - import datetime\n' +
        '  observed afterward: `cd "$(pwd)" && python -m pytest tests/test_reconcile.py -v 2>&1 | tail -30` PASS. Causal link: UNCONFIRMED.\n' +
        '\n' +
        '[1] src/payments/reconcile.py | inverse_edit at 18:00\n' +
        '  edit 2: Edit src/payments/reconcile.py +9/-7 REVERTED at 18:00\n' +
        '      + import datetime\n' +
        '  observed afterward: `cd "$(pwd)" && python -m pytest tests/test_reconcile.py -v 2>&1 | tail -30` FAIL. Causal link: UNCONFIRMED.',
    ),
    outputStatus: 'complete',
    source: { label: 'docs/CLI.md, velra inspect', href: `${DOCS.cli}#velra-inspect` },
    inspector: {
      heading: 'Section detail',
      summary: 'The full record behind REVERTED_EDITS: three edits to one file, all reverted.',
      fields: [
        {
          label: 'Dead ends',
          value: '2, both in src/payments/reconcile.py',
          tag: 'output',
          evidence: [
            '[2] src/payments/reconcile.py | external at 18:01',
            '[1] src/payments/reconcile.py | inverse_edit at 18:00',
          ],
        },
        {
          label: 'Edits reverted',
          value: '3',
          tag: 'output',
          evidence: [
            '  edit 1: Edit src/payments/reconcile.py +1/-1 REVERTED at 17:59',
            '  edit 3: Edit src/payments/reconcile.py +7/-9 REVERTED at 18:00',
            '  edit 2: Edit src/payments/reconcile.py +9/-7 REVERTED at 18:00',
          ],
        },
        {
          label: 'Causal link',
          value: 'UNCONFIRMED on both',
          tag: 'output',
          evidence: ['Causal link: UNCONFIRMED.'],
          detail:
            'Velra reports the test run it observed afterward and says plainly that it cannot confirm cause.',
        },
      ],
    },
  },
];
