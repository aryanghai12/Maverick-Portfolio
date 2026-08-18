# The GitHub API, rate limits, and how this build survives them

Every figure on this site comes from the GitHub API at build time. Nothing is
typed by hand. That rule is the entire argument of the site, and it means the
build has a hard dependency on somebody else's API and somebody else's quota.

This document explains what that costs, what happens when the quota runs out,
and how to make it never matter.

---

## Contents

1. [Why the build calls the API at all](#1-why-the-build-calls-the-api-at-all)
2. [What the limits actually are](#2-what-the-limits-actually-are)
3. [What one build spends](#3-what-one-build-spends)
4. [What happens when you hit the limit](#4-what-happens-when-you-hit-the-limit)
5. [The fix: a token with no scopes](#5-the-fix-a-token-with-no-scopes)
6. [Diagnosing a failure](#6-diagnosing-a-failure)
7. [Going further: four levels of robustness](#7-going-further-four-levels-of-robustness)
8. [Symptom table](#8-symptom-table)

---

## 1. Why the build calls the API at all

`scripts/fetch-stats.ts` runs before every build, via the `prebuild` script in
`package.json`. It writes `data/stats.json`, which the page imports statically.

```
npm run build
  └─ prebuild → npm run fetch-stats → scripts/fetch-stats.ts
                                        └─ writes data/stats.json
     next build → reads data/stats.json at compile time
```

Because the import is static and the site is exported to plain files, the
browser never talks to GitHub. Visitors pay nothing for this. Only the build
does.

## 2. What the limits actually are

GitHub runs two separate budgets, and this script spends from both.

| Budget | Unauthenticated | With a personal access token | Counted per |
|---|---|---|---|
| Core REST | 60 per hour | 5,000 per hour | IP address / token |
| Search | 10 per minute | 30 per minute | IP address / token |

Two consequences follow, and the second one is the one that bites.

**Unauthenticated limits are counted per IP address.** A CI runner on Vercel,
Netlify or GitHub Actions does not have its own IP. It shares a pool with every
other build running on that provider. Somebody else's build can spend your 60
requests before yours starts, and your deploy fails for reasons that have
nothing to do with your code.

**Authenticated limits are counted per token.** A token moves you off the shared
pool onto your own budget, which is the whole point. 5,000 an hour against a
build that spends about 15 is not a limit you can reach by accident.

There is also a **secondary rate limit** for bursts and concurrency. It is not a
counter you can read; GitHub decides you are going too fast and responds `403`
with a `Retry-After` header. The fetch script honours that header rather than
guessing.

One useful detail: **`GET /rate_limit` does not itself count against the limit.**
The script calls it first on every run, which is why the output starts with your
remaining budget.

## 3. What one build spends

Roughly 15 core requests and 1 search request:

| Call | Count | Budget |
|---|---|---|
| `GET /rate_limit` | 1 | free |
| `GET /users/{user}` | 1 | core |
| `GET /search/issues` (merged PRs, 100 per page) | 1 per 100 PRs | search |
| `GET /repos/{owner}/{repo}` for each upstream repo | 1 per repo | core |
| `GET /repos/{user}/{repo}` for each headline project | 3 | core |
| `GET /repos/{user}/{repo}/languages` | 2 | core |

So an unauthenticated machine gets about four builds an hour before the core
budget is gone. That is fine for local development and completely inadequate for
a CI runner sharing an IP with strangers.

## 4. What happens when you hit the limit

The build does not fail. `scripts/fetch-stats.ts` degrades in three steps.

**Step 1: retry.** Every request gets up to four attempts. Between them the
script waits, and it waits for the right amount of time rather than a guess:

- If GitHub sent `Retry-After` (a secondary limit), it waits exactly that long.
- If GitHub sent `x-ratelimit-reset` (a primary limit), it waits until that
  timestamp.
- Otherwise it backs off exponentially, starting at 600ms.

Failures that will never succeed on a retry are not retried. A `401` means the
token is wrong and a `404` means the repository does not exist; repeating either
one four times just wastes time.

There is a ceiling on patience. A primary rate limit can be up to an hour away,
and holding a deploy open for an hour is worse than shipping a slightly older
number, so anything beyond 75 seconds gives up immediately and moves to step 2.

**Step 2: fall back to the committed snapshot.** `data/stats.json` is committed
to the repository on purpose, and `.gitignore` says so. Those figures really did
come from the GitHub API, and the page prints the date they were measured
directly under the pull request wall. A snapshot from last Tuesday is dated, not
dishonest, which is a distinction this site cares about a great deal.

The fallback is loud. It prints the snapshot's age in days and tells you to set
a token.

**Step 3: fail.** If there is no committed snapshot to fall back to, the build
exits non-zero. At that point there is genuinely nothing honest to render, and
inventing a number is the one thing this project will not do.

## 5. The fix: a token with no scopes

Every endpoint this script touches is public. The token exists to identify you
to the rate limiter, not to grant access to anything. **Give it no scopes at
all.**

### Create it

1. Go to [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens).
2. **Generate new token**, fine-grained.
3. Set an expiry you will actually renew. 90 days is reasonable.
4. Repository access: **Public repositories (read-only)**.
5. Permissions: **leave every one of them unset**.
6. Generate, and copy the token. You cannot see it again.

### Use it locally

```bash
cp .env.example .env.local
# then edit .env.local and paste your token
```

`.env.local` is gitignored. The fetch script reads it directly, so `npm run
fetch-stats` picks it up with no extra tooling.

Verify:

```bash
npm run fetch-stats
# · using GITHUB_TOKEN from .env.local
# · budget  core 4998/5000 (resets 14:05 UTC)  search 30/30 (resets 13:12 UTC)
```

If the budget line still says `60`, the token is not being read.

### Use it on Vercel

Project → **Settings** → **Environment Variables**:

| Name | Value | Environments |
|---|---|---|
| `GITHUB_TOKEN` | your fine-grained token | Production, Preview, Development |

Redeploy. Vercel does not apply new environment variables to existing builds.

### Use it in GitHub Actions

Actions injects a `GITHUB_TOKEN` secret automatically, and inside Actions it is
rate limited at 1,000 requests an hour per repository, which is plenty:

```yaml
- run: npm run build
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 6. Diagnosing a failure

Start with the budget line the script prints before it does anything:

```
· budget  core 36/60 (resets 11:54 UTC)  search 10/10 (resets 11:41 UTC)
```

You can ask the same question by hand at any time:

```bash
curl -s https://api.github.com/rate_limit | jq '.resources.core, .resources.search'

# and with a token, to confirm the token is the thing being counted
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/rate_limit \
  | jq '.resources.core.limit'   # 5000 means the token is working
```

On failure the script names the failure class and what to do about it, rather
than printing a stack trace and leaving you to guess.

## 7. Going further: four levels of robustness

The first two are already implemented. The other two are options if this ever
becomes a real problem.

### Level 1: retry with the right delay (done)

Handles transient 5xx responses, dropped sockets, and secondary rate limits.
Covers the large majority of real failures.

### Level 2: committed snapshot fallback (done)

Guarantees the build produces a correct, dated site even with the API entirely
unreachable. This is the load-bearing one.

### Level 3: refresh on a schedule instead of on deploy

Rather than fetching during every build, run a scheduled job that fetches and
commits `data/stats.json`. Builds then only ever read a file, and the API can be
down during a deploy without anyone noticing.

```yaml
# .github/workflows/refresh-stats.yml
name: Refresh stats
on:
  schedule: [{ cron: '0 6 * * 1' }]   # Mondays, 06:00 UTC
  workflow_dispatch:
permissions:
  contents: write
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run fetch-stats
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Commit if changed
        run: |
          git config user.name  'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git add data/stats.json
          git diff --staged --quiet || git commit -m 'chore: refresh stats'
          git push
```

The trade-off: figures update weekly rather than per deploy. Given the page
prints the measurement date, that is a visible and honest trade.

### Level 4: conditional requests

GitHub returns `304 Not Modified` for a request carrying an `If-None-Match`
header with a matching `ETag`, and **a 304 does not count against your core
limit**. Caching ETags between runs would make repeat builds nearly free.

It is not implemented here because CI checks out a fresh working tree every
time, so there is no cache to reuse where it would actually help. It is worth
doing if you move to a persistent runner.

## 8. Symptom table

| What you see | What it means | What to do |
|---|---|---|
| `budget core 0/60` | Shared runner IP exhausted the unauthenticated quota | Set `GITHUB_TOKEN` |
| `403` with `0 remaining` | Primary rate limit | Set `GITHUB_TOKEN` |
| `403` with a `Retry-After` header | Secondary limit, you burst too fast | Already retried; if it persists, lower concurrency |
| `401` | Token expired, revoked, or mistyped | Regenerate it, update the environment variable |
| `404` on a repository | Renamed, deleted, or made private | Fix `USER` / `PROJECTS` in `scripts/fetch-stats.ts` |
| `⚠ Falling back to the committed snapshot` | The build worked, figures are older | Set `GITHUB_TOKEN` to refresh per deploy |
| `No committed data/stats.json to fall back to` | Snapshot missing from the repo | Run `npm run fetch-stats` locally and commit the result |
| Budget says `5000` but figures look stale | Build served a cached artifact | Redeploy without cache |

---

Related: [Deploying](deploying.md) · [Architecture](architecture.md) · [README](../README.md)
