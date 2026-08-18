/**
 * Every string the site displays.
 *
 * Kept in one file on purpose: content this specific gets fact-checked as a
 * unit, and a claim buried in a component is a claim nobody re-reads. Anything
 * measurable lives in data/stats.json instead and is fetched at build time.
 *
 * Deliberately absent, and not to be reintroduced: "98% fewer hallucinations",
 * "40% review bottleneck reduction", "<100 ms under concurrent load", "30% less
 * triage time". All four are self-measured against a private baseline. On a site
 * whose whole argument is proof over claims, they are the fastest way to lose a
 * reader who knows what they are looking at. Mechanism is stated instead, which
 * is both more impressive and fully checkable.
 */

export const identity = {
  name: 'Aryan Ghai',
  role: 'Backend & Systems Engineer',
  location: 'Greater Noida, India',
  /* TODO(aryan): add the term and duration you actually want, for example
     "Summer 2027, 12 weeks". A recruiter decides whether you are viable before
     they read anything else, and right now this line does not let them. */
  status: 'Open to software engineering internships',
  availability: 'Remote, or relocating within India',
  timezone: 'Asia/Kolkata',
  tzLabel: 'IST (UTC+5:30)',
  email: 'aryanghai1205@gmail.com',
} as const;

/* The opening statement. It leads the page instead of the name, because a
   stranger has no reason to care about the name yet. */
export const thesis = {
  headline: 'I build software that proves it is right before it says it is.',
  support:
    'Backend and systems work, mostly Go and Python, mostly in the place where ' +
    'one program has to make a judgement about another. Guessing is cheap there. ' +
    'Being right is not.',
} as const;

/* ---------------------------------------------------------------- upstream

   The proof section is the strongest thing on this site and it needed a data
   model rather than a flat list.

   Two problems it solves. Ten of the merged pull requests are Rego detection
   rules whose titles differ by a few words, so scanned as a flat list they read
   as one templated contribution repeated ten times, and the count silently
   deflates. And the hardest work, the race conditions and lifecycle bugs, was
   buried under them by a newest-first sort.

   So: the hard bugs lead and carry a plain-English gloss, the rules are grouped
   once with a frame that states what they actually are, and everything else
   follows. Every gloss below is a restatement of the pull request title and
   nothing more. */

/** Repositories that belong to a CNCF project. Used only to phrase the claim. */
export const CNCF_ORGS = new Set(['kubescape', 'openyurtio']);

/** Pull requests worth a sentence, keyed by number. Ordered hardest first. */
export const prHighlights: { number: number; gloss: string }[] = [
  {
    number: 2624,
    gloss:
      'OPA rule registration ran once per scan instead of once per process. ' +
      'Moved to package scope.',
  },
  {
    number: 3034,
    gloss:
      'A metrics scrape could overwrite the stored status and results of the ' +
      'last real scan.',
  },
  {
    number: 884,
    gloss:
      'Container profile timestamps broke their chain when the cache evicted an ' +
      'entry or a retry ran out.',
  },
  {
    number: 2712,
    gloss:
      'A closed or non-interactive stdin spun the CPU in a confirmation prompt ' +
      'instead of being read as a refusal.',
  },
  {
    number: 882,
    gloss:
      'Size accounting for a container profile counted the wrong thing on the ' +
      'syscall and network report paths.',
  },
];

