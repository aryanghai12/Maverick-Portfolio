'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';

/* The scene is code-split so the hero paints before WebGL is even parsed. The
   page is fully readable and fully functional without this file ever arriving. */
const Scene = dynamic(() => import('./Scene').then((m) => m.Scene), { ssr: false });

/**
 * The Index: a codebase rendered as architecture, behind everything.
 *
 * Mounted only after first paint and only when the browser can actually run it.
 * If WebGL is unavailable, blocked, or the device is too small to be worth it,
 * nothing renders and the site is exactly as legible as it was — the canvas is
 * decorative and carries no information that is not also in the text.
 */
export function IndexBackground() {
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);

  /* A background tab should cost nothing. Without this the render loop keeps
     running behind a switched-away window and drains battery for no viewer. */
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);

    // Probe for WebGL rather than assuming it. A thrown context here would
    // otherwise take the whole React tree down with it.
    let supported = false;
    try {
      const c = document.createElement('canvas');
      supported = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      supported = false;
    }

    if (!supported) return () => mq.removeEventListener('change', onChange);

    // Let the hero paint and settle first. The background is the last thing
    // that should compete for the main thread on load.
    const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    const cancel: (id: number) => void = ric
      ? (id) => window.cancelIdleCallback(id)
      : (id) => window.clearTimeout(id);
    const idle = ric
      ? ric(() => setReady(true), { timeout: 1400 })
      : window.setTimeout(() => setReady(true), 600);

    return () => {
      mq.removeEventListener('change', onChange);
      cancel(idle);
    };
  }, []);

  if (!ready) return null;

  return (
    <div
      aria-hidden
      className="index-canvas pointer-events-none fixed inset-0 z-0"
      // Fades up from the flat background rather than popping in.
      style={{ animation: 'index-in 1100ms var(--ease-out) both' }}
    >
      <Canvas
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
        // Capped at 1.6 rather than 2: past this the bars are thinner than the
        // extra pixels can show, so the cost buys nothing visible.
        dpr={[1, 1.6]}
        camera={{ fov: 54, near: 0.5, far: 260, position: [0, 0.4, 26] }}
        frameloop={visible ? 'always' : 'never'}
      >
        <Scene reduced={reduced} />
      </Canvas>
    </div>
  );
}
