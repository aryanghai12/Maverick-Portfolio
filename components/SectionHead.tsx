import { BlurWords } from './ui/BlurWords';

/**
 * The section head: a formal kanji numeral, the Japanese reading, the English
 * label, and a rule painted with the spectrum.
 *
 * The numeral is the quiet index running down the page. It carries no meaning a
 * visitor has to decode, which is the point: it gives every section a distinct
 * shape at a glance, the way a chapter number does, before a single word of the
 * heading has been read.
 */
export function SectionHead({
  num,
  jp,
  label,
  heading,
  lede,
}: {
  num: string;
  jp: string;
  label: string;
  heading: string;
  lede?: string;
}) {
  return (
    <header className="mb-12 sm:mb-16">
      <div className="flex items-center gap-4" data-rv>
        <span
          aria-hidden
          className="u-mono text-[1.3rem] leading-none text-[var(--accent)] opacity-80"
        >
          {num}
        </span>
        <span aria-hidden className="t-jp">
          {jp}
        </span>
        <span className="t-label shrink-0">{label}</span>
        <span aria-hidden className="rule-grad min-w-6 flex-1" />
      </div>

      <h2 className="t-h2 mt-7 max-w-[22ch] text-[var(--bone)]">
        <BlurWords text={heading} />
      </h2>

      {lede ? (
        <p className="t-body mt-5 !max-w-[58ch]" data-rv>
          {lede}
        </p>
      ) : null}
    </header>
  );
}
