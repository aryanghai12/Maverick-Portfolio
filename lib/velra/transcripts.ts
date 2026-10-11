/**
 * The three replay views, and the helpers that read a step.
 *
 * story        eight steps: seven captured, the shortest path from installing
 *              Velra to a capsule that is staged and waiting, then a guide to
 *              checking the handoff. The default, because it explains the
 *              product.
 * captured     every distinct Velra command, once each, in the order it was
 *              run, then the same guide. See captured.ts, published.ts and
 *              handoff.ts.
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
      'Seven captured steps, from installing Velra to a capsule staged and waiting, then a guide to checking the handoff yourself. Prompts, file names, ids and paths are replaced with placeholders, and the home directory is shown as ~.',
    phases: CAPTURED_PHASES,
    steps: STORY_STEPS,
  },
  captured: {
    id: 'captured',
    label: 'All commands',
    provenance: 'Captured output, sanitized',
    description:
      'Every Velra command, once each, in the order it was run, with its real output: the install, then a working session three days later. The last step is a guide, not a capture.',
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

/**
 * How many times a kind's placeholder appears in a piece of captured text.
 *
 * The home directory is the one placeholder that is also an ordinary character.
 * It is counted only where it starts a path, because Velra prints a tilde of
 * its own for "about", as in "~34 MB", and that is not a redaction.
 */
export function countRedactions(text: string, kind: RedactionKind): number {
  if (kind === 'USER_HOME_REDACTED') return (text.match(/~(?=[\\/])/g) ?? []).length;
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

/* ---------------------------------------------------------------- staging */

/** The captured step in which a real capsule is staged. The hero shows it. */
export const STAGING_STEP: Step = (() => {
  const step = CAPTURED_STEPS.find((s) => s.id === 'N11');
  if (!step) throw new Error('The captured staging step (N11) is missing.');
  return step;
})();

/** Velra's documented limits for a capsule, in estimated tokens. */
export const CAPSULE_LIMITS = { target: 740, ceiling: 1000 } as const;

/**
 * Reads a staging result out of a step's own output: how many estimated
 * tokens, and what was staged. It throws if the output does not say, so a
 * figure can only ever be shown because Velra printed it.
 */
export function stagedSummary(step: Step): { tokens: number; parts: string[] } {
  const text = step.output
    .filter((item) => item.kind === 'line')
    .map((item) => item.text)
    .join('\n');
  const tokens = /(\d+) estimated tokens/.exec(text);
  const parts = /Staged (.+?) from session/.exec(text);
  if (!tokens || !parts) {
    throw new Error(`Step ${step.id} does not read as a staging result.`);
  }
  return { tokens: Number(tokens[1]), parts: parts[1].split(', ') };
}

/** Whether there is any real output to copy, as opposed to only a marker. */
export function hasOutput(step: Step): boolean {
  return step.output.some((item) => item.kind === 'line');
}
