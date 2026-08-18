import stats from '@/data/stats.json';
import { identity, links, thesis } from '@/lib/content';
import { Kinetic } from './Kinetic';

/**
 * The landing section.
 *
 * The name is not the headline. A visitor who has just arrived has no reason
 * to care about a name yet, and a 90px name is the single most recognisable
 * shape of a generated portfolio. The statement leads, the name signs it, and
 * the four figures underneath are the evidence that the statement is not just
 * a nice sentence.
 *
 * Every figure is read from data/stats.json, written at build time by
 * scripts/fetch-stats.ts from the public GitHub API. None of them is typed by
 * hand, and the build fails rather than shipping a stale one.
 */
const gauges = [
  { value: String(stats.merged.trueUpstream), label: 'merged upstream' },
  { value: String(stats.merged.trueUpstreamRepoCount), label: 'repos I do not own' },
  { value: String(stats.user.publicRepos), label: 'public repos' },
  { value: String(stats.user.contributingSince), label: 'contributing since' },
];

export function Hero() {
  return (
    <section
      id="hero"
      data-cam="hero"
      className="relative flex min-h-[100svh] flex-col justify-center pt-32 pb-20 sm:pt-28"
    >
      <div className="shell">
        {/* Signature line. Small, set in the machine voice, sitting above the
            statement the way a byline sits above a piece of writing. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-rv>
          <span className="u-mono text-[0.78rem] font-medium tracking-[0.16em] text-[var(--bone)] uppercase">
            {identity.name}
          </span>
          <span aria-hidden className="h-3 w-px bg-[var(--edge)]" />
          <span className="t-label !text-[0.63rem]">{identity.role}</span>
          <span aria-hidden className="h-3 w-px bg-[var(--edge)]" />
          <span className="t-label !text-[0.63rem]">{identity.location}</span>
        </div>

        <h1 className="t-display mt-7 max-w-[19ch] text-[var(--bone)] sm:mt-9">
          <Kinetic text={thesis.headline} stagger={13} />
        </h1>

        <p className="t-lede mt-7 !max-w-[54ch] !text-[var(--bone-dim)] sm:mt-9" data-rv>
          {thesis.support}
        </p>

        {/* Two actions, ranked. The primary one goes to the evidence rather
            than to a contact form, because the evidence is the argument. */}
        <div className="mt-10 flex flex-wrap items-center gap-3 sm:mt-12" data-rv>
          {/* The address is written out, in the markup, in the primary
              action. Neither call to action here used to say hire me, and the
              one conversion event on the site was reachable only by operating
              a terminal widget. */}
          <a
            href={links.email}
            className="group inline-flex items-center gap-2.5 rounded-full bg-[var(--bone)] px-5 py-2.5 text-[0.83rem] font-medium tracking-[-0.01em] text-[#0e0e11] transition-all duration-300 [transition-timing-function:var(--ease)] hover:bg-white hover:shadow-[0_0_28px_-6px_rgba(255,255,255,0.45)]"
          >
            {identity.email}
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-[3px]">
              →
            </span>
          </a>
          <a
            href="#upstream"
            className="group inline-flex items-center gap-2.5 rounded-full border border-[var(--edge)] px-5 py-2.5 text-[0.83rem] font-medium tracking-[-0.01em] text-[var(--bone-dim)] transition-all duration-300 [transition-timing-function:var(--ease)] hover:border-[var(--bone)] hover:text-[var(--bone)]"
          >
            See the proof
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-y-[2px]">
              ↓
            </span>
          </a>
        </div>

        {/* Availability, stated concretely enough to act on. */}
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2" data-rv>
          <span aria-hidden className="led h-[7px] w-[7px] rounded-full bg-[var(--accent)]" />
          <span className="t-label !text-[0.6rem] !text-[var(--bone-dim)]">
            {identity.status}
          </span>
          <span aria-hidden className="h-3 w-px bg-[var(--edge)]" />
          <span className="t-label !text-[0.6rem]">{identity.availability}</span>
        </div>

        {/* The evidence, stated as four measured figures. */}
        <dl className="mt-16 grid grid-cols-2 border-t border-[var(--hair-soft)] sm:mt-20 sm:grid-cols-4">
          {gauges.map((g, i) => (
            <div
              key={g.label}
              className="border-b border-[var(--hair-soft)] py-5 pr-4 sm:border-b-0 sm:py-6 [&:not(:first-child)]:sm:border-l [&:not(:first-child)]:sm:border-[var(--hair-soft)] [&:not(:first-child)]:sm:pl-6"
              data-rv
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <dd className="u-mono text-[clamp(1.9rem,1.3rem+2vw,2.7rem)] leading-none font-medium tracking-[-0.045em] text-[var(--bone)]">
                {g.value}
              </dd>
              <dt className="t-label mt-3 !text-[0.6rem] !leading-[1.5]">{g.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* Scroll cue: one tick that descends and resets. Not a bouncing mouse. */}
      <div
        aria-hidden
        className="shell pointer-events-none mt-14 flex items-center gap-3 sm:mt-20"
      >
        <span className="cue-tick h-6 w-px bg-gradient-to-b from-transparent to-[var(--bone-dim)]" />
        <span className="t-label !text-[0.58rem]">scroll</span>
      </div>
    </section>
  );
}
