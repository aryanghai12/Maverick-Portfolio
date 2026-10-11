/**
 * Turns the local transcript source pack into the public-safe data the /velra
 * replay reads.
 *
 * The source pack is a Markdown file of terminal captures. It holds session
 * ids, a local account name, private session titles and private prompt text,
 * so it is gitignored and never bundled. This module is the only thing that
 * reads it, and what it writes is the only form that reaches a browser.
 *
 * Two rules it does not bend:
 *
 *   Nothing is invented. A line is either copied or has a sensitive value
 *   replaced by a visible placeholder (see REDACTION_TOKEN). Lines are never added, dropped,
 *   reordered or summarised. Blank lines inside an output block are kept as
 *   supplied; only the blank lines that separate a command from its output are
 *   trimmed.
 *
 *   No private string lives in this file. Every rule is a pattern, so the
 *   sanitizer can be committed without leaking what it removes.
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
  /** The transcript letter in the source pack, A through M. */
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

   How each transcript in the pack is laid out. The pairing for K is the one
   the pack itself states: five output lines for seven commands, with nothing
   printed for the fifth and seventh. */

type Spec =
  | { section: string; kind: 'prompted' }
  | { section: string; kind: 'json'; command: string; privateWorkspace?: boolean }
  | { section: string; kind: 'paired'; pairs: number[][] }
  | { section: string; kind: 'excerpt' };

