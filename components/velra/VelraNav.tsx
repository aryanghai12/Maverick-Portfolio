'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconClose, IconExternal, IconMenu, IconPlay, LogoMark } from './icons';
import { PLAY_EVENT } from './Replay';
import { nav } from '@/lib/velra/content';
import { VELRA_REPO } from '@/lib/velra/documented';

/** The width at which the stylesheet swaps the link row for the menu button. */
const MENU_BREAKPOINT = 960;

/**
 * Moves to a target on this page, without animation for anyone who asked for
 * none.
 *
 * Where the target comes to rest is decided in the stylesheet, by its
 * scroll-margin-top: sections land their heading just under the bar, the
 * replay stage lands its terminal there. Keeping that in CSS means a plain
 * link, a typed-in #hash and these buttons all agree to the pixel.
 */
function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
}

/**
 * The header for /velra.
 *
 * A floating glass bar, like the portfolio's. It carries a way back to the
 * site it belongs to, the section links with the one on screen marked, and the
 * action that starts the replay. The portfolio's own navigation is not mounted
 * on this route, so nothing here competes with it.
 *
 * Every link is a real anchor with a real href. Script only smooths the scroll.
 */
export function VelraNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const read = () => setScrolled(window.scrollY > 8);
    read();
    window.addEventListener('scroll', read, { passive: true });
    return () => window.removeEventListener('scroll', read);
  }, []);

  /* Which section is on screen. A section counts once it crosses a band a
     third of the way down the viewport, which is where the eye is after a
     jump. Above the first section nothing is marked, because the hero is not
     one of the destinations. Its own observer rather than scroll maths, so it
     stays right when sections change height. */
  useEffect(() => {
    const sections = nav
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null);
    if (!sections.length) return;

    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Document order decides ties, so the later section wins as it arrives.
        const current = sections.filter((s) => visible.has(s.id)).at(-1);
        setActive(current ? current.id : null);
      },
      { rootMargin: '-30% 0px -65% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    // A menu left open across a resize to desktop would be invisible and still "open".
    const onResize = () => {
      if (window.innerWidth > MENU_BREAKPOINT) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const go = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setOpen(false);
    scrollToId(href.slice(1));
    history.replaceState(null, '', href);
  }, []);

  /* The replay does its own scrolling for this one, because it has to switch
     to the walkthrough first and the terminal only has its final position
     after that. */
  const run = useCallback(() => {
    setOpen(false);
    window.dispatchEvent(new Event(PLAY_EVENT));
  }, []);

  const links = (
    <>
      {nav.map((item) => (
        <a
          key={item.href}
          href={item.href}
          aria-current={active === item.href.slice(1) ? 'true' : undefined}
          onClick={(e) => go(e, item.href)}
        >
          {item.label}
        </a>
      ))}
      <a href={VELRA_REPO} target="_blank" rel="noreferrer noopener">
        GitHub
        <span className="vl-sr"> (opens in a new tab)</span>
        <IconExternal />
      </a>
    </>
  );

  return (
    <header className="vl-nav" data-scrolled={scrolled ? '1' : undefined} data-open={open ? '1' : undefined}>
      <div className="vl-wrap">
        <div className="vl-nav-row">
          <div className="vl-brand">
            <a className="vl-logo" href="#top" onClick={(e) => go(e, '#top')} aria-label="Velra, back to top">
              <LogoMark />
              velra
            </a>
            <span className="vl-brand-by">
              by <Link href="/">Aryan Ghai</Link>
            </span>
          </div>

          <nav className="vl-nav-links" aria-label="Velra sections">
            {links}
          </nav>

          <button type="button" className="vl-btn vl-btn-ghost vl-btn-sm vl-nav-cta" onClick={run}>
            Run the walkthrough
            <IconPlay />
          </button>

          <button
            ref={toggleRef}
            type="button"
            className="vl-nav-toggle"
            aria-expanded={open}
            aria-controls="vl-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>

        <nav id="vl-menu" className="vl-menu" data-open={open ? '1' : undefined} aria-label="Velra sections, menu">
          {links}
          <Link href="/">Aryan Ghai&apos;s portfolio</Link>
          <button type="button" className="vl-btn vl-btn-primary" onClick={run}>
            Run the walkthrough
            <IconPlay />
          </button>
        </nav>
      </div>
    </header>
  );
}
