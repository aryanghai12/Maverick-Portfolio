/**
 * Build-time statistics fetch.
 *
 * The site's thesis is verification over assertion, so no number it displays is
 * allowed to be typed by hand. Everything measurable is pulled from the public
 * GitHub API here, written to data/stats.json, and imported statically by the
 * page.
 *
 * Failure policy, in order:
 *
 *   1. Retry. Most failures are transient: a secondary rate limit, a 502, a
 *      dropped socket. Each request gets up to MAX_ATTEMPTS tries with backoff,
 *      and honours Retry-After and x-ratelimit-reset when GitHub sends them.
 *   2. Fall back to the committed data/stats.json, loudly. Those figures really
 *      did come from the API, and the page prints the date they were measured,
 *      so a snapshot a few days old is dated rather than dishonest.
 *   3. Only if there is no snapshot at all does the build fail. At that point
 *      there is nothing honest left to render.
 *
 * Unauthenticated this gets 60 REST requests an hour and 10 search requests a
 * minute, counted per IP, which is why shared CI runners exhaust it. Set
 * GITHUB_TOKEN for 5,000 an hour counted per token. The token needs no scopes:
 * every endpoint used here is public. See docs/github-api.md.
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'stats.json');

const USER = 'aryanghai12';
const GITLAB_USER = 'aryanghai1205';

/** Repos that are Aryan's own work but whose PRs must not count as "upstream". */
const OWN_PREFIX = `${USER}/`;

/** Repos where he contributed as part of a student team, not as an outside contributor. */
const TEAM_REPOS = new Set(['Vanshikadahaliya/TouristSafety']);

/** The three headline projects, with the facts the languages API gets wrong. */
const PROJECTS = [
  {
    id: 'cavix',
    repo: 'CavixCode',
    name: 'Cavix',
    /** GitHub's byte counts are the honest measure of where the work went. */
    deriveLanguages: true,
  },
  {
    id: 'tracecv',
    repo: 'TraceCV',
    name: 'TraceCV',
    deriveLanguages: true,
  },
  {
    id: 'repopulse',
    repo: 'RepoPulse',
    name: 'RepoPulse',
    /**
     * GitHub reports RepoPulse as ~87% HTML because Shiny emits rendered HTML
     * artifacts into the repo. The language of the project is R. Deriving badges
     * from the API here would be technically sourced and materially false, which
     * is the exact failure this whole script exists to prevent.
     */
    deriveLanguages: false,
    languages: { R: 124784, TeX: 6377 },
  },
] as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Read GITHUB_TOKEN out of .env.local or .env when it is not already in the
 * environment. Running this through tsx does not load dotenv files by itself,
 * and "it works in CI but not on my machine" is a bad first experience for
 * anyone who clones this.
 */
