-- ================================================
-- RBAC (Role-Based Access Control) Functions
-- ================================================
-- Purpose: Permission checking and management functions
-- Architecture: Postgres-centric (see docs/RBAC_ARCHITECTURE.md)
-- Created: 2025-10-30
-- ================================================

-- ================================================
-- Function: rbac.has_permission
-- ================================================
-- Check if a user has a specific permission in a company
-- This is the MAIN permission checking function used throughout the system
--
-- Priority order:
-- 1. Check user_permissions (explicit grant/revoke) - HIGHEST priority
-- 2. Check custom_role permissions (if custom role assigned)
-- 3. Check base role permissions (fallback)
--
-- Returns: TRUE if user has permission, FALSE otherwise
-- ================================================

CREATE OR REPLACE FUNCTION rbac.has_permission(
  _user_id TEXT,
  _company_id UUID,
  _permission_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_company RECORD;
  v_permission_id UUID;
  v_has_permission BOOLEAN := FALSE;
  v_user_override TEXT;
BEGIN
  -- 1. Check if user is member of company
  SELECT uc.role, uc.custom_role_id
  INTO v_user_company
  FROM user_companies uc
  WHERE uc.user_id = _user_id AND uc.company_id = _company_id;

  IF v_user_company.role IS NULL THEN
    RETURN FALSE; -- User not in company
  END IF;

  -- 2. Get permission ID
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE name = _permission_name AND is_active = TRUE;

  IF v_permission_id IS NULL THEN
    RETURN FALSE; -- Permission doesn't exist
  END IF;

  -- 3. Check user_permissions (overrides)
  SELECT grant_type INTO v_user_override
  FROM user_permissions
  WHERE user_id = _user_id
    AND company_id = _company_id
    AND permission_id = v_permission_id
    AND (expires_at IS NULL OR expires_at > NOW());

  -- Explicit revoke
  IF v_user_override = 'revoke' THEN
    RETURN FALSE;
  END IF;

  -- Explicit grant
  IF v_user_override = 'grant' THEN
    RETURN TRUE;
  END IF;

  -- 4. Check custom_role permissions (if assigned)
  IF v_user_company.custom_role_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM custom_role_permissions crp
      WHERE crp.custom_role_id = v_user_company.custom_role_id
        AND crp.permission_id = v_permission_id
    ) INTO v_has_permission;

    IF v_has_permission THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- 5. Check base role permissions
  SELECT EXISTS(
    SELECT 1 FROM role_permissions rp
    WHERE rp.role = v_user_company.role
      AND rp.permission_id = v_permission_id
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$;

-- ================================================
-- Function: rbac.get_user_permissions
-- ================================================
-- Get all permissions for a user in a company
-- Returns: JSONB with role and list of permissions
-- ================================================

CREATE OR REPLACE FUNCTION rbac.get_user_permissions(
  _user_id TEXT,
  _company_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_user_company RECORD;
BEGIN
  -- Get user's role and custom_role
  SELECT role, custom_role_id INTO v_user_company
  FROM user_companies
  WHERE user_id = _user_id AND company_id = _company_id;

  IF v_user_company.role IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'User not found in company',
      'permissions', '[]'::JSONB
    );
  END IF;

  -- Collect all permissions
  WITH all_permissions AS (
    -- Permissions from base role
    SELECT DISTINCT
      p.name,
      p.description,
      p.module,
      p.action,
      p.risk_level,
      'role' AS source
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role = v_user_company.role AND p.is_active = TRUE

    UNION

    -- Permissions from custom_role
    SELECT DISTINCT
      p.name,
      p.description,
      p.module,
      p.action,
      p.risk_level,
      'custom_role' AS source
    FROM custom_role_permissions crp
    JOIN permissions p ON p.id = crp.permission_id
    WHERE crp.custom_role_id = v_user_company.custom_role_id AND p.is_active = TRUE

    UNION

    -- Explicitly granted permissions
    SELECT DISTINCT
      p.name,
      p.description,
      p.module,
      p.action,
      p.risk_level,
      'grant' AS source
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = _user_id
      AND up.company_id = _company_id
      AND up.grant_type = 'grant'
      AND (up.expires_at IS NULL OR up.expires_at > NOW())
      AND p.is_active = TRUE
  ),
  revoked_permissions AS (
    -- Explicitly revoked permissions
    SELECT p.name
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = _user_id
      AND up.company_id = _company_id
      AND up.grant_type = 'revoke'
      AND (up.expires_at IS NULL OR up.expires_at > NOW())
  )
  SELECT jsonb_build_object(
    'user_id', _user_id,
    'company_id', _company_id,
    'role', v_user_company.role,
    'custom_role_id', v_user_company.custom_role_id,
    'permissions', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'name', ap.name,
          'description', ap.description,
          'module', ap.module,
          'action', ap.action,
          'risk_level', ap.risk_level,
          'source', ap.source
        )
        ORDER BY ap.module, ap.action
      ) FILTER (WHERE ap.name IS NOT NULL),
      '[]'::JSONB
    )
  ) INTO v_result
  FROM all_permissions ap
  WHERE ap.name NOT IN (SELECT name FROM revoked_permissions);

  RETURN v_result;
