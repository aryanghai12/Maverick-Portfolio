'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * RepoPulse, shown by running its actual method.
 *
 * This is not a scripted animation of a clustering result. The points are
 * generated once from a seeded PRNG, and Lloyd's algorithm genuinely runs over
 * them below: assign every point to its nearest centroid, move each centroid to
 * the mean of its members, repeat until nothing moves. The frames you see are
 * the real iterations, including the fact that it converges in a handful of them.
 *
 * The initial centroids are deliberately placed badly, in one corner, because a
 * good seeding converges in two steps and shows nothing.
 */

/* ----------------------------------------------------------- seeded data */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = { x: number; y: number };

/** Box-Muller, so the clouds look like real measurements rather than a grid. */
function gaussian(rnd: () => number, mean: number, sd: number) {
  const u = Math.max(rnd(), 1e-9);
  const v = rnd();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Rounded to four decimals before it reaches the DOM.
 *
 * Math.cos and Math.log are not required to be correctly rounded, so the V8 that
 * renders this on the server and the V8 in the visitor's browser can disagree in
 * the last unit in the last place. That is invisible arithmetic and a real
 * hydration mismatch: React compared cx="18.844498246014716" against
 * 18.844498246014712 and gave up on the subtree. Quantising kills it, and four
 * decimals is far below one device pixel in a 100-unit viewBox.
 */
const q = (n: number) => Math.round(n * 1e4) / 1e4;

function buildPoints(): Pt[] {
  const rnd = mulberry32(20260318);
  const spec = [
    // [count, mean x, mean y, sd]. x is log time to merge, y is review friction
    [26, 0.22, 0.24, 0.075],
    [28, 0.5, 0.52, 0.095],
    [14, 0.79, 0.79, 0.085],
  ] as const;

  const out: Pt[] = [];
  for (const [n, mx, my, sd] of spec) {
    for (let i = 0; i < n; i++) {
      out.push({
        x: q(Math.min(0.97, Math.max(0.03, gaussian(rnd, mx, sd)))),
        y: q(Math.min(0.97, Math.max(0.03, gaussian(rnd, my, sd)))),
      });
    }
  }
  return out;
}

/* ------------------------------------------------------ Lloyd's algorithm */

type Frame = { centroids: Pt[]; assign: number[] };

function lloyd(points: Pt[], k = 3, maxIter = 12): Frame[] {
  // Bad on purpose: all three start bunched in the low corner.
  let centroids: Pt[] = [
    { x: 0.12, y: 0.14 },
    { x: 0.2, y: 0.09 },
    { x: 0.1, y: 0.24 },
  ].slice(0, k);

  const frames: Frame[] = [];

  for (let iter = 0; iter < maxIter; iter++) {
    const assign = points.map((p) => {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const dx = p.x - centroids[c].x;
        const dy = p.y - centroids[c].y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      return best;
    });

    frames.push({ centroids: centroids.map((c) => ({ ...c })), assign: [...assign] });

    const next = centroids.map((c, i) => {
      const members = points.filter((_, j) => assign[j] === i);
      if (members.length === 0) return { ...c };
      return {
        x: members.reduce((s, p) => s + p.x, 0) / members.length,
        y: members.reduce((s, p) => s + p.y, 0) / members.length,
      };
    });

    const moved = next.some(
      (c, i) => Math.hypot(c.x - centroids[i].x, c.y - centroids[i].y) > 1e-4,
    );
    centroids = next;
    if (!moved) break;
  }

  return frames;
}

/* ------------------------------------------------------------- rendering */

/**
 * Personas are assigned after convergence by where each centroid landed, not by
 * cluster index, because k-means indices are arbitrary and labelling by index would be
 * a coin flip that happens to look right on this seed.
 *
 * Colour and shape both carry the distinction. Colour alone would fail for a
 * colour-blind reader, and the accent is spent on the Review Black Hole because
 * that is the cluster the tool exists to find.
 */
const personas = [
  { key: 'fast', label: 'Fast Track', color: 'var(--mute)', shape: 'circle' as const },
  { key: 'avg', label: 'Average Churn', color: 'var(--bone-dim)', shape: 'square' as const },
  { key: 'hole', label: 'Review Black Hole', color: 'var(--accent)', shape: 'triangle' as const },
];

const VB = 100;
const px = (v: number) => q(8 + v * (VB - 16));
const py = (v: number) => q(VB - 8 - v * (VB - 16));

function Mark({
  cx,
  cy,
  shape,
  color,
  r = 1.7,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  shape: 'circle' | 'square' | 'triangle';
  color: string;
  r?: number;
  opacity?: number;
}) {
  if (shape === 'square') {
    return (
      <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={color} opacity={opacity} />
    );
  }
  if (shape === 'triangle') {
    return (
      <polygon
        points={`${cx},${cy - r * 1.15} ${cx + r} ,${cy + r * 0.75} ${cx - r},${cy + r * 0.75}`}
        fill={color}
        opacity={opacity}
      />
    );
  }
  return <circle cx={cx} cy={cy} r={r} fill={color} opacity={opacity} />;
}

export function RepoPulseInstrument() {
  const ref = useRef<HTMLDivElement>(null);
  const points = useMemo(buildPoints, []);
  const frames = useMemo(() => lloyd(points), [points]);

  const [frame, setFrame] = useState(-1); // -1 = unassigned cloud, pre-run

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFrame(frames.length - 1);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.disconnect();
          frames.forEach((_, i) => {
            timers.push(setTimeout(() => setFrame(i), 700 + i * 640));
          });
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [frames]);

  const current = frame >= 0 ? frames[frame] : null;
  const converged = frame >= frames.length - 1;

  /** Map cluster index → persona, by centroid distance from the origin. */
  const personaOf = useMemo(() => {
    if (!current) return null;
    const order = current.centroids
      .map((c, i) => ({ i, d: c.x + c.y }))
      .sort((a, b) => a.d - b.d);
    const map = new Map<number, (typeof personas)[number]>();
    order.forEach((o, rank) => map.set(o.i, personas[rank]));
    return map;
  }, [current]);

  return (
    <div ref={ref} className="glass overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[var(--hair-soft)] px-4 py-3 sm:px-5">
        <span className="u-mono text-[0.72rem] font-bold tracking-[-0.02em] text-[var(--bone)]">
          K-Means · PCA projection
        </span>
        <span className="t-label ml-auto !text-[0.56rem]">
          {frame < 0 ? 'unassigned' : converged ? 'converged' : `iteration ${frame + 1}`}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="relative overflow-hidden rounded-md border border-[var(--edge)] bg-[var(--panel-0)]">
          <svg
            viewBox={`0 0 ${VB} ${VB}`}
            className="block w-full"
            role="img"
            aria-label="A scatter plot of pull requests projected to two dimensions. K-means separates them into three clusters: Fast Track, Average Churn, and Review Black Hole."
          >
            {/* Grid */}
            <g stroke="var(--edge)" strokeWidth="0.25" opacity="0.6">
              {[0.25, 0.5, 0.75].map((t) => (
                <line key={`v${t}`} x1={px(t)} y1={py(0)} x2={px(t)} y2={py(1)} />
              ))}
              {[0.25, 0.5, 0.75].map((t) => (
                <line key={`h${t}`} x1={px(0)} y1={py(t)} x2={px(1)} y2={py(t)} />
              ))}
            </g>
            <g stroke="var(--mute)" strokeWidth="0.4">
              <line x1={px(0)} y1={py(0)} x2={px(1)} y2={py(0)} />
              <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(1)} />
            </g>

            {/* Points */}
            {points.map((p, i) => {
              const cluster = current?.assign[i];
              const persona = cluster !== undefined ? personaOf?.get(cluster) : null;
              return (
                <g
                  key={i}
                  style={{ transition: 'opacity 400ms var(--ease)' }}
                  opacity={current ? 1 : 0.5}
                >
                  <Mark
                    cx={px(p.x)}
                    cy={py(p.y)}
                    shape={persona?.shape ?? 'circle'}
                    color={persona?.color ?? 'var(--edge)'}
                    opacity={persona ? 0.9 : 0.75}
                  />
                </g>
              );
            })}

            {/* Centroids */}
            {current?.centroids.map((c, i) => {
              const persona = personaOf?.get(i);
              return (
                <g key={i} style={{ transition: 'all 560ms var(--ease-out)' }}>
                  <circle
                    cx={px(c.x)}
                    cy={py(c.y)}
                    r="4"
                    fill="none"
                    stroke={persona?.color ?? 'var(--bone)'}
                    strokeWidth="0.7"
                    opacity="0.85"
                  />
                  <circle cx={px(c.x)} cy={py(c.y)} r="0.9" fill={persona?.color ?? 'var(--bone)'} />
                </g>
              );
            })}
          </svg>

          <span className="t-label absolute bottom-1.5 left-1/2 -translate-x-1/2 !text-[0.5rem]">
            PC1 · time to merge
          </span>
          <span className="t-label absolute top-1/2 left-1 -translate-y-1/2 -rotate-90 !text-[0.5rem]">
            PC2 · friction
          </span>
        </div>

        {/* Legend, revealed only once the clusters mean something. */}
        <ul
          className="mt-4 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 transition-opacity duration-700"
          style={{ opacity: converged ? 1 : 0.35 }}
        >
          {personas.map((p) => (
            <li key={p.key} className="flex items-center gap-2">
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                <Mark cx={5} cy={5} shape={p.shape} color={p.color} r={3.2} />
              </svg>
              <span
                className="t-label !text-[0.56rem]"
                style={p.key === 'hole' ? { color: 'var(--accent)' } : undefined}
              >
                {p.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="code-surface mt-4 px-3 py-3 sm:px-4">
          <div className="t-label mb-2 !text-[0.54rem]">objective</div>
          <p className="m-0 text-[0.74rem] text-[var(--bone-dim)]">
            argmin <span className="text-[var(--accent)]">Σ</span> ‖x − μ
            <sub>i</sub>‖²
          </p>
          <p className="mt-2 mb-0 text-[0.66rem] leading-[1.6] text-[var(--mute)]">
            k validated by elbow and silhouette · nstart = 50 · log1p then z-score
          </p>
        </div>
      </div>
    </div>
  );
}
