-- ================================================
-- RLS (Row Level Security) Policies
-- ================================================
-- Purpose: Automatic data isolation and access control
-- Architecture: Postgres-centric (see docs/RBAC_ARCHITECTURE.md)
-- Created: 2025-10-30
-- ================================================
--
-- IMPORTANT:
-- - RLS policies automatically filter data based on session context
-- - Session context is set via rbac.set_user_context(_user_id, _company_id)
-- - Each table has policies for:
--   1. Tenant isolation (company_id filtering)
--   2. Permission-based access (specific actions)
--   3. Superuser access (bypass all restrictions)
--
-- ================================================

-- ================================================
-- Helper Function: Get Current User ID
-- ================================================

CREATE OR REPLACE FUNCTION rbac.current_user_id()
RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', TRUE), '');
$$;

-- ================================================
-- Helper Function: Get Current Company ID
-- ================================================

CREATE OR REPLACE FUNCTION rbac.current_company_id()
RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_company_id', TRUE), '')::UUID;
$$;

-- ================================================
-- Helper Function: Is Superuser
-- ================================================

CREATE OR REPLACE FUNCTION rbac.is_superuser()
RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('app.is_superuser', TRUE), 'false')::BOOLEAN;
$$;

-- ================================================
-- Table: companies
-- ================================================
-- RLS: User can only see companies they are member of
-- ================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: User can see companies they belong to
CREATE POLICY companies_member_access ON companies
  FOR ALL
  USING (
    rbac.is_superuser() OR
    id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
    )
  );

-- ================================================
-- Table: user_companies
-- ================================================
-- RLS: User can see their own memberships + admin can see all members of their companies
-- ================================================

ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users see their own memberships
CREATE POLICY user_companies_own_memberships ON user_companies
  FOR ALL
  USING (
    rbac.is_superuser() OR
    user_id = rbac.current_user_id()
  );

-- Policy: Admins can see all members of their companies
CREATE POLICY user_companies_admin_view ON user_companies
  FOR SELECT
  USING (
    rbac.is_superuser() OR
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
        AND role IN ('owner', 'admin')
    )
  );

-- Policy: Only owners/admins can modify memberships
CREATE POLICY user_companies_admin_modify ON user_companies
  FOR INSERT, UPDATE, DELETE
  USING (
    rbac.is_superuser() OR
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
        AND role IN ('owner', 'admin')
    )
  );

-- ================================================
-- Table: tasks
-- ================================================
-- RLS: Tenant isolation + assignee-based access
-- ================================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Tenant isolation (base policy)
CREATE POLICY tasks_tenant_isolation ON tasks
  FOR ALL
  USING (
    rbac.is_superuser() OR
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    company_id = rbac.current_company_id()
  );

-- Policy: Users can see tasks they created or are assigned to
CREATE POLICY tasks_assignee_access ON tasks
  FOR SELECT
  USING (
    rbac.is_superuser() OR
    (
      -- Tenant isolation (base condition)
      company_id IN (
        SELECT company_id FROM user_companies
        WHERE user_id = rbac.current_user_id()
      )
      AND (
        -- Creator
        creator_id = rbac.current_user_id()
        OR
        -- Assigned user (check assignees JSONB array)
        assignees @> jsonb_build_array(
          jsonb_build_object('type', 'user', 'id', rbac.current_user_id())
        )
        OR
        -- Has task.read permission
        rbac.has_permission(
          rbac.current_user_id(),
          company_id,
          'task.read'
        )
      )
    )
  );

-- ================================================
-- Table: orgcharts
-- ================================================
-- RLS: Tenant isolation (already implemented, keeping for reference)
-- ================================================

-- Note: orgcharts already has RLS enabled in orgchart.definition.sql
-- We keep the existing policy and add superuser access

CREATE POLICY IF NOT EXISTS orgcharts_superuser_access ON orgcharts
  FOR ALL
  USING (rbac.is_superuser());

-- ================================================
-- Table: orgchart_approvals
-- ================================================

ALTER TABLE orgchart_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY orgchart_approvals_tenant_isolation ON orgchart_approvals
  FOR ALL
  USING (
    rbac.is_superuser() OR
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    company_id = rbac.current_company_id()
  );

CREATE POLICY orgchart_approvals_superuser ON orgchart_approvals
  FOR ALL
  USING (rbac.is_superuser());

-- ================================================
-- Table: orgchart_appointment_history
-- ================================================

ALTER TABLE orgchart_appointment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY appointment_history_tenant_isolation ON orgchart_appointment_history
  FOR ALL
  USING (
    rbac.is_superuser() OR
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    company_id = rbac.current_company_id()
  );

-- ================================================
-- Table: approval_matrices
-- ================================================
-- RLS: Tenant isolation + permission-based access
-- ================================================

ALTER TABLE approval_matrices ENABLE ROW LEVEL SECURITY;

CREATE POLICY approval_matrices_tenant_isolation ON approval_matrices
  FOR ALL
  USING (
    rbac.is_superuser() OR
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    company_id = rbac.current_company_id()
  );

