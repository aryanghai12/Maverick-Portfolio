'use client';

import { useEffect, useState } from 'react';
import { IconCheck, IconCopy } from './icons';
import { copyText } from '@/lib/velra/clipboard';

interface Props {
  text: string;
  label: string;
  className?: string;
  /** Announced on success. Defaults to reading the copied text back, which suits a short command. */
  copied?: string;
}

/**
 * A button that copies one string and reports what happened.
 *
 * The result is shown on the button and announced, and a refused copy says so
 * instead of pretending. The text it copies is always visible next to it.
 */
export function CopyButton({ text, label, className = 'vl-btn vl-btn-ghost', copied }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), 2200);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <>
      <button
        type="button"
        className={className}
        data-done={state === 'copied' ? '1' : undefined}
        onClick={async () => setState((await copyText(text)) ? 'copied' : 'failed')}
      >
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}
        {state === 'copied' ? <IconCheck /> : <IconCopy />}
      </button>
      <span className="vl-sr" role="status">
        {state === 'copied'
          ? (copied ?? `Copied: ${text}`)
          : state === 'failed'
            ? 'Copy failed. Select the text instead.'
            : ''}
      </span>
    </>
  );
}
