# Architecture

How the site is put together, and why each piece is the way it is.

---

## Contents

1. [Shape of the thing](#1-shape-of-the-thing)
2. [File map](#2-file-map)
3. [The design system](#3-the-design-system)
4. [The field: the WebGL background](#4-the-field-the-webgl-background)
5. [Instruments, not screenshots](#5-instruments-not-screenshots)
6. [Scrolling](#6-scrolling)
7. [Accessibility and degradation](#7-accessibility-and-degradation)
8. [Performance](#8-performance)

---

## 1. Shape of the thing

One page, seven sections, statically exported to plain files. There is no
server at runtime and no client-side data fetching. `next.config.mjs` sets
`output: 'export'`, so `npm run build` produces a directory of HTML, CSS, JS and
fonts that any static host can serve.

```
00  hero      表紙        the statement, the address, and four measured figures
01  proof     証明  壹    every merged pull request, hardest first, full bleed
02  work      作品  弐    three projects, each a working reduction of itself
03  about     私について 参  the argument, made after the evidence
04  toolkit   技術  肆    grouped by where it sits in the stack, qualifiers kept
05  hope      希望  伍    the pause between the evidence and the ask
06  contact   連絡  陸    the address in plain text, and a console that runs
```

Prove first, explain second. The merges into repositories with maintainers are
the rarest and most checkable thing here, so they arrive immediately after the
hero rather than as section four of six, two thousand words in.

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
  Nav.tsx           fixed bilingual pill navigation, sliding pill, progress rail
  Hero.tsx          section 00, the only centred section on the site
  Proof.tsx         section 01, the proof, the one full-bleed section
  Work.tsx          section 02, one instrument per project
  DependencyGraph.tsx  a block inside Work, weighted by real byte counts
  About.tsx         section 03
  Terminal3D.tsx    the session, on glass, turned toward the pointer
  Toolkit.tsx       section 04
  Hope.tsx          section 05, the pause, the only serif on the site
  Connect.tsx       section 06, the working console
  CommandPalette.tsx  Cmd+K navigation
  Cursor.tsx        custom pointer, pointer-fine devices only
  Reveals.tsx       one IntersectionObserver driving every staged reveal
  SmoothScroll.tsx  Lenis setup and scroll containment
  Tilt.tsx          pointer-tracked tilt and specular glint
  SectionHead.tsx   kanji numeral, Japanese reading, English label, rule

  cosmos/
    shapes.ts       the seven forms, pure data, seeded, deterministic
    CosmosScene.tsx one THREE.Points, morphed by scroll, camera rig
    Cosmos.tsx      canvas, WebGL probe, visibility gate, lazy mount

  ui/
    BlurWords.tsx   word-level blur reveal, rendered on the server
    CountUp.tsx     a figure that counts up once, on first sight
    ScrollDepth.tsx one driver writing --p to every [data-depth] card
    Spotlight.tsx   one delegated pointer handler for every [data-spot] card

  instruments/
    CavixInstrument.tsx     assembles a real review comment
    TraceCVInstrument.tsx   sweeps a scan line down a document
    RepoPulseInstrument.tsx runs Lloyd's algorithm in the browser

lib/
  content.ts        every string the site displays
  scroll.ts         the one place that knows how to move the page
  stations.ts       scroll position to fractional stage index
  useStagedReveal.ts

scripts/
  fetch-stats.ts    build-time GitHub API fetch, see docs/github-api.md
  make-og.ts        renders public/og.png from the measured figures

data/
  stats.json        committed snapshot and build fallback
```

## 3. The design system

**Deep space, and one spectrum across it.** The ground is a blue-black rather
than a neutral one, so the field behind the page and the page itself belong to
the same world. Everything that carries emphasis sits on a single gradient
running blue, through violet, to red: the same three colours the particle field
is built from. Nothing else on the site introduces a hue.

Text is exempt from all of it. Every reading surface is a near-white on a
near-black, well past AA, because a portfolio that cannot be read is a
screensaver.

Tokens live at the top of `app/globals.css`:

| Token | Value | Role |
|---|---|---|
| `--void` | `#05060b` | page ground |
| `--panel-0/1/2` | `#0a0c14` → `#171a27` | elevation steps |
| `--edge`, `--edge-hi` | `#262b3c`, `#363d54` | dividers, data-carrying lines |
| `--bone` | `#f3f5fc` | primary text |
| `--bone-dim` | `#b7bdd2` | secondary text |
| `--mute` | `#7c8299` | labels and metadata |
| `--cool`, `--violet`, `--hot` | `#2f6bff`, `#a855f7`, `#ff4266` | the spectrum |
| `--accent` | `#7d99ff` | the accent, one step lighter than `--cool` |
| `--hair`, `--hair-soft` | white at 14% / 7% | the lit top edge on panels |
| `--halo` | two dark shadows | what keeps prose legible over the field |

Depth in a dark interface comes from light, not shadow. A surface is elevated by
being lighter and carrying a hairline of white along its top edge. That hairline
is the highest-leverage detail on the page.

**Type.** Four families, each with a job nothing else can do.

| Family | Job |
|---|---|
| Outfit | display, at 200–300 weight, wherever type is set large |
| Geist | everything read at paragraph size |
| Geist Mono | everything a machine produced: counts, dates, paths, terminal output |
| Instrument Serif | the quote, and nothing else on the site |

All four are self-hosted through `next/font`, so there is no request to Google
at runtime and no layout shift.

Monospace is deliberately capped well below display size. Mono gives every glyph
the same advance width, which is the point when you are aligning code and a
defect when you are setting a headline: narrow letters float in a pocket of air
and a long heading develops visible holes.

**Bilingual chrome.** Every section carries three names: an English label, a
Japanese reading of the same word, and a formal kanji numeral. The pattern is
borrowed from devsuryansh.in. The numerals are a second, quieter index running
down the page, and they give each section a distinct shape at a glance, before a
word of the heading has been read. All of it is `aria-hidden`: assistive
technology hears each destination once, in one language.

**Motion.** Feel lives in the easing curve, not the effect. Three curves, in
`--ease`, `--ease-out` and `--ease-io`, and nothing animates for longer than
about 900ms.

## 4. The field: the WebGL background

One particle system, seven forms, driven entirely by scroll position.

Every section carries `data-stage`. That attribute is the only coupling between
the writing and the field: `lib/stations.ts` measures those elements and turns
scroll position into a fractional stage index, and the scene morphs between the
two forms that index falls between. Nothing in a section knows anything about
WebGL, and nothing in the scene knows what a section says.

| Stage | Section | Form |
|---|---|---|
| 0 | hero | a meridian lattice, larger than the frame |
| 1 | proof | the shell collapses into a falling column |
| 2 | work | a double helix with rungs |
| 3 | about | a landscape, sunk below the reading column |
| 4 | toolkit | an accretion disc with a hole in the middle |
| 5 | hope | the structure lets go: a drifting starfield |
| 6 | contact | a lit core with four tilted rings |

Roughly 16,000 particles on desktop, 4,200 on a phone, in one draw call.

Design constraints, all of them load-bearing:

- **Every stage's positions are precomputed once** into one contiguous buffer.
  A morph is two typed-array copies and a uniform: no per-frame geometry
  rebuild, no allocation inside the render loop, nothing for the garbage
  collector to notice.
- **Interpolation is scroll-linked, not time-linked.** Scrubbing back up the
  page runs the morph backwards exactly, which is what makes the field feel like
  an object being turned over rather than a video played at you.
- **Colour is computed from world X in the vertex shader**, never baked per
  particle, so the blue-to-red gradient survives every morph without being
  regenerated.
- **Never a reversed `smoothstep`.** `smoothstep(hi, lo, x)` is undefined
  behaviour in GLSL when `edge0 > edge1`, and undefined does not mean "probably
  fine": ANGLE evaluates it to zero, which multiplies the field's alpha to
  nothing and renders a blank canvas with no error anywhere. Always
  `1.0 - smoothstep(lo, hi, x)`.
- **The shader material is constructed by hand**, not declared as
  `<shaderMaterial uniforms={...}>`. What the material ends up holding is not
  guaranteed to be the object the component mutates each frame, and when it is
  not, every uniform write lands on a detached object and the field renders with
  its opacity stuck at zero.
- **Geometry is seeded and deterministic**, so the composition is identical on
  every load and on every machine.
- **Nothing is drawn where the text lives.** A scrim that is darkest down the
  middle holds the centre of frame clear, which is the opposite of a normal
  vignette and is the entire point. It lifts while the hero is in frame, where
  the field is allowed to be the loudest thing on screen.

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

`lib/stations.ts` turns scroll position into a fractional stage index, so the
field reads a single number and never has to know about pixels or section
heights. `ui/ScrollDepth.tsx` is the other scroll consumer: one listener writing
`--p` to every card that swings out of the page's depth, rather than fifteen
cards each mounting their own listener and their own `getBoundingClientRect`.

## 7. Accessibility and degradation

The site is complete without JavaScript, without WebGL, and without motion.

- **All content is in the DOM at first paint.** Nothing is built by JS. Reveals
  animate visibility only, so crawlers and screen readers see real text.
- **`prefers-reduced-motion`** stops the field's clock and its rotation, drops
  the depth transforms, never mounts tilt or the custom cursor, jumps every
  staged reveal and both typed sequences to their final state, and disables
  Lenis. The scroll-linked morph is left alone: it is driven by the visitor's
  own scrolling rather than by anything running on its own, and freezing it
  would strand the field on whichever form it started in. Those overrides are deliberately unlayered CSS so that no utility class
  can reintroduce motion for someone who asked their operating system not to
  show them any.
- **WebGL is probed, not assumed.** If the context cannot be created, nothing
  renders and the page is exactly as legible as it was.
- **Focus is visible on every interactive surface**, and the command palette
  traps focus while open and returns it afterwards.
- **No horizontal overflow at 375px.**

## 8. Performance

- The scene is code split and mounted only after first paint, on
  `requestIdleCallback`, so the hero paints before WebGL is parsed.
- The render loop stops entirely when the tab is hidden.
- Particle count is chosen from viewport width: 16,000, 9,000 or 4,200. All of
  it is one draw call and one buffer.
- Nothing is allocated inside the render loop. Stage positions are computed once
  at mount and a morph is two typed-array copies out of one contiguous region.
- Device pixel ratio is capped at 1.75. Past that the sprites are smaller than
  the extra pixels can show.
- The camera steps back on narrow viewports rather than each form being authored
  twice, because a phone frame is half as wide as it is tall and a form framed
  for a desktop viewport runs off both sides of it.

---

Related: [GitHub API and rate limits](github-api.md) · [Deploying](deploying.md) · [README](../README.md)
