-- ============================================================
-- Migration 004 — Seed first organization & backfill all tables
-- SaaS Multi-Tenant Foundation: Phase 1
-- PREREQUISITE: Run 001, 002, 003 first
-- ⚠️  POINT OF NO RETURN: Makes organization_id NOT NULL on core tables
-- Date: 2026-06-05
-- ============================================================

-- This migration runs as a single atomic transaction.
-- If anything fails, all changes are rolled back.

DO $$
DECLARE
  v_org_id UUID;
BEGIN

  -- ── Step 1: Create the first organization ────────────────────────────────
  -- Check if it already exists (idempotency)
  SELECT id INTO v_org_id
  FROM organizations
  WHERE slug = 'bhoomi-realty'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO organizations (
      company_name,
      slug,
      company_email,
      company_phone,
      subscription_plan,
      is_active
    ) VALUES (
      'Bhoomi Realty',
      'bhoomi-realty',
      'admin@bhoomi.com',
      NULL,
      'pro',
      TRUE
    )
    RETURNING id INTO v_org_id;

    RAISE NOTICE '  ✅ Created organization: Bhoomi Realty (id: %)', v_org_id;
  ELSE
    RAISE NOTICE '  ⏭  Organization bhoomi-realty already exists (id: %), skipping insert.', v_org_id;
  END IF;

  -- ── Step 2: Backfill organization_id on all tables ───────────────────────

  -- users
  UPDATE users
    SET organization_id = v_org_id
    WHERE organization_id IS NULL;
  RAISE NOTICE '  ✅ users: backfilled % rows.', (SELECT COUNT(*) FROM users WHERE organization_id = v_org_id);

  -- leads
  UPDATE leads
    SET organization_id = v_org_id
    WHERE organization_id IS NULL;
  RAISE NOTICE '  ✅ leads: backfilled.';

  -- upload_batches
  UPDATE upload_batches
    SET organization_id = v_org_id
    WHERE organization_id IS NULL;
  RAISE NOTICE '  ✅ upload_batches: backfilled.';

  -- follow_ups
  UPDATE follow_ups
    SET organization_id = v_org_id
    WHERE organization_id IS NULL;
  RAISE NOTICE '  ✅ follow_ups: backfilled.';

  -- walkin_enquiries
  UPDATE walkin_enquiries
    SET organization_id = v_org_id
    WHERE organization_id IS NULL;
  RAISE NOTICE '  ✅ walkin_enquiries: backfilled.';

  -- site_visits
  UPDATE site_visits
    SET organization_id = v_org_id
    WHERE organization_id IS NULL;
  RAISE NOTICE '  ✅ site_visits: backfilled.';

  -- roles (system roles get the first org; custom roles will have their own)
  UPDATE roles
    SET organization_id = v_org_id
    WHERE organization_id IS NULL;
  RAISE NOTICE '  ✅ roles: backfilled.';

  -- Additional tables discovered from actual schema inspection
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'caller_leads') THEN
    UPDATE caller_leads SET organization_id = v_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '  ✅ caller_leads: backfilled.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'caller_upload_batches') THEN
    UPDATE caller_upload_batches SET organization_id = v_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '  ✅ caller_upload_batches: backfilled.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'caller_follow_ups') THEN
    UPDATE caller_follow_ups SET organization_id = v_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '  ✅ caller_follow_ups: backfilled.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'completed_leads') THEN
    UPDATE completed_leads SET organization_id = v_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '  ✅ completed_leads: backfilled.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enquiries') THEN
    UPDATE enquiries SET organization_id = v_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '  ✅ enquiries: backfilled.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_logs') THEN
    UPDATE whatsapp_logs SET organization_id = v_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '  ✅ whatsapp_logs: backfilled.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loan_updates') THEN
    UPDATE loan_updates SET organization_id = v_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '  ✅ loan_updates: backfilled.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_logs') THEN
    UPDATE admin_audit_logs SET organization_id = v_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '  ✅ admin_audit_logs: backfilled.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_settings') THEN
    UPDATE admin_settings SET organization_id = v_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '  ✅ admin_settings: backfilled.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_updates') THEN
    UPDATE crm_updates SET organization_id = v_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '  ✅ crm_updates: backfilled.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_update_reads') THEN
    UPDATE crm_update_reads SET organization_id = v_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '  ✅ crm_update_reads: backfilled.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_password_vault') THEN
    UPDATE employee_password_vault SET organization_id = v_org_id WHERE organization_id IS NULL;
    RAISE NOTICE '  ✅ employee_password_vault: backfilled.';
  END IF;

  -- ── Step 3: Enforce NOT NULL on core tables ───────────────────────────────
  -- This is the "point of no return" — from here, every INSERT must supply
  -- organization_id or it will be rejected by the database.

  ALTER TABLE users           ALTER COLUMN organization_id SET NOT NULL;
  ALTER TABLE leads           ALTER COLUMN organization_id SET NOT NULL;
  ALTER TABLE upload_batches  ALTER COLUMN organization_id SET NOT NULL;
  ALTER TABLE follow_ups      ALTER COLUMN organization_id SET NOT NULL;
  ALTER TABLE walkin_enquiries ALTER COLUMN organization_id SET NOT NULL;
  ALTER TABLE site_visits     ALTER COLUMN organization_id SET NOT NULL;

  -- roles: keep nullable (NULL = system-wide default role, orgId = custom role)
  -- ALTER TABLE roles ALTER COLUMN organization_id SET NOT NULL;  ← intentionally skipped

  RAISE NOTICE '  ✅ NOT NULL constraints applied on core tables.';

  -- ── Step 4: Final summary ─────────────────────────────────────────────────
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Migration 004 COMPLETE';
  RAISE NOTICE '   Organization ID : %', v_org_id;
  RAISE NOTICE '   Organization     : Bhoomi Realty (slug: bhoomi-realty)';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '  1. Update DATABASE_URL in .env.local to point to new SaaS DB';
  RAISE NOTICE '  2. Deploy updated lib/db.ts, lib/serverAuth.ts, lib/tenant.ts';
  RAISE NOTICE '  3. Test login — session should now include organizationId';
  RAISE NOTICE '════════════════════════════════════════════════════';

END $$;
