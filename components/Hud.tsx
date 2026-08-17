'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  ['hero', '00'],
  ['about', '01'],
  ['work', '02'],
  ['stack', '03'],
  ['upstream', '04'],
  ['connect', '05'],
] as const;

/**
 * Persistent chrome: corner ticks, a scroll progress rail, and a section
 * indicator. It is decorative framing, so all of it is aria-hidden — the nav
 * links are the one part that carries meaning, and those are real anchors.
 */
export function Hud() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;

    const read = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    read();

    // Section tracking gets its own observer rather than being derived from
    // scrollY, so it stays correct when sections change height on resize.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = SECTIONS.findIndex(([id]) => id === e.target.id);
          if (i >= 0) setActive(i);
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Corner ticks */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-40">
        {[
          'top-4 left-4 border-t border-l',
          'top-4 right-4 border-t border-r',
          'bottom-4 left-4 border-b border-l',
          'bottom-4 right-4 border-b border-r',
        ].map((c) => (
          <span key={c} className={`absolute h-3.5 w-3.5 border-[var(--edge)] ${c}`} />
        ))}
      </div>

      {/* Progress rail */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-50 h-px w-full bg-[var(--edge)]/40"
      >
        <span
          className="block h-full origin-left bg-[var(--ember)] will-change-transform"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {/* Section rail — real anchors, so it is navigation, not decoration. */}
      <nav
        className="fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 lg:block"
        aria-label="Sections"
      >
        <ul className="m-0 flex list-none flex-col items-end gap-3 p-0">
          {SECTIONS.map(([id, num], i) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="group flex items-center gap-2"
                aria-current={active === i ? 'true' : undefined}
              >
                <span
                  className="u-mono text-[0.6rem] tracking-[0.1em] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                  style={{ color: active === i ? 'var(--ember)' : 'var(--mute)' }}
                >
                  {id}
                </span>
                <span
                  className="u-mono text-[0.6rem] tracking-[0.1em] transition-colors duration-300"
                  style={{ color: active === i ? 'var(--ember)' : 'var(--mute)' }}
                >
                  {num}
                </span>
                <span
                  aria-hidden
                  className="h-px transition-all duration-300"
                  style={{
                    width: active === i ? 18 : 8,
                    background: active === i ? 'var(--ember)' : 'var(--edge)',
                  }}
                />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
