-- 007_create_platform_tables.sql
-- Phase 3: Platform Admin System (Enterprise Version)

-- 1. Create super_admins table
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'super_admin' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create platform_audit_logs table
CREATE TABLE IF NOT EXISTS platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES super_admins(id) ON DELETE SET NULL, -- the super admin who performed the action
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100), -- e.g., 'organization', 'super_admin', 'setting'
    entity_id VARCHAR(255),
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Update organizations table
-- First create the ENUM type (safe to create if not exists using a DO block)
DO $$ BEGIN
    CREATE TYPE org_status AS ENUM ('active', 'suspended', 'trial', 'expired', 'maintenance', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to organizations
ALTER TABLE organizations 
    ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS status org_status DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS created_by_super_admin UUID REFERENCES super_admins(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS max_leads INTEGER DEFAULT 10000,
    ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 5368709120; -- 5GB default

-- Migrate data from is_active to status if is_active exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'is_active') THEN
        UPDATE organizations SET status = CASE WHEN is_active THEN 'active'::org_status ELSE 'suspended'::org_status END;
        ALTER TABLE organizations DROP COLUMN is_active;
    END IF;
END $$;

-- Provide a default slug for existing organizations if any
UPDATE organizations SET slug = 'org-' || substring(id::text from 1 for 8) WHERE slug IS NULL;

-- 4. Create organization_settings table
CREATE TABLE IF NOT EXISTS organization_settings (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    crm_title VARCHAR(255) DEFAULT 'Nexora CRM',
    logo VARCHAR(255),
    favicon VARCHAR(255),
    primary_color VARCHAR(50) DEFAULT '#0F172A',
    secondary_color VARCHAR(50) DEFAULT '#3B82F6',
    sidebar_theme VARCHAR(50) DEFAULT 'dark',
    email_branding JSONB DEFAULT '{}'::jsonb,
    whatsapp_branding JSONB DEFAULT '{}'::jsonb,
    custom_domain VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure existing orgs get a settings record
INSERT INTO organization_settings (organization_id)
SELECT id FROM organizations
ON CONFLICT (organization_id) DO NOTHING;
