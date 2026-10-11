'use client';

import { Fragment, useEffect, useRef } from 'react';
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

const ENV_LABEL = { windows: 'Windows', linux: 'Linux', docs: 'Velra docs' } as const;

/** What a step's own output says about how it went. Read from the text, never assumed. */
export function signalOf(step: Step): Signal {
  if (step.outputStatus === 'not-captured') return 'missing';
  if (step.outputStatus === 'partial') return 'partial';
  if (step.outputStatus === 'empty') return 'empty';
  const lines = step.output.filter((o) => o.kind === 'line').map((o) => o.text);
  if (lines.some((l) => /^\s*✗/.test(l) || /command not found/.test(l))) return 'err';
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
 * Steps run down a single track, grouped under the environment they were run
 * in, so the change from the Windows install to the Linux workspace is a
 * visible break and not something to infer. Each step is a button, named in
 * plain words first and by its command second. A step with no recording behind
 * it is drawn dashed.
 *
 * On a narrow screen the rail folds behind one toggle, so the terminal is not
 * pushed off the page.
 */
export function ReplayRail({ steps, phases, index, onSelect, open, onToggle, toggleRef }: Props) {
  const listRef = useRef<HTMLOListElement>(null);
  const current = steps[index];

  /* Keep the active row in view by moving the list's own scroll position.
     scrollIntoView is allowed to scroll the page as well, which would drag the
     visitor away from the terminal every time playback advanced. */
  useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!list || !row) return;
    const top = row.offsetTop - list.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < list.scrollTop + 8) list.scrollTop = Math.max(0, top - 48);
    else if (bottom > list.scrollTop + list.clientHeight - 8) {
      list.scrollTop = bottom - list.clientHeight + 48;
    }
  }, [index, steps]);

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
                  <li className="vl-rail-phase" data-env={phase.environment} data-pending={phase.pending ? '1' : undefined}>
                    <b>{phase.pending ? phase.label : ENV_LABEL[phase.environment]}</b>
                    <span>{phase.caption}</span>
                  </li>
                ) : null}
                <li className="vl-rail-step" data-state={state} data-pending={step.outputStatus === 'not-captured' && step.command === null ? '1' : undefined}>
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
                      {step.command ? <span className="vl-rail-cmd">{step.command}</span> : null}
                    </span>
                    {signal === 'warn' || signal === 'partial' || signal === 'missing' ? (
                      <span className="vl-sig" data-sig={signal} title={SIGNAL[signal]}>
                        <span aria-hidden="true">{signal === 'warn' ? '!' : signal === 'partial' ? '…' : '?'}</span>
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
