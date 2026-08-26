import { Fragment } from 'react';

/**
 * Word-level reveal: each word rises and resolves out of a heavy blur, left to
 * right across the line.
 *
 * Rendered on the server. The spans exist in the HTML at first paint and
 * nothing here is built by JavaScript, so crawlers and screen readers see real
 * text: the parent carries the whole string as aria-label and every span is
 * aria-hidden, so assistive tech reads a sentence rather than a stream of
 * fragments.
 *
 * Words rather than characters, unlike Kinetic. At display size a per-character
 * sweep on a ten-word headline takes two seconds to finish and reads as a
 * typewriter; per word it reads as a sentence arriving.
 */
export function BlurWords({
  text,
  stagger = 70,
  delay = 0,
  /** Words from this index on are set a shade back, so the line lands in two
      beats instead of one flat wall of white. */
  dimFrom,
  className = '',
}: {
  text: string;
  stagger?: number;
  delay?: number;
  dimFrom?: number;
  className?: string;
}) {
  const words = text.split(' ');

  return (
    <span className={`kinetic ${className}`} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            aria-hidden="true"
            className={dimFrom !== undefined && i >= dimFrom ? 'dim' : undefined}
            style={{ transitionDelay: `${delay + i * stagger}ms` }}
          >
            {word}
          </span>
          {/* The space is a bare text node under the parent, never inside a
              word span: trailing whitespace in an inline-block is stripped by
              the layout engine, which silently welds every word together. */}
          {i === words.length - 1 ? null : ' '}
        </Fragment>
      ))}
    </span>
  );
}