async function loadTokenFromEnvFile() {
  if (process.env.GITHUB_TOKEN) return;
  for (const file of ['.env.local', '.env']) {
    const text = await readFile(join(ROOT, file), 'utf8').catch(() => null);
    if (!text) continue;
    for (const line of text.split('\n')) {
      const m = /^\s*(?:export\s+)?GITHUB_TOKEN\s*=\s*(.*)\s*$/.exec(line);
      if (!m) continue;
      const value = m[1].trim().replace(/^['"]|['"]$/g, '');
      if (value) {
        process.env.GITHUB_TOKEN = value;
        console.log(`· using GITHUB_TOKEN from ${file}`);
        return;
      }
    }
  }
}

const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': `${USER}-portfolio-build`,
};

/** How many times a single request may be attempted before giving up. */
const MAX_ATTEMPTS = 4;

/**
 * The longest this script will sit and wait for a rate limit window to reopen.
 *
 * A primary rate limit can be up to an hour away. Blocking a deploy for an hour
 * is worse than shipping the committed snapshot, which is honest and dated, so
 * anything past this threshold gives up immediately instead of waiting.
 */
const MAX_RESET_WAIT_MS = 75_000;

type FailureKind = 'rate-limit' | 'auth' | 'not-found' | 'server' | 'network' | 'other';

class GitHubError extends Error {
  constructor(
    message: string,
    readonly kind: FailureKind,
    readonly status = 0,
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

/** 401 and 404 will fail identically on every retry, so they fail once. */
const RETRYABLE: FailureKind[] = ['rate-limit', 'server', 'network'];

function classify(status: number, remaining: number, retryAfter: number): FailureKind {
  if (status === 401) return 'auth';
  if (status === 404 || status === 422) return 'not-found';
  // A primary limit reports remaining 0; a secondary limit sends Retry-After.
  if ((status === 403 || status === 429) && (remaining === 0 || Number.isFinite(retryAfter))) {
    return 'rate-limit';
  }
  if (status >= 500) return 'server';
  return 'other';
}

async function gh<T>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : `https://api.github.com${path}`;

  let last: GitHubError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { headers });
    } catch (cause) {
      last = new GitHubError(
        `network error for ${url}: ${(cause as Error).message}`,
        'network',
      );
      if (attempt === MAX_ATTEMPTS) break;
      await sleep(600 * 2 ** (attempt - 1));
      continue;
    }

    if (res.ok) return res.json() as Promise<T>;

    const remaining = Number(res.headers.get('x-ratelimit-remaining'));
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    const retryAfter = Number(res.headers.get('retry-after'));
    const kind = classify(res.status, remaining, retryAfter);
    const body = await res.text().catch(() => '');

    /* Only report the budget when it means something. A 401 also comes back
       with remaining 0 and reset 0, and printing "resets 1970-01-01" next to a
       bad-credentials error sends people hunting for a rate limit that is not
       there. */
    const budget =
      kind === 'rate-limit' && Number.isFinite(remaining)
        ? `\n  rate limit: ${remaining} remaining` +
          (reset > 1_600_000_000 ? `, resets ${new Date(reset * 1000).toISOString()}` : '')
        : '';

    last = new GitHubError(
      `GitHub ${res.status} ${res.statusText} for ${url}` +
        budget +
        `\n  ${body.slice(0, 300).replace(/\s+/g, ' ').trim()}`,
      kind,
      res.status,
    );

    if (!RETRYABLE.includes(kind) || attempt === MAX_ATTEMPTS) break;

    /* Wait exactly as long as GitHub asked, when it says. Retry-After comes
       with a secondary limit, x-ratelimit-reset with a primary one, and
       guessing at either is how you get banned for longer. */
    let wait = 600 * 2 ** (attempt - 1);
    if (Number.isFinite(retryAfter)) wait = retryAfter * 1000 + 500;
    else if (kind === 'rate-limit' && Number.isFinite(reset)) {
      wait = reset * 1000 - Date.now() + 1000;
    }

    if (wait > MAX_RESET_WAIT_MS) {
      last = new GitHubError(
        `${last.message}\n  The window reopens in ${Math.round(wait / 60_000)} min, ` +
          `which is too long to hold a build open.`,
        kind,
        res.status,
      );
      break;
    }

    console.warn(
      `  ↻ ${kind} on attempt ${attempt}/${MAX_ATTEMPTS}, retrying in ${Math.round(wait / 1000)}s`,
    );
    await sleep(Math.max(wait, 0));
  }

  throw last ?? new GitHubError(`unknown failure for ${url}`, 'other');
}

/**
 * Report the budget before spending it. /rate_limit is the one endpoint that
 * does not itself count against the limit, so this is free information and it
 * turns "the build failed" into "the build failed because there were 0 search
 * requests left and the window reopens at 14:05".
 */
async function reportBudget() {
  type Limit = { limit: number; remaining: number; reset: number };
  const data = await gh<{ resources: { core: Limit; search: Limit } }>('/rate_limit').catch(
    () => null,
  );
  if (!data) return;

  const { core, search } = data.resources;
  const at = (r: Limit) => new Date(r.reset * 1000).toISOString().slice(11, 16);
  console.log(
    `· budget  core ${core.remaining}/${core.limit} (resets ${at(core)} UTC)` +
      `  search ${search.remaining}/${search.limit} (resets ${at(search)} UTC)`,
  );

  if (search.remaining === 0 || core.remaining < 12) {
    console.warn(
      '  ⚠ Not much budget left. This run will probably fall back to the\n' +
        '    committed snapshot. See docs/github-api.md.',
    );
  }
}

