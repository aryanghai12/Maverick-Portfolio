/**
 * Every sentence the /velra page says in its own voice.
 *
 * Kept in one file for the same reason lib/content.ts is: copy this specific
 * gets fact-checked as a unit. Each claim below restates something in Velra's
 * README, docs/GUARANTEES.md, docs/RESTORE.md or SECURITY.md, and where the
 * docs attach a limit, the limit is stated next to the claim.
 *
 * Deliberately absent: "perfect memory", "never lose anything", "infinite
 * context", "zero context loss". Velra carries a bounded rendering of recorded
 * operational state. It does not carry the conversation.
 */

import { DOCS, VELRA_REPO } from './documented';

export const INSTALL_COMMAND = 'npm install -g velra';

export const nav = [
  { href: '#replay', label: 'Replay' },
  { href: '#why', label: 'Why state' },
  { href: '#how', label: 'How it works' },
  { href: '#trust', label: 'Trust' },
] as const;

export const hero = {
  eyebrow: 'Session continuity for Claude Code',
  headline: ['The work should', 'survive', 'the session.'],
  sub:
    'Velra carries the engineering state that gets lost between coding sessions: ' +
    'the objective, constraints, test status, edits, reversions, and what to do next.',
  fine: 'A bounded record of what the session did. Not a replay of the conversation.',
  primary: 'Explore the workflow',
  secondary: 'View source on GitHub',
  steps: ['Record', 'Reduce', 'Restore'],
} as const;

export const properties = [
  { title: 'Local-first', body: 'No network code in the hook path. No model calls.' },
  { title: 'Deterministic', body: 'Same ledger, same clock, same bytes.' },
  { title: 'Bounded', body: '740 estimated tokens by default. Never more than 1,000.' },
  { title: 'Explicit', body: 'Nothing crosses sessions until you run velra restore.' },
] as const;

export const replay = {
  eyebrow: 'Interactive replay',
  title: 'See the state move.',
  titleDim: 'Not the whole transcript.',
  lede:
    'Step through real commands and their output, then open the capsule to see what was kept. ' +
    'This is a recorded replay. Nothing on this page runs on your machine.',
  caption:
    'Recorded command replay. The page plays back stored text and never opens a shell, on your computer or on a server.',
  keys: 'Space plays or pauses. Left and right arrows move between steps.',
} as const;

export const why = {
  eyebrow: 'Why state',
  title: 'Your repository knows the code.',
  titleDim: 'It does not know where the work stands.',
  lede:
    'A new session can read every file and still miss what the last one learned. ' +
    'That knowledge is small, and it is cheap to carry if it is carried precisely.',
  before: {
    label: 'A fresh session, reading the files',
    items: [
      'reconcile.py as it is now, with no sign of what was tried',
      'Three failing tests, and nothing to say which one matters',
      'A reverted edit that left no trace in git',
      'No record of the rule that was stated once, in chat',
    ],
  },
  after: {
    label: 'The same session, with the capsule',
    items: [
      { section: 'FIRST_MESSAGE', text: 'The objective: the reconcile failure, not the other two' },
      { section: 'STATED_CONSTRAINTS', text: 'A window closes on the booking date, never the value date' },
      { section: 'TEST_STATUS', text: 'The exact failing test, by id' },
      { section: 'REVERTED_EDITS', text: 'The edit that was tried and undone' },
      { section: 'LATEST_MESSAGE', text: "The next step, in the user's own words" },
    ],
  },
  exampleNote: 'Values from the documented example in the Velra README.',
  caution:
    'The capsule is context, not a command. The files stay the source of truth, and Velra does not promise that an agent will act on it.',
} as const;

export const how = {
  eyebrow: 'How it works',
  title: 'Five steps.',
  titleDim: 'No model in any of them.',
  lede:
    'Velra records what a session does, not what it says. The record is reduced by ordinary code, ' +
    'rendered within a budget, and handed over only when you ask.',
  steps: [
    {
      name: 'Capture',
      body:
        'Claude Code hooks pass Velra each event: prompts, edits, commands, test runs and reverts. ' +
        'Each one is normalised, redacted and appended to a local SQLite ledger.',
      flow: 'hook event → ledger',
    },
    {
      name: 'Reduce',
      body:
        'A reducer folds the events, in order, into task state: the objective, constraints, tests, edits and reverts.',
      flow: 'ledger → task state',
    },
    {
      name: 'Render',
      body:
        'A pure renderer writes the capsule within a fixed budget. If it runs over, a fixed ladder ' +
        'drops regenerable detail first and exact identifiers last.',
      flow: 'task state → capsule',
    },
    {
      name: 'Stage',
      body:
        'velra restore writes the capsule for the source session you picked to ~/.velra/staged, ' +
        'outside every repository.',
      flow: 'velra restore → staged file',
    },
    {
      name: 'Deliver',
      body:
        'The next new Claude Code session in that workspace claims the capsule once and receives it as additional context.',
      flow: 'SessionStart(startup) → context',
    },
  ],
  labels: {
    title: 'Observed or inferred',
    body:
      'Every capsule section says how it is known. Files on disk remain the source of truth, and the capsule says so in its first lines.',
    observed: 'Read directly from a prompt or a tool event: what you typed, which test failed, which edit was reverted.',
    inferred:
      'Derived from observed rows. Two sections are inferred: where failing output points, and the most recent live edit.',
  },
  omits: {
    title: 'What Velra leaves out',
    items: [
      {
        name: 'The conversation',
        body: 'A capsule is a bounded rendering of recorded state. It is not a transcript and it is not a summary written by a model.',
      },
      {
        name: 'Assistant reasoning',
        body: "The assistant's replies are not hooked, so they are never recorded.",
      },
      {
        name: 'Merged sessions',
        body: 'The source session keeps its identity and the new one keeps its own. Only the capsule text crosses.',
      },
      {
        name: 'Automatic handoffs',
        body: 'Nothing moves between sessions until you run velra restore and name the source.',
      },
    ],
    resume:
      "To reopen a whole conversation, use Claude Code's own /resume. Velra is for a fresh, small context that still knows where the work stands.",
  },
} as const;

