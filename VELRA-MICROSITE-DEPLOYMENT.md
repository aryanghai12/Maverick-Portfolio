# Deploying the Velra microsite

The Velra page is a normal route in this portfolio. It ships with the same
build, on the same Vercel project, at the same domain:

```
https://aryanghai.in/velra
```

Nothing in this guide creates a second project, adds a domain or touches DNS.
If a step seems to need one of those, stop: something else is wrong.

Commands are written for PowerShell in the VS Code terminal, from the
repository root.

---

## Contents

1. [What this repository is](#1-what-this-repository-is)
2. [What was added and changed](#2-what-was-added-and-changed)
3. [Run it locally](#3-run-it-locally)
4. [Checks to run before committing](#4-checks-to-run-before-committing)
5. [Review and commit in Git](#5-review-and-commit-in-git)
6. [Vercel Preview Deployment](#6-vercel-preview-deployment)
7. [Go to production and verify](#7-go-to-production-and-verify)
8. [How routing, assets and metadata are preserved](#8-how-routing-assets-and-metadata-are-preserved)
9. [Troubleshooting](#9-troubleshooting)
10. [Rolling back](#10-rolling-back)
11. [Updating the transcripts later](#11-updating-the-transcripts-later)

---

## 1. What this repository is

Read off the repository, not assumed:

| Fact | Where it comes from |
|---|---|
| Next.js 16, App Router, React 19, TypeScript | `package.json`, `app/` |
| Static export: `next build` writes plain files to `out/` | `output: 'export'` in `next.config.mjs` |
| Tailwind CSS v4, tokens in `app/globals.css` | `postcss.config.mjs`, `app/globals.css` |
| Vercel serves `out/` as static files, with no Next.js builder | `"framework": null`, `"outputDirectory": "out"` in `vercel.json` |
| Extensionless URLs | `"cleanUrls": true` in `vercel.json` |
| `npm run build` first runs `fetch-stats`, which calls the GitHub API | `prebuild` in `package.json` |
| No ESLint and, before this change, no test runner | `package.json` |

So `/velra` needs no rewrite, redirect or configuration. `app/velra/page.tsx`
becomes `out/velra.html`, and `cleanUrls` serves that file at `/velra`.

## 2. What was added and changed

**Changed (2 files)**

| File | Change |
|---|---|
| `package.json` | Four scripts added: `typecheck`, `test`, `velra:transcripts`, `og:velra`. No dependency added or upgraded. `package-lock.json` is untouched. |
| `.gitignore` | The two raw source files are ignored. See [section 5](#5-review-and-commit-in-git). |

**Added**

| Path | What it is |
|---|---|
| `app/velra/page.tsx` | The route: metadata, viewport, section order |
| `app/velra/velra.css` | Every style for the page, scoped under `.velra` |
| `components/velra/Replay.tsx` | The interactive terminal, controls and keyboard handling |
| `components/velra/ReplayRail.tsx` | The step rail: session timeline and command list in one, with a mobile drawer |
| `components/velra/CapsuleInspector.tsx` | The expandable capsule inspector. On the last step it becomes the numbered verification sequence |
| `components/velra/HandoffGuide.tsx` | The verification guide drawn in the terminal on the last step, with its two copy buttons |
| `components/velra/TerminalLine.tsx` | Draws one line of output, redaction chips included |
| `components/velra/Sections.tsx` | Hero, properties, why, pipeline, trust, call to action, footer |
| `components/velra/VelraNav.tsx` | Header and mobile menu |
| `components/velra/CopyButton.tsx`, `Reveal.tsx`, `icons.tsx` | Small shared pieces |
| `lib/velra/types.ts` | The shape of a step, a phase and a mode |
| `lib/velra/published.ts` | Which captured executions the page shows: each distinct Velra command, once |
| `lib/velra/captured.ts` | The captured run: the two captures, which steps the walkthrough shows, and the inspector data for the install |
| `lib/velra/captured-session.ts` | The same for the working-session capture |
| `lib/velra/handoff.ts` | The last step: the verification prompt, the status command and the guide's wording. Guidance, with no output in it |
| `lib/velra/documented.ts` | The documented example, quoted from Velra's docs |
| `lib/velra/transcripts.ts` | The three views (walkthrough, all commands, documented example) and the copy helpers |
| `lib/velra/player.ts` | Playback, as a pure state machine |
| `lib/velra/content.ts` | Every sentence of page copy |
| `lib/velra/sanitize.ts` | The redaction rules |
| `lib/velra/clipboard.ts` | Copy with an honest result |
| `data/velra/captured.json` | Generated, public-safe transcript text for the published executions only. This is what the build reads. |
| `scripts/velra-transcripts.ts` | Regenerates and audits `captured.json` |
| `scripts/make-velra-og.ts` | Renders the share card |
| `public/velra-og.png` | The share card, 1200 by 630 |
| `tests/velra/*.test.ts` | 72 tests: playback, transcript integrity, the handoff guide, privacy, copy |
| `VELRA-MICROSITE-DEPLOYMENT.md` | This file |

**Not changed:** `app/page.tsx`, `app/layout.tsx`, `app/globals.css`,
`next.config.mjs`, `vercel.json`, every existing component, `data/stats.json`,
`README.md` and `docs/`. The homepage has no link to `/velra` yet. That is
deliberate, and adding one is your call.

**Reused, not copied:** `components/cosmos/Cosmos.tsx`. The Velra page mounts
the portfolio's particle field as it is, so the two pages share one background.
The component was not edited.

## 3. Run it locally

Node 20 or newer. Dependencies only need installing if `node_modules` is
missing or `package-lock.json` changed, and this change did not touch it:

```powershell
npm ci
```

**Development server**

```powershell
npm run dev
```

Open **http://localhost:3000/velra**. The portfolio is still at
http://localhost:3000/.

Use `localhost`, not `127.0.0.1`. The Next.js 16 dev server refuses its own
script files when the page is opened by IP address, and the result looks like a
broken page with 403 errors in the console. It affects the homepage in the
same way and has nothing to do with this route.

**The production build, served the way Vercel serves it**

```powershell
npm run build
npx serve out
```

Open **http://localhost:3000/velra**. This is the check that matters most,
because it exercises the exported `out/velra.html` and the clean URL rather
than the dev server.

One thing to know about `npm run build`: its `prebuild` step refreshes
`data/stats.json` from the GitHub API. That is the portfolio's own behaviour
and it will show up as a modified file. If you do not want fresh figures in the
same commit as the microsite:

```powershell
git restore data/stats.json
```

To build without calling GitHub at all, run `npx next build` instead. It is the
same build minus the prefetch.

## 4. Checks to run before committing

```powershell
npm run typecheck                       # tsc --noEmit
npm test                                # 72 tests, about a second
npm run build                           # must list "○ /velra" in the route table
npm run velra:transcripts -- --check    # privacy audit of the data and of ./out
```

There is no lint step because the repository has no ESLint configuration. None
was added.

What each one proves:

- **`npm run typecheck`** covers the app, the scripts and the tests.
- **`npm test`** checks playback (play, pause, restart, back, next, direct
  selection, speed, reduced motion), that the walkthrough is its eight steps in
  the order they were run and every one but the last has complete real output,
  that no command appears twice in any view, that nothing mistyped, failed or
  unrelated is shown, that the walkthrough's `velra doctor` is the run where
  every check passes, that the two captures are never interleaved, that every
  inspector quote exists in its step's output, that the figures in the hero
  are read from the output, that a private capsule keeps its structure and
  none of its content, that a session id is redacted in every spelling it is
  printed in, and that no em dash appears in written copy.
- **`npm run velra:transcripts -- --check`** regenerates the data in memory
  from the raw file, confirms the committed JSON matches, and then scans every
  text file in `out/` for each private value in the raw file, in plain,
  JavaScript-escaped and HTML-escaped form. Run it after a build. It needs the
  raw file, so it only does real work on your machine. On a machine without
  the raw file it reports that and exits cleanly.

Expected last lines:

```
ℹ pass 72
ℹ fail 0

  scanned 36 built files in ./out
✓ verified data/velra/captured.json
  12 published of 38 captured, 60 redactions, 120 private values checked and absent
```

**Check by hand in the browser**, at http://localhost:3000/velra:

- The particle field is behind the page and morphs as you scroll, as on the
  homepage. It shows through the panels as soft, blurred light. If the panels
  look flat, see Troubleshooting.
- Each link in the bar lands its section with the label just under the bar, at
  the same distance every time, and the bar marks the section you are in.
- The hero terminal shows a real staging result, with `706` on the card
  beside it and placeholders where the session id and paths were.
- The replay opens on **Walkthrough**, step 1 of 8. Every command in the rail
  is a Velra command, and none appears twice.
- Play, Pause, Restart, Back and Next all respond, and the step counter follows.
- Clicking any step in the rail opens it, with its explanation above the
  terminal and its full output inside.
- Step 3, `velra doctor`, shows six passing checks, with the database present.
- Step 5 shows a whole capsule with `<prompt-text>` and `<file-path>` where
  the private content was. Step 6 shows the real `✓ Staged` line. Step 7
  shows status with the `Staged:` line.
- **All commands** lists 13 steps: twelve distinct commands and the guide as
  the last step. No repeats and no mistyped flags.
- On a short window, scroll the step list down and click a step near the
  bottom. The list stays where it is. It moves only when the selected step
  would otherwise be out of view, as during playback.
- Copy command and Copy output both confirm, and paste what was shown.
- **Documented example** replaces every command and the inspector.
- The last walkthrough step, **Start a new session**, is a guide and says so:
  the bar reads **How to verify** and the status line reads **Guide, not a
  recording**. It opens with "No popup. No manual copy-paste. No need to
  explain the task all over again.", then three steps, A to C.
- **Copy verification prompt** copies the whole prompt shown under it, and
  **Copy command** copies `velra status`. Both confirm on the button.
- On that step the inspector is headed **How to verify** and lists four
  numbered items. Only the first is tagged **Recorded in this run**, and
  opening it shows the real `✓ Staged` line. The other three read **Yours to
  check**. Nothing is ticked.
- Nowhere on that step is there a delivery line, a status listing or a reply
  from Claude. None was captured, so none is shown.
- With focus in the terminal, Space plays and pauses and the arrow keys step.
- At 390px wide: the menu button opens and closes, the step rail folds behind
  a toggle, and there is no sideways scroll.
- http://localhost:3000/ looks and behaves exactly as it did.

## 5. Review and commit in Git

**Before staging anything, confirm the raw files are ignored.** They contain
real session ids, your local account name, private session titles and private
prompt text. The second file embeds a full copy of the first.

```powershell
git check-ignore -v VELRA-ALL-PROVIDED-TERMINAL-OUTPUTS.md VELRA-CLAUDE-MASTER-PROMPT-FULL.md
```

Both must be reported as matched by `.gitignore`. If either line is missing,
do not commit until it is fixed.

Then:

```powershell
git status --short
git switch feature/velra-microsite
```

The branch already exists. It holds one checkpoint commit, "Add the Velra
microsite at /velra", made before the working-session capture was added. If
you are starting from somewhere it does not exist, create it with
`git switch -c feature/velra-microsite`.

Stage by path rather than with `git add -A`, so nothing rides along by
accident:

```powershell
git add .gitignore package.json VELRA-MICROSITE-DEPLOYMENT.md `
        app/velra components/velra lib/velra data/velra tests/velra `
        scripts/velra-transcripts.ts scripts/make-velra-og.ts public/velra-og.png
```

`velra-microsite-preview.png` is the design reference. The site does not use
it and it is not staged above. Leave it untracked, delete it, or add it to
`.gitignore`. It contains nothing private.

Review exactly what will be committed:

```powershell
git status --short               # nothing named VELRA-ALL-* or VELRA-CLAUDE-*
git diff --cached --stat
git diff --cached -- package.json .gitignore
git diff --cached -- data/velra/captured.json | Select-String "aryan|/home/|Users"   # expect no output
```

Commit and push the branch. This does not deploy to production:

```powershell
git commit -m "Add the Velra microsite at /velra"
git push -u origin feature/velra-microsite
```

## 6. Vercel Preview Deployment

`vercel.json` shows this repository is set up for Vercel. Whether the Vercel
project is connected to GitHub is a dashboard setting that cannot be read from
the repository, so check it first:

**vercel.com → your portfolio project → Settings → Git.** A connected
repository is shown there with its production branch, which should be `main`.

**If Git is connected (the usual case)**

Pushing `feature/velra-microsite` is enough. Vercel builds every non-production
branch as a Preview Deployment.

1. Open the project's **Deployments** tab. The newest entry is labelled
   **Preview** with the branch name.
2. Or open a pull request on GitHub. The Vercel bot comments with the preview
   link, and the check on the pull request links to the build log.
3. Open the preview URL and add `/velra`. It looks like
   `https://<project>-git-feature-velra-microsite-<account>.vercel.app/velra`.

**If Git is not connected**

Use the CLI. Run without `--prod`, it creates a preview only:

```powershell
npx vercel
```

The first run asks you to link the directory. Choose the **existing** portfolio
project. Do not let it create a new one.

**Inspect the preview**

- In the build log, the route table must include `○ /velra`.
- The log line `✓ data/stats.json written`, or `⚠ Falling back`, is the
  portfolio's stats fetch. Preview builds only get fresh figures if
  `GITHUB_TOKEN` is set for the **Preview** environment. Either outcome is fine
  for reviewing this page.
- Open `/velra` and repeat the browser checklist from section 4.
- Open `/` and confirm the portfolio is unchanged.
- Open `/velra-og.png` and confirm the card loads.

One expected oddity on a preview: `og:image` and the canonical URL point at
`https://aryanghai.in`, not at the preview host, because `app/layout.tsx`
resolves them against `NEXT_PUBLIC_SITE_URL` or that default. So a link
unfurled from a preview URL will show the card only after production has it.
That is correct behaviour, not a bug.

## 7. Go to production and verify

Production deploys when the change reaches the production branch. Do this only
once you are happy with the preview:

1. Merge the pull request into `main` on GitHub, or merge locally and push.
2. Watch **Deployments** for the entry labelled **Production** to finish.

Do not run `vercel --prod` by hand unless that is already how you ship this
site. Merging keeps the deployment tied to a commit you can revert.

**Verify**

```powershell
curl.exe -sI https://aryanghai.in/velra        | Select-String "HTTP|content-type|x-frame"
curl.exe -sI https://aryanghai.in/             | Select-String "HTTP"
curl.exe -sI https://aryanghai.in/velra-og.png | Select-String "HTTP|content-type"
curl.exe -s  https://aryanghai.in/velra        | Select-String -Pattern "<title>[^<]+" -AllMatches | ForEach-Object { $_.Matches.Value }
```

Expect `200` three times, `text/html` and `image/png`, and the title
`Velra · Session continuity for Claude Code`.

Then in a browser:

- https://aryanghai.in/velra loads directly, and survives a hard refresh.
- Try https://aryanghai.in/velra/ with a trailing slash and note what it does.
  `vercel.json` does not set `trailingSlash`, so this was not verified locally.
  The canonical URL is `/velra` either way. If the slash form 404s and you want
  it to redirect, that is a one-line `"trailingSlash": false` change, and a
  separate decision from this page.
- https://aryanghai.in/ is unchanged.
- View source on `/velra`: the canonical link is
  `https://aryanghai.in/velra` and `og:image` is
  `https://aryanghai.in/velra-og.png`.
- Paste the URL into a link preview checker (LinkedIn Post Inspector, or the
  Open Graph debugger of your choice) and confirm the Velra card appears.
- Run the replay once on a phone.

## 8. How routing, assets and metadata are preserved

**Routing.** `/velra` is a folder in `app/`, nothing more. No `basePath`, no
`assetPrefix`, no rewrite and no redirect was added, and `vercel.json` is
untouched. The homepage is still `app/page.tsx` and still exports to
`out/index.html`.

**One piece of the homepage is shared on purpose: the particle field.**
`app/velra/page.tsx` mounts `components/cosmos/Cosmos.tsx` unchanged. That
component reads the elements carrying `data-stage`, in order, and morphs
between its seven forms as they scroll past. The Velra sections carry the
attribute, so the field behaves here exactly as it does on the homepage. It
also looks for `#hero`, which is why the Velra hero has that id. Because of
this, `/velra` loads three.js, as the homepage does. The scene is still code
split and mounted on idle, and it is skipped when WebGL is unavailable.

**The rest of the homepage's machinery is not on this route.** Lenis, the
custom cursor, the command palette and the portfolio navigation are mounted in
`app/page.tsx`, not in `app/layout.tsx`, so `/velra` does not get them.

**The look is the portfolio's.** `velra.css` reads the colour tokens that
`app/globals.css` defines on `:root` (`--bone`, `--accent`, `--hair` and the
rest) and uses the same glass recipe as `.panel`. A palette change in
`globals.css` therefore carries over to `/velra` without a second edit.

**Styles cannot leak in either direction.** `app/velra/velra.css` is imported
only by `app/velra/page.tsx`. The page borrows one thing from `globals.css`
without changing it: the `.cosmos` scrim that comes with the field. In the build it becomes its own stylesheet, which
`out/velra.html` links and `out/index.html` does not. Every rule in it is
nested under `.velra`, and every class is prefixed `vl-`. The one rule that
reaches outside is `html:has(.velra) { scroll-behavior: smooth }`, which can
only match while the Velra page is the document.

**Asset paths.** All internal references are root-relative: `/velra-og.png`,
`/_next/static/...`. Fonts come from `next/font` in the root layout, so nothing
new is fetched and nothing is loaded from another origin. The existing cache
and security headers in `vercel.json` apply to this route as they do to every
other.

**Metadata.** `app/velra/page.tsx` exports its own `title`, `description`,
`canonical` (`/velra`), Open Graph and Twitter fields. `metadataBase` is still
inherited from `app/layout.tsx`. Next.js merges metadata shallowly, so
`openGraph` and `twitter` are restated in full on this route. The homepage's
metadata is not edited and still points at `/og.png`.

**No server.** The page is static HTML and client script. There is no API
route, no server action and no endpoint that accepts input. The terminal plays
back text from `data/velra/captured.json` and `lib/velra/documented.ts` on a
timer.

## 9. Troubleshooting

### `/velra` returns 404 on Vercel

1. Open the build log and look at the route table. If `○ /velra` is missing,
   the route was not built: confirm `app/velra/page.tsx` is committed.
2. If it was built, check that `vercel.json` still has `"cleanUrls": true`,
   `"outputDirectory": "out"` and `"framework": null`. Without `cleanUrls` the
   page exists only at `/velra.html`.
3. Confirm you are on the deployment that contains the commit. A preview URL
   belongs to one commit and does not move.

### `/velra` works locally but the build fails on Vercel

- **`Cannot find module '@/data/velra/captured.json'`**: the generated file was
  not committed. Run `git ls-files data/velra` and add it. The raw transcript
  file is not needed for the build and must not be committed to fix this.
- **A type error**: run `npm run typecheck` locally. The build type-checks
  `tests/` and `scripts/` as well as the app.
- **`routes-manifest.json couldn't be found`**: unrelated to this route. See
  `docs/deploying.md`, Troubleshooting.
- **A stats failure**: the build falls back to the committed `data/stats.json`
  and says so. It only fails if that file is missing.

### The page renders with no styling, or with the portfolio's styling

- Hard refresh once. An old tab can hold an old stylesheet.
- In the built HTML, `out/velra.html` should link two stylesheets and
  `out/index.html` one. If `velra.html` links only one, the import of
  `./velra.css` in `app/velra/page.tsx` has been removed.
- Do not move Velra rules into `app/globals.css`. Rules there load on every
  page, and unlayered rules there outrank Tailwind's utilities.
- The colours come from the `:root` tokens in `app/globals.css`. If one of
  those is renamed, `velra.css` falls back to the value written beside it, so
  the page still renders, but it will stop following the portfolio's palette.

### The glass looks flat, or does not blur

Two different things can cause this, and they look alike.

**The blur is too strong.** The field behind the page is made of small points.
A heavy blur spreads each one over so many pixels that it vanishes, and the
panel reads as a flat dark box even though the blur is working. The strength
is set in one place, at the top of `velra.css`:

```css
--vl-glass: blur(10px) saturate(1.9) brightness(1.3);
--vl-glass-soft: blur(8px) saturate(1.7) brightness(1.2);
```

Around 8 to 12px keeps the field visible as soft light. The saturation and
brightness lift make up for what the panel's fill takes away. The fill itself
is deliberately translucent, about 40 to 52 percent, in the rule that lists
`.vl-card`, `.vl-stage` and the others. Raising either number hides the field.

**The blur is missing from the build.** Every rule that blurs is written with
the prefixed declaration first:

```css
-webkit-backdrop-filter: var(--vl-glass);
backdrop-filter: var(--vl-glass);
```

Keep that order. The CSS minifier in this build treats the two as one property
and keeps whichever is written last. With `backdrop-filter` first, the standard
property is dropped from the output and Chrome and Firefox apply no blur. To
check a build:

```powershell
Get-ChildItem out\_next -Recurse -Filter *.css | ForEach-Object {
  $t = Get-Content $_.FullName -Raw
  "$($_.Name): standard=$([regex]::Matches($t,'(?<!-webkit-)backdrop-filter:').Count) webkit=$([regex]::Matches($t,'-webkit-backdrop-filter:').Count)"
}
```

The Velra stylesheet should report the two numbers equal.

**How this relates to the homepage.** `app/globals.css` writes `backdrop-filter`
first, so in Chrome its panels compute to `backdrop-filter: none`. What you see
there is translucency without blur: the particles show sharply through the
panels, and that see-through quality is the look. It was not changed. If you
ever reorder those declarations to switch the blur on, expect the homepage's
panels to go flat, because `.glass` and `.panel` use 26 and 30px. Lower them
to around 10px at the same time, as this page does.

### A section link lands in the wrong place

Every jump on the page comes to rest with the section's label 104px from the
top of the window, just under the floating bar. That is `--vl-anchor` in
`velra.css` (the bar's offset, its height, and 32px of space).

Sections have tall top padding, so the link cannot simply scroll to the
section's edge. `.vl-section` sets a `scroll-margin-top` that subtracts its own
padding, which is why the padding lives in a variable (`--vl-sec-pad`). If you
change a section's padding, change it through that variable and the landing
position follows. If you change the bar's height or offset, change
`--vl-nav-h` or `--vl-nav-top`.

"Run the walkthrough" is separate. It lands the terminal itself 88px from the
top, and the replay panel sizes itself to the window height so the Play
controls are on screen at the same time.
### Assets 404, or links point at the wrong path

The site is served from the domain root, so no `basePath` is set. If you ever
set one, every root-relative path in the app moves with it, including
`/velra-og.png` in the metadata and the `/` link back to the portfolio. Static
exports bake these at build time, so host settings cannot correct them.

### The share card is missing or stale

`public/velra-og.png` is a committed file. Regenerate it with
`npm run og:velra` (needs Chrome, Chromium or Edge installed), commit it, and
redeploy. Link preview services cache aggressively, so use their refresh
option after deploying.

### Route collisions

`/velra` is defined once, by `app/velra/`. A collision would need a second
definition: a `public/velra.html` file, a `public/velra/` folder, or a rewrite
in `vercel.json`. None exists. Do not add one.

### The dev server shows 403 errors and a half-working page

You opened `http://127.0.0.1:3000`. Use `http://localhost:3000`.

### Something changed and you want a clean rebuild on Vercel

**Deployments → the deployment → Redeploy**, with "Use existing Build Cache"
switched off.

## 10. Rolling back

Both routes are safe, and neither involves DNS or domain settings.

**Fastest: Vercel's deployment history.** In **Deployments**, find the last
production deployment from before the merge, open its menu and choose
**Instant Rollback** (or **Promote to Production**). The previous build is
served again within seconds. `main` is unchanged, so the next push to `main`
will deploy the microsite again until you also revert it in Git.

**Durable: revert the commit.**

```powershell
git switch main
git pull
git log --oneline -5
git revert <commit>            # for a merge commit: git revert -m 1 <merge-commit>
git push
```

Vercel deploys the revert like any other commit. Because the microsite is
almost entirely new files, the revert removes them and undoes the small edits
to `.gitignore` and `package.json`. No existing page depends on any of it.

## 11. Updating the transcripts later

The source pack holds three captures. The page shows a selection from two of
them, and each distinct Velra command appears once:

| Transcripts | Capture | On the page |
|---|---|---|
| A to J | First install on Windows | Install, version, disable, enable |
| K to M | A Linux workspace | Nothing. Two outputs were never supplied, and the complete Windows session covers the same commands |
| N | A working session on Windows, one continuous run | Doctor, inspect, list, capsule preview, dry run, staging, the picker, status |

Which executions are shown is one list, `PUBLISHED` in
`lib/velra/published.ts`. Anything not in it stays in the local source pack
and never reaches `data/velra/captured.json` or the build: repeated runs of a
command, the early runs made before the database existed, mistyped flags, and
tool checks that have nothing to do with Velra. The build fails if the list,
the generated data and the step metadata stop describing the same executions.

The last step has no capture behind it: nothing in the pack shows a new
Claude Code session receiving the staged capsule. The handoff is silent, so
the step is written as a verification guide (`lib/velra/handoff.ts`) and is
labelled as guidance everywhere it appears. It contains no output, and
`npm test` fails if a delivery line, a status listing or a claim that
something was delivered is added to it.

If you later record a real handoff, the guide can stay as it is, since it
teaches a reader to check their own installation. To add the recording as
evidence beside it, start a new session in the workspace, copy what the
terminal shows as plain text, and add it:

1. Add the new output to `VELRA-ALL-PROVIDED-TERMINAL-OUTPUTS.md` under a new
   `## Transcript` heading, or the relevant existing one. It stays local. Paste
   it as plain text from the terminal. Text copied out of rendered Markdown
   picks up artifacts, which is where the doubled backslashes in transcripts B
   to G came from.
2. If a transcript's layout changed, update `MANIFEST` in
   `lib/velra/sanitize.ts`. If the new text has a kind of private value the
   rules do not cover, add a rule there. Rules are patterns, never literal
   private strings.
3. To show a new execution, add its id to `PUBLISHED` in
   `lib/velra/published.ts`. To replace an existing one with a better run of
   the same command, swap the id. Do not list the same command twice.
4. Regenerate:

   ```powershell
   npm run velra:transcripts
   ```

   It refuses to write if any private value from the raw file survives.
5. Give the new id a title, a one-line explanation and inspector fields in
   `lib/velra/captured.ts` (first install) or `lib/velra/captured-session.ts`
   (working session), with each `evidence` line quoted from its real output.
   Remove the metadata for any id you took out. A recorded handoff goes in as
   an ordinary captured step before `HANDOFF`, and the guide's inspector can
   then mark its other items as recorded, each with a quoted line, in
   `handoffInspector` in `lib/velra/handoff.ts`. The `STORY` list in
   `captured.ts` decides
   which steps the walkthrough shows and in what order. Every published
   command is listed under **All commands** whether or not it is in `STORY`.
6. Run the checks from section 4. The tests fail if an inspector quote is not
   in the output, if a redaction is uncounted, or if a figure from the
   documented example appears in the captured run.

Do not edit `data/velra/captured.json` by hand. The parity test compares it
with what the sanitizer produces and will fail.