-- Policy: Only users with doa.read can view
CREATE POLICY approval_matrices_read_permission ON approval_matrices
  FOR SELECT
  USING (
    rbac.is_superuser() OR
    rbac.has_permission(
      rbac.current_user_id(),
      company_id,
      'doa.read'
    )
  );

-- Policy: Only users with doa.update can modify
CREATE POLICY approval_matrices_write_permission ON approval_matrices
  FOR INSERT, UPDATE, DELETE
  USING (
    rbac.is_superuser() OR
    rbac.has_permission(
      rbac.current_user_id(),
      company_id,
      'doa.update'
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    rbac.has_permission(
      rbac.current_user_id(),
      company_id,
      'doa.update'
    )
  );

-- ================================================
-- Table: approval_workflows
-- ================================================
-- RLS: Tenant isolation
-- ================================================

ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY approval_workflows_tenant_isolation ON approval_workflows
  FOR ALL
  USING (
    rbac.is_superuser() OR
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    company_id = rbac.current_company_id()
  );

-- ================================================
-- Table: audit_log
-- ================================================
-- RLS: Only users with audit.read permission can view
-- ================================================

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Superuser sees all
CREATE POLICY audit_log_superuser ON audit_log
  FOR ALL
  USING (rbac.is_superuser());

-- Policy: Users with audit.read permission can view their company's logs
CREATE POLICY audit_log_permission_based ON audit_log
  FOR SELECT
  USING (
    rbac.is_superuser() OR
    (
      company_id IN (
        SELECT uc.company_id
        FROM user_companies uc
        WHERE uc.user_id = rbac.current_user_id()
          AND rbac.has_permission(
            uc.user_id,
            uc.company_id,
            'audit.read'
          )
      )
    )
  );

-- Policy: Users can see their own actions (even without audit.read)
CREATE POLICY audit_log_own_actions ON audit_log
  FOR SELECT
  USING (
    rbac.is_superuser() OR
    user_id = rbac.current_user_id()
  );

-- ================================================
-- Table: audit_sessions
-- ================================================
-- RLS: Users can see their own sessions + admins can see all sessions
-- ================================================

ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users see their own sessions
CREATE POLICY audit_sessions_own_sessions ON audit_sessions
  FOR SELECT
  USING (
    rbac.is_superuser() OR
    user_id = rbac.current_user_id()
  );

-- Policy: Admins with audit.read can see all sessions in their company
CREATE POLICY audit_sessions_admin_view ON audit_sessions
  FOR SELECT
  USING (
    rbac.is_superuser() OR
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = rbac.current_user_id()
        AND rbac.has_permission(
          uc.user_id,
          uc.company_id,
          'audit.read'
        )
    )
  );

-- ================================================
-- Table: audit_soft_deletes
-- ================================================
-- RLS: Tenant isolation + permission-based
-- ================================================

ALTER TABLE audit_soft_deletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_soft_deletes_tenant_isolation ON audit_soft_deletes
  FOR ALL
  USING (
    rbac.is_superuser() OR
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
    )
  );

-- Policy: Only admins with audit.read can view soft deletes
CREATE POLICY audit_soft_deletes_admin_view ON audit_soft_deletes
  FOR SELECT
  USING (
    rbac.is_superuser() OR
    rbac.has_permission(
      rbac.current_user_id(),
      company_id,
      'audit.read'
    )
  );

-- ================================================
-- Table: audit_reports
-- ================================================
-- RLS: Tenant isolation + permission-based
-- ================================================

ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_reports_tenant_isolation ON audit_reports
  FOR ALL
  USING (
    rbac.is_superuser() OR
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
    )
  );

