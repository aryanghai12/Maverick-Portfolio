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
 * The site is set in one face, so the change of voice here is carried by size
 * and by the quotation marks rather than by a different family: this is the
 * largest run of type on the page after the opening statement, and the only
 * place a quotation mark appears. The field behind it thins out to a drifting
 * starfield for exactly this long.
 */
export function Hope() {
  return (
    <section
      id="hope"
      data-stage="nebula"
      className="relative flex min-h-[86svh] items-center py-24"
    >
      <div className="shell">
        <div
          className="panel mx-auto max-w-[44rem] px-7 py-14 text-center sm:px-16 sm:py-16"
          data-rv="scale"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="u-mono text-[0.86rem] font-medium tracking-[0.04em] text-[var(--accent)]">
              {meta.hex}
            </span>
            <span aria-hidden className="t-cmd">
              <span className="text-[var(--mute)]">$ </span>
              {meta.cmd}
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

            <footer className="mt-10 flex flex-col items-center gap-2">
              <span aria-hidden className="rule-grad mb-4 h-px w-20" />
              <cite className="t-label !text-[0.8rem] !text-[var(--bone)] !not-italic">
                {hope.attribution}
              </cite>
              <span className="t-label !text-[0.74rem]">{hope.source}</span>
            </footer>
          </blockquote>

          <p className="t-body mx-auto mt-12 !max-w-[46ch] text-center">{hope.gloss}</p>
        </div>
      </div>
    </section>
  );
}
