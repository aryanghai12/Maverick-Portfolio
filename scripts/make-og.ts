/**
 * Renders public/og.png from data/stats.json.
 *
 * The share card carries figures, and figures on this project are not allowed
 * to be typed by hand. So the card is generated from the same measured
 * snapshot the page reads, rather than being a picture somebody edited once and
 * forgot.
 *
 * It is not part of `next build`. Rendering needs a real browser, and requiring
 * Chrome in a deploy image to produce one static asset is a bad trade. Run it
 * yourself after the figures move:
 *
 *   npm run og
 *
 * Needs Chrome or Chromium on PATH. If neither is present it says so and exits
 * without touching the existing card.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import stats from '../data/stats.json' with { type: 'json' };

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'og.png');

const CNCF_ORGS = new Set(['kubescape', 'openyurtio']);

const HEADLINE = 'I build software that proves it is right before it says it is.';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aryanghai.in').replace(
  /^https?:\/\//,
  '',
);

const BROWSERS = [
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser',
];

const figures = [
  { n: stats.merged.trueUpstream, label: 'merged upstream' },
  { n: stats.merged.trueUpstreamRepoCount, label: "repos I don't own" },
  {
    n: new Set(
      stats.upstreamRepos.filter((r) => CNCF_ORGS.has(r.org)).map((r) => r.org),
    ).size,
    label: 'CNCF projects',
  },
];

function html() {
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;background:#0e0e11;color:#f4f4f6;
       font-family:Geist,system-ui,sans-serif;padding:74px 78px;
       display:flex;flex-direction:column;justify-content:space-between;
       position:relative;overflow:hidden}
  .bars{position:absolute;inset:0;opacity:.5}
  .bar{position:absolute;height:3px;background:#2a2a31;border-radius:2px}
  .eyebrow{font-family:'Geist Mono',monospace;font-size:19px;letter-spacing:.16em;
           text-transform:uppercase;position:relative}
  .eyebrow span{color:#7c7c86;margin-left:14px}
  h1{font-size:74px;line-height:1.06;letter-spacing:-.038em;font-weight:600;
     max-width:19ch;position:relative}
  .row{display:flex;gap:56px;position:relative;
       border-top:1px solid rgba(255,255,255,.09);padding-top:26px}
  .n{font-family:'Geist Mono',monospace;font-size:44px;font-weight:500;
     letter-spacing:-.045em;line-height:1}
  .l{font-family:'Geist Mono',monospace;font-size:14px;letter-spacing:.15em;
     text-transform:uppercase;color:#7c7c86;margin-top:10px}
</style></head><body>
<div class="bars" id="b"></div>
<div class="eyebrow">Aryan Ghai <span>Backend &amp; Systems Engineer</span></div>
<h1>${HEADLINE}</h1>
<div class="row">
  ${figures.map((f) => `<div><div class="n">${f.n}</div><div class="l">${f.label}</div></div>`).join('')}
  <div style="margin-left:auto;align-self:flex-end"><div class="l" style="margin:0">${SITE}</div></div>
</div>
<script>
  // Seeded, so the card is byte-identical between runs unless a figure changes.
  let s=1,r=()=>((s=(s*16807)%2147483647)/2147483647),h='';
  for(let i=0;i<150;i++){
    const x=r()<.5?r()*300:900+r()*300;
    h+='<div class="bar" style="left:'+x+'px;top:'+(r()*630)+'px;width:'+(30+r()*170)+'px;opacity:'+(.25+r()*.6)+'"></div>';
  }
  document.getElementById('b').innerHTML=h;
</script></body></html>`;
}

async function firstBrowser() {
  for (const bin of BROWSERS) {
    try {
      await run('which', [bin]);
      return bin;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

async function main() {
  const browser = await firstBrowser();
  if (!browser) {
    console.error(
      '✕ No Chrome or Chromium on PATH, so public/og.png was left as it is.\n' +
        `  Tried: ${BROWSERS.join(', ')}`,
    );
    process.exit(1);
  }

  const page = join(tmpdir(), `og-${Date.now()}.html`);
  await writeFile(page, html(), 'utf8');
  await mkdir(dirname(OUT), { recursive: true });

  await run(browser, [
    '--headless=new',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1200,630',
    '--virtual-time-budget=6000',
    `--screenshot=${OUT}`,
    `file://${page}`,
  ]);

  console.log(
    `✓ public/og.png rendered with ${browser}\n` +
      `  ${figures.map((f) => `${f.n} ${f.label}`).join(' · ')}`,
  );
}

main().catch((err) => {
  console.error('✕ og render failed:', err.message ?? err);
  process.exit(1);
});
