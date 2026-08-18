# Deploying

The build output is a directory of static files. Any host that can serve files
can serve this site, and none of it needs a server at runtime.

---

## Contents

1. [Before you deploy](#1-before-you-deploy)
2. [Vercel, step by step](#2-vercel-step-by-step)
3. [Netlify](#3-netlify)
4. [Cloudflare Pages](#4-cloudflare-pages)
5. [GitHub Pages](#5-github-pages)
6. [Any other host](#6-any-other-host)
7. [Custom domain](#7-custom-domain)
8. [What to check after the first deploy](#8-what-to-check-after-the-first-deploy)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Before you deploy

Two things are worth doing first, in this order.

**Get a GitHub token.** The build calls the GitHub API, and unauthenticated
limits are counted per IP address, which on shared CI runners means somebody
else's build can spend your quota. The token needs no scopes at all. Full
instructions are in [docs/github-api.md](github-api.md#5-the-fix-a-token-with-no-scopes).
Without one the deploy still succeeds, it just ships the committed snapshot of
`data/stats.json` instead of fresh figures.

**Update the site URL.** `metadataBase` in `app/layout.tsx` is what Open Graph
URLs resolve against. Set it to the domain you are actually deploying to.

Then confirm the build works locally:

```bash
npm ci
npm run build      # writes ./out
npx serve out      # preview the production build
```

## 2. Vercel, step by step

The Hobby tier covers this completely. It is static files: no serverless
functions, no image optimisation, no database.

1. Push the repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import it.
3. Leave every build setting on its default. `vercel.json` pins the three that
   matter (`buildCommand`, `outputDirectory`, `framework`) and values in
   `vercel.json` override the dashboard, so there is nothing to configure here.
   If a deploy fails looking for `routes-manifest.json`, see
   [Troubleshooting](#9-troubleshooting).
4. Open **Environment Variables** before deploying and add:

   | Name | Value | Environments |
   |---|---|---|
   | `GITHUB_TOKEN` | a fine-grained token with no scopes | Production, Preview, Development |

5. Click **Deploy**.

`vercel.json` also sets the security headers (`X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`) and a one-year
immutable cache on hashed static assets.

If you add the token after the first deploy, redeploy. Vercel does not apply new
environment variables to builds that already ran.

## 3. Netlify

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `out` |
| Environment variable | `GITHUB_TOKEN` |

## 4. Cloudflare Pages

| Setting | Value |
|---|---|
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Output directory | `out` |
| Environment variable | `GITHUB_TOKEN` |

## 5. GitHub Pages

Pages serves from a branch or an artifact, so it needs a workflow. The token is
injected automatically inside Actions and is rate limited per repository at
1,000 requests an hour, which is far more than the build spends.

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/upload-pages-artifact@v3
        with: { path: out }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

If you serve from a subpath such as `user.github.io/portfolio`, set `basePath`
in `next.config.mjs` to match, or the asset URLs will 404.

## 6. Any other host

```bash
npm run build       # → ./out
```

Upload `out/`. There is nothing else to configure. `cleanUrls` in `vercel.json`
is a Vercel convenience; on other hosts either enable the equivalent or accept
`.html` extensions.

## 7. Custom domain

On Vercel: **Project → Settings → Domains**. Free on the Hobby tier.

After the domain resolves, update `metadataBase` in `app/layout.tsx` so Open
Graph and canonical URLs point at the real address, then redeploy.

## 8. What to check after the first deploy

- The figures in the hero match your GitHub profile. If they look old, the build
  fell back to the snapshot: check the build log for `⚠ Falling back`.
- The build log shows `budget core 4998/5000` rather than `60`. That confirms the
  token is being read.
- The pull request wall scrolls inside its own panel without moving the page.
- The page has no horizontal scrollbar at 375px wide.
- `prefers-reduced-motion` genuinely stops the camera. Toggle it in your OS
  accessibility settings and reload.

## 9. Troubleshooting

### `The file "/vercel/path0/out/routes-manifest.json" couldn't be found`

The single most common way to break a Next.js static export on Vercel, and the
error names the wrong culprit first.

**What is actually happening.** This project sets `output: 'export'`, so
`next build` writes a finished static site to `out/`. It does not write
`routes-manifest.json` there. That file belongs to the normal server build and
lives in `.next/`.

Vercel's Next.js builder reads the **Output Directory** setting as your
`distDir`. Pointing it at `out` tells the builder "the Next.js build lives
here", so it looks for `.next` artifacts in a directory of finished HTML, finds
no manifest, and fails.

**Why this repository no longer hits it.** `vercel.json` sets:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "framework": null
}
```

`"framework": null` is the Other preset. It means the Next.js builder is never
invoked, so nothing ever goes looking for a routes manifest. Vercel runs the
build command and serves `out/` as what it actually is: a directory of static
files. Nothing is lost by doing this, because a static export uses no
server-side Vercel feature. There is no ISR, no image optimisation, and no
serverless function to give up.

**Settings in `vercel.json` override the dashboard**, which is the important
part. All three keys are pinned, so a stale Output Directory override left in
the project settings can no longer break the build.

If you are adapting this for a fork and want to keep the Next.js preset
instead, that also works, but then **Output Directory must be left empty** in
both `vercel.json` and the dashboard, and Vercel will detect `output: 'export'`
on its own. Pinning it to `out` while the preset is Next.js is the one
combination that cannot work.

After changing any of this, trigger a plain **Redeploy**. Do not use "Redeploy
with existing Build Cache"; you want the new configuration read from scratch.

### The deploy succeeds but the figures are stale

The build fell back to the committed `data/stats.json`. Search the build log for
`⚠ Falling back` and see [GitHub API and rate limits](github-api.md).

### Assets 404 on a subpath deployment

If the site is served from something other than the domain root, set `basePath`
in `next.config.mjs` to the subpath. Static exports bake asset URLs at build
time, so this cannot be fixed by host configuration.

---

Related: [GitHub API and rate limits](github-api.md) · [Architecture](architecture.md) · [README](../README.md)
