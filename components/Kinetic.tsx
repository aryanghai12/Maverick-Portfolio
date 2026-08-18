import { Fragment } from 'react';

/**
 * Per-character reveal, rendered on the server.
 *
 * The spans exist in the HTML at first paint and nothing here is built by JS, so
 * crawlers and screen readers see real text. The parent carries the original
 * string as aria-label and the spans are aria-hidden, so assistive tech reads a
 * word rather than a stream of letters.
 *
 * Each word is its own inline-block so headings still break at word boundaries.
 * The space between words is a bare text node directly under .kinetic, never a
 * child of a word span: trailing whitespace inside an inline-block is stripped
 * by the layout engine, which silently welds every word together.
 */
export function Kinetic({
  text,
  stagger = 24,
  className = '',
}: {
  text: string;
  /** Milliseconds between characters. ~24ms reads as a sweep, not a typewriter. */
  stagger?: number;
  className?: string;
}) {
  const words = text.split(' ');
  let charIndex = 0;

  return (
    <span className={`kinetic ${className}`} aria-label={text}>
      {words.map((word, w) => {
        const chars = [...word];
        const wordSpan = (
          <span className="inline-block whitespace-nowrap" aria-hidden="true">
            {chars.map((ch, c) => {
              const delay = charIndex++ * stagger;
              return (
                <span key={c} style={{ transitionDelay: `${delay}ms` }}>
                  {ch}
                </span>
              );
            })}
          </span>
        );
        // The space also advances the stagger clock, so the sweep crosses the
        // line at a constant rate instead of jumping at every gap.
        const isLast = w === words.length - 1;
        if (!isLast) charIndex++;

        return (
          <Fragment key={w}>
            {wordSpan}
            {isLast ? null : ' '}
          </Fragment>
        );
      })}
    </span>
  );
}
