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
      <div className="shell">
        {/* The opening statement.
        
            No panel. A glass rectangle here cut the sphere in half and read as a
            component dropped onto the landing page, which is the one place the
            composition should be continuous. The separation is done with no
            edges instead: a dark bloom feathered to nothing plus a masked
            backdrop blur, so the field right behind the words is smoothed into a
            ground while the rest of it stays sharp and bright. */}
        <div className="relative mx-auto max-w-[58rem] text-center">
          <span aria-hidden className="hero-veil" />

          {/* Everything from here up sits above the veil. */}
          <div className="relative">
            {/* Signature chip. The one thing above the statement, and it states
                availability rather than a greeting, because availability is the
                fact a recruiter is scanning for. */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--hair)] bg-[rgba(255,255,255,0.07)] px-5 py-2.5 backdrop-blur-md">
              <span aria-hidden className="led h-[7px] w-[7px] rounded-full bg-[var(--accent)]" />
              <span className="t-label !text-[0.74rem] !text-[var(--bone)]">
                {identity.status}
              </span>
            </div>

            <h1 className="t-display hero-type mx-auto mt-9 max-w-[22ch] text-[var(--bone)] sm:mt-11">
              {/* The line lands in two beats: the claim in white, the qualifier a
                  shade back, so the eye reads the shape before the sentence. */}
              <BlurWords text={thesis.headline} stagger={78} dimFrom={5} />
            </h1>

            <p
              className="t-lede hero-type mx-auto mt-8 !max-w-[56ch] !text-[var(--bone-dim)]"
              data-rv
            >
              {thesis.support}
            </p>

            {/* Two actions, ranked, and the ranking is visible from across the
                room. The primary one is the address itself: neither call to
                action used to say hire me, and the one conversion event on the
                site was reachable only by operating a terminal widget. */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3" data-rv>
              <a
                href={links.email}
                className="group u-mono inline-flex items-center gap-3 rounded-full bg-white py-2.5 pr-2.5 pl-6 text-[0.88rem] font-medium tracking-[-0.01em] text-[#070912] transition-all duration-300 [transition-timing-function:var(--ease)] hover:bg-[#dfe6fb]"
              >
                {identity.email}
                <span
                  aria-hidden
                  className="grid h-8 w-8 place-items-center rounded-full bg-[rgba(7,9,18,0.12)] text-[0.85rem] transition-transform duration-300 group-hover:translate-x-[2px]"
                >
                  ↗
                </span>
              </a>
              <a
                href="#proof"
                className="group u-mono inline-flex items-center gap-2.5 rounded-full border border-[var(--hair)] bg-[rgba(255,255,255,0.05)] px-6 py-3 text-[0.82rem] font-medium tracking-[0.04em] text-[var(--bone-dim)] uppercase backdrop-blur-md transition-all duration-300 [transition-timing-function:var(--ease)] hover:border-[var(--bone)] hover:text-[var(--bone)]"
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

            <p
              className="t-label hero-type-sm mt-9 !text-[0.72rem] !leading-[1.8] !text-[var(--bone-dim)]"
              data-rv
            >
              {identity.role} · {identity.location} · {identity.availability}
            </p>
          </div>
        </div>
      </div>

      {/* The evidence, stated as four measured figures.
      
          Hairlines rather than a panel, for the same reason the statement above
          has no panel: this is the landing page and it should read as one image.
          The figures are large, mono and white, which is all the emphasis a
          number needs. */}
      <div className="shell relative mt-16 sm:mt-20">
        <span aria-hidden className="hero-veil-flat" />
        <dl
          className="relative mx-auto grid w-full max-w-[58rem] grid-cols-2 border-t border-[var(--hair-soft)] sm:grid-cols-4"
          data-rv
        >
          {gauges.map((g) => (
            <div
              key={g.label}
              className="border-b border-[var(--hair-soft)] px-5 py-6 text-center sm:border-b-0 sm:px-4 sm:py-7 [&:not(:first-child)]:sm:border-l [&:not(:first-child)]:sm:border-l-[var(--hair-soft)]"
            >
              <dd className="u-mono hero-type text-[clamp(2.1rem,1.4rem+2.2vw,3rem)] leading-none font-bold tracking-[-0.06em] text-[var(--bone)]">
                {g.count ? <CountUp to={g.value} /> : g.value}
              </dd>
              <dt className="t-label hero-type-sm mt-4 !text-[0.7rem] !leading-[1.6] !text-[var(--bone-dim)]">
                {g.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      {/* Scroll cue: one tick that descends and resets. Not a bouncing mouse. */}
      <div
        aria-hidden
        className="shell pointer-events-none mt-10 flex items-center gap-3 sm:mt-12"
      >
        <span className="cue-tick h-6 w-px bg-gradient-to-b from-transparent to-[var(--bone)]" />
        <span className="t-label hero-type-sm !text-[0.7rem] !text-[var(--mute)]">scroll</span>
      </div>
    </section>
  );
}