const MANIFEST: Spec[] = [
  { section: 'A', kind: 'prompted' },
  { section: 'B', kind: 'prompted' },
  { section: 'C', kind: 'prompted' },
  { section: 'D', kind: 'prompted' },
  { section: 'E', kind: 'prompted' },
  { section: 'F', kind: 'prompted' },
  { section: 'G', kind: 'prompted' },
  { section: 'H', kind: 'prompted' },
  { section: 'I', kind: 'prompted' },
  { section: 'J', kind: 'json', command: 'velra restore --list --json' },
  { section: 'K', kind: 'paired', pairs: [[0], [1], [2], [3], [], [4], []] },
  { section: 'L', kind: 'json', command: 'velra restore --list --json', privateWorkspace: true },
  { section: 'M', kind: 'excerpt' },
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

/** The rules that apply to every line, whatever transcript it came from. */
function scrub(text: string, tally: Tally, privateWorkspace = false): string {
  let out = text;
  if (privateWorkspace) {
    out = out.replace(WORKSPACE_ROOT, (_m, a, _v, c) => a + mark('LOCAL_PATH_REDACTED', tally) + c);
  }
  out = out.replace(WORKSPACE_ID, (_m, a, _v, c) => a + mark('WORKSPACE_ID_REDACTED', tally) + c);
  out = out.replace(TITLE, (_m, a, _v, c) => a + mark('SESSION_TITLE_REDACTED', tally) + c);
  out = out.replace(UUID, () => mark('SESSION_ID_REDACTED', tally));
  out = out.replace(WIN_HOME, () => mark('USER_HOME_REDACTED', tally));
  out = out.replace(NIX_HOME, () => mark('USER_HOME_REDACTED', tally));
  return out;
}

/**
 * A capsule quotes the user's own prompts and names their files. For a capsule
 * from a private workspace those are replaced line by line while the structure
 * around them (section headers, turn numbers, times, line counts) is kept.
 */
function scrubPrivateCapsule(lines: string[], tally: Tally): string[] {
  let current = '';
  return lines.map((line) => {
    const header = CAPSULE_HEADER.exec(line);
    if (header) {
      current = header[1];
      return scrub(line, tally);
    }
    if (line.trim() === '' || line.startsWith('<')) return scrub(line, tally);

    if (MESSAGE_SECTIONS.has(current)) return mark('PROMPT_TEXT_REDACTED', tally);

    if (QUOTE_SECTIONS.has(current)) {
      const quoted = QUOTED_PROMPT.exec(line);
      if (quoted) return quoted[1] + mark('PROMPT_TEXT_REDACTED', tally) + quoted[3];
      return mark('PROMPT_TEXT_REDACTED', tally);
    }

    if (PATH_SECTIONS.has(current)) {
      const edit = EDIT_PATH.exec(line);
      if (edit) return edit[1] + mark('FILE_PATH_REDACTED', tally) + scrub(edit[3], tally);
      // An indented excerpt under an edit is file content.
      if (/^\s+/.test(line)) return mark('FILE_PATH_REDACTED', tally);
    }

    return scrub(line, tally);
  });
}

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

/** Builds the public-safe file from the raw source pack. */
export function buildCaptured(raw: string): CapturedFile {
  const sections = readSections(raw);
  const entries: CapturedEntry[] = [];

  for (const spec of MANIFEST) {
    const blocks = sections.get(spec.section);

    if (spec.kind === 'prompted') {
      const runs: { prompt: string; command: string; output: string[] }[] = [];
      for (const line of need(blocks, 0, spec.section).lines) {
        const m = PS_PROMPT.exec(line);
        if (m) runs.push({ prompt: m[1], command: m[2], output: [] });
        else if (runs.length) runs[runs.length - 1].output.push(line);
      }
      if (!runs.length) throw new Error(`Transcript ${spec.section}: no prompt line found.`);
      runs.forEach((run, i) => {
        const tally: Tally = {};
        entries.push({
          id: runs.length > 1 ? `${spec.section}${i + 1}` : spec.section,
          section: spec.section,
          prompt: scrub(run.prompt, tally),
          command: scrub(run.command, tally),
          output: trimBlank(run.output).map((l) => scrub(l, tally)),
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
        output: trimBlank(need(blocks, 0, spec.section).lines).map((l) =>
          scrub(l, tally, spec.privateWorkspace),
        ),
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
          command: scrub(command, tally),
          output: spec.pairs[i].map((n) => scrub(output[n], tally)),
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
        command: scrub(m[2], tally),
        output: i === 0 ? scrubPrivateCapsule(excerpt, tally) : [],
        redactions: tally,
      });
    });
  }

  return {
    source: SOURCE_FILE,
    note:
      'Generated by scripts/velra-transcripts.ts from a local, gitignored source file. ' +
      'Do not edit by hand. Placeholders in angle brackets mark privacy redactions.',
    entries,
  };
}

/* ------------------------------------------------------------------ audit */

/**
 * Every private value in the raw pack, read out of the pack itself. Used to
 * prove that none of them survives into the generated data or the built site.
 */
export function privateStrings(raw: string): string[] {
  const text = normalise(raw);
  const found = new Set<string>();

  for (const m of text.matchAll(UUID)) found.add(m[0]);
  for (const m of text.matchAll(WIN_HOME)) found.add(m[0]);
  for (const m of text.matchAll(NIX_HOME)) found.add(m[0]);
  for (const m of text.matchAll(WORKSPACE_ID)) found.add(m[2]);
  for (const m of text.matchAll(TITLE)) if (m[2]) found.add(m[2]);

  // The private capsule excerpt: quoted prompt text, message bodies, file names.
  const excerpt = readSections(raw).get('M')?.[1]?.lines ?? [];
  let current = '';
  for (const line of excerpt) {
    const header = CAPSULE_HEADER.exec(line);
    if (header) {
      current = header[1];
      continue;
    }
    if (line.trim() === '' || line.startsWith('<')) continue;
    if (MESSAGE_SECTIONS.has(current)) found.add(line.trim());
    const quoted = QUOTED_PROMPT.exec(line);
    if (QUOTE_SECTIONS.has(current) && quoted) found.add(quoted[2]);
    const edit = EDIT_PATH.exec(line);
    if (PATH_SECTIONS.has(current) && edit) found.add(edit[2]);
  }

  // The private Linux workspace root, wherever it appears.
  for (const m of text.matchAll(WORKSPACE_ROOT)) {
    if (m[2].startsWith('/')) found.add(m[2]);
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
];
