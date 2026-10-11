/**
 * Playback for the /velra replay, as a pure state machine.
 *
 * It knows nothing about React, the DOM or what a transcript says. It is given
 * the shape of each step (how many characters to type, how many rows of output
 * to reveal) and answers two questions: what is the next state, and how long
 * until the next tick. The component owns the timer and nothing else.
 *
 * Keeping it pure is what makes the behaviour testable without a browser, and
 * it is why Pause can never lose a step: there is no hidden timer state to
 * fall out of sync with what is on screen.
 *
 * A step moves through four stages:
 *
 *   typing   the command appears a few characters at a time
 *   running  a short beat between the command and its output
 *   output   rows are revealed in order
 *   done     everything is on screen
 */

export type Stage = 'typing' | 'running' | 'output' | 'done';

export const SPEEDS = [0.75, 1, 1.5, 2] as const;
export type Speed = (typeof SPEEDS)[number];

export interface StepShape {
  /** Characters in the command. Zero for a block that is not a command. */
  chars: number;
  /** Rows of output, editorial markers included. */
  rows: number;
}

export interface PlayerState {
  shapes: StepShape[];
  index: number;
  /** Characters of the command shown so far. */
  typed: number;
  /** Rows of output shown so far. */
  rows: number;
  stage: Stage;
  playing: boolean;
  speed: Speed;
  /** Set when the visitor prefers reduced motion: steps appear whole. */
  instant: boolean;
}

export type PlayerAction =
  | { type: 'load'; shapes: StepShape[]; index?: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'toggle' }
  | { type: 'restart' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'select'; index: number }
  | { type: 'speed'; speed: Speed }
  | { type: 'instant'; instant: boolean }
  | { type: 'tick' };

const EMPTY: StepShape = { chars: 0, rows: 0 };

function shapeAt(state: PlayerState, index = state.index): StepShape {
  return state.shapes[index] ?? EMPTY;
}

function clamp(index: number, state: PlayerState): number {
  return Math.max(0, Math.min(index, state.shapes.length - 1));
}

/** A step with everything on screen, and playback stopped. */
function shown(state: PlayerState, index: number): PlayerState {
  const i = clamp(index, state);
  const shape = shapeAt(state, i);
  return { ...state, index: i, typed: shape.chars, rows: shape.rows, stage: 'done', playing: false };
}

/** A step at its very beginning, ready to animate. */
function fresh(state: PlayerState, index: number, playing: boolean): PlayerState {
  const i = clamp(index, state);
  const shape = shapeAt(state, i);
  if (state.instant) {
    return { ...state, index: i, typed: shape.chars, rows: shape.rows, stage: 'done', playing };
  }
  return {
    ...state,
    index: i,
    typed: 0,
    rows: 0,
    stage: shape.chars > 0 ? 'typing' : shape.rows > 0 ? 'output' : 'done',
    playing,
  };
}

export function initialState(shapes: StepShape[]): PlayerState {
  return shown(
    { shapes, index: 0, typed: 0, rows: 0, stage: 'done', playing: false, speed: 1, instant: false },
    0,
  );
}

/* A command of any length types in about a second, and an output block of any
   length reveals in about two. A 126-line JSON listing should not take ten
   times as long to arrive as a one-line version string. */
const TYPE_TICKS = 34;
const ROW_TICKS = 44;

export function typeChunk(chars: number): number {
  return Math.max(1, Math.ceil(chars / TYPE_TICKS));
}

export function rowChunk(rows: number): number {
  return Math.max(1, Math.ceil(rows / ROW_TICKS));
}

function tick(state: PlayerState): PlayerState {
  const shape = shapeAt(state);

  switch (state.stage) {
    case 'typing': {
      const typed = Math.min(shape.chars, state.typed + typeChunk(shape.chars));
      return typed >= shape.chars
        ? { ...state, typed, stage: 'running' }
        : { ...state, typed };
    }
    case 'running':
      return shape.rows > 0 ? { ...state, stage: 'output', rows: 0 } : { ...state, stage: 'done' };
    case 'output': {
      const rows = Math.min(shape.rows, state.rows + rowChunk(shape.rows));
      return rows >= shape.rows ? { ...state, rows, stage: 'done' } : { ...state, rows };
    }
    case 'done':
      // The end of the run stops and stays stopped until the visitor restarts.
      if (state.index >= state.shapes.length - 1) return { ...state, playing: false };
      return fresh(state, state.index + 1, true);
  }
}

export function reduce(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'load':
      return shown({ ...state, shapes: action.shapes }, action.index ?? 0);

    case 'play':
      if (state.playing || state.shapes.length === 0) return state;
      // From a finished step, play that step again. From a paused one, carry on.
      return state.stage === 'done' ? fresh(state, state.index, true) : { ...state, playing: true };

    case 'pause':
      return state.playing ? { ...state, playing: false } : state;

    case 'toggle':
      return reduce(state, { type: state.playing ? 'pause' : 'play' });

    case 'restart':
      return state.shapes.length === 0 ? state : fresh(state, 0, true);

    case 'next':
      return shown(state, state.index + 1);

    case 'prev':
      return shown(state, state.index - 1);

    case 'select':
      return shown(state, action.index);

    case 'speed':
      return { ...state, speed: action.speed };

    case 'instant':
      if (state.instant === action.instant) return state;
      // Never leave a half-typed command on screen for someone who asked for no motion.
      return action.instant
        ? { ...shown(state, state.index), instant: true, playing: state.playing }
        : { ...state, instant: false };

    case 'tick':
      return state.playing ? tick(state) : state;
  }
}

/**
 * Milliseconds until the next tick, or null when nothing is scheduled.
 *
 * The hold on a finished step grows with the amount of output, so a long
 * listing stays readable for longer than a single line does.
 */
export function delay(state: PlayerState): number | null {
  if (!state.playing) return null;
  const shape = shapeAt(state);
  let ms: number;
  switch (state.stage) {
    case 'typing':
      ms = 30;
      break;
    case 'running':
      ms = 300;
      break;
    case 'output':
      ms = 46;
      break;
    case 'done':
      ms = (state.instant ? 2600 : 1500) + Math.min(2200, shape.rows * 45);
      break;
  }
  return Math.round(ms / state.speed);
}

/** Overall progress through the run, from 0 to 1, for the progress rail. */
export function progress(state: PlayerState): number {
  const total = state.shapes.length;
  if (total === 0) return 0;
  const shape = shapeAt(state);
  const units = shape.chars + shape.rows;
  const within = units === 0 || state.stage === 'done' ? 1 : (state.typed + state.rows) / units;
  return Math.min(1, (state.index + within) / total);
}
