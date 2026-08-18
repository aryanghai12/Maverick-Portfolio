'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { connect, identity, links } from '@/lib/content';
import { SectionHead } from './SectionHead';
import { Kinetic } from './Kinetic';

/**
 * The section that has to convert, so it is the most alive thing on the page and
 * the only fully lit surface on the site.
 *
 * The console genuinely works. Six commands, each doing something real, and each
 * also available as a clickable chip, because gating contact details behind
 * knowing to type would be a puzzle rather than a portfolio.
 */

type Cmd = {
  name: string;
  hint: string;
  run: () => string;
};

const remotes = [
  { name: 'origin', url: 'github.com/aryanghai12', href: links.github, dir: 'fetch' },
  { name: 'mirror', url: 'gitlab.com/aryanghai1205', href: links.gitlab, dir: 'fetch' },
  { name: 'social', url: 'linkedin.com/in/aryan-ghai', href: links.linkedin, dir: 'push' },
  { name: 'stats', url: 'codolio.com/profile/aryanghai', href: links.codolio, dir: 'fetch' },
];

export function Connect() {
  const [history, setHistory] = useState<{ cmd: string; out: string }[]>([]);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  /* Live local time. Rendered only after mount so the server rendered HTML and
     the first client render agree. A clock in the markup is a hydration
     mismatch waiting to happen. */
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: identity.timezone,
      }).format(new Date());
    setNow(fmt());
    const id = setInterval(() => setNow(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);

  const open = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const copy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1200);
    } catch {
      // Clipboard can be denied by permissions policy; the address is visible
      // on screen and the mailto still works, so this degrades to nothing.
    }
  }, []);

  const commands: Cmd[] = [
    {
      name: 'mail',
      hint: 'copy address & open mail client',
      run: () => {
        copy(identity.email, 'mail');
        open(links.email);
        return `${identity.email} copied. Your mail client should be opening.`;
      },
    },
    { name: 'gh', hint: 'github', run: () => (open(links.github), 'opening github.com/aryanghai12') },
    { name: 'gl', hint: 'gitlab', run: () => (open(links.gitlab), 'opening gitlab.com/aryanghai1205') },
    { name: 'in', hint: 'linkedin', run: () => (open(links.linkedin), 'opening linkedin') },
    { name: 'cp', hint: 'codolio', run: () => (open(links.codolio), 'opening codolio profile') },
    {
      name: 'help',
      hint: 'list commands',
      run: () => commands.map((c) => `${c.name.padEnd(6)}${c.hint}`).join('\n'),
    },
  ];

  const exec = useCallback(
    (raw: string) => {
      const cmd = raw.trim().toLowerCase();
      if (!cmd) return;
      if (cmd === 'clear') {
        setHistory([]);
        return;
      }
      const found = commands.find((c) => c.name === cmd);
      const out = found
        ? found.run()
        : `${cmd}: not found. Try "help" for the six things this understands.`;
      setHistory((h) => [...h.slice(-6), { cmd, out }]);
    },
    // `commands` is rebuilt each render but its behaviour is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [copy, open],
  );

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [history]);

  return (
    <section id="connect" data-cam="connect" className="section pb-28">
      <div className="shell">
        <SectionHead index="04" label="contact" />

        <div className="grid [&>*]:min-w-0 gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="t-h2 max-w-[14ch] text-[var(--bone)]" data-rv>
              <Kinetic text={connect.heading} />
            </h2>

            <p className="t-statement mt-8" data-rv>
              {connect.lede}
            </p>

            <p className="t-body mt-6" data-rv>
              {connect.body}
            </p>

            {/* The address, in plain selectable text, in the markup.
                
                It used to exist only inside a JavaScript array, reachable by
                operating a terminal widget. That put a puzzle in front of the
                single conversion event on the site, and it meant the address
                was absent entirely with JavaScript disabled, on a page whose
                README claims it works without it. */}
            <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-3" data-rv>
              <a
                href={links.email}
                className="ul-draw u-mono text-[clamp(1rem,0.9rem+0.7vw,1.4rem)] tracking-[-0.02em] text-[var(--bone)] transition-colors hover:text-white"
              >
                {identity.email}
              </a>
              <button
                type="button"
                onClick={() => copy(identity.email, 'email')}
                className="u-mono shrink-0 rounded-full border border-[var(--edge)] px-3 py-1.5 text-[0.66rem] text-[var(--bone-dim)] transition-colors duration-300 hover:border-[var(--bone)] hover:text-[var(--bone)]"
              >
                {copied === 'email' ? 'copied' : 'copy'}
              </button>
            </div>

            {/* Status */}
            <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2" data-rv>
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="led h-[7px] w-[7px] rounded-full bg-[var(--accent)]" />
                <span className="t-label !text-[0.6rem] !text-[var(--accent)]">available</span>
              </span>
              <span aria-hidden className="h-3 w-px bg-[var(--edge)]" />
              <span className="t-label !text-[0.6rem]">{identity.location}</span>
              <span aria-hidden className="h-3 w-px bg-[var(--edge)]" />
              <span className="t-label !text-[0.6rem]">
                {now ? `${now} ${identity.tzLabel}` : identity.tzLabel}
              </span>
            </div>

            {/* Remotes */}
            <div className="code-surface mt-10 px-4 py-4 sm:px-5" data-rv>
              <div className="t-label mb-3 !text-[0.54rem]">git remote -v</div>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {remotes.map((r) => (
                  <li key={r.name} className="flex items-center gap-3 text-[0.72rem]">
                    <span className="w-14 shrink-0 text-[var(--accent)]">{r.name}</span>
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="min-w-0 flex-1 truncate text-[var(--bone-dim)] transition-colors hover:text-[var(--bone)]"
                    >
                      {r.url}
                    </a>
                    <span className="hidden shrink-0 text-[var(--mute)] sm:inline">({r.dir})</span>
                    <button
                      type="button"
                      onClick={() => copy(`https://${r.url}`, r.name)}
                      className="shrink-0 px-1 text-[var(--mute)] transition-colors hover:text-[var(--accent)]"
                      aria-label={`Copy ${r.name} URL`}
                    >
                      {copied === r.name ? '✓' : '⧉'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Working console */}
          <div data-rv="scale">
            <div className="glass overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[var(--hair-soft)] px-4 py-3 sm:px-5">
                <span aria-hidden className="led h-[6px] w-[6px] rounded-full bg-[var(--accent)]" />
                <span className="t-label !text-[0.6rem]">contact · interactive</span>
                <span className="t-label ml-auto !text-[0.58rem]">type or click</span>
              </div>

              <div className="px-4 py-5 sm:px-5">
                {/* Chips: everything the console can do, one click away. */}
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {commands.map((c) => (
                    <li key={c.name}>
                      <button
                        type="button"
                        onClick={() => exec(c.name)}
                        className="u-mono rounded border border-[var(--edge)] bg-[var(--panel-0)] px-2.5 py-1.5 text-[0.7rem] text-[var(--bone-dim)] transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>

                <div
                  ref={logRef}
                  className="scroll-wall mt-4 max-h-[220px] min-h-[132px] overflow-y-auto font-[family-name:var(--font-mono)] text-[0.72rem] leading-[1.75]"
                  data-lenis-prevent
                  role="log"
                  aria-live="polite"
                  aria-label="Console output"
                >
                  {history.length === 0 ? (
                    <p className="m-0 text-[var(--mute)]">
                      Six commands. Try <span className="text-[var(--accent)]">help</span>, or
                      just press a chip.
                    </p>
                  ) : (
                    history.map((h, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <div>
                          <span className="text-[var(--accent)]">aryan@index</span>
                          <span className="text-[var(--mute)]"> ~ % </span>
                          <span className="text-[var(--bone)]">{h.cmd}</span>
                        </div>
                        <pre className="m-0 font-[inherit] whitespace-pre-wrap text-[var(--bone-dim)]">
                          {h.out}
                        </pre>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    exec(input);
                    setInput('');
                  }}
                  className="mt-3 flex items-center gap-2 border-t border-[var(--hair-soft)] pt-3"
                >
                  <span aria-hidden className="u-mono text-[0.72rem] text-[var(--accent)]">
                    ~ %
                  </span>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                    aria-label="Console input. Type help for the list of commands."
                    placeholder="help"
                    className="u-mono min-w-0 flex-1 bg-transparent text-[0.72rem] text-[var(--bone)] outline-none placeholder:text-[var(--mute)]"
                  />
                </form>
              </div>
            </div>

            {/* Competitive profiles: linked, never rendered as figures. A rating
                shown as a hero number next to the merged Kubescape work would
                be the weakest thing on the page. */}
            <ul className="mt-5 flex list-none flex-wrap gap-x-5 gap-y-2 p-0" data-rv>
              {[
                ['LeetCode', links.leetcode],
                ['CodeChef', links.codechef],
                ['Codeforces', links.codeforces],
              ].map(([label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="t-label ul-draw !text-[0.6rem] transition-colors hover:!text-[var(--accent)]"
                  >
                    {label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="mt-24 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--hair-soft)] pt-8">
          <span className="t-label !text-[0.58rem]">aryan ghai · {new Date().getFullYear()}</span>
          <span className="t-label !text-[0.58rem]">
            built with next.js, three.js and no stock assets
          </span>
          <a
            href="#hero"
            className="t-label ul-draw ml-auto !text-[0.58rem] transition-colors hover:!text-[var(--accent)]"
          >
            back to top ↑
          </a>
        </footer>
      </div>
    </section>
  );
}
