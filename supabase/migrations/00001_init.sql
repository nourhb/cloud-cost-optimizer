-- Milestone 1 stub: core tables (not applied automatically in demo mode).
-- Apply via Supabase SQL Editor or CLI when connecting a project (M2+).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  preferred_currency char(3) NOT NULL DEFAULT 'CAD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  filename text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'previewed', 'committed', 'failed')),
  rows_processed integer NOT NULL DEFAULT 0 CHECK (rows_processed >= 0),
  rows_rejected integer NOT NULL DEFAULT 0 CHECK (rows_rejected >= 0),
  rows_duplicated integer NOT NULL DEFAULT 0 CHECK (rows_duplicated >= 0),
  currency_mode text NOT NULL DEFAULT 'single' CHECK (currency_mode IN ('single', 'separated')),
  primary_currency char(3),
  error_summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  committed_at timestamptz
);

CREATE INDEX IF NOT EXISTS billing_imports_user_created_idx
  ON billing_imports (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS billing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  import_id uuid NOT NULL REFERENCES billing_imports (id) ON DELETE CASCADE,
  billing_date date NOT NULL,
  provider text NOT NULL,
  service text NOT NULL,
  region text NOT NULL,
  resource_id text NOT NULL,
  usage_quantity numeric(24, 8) NOT NULL,
  usage_unit text NOT NULL,
  cost numeric(18, 6) NOT NULL,
  currency char(3) NOT NULL,
  environment text NOT NULL,
  dedupe_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);

CREATE INDEX IF NOT EXISTS billing_records_user_date_idx
  ON billing_records (user_id, billing_date);

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(18, 6) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('global', 'service', 'environment', 'provider')),
  scope_value text,
  warning_threshold numeric(5, 2) NOT NULL DEFAULT 80,
  critical_threshold numeric(5, 2) NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  CHECK (warning_threshold >= 0 AND warning_threshold <= 100),
  CHECK (critical_threshold >= warning_threshold AND critical_threshold <= 100)
);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  trigger_data jsonb NOT NULL DEFAULT '{}',
  recommended_action text,
  related_budget_id uuid REFERENCES budgets (id) ON DELETE SET NULL,
  import_id uuid REFERENCES billing_imports (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  evidence jsonb NOT NULL,
  proposed_action text NOT NULL,
  estimated_savings numeric(18, 6),
  estimated_savings_currency char(3),
  limitations text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'completed')),
  import_id uuid REFERENCES billing_imports (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
