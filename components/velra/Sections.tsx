/**
 * The static sections of /velra.
 *
 * All of these render on the server and ship no script of their own. The two
 * things on the page that need a browser, the navigation and the replay, are
 * client components mounted from app/velra/page.tsx.
 *
 * Copy comes from lib/velra/content.ts and transcript text from lib/velra, so
 * nothing in this file states a fact about the product.
 */

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { CopyButton } from './CopyButton';
import { IconArrowDown, IconExternal, IconInfo, LogoMark } from './icons';
import { Replay } from './Replay';
import { RichText, TerminalLine } from './TerminalLine';
import {
  INSTALL_COMMAND,
  cta,
  footer,
  hero,
  how,
  properties,
  replay,
  trust,
  why,
} from '@/lib/velra/content';
import { DOCS, VELRA_REPO } from '@/lib/velra/documented';
import { CAPSULE_LIMITS, STAGING_STEP, stagedSummary } from '@/lib/velra/transcripts';
import { FIELD_TAG_LABEL, PROVENANCE_LABEL } from '@/lib/velra/types';

const reveal = (d = 0) => ({ 'data-vl-reveal': '', style: { '--d': d } as CSSProperties });

function External({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer noopener">
      {children}
      <span className="vl-sr"> (opens in a new tab)</span>
      <IconExternal />
    </a>
  );
}

/* Section heads follow the portfolio's: a hex index, a label, the heading, and
   a hairline that fades out to the right. */
function Head({
  id,
  hex,
  eyebrow,
  title,
  dim,
  lede,
}: {
  id: string;
  hex: string;
  eyebrow: string;
  title: string;
  dim: string;
  lede: string;
}) {
  return (
    <header className="vl-head" {...reveal()}>
      <p className="vl-eyebrow">
        <b aria-hidden="true">{hex}</b>
        {eyebrow}
      </p>
      <h2 id={id}>
        {title} <span>{dim}</span>
      </h2>
      <p className="vl-lede">{lede}</p>
      <div className="vl-rule" aria-hidden="true" />
    </header>
  );
}

/* --------------------------------------------------------------------- hero */

/* The hero shows the moment the product exists for: a real capsule being
   staged. It is the same captured step the walkthrough plays, and the figures
   on the card beside it are read out of that step's own output, so the first
   thing on the page and the replay below it cannot disagree. */
const stage = STAGING_STEP;
const staged = stagedSummary(stage);

