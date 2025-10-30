-- ============================================
-- DOA (Delegation of Authority) MODULE - Database Schema
-- ============================================
-- Schema for approval matrices and workflows

CREATE SCHEMA IF NOT EXISTS doa;

-- ============================================
-- APPROVAL_MATRICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS approval_matrices (
  -- UUID for efficient JOINs
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Text ID for compatibility
  _id TEXT UNIQUE NOT NULL,

  -- Document type
  type TEXT NOT NULL DEFAULT 'approval_matrix' CHECK (type = 'approval_matrix'),

  -- Foreign key
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Matrix details
  name TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'department_charter',
    'job_description',
    'job_offer',
    'employment_contract',
    'termination_notice',
    'orgchart',
    'purchase_order',
    'sales_order',
    'invoice',
    'payment',
    'contract',
    'other'
  )),

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Amount thresholds (optional, for financial documents)
  min_amount DECIMAL(15,2),
  max_amount DECIMAL(15,2),
  currency TEXT DEFAULT 'USD',

  -- Approval flow configuration (JSONB)
  approval_blocks JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Structure: [{
  --   "level": 1,
  --   "order": 1,
  --   "approvers": ["user_id_1", "user_id_2"],
  --   "requiresAll": false,
  --   "minApprovals": 1
  -- }]

  -- Metadata
  created_by TEXT NOT NULL REFERENCES users(_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- APPROVAL_WORKFLOWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS approval_workflows (
  -- UUID for efficient JOINs
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Text ID for compatibility
  _id TEXT UNIQUE NOT NULL,

  -- Document type
  type TEXT NOT NULL DEFAULT 'approval_workflow' CHECK (type = 'approval_workflow'),

  -- Foreign keys
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  matrix_id UUID NOT NULL REFERENCES approval_matrices(id) ON DELETE CASCADE,

  -- Entity being approved
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,

  -- Workflow state
  current_level INTEGER DEFAULT 1,
  current_block INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'declined',
    'approval_pending'
  )),

  -- Decisions (JSONB array)
  decisions JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Structure: [{
  --   "userId": "user_123",
  --   "userName": "John Doe",
  --   "level": 1,
  --   "decision": "approved",
  --   "comments": "Looks good",
  --   "decidedAt": 1234567890
  -- }]

  -- Initiator
  initiator_id TEXT REFERENCES users(_id),

  -- Document details (JSONB)
  document JSONB,
  -- Structure: {
  --   "type": "job_offer",
  --   "amount": 50000,
  --   "currency": "USD",
  --   "description": "Senior Developer position",
  --   "metadata": {}
  -- }

  -- Timestamps
  submitted_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_approval_matrices_id ON approval_matrices(id);
CREATE INDEX IF NOT EXISTS idx_approval_matrices_text_id ON approval_matrices(_id);
CREATE INDEX IF NOT EXISTS idx_approval_matrices_company_id ON approval_matrices(company_id);
CREATE INDEX IF NOT EXISTS idx_approval_matrices_document_type ON approval_matrices(document_type);
CREATE INDEX IF NOT EXISTS idx_approval_matrices_status ON approval_matrices(status);
CREATE INDEX IF NOT EXISTS idx_approval_matrices_is_active ON approval_matrices(is_active);
CREATE INDEX IF NOT EXISTS idx_approval_matrices_company_doc_type ON approval_matrices(company_id, document_type);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_id ON approval_workflows(id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_text_id ON approval_workflows(_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_company_id ON approval_workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_matrix_id ON approval_workflows(matrix_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_entity ON approval_workflows(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_initiator ON approval_workflows(initiator_id);

-- ============================================
-- TRIGGERS
-- ============================================
-- Auto-update updated_at on approval_matrices
CREATE OR REPLACE FUNCTION update_approval_matrices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_approval_matrices_updated_at
  BEFORE UPDATE ON approval_matrices
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_matrices_updated_at();

-- Auto-update updated_at on approval_workflows
CREATE OR REPLACE FUNCTION update_approval_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_approval_workflows_updated_at
  BEFORE UPDATE ON approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_workflows_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE approval_matrices IS 'Approval matrices defining approval flows for different document types';
COMMENT ON COLUMN approval_matrices.id IS 'UUID primary key for efficient database JOINs';
COMMENT ON COLUMN approval_matrices._id IS 'Text ID for compatibility (format: matrix_<timestamp>_<uuid>)';
COMMENT ON COLUMN approval_matrices.document_type IS 'Type of document this matrix applies to';
COMMENT ON COLUMN approval_matrices.approval_blocks IS 'JSONB array defining the approval flow blocks';
COMMENT ON COLUMN approval_matrices.is_active IS 'Whether this matrix is currently active for its document type';

COMMENT ON TABLE approval_workflows IS 'Active approval workflow instances tracking document approvals';
COMMENT ON COLUMN approval_workflows.id IS 'UUID primary key';
COMMENT ON COLUMN approval_workflows._id IS 'Text ID (format: workflow_<timestamp>_<uuid>)';
COMMENT ON COLUMN approval_workflows.entity_type IS 'Type of entity being approved (e.g., orgchart, job_offer)';
COMMENT ON COLUMN approval_workflows.entity_id IS 'ID of the entity being approved';
COMMENT ON COLUMN approval_workflows.decisions IS 'JSONB array of approval decisions made';
COMMENT ON COLUMN approval_workflows.document IS 'JSONB object with document details';
