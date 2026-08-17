# Portfolio — Build Brief v2

**Owner:** Aryan Ghai
**Deliverable:** Personal engineering portfolio. Single page, scroll-driven, real 3D.
**Ambition:** Awwwards-tier. Must read as *built by an engineer*, not assembled from a template.
**Hard constraints:** every dependency, font and asset free for commercial use · every displayed number verifiable · no gears, no steampunk, no matrix rain.

> **What changed from v1**
> - BLT-Toasty removed as a project. RepoPulse added. Projects are Cavix, TraceCV, RepoPulse.
> - The mechanical gear engine is deleted entirely. New background concept in §4.
> - Every self-reported percentage (98% hallucination reduction, 40% bottleneck cut, <100 ms ingest) is **removed**. See §2.
> - Industrial/brass direction replaced with a terminal-native system: graphite + amber-CRT ember.
> - New sections: **Upstream** (real merged PRs) and a working **Connect** console.

---

## 1. Data provenance — read this before writing any content

Everything below was pulled live from the GitHub API, the GitLab API and the Codeforces API on **17 Aug 2026**. Nothing here is inferred. Anything I could not verify is marked `UNVERIFIED` and must not ship.

| Source | Endpoint used |
|---|---|
| GitHub profile + 27 repos | `api.github.com/users/aryanghai12` |
| Merged PR set | `api.github.com/search/issues?q=author:aryanghai12+type:pr+is:merged` |
| Per-repo language bytes | `api.github.com/repos/{repo}/languages` |
| GitLab personal projects | `gitlab.com/api/v4/users/aryanghai1205/projects` |
| OWASP BLT-Toasty upstream | `gitlab.com/api/v4/projects/owasp-blt%2Fblt-toasty` |
| Codeforces | `codeforces.com/api/user.info?handles=aryanghai` |

---

## 2. The honesty contract (non-negotiable)

The through-line of Aryan's work is **verification over assertion** — Cavix drops any finding it cannot reproduce, TraceCV refuses any claim it cannot quote. A portfolio that asserts unverifiable numbers contradicts its own author. This is not a nicety; it is the thesis.

**Three rules:**

1. **A number on this site is either fetched live from a public API at build time, or it is not on this site.** No hardcoded metrics.
2. **Deleted permanently:** `98% fewer hallucinations`, `40% review bottleneck reduction`, `<100 ms under concurrent load`, `30% triage time reduction`. All four are self-measured against a private baseline. On a site whose pitch is "proof over claims", they are the single fastest way to lose a reader who knows what they are looking at. Replace with *mechanism*, which is far more impressive and completely true: *"writes a failing test, runs it in a sealed sandbox, applies the fix, re-runs — anything it cannot reproduce is dropped."*
3. **Numbers that ARE allowed**, because they are publicly checkable by anyone in ten seconds:

| Value | Meaning | Verified source |
|---|---|---|
| `22` | merged PRs into repositories he does not own | GitHub search API, live |
| `6` | external repositories merged into | derived, live |
| `13` | merged into `kubescape/kubescape` alone | GitHub search API, live |
| `11.6k` | stars on Kubescape (CNCF incubating) | `repos/kubescape/kubescape` |
| `9.22` | CGPA / 10 | resume, static |
| `27` | public repositories | GitHub user API, live |
| `2023` | contributing since | GitHub `created_at`, live |

> **Also fix your GitHub profile README** (`aryanghai12/aryanghai12`) — it still carries the 98% and 40% claims. Same reasoning applies there.

---

## 3. Verified owner content

### Identity
- **Aryan Ghai** — backend & systems engineer
- Greater Noida, India · **Open to Software Engineering internships**
- B.Tech CSE, **Noida Institute of Engineering and Technology**, 2023 – Present, **CGPA 9.22 / 10**
- Specialisation: data structures, algorithms, object-oriented design

### Positioning statement (use verbatim)
> I build systems that verify other systems. A tool shouldn't claim a change is safe —
> it should run it in isolation and show you the receipt.

### Links — all verified reachable

| Channel | URL | Status |
|---|---|---|
| Email | `aryanghai1205@gmail.com` | — |
| GitHub | `github.com/aryanghai12` | 200 |
| GitLab | `gitlab.com/aryanghai1205` | 200 |
| LinkedIn | `linkedin.com/in/aryan-ghai-4b31452b9` | live (LinkedIn returns 999 to bots — normal) |
| Codolio | `codolio.com/profile/aryanghai` | 200 |
| LeetCode | `leetcode.com/u/aryanghai12` | live (403 to bots — normal) |
| CodeChef | `codechef.com/users/aryanghai` | 200 |
| Codeforces | `codeforces.com/profile/aryanghai` | live |

