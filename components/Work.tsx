import stats from '@/data/stats.json';
import { alsoBuilt, projects, sections } from '@/lib/content';
import { SectionHead } from './SectionHead';
import { BlurWords } from './ui/BlurWords';
import { Tilt } from './Tilt';
import { CavixInstrument } from './instruments/CavixInstrument';
import { TraceCVInstrument } from './instruments/TraceCVInstrument';
import { RepoPulseInstrument } from './instruments/RepoPulseInstrument';
import { DependencyGraph } from './DependencyGraph';

const meta = sections.find((s) => s.id === 'work')!;

const instruments = {
  cavix: CavixInstrument,
  tracecv: TraceCVInstrument,
  repopulse: RepoPulseInstrument,
} as const;

/* The index runs inside the section too, one address per project, on the same
   scheme the page itself is numbered with. */
const MARKS = ['0x02.a', '0x02.b', '0x02.c'];

const repoFor = (id: string) => stats.projects.find((p) => p.id === id);

/**
 * The work.
 *
 * Each project gets a working reduction of itself rather than a screenshot: a
 * sandbox execution log, a parse x-ray, a K-Means scatter plot. They are the
 * strongest thing in this section, so they are mounted on glass, tilted to the
 * pointer, and swung out of the depth of the page as they arrive.
 *
 * The instrument alternates sides down the page. Three identical rows of
 * copy-then-panel is even texture, and even texture becomes wallpaper by the
 * third one.
 */
