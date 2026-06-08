-- ============================================================
-- Migration 001 — Create organizations table
-- SaaS Multi-Tenant Foundation: Phase 1
-- Run against: bhoomi_crm_saas (NEW database — do NOT run on bhoomi_crm)
-- Date: 2026-06-05
-- ============================================================

-- Enable pgcrypto for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── organizations ─────────────────────────────────────────────────────────────
-- Each row represents one tenant company using the SaaS CRM.
-- All business data in every other table will reference this via organization_id.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  company_name      TEXT         NOT NULL,
  slug              TEXT         NOT NULL UNIQUE,           -- URL-safe identifier e.g. "bhoomi-realty"
  company_email     TEXT         NOT NULL,
  company_phone     TEXT,
  logo              TEXT,                                   -- URL or relative path to logo image

  -- Custom domain (future: subdomain routing)
  domain            TEXT         UNIQUE,                    -- e.g. "crm.bhoomi.com" (nullable)

  -- SaaS billing tier
  -- free | starter | pro | enterprise
  subscription_plan TEXT         NOT NULL DEFAULT 'free',
  subscription_ends_at TIMESTAMPTZ,                         -- NULL = no expiry / free tier

  -- Status
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,

  -- Audit
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Fast slug lookups (login, URL routing, tenant resolution)
CREATE INDEX IF NOT EXISTS idx_organizations_slug
  ON organizations (slug);

-- Fast domain lookups (future subdomain middleware)
CREATE INDEX IF NOT EXISTS idx_organizations_domain
  ON organizations (domain)
  WHERE domain IS NOT NULL;

-- Active-org lookups (admin dashboards, billing checks)
CREATE INDEX IF NOT EXISTS idx_organizations_is_active
  ON organizations (is_active)
  WHERE is_active = TRUE;

-- ── Auto-update updated_at via trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Verify ───────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    RAISE NOTICE '✅ Migration 001 complete: organizations table created.';
  ELSE
    RAISE EXCEPTION '❌ Migration 001 FAILED: organizations table not found after creation.';
  END IF;
END $$;