type SearchItem = {
  title: string;
  number: number;
  html_url: string;
  closed_at: string;
  repository_url: string;
};

type RepoInfo = {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
  homepage: string | null;
  pushed_at: string;
};

async function main() {
  await loadTokenFromEnvFile();

  const authed = Boolean(process.env.GITHUB_TOKEN);
  if (authed) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  } else {
    console.warn(
      '· no GITHUB_TOKEN set, running unauthenticated\n' +
        '  60 REST and 10 search requests per hour per IP. Fine locally, and the\n' +
        '  usual reason a CI build falls back to the snapshot. See docs/github-api.md.',
    );
  }

  await reportBudget();

  console.log('· fetching profile');
  const user = await gh<{
    name: string;
    login: string;
    public_repos: number;
    created_at: string;
    bio: string | null;
  }>(`/users/${USER}`);

  console.log('· fetching merged pull requests');
  const merged: SearchItem[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await gh<{ total_count: number; items: SearchItem[] }>(
      `/search/issues?q=author:${USER}+type:pr+is:merged&per_page=100&page=${page}`,
    );
    merged.push(...res.items);
    if (merged.length >= res.total_count || res.items.length === 0) break;
    await sleep(2000);
  }

  const repoOf = (i: SearchItem) => i.repository_url.split('/repos/')[1];

  const ownMerged = merged.filter((i) => repoOf(i).startsWith(OWN_PREFIX));
  const externalMerged = merged.filter((i) => !repoOf(i).startsWith(OWN_PREFIX));

  // Count merges per external repository, preserving the order of most-merged first.
  const byRepo = new Map<string, SearchItem[]>();
  for (const item of externalMerged) {
    const key = repoOf(item);
    const list = byRepo.get(key) ?? [];
    list.push(item);
    byRepo.set(key, list);
  }

  console.log(`· fetching metadata for ${byRepo.size} upstream repositories`);
  const upstreamRepos = [];
  for (const [fullName, items] of byRepo) {
    const info = await gh<RepoInfo>(`/repos/${fullName}`);
    const [org, repo] = fullName.split('/');
    upstreamRepos.push({
      org,
      repo,
      fullName,
      merged: items.length,
      stars: info.stargazers_count,
      description: info.description,
      url: info.html_url,
      kind: TEAM_REPOS.has(fullName) ? ('team' as const) : ('upstream' as const),
      prsUrl: `https://github.com/${fullName}/pulls?q=is%3Apr+author%3A${USER}+is%3Amerged`,
    });
  }
  upstreamRepos.sort((a, b) => b.merged - a.merged);

  console.log('· fetching project repositories');
  const projects = [];
  for (const p of PROJECTS) {
    const info = await gh<RepoInfo>(`/repos/${USER}/${p.repo}`);
    const languages = p.deriveLanguages
      ? await gh<Record<string, number>>(`/repos/${USER}/${p.repo}/languages`)
      : { ...p.languages };
    projects.push({
      id: p.id,
      name: p.name,
      repo: p.repo,
      url: info.html_url,
      homepage: info.homepage || null,
      description: info.description,
      stars: info.stargazers_count,
      pushedAt: info.pushed_at,
      languages,
      languagesDerived: p.deriveLanguages,
    });
  }

  const totalExternalMerged = externalMerged.length;
  const trueUpstream = externalMerged.filter((i) => !TEAM_REPOS.has(repoOf(i)));

  const stats = {
    generatedAt: new Date().toISOString(),
    source: `GitHub REST API, public endpoints, ${authed ? 'authenticated' : 'unauthenticated'}`,
    user: {
      login: user.login,
      name: user.name,
      publicRepos: user.public_repos,
      contributingSince: new Date(user.created_at).getUTCFullYear(),
    },
    merged: {
      total: merged.length,
      own: ownMerged.length,
      external: totalExternalMerged,
      externalRepoCount: byRepo.size,
      trueUpstream: trueUpstream.length,
      trueUpstreamRepoCount: new Set(trueUpstream.map(repoOf)).size,
    },
    upstreamRepos,
    /** Every merged PR into a repo he does not own, newest first, for the wall. */
    upstreamPRs: externalMerged
      .map((i) => ({
        title: i.title,
        repo: repoOf(i),
        number: i.number,
        url: i.html_url,
        mergedAt: i.closed_at.slice(0, 10),
      }))
      .sort((a, b) => (a.mergedAt < b.mergedAt ? 1 : -1)),
    projects,
    gitlab: {
      user: GITLAB_USER,
      profileUrl: `https://gitlab.com/${GITLAB_USER}`,
      /**
       * GitLab exposes no public aggregate MR count per author, so the site links
       * the profile and states no number. The one verified upstream merge is
       * owasp-blt/blt-toasty!10.
       */
      verifiedUpstreamMerge: 'https://gitlab.com/owasp-blt/blt-toasty/-/merge_requests/10',
    },
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(stats, null, 2) + '\n', 'utf8');

  console.log(
    `\n✓ data/stats.json written\n` +
      `  ${stats.merged.total} merged total · ${stats.merged.external} into ${stats.merged.externalRepoCount} repos he does not own\n` +
      `  ${stats.merged.trueUpstream} true upstream across ${stats.merged.trueUpstreamRepoCount} external orgs\n` +
      `  ${stats.upstreamPRs.length} PRs available for the wall`,
  );
}

