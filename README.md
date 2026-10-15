# Cloud Cost Optimizer

Web app for importing cloud billing CSVs, visualizing spend, setting budgets, evaluating alerts, forecasting month-end cost, and generating explainable FinOps recommendations — **without** destructive cloud operations.

**Demo MVP** (this branch): CSV import → dashboard/analysis → budgets → alerts → forecast → recommendations → CSV/PDF export. Runs fully with `NEXT_PUBLIC_DEMO_MODE=true` and **no Supabase**.

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/) 9+ (`corepack enable`)
- No Docker / no paid cloud required for demo mode

## Quick start (Windows / macOS / Linux)

```bash
corepack enable
pnpm install
copy .env.example .env.local   # Windows cmd
# or: cp .env.example .env.local
# Keep NEXT_PUBLIC_DEMO_MODE=true

pnpm dev
```

Open **[http://127.0.0.1:43123](http://127.0.0.1:43123)**.

### Happy path

1. **Imports → New import** — upload `data/samples/billing-valid.csv`
2. Validate & preview → **Confirm import**
3. **Dashboard** — KPIs, Recharts trends, forecast, open alert count
4. **Budgets** — create a tight monthly budget (e.g. 100 CAD) to trigger warnings
5. **Alerts / Recommendations** — refresh to see rule-based findings
6. **Reports** — download billing CSV, summary CSV, or PDF

## Demo store

Process-global in-memory singleton (`src/lib/demo/store.ts`). Survives requests in the same `pnpm dev` process; clears on restart or `POST /api/demo/reset`.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server on `127.0.0.1:43123` |
| `pnpm build` / `pnpm start` | Production build & serve |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Quality gates |
| `pnpm test:e2e` | Playwright (landing + import flow) |
| `pnpm ci` | lint + typecheck + unit tests |

## Feature map (demo)

| CDC | Feature | Status |
|---|---|---|
| F03–F04 | CSV import + validation | ✅ Demo |
| F05–F06 | Dashboard / analysis | ✅ Demo |
| F07 | Budgets | ✅ Demo |
| F08 | Alerts | ✅ Demo |
| F09 | Forecast (linear, none/low/medium) | ✅ Demo |
| F10 | Recommendations (advisory) | ✅ Demo |
| F11 | CSV + PDF export | ✅ Demo |
| F12 | Import history | ✅ Demo |
| F01 | Auth | Stub / demo session |

## Safety

- No destructive cloud ops
- No FX conversion; totals per currency
- Forecast never labeled **high** with the MVP linear formula
- Recommendations always include limitations

## License

Private / unpublished unless otherwise specified.
