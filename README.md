# aryanghai.dev

Personal engineering portfolio. Single page, scroll-driven, WebGL background.

Built from [PORTFOLIO-BRIEF.md](PORTFOLIO-BRIEF.md), which is the design document
and the argument for every decision here.

---

## The rule this repo is built on

**No number on this site is typed by hand.**

Everything measurable — merged pull requests, repository counts, stars, language
byte weights — is fetched from the public GitHub API at build time by
[`scripts/fetch-stats.ts`](scripts/fetch-stats.ts), written to
[`data/stats.json`](data/stats.json), and imported statically by the page. The
page also prints the date the figures were measured.

Deliberately absent, and not to be reintroduced: *98% fewer hallucinations*,
*40% review bottleneck reduction*, *sub-100ms under load*, *30% less triage
time*. All four are self-measured against a private baseline. On a site whose
whole argument is proof over assertion, they are the fastest way to lose a
reader who knows what they are looking at. Mechanism is stated instead, which is
both more impressive and fully checkable.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run fetch-stats  # refresh data/stats.json from the GitHub API
npm run build        # runs fetch-stats first, then builds to ./out
```

The build emits a fully static site (`output: 'export'`). There is no server at
runtime.

---

## Deploying to Vercel (free)

The Hobby tier covers this completely: it is static files, no serverless
functions, no image optimisation, no database.

### One-time setup

1. Push this repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import it.
3. Vercel detects Next.js. Leave every build setting on its default —
   `vercel.json` already pins the build command and the `out` directory.
4. **Add an environment variable** (strongly recommended, see below):

   | Name | Value | Environments |
   |---|---|---|
   | `GITHUB_TOKEN` | a GitHub fine-grained PAT with **no scopes** | Production, Preview, Development |

5. Deploy.

### Why `GITHUB_TOKEN` matters here

The build calls the GitHub API. Unauthenticated, that is limited to 60 REST
requests an hour and 10 search requests a minute **per IP** — and Vercel builds
run from shared IPs, so somebody else's build can exhaust the quota before yours
starts.

Without a token the build does not fail: it falls back to the committed
`data/stats.json` snapshot, prints a loud warning, and the page shows the date
that snapshot was measured. With a token you get 5,000 requests an hour and the
figures refresh on every deploy.

The token needs **no scopes at all** — every endpoint used is public. Generate
one at [github.com/settings/tokens](https://github.com/settings/tokens) and grant
it nothing.

### Custom domain

Vercel → Project → Settings → Domains. Free on the Hobby tier. After pointing a
domain at it, update `metadataBase` in [`app/layout.tsx`](app/layout.tsx) so
Open Graph URLs resolve correctly.

### Other hosts

Any static host works — the build output is plain files:

```bash
npm run build      # → ./out
npx serve out      # preview the production build locally
```

Netlify: build `npm run build`, publish `out`.
Cloudflare Pages: build `npm run build`, output `out`.

---

## Architecture

```
app/
  layout.tsx        fonts, metadata, viewport
  page.tsx          section composition
  globals.css       design tokens, type scale, layered base and components
  icon.svg          favicon
components/
  index3d/          The Index — the WebGL background
    hall.ts         geometry generation (pure data, seeded, deterministic)
    Scene.tsx       instancing, camera rig, lights, section accents
    IndexBackground.tsx   canvas, WebGL probe, lazy mount
  instruments/      one working reduction per project
  ...               sections, cursor, palette, HUD, reveals
lib/
  content.ts        every string the site displays
  stations.ts       scroll → fractional camera station
  useStagedReveal.ts
scripts/
  fetch-stats.ts    build-time GitHub API fetch
data/
  stats.json        committed snapshot + build fallback
```

### The Index

The background is a codebase rendered as architecture. Each instance is one line
of source: a thin bar whose length is the length of the line, with indentation
that walks the way real source does. Lines stack into file blocks, blocks lane
either side of an empty corridor, and the camera travels down it on scroll. A
point light rides just ahead of the camera — that light is the reviewer reading
the code, and it is the whole concept in one object.

Two draw calls. Instance matrices are written once; the camera is what moves.
Fog does the culling work. An adaptive resolution governor measures real frame
time and trades pixels for frames when the device cannot keep up.

### Accessibility

`prefers-reduced-motion` is honoured throughout: the camera stops travelling,
tilt and the custom cursor never mount, every staged reveal jumps to its final
state, and Lenis is disabled. All content is in the DOM at first paint and the
site is complete with JavaScript disabled and with WebGL unavailable.

---

## Licence

Code MIT. Written content and the CV material are not — please don't ship a copy
of this as your own portfolio.
