'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { CapsuleInspector } from './CapsuleInspector';
import { HandoffGuide } from './HandoffGuide';
import { ReplayRail } from './ReplayRail';
import { RichText, TerminalLine, isJson } from './TerminalLine';
import {
  IconCheck,
  IconCopy,
  IconInfo,
  IconNext,
  IconPause,
  IconPlay,
  IconPrev,
  IconRestart,
} from './icons';
import { copyText } from '@/lib/velra/clipboard';
import { replay as copy } from '@/lib/velra/content';
import {
  SPEEDS,
  delay,
  initialState,
  progress,
  reduce,
  type StepShape,
} from '@/lib/velra/player';
import {
  MODES,
  MODE_ORDER,
  commandText,
  hasOutput,
  outputText,
  stepsFor,
} from '@/lib/velra/transcripts';
import { PROVENANCE_LABEL, type ModeId, type Step } from '@/lib/velra/types';

/** Fired by the page's "Run the walkthrough" buttons. */
export const PLAY_EVENT = 'velra:play';

const ENV_LABEL = { windows: 'Windows', linux: 'Linux', docs: 'Velra docs' } as const;

const shapeOf = (step: Step): StepShape => ({
  chars: step.command?.length ?? 0,
  rows: step.output.length,
});

const INITIAL_MODE: ModeId = 'story';
const INITIAL_STEPS = stepsFor(INITIAL_MODE);

/**
 * The interactive replay.
 *
 * Three parts side by side, all driven by one state machine
 * (lib/velra/player.ts): the step rail, the terminal, and the capsule
 * inspector. Above the terminal each step says in plain words what the command
 * is for, so the output underneath has a reason to be read.
 *
 * Nothing here executes anything. It is stored text on a timer, and the
 * caption under it says so.
 *
 * The first step is rendered whole on the server, so the section has real
 * content before any script runs and there is nothing to hydrate differently.
 */
