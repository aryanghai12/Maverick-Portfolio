/**
 * Draws one row of terminal output.
 *
 * Transcript text is always treated as text. It is split into spans by a few
 * regular expressions and handed to React as strings, so nothing in a capture
 * can ever be interpreted as markup. Colour is presentation only: the
 * characters in the DOM are exactly the characters in the data, which is what
 * makes selecting and copying from the terminal trustworthy.
 *
 * No 'use client' here on purpose. The hero renders these on the server.
 */

import type { ReactNode } from 'react';
import { PLACEHOLDER, PLACEHOLDER_KIND, REDACTION_INFO } from '@/lib/velra/transcripts';
import type { OutputItem } from '@/lib/velra/types';

export type Tone = 'blank' | 'plain' | 'ok' | 'warn' | 'err' | 'accent' | 'tag' | 'section';

/** How a line reads at a glance: a success, a warning, an error, or just output. */
export function toneOf(text: string): Tone {
  if (text.trim() === '') return 'blank';
  if (/^\s*✓/.test(text)) return 'ok';
  if (/^\s*!/.test(text)) return 'warn';
  if (/^\s*✗/.test(text) || /^error:/.test(text) || /command not found/.test(text)) return 'err';
  if (/^\s*⚡/.test(text)) return 'accent';
  if (/^<\/?[A-Z_]+[\s>]/.test(text)) return 'tag';
  if (/^\[[A-Z_]+\]/.test(text)) return 'section';
  return 'plain';
}

type Seg = { text: string; cls?: string; title?: string };

/** Splits every still-unstyled segment on `pattern`, styling what matches. */
function mark(segs: Seg[], pattern: RegExp, style: (m: RegExpExecArray) => Seg[]): Seg[] {
  const out: Seg[] = [];
  for (const seg of segs) {
    if (seg.cls) {
      out.push(seg);
      continue;
    }
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(seg.text))) {
      if (m[0] === '') {
        re.lastIndex++;
        continue;
      }
      if (m.index > last) out.push({ text: seg.text.slice(last, m.index) });
      out.push(...style(m));
      last = m.index + m[0].length;
    }
    if (last < seg.text.length) out.push({ text: seg.text.slice(last) });
  }
  return out;
}

function segment(text: string, tone: Tone, json: boolean): Seg[] {
  // Redactions first, so no later rule can split or recolour a placeholder.
  let segs = mark([{ text }], PLACEHOLDER, (m) => {
    const info = REDACTION_INFO[PLACEHOLDER_KIND[m[0]]];
    return [{ text: m[0], cls: 'vl-redact', title: `${info.label}, redacted. ${info.reason}` }];
  });

  if (json) {
    segs = mark(segs, /("(?:[^"\\]|\\.)*")(\s*:)/, (m) => [
      { text: m[1], cls: 'vl-t-key' },
      { text: m[2], cls: 'vl-t-dim' },
    ]);
    segs = mark(segs, /"(?:[^"\\]|\\.)*"/, (m) => [{ text: m[0], cls: 'vl-t-str' }]);
    segs = mark(segs, /\b(?:true|false|null)\b/, (m) => [{ text: m[0], cls: 'vl-t-kw' }]);
    segs = mark(segs, /-?\b\d+(?:\.\d+)?\b/, (m) => [{ text: m[0], cls: 'vl-t-num' }]);
    return segs;
  }

  if (tone === 'section') {
    segs = mark(segs, /^\[[A-Z_]+\]/, (m) => [{ text: m[0], cls: 'vl-t-sec' }]);
    segs = mark(segs, /\bOBSERVED\b/, (m) => [{ text: m[0], cls: 'vl-t-obs' }]);
    segs = mark(segs, /\bINFERRED\b/, (m) => [{ text: m[0], cls: 'vl-t-inf' }]);
    return segs.map((s) => (s.cls ? s : { ...s, cls: 'vl-t-dim' }));
  }

  if (tone === 'ok') segs = mark(segs, /^\s*✓/, (m) => [{ text: m[0], cls: 'vl-t-ok' }]);
  if (tone === 'warn') segs = mark(segs, /^\s*!/, (m) => [{ text: m[0], cls: 'vl-t-warn' }]);
  if (tone === 'accent') segs = mark(segs, /^\s*⚡/, (m) => [{ text: m[0], cls: 'vl-t-sec' }]);

  segs = mark(segs, /`[^`]+`/, (m) => [{ text: m[0], cls: 'vl-t-code' }]);
  segs = mark(segs, /\bFAIL\b/, (m) => [{ text: m[0], cls: 'vl-t-err' }]);
  segs = mark(segs, /\bPASS\b/, (m) => [{ text: m[0], cls: 'vl-t-ok' }]);
  return segs;
}

/** Text with redaction placeholders drawn as visible chips. */
export function RichText({ text, tone = 'plain', json = false }: { text: string; tone?: Tone; json?: boolean }) {
  return (
    <>
      {segment(text, tone, json).map((s, i) =>
        s.cls ? (
          <span key={i} className={s.cls} title={s.title}>
            {s.text}
          </span>
        ) : (
          s.text
        ),
      )}
    </>
  );
}

/** True when a block of output is a JSON document, which decides its colouring. */
export function isJson(output: OutputItem[]): boolean {
  const first = output.find((o) => o.kind === 'line');
  return first !== undefined && /^[{[]\s*$/.test(first.text);
}

interface LineProps {
  item: OutputItem;
  json?: boolean;
  style?: React.CSSProperties;
}

export function TerminalLine({ item, json = false, style }: LineProps): ReactNode {
  if (item.kind === 'gap') {
    return (
      <div className="vl-gap" role="note" style={style}>
        <b>Not in the source</b>
        {item.text}
      </div>
    );
  }
  const tone = toneOf(item.text);
  return (
    <div className="vl-line" data-tone={tone} style={style}>
      {tone === 'blank' ? null : <RichText text={item.text} tone={tone} json={json} />}
    </div>
  );
}
