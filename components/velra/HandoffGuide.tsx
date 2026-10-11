'use client';

import { Fragment } from 'react';
import { CopyButton } from './CopyButton';
import type { Guide, GuideSnippet } from '@/lib/velra/types';

/** Prose with `inline code`. The text is split, never parsed as markup. */
function Prose({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((piece, i) =>
        i % 2 ? <code key={i}>{piece}</code> : <Fragment key={i}>{piece}</Fragment>,
      )}
    </>
  );
}

/**
 * Something to copy: the prompt for Claude, or the command to run.
 *
 * The text on screen is the text that is copied, character for character. It
 * is the reader's input, so it is drawn as a card to fill in, not as a line a
 * terminal printed.
 */
function Snippet({ snippet }: { snippet: GuideSnippet }) {
  return (
    <figure className="vl-snip" data-kind={snippet.kind}>
      <figcaption>
        <span>{snippet.caption}</span>
        <CopyButton
          text={snippet.text}
          label={snippet.copyLabel}
          copied={snippet.copied}
          className="vl-ctl vl-snip-copy"
        />
      </figcaption>
      <pre>
        <code>{snippet.text}</code>
      </pre>
    </figure>
  );
}

/**
 * The verification guide, shown where a step's output would be.
 *
 * It sits inside the terminal window so the walkthrough keeps one shape from
 * the first step to the last, but nothing in it is drawn as output: there is
 * no prompt line, no command being typed and no printed result. The first
 * thing it says is what it is.
 *
 * Each block rises in turn when the step opens. With reduced motion they are
 * simply there.
 */
export function HandoffGuide({ guide }: { guide: Guide }) {
  const { lead, parts } = guide;
  return (
    <div className="vl-guide">
      <section className="vl-quiet" aria-label={lead.kicker}>
        <p className="vl-guide-kicker">{lead.kicker}</p>
        <p className="vl-quiet-head">
          {/* Each sentence holds together on its own line. The space between
              them is real text, so the line still reads and copies as prose. */}
          {lead.headline.map((sentence) => (
            <Fragment key={sentence}>
              <span>{sentence}</span>{' '}
            </Fragment>
          ))}
        </p>
        <p className="vl-quiet-body">{lead.body}</p>
        <p className="vl-quiet-note">{lead.note}</p>
      </section>

      <ol className="vl-guide-parts">
        {parts.map((part, i) => (
          <li key={part.id} className="vl-guide-part" style={{ '--i': i + 1 } as React.CSSProperties}>
            <span className="vl-guide-id" aria-hidden="true">
              {part.id}
            </span>
            <div className="vl-guide-main">
              <h4>
                <span className="vl-sr">Step {part.id}: </span>
                {part.title}
              </h4>
              {part.body.map((text) => (
                <p key={text}>
                  <Prose text={text} />
                </p>
              ))}

              {part.requirements ? (
                <ul className="vl-req" aria-label="Both must be true">
                  {part.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}

              {part.snippet ? <Snippet snippet={part.snippet} /> : null}

              {part.after?.map((text) => (
                <p key={text}>
                  <Prose text={text} />
                </p>
              ))}

              {part.establishes ? (
                <dl className="vl-proof">
                  {part.establishes.map((row) => (
                    <div key={row.check}>
                      <dt>
                        <Prose text={row.check} />
                      </dt>
                      <dd>{row.shows}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {part.caveat ? <p className="vl-proof-caveat">{part.caveat}</p> : null}
            </div>
          </li>
        ))}
      </ol>

      <p className="vl-guide-end" style={{ '--i': parts.length + 1 } as React.CSSProperties}>
        {guide.disclaimer}
      </p>
    </div>
  );
}
