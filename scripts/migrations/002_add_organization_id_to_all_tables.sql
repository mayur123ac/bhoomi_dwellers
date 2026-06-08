-- ============================================================
-- Migration 002 — Add organization_id FK to ALL business tables
-- SaaS Multi-Tenant Foundation: Phase 1
-- PREREQUISITE: Run 001_create_organizations.sql first
-- SAFE: All new columns start as nullable — no existing queries break
-- Date: 2026-06-05
-- ============================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- IMPORTANT: This migration uses IF NOT EXISTS / IF EXISTS guards so it is
-- fully idempotent and safe to re-run if interrupted.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. users ─────────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_organization_id
  ON users (organization_id);

-- ── 2. leads ─────────────────────────────────────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_leads_organization_id
  ON leads (organization_id);

-- Composite index for the most common tenant-scoped query pattern
CREATE INDEX IF NOT EXISTS idx_leads_org_created
  ON leads (organization_id, created_at DESC);

-- ── 3. upload_batches ────────────────────────────────────────────────────────
ALTER TABLE upload_batches
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_upload_batches_organization_id
  ON upload_batches (organization_id);

-- ── 4. follow_ups ────────────────────────────────────────────────────────────
ALTER TABLE follow_ups
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_follow_ups_organization_id
  ON follow_ups (organization_id);

-- ── 5. walkin_enquiries ──────────────────────────────────────────────────────
ALTER TABLE walkin_enquiries
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_walkin_enquiries_organization_id
  ON walkin_enquiries (organization_id);

-- Composite: tenant + status (common dashboard filter)
CREATE INDEX IF NOT EXISTS idx_walkin_enquiries_org_status
  ON walkin_enquiries (organization_id, status);

-- ── 6. site_visits ───────────────────────────────────────────────────────────
ALTER TABLE site_visits
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_site_visits_organization_id
  ON site_visits (organization_id);

-- ── 7. roles ─────────────────────────────────────────────────────────────────
-- Roles can be org-specific (custom roles) or system-wide (NULL = global)
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_roles_organization_id
  ON roles (organization_id)
  WHERE organization_id IS NOT NULL;

-- ── 8. whatsapp_logs (conditional — only if table exists) ────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_logs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'whatsapp_logs' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE whatsapp_logs
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_organization_id
        ON whatsapp_logs (organization_id);
      RAISE NOTICE '  ✅ whatsapp_logs: organization_id added.';
    ELSE
      RAISE NOTICE '  ⏭  whatsapp_logs: organization_id already exists, skipped.';
    END IF;
  ELSE
    RAISE NOTICE '  ⏭  whatsapp_logs: table does not exist, skipped.';
  END IF;
END $$;

-- ── 9. caller_leads (conditional — only if table exists) ─────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'caller_leads') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'caller_leads' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE caller_leads
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_caller_leads_organization_id
        ON caller_leads (organization_id);
      RAISE NOTICE '  ✅ caller_leads: organization_id added.';
    ELSE
      RAISE NOTICE '  ⏭  caller_leads: organization_id already exists, skipped.';
    END IF;
  ELSE
    RAISE NOTICE '  ⏭  caller_leads: table does not exist, skipped.';
  END IF;
END $$;

-- ── 10. loan (conditional) ───────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loan_applications') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'loan_applications' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE loan_applications
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_loan_applications_organization_id
        ON loan_applications (organization_id);
      RAISE NOTICE '  ✅ loan_applications: organization_id added.';
    ELSE
      RAISE NOTICE '  ⏭  loan_applications: organization_id already exists, skipped.';
    END IF;
  ELSE
    RAISE NOTICE '  ⏭  loan_applications: table does not exist, skipped.';
  END IF;
END $$;

-- ── Verify ───────────────────────────────────────────────────────────────────
DO $$
DECLARE
  tables_checked TEXT[] := ARRAY['users', 'leads', 'upload_batches', 'follow_ups', 'walkin_enquiries', 'site_visits', 'roles'];
  t TEXT;
  col_exists BOOLEAN;
BEGIN
  FOREACH t IN ARRAY tables_checked LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = t AND column_name = 'organization_id'
    ) INTO col_exists;

    IF col_exists THEN
      RAISE NOTICE '  ✅ %: organization_id column present.', t;
    ELSE
      RAISE WARNING '  ❌ %: organization_id column MISSING!', t;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Migration 002 complete: organization_id added to all core tables.';
END $$;
