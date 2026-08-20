import { BlurWords } from './ui/BlurWords';

/**
 * The section head: a hex index, the command that would return the same thing
 * from a shell, the English label, and a rule painted with the spectrum.
 *
 * The command is the quiet second line running down the page. It carries no
 * meaning a visitor has to decode, which is the point: it gives every section a
 * distinct shape at a glance, the way a chapter number does, and it happens to
 * say something true about how the person whose site this is would ask the same
 * question.
 */
export function SectionHead({
  hex,
  cmd,
  label,
  heading,
  lede,
}: {
  hex: string;
  cmd: string;
  label: string;
  heading: string;
  lede?: string;
}) {
  return (
    <header className="mb-12 sm:mb-16">
      {/* The machine rail, and the one line in a section head that stays off a
          surface. It is a row of short mono tokens with air around them, so the
          field reads as space between them rather than as noise underneath a
          sentence. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-rv>
        <span className="u-mono text-[0.82rem] font-medium tracking-[0.06em] text-[var(--accent)]">
          {hex}
        </span>
        <span className="t-label shrink-0 !text-[var(--bone-dim)]">{label}</span>
        <span aria-hidden className="t-cmd">
          <span className="text-[var(--mute)]">$ </span>
          {cmd}
        </span>
        <span aria-hidden className="rule-grad min-w-6 flex-1" />
      </div>

      {/* No surface here.
      
          A heading and two lines of lede do not need a panel behind them, and
          wrapping every section head in one turned the page into a stack of
          boxes and hid the field behind them. The heading carries a tight halo
          and is display-size; the lede is short, bright, and sits high in the
          section where the field is quiet. Surfaces are for the long stretches
          of prose further down. */}
      <h2 className="t-h2 mt-7 max-w-[24ch] text-[var(--bone)]">
        <BlurWords text={heading} />
      </h2>

      {lede ? (
        <p className="t-lede lede-halo mt-6 !max-w-[58ch] !text-[var(--bone-dim)]" data-rv>
          {lede}
        </p>
      ) : null}

    </header>
  );
}
