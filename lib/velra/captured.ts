/**
 * The captured run: Velra commands and their output from two real terminals.
 *
 * The text itself comes from data/velra/captured.json, which is generated from
 * a local source pack by scripts/velra-transcripts.ts. This file adds only what
 * a transcript cannot say about itself: which environment it came from, where
 * it sits in the story, what the command is for, and what a careful reader can
 * and cannot conclude from its output.
 *
 * Two environments, and they are never blended:
 *
 *   Windows  a first install. The database is empty, and the early inspect
 *            and restore runs correctly report that.
 *   Linux    later, in a different workspace, where three sessions already
 *            hold recorded state.
 *
 * Only Velra commands are shown. The Linux capture also checked for a few
 * unrelated tools (a terminal recorder, ffmpeg and so on). Those stay in the
 * generated JSON as a faithful record and are left out of the page, because
 * they explain nothing about Velra.
 *
 * Two views are built from the same steps:
 *
 *   STORY_STEPS     eight steps, the shortest path from install to a staged
 *                   capsule. This is what a visitor sees first.
 *   CAPTURED_STEPS  every Velra command, in source order, repeats included.
 *
 * Every `evidence` line below is a quotation from that step's own output, and
 * tests/velra/transcripts.test.ts fails if one is not.
 */

import capturedJson from '@/data/velra/captured.json';
import type { CapturedFile, RedactionKind } from './sanitize';
import type { Inspector, InspectorField, OutputItem, OutputStatus, Phase, Step } from './types';

const captured = capturedJson as CapturedFile;

export const CAPTURED_PHASES: Phase[] = [
  {
    id: 'windows-setup',
    label: 'Windows',
    caption: 'A first install',
    environment: 'windows',
  },
  {
    id: 'linux-workspace',
    label: 'Linux',
    caption: 'A workspace with recorded sessions',
    environment: 'linux',
  },
  {
    id: 'handoff',
    label: 'Next',
    caption: 'Not captured yet',
    environment: 'linux',
    pending: true,
  },
];

/** Captured, but not Velra commands. Kept out of every view of the page. */
const NOT_VELRA = new Set(['K2', 'K3', 'K4', 'K5', 'K6', 'K7']);

/** The walkthrough, in source order. */
const STORY = ['A1', 'D', 'E', 'F', 'L', 'M1', 'M2', 'HANDOFF'];

const WINDOWS_WORKSPACE = '~\\Videos\\Velra';
const LINUX_WORKSPACE = '<workspace-path>';

const NO_CAPSULE: InspectorField = {
  label: 'Capsule',
  value: 'None at this step',
  tag: 'absent',
  detail: 'A capsule is rendered from a recorded session. Nothing in this output refers to one.',
};

const SECTIONS_ONLY_WHEN_NEEDED =
  'Velra renders a section only when there is something to say, so a missing section is not an error.';

interface Meta {
  phase: string;
  title: string;
  explain: string;
  /** A caveat about the source. Only where one is needed. */
  note?: string;
  /** Overrides the status that would otherwise be read off the output. */
  status?: OutputStatus;
  /** An editorial marker placed before or instead of the supplied output. */
  gapBefore?: string;
  workspace?: string;
  inspector: Inspector;
}

