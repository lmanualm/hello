# hello

[![ci](https://github.com/lmanualm/hello/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/lmanualm/hello/actions/workflows/ci.yml)

`hello` is a small, real, public product. v0.1 ships a one-page landing site
that introduces what we're building and captures interested visitors. Once that
loop works end-to-end (code → CI → deploy → verify), we'll grow scope.

Roadmap lives in the project: see HEL-2 "Roadmap v0.1" for the full plan and
out-of-scope notes.

## Stack

- **Language:** TypeScript
- **Framework:** Next.js 14 (App Router)
- **Runtime:** Node.js 20
- **Package manager:** npm

Rationale is recorded on HEL-3 under the `stack-decision` issue document.

## Develop

Requirements: Node.js 20+ and npm 10+.

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Scripts

| Command            | What it does                              |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Start the dev server on port 3000.        |
| `npm run build`    | Production build.                         |
| `npm run start`    | Serve the production build.               |
| `npm run lint`     | Run Next.js linting.                      |
| `npm run typecheck`| Run `tsc --noEmit`.                       |
| `npm run smoke`    | Build-server smoke: boots `next start` on a free port and asserts the landing page renders. |

## Layout

```
app/
  layout.tsx     # root document shell
  page.tsx       # landing placeholder
  globals.css    # base styles
```

## CI

Every push to `main` and every pull request runs
[`.github/workflows/ci.yml`](.github/workflows/ci.yml): `npm ci`, lint,
typecheck, build, and a smoke test that boots the built server and
asserts the landing page renders. A failing step blocks the merge. See
[`docs/decisions/ci.md`](./docs/decisions/ci.md) for the rationale.

## License

MIT — see [`LICENSE`](./LICENSE).
