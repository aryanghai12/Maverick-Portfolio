<div align="center">

# aryanghai.dev

**A portfolio built on one rule: no number on this site is typed by hand.**

Single page. Scroll driven. Deep space and one spectrum across it. A particle
field behind it in WebGL that morphs through seven forms as you read.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![three.js](https://img.shields.io/badge/three.js-r185-000000?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org)
[![Licence](https://img.shields.io/badge/licence-MIT-3d3d44?style=flat-square)](LICENSE)

[Quick start](#quick-start) ·
[The rule](#the-rule) ·
[Architecture](docs/architecture.md) ·
[GitHub API and rate limits](docs/github-api.md) ·
[Deploying](docs/deploying.md)

</div>

---

## What this is

My engineering portfolio. It is open source because the argument it makes is
that claims should be checkable, and a site making that argument should be
readable itself. Fork it and do whatever you like with it.

Three things make it different from the usual template:

**Every figure is measured.** Merged pull requests, repository counts, stars and
language byte weights are fetched from the public GitHub API at build time, and
the page prints the date they were measured. See [The rule](#the-rule).

**Each project shows a working reduction of itself, not a screenshot.** The
Cavix panel assembles a real review comment. The TraceCV panel sweeps a scan line
down a document and colours it by parse quality. The RepoPulse panel genuinely
runs Lloyd's algorithm in your browser.

**The background is one object, turned over as you scroll.** Roughly 16,000
particles in a single draw call, morphing through seven forms — a meridian
lattice, a falling column, a double helix, a landscape, an accretion disc, a
drifting starfield, a system of rings — one per section. The interpolation is
scroll-linked rather than time-linked, so scrubbing back up the page runs it
backwards exactly.

---

## Quick start

Requires Node 20 or newer.

```bash
git clone https://github.com/aryanghai12/Maverick-Portfolio.git
cd Maverick-Portfolio
npm install
npm run dev            # http://localhost:3000
```

That is the whole setup. The first run fetches fresh figures from the GitHub
API; if it cannot, it uses the committed snapshot and says so.

### Every command

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run fetch-stats` | Refresh `data/stats.json` from the GitHub API |
| `npm run build` | Fetch stats, then build a static site into `./out` |
| `npm start` | Serve the production build |
| `npm run og` | Re-render `public/og.png` from the measured figures (needs Chrome) |

### Optional but recommended

Unauthenticated GitHub API access is limited to 60 requests an hour **per IP
address**, which is fine locally and a real problem on shared CI runners. A token
with no scopes raises that to 5,000 an hour.

```bash
cp .env.example .env.local
# paste a fine-grained token with zero permissions into .env.local
npm run fetch-stats     # the budget line should now read 5000, not 60
```

Full instructions, including what to do when it goes wrong, are in
**[docs/github-api.md](docs/github-api.md)**.

---

## The rule

> No number on this site is typed by hand.

`scripts/fetch-stats.ts` runs before every build, pulls everything measurable
from the public GitHub API, and writes `data/stats.json`. The page imports that
file statically, so the browser never talks to GitHub. The measurement date is
printed on the page, under the pull request wall.

```
npm run build
  └─ prebuild → fetch-stats → data/stats.json → next build → ./out
```

When the API is unreachable or rate limited, the build retries, then falls back
to the committed snapshot and says loudly that it did. Those figures really did
come from the API and the page shows when, so a snapshot a few days old is dated
rather than dishonest. A build with no snapshot at all fails on purpose, because
at that point there is nothing honest left to render.

**Deliberately absent, and not to be reintroduced:** *98% fewer hallucinations*,
*40% review bottleneck reduction*, *sub-100ms under load*, *30% less triage
time*. All four are self-measured against a private baseline. On a site whose
whole argument is proof over assertion, they are the fastest way to lose a
reader who knows what they are looking at. Mechanism is stated instead, which is
both more convincing and fully checkable.

---

## Documentation

| Document | Read it for |
|---|---|
| **[Architecture](docs/architecture.md)** | File map, the design system, how the particle field works, scrolling, accessibility, performance |
| **[GitHub API and rate limits](docs/github-api.md)** | What the limits are, what one build spends, what happens when you hit them, how to make it robust |
| **[Deploying](docs/deploying.md)** | Vercel, Netlify, Cloudflare Pages, GitHub Pages, custom domains |

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, static export |
| Language | TypeScript |
| Styling | Tailwind CSS v4, with design tokens in `app/globals.css` |
| 3D | three.js via react-three-fiber |
| Scrolling | Lenis |
| Type | Space Grotesk, Geist, Geist Mono and Instrument Serif, self-hosted through `next/font` |
| Hosting | Any static host. Vercel Hobby is enough. |

No UI kit, no component library, no stock assets, no icon font.

---

## Accessibility

The site is complete without JavaScript, without WebGL, and without motion.

- All content is in the DOM at first paint. Nothing is built by JS, so crawlers
  and screen readers get real text.
- `prefers-reduced-motion` stops the field's clock and rotation, drops the depth
  transforms, tilt and the custom cursor, and jumps every staged reveal and both
  typed sequences to their final state.
- WebGL is probed rather than assumed. If it is unavailable the page is exactly
  as legible as it was.
- Focus is visible on every interactive surface. The command palette traps focus
  while open and returns it afterwards.
- No horizontal overflow at 375px.

---

## Fork it

This is MIT licensed and that is meant literally. Fork it, strip it for parts,
rebuild it as your own, ship it commercially. You do not need to ask me and you
do not need to credit me, though a star or a link back is always nice.

Making it yours takes about ten minutes:

| Step | File | What to change |
|---|---|---|
| 1 | `lib/content.ts` | Every string the site displays lives here. Nothing else holds copy. |
| 2 | `scripts/fetch-stats.ts` | `USER`, `GITLAB_USER` and `PROJECTS` at the top. |
| 3 | `data/stats.json` | Delete it, then run `npm run fetch-stats` to generate your own. |
| 4 | `app/layout.tsx` | `metadataBase`, title, description, keywords. |
| 5 | `app/globals.css` | The token block at the top is the whole palette and type scale. |
| 6 | `components/instruments/` | Three project demos. Replace with your own, or delete and simplify `Work.tsx`. |
| 7 | `components/cosmos/shapes.ts` | The seven forms the background morphs through, and the camera framing for each. |
| 8 | `NEXT_PUBLIC_SITE_URL` | Set it, or Open Graph URLs resolve against the wrong host. Then `npm run og`. |

The only thing I would ask, and it is a request rather than a licence term: swap
out my name, my writing and my measurements before you publish it. A portfolio
with somebody else's achievements in it does not do either of us any good.

Found a bug or made it better? Issues and pull requests are welcome.

---

## Licence

[MIT](LICENSE). Use it however you like.