END;
$$;

-- ================================================
-- Function: rbac.grant_permission
-- ================================================
-- Grant a specific permission to a user
-- Only users with 'company.change_roles' permission can grant permissions
-- ================================================

CREATE OR REPLACE FUNCTION rbac.grant_permission(
  _granted_by TEXT,
  _user_id TEXT,
  _company_id UUID,
  _permission_name TEXT,
  _reason TEXT DEFAULT NULL,
  _expires_at TIMESTAMP DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_permission_id UUID;
  v_permission_record RECORD;
BEGIN
  -- 1. Check if _granted_by has permission to change roles
  IF NOT rbac.has_permission(_granted_by, _company_id, 'company.change_roles') THEN
    RAISE EXCEPTION 'Permission denied: You do not have permission to grant permissions';
  END IF;

  -- 2. Check if target user is member of company
  IF NOT EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_id = _user_id AND company_id = _company_id
  ) THEN
    RAISE EXCEPTION 'User % is not a member of company %', _user_id, _company_id;
  END IF;

  -- 3. Get permission ID and details
  SELECT id, name, description, risk_level
  INTO v_permission_record
  FROM permissions
  WHERE name = _permission_name AND is_active = TRUE;

  IF v_permission_record.id IS NULL THEN
    RAISE EXCEPTION 'Permission not found: %', _permission_name;
  END IF;

  v_permission_id := v_permission_record.id;

  -- 4. Insert or update user_permissions
  INSERT INTO user_permissions (
    user_id, company_id, permission_id, grant_type, granted_by, reason, expires_at
  )
  VALUES (
    _user_id, _company_id, v_permission_id, 'grant', _granted_by, _reason, _expires_at
  )
  ON CONFLICT (user_id, company_id, permission_id)
  DO UPDATE SET
    grant_type = 'grant',
    granted_by = _granted_by,
    reason = _reason,
    expires_at = _expires_at,
    created_at = NOW();

  -- 5. Audit log is handled by trigger (rbac.audit_user_permissions)

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', format('Permission %s granted to user %s', _permission_name, _user_id),
    'permission', jsonb_build_object(
      'name', v_permission_record.name,
      'description', v_permission_record.description,
      'risk_level', v_permission_record.risk_level
    ),
    'expires_at', _expires_at
  );
END;
$$;

-- ================================================
-- Function: rbac.revoke_permission
-- ================================================
-- Revoke a specific permission from a user
-- Only users with 'company.change_roles' permission can revoke permissions
-- ================================================

CREATE OR REPLACE FUNCTION rbac.revoke_permission(
  _revoked_by TEXT,
  _user_id TEXT,
  _company_id UUID,
  _permission_name TEXT,
  _reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_permission_id UUID;
  v_permission_record RECORD;
BEGIN
  -- 1. Check if _revoked_by has permission to change roles
  IF NOT rbac.has_permission(_revoked_by, _company_id, 'company.change_roles') THEN
    RAISE EXCEPTION 'Permission denied: You do not have permission to revoke permissions';
  END IF;

  -- 2. Get permission ID and details
  SELECT id, name, description, risk_level
  INTO v_permission_record
  FROM permissions
  WHERE name = _permission_name AND is_active = TRUE;

  IF v_permission_record.id IS NULL THEN
    RAISE EXCEPTION 'Permission not found: %', _permission_name;
  END IF;

  v_permission_id := v_permission_record.id;

  -- 3. Insert or update user_permissions
  INSERT INTO user_permissions (
    user_id, company_id, permission_id, grant_type, granted_by, reason
  )
  VALUES (
    _user_id, _company_id, v_permission_id, 'revoke', _revoked_by, _reason
  )
  ON CONFLICT (user_id, company_id, permission_id)
  DO UPDATE SET
    grant_type = 'revoke',
    granted_by = _revoked_by,
    reason = _reason,
    expires_at = NULL,
    created_at = NOW();

  -- 4. Audit log is handled by trigger (rbac.audit_user_permissions)

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', format('Permission %s revoked from user %s', _permission_name, _user_id),
    'permission', jsonb_build_object(
      'name', v_permission_record.name,
      'description', v_permission_record.description,
      'risk_level', v_permission_record.risk_level
    )
  );