> **Competitive-programming note.** The Codeforces API returns rating **1154**, max **1204**, rank *newbie / max pupil*. Link the profiles — **do not render the ratings as hero figures.** They will read as weak next to a 13-PR Kubescape record, which is the genuinely rare achievement. Ratings belong behind a link, not on a gauge.
>
> **Cavix live demo** (`cavix-f5ib.onrender.com`) did not respond — Render free tier cold-sleeps. Either wake it before launch, remove the "Live" badge, or label it **"demo — cold start ~30 s"**. A dead demo link is worse than no demo link.

### Experience — OWASP Foundation, Open Source Intern (05/2026 – 08/2026, Remote)

Stack: Python, Cloudflare Workers, Docker, Ruby on Rails.

Verified from `gitlab.com/owasp-blt/blt-toasty`: **31 issues authored**, 1 merged MR, 2 commits, and the project README + 12-week roadmap. That profile is **architecture and technical planning**, not bulk code — which is exactly what "architected" means and is a legitimately senior thing for an intern to have done. Frame it that way and it is strong. Frame it as shipped volume and it is checkable and wrong.

**Copy to use:**
> Designed the architecture for **BLT-Toasty**, an AI triage and responsible-disclosure assistant for the OWASP Bug Logging Tool: a fail-closed redaction gate on Cloudflare Workers where no model inference and no vector embedding can execute until Microsoft Presidio has cleared the payload — and any failure quarantines the event instead of proceeding. Authored the 12-week delivery roadmap and 31 tracked issues against it. Also shipped production Python and Rails into the wider OWASP BLT ecosystem through maintainer review.

**Do not** give BLT-Toasty a project card. It is an internship line only.

### Projects — exactly three

**001 · CAVIX** — execution-grounded code review & sandbox engine
`Go` `Python` `TypeScript` `LangGraph` `Postgres/pgvector` `Redis Streams` `Docker` `gVisor` `Tree-sitter`
06/2026 – Present · `github.com/aryanghai12/CavixCode`

- AI code review that **proves its findings before it speaks**. It writes a test that fails only if the bug is real, runs it in a network-isolated sandbox, applies its own fix, re-runs. Unreproducible findings are discarded before a human sees them.
- 13-stage pipeline from webhook to posted review; Go edge receiver → Redis Streams → orchestrator.
- Whole-repo AST + semantic graph (Tree-sitter, pgvector) computes the **blast radius** of a change rather than guessing it. Call-graph diagrams in the PR body are *measured*, never model-drawn.
- gVisor + Docker execution layer, **zero network egress**, teardown verified per review.
- BYOK across Anthropic / OpenAI / Google. Runs air-gapped. Reviews GitHub, GitLab, Bitbucket and Azure DevOps PRs.
- Output discipline enforced in code: **no emoji anywhere** (there is a test that fails the build if one gets in), geometric severity marks, no invented statistics. *This detail alone tells an engineer everything about the author.*

**002 · TRACECV** — client-side ATS résumé x-ray & verification engine
`Next.js` `TypeScript` `Web Workers` `pdfjs-dist` `mammoth` `Node.js` `Docker`
08/2026 – Present · `github.com/aryanghai12/TraceCV`

- **Nothing is uploaded.** PDF/DOCX parsed and rendered in-browser on Web Workers.
- The **Parse X-ray**: the résumé redrawn as the parser sees it, every line at true position, coloured *read cleanly / read with risk / not read*. Catches the two-column silent-failure case.
- Post-hoc verification enforces **exact substring matching** against the source document — the model cannot render a skill, employer, date or metric it cannot quote.
- Deterministic TypeScript scoring (published weights), stateless zero-logging BYOK proxy, AES-GCM browser storage, strict CSP.
- States its own non-goals in the README: no OCR, no outcome promises, no real-ATS claim. **Lead with that** — self-imposed limits are the rarest signal in a portfolio.

**003 · REPOPULSE** — CI/CD pipeline bottleneck analyser
`R` `Shiny` `bslib` `Plotly` `httr2` `K-Means` `PCA` `GitHub REST API`
03/2026 · `github.com/aryanghai12/RepoPulse`

