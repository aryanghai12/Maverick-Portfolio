'use client';

import { useEffect } from 'react';

/**
 * Scroll reveals for /velra, as progressive enhancement.
 *
 * Everything is visible in the server-rendered HTML. On mount this hides only
 * the marked elements that are still below the fold, then lets each one settle
 * in as it arrives. Without script, or with reduced motion, nothing is ever
 * hidden, so there is no version of the page with missing content.
 */
export function Reveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.remove('vl-pending');
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );

    for (const el of document.querySelectorAll<HTMLElement>('.velra [data-vl-reveal]')) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) continue;
      el.classList.add('vl-pending');
      io.observe(el);
    }

    return () => {
      io.disconnect();
      for (const el of document.querySelectorAll('.velra .vl-pending')) el.classList.remove('vl-pending');
    };
  }, []);

  return null;
}
