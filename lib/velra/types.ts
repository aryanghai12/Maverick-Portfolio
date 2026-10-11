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

/** The label every transcript carries. A documented step is never marked captured. */
export type Provenance = 'captured' | 'captured-redacted' | 'documented' | 'pending';

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  captured: 'Captured output',
  'captured-redacted': 'Captured output with privacy redactions',
  documented: 'Documented example',
  pending: 'Not captured',
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
 */
export type FieldTag =
  | 'observed'
  | 'inferred'
  | 'unlabelled'
  | 'output'
  | 'noted'
  | 'absent'
  | 'not-captured';

export const FIELD_TAG_LABEL: Record<FieldTag, string> = {
  observed: 'Observed',
  inferred: 'Inferred',
  unlabelled: 'No label in output',
  output: 'From output',
  noted: 'From source notes',
  absent: 'Not in this output',
  'not-captured': 'Not captured',
};

export interface InspectorField {
  label: string;
  value: string;
  tag: FieldTag;
  /** Lines quoted from this step's own output. Each must appear in it verbatim. */
  evidence?: string[];
  /** Plain explanation, shown when the row is expanded. */
  detail?: string;
}

export interface Inspector {
  heading: string;
  summary: string;
  fields: InspectorField[];
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
  inspector: Inspector;
}

export interface Phase {
  id: string;
  label: string;
  caption: string;
  environment: Environment;
  /** A stage that is known to exist but has no recording behind it. */
  pending?: boolean;
}

export interface Mode {
  id: ModeId;
  label: string;
  provenance: string;
  description: string;
  phases: Phase[];
  steps: Step[];
}
