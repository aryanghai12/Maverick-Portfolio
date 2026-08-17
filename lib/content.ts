/**
 * Every string the site displays.
 *
 * Kept in one file on purpose: content this specific gets fact-checked as a unit,
 * and a claim buried in a component is a claim nobody re-reads. Anything
 * measurable lives in data/stats.json instead and is fetched at build time.
 *
 * Deliberately absent, and not to be reintroduced: "98% fewer hallucinations",
 * "40% review bottleneck reduction", "<100 ms under concurrent load", "30% less
 * triage time". All four are self-measured against a private baseline. On a site
 * whose entire argument is proof over claims, they are the fastest way to lose a
 * reader who knows what they are looking at. Mechanism is stated instead, which
 * is both more impressive and fully checkable.
 */

export const identity = {
  name: 'aryan ghai',
  role: 'backend & systems engineer',
  location: 'Greater Noida, IN',
  status: 'Open to Software Engineering internships',
  timezone: 'Asia/Kolkata',
  tzLabel: 'IST (UTC+5:30)',
  email: 'aryanghai1205@gmail.com',
} as const;

export const thesis =
  'I build systems that verify other systems. A tool shouldn’t claim a change is ' +
  'safe — it should run it in isolation and show you the receipt.';

export const links = {
  github: 'https://github.com/aryanghai12',
  gitlab: 'https://gitlab.com/aryanghai1205',
  linkedin: 'https://www.linkedin.com/in/aryan-ghai-4b31452b9/',
  codolio: 'https://codolio.com/profile/aryanghai',
  leetcode: 'https://leetcode.com/u/aryanghai12',
  codechef: 'https://www.codechef.com/users/aryanghai',
  codeforces: 'https://codeforces.com/profile/aryanghai',
  email: 'mailto:aryanghai1205@gmail.com',
} as const;

/* ------------------------------------------------------------------ about */

export const about = {
  heading: 'verification over assertion',
  paragraphs: [
    'I write backend and systems software, mostly in Go and Python, and mostly in ' +
      'the space where a program has to make a judgement about other code. That ' +
      'turns out to be a place where confident guessing is very cheap and being ' +
      'right is expensive.',
    'So the through-line in everything below is the same: don’t assert, execute. ' +
      'A review tool that thinks it found a bug should write a test that fails only ' +
      'if the bug is real, run it in a sealed sandbox, apply the fix and run it ' +
      'again. A résumé parser that thinks it found a skill should be able to quote ' +
      'the line it came from, or stay quiet.',
    'The rest of my time goes to open source. Most of what I have shipped this year ' +
      'landed in repositories I do not own, under review by maintainers whose ' +
      'standards were not mine to set — which is the only code review that really ' +
      'tells you where you stand.',
  ],
  /* The console session in section 01. The command is typed; output is staggered
     by whole line, never character by character. */
  console: {
    command: 'whoami',
    prompt: 'aryan@index',
    output: [
      ['name', 'Aryan Ghai'],
      ['role', 'backend & systems engineer'],
      ['edu', 'NIET, Greater Noida · B.Tech CSE · 9.22 / 10'],
      ['now', 'Open Source Intern, OWASP Foundation'],
      ['thesis', 'verification over assertion'],
    ] as [string, string][],
  },
} as const;

/* --------------------------------------------------------------- projects */

export type ProjectCopy = {
  id: 'cavix' | 'tracecv' | 'repopulse';
  index: string;
  name: string;
  tagline: string;
  period: string;
  /** Stack shown on the card. RepoPulse is hardcoded to R because the GitHub
      languages API reports it as ~87% HTML — Shiny commits rendered artifacts. */
  stack: string[];
  body: string;
  points: string[];
  /** The one line that closes the card, set in ember. */
  endcap: string;
};