const META: Record<string, Meta> = {
  A1: {
    phase: 'windows-setup',
    title: 'Install Velra',
    explain: 'Velra installs as one global npm package.',
    inspector: {
      heading: 'Installation',
      summary: 'The package is installed. Nothing has been recorded yet.',
      fields: [
        {
          label: 'Install result',
          value: 'changed 1 package in 508ms',
          tag: 'output',
          evidence: ['changed 1 package in 508ms'],
        },
        NO_CAPSULE,
      ],
    },
  },
  A2: {
    phase: 'windows-setup',
    title: 'Install again',
    explain: 'The same install, run a second time. The source shows it twice, so both runs are kept.',
    inspector: {
      heading: 'Installation',
      summary: 'A second run of the same command, with its own timing.',
      fields: [
        {
          label: 'Install result',
          value: 'changed 1 package in 506ms',
          tag: 'output',
          evidence: ['changed 1 package in 506ms'],
        },
        NO_CAPSULE,
      ],
    },
  },
  A3: {
    phase: 'windows-setup',
    title: 'Check the version',
    explain: 'Prints the version, the commit the binary was built from, and its target.',
    inspector: {
      heading: 'Installation',
      summary: 'Version 0.1.2, built for Windows.',
      fields: [
        {
          label: 'Version',
          value: '0.1.2',
          tag: 'output',
          evidence: ['velra 0.1.2 (3de080098, x86_64-pc-windows-msvc)'],
        },
        { label: 'Build commit', value: '3de080098', tag: 'output' },
        { label: 'Target', value: 'x86_64-pc-windows-msvc', tag: 'output' },
        NO_CAPSULE,
      ],
    },
  },
  B: {
    phase: 'windows-setup',
    title: 'Check the status',
    explain: 'Shows whether Velra is on, what it is tracking, and whether a capsule is staged here.',
    inspector: {
      heading: 'Installation state',
      summary: 'Hooks are registered. The database is empty and nothing is being tracked.',
      fields: [
        {
          label: 'Hooks',
          value: 'Enabled, 13 handlers registered',
          tag: 'output',
          evidence: ['✓ Enabled (13 hook handlers registered)'],
        },
        {
          label: 'Claude Code',
          value: '2.1.292, from the VS Code extension',
          tag: 'output',
          evidence: ['  Claude Code: 2.1.292 (from VS Code extension)'],
        },
        {
          label: 'Database',
          value: '0 KiB',
          tag: 'output',
          evidence: ['velra.db (0 KiB)'],
        },
        {
          label: 'Tracking',
          value: '0 sessions, 0 events',
          tag: 'output',
          evidence: ['  Tracking:    0 session(s), 0 event(s)'],
        },
        {
          label: 'Last event',
          value: 'none yet',
          tag: 'output',
          evidence: ['  Last event:  none yet'],
        },
        {
          label: 'Continuations',
          value: 'none live',
          tag: 'output',
          evidence: ['  Continuations: none live'],
        },
        {
          label: 'Staged capsule',
          value: 'No Staged line',
          tag: 'absent',
          detail:
            'Velra prints a Staged line only when a restore capsule is waiting for the current workspace. This output has none.',
        },
      ],
    },
  },
  C: {
    phase: 'windows-setup',
    title: 'Turn it off',
    explain: "Removes Velra's hooks from the Claude Code settings and reports where the backup went.",
    inspector: {
      heading: 'Installation state',
      summary: 'Hooks are removed. Claude Code is otherwise untouched.',
      fields: [
        {
          label: 'Hooks',
          value: 'Disabled',
          tag: 'output',
          evidence: ['✓ Velra disabled. Claude Code is otherwise untouched.'],
        },
        {
          label: 'Settings backup',
          value: 'settings.json.20261008T140513Z.bak',
          tag: 'output',
          evidence: ['settings.json.20261008T140513Z.bak'],
        },
        NO_CAPSULE,
      ],
    },
  },
  D: {
    phase: 'windows-setup',
    title: 'Turn it on',
    explain:
      "Registers Velra's hooks in the Claude Code settings, after backing the file up. This is the only setup step.",
    inspector: {
      heading: 'Installation state',
      summary: 'Hooks are registered. From here Velra records in the background.',
      fields: [
        {
          label: 'Hooks',
          value: 'Enabled for Claude Code',
          tag: 'output',
          evidence: ['✓ Velra enabled for Claude Code.'],
        },
        {
          label: 'Settings backup',
          value: 'settings.json.20261008T140517Z.bak',
          tag: 'output',
          evidence: ['settings.json.20261008T140517Z.bak'],
        },
        {
          label: 'Next step',
          value: 'Nothing else required',
          tag: 'output',
          evidence: ['Nothing else required. Keep coding normally.'],
        },
        NO_CAPSULE,
      ],
    },
  },
  E: {
    phase: 'windows-setup',
    title: 'Check the setup',
    explain:
      'Runs each health check. Four pass. One warns that there is no database yet, because nothing has been recorded.',
    inspector: {
      heading: 'Installation state',
      summary: 'Four checks pass. One warns: there is no database yet.',
      fields: [
        {
          label: 'Settings file',
          value: 'Parses',
          tag: 'output',
          evidence: ['✓ settings parse:'],
        },
        { label: 'Binary', value: 'Found', tag: 'output', evidence: ['✓ binary:'] },
        {
          label: 'Hook handlers',
          value: '13 registered across 10 events',
          tag: 'output',
          evidence: ['✓ 13 hook handlers registered across 10 events'],
        },
        {
          label: 'Database',
          value: 'None yet (warning)',
          tag: 'output',
          evidence: ['! no database yet at'],
        },
        {
          label: 'Error log',
          value: 'No recent errors',
          tag: 'output',
          evidence: ['✓ no recent errors'],
        },
      ],
    },
  },
  F: {
    phase: 'windows-setup',
    title: 'Nothing to carry yet',
    explain:
      'inspect previews the capsule for a session. With nothing recorded there is nothing to preview, and Velra says so.',
    inspector: {
      heading: 'Capsule',
      summary: 'There is nothing to preview. Velra has no database on this machine yet.',
      fields: [
        {
          label: 'Capsule',
          value: 'None. No database yet.',
          tag: 'output',
          evidence: ['! No Velra database yet at'],
        },
        {
          label: 'Suggested action',
          value: 'Start Claude Code with Velra enabled and try again.',
          tag: 'output',
          evidence: ['  Start Claude Code with Velra enabled and try again.'],
        },
      ],
    },
  },
  G: {
    phase: 'windows-setup',
    title: 'Nothing to stage yet',
    explain:
      "restore stages a session's state for the next one. With no database there is nothing to stage.",
    inspector: {
      heading: 'Capsule',
      summary: 'Nothing can be staged. Velra has no database on this machine yet.',
      fields: [
        {
          label: 'Staged capsule',
          value: 'None. No database yet.',
          tag: 'output',
          evidence: ['! No Velra database yet at'],
        },
        {
          label: 'Suggested action',
          value: 'Start Claude Code with Velra enabled and try again.',
          tag: 'output',
          evidence: ['  Start Claude Code with Velra enabled and try again.'],
        },
      ],
    },
  },
  H: {
    phase: 'windows-setup',
    title: 'A first, empty preview',
    explain:
      'The same inspect, run later. A preview now renders, but it is nearly empty: no first message and 0 edits.',
    inspector: {
      heading: 'Capsule preview',
      summary: 'A preview renders, but the session behind it has almost nothing recorded.',
      fields: [
        {
          label: 'Record',
          value: 'checkpoint "preview", trigger "cli"',
          tag: 'output',
          evidence: [
            '<VELRA_WORKSPACE_STATE v="1" checkpoint="preview" captured="2026-10-08T14:05:58Z" trigger="cli">',
          ],
        },
        {
          label: 'Objective',
          value: '(not captured)',
          tag: 'output',
          evidence: ['[FIRST_MESSAGE]', '(not captured)'],
          detail: 'The capsule prints (not captured) under FIRST_MESSAGE. That is its own wording.',
        },
        {
          label: 'Workspace state',
          value: 'main @ 3de0800 | 0 edits this task | last test run: none',
          tag: 'unlabelled',
          evidence: ['main @ 3de0800 | 0 edits this task | last test run: none'],
          detail: 'This section carries no OBSERVED or INFERRED label in the output.',
        },
        {
          label: 'Sections not present',
          value: 'Stated constraints, test status, reverted edits, recent edits, next target',
          tag: 'absent',
          detail: SECTIONS_ONLY_WHEN_NEEDED,
        },
        {
          label: 'Record detail',
          value: 'velra inspect --section <name>',
          tag: 'output',
          evidence: ['Full detail for any section: `velra inspect --section <name>`'],
        },
      ],
    },
  },
  I: {
    phase: 'windows-setup',
    title: 'Sessions, but no state',
    explain:
      'The same restore, run later. Sessions are found this time, but none of them holds task state.',
    inspector: {
      heading: 'Capsule',
      summary: 'Twenty sessions are known for this workspace. None has state to stage.',
      fields: [
        {
          label: 'Staged capsule',
          value: 'Nothing staged',
          tag: 'output',
          evidence: ["! Velra has no task state for any of this workspace's 20 session(s) yet."],
        },
        { label: 'Sessions in workspace', value: '20', tag: 'output' },
        { label: 'Sessions with task state', value: '0', tag: 'output' },
      ],
    },
  },
  J: {
    phase: 'windows-setup',
    title: 'List the sessions',
    explain: 'Lists every session this workspace has seen, as JSON. All 20 read has_state: false.',
    note: 'Session ids and titles are redacted. The source names this command in a heading, so no prompt line was supplied.',
    inspector: {
      heading: 'Session list',
      summary: 'Twenty sessions, and every one reads has_state: false.',
      fields: [
        {
          label: 'Sessions listed',
          value: '20',
          tag: 'output',
          evidence: ['  "sessions": ['],
          detail: 'Counted from the entries in this output.',
        },
        {
          label: 'With task state',
          value: '0',
          tag: 'output',
          evidence: ['      "has_state": false'],
          detail: 'All 20 entries read has_state: false.',
        },
        {
          label: 'Capsule',
          value: 'None available to stage',
          tag: 'absent',
          detail: 'A session needs recorded task state before it can be restored.',
        },
      ],
    },
  },
  K1: {
    phase: 'linux-workspace',
    title: 'Check the version',
    explain: 'The same Velra version on Linux, built for a different target.',
    workspace: 'Not stated in the source',
    inspector: {
      heading: 'Environment',
      summary: 'Version 0.1.2 again, this time the Linux build.',
      fields: [
        {
          label: 'Version',
          value: '0.1.2',
          tag: 'output',
          evidence: ['velra 0.1.2 (3de080098, x86_64-unknown-linux-musl)'],
        },
        { label: 'Build commit', value: '3de080098', tag: 'output' },
        { label: 'Target', value: 'x86_64-unknown-linux-musl', tag: 'output' },
      ],
    },
  },
  L: {
    phase: 'linux-workspace',
    title: 'Find a session to continue',
    explain:
      'Lists the sessions this workspace has seen. has_state: true marks the ones Velra recorded, so those are the ones it can restore. Three of five here.',
    note: 'The source identifies the third entry as the session used in the next steps. Session ids and titles are redacted.',
    inspector: {
      heading: 'Session list',
      summary: 'Five sessions. Three hold recorded state, so three can be restored.',
      fields: [
        {
          label: 'Sessions listed',
          value: '5',
          tag: 'output',
          evidence: ['  "sessions": ['],
          detail: 'Counted from the entries in this output.',
        },
        {
          label: 'With task state',
          value: '3',
          tag: 'output',
          evidence: ['      "has_state": true'],
        },
        {
          label: 'Without task state',
          value: '2',
          tag: 'output',
          evidence: ['      "has_state": false'],
        },
        {
          label: 'Selected source session',
          value: 'The third entry',
          tag: 'noted',
          detail: 'Stated in the notes that accompany the source transcript, not in the output itself.',
        },
      ],
    },
  },
  M1: {
    phase: 'linux-workspace',
    title: 'Preview the capsule',
    explain:
      'Shows what would be carried over: stated constraints, the latest message, workspace state and recent edits. Each labelled section says it was OBSERVED.',
    status: 'partial',
    gapBefore:
      'The start of this output was not supplied. The excerpt below comes from one frame of a terminal recording and begins partway through the capsule.',
    inspector: {
      heading: 'Capsule excerpt',
      summary: 'A real capsule for a recorded session, seen from the constraints onward.',
      fields: [
        {
          label: 'Objective',
          value: 'Not in the supplied excerpt',
          tag: 'not-captured',
          detail: 'FIRST_MESSAGE would come before the point where this excerpt begins.',
        },
        {
          label: 'Stated constraints',
          value: '3 quoted lines shown, 2 more not listed',
          tag: 'observed',
          evidence: [
            '[STATED_CONSTRAINTS] (OBSERVED | user prompt | quoted verbatim | 2 more not listed)',
          ],
          detail: 'Velra quotes these from the user prompt. The quoted text is redacted on this page.',
        },
        {
          label: 'Latest message',
          value: 'A user prompt at 01:16',
          tag: 'observed',
          evidence: ['[LATEST_MESSAGE] (OBSERVED | user prompt | 01:16)'],
          detail: 'The message text is redacted on this page.',
        },
        {
          label: 'Workspace state',
          value: 'no git | 11 edits this task | last test run: none',
          tag: 'unlabelled',
          evidence: ['no git | 11 edits this task | last test run: none'],
          detail: 'This section carries no OBSERVED or INFERRED label in the output.',
        },
        {
          label: 'Recent edits',
          value: '2 files: +108/-? lines at 01:24, +1/-1 lines at 01:23',
          tag: 'observed',
          evidence: ['[RECENT_EDITS] (OBSERVED)'],
          detail: 'Both entries read "afterward: no test run yet". File names are redacted on this page.',
        },
        {
          label: 'Sections not in the excerpt',
          value: 'Test status, reverted edits, next target',
          tag: 'absent',
          detail: SECTIONS_ONLY_WHEN_NEEDED,
        },
        {
          label: 'Record detail',
          value: 'velra inspect --section <name>',
          tag: 'output',
          evidence: ['Full detail for any section: `velra inspect --section <name>`'],
        },
      ],
    },
  },
  M2: {
    phase: 'linux-workspace',
    title: 'Stage it for the next session',
    explain:
      'Renders that state into a bounded capsule and stages it locally, ready for the next new session. The notes for this run record 5 files and 719 estimated tokens.',
    status: 'not-captured',
    gapBefore:
      'The output text was not supplied. The source notes say the result on screen showed 5 files and 719 estimated tokens.',
    note: 'The recording is not in this repository, so the two figures were not checked against it here.',
    inspector: {
      heading: 'Staged capsule',
      summary: 'The command was run. Its result is known only from the source notes.',
      fields: [
        {
          label: 'Files',
          value: '5',
          tag: 'noted',
          detail: 'From the notes describing the recording. Not re-checked against video.',
        },
        {
          label: 'Size',
          value: '719 estimated tokens',
          tag: 'noted',
          detail: 'From the notes describing the recording. Not re-checked against video.',
        },
        {
          label: 'Output text',
          value: 'Not supplied',
          tag: 'not-captured',
          detail: 'The exact lines Velra printed are not in the source, so none are shown.',
        },
      ],
    },
  },
  M3: {
    phase: 'linux-workspace',
    title: 'Check what is staged',
    explain:
      "Would show the staged capsule waiting for a new session. The recording did not show this command's output.",
    status: 'not-captured',
    gapBefore: 'This command appears in the recording. Its output was not shown, so none is displayed.',
    inspector: {
      heading: 'Staged capsule',
      summary: 'The command is in the recording. What it printed is not.',
      fields: [
        {
          label: 'Status output',
          value: 'Not captured',
          tag: 'not-captured',
          detail:
            'The source says the clip did not show a separate status result. The Windows status output belongs to a different environment and is not reused here.',
        },
      ],
    },
  },
};

