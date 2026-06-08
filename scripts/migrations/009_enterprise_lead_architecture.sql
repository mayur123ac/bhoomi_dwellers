-- ============================================================
-- Migration 009 — Enterprise Lead Architecture Phase 1
-- Adds enterprise fields to leads and creates new lifecycle tables
-- SAFE: All new columns start as nullable or have defaults — no existing queries break
-- ============================================================

-- ── 1. Modify leads table ────────────────────────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS city VARCHAR(255),
  ADD COLUMN IF NOT EXISTS project_interested VARCHAR(255),
  ADD COLUMN IF NOT EXISTS property_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS lead_temperature VARCHAR(50) DEFAULT 'COLD',
  ADD COLUMN IF NOT EXISTS lead_priority VARCHAR(50) DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS current_stage VARCHAR(100) DEFAULT 'New Lead',
  ADD COLUMN IF NOT EXISTS previous_stage VARCHAR(100),
  ADD COLUMN IF NOT EXISTS conversion_probability INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_executive_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_team VARCHAR(100),
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_stage_org ON leads (organization_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_leads_executive ON leads (assigned_executive_id);
CREATE INDEX IF NOT EXISTS idx_leads_manager ON leads (assigned_manager_id);

-- ── 2. lead_stage_history ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  old_stage VARCHAR(100),
  new_stage VARCHAR(100) NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lsh_lead_id ON lead_stage_history (lead_id);

-- ── 3. lead_assignments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  previous_owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  new_owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_la_lead_id ON lead_assignments (lead_id);

-- ── 4. activities ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities (lead_id, created_at DESC);

-- ── 5. notes ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON notes (lead_id, created_at DESC);

-- ── 6. enterprise_followups ──────────────────────────────────────────────────
-- Distinct from existing 'follow_ups' to ensure zero breaking changes
CREATE TABLE IF NOT EXISTS enterprise_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  followup_type VARCHAR(100) NOT NULL, -- CALL, MEETING, SITE_VISIT, REMINDER
  scheduled_at TIMESTAMPTZ NOT NULL,
  outcome TEXT,
  remarks TEXT,
  next_followup_id UUID, -- self reference
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, MISSED
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

ALTER TABLE enterprise_followups 
  ADD CONSTRAINT fk_next_followup 
  FOREIGN KEY (next_followup_id) REFERENCES enterprise_followups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ef_lead_id ON enterprise_followups (lead_id);
CREATE INDEX IF NOT EXISTS idx_ef_scheduled_at ON enterprise_followups (organization_id, scheduled_at, status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ef_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ef_updated_at ON enterprise_followups;
CREATE TRIGGER trg_ef_updated_at
  BEFORE UPDATE ON enterprise_followups
  FOR EACH ROW EXECUTE FUNCTION update_ef_updated_at();

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 009 complete: Enterprise lead architecture applied.';
END $$;
