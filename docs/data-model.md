# Data model

SQL source of truth lives in `supabase/migrations/`:

| Migration | Purpose |
|---|---|
| `00001_init.sql` | Tables: profiles, billing_imports, billing_records, budgets, alerts, recommendations |
| `00002_rls.sql` | Row Level Security policies (own-row) |
| `00003_auth_trigger.sql` | Create `profiles` row on `auth.users` insert |

Amounts use `NUMERIC(18,6)`. Dedup uses `UNIQUE (user_id, dedupe_key)` with a SHA-256 of normalized billing fields (see architecture §3.1).

These migrations are **stubs in Milestone 1** — not applied automatically in demo mode. Apply them when connecting a Supabase project (Milestone 2+).
