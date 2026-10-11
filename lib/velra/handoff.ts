/**
 * The last step: starting a new session, and how to check that it worked.
 *
 * No recording of a new session receiving the capsule exists in the captured
 * run, so this step is not a transcript. It is a guide: what to do, what to
 * ask, what to run, and what each of those does and does not establish.
 *
 * Nothing in this file is output. There is no delivery line, no status
 * listing and no reply from Claude, because none was captured and the page
 * does not make them up. The one quotation the step shows is the staging
 * result, which captured.ts reads out of the step that really printed it.
 *
 * The facts about delivery are Velra's own, from docs/RESTORE.md,
 * docs/GUARANTEES.md and docs/TROUBLESHOOTING.md: a staged capsule is claimed
 * only by a new session in the same workspace, at most once, and whether a
 * notice is shown depends on where Claude Code is running.
 */

import type { Guide, Inspector } from './types';

/**
 * The prompt a reader gives the new session. It is copied exactly as written
 * here, blank lines included, so it is kept as one literal block.
 */
export const VERIFICATION_PROMPT = `Before inspecting the repository, opening files, running commands, or using git, summarize the task context that was supplied to you at the start of this session.

Include:
1. The original task objective.
2. Important constraints and requirements.
3. Relevant files and the work already attempted.
4. Failures, test results, and rejected approaches.
5. The current state and the intended next step.

Use only the context available to you before inspecting the repository. Clearly identify information that is missing or uncertain. Do not fill gaps with assumptions. Stop after giving this report.`;

export const STATUS_COMMAND = 'velra status';

export const HANDOFF_GUIDE: Guide = {
  label: 'How to verify',
  lead: {
    kicker: 'Silent by design',
    headline: ['No popup.', 'No manual copy-paste.', 'No need to explain the task all over again.'],
    body: 'The next session simply starts with the staged engineering context available to it.',
    note: 'Seeing nothing happen is expected. Some Claude Code surfaces print a one-line notice and many print nothing, so a missing popup or terminal message does not, by itself, mean the handoff failed. The three steps below are how you check.',
  },
  parts: [
    {
      id: 'A',
      title: 'Open Claude Code',
      body: ['Start a completely new Claude Code session in the workspace where you staged the capsule.'],
      requirements: ['Same workspace', 'New session'],
      after: [
        'The capsule is already staged, so do not run `velra restore` again. Resuming, clearing or compacting an existing session does not count as a new one.',
      ],
    },
    {
      id: 'B',
      title: 'Ask Claude what it received',
      body: ['Send this as your first message in the new session, before anything else.'],
      snippet: {
        kind: 'prompt',
        caption: 'Your first message',
        text: VERIFICATION_PROMPT,
        copyLabel: 'Copy verification prompt',
        copied: 'Verification prompt copied.',
      },
      after: [
        'Compare the answer with the work you did in the previous session. If key information is absent, that is useful evidence too. A capsule is a bounded record, not the whole conversation, so do not expect perfect recall.',
      ],
    },
    {
      id: 'C',
      title: 'Verify delivery independently',
      body: ['Run this in PowerShell after the new session has started.'],
      snippet: {
        kind: 'command',
        caption: 'PowerShell, in the same workspace',
        text: STATUS_COMMAND,
        copyLabel: 'Copy command',
        copied: 'Command copied: velra status',
      },
      after: [
        'Look for a continuation delivery confirmation associated with `session_start`. The exact lines depend on your installation and your run, so none are shown here.',
      ],
      establishes: [
        { check: '`velra status`', shows: 'Evidence of delivery.' },
        { check: "Claude's answer", shows: 'Evidence of what context it can report.' },
      ],
      caveat:
        'A delivery confirmation alone does not prove that the model understood or used every detail.',
    },
  ],
  disclaimer:
    'This is a guide, not a recording. The run on this page has no capture of the new session, so no delivery is shown here.',
};

/**
 * The inspector for the guide: the four things that happen, in order, and
 * which of them this run actually recorded.
 *
 * Only the first is recorded, and its evidence is passed in from the step that
 * printed it. The other three are left for the reader, and are never drawn as
 * done.
 */
export function handoffInspector(staged: { from: string; lines: string[] }): Inspector {
  return {
    kicker: 'How to verify',
    heading: 'Verification sequence',
    summary:
      'Four things, in order. This run recorded the first. The other three are yours to check in your own installation, and none of them is marked as done.',
    sequence: true,
    fields: [
      {
        label: 'Previous session',
        value: 'Capsule staged by the previous session',
        tag: 'recorded',
        evidence: staged.lines,
        evidenceFrom: staged.from,
        detail:
          'Captured earlier in this run, when the capsule was staged. Its last line is the instruction this step follows.',
      },
      {
        label: 'New session',
        value: 'Fresh session opened in the same workspace',
        tag: 'to-verify',
        detail:
          "Per Velra's documentation, only a brand-new session claims a staged capsule. Resume, clear, compact and fork leave it staged, and a session in a different workspace receives nothing.",
      },
      {
        label: 'Delivery',
        value: 'Delivery checked with velra status',
        tag: 'to-verify',
        detail:
          "Evidence that the capsule was delivered. Per Velra's documentation a staged capsule is delivered at most once and then removed, so a status that still shows it waiting means no new session has claimed it.",
      },
      {
        label: 'Context',
        value: "Context checked through Claude's response",
        tag: 'to-verify',
        detail:
          'Evidence of what context Claude can report. A delivery confirmation does not prove the model understood or used every detail, which is why this check is separate.',
      },
    ],
  };
}
