'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A figure that counts up the first time it is scrolled into view.
 *
 * The final value is what renders on the server and what a crawler, a reader
 * with JavaScript off, and anyone under prefers-reduced-motion sees. The count
 * only ever replaces a number that is already correct, and only once.
 */
export function CountUp({
  to,
  duration = 1150,
  className = '',
  suffix = '',
  /** Thousands separators. Off for anything that is not a quantity: a year
      rendered as 2,023 is a typo the eye catches instantly. */
  grouped = true,
}: {
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  grouped?: boolean;
}) {
  const [value, setValue] = useState(to);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || done.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || done.current) return;
        done.current = true;
        io.disconnect();

        const start = performance.now();
        let raf = 0;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // Ease out quint: fast at the top, and the last few numerals crawl,
          // which is the part that reads as a counter settling.
          const e = 1 - Math.pow(1 - t, 5);
          setValue(Math.round(to * e));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
      },
      { threshold: 0.4 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {grouped ? value.toLocaleString('en-GB') : value}
      {suffix}
    </span>
  );
}