END;
$$;

-- ================================================
-- Function: rbac.remove_permission_override
-- ================================================
-- Remove a permission override (grant or revoke) for a user
-- Returns user to their default role permissions
-- ================================================

CREATE OR REPLACE FUNCTION rbac.remove_permission_override(
  _removed_by TEXT,
  _user_id TEXT,
  _company_id UUID,
  _permission_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_permission_id UUID;
BEGIN
  -- 1. Check if _removed_by has permission to change roles
  IF NOT rbac.has_permission(_removed_by, _company_id, 'company.change_roles') THEN
    RAISE EXCEPTION 'Permission denied: You do not have permission to manage permissions';
  END IF;

  -- 2. Get permission ID
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE name = _permission_name AND is_active = TRUE;

  IF v_permission_id IS NULL THEN
    RAISE EXCEPTION 'Permission not found: %', _permission_name;
  END IF;

  -- 3. Delete the override
  DELETE FROM user_permissions
  WHERE user_id = _user_id
    AND company_id = _company_id
    AND permission_id = v_permission_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', format('Permission override removed for %s', _permission_name)
  );
END;
$$;

-- ================================================
-- Function: rbac.set_user_context
-- ================================================
-- Set user and company context for RLS policies
-- MUST be called at the beginning of every SQL function that modifies data
-- ================================================

CREATE OR REPLACE FUNCTION rbac.set_user_context(
  _user_id TEXT,
  _company_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM set_config('app.current_user_id', _user_id, FALSE);
  PERFORM set_config('app.current_company_id', _company_id::TEXT, FALSE);
END;
$$;

-- ================================================
-- Function: rbac.get_user_context
-- ================================================
-- Get current user and company context
-- Useful for debugging and logging
-- ================================================

CREATE OR REPLACE FUNCTION rbac.get_user_context()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN jsonb_build_object(
    'user_id', NULLIF(current_setting('app.current_user_id', TRUE), ''),
    'company_id', NULLIF(current_setting('app.current_company_id', TRUE), ''),
    'is_superuser', COALESCE(current_setting('app.is_superuser', TRUE), 'false')
  );
END;
$$;

-- ================================================
-- Function: rbac.list_permissions
-- ================================================
-- List all available permissions, optionally filtered by module
-- ================================================

CREATE OR REPLACE FUNCTION rbac.list_permissions(
  _module TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'permissions', jsonb_agg(
      jsonb_build_object(
        'id', p._id,
        'name', p.name,
        'description', p.description,
        'module', p.module,
        'action', p.action,
        'risk_level', p.risk_level,
        'min_role_level', p.min_role_level
      )
      ORDER BY p.module, p.action
    )
  ) INTO v_result
  FROM permissions p
  WHERE p.is_active = TRUE
    AND (_module IS NULL OR p.module = _module);

  RETURN v_result;
END;
$$;

-- ================================================
-- Function: rbac.get_role_permissions
-- ================================================
-- Get all permissions for a specific base role
-- ================================================

CREATE OR REPLACE FUNCTION rbac.get_role_permissions(
  _role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF _role NOT IN ('owner', 'admin', 'member', 'guest') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be one of: owner, admin, member, guest', _role;
  END IF;

  SELECT jsonb_build_object(
    'role', _role,
    'permissions', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'name', p.name,
          'description', p.description,
          'module', p.module,
          'action', p.action,
          'risk_level', p.risk_level,
          'can_delegate', rp.can_delegate
        )
        ORDER BY p.module, p.action
      ),
      '[]'::JSONB
    )
  ) INTO v_result
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE rp.role = _role AND p.is_active = TRUE;

  RETURN v_result;
