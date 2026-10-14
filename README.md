# Cloud Cost Optimizer

Web app for importing cloud billing CSVs, visualizing spend, setting budgets, and generating explainable FinOps recommendations — **without** destructive cloud operations.

**Milestone 1** delivers the scaffold: Next.js app shell, demo mode, tooling, and docs. Business features (import, charts, budgets, alerts, forecast, recommendations, export) arrive in later milestones.

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/) 9+ (repo pins `packageManager`; enable with `corepack enable`)
- No Docker required for demo mode
- No Supabase account required when `NEXT_PUBLIC_DEMO_MODE=true`

## Quick start (demo mode)

```bash
corepack enable
pnpm install
cp .env.example .env.local
# Keep NEXT_PUBLIC_DEMO_MODE=true (default)

pnpm dev
```

Open **[http://127.0.0.1:43123](http://127.0.0.1:43123)**.

The app binds to port **43123** by default (`pnpm dev` / `pnpm start`).

## Demo mode vs Supabase

| Mode | Env | What you get |
|---|---|---|
| **Demo (default)** | `NEXT_PUBLIC_DEMO_MODE=true` | Landing + authenticated-looking shell with empty-state placeholders. In-memory fixtures only. **No** Supabase URL/keys required. |
| **Supabase** | `NEXT_PUBLIC_DEMO_MODE=false` + URL + anon key | Real Auth / Postgres / RLS (wired from Milestone 2). Service role stays server-only. |

Never put `SUPABASE_SERVICE_ROLE_KEY` behind a `NEXT_PUBLIC_` prefix. Never commit real secrets — only `.env.example` is versioned.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server on `127.0.0.1:43123` |
| `pnpm build` / `pnpm start` | Production build & serve |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript (`tsc --noEmit`) |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright smoke (starts dev server if needed) |
| `pnpm ci` | lint + typecheck + unit tests |

## Project layout

See [docs/architecture.md](./docs/architecture.md) for the full structure. Key paths:

- `src/app/` — App Router pages & Route Handlers
- `src/features/` — Domain modules (placeholders in M1)
- `src/components/` — UI shell + shadcn primitives
- `supabase/migrations/` — SQL stubs (not auto-applied in demo)
- `data/samples/` — Synthetic billing CSVs for later import work
- `tests/unit`, `tests/e2e` — Vitest & Playwright

## Safety / product limits

- **No destructive cloud ops** — the product never deletes, stops, or resizes cloud resources. Recommendations are consultative only.
- CSV size limits (when import lands): 5 MiB / 50 000 rows (see `.env.example`).
- No FX conversion in MVP; totals stay per currency (CAD default).

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, Vitest, and a Playwright smoke suite on push/PR.

## License

Private / unpublished unless otherwise specified.
