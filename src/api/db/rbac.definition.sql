-- ================================================
-- RBAC (Role-Based Access Control) Schema
-- ================================================
-- Purpose: Fine-grained permission system for Ankey
-- Architecture: Postgres-centric (see docs/RBAC_ARCHITECTURE.md)
-- Created: 2025-10-30
-- ================================================

-- Create RBAC schema for functions
CREATE SCHEMA IF NOT EXISTS rbac;

-- ================================================
-- Table: permissions
-- ================================================
-- Defines available permissions in the system
-- Each permission is a specific action on a resource (e.g., 'task.create', 'orgchart.approve')
-- ================================================

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL DEFAULT ('perm_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),

  -- Permission identifier (e.g., 'task.create', 'orgchart.approve')
  name TEXT UNIQUE NOT NULL,

  -- Human-readable description
  description TEXT,

  -- Module name (e.g., 'task', 'orgchart', 'company', 'doa')
  module TEXT NOT NULL,

  -- Action type (e.g., 'create', 'read', 'update', 'delete', 'approve', 'assign')
  action TEXT NOT NULL,

  -- Risk level for audit and UI purposes
  risk_level TEXT DEFAULT 'low',
  CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  -- Minimum role level required (0=guest, 1=member, 2=admin, 3=owner)
  min_role_level INTEGER DEFAULT 1,
  CONSTRAINT valid_role_level CHECK (min_role_level BETWEEN 0 AND 3),

  -- Is this permission currently active?
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_permissions_risk_level ON permissions(risk_level) WHERE is_active = TRUE;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_permissions_updated_at();

-- ================================================
-- Table: role_permissions
-- ================================================
-- Default permissions assigned to each base role (owner, admin, member, guest)
-- This defines what each role can do by default
-- ================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL DEFAULT ('rp_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),

  -- Base role (owner, admin, member, guest)
  role TEXT NOT NULL,
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member', 'guest')),

  -- Permission
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,

  -- Can this role delegate this permission to others?
  can_delegate BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(role, permission_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- ================================================
-- Table: user_permissions
-- ================================================
-- User-specific permission overrides (grant or revoke)
-- This allows fine-grained control: give a 'member' a specific 'admin' permission
-- or revoke a permission from an 'admin'
-- ================================================

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL DEFAULT ('up_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),

  user_id TEXT REFERENCES users(_id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,

  -- Grant or revoke
  grant_type TEXT NOT NULL,
  CONSTRAINT valid_grant_type CHECK (grant_type IN ('grant', 'revoke')),

  -- Who granted/revoked this permission
  granted_by TEXT REFERENCES users(_id),

  -- Reason for grant/revoke
  reason TEXT,

  -- Temporary permissions (NULL = permanent)
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, company_id, permission_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires ON user_permissions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(user_id, company_id, permission_id)
  WHERE (expires_at IS NULL OR expires_at > NOW());

-- ================================================
-- Table: custom_roles (Optional - For Future)
-- ================================================
-- Custom roles with flexible permissions
-- Allows companies to define their own roles (e.g., "Project Manager", "Accountant")
-- ================================================

CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL DEFAULT ('cr_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),

  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Role name (e.g., "Project Manager", "Accountant")
  name TEXT NOT NULL,

  -- Description
  description TEXT,

  -- Base role to inherit from
  base_role TEXT NOT NULL,
  CONSTRAINT valid_base_role CHECK (base_role IN ('owner', 'admin', 'member', 'guest')),

  -- Color for UI
  color TEXT DEFAULT '#3b82f6',

  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT REFERENCES users(_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(company_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_roles_company ON custom_roles(company_id) WHERE is_active = TRUE;

-- Custom role permissions
CREATE TABLE IF NOT EXISTS custom_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_role_id UUID REFERENCES custom_roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(custom_role_id, permission_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_role_permissions_role ON custom_role_permissions(custom_role_id);
CREATE INDEX IF NOT EXISTS idx_custom_role_permissions_permission ON custom_role_permissions(permission_id);

-- ================================================
-- Update: user_companies table
-- ================================================
-- Add custom_role_id column to support custom roles
-- Add 'guest' role to CHECK constraint
-- ================================================

-- Add custom_role_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_companies' AND column_name = 'custom_role_id'
  ) THEN
    ALTER TABLE user_companies ADD COLUMN custom_role_id UUID REFERENCES custom_roles(id);
    CREATE INDEX idx_user_companies_custom_role ON user_companies(custom_role_id);
  END IF;
END $$;

-- Update CHECK constraint to include 'guest' role
ALTER TABLE user_companies DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE user_companies ADD CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member', 'guest'));

-- ================================================
-- Seed Data: Initial Permissions
-- ================================================
-- Insert default permissions for all modules
-- ================================================

-- Task Module Permissions
INSERT INTO permissions (name, description, module, action, risk_level, min_role_level) VALUES
  ('task.create', 'Create new tasks', 'task', 'create', 'low', 1),
  ('task.read', 'View tasks', 'task', 'read', 'low', 1),
  ('task.update', 'Update tasks', 'task', 'update', 'medium', 1),
  ('task.delete', 'Delete tasks', 'task', 'delete', 'high', 2),
  ('task.assign', 'Assign tasks to users', 'task', 'assign', 'medium', 1),
  ('task.approve', 'Approve task completion', 'task', 'approve', 'medium', 2)
ON CONFLICT (name) DO NOTHING;

-- OrgChart Module Permissions
INSERT INTO permissions (name, description, module, action, risk_level, min_role_level) VALUES
  ('orgchart.create', 'Create new org charts', 'orgchart', 'create', 'medium', 2),
  ('orgchart.read', 'View org charts', 'orgchart', 'read', 'low', 1),
  ('orgchart.update', 'Update org charts', 'orgchart', 'update', 'medium', 2),
  ('orgchart.delete', 'Delete org charts', 'orgchart', 'delete', 'high', 3),
  ('orgchart.approve', 'Approve org chart changes', 'orgchart', 'approve', 'high', 2),
  ('orgchart.appoint', 'Appoint users to positions', 'orgchart', 'appoint', 'high', 2),
  ('orgchart.duplicate', 'Duplicate org charts', 'orgchart', 'duplicate', 'medium', 2)
ON CONFLICT (name) DO NOTHING;

-- DoA Module Permissions
INSERT INTO permissions (name, description, module, action, risk_level, min_role_level) VALUES
  ('doa.create', 'Create DoA matrices', 'doa', 'create', 'high', 2),
  ('doa.read', 'View DoA matrices', 'doa', 'read', 'low', 1),
  ('doa.update', 'Update DoA matrices', 'doa', 'update', 'high', 2),
  ('doa.delete', 'Delete DoA matrices', 'doa', 'delete', 'critical', 3),
  ('doa.approve', 'Approve DoA requests', 'doa', 'approve', 'critical', 2)
ON CONFLICT (name) DO NOTHING;

-- Company Module Permissions
INSERT INTO permissions (name, description, module, action, risk_level, min_role_level) VALUES
  ('company.create', 'Create new companies', 'company', 'create', 'high', 1),
  ('company.read', 'View company information', 'company', 'read', 'low', 1),
  ('company.update', 'Update company settings', 'company', 'update', 'high', 2),
  ('company.delete', 'Delete company', 'company', 'delete', 'critical', 3),
  ('company.invite', 'Invite new members', 'company', 'invite', 'medium', 2),
  ('company.remove_member', 'Remove members from company', 'company', 'remove_member', 'high', 2),
  ('company.change_roles', 'Change member roles', 'company', 'change_roles', 'critical', 3),
  ('company.view_members', 'View company members', 'company', 'view_members', 'low', 1)
ON CONFLICT (name) DO NOTHING;

-- Audit Module Permissions
INSERT INTO permissions (name, description, module, action, risk_level, min_role_level) VALUES
  ('audit.read', 'View audit logs', 'audit', 'read', 'medium', 2),
  ('audit.export', 'Export audit reports', 'audit', 'export', 'high', 2),
  ('audit.view_trail', 'View audit trail for records', 'audit', 'view_trail', 'medium', 2)
ON CONFLICT (name) DO NOTHING;

-- Auth Module Permissions
INSERT INTO permissions (name, description, module, action, risk_level, min_role_level) VALUES
  ('auth.manage_users', 'Manage user accounts', 'auth', 'manage', 'high', 2),
  ('auth.view_users', 'View user information', 'auth', 'read', 'low', 1)
ON CONFLICT (name) DO NOTHING;

-- Inquiry Module Permissions (if exists)
INSERT INTO permissions (name, description, module, action, risk_level, min_role_level) VALUES
  ('inquiry.create', 'Create new inquiries', 'inquiry', 'create', 'low', 1),
  ('inquiry.read', 'View inquiries', 'inquiry', 'read', 'low', 1),
  ('inquiry.update', 'Update inquiries', 'inquiry', 'update', 'medium', 1),
  ('inquiry.delete', 'Delete inquiries', 'inquiry', 'delete', 'high', 2)
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- Seed Data: Role-Permission Mappings
-- ================================================
-- Assign default permissions to base roles
-- ================================================

-- Owner: ALL permissions
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'owner', id, TRUE FROM permissions WHERE is_active = TRUE
ON CONFLICT (role, permission_id) DO NOTHING;

-- Admin: All except critical risk
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'admin', id, FALSE FROM permissions
WHERE is_active = TRUE AND risk_level != 'critical'
ON CONFLICT (role, permission_id) DO NOTHING;

-- Admin: Can approve high-risk operations
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'admin', id, FALSE FROM permissions
WHERE is_active = TRUE AND action = 'approve' AND risk_level IN ('high', 'medium')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Member: Basic CRUD (low risk only)
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'member', id, FALSE FROM permissions
WHERE is_active = TRUE
  AND action IN ('create', 'read', 'update')
  AND risk_level IN ('low', 'medium')
  AND module NOT IN ('audit', 'company') -- Members can't manage company or view audit by default
ON CONFLICT (role, permission_id) DO NOTHING;

-- Member: Can view company and members
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'member', id, FALSE FROM permissions
WHERE name IN ('company.read', 'company.view_members', 'auth.view_users')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Guest: Read-only access
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'guest', id, FALSE FROM permissions
WHERE is_active = TRUE AND action = 'read'
ON CONFLICT (role, permission_id) DO NOTHING;

-- ================================================
-- Audit Triggers
-- ================================================
-- Automatically log permission changes
-- ================================================

-- Trigger for user_permissions
CREATE OR REPLACE FUNCTION rbac.audit_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM audit.log_action(
      NEW.granted_by,
      CASE WHEN NEW.grant_type = 'grant' THEN 'GRANT_PERMISSION' ELSE 'REVOKE_PERMISSION' END,
      'user_permissions',
      NEW._id,
      NEW.company_id,
      NULL,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'permission_id', NEW.permission_id,
        'grant_type', NEW.grant_type,
        'reason', NEW.reason,
        'expires_at', NEW.expires_at
      ),
      NULL, NULL, NULL,
      format('%s permission %s for user %s',
        CASE WHEN NEW.grant_type = 'grant' THEN 'Granted' ELSE 'Revoked' END,
        (SELECT name FROM permissions WHERE id = NEW.permission_id),
        NEW.user_id
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM audit.log_action(
      NEW.granted_by,
      'UPDATE_PERMISSION',
      'user_permissions',
      NEW._id,
      NEW.company_id,
      jsonb_build_object(
        'grant_type', OLD.grant_type,
        'expires_at', OLD.expires_at
      ),
      jsonb_build_object(
        'grant_type', NEW.grant_type,
        'expires_at', NEW.expires_at
      ),
      NULL, NULL, NULL,
      format('Updated permission %s for user %s',
        (SELECT name FROM permissions WHERE id = NEW.permission_id),
        NEW.user_id
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM audit.log_action(
      OLD.granted_by,
      'DELETE_PERMISSION',
      'user_permissions',
      OLD._id,
      OLD.company_id,
      jsonb_build_object(
        'user_id', OLD.user_id,
        'permission_id', OLD.permission_id,
        'grant_type', OLD.grant_type
      ),
      NULL,
      NULL, NULL, NULL,
      format('Deleted permission override for user %s', OLD.user_id)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_user_permissions
  AFTER INSERT OR UPDATE OR DELETE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION rbac.audit_user_permissions();

-- ================================================
-- Comments for Documentation
-- ================================================

COMMENT ON TABLE permissions IS 'Defines all available permissions in the system. Each permission is a specific action on a resource (e.g., task.create, orgchart.approve)';
COMMENT ON TABLE role_permissions IS 'Maps base roles (owner, admin, member, guest) to their default permissions';
COMMENT ON TABLE user_permissions IS 'User-specific permission overrides. Allows granting or revoking specific permissions for individual users';
COMMENT ON TABLE custom_roles IS 'Custom roles defined by companies with flexible permission sets';
COMMENT ON TABLE custom_role_permissions IS 'Maps custom roles to their assigned permissions';

COMMENT ON COLUMN permissions.name IS 'Unique permission identifier in format: module.action (e.g., task.create)';
COMMENT ON COLUMN permissions.risk_level IS 'Risk level for audit and UI: low, medium, high, critical';
COMMENT ON COLUMN permissions.min_role_level IS 'Minimum role level required: 0=guest, 1=member, 2=admin, 3=owner';

COMMENT ON COLUMN user_permissions.grant_type IS 'Either grant (add permission) or revoke (remove permission)';
COMMENT ON COLUMN user_permissions.expires_at IS 'Expiration timestamp for temporary permissions. NULL = permanent';

-- ================================================
-- End of RBAC Schema
-- ================================================
