'use client';

import { useEffect } from 'react';

/**
 * One delegated pointer handler for every card that lights up under the cursor.
 *
 * Delegated on purpose: a pointermove listener per card means one handler firing
 * for every card the pointer crosses, and a page with twenty glass panels ends
 * up doing twenty rect measurements a frame. This measures exactly the one card
 * the pointer is actually over.
 */
export function Spotlight() {
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let current: HTMLElement | null = null;
    let raf = 0;
    let cx = 0;
    let cy = 0;

    const apply = () => {
      raf = 0;
      if (!current) return;
      const r = current.getBoundingClientRect();
      current.style.setProperty('--mx', `${((cx - r.left) / r.width) * 100}%`);
      current.style.setProperty('--my', `${((cy - r.top) / r.height) * 100}%`);
      current.style.setProperty('--spot', '1');
    };

    const onMove = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-spot]') ?? null;

      if (target !== current) {
        current?.style.setProperty('--spot', '0');
        current = target;
      }
      if (!current) return;

      cx = e.clientX;
      cy = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      current?.style.setProperty('--spot', '0');
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