/** The ten Rego rules, stated once, as the thing they collectively are. */
export const ruleGroup = {
  title: 'Ten Rego detection rules, merged into Kubescape',
  body:
    'Each one maps a distinct Kubernetes privilege escalation primitive into ' +
    'policy that runs against real clusters: service account assignment, token ' +
    'issuance, privileged pod modification, node and pod status writes, ' +
    'namespace scoped remote execution, provider IAM assumption. They share a ' +
    'title format because they share a rule format, not because they are one ' +
    'contribution.',
} as const;

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
  heading: 'Verification over assertion',
  paragraphs: [
    'I write backend and systems software, mostly in Go and Python, and mostly ' +
      'in the space where a program has to make a judgement about other code. ' +
      'That turns out to be a place where confident guessing is very cheap and ' +
      'being right is expensive.',
    'So the through line in everything below is the same. Do not assert, execute. ' +
      'A review tool that thinks it found a bug should write a test that fails ' +
      'only if the bug is real, run it in a sealed sandbox, apply the fix, and run ' +
      'it again. A resume parser that thinks it found a skill should be able to ' +
      'quote the line it came from, or stay quiet.',
    'The rest of my time goes to open source. Most of what I shipped this year ' +
      'landed in repositories I do not own, reviewed by maintainers whose ' +
      'standards were not mine to set. That is the only code review that really ' +
      'tells you where you stand.',
  ],
  /* The one line on the site that is not defending a claim.
     TODO(aryan): if you have a real story here, a specific thing that broke and
     sent you down this path, it will beat anything written for you. */
  aside:
    'The honest version: I would rather be corrected by a failing test than ' +
    'believed by a reviewer who is being polite. Most of what I build is a way ' +
    'of arranging for that to happen automatically.',
  /* The console session in section 01. The command is typed; output is staggered
     by whole line, never character by character. */
  console: {
    command: 'whoami',
    prompt: 'aryan@index',
    output: [
      ['name', 'Aryan Ghai'],
      ['role', 'Backend & systems engineer'],
      ['edu', 'NIET, Greater Noida · B.Tech CSE · 9.22 / 10'],
      ['now', 'Open Source Intern, OWASP Foundation'],
      ['thesis', 'Verification over assertion'],
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
      languages API reports it as ~87% HTML: Shiny commits rendered artifacts. */
  stack: string[];
  body: string;
  points: string[];
  /** The one line that closes the card. */
  endcap: string;
};

export const projects: ProjectCopy[] = [
  {
    id: 'cavix',
    index: '001',
    name: 'Cavix',
    tagline: 'Execution grounded code review and sandbox engine',
    period: '06/2026 to present',
    stack: ['Go', 'Python', 'TypeScript', 'LangGraph', 'pgvector', 'Redis Streams', 'gVisor', 'Docker'],
    body:
      'AI code review that proves its findings before it opens its mouth. When it ' +
      'suspects a bug it writes a test that fails only if the bug is real, runs ' +
      'that test in a network isolated sandbox, applies its own suggested fix, and ' +
      'runs it again. When it suspects a security hole it writes a proof of ' +
      'concept and tries it.',
    points: [
      'Thirteen stages from webhook to posted review. A Go edge receiver verifies the signature and pushes to Redis Streams, and an orchestrator takes it from there.',
      'A whole repository AST and semantic graph, built with Tree-sitter and pgvector, computes the blast radius of a change instead of guessing it. The call graph diagrams in the PR body are measured, never drawn by a model.',
      'The execution layer runs on gVisor and Docker with zero network egress, and teardown is verified once per review.',
      'Bring your own key across Anthropic, OpenAI and Google. Runs air gapped. Reviews pull requests on GitHub, GitLab, Bitbucket and Azure DevOps.',
      'No emoji anywhere in its output, enforced by a test that fails the build if one gets in.',
    ],
    endcap: 'Anything it cannot reproduce is dropped before a human ever sees it.',
  },
  {
    id: 'tracecv',
    index: '002',
    name: 'TraceCV',
    tagline: 'Client side ATS resume x-ray and verification engine',
    period: '08/2026 to present',
    stack: ['Next.js', 'TypeScript', 'Web Workers', 'pdfjs-dist', 'mammoth', 'Docker'],
    body:
      'A resume parser that never uploads your resume. PDF and DOCX are parsed and ' +
      'redrawn entirely in the browser on Web Workers, so the document never ' +
      'leaves the machine it was opened on.',
    points: [
      'The Parse X-ray redraws your document as the parser sees it. Every line sits at its true position, coloured by whether it was read cleanly, read with risk, or missed entirely. It catches the silent two column failure, which is the most common one there is.',
      'A verifier runs after the model and enforces exact substring matching against the source text, so nothing can be reported as a skill, employer, date or metric unless it can be quoted.',
      'Deterministic TypeScript scoring with published weights. Same document, same score, every run.',
      'Stateless zero logging proxy for your own API key, AES-GCM encrypted browser storage, strict Content Security Policy.',
      'The README states its non-goals first: no OCR, no outcome promises, no claim to be a real ATS.',
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
      'Pulls live pull request data from any GitHub repository, engineers a ' +
      'statistical feature matrix, and runs K-Means to discover where a team ' +
      'actually stalls rather than assuming it. It answers "why is our pipeline ' +
      'slow" with a measurement instead of an opinion.',
    points: [
      'Features engineered from raw API data: time to merge, code churn, review friction, commits per file.',
      'IQR outlier removal at a 3x fence, log1p on the right skewed features, z-score normalisation, then K-Means with nstart = 50 to avoid local minima.',
      'k is validated by Elbow and Silhouette together, not chosen by eye. PCA is used for the 2D projection only.',
      'Ships a full methodology tab with the K-Means objective, Lloyd’s algorithm and the silhouette formula written out.',
      'Its default target is OWASP/BLT, so it analyses the pipeline I actually worked in.',
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
    what: 'Serverless GitHub App gating PRs on CONTRIBUTING.md, with provider failover',
    stack: 'TypeScript · Next.js · Redis',
    url: 'https://github.com/aryanghai12/RepoCop',
  },
] as const;

/* ------------------------------------------------------------- experience */

export const experience = {
  org: 'OWASP Foundation',
  role: 'Open Source Intern',
  period: '05/2026 to 08/2026',
  mode: 'Remote',
  stack: ['Python', 'Cloudflare Workers', 'Docker', 'Ruby on Rails'],
  /* Framed as architecture and planning, which is what the GitLab record actually
     shows: 31 authored issues, the README, and the 12 week roadmap. Framed as
     shipped volume it would be checkable and wrong. */
  body:
    'Designed the architecture for BLT-Toasty, an AI triage and responsible ' +
    'disclosure assistant for the OWASP Bug Logging Tool. Its central invariant ' +
    'is a fail closed redaction gate: no model inference and no vector embedding ' +
    'can execute until Microsoft Presidio has cleared the payload, and any ' +
    'failure at all, whether a timeout, a parse error or low confidence, ' +
    'quarantines the event instead of letting it through. I wrote the twelve week ' +
    'delivery roadmap and the tracked issues against it, and shipped production ' +
    'Python and Rails into the wider OWASP BLT ecosystem through maintainer review.',
} as const;

export const education = {
  school: 'Noida Institute of Engineering and Technology',
  degree: 'B.Tech, Computer Science',
  period: '2023 to present',
  detail: 'CGPA 9.22 / 10 · data structures, algorithms, object oriented design',
} as const;

/* ------------------------------------------------------------------ stack
   Rendered as a bipartite graph, not a badge wall. Edge weights come from the
   real language byte counts in data/stats.json, so a thin edge stays thin. */

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
  heading: 'Get in touch',
  lede: 'Open to software engineering internships.',
  body:
    'Email is the fastest way to reach me, and it is written out below in plain ' +
    'text rather than hidden behind anything. Everything I have built or ' +
    'contributed to is linked here and open to inspection, which is the point.',
} as const;
