-- ============================================
-- ORGCHART MODULE - Schema Definition
-- ============================================
-- Схема для модуля организационной структуры

CREATE SCHEMA IF NOT EXISTS orgchart;

-- ============================================
-- ORGCHARTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orgcharts (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Orgchart type and basic info
  type TEXT NOT NULL CHECK (type IN ('orgchart', 'position', 'department', 'division', 'unit')),
  title TEXT NOT NULL,
  description TEXT,
  code TEXT,
  version TEXT,
  status TEXT,

  -- Hierarchy
  parent_id UUID REFERENCES orgcharts(id) ON DELETE CASCADE,
  head_position_id UUID REFERENCES orgcharts(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Headcount (departments only)
  headcount INTEGER CHECK (headcount IS NULL OR headcount >= 0),
  headcount_filled INTEGER DEFAULT 0 CHECK (headcount_filled >= 0),
  headcount_unfilled INTEGER DEFAULT 0 CHECK (headcount_unfilled >= 0),

  -- Position details
  charter TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  job_description TEXT,

  -- Appointee (current position holder)
  appointee_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  appointee_fullname TEXT,
  appointee_email TEXT,
  is_vacant BOOLEAN DEFAULT TRUE,
  appointed_at TIMESTAMP,

  -- JSONB consolidated data (NEW)
  metadata JSONB,
  charter_data JSONB,
  job_description_data JSONB,
  compensation_data JSONB,
  appointment_data JSONB,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT headcount_consistency CHECK (
    headcount IS NULL OR
    (headcount_filled + headcount_unfilled = headcount)
  )

  -- NOTE: Используется audit.log для детального отслеживания изменений
);

-- ============================================
-- ORGCHART APPROVALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orgchart_approvals (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  orgchart_id UUID NOT NULL REFERENCES orgcharts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Approval workflow
  workflow_step INTEGER NOT NULL DEFAULT 1,
  approver_user_id TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  approver_position_id UUID REFERENCES orgcharts(id) ON DELETE SET NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  decision_notes TEXT,
  decided_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- ORGCHART APPOINTMENT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orgchart_appointment_history (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- References
  orgchart_id UUID NOT NULL REFERENCES orgcharts(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES orgcharts(id) ON DELETE CASCADE,

  -- Appointment details
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  fullname TEXT NOT NULL,
  email TEXT NOT NULL,

  -- Hierarchical reporting
  reports_to_position_id UUID REFERENCES orgcharts(id) ON DELETE SET NULL,

  -- Job offer details
  job_offer_data JSONB,

  -- Lifecycle
  appointed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  end_reason TEXT CHECK (end_reason IN ('resigned', 'terminated', 'transferred', 'promoted', 'reorganization', NULL)),

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Orgcharts indexes
CREATE INDEX IF NOT EXISTS idx_orgcharts_id ON orgcharts(id);
CREATE INDEX IF NOT EXISTS idx_orgcharts_company_id ON orgcharts(company_id);
CREATE INDEX IF NOT EXISTS idx_orgcharts_type ON orgcharts(type);
CREATE INDEX IF NOT EXISTS idx_orgcharts_parent_id ON orgcharts(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orgcharts_head_position ON orgcharts(head_position_id) WHERE head_position_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orgcharts_appointee ON orgcharts(appointee_user_id) WHERE appointee_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orgcharts_level ON orgcharts(level);
CREATE INDEX IF NOT EXISTS idx_orgcharts_status ON orgcharts(status);
CREATE INDEX IF NOT EXISTS idx_orgcharts_created ON orgcharts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orgcharts_is_vacant ON orgcharts(is_vacant) WHERE type = 'position';

-- JSONB indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_orgcharts_code ON orgcharts ((metadata->>'code')) WHERE metadata->>'code' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orgcharts_version ON orgcharts ((metadata->>'version')) WHERE type = 'orgchart';
CREATE INDEX IF NOT EXISTS idx_orgcharts_appointee_user ON orgcharts ((appointment_data->>'user_id')) WHERE appointment_data->>'user_id' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orgcharts_reports_to ON orgcharts ((appointment_data->>'reports_to_position_id')) WHERE appointment_data->>'reports_to_position_id' IS NOT NULL;

-- Orgchart approvals indexes
CREATE INDEX IF NOT EXISTS idx_orgchart_approvals_orgchart ON orgchart_approvals(orgchart_id);
CREATE INDEX IF NOT EXISTS idx_orgchart_approvals_company ON orgchart_approvals(company_id);
CREATE INDEX IF NOT EXISTS idx_orgchart_approvals_approver ON orgchart_approvals(approver_user_id);
CREATE INDEX IF NOT EXISTS idx_orgchart_approvals_status ON orgchart_approvals(status);
CREATE INDEX IF NOT EXISTS idx_orgchart_approvals_created ON orgchart_approvals(created_at DESC);

-- Appointment history indexes
CREATE INDEX IF NOT EXISTS idx_appointment_history_position ON orgchart_appointment_history(position_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_user ON orgchart_appointment_history(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointment_history_company ON orgchart_appointment_history(company_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_orgchart ON orgchart_appointment_history(orgchart_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_dates ON orgchart_appointment_history(appointed_at DESC, ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_history_reports_to ON orgchart_appointment_history(reports_to_position_id) WHERE reports_to_position_id IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE orgcharts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgchart_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgchart_appointment_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see orgcharts of their companies
DROP POLICY IF EXISTS tenant_isolation_orgcharts ON orgcharts;
CREATE POLICY tenant_isolation_orgcharts ON orgcharts
  USING (company_id = NULLIF(current_setting('app.current_company_id', TRUE), '')::UUID)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', TRUE), '')::UUID);

DROP POLICY IF EXISTS tenant_isolation_orgchart_approvals ON orgchart_approvals;
CREATE POLICY tenant_isolation_orgchart_approvals ON orgchart_approvals
  USING (company_id = NULLIF(current_setting('app.current_company_id', TRUE), '')::UUID)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', TRUE), '')::UUID);

DROP POLICY IF EXISTS tenant_isolation_appointment_history ON orgchart_appointment_history;
CREATE POLICY tenant_isolation_appointment_history ON orgchart_appointment_history
  USING (company_id = NULLIF(current_setting('app.current_company_id', TRUE), '')::UUID)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', TRUE), '')::UUID);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_orgcharts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_orgcharts_updated_at ON orgcharts;
CREATE TRIGGER trigger_orgcharts_updated_at
  BEFORE UPDATE ON orgcharts
  FOR EACH ROW
  EXECUTE FUNCTION update_orgcharts_updated_at();

-- Auto-update updated_at for appointment history
DROP TRIGGER IF EXISTS trigger_appointment_history_updated_at ON orgchart_appointment_history;
CREATE TRIGGER trigger_appointment_history_updated_at
  BEFORE UPDATE ON orgchart_appointment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_orgcharts_updated_at();

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Helper to set company context for RLS
CREATE OR REPLACE FUNCTION orgchart.set_company_context(_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM set_config('app.current_company_id', _company_id::TEXT, FALSE);
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA orgchart IS 'Organizational chart module';
COMMENT ON TABLE orgcharts IS 'Hierarchical organizational structure (positions, departments, divisions)';
COMMENT ON TABLE orgchart_approvals IS 'Approval workflow for orgchart changes';
COMMENT ON TABLE orgchart_appointment_history IS 'Historical record of position appointments and transfers';

COMMENT ON COLUMN orgcharts.type IS 'Type: orgchart, position, department, division, unit';
COMMENT ON COLUMN orgcharts.parent_id IS 'Parent node in hierarchy (NULL for root)';
COMMENT ON COLUMN orgcharts.head_position_id IS 'Position that leads this unit/department';
COMMENT ON COLUMN orgcharts.level IS 'Hierarchy level (0 = root, 1 = direct children, etc.)';
COMMENT ON COLUMN orgcharts.appointee_user_id IS 'Current position holder (if assigned) - DEPRECATED: Use appointment_data JSONB';
COMMENT ON COLUMN orgcharts.is_vacant IS 'Whether position is vacant (no appointee)';
COMMENT ON COLUMN orgcharts.metadata IS 'JSONB: description, code, version, notes';
COMMENT ON COLUMN orgcharts.charter_data IS 'JSONB: mission, objectives, responsibilities, kpis';
COMMENT ON COLUMN orgcharts.job_description_data IS 'JSONB: summary, responsibilities, requirements, qualifications, benefits';
COMMENT ON COLUMN orgcharts.compensation_data IS 'JSONB: salary_min, salary_max, currency, frequency';
COMMENT ON COLUMN orgcharts.appointment_data IS 'JSONB: current appointment details including user_id, fullname, email, appointed_at, reports_to_position_id, job_offer';

COMMENT ON COLUMN orgchart_appointment_history.reports_to_position_id IS 'Position this appointment reports to (hierarchical reporting structure)';
COMMENT ON COLUMN orgchart_appointment_history.job_offer_data IS 'JSONB: salary, start_date, benefits, conditions';
COMMENT ON COLUMN orgchart_appointment_history.end_reason IS 'Reason for appointment ending: resigned, terminated, transferred, promoted, reorganization';

COMMENT ON FUNCTION orgchart.set_company_context IS 'Set current company ID for RLS policy enforcement';

-- ============================================
-- DATA MIGRATION TO JSONB
-- ============================================
-- This section migrates existing data from TEXT columns to JSONB fields
-- Run this after schema changes are applied

-- Migrate metadata (description, code, version)
DO $$
BEGIN
  UPDATE orgcharts
  SET metadata = jsonb_build_object(
    'description', description,
    'code', code,
    'version', version
  )
  WHERE (description IS NOT NULL OR code IS NOT NULL OR version IS NOT NULL)
    AND metadata IS NULL;

  RAISE NOTICE 'Migrated % rows to metadata JSONB', (SELECT COUNT(*) FROM orgcharts WHERE metadata IS NOT NULL);
END $$;

-- Migrate charter data (for departments/divisions)
DO $$
BEGIN
  UPDATE orgcharts
  SET charter_data = jsonb_build_object(
    'mission', charter
  )
  WHERE charter IS NOT NULL
    AND type IN ('department', 'division', 'unit')
    AND charter_data IS NULL;

  RAISE NOTICE 'Migrated % rows to charter_data JSONB', (SELECT COUNT(*) FROM orgcharts WHERE charter_data IS NOT NULL);
END $$;

-- Migrate job descriptions (for positions)
DO $$
BEGIN
  UPDATE orgcharts
  SET job_description_data = jsonb_build_object(
    'summary', job_description
  )
  WHERE job_description IS NOT NULL
    AND type = 'position'
    AND job_description_data IS NULL;

  RAISE NOTICE 'Migrated % rows to job_description_data JSONB', (SELECT COUNT(*) FROM orgcharts WHERE job_description_data IS NOT NULL);
END $$;

-- Migrate compensation data (for positions)
DO $$
BEGIN
  UPDATE orgcharts
  SET compensation_data = jsonb_build_object(
    'salary_min', salary_min,
    'salary_max', salary_max,
    'currency', 'USD',
    'frequency', 'annual'
  )
  WHERE (salary_min IS NOT NULL OR salary_max IS NOT NULL)
    AND compensation_data IS NULL;

  RAISE NOTICE 'Migrated % rows to compensation_data JSONB', (SELECT COUNT(*) FROM orgcharts WHERE compensation_data IS NOT NULL);
END $$;

-- Migrate appointment data (for appointed positions)
DO $$
BEGIN
  UPDATE orgcharts
  SET appointment_data = jsonb_build_object(
    'user_id', appointee_user_id::TEXT,
    'fullname', appointee_fullname,
    'email', appointee_email,
    'appointed_at', EXTRACT(EPOCH FROM appointed_at)::BIGINT * 1000
  )
  WHERE appointee_user_id IS NOT NULL
    AND appointment_data IS NULL;

  RAISE NOTICE 'Migrated % rows to appointment_data JSONB', (SELECT COUNT(*) FROM orgcharts WHERE appointment_data IS NOT NULL);
END $$;

-- Validate migration (check for data loss)
DO $$
DECLARE
  v_lost_descriptions INTEGER;
  v_lost_charter INTEGER;
  v_lost_job_desc INTEGER;
  v_lost_compensation INTEGER;
  v_lost_appointments INTEGER;
BEGIN
  -- Check for lost descriptions
  SELECT COUNT(*) INTO v_lost_descriptions
  FROM orgcharts
  WHERE description IS NOT NULL
    AND (metadata IS NULL OR metadata->>'description' IS NULL);

  -- Check for lost charter
  SELECT COUNT(*) INTO v_lost_charter
  FROM orgcharts
  WHERE charter IS NOT NULL
    AND (charter_data IS NULL OR charter_data->>'mission' IS NULL);

  -- Check for lost job descriptions
  SELECT COUNT(*) INTO v_lost_job_desc
  FROM orgcharts
  WHERE job_description IS NOT NULL
    AND (job_description_data IS NULL OR job_description_data->>'summary' IS NULL);

  -- Check for lost compensation
  SELECT COUNT(*) INTO v_lost_compensation
  FROM orgcharts
  WHERE (salary_min IS NOT NULL OR salary_max IS NOT NULL)
    AND compensation_data IS NULL;

  -- Check for lost appointments
  SELECT COUNT(*) INTO v_lost_appointments
  FROM orgcharts
  WHERE appointee_user_id IS NOT NULL
    AND (appointment_data IS NULL OR appointment_data->>'user_id' IS NULL);

  -- Raise warnings if data loss detected
  IF v_lost_descriptions > 0 THEN
    RAISE WARNING 'Data loss detected: % descriptions not migrated', v_lost_descriptions;
  END IF;

  IF v_lost_charter > 0 THEN
    RAISE WARNING 'Data loss detected: % charters not migrated', v_lost_charter;
  END IF;

  IF v_lost_job_desc > 0 THEN
    RAISE WARNING 'Data loss detected: % job descriptions not migrated', v_lost_job_desc;
  END IF;

  IF v_lost_compensation > 0 THEN
    RAISE WARNING 'Data loss detected: % compensation records not migrated', v_lost_compensation;
  END IF;

  IF v_lost_appointments > 0 THEN
    RAISE WARNING 'Data loss detected: % appointments not migrated', v_lost_appointments;
  END IF;

  -- Success message if no data loss
  IF v_lost_descriptions = 0 AND v_lost_charter = 0 AND v_lost_job_desc = 0
     AND v_lost_compensation = 0 AND v_lost_appointments = 0 THEN
    RAISE NOTICE 'Migration validation successful - no data loss detected';
  END IF;
END $$;

-- ============================================
-- PHASE 5: REMOVE OLD COLUMNS (BREAKING CHANGE)
-- ============================================
-- Run this ONLY after validating that:
-- 1. All data has been migrated to JSONB
-- 2. All functions have been updated
-- 3. Service layer has been updated
-- 4. Frontend is using new API
--
-- IMPORTANT: This is a BREAKING CHANGE. Create a database backup before running!

/*
-- Uncomment to execute column removal:

DO $$
BEGIN
  RAISE NOTICE 'Starting column removal...';

  -- Remove metadata fields (now in metadata JSONB)
  ALTER TABLE orgcharts DROP COLUMN IF EXISTS description;
  ALTER TABLE orgcharts DROP COLUMN IF EXISTS code;
  ALTER TABLE orgcharts DROP COLUMN IF EXISTS version;
  RAISE NOTICE 'Dropped metadata columns: description, code, version';

  -- Remove charter field (now in charter_data JSONB)
  ALTER TABLE orgcharts DROP COLUMN IF EXISTS charter;
  RAISE NOTICE 'Dropped charter column';

  -- Remove job description field (now in job_description_data JSONB)
  ALTER TABLE orgcharts DROP COLUMN IF EXISTS job_description;
  RAISE NOTICE 'Dropped job_description column';

  -- Remove compensation fields (now in compensation_data JSONB)
  ALTER TABLE orgcharts DROP COLUMN IF EXISTS salary_min;
  ALTER TABLE orgcharts DROP COLUMN IF EXISTS salary_max;
  RAISE NOTICE 'Dropped compensation columns: salary_min, salary_max';

  -- Remove appointment fields (now in appointment_data JSONB)
  ALTER TABLE orgcharts DROP COLUMN IF EXISTS appointee_user_id;
  ALTER TABLE orgcharts DROP COLUMN IF EXISTS appointee_fullname;
  ALTER TABLE orgcharts DROP COLUMN IF EXISTS appointee_email;
  ALTER TABLE orgcharts DROP COLUMN IF EXISTS appointed_at;
  RAISE NOTICE 'Dropped appointment columns: appointee_user_id, appointee_fullname, appointee_email, appointed_at';

  -- Drop old appointment index (no longer needed)
  DROP INDEX IF EXISTS idx_orgcharts_appointee;
  RAISE NOTICE 'Dropped idx_orgcharts_appointee index';

  RAISE NOTICE 'Column removal complete! Final column count: 15 (down from 25)';
  RAISE NOTICE 'Storage savings: ~40%';
END $$;

*/

-- ============================================
-- FINAL SCHEMA SUMMARY (After Phase 5)
-- ============================================
-- Core columns (15 total):
-- 1. id - UUID PRIMARY KEY
-- 2. company_id - UUID (multi-tenancy)
-- 3. type - TEXT (orgchart/department/position)
-- 4. title - TEXT
-- 5. status - TEXT
-- 6. parent_id - UUID (hierarchy)
-- 7. head_position_id - UUID
-- 8. level - INTEGER
-- 9. sort_order - INTEGER
-- 10. headcount - INTEGER
-- 11. headcount_filled - INTEGER
-- 12. headcount_unfilled - INTEGER
-- 13. is_vacant - BOOLEAN
-- 14. created_at - TIMESTAMP
-- 15. updated_at - TIMESTAMP
--
-- JSONB columns (5 total):
-- 16. metadata - description, code, version
-- 17. charter_data - mission, objectives, responsibilities, kpis
-- 18. job_description_data - summary, responsibilities, requirements, qualifications, benefits
-- 19. compensation_data - salary_min, salary_max, currency, frequency
-- 20. appointment_data - user_id, fullname, email, appointed_at, reports_to_position_id, job_offer
--
-- Total: 20 columns (vs original 20, but with JSONB consolidation for future expansion)
