-- ============================================================
-- Migration 006 — Create audit_logs table
-- SaaS Multi-Tenant Foundation: Phase 2A
-- PREREQUISITE: Run 001–004 first
-- Date: 2026-06-05
-- ============================================================

-- Enable pgcrypto if not already active (needed for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── audit_logs ────────────────────────────────────────────────────────────────
-- Immutable append-only log of security-relevant events.
-- Never UPDATE or DELETE rows — only INSERT.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant context
  organization_id UUID         REFERENCES organizations(id) ON DELETE SET NULL,

  -- Actor (NULL for unauthenticated events like failed logins)
  user_id         INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  user_email      TEXT,                            -- denormalized for fast lookup

  -- What happened
  action          TEXT         NOT NULL,           -- e.g. 'login.success', 'lead.delete', 'employee.create'
  entity_type     TEXT,                            -- e.g. 'lead', 'user', 'organization'
  entity_id       TEXT,                            -- the affected record's ID (any type → text)

  -- Extra context
  metadata        JSONB        NOT NULL DEFAULT '{}', -- any additional data relevant to the action
  ip_address      INET,                            -- caller's IP (from request headers)
  user_agent      TEXT,                            -- browser/client identifier

  -- Status
  status          TEXT         NOT NULL DEFAULT 'success'
                  CHECK (status IN ('success', 'failure', 'warning')),

  -- Timestamp (immutable — no updated_at)
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Indexes for common query patterns ─────────────────────────────────────────

-- Tenant-scoped audit trail (most common: "show me my org's events")
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id
  ON audit_logs (organization_id, created_at DESC);

-- User-specific audit trail ("what did this user do?")
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON audit_logs (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Action-type filtering ("show all failed logins")
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs (action, created_at DESC);

-- Entity-specific trail ("what happened to lead #123?")
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs (entity_type, entity_id)
  WHERE entity_type IS NOT NULL;

-- Time-range queries (analytics, compliance reports)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);

-- ── Verify ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    RAISE NOTICE '✅ Migration 006 complete: audit_logs table created.';
  ELSE
    RAISE EXCEPTION '❌ Migration 006 FAILED: audit_logs table not found.';
  END IF;
END $$;