export const trust = {
  eyebrow: 'Trust and privacy',
  title: 'Precise about what it promises.',
  titleDim: 'And about what it does not.',
  lede:
    'These are the properties Velra documents, each with the limit the documentation attaches to it.',
  items: [
    {
      title: 'Local-first storage',
      body: 'State lives under ~/.velra on your machine. No accounts and no telemetry.',
      limit: 'The files are not encrypted at rest. Anyone who can read your account can read them.',
    },
    {
      title: 'Secret redaction',
      body: 'Known secret formats are replaced before anything is written, the spool included.',
      limit: 'Redaction is pattern matching. An unusual secret format can pass through.',
    },
    {
      title: 'No model calls',
      body: 'Capture, reduction and rendering are deterministic code. Nothing is summarised by a model.',
      limit: 'So the capsule holds only what Velra observed. It cannot fill a gap by guessing.',
    },
    {
      title: 'Nothing leaves the machine',
      body: 'No network-capable code is linked into the hook path, and CI checks that it stays that way.',
      limit: 'The installers do download a release archive and verify its checksum.',
    },
    {
      title: 'A bounded capsule',
      body: 'Never more than 1,000 estimated tokens or 9,500 characters, whatever the budget is set to.',
      limit: 'Bounded means lossy. Under pressure your own wording is shortened before an identifier is.',
    },
    {
      title: 'Explicit restore',
      body: 'Only velra restore crosses sessions, for a session you name, inside one workspace.',
      limit: 'A restore is a snapshot of the moment you ran it. Later work needs a restage.',
    },
    {
      title: 'Delivered at most once',
      body: 'To the next new session in the same workspace, within seven days.',
      limit: 'At most once is exact. A session start killed mid-delivery means zero deliveries.',
    },
    {
      title: 'Claude Code only',
      body: 'Velra integrates with Claude Code through its hooks, and with nothing else.',
      limit: 'Hook payloads are not a stable public interface. A Claude Code change can require a Velra update.',
    },
  ],
  travel: {
    title: 'Prompts travel',
    body:
      'A capsule quotes your prompts. Anything you typed in the source session can reach the next session in that workspace. ' +
      'That is the feature, and it is also the thing to be aware of.',
  },
  evidence: {
    title: 'Evidence, with its limits',
    body:
      "In Velra's v0.1.2 live qualification, four matched pairs of sessions were compared. The sessions that received a capsule " +
      'met the registered correctness criterion in 4 of 4 trials, and the fresh baselines in 0 of 4. Total input was lower in three pairs and higher in one.',
    limit:
      'The documentation calls this qualification evidence, not an effect size. It ran on an earlier build, and the baseline was a fresh session rather than a resumed one.',
  },
  links: [
    { label: 'Architecture', href: DOCS.architecture },
    { label: 'Guarantees', href: DOCS.guarantees },
    { label: 'Security', href: DOCS.security },
    { label: 'Restore', href: DOCS.restore },
    { label: 'Benchmark', href: DOCS.benchmark },
  ],
} as const;

export const cta = {
  eyebrow: 'For the work after the reset',
  title: ['Clear the context.', 'Keep the state.', 'Continue working.'],
  body: 'Velra is open source under the MIT licence. Install it, run velra enable once, and keep working as usual.',
  primary: 'View Velra on GitHub',
  copy: 'Copy install command',
  links: [
    { label: 'Installation guide', href: DOCS.install },
    { label: 'Restore guide', href: DOCS.restore },
    { label: 'Architecture', href: DOCS.architecture },
    { label: 'Security', href: DOCS.security },
  ],
} as const;

export const footer = {
  tagline: 'State, not transcript.',
  repo: VELRA_REPO,
  licence: DOCS.licence,
} as const;
