'use client';

import { useMemo, useState } from 'react';
import stats from '@/data/stats.json';
import { projects as projectCopy } from '@/lib/content';
import { SectionHead } from './SectionHead';
import { Kinetic } from './Kinetic';

/**
 * The stack, as a bipartite graph rather than a wall of badges.
 *
 * A badge wall communicates nothing: every badge looks equally weighted whether
 * it stands for two megabytes of TypeScript or one import line. Here an edge's
 * thickness comes from the actual byte counts GitHub reports, so Go being a thin
 * edge on Cavix is visible, and that honesty is the whole argument of the site.
 *
 * Two kinds of edge, distinguished on purpose:
 *   solid    measured. Thickness from the GitHub languages API.
 *   dashed   declared. A runtime or library the repo genuinely uses but which
 *            has no source bytes of its own to measure.
 */

type Edge = { tech: string; project: string; bytes: number; measured: boolean };

/** Runtimes and libraries that carry no source bytes but are really in the stack. */
const declared: Record<string, string[]> = {
  cavix: ['Python', 'LangGraph', 'pgvector', 'Redis Streams', 'gVisor', 'Docker'],
  tracecv: ['Next.js', 'Web Workers', 'Docker'],
  repopulse: ['Shiny', 'K-Means', 'GitHub REST'],
};

/** Byte counts below this are build noise (config, a stray stylesheet), not stack. */
const NOISE_FLOOR = 40_000;

/** Languages that describe presentation rather than the engineering on show. */
const IGNORED = new Set(['CSS', 'HTML', 'SCSS', 'Go Template', 'TeX']);

function buildGraph() {
  const edges: Edge[] = [];

  for (const p of stats.projects) {
    for (const [lang, bytes] of Object.entries(p.languages)) {
      if (IGNORED.has(lang) || bytes < NOISE_FLOOR) continue;
      edges.push({ tech: lang, project: p.id, bytes, measured: true });
    }
    for (const tech of declared[p.id] ?? []) {
      edges.push({ tech, project: p.id, bytes: 0, measured: false });
    }
  }

  // Order technologies by total measured weight so the heaviest sit together.
  const weight = new Map<string, number>();
  for (const e of edges) weight.set(e.tech, (weight.get(e.tech) ?? 0) + e.bytes);

  const techs = [...new Set(edges.map((e) => e.tech))].sort(
    (a, b) => (weight.get(b) ?? 0) - (weight.get(a) ?? 0),
  );

  const maxBytes = Math.max(...edges.map((e) => e.bytes), 1);
  return { edges, techs, maxBytes };
}

