import { hope, sections } from '@/lib/content';
import { BlurWords } from './ui/BlurWords';

const meta = sections.find((s) => s.id === 'hope')!;

/**
 * The pause.
 *
 * Everything above this section is evidence and everything below it is an ask,
 * and a page that runs straight from one into the other reads as a pitch. This
 * is the one section that is not defending anything.
 *
 * It is also the only place on the site set in a serif, and the only place a
 * quotation mark appears. Both are deliberate: a line borrowed from somebody
 * else should not arrive in the same voice as the rest of the page, and the
 * field behind it thins out to a drifting starfield for exactly this long.
 */
export function Hope() {
  return (
    <section
      id="hope"
      data-stage="nebula"
      className="relative flex min-h-[86svh] items-center py-24"
    >
      <div className="shell">
        <div className="mx-auto max-w-[30ch] text-center">
          <div className="flex items-center justify-center gap-3" data-rv>
            <span aria-hidden className="u-mono text-[1.1rem] text-[var(--accent)] opacity-70">
              {meta.num}
            </span>
            <span aria-hidden className="t-jp">
              {meta.jp}
            </span>
          </div>

          <blockquote className="mt-10">
            <p className="t-quote text-balance">
              <span aria-hidden className="text-[var(--mute)]">
                &ldquo;
              </span>
              <BlurWords text={hope.quote} stagger={95} />
              <span aria-hidden className="text-[var(--mute)]">
                &rdquo;
              </span>
            </p>

            <footer className="mt-9 flex flex-col items-center gap-1.5" data-rv>
              <span aria-hidden className="rule-grad mb-4 h-px w-16" />
              <cite className="t-label !text-[0.66rem] !not-italic !text-[var(--bone-dim)]">
                {hope.attribution}
              </cite>
              <span className="t-label !text-[0.58rem]">{hope.source}</span>
            </footer>
          </blockquote>

          <p className="t-body mx-auto mt-14 !max-w-[52ch] text-center" data-rv>
            {hope.gloss}
          </p>
        </div>
      </div>
    </section>
  );
}
