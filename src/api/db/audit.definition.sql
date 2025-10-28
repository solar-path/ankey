-- ============================================
-- AUDIT LOGGING SYSTEM - Schema Definition
-- ============================================
-- Централизованная система аудит-логирования для:
-- - SOC Reports (Security Operations Center)
-- - SoX Compliance (Sarbanes-Oxley)
-- - User Activity Tracking
-- - Data Change History

CREATE SCHEMA IF NOT EXISTS audit;

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
-- Централизованная таблица для всех изменений данных
CREATE TABLE IF NOT EXISTS audit.log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action
  user_id TEXT,  -- TEXT to support custom user IDs (user_<timestamp>_<uuid>)
  user_email TEXT,
  user_role TEXT,

  -- What action was performed
  action TEXT NOT NULL CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'RESTORE',
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
    'SIGNUP', 'VERIFY', 'PASSWORD_RESET',
    'INVITE', 'ACCEPT_INVITE', 'REVOKE_ACCESS',
    'APPROVE', 'REJECT', 'SUBMIT',
    'EXPORT', 'IMPORT', 'VIEW'
  )),

  -- What was affected
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,  -- Can be UUID or TEXT ID

  -- Multi-tenancy
  company_id UUID,  -- NULL for global records (users, sessions)

  -- Change details
  old_values JSONB,  -- Previous state (for UPDATE/DELETE)
  new_values JSONB,  -- New state (for CREATE/UPDATE)

  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id UUID,  -- For tracing requests across services

  -- Metadata
  notes TEXT,

  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- SOFT DELETE TRACKING
-- ============================================
-- Отдельная таблица для отслеживания мягко удаленных записей
CREATE TABLE IF NOT EXISTS audit.soft_deletes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was deleted
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,

  -- Who deleted
  deleted_by TEXT NOT NULL,
  deleted_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Snapshot of deleted data
  data_snapshot JSONB NOT NULL,

  -- Multi-tenancy
  company_id UUID,

  -- Restoration info
  restored BOOLEAN DEFAULT FALSE,
  restored_by TEXT,
  restored_at TIMESTAMP,

  -- Permanent deletion scheduled
  permanent_delete_at TIMESTAMP,

  UNIQUE(table_name, record_id)
);

-- ============================================
-- USER SESSION TRACKING
-- ============================================
-- Детальное отслеживание сессий для SOC reports
CREATE TABLE IF NOT EXISTS audit.sessions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User info
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,

  -- Session info
  session_token TEXT NOT NULL UNIQUE,

  -- Login details
  login_at TIMESTAMP NOT NULL DEFAULT NOW(),
  login_ip INET,
  login_user_agent TEXT,
  login_method TEXT,  -- password, 2fa, sso, etc.

  -- Logout details
  logout_at TIMESTAMP,
  logout_reason TEXT,  -- manual, timeout, security, etc.

  -- Activity tracking
  last_activity_at TIMESTAMP,
  actions_count INTEGER DEFAULT 0,

  -- Security
  is_suspicious BOOLEAN DEFAULT FALSE,
  suspicious_reason TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'suspicious'))
);

-- ============================================
-- COMPLIANCE REPORTS METADATA
-- ============================================
-- Метаданные для генерации отчетов SOC/SoX
CREATE TABLE IF NOT EXISTS audit.reports (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Report info
  report_type TEXT NOT NULL,  -- SOC1, SOC2, SOX, GDPR, etc.
  report_period_start TIMESTAMP NOT NULL,
  report_period_end TIMESTAMP NOT NULL,

  -- Generated info
  generated_by TEXT NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Report data
  data JSONB NOT NULL,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived'))
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit.log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit.log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit.log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_company_id ON audit.log(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit.log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_request_id ON audit.log(request_id) WHERE request_id IS NOT NULL;

-- Soft deletes indexes
CREATE INDEX IF NOT EXISTS idx_soft_deletes_table_record ON audit.soft_deletes(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_soft_deletes_deleted_at ON audit.soft_deletes(deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_soft_deletes_restored ON audit.soft_deletes(restored) WHERE restored = FALSE;
CREATE INDEX IF NOT EXISTS idx_soft_deletes_permanent_delete ON audit.soft_deletes(permanent_delete_at) WHERE permanent_delete_at IS NOT NULL;

-- Session tracking indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON audit.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON audit.sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_login_at ON audit.sessions(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON audit.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_suspicious ON audit.sessions(is_suspicious) WHERE is_suspicious = TRUE;

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_type ON audit.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_period ON audit.reports(report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_reports_status ON audit.reports(status);

-- ============================================
-- PARTITIONING (для больших объемов данных)
-- ============================================
-- TODO: После накопления данных можно включить партиционирование по месяцам
-- CREATE TABLE audit.log_2025_01 PARTITION OF audit.log
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- ============================================
-- DATA RETENTION POLICY
-- ============================================
-- Функция для автоматической очистки старых логов (compliance requirement)
CREATE OR REPLACE FUNCTION audit.cleanup_old_logs(_retention_days INTEGER DEFAULT 2555)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete logs older than retention period (default 7 years for SOX)
  DELETE FROM audit.log
  WHERE created_at < NOW() - INTERVAL '1 day' * _retention_days;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Функция для перманентного удаления мягко удаленных записей
CREATE OR REPLACE FUNCTION audit.cleanup_soft_deletes()
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Permanently delete records marked for deletion
  DELETE FROM audit.soft_deletes
  WHERE restored = FALSE
    AND permanent_delete_at IS NOT NULL
    AND permanent_delete_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA audit IS 'Audit logging system for SOC reports, SoX compliance, and activity tracking';
COMMENT ON TABLE audit.log IS 'Central audit log for all data changes and user actions';
COMMENT ON TABLE audit.soft_deletes IS 'Soft delete tracking with data snapshots';
COMMENT ON TABLE audit.sessions IS 'Detailed session tracking for security analysis';
COMMENT ON TABLE audit.reports IS 'Compliance reports metadata (SOC1, SOC2, SOX, GDPR)';

COMMENT ON COLUMN audit.log.action IS 'Type of action: CREATE, UPDATE, DELETE, LOGIN, etc.';
COMMENT ON COLUMN audit.log.old_values IS 'Previous state before change (for UPDATE/DELETE)';
COMMENT ON COLUMN audit.log.new_values IS 'New state after change (for CREATE/UPDATE)';
COMMENT ON COLUMN audit.log.request_id IS 'UUID for tracing requests across microservices';

COMMENT ON COLUMN audit.soft_deletes.data_snapshot IS 'Full snapshot of record at deletion time';
COMMENT ON COLUMN audit.soft_deletes.permanent_delete_at IS 'When to permanently delete (NULL = keep indefinitely)';

COMMENT ON FUNCTION audit.cleanup_old_logs IS 'Remove audit logs older than retention period (default 7 years)';
COMMENT ON FUNCTION audit.cleanup_soft_deletes IS 'Permanently delete soft-deleted records past their retention date';
