'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const SECTIONS = [
  ['hero', 'Home'],
  ['upstream', 'Proof'],
  ['work', 'Work'],
  ['about', 'About'],
  ['connect', 'Contact'],
] as const;

/**
 * The navigation bar.
 *
 * What was here before was a column of six tick marks on the right edge that
 * only appeared above 1024px and told you nothing about where they went until
 * you hovered one. That is decoration wearing navigation's clothes. This is a
 * real bar with real words in it, present at every width.
 *
 * The active state is a single pill that slides between items rather than six
 * pills cross-fading, which is one transform per change instead of six
 * repaints, and reads as one object moving rather than a row blinking.
 */
export function Nav() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pill, setPill] = useState({ x: 0, w: 0, ready: false });

  const [overflow, setOverflow] = useState<'none' | 'start' | 'end' | 'both'>('none');

  const barRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  /* Section tracking gets its own observer rather than being derived from
     scrollY, so it stays correct when sections change height on resize. */
  useEffect(() => {
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
    return () => io.disconnect();
  }, []);

  // Scroll progress, read once per frame at most.
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
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* Measure the active link and park the pill on it. Runs in a layout effect so
     the pill is never painted at a stale position, and re-runs on resize and
     once the webfont has actually landed, because both change the widths. */
  useLayoutEffect(() => {
    const place = () => {
      const el = linkRefs.current[active];
      if (!el) return;
      setPill({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
    };
    place();

    window.addEventListener('resize', place);
    const ro = barRef.current ? new ResizeObserver(place) : null;
    if (ro && barRef.current) ro.observe(barRef.current);
    document.fonts?.ready.then(place).catch(() => {});

    return () => {
      window.removeEventListener('resize', place);
      ro?.disconnect();
    };
  }, [active]);

  /* On a narrow screen the six words do not fit and the bar scrolls sideways.
     Fade whichever edge still has something behind it, so a destination that is
     off screen announces itself instead of simply not existing. */
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const read = () => {
      const slack = bar.scrollWidth - bar.clientWidth;
      if (slack <= 2) return setOverflow('none');
      const atStart = bar.scrollLeft <= 2;
      const atEnd = bar.scrollLeft >= slack - 2;
      setOverflow(atStart ? 'end' : atEnd ? 'start' : 'both');
    };
    read();

    bar.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    const ro = new ResizeObserver(read);
    ro.observe(bar);
    return () => {
      bar.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
      ro.disconnect();
    };
  }, []);

  /* Keep the active item in view when the bar is scrolled sideways.
     
     The bar's own scrollLeft is set directly rather than calling
     scrollIntoView, which is allowed to scroll every ancestor including the
     document, and a stray document scroll here would be fighting Lenis for the
     page position on every section change. */
  useEffect(() => {
    const bar = barRef.current;
    const el = linkRefs.current[active];
    if (!bar || !el || overflow === 'none') return;
    const wanted = el.offsetLeft - (bar.clientWidth - el.offsetWidth) / 2;
    bar.scrollTo({
      left: Math.max(0, Math.min(wanted, bar.scrollWidth - bar.clientWidth)),
      behavior: 'smooth',
    });
  }, [active, overflow]);

  return (
    <>
      {/* Progress rail, hairline, pinned to the very top of the viewport. */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[58] h-px w-full bg-[var(--edge)]/50"
      >
        <span
          className="block h-full origin-left bg-[var(--accent)] will-change-transform"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <nav
        ref={barRef}
        className="nav-bar"
        aria-label="Primary"
        data-of={overflow === 'none' ? undefined : overflow}
      >
        <span
          aria-hidden
          className="nav-pill"
          style={{
            transform: `translateX(${pill.x}px)`,
            width: pill.w,
            opacity: pill.ready ? 1 : 0,
          }}
        />
        {SECTIONS.map(([id, label], i) => (
          <a
            key={id}
            ref={(el) => {
              linkRefs.current[i] = el;
            }}
            href={`#${id}`}
            className="nav-link"
            data-active={active === i ? '1' : undefined}
            aria-current={active === i ? 'true' : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
    </>
  );
}
