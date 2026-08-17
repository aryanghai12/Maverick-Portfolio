'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Advances a step counter once the element is on screen, so a panel can assemble
 * itself in order. Used by the project instruments.
 *
 * Under prefers-reduced-motion it jumps straight to the final step: the panel is
 * complete and readable, it just does not perform. That is the accessibility
 * floor for every animation on this site — nothing is ever only available to
 * someone who can watch it happen.
 */
export function useStagedReveal(
  steps: number,
  { interval = 180, threshold = 0.3, delay = 120 } = {},
) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(steps);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.disconnect();
          for (let i = 1; i <= steps; i++) {
            timers.push(setTimeout(() => setStep(i), delay + i * interval));
          }
        }
      },
      { threshold },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [steps, interval, threshold, delay]);

  return { ref, step };
}
