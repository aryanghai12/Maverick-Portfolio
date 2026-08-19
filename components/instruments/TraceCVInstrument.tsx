'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * TraceCV, shown as its signature view: the Parse X-ray.
 *
 * A document is redrawn as the parser sees it, and a scan line sweeps down it.
 * As the line passes a block, the block resolves to how it was actually read,
 * cleanly or with risk or not at all, and the corresponding trace line writes
 * itself underneath.
 *
 * The document here is a generic placeholder, never a real résumé, and no score
 * is shown. The failure it demonstrates is the real one the product exists for:
 * a two-column layout read as two separate streams, which is the most common
 * silent ATS failure there is.
 */

type Status = 'clean' | 'risk' | 'unread';

type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  status: Status;
  /** Only set on blocks that earn a line in the trace. */
  trace?: string;
};

// Percentages of the document frame. Two columns from y=26 down, which is
// exactly where the parser starts reading two streams instead of one.
const blocks: Block[] = [
  { x: 6, y: 6, w: 46, h: 5, status: 'clean', trace: 'header · name read' },
  { x: 6, y: 14, w: 62, h: 3, status: 'clean' },
  { x: 6, y: 19, w: 38, h: 3, status: 'clean', trace: 'contact block read' },

  { x: 6, y: 30, w: 26, h: 3.4, status: 'risk', trace: 'column split detected at y=30' },
  { x: 6, y: 36, w: 22, h: 2.6, status: 'risk' },
  { x: 6, y: 41, w: 25, h: 2.6, status: 'risk' },
  { x: 6, y: 46, w: 19, h: 2.6, status: 'risk', trace: 'sidebar read as separate stream' },
  { x: 6, y: 51, w: 24, h: 2.6, status: 'risk' },

  { x: 38, y: 30, w: 40, h: 3.4, status: 'clean', trace: 'main column · experience' },
  { x: 38, y: 36, w: 56, h: 2.6, status: 'clean' },
  { x: 38, y: 41, w: 52, h: 2.6, status: 'clean' },
  { x: 38, y: 46, w: 57, h: 2.6, status: 'clean' },
  { x: 38, y: 51, w: 44, h: 2.6, status: 'clean' },

  { x: 6, y: 62, w: 28, h: 12, status: 'unread', trace: 'embedded graphic · no text layer' },
  { x: 38, y: 62, w: 56, h: 2.6, status: 'clean' },
  { x: 38, y: 67, w: 50, h: 2.6, status: 'clean' },
  { x: 38, y: 72, w: 54, h: 2.6, status: 'clean', trace: 'projects section read' },

  { x: 6, y: 82, w: 88, h: 2.6, status: 'clean' },
  { x: 6, y: 87, w: 71, h: 2.6, status: 'clean' },
];

const legend: { status: Status; label: string }[] = [
  { status: 'clean', label: 'read cleanly' },
  { status: 'risk', label: 'read with risk' },
  { status: 'unread', label: 'not read' },
];

/* The three states carry the site's own two hues rather than two shades of
   white. The copy for this project says the x-ray colours each line by whether
   it was read cleanly, read with risk, or missed, so the panel should actually
   do that: blue for read, red for at risk, and nothing but an outline for the
   lines the parser never saw. */
const styleFor = (status: Status, lit: boolean) => {
  if (!lit) return { background: 'rgba(255,255,255,0.045)', borderColor: 'transparent' };
  if (status === 'clean')
    return { background: 'rgba(125,153,255,0.34)', borderColor: 'transparent' };
  if (status === 'risk')
    return { background: 'rgba(255,66,102,0.28)', borderColor: 'var(--hot)' };
  return { background: 'transparent', borderColor: 'var(--mute)' };
};

const SWEEP_MS = 2600;

