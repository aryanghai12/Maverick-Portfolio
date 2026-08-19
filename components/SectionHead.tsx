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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-rv>
        <span className="u-mono text-[0.86rem] font-medium tracking-[0.04em] text-[var(--accent)]">
          {hex}
        </span>
        <span className="t-label shrink-0 !text-[var(--bone-dim)]">{label}</span>
        <span aria-hidden className="t-cmd">
          <span className="text-[var(--mute)]">$ </span>
          {cmd}
        </span>
        <span aria-hidden className="rule-grad min-w-6 flex-1" />
      </div>

      <h2 className="t-h2 mt-7 max-w-[20ch] text-[var(--bone)]">
        <BlurWords text={heading} />
      </h2>

      {lede ? (
        <p className="t-lede mt-6 !max-w-[62ch] !text-[var(--bone-dim)]" data-rv>
          {lede}
        </p>
      ) : null}
    </header>
  );
}
