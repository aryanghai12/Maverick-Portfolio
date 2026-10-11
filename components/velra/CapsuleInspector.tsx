'use client';

import { useState } from 'react';
import { IconChevron, IconExternal } from './icons';
import { RichText } from './TerminalLine';
import { REDACTION_INFO } from '@/lib/velra/transcripts';
import { FIELD_TAG_LABEL, type FieldTag, type Step } from '@/lib/velra/types';

/** What each tag claims, in one sentence, shown whenever a row is opened. */
const TAG_MEANING: Record<FieldTag, string> = {
  observed: 'Velra labels this section OBSERVED: it was read from a prompt or a tool event.',
  inferred: 'Velra labels this section INFERRED: it was derived from observed rows.',
  unlabelled: 'Printed by Velra without an OBSERVED or INFERRED label.',
  output: 'Read directly from the lines printed in this step.',
  noted: 'Not in the output. Taken from notes or documentation that accompany it.',
  absent: 'This output does not contain it. Nothing has been filled in.',
  recorded: 'Recorded earlier in this run. The lines above are quoted from the step that printed them.',
  'to-verify': 'Guidance. Nothing in this run shows it happening, so it is not marked as done.',
};

/**
 * The capsule inspector: what the active step establishes, and how it is known.
 *
 * Every row opens. Inside is the tag's meaning, any explanation, and the exact
 * lines of output the row was read from, so a claim can be checked against the
 * terminal beside it without leaving the page.
 *
 * For a guide the same panel becomes a numbered sequence under its own name.
 * The rows are the things that happen, in order, and each says whether this
 * run recorded it or the reader has to check it. Nothing is ticked off.
 *
 * The parent gives this a key of the step id, so rows fold shut on every step
 * change and no stale row is left open against different content.
 */
export function CapsuleInspector({ step }: { step: Step }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const { inspector } = step;
  const allOpen = open.size === inspector.fields.length;
  const kicker = inspector.kicker ?? 'Capsule inspector';
  const List = inspector.sequence ? 'ol' : 'ul';

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <aside className="vl-insp vl-scroll" aria-label={kicker} data-guide={step.guide ? '1' : undefined}>
      <div className="vl-insp-head">
        <div>
          <p className="vl-kicker">{kicker}</p>
          <h3>{inspector.heading}</h3>
        </div>
        <button
          type="button"
          className="vl-textbtn"
          onClick={() => setOpen(allOpen ? new Set() : new Set(inspector.fields.map((_, i) => i)))}
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      <p className="vl-insp-sum">{inspector.summary}</p>

      <List className="vl-fields" data-sequence={inspector.sequence ? '1' : undefined}>
        {inspector.fields.map((field, i) => {
          const expanded = open.has(i);
          const id = `vl-field-${step.id}-${i}`;
          return (
            <li key={field.label} className="vl-field" data-tag={field.tag}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={expanded ? id : undefined}
                onClick={() => toggle(i)}
              >
                {inspector.sequence ? (
                  <span className="vl-field-no" aria-hidden="true">
                    {i + 1}
                  </span>
                ) : null}
                <span className="vl-field-label">{field.label}</span>
                <span className="vl-field-side">
                  <span className="vl-tag" data-tag={field.tag}>
                    {FIELD_TAG_LABEL[field.tag]}
                  </span>
                  <IconChevron />
                </span>
                <span className="vl-field-value">
                  <RichText text={field.value} />
                </span>
              </button>
              {expanded ? (
                <div id={id} className="vl-field-more">
                  {field.detail ? <p>{field.detail}</p> : null}
                  {field.evidence?.length ? (
                    <div
                      className="vl-evidence"
                      aria-label={
                        field.evidenceFrom ? 'Lines quoted from an earlier step' : 'Lines quoted from this output'
                      }
                    >
                      {field.evidence.map((line) => (
                        <div key={line}>
                          <RichText text={line} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <p className="vl-dim">{TAG_MEANING[field.tag]}</p>
                </div>
              ) : null}
            </li>
          );
        })}
      </List>

      {step.redactions.length ? (
        <div className="vl-insp-block">
          <p className="vl-kicker">Redactions in this step</p>
          <ul>
            {step.redactions.map((r) => (
              <li key={r.kind}>
                {REDACTION_INFO[r.kind].label} × {r.count}
                <span>{REDACTION_INFO[r.kind].reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="vl-insp-foot">
        <p className="vl-kicker">Source</p>
        <p>
          {step.source.href ? (
            <a className="vl-link" href={step.source.href} target="_blank" rel="noreferrer noopener">
              {step.source.label}
              <span className="vl-sr"> (opens on GitHub)</span>
              <IconExternal />
            </a>
          ) : (
            step.source.label
          )}
        </p>
      </div>
    </aside>
  );
}