export function Hero() {
  let row = 0;
  const next = () => ({ '--i': row++ }) as CSSProperties;

  return (
    <section id="hero" data-stage="sphere" className="vl-hero" aria-labelledby="vl-hero-title">
      <div className="vl-wrap">
        <div className="vl-hero-copy">
          {/* A feathered bloom and a masked blur, so the words sit on a calm
              ground and the field stays sharp around them. */}
          <span aria-hidden="true" className="vl-veil" />
          <p className="vl-chip">
            <i aria-hidden="true" />
            {hero.eyebrow}
          </p>
          <h1 id="vl-hero-title">
            {hero.headline[0]} <em>{hero.headline[1]}</em> {hero.headline[2]}
          </h1>
          <p className="vl-hero-sub">{hero.sub}</p>

          <div className="vl-hero-actions">
            <a className="vl-btn vl-btn-primary" href="#replay">
              {hero.primary}
              <IconArrowDown />
            </a>
            <External className="vl-btn vl-btn-ghost" href={VELRA_REPO}>
              {hero.secondary}
            </External>
          </div>

          <ol className="vl-hero-steps" aria-label="What Velra does, in order">
            {hero.steps.map((name, i) => (
              <li key={name}>
                <b aria-hidden="true">{String(i + 1).padStart(2, '0')}</b>
                {name}
              </li>
            ))}
          </ol>
          <p className="vl-hero-fine">{hero.fine}</p>
        </div>

        <figure className="vl-hero-visual">
          <div className="vl-card-term vl-hterm">
            <div className="vl-term-bar">
              <span className="vl-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="vl-term-title">
                <RichText text={stage.workspace} />
              </span>
              <span className="vl-tagchip">Captured output</span>
            </div>
            <div className="vl-hterm-body">
              <div className="vl-cmdline" style={next()}>
                <span className="vl-prompt">
                  <RichText text={stage.prompt} />{' '}
                </span>
                <span className="vl-cmd">
                  <RichText text={stage.command ?? ''} />
                </span>
              </div>
              {stage.output.map((item, i) => (
                <TerminalLine key={i} item={item} style={next()} />
              ))}
            </div>
          </div>

          {/* The capsule card hangs off the terminal's lower edge, over padding
              only, so it never covers a line of quoted output. */}
          <div className="vl-hero-under">
            <figcaption>
              {PROVENANCE_LABEL[stage.provenance]}, from a real working session. Nothing is run on this
              page.
            </figcaption>
            <div className="vl-hcap" role="group" aria-label="The capsule staged in the captured run">
              <p className="vl-kicker">Velra capsule</p>
              <p className="vl-hcap-num">
                <b>{staged.tokens}</b>
                <span>estimated tokens</span>
              </p>
              <div className="vl-meter" aria-hidden="true">
                <i style={{ width: `${(staged.tokens / CAPSULE_LIMITS.ceiling) * 100}%` }} />
                <u style={{ left: `${(CAPSULE_LIMITS.target / CAPSULE_LIMITS.ceiling) * 100}%` }} />
              </div>
              <p className="vl-meter-key">
                <span>{CAPSULE_LIMITS.target} default target</span>
                <span>{CAPSULE_LIMITS.ceiling.toLocaleString('en-US')} ceiling</span>
              </p>
              <ul className="vl-chips" aria-label="What was staged">
                {staged.parts.map((part) => (
                  <li key={part}>{part}</li>
                ))}
              </ul>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}

export function Properties() {
  return (
    <div className="vl-wrap">
      <ul className="vl-props" aria-label="Four properties of Velra">
        {properties.map((p, i) => (
          <li key={p.title}>
            <b aria-hidden="true">{String(i + 1).padStart(2, '0')}</b>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------- replay */

export function ReplaySection() {
  return (
    <section id="replay" data-stage="column" className="vl-section" aria-labelledby="vl-replay-title">
      <div className="vl-wrap">
        <Head
          id="vl-replay-title"
          hex="0x01"
          eyebrow={replay.eyebrow}
          title={replay.title}
          dim={replay.titleDim}
          lede={replay.lede}
        />
        <Replay />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- why */

export function Why() {
  return (
    <section id="why" data-stage="helix" className="vl-section" aria-labelledby="vl-why-title">
      <div className="vl-wrap">
        <Head id="vl-why-title" hex="0x02" eyebrow={why.eyebrow} title={why.title} dim={why.titleDim} lede={why.lede} />

        <div className="vl-compare">
          <div className="vl-card" {...reveal()}>
            <h3>{why.before.label}</h3>
            <ul>
              {why.before.items.map((item) => (
                <li key={item}>
                  <i aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="vl-card vl-with" {...reveal(1)}>
            <h3>{why.after.label}</h3>
            <ul>
              {why.after.items.map((item) => (
                <li key={item.section}>
                  <i aria-hidden="true" />
                  <span>
                    {item.text}
                    <code>{item.section}</code>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="vl-footnote">
          {why.exampleNote}{' '}
          <a className="vl-link" href="#replay">
            Open it in the replay
          </a>
          .
        </p>
        <p className="vl-callout" {...reveal()}>
          <IconInfo />
          <span>{why.caution}</span>
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- how */

export function How() {
  return (
    <section id="how" data-stage="terrain" className="vl-section" aria-labelledby="vl-how-title">
      <div className="vl-wrap">
        <Head id="vl-how-title" hex="0x03" eyebrow={how.eyebrow} title={how.title} dim={how.titleDim} lede={how.lede} />

        <ol className="vl-pipe">
          {how.steps.map((step, i) => (
            <li key={step.name} {...reveal(i)}>
              <span className="vl-pipe-n" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3>{step.name}</h3>
              <p>{step.body}</p>
              <code>{step.flow}</code>
            </li>
          ))}
        </ol>

        <div className="vl-duo">
          <div className="vl-card" {...reveal()}>
            <h3>{how.labels.title}</h3>
            <p>{how.labels.body}</p>
            <dl className="vl-defs">
              <div>
                <dt>
                  <span className="vl-tag" data-tag="observed">
                    {FIELD_TAG_LABEL.observed}
                  </span>
                </dt>
                <dd>{how.labels.observed}</dd>
              </div>
              <div>
                <dt>
                  <span className="vl-tag" data-tag="inferred">
                    {FIELD_TAG_LABEL.inferred}
                  </span>
                </dt>
                <dd>{how.labels.inferred}</dd>
              </div>
            </dl>
          </div>

          <div className="vl-card" {...reveal(1)}>
            <h3>{how.omits.title}</h3>
            <div className="vl-omit">
              {how.omits.items.map((item) => (
                <div key={item.name}>
                  <h4>{item.name}</h4>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
            <p className="vl-footnote">{how.omits.resume}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- trust */

export function Trust() {
  return (
    <section id="trust" data-stage="vortex" className="vl-section" aria-labelledby="vl-trust-title">
      <div className="vl-wrap">
        <Head
          id="vl-trust-title"
          hex="0x04"
          eyebrow={trust.eyebrow}
          title={trust.title}
          dim={trust.titleDim}
          lede={trust.lede}
        />

        <ul className="vl-trust" {...reveal()}>
          {trust.items.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <p className="vl-limit">
                <b>Limit</b>
                {item.limit}
              </p>
            </li>
          ))}
        </ul>

        <div className="vl-notes">
          <div className="vl-card" {...reveal()}>
            <h3>{trust.travel.title}</h3>
            <p>{trust.travel.body}</p>
          </div>
          <div className="vl-card" {...reveal(1)}>
            <h3>{trust.evidence.title}</h3>
            <p>{trust.evidence.body}</p>
            <p className="vl-limit">
              <b>Limit</b>
              {trust.evidence.limit}
            </p>
          </div>
        </div>

        <div className="vl-doclinks">
          <span>Read the source documents:</span>
          {trust.links.map((link) => (
            <External key={link.label} className="vl-doclink" href={link.href}>
              {link.label}
            </External>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- cta */

export function Cta() {
  return (
    <section data-stage="nebula" className="vl-section" aria-labelledby="vl-cta-title">
      <div className="vl-wrap">
        <div className="vl-cta" {...reveal()}>
          <div>
            <p className="vl-eyebrow">
              <b aria-hidden="true">0x05</b>
              {cta.eyebrow}
            </p>
            <h2 id="vl-cta-title">
              {cta.title.map((line) => (
                <span key={line}>{line} </span>
              ))}
            </h2>
            <p className="vl-cta-body">{cta.body}</p>
            <div className="vl-cta-actions">
              <External className="vl-btn vl-btn-primary" href={VELRA_REPO}>
                {cta.primary}
              </External>
              <CopyButton text={INSTALL_COMMAND} label={cta.copy} />
            </div>
          </div>

          <div>
            <div className="vl-install">
              <p className="vl-kicker">Install</p>
              <pre>
                <i>$ </i>
                {INSTALL_COMMAND}
                {'\n'}
                <i>$ </i>velra enable <span># once per machine</span>
                {'\n'}
                <i>$ </i>velra doctor
              </pre>
            </div>
            <p className="vl-cta-links">
              {cta.links.map((link) => (
                <External key={link.label} className="vl-link" href={link.href}>
                  {link.label}
                </External>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer data-stage="orbit" className="vl-footer">
      <div className="vl-wrap vl-footer-row">
        <a className="vl-logo" href="#top" aria-label="Velra, back to top">
          <LogoMark />
          velra
        </a>
        <span>{footer.tagline}</span>
        <span>
          Built by{' '}
          <Link className="vl-link" href="/">
            Aryan Ghai
          </Link>
        </span>
        <span className="vl-footer-links">
          <External href={footer.repo}>GitHub</External>
          <External href={DOCS.readme}>README</External>
          <External href={footer.licence}>MIT licence</External>
        </span>
      </div>
    </footer>
  );
}
