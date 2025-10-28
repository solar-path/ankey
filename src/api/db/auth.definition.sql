-- ============================================
-- AUTH MODULE - Schema Definition
-- ============================================
-- Схема для модуля аутентификации
-- Использует audit.log для отслеживания изменений вместо created_at/updated_at в каждой таблице

CREATE SCHEMA IF NOT EXISTS auth;

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  -- Dual-key system
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL,  -- Format: user_<timestamp>_<uuid>

  -- Document type (for compatibility)
  type TEXT NOT NULL DEFAULT 'user' CHECK (type = 'user'),

  -- Basic info
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  fullname TEXT NOT NULL,

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,

  -- 2FA
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,

  -- Invitations
  invitation_token TEXT,
  invitation_expiry BIGINT,

  -- Password reset
  reset_token TEXT,
  reset_token_expiry BIGINT,

  -- Profile (JSONB for flexibility)
  profile JSONB DEFAULT '{}'::JSONB,

  -- Timestamps (using native PostgreSQL TIMESTAMP)
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()

  -- NOTE: Детальное логирование в audit.log вместо триггеров updated_at
);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  -- Dual-key system
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL,  -- Format: session_<timestamp>_<uuid>

  -- Document type
  type TEXT NOT NULL DEFAULT 'session' CHECK (type = 'session'),

  -- User reference (TEXT to match users._id)
  user_id TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,

  -- Session token
  token TEXT NOT NULL UNIQUE,

  -- Expiration (BIGINT for millisecond timestamps)
  expires_at BIGINT NOT NULL,

  -- Created timestamp (BIGINT for millisecond timestamps)
  created_at BIGINT NOT NULL

  -- NOTE: Session tracking в audit.sessions для детального анализа
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_text_id ON users(_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_code) WHERE verification_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_invitation ON users(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_reset ON users(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(id);
CREATE INDEX IF NOT EXISTS idx_sessions_text_id ON sessions(_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at for users
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Generate unique ID with custom prefix
CREATE OR REPLACE FUNCTION auth.generate_id(_prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql AS $$
BEGIN
  RETURN _prefix || '_' ||
         EXTRACT(EPOCH FROM NOW())::BIGINT || '_' ||
         gen_random_uuid()::TEXT;
END;
$$;

-- Cleanup expired sessions
CREATE OR REPLACE FUNCTION auth.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions
  WHERE expires_at < EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA auth IS 'Authentication module schema';
COMMENT ON TABLE users IS 'Users table with dual-key system (UUID + TEXT)';
COMMENT ON TABLE sessions IS 'Active user sessions';

COMMENT ON COLUMN users.id IS 'UUID primary key for efficient JOINs';
COMMENT ON COLUMN users._id IS 'Text ID for compatibility (format: user_<timestamp>_<uuid>)';
COMMENT ON COLUMN users.profile IS 'Additional profile information in JSONB format';

COMMENT ON COLUMN sessions.id IS 'UUID primary key';
COMMENT ON COLUMN sessions._id IS 'Text ID (format: session_<timestamp>_<uuid>)';
COMMENT ON COLUMN sessions.expires_at IS 'Expiration timestamp in milliseconds';

COMMENT ON FUNCTION auth.generate_id IS 'Generate unique ID with custom prefix';
COMMENT ON FUNCTION auth.cleanup_expired_sessions IS 'Remove expired sessions';
