'use client';

import { Fragment, useLayoutEffect, useRef } from 'react';
import { IconChevron } from './icons';
import type { Phase, Step } from '@/lib/velra/types';

export type Signal = 'ok' | 'warn' | 'err' | 'partial' | 'missing' | 'empty' | 'plain';

const SIGNAL: Record<Signal, string> = {
  ok: 'Succeeded',
  warn: 'Printed a warning',
  err: 'Printed an error',
  partial: 'Only part of the output was supplied',
  missing: 'Output not captured',
  empty: 'Printed nothing',
  plain: 'Output',
};

/** What a step's own output says about how it went. Read from the text, never assumed. */
export function signalOf(step: Step): Signal {
  // A guide is not a command that went missing. It has nothing to flag.
  if (step.guide) return 'plain';
  if (step.outputStatus === 'not-captured') return 'missing';
  if (step.outputStatus === 'partial') return 'partial';
  if (step.outputStatus === 'empty') return 'empty';
  const lines = step.output.filter((o) => o.kind === 'line').map((o) => o.text);
  if (lines.some((l) => /^\s*✗/.test(l) || /^error:/.test(l) || /command not found/.test(l))) return 'err';
  if (lines.some((l) => /^\s*!/.test(l))) return 'warn';
  if (lines.some((l) => /^\s*[✓⚡]/.test(l))) return 'ok';
  return 'plain';
}

interface Props {
  steps: Step[];
  phases: Phase[];
  index: number;
  onSelect: (index: number) => void;
  open: boolean;
  onToggle: () => void;
  toggleRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * The step rail: the session timeline and the command history in one list.
 *
 * Steps run down a single track, grouped under the capture they came from, so
 * the move from the first install to a later working session is a visible
 * break and not something to infer. Each step is a button, named in
 * plain words first and by its command second. A step that is a guide, with no
 * recording behind it, is drawn dashed and says what it is where a command
 * would be.
 *
 * On a narrow screen the rail folds behind one toggle, so the terminal is not
 * pushed off the page.
 */
export function ReplayRail({ steps, phases, index, onSelect, open, onToggle, toggleRef }: Props) {
  const listRef = useRef<HTMLOListElement>(null);
  const current = steps[index];

  /* Keep the active row in view, and otherwise leave the list exactly where
     the visitor put it.

     The row's position is measured against the list with bounding boxes. Its
     offsetTop would be measured from its own list item, which is positioned to
     carry the track, so it would always read zero and the list would be sent
     back to the top on every selection.

     The list's own scroll position is moved, never scrollIntoView, which is
     allowed to scroll the page as well and would drag the visitor away from
     the terminal every time playback advanced.

     `open` is a dependency because on a narrow screen the list is hidden
     while the drawer is shut, and a hidden list has no boxes to measure. It is
     brought to the active row at the moment it is shown.

     A layout effect, so the adjustment lands in the same frame as the new
     selection. As an ordinary effect it ran a frame late, and during playback
     the highlighted row could be painted once below the fold before the list
     caught up. */
  useLayoutEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!list || !row || list.clientHeight === 0) return;

    const listBox = list.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const top = rowBox.top - listBox.top + list.scrollTop;
    const bottom = top + rowBox.height;
    const margin = 44;

    if (top < list.scrollTop) list.scrollTop = Math.max(0, top - margin);
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight + margin;
    }
  }, [index, steps, open]);

  return (
    <aside className="vl-rail" aria-label="Steps">
      <button
        ref={toggleRef}
        type="button"
        className="vl-rail-toggle"
        aria-expanded={open}
        aria-controls="vl-rail-panel"
        onClick={onToggle}
      >
        <span>
          <b>
            {index + 1} of {steps.length}
          </b>
          {current?.title}
        </span>
        <span>
          All steps
          <IconChevron />
        </span>
      </button>

      <div id="vl-rail-panel" className="vl-rail-panel" data-open={open ? '1' : undefined}>
        <ol ref={listRef} className="vl-rail-list vl-scroll" aria-label="Session timeline">
          {steps.map((step, i) => {
            const phase = phases.find((p) => p.id === step.phase);
            const first = i === 0 || steps[i - 1].phase !== step.phase;
            const state = i < index ? 'done' : i === index ? 'current' : 'todo';
            const signal = signalOf(step);
            return (
              <Fragment key={step.id}>
                {first && phase ? (
                  <li className="vl-rail-phase" data-env={phase.environment} data-guide={phase.guide ? '1' : undefined}>
                    <b>{phase.label}</b>
                    <span>{phase.caption}</span>
                  </li>
                ) : null}
                <li className="vl-rail-step" data-state={state} data-guide={step.guide ? '1' : undefined}>
                  <button
                    type="button"
                    aria-current={state === 'current' ? 'step' : undefined}
                    onClick={() => onSelect(i)}
                  >
                    <span className="vl-rail-dot" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="vl-rail-text">
                      <span className="vl-rail-title">{step.title}</span>
                      {step.command ? (
                        <span className="vl-rail-cmd">{step.command}</span>
                      ) : step.guide ? (
                        <span className="vl-rail-cmd" data-guide="1">
                          {step.guide.label}
                        </span>
                      ) : null}
                    </span>
                    {signal === 'warn' || signal === 'err' || signal === 'partial' || signal === 'missing' ? (
                      <span className="vl-sig" data-sig={signal} title={SIGNAL[signal]}>
                        <span aria-hidden="true">
                          {signal === 'warn' ? '!' : signal === 'err' ? '×' : signal === 'partial' ? '…' : '?'}
                        </span>
                        <span className="vl-sr">{SIGNAL[signal]}</span>
                      </span>
                    ) : null}
                  </button>
                </li>
              </Fragment>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
