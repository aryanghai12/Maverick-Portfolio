'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';

/* Code split so the hero paints before WebGL is even parsed. The page is fully
   readable, fully navigable and fully complete without this file ever landing. */
const CosmosScene = dynamic(() => import('./CosmosScene').then((m) => m.CosmosScene), {
  ssr: false,
});

/**
 * The field, mounted behind everything.
 *
 * Three gates before a single vertex is drawn: the browser has to have WebGL,
 * the first paint has to be done, and the tab has to be visible. Fail any of
 * them and the site is exactly as legible as it was, because nothing here
 * carries information that is not also in the text.
 */
export function Cosmos() {
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  /* The hero is the one place the field is allowed to be the loudest thing on
     screen. Everywhere else there is prose to read over it, so the centre scrim
     comes back down. */
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setOpen(e.isIntersecting), {
      // Most of the hero has to be gone before the scrim closes, or it flickers
      // shut on the first flick of the wheel.
      rootMargin: '0px 0px -55% 0px',
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);

    // Probe rather than assume. A thrown context here would otherwise take the
    // whole React tree down with it.
    let supported = false;
    try {
      const c = document.createElement('canvas');
      supported = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      supported = false;
    }
    if (!supported) return () => mq.removeEventListener('change', onChange);

    const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    const cancel: (id: number) => void = ric
      ? (id) => window.cancelIdleCallback(id)
      : (id) => window.clearTimeout(id);
    const idle = ric
      ? ric(() => setReady(true), { timeout: 1200 })
      : window.setTimeout(() => setReady(true), 500);

    return () => {
      mq.removeEventListener('change', onChange);
      cancel(idle);
    };
  }, []);

  if (!ready) return null;

  return (
    <div
      aria-hidden
      className="cosmos pointer-events-none fixed inset-0 z-0"
      data-open={open ? '1' : undefined}
      style={{ animation: 'cosmos-in 1200ms var(--ease-out) both' }}
    >
      <Canvas
        // flat: no tone mapping. Additive particles that have already been
        // colour-matched by eye should reach the screen as they were authored.
        flat
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}
        // Past 1.75 the sprites are smaller than the extra pixels can show, so
        // the cost buys nothing visible.
        dpr={[1, 1.75]}
        camera={{ fov: 45, near: 0.5, far: 400, position: [0, 0, 56] }}
        frameloop={visible ? 'always' : 'never'}
      >
        <CosmosScene reduced={reduced} />
      </Canvas>
    </div>
  );
}
