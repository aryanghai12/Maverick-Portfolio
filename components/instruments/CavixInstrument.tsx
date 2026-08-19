'use client';

import { useStagedReveal } from '@/lib/useStagedReveal';

/**
 * Cavix, shown as the thing it actually produces: a review comment assembling
 * itself. Not a screenshot but a reconstruction, using the real output vocabulary
 * from the project's own README (geometric severity marks, no emoji anywhere,
 * the sandbox transcript with real exit codes).
 *
 * The point of the sequence is the last four lines. The exploit runs and
 * succeeds, the fix is applied, the exploit runs again and fails, the suite is
 * still green. That is the whole product in four lines of terminal output.
 */

const scope: [string, string, string][] = [
  ['◇', 'Deep Scan', '2 subsystems · 3 changed regions · TypeScript'],
  ['◇', 'Symbol Scope', 'issueRefund, onWebhook'],
  ['⬢', 'AST Verification', '128 symbols resolved, cross-file impact mapped'],
  ['▲', 'Security Gate', '1 exposure, highest critical'],
  ['⬢', 'Execution Proof', '1 of 4 findings reproduced, 3 discarded'],
];

const transcript: [string, string, string][] = [
  ['[repro]', 'node --test webhook.exploit.test.mjs', 'exit 0   exploit succeeded'],
  ['[fix]', 'applied suggested patch', ''],
  ['[repro]', 'node --test webhook.exploit.test.mjs', 'exit 1   exploit blocked'],
  ['[suite]', 'node --test', 'exit 0   suite still green'],
];

/** Total staged steps: header, five scope rows, the finding, four transcript lines. */
const STEPS = 1 + scope.length + 1 + transcript.length;

export function CavixInstrument() {
  const { ref, step } = useStagedReveal(STEPS, { interval: 190, threshold: 0.3 });

  const at = (i: number) => (step > i ? 'opacity-100' : 'opacity-0');

  return (
    <div ref={ref} className="inst-terminal overflow-hidden">
      {/* Check run header */}
      <div
        className={`flex items-center gap-3 border-b border-[var(--hair-soft)] px-4 py-3 transition-opacity duration-500 sm:px-5 ${at(0)}`}
      >
        <span aria-hidden className="u-mono text-[0.7rem] text-[var(--accent)]">
          ◈
        </span>
        <span className="u-mono text-[0.72rem] font-bold tracking-[-0.02em] text-[var(--bone)]">
          Cavix Review
        </span>
        <span className="t-label ml-auto !text-[0.58rem] !text-[var(--add)]">success</span>
      </div>

      <div className="px-4 py-5 font-[family-name:var(--font-mono)] text-[clamp(0.66rem,0.6rem+0.28vw,0.75rem)] leading-[1.7] sm:px-5">
        <div className={`t-label !text-[0.56rem] transition-opacity duration-500 ${at(0)}`}>
          review scope &amp; effort
        </div>

        {/* Scope table */}
        <dl className="mt-3 grid grid-cols-[1rem_auto_minmax(0,1fr)] gap-x-3 gap-y-[6px] sm:gap-x-4">
          {scope.map(([mark, signal, reading], i) => (
            <div
              key={signal}
              className={`col-span-3 grid min-w-0 grid-cols-subgrid transition-opacity duration-500 ${at(1 + i)}`}
            >
              <span
                aria-hidden
                className={mark === '▲' ? 'text-[var(--accent)]' : 'text-[var(--mute)]'}
              >
                {mark}
              </span>
              <dt className="truncate text-[var(--bone-dim)]">{signal}</dt>
              <dd className="m-0 truncate text-[var(--mute)]">{reading}</dd>
            </div>
          ))}
        </dl>

        {/* The finding */}
        <div
          className={`mt-5 border-l-2 border-[var(--del)] bg-[rgba(255,255,255,0.035)] py-3 pl-4 transition-opacity duration-500 ${at(1 + scope.length)}`}
        >
          <div className="flex items-start gap-2">
            <span aria-hidden className="text-[var(--del)]">
              ◆
            </span>
            <p className="m-0 text-[var(--bone)]">
              Refund amount is taken from the untrusted webhook body
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['⬢ verified', 'critical', 'security'].map((chip) => (
              <span
                key={chip}
                className="rounded-[3px] border border-[var(--edge)] bg-[var(--panel-0)] px-1.5 py-[2px] text-[0.6rem] text-[var(--bone-dim)]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Sandbox transcript, the payload of the whole instrument.
            .code-surface sets its own font-size, so the size has to be restated
            here or these lines render larger than the panel and overflow. */}
        <div className="code-surface mt-5 px-3 py-3 text-[clamp(0.58rem,0.5rem+0.28vw,0.7rem)] sm:px-4">
          <div className="t-label mb-2 !text-[0.54rem]">sealed sandbox · no network egress</div>
          {/* A grid, not flex-wrap: the result column has to line up across all
              four rows, and a wrapped result reads as a different kind of line. */}
          <div className="grid grid-cols-[auto_1fr_auto] gap-x-2 whitespace-nowrap">
            {transcript.map(([tag, cmd, result], i) => {
              const passed = result.startsWith('exit 1') || result.includes('still green');
              return (
                <div
                  key={i}
                  className={`col-span-3 grid grid-cols-subgrid transition-opacity duration-500 ${at(
                    2 + scope.length + i,
                  )}`}
                >
                  <span className="text-[var(--accent)]">{tag}</span>
                  <span className="text-[var(--bone-dim)]">{cmd}</span>
                  <span
                    className={passed ? 'text-[var(--add)]' : 'text-[var(--del)]'}
                  >
                    {result}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
