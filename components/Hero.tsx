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
  { value: stats.merged.trueUpstream, label: 'merged upstream', jp: '取込済', count: true },
  {
    value: stats.merged.trueUpstreamRepoCount,
    label: 'repos I do not own',
    jp: '他者の資産',
    count: true,
  },
  { value: stats.user.publicRepos, label: 'public repos', jp: '公開', count: true },
  // A year is not a quantity: counting up to it, or grouping it as 2,023, both
  // read as a bug rather than as a flourish.
  { value: stats.user.contributingSince, label: 'contributing since', jp: '開始年', count: false },
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
          className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2"
          data-rv
        >
          <span aria-hidden className="led h-[6px] w-[6px] rounded-full bg-[var(--accent)]" />
          <span className="t-label !text-[0.62rem] !text-[var(--bone-dim)]">
            {identity.status}
          </span>
        </div>

        <h1 className="t-display mt-8 max-w-[17ch] text-[var(--bone)] sm:mt-10">
          {/* The line lands in two beats: the claim in white, the qualifier a
              shade back, so the eye reads the shape before the sentence. */}
          <BlurWords text={thesis.headline} stagger={78} dimFrom={5} />
        </h1>

        <p className="t-lede mt-8 !max-w-[56ch] !text-[var(--bone-dim)]" data-rv>
          {thesis.support}
        </p>

        {/* Two actions, ranked. The primary one is the address itself: neither
            call to action used to say hire me, and the one conversion event on
            the site was reachable only by operating a terminal widget. */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3" data-rv>
          <a
            href={links.email}
            className="group inline-flex items-center gap-3 rounded-full border border-[var(--hair)] bg-[rgba(255,255,255,0.06)] py-2 pr-2 pl-5 text-[0.86rem] font-medium tracking-[-0.01em] text-[var(--bone)] backdrop-blur-xl transition-all duration-300 [transition-timing-function:var(--ease)] hover:border-[var(--accent)] hover:bg-[rgba(125,153,255,0.14)] hover:text-white"
          >
            {identity.email}
            <span
              aria-hidden
              className="grid h-7 w-7 place-items-center rounded-full border border-[var(--hair)] text-[0.7rem] transition-transform duration-300 group-hover:translate-x-[2px] group-hover:border-[var(--accent)]"
            >
              ↗
            </span>
          </a>
          <a
            href="#proof"
            className="group inline-flex items-center gap-2.5 rounded-full border border-[var(--edge)] px-5 py-2.5 text-[0.86rem] font-medium tracking-[-0.01em] text-[var(--bone-dim)] transition-all duration-300 [transition-timing-function:var(--ease)] hover:border-[var(--bone)] hover:text-[var(--bone)]"
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

        <p className="t-label mt-6 !text-[0.6rem]" data-rv>
          {identity.role} · {identity.location} · {identity.availability}
        </p>
      </div>

      {/* The evidence, stated as four measured figures. Wide of the reading
          column, hairlined, and the only grid in the hero. */}
      <div className="shell mt-16 sm:mt-24">
        <dl className="grid grid-cols-2 gap-px border-t border-[var(--hair-soft)] sm:grid-cols-4">
          {gauges.map((g, i) => (
            <div
              key={g.label}
              className="border-b border-[var(--hair-soft)] py-5 pr-4 sm:border-b-0 sm:py-7 [&:not(:first-child)]:sm:border-l [&:not(:first-child)]:sm:border-[var(--hair-soft)] [&:not(:first-child)]:sm:pl-7"
              data-rv
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <dd className="u-mono text-[clamp(2rem,1.3rem+2.2vw,2.9rem)] leading-none font-medium tracking-[-0.05em] text-[var(--bone)]">
                {g.count ? <CountUp to={g.value} /> : g.value}
              </dd>
              <dt className="mt-3 flex flex-wrap items-baseline gap-x-2">
                <span className="t-label !text-[0.6rem] !leading-[1.5]">{g.label}</span>
                <span aria-hidden className="t-jp !text-[0.6rem]">
                  {g.jp}
                </span>
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
        <span className="t-label !text-[0.58rem]">scroll</span>
      </div>
    </section>
  );
}
