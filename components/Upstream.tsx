import stats from '@/data/stats.json';
import { SectionHead } from './SectionHead';
import { Kinetic } from './Kinetic';

const fmtStars = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

/* The date the figures on this page were actually measured.
 *
 * Printed rather than hidden. Every number here comes from the GitHub API at
 * build time, and saying when turns a snapshot into a dated measurement instead
 * of an implied claim about this exact second. It is also the honest answer to
 * "how do you know", and it is the same answer the projects themselves give. */
const measured = new Date(stats.generatedAt).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * The section that does the most work on the whole site.
 *
 * A double-digit run of merged pull requests into a CNCF project is rarer than
 * any project card, and it is the one claim here that a stranger can verify in
 * ten seconds: every row links to the real pull request. The argument of the site is proof
 * over assertion, so this section demonstrates it rather than stating it.
 *
 * Every number is read from data/stats.json, written at build time from the
 * GitHub API. Nothing here is typed by hand.
 */
export function Upstream() {
  const { merged, upstreamRepos, upstreamPRs } = stats;

  return (
    <section id="upstream" data-cam="upstream" className="section">
      <div className="shell">
        <SectionHead index="04" label="upstream" />

        <div className="grid [&>*]:min-w-0 gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="t-h2 max-w-[16ch] text-[var(--bone)]" data-rv>
              <Kinetic text="Code that shipped somewhere else" />
            </h2>

            <div className="mt-10 flex flex-wrap items-end gap-x-6 gap-y-3" data-rv>
              <span className="u-mono text-[clamp(3.2rem,2rem+5.6vw,5.4rem)] leading-[0.8] font-medium tracking-[-0.05em] text-[var(--bone)]">
                {merged.external}
              </span>
              {/* Set as a sentence, not as a tracked uppercase label. Beside a
                  numeral this size, 0.2em tracking broke the caption to one
                  word per line and made the pair look cramped. */}
              <p className="mb-1 max-w-[24ch] text-[0.98rem] leading-[1.5] text-[var(--bone-dim)]">
                merged pull requests into {merged.externalRepoCount} repositories I do not own
              </p>
            </div>

            <p className="t-body mt-8" data-rv>
              Merged in repositories where the standards were not mine to set. Every row
              below links to the real pull request. This is the one section of the site
              you can check in ten seconds without taking my word for anything.
            </p>

            {/* Repository table */}
            <ul className="mt-10 list-none space-y-px p-0">
              {upstreamRepos.map((r, i) => (
                <li
                  key={r.fullName}
                  data-rv
                  style={{ transitionDelay: `${i * 55}ms` }}
                  className="border-t border-[var(--hair-soft)]"
                >
                  <a
                    href={r.prsUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-center gap-4 py-4 transition-[padding-left] duration-300 [transition-timing-function:var(--ease)] hover:pl-3"
                  >
                    <span className="u-mono w-8 shrink-0 text-[0.95rem] font-bold text-[var(--accent)]">
                      {r.merged}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="u-mono block truncate text-[0.85rem] text-[var(--bone)]">
                        {r.fullName}
                      </span>
                      <span className="t-label mt-1 block !text-[0.56rem]">
                        {r.kind === 'team' ? 'student team project' : `${fmtStars(r.stars)} stars`}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="text-[var(--mute)] transition-all duration-300 group-hover:translate-x-[3px] group-hover:text-[var(--accent)]"
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* The wall */}
          <div data-rv="scale">
            <div className="glass overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[var(--hair-soft)] px-4 py-3 sm:px-5">
                <span className="u-mono text-[0.72rem] font-bold tracking-[-0.02em] text-[var(--bone)]">
                  merged
                </span>
                <span className="t-label ml-auto !text-[0.56rem]">newest first</span>
              </div>

              <ul
                className="scroll-wall m-0 max-h-[540px] list-none overflow-y-auto p-0"
                tabIndex={0}
                data-lenis-prevent
                aria-label="Merged pull requests, newest first"
              >
                {upstreamPRs.map((pr) => (
                  <li key={pr.url} className="border-b border-[var(--hair-soft)] last:border-b-0">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group block px-4 py-3.5 transition-colors duration-300 hover:bg-[var(--panel-1)] sm:px-5"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden
                          className="mt-[5px] text-[0.6rem] text-[var(--mute)] transition-colors duration-300 group-hover:text-[var(--accent)]"
                        >
                          ◈
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="u-mono m-0 text-[0.74rem] leading-[1.55] break-words text-[var(--bone-dim)] transition-colors duration-300 group-hover:text-[var(--bone)]">
                            {pr.title}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="t-label !text-[0.54rem]">{pr.repo}</span>
                            <span className="u-mono text-[0.6rem] text-[var(--mute)]">
                              #{pr.number}
                            </span>
                            <span className="u-mono ml-auto text-[0.6rem] text-[var(--mute)]">
                              {pr.mergedAt}
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* GitLab is linked but carries no number: its API exposes no public
                aggregate MR count per author, so any figure here would be a guess. */}
            <p className="t-label mt-4 !normal-case !tracking-[0.02em] !text-[0.68rem] !leading-[1.6]">
              Also on{' '}
              <a
                href={stats.gitlab.profileUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="ul-draw text-[var(--bone)] transition-colors hover:text-[var(--accent)]"
              >
                GitLab
              </a>
              , where the OWASP BLT work lives. No count is shown there because GitLab
              publishes no per-author merge total, and I am not going to estimate one.
            </p>

            <p className="t-label mt-3 !text-[0.56rem] !leading-[1.7]">
              every figure on this page counted from the github api · measured {measured}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
