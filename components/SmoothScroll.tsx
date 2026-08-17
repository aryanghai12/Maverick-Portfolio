'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Lenis, kept deliberately short at 0.9s. Smooth scrolling that outlasts the
 * gesture stops feeling smooth and starts feeling like lag — the point is to
 * take the edge off a wheel step, not to take the wheel away from the visitor.
 *
 * Disabled entirely under prefers-reduced-motion, where hijacking the scroll is
 * exactly the thing being asked for less of.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      // Touch devices already have momentum scrolling that feels native; adding
      // ours on top fights the platform.
      syncTouch: false,
    });

    let raf = 0;
    const frame = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // In-page anchors must go through Lenis or they jump while it interpolates.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href')!.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -20 });
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
