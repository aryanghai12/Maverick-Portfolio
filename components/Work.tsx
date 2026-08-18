import stats from '@/data/stats.json';
import { alsoBuilt, projects } from '@/lib/content';
import { SectionHead } from './SectionHead';
import { Kinetic } from './Kinetic';
import { Tilt } from './Tilt';
import { CavixInstrument } from './instruments/CavixInstrument';
import { TraceCVInstrument } from './instruments/TraceCVInstrument';
import { RepoPulseInstrument } from './instruments/RepoPulseInstrument';

const instruments = {
  cavix: CavixInstrument,
  tracecv: TraceCVInstrument,
  repopulse: RepoPulseInstrument,
} as const;

const repoFor = (id: string) => stats.projects.find((p) => p.id === id);

export function Work() {
  return (
    <section id="work" data-cam="work" className="section">
      <div className="shell">
        <SectionHead index="02" label="selected work" />

        <h2 className="t-h2 max-w-[20ch] text-[var(--bone)]" data-rv>
          <Kinetic text="Three things I built" />
        </h2>

        <div className="mt-14 space-y-20 sm:mt-16 sm:space-y-28">
          {projects.map((p) => {
            const Instrument = instruments[p.id];
            const repo = repoFor(p.id);

            return (
              <article key={p.id} className="relative" aria-labelledby={`proj-${p.id}`}>
                <div className="grid [&>*]:min-w-0 gap-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1fr)] lg:items-start lg:gap-14">
                  {/* Copy column */}
                  <div>
                    <div className="flex items-baseline gap-4" data-rv>
                      <span className="u-mono text-[0.78rem] font-bold tracking-[0.14em] text-[var(--accent)]">
                        {p.index}
                      </span>
                      <span className="t-label !text-[0.62rem]">{p.period}</span>
                    </div>

                    <h3
                      id={`proj-${p.id}`}
                      className="t-h2 mt-4 !text-[clamp(1.75rem,1.2rem+2.2vw,2.6rem)] text-[var(--bone)]"
                      data-rv
                    >
                      {p.name}
                    </h3>

                    <p
                      className="t-label mt-3 !normal-case !tracking-[0.01em] !text-[0.85rem] !text-[var(--bone-dim)]"
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
                            className="absolute top-[0.62em] left-0 h-px w-3 bg-[var(--edge)]"
                          />
                          {pt}
                        </li>
                      ))}
                    </ul>

                    <ul className="mt-8 flex list-none flex-wrap gap-2 p-0" data-rv>
                      {p.stack.map((s) => (
                        <li
                          key={s}
                          className="u-mono rounded border border-[var(--edge)] bg-[var(--panel-0)] px-2.5 py-1 text-[0.68rem] tracking-[-0.01em] text-[var(--bone-dim)] transition-colors duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          {s}
                        </li>
                      ))}
                    </ul>

                    <p
                      className="t-statement mt-9 border-l-2 border-[var(--bone)] pl-5 !text-[clamp(1rem,0.92rem+0.4vw,1.18rem)]"
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
                          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-[3px]">
                            ↗
                          </span>
                          <span className="sr-only">
                            {p.name} source on GitHub, opens in a new tab
                          </span>
                        </a>
                      </div>
                    ) : null}
                  </div>

                  {/* Instrument: a working reduction of the product, not a screenshot. */}
                  <div className="lg:sticky lg:top-24" data-rv="scale">
                    <Tilt>
                      <Instrument />
                    </Tilt>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Kept off the headline slots so three projects stay three projects. */}
        <div className="mt-20 border-t border-[var(--hair-soft)] pt-10" data-rv>
          <span className="t-label">also built</span>
          <ul className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2">
            {alsoBuilt.map((a) => (
              <li key={a.name} className="pane pane-hover overflow-hidden">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group block px-5 py-6 sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="t-h3 !text-[1.02rem] text-[var(--bone)]">
                      {a.name}
                    </h3>
                    <span
                      aria-hidden
                      className="text-[var(--mute)] transition-all duration-300 group-hover:translate-x-[3px] group-hover:text-[var(--accent)]"
                    >
                      ↗
                    </span>
                  </div>
                  <p className="mt-2 text-[0.88rem] leading-[1.6] text-[var(--bone-dim)]">{a.what}</p>
                  <p className="t-label mt-3 !text-[0.62rem]">{a.stack}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