function statusOf(output: string[]): OutputStatus {
  return output.length ? 'complete' : 'empty';
}

const steps: Step[] = captured.entries
  .filter((entry) => !NOT_VELRA.has(entry.id))
  .map((entry) => {
    const meta = META[entry.id];
    if (!meta) throw new Error(`No metadata for captured entry ${entry.id}.`);

    const windows = meta.phase === 'windows-setup';
    const redactions = (Object.entries(entry.redactions) as [RedactionKind, number][]).map(
      ([kind, count]) => ({ kind, count }),
    );
    const output: OutputItem[] = [
      ...(meta.gapBefore ? [{ kind: 'gap' as const, text: meta.gapBefore }] : []),
      ...entry.output.map((text) => ({ kind: 'line' as const, text })),
    ];

    return {
      id: entry.id,
      mode: 'captured',
      phase: meta.phase,
      title: meta.title,
      explain: meta.explain,
      environment: windows ? 'windows' : 'linux',
      shell: windows ? 'PowerShell' : 'zsh',
      workspace: meta.workspace ?? (windows ? WINDOWS_WORKSPACE : LINUX_WORKSPACE),
      prompt: entry.prompt ?? '$',
      promptSupplied: entry.prompt !== null,
      command: entry.command,
      output,
      outputStatus: meta.status ?? statusOf(entry.output),
      provenance: redactions.length ? 'captured-redacted' : 'captured',
      source: { label: `Transcript ${entry.section} in the local source pack` },
      redactions,
      note: meta.note,
      inspector: meta.inspector,
    };
  });

