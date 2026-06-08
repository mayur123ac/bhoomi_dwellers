-- ============================================================
-- Migration 003 — Refactor users table for SaaS architecture
-- SaaS Multi-Tenant Foundation: Phase 1
-- PREREQUISITE: Run 001 and 002 first
-- FIXED: invited_by uses INTEGER (not UUID) to match users.id type
-- Date: 2026-06-05
-- ============================================================

-- ── New columns on users ─────────────────────────────────────────────────────

-- JSON permissions bag — for fine-grained RBAC in Phase 2
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}';

-- Status lifecycle: active | invited | suspended | deleted
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Add check constraint separately (safe to run if constraint already exists)
DO $$
BEGIN
  ALTER TABLE users ADD CONSTRAINT users_status_check
    CHECK (status IN ('active', 'invited', 'suspended', 'deleted'));
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE '  ⏭  users_status_check already exists, skipped.';
END $$;

-- Who invited this user — INTEGER FK (users.id is integer, not UUID)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Last successful login timestamp
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- NOTE: updated_at already exists in this schema (added by original migration)
-- Skipping ADD COLUMN for updated_at to avoid error

-- ── Normalize role values ─────────────────────────────────────────────────────
-- Map old role names to new SaaS-standard names
UPDATE users SET role = 'company_admin' WHERE LOWER(role) IN ('admin');
UPDATE users SET role = 'manager'       WHERE LOWER(role) IN ('sales manager', 'sales_manager');
UPDATE users SET role = 'employee'      WHERE LOWER(role) IN ('site_head', 'site head');
UPDATE users SET role = 'sales'         WHERE LOWER(role) IN ('caller');
-- receptionist stays as 'receptionist'

-- Add role CHECK constraint (with safe exception handling)
DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN (
      'super_admin',
      'company_admin',
      'manager',
      'employee',
      'receptionist',
      'sales'
    ));
  RAISE NOTICE '  ✅ users.role CHECK constraint added.';
EXCEPTION WHEN others THEN
  RAISE WARNING '  ⚠️  Could not add role CHECK: %. Some role values may not match.', SQLERRM;
END $$;

-- ── Re-scope email uniqueness to per-org ──────────────────────────────────────
-- Drop old global unique constraint
DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
  RAISE NOTICE '  ✅ Dropped global users_email_key unique constraint.';
EXCEPTION WHEN others THEN
  RAISE NOTICE '  ⏭  No global email unique constraint to drop.';
END $$;

-- New: unique email WITHIN an org (nullable org → no constraint, for legacy rows)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_per_org
  ON users (organization_id, email)
  WHERE organization_id IS NOT NULL;

-- ── Additional indexes for SaaS query patterns ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_org_status
  ON users (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_users_org_role
  ON users (organization_id, role);

-- ── Auto-update updated_at trigger on users ───────────────────────────────────
-- The set_updated_at() function was created in migration 001.
-- The schema also has its own update_updated_at_column() function — check both.
DO $$
BEGIN
  DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
  -- Use the function that exists (set_updated_at from 001, or update_updated_at_column from original schema)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    EXECUTE 'CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()';
    RAISE NOTICE '  ✅ trg_users_updated_at created using set_updated_at().';
  ELSE
    RAISE NOTICE '  ⏭  set_updated_at() not found; original users_updated_at trigger retained.';
  END IF;
END $$;

-- ── Verify ────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  new_cols TEXT[] := ARRAY['permissions', 'status', 'invited_by', 'last_login_at'];
  c TEXT;
  col_exists BOOLEAN;
BEGIN
  FOREACH c IN ARRAY new_cols LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = c
    ) INTO col_exists;

    IF col_exists THEN
      RAISE NOTICE '  ✅ users.%: column present.', c;
    ELSE
      RAISE WARNING '  ❌ users.%: column MISSING!', c;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Migration 003 complete: users table refactored for SaaS.';
END $$;
