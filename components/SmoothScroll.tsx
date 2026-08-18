'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { registerLenis, scrollToId } from '@/lib/scroll';

/**
 * Lenis, kept deliberately short at 0.9s. Smooth scrolling that outlasts the
 * gesture stops feeling smooth and starts feeling like lag. The point is to
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

      /* Nested panes keep their own scroll.
       *
       * Lenis listens for wheel on the window and cancels the native event, so
       * without this a wheel gesture anywhere, including over the command
       * palette list or the wall of merged pull requests, scrolled the whole
       * page and left the list under the pointer sitting still. Any element
       * carrying data-lenis-prevent is already honoured by Lenis itself; the
       * class check below covers every scroll pane on the site in one place so
       * a new one cannot be added and forgotten.
       */
      prevent: (node) =>
        node instanceof HTMLElement && node.classList.contains('scroll-wall'),
    });

    registerLenis(lenis);

    let raf = 0;
    const frame = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // In-page anchors must go through Lenis or they jump while it interpolates.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href')!.slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      scrollToId(id);
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      cancelAnimationFrame(raf);
      registerLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
