'use client';

import { useEffect } from 'react';

/**
 * One driver for every card that swings out of the page's depth.
 *
 * Any element carrying data-depth gets a --p custom property written to it,
 * running -1 when it is a full screen below the fold, through 0 when it is
 * centred, to 1 when it has left the top. The transform itself lives in CSS
 * (.depth), so this file never touches layout and the compositor does the work.
 *
 * A single scroll listener updates every registered element rather than each
 * card mounting its own: fifteen scroll listeners and fifteen
 * getBoundingClientRect calls per frame is exactly how a scroll-linked page
 * starts dropping frames.
 */
export function ScrollDepth() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let els: HTMLElement[] = [];
    let raf = 0;

    const collect = () => {
      els = Array.from(document.querySelectorAll<HTMLElement>('[data-depth]'));
    };

    const read = () => {
      raf = 0;
      const vh = window.innerHeight;
      const mid = vh * 0.5;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        // Skip anything far outside the viewport: writing a property nobody can
        // see still invalidates style for that subtree.
        if (r.bottom < -vh || r.top > vh * 2) continue;
        const centre = r.top + r.height * 0.5;
        const p = Math.max(-1, Math.min(1, (mid - centre) / (mid + r.height * 0.5)));
        el.style.setProperty('--p', p.toFixed(4));
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    collect();
    read();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Sections change height as fonts land and reveals run; recollect once the
    // page has settled rather than polling for it.
    const settle = setTimeout(() => {
      collect();
      read();
    }, 1200);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clearTimeout(settle);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
