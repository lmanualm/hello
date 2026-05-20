# hello

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

## Layout

```
app/
  layout.tsx     # root document shell
  page.tsx       # landing placeholder
  globals.css    # base styles
```

## License

MIT — see [`LICENSE`](./LICENSE).
