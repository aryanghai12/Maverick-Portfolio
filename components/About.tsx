import { about, education, experience } from '@/lib/content';
import { Kinetic } from './Kinetic';
import { SectionHead } from './SectionHead';
import { Console } from './Console';

/**
 * The log rows carry education and experience. The brief's section table left
 * them unplaced; they belong here rather than in a section of their own, because
 * two entries do not justify a chapter and they read as context for the prose
 * directly above them.
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
    <section id="about" data-cam="about" className="section">
      <div className="shell">
        <SectionHead index="01" label="README.md" />

        <h2 className="t-h2 max-w-[18ch] text-[var(--bone)]" data-rv>
          <Kinetic text={about.heading} />
        </h2>

        <div className="mt-12 grid [&>*]:min-w-0 gap-12 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-16">
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
          </div>

          <div className="lg:pt-2">
            <Console />
          </div>
        </div>

        {/* The log */}
        <ol className="mt-16 list-none space-y-px p-0 sm:mt-20">
          {log.map((row) => (
            <li
              key={row.title}
              className="group relative border-t border-[var(--hair-soft)] pt-6 pb-7 transition-[padding] duration-300 [transition-timing-function:var(--ease)] hover:pl-3 sm:pt-7"
              data-rv
            >
              {/* Ember tick appears in the gutter on hover. */}
              <span
                aria-hidden
                className="absolute top-[26px] left-0 h-[7px] w-[7px] rounded-[1px] bg-[var(--accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:top-[30px]"
              />
              <div className="grid gap-4 sm:grid-cols-[13rem_1fr] sm:gap-8">
                <div className="t-data !text-[var(--mute)]">{row.stamp}</div>
                <div>
                  <h3 className="t-h3 text-[var(--bone)]">{row.title}</h3>
                  <p className="t-label mt-2 !normal-case !tracking-[0.02em] !text-[0.78rem] !text-[var(--bone-dim)]">
                    {row.sub}
                  </p>
                  <p className="t-body mt-4 !max-w-[68ch] !text-[0.98rem]">{row.body}</p>
                  {row.stack ? (
                    <ul className="mt-5 flex list-none flex-wrap gap-2 p-0">
                      {row.stack.map((s) => (
                        <li
                          key={s}
                          className="u-mono rounded border border-[var(--edge)] px-2.5 py-1 text-[0.68rem] tracking-[-0.01em] text-[var(--bone-dim)]"
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
