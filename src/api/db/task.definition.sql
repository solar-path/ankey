-- ============================================
-- TASK MODULE - Database Schema
-- ============================================
-- Schema for manual tasks and approval tasks

CREATE SCHEMA IF NOT EXISTS task;

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  -- UUID for efficient JOINs
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Text ID for compatibility
  _id TEXT UNIQUE NOT NULL,

  -- Document type
  type TEXT NOT NULL DEFAULT 'manual_task' CHECK (type IN ('manual_task', 'approval_task', 'review_task')),

  -- Foreign keys
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL REFERENCES users(_id),

  -- Task details
  title TEXT NOT NULL,
  description TEXT,

  -- Task type and priority
  task_type TEXT CHECK (task_type IN ('manual', 'approval_request', 'review_doa_matrix', 'approval_response')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Deadline
  deadline TIMESTAMP,

  -- Assignees (JSONB array)
  assignees JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Structure: [{
  --   "type": "user" | "position" | "department",
  --   "id": "user_id or position_id or department_id",
  --   "name": "Display name"
  -- }]

  -- Approvers (JSONB array, optional)
  approvers JSONB DEFAULT '[]'::JSONB,
  -- Structure: [{
  --   "userId": "user_id",
  --   "name": "User name",
  --   "status": "pending" | "approved" | "rejected"
  -- }]

  -- Attachments (JSONB array, max 5MB total)
  attachments JSONB DEFAULT '[]'::JSONB,
  -- Structure: [{
  --   "name": "file.pdf",
  --   "url": "https://...",
  --   "type": "application/pdf",
  --   "size": 12345,
  --   "uploadedAt": 1234567890
  -- }]

  -- Status
  completed BOOLEAN NOT NULL DEFAULT false,
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')),

  -- Workflow relation (for approval tasks)
  workflow_id UUID REFERENCES approval_workflows(id) ON DELETE CASCADE,

  -- Related entity (for approval/review tasks)
  entity_type TEXT,
  entity_id TEXT,

  -- Document details (for approval tasks)
  document_type TEXT,
  document_amount DECIMAL(15,2),
  document_currency TEXT,
  document_description TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tasks_id ON tasks(id);
CREATE INDEX IF NOT EXISTS idx_tasks_text_id ON tasks(_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_id ON tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_entity ON tasks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_company_completed ON tasks(company_id, completed);

-- GIN index for JSONB columns to enable efficient querying
CREATE INDEX IF NOT EXISTS idx_tasks_assignees_gin ON tasks USING GIN (assignees);
CREATE INDEX IF NOT EXISTS idx_tasks_approvers_gin ON tasks USING GIN (approvers);

-- ============================================
-- TRIGGERS
-- ============================================
-- Auto-update updated_at on tasks
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- Auto-set completed_at when task is marked as completed
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND OLD.completed = false THEN
    NEW.completed_at = NOW();
  ELSIF NEW.completed = false AND OLD.completed = true THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_task_completed_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.completed IS DISTINCT FROM NEW.completed)
  EXECUTE FUNCTION set_task_completed_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE tasks IS 'Tasks table for manual tasks, approval tasks, and review tasks';
COMMENT ON COLUMN tasks.id IS 'UUID primary key for efficient database JOINs';
COMMENT ON COLUMN tasks._id IS 'Text ID for compatibility (format: task_<timestamp>_<uuid>)';
COMMENT ON COLUMN tasks.type IS 'Task type: manual_task, approval_task, or review_task';
COMMENT ON COLUMN tasks.task_type IS 'Specific task subtype for categorization';
COMMENT ON COLUMN tasks.assignees IS 'JSONB array of assignees (users, positions, or departments)';
COMMENT ON COLUMN tasks.approvers IS 'JSONB array of approvers (if task requires approval)';
COMMENT ON COLUMN tasks.attachments IS 'JSONB array of file attachments (max 5MB total)';
COMMENT ON COLUMN tasks.workflow_id IS 'Reference to approval workflow (for approval tasks)';
COMMENT ON COLUMN tasks.entity_type IS 'Type of entity this task is related to';
COMMENT ON COLUMN tasks.entity_id IS 'ID of the entity this task is related to';
COMMENT ON COLUMN tasks.metadata IS 'Additional metadata in JSONB format';
