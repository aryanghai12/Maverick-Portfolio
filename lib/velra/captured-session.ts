/**
 * The working-session capture: Velra commands from one continuous PowerShell
 * run, three days after the install, in a workspace where real work had been
 * recorded.
 *
 * This is the capture that carries the story. It has a whole capsule, the
 * actual result of staging it, and status showing it waiting for a new session.
 *
 * It is also the most private. The capsule quotes real prompts and names real
 * files, so every one of those is replaced before it reaches this repository,
 * along with the session id, the workspace id and the workspace path. What is
 * left is the shape of the record: which sections exist, what kind of thing
 * each holds, the times, the counts, and how each is labelled. That shape is
 * the thing the page is trying to show, so nothing is lost by it.
 *
 * Every `evidence` line is a quotation from that step's own sanitized output,
 * and tests/velra/transcripts.test.ts fails if one is not.
 */

import type { InspectorField, StepMeta } from './types';

/** How the private workspace path is shown wherever Velra printed it. */
export const PRIVATE_WORKSPACE = '<workspace-path>';

const PHASE = 'windows-session';

const REDACTED_PROMPT = 'The text is a private prompt and is redacted on this page.';
const SECTIONS_ONLY_WHEN_NEEDED =
  'Velra renders a section only when there is something to say, so a missing section is not an error.';

/** The capsule's fields. The same record is printed by three commands, so it is described once. */
function capsuleFields(options: {
  opening: string;
  record: string;
  workspaceState: string;
  recordDetail: string;
}): InspectorField[] {
  return [
    {
      label: 'Record',
      value: options.record,
      tag: 'output',
      evidence: [options.opening],
    },
    {
      label: 'Objective',
      value: 'The first message, a user prompt at 16:38',
      tag: 'observed',
      evidence: ['[FIRST_MESSAGE] (OBSERVED | user prompt | 16:38)'],
      detail: `Velra carries the objective in the user's own words. ${REDACTED_PROMPT}`,
    },
    {
      label: 'Stated constraints',
      value: '3 rules, quoted verbatim from turn 0',
      tag: 'observed',
      evidence: ['[STATED_CONSTRAINTS] (OBSERVED | user prompt | quoted verbatim)'],
      detail: `Rules the user stated once, in chat, with the turn and time they were said. ${REDACTED_PROMPT}`,
    },
    {
      label: 'Latest message',
      value: 'A user prompt at 18:52',
      tag: 'observed',
      evidence: ['[LATEST_MESSAGE] (OBSERVED | user prompt | 18:52)'],
      detail: `The most recent direction, so a new session knows where things were heading. ${REDACTED_PROMPT}`,
    },
    {
      label: 'Workspace state',
      value: options.workspaceState,
      tag: 'unlabelled',
      evidence: [options.workspaceState],
      detail:
        'Branch and commit, edits made in this task, and the outcome of the last test run. This section carries no OBSERVED or INFERRED label.',
    },
    {
      label: 'Reverted edits',
      value: '2 files, 1 edit each, both reverted at 18:17',
      tag: 'observed',
      evidence: ['[REVERTED_EDITS] (OBSERVED)'],
      detail:
        'Work that was tried and undone. A revert like this leaves no trace in git, which is why Velra records it. File names are redacted on this page.',
    },
    {
      label: 'Sections not present',
      value: 'Test status, recent edits, next target',
      tag: 'absent',
      detail: SECTIONS_ONLY_WHEN_NEEDED,
    },
    {
      label: 'Record detail',
      value: options.recordDetail,
      tag: 'output',
      evidence: [options.recordDetail],
    },
  ];
}

const STAGED_FIELDS = (capsuleFile: string): InspectorField[] => [
  {
    label: 'Staged',
    value: 'objective, 2 dead ends, 8 files',
    tag: 'output',
    evidence: ['✓ Staged objective, 2 dead ends, 8 files from session <session-id>.'],
  },
  {
    label: 'Size',
    value: '706 estimated tokens',
    tag: 'output',
    evidence: ['  706 estimated tokens'],
    detail:
      "An estimate made by Velra, not a tokenizer count. Velra's documented default target is 740 and its hard ceiling is 1,000.",
  },
  {
    label: 'Stored at',
    value: '~\\.velra\\staged\\<workspace-id>\\',
    tag: 'output',
    evidence: [capsuleFile],
    detail: 'Under the home directory, outside every repository, so it cannot be committed by accident.',
  },
  {
    label: 'Delivery',
    value: 'Waiting for a new session in this workspace',
    tag: 'output',
    evidence: ['  Start a new Claude Code session in <workspace-path> to pick it up.'],
  },
];

