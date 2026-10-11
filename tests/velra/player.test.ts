/**
 * Playback behaviour for the /velra replay.
 *
 * Run with `npm test`. These drive the pure state machine in lib/velra/player.ts
 * with no browser, so every control the page exposes has a check behind it.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  delay,
  initialState,
  progress,
  reduce,
  type PlayerAction,
  type PlayerState,
  type StepShape,
} from '../../lib/velra/player';

const SHAPES: StepShape[] = [
  { chars: 12, rows: 3 },
  { chars: 40, rows: 126 },
  { chars: 0, rows: 1 },
];

const run = (state: PlayerState, ...actions: PlayerAction['type'][]) =>
  actions.reduce((s, type) => reduce(s, { type } as PlayerAction), state);

/** Ticks until playback stops, and fails rather than looping forever. */
function playOut(state: PlayerState): { state: PlayerState; visited: number[] } {
  const visited = [state.index];
  let s = state;
  for (let i = 0; i < 5000 && s.playing; i++) {
    s = reduce(s, { type: 'tick' });
    if (visited[visited.length - 1] !== s.index) visited.push(s.index);
  }
  assert.equal(s.playing, false, 'playback should come to a stop');
  return { state: s, visited };
}

test('starts on the first step, fully shown and paused', () => {
  const s = initialState(SHAPES);
  assert.deepEqual(
    { index: s.index, typed: s.typed, rows: s.rows, stage: s.stage, playing: s.playing },
    { index: 0, typed: 12, rows: 3, stage: 'done', playing: false },
  );
  assert.equal(delay(s), null);
});

test('play starts from the active step and types it from the beginning', () => {
  const s = reduce(reduce(initialState(SHAPES), { type: 'select', index: 1 }), { type: 'play' });
  assert.equal(s.index, 1);
  assert.equal(s.playing, true);
  assert.equal(s.stage, 'typing');
  assert.equal(s.typed, 0);
  assert.equal(s.rows, 0);
});

test('a step moves through typing, running, output and done in order', () => {
  let s = reduce(initialState(SHAPES), { type: 'play' });
  const stages = [s.stage];
  while (s.index === 0 && s.playing) {
    s = reduce(s, { type: 'tick' });
    if (s.index === 0 && stages[stages.length - 1] !== s.stage) stages.push(s.stage);
  }
  assert.deepEqual(stages, ['typing', 'running', 'output', 'done']);
});

test('playback visits every step in order, stops at the end and stays stopped', () => {
  const { state, visited } = playOut(reduce(initialState(SHAPES), { type: 'play' }));
  assert.deepEqual(visited, [0, 1, 2]);
  assert.equal(state.index, 2);
  assert.equal(state.stage, 'done');
  assert.equal(reduce(state, { type: 'tick' }), state, 'a tick after the end changes nothing');
});

test('every step ends with its whole command and all of its output on screen', () => {
  let s = reduce(initialState(SHAPES), { type: 'play' });
  const complete = new Map<number, boolean>();
  for (let i = 0; i < 5000 && s.playing; i++) {
    s = reduce(s, { type: 'tick' });
    if (s.stage === 'done') {
      complete.set(s.index, s.typed === SHAPES[s.index].chars && s.rows === SHAPES[s.index].rows);
    }
  }
  assert.deepEqual([...complete.values()], [true, true, true]);
});

test('pause keeps the current step and what has been revealed so far', () => {
  let s = reduce(initialState(SHAPES), { type: 'play' });
  for (let i = 0; i < 5; i++) s = reduce(s, { type: 'tick' });
  const paused = reduce(s, { type: 'pause' });
  assert.equal(paused.playing, false);
  assert.equal(paused.index, s.index);
  assert.equal(paused.typed, s.typed);
  assert.equal(reduce(paused, { type: 'tick' }), paused, 'a paused player ignores ticks');

  const resumed = reduce(paused, { type: 'play' });
  assert.equal(resumed.typed, paused.typed, 'resuming carries on rather than starting over');
  assert.equal(resumed.playing, true);
});

test('toggle alternates between playing and paused', () => {
  const s = initialState(SHAPES);
  assert.equal(run(s, 'toggle').playing, true);
  assert.equal(run(s, 'toggle', 'toggle').playing, false);
});

test('restart returns to the first step and plays', () => {
  const end = playOut(reduce(initialState(SHAPES), { type: 'play' })).state;
  const s = reduce(end, { type: 'restart' });
  assert.equal(s.index, 0);
  assert.equal(s.playing, true);
  assert.equal(s.typed, 0);
});

