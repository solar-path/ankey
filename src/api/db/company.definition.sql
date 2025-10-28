-- ============================================
-- COMPANY MODULE - Database Schema
-- ============================================
-- Updated schema to support UUID-based JOINs while maintaining TEXT _id for compatibility

-- ============================================
-- DROP OLD TABLES (if migration needed)
-- ============================================
-- Uncomment if you need to recreate tables:
-- DROP TABLE IF EXISTS user_companies CASCADE;
-- DROP TABLE IF EXISTS companies CASCADE;

-- ============================================
-- COMPANIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  -- UUID for efficient JOINs
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Text ID for compatibility with PouchDB/CouchDB format
  _id TEXT UNIQUE NOT NULL,

  -- Document type (for compatibility)
  type TEXT NOT NULL DEFAULT 'company' CHECK (type IN ('company', 'workspace', 'supplier', 'customer')),

  -- Basic info
  title TEXT NOT NULL,
  logo TEXT,
  website TEXT,
  business_id TEXT,
  tax_id TEXT,
  residence TEXT,
  industry TEXT,

  -- Contact info (JSONB)
  contact JSONB DEFAULT '{}'::JSONB,

  -- Settings (JSONB)
  settings JSONB DEFAULT '{}'::JSONB,

  -- Timestamps (using PostgreSQL native TIMESTAMP)
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER_COMPANIES TABLE (Junction table)
-- ============================================
CREATE TABLE IF NOT EXISTS user_companies (
  -- UUID for efficient JOINs
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Text ID for compatibility
  _id TEXT UNIQUE NOT NULL,

  -- Document type
  type TEXT NOT NULL DEFAULT 'user_company' CHECK (type = 'user_company'),

  -- Foreign keys
  user_id TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- User role in company
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),

  -- When user joined the company
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Created timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Unique constraint: one user can have only one role per company
  UNIQUE(user_id, company_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_companies_id ON companies(id);
CREATE INDEX IF NOT EXISTS idx_companies_text_id ON companies(_id);
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);
CREATE INDEX IF NOT EXISTS idx_companies_title ON companies(title);
CREATE INDEX IF NOT EXISTS idx_companies_residence ON companies(residence);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_created ON companies(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_companies_id ON user_companies(id);
CREATE INDEX IF NOT EXISTS idx_user_companies_text_id ON user_companies(_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_role ON user_companies(role);
CREATE INDEX IF NOT EXISTS idx_user_companies_user_company ON user_companies(user_id, company_id);

-- ============================================
-- TRIGGERS
-- ============================================
-- Auto-update updated_at on companies
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE companies IS 'Companies table with dual-key system: UUID for JOINs, TEXT _id for compatibility';
COMMENT ON COLUMN companies.id IS 'UUID primary key for efficient database JOINs';
COMMENT ON COLUMN companies._id IS 'Text ID for compatibility with legacy systems (format: company_<timestamp>_<uuid>)';
COMMENT ON COLUMN companies.type IS 'Company type: workspace (user owns), supplier, customer, or company';
COMMENT ON COLUMN companies.contact IS 'Contact information in JSONB format';
COMMENT ON COLUMN companies.settings IS 'Company settings in JSONB format';

COMMENT ON TABLE user_companies IS 'Junction table linking users to companies with roles';
COMMENT ON COLUMN user_companies.id IS 'UUID primary key';
COMMENT ON COLUMN user_companies._id IS 'Text ID (format: uc_<user_id>_<company_uuid>)';
COMMENT ON COLUMN user_companies.user_id IS 'Reference to users._id (TEXT format)';
COMMENT ON COLUMN user_companies.company_id IS 'Reference to companies.id (UUID format)';
COMMENT ON COLUMN user_companies.role IS 'User role: owner, admin, or member';
COMMENT ON COLUMN user_companies.joined_at IS 'Timestamp when user joined the company';

-- ============================================
-- MIGRATION HELPER (if needed)
-- ============================================
-- Function to migrate old companies data to new schema
CREATE OR REPLACE FUNCTION migrate_companies_to_uuid()
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_old_companies RECORD;
  v_new_uuid UUID;
BEGIN
  -- This function helps migrate from TEXT-only schema to UUID+TEXT schema
  -- Only use if you have existing data in old format

  RAISE NOTICE 'Starting migration of companies to UUID schema...';

  -- Migration logic would go here if needed
  -- For now, this is just a placeholder

  RAISE NOTICE 'Migration complete';
END;
$$;

COMMENT ON FUNCTION migrate_companies_to_uuid IS 'Helper function to migrate old companies data (if needed)';