export function Replay() {
  const [modeId, setModeId] = useState<ModeId>(INITIAL_MODE);
  const [railOpen, setRailOpen] = useState(false);
  const [copied, setCopied] = useState<'command' | 'output' | 'failed' | null>(null);

  const steps = useMemo(() => stepsFor(modeId), [modeId]);
  const [player, dispatch] = useReducer(reduce, INITIAL_STEPS.map(shapeOf), initialState);

  const mode = MODES[modeId];
  const index = Math.min(player.index, steps.length - 1);
  const step = steps[index];
  const json = useMemo(() => isJson(step.output), [step]);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const inView = useRef(false);
  const railOpenRef = useRef(railOpen);
  railOpenRef.current = railOpen;

  /* ------------------------------------------------------------- playback */

  // The whole animation: one timer, rescheduled from the state it produced.
  useEffect(() => {
    const ms = delay(player);
    if (ms === null) return;
    const timer = setTimeout(() => dispatch({ type: 'tick' }), ms);
    return () => clearTimeout(timer);
  }, [player]);

  // Reduced motion: steps appear whole, and still advance on a slower beat.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => dispatch({ type: 'instant', instant: query.matches });
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  // A hidden tab should not keep playing to nobody.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) dispatch({ type: 'pause' });
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
      },
      { threshold: 0.25 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  /* "Run the walkthrough" elsewhere on the page: show the walkthrough, bring
     the terminal under the bar, then play from the top.

     The order is the point. The view is switched and committed first, so the
     page has its final layout before the browser works out where to scroll.
     Doing it the other way round let the layout change mid-flight and left the
     terminal a line or two off its mark. Playback waits for the scroll, so the
     first command is not typed while the terminal is still off screen. */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onPlay = () => {
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      clearTimeout(timer);
      flushSync(() => {
        setModeId(INITIAL_MODE);
        setRailOpen(false);
        dispatch({ type: 'load', shapes: stepsFor(INITIAL_MODE).map(shapeOf) });
      });
      stageRef.current?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
      timer = setTimeout(() => dispatch({ type: 'restart' }), still ? 0 : 700);
    };
    window.addEventListener(PLAY_EVENT, onPlay);
    return () => {
      window.removeEventListener(PLAY_EVENT, onPlay);
      clearTimeout(timer);
    };
  }, []);

  /* --------------------------------------------------------------- scroll */

  /* While playing, follow the output as it arrives. A guide has no output
     arriving. It is read from the top, so it is never followed to its end. */
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (body && player.playing && !step.guide) body.scrollTop = body.scrollHeight;
  }, [player.playing, player.rows, player.typed, player.stage, step.guide]);

  // A step opened by hand starts at its first line, and a guide always does.
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (body && (!player.playing || step.guide)) body.scrollTop = 0;
    // Only when the step itself changes, not on every pause.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, modeId]);

  useEffect(() => {
    setCopied(null);
  }, [step.id, modeId]);

  /* -------------------------------------------------------------- actions */

  const pause = useCallback(() => dispatch({ type: 'pause' }), []);

  const changeMode = useCallback((next: ModeId) => {
    setModeId(next);
    dispatch({ type: 'load', shapes: stepsFor(next).map(shapeOf) });
  }, []);

  const selectStep = useCallback((i: number) => {
    dispatch({ type: 'select', index: i });
    setRailOpen(false);
  }, []);

  const doCopy = useCallback(
    async (what: 'command' | 'output') => {
      pause();
      const ok = await copyText(what === 'command' ? commandText(step) : outputText(step));
      setCopied(ok ? what : 'failed');
    },
    [pause, step],
  );

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2200);
    return () => clearTimeout(timer);
  }, [copied]);

  /* ------------------------------------------------------------- keyboard */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
        return;
      }
      const root = rootRef.current;
      if (!root) return;
      const inside = !!target && root.contains(target);

      if (e.key === 'Escape') {
        if (railOpenRef.current) {
          setRailOpen(false);
          toggleRef.current?.focus();
        }
        return;
      }

      /* Keys act when focus is in the replay, or when nothing is focused and
         the replay is on screen. They never act from another part of the page,
         so arrow keys and Space keep their normal meaning everywhere else. */
      const idle = !target || target === document.body || target === document.documentElement;
      if (!inside && !(idle && inView.current)) return;

      if (e.key === ' ' || e.code === 'Space') {
        // On a control, Space already means "press this". Leave it alone.
        if (target && /^(BUTTON|A|SUMMARY)$/.test(target.tagName)) return;
        e.preventDefault();
        dispatch({ type: 'toggle' });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        dispatch({ type: 'next' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        dispatch({ type: 'prev' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* --------------------------------------------------------------- render */

  const typing = player.stage === 'typing' || player.stage === 'running';
  const done = player.stage === 'done';
  const shownCommand = step.command ? step.command.slice(0, player.typed) : '';
  const shownOutput = step.output.slice(0, player.rows);
  const settled =
    done && step.command !== null && (step.outputStatus === 'complete' || step.outputStatus === 'empty');
  const canCopyOutput = hasOutput(step);
  const lineCount = step.output.filter((o) => o.kind === 'line').length;

  const status =
    copied === 'command'
      ? 'Command copied.'
      : copied === 'output'
        ? 'Output copied.'
        : copied === 'failed'
          ? 'Copy failed. Select the text in the terminal instead.'
          : '';

  /* A guide has no command or output of its own to copy. What it offers to
     copy sits beside the text, inside the guide, so the bar only names it. */
  const termActions = step.guide ? (
    <span className="vl-guide-chip">{step.guide.label}</span>
  ) : (
    <>
      <button
        type="button"
        className="vl-ctl"
        onClick={() => doCopy('command')}
        disabled={!step.command}
        data-done={copied === 'command' ? '1' : undefined}
        title={step.command ? 'Copy this command' : 'This step is not a command'}
        aria-label={copied === 'command' ? 'Command copied' : 'Copy command'}
      >
        {copied === 'command' ? <IconCheck /> : <IconCopy />}
        {copied === 'command' ? (
          'Copied'
        ) : (
          <span>
            <span className="vl-copy-word">Copy </span>command
          </span>
        )}
      </button>
      <button
        type="button"
        className="vl-ctl"
        onClick={() => doCopy('output')}
        disabled={!canCopyOutput}
        data-done={copied === 'output' ? '1' : undefined}
        title={canCopyOutput ? 'Copy the full output of this step' : 'There is no output to copy'}
        aria-label={copied === 'output' ? 'Output copied' : 'Copy output'}
      >
        {copied === 'output' ? <IconCheck /> : <IconCopy />}
        {copied === 'output' ? (
          'Copied'
        ) : (
          <span>
            <span className="vl-copy-word">Copy </span>output
          </span>
        )}
      </button>
    </>
  );

  return (
    <div ref={rootRef} className="vl-replay">
      <div className="vl-replay-top">
        <div className="vl-seg" role="group" aria-label="Replay source">
          {MODE_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={modeId === id}
              onClick={() => (id === modeId ? undefined : changeMode(id))}
            >
              {MODES[id].label}
            </button>
          ))}
        </div>
        <p className="vl-prov" data-mode={modeId}>
          {mode.provenance}
        </p>
      </div>
      <p className="vl-mode-desc">{mode.description}</p>

      <div ref={stageRef} id="replay-stage" className="vl-stage">
        <ReplayRail
          steps={steps}
          phases={mode.phases}
          index={index}
          onSelect={selectStep}
          open={railOpen}
          onToggle={() => setRailOpen((v) => !v)}
          toggleRef={toggleRef}
        />

        <div className="vl-term" data-env={step.environment}>
          {/* What this step is for, before what it printed. */}
          <div className="vl-explain" key={`${modeId}-${step.id}`}>
            <p className="vl-explain-meta">
              <span className="vl-stepno">
                Step {index + 1} of {steps.length}
              </span>
              <span className="vl-env" data-env={step.environment}>
                {ENV_LABEL[step.environment]} · {step.shell}
              </span>
            </p>
            <h3>{step.title}</h3>
            <p>{step.explain}</p>
          </div>

          <div className="vl-window">
            <div className="vl-term-bar">
              <span className="vl-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="vl-term-title">
                <span className="vl-sr">Workspace: </span>
                <RichText text={step.workspace} />
              </span>
              <span className="vl-term-actions">{termActions}</span>
            </div>

            <div
              ref={bodyRef}
              className="vl-term-body vl-scroll"
              data-guide={step.guide ? '1' : undefined}
              tabIndex={0}
              role="region"
              aria-label={`${step.guide ? 'Verification guide' : 'Terminal'}, step ${index + 1} of ${steps.length}: ${step.title}`}
              onWheel={pause}
              onTouchStart={pause}
              onPointerDown={pause}
            >
              {/* Keyed by step, so the content swap is one short fade and not a jump. */}
              <div key={`${modeId}-${step.id}`} className="vl-term-inner">
                {step.guide ? (
                  <HandoffGuide guide={step.guide} />
                ) : step.command !== null ? (
                  <div className="vl-cmdline">
                    <span
                      className="vl-prompt"
                      data-supplied={step.promptSupplied ? '1' : '0'}
                      title={step.promptSupplied ? undefined : 'The prompt line was not in the supplied source.'}
                    >
                      <RichText text={step.prompt} />{' '}
                    </span>
                    <span className="vl-cmd">
                      <RichText text={shownCommand} />
                    </span>
                    {typing ? <span className="vl-caret" aria-hidden="true" /> : null}
                  </div>
                ) : (
                  <div className="vl-ctxline">{step.contextLabel}</div>
                )}

                {shownOutput.map((item, i) => (
                  <TerminalLine key={i} item={item} json={json} />
                ))}

                {done && step.outputStatus === 'empty' ? (
                  <div className="vl-gap" data-quiet="1" role="note">
                    <b>No output</b>
                    The command printed nothing, and the source records it that way.
                  </div>
                ) : null}

                {settled ? (
                  <div className="vl-cmdline" aria-hidden="true">
                    <span className="vl-prompt" data-supplied={step.promptSupplied ? '1' : '0'}>
                      <RichText text={step.prompt} />{' '}
                    </span>
                    <span className="vl-caret" />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Where this text came from, on every step, like an editor's status bar. */}
            <div className="vl-statusbar">
              <span className="vl-provchip" data-prov={step.provenance}>
                {PROVENANCE_LABEL[step.provenance]}
              </span>
              <span>
                {step.guide
                  ? 'no capture'
                  : lineCount === 0
                    ? 'no output'
                    : lineCount === 1
                      ? '1 line'
                      : `${lineCount} lines`}
              </span>
            </div>
          </div>

          {step.note ? (
            <p className="vl-term-note">
              <IconInfo />
              <span>{step.note}</span>
            </p>
          ) : null}

          <div className="vl-progress" aria-hidden="true">
            <i style={{ transform: `scaleX(${progress(player)})` }} />
          </div>

          <div className="vl-controls">
            <button
              type="button"
              className="vl-ctl vl-ctl-main"
              onClick={() => dispatch({ type: 'toggle' })}
              aria-label={player.playing ? 'Pause playback' : 'Play from this step'}
            >
              {player.playing ? <IconPause /> : <IconPlay />}
              {player.playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="vl-ctl"
              onClick={() => dispatch({ type: 'restart' })}
              aria-label="Restart from the first step"
              title="Restart from the first step"
            >
              <IconRestart />
              <span className="vl-ctl-text">Restart</span>
            </button>

            <span className="vl-stepnav">
              <button
                type="button"
                className="vl-ctl"
                onClick={() => dispatch({ type: 'prev' })}
                disabled={index === 0}
                aria-label="Previous step"
              >
                <IconPrev />
                Back
              </button>
              <button
                type="button"
                className="vl-ctl"
                onClick={() => dispatch({ type: 'next' })}
                disabled={index === steps.length - 1}
                aria-label="Next step"
              >
                Next
                <IconNext />
              </button>
            </span>

            <span className="vl-speed">
              <span className="vl-sr" id="vl-speed-label">
                Playback speed
              </span>
              <span className="vl-seg vl-seg-sm" role="group" aria-labelledby="vl-speed-label">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={player.speed === s}
                    onClick={() => dispatch({ type: 'speed', speed: s })}
                  >
                    {s}x
                  </button>
                ))}
              </span>
            </span>
          </div>
        </div>

        <CapsuleInspector key={`${modeId}-${step.id}`} step={step} />
      </div>

      <div className="vl-replay-foot">
        <span>
          <IconInfo /> {copy.caption}
        </span>
        <span className="vl-keys">{copy.keys}</span>
      </div>

      {/* One polite announcement per step, rather than a stream of typed characters. */}
      <p className="vl-sr" aria-live="polite">
        Step {index + 1} of {steps.length}. {step.title}. {step.explain}
      </p>
      <p className="vl-sr" role="status">
        {status}
      </p>

      <noscript>
        <p className="vl-footnote">
          The replay needs JavaScript to move between steps. The first step is shown above.
        </p>
      </noscript>
    </div>
  );
}
