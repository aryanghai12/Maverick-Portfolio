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
    jp: '実務',
  },
  {
    stamp: education.period,
    title: education.school,
    sub: education.degree,
    body: education.detail,
    stack: null,
    jp: '学歴',
  },
];

export function About() {
  return (
    <section id="about" data-stage="terrain" className="section">
      <div className="shell">
        <SectionHead
          num={meta.num}
          jp={meta.jp}
          label="who"
          heading={about.heading}
        />

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16 [&>*]:min-w-0">
          <div>
            {about.paragraphs.map((p, i) => (
              <p
                key={i}
                className="t-body mb-6 last:mb-0"
                data-rv
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                {p}
              </p>
            ))}

            <p
              className="t-statement mt-10 border-l-2 border-[var(--accent)] pl-5"
              data-rv
            >
              {about.aside}
            </p>
          </div>

          {/* The session. Everything it prints is stated exactly once, here. */}
          <div className="lg:pt-2">
            <Terminal3D />
          </div>
        </div>

        {/* The log */}
        <ol className="mt-20 list-none space-y-px p-0 sm:mt-24">
          {log.map((row) => (
            <li
              key={row.title}
              className="group relative border-t border-[var(--hair-soft)] pt-7 pb-8 transition-[padding] duration-300 [transition-timing-function:var(--ease)] hover:pl-3"
              data-rv
            >
              {/* A tick lights in the gutter on hover, painted with the accent
                  rather than the neutral, so the row answers the pointer. */}
              <span
                aria-hidden
                className="absolute top-[30px] left-0 h-[7px] w-[7px] rounded-[1px] bg-[var(--accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="grid gap-4 sm:grid-cols-[13rem_1fr] sm:gap-8">
                <div>
                  <div className="t-data !text-[var(--mute)]">{row.stamp}</div>
                  <div aria-hidden className="t-jp mt-1">
                    {row.jp}
                  </div>
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
                          className="u-mono rounded-full border border-[var(--edge)] px-3 py-1 text-[0.68rem] tracking-[-0.01em] text-[var(--bone-dim)]"
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
