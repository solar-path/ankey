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
  type TEXT NOT NULL CHECK (type IN ('position', 'department', 'division', 'unit')),
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

  -- Headcount
  headcount INTEGER,
  headcount_filled INTEGER,
  headcount_unfilled INTEGER,

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

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()

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

-- Orgchart approvals indexes
CREATE INDEX IF NOT EXISTS idx_orgchart_approvals_orgchart ON orgchart_approvals(orgchart_id);
CREATE INDEX IF NOT EXISTS idx_orgchart_approvals_company ON orgchart_approvals(company_id);
CREATE INDEX IF NOT EXISTS idx_orgchart_approvals_approver ON orgchart_approvals(approver_user_id);
CREATE INDEX IF NOT EXISTS idx_orgchart_approvals_status ON orgchart_approvals(status);
CREATE INDEX IF NOT EXISTS idx_orgchart_approvals_created ON orgchart_approvals(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE orgcharts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgchart_approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see orgcharts of their companies
DROP POLICY IF EXISTS tenant_isolation_orgcharts ON orgcharts;
CREATE POLICY tenant_isolation_orgcharts ON orgcharts
  USING (company_id = NULLIF(current_setting('app.current_company_id', TRUE), '')::UUID)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', TRUE), '')::UUID);

DROP POLICY IF EXISTS tenant_isolation_orgchart_approvals ON orgchart_approvals;
CREATE POLICY tenant_isolation_orgchart_approvals ON orgchart_approvals
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

COMMENT ON COLUMN orgcharts.type IS 'Type: position, department, division, unit';
COMMENT ON COLUMN orgcharts.parent_id IS 'Parent node in hierarchy (NULL for root)';
COMMENT ON COLUMN orgcharts.head_position_id IS 'Position that leads this unit/department';
COMMENT ON COLUMN orgcharts.level IS 'Hierarchy level (0 = root, 1 = direct children, etc.)';
COMMENT ON COLUMN orgcharts.appointee_user_id IS 'Current position holder (if assigned)';
COMMENT ON COLUMN orgcharts.is_vacant IS 'Whether position is vacant (no appointee)';

COMMENT ON FUNCTION orgchart.set_company_context IS 'Set current company ID for RLS policy enforcement';
