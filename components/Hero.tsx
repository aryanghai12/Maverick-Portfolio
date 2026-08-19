import stats from '@/data/stats.json';
import { identity, links, thesis } from '@/lib/content';
import { BlurWords } from './ui/BlurWords';
import { CountUp } from './ui/CountUp';

/**
 * The landing section.
 *
 * Centred, and the only centred section on the site: the field behind the page
 * is a sphere here, and a left-aligned column next to a centred sphere is two
 * compositions arguing. Everything after this returns to the reading column.
 *
 * The name is not the headline. A visitor who has just arrived has no reason to
 * care about a name yet, and a 90px name is the single most recognisable shape
 * of a generated portfolio. The statement leads, the name signs it, and the four
 * figures underneath are the evidence that the statement is not just a nice
 * sentence.
 *
 * Every figure is read from data/stats.json, written at build time by
 * scripts/fetch-stats.ts from the public GitHub API. None of them is typed by
 * hand, and the build fails rather than shipping a stale one.
 */
const gauges = [
  { value: stats.merged.trueUpstream, label: 'merged upstream', count: true },
  { value: stats.merged.trueUpstreamRepoCount, label: 'repos I do not own', count: true },
  { value: stats.user.publicRepos, label: 'public repos', count: true },
  // A year is not a quantity: counting up to it, or grouping it as 2,023, both
  // read as a bug rather than as a flourish.
  { value: stats.user.contributingSince, label: 'contributing since', count: false },
];

export function Hero() {
  return (
    <section
      id="hero"
      data-stage="sphere"
      className="relative flex min-h-[100svh] flex-col justify-center pt-28 pb-16"
    >
      <div className="shell flex flex-col items-center text-center">
        {/* Signature chip. The one thing above the statement, and it states
            availability rather than a greeting, because availability is the
            fact a recruiter is scanning for. */}
        <div
          className="glass inline-flex items-center gap-2.5 rounded-full px-5 py-2.5"
          data-rv
        >
          <span aria-hidden className="led h-[7px] w-[7px] rounded-full bg-[var(--accent)]" />
          <span className="t-label !text-[0.78rem] !text-[var(--bone)]">
            {identity.status}
          </span>
        </div>

        <h1 className="t-display mt-8 max-w-[17ch] text-[var(--bone)] sm:mt-10">
          {/* The line lands in two beats: the claim in white, the qualifier a
              shade back, so the eye reads the shape before the sentence. */}
          <BlurWords text={thesis.headline} stagger={78} dimFrom={5} />
        </h1>

        <p className="t-lede mt-8 !max-w-[58ch] !text-[var(--bone-dim)]" data-rv>
          {thesis.support}
        </p>

        {/* Two actions, ranked. The primary one is the address itself: neither
            call to action used to say hire me, and the one conversion event on
            the site was reachable only by operating a terminal widget. */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3" data-rv>
          <a
            href={links.email}
            className="group inline-flex items-center gap-3 rounded-full border border-[var(--hair)] bg-[rgba(255,255,255,0.08)] py-2.5 pr-2.5 pl-6 text-[0.95rem] font-medium tracking-[-0.01em] text-[var(--bone)] backdrop-blur-xl transition-all duration-300 [transition-timing-function:var(--ease)] hover:border-[var(--accent)] hover:bg-[rgba(125,153,255,0.18)] hover:text-white"
          >
            {identity.email}
            <span
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-full border border-[var(--hair)] text-[0.85rem] transition-transform duration-300 group-hover:translate-x-[2px] group-hover:border-[var(--accent)]"
            >
              ↗
            </span>
          </a>
          <a
            href="#proof"
            className="group inline-flex items-center gap-2.5 rounded-full border border-[var(--edge)] bg-[rgba(255,255,255,0.03)] px-6 py-3 text-[0.95rem] font-medium tracking-[-0.01em] text-[var(--bone-dim)] backdrop-blur-xl transition-all duration-300 [transition-timing-function:var(--ease)] hover:border-[var(--bone)] hover:text-[var(--bone)]"
          >
            See the proof
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-y-[2px]"
            >
              ↓
            </span>
          </a>
        </div>

        <p className="t-label mt-7 !text-[0.78rem] !text-[var(--bone-dim)]" data-rv>
          {identity.role} · {identity.location} · {identity.availability}
        </p>
      </div>

      {/* The evidence, stated as four measured figures. Wide of the reading
          column, hairlined, and the only grid in the hero. */}
      <div className="shell mt-16 sm:mt-24">
        <dl className="panel grid grid-cols-2 gap-px px-2 py-2 sm:grid-cols-4" data-rv="scale">
          {gauges.map((g) => (
            <div
              key={g.label}
              className="px-5 py-6 sm:px-6 sm:py-7 [&:not(:first-child)]:sm:border-l [&:not(:first-child)]:sm:border-[var(--hair-soft)]"
            >
              <dd className="u-mono text-[clamp(2.2rem,1.4rem+2.4vw,3.2rem)] leading-none font-medium tracking-[-0.05em] text-[var(--bone)]">
                {g.count ? <CountUp to={g.value} /> : g.value}
              </dd>
              <dt className="t-label mt-4 !text-[0.76rem] !leading-[1.5] !text-[var(--bone-dim)]">
                {g.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      {/* Scroll cue: one tick that descends and resets. Not a bouncing mouse. */}
      <div
        aria-hidden
        className="shell pointer-events-none mt-12 flex items-center gap-3 sm:mt-16"
      >
        <span className="cue-tick h-6 w-px bg-gradient-to-b from-transparent to-[var(--accent)]" />
        <span className="t-label !text-[0.74rem] !text-[var(--bone-dim)]">scroll</span>
      </div>
    </section>
  );
}
