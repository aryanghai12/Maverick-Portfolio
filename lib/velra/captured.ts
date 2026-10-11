/**
 * The captured run: real Velra commands and their real output.
 *
 * The text itself comes from data/velra/captured.json, which is generated from
 * a local source pack by scripts/velra-transcripts.ts. This file adds only what
 * a transcript cannot say about itself: which capture it came from, where it
 * sits in the story, what the command is for, and what a careful reader can
 * conclude from its output.
 *
 * Two captures, in the order they were made, and they are never interleaved:
 *
 *   windows-setup    installing Velra on Windows and switching it on.
 *   windows-session  three days later, after real work in Claude Code: a full
 *                    capsule, a real staging result, and status showing the
 *                    capsule waiting. Its metadata is in captured-session.ts.
 *
 * Each distinct Velra command appears once. Which executions those are is
 * decided in published.ts, and nothing outside that list is in the data at
 * all: no repeats, no mistyped flags, no unrelated tool checks.
 *
 * Two views are built from the same steps:
 *
 *   STORY_STEPS     eight steps: the shortest path from installing Velra to a
 *                   capsule that is staged and waiting, then a guide to
 *                   checking the handoff. What a visitor sees first.
 *   CAPTURED_STEPS  every published command, in the order it was run, then
 *                   the same guide.
 *
 * The last step is the one thing here that is not a capture. No recording of
 * a new session receiving the capsule exists, so it is written as a guide and
 * labelled as one. See handoff.ts.
 *
 * No command appears twice in either view. Every `evidence` line below is a
 * quotation from that step's own output. tests/velra/transcripts.test.ts fails
 * if either stops being true.
 */

import capturedJson from '@/data/velra/captured.json';
import { PRIVATE_WORKSPACE, SESSION_META } from './captured-session';
import { HANDOFF_GUIDE, handoffInspector } from './handoff';
import { PUBLISHED } from './published';
import type { CapturedFile, RedactionKind } from './sanitize';
import type { InspectorField, OutputItem, Phase, Step, StepMeta } from './types';

const captured = capturedJson as CapturedFile;

/** In the order the captures were made. */
export const CAPTURED_PHASES: Phase[] = [
  {
    id: 'windows-setup',
    label: 'First install',
    caption: 'Windows. Setting it up.',
    environment: 'windows',
  },
  {
    id: 'windows-session',
    label: 'After a working session',
    caption: 'Windows, three days later.',
    environment: 'windows',
  },
  {
    id: 'handoff',
    label: 'The next session',
    caption: 'How to verify. Not a recording.',
    environment: 'windows',
    guide: true,
  },
];

/**
 * The walkthrough, in the order it was run: install it, switch it on, check
 * that it is recording, then find, preview, stage and confirm. Each of those
 * has complete, real output, and no command is used twice. The last step is
 * the guide to checking the handoff.
 */
const STORY = ['A1', 'D', 'N2', 'N4', 'N5', 'N11', 'N13', 'HANDOFF'];

const SETUP_WORKSPACE = '~\\Videos\\Velra';

const NO_CAPSULE: InspectorField = {
  label: 'Capsule',
  value: 'None at this step',
  tag: 'absent',
  detail: 'A capsule is rendered from a recorded session. Nothing in this output refers to one.',
};

