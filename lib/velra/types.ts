/**
 * The shape of everything the /velra replay can show.
 *
 * Transcript content and playback logic are kept apart on purpose. A step is
 * plain data: what was typed, what came back, where it came from and what was
 * redacted. Nothing here knows how it is animated (see player.ts) or drawn.
 */

import type { RedactionKind } from './sanitize';

/**
 * story       a short walkthrough: the fewest captured steps that explain Velra
 * captured    every Velra command that was captured, in order
 * documented  the engineering example from Velra's own documentation
 */
export type ModeId = 'story' | 'captured' | 'documented';

/** Where a step's text comes from. A walkthrough step is still a captured one. */
export type Origin = 'captured' | 'documented';

export type Environment = 'windows' | 'linux' | 'docs';

/**
 * The label every step carries. A documented step is never marked captured,
 * and a guide is never marked as either: it is instruction, not evidence.
 */
export type Provenance = 'captured' | 'captured-redacted' | 'documented' | 'guide';

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  captured: 'Captured output',
  'captured-redacted': 'Captured output with privacy redactions',
  documented: 'Documented example',
  guide: 'Guide, not a recording',
};

/**
 * One row of terminal output.
 *
 * A `gap` is not output. It is an editorial marker for text that the source
 * does not contain, and it is drawn so that nobody can mistake it for
 * something Velra printed.
 */
export type OutputItem = { kind: 'line'; text: string } | { kind: 'gap'; text: string };

/**
 * complete      the whole output block was supplied
 * empty         the command printed nothing, and the source says so
 * partial       only part of the output was supplied
 * not-captured  the command or stage is known, its output is not
 */
export type OutputStatus = 'complete' | 'empty' | 'partial' | 'not-captured';

/**
 * How a fact in the inspector is known.
 *
 * observed and inferred are Velra's own labels, printed in the capsule. The
 * rest describe this page's relationship to the source, not the product's.
 *
 * recorded and to-verify belong to a guide. recorded marks the one thing an
 * earlier step in the same run did capture. to-verify marks something the
 * reader has to check for themselves, and it is never drawn as done.
 */
export type FieldTag =
  | 'observed'
  | 'inferred'
  | 'unlabelled'
  | 'output'
  | 'noted'
  | 'absent'
  | 'recorded'
  | 'to-verify';

export const FIELD_TAG_LABEL: Record<FieldTag, string> = {
  observed: 'Observed',
  inferred: 'Inferred',
  unlabelled: 'No label in output',
  output: 'From output',
  noted: 'From source notes',
  absent: 'Not in this output',
  recorded: 'Recorded in this run',
  'to-verify': 'Yours to check',
};

export interface InspectorField {
  label: string;
  value: string;
  tag: FieldTag;
  /**
   * Lines quoted from output. Each must appear verbatim in this step's own
   * output, or in the output of the step named by `evidenceFrom`.
   */
  evidence?: string[];
  /** The id of an earlier step whose output the evidence is quoted from. */
  evidenceFrom?: string;
  /** Plain explanation, shown when the row is expanded. */
  detail?: string;
}

export interface Inspector {
  /** The small label above the heading. "Capsule inspector" when not given. */
  kicker?: string;
  heading: string;
  summary: string;
  /** Rows are numbered, because their order is the point. */
  sequence?: boolean;
  fields: InspectorField[];
}

/**
 * Something for the reader to copy and use: a prompt to give Claude, or a
 * command to run. It is never output, and is never drawn as output.
 */
export interface GuideSnippet {
  kind: 'prompt' | 'command';
  /** Where it goes, shown above the text. */
  caption: string;
  /** Exactly what the copy button copies. */
  text: string;
  copyLabel: string;
  /** Announced when the copy succeeds. */
  copied: string;
}

/**
 * One instruction in a guide.
 *
 * Prose may mark inline code with backticks. Everything here is written for
 * the page. None of it is observed, and a guide carries no output lines.
 */
export interface GuidePart {
  /** A, B, C. */
  id: string;
  title: string;
  /** Paragraphs before the snippet. */
  body: string[];
  /** Conditions that must both hold, drawn as a pair. */
  requirements?: string[];
  snippet?: GuideSnippet;
  /** Paragraphs after the snippet. */
  after?: string[];
  /** What each check is evidence of, and no more. */
  establishes?: { check: string; shows: string }[];
  caveat?: string;
}

/** Instructions shown in place of a recording that does not exist. */
export interface Guide {
  /** Short name, used wherever the step would otherwise show a command. */
  label: string;
  lead: {
    kicker: string;
    /** Short sentences, kept separate so each can hold a line of its own. */
    headline: string[];
    body: string;
    note: string;
  };
  parts: GuidePart[];
  /** The closing statement of what this is not. */
  disclaimer: string;
}

export interface Redaction {
  kind: RedactionKind;
  count: number;
}

export interface Step {
  id: string;
  mode: Origin;
  /** The timeline phase this step belongs to. */
  phase: string;
  title: string;
  /** One or two plain sentences on what the command does. Shown above the terminal. */
  explain: string;
  environment: Environment;
  shell: string;
  /** The workspace label shown in the terminal header. */
  workspace: string;
  /** The prompt drawn before the command. */
  prompt: string;
  /** False when the source names the command but shows no prompt line. */
  promptSupplied: boolean;
  /** Null for a block that is not a command, such as delivered context. */
  command: string | null;
  /** Replaces the prompt line when there is no command. */
  contextLabel?: string;
  output: OutputItem[];
  outputStatus: OutputStatus;
  provenance: Provenance;
  source: { label: string; href?: string };
  redactions: Redaction[];
  note?: string;
  /** Set when the step is instruction rather than a transcript. Drawn in place of output. */
  guide?: Guide;
  inspector: Inspector;
}

/**
 * What is written by hand for one captured step.
 *
 * The command and its output come from the generated data. This is the rest:
 * where the step sits, what it is for, and what its output establishes.
 */
export interface StepMeta {
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

export interface Phase {
  id: string;
  label: string;
  caption: string;
  environment: Environment;
  /** A stage shown as guidance, because no recording of it exists. */
  guide?: boolean;
}

export interface Mode {
  id: ModeId;
  label: string;
  provenance: string;
  description: string;
  phases: Phase[];
  steps: Step[];
}
