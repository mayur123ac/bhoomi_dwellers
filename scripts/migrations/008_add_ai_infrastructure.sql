-- ============================================================
-- Migration 008 — Add AI Infrastructure
-- AI multi-tenant foundations (quotas, tracking, sessions)
-- Run against: bhoomi_crm_saas
-- Date: 2026-06-05
-- ============================================================

-- ── 1. Update organizations table ──────────────────────────────
-- Add fields for AI tracking per tenant
ALTER TABLE organizations 
    ADD COLUMN IF NOT EXISTS ai_credits BIGINT DEFAULT 10000, -- Monthly token limit for starter plan
    ADD COLUMN IF NOT EXISTS ai_credits_used BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_features_enabled JSONB DEFAULT '{"assistant": true, "scoring": false, "workflows": false}'::jsonb;

-- ── 2. Create ai_usage_logs table ──────────────────────────────
-- High-level granularity logging of token usage per feature
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    feature VARCHAR(100) NOT NULL, -- e.g., 'assistant', 'scoring', 'workflow', 'analytics'
    tokens_used INTEGER NOT NULL DEFAULT 0,
    model_used VARCHAR(100) NOT NULL, -- e.g., 'gpt-4o', 'gemini-1.5-pro'
    metadata JSONB, -- Context details, prompt hashes, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_org_id ON ai_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage_logs(created_at);

-- ── 3. Create ai_sessions table ──────────────────────────────
-- Represents a continuous conversation/context thread for a user
CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Chat',
    status VARCHAR(50) DEFAULT 'active', -- active, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_org_user ON ai_sessions(organization_id, user_id);

-- Auto-update updated_at via trigger
DROP TRIGGER IF EXISTS trg_ai_sessions_updated_at ON ai_sessions;
CREATE TRIGGER trg_ai_sessions_updated_at
  BEFORE UPDATE ON ai_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 4. Create ai_messages table ──────────────────────────────
-- Individual messages inside a session
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, -- For easier isolation querying
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at);

-- ── Verify ──────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_usage_logs') THEN
    RAISE NOTICE '✅ Migration 008 complete: AI infrastructure tables created.';
  ELSE
    RAISE EXCEPTION '❌ Migration 008 FAILED: ai_usage_logs table not found.';
  END IF;
END $$;
