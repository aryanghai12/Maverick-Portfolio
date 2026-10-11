'use client';

import { useEffect, useState } from 'react';
import { IconCheck, IconCopy } from './icons';
import { copyText } from '@/lib/velra/clipboard';

interface Props {
  text: string;
  label: string;
  className?: string;
}

/**
 * A button that copies one string and reports what happened.
 *
 * The result is shown on the button and announced, and a refused copy says so
 * instead of pretending. The text it copies is always visible next to it.
 */
export function CopyButton({ text, label, className = 'vl-btn vl-btn-ghost' }: Props) {
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
        onClick={async () => setState((await copyText(text)) ? 'copied' : 'failed')}
      >
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}
        {state === 'copied' ? <IconCheck /> : <IconCopy />}
      </button>
      <span className="vl-sr" role="status">
        {state === 'copied'
          ? `Copied: ${text}`
          : state === 'failed'
            ? 'Copy failed. Select the command text instead.'
            : ''}
      </span>
    </>
  );
}