- Ingests live PR data from any GitHub repo, engineers a statistical feature matrix, runs **K-Means to auto-discover bottleneck personas**: *Fast Track*, *Average Churn*, *Review Black Hole*.
- Features: time-to-merge, code churn, review friction, commits-per-file. IQR outlier removal → `log1p` → z-score → K-Means (`nstart = 50`) → PCA for 2D projection. `k` validated by Elbow **and** Silhouette.
- Ships a full **Methodology tab** with the K-Means objective, Lloyd's algorithm and the silhouette formula in LaTeX. It shows its work.
- Default target repo is `OWASP/BLT` — it analyses the pipeline he actually worked in.

> **Language-badge correction:** GitHub reports RepoPulse as 87% HTML because Shiny renders HTML artifacts. The real stack is **R**. Hardcode `R · Shiny` for this card; do not derive its badges from the languages API.

### Upstream — verified merged, live-fetched

**22 merged PRs across 6 repositories he does not own.**

| Organisation | Repository | Merged | Note |
|---|---|---:|---|
| **Kubescape** (CNCF incubating, 11.6k★) | `kubescape/kubescape` | 13 | attack-path rules, OPA processor hardening, scan-status fixes |
| | `kubescape/node-agent` | 3 | eBPF profiler: timestamp chain + size accounting |
| | `kubescape/regolibrary` | 1 | Windows `securityContext` compliance rules |
| **OWASP** | `OWASP/Nest` | 2 | API-docs UI, OAuth setup docs |
| **Antiwork** | `antiwork/gumroad` | 1 | SCSS → Tailwind migration |
| Team project | `Vanshikadahaliya/TouristSafety` | 2 | Smart India Hackathon |

Representative merged titles (real, use these):
```
feat(rules): add steal-privileged-pods-v1                          kubescape/kubescape #3224
feat(rules): add issue-token-secrets-v1                            kubescape/kubescape #3174
feat(rules): add provider-iam-assumption-v1                        kubescape/kubescape #3149
fix(opaprocessor): move opaRegisterOnce to package level           kubescape/kubescape #2624
fix(containerprofilemanager): repair timestamp chain on LRU evict  kubescape/node-agent  #884
feat: add rego rules for Windows securityContext compliance        kubescape/regolibrary #765
```

> **GitLab caveat:** GitLab's public API exposes no aggregate MR count per author. Link the GitLab profile; **do not display a GitLab MR number.** The one verified upstream merge there is `owasp-blt/blt-toasty!10`.

### Skills — verified against actual repo language bytes

| Group | Items |
|---|---|
| Languages | Go, Python, TypeScript, JavaScript, Java, SQL, C, Ruby, Solidity, R |
| Backend & systems | microservices, concurrency, REST, Redis Streams, PostgreSQL + pgvector, memory management |
| Infra & runtime | Docker, gVisor, Kubernetes/OpenShift *(basic)*, Cloudflare Workers, Azure *(basic)*, Git, Linux (Bash/RHEL) |
| AI systems | LangGraph, Tree-sitter, multi-provider BYOK routing (Anthropic / OpenAI / Gemini) |
| Quality | PyTest, `go test`, integration testing, CI/CD, Rego/OPA, code review workflows, Agile |

Honesty note: keep the `(basic)` qualifiers. They cost nothing and buy credibility for everything unqualified.

---

## 4. The organising idea

> **A codebase is architecture. The visitor is a reviewer moving through it.**

Every effect on the page serves that one sentence. If a proposed effect doesn't, it gets cut — §12 exists because "effects stacked without a single organising idea" is the actual definition of an AI-slop site.

This is not decoration chosen to look technical. It is a literal rendering of what Cavix does: index a repository as a graph, move through it, illuminate what a change touches. The background *is* the portfolio's argument.

### The background: **THE INDEX**

A dark, foggy, effectively infinite volume built from **source lines as geometry**.

**Geometry**
- One `InstancedMesh`. ~8,000 instances desktop, ~2,500 mobile. Each instance is a thin horizontal bar = one line of code; bar length ∝ line length, so the silhouette reads as *indented source* at a glance without a single glyph being rendered.
- Bars stack into **file blocks** (20–60 lines each), file blocks arrayed on an XZ grid → a corridor, a hall, a canyon of code.
- Per-instance colour attribute carries state: `dormant` slate → `indexed` bone → `changed` ember.
- A second, much smaller instanced mesh of thin quads draws **edges** between file blocks (the call graph).