const ADVICE: Record<FailureKind, string> = {
  'rate-limit':
    'Rate limited. Set GITHUB_TOKEN (no scopes needed) to go from 60 requests\n' +
    '  an hour per IP to 5,000 an hour per token. See docs/github-api.md.',
  auth: 'GITHUB_TOKEN was rejected. It is expired, revoked, or mistyped.',
  'not-found':
    'A repository or user in scripts/fetch-stats.ts does not exist, or was\n' +
    '  renamed or made private. Check USER and PROJECTS at the top of the file.',
  server: 'GitHub is having a bad day. Retries are exhausted; try again shortly.',
  network: 'The network was unreachable from this machine.',
  other: 'Unexpected response. The full body is printed above.',
};

main().catch(async (err) => {
  console.error('\n✕ stats fetch failed:\n', err.message ?? err);

  const kind: FailureKind = err instanceof GitHubError ? err.kind : 'other';
  console.error(`\n  ${ADVICE[kind]}`);

  /* Fall back to the committed snapshot, loudly.
   *
   * The rule this site is built on is that no number may be invented. It is not
   * that every number must be fetched within the last second. A committed
   * stats.json holds figures that really came from the GitHub API, and the page
   * prints the date they were measured on, so a snapshot a few days old is
   * dated, not dishonest.
   *
   * This matters in practice because Vercel builds from shared IPs and the
   * unauthenticated GitHub search API is rate-limited per IP: without this,
   * a perfectly good deploy fails because somebody else's build used the quota.
   * Set GITHUB_TOKEN in the Vercel project to get fresh figures every deploy.
   *
   * A build with no snapshot at all still fails. There is nothing honest to
   * show in that case.
   */
  const existing = await readFile(OUT, 'utf8').catch(() => null);
  if (!existing) {
    console.error(
      '\n  No committed data/stats.json to fall back to, so there is nothing\n' +
        '  honest to render. Fix the fetch or set GITHUB_TOKEN, then rebuild.',
    );
    process.exit(1);
  }

  try {
    const snapshot = JSON.parse(existing) as { generatedAt?: string };
    const age = snapshot.generatedAt
      ? Math.round((Date.now() - Date.parse(snapshot.generatedAt)) / 86_400_000)
      : NaN;
    console.error(
      `\n  ⚠ Falling back to the committed snapshot from ${snapshot.generatedAt ?? 'an unknown date'}` +
        (Number.isFinite(age) ? ` (${age} day${age === 1 ? '' : 's'} old).` : '.') +
        '\n  The page shows that date, so the figures stay honest, but set' +
        '\n  GITHUB_TOKEN in your deploy environment to keep them current.\n',
    );
  } catch {
    console.error('\n  ✕ Committed data/stats.json is not valid JSON.');
    process.exit(1);
  }
});
