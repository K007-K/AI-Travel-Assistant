-- ============================================================
-- RLS: Ensure profiles table is secured
-- Date: 2026-02-19
-- ============================================================

-- Enable RLS (idempotent — no-op if already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop-and-recreate to make migration idempotent
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