const SETUP_META: Record<string, StepMeta> = {
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
  C: {
    phase: 'windows-setup',
    title: 'Switch it off',
    explain:
      "Removes Velra's hooks from the Claude Code settings and says where the backup went. Claude Code is otherwise untouched.",
    inspector: {
      heading: 'Installation state',
      summary: 'Hooks are removed, and the settings file was backed up first.',
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
    title: 'Switch it on',
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
};

const META: Record<string, StepMeta> = { ...SETUP_META, ...SESSION_META };

/** What a capture's phase says about every step in it. */
const PHASE_SETTING: Record<string, Pick<Step, 'environment' | 'shell' | 'workspace'>> = {
  'windows-setup': { environment: 'windows', shell: 'PowerShell', workspace: SETUP_WORKSPACE },
  'windows-session': { environment: 'windows', shell: 'PowerShell', workspace: PRIVATE_WORKSPACE },
};

/* The data, the published list and the metadata must describe exactly the same
   executions. Any mismatch stops the build here, rather than letting a step
   silently go missing from the page or a stale one linger on it. */
const ids = captured.entries.map((entry) => entry.id);
for (const id of PUBLISHED) {
  if (!ids.includes(id)) {
    throw new Error(`${id} is published but not in captured.json. Run npm run velra:transcripts.`);
  }
  if (!META[id]) throw new Error(`${id} is published but has no metadata.`);
}
for (const id of ids) {
  if (!PUBLISHED.includes(id)) {
    throw new Error(`${id} is in captured.json but not published. Run npm run velra:transcripts.`);
  }
}
for (const id of Object.keys(META)) {
  if (!PUBLISHED.includes(id)) throw new Error(`Metadata for ${id} describes a step that is not published.`);
}

const steps: Step[] = captured.entries.map((entry) => {
  const meta = META[entry.id];
  const setting = PHASE_SETTING[meta.phase];
  if (!setting) throw new Error(`Captured entry ${entry.id} is in an unknown phase: ${meta.phase}.`);

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
    environment: setting.environment,
    shell: setting.shell,
    workspace: meta.workspace ?? setting.workspace,
    prompt: entry.prompt ?? '$',
    promptSupplied: entry.prompt !== null,
    command: entry.command,
    output,
    outputStatus: meta.status ?? (entry.output.length ? 'complete' : 'empty'),
    provenance: redactions.length ? 'captured-redacted' : 'captured',
    source: { label: `Transcript ${entry.section} in the local source pack` },
    redactions,
    note: meta.note,
    inspector: meta.inspector,
  };
});

/** The step in which the capsule was really staged. The guide quotes it, and nothing else. */
const STAGED_IN = 'N11';

/**
 * What staging printed, read from that step's own output: the result line,
 * and the line telling the reader to start a new session. Looked up rather
 * than typed, so the guide can only ever quote something Velra printed.
 */
function stagedEvidence(): { from: string; lines: string[] } {
  const text = (steps.find((s) => s.id === STAGED_IN)?.output ?? [])
    .filter((item) => item.kind === 'line')
    .map((item) => item.text);
  const result = text.find((line) => /^✓ Staged /.test(line));
  const next = text.find((line) => /Start a new Claude Code session in /.test(line));
  if (!result || !next) throw new Error(`Step ${STAGED_IN} does not read as a staging result.`);
  return { from: STAGED_IN, lines: [result, next] };
}

/**
 * The last step: start a new session, and check that the capsule arrived.
 *
 * It is a step so that playback ends on it, rather than ending on a staged
 * capsule and letting a visitor assume the rest worked. Everything up to this
 * point is real: the capsule is staged and status shows it waiting.
 *
 * This step is a guide, because the handoff is silent and no recording of it
 * was made. It has no command and no output, and it stays `not-captured`. It
 * tells the reader how to see the handoff for themselves, and it never shows
 * a delivery as having happened.
 */
const HANDOFF: Step = {
  id: 'HANDOFF',
  mode: 'captured',
  phase: 'handoff',
  title: 'Start a new session',
  explain:
    'The handoff is silent by design. Open a fresh Claude Code session in the same workspace. Velra delivers the staged capsule at startup, carrying forward the engineering context from your previous session.',
  environment: 'windows',
  shell: 'PowerShell',
  workspace: PRIVATE_WORKSPACE,
  prompt: '',
  promptSupplied: false,
  command: null,
  output: [],
  outputStatus: 'not-captured',
  provenance: 'guide',
  source: { label: 'Guidance written for this page. No recording of the new session exists in this run.' },
  redactions: [],
  guide: HANDOFF_GUIDE,
  inspector: handoffInspector(stagedEvidence()),
};

/** Every published command, in the order it was run, then the handoff guide. */
export const CAPTURED_STEPS: Step[] = [...steps, HANDOFF];

/** The eight-step walkthrough. The same step objects, so the two views cannot disagree. */
export const STORY_STEPS: Step[] = STORY.map((id) => {
  const step = CAPTURED_STEPS.find((s) => s.id === id);
  if (!step) throw new Error(`Walkthrough step ${id} is not a captured step.`);
  return step;
});
