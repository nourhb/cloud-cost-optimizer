-- Row Level Security: every financial/app table is user-scoped via auth.uid().
-- Re-runnable: drops existing policies before recreate.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "billing_imports_select_own" ON billing_imports;
DROP POLICY IF EXISTS "billing_imports_insert_own" ON billing_imports;
DROP POLICY IF EXISTS "billing_imports_update_own" ON billing_imports;
DROP POLICY IF EXISTS "billing_imports_delete_own" ON billing_imports;
CREATE POLICY "billing_imports_select_own" ON billing_imports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "billing_imports_insert_own" ON billing_imports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "billing_imports_update_own" ON billing_imports
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "billing_imports_delete_own" ON billing_imports
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "billing_records_select_own" ON billing_records;
DROP POLICY IF EXISTS "billing_records_insert_own" ON billing_records;
DROP POLICY IF EXISTS "billing_records_update_own" ON billing_records;
DROP POLICY IF EXISTS "billing_records_delete_own" ON billing_records;
CREATE POLICY "billing_records_select_own" ON billing_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "billing_records_insert_own" ON billing_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "billing_records_update_own" ON billing_records
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "billing_records_delete_own" ON billing_records
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_select_own" ON budgets;
DROP POLICY IF EXISTS "budgets_insert_own" ON budgets;
DROP POLICY IF EXISTS "budgets_update_own" ON budgets;
DROP POLICY IF EXISTS "budgets_delete_own" ON budgets;
CREATE POLICY "budgets_select_own" ON budgets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert_own" ON budgets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update_own" ON budgets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_delete_own" ON budgets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "alerts_select_own" ON alerts;
DROP POLICY IF EXISTS "alerts_insert_own" ON alerts;
DROP POLICY IF EXISTS "alerts_update_own" ON alerts;
DROP POLICY IF EXISTS "alerts_delete_own" ON alerts;
CREATE POLICY "alerts_select_own" ON alerts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "alerts_insert_own" ON alerts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alerts_update_own" ON alerts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alerts_delete_own" ON alerts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "recommendations_select_own" ON recommendations;
DROP POLICY IF EXISTS "recommendations_insert_own" ON recommendations;
DROP POLICY IF EXISTS "recommendations_update_own" ON recommendations;
DROP POLICY IF EXISTS "recommendations_delete_own" ON recommendations;
CREATE POLICY "recommendations_select_own" ON recommendations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "recommendations_insert_own" ON recommendations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recommendations_update_own" ON recommendations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recommendations_delete_own" ON recommendations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
