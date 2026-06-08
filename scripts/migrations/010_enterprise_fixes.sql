-- ============================================================
-- Migration 010 — Enterprise Fixes
-- Adds tenant_sequences for Lead Numbering and Unique Constraints for Site Visits
-- ============================================================

-- ── 1. Tenant Sequences Table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_sequences (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  next_value INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (organization_id, entity_type)
);

-- ── 2. Add lead_number to Leads ──────────────────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_number INTEGER;

-- ── 3. Backfill Existing Leads ───────────────────────────────────────────────
-- This assigns a sequential number per organization based on created_at
WITH numbered_leads AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at ASC) as new_lead_num
  FROM leads
)
UPDATE leads l
SET lead_number = nl.new_lead_num
FROM numbered_leads nl
WHERE l.id = nl.id AND l.lead_number IS NULL;

-- ── 4. Add Unique Constraint on Leads ────────────────────────────────────────
-- Now that lead_number is backfilled, we can enforce uniqueness per org
ALTER TABLE leads
  ADD CONSTRAINT unique_lead_number_per_org UNIQUE (organization_id, lead_number);

-- ── 5. Seed Tenant Sequences ─────────────────────────────────────────────────
-- Initialize sequences for existing organizations based on max lead_number
INSERT INTO tenant_sequences (organization_id, entity_type, next_value)
SELECT organization_id, 'lead', COALESCE(MAX(lead_number), 0) + 1
FROM leads
GROUP BY organization_id
ON CONFLICT (organization_id, entity_type) 
DO UPDATE SET next_value = EXCLUDED.next_value;

-- ── 6. Prevent Duplicate Site Visits ─────────────────────────────────────────
-- Adding a partial unique index to prevent duplicate scheduling
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_site_visit 
ON site_visits (organization_id, lead_id, visit_date) 
WHERE status != 'cancelled';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 010 complete: Enterprise numbering and site visit constraints applied.';
END $$;
