import stats from '@/data/stats.json';
import { CNCF_ORGS, prHighlights, ruleGroup } from '@/lib/content';
import { SectionHead } from './SectionHead';
import { Kinetic } from './Kinetic';

const fmtStars = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

/* Display names for the CNCF orgs present in the data. Derived, not asserted:
   if a merge into one of these disappears, the claim disappears with it. */
const ORG_NAMES: Record<string, string> = {
  kubescape: 'Kubescape',
  openyurtio: 'OpenYurt',
};

/* The date the figures on this page were actually measured.
 *
 * Printed rather than hidden. Every number here comes from the GitHub API at
 * build time, and saying when turns a snapshot into a dated measurement instead
 * of an implied claim about this exact second. */
const measured = new Date(stats.generatedAt).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * The proof.
 *
 * This is the one section a stranger can verify in ten seconds, so it is now
 * the first thing after the hero and the only section that breaks the column
 * every other section lives in.
 *
 * The figures lead with trueUpstream rather than external. The difference is a
 * student team project, counted separately below: two pull requests titled
 * "User" and "location sharing" on a classmate's app are real, but folding them
 * into the headline dilutes twenty three merges into repositories with
 * maintainers, and the larger number is the weaker claim.
 */
export function Upstream() {
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
    <section id="upstream" data-cam="upstream" className="relative pt-4 pb-20 sm:pb-28">
      <div className="shell">
        <SectionHead index="01" label="proof" />
      </div>

      {/* The band. The only element on the site that leaves the column. */}
      <div className="band py-12 sm:py-16">
        <div className="shell-wide">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-14">
            <span className="figure-xl shrink-0" data-rv>
              {merged.trueUpstream}
            </span>

            <div className="max-w-[46ch] pb-2">
              <h2 className="t-h2 text-[var(--bone)]" data-rv>
                <Kinetic text="Merged into code I do not own" stagger={16} />
              </h2>
              <p className="t-body mt-5" data-rv>
                {merged.trueUpstream} pull requests merged into{' '}
                {merged.trueUpstreamRepoCount} repositories owned by other people,
                {cncf.length > 0 ? (
                  <>
                    {' '}
                    including {cncf.join(' and ')}
                    {cncf.length > 1 ? ', both CNCF projects' : ', a CNCF project'}
                  </>
                ) : null}
                . Reviewed by maintainers whose standards were not mine to set. Every
                row below links to the pull request itself.
              </p>
            </div>
          </div>

          {/* Repository strip, full width. */}
          <ul className="mt-12 grid list-none gap-px border border-[var(--hair-soft)] bg-[var(--hair-soft)] p-0 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
            {real.map((r, i) => (
              <li key={r.fullName} data-rv style={{ transitionDelay: `${i * 45}ms` }}>
                <a
                  href={r.prsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex h-full items-baseline gap-5 bg-[var(--void)] px-5 py-6 transition-colors duration-300 hover:bg-[var(--panel-0)] sm:px-6 sm:py-7"
                >
                  <span className="u-mono w-10 shrink-0 text-[1.6rem] leading-none font-medium tracking-[-0.04em] text-[var(--bone)]">
                    {r.merged}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="u-mono block truncate text-[0.86rem] text-[var(--bone-dim)] transition-colors duration-300 group-hover:text-[var(--bone)]">
                      {r.fullName}
                    </span>
                    <span className="t-label mt-2 block !text-[0.56rem]">
                      {fmtStars(r.stars)} stars
                      {CNCF_ORGS.has(r.org) ? ' · CNCF' : ''}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="text-[var(--mute)] transition-all duration-300 group-hover:translate-x-[3px] group-hover:text-[var(--bone)]"
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
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          {/* Hardest first. Sorting newest first buried these under ten rule
              PRs whose titles differ by three words. */}
          <div>
            <h3 className="t-label !text-[0.62rem] !text-[var(--bone-dim)]" data-rv>
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
                    <p className="m-0 text-[0.98rem] leading-[1.55] text-[var(--bone)]">
                      {h.gloss}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="u-mono text-[0.68rem] text-[var(--mute)]">
                        {h.pr!.repo}
                      </span>
                      <span className="u-mono text-[0.68rem] text-[var(--bone-dim)] transition-colors group-hover:text-[var(--bone)]">
                        #{h.number}
                      </span>
                      <span className="u-mono ml-auto text-[0.64rem] text-[var(--mute)]">
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
            <div className="pane p-6 sm:p-7" data-rv>
              <h3 className="t-h3 text-[var(--bone)]">
                {ruleGroup.title.replace('Ten', String(rules.length))}
              </h3>
              <p className="t-body mt-4 !text-[0.95rem]">{ruleGroup.body}</p>

              <ul className="mt-6 grid list-none gap-x-6 gap-y-1.5 p-0 sm:grid-cols-2">
                {rules.map((pr) => (
                  <li key={pr.number}>
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="u-mono block truncate text-[0.68rem] text-[var(--mute)] transition-colors hover:text-[var(--bone)]"
                      title={pr.title}
                    >
                      {pr.title.replace('feat(rules): add ', '')}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Everything else, compact. */}
            <h3 className="t-label mt-12 !text-[0.62rem] !text-[var(--bone-dim)]" data-rv>
              also merged
            </h3>
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
                    <span className="u-mono min-w-0 flex-1 truncate text-[0.74rem] text-[var(--bone-dim)] transition-colors group-hover:text-[var(--bone)]">
                      {pr.title}
                    </span>
                    <span className="u-mono shrink-0 text-[0.64rem] text-[var(--mute)]">
                      {pr.repo.split('/')[1]} #{pr.number}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {/* Counted, labelled, and kept out of the headline. */}
            {team.length > 0 ? (
              <p className="t-label mt-7 !normal-case !tracking-[0.02em] !text-[0.66rem] !leading-[1.65]" data-rv>
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

            <p className="t-label mt-6 !text-[0.56rem] !leading-[1.7]" data-rv>
              every figure counted from the github api · measured {measured}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
