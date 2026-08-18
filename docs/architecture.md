# Architecture

How the site is put together, and why each piece is the way it is.

---

## Contents

1. [Shape of the thing](#1-shape-of-the-thing)
2. [File map](#2-file-map)
3. [The design system](#3-the-design-system)
4. [The Index: the WebGL background](#4-the-index-the-webgl-background)
5. [Instruments, not screenshots](#5-instruments-not-screenshots)
6. [Scrolling](#6-scrolling)
7. [Accessibility and degradation](#7-accessibility-and-degradation)
8. [Performance](#8-performance)

---

## 1. Shape of the thing

One page, six sections, statically exported to plain files. There is no server
at runtime and no client-side data fetching. `next.config.mjs` sets
`output: 'export'`, so `npm run build` produces a directory of HTML, CSS, JS and
fonts that any static host can serve.

```
00  hero        the statement, and four measured figures
01  about       who, plus a terminal that prints the same thing
02  work        three projects, each with a working reduction of itself
03  stack       a bipartite graph weighted by real language byte counts
04  upstream    every merged pull request, each linking to the real PR
05  connect     a console that genuinely runs six commands
```

Everything the page displays is either a string in `lib/content.ts` or a number
in `data/stats.json`. No component invents content.

## 2. File map

```
app/
  layout.tsx        fonts, metadata, viewport
  page.tsx          section composition
  globals.css       tokens, type scale, layered base and components
  icon.svg          favicon

components/
  Nav.tsx           fixed pill navigation, sliding active state, progress rail
  Hero.tsx          section 00
  About.tsx         section 01, plus Console.tsx
  Work.tsx          section 02, pulls in one instrument per project
  Stack.tsx         section 03, the dependency graph
  Upstream.tsx      section 04, the pull request wall
  Connect.tsx       section 05, the working console
  CommandPalette.tsx  Cmd+K navigation
  Cursor.tsx        custom pointer, pointer-fine devices only
  Reveals.tsx       one IntersectionObserver driving every staged reveal
  Kinetic.tsx       per-character reveal, rendered on the server
  SmoothScroll.tsx  Lenis setup and scroll containment
  Tilt.tsx          pointer-tracked tilt and specular glint
  SectionHead.tsx   the numbered rule above each section

  index3d/
    hall.ts             geometry generation, pure data, seeded, deterministic
    Scene.tsx           instancing, camera rig, lights, per-section accents
    IndexBackground.tsx canvas, WebGL probe, lazy mount

  instruments/
    CavixInstrument.tsx     assembles a real review comment
    TraceCVInstrument.tsx   sweeps a scan line down a document
    RepoPulseInstrument.tsx runs Lloyd's algorithm in the browser

lib/
  content.ts        every string the site displays
  scroll.ts         the one place that knows how to move the page
  stations.ts       scroll position to fractional camera station
  useStagedReveal.ts

scripts/
  fetch-stats.ts    build-time GitHub API fetch, see docs/github-api.md

data/
  stats.json        committed snapshot and build fallback
```

## 3. The design system

**Monochrome.** There is no hue anywhere. Every surface, rule, label and
highlight is a step on one neutral ramp from `#0e0e11` to `#ffffff`. White is
the accent, spent the way an accent colour would be: the active nav item, the
live indicator, a figure that matters. Colour is the cheapest way to make a page
look decorated and the fastest way to make it look like every other page.

Tokens live at the top of `app/globals.css`:

| Token | Value | Role |
|---|---|---|
| `--void` | `#0e0e11` | page ground |
| `--panel-0/1/2` | `#151519` → `#24242a` | elevation steps |
| `--edge`, `--edge-hi` | `#32323a`, `#45454f` | dividers, data-carrying lines |
| `--bone` | `#f4f4f6` | primary text |
| `--bone-dim` | `#b2b2ba` | secondary text |
| `--mute` | `#7c7c86` | labels and metadata |
| `--accent` | `#ffffff` | the accent |
| `--hair`, `--hair-soft` | white at 14% / 7.5% | the lit top edge on panels |

Depth in a dark interface comes from light, not shadow. A surface is elevated by
being lighter and carrying a hairline of white along its top edge. That hairline
is the highest-leverage detail on the page.

**Type.** Geist for anything a person wrote and a person reads. Geist Mono for
anything a machine produced: counts, timestamps, repository paths, tags,
terminal output. Both are variable fonts, self-hosted through `next/font`, so
there is no request to Google at runtime and no layout shift.

Monospace is deliberately capped well below display size. Mono gives every glyph
the same advance width, which is the point when you are aligning code and a
defect when you are setting a headline: narrow letters float in a pocket of air
and a long heading develops visible holes.

**Motion.** Feel lives in the easing curve, not the effect. Three curves, in
`--ease`, `--ease-out` and `--ease-io`, and nothing animates for longer than
about 700ms.

## 4. The Index: the WebGL background

A codebase rendered as architecture.

Each instance is one line of source: a thin bar whose length is the length of
the line, with indentation that walks the way real source does. Lines stack into
file blocks, blocks lane either side of an empty corridor, and the camera
travels down that corridor as you scroll. A point light rides just ahead of the
camera. That light is the reviewer reading the code, and it is the whole concept
in one object.

Roughly 5,200 instances on desktop, 1,900 on mobile, in two draw calls.

Design constraints, all of them load-bearing:

- **Instance matrices are written exactly once.** The hall is a fixed place and
  the camera is what moves. Morphing five thousand bars every frame would cost
  milliseconds and would read as a particle demo rather than as architecture.
- **Fog does the culling.** Distant instances dissolve instead of needing
  detail, which is also what sells the depth.
- **Nothing is drawn where the text lives.** The lanes sit outside the reading
  column, and a scrim that is darkest in the middle holds the centre of frame
  clear. That is the opposite of a normal vignette and is the entire point.
- **Geometry is seeded and deterministic**, so the layout is identical on every
  load and between server and browser.

Section accents fade in near their own station and out again afterwards: call
graph edges in the work section, concentric rings in upstream, a single beam
down the axis in connect.

## 5. Instruments, not screenshots

Each project is shown as a working reduction of itself.

- **Cavix** assembles a real review comment, ending in its sandbox transcript.
- **TraceCV** sweeps a scan line down a document, colouring blocks by parse
  quality as it passes them.
- **RepoPulse** genuinely runs Lloyd's algorithm in the browser. The clusters
  you watch converge are computed, not animated.

A screenshot claims a thing works. A reduction demonstrates it, which is the
same argument the site makes everywhere else.

## 6. Scrolling

Smooth scrolling runs on [Lenis](https://github.com/darkroomengineering/lenis),
kept deliberately short at 0.9s. Smooth scrolling that outlasts the gesture
stops feeling smooth and starts feeling like lag.

Two things are easy to get wrong here and both are handled in one place.

**Nested panes.** Lenis listens for `wheel` on the window and cancels the native
event. Without intervention, a wheel gesture over the pull request wall or the
command palette scrolls the whole page and leaves the list under the pointer
sitting still. `SmoothScroll.tsx` passes a `prevent` predicate that yields to any
element carrying the `.scroll-wall` class, so every scroll pane on the site is
covered by one rule.

**In-page jumps.** Lenis drives `window.scrollTo` every frame, so a native
`scrollIntoView({ behavior: 'smooth' })` fires at the same time and the two
fight over the same pixels. Every jump on the site goes through
`lib/scroll.ts`, which hands off to Lenis when it is running and to the browser
when it is not.

`lib/stations.ts` turns scroll position into a fractional camera station, so the
3D rig reads a single number and never has to know about pixels or section
heights.

## 7. Accessibility and degradation

The site is complete without JavaScript, without WebGL, and without motion.

- **All content is in the DOM at first paint.** Nothing is built by JS. Reveals
  animate visibility only, so crawlers and screen readers see real text.
- **`prefers-reduced-motion`** stops the camera travelling, never mounts tilt or
  the custom cursor, jumps every staged reveal to its final state, and disables
  Lenis. Those overrides are deliberately unlayered CSS so that no utility class
  can reintroduce motion for someone who asked their operating system not to
  show them any.
- **WebGL is probed, not assumed.** If the context cannot be created, nothing
  renders and the page is exactly as legible as it was.
- **Focus is visible on every interactive surface**, and the command palette
  traps focus while open and returns it afterwards.
- **No horizontal overflow at 375px.**

## 8. Performance

- The 3D scene is code split and mounted only after first paint, on
  `requestIdleCallback`, so the hero paints before WebGL is parsed.
- The render loop stops entirely when the tab is hidden.
- An adaptive resolution governor measures real frame time over 45-frame windows
  and trades pixels for frames when the device cannot keep up, then ratchets
  back when there is headroom. A soft background at 60fps beats a sharp one
  at 28.
- Device pixel ratio is capped at 1.6. Past that the bars are thinner than the
  extra pixels can show.

---

Related: [GitHub API and rate limits](github-api.md) · [Deploying](deploying.md) · [README](../README.md)