END;
$$;

-- ================================================
-- Function: rbac.check_multiple_permissions
-- ================================================
-- Check if user has ALL of the specified permissions
-- Useful for operations requiring multiple permissions
-- ================================================

CREATE OR REPLACE FUNCTION rbac.check_multiple_permissions(
  _user_id TEXT,
  _company_id UUID,
  _permission_names TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_permission TEXT;
BEGIN
  FOREACH v_permission IN ARRAY _permission_names
  LOOP
    IF NOT rbac.has_permission(_user_id, _company_id, v_permission) THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$;

-- ================================================
-- Function: rbac.check_any_permission
-- ================================================
-- Check if user has ANY of the specified permissions
-- Useful for "at least one permission required" scenarios
-- ================================================

CREATE OR REPLACE FUNCTION rbac.check_any_permission(
  _user_id TEXT,
  _company_id UUID,
  _permission_names TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_permission TEXT;
BEGIN
  FOREACH v_permission IN ARRAY _permission_names
  LOOP
    IF rbac.has_permission(_user_id, _company_id, v_permission) THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$;

-- ================================================
-- Function: rbac.get_permission_overrides
-- ================================================
-- Get all permission overrides (grants/revokes) for a user
-- ================================================

CREATE OR REPLACE FUNCTION rbac.get_permission_overrides(
  _user_id TEXT,
  _company_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_id', _user_id,
    'company_id', _company_id,
    'overrides', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'permission_name', p.name,
          'permission_description', p.description,
          'grant_type', up.grant_type,
          'granted_by', up.granted_by,
          'reason', up.reason,
          'expires_at', up.expires_at,
          'created_at', up.created_at
        )
        ORDER BY up.created_at DESC
      ),
      '[]'::JSONB
    )
  ) INTO v_result
  FROM user_permissions up
  JOIN permissions p ON p.id = up.permission_id
  WHERE up.user_id = _user_id
    AND up.company_id = _company_id
    AND (up.expires_at IS NULL OR up.expires_at > NOW());

  RETURN v_result;
END;
$$;

-- ================================================
-- Function: rbac.cleanup_expired_permissions
-- ================================================
-- Remove expired temporary permissions
-- Should be run periodically (e.g., daily cron job)
-- ================================================

CREATE OR REPLACE FUNCTION rbac.cleanup_expired_permissions()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM user_permissions
    WHERE expires_at IS NOT NULL AND expires_at < NOW()
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  RETURN jsonb_build_object(
    'success', TRUE,
    'deleted_count', v_deleted_count,
    'message', format('Cleaned up %s expired permission(s)', v_deleted_count)
  );
END;
$$;

-- ================================================
-- Comments for Documentation
-- ================================================

COMMENT ON FUNCTION rbac.has_permission IS 'Main permission checking function. Returns TRUE if user has the specified permission in the company';
COMMENT ON FUNCTION rbac.get_user_permissions IS 'Get all permissions for a user in a company, including source (role, custom_role, grant)';
COMMENT ON FUNCTION rbac.grant_permission IS 'Grant a specific permission to a user. Only callable by users with company.change_roles permission';
COMMENT ON FUNCTION rbac.revoke_permission IS 'Revoke a specific permission from a user. Only callable by users with company.change_roles permission';
COMMENT ON FUNCTION rbac.set_user_context IS 'Set user and company context for RLS policies. MUST be called at the beginning of every data-modifying function';
COMMENT ON FUNCTION rbac.get_user_context IS 'Get current user and company context from PostgreSQL session variables';
COMMENT ON FUNCTION rbac.list_permissions IS 'List all available permissions in the system, optionally filtered by module';
COMMENT ON FUNCTION rbac.get_role_permissions IS 'Get all default permissions for a base role (owner, admin, member, guest)';
COMMENT ON FUNCTION rbac.check_multiple_permissions IS 'Check if user has ALL of the specified permissions';
COMMENT ON FUNCTION rbac.check_any_permission IS 'Check if user has ANY of the specified permissions';
COMMENT ON FUNCTION rbac.cleanup_expired_permissions IS 'Remove expired temporary permissions. Run periodically via cron job';

-- ================================================
-- End of RBAC Functions
-- ================================================
