import { sections, skillQualifiers, skills, toolkit } from '@/lib/content';
import { SectionHead } from './SectionHead';

const meta = sections.find((s) => s.id === 'toolkit')!;

/* A second reading for each group, so the column of headings has the same
   bilingual rhythm as the navigation and the section heads. */
const JP: Record<string, string> = {
  languages: '言語',
  'backend & systems': '基盤',
  'infra & runtime': '実行環境',
  'ai systems': '知能',
  quality: '品質',
};

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
          num={meta.num}
          jp={meta.jp}
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
              <div className="glass spot h-full px-5 py-6 sm:px-6 sm:py-7" data-spot>
                <div className="relative z-[3] flex items-baseline gap-3">
                  <span className="u-mono text-[0.68rem] font-medium text-[var(--accent)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="t-h3 !text-[1rem] text-[var(--bone)]">{group.group}</h3>
                  <span aria-hidden className="t-jp ml-auto">
                    {JP[group.group] ?? ''}
                  </span>
                </div>

                <ul className="relative z-[3] mt-5 flex list-none flex-wrap gap-2 p-0">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="u-mono rounded-full border border-[var(--edge)] bg-[rgba(255,255,255,0.02)] px-3 py-1 text-[0.7rem] tracking-[-0.01em] text-[var(--bone-dim)] transition-colors duration-300 hover:border-[var(--accent)] hover:text-[var(--bone)]"
                    >
                      {item}
                      {skillQualifiers[item] ? (
                        <span className="ml-1.5 text-[0.6rem] text-[var(--mute)]">
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