export function Work() {
  return (
    <section id="work" data-stage="helix" className="section">
      <div className="shell">
        <SectionHead
          hex={meta.hex}
          cmd={meta.cmd}
          label="work"
          heading="What I build"
          lede="Three systems, each one built around the same refusal: do not assert, execute. Each carries a working reduction of the real thing rather than a screenshot of it."
        />
      </div>

      <div className="shell-wide">
        <div className="space-y-24 sm:space-y-36">
          {projects.map((p, pi) => {
            const Instrument = instruments[p.id];
            const repo = repoFor(p.id);
            const flip = pi % 2 === 1;

            return (
              <article key={p.id} className="relative" aria-labelledby={`proj-${p.id}`}>
                <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-start lg:gap-16 [&>*]:min-w-0">
                  {/* Copy column. One surface: this is the densest writing on
                      the site and it is not going to fight a helix for it. */}
                  <div
                    className={`panel px-6 py-8 sm:px-9 sm:py-10 ${flip ? 'lg:order-2' : ''}`}
                    data-rv
                  >
                    <div className="flex items-center gap-4">
                      <span className="u-mono text-[0.88rem] font-medium tracking-[0.04em] text-[var(--accent)]">
                        {MARKS[pi] ?? p.index}
                      </span>
                      <span aria-hidden className="h-3 w-px bg-[var(--edge)]" />
                      <span className="t-label !text-[0.76rem]">{p.period}</span>
                    </div>

                    <h3
                      id={`proj-${p.id}`}
                      className="t-h2 mt-5 !text-[clamp(1.9rem,1.2rem+2.4vw,2.9rem)] text-[var(--bone)]"
                    >
                      <BlurWords text={p.name} stagger={90} />
                    </h3>

                    <p
                      className="mt-3 text-[0.92rem] leading-[1.5] tracking-[0.01em] text-[var(--accent)]"
                      data-rv
                    >
                      {p.tagline}
                    </p>

                    <p className="t-body mt-7" data-rv>
                      {p.body}
                    </p>

                    <ul className="mt-7 list-none space-y-3 p-0">
                      {p.points.map((pt, i) => (
                        <li
                          key={i}
                          className="relative pl-6 text-[0.92rem] leading-[1.68] text-[var(--bone-dim)]"
                          data-rv
                          style={{ transitionDelay: `${i * 55}ms` }}
                        >
                          <span
                            aria-hidden
                            className="absolute top-[0.62em] left-0 h-px w-3 bg-gradient-to-r from-[var(--accent)] to-transparent"
                          />
                          {pt}
                        </li>
                      ))}
                    </ul>

                    <ul className="mt-8 flex list-none flex-wrap gap-2 p-0">
                      {p.stack.map((s) => (
                        <li
                          key={s}
                          className="u-mono rounded-full border border-[var(--edge)] bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-[0.8rem] tracking-[-0.01em] text-[var(--bone-dim)] transition-colors duration-300 hover:border-[var(--accent)] hover:text-[var(--bone)]"
                        >
                          {s}
                        </li>
                      ))}
                    </ul>

                    <p className="t-statement mt-9 border-l-2 border-[var(--accent)] pl-5 !text-[clamp(1.08rem,1rem+0.45vw,1.3rem)]">
                      {p.endcap}
                    </p>

                    {repo ? (
                      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="group u-mono inline-flex items-center gap-2 text-[0.88rem] text-[var(--bone)] transition-colors duration-300 hover:text-[var(--accent)]"
                        >
                          <span className="ul-draw">source</span>
                          <span
                            aria-hidden
                            className="transition-transform duration-300 group-hover:translate-x-[3px]"
                          >
                            ↗
                          </span>
                          <span className="sr-only">
                            {p.name} source on GitHub, opens in a new tab
                          </span>
                        </a>
                        {repo.homepage ? (
                          <a
                            href={repo.homepage}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="group u-mono inline-flex items-center gap-2 text-[0.88rem] text-[var(--bone-dim)] transition-colors duration-300 hover:text-[var(--accent)]"
                          >
                            <span className="ul-draw">live</span>
                            <span
                              aria-hidden
                              className="transition-transform duration-300 group-hover:translate-x-[3px]"
                            >
                              ↗
                            </span>
                            <span className="sr-only">
                              {p.name} running, opens in a new tab
                            </span>
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {/* Instrument: a working reduction of the product, mounted on
                      glass and turned toward the pointer. */}
                  <div
                    className={`depth lg:sticky lg:top-24 ${flip ? 'lg:order-1' : ''}`}
                    data-rv="scale"
                    data-depth
                    style={{ '--dir': flip ? -1 : 1 } as React.CSSProperties}
                  >
                    <Tilt>
                      <div className="glass spot overflow-hidden" data-spot>
                        <div className="relative z-[3] flex items-center gap-3 border-b border-[var(--hair-soft)] px-5 py-3.5">
                          <span
                            aria-hidden
                            className="led h-[6px] w-[6px] rounded-full bg-[var(--accent)]"
                          />
                          <span className="t-label !text-[0.74rem] !text-[var(--bone-dim)]">
                            {p.name} · live reduction
                          </span>
                          <span className="u-mono ml-auto text-[0.74rem] text-[var(--mute)]">
                            {p.index}
                          </span>
                        </div>
                        <div className="relative z-[3]">
                          <Instrument />
                        </div>
                      </div>
                    </Tilt>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="shell">
        <DependencyGraph />

        {/* Kept off the headline slots so three projects stay three projects. */}
        <div className="mt-24 border-t border-[var(--hair-soft)] pt-12" data-rv>
          <div className="flex items-center gap-3">
            <span className="t-label !text-[var(--bone)]">also built</span>
            <span aria-hidden className="t-cmd">
              <span className="text-[var(--mute)]">$ </span>ls ./side
            </span>
          </div>
          <ul className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2">
            {alsoBuilt.map((a, i) => (
              <li
                key={a.name}
                className="depth"
                data-depth
                style={{ '--dir': i % 2 ? -1 : 1 } as React.CSSProperties}
              >
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-spot
                  className="panel spot group block h-full px-6 py-7 transition-transform duration-500 [transition-timing-function:var(--ease-out)] hover:-translate-y-[3px] sm:px-7 sm:py-8"
                >
                  <div className="relative z-[3] flex items-center gap-3">
                    <h3 className="t-h3 !text-[1.2rem] text-[var(--bone)]">{a.name}</h3>
                    <span
                      aria-hidden
                      className="text-[var(--mute)] transition-all duration-300 group-hover:translate-x-[3px] group-hover:text-[var(--accent)]"
                    >
                      ↗
                    </span>
                  </div>
                  <p className="relative z-[3] mt-2.5 text-[0.98rem] leading-[1.62] text-[var(--bone-dim)]">
                    {a.what}
                  </p>
                  <p className="t-label relative z-[3] mt-3 !text-[0.76rem]">{a.stack}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
