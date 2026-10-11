/**
 * Turns the local transcript source pack into the public-safe data the /velra
 * replay reads.
 *
 * The source pack is a Markdown file of terminal captures. It holds session
 * ids, a local account name, private workspace paths, private session titles
 * and private prompt text, so it is gitignored and never bundled. This module
 * is the only thing that reads it, and what it writes is the only form that
 * reaches a browser.
 *
 * Three rules it does not bend:
 *
 *   Nothing is invented. A line is either copied or has a sensitive value
 *   replaced by a visible placeholder (see REDACTION_TOKEN). Lines are never
 *   added, dropped, reordered or summarised. Blank lines inside an output
 *   block are kept as supplied; only the blank lines that separate a command
 *   from its output are trimmed.
 *
 *   No private string lives in this file. Every rule is a pattern, or is
 *   derived at run time from the pack itself, so the sanitizer can be
 *   committed without leaking what it removes.
 *
 *   A private value is redacted in every spelling it takes. A session id is
 *   printed in full, as its first eight characters, and as "abcd…wxyz". A
 *   workspace path appears with either kind of slash. The pack is read once to
 *   learn those values, and every line is then scrubbed of all of their forms,
 *   wherever they turn up.
 *
 * Pure on purpose: no file access here, so the tests can run it directly.
 */

export const SOURCE_FILE = 'VELRA-ALL-PROVIDED-TERMINAL-OUTPUTS.md';

export type RedactionKind =
  | 'USER_HOME_REDACTED'
  | 'LOCAL_PATH_REDACTED'
  | 'SESSION_ID_REDACTED'
  | 'SESSION_TITLE_REDACTED'
  | 'WORKSPACE_ID_REDACTED'
  | 'PROMPT_TEXT_REDACTED'
  | 'FILE_PATH_REDACTED';

export interface CapturedEntry {
  /** Stable id: the transcript letter, plus an index when it holds several runs. */
  id: string;
  /** The transcript letter in the source pack. */
  section: string;
  /** The prompt as supplied, sanitized. Null when the source shows no prompt line. */
  prompt: string | null;
  command: string;
  /** Output lines in order. Empty when the command printed nothing or nothing was supplied. */
  output: string[];
  /** How many times each placeholder was substituted in this entry. */
  redactions: Partial<Record<RedactionKind, number>>;
}

export interface CapturedFile {
  source: string;
  note: string;
  entries: CapturedEntry[];
}

/* --------------------------------------------------------------- manifest

   How each transcript in the pack is laid out, and what in it is private.

   privateWorkspace  the workspace path is private, wherever it is printed
   privateCapsule    capsules here quote private prompts and name private files
   leadingCommand    the first command was pasted without its prompt line
   unescapeDots      undo a copy artifact, described below

   The pairing for K is the one the pack itself states: five output lines for
   seven commands, with nothing printed for the fifth and seventh.

   unescapeDots. The first Windows capture reached the pack by way of rendered
   Markdown, which wrote every "\." as "\\.", so its paths read
   "...\Users\name\\.velra\...". The later capture, copied as plain text from
   the same binary on the same machine, prints the same paths with one
   backslash. The doubled one is therefore an artifact of the copy and not
   something Velra printed, and it is undone for those transcripts only. */

type Spec =
  | {
      section: string;
      kind: 'prompted';
      leadingCommand?: boolean;
      privateWorkspace?: boolean;
      privateCapsule?: boolean;
      unescapeDots?: boolean;
    }
  | { section: string; kind: 'json'; command: string; privateWorkspace?: boolean }
  | { section: string; kind: 'paired'; pairs: number[][] }
  | { section: string; kind: 'excerpt'; privateCapsule: true };

const MANIFEST: Spec[] = [
  { section: 'A', kind: 'prompted' },
  { section: 'B', kind: 'prompted', unescapeDots: true },
  { section: 'C', kind: 'prompted', unescapeDots: true },
  { section: 'D', kind: 'prompted', unescapeDots: true },
  { section: 'E', kind: 'prompted', unescapeDots: true },
  { section: 'F', kind: 'prompted', unescapeDots: true },
  { section: 'G', kind: 'prompted', unescapeDots: true },
  { section: 'H', kind: 'prompted' },
  { section: 'I', kind: 'prompted' },
  { section: 'J', kind: 'json', command: 'velra restore --list --json' },
  { section: 'K', kind: 'paired', pairs: [[0], [1], [2], [3], [], [4], []] },
  { section: 'L', kind: 'json', command: 'velra restore --list --json', privateWorkspace: true },
  { section: 'M', kind: 'excerpt', privateCapsule: true },
  {
    section: 'N',
    kind: 'prompted',
    leadingCommand: true,
    privateWorkspace: true,
    privateCapsule: true,
  },
];

