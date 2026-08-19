import { sections, skillQualifiers, skills, toolkit } from '@/lib/content';
import { SectionHead } from './SectionHead';

const meta = sections.find((s) => s.id === 'toolkit')!;

/**
 * The toolkit.
 *
 * Grouped by where a thing sits in the stack rather than sorted by confidence,
 * and the three entries I would call basic carry the word basic. Qualifiers cost
 * nothing and they buy credibility for every item that carries none: a wall of
 * unqualified badges is read, correctly, as a wall of unqualified badges.
 */
export function Toolkit() {
  return (
    <section id="toolkit" data-stage="vortex" className="section">
      <div className="shell">
        <SectionHead
          hex={meta.hex}
          cmd={meta.cmd}
          label="toolkit"
          heading={toolkit.heading}
          lede={toolkit.lede}
        />

        <ol className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((group, i) => (
            <li
              key={group.group}
              className="depth"
              data-depth
              data-rv="scale"
              style={
                {
                  transitionDelay: `${i * 60}ms`,
                  '--dir': i % 2 ? -1 : 1,
                } as React.CSSProperties
              }
            >
              <div className="panel spot h-full px-6 py-7 sm:px-7 sm:py-8" data-spot>
                <div className="relative z-[3] flex items-baseline gap-3">
                  <span className="u-mono text-[0.82rem] font-medium text-[var(--accent)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="t-h3 !text-[1.12rem] text-[var(--bone)]">{group.group}</h3>
                  <span aria-hidden className="t-label ml-auto !text-[0.72rem]">
                    {group.items.length}
                  </span>
                </div>

                <ul className="relative z-[3] mt-5 flex list-none flex-wrap gap-2 p-0">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="u-mono rounded-full border border-[var(--edge)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[0.8rem] tracking-[-0.01em] text-[var(--bone-dim)] transition-colors duration-300 hover:border-[var(--accent)] hover:text-[var(--bone)]"
                    >
                      {item}
                      {skillQualifiers[item] ? (
                        <span className="ml-1.5 text-[0.72rem] text-[var(--mute)]">
                          {skillQualifiers[item]}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
