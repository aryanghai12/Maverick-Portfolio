'use client';

import { useEffect, useRef, useState } from 'react';
import { about } from '@/lib/content';

const { command, prompt, output } = about.console;

/**
 * The console panel.
 *
 * Two rules, both from hard experience with how these read:
 *
 * 1. The *command* is typed character by character. The *output* is not. Reading
 *    runs about 250 wpm and character typing runs about 30, so typing prose is
 *    user hostile. It makes a visitor wait on a machine pretending to be slow.
 *    Output lines stagger in whole, ~90ms apart.
 *
 * 2. Every character is in the DOM at first paint and only its opacity changes.
 *    Nothing here is built by JS, so the text survives with JS disabled and
 *    reads correctly to a screen reader via aria-label on the parent.
 */
export function Console() {
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState(0);
  const [lines, setLines] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setTyped(command.length);
      setLines(output.length);
      setDone(true);
      return;
    }

    let timers: ReturnType<typeof setTimeout>[] = [];

    const run = () => {
      // Type the command, then release the output a line at a time.
      for (let i = 1; i <= command.length; i++) {
        timers.push(setTimeout(() => setTyped(i), 260 + i * 58));
      }
      const afterCommand = 260 + command.length * 58 + 300;
      for (let i = 1; i <= output.length; i++) {
        timers.push(setTimeout(() => setLines(i), afterCommand + i * 90));
      }
      timers.push(setTimeout(() => setDone(true), afterCommand + output.length * 90 + 200));
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.disconnect();
          run();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} className="glass overflow-hidden" data-rv="scale">
      {/* Title bar. Three dots would be a macOS pastiche; a label and a status
          LED say the same thing and belong to this design. */}
      <div className="flex items-center gap-3 border-b border-[var(--hair-soft)] px-4 py-3 sm:px-5">
        <span
          aria-hidden
          className={`h-[6px] w-[6px] rounded-full transition-colors duration-500 ${
            done ? 'bg-[var(--accent)]' : 'bg-[var(--mute)]'
          }`}
        />
        <span className="t-label !text-[0.6rem]">session · zsh</span>
        <span aria-hidden className="ml-auto t-label !text-[0.6rem]">
          ~/aryan
        </span>
      </div>

      <div className="px-4 py-5 font-[family-name:var(--font-mono)] text-[clamp(0.74rem,0.68rem+0.3vw,0.86rem)] leading-[1.9] sm:px-6 sm:py-6">
        {/* Command line */}
        <div aria-label={`${prompt} ~ % ${command}`}>
          <span className="text-[var(--accent)]" aria-hidden>
            {prompt}
          </span>
          <span className="text-[var(--mute)]" aria-hidden>
            {' '}
            ~ %{' '}
          </span>
          <span aria-hidden>
            {[...command].map((ch, i) => (
              <span
                key={i}
                className="text-[var(--bone)] transition-opacity duration-100"
                style={{ opacity: i < typed ? 1 : 0 }}
              >
                {ch}
              </span>
            ))}
          </span>
          <span
            aria-hidden
            className={`ml-[2px] inline-block h-[1.05em] w-[7px] translate-y-[0.18em] bg-[var(--accent)] ${
              done ? 'caret-blink' : ''
            }`}
          />
        </div>

        {/* Output: whole lines, staggered. */}
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 sm:gap-x-8">
          {output.map(([key, value], i) => (
            <div
              key={key}
              className="col-span-2 grid grid-cols-subgrid transition-opacity duration-500"
              style={{ opacity: i < lines ? 1 : 0 }}
            >
              <dt className="text-[var(--mute)]">{key}</dt>
              <dd className="m-0 text-[var(--bone-dim)]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
