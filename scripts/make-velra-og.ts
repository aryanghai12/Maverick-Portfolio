/**
 * Renders public/velra-og.png, the share card for /velra.
 *
 * The same approach as scripts/make-og.ts and for the same reason: a card that
 * is generated cannot quietly drift from the page it previews. The headline and
 * tagline are read from lib/velra/content.ts, so they are the page's own words.
 *
 * Not part of `next build`. Rendering needs a real browser, and a deploy image
 * should not need Chrome to produce one static file. Run it after the hero
 * copy changes:
 *
 *   npm run og:velra
 *
 * Looks for Chrome, Chromium or Edge on PATH and in the usual install
 * locations. If none is found it says so and leaves the existing card alone.
 */

import { writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { cta, hero, properties } from '../lib/velra/content';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'velra-og.png');

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aryanghai.in').replace(/^https?:\/\//, '');

const ON_PATH = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome', 'msedge'];
const INSTALLED = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

function html() {
  const [before, accent, after] = hero.headline;
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;padding:68px 76px;position:relative;overflow:hidden;
       display:flex;flex-direction:column;justify-content:space-between;
       background:radial-gradient(760px 420px at 4% 108%,rgba(74,123,255,.3),transparent 66%),
                  radial-gradient(760px 420px at 100% -8%,rgba(255,93,125,.24),transparent 66%),
                  radial-gradient(620px 380px at 62% 40%,rgba(176,107,255,.14),transparent 70%),#070912;
       color:#e9edfb;font-family:'Inter Tight',system-ui,sans-serif}
  .grid{position:absolute;inset:0}
  .grid i{position:absolute;border-radius:50%}
  .brand{display:flex;align-items:center;gap:16px;font-family:'JetBrains Mono',monospace;font-size:32px;font-weight:700;letter-spacing:-.04em;color:#fff;position:relative}
  .mono{font-family:'JetBrains Mono',monospace}
  .eyebrow{font-size:17px;letter-spacing:.14em;text-transform:uppercase;color:#e9edfb;margin-bottom:22px}
  /* Set in the same mono the page is, and the portfolio is. */
  h1{font-family:'JetBrains Mono',monospace;font-size:70px;line-height:1.14;letter-spacing:-.05em;font-weight:700;max-width:24ch;color:#fff;position:relative}
  h1 em{font-style:normal;background:linear-gradient(104deg,#9fbaff,#c79bff 48%,#ff7f99);-webkit-background-clip:text;color:transparent}
  .row{display:flex;align-items:flex-end;gap:38px;position:relative;border-top:1px solid rgba(255,255,255,.14);padding-top:24px}
  .tag{font-size:25px;color:#e9edfb;letter-spacing:-.01em}
  .props{font-size:15px;letter-spacing:.13em;text-transform:uppercase;color:#b6bedb;margin-top:10px}
  .url{margin-left:auto;font-size:17px;color:#7aa2ff}
</style></head><body>
<div class="grid" id="g"></div>
<div class="brand">
  <svg width="54" height="54" viewBox="0 0 28 28"><rect x=".5" y=".5" width="27" height="27" rx="7.5" fill="#121820" stroke="rgba(160,178,200,.34)"/><path d="m7 8.5 5.2 11h1.2L18.6 8.5" fill="none" stroke="#e7ecf2" stroke-width="2.4" stroke-linejoin="round"/><circle cx="21.2" cy="18.6" r="1.7" fill="#73c991"/></svg>
  velra
</div>
<div style="position:relative">
  <div class="eyebrow mono">${hero.eyebrow}</div>
  <h1>${before} <em>${accent}</em> ${after}</h1>
</div>
<div class="row">
  <div>
    <div class="tag">${cta.title.join(' ')}</div>
    <div class="props mono">${properties.map((p) => p.title).join(' · ')}</div>
  </div>
  <div class="url mono">${SITE}/velra</div>
</div>
<script>
  // A still of the field: seeded points, blue at the left edge through violet to red.
  let s=7,r=()=>((s=(s*16807)%2147483647)/2147483647),h='';
  for(let i=0;i<420;i++){
    const x=r(),y=r(),d=1+r()*2.6;
    const c=x<.5?[74+(176-74)*x*2,123+(107-123)*x*2,255]:[176+(255-176)*(x-.5)*2,107+(93-107)*(x-.5)*2,255+(125-255)*(x-.5)*2];
    const edge=Math.min(1,Math.abs(x-.42)*2.4+.12);
    h+='<i style="left:'+(x*1200)+'px;top:'+(y*630)+'px;width:'+d+'px;height:'+d+'px;background:rgb('+c.map(Math.round).join(',')+');opacity:'+(edge*(.25+r()*.6)).toFixed(2)+'"></i>';
  }
  document.getElementById('g').innerHTML=h;
</script>
</body></html>`;
}

async function findBrowser(): Promise<string | null> {
  for (const path of INSTALLED) if (existsSync(path)) return path;
  const probe = process.platform === 'win32' ? 'where' : 'which';
  for (const bin of ON_PATH) {
    try {
      const { stdout } = await run(probe, [bin]);
      const first = stdout.split(/\r?\n/).find(Boolean);
      if (first) return first.trim();
    } catch {
      /* keep looking */
    }
  }
  return null;
}

async function main() {
  const browser = await findBrowser();
  if (!browser) {
    console.error('✕ No Chrome, Chromium or Edge found, so public/velra-og.png was left as it is.');
    process.exit(1);
  }

  const page = join(tmpdir(), `velra-og-${Date.now()}.html`);
  await writeFile(page, html(), 'utf8');
  await mkdir(dirname(OUT), { recursive: true });

  try {
    await run(browser, [
      '--headless=new',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1200,630',
      '--virtual-time-budget=6000',
      `--screenshot=${OUT}`,
      pathToFileURL(page).href,
    ]);
  } finally {
    await rm(page, { force: true });
  }

  console.log(`✓ public/velra-og.png rendered with ${browser}`);
}

main().catch((err) => {
  console.error('✕ velra og render failed:', err.message ?? err);
  process.exit(1);
});
