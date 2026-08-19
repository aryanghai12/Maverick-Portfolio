'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { about, identity } from '@/lib/content';
import { Tilt } from './Tilt';

const { command, prompt, output } = about.console;

/**
 * The session, standing in space.
 *
 * A terminal is the right object for this page, but a flat rectangle of
 * monospace pinned to a column is the version every developer portfolio already
 * has. This one sits on glass, floats above the field, is turned toward the
 * pointer, and swings out of the depth of the page as it arrives.
 *
 * What it prints is real and is stated once, here, rather than being repeated in
 * prose elsewhere. The command types out; the output arrives a whole line at a
 * time, because a character-by-character reveal of five lines takes eight
 * seconds and nobody waits.
 *
 * Everything is in the markup at first paint. A visitor with JavaScript off, a
 * crawler, or anyone under prefers-reduced-motion gets the finished session
 * immediately: the animation only ever replaces content that was already there.
 */
export function Terminal3D() {
  const [typed, setTyped] = useState(command.length);
  const [lines, setLines] = useState(output.length);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Rewind to an empty prompt, then play the session the first time it is
    // actually looked at.
    setTyped(0);
    setLines(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();

        for (let i = 1; i <= command.length; i++) {
          timers.push(setTimeout(() => setTyped(i), 260 + i * 62));
        }
        const afterCommand = 260 + command.length * 62 + 340;
        for (let i = 1; i <= output.length; i++) {
          timers.push(setTimeout(() => setLines(i), afterCommand + i * 170));
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

  const done = lines >= output.length;

  return (
    <div
      ref={ref}
      className="depth"
      data-depth
      data-rv="scale"
      style={{ '--dir': -1 } as React.CSSProperties}
    >
      <Tilt>
        <div className="glass spot overflow-hidden" data-spot>
          {/* Chrome. A label and a live dot rather than three coloured circles,
              which are a picture of somebody else's operating system. */}
          <div className="relative z-[3] flex items-center gap-3 border-b border-[var(--hair-soft)] px-4 py-3">
            <span aria-hidden className="led h-[6px] w-[6px] rounded-full bg-[var(--accent)]" />
            <span className="t-label !text-[0.73rem]">session · read only</span>
            <span className="u-mono ml-auto text-[0.73rem] text-[var(--mute)]">
              {identity.tzLabel}
            </span>
          </div>

          <div className="relative z-[3] px-4 py-5 font-[family-name:var(--font-mono)] text-[0.76rem] leading-[1.9] sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[var(--accent)]">{prompt}</span>
              <span className="text-[var(--mute)]">~ %</span>
              <span className="text-[var(--bone)]">
                {command.slice(0, typed)}
                {!done ? (
                  <span aria-hidden className="caret-blink text-[var(--accent)]">
                    ▍
                  </span>
                ) : null}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-[4.6rem_minmax(0,1fr)] gap-x-4 gap-y-1.5">
              {output.map(([k, v], i) => {
                /* The style goes on the two cells rather than on a wrapper.
                   A wrapper would need display:contents to stay out of the
                   grid, and an element with display:contents generates no box,
                   so opacity on it does nothing at all. */
                const step = {
                  opacity: i < lines ? 1 : 0,
                  transition: 'opacity 420ms var(--ease-out)',
                };
                return (
                  <Fragment key={k}>
                    <dt className="text-[var(--mute)]" style={step}>
                      {k}
                    </dt>
                    <dd className="m-0 text-[var(--bone-dim)]" style={step}>
                      {v}
                    </dd>
                  </Fragment>
                );
              })}
            </dl>

            <div
              className="mt-5 flex items-center gap-2 border-t border-[var(--hair-soft)] pt-4"
              style={{
                opacity: done ? 1 : 0,
                transition: 'opacity 500ms var(--ease-out)',
              }}
            >
              <span className="text-[var(--accent)]">{prompt}</span>
              <span className="text-[var(--mute)]">~ %</span>
              <span aria-hidden className="caret-blink text-[var(--bone)]">
                ▍
              </span>
            </div>
          </div>
        </div>
      </Tilt>
    </div>
  );
}
