-- ============================================================
-- Migration 002b — Add organization_id to additional discovered tables
-- SaaS Multi-Tenant Foundation: Phase 1
-- PREREQUISITE: Run 001 and 002 first
-- Tables discovered by inspecting actual bhoomi_crm schema
-- Date: 2026-06-05
-- ============================================================

-- ── caller_leads ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'caller_leads' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE caller_leads
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_caller_leads_organization_id ON caller_leads(organization_id);
    RAISE NOTICE '  ✅ caller_leads: organization_id added.';
  ELSE
    RAISE NOTICE '  ⏭  caller_leads: already has organization_id.';
  END IF;
END $$;

-- ── caller_upload_batches ─────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'caller_upload_batches' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE caller_upload_batches
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_caller_upload_batches_org_id ON caller_upload_batches(organization_id);
    RAISE NOTICE '  ✅ caller_upload_batches: organization_id added.';
  ELSE
    RAISE NOTICE '  ⏭  caller_upload_batches: already has organization_id.';
  END IF;
END $$;

-- ── caller_follow_ups ─────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'caller_follow_ups' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE caller_follow_ups
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_caller_follow_ups_org_id ON caller_follow_ups(organization_id);
    RAISE NOTICE '  ✅ caller_follow_ups: organization_id added.';
  ELSE
    RAISE NOTICE '  ⏭  caller_follow_ups: already has organization_id.';
  END IF;
END $$;

-- ── completed_leads ───────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'completed_leads' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE completed_leads
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_completed_leads_org_id ON completed_leads(organization_id);
    RAISE NOTICE '  ✅ completed_leads: organization_id added.';
  ELSE
    RAISE NOTICE '  ⏭  completed_leads: already has organization_id.';
  END IF;
END $$;

-- ── enquiries ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enquiries' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE enquiries
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_enquiries_organization_id ON enquiries(organization_id);
    RAISE NOTICE '  ✅ enquiries: organization_id added.';
  ELSE
    RAISE NOTICE '  ⏭  enquiries: already has organization_id.';
  END IF;
END $$;

-- ── whatsapp_logs ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_logs' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE whatsapp_logs
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_organization_id ON whatsapp_logs(organization_id);
    RAISE NOTICE '  ✅ whatsapp_logs: organization_id added.';
  ELSE
    RAISE NOTICE '  ⏭  whatsapp_logs: already has organization_id.';
  END IF;
END $$;

-- ── loan_updates ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loan_updates' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE loan_updates
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_loan_updates_organization_id ON loan_updates(organization_id);
    RAISE NOTICE '  ✅ loan_updates: organization_id added.';
  ELSE
    RAISE NOTICE '  ⏭  loan_updates: already has organization_id.';
  END IF;
END $$;

-- ── admin_audit_logs ──────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_audit_logs' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE admin_audit_logs
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_org_id ON admin_audit_logs(organization_id);
    RAISE NOTICE '  ✅ admin_audit_logs: organization_id added.';
  ELSE
    RAISE NOTICE '  ⏭  admin_audit_logs: already has organization_id.';
  END IF;
END $$;

-- ── admin_settings ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE admin_settings
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_admin_settings_org_id ON admin_settings(organization_id);
    RAISE NOTICE '  ✅ admin_settings: organization_id added.';
  ELSE
    RAISE NOTICE '  ⏭  admin_settings: already has organization_id.';
  END IF;
END $$;

-- ── crm_updates ───────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_updates' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE crm_updates
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_crm_updates_org_id ON crm_updates(organization_id);
    RAISE NOTICE '  ✅ crm_updates: organization_id added.';
  ELSE
    RAISE NOTICE '  ⏭  crm_updates: already has organization_id.';
  END IF;
END $$;

-- ── crm_update_reads ──────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_update_reads' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE crm_update_reads
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_crm_update_reads_org_id ON crm_update_reads(organization_id);
    RAISE NOTICE '  ✅ crm_update_reads: organization_id added.';
  ELSE
    RAISE NOTICE '  ⏭  crm_update_reads: already has organization_id.';
  END IF;
END $$;

-- ── employee_password_vault ───────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_password_vault' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE employee_password_vault
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_emp_password_vault_org_id ON employee_password_vault(organization_id);
    RAISE NOTICE '  ✅ employee_password_vault: organization_id added.';
  ELSE
    RAISE NOTICE '  ⏭  employee_password_vault: already has organization_id.';
  END IF;
END $$;

-- ── Verify ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 002b complete: organization_id added to all additional tables.';
END $$;
