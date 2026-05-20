# CI decision

**Status:** accepted (v0.1)
**Issue:** HEL-4
**Date:** 2026-05-20

## Decision

CI runs as a single GitHub Actions workflow (`.github/workflows/ci.yml`)
on every push to `main` and every pull request targeting `main`. The job
runs five steps in sequence:

1. `npm ci` — install from the lockfile (with the built-in `setup-node`
   npm cache).
2. `npm run lint` — `next lint` against `next/core-web-vitals`.
3. `npm run typecheck` — `tsc --noEmit`.
4. `npm run build` — production Next.js build.
5. `npm run smoke` — boots `next start` on an OS-assigned free port,
   fetches `/`, and asserts the landing-page placeholder markers
   (`<h1>hello</h1>` and `Something small is on the way.`) are present
   in the rendered HTML.

A failure in any step fails the workflow and blocks the PR from being
merged (the workflow's `name`/job appears as a required status check
once branch protection is configured on `main`).

## Why GitHub Actions

- The repo will be hosted on GitHub (HEL-3 stack-decision); using
  Actions keeps CI in the same place as the code and PRs.
- Free minutes are plenty for a single-job workflow this small.
- `actions/setup-node` has first-class npm caching, which keeps the
  wall-clock under the ~2 min target on HEL-4 without any custom
  cache config.
- No third-party CI provider to pay for, configure, or replace if we
  swap hosts later.

## Why these five steps (and only these five)

- **Lint** catches the cheap mistakes that ESLint can find in seconds.
- **Typecheck** catches the cheap mistakes that the TypeScript compiler
  can find. Both lint and typecheck are read-only and parallel-safe; we
  keep them as separate steps so a failure log points at the right
  thing.
- **Build** is the closest local proxy for "would this actually deploy
  cleanly?" — it exercises the same code path Vercel/Netlify/Render
  will run when we wire up deploys.
- **Smoke** is the only step that actually starts the built server and
  asserts a user-visible behaviour (the landing page renders). One
  end-to-end check beats a directory of micro-tests at this stage of
  the product.
- We deliberately do **not** run unit tests in CI yet — there are no
  unit tests in the repo. We will add a `test` step alongside lint /
  typecheck when there is something worth testing in isolation.

## Why the smoke test boots a server

A static-output assertion (e.g. grepping `.next/server/app/page.html`)
would be cheaper but would also drift from reality the first time we
add a dynamic page or a Route Handler. Booting `next start` and
fetching `/` exercises the same runtime that production will use, so
the smoke catches regressions in routing, layout, and metadata, not
just markup.

The smoke script asks the kernel for a free port instead of binding to
3000 / 3100, so it survives the local dev environment without colliding
with other services (the Paperclip control plane already binds 3100 on
the engineering box).

## Wall-clock budget

The HEL-4 acceptance asks for CI under ~2 minutes. With the npm cache
warm, on `ubuntu-latest`, expected timings are roughly:

| Step       | Cold cache | Warm cache |
| ---------- | ---------- | ---------- |
| install    | ~30 s      | ~10 s      |
| lint       | ~5 s       | ~5 s       |
| typecheck  | ~10 s      | ~10 s      |
| build      | ~25 s      | ~25 s      |
| smoke      | ~10 s      | ~10 s      |
| **total**  | ~80 s      | ~60 s      |

The job has a 5-minute timeout-minutes guard so a runaway step fails
loud instead of burning Actions minutes silently.

## Out of scope

- Deploys (lives in HEL-6).
- Coverage / unit-test reporting (no tests exist yet).
- Caching of the Next.js `.next/cache` between runs (the build is fast
  enough that the cache complexity isn't worth it yet).
- Branch protection rules — those are configured on GitHub, not in this
  repo, and require a CEO-owned repo admin action once the repo is
  pushed to GitHub.

## Demonstrating that CI gates merges

The HEL-4 acceptance asks for "a failing example PR demonstrates CI
blocks the merge". The hello repo has no GitHub remote yet (it lives
on the engineering box only), so we cannot open a real PR. As a local
substitute, the issue update records the output of running each CI
step (lint, typecheck, build, smoke) against the green tree and then
against a deliberately broken tree. Once the repo is pushed to GitHub
and a remote exists, the first failing PR — opened, observed-red,
closed — will satisfy this acceptance criterion directly.