/**
 * The stage nobody has recorded yet.
 *
 * It is a step so that playback ends on it, rather than ending on a restore
 * and letting a visitor assume the rest worked. It has no command and no
 * output, because there is no recording to take either from.
 */
const HANDOFF: Step = {
  id: 'HANDOFF',
  mode: 'captured',
  phase: 'handoff',
  title: 'Start a new session',
  explain:
    'The next new Claude Code session in the same workspace receives the capsule, once. That moment has not been recorded yet, so it is not shown.',
  environment: 'linux',
  shell: 'zsh',
  workspace: LINUX_WORKSPACE,
  prompt: '',
  promptSupplied: false,
  command: null,
  contextLabel: 'Session B · not captured in this run',
  output: [
    {
      kind: 'gap',
      text: 'No recording shows a new Claude Code session receiving the staged capsule. Record a fresh session in the same workspace to complete this part.',
    },
  ],
  outputStatus: 'not-captured',
  provenance: 'pending',
  source: { label: 'No source. Awaiting a genuine handoff recording.' },
  redactions: [],
  note: 'This page does not simulate a delivery. The documented example shows what one looks like, and it is labelled as documentation.',
  inspector: {
    heading: 'Handoff',
    summary: 'The capsule was staged. Whether a new session received it has not been recorded.',
    fields: [
      {
        label: 'Delivery to a new session',
        value: 'Awaiting a genuine handoff recording',
        tag: 'not-captured',
        detail:
          'Velra delivers a staged capsule to the next new Claude Code session in the same workspace, at most once. No capture of that moment was supplied.',
      },
      {
        label: 'What would complete it',
        value: 'A recording of a new session starting in the same workspace',
        tag: 'not-captured',
      },
    ],
  },
};

/** Every Velra command that was captured, in source order, then the open handoff. */
export const CAPTURED_STEPS: Step[] = [...steps, HANDOFF];

/** The eight-step walkthrough. The same step objects, so the two views cannot disagree. */
export const STORY_STEPS: Step[] = STORY.map((id) => {
  const step = CAPTURED_STEPS.find((s) => s.id === id);
  if (!step) throw new Error(`Walkthrough step ${id} is not a captured step.`);
  return step;
});
