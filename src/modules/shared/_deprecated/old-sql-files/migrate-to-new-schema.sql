-- ============================================
-- MIGRATION SCRIPT: Add missing columns for new auth system
-- ============================================
-- This script updates existing tables to be compatible with new auth functions

-- ============================================
-- 1. Add missing columns to users table
-- ============================================

-- Add _id column (text-based ID for PouchDB compatibility)
ALTER TABLE users ADD COLUMN IF NOT EXISTS _id TEXT;

-- Add type column for document type discrimination
ALTER TABLE users ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'user';

-- Add invitation_token and invitation_expiry
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_expiry BIGINT;

-- Update _id for existing users (use 'user_' + timestamp + '_' + uuid)
UPDATE users
SET _id = 'user_' || EXTRACT(EPOCH FROM created_at)::BIGINT || '_' || id::TEXT
WHERE _id IS NULL;

-- Make _id NOT NULL and UNIQUE after populating
ALTER TABLE users ALTER COLUMN _id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users__id ON users(_id);

-- ============================================
-- 2. Add missing columns to sessions table
-- ============================================

-- Check if sessions has correct structure
DO $$
BEGIN
  -- Add _id column if doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='_id') THEN
    ALTER TABLE sessions ADD COLUMN _id TEXT;
    UPDATE sessions SET _id = 'session_' || EXTRACT(EPOCH FROM created_at)::BIGINT || '_' || id::TEXT WHERE _id IS NULL;
    ALTER TABLE sessions ALTER COLUMN _id SET NOT NULL;
    CREATE UNIQUE INDEX idx_sessions__id ON sessions(_id);
  END IF;

  -- Add type column if doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='type') THEN
    ALTER TABLE sessions ADD COLUMN type TEXT DEFAULT 'session';
  END IF;
END$$;

-- ============================================
-- 3. Add missing columns to companies table
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='_id') THEN
    ALTER TABLE companies ADD COLUMN _id TEXT;
    UPDATE companies SET _id = 'company_' || EXTRACT(EPOCH FROM created_at)::BIGINT || '_' || id::TEXT WHERE _id IS NULL;
    ALTER TABLE companies ALTER COLUMN _id SET NOT NULL;
    CREATE UNIQUE INDEX idx_companies__id ON companies(_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='type') THEN
    ALTER TABLE companies ADD COLUMN type TEXT DEFAULT 'company';
  END IF;
END$$;

-- ============================================
-- 4. Add missing columns to user_companies table
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_companies' AND column_name='_id') THEN
    ALTER TABLE user_companies ADD COLUMN _id TEXT;
    UPDATE user_companies SET _id = 'user_company_' || EXTRACT(EPOCH FROM created_at)::BIGINT || '_' || id::TEXT WHERE _id IS NULL;
    ALTER TABLE user_companies ALTER COLUMN _id SET NOT NULL;
    CREATE UNIQUE INDEX idx_user_companies__id ON user_companies(_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_companies' AND column_name='type') THEN
    ALTER TABLE user_companies ADD COLUMN type TEXT DEFAULT 'user_company';
  END IF;
END$$;

-- ============================================
-- 5. Create indexes for new columns
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type);
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);
CREATE INDEX IF NOT EXISTS idx_user_companies_type ON user_companies(type);

-- ============================================
-- 6. Convert timestamp columns to BIGINT (milliseconds)
-- ============================================

-- Note: If you need to convert existing timestamp columns to BIGINT (milliseconds),
-- uncomment these lines. But this is destructive and requires careful consideration.

-- ALTER TABLE users ADD COLUMN created_at_bigint BIGINT;
-- ALTER TABLE users ADD COLUMN updated_at_bigint BIGINT;
-- UPDATE users SET created_at_bigint = EXTRACT(EPOCH FROM created_at)::BIGINT * 1000;
-- UPDATE users SET updated_at_bigint = EXTRACT(EPOCH FROM updated_at)::BIGINT * 1000;

-- ============================================
-- 7. Create auth schema
-- ============================================

CREATE SCHEMA IF NOT EXISTS auth;

-- ============================================
-- DONE
-- ============================================

SELECT 'Migration completed successfully!' AS result;
