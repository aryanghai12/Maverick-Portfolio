import stats from '@/data/stats.json';
import { identity, thesis } from '@/lib/content';
import { Kinetic } from './Kinetic';

/**
 * No boot sequence, no progress bar, no "INITIALIZING". The page paints
 * immediately with every word already in the DOM; only visibility is animated.
 *
 * Each figure below is read from data/stats.json, which is written at build time
 * by scripts/fetch-stats.ts from the public GitHub API. None of them is typed by
 * hand, and the build fails rather than shipping a stale one.
 */
const gauges = [
  { value: String(stats.merged.external), label: 'merged\nupstream' },
  { value: String(stats.merged.externalRepoCount), label: 'external\nrepos' },
  { value: String(stats.user.publicRepos), label: 'public\nrepos' },
  { value: String(stats.user.contributingSince), label: 'contributing\nsince' },
];

export function Hero() {
  return (
    <section
      id="hero"
      data-cam="hero"
      className="relative flex min-h-[100svh] flex-col justify-center pt-28 pb-16"
    >
      <div className="shell">
        {/* The name is the one place mono runs at display size. */}
        <h1 className="t-display text-[var(--bone)]">
          <Kinetic text={identity.name} />
        </h1>

        {/* The dividers are dropped below sm rather than wrapped. A pipe stranded
            at the end of a line reads as a typo, and three stacked lines need no
            separator to be understood as three things. */}
        <div
          className="mt-7 flex flex-col gap-y-1.5 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2"
          data-rv
        >
          <span className="t-label !text-[var(--bone-dim)]">{identity.role}</span>
          <span aria-hidden className="hidden h-3 w-px bg-[var(--edge)] sm:block" />
          <span className="t-label">{identity.location}</span>
          <span aria-hidden className="hidden h-3 w-px bg-[var(--edge)] sm:block" />
          <span className="t-label !text-[var(--ember)]">open to SWE internships</span>
        </div>

        {/* The single serif italic moment on the entire site. */}
        <p className="u-serif mt-10 max-w-[46ch] text-[clamp(1.15rem,1rem+1vw,1.72rem)] leading-[1.42] text-[var(--bone)] sm:mt-14" data-rv>
          {thesis}
        </p>

        <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--edge)] bg-[var(--edge)] sm:mt-20 sm:grid-cols-4">
          {gauges.map((g, i) => (
            <div
              key={g.label}
              className="bg-[var(--panel-0)] px-5 py-6 sm:px-6 sm:py-7"
              data-rv
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <dd className="u-mono text-[clamp(1.7rem,1.2rem+2vw,2.6rem)] font-bold leading-none tracking-[-0.05em] text-[var(--ember)]">
                {g.value}
              </dd>
              <dt className="t-label mt-3 whitespace-pre-line !text-[0.62rem] !leading-[1.5]">
                {g.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      {/* Scroll cue: one ember tick that descends and resets. Not a bouncing mouse. */}
      <div
        aria-hidden
        className="shell pointer-events-none mt-16 flex items-center gap-3 sm:mt-24"
      >
        <span className="cue-tick h-6 w-px bg-gradient-to-b from-transparent to-[var(--ember)]" />
        <span className="t-label !text-[0.6rem]">scroll</span>
      </div>
    </section>
  );
}
