import stats from '@/data/stats.json';
import { CNCF_ORGS, prHighlights, ruleGroup, sections } from '@/lib/content';
import { SectionHead } from './SectionHead';
import { CountUp } from './ui/CountUp';

const meta = sections.find((s) => s.id === 'proof')!;

const fmtStars = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

/* Display names for the CNCF orgs present in the data. Derived, not asserted:
   if a merge into one of these disappears, the claim disappears with it. */
const ORG_NAMES: Record<string, string> = {
  kubescape: 'Kubescape',
  openyurtio: 'OpenYurt',
};

/* The date the figures on this page were actually measured. Printed rather than
   hidden: every number here comes from the GitHub API at build time, and saying
   when turns a snapshot into a dated measurement instead of an implied claim
   about this exact second. */
const measured = new Date(stats.generatedAt).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * The proof.
 *
 * The one section a stranger can verify in ten seconds, so it is the first
 * thing after the hero and the only section that breaks the column every other
 * section lives in.
 *
 * The figures lead with trueUpstream rather than external. The difference is a
 * student team project, counted separately below: two pull requests on a
 * classmate's app are real, but folding them into the headline dilutes twenty
 * three merges into repositories with maintainers, and the larger number is the
 * weaker claim.
 */
export function Proof() {
  const { merged, upstreamRepos, upstreamPRs } = stats;

  const team = upstreamRepos.filter((r) => r.kind === 'team');
  const real = upstreamRepos.filter((r) => r.kind !== 'team');
  const teamRepoNames = new Set(team.map((r) => r.fullName));

  const cncf = [...new Set(real.map((r) => r.org).filter((o) => CNCF_ORGS.has(o)))]
    .map((o) => ORG_NAMES[o] ?? o)
    .sort();

  const byNumber = new Map(upstreamPRs.map((pr) => [pr.number, pr]));
  const highlights = prHighlights
    .map((h) => ({ ...h, pr: byNumber.get(h.number) }))
    .filter((h) => h.pr);

  const highlighted = new Set(highlights.map((h) => h.number));
  const rules = upstreamPRs.filter((pr) => pr.title.startsWith('feat(rules)'));
  const ruleNumbers = new Set(rules.map((pr) => pr.number));

  const rest = upstreamPRs.filter(
    (pr) =>
      !highlighted.has(pr.number) &&
      !ruleNumbers.has(pr.number) &&
      !teamRepoNames.has(pr.repo),
  );

  return (
    <section id="proof" data-stage="column" className="relative pt-10 pb-20 sm:pb-28">
      <div className="shell">
        <SectionHead
          hex={meta.hex}
          cmd={meta.cmd}
          label="proof"
          heading="Merged into code I do not own"
          lede={`${merged.trueUpstream} pull requests merged into ${merged.trueUpstreamRepoCount} repositories owned by other people${
            cncf.length > 0
              ? `, including ${cncf.join(' and ')}${cncf.length > 1 ? ', both CNCF projects' : ', a CNCF project'}`
              : ''
          }. Reviewed by maintainers whose standards were not mine to set. Every row below links to the pull request itself.`}
        />
      </div>

      {/* The band. The only element on the site that leaves the column. */}
      <div className="band py-14 sm:py-20">
        <div className="shell-wide">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-16">
            <span className="figure-xl t-grad shrink-0" data-rv>
              <CountUp to={merged.trueUpstream} duration={1400} />
            </span>

            <div className="panel max-w-[46ch] px-6 py-7 sm:px-8 sm:py-8" data-rv>
              <p className="t-statement">
                Every one of them was reviewed by somebody who had no reason to be
                generous about it.
              </p>
              <p className="t-label mt-5 !text-[0.74rem] !leading-[1.7]">
                counted from the github api · measured {measured}
              </p>
            </div>
          </div>

          {/* Repository strip, full width, swinging out of the depth of the page
              as it arrives. */}
          <ul className="mt-14 grid list-none gap-3 p-0 sm:mt-18 sm:grid-cols-2 lg:grid-cols-3">
            {real.map((r, i) => (
              <li
                key={r.fullName}
                data-rv="scale"
                data-depth
                className="depth"
                style={
                  {
                    transitionDelay: `${i * 55}ms`,
                    // Alternating sign, so the strip fans open as it arrives
                    // rather than sliding sideways as one block.
                    '--dir': i % 2 ? -1 : 1,
                  } as React.CSSProperties
                }
              >
                <a
                  href={r.prsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-spot
                  className="panel spot group flex h-full items-baseline gap-5 px-6 py-7 transition-transform duration-500 [transition-timing-function:var(--ease-out)] hover:-translate-y-[3px] sm:px-7 sm:py-8"
                >
                  <span className="u-mono relative z-[3] w-12 shrink-0 text-[2rem] leading-none font-medium tracking-[-0.045em] text-[var(--bone)]">
                    {r.merged}
                  </span>
                  <span className="relative z-[3] min-w-0 flex-1">
                    <span className="u-mono block truncate text-[0.95rem] text-[var(--bone-dim)] transition-colors duration-300 group-hover:text-[var(--bone)]">
                      {r.fullName}
                    </span>
                    <span className="t-label mt-2 block !text-[0.73rem]">
                      {fmtStars(r.stars)} stars
                      {CNCF_ORGS.has(r.org) ? ' · CNCF' : ''}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="relative z-[3] text-[var(--mute)] transition-all duration-300 group-hover:translate-x-[3px] group-hover:text-[var(--accent)]"
                  >
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="shell-wide mt-16 sm:mt-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 [&>*]:min-w-0">
          {/* Hardest first. Sorting newest first buried these under ten rule
              pull requests whose titles differ by three words. */}
          <div className="panel px-6 py-8 sm:px-8 sm:py-9" data-rv>
            <h3 className="t-label !text-[0.78rem] !text-[var(--bone)]">
              the ones that were hard
            </h3>
            <ul className="mt-7 list-none space-y-px p-0">
              {highlights.map((h, i) => (
                <li
                  key={h.number}
                  data-rv
                  style={{ transitionDelay: `${i * 50}ms` }}
                  className="border-t border-[var(--hair-soft)] last:border-b last:border-b-[var(--hair-soft)]"
                >
                  <a
                    href={h.pr!.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group block py-5 transition-[padding-left] duration-300 [transition-timing-function:var(--ease)] hover:pl-3"
                  >
                    <p className="m-0 text-[1.06rem] leading-[1.56] text-[var(--bone)]">
                      {h.gloss}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="u-mono text-[0.8rem] text-[var(--mute)]">
                        {h.pr!.repo}
                      </span>
                      <span className="u-mono text-[0.8rem] text-[var(--accent)]">
                        #{h.number}
                      </span>
                      <span className="u-mono ml-auto text-[0.78rem] text-[var(--mute)]">
                        {h.pr!.mergedAt}
                      </span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {/* The rules, stated once as the thing they collectively are. */}
            <div className="panel spot px-6 py-8 sm:px-8 sm:py-9" data-rv data-spot>
              <h3 className="t-h3 relative z-[3] text-[var(--bone)]">
                {ruleGroup.title.replace('Ten', String(rules.length))}
              </h3>
              <p className="t-body relative z-[3] mt-4 !text-[0.95rem]">{ruleGroup.body}</p>

              <ul className="relative z-[3] mt-6 grid list-none gap-x-6 gap-y-1.5 p-0 sm:grid-cols-2 [&>*]:min-w-0">
                {rules.map((pr) => (
                  <li key={pr.number}>
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="u-mono block truncate text-[0.82rem] text-[var(--bone-dim)] transition-colors hover:text-[var(--accent)]"
                      title={pr.title}
                    >
                      {pr.title.replace('feat(rules): add ', '')}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Everything else, compact. */}
            <div className="panel mt-4 px-6 py-8 sm:px-8 sm:py-9" data-rv>
            <h3 className="t-label !text-[0.78rem] !text-[var(--bone)]">also merged</h3>
            <ul className="mt-5 list-none space-y-px p-0">
              {rest.map((pr, i) => (
                <li
                  key={pr.url}
                  data-rv
                  style={{ transitionDelay: `${i * 30}ms` }}
                  className="border-t border-[var(--hair-soft)] last:border-b last:border-b-[var(--hair-soft)]"
                >
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-baseline gap-3 py-3"
                  >
                    <span className="u-mono min-w-0 flex-1 truncate text-[0.84rem] text-[var(--bone-dim)] transition-colors group-hover:text-[var(--bone)]">
                      {pr.title}
                    </span>
                    <span className="u-mono shrink-0 text-[0.78rem] text-[var(--mute)]">
                      {pr.repo.split('/')[1]} #{pr.number}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {/* Counted, labelled, and kept out of the headline. */}
            {team.length > 0 ? (
              <p className="t-label mt-7 !text-[0.82rem] !leading-[1.7] !normal-case !tracking-[0.01em]">
                Not counted above: {merged.external - merged.trueUpstream} further merges
                into{' '}
                <a
                  href={team[0].prsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="ul-draw text-[var(--bone-dim)]"
                >
                  {team[0].fullName}
                </a>
                , a classmate&rsquo;s project I worked on as part of the team. Real work,
                but not the same claim, so it does not get to inflate the number.
              </p>
            ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
