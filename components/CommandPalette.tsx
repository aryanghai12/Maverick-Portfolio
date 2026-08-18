'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { links, projects } from '@/lib/content';
import { scrollToId } from '@/lib/scroll';

/**
 * A real keyboard interface, which on a site about developer tooling is
 * load-bearing rather than decorative.
 *
 * Opens on Cmd/Ctrl+K, filters sections, projects and links, arrows navigate,
 * Enter executes, Escape closes. Focus is trapped while open and returned to
 * whatever had it before, because a palette that strands keyboard focus is
 * worse than no palette. There is also a visible trigger, because a feature
 * only reachable by a shortcut nobody told you about is a feature for nobody.
 */

type Item = {
  id: string;
  label: string;
  hint: string;
  group: 'go' | 'work' | 'open';
  run: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  /* Jumps go through the shared scroll helper rather than scrollIntoView.
     Smooth scrolling drives window.scrollTo on every frame, so a native smooth
     jump fires at the same time and the two fight over the same pixels. */
  const go = useCallback((id: string) => scrollToId(id), []);

  const openUrl = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const items: Item[] = useMemo(
    () => [
      { id: 'hero', label: 'Top', hint: 'section 00', group: 'go', run: () => go('hero') },
      { id: 'upstream', label: 'Proof', hint: 'section 01', group: 'go', run: () => go('upstream') },
      { id: 'work', label: 'Work', hint: 'section 02', group: 'go', run: () => go('work') },
      { id: 'about', label: 'Who', hint: 'section 03', group: 'go', run: () => go('about') },
      { id: 'connect', label: 'Contact', hint: 'section 04', group: 'go', run: () => go('connect') },
      ...projects.map((p) => ({
        id: `p-${p.id}`,
        label: p.name,
        hint: p.tagline,
        group: 'work' as const,
        run: () => go('work'),
      })),
      { id: 'l-gh', label: 'GitHub', hint: 'aryanghai12', group: 'open', run: () => openUrl(links.github) },
      { id: 'l-gl', label: 'GitLab', hint: 'aryanghai1205', group: 'open', run: () => openUrl(links.gitlab) },
      { id: 'l-in', label: 'LinkedIn', hint: 'aryan-ghai', group: 'open', run: () => openUrl(links.linkedin) },
      { id: 'l-cp', label: 'Codolio', hint: 'profile', group: 'open', run: () => openUrl(links.codolio) },
      { id: 'l-mail', label: 'Email', hint: 'aryanghai1205@gmail.com', group: 'open', run: () => openUrl(links.email) },
    ],
    [go, openUrl],
  );

  /* Subsequence matching, so "sw" finds "Selected work" the way a fuzzy finder
     in an editor would. Anything cleverer needs a scoring model nobody asked
     for on a list of fourteen items. */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = `${it.label} ${it.hint}`.toLowerCase();
      let i = 0;
      for (const ch of q) {
        i = hay.indexOf(ch, i);
        if (i === -1) return false;
        i++;
      }
      return true;
    });
  }, [items, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
    restoreTo.current?.focus?.();
  }, []);

  const show = useCallback(() => {
    restoreTo.current = document.activeElement as HTMLElement;
    setOpen(true);
  }, []);

  /* The trigger retires once Connect is on screen.
   *
   * A fixed corner button collides with whatever happens to be under it, and
   * down there that is the footer. It is also redundant by then: Connect has a
   * working console of its own doing the same job, two hundred pixels away. The
   * Cmd+K shortcut keeps working the whole time. Only the affordance leaves. */
  const [triggerHidden, setTriggerHidden] = useState(false);
  useEffect(() => {
    const el = document.getElementById('connect');
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setTriggerHidden(e.isIntersecting),
      { rootMargin: '0px 0px -55% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Global shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open ? close() : show();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, show]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(filtered.length, 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + filtered.length) % Math.max(filtered.length, 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const it = filtered[active];
      if (it) {
        close();
        it.run();
      }
    }
    // Focus trap: there is one focusable element in the dialog, so Tab has
    // nowhere legitimate to go.
    if (e.key === 'Tab') e.preventDefault();
  };

  const groupLabel: Record<Item['group'], string> = {
    go: 'go to',
    work: 'work',
    open: 'open',
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        /* Bottom left, not bottom centre: centred it sat on top of the footer
           and the closing paragraph of whichever section was in view. */
        className="palette-trigger u-mono fixed bottom-5 left-5 z-50 hidden items-center gap-2 sm:flex rounded-full border border-[var(--edge)] bg-[var(--panel-0)]/85 px-3.5 py-2 text-[0.66rem] text-[var(--bone-dim)] backdrop-blur-md transition-colors duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)]"
        aria-haspopup="dialog"
        tabIndex={triggerHidden ? -1 : 0}
        aria-hidden={triggerHidden}
        style={{
          opacity: triggerHidden ? 0 : 1,
          transform: triggerHidden ? 'translateY(10px)' : 'none',
          pointerEvents: triggerHidden ? 'none' : 'auto',
          transition: 'opacity .35s var(--ease), transform .35s var(--ease-out)',
        }}
      >
        <span aria-hidden>⌘</span>
        <span>K</span>
        <span aria-hidden className="h-3 w-px bg-[var(--edge)]" />
        <span>navigate</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <button
            type="button"
            aria-label="Close command palette"
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-[rgba(3,5,7,0.72)] backdrop-blur-[3px]"
            tabIndex={-1}
          />

          <div
            className="glass relative w-full max-w-[560px] overflow-hidden"
            style={{ animation: 'palette-in 220ms var(--ease-out) both' }}
          >
            <div className="flex items-center gap-3 border-b border-[var(--hair-soft)] px-4 py-3">
              <span aria-hidden className="u-mono text-[0.8rem] text-[var(--accent)]">
                ›
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Jump to a section, project or link"
                spellCheck={false}
                autoComplete="off"
                aria-label="Filter commands"
                aria-activedescendant={filtered[active] ? `cmd-${filtered[active].id}` : undefined}
                className="u-mono w-full bg-transparent text-[0.82rem] text-[var(--bone)] outline-none placeholder:text-[var(--mute)]"
              />
              <kbd className="u-mono shrink-0 rounded border border-[var(--edge)] px-1.5 py-0.5 text-[0.6rem] text-[var(--mute)]">
                esc
              </kbd>
            </div>

            <ul
              ref={listRef}
              className="scroll-wall m-0 max-h-[46vh] list-none overflow-y-auto p-1.5"
              data-lenis-prevent
            >
              {filtered.length === 0 ? (
                <li className="u-mono px-3 py-6 text-center text-[0.75rem] text-[var(--mute)]">
                  Nothing matches “{query}”
                </li>
              ) : (
                filtered.map((it, i) => {
                  const prev = filtered[i - 1];
                  const newGroup = !prev || prev.group !== it.group;
                  return (
                    <li key={it.id} id={`cmd-${it.id}`}>
                      {newGroup ? (
                        <div className="t-label px-3 pt-3 pb-1.5 !text-[0.54rem]">
                          {groupLabel[it.group]}
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => {
                          close();
                          it.run();
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors duration-150"
                        style={{
                          background: i === active ? 'rgba(255,255,255,0.09)' : 'transparent',
                        }}
                      >
                        <span
                          aria-hidden
                          className="w-2 shrink-0 text-[0.6rem]"
                          style={{ color: i === active ? 'var(--accent)' : 'transparent' }}
                        >
                          ◈
                        </span>
                        <span
                          className="u-mono shrink-0 text-[0.8rem]"
                          style={{ color: i === active ? 'var(--accent)' : 'var(--bone)' }}
                        >
                          {it.label}
                        </span>
                        <span className="truncate text-[0.72rem] text-[var(--mute)]">{it.hint}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="flex items-center gap-4 border-t border-[var(--hair-soft)] px-4 py-2.5">
              {[
                ['↑↓', 'navigate'],
                ['↵', 'select'],
                ['esc', 'close'],
              ].map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5">
                  <kbd className="u-mono rounded border border-[var(--edge)] px-1.5 py-0.5 text-[0.58rem] text-[var(--mute)]">
                    {k}
                  </kbd>
                  <span className="t-label !text-[0.54rem]">{v}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
