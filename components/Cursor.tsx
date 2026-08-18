'use client';

import { useEffect, useRef } from 'react';

/**
 * Two-element cursor: an exact dot and a ring that trails it.
 *
 * The ring lerps toward the pointer at 0.16 per frame and never catches it.
 * The lag is the effect. A ring that tracks perfectly is just a bigger cursor.
 *
 * Both elements are written with transform only, inside one rAF loop, so any
 * number of pointer events between frames collapse into a single style write.
 * Nothing here uses React state; re-rendering a component at pointer rate would
 * cost more than the entire rest of the page.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No custom cursor on touch (there is no pointer to replace) and none under
    // reduced motion, where a trailing element is exactly the wrong idea.
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const d = dot.current;
    const r = ring.current;
    if (!d || !r) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let rx = tx;
    let ry = ty;
    let raf = 0;
    let shown = false;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        d.style.opacity = '1';
        r.style.opacity = '1';
      }
    };

    /* The ring turns brass and grows over anything the visitor can actually
       interact with, which is the whole reason for having a ring at all: it
       reports affordance ahead of the click. */
    const interactive = 'a, button, input, [role="button"], [tabindex]:not([tabindex="-1"])';

    const onOver = (e: PointerEvent) => {
      const hit = (e.target as HTMLElement)?.closest?.(interactive);
      r.dataset.hot = hit ? '1' : '';
    };

    const onLeaveWindow = () => {
      d.style.opacity = '0';
      r.style.opacity = '0';
      shown = false;
    };

    const frame = () => {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      d.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerleave', onLeaveWindow);
    document.documentElement.classList.add('has-cursor');

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerleave', onLeaveWindow);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);

  return (
    <>
      <div ref={dot} aria-hidden className="cursor-dot" />
      <div ref={ring} aria-hidden className="cursor-ring" />
    </>
  );
}