test('next and back select the right step, show it whole, and stop at the ends', () => {
  const s0 = initialState(SHAPES);
  const s1 = reduce(s0, { type: 'next' });
  assert.deepEqual([s1.index, s1.stage, s1.rows, s1.playing], [1, 'done', 126, false]);
  assert.equal(run(s0, 'next', 'next', 'next', 'next').index, 2, 'next stops at the last step');
  assert.equal(run(s0, 'prev').index, 0, 'back stops at the first step');
  assert.equal(run(s0, 'next', 'next', 'prev').index, 1);
});

test('moving between steps pauses autoplay', () => {
  const playing = reduce(initialState(SHAPES), { type: 'play' });
  assert.equal(reduce(playing, { type: 'next' }).playing, false);
  assert.equal(reduce(playing, { type: 'select', index: 2 }).playing, false);
});

test('selecting a step jumps straight to it and clamps out-of-range indexes', () => {
  const s = initialState(SHAPES);
  assert.equal(reduce(s, { type: 'select', index: 2 }).index, 2);
  assert.equal(reduce(s, { type: 'select', index: 99 }).index, 2);
  assert.equal(reduce(s, { type: 'select', index: -4 }).index, 0);
});

test('loading a different set of steps replaces them and resets cleanly', () => {
  const playing = reduce(reduce(initialState(SHAPES), { type: 'select', index: 2 }), { type: 'play' });
  const other: StepShape[] = [{ chars: 5, rows: 2 }, { chars: 9, rows: 9 }];
  const s = reduce(playing, { type: 'load', shapes: other });
  assert.deepEqual(
    [s.shapes, s.index, s.typed, s.rows, s.stage, s.playing],
    [other, 0, 5, 2, 'done', false],
  );
  assert.equal(reduce(playing, { type: 'load', shapes: other, index: 1 }).index, 1);
});

test('speed changes the timing and nothing else', () => {
  const s = reduce(initialState(SHAPES), { type: 'play' });
  const slow = reduce(s, { type: 'speed', speed: 0.75 });
  const fast = reduce(s, { type: 'speed', speed: 2 });
  assert.ok(delay(slow)! > delay(s)!);
  assert.ok(delay(fast)! < delay(s)!);
  assert.equal(fast.index, s.index);
  assert.equal(fast.playing, true);
});

test('a long output takes about as long to arrive as a short one', () => {
  const ticksFor = (shape: StepShape) => {
    let s = reduce(initialState([shape, { chars: 1, rows: 1 }]), { type: 'play' });
    let n = 0;
    while (s.index === 0 && s.stage !== 'done') {
      s = reduce(s, { type: 'tick' });
      n++;
    }
    return n;
  };
  assert.ok(ticksFor({ chars: 40, rows: 126 }) < 100);
});

test('reduced motion shows each step whole instead of typing it', () => {
  let s = reduce(initialState(SHAPES), { type: 'instant', instant: true });
  s = reduce(s, { type: 'play' });
  assert.deepEqual([s.stage, s.typed, s.rows, s.playing], ['done', 12, 3, true]);
  s = reduce(s, { type: 'tick' });
  assert.deepEqual([s.index, s.stage, s.typed, s.rows], [1, 'done', 40, 126]);
  assert.deepEqual(playOut(s).visited, [1, 2]);
});

test('switching to reduced motion mid-animation never leaves a half-typed command', () => {
  let s = reduce(initialState(SHAPES), { type: 'play' });
  s = reduce(s, { type: 'tick' });
  assert.ok(s.typed < 12);
  s = reduce(s, { type: 'instant', instant: true });
  assert.deepEqual([s.typed, s.rows, s.stage], [12, 3, 'done']);
});

test('progress only moves forward during playback and ends at 1', () => {
  let s = reduce(initialState(SHAPES), { type: 'play' });
  let last = progress(s);
  for (let i = 0; i < 5000 && s.playing; i++) {
    s = reduce(s, { type: 'tick' });
    const p = progress(s);
    assert.ok(p >= last - 1e-9, `progress went backwards at tick ${i}`);
    last = p;
  }
  assert.equal(progress(s), 1);
});

test('an empty run is inert', () => {
  const s = initialState([]);
  assert.equal(run(s, 'play').playing, false);
  assert.equal(run(s, 'restart').playing, false);
  assert.equal(progress(s), 0);
});
