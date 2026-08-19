import { about, education, experience, sections } from '@/lib/content';
import { SectionHead } from './SectionHead';
import { Terminal3D } from './Terminal3D';

const meta = sections.find((s) => s.id === 'about')!;

/**
 * The log rows carry education and experience. Two entries do not justify a
 * chapter of their own, and they read as context for the prose directly above
 * them, so they live here.
 */
const log = [
  {
    stamp: experience.period,
    title: experience.org,
    sub: `${experience.role} · ${experience.mode}`,
    body: experience.body,
    stack: experience.stack,
  },
  {
    stamp: education.period,
    title: education.school,
    sub: education.degree,
    body: education.detail,
    stack: null,
  },
];

export function About() {
  return (
    <section id="about" data-stage="terrain" className="section">
      <div className="shell">
        <SectionHead
          hex={meta.hex}
          cmd={meta.cmd}
          label="who"
          heading={about.heading}
        />

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16 [&>*]:min-w-0">
          <div className="panel px-6 py-8 sm:px-9 sm:py-10" data-rv>
            {about.paragraphs.map((p, i) => (
              <p key={i} className="t-body mb-6 !max-w-none last:mb-0">
                {p}
              </p>
            ))}

            <p className="t-statement mt-10 border-l-2 border-[var(--accent)] pl-5">
              {about.aside}
            </p>
          </div>

          {/* The session. Everything it prints is stated exactly once, here. */}
          <div className="lg:pt-2">
            <Terminal3D />
          </div>
        </div>

        {/* The log */}
        <ol className="mt-20 list-none space-y-4 p-0 sm:mt-24">
          {log.map((row, i) => (
            <li
              key={row.title}
              className="panel spot depth px-6 py-8 sm:px-9 sm:py-10"
              data-rv="scale"
              data-spot
              data-depth
              style={{ '--dir': i % 2 ? -1 : 1 } as React.CSSProperties}
            >
              <div className="grid gap-4 sm:grid-cols-[13rem_1fr] sm:gap-8">
                <div>
                  <div className="t-data !text-[var(--bone-dim)]">{row.stamp}</div>
                </div>
                <div>
                  <h3 className="t-h3 text-[var(--bone)]">{row.title}</h3>
                  <p className="mt-2 text-[0.82rem] tracking-[0.02em] text-[var(--accent)]">
                    {row.sub}
                  </p>
                  <p className="t-body mt-4 !max-w-[68ch] !text-[0.98rem]">{row.body}</p>
                  {row.stack ? (
                    <ul className="mt-5 flex list-none flex-wrap gap-2 p-0">
                      {row.stack.map((s) => (
                        <li
                          key={s}
                          className="u-mono rounded-full border border-[var(--edge)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[0.8rem] tracking-[-0.01em] text-[var(--bone-dim)]"
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