export const projects: ProjectCopy[] = [
  {
    id: 'cavix',
    index: '001',
    name: 'Cavix',
    tagline: 'execution-grounded code review & sandbox engine',
    period: '06/2026 — present',
    stack: ['Go', 'Python', 'TypeScript', 'LangGraph', 'pgvector', 'Redis Streams', 'gVisor', 'Docker'],
    body:
      'AI code review that proves its findings before it speaks. For a suspected ' +
      'bug it writes a test that fails only if the bug is real, runs it in a ' +
      'network-isolated sandbox, applies its own suggested fix, and runs it again. ' +
      'For a suspected security hole it writes a proof-of-concept and tries it.',
    points: [
      'Thirteen stages from webhook to posted review: a Go edge receiver verifies the signature and pushes to Redis Streams, an orchestrator takes it from there.',
      'A whole-repository AST and semantic graph (Tree-sitter, pgvector) computes the blast radius of a change instead of guessing it. Call-graph diagrams in the PR body are measured, never drawn by a model.',
      'The execution layer runs on gVisor and Docker with zero network egress, and teardown is verified per review.',
      'BYOK across Anthropic, OpenAI and Google. Runs air-gapped. Reviews pull requests on GitHub, GitLab, Bitbucket and Azure DevOps.',
      'No emoji anywhere in its output, enforced by a test that fails the build if one gets in.',
    ],
    endcap: 'Anything it cannot reproduce is dropped before a human sees it.',
  },
  {
    id: 'tracecv',
    index: '002',
    name: 'TraceCV',
    tagline: 'client-side ATS résumé x-ray & verification engine',
    period: '08/2026 — present',
    stack: ['Next.js', 'TypeScript', 'Web Workers', 'pdfjs-dist', 'mammoth', 'Docker'],
    body:
      'A résumé parser that never uploads your résumé. PDF and DOCX are parsed and ' +
      'redrawn entirely in the browser, on Web Workers, so the document never ' +
      'leaves the machine it was opened on.',
    points: [
      'The Parse X-ray redraws the document as the parser sees it — every line at its true position, coloured by whether it was read cleanly, read with risk, or not read at all. It catches the two-column silent failure, which is the most common one there is.',
      'A post-hoc verifier enforces exact substring matching against the source text, so the model cannot render a skill, employer, date or metric it is unable to quote.',
      'Deterministic TypeScript scoring with published weights: same document, same score, every run.',
      'Stateless zero-logging BYOK proxy, AES-GCM encrypted browser storage, strict Content-Security-Policy.',
      'The README states its own non-goals first: no OCR, no outcome promises, no claim to be a real ATS.',
    ],
    endcap: 'If it cannot quote you, it does not get to say it.',
  },
  {
    id: 'repopulse',
    index: '003',
    name: 'RepoPulse',
    tagline: 'CI/CD pipeline bottleneck analyser',
    period: '03/2026',
    stack: ['R', 'Shiny', 'Plotly', 'httr2', 'K-Means', 'PCA', 'GitHub REST'],
    body:
      'Ingests live pull request data from any GitHub repository, engineers a ' +
      'statistical feature matrix, and runs K-Means to discover bottleneck ' +
      'personas rather than assuming them. It answers "why is our pipeline slow" ' +
      'with a measurement.',
    points: [
      'Features engineered from raw API data: time-to-merge, code churn, review friction, commits per file.',
      'IQR outlier removal at a 3× fence, log1p on the right-skewed features, z-score normalisation, then K-Means with nstart = 50 to avoid local minima.',
      'k is validated by Elbow and Silhouette together, not chosen by eye. PCA is used for the 2D projection only.',
      'Ships a full methodology tab: the K-Means objective, Lloyd’s algorithm and the silhouette formula, written out.',
      'Its default target is OWASP/BLT — it analyses the pipeline I actually worked in.',
    ],
    endcap: 'Three personas fall out of the data: Fast Track, Average Churn, Review Black Hole.',
  },
];

/* Genuinely built, verified real, kept off the headline slots so three projects
   stay three projects. */
export const alsoBuilt = [
  {
    name: 'Net-Sentry',
    what: 'eBPF kernel packet capture in Go, streamed to a WebGL globe',
    stack: 'Go · eBPF · C · Next.js · Docker',
    url: 'https://github.com/aryanghai12/Net-Sentry',
  },
  {
    name: 'RepoCop',
    what: 'serverless GitHub App gating PRs on CONTRIBUTING.md, with provider failover',
    stack: 'TypeScript · Next.js · Redis',
    url: 'https://github.com/aryanghai12/RepoCop',
  },
] as const;

/* ------------------------------------------------------------- experience */

export const experience = {
  org: 'OWASP Foundation',
  role: 'Open Source Intern',
  period: '05/2026 — 08/2026',
  mode: 'Remote',
  stack: ['Python', 'Cloudflare Workers', 'Docker', 'Ruby on Rails'],
  /* Framed as architecture and planning, which is what the GitLab record actually
     shows: 31 authored issues, the README, and the 12-week roadmap. Framed as
     shipped volume it would be checkable and wrong. */
  body:
    'Designed the architecture for BLT-Toasty, an AI triage and responsible-disclosure ' +
    'assistant for the OWASP Bug Logging Tool. Its central invariant is a fail-closed ' +
    'redaction gate: no model inference and no vector embedding can execute until ' +
    'Microsoft Presidio has cleared the payload, and any failure — timeout, parse ' +
    'error, low confidence — quarantines the event instead of letting it proceed. ' +
    'Authored the twelve-week delivery roadmap and the tracked issues against it, and ' +
    'shipped production Python and Rails into the wider OWASP BLT ecosystem through ' +
    'maintainer review.',
} as const;

export const education = {
  school: 'Noida Institute of Engineering and Technology',
  degree: 'B.Tech, Computer Science',
  period: '2023 — present',
  detail: 'CGPA 9.22 / 10 · data structures, algorithms, object-oriented design',
} as const;

/* ------------------------------------------------------------------ stack
   Rendered as a bipartite graph, not a badge wall. Edge weights come from the
   real language-byte counts in data/stats.json, so a thin edge stays thin. */

export const skills = [
  { group: 'languages', items: ['Go', 'Python', 'TypeScript', 'JavaScript', 'Java', 'SQL', 'C', 'Ruby', 'R', 'Solidity'] },
  { group: 'backend & systems', items: ['microservices', 'concurrency', 'REST', 'Redis Streams', 'PostgreSQL', 'pgvector', 'memory management'] },
  { group: 'infra & runtime', items: ['Docker', 'gVisor', 'Kubernetes', 'Cloudflare Workers', 'Linux', 'Bash', 'Git', 'Azure'] },
  { group: 'ai systems', items: ['LangGraph', 'Tree-sitter', 'BYOK routing', 'Anthropic', 'OpenAI', 'Gemini'] },
  { group: 'quality', items: ['PyTest', 'go test', 'integration testing', 'CI/CD', 'Rego / OPA', 'code review'] },
] as const;

/* Qualifiers are kept. They cost nothing and they buy credibility for every
   item that carries no qualifier. */
export const skillQualifiers: Record<string, string> = {
  Kubernetes: 'basic',
  Azure: 'basic',
  Ruby: 'basic',
};

/* ---------------------------------------------------------------- connect */

export const connect = {
  heading: 'connect',
  lede: 'Open to Software Engineering internships.',
  body:
    'The fastest way to reach me is email. Everything I have built or contributed ' +
    'to is linked below and open to inspection — which is the point.',
} as const;
