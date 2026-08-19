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

/* The kanji index runs inside the section too, one numeral per project. */
const NUMERALS = ['壱', '弐', '参'];

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
          num={meta.num}
          jp={meta.jp}
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
                  {/* Copy column */}
                  <div className={flip ? 'lg:order-2' : undefined}>
                    <div className="flex items-center gap-4" data-rv>
                      <span
                        aria-hidden
                        className="u-mono text-[1.15rem] leading-none text-[var(--accent)] opacity-80"
                      >
                        {NUMERALS[pi] ?? p.index}
                      </span>
                      <span className="u-mono text-[0.74rem] font-bold tracking-[0.14em] text-[var(--bone-dim)]">
                        {p.index}
                      </span>
                      <span aria-hidden className="h-3 w-px bg-[var(--edge)]" />
                      <span className="t-label !text-[0.6rem]">{p.period}</span>
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

                    <ul className="mt-8 flex list-none flex-wrap gap-2 p-0" data-rv>
                      {p.stack.map((s) => (
                        <li
                          key={s}
                          className="u-mono rounded-full border border-[var(--edge)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[0.68rem] tracking-[-0.01em] text-[var(--bone-dim)] transition-colors duration-300 hover:border-[var(--accent)] hover:text-[var(--bone)]"
                        >
                          {s}
                        </li>
                      ))}
                    </ul>

                    <p
                      className="t-statement mt-9 border-l-2 border-[var(--accent)] pl-5 !text-[clamp(1rem,0.92rem+0.4vw,1.2rem)]"
                      data-rv
                    >
                      {p.endcap}
                    </p>

                    {repo ? (
                      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3" data-rv>
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="group u-mono inline-flex items-center gap-2 text-[0.78rem] text-[var(--bone)] transition-colors duration-300 hover:text-[var(--accent)]"
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
                            className="group u-mono inline-flex items-center gap-2 text-[0.78rem] text-[var(--bone-dim)] transition-colors duration-300 hover:text-[var(--accent)]"
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
                        <div className="relative z-[3] flex items-center gap-3 border-b border-[var(--hair-soft)] px-4 py-3">
                          <span
                            aria-hidden
                            className="led h-[6px] w-[6px] rounded-full bg-[var(--accent)]"
                          />
                          <span className="t-label !text-[0.56rem]">
                            {p.name} · live reduction
                          </span>
                          <span className="u-mono ml-auto text-[0.56rem] text-[var(--mute)]">
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
            <span className="t-label">also built</span>
            <span aria-hidden className="t-jp">
              その他
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
                  className="glass spot group block h-full px-5 py-6 transition-transform duration-500 [transition-timing-function:var(--ease-out)] hover:-translate-y-[3px] sm:px-6"
                >
                  <div className="relative z-[3] flex items-center gap-3">
                    <h3 className="t-h3 !text-[1.05rem] text-[var(--bone)]">{a.name}</h3>
                    <span
                      aria-hidden
                      className="text-[var(--mute)] transition-all duration-300 group-hover:translate-x-[3px] group-hover:text-[var(--accent)]"
                    >
                      ↗
                    </span>
                  </div>
                  <p className="relative z-[3] mt-2 text-[0.88rem] leading-[1.6] text-[var(--bone-dim)]">
                    {a.what}
                  </p>
                  <p className="t-label relative z-[3] mt-3 !text-[0.62rem]">{a.stack}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