export function TraceCVInstrument() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(100);
      return;
    }

    let raf = 0;
    let start = 0;

    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / SWEEP_MS);
      // Ease out so the sweep decelerates into the footer rather than stopping dead.
      setProgress((1 - Math.pow(1 - p, 3)) * 100);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.disconnect();
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const traced = blocks.filter((b) => b.trace && b.y + b.h <= progress);

  return (
    <div ref={ref} className="inst-document overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[var(--hair-soft)] px-4 py-3 sm:px-5">
        <span className="u-mono text-[0.72rem] font-bold tracking-[-0.02em] text-[var(--bone)]">
          Parse X-ray
        </span>
        <span className="t-label ml-auto !text-[0.56rem]">in-browser · nothing uploaded</span>
      </div>

      <div className="p-4 sm:p-5">
        {/* The document frame */}
        <div
          className="relative w-full overflow-hidden rounded-md border border-[var(--edge)] bg-[var(--panel-0)]"
          style={{ aspectRatio: '1 / 1.28' }}
          role="img"
          aria-label="A two-column document being scanned. The sidebar column is flagged as read with risk because it is parsed as a separate stream, and an embedded graphic is flagged as not read."
        >
          {blocks.map((b, i) => {
            const lit = b.y + b.h <= progress;
            const s = styleFor(b.status, lit);
            return (
              <span
                key={i}
                aria-hidden
                className="absolute rounded-[2px] border border-dashed transition-[background-color,border-color] duration-500"
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: `${b.w}%`,
                  height: `${b.h}%`,
                  background: s.background,
                  borderColor: s.borderColor,
                }}
              />
            );
          })}

          {/* Column split marker, revealed once the scan reaches it. */}
          <span
            aria-hidden
            className="absolute top-[28%] bottom-[22%] w-px bg-[var(--hot)] transition-opacity duration-700"
            style={{ left: '35.5%', opacity: progress > 32 ? 0.42 : 0 }}
          />

          {/* The scan line. Transform only, so it never touches layout. */}
          {progress < 100 ? (
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[2px] will-change-transform"
              style={{
                transform: `translateY(${progress}%) translateY(-1px)`,
                background:
                  'linear-gradient(90deg, transparent, var(--accent-hi) 18%, var(--accent-hi) 82%, transparent)',
                boxShadow: '0 0 14px 1px rgba(255,255,255,0.5)',
              }}
            />
          ) : null}
        </div>

        {/* Legend */}
        <ul className="mt-4 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
          {legend.map((l) => {
            const s = styleFor(l.status, true);
            return (
              <li key={l.status} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-[9px] w-[9px] shrink-0 rounded-[2px] border border-dashed"
                  style={{ background: s.background, borderColor: s.borderColor }}
                />
                <span className="t-label !text-[0.56rem]">{l.label}</span>
              </li>
            );
          })}
        </ul>

        {/* Trace log */}
        <div className="code-surface mt-4 min-h-[92px] px-3 py-3 sm:px-4">
          <div className="t-label mb-2 !text-[0.54rem]">trace</div>
          {traced.length === 0 ? (
            <p className="m-0 text-[0.68rem] text-[var(--mute)]">awaiting scan…</p>
          ) : (
            <ul className="m-0 list-none space-y-[3px] p-0">
              {traced.map((b) => (
                <li
                  key={b.trace}
                  className="flex items-baseline gap-2 text-[0.68rem] leading-[1.6]"
                >
                  <span
                    aria-hidden
                    className={
                      b.status === 'risk'
                        ? 'text-[var(--hot)]'
                        : b.status === 'unread'
                          ? 'text-[var(--mute)]'
                          : 'text-[var(--bone-dim)]'
                    }
                  >
                    {b.status === 'clean' ? '✓' : b.status === 'risk' ? '▲' : '✕'}
                  </span>
                  <span
                    className={
                      b.status === 'clean' ? 'text-[var(--bone-dim)]' : 'text-[var(--bone)]'
                    }
                  >
                    {b.trace}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
