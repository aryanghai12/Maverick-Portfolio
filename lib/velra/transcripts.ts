/**
 * The three replay views, and the helpers that read a step.
 *
 * story        eight captured steps, the shortest path from install to a
 *              staged capsule. The default, because it explains the product.
 * captured     every Velra command that was captured, in order. See captured.ts.
 * documented   the engineering example published in Velra's own docs. See
 *              documented.ts.
 *
 * A view owns its steps outright. Switching view swaps every command, every
 * output line and every inspector field, so nothing from the documented
 * example can appear beside the captured run.
 */

import { CAPTURED_PHASES, CAPTURED_STEPS, STORY_STEPS } from './captured';
import { DOCUMENTED_PHASES, DOCUMENTED_STEPS } from './documented';
import { REDACTION_TOKEN, type RedactionKind } from './sanitize';
import type { Mode, ModeId, Step } from './types';

export const MODES: Record<ModeId, Mode> = {
  story: {
    id: 'story',
    label: 'Walkthrough',
    provenance: 'Captured output, sanitized',
    description:
      'Eight steps, from a first install to a staged capsule, using real commands and their real output. Private values are replaced with placeholders, and the home directory is shown as ~.',
    phases: CAPTURED_PHASES,
    steps: STORY_STEPS,
  },
  captured: {
    id: 'captured',
    label: 'Full capture',
    provenance: 'Captured output, sanitized',
    description:
      'Every Velra command from the same two terminals, in the order it was run, including the repeats and the early warnings.',
    phases: CAPTURED_PHASES,
    steps: CAPTURED_STEPS,
  },
  documented: {
    id: 'documented',
    label: 'Documented example',
    provenance: 'Documented benchmark example',
    description:
      "The engineering example from Velra's README and docs: a payments fixture, one failing test, two dead ends. These are documentation values, not measurements from the captured run.",
    phases: DOCUMENTED_PHASES,
    steps: DOCUMENTED_STEPS,
  },
};

export const MODE_ORDER: ModeId[] = ['story', 'captured', 'documented'];

/** The steps a visitor is currently walking through. */
export function stepsFor(mode: ModeId): Step[] {
  return MODES[mode].steps;
}

/* ------------------------------------------------------------- redactions */

export const REDACTION_INFO: Record<RedactionKind, { label: string; reason: string }> = {
  USER_HOME_REDACTED: {
    label: 'Home directory, shown as ~',
    reason: 'The real path includes a local account name.',
  },
  LOCAL_PATH_REDACTED: {
    label: 'Workspace path',
    reason: 'The path names a private working directory.',
  },
  SESSION_ID_REDACTED: {
    label: 'Session id',
    reason: 'It identifies a private Claude Code session.',
  },
  SESSION_TITLE_REDACTED: {
    label: 'Session title',
    reason: 'Titles are taken from private prompts.',
  },
  WORKSPACE_ID_REDACTED: {
    label: 'Workspace id',
    reason: 'It is derived from a local filesystem path.',
  },
  PROMPT_TEXT_REDACTED: {
    label: 'Prompt text',
    reason: 'Velra quotes the user prompt, and this one is private.',
  },
  FILE_PATH_REDACTED: {
    label: 'File name',
    reason: 'The file belongs to a private workspace.',
  },
};

/**
 * The placeholders that are drawn as chips, mapped back to what they stand for.
 * The home directory is left out: ~ is ordinary path syntax and reads better
 * as plain text. It is still counted and listed for every step that uses it.
 */
export const PLACEHOLDER_KIND: Record<string, RedactionKind> = Object.fromEntries(
  (Object.entries(REDACTION_TOKEN) as [RedactionKind, string][])
    .filter(([, token]) => token.startsWith('<'))
    .map(([kind, token]) => [token, kind]),
);

export const PLACEHOLDER = new RegExp(
  Object.keys(PLACEHOLDER_KIND)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
);

/** How many times a kind's placeholder appears in a piece of captured text. */
export function countRedactions(text: string, kind: RedactionKind): number {
  return text.split(REDACTION_TOKEN[kind]).length - 1;
}

/* ------------------------------------------------------------------- copy */

/** Exactly the text of a step's command. Empty when the step is not a command. */
export function commandText(step: Step): string {
  return step.command ?? '';
}

/**
 * Exactly the text of a step's output, as displayed. Editorial markers are
 * kept, in square brackets, so a pasted copy cannot pass for a complete
 * capture when it is not one.
 */
export function outputText(step: Step): string {
  return step.output
    .map((item) => (item.kind === 'gap' ? `[${item.text}]` : item.text))
    .join('\n');
}

/** Whether there is any real output to copy, as opposed to only a marker. */
export function hasOutput(step: Step): boolean {
  return step.output.some((item) => item.kind === 'line');
}
