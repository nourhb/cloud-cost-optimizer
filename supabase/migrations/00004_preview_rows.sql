-- Temporary preview payload for CSV import confirm step (user-scoped via parent row RLS).
-- Cleared when the import is committed or marked failed.

ALTER TABLE billing_imports
  ADD COLUMN IF NOT EXISTS preview_rows jsonb;