export const SESSION_META: Record<string, StepMeta> = {
  N2: {
    phase: PHASE,
    title: 'Check that it is recording',
    explain:
      'Runs every health check. After real work in Claude Code all six pass: the hooks are registered, the database exists, and the last event was a minute ago.',
    inspector: {
      heading: 'Installation state',
      summary: 'Six checks, six passes. Velra is installed, switched on and recording.',
      fields: [
        { label: 'Settings file', value: 'Parses', tag: 'output', evidence: ['✓ settings parse:'] },
        { label: 'Binary', value: 'Found', tag: 'output', evidence: ['✓ binary:'] },
        {
          label: 'Hook handlers',
          value: '13 registered across 10 events',
          tag: 'output',
          evidence: ['✓ 13 hook handlers registered across 10 events'],
        },
        {
          label: 'Database',
          value: 'WAL, schema v3',
          tag: 'output',
          evidence: ['✓ database: WAL, schema v3'],
          detail:
            'Velra has no database until it records its first hook event, so a database that opens means recording has happened.',
        },
        {
          label: 'Last hook event',
          value: '1m ago',
          tag: 'output',
          evidence: ['✓ last hook event 1m ago'],
          detail: 'Recent activity: Velra is seeing events from the session that is running.',
        },
        { label: 'Error log', value: 'No recent errors', tag: 'output', evidence: ['✓ no recent errors'] },
      ],
    },
  },
  N3: {
    phase: PHASE,
    title: 'Preview the current session',
    explain:
      "With no session named, inspect previews this workspace's most recent one: its objective, its rules, where it got to, and what was undone.",
    inspector: {
      heading: 'Capsule preview',
      summary: 'A full capsule: an objective, three constraints, the latest message and two reverted edits.',
      fields: capsuleFields({
        opening:
          '<VELRA_WORKSPACE_STATE v="1" checkpoint="preview" captured="2026-10-11T13:51:19Z" trigger="cli">',
        record: 'checkpoint "preview", trigger "cli"',
        workspaceState: 'main @ 1569e7b | 77 edits this task | last test run: PASS',
        recordDetail: 'Full detail for any section: `velra inspect --section <name>`',
      }),
    },
  },
  N4: {
    phase: PHASE,
    title: 'Find the session to continue',
    explain:
      'Lists the sessions this workspace has seen. has_state: true means Velra recorded it, so it can be restored. This is also where the full session id comes from.',
    inspector: {
      heading: 'Session list',
      summary: 'One session in this workspace, and it holds recorded state.',
      fields: [
        {
          label: 'Sessions listed',
          value: '1',
          tag: 'output',
          evidence: ['  "sessions": ['],
          detail: 'Counted from the entries in this output.',
        },
        {
          label: 'With task state',
          value: '1',
          tag: 'output',
          evidence: ['      "has_state": true'],
          detail: 'has_state: true means Velra recorded this session, so it can be restored.',
        },
        {
          label: 'Title',
          value: 'null',
          tag: 'output',
          evidence: ['      "title": null,'],
          detail: 'This session has no title, so the picker shows its id instead.',
        },
      ],
    },
  },
  N5: {
    phase: PHASE,
    title: 'Preview the capsule',
    explain:
      'Shows exactly what would be carried over: the objective, the rules that were stated, the latest message, the workspace state and the edits that were reverted. Nothing is staged by this.',
    inspector: {
      heading: 'Capsule preview',
      summary: 'The whole record for the named session. Every labelled section is OBSERVED.',
      fields: capsuleFields({
        opening:
          '<VELRA_WORKSPACE_STATE v="1" checkpoint="preview" captured="2026-10-11T13:52:03Z" trigger="cli">',
        record: 'checkpoint "preview", trigger "cli"',
        workspaceState: 'main @ 1569e7b | 77 edits this task | last test run: PASS',
        recordDetail: 'Full detail for any section: `velra inspect --section <name>`',
      }),
    },
  },
  N10: {
    phase: PHASE,
    title: 'Preview what would be staged',
    explain:
      'With --dry-run, restore prints the capsule it would stage and stages nothing. The record now says checkpoint "restore", and describes itself as another session\'s record.',
    inspector: {
      heading: 'Capsule, as it would be staged',
      summary: 'The same record, now addressed to a different session than the one that produced it.',
      fields: [
        ...capsuleFields({
          opening: '<VELRA_WORKSPACE_STATE v="1" checkpoint="restore" captured="2026-10-11T14:11:55Z">',
          record: 'checkpoint "restore"',
          workspaceState: 'main @ 1569e7b | 79 edits this task | last test run: PASS',
          recordDetail: 'Full detail: `velra inspect --session <session-id> --section <name>`',
        }),
        {
          label: 'Addressed to',
          value: 'Another session',
          tag: 'output',
          evidence: ["Velra logged another session's prompts and tool events"],
          detail:
            "The preview said this session's own prompts. The restore capsule says another session's, because it will be read by a new session, and it names the source by id.",
        },
      ],
    },
  },
  N11: {
    phase: PHASE,
    title: 'Stage it for the next session',
    explain:
      'Renders that state into a capsule and stages it locally: an objective, 2 dead ends and 8 files, in 706 estimated tokens.',
    inspector: {
      heading: 'Staged capsule',
      summary: 'One command names the source session. Velra stages its state and says where to pick it up.',
      fields: STAGED_FIELDS(
        '~\\.velra\\staged\\<workspace-id>\\capsule.01791727924063563000-fb20325574e807f12f75.json',
      ),
    },
  },
  N12: {
    phase: PHASE,
    title: 'Stage it from the picker',
    explain:
      'Without a session id, restore lists the sessions and asks which one. Choosing 1 stages it, in a new capsule file that replaces the one staged a moment before.',
    inspector: {
      heading: 'Staged capsule',
      summary: 'The same result by a different route: no id to copy, just a choice from a list.',
      fields: [
        {
          label: 'Sessions offered',
          value: '1, with state: yes',
          tag: 'output',
          evidence: ['state: yes'],
        },
        {
          label: 'Answer',
          value: '1',
          tag: 'output',
          evidence: ['Select [1-1] (q to cancel): 1'],
          detail: 'Answering q instead cancels, and nothing is staged.',
        },
        ...STAGED_FIELDS(
          '~\\.velra\\staged\\<workspace-id>\\capsule.01791727933266666100-16dd880863fb5bd2187d.json',
        ),
        {
          label: 'Earlier capsule',
          value: 'Replaced',
          tag: 'noted',
          detail:
            "From Velra's restore documentation: staging again replaces the staged record, and there is only ever one live record per workspace. The file name here differs from the one in the previous step.",
        },
      ],
    },
  },
  N13: {
    phase: PHASE,
    title: 'Confirm it is waiting',
    explain:
      'The Staged line shows what is waiting, its size, and the session it came from. It will be delivered when a new session starts in this workspace.',
    inspector: {
      heading: 'Staged capsule',
      summary: 'Status is the one place a waiting capsule is visible without opening the file.',
      fields: [
        {
          label: 'Staged',
          value: 'objective, 2 dead ends, 8 files (706 tokens)',
          tag: 'output',
          evidence: [
            '  Staged:      objective, 2 dead ends, 8 files (706 tokens) from session <session-id>',
          ],
        },
        {
          label: 'Source session',
          value: 'Named by its short id',
          tag: 'output',
          evidence: ['from session <session-id>'],
          detail: 'The capsule always names the session it came from. The session that receives it keeps its own id.',
        },
        {
          label: 'Delivered on',
          value: 'SessionStart(startup)',
          tag: 'output',
          evidence: ['delivered on SessionStart(startup)'],
          detail: "Only a brand-new session consumes it. By Velra's documentation, clear, resume, compact and fork leave it staged.",
        },
        {
          label: 'Hooks',
          value: 'Enabled, 13 handlers registered',
          tag: 'output',
          evidence: ['✓ Enabled (13 hook handlers registered)'],
        },
        {
          label: 'Database',
          value: '864 KiB',
          tag: 'output',
          evidence: ['velra.db (864 KiB)'],
        },
        {
          label: 'Tracking',
          value: '4 sessions, 361 events',
          tag: 'output',
          evidence: ['  Tracking:    4 session(s), 361 event(s)'],
        },
      ],
    },
  },
};