const fmtBytes = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)} MB` : `${Math.round(n / 1000)} KB`;

export function Stack() {
  const { edges, techs, maxBytes } = useMemo(buildGraph, []);
  const [active, setActive] = useState<string | null>(null);

  const projectIds: string[] = projectCopy.map((p) => p.id);
  const nameOf = (id: string) => projectCopy.find((p) => p.id === id)?.name ?? id;

  // Deterministic layout in percentage space, so no DOM measurement is needed.
  const techY = (i: number) => ((i + 0.5) / techs.length) * 100;
  const projY = (i: number) => ((i + 0.5) / projectIds.length) * 100;
  const TECH_X = 34;
  const PROJ_X = 74;

  const isLit = (e: Edge) => !active || e.tech === active || e.project === active;

  return (
    <section id="stack" data-cam="work" className="section">
      <div className="shell">
        <SectionHead index="03" label="dependencies" />

        <div className="grid [&>*]:min-w-0 gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="t-h2 max-w-[15ch] text-[var(--bone)]" data-rv>
              <Kinetic text="What actually got used" />
            </h2>
            <p className="t-body mt-7" data-rv>
              Edge thickness is the number of bytes GitHub measured in each repository,
              so a thin edge stays thin. Dashed edges are runtimes the project genuinely
              depends on but which have no source of their own to weigh.
            </p>
            <ul className="mt-7 list-none space-y-2 p-0" data-rv>
              <li className="flex items-center gap-3">
                <svg width="26" height="8" aria-hidden className="shrink-0">
                  <line x1="0" y1="4" x2="26" y2="4" stroke="var(--accent)" strokeWidth="2.4" />
                </svg>
                <span className="t-label !text-[0.58rem]">measured · bytes on disk</span>
              </li>
              <li className="flex items-center gap-3">
                <svg width="26" height="8" aria-hidden className="shrink-0">
                  <line
                    x1="0"
                    y1="4"
                    x2="26"
                    y2="4"
                    stroke="var(--mute)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                </svg>
                <span className="t-label !text-[0.58rem]">declared · no bytes to weigh</span>
              </li>
            </ul>

            <p className="t-label mt-8 !normal-case !tracking-[0.02em] !text-[0.68rem] !leading-[1.65]" data-rv>
              RepoPulse is set to R by hand. GitHub reports it as 87% HTML because Shiny
              commits rendered output, which is technically sourced and materially false,
              so it does not get to be the badge.
            </p>
          </div>

          {/* The graph. Hidden below sm, where it cannot be read or hovered. */}
          <div
            className="relative hidden min-h-[560px] sm:block"
            data-rv="scale"
            onMouseLeave={() => setActive(null)}
          >
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              {edges.map((e, i) => {
                const ti = techs.indexOf(e.tech);
                const pi = projectIds.indexOf(e.project);
                if (ti < 0 || pi < 0) return null;
                const x1 = TECH_X;
                const y1 = techY(ti);
                const x2 = PROJ_X;
                const y2 = projY(pi);
                const mx = (x1 + x2) / 2;
                const lit = isLit(e);
                return (
                  <path
                    key={i}
                    d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    stroke={
                      lit && active
                        ? 'var(--accent)'
                        : e.measured
                          ? 'var(--edge-hi)'
                          : 'var(--edge)'
                    }
                    strokeWidth={
                      e.measured ? 1.1 + (e.bytes / maxBytes) * 3.6 : 0.9
                    }
                    strokeDasharray={e.measured ? undefined : '3 3'}
                    opacity={lit ? (active ? 0.95 : 0.85) : 0.09}
                    style={{ transition: 'opacity 320ms var(--ease), stroke 320ms var(--ease)' }}
                  />
                );
              })}
            </svg>

            {/* Technology labels */}
            <ul className="absolute inset-0 m-0 list-none p-0">
              {techs.map((t, i) => (
                <li
                  key={t}
                  className="absolute right-[68%] -translate-y-1/2 pr-3"
                  style={{ top: `${techY(i)}%` }}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActive(t)}
                    onFocus={() => setActive(t)}
                    onBlur={() => setActive(null)}
                    aria-pressed={active === t}
                    className="u-mono block w-full text-right text-[0.78rem] whitespace-nowrap transition-colors duration-300"
                    style={{
                      color:
                        active === t
                          ? 'var(--accent)'
                          : !active
                            ? 'var(--bone-dim)'
                            : edges.some((e) => e.tech === t && e.project === active)
                              ? 'var(--bone)'
                              : 'var(--mute)',
                    }}
                  >
                    {t}
                  </button>
                </li>
              ))}
            </ul>

            {/* Project anchors */}
            <ul className="absolute inset-0 m-0 list-none p-0">
              {projectIds.map((id, i) => (
                <li
                  key={id}
                  className="absolute left-[75%] -translate-y-1/2 pl-3"
                  style={{ top: `${projY(i)}%` }}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActive(id)}
                    onFocus={() => setActive(id)}
                    onBlur={() => setActive(null)}
                    aria-pressed={active === id}
                    className="group flex items-center gap-3 text-left"
                  >
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rotate-45 transition-colors duration-300"
                      style={{
                        background: active === id ? 'var(--accent)' : 'var(--bone-dim)',
                      }}
                    />
                    <span
                      className="u-mono text-[0.92rem] font-bold tracking-[-0.03em] whitespace-nowrap transition-colors duration-300"
                      style={{
                        color:
                          active === id
                            ? 'var(--accent)'
                            : !active
                              ? 'var(--bone)'
                              : edges.some((e) => e.project === id && e.tech === active)
                                ? 'var(--bone)'
                                : 'var(--mute)',
                      }}
                    >
                      {nameOf(id)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Below sm the graph is unreadable, so the same data is a grouped list. */}
          <div className="sm:hidden">
            <ul className="m-0 list-none space-y-6 p-0">
              {projectIds.map((id) => (
                <li key={id}>
                  <h3 className="u-mono text-[0.95rem] font-bold tracking-[-0.03em] text-[var(--bone)]">
                    {nameOf(id)}
                  </h3>
                  <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                    {edges
                      .filter((e) => e.project === id)
                      .sort((a, b) => b.bytes - a.bytes)
                      .map((e) => (
                        <li
                          key={e.tech}
                          className="u-mono rounded border px-2 py-1 text-[0.68rem]"
                          style={{
                            borderColor: e.measured ? 'var(--edge)' : 'var(--panel-2)',
                            color: e.measured ? 'var(--bone-dim)' : 'var(--mute)',
                          }}
                        >
                          {e.tech}
                          {e.measured ? (
                            <span className="ml-1.5 text-[var(--mute)]">
                              {fmtBytes(e.bytes)}
                            </span>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