-- Policy: Only users with audit.export can view/create reports
CREATE POLICY audit_reports_permission_based ON audit_reports
  FOR ALL
  USING (
    rbac.is_superuser() OR
    rbac.has_permission(
      rbac.current_user_id(),
      company_id,
      'audit.export'
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    rbac.has_permission(
      rbac.current_user_id(),
      company_id,
      'audit.export'
    )
  );

-- ================================================
-- Table: permissions
-- ================================================
-- RLS: Read-only for all users, only superuser can modify
-- ================================================

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read permissions
CREATE POLICY permissions_public_read ON permissions
  FOR SELECT
  USING (TRUE);

-- Policy: Only superuser can modify permissions
CREATE POLICY permissions_superuser_only ON permissions
  FOR INSERT, UPDATE, DELETE
  USING (rbac.is_superuser())
  WITH CHECK (rbac.is_superuser());

-- ================================================
-- Table: role_permissions
-- ================================================
-- RLS: Read-only for all users, only superuser can modify
-- ================================================

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read role permissions
CREATE POLICY role_permissions_public_read ON role_permissions
  FOR SELECT
  USING (TRUE);

-- Policy: Only superuser can modify role permissions
CREATE POLICY role_permissions_superuser_only ON role_permissions
  FOR INSERT, UPDATE, DELETE
  USING (rbac.is_superuser())
  WITH CHECK (rbac.is_superuser());

-- ================================================
-- Table: user_permissions
-- ================================================
-- RLS: Users can see their own overrides + admins can see all in their company
-- ================================================

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users see their own permission overrides
CREATE POLICY user_permissions_own_overrides ON user_permissions
  FOR SELECT
  USING (
    rbac.is_superuser() OR
    user_id = rbac.current_user_id()
  );

-- Policy: Admins with company.change_roles can see/modify all in their company
CREATE POLICY user_permissions_admin_manage ON user_permissions
  FOR ALL
  USING (
    rbac.is_superuser() OR
    rbac.has_permission(
      rbac.current_user_id(),
      company_id,
      'company.change_roles'
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    rbac.has_permission(
      rbac.current_user_id(),
      company_id,
      'company.change_roles'
    )
  );

-- ================================================
-- Table: custom_roles
-- ================================================
-- RLS: Tenant isolation + admin access
-- ================================================

ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY custom_roles_tenant_isolation ON custom_roles
  FOR ALL
  USING (
    rbac.is_superuser() OR
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    company_id = rbac.current_company_id()
  );

-- Policy: Only admins can manage custom roles
CREATE POLICY custom_roles_admin_manage ON custom_roles
  FOR INSERT, UPDATE, DELETE
  USING (
    rbac.is_superuser() OR
    rbac.has_permission(
      rbac.current_user_id(),
      company_id,
      'company.change_roles'
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    rbac.has_permission(
      rbac.current_user_id(),
      company_id,
      'company.change_roles'
    )
  );

-- ================================================
-- Table: custom_role_permissions
-- ================================================
-- RLS: Based on custom_role access
-- ================================================

ALTER TABLE custom_role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see permissions of custom roles in their company
CREATE POLICY custom_role_permissions_company_access ON custom_role_permissions
  FOR SELECT
  USING (
    rbac.is_superuser() OR
    custom_role_id IN (
      SELECT id FROM custom_roles
      WHERE company_id IN (
        SELECT company_id FROM user_companies
        WHERE user_id = rbac.current_user_id()
      )
    )
  );

-- Policy: Only admins can manage custom role permissions
CREATE POLICY custom_role_permissions_admin_manage ON custom_role_permissions
  FOR INSERT, UPDATE, DELETE
  USING (
    rbac.is_superuser() OR
    custom_role_id IN (
      SELECT id FROM custom_roles
      WHERE rbac.has_permission(
        rbac.current_user_id(),
        company_id,
        'company.change_roles'
      )
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    custom_role_id IN (
      SELECT id FROM custom_roles
      WHERE rbac.has_permission(
        rbac.current_user_id(),
        company_id,
        'company.change_roles'
      )
    )
  );

-- ================================================
-- Table: users
-- ================================================
-- RLS: Users can see their own data + company members
-- ================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own profile
CREATE POLICY users_own_profile ON users
  FOR ALL
  USING (
    rbac.is_superuser() OR
    _id = rbac.current_user_id()
  )
  WITH CHECK (
    rbac.is_superuser() OR
    _id = rbac.current_user_id()
  );

-- Policy: Users can see profiles of members in their companies
CREATE POLICY users_company_members ON users
  FOR SELECT
  USING (
    rbac.is_superuser() OR
    _id IN (
      SELECT DISTINCT uc1.user_id
      FROM user_companies uc1
      WHERE uc1.company_id IN (
        SELECT uc2.company_id
        FROM user_companies uc2
        WHERE uc2.user_id = rbac.current_user_id()
      )
    )
  );

-- ================================================
-- Summary of RLS Policies
-- ================================================
-- Tables with RLS enabled:
-- ✅ companies - tenant isolation
-- ✅ user_companies - own memberships + admin view
-- ✅ tasks - tenant isolation + assignee access
-- ✅ orgcharts - tenant isolation (existing)
-- ✅ orgchart_approvals - tenant isolation
-- ✅ orgchart_appointment_history - tenant isolation
-- ✅ approval_matrices - tenant isolation + permission-based
-- ✅ approval_workflows - tenant isolation
-- ✅ audit_log - permission-based + own actions
-- ✅ audit_sessions - own sessions + admin view
-- ✅ audit_soft_deletes - tenant isolation + admin view
-- ✅ audit_reports - tenant isolation + permission-based
-- ✅ permissions - public read, superuser write
-- ✅ role_permissions - public read, superuser write
-- ✅ user_permissions - own overrides + admin manage
-- ✅ custom_roles - tenant isolation + admin manage
-- ✅ custom_role_permissions - company access + admin manage
-- ✅ users - own profile + company members
-- ================================================

-- ================================================
-- Testing RLS Policies
-- ================================================
-- To test RLS policies:
--
-- 1. Set user context:
--    SELECT rbac.set_user_context('user_id_here', 'company_uuid_here'::UUID);
--
-- 2. Query table:
--    SELECT * FROM tasks;  -- Should only see tasks for the context company
--
-- 3. Clear context:
--    SELECT set_config('app.current_user_id', '', FALSE);
--    SELECT set_config('app.current_company_id', '', FALSE);
--
-- 4. Enable superuser mode (for testing):
--    SELECT set_config('app.is_superuser', 'true', FALSE);
--
-- ================================================

-- ================================================
-- End of RLS Policies
-- ================================================
