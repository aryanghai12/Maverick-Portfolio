'use client';

import { useEffect, useRef } from 'react';

/**
 * Pointer-tracked 3D tilt with a specular glint.
 *
 * Capped at 6° / 4°. Small rotations read as a physical object catching the
 * light; large ones read as a demo of a tilt library, which is the tell on half
 * the portfolios on the internet.
 *
 * The pointer handler writes to CSS custom properties inside a rAF, so multiple
 * pointer events between frames collapse into a single style write and the
 * glint position is interpolated by the compositor rather than by React.
 */
export function Tilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No tilt on touch (there is no hover to track) and none under reduced motion.
    const coarse = window.matchMedia('(hover: none)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (coarse || reduce) return;

    let raf = 0;
    let px = 0.5;
    let py = 0.5;
    let active = false;

    const apply = () => {
      raf = 0;
      const rx = (0.5 - py) * 2 * 4; // 4° on X
      const ry = (px - 0.5) * 2 * 6; // 6° on Y
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      el.style.setProperty('--rx', active ? `${rx}deg` : '0deg');
      el.style.setProperty('--ry', active ? `${ry}deg` : '0deg');
      el.style.setProperty('--glint', active ? '1' : '0');
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width;
      py = (e.clientY - r.top) / r.height;
      active = true;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      active = false;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="tilt">
      <div className="tilt-inner">{children}</div>
    </div>
  );
}
