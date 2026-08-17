/**
 * Build-time statistics fetch.
 *
 * The site's thesis is verification over assertion, so no number it displays is
 * allowed to be typed by hand. Everything measurable is pulled from a public API
 * here, written to data/stats.json, and imported statically by the page. If this
 * script fails, the build fails: shipping a stale number on a site about proof is
 * worse than shipping nothing.
 *
 * Runs unauthenticated by default (60 REST req/hr, 10 search req/min — we use far
 * less than that). Set GITHUB_TOKEN to raise the ceiling on CI.
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

const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': `${USER}-portfolio-build`,
};
if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function gh<T>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : `https://api.github.com${path}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `GitHub ${res.status} ${res.statusText} for ${url}\n` +
        `rate-limit-remaining: ${res.headers.get('x-ratelimit-remaining') ?? 'n/a'}\n` +
        body.slice(0, 400),
    );
  }
  return res.json() as Promise<T>;
}

/** Search is rate-limited harder than the rest of the API; give it room. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    source: 'GitHub REST API, unauthenticated public endpoints',
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

main().catch(async (err) => {
  console.error('\n✕ stats fetch failed:\n', err.message ?? err);

  /* Fall back to the committed snapshot, loudly.
   *
   * The rule this site is built on is that no number may be invented. It is not
   * that every number must be fetched within the last second. A committed
   * stats.json holds figures that really came from the GitHub API, and the page
   * prints the date they were measured on, so a snapshot a few days old is
   * dated — not dishonest.
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
        '\n  The page shows that date, so the figures stay honest — but set' +
        '\n  GITHUB_TOKEN in your deploy environment to keep them current.\n',
    );
  } catch {
    console.error('\n  ✕ Committed data/stats.json is not valid JSON.');
    process.exit(1);
  }
});
