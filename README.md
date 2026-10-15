# Cloud Cost Optimizer

Web app for importing cloud billing CSVs, visualizing spend, setting budgets, evaluating alerts, forecasting month-end cost, and generating explainable FinOps recommendations — **without** destructive cloud operations.

Runs in **demo mode** (in-memory store, no Supabase) or **live mode** (Supabase Auth + Postgres + RLS) after you connect a free project from the UI or `.env.local`.

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/) 9+ (`corepack enable`)
- Optional: a free [Supabase](https://supabase.com) project for Auth + Postgres

## Quick start (demo — no Supabase)

```bash
corepack enable
pnpm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
# Keep NEXT_PUBLIC_DEMO_MODE=true and leave Supabase vars empty

pnpm dev
```

Open **[http://127.0.0.1:43123](http://127.0.0.1:43123)** → Imports → upload `data/samples/billing-valid.csv`.

## Connect Supabase (live mode)

### 1. Create a free project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Open **Project Settings → API** and copy the **Project URL** and **anon public** key.
3. Do **not** copy the `service_role` key into the browser or any `NEXT_PUBLIC_*` variable.

### 2. Apply SQL migrations (+ RLS)

Either:

- In the app: **Settings → Copy SQL** → paste into the Supabase **SQL Editor** → Run, or
- Paste files from `supabase/migrations/` in order (`00001` … `00004`).

This creates `profiles`, `billing_imports`, `billing_records`, `budgets`, `alerts`, `recommendations`, indexes, RLS (`user_id = auth.uid()`), and the signup → profile trigger.

Enable **Email** auth under Authentication → Providers (default on most projects). For local testing you can disable “Confirm email”.

### 3. Paste URL + anon key (UI or env)

**Option A — Settings UI (local/dev):** open [/settings](http://127.0.0.1:43123/settings), paste URL + anon key, **Save connection**. Config is stored in an **httpOnly cookie** for this browser.

**Option B — Environment (recommended for production):**

```bash
# .env.local
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
# optional, server-only, never NEXT_PUBLIC_:
# SUPABASE_SERVICE_ROLE_KEY=
```

When URL + anon are present (cookie or env), the app uses Supabase. Otherwise it stays in demo mode (CDC §5.3).

### 4. Sign up and import

1. **Sign up** / **Sign in** with email + password (F01).
2. **Imports → New import** → `data/samples/billing-valid.csv`.
3. Use Dashboard, Budgets, Alerts, Recommendations, Reports against your private rows (RLS).

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server on `127.0.0.1:43123` |
| `pnpm build` / `pnpm start` | Production build & serve |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Quality gates |
| `pnpm test:e2e` | Playwright smoke |
| `pnpm ci` | lint + typecheck + unit tests |

## Feature map (CDC)

| CDC | Feature | Demo | Live Supabase |
|---|---|---|---|
| F01 | Auth (signup/login/logout, private pages) | Stub session | Supabase Auth + proxy gate |
| F02–F06 | Dashboard / analysis | ✅ | ✅ (RLS) |
| F03–F04 / F12 | CSV import + history | ✅ | ✅ |
| F07–F10 | Budgets, alerts, forecast, recommendations | ✅ | ✅ |
| F11 | CSV + PDF export | ✅ | ✅ |

## Security notes

- Browser and server user clients use the **anon** key only; RLS enforces `auth.uid() = user_id`.
- `SUPABASE_SERVICE_ROLE_KEY` is optional for MVP CRUD and must never use a `NEXT_PUBLIC_` prefix.
- Settings UI rejects keys whose JWT `role` is `service_role`.

## Safety

- No destructive cloud ops
- No FX conversion; totals per currency
- Forecast never labeled **high** with the MVP linear formula
- Recommendations always include limitations

## License

Private / unpublished unless otherwise specified.