**Light — the single most important decision**
- `FogExp2` at low density. This is what sells infinity and what keeps the geometry budget honest: distant instances dissolve rather than needing detail. (Kage leans on fog ~25 times for exactly this reason.)
- One dim directional key + **one point light that travels with the camera**. As it passes a file block, those lines catch it and briefly warm.
  **That travelling light is the reviewer reading the code.** Everything else is set dressing.
- **No bloom by default.** Bloom on dark + a warm accent is precisely where "neon cyberpunk cliché" comes from. Optional: a subtle vignette quad, nothing more.

**Scroll behaviour**
- Lenis emits one normalised scroll value → lerped → drives `camera.position.z`.
- Sections carry `data-cam="hero|about|work|upstream|connect"` (Kage's pattern) defining camera stations; GSAP ScrollTrigger scrubs between them. **Scrub, never time-based** — the visitor controls pace.

**Reconfiguration per section — this is the jaw-drop**

| Section | The Index becomes |
|---|---|
| **Hero** | The hall at rest. Lines dormant, slow drift, one shaft of light down the centre aisle. |
| **README** | Lines rotate to face camera and collapse into a single lit column standing behind the terminal panel. |
| **Work** | File blocks pull apart; edges draw between them → **a call graph in space**. Cavix's blast-radius index, made literal. |
| **Upstream** | Blocks compress into concentric rings — commit history as annual rings. 22 of them glow ember. |
| **Connect** | Everything drifts toward one vanishing point; a single ember beam terminates on the console panel. |

Implementation: precompute each configuration's target matrices **once** at init. Transition = lerp current → target, driven by ScrollTrigger progress. One loop, no allocation per frame, no re-instancing. Cheap enough to run at 60fps on a mid-range Android.

**Why this and not gears:** gears are a metaphor for machinery in general. This is a metaphor for *his* machinery, and it doubles as a live demo of the thing he built. It also cannot be mistaken for a template, because no template ships it.

---

## 5. Visual system

### Palette — graphite + one ember

| Token | Hex | Use |
|---|---|---|
| `--void` | `#06080A` | deepest ground, fog colour |
| `--panel-0` | `#0B0E12` | base surface |
| `--panel-1` | `#12171C` | raised panel |
| `--panel-2` | `#1B2229` | code surface / inset |
| `--edge` | `#2A333C` | structural hairline |
| `--bone` | `#E4E9EE` | primary text |
| `--bone-dim` | `#9AA5B0` | secondary text |
| `--mute` | `#626D78` | labels, line numbers |
| `--ember` | `#E3873F` | **the single accent** |
| `--ember-hi` | `#FFB067` | struck highlight only |

**Semantic pair — permitted *only* inside code surfaces:**

| Token | Hex | Use |
|---|---|---|
| `--add` | `#6E9F5B` | diff addition |
| `--del` | `#B4544A` | diff deletion |

These are desaturated on purpose. They are not a second and third accent — they are syntax, and a diff that isn't green/red is a diff nobody can read. Outside a `<pre>` or a diff row they are forbidden.

**Why ember.** Amber monochrome CRTs are the historical terminal, and warm-on-cold gives contrast on two axes at once (value *and* temperature). It is coding-native rather than sci-fi-generic. Cyan-on-black is the exhausted default; matrix green is worse.

**Palette rules**
- The accent covers **1–2% of pixels**. Corner ticks, the caret, one status LED, active states, the 22. Never a headline, never a large fill.
- **Never pure black.** Base sits at 4–6% lightness so surfaces can elevate above it.
- **Depth comes from light, not shadow.** Elevate a surface by lightening it and adding a 1px top border at 8–16% white. That hairline is the single highest-leverage detail on the page.

### Typography — the organising rule

> **One mono for what the machine says. One grotesque for what the human says.**

| Voice | Face | Source | Used for |
|---|---|---|---|
| **Machine** | **JetBrains Mono** (400/700) | Google Fonts | section labels, all data, code, terminal, PR titles, metrics, the hero name |
| **Human** | **Instrument Sans** (400/500/600) | Google Fonts | all prose, descriptions, UI |
| **Aside** | **Instrument Serif Italic** | Google Fonts | exactly one element: the positioning statement in §3 |

- **Set the hero name in JetBrains Mono at display size** (`clamp(3.5rem, 11vw, 9rem)`, weight 800, tracking `-0.04em`). A giant mono headline is instantly, unmistakably *code*, and almost nobody executes it well. This is the type decision that makes the site.
- The serif italic appears **once**. One unexpected note in a system of two is a designer's signature; two notes is a mess.
- Explicitly banned: **Inter, Poppins, Space Grotesk**. Overexposed to the point of being a tell.

### Materials

- **Glass:** `backdrop-filter: blur(20px) saturate(1.3)` + a **gradient** 1px rim via `mask-composite: exclude` (bright top-left → ember bottom-right) + inset top highlight + deep drop shadow. A flat `1px solid rgba(255,255,255,.1)` border is the tutorial version and reads identically to every other glass site on earth.
- **Grain:** SVG `feTurbulence` as a data URI. Six lines, zero bytes, infinite resolution. A downloaded grain PNG costs 400 KB and tiles visibly — never.
- **Code surfaces:** `--panel-2` with a 1px `--edge` rule, `--mute` line numbers in a fixed gutter, generous `line-height: 1.7`. Real syntax colouring at low saturation. Code that looks like code, not like a screenshot of code.
- **Scanline:** a single 1px `--ember` horizontal rule at 30% opacity that sweeps a panel once on reveal. Once. Not looping.

---

## 6. Section architecture

| # | Section | `data-cam` | Contains |
|---|---|---|---|
| 00 | **BOOT** — hero | `hero` | Mono name at display scale, role strip, positioning statement, live stat row, scroll cue |
| 01 | **README.md** — who | `about` | Kinetic headline, three prose paragraphs, terminal console panel |
| 02 | **THE INDEX** — work | `work` | Three project instruments (§7) |
| 03 | **DEPENDENCIES** — stack | `work` | Interactive bipartite tech↔project graph |
| 04 | **UPSTREAM** — open source | `upstream` | Live merged-PR wall |
| 05 | **CONNECT** | `connect` | Working console + remotes table |

Persistent overlays: thin HUD frame with corner ticks and micro-labels · scroll progress rail · two-element cursor · `⌘K` command palette · the Index canvas behind everything.

### 00 · BOOT
No fake boot sequence, no progress bar, no "INITIALIZING…". §12 forbids it and it wastes the only three seconds that matter.

Instead: the page paints **immediately** with all text present in the DOM. The Index fades up from fog over ~800 ms while the name resolves. Below the name, a mono strip:

```
backend & systems  ·  greater noida, in  ·  open to SWE internships
```

Then a live stat row — **four figures, all fetched at build time**:

```
22            6              27            2023
merged        upstream       public        contributing
upstream      repos          repos         since
```

Scroll cue: a single ember tick that descends 8px and resets. Not a bouncing mouse icon.

### 01 · README.md
Kinetic headline. Three paragraphs of real prose about verification-over-assertion. Then the **console panel**: glass over the Index, with a live-looking session.

**Type the command character-by-character. Never the output.** Reading runs ~250 wpm; character typing runs ~30 wpm — typing prose is user-hostile and it is on the anti-list. Output lines stagger in as whole lines, ~90 ms apart.

```
aryan@index ~ % whoami

  name       Aryan Ghai
  role       backend & systems engineer
  edu        NIET, Greater Noida · B.Tech CSE · 9.22 / 10
  now        Open Source Intern, OWASP Foundation
  thesis     verification over assertion
```

### 02 · THE INDEX (work)
Three projects, each presented as **a working reduction of the product itself**, not a card with a screenshot. This is the section that separates this site from every other portfolio. Each is a glass instrument panel pinned while its content scrubs.

**001 · Cavix — "The Review".** The panel reconstructs a real Cavix PR comment as you scroll: scope-table rows appear one by one, then a finding callout, then the sandbox transcript typing out:

```
[repro] node --test webhook.exploit.test.mjs  →  exit 0    exploit succeeded
[fix]   applied suggested patch
[repro] node --test webhook.exploit.test.mjs  →  exit 1    exploit blocked
[suite] node --test                           →  exit 0    suite still green
```

Endcap line, ember: **"Anything it cannot reproduce is dropped."** No percentages anywhere.

**002 · TraceCV — "The X-ray".** Split panel. Left: a résumé rendered as abstract layout blocks. Right: the parse trace. A horizontal scan line sweeps down on scroll-scrub; as it passes each block, the block colours *read clean* / *read with risk* / *not read*, and the corresponding trace line writes itself on the right. Use a generic placeholder document — never a real résumé, and never an invented score.

**003 · RepoPulse — "The Cluster".** A live 2D PCA scatter inside the panel. Points enter as a grey cloud, then **the K-Means animation runs on scroll**: centroids seed, points reassign by colour, centroids settle. Three personas label themselves — *Fast Track*, *Average Churn*, *Review Black Hole*. Beneath it, the objective function set in real math:

```
argmin  Σ ‖x − μᵢ‖²
```

Nobody else has a k-means animation in their portfolio. Ship it.

All three panels: pointer-tracked tilt **capped at 6° / 4°**, specular glint via `radial-gradient` at `var(--mx) var(--my)`, an ember rule that draws left→right on hover. Keyboard-reachable, with the same states on `:focus-visible`.

### 03 · DEPENDENCIES (stack)
**Not a badge wall.** A badge wall is the single most common portfolio failure and it communicates nothing — every badge looks equally weighted whether it's 2 MB of Go or one `.tsx` file.

Instead: an interactive **bipartite graph**. Technologies on an arc, the three projects as anchors, **edges derived from real `languages` API data**:

| Project | Verified language bytes |
|---|---|
| CavixCode | TypeScript 2.04 MB · Go 144 KB · JavaScript 116 KB · HCL · Shell |
| TraceCV | TypeScript 800 KB · JavaScript 20 KB |
| RepoPulse | R 125 KB *(HTML is Shiny render output — ignore)* |

Hover or focus a technology → its edges illuminate ember, everything unrelated dims to `--mute`. Hover a project → its full stack lights. Edge thickness ∝ actual bytes, so **Go being thin on Cavix is visible and honest** — and that honesty is the point of the whole site.

Arrow-key navigable. Under `prefers-reduced-motion`, renders as a static labelled graph.

### 04 · UPSTREAM
The strongest section, and the one v1 buried. 13 merged PRs into a CNCF project is rarer than any project card.

Full-bleed. A single large mono figure — **22** — then the repository table from §3, then a scrolling wall of real merged PR rows fetched live:

```
◈  feat(rules): add steal-privileged-pods-v1        kubescape/kubescape  #3224  merged
◈  fix(opaprocessor): move opaRegisterOnce …        kubescape/kubescape  #2624  merged
```

Rows shift `padding-left` by 8px on hover with an ember tick appearing in the gutter. Every row links to the real PR. **Anyone can click through and check** — which is the entire argument of the site, demonstrated rather than stated.

Closing line: *"Merged in repositories where the standards were not mine to set."*

### 05 · CONNECT
Must be the most alive part of the page — it's the one that converts.

The Index's ember beam terminates here. The console is the only fully-lit surface on the site.

A **console that actually works.** Six commands, each doing something real, each also available as a clickable chip so nothing is gated behind knowing to type:

| Command | Action |
|---|---|
| `mail` | opens `mailto:` and copies the address |
| `gh` | opens github.com/aryanghai12 |
| `gl` | opens gitlab.com/aryanghai1205 |
| `in` | opens LinkedIn |
| `cp` | opens Codolio |
| `resume` | downloads the PDF |

Then a `git remote -v` styled table with copy-to-clipboard on every row:

```
origin   github.com/aryanghai12          (fetch)
mirror   gitlab.com/aryanghai1205        (fetch)
social   linkedin.com/in/aryan-ghai…     (push)
stats    codolio.com/profile/aryanghai   (fetch)
```

Above it, one line in Instrument Serif Italic:
> *Open to Software Engineering internships.*

And a status row with a slow-pulsing ember LED: `● available · Greater Noida, IN · IST (UTC+5:30)` — render the timezone clock live from `Intl.DateTimeFormat`. It costs four lines and makes the page feel connected to a real person in real time.

---

## 7. Signature features

**A. The Index** — §4. The centrepiece.

**B. Kinetic text.** Split headings to per-character spans. Reveal from `opacity 0 / translateY(.4em) / rotateX(-70deg) / blur(6px)` → resolved, staggered ~24 ms/char. `aria-label` carries the original string; spans are `aria-hidden`. Text lives in the DOM first and is animated — never generated by JS.

**C. Working terminals.** Two of them (§01, §05), both real. Command typed, output staggered by line.

**D. Project instruments.** §02. Each is a miniature of the product.

**E. `⌘K` command palette.** In scope — on a site about developer tooling, a real keyboard interface is thematically load-bearing rather than decorative. `⌘K` / `Ctrl K` opens; fuzzy-filters sections, projects and links; `↑↓` navigate, `↵` executes, `esc` closes. Full focus trap. Also reachable by a visible button for pointer and touch users.

**F. Micro-interactions.**
- Two-element cursor: exact dot + ring lerped at `0.16`/frame. **The lag is the effect.** Ring scales and warms to ember over interactive surfaces.
- Log/PR rows shift `padding-left` on hover, ember tick in the gutter.
- Copy buttons flip to a check for 1.2 s.
- Focus rings are 2px ember at 2px offset — visible, on-brand, never `outline: none`.

---

## 8. Motion rules

1. **Only animate `transform` and `opacity`.** Both run on the compositor. Animating `width`, `top`, `margin` or `filter` forces layout every frame.
2. **Never type prose.** Type the command; stagger prose as whole lines.
3. **Pre-render all text in the DOM**, animate visibility. JS-built text is invisible to crawlers and screen readers.
4. **Scroll-scrub over time-based** wherever possible.
5. **Transitions live in 200–400 ms.** Feel lives in the easing curve, not the effect. `cubic-bezier(.16,1,.3,1)` and `cubic-bezier(.22,.61,.36,1)`.
6. **Small rotations read as physical; large ones read as a demo.** Cards cap at 6°/4°.
7. **Nothing loops forever except the LED and the fog drift.** Perpetual motion is visual noise the eye learns to ignore, and it burns battery for zero information.

---

## 9. Tech stack — all free for commercial use

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js** (App Router) | Static export, free on Vercel, best ecosystem |
| Styling | **Tailwind v4** + CSS custom properties | Tokens in one place |
| 3D | **react-three-fiber** + **drei** | The Index needs real WebGL: instancing, fog, per-instance colour. MIT. |
| Scroll | **GSAP** ScrollTrigger + SplitText | Free in full since Webflow's 2025 licence change |
| Smooth scroll | **Lenis** | Duration < 1.2 s. Disabled under `prefers-reduced-motion`. MIT. |
| Component motion | **Motion** (ex-Framer Motion) | Component state only; GSAP owns scroll |
| Icons | **Lucide** | ISC |
| Fonts | Google Fonts, self-hosted via `next/font` | OFL |
| Data | GitHub + GitLab REST at **build time** | Static JSON, zero client fetch, zero API keys shipped |
| Hosting | Vercel / Cloudflare Pages | Free tier |

**Build-time data fetch:** a `scripts/fetch-stats.ts` run in `prebuild` hits the GitHub search and languages endpoints, writes `data/stats.json`, and the page imports it. Numbers stay current on every deploy, no key is exposed, and there is no client-side loading state. If the fetch fails, the build fails — better than shipping stale numbers on a site about verification.

---

## 10. Performance budget

- Clamp DPR: `Math.min(devicePixelRatio, 1.75)`. Biggest single win on high-density displays.
- **One `InstancedMesh` for lines, one for edges.** Two draw calls for the entire background.
- Precompute all configuration target matrices at init. Zero allocation in the frame loop.
- Fog does the culling work; still frustum-cull before any per-instance update.
- `rAF`-throttle every pointer and scroll handler. One rAF loop for the whole page, not one per component.
- Halt the render loop on `document.hidden` and when the canvas leaves the viewport (`IntersectionObserver`).
- Budget **3–5 `backdrop-filter` surfaces on screen at once**, not twenty. It is the most expensive property in the stylesheet.
- Dynamically import the 3D bundle so the hero paints first. The page must be readable before WebGL initialises, and must remain fully functional if WebGL is unavailable.
- Mobile: 2,500 instances, no reconfiguration transitions (cross-fade static states), no custom cursor.
- **Test at 4× CPU throttle on a throttled connection.** Gorgeous on an M-series MacBook and unusable on a mid-range Android is the standard failure mode, and it is the one that loses the internship.
- Targets: LCP < 2.0 s · CLS < 0.05 · 60 fps desktop, ≥ 45 fps mid-range Android.

---

## 11. Accessibility floor (non-negotiable)

- Full `prefers-reduced-motion`: freeze the Index at a static configuration, kill tilt, kill the custom cursor, disable Lenis, reveal all text immediately. The site must be complete and beautiful with zero motion.
- Every interactive surface has a visible `:focus-visible` ring. Project instruments, PR rows, tech-graph nodes and console chips are all keyboard-reachable and operable.
- Kinetic text: `aria-label` on the parent, `aria-hidden` on character spans.
- The `⌘K` palette traps focus, restores it on close, is labelled `role="dialog" aria-modal="true"`.
- Real semantic headings in order. All content in the DOM at first paint.
- Canvas is `aria-hidden` decorative — it carries no information not also in text.
- Responsive to **375px**. Contrast: body text ≥ 4.5:1, ember on `--panel-1` verified ≥ 4.5:1 before shipping.
- Everything works with WebGL disabled or blocked.

---

## 12. Anti-requirements

**Aesthetic**
- ❌ Matrix falling-code background. The instant tell.
- ❌ Neon cyan / magenta / acid green. The palette is graphite and one ember.
- ❌ Purple-blue mesh gradient behind blurred glass cards.
- ❌ Bloom postprocessing on the accent.
- ❌ Inter, Poppins, Space Grotesk.
- ❌ Flat `1px solid rgba(255,255,255,.1)` glass borders.
- ❌ More than one accent colour. `--add`/`--del` are syntax, confined to code surfaces.
- ❌ Downloaded grain PNGs.
- ❌ Emoji in UI chrome. Cavix has a build test that bans them — the portfolio should hold the same line.

**Behaviour**
- ❌ Fake hacker loading screens or meaningless progress bars.
- ❌ Unskippable intro animations. Anything longer than 800 ms needs a skip.
- ❌ Typing animations on paragraphs.
- ❌ Heavy 3D that takes five seconds to load, or blocks first paint.
- ❌ 15–25° card tilts.
- ❌ Perpetual loops that carry no information.
- ❌ Scroll-jacking that fights the user's input.

**Content**
- ❌ Any hardcoded metric. Live-fetched or absent.
- ❌ The 98%, the 40%, the <100 ms, the 30%.
- ❌ Competitive-programming ratings displayed as figures.
- ❌ Twelve projects instead of three.
- ❌ A "Live demo" badge pointing at a sleeping Render instance.
- ❌ Effects stacked without the §4 organising idea behind them.

---

## 13. Build order

**Structure first, effects last.** If the skeleton is generic, no amount of animation saves it. Do not open a shader until step 5.

1. **Tokens + type scale + section skeleton.** Zero effects. Verify it reads well as plain HTML.
2. **Real content, full responsive pass to 375px.** Static. The site should already be *good* here.
3. **Build-time data fetch** (`scripts/fetch-stats.ts` → `data/stats.json`), wired into the stat row, Upstream section and tech graph.
4. **Glass + code surfaces + grain.** The material system.
5. **The Index — static first.** One configuration, fog, lights, no motion. Confirm 60 fps before adding anything.
6. **Index motion:** camera travel on scroll, then per-section reconfiguration.
7. **Scroll reveals + kinetic text.**
8. **Project instruments** (review transcript, x-ray scan, k-means). These are the highest-value items after the Index — budget real time.
9. **Tech graph + Upstream wall.**
10. **Terminals + `⌘K` palette + cursor + micro-interactions.**
11. **Hero entrance sequence.**
12. **Performance pass, reduced-motion pass, keyboard pass, 4× CPU throttle test.**

---

## 14. Open decisions

- [ ] **Hero entrance** — does the Index fade up from fog while the name resolves, or is it already present and the camera pulls back? *(Recommend: fade up from fog, ≤ 800 ms, skippable by any scroll input.)*
- [ ] **Project instruments** — pinned-and-scrubbed while playing through, or play once on entry and stay static? *(Recommend: pinned + scrubbed for Cavix and TraceCV, play-once for RepoPulse's k-means.)*
- [ ] **Fourth project slot** — `Net-Sentry` (Go + eBPF kernel capture, Three.js globe, 86 KB TS / 48 KB Go / 4 KB C, verified real) is genuinely strong and would prove kernel-level range. Include as a fourth card, or as a one-line "also built" strip, or cut? *(Recommend: a compact "also built" strip with Net-Sentry and RepoCop — keeps three headline projects while showing depth.)*
- [ ] **Cavix live demo** — wake the Render instance for launch, or drop the badge?
- [ ] **Serif italic** — keep the single Instrument Serif moment on the positioning statement, or go fully mono + grotesque?
- [ ] **Résumé PDF** — host it, or link to Codolio only?