/* --------------------------------------------------------------- patterns */

const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const WIN_HOME = /[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s"')]+/g;
const NIX_HOME = /\/(?:home|Users)\/[^/\s"')]+/g;
const WORKSPACE_ID = /("workspace_id":\s*")([0-9a-f]{16})(")/g;
const WORKSPACE_ROOT = /("workspace_root":\s*")((?:[^"\\]|\\.)*)(")/g;
const TITLE = /("title":\s*")((?:[^"\\]|\\.)*)(")/g;

const QUOTED_PROMPT = /^(- .*?\| ")(.*)(")$/;
const EDIT_PATH = /^(- )(\S+)( \| .*)$/;
const CAPSULE_HEADER = /^\[([A-Z_]+)\]/;
/** The capsule's own opening and closing tags. Nothing else that starts with "<" is structure. */
const ENVELOPE = /^<\/?VELRA_[A-Z_]+[\s>]/;

const MESSAGE_SECTIONS = new Set([
  'FIRST_MESSAGE',
  'SUBTASK_MESSAGE',
  'EARLIER_MESSAGE',
  'LATEST_MESSAGE',
]);
const QUOTE_SECTIONS = new Set(['STATED_CONSTRAINTS', 'REJECTED_APPROACHES']);
const PATH_SECTIONS = new Set([
  'RECENT_EDITS',
  'REVERTED_EDITS',
  'FILE_ACTIVITY',
  'TEST_STATUS',
  'FAILURE_LOCATION',
  'NEXT_TARGET',
]);

type Tally = Partial<Record<RedactionKind, number>>;

/**
 * What each private value is replaced with.
 *
 * Short on purpose. A terminal full of capital letters reads as noise, and the
 * point of the replay is the output around these values. The home directory
 * becomes ~, the convention Velra's own documentation uses for the same thing.
 * The rest are lower-case names in angle brackets, which the page draws as
 * chips and lists per step, so a redaction is never silent.
 */
export const REDACTION_TOKEN: Record<RedactionKind, string> = {
  USER_HOME_REDACTED: '~',
  LOCAL_PATH_REDACTED: '<workspace-path>',
  SESSION_ID_REDACTED: '<session-id>',
  SESSION_TITLE_REDACTED: '<session-title>',
  WORKSPACE_ID_REDACTED: '<workspace-id>',
  PROMPT_TEXT_REDACTED: '<prompt-text>',
  FILE_PATH_REDACTED: '<file-path>',
};

function mark(kind: RedactionKind, tally: Tally): string {
  tally[kind] = (tally[kind] ?? 0) + 1;
  return REDACTION_TOKEN[kind];
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ---------------------------------------------------------------- parsing */

interface Block {
  lang: string;
  lines: string[];
}

function normalise(raw: string): string {
  return raw.replace(/\r\n?/g, '\n');
}

/** The fenced code blocks under each `## Transcript X:` heading. */
export function readSections(raw: string): Map<string, Block[]> {
  const out = new Map<string, Block[]>();
  const lines = normalise(raw).split('\n');
  let section: string | null = null;
  let block: Block | null = null;

  for (const line of lines) {
    if (block) {
      if (line.startsWith('```')) {
        out.get(section!)!.push(block);
        block = null;
      } else {
        block.lines.push(line);
      }
      continue;
    }
    const heading = /^## (?:Transcript ([A-Z]):)?/.exec(line);
    if (heading) {
      section = heading[1] ?? null;
      if (section && !out.has(section)) out.set(section, []);
      continue;
    }
    if (section && line.startsWith('```')) {
      block = { lang: line.slice(3).trim(), lines: [] };
    }
  }
  return out;
}

function trimBlank(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start++;
  while (end > start && lines[end - 1].trim() === '') end--;
  return lines.slice(start, end);
}

const PS_PROMPT = /^(PS .+?>) (.*)$/;
const ZSH_PROMPT = /^(❯) (.*)$/;

function need(blocks: Block[] | undefined, index: number, section: string): Block {
  const block = blocks?.[index];
  if (!block) {
    throw new Error(`Transcript ${section}: expected code block ${index + 1}, found none.`);
  }
  return block;
}

/* ---------------------------------------------------------------- context

   Everything private that can only be learned by reading the pack: which
   session ids exist, which workspace ids, which workspace paths. */

interface Context {
  /** Short spellings of every session id: the first eight characters, and "abcd…wxyz". */
  shortIds: string[];
  workspaceIds: string[];
  /** Private workspace paths, in every slash style, longest first. */
  privateRoots: string[];
}

function slashStyles(path: string): string[] {
  return [...new Set([path, path.replace(/\//g, '\\'), path.replace(/\\/g, '/')])];
}

function readContext(raw: string, sections: Map<string, Block[]>): Context {
  const text = normalise(raw);
  const uuids = [...new Set([...text.matchAll(UUID)].map((m) => m[0]))];
  const shortIds = [
    ...new Set(uuids.flatMap((id) => [id.slice(0, 8), `${id.slice(0, 4)}…${id.slice(-4)}`])),
  ];
  const workspaceIds = [...new Set([...text.matchAll(WORKSPACE_ID)].map((m) => m[2]))];

  const roots = new Set<string>();
  for (const spec of MANIFEST) {
    if (!('privateWorkspace' in spec) || !spec.privateWorkspace) continue;
    for (const block of sections.get(spec.section) ?? []) {
      for (const m of block.lines.join('\n').matchAll(WORKSPACE_ROOT)) {
        if (m[2]) slashStyles(m[2]).forEach((r) => roots.add(r));
      }
    }
  }
  const privateRoots = [...roots].sort((a, b) => b.length - a.length);

  return { shortIds, workspaceIds, privateRoots };
}

/* --------------------------------------------------------------- scrubbing */

/** The rules that apply to every line, whatever transcript it came from. */
function scrub(text: string, tally: Tally, ctx: Context): string {
  let out = text;
  // Whole private paths first, so the home rule below never sees their remains.
  for (const root of ctx.privateRoots) {
    out = out.split(root).join('\u0000');
  }
  out = out.replace(/\u0000/g, () => mark('LOCAL_PATH_REDACTED', tally));

  for (const id of ctx.workspaceIds) {
    out = out.replace(new RegExp(`(?<![0-9a-f])${id}(?![0-9a-f])`, 'g'), () =>
      mark('WORKSPACE_ID_REDACTED', tally),
    );
  }
  out = out.replace(TITLE, (_m, a, _v, c) => a + mark('SESSION_TITLE_REDACTED', tally) + c);
  out = out.replace(UUID, () => mark('SESSION_ID_REDACTED', tally));
  for (const short of ctx.shortIds) {
    out = out.replace(new RegExp(`(?<![0-9a-f])${escapeRegExp(short)}(?![0-9a-f-])`, 'g'), () =>
      mark('SESSION_ID_REDACTED', tally),
    );
  }
  out = out.replace(WIN_HOME, () => mark('USER_HOME_REDACTED', tally));
  out = out.replace(NIX_HOME, () => mark('USER_HOME_REDACTED', tally));
  return out;
}

/**
 * A capsule quotes the user's own prompts and names their files. For a capsule
 * from a private workspace those are replaced line by line while the structure
 * around them (section headers, turn numbers, times, line counts) is kept.
 *
 * Only the capsule's own VELRA_ tags count as structure. A prompt can begin
 * with any character at all, "<" included, and is redacted regardless.
 */
function scrubPrivateCapsule(lines: string[], tally: Tally, ctx: Context): string[] {
  let current = '';
  return lines.map((line) => {
    const header = CAPSULE_HEADER.exec(line);
    if (header) {
      current = header[1];
      return scrub(line, tally, ctx);
    }
    if (ENVELOPE.test(line)) {
      if (line.startsWith('</')) current = '';
      return scrub(line, tally, ctx);
    }
    if (line.trim() === '') return line;

    if (MESSAGE_SECTIONS.has(current)) return mark('PROMPT_TEXT_REDACTED', tally);

    if (QUOTE_SECTIONS.has(current)) {
      const quoted = QUOTED_PROMPT.exec(line);
      if (quoted) return quoted[1] + mark('PROMPT_TEXT_REDACTED', tally) + quoted[3];
      return mark('PROMPT_TEXT_REDACTED', tally);
    }

    if (PATH_SECTIONS.has(current)) {
      const edit = EDIT_PATH.exec(line);
      if (edit) return edit[1] + mark('FILE_PATH_REDACTED', tally) + scrub(edit[3], tally, ctx);
      // An indented excerpt under an edit is file content.
      if (/^\s+/.test(line)) return mark('FILE_PATH_REDACTED', tally);
    }

    return scrub(line, tally, ctx);
  });
}

/** Undoes the "\\." copy artifact. See the note on the manifest. */
const unescapeDots = (line: string) => line.replace(/\\\\(?=\.)/g, '\\');

/** Builds the public-safe file from the raw source pack. */
export function buildCaptured(raw: string): CapturedFile {
  const sections = readSections(raw);
  const ctx = readContext(raw, sections);
  const entries: CapturedEntry[] = [];

  for (const spec of MANIFEST) {
    const blocks = sections.get(spec.section);

    if (spec.kind === 'prompted') {
      const runs: { prompt: string | null; command: string; output: string[] }[] = [];
      for (const source of need(blocks, 0, spec.section).lines) {
        const line = spec.unescapeDots ? unescapeDots(source) : source;
        const m = PS_PROMPT.exec(line);
        if (m) runs.push({ prompt: m[1], command: m[2], output: [] });
        else if (runs.length) runs[runs.length - 1].output.push(line);
        else if (spec.leadingCommand && line.trim() !== '') {
          runs.push({ prompt: null, command: line.trim(), output: [] });
        }
      }
      if (!runs.length) throw new Error(`Transcript ${spec.section}: no prompt line found.`);
      runs.forEach((run, i) => {
        const tally: Tally = {};
        const output = trimBlank(run.output);
        entries.push({
          id: runs.length > 1 ? `${spec.section}${i + 1}` : spec.section,
          section: spec.section,
          prompt: run.prompt === null ? null : scrub(run.prompt, tally, ctx),
          command: scrub(run.command, tally, ctx),
          output: spec.privateCapsule
            ? scrubPrivateCapsule(output, tally, ctx)
            : output.map((l) => scrub(l, tally, ctx)),
          redactions: tally,
        });
      });
      continue;
    }

    if (spec.kind === 'json') {
      const tally: Tally = {};
      entries.push({
        id: spec.section,
        section: spec.section,
        prompt: null,
        command: spec.command,
        output: trimBlank(need(blocks, 0, spec.section).lines).map((l) => scrub(l, tally, ctx)),
        redactions: tally,
      });
      continue;
    }

    if (spec.kind === 'paired') {
      const commands = need(blocks, 0, spec.section).lines.filter((l) => l.trim() !== '');
      const output = need(blocks, 1, spec.section).lines.filter((l) => l.trim() !== '');
      const used = spec.pairs.flat();
      if (commands.length !== spec.pairs.length || used.length !== output.length) {
        throw new Error(
          `Transcript ${spec.section}: ${commands.length} commands and ${output.length} ` +
            `output lines do not match the manifest pairing.`,
        );
      }
      commands.forEach((command, i) => {
        const tally: Tally = {};
        entries.push({
          id: `${spec.section}${i + 1}`,
          section: spec.section,
          prompt: null,
          command: scrub(command, tally, ctx),
          output: spec.pairs[i].map((n) => scrub(output[n], tally, ctx)),
          redactions: tally,
        });
      });
      continue;
    }

    // excerpt: a list of commands, and one partial output that belongs to the first.
    const commands = need(blocks, 0, spec.section)
      .lines.map((l) => ZSH_PROMPT.exec(l))
      .filter((m): m is RegExpExecArray => m !== null);
    const excerpt = trimBlank(need(blocks, 1, spec.section).lines);
    if (!commands.length) throw new Error(`Transcript ${spec.section}: no command line found.`);
    commands.forEach((m, i) => {
      const tally: Tally = {};
      entries.push({
        id: `${spec.section}${i + 1}`,
        section: spec.section,
        prompt: m[1],
        command: scrub(m[2], tally, ctx),
        output: i === 0 ? scrubPrivateCapsule(excerpt, tally, ctx) : [],
        redactions: tally,
      });
    });
  }

  return {
    source: SOURCE_FILE,
    note:
      'Generated by scripts/velra-transcripts.ts from a local, gitignored source file. ' +
      'Do not edit by hand. Placeholders in angle brackets mark privacy redactions. ' +
      'Holds only the executions listed in lib/velra/published.ts.',
    entries,
  };
}

/**
 * Narrows the full sanitized pack to the executions the page shows, in pack
 * order. It fails if an id is asked for that the pack does not contain, so a
 * typo in the selection cannot quietly drop a step from the site.
 */
export function publish(file: CapturedFile, ids: readonly string[]): CapturedFile {
  const missing = ids.filter((id) => !file.entries.some((entry) => entry.id === id));
  if (missing.length) {
    throw new Error(`Published ids not found in the source pack: ${missing.join(', ')}.`);
  }
  if (new Set(ids).size !== ids.length) throw new Error('The published list repeats an id.');
  return { ...file, entries: file.entries.filter((entry) => ids.includes(entry.id)) };
}

/* ------------------------------------------------------------------ audit */

/**
 * Every private value in the raw pack, read out of the pack itself. Used to
 * prove that none of them survives into the generated data or the built site.
 */
export function privateStrings(raw: string): string[] {
  const text = normalise(raw);
  const sections = readSections(raw);
  const ctx = readContext(raw, sections);
  const found = new Set<string>();

  for (const m of text.matchAll(UUID)) found.add(m[0]);
  for (const m of text.matchAll(WIN_HOME)) found.add(m[0]);
  for (const m of text.matchAll(NIX_HOME)) found.add(m[0]);
  for (const m of text.matchAll(TITLE)) if (m[2]) found.add(m[2]);
  ctx.shortIds.forEach((s) => found.add(s));
  ctx.workspaceIds.forEach((s) => found.add(s));
  ctx.privateRoots.forEach((s) => found.add(s));

  // Private capsules: quoted prompt text, message bodies, file names.
  for (const spec of MANIFEST) {
    if (!('privateCapsule' in spec) || !spec.privateCapsule) continue;
    for (const block of sections.get(spec.section) ?? []) {
      let current = '';
      for (const line of block.lines) {
        const header = CAPSULE_HEADER.exec(line);
        if (header) {
          current = header[1];
          continue;
        }
        // A closing tag or a new prompt ends the capsule, so nothing after it is mistaken for one.
        if (ENVELOPE.test(line) || PS_PROMPT.test(line) || ZSH_PROMPT.test(line)) {
          if (!line.startsWith('<VELRA_')) current = '';
          continue;
        }
        if (line.trim() === '') continue;
        if (MESSAGE_SECTIONS.has(current)) found.add(line.trim());
        const quoted = QUOTED_PROMPT.exec(line);
        if (QUOTE_SECTIONS.has(current) && quoted) found.add(quoted[2]);
        const edit = EDIT_PATH.exec(line);
        if (PATH_SECTIONS.has(current) && edit) found.add(edit[2]);
      }
    }
  }

  return [...found].filter((s) => s.length >= 6);
}

/**
 * The spellings a private value can take once it has been through a bundler:
 * as written, escaped inside a JavaScript or JSON string, and escaped for HTML.
 */
function spellings(secret: string): string[] {
  const html = secret
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  return [...new Set([secret, JSON.stringify(secret).slice(1, -1), html])];
}

/** The private values from `secrets` that appear in `text`, in any spelling. */
export function findLeaks(text: string, secrets: string[]): string[] {
  return secrets.filter((secret) => spellings(secret).some((form) => text.includes(form)));
}

/** Patterns that must never match generated captured data, raw pack or not. */
export const FORBIDDEN_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'session uuid', pattern: new RegExp(UUID.source, 'i') },
  { name: 'windows home path', pattern: new RegExp(WIN_HOME.source) },
  { name: 'posix home path', pattern: new RegExp(NIX_HOME.source) },
  { name: 'workspace id', pattern: /"workspace_id":\s*"[0-9a-f]{16}"/ },
  { name: 'session title', pattern: /"title":\s*"(?!<session-title>")/ },
  // A bare run of 16 hex characters is the shape of a workspace id, in a path or anywhere else.
  { name: 'bare workspace id', pattern: /(?<![0-9a-f])[0-9a-f]{16}(?![0-9a-f])/ },
];
