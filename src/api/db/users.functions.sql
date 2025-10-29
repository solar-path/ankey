-- ============================================
-- USERS MODULE - Business Logic Functions
-- ============================================
-- PostgreSQL functions for user management
-- Note: Most user functions are in auth.functions.sql
-- This file contains additional helper functions

-- ============================================
-- CREATE SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS users;

-- ============================================
-- USER RETRIEVAL FUNCTIONS
-- ============================================

/**
 * Get users by company
 * Returns all users (with roles) for a given company
 *
 * @param _company_id TEXT - Company ID (can be full _id like 'company_123_uuid' or just UUID)
 * Returns: JSONB array of users with their roles
 */
CREATE OR REPLACE FUNCTION users.get_by_company(_company_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_uuid UUID;
BEGIN
  -- Validation
  IF _company_id IS NULL OR _company_id = '' THEN
    RAISE EXCEPTION 'Company ID is required';
  END IF;

  -- Extract UUID from _id if needed (e.g., 'company_1234_uuid' -> 'uuid')
  -- If it's already a UUID, it will work as is
  BEGIN
    -- Try to extract the last part after the last underscore
    IF _company_id LIKE 'company_%' THEN
      v_uuid := SPLIT_PART(_company_id, '_', 3)::UUID;
    ELSE
      v_uuid := _company_id::UUID;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid company ID format: %', _company_id;
  END;

  -- Get users with their roles in the company
  SELECT jsonb_agg(user_data ORDER BY created_at_ts DESC)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      '_id', u._id,
      'id', u.id,
      'email', u.email,
      'fullname', u.fullname,
      'verified', u.verified,
      'profile', COALESCE(u.profile, '{}'::JSONB),
      'role', uc.role,
      'createdAt', EXTRACT(EPOCH FROM u.created_at)::BIGINT * 1000,
      'updatedAt', EXTRACT(EPOCH FROM u.updated_at)::BIGINT * 1000,
      'twoFactorEnabled', u.two_factor_enabled
    ) AS user_data,
    u.created_at AS created_at_ts
    FROM users u
    INNER JOIN user_companies uc ON uc.user_id = u._id
    WHERE uc.company_id = v_uuid
  ) subquery;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

/**
 * Get user statistics for a company
 * Returns counts of total, verified, unverified users, etc.
 *
 * @param _company_id TEXT - Company ID (can be full _id like 'company_123_uuid' or just UUID, optional for system-wide stats)
 * Returns: JSONB object with statistics
 */
CREATE OR REPLACE FUNCTION users.get_stats(_company_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total INTEGER;
  v_verified INTEGER;
  v_unverified INTEGER;
  v_recent_30d INTEGER;
  v_with_2fa INTEGER;
  v_uuid UUID;
BEGIN
  IF _company_id IS NULL OR _company_id = '' THEN
    -- System-wide statistics
    SELECT COUNT(*) INTO v_total FROM users;
    SELECT COUNT(*) INTO v_verified FROM users WHERE verified = TRUE;
    SELECT COUNT(*) INTO v_unverified FROM users WHERE verified = FALSE;
    SELECT COUNT(*) INTO v_recent_30d FROM users WHERE created_at >= NOW() - INTERVAL '30 days';
    SELECT COUNT(*) INTO v_with_2fa FROM users WHERE two_factor_enabled = TRUE;
  ELSE
    -- Extract UUID from _id if needed
    BEGIN
      IF _company_id LIKE 'company_%' THEN
        v_uuid := SPLIT_PART(_company_id, '_', 3)::UUID;
      ELSE
        v_uuid := _company_id::UUID;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Invalid company ID format: %', _company_id;
    END;

    -- Company-specific statistics
    SELECT COUNT(DISTINCT u.id) INTO v_total
    FROM users u
    INNER JOIN user_companies uc ON uc.user_id = u._id
    WHERE uc.company_id = v_uuid;

    SELECT COUNT(DISTINCT u.id) INTO v_verified
    FROM users u
    INNER JOIN user_companies uc ON uc.user_id = u._id
    WHERE uc.company_id = v_uuid AND u.verified = TRUE;

    SELECT COUNT(DISTINCT u.id) INTO v_unverified
    FROM users u
    INNER JOIN user_companies uc ON uc.user_id = u._id
    WHERE uc.company_id = v_uuid AND u.verified = FALSE;

    SELECT COUNT(DISTINCT u.id) INTO v_recent_30d
    FROM users u
    INNER JOIN user_companies uc ON uc.user_id = u._id
    WHERE uc.company_id = v_uuid AND u.created_at >= NOW() - INTERVAL '30 days';

    SELECT COUNT(DISTINCT u.id) INTO v_with_2fa
    FROM users u
    INNER JOIN user_companies uc ON uc.user_id = u._id
    WHERE uc.company_id = v_uuid AND u.two_factor_enabled = TRUE;
  END IF;

  RETURN jsonb_build_object(
    'total', COALESCE(v_total, 0),
    'verified', COALESCE(v_verified, 0),
    'unverified', COALESCE(v_unverified, 0),
    'recent', COALESCE(v_recent_30d, 0),
    'with_2fa', COALESCE(v_with_2fa, 0)
  );
END;
$$;

/**
 * Get user by ID
 * Returns user details
 *
 * @param _user_id TEXT - User ID
 * Returns: JSONB object with user data
 */
CREATE OR REPLACE FUNCTION users.get_by_id(_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validation
  IF _user_id IS NULL OR _user_id = '' THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  SELECT jsonb_build_object(
    '_id', u._id,
    'id', u.id,
    'email', u.email,
    'fullname', u.fullname,
    'verified', u.verified,
    'profile', COALESCE(u.profile, '{}'::JSONB),
    'createdAt', EXTRACT(EPOCH FROM u.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM u.updated_at)::BIGINT * 1000,
    'twoFactorEnabled', u.two_factor_enabled
  )
  INTO v_result
  FROM users u
  WHERE u._id = _user_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'User not found: %', _user_id;
  END IF;

  RETURN v_result;
END;
$$;

/**
 * Get all users (system-wide - for admin)
 * Returns: JSONB array of all users
 */
CREATE OR REPLACE FUNCTION users.get_all()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(user_data ORDER BY created_at_ts DESC)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      '_id', u._id,
      'id', u.id,
      'email', u.email,
      'fullname', u.fullname,
      'verified', u.verified,
      'profile', COALESCE(u.profile, '{}'::JSONB),
      'createdAt', EXTRACT(EPOCH FROM u.created_at)::BIGINT * 1000,
      'updatedAt', EXTRACT(EPOCH FROM u.updated_at)::BIGINT * 1000,
      'twoFactorEnabled', u.two_factor_enabled
    ) AS user_data,
    u.created_at AS created_at_ts
    FROM users u
  ) subquery;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- ============================================
-- USER MANAGEMENT FUNCTIONS
-- ============================================

/**
 * Toggle block/unblock user
 * Marks a user as blocked or unblocked
 *
 * @param _user_id TEXT - User ID
 * @param _block BOOLEAN - True to block, false to unblock
 * Returns: JSONB object with success message
 */
CREATE OR REPLACE FUNCTION users.toggle_block(_user_id TEXT, _block BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Validation
  IF _user_id IS NULL OR _user_id = '' THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  -- Check if user exists
  SELECT * INTO v_user FROM users WHERE _id = _user_id;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not found: %', _user_id;
  END IF;

  -- Update user blocked status (we'll use verified field inverted)
  -- Note: If you have a separate 'blocked' field, use that instead
  UPDATE users
  SET verified = NOT _block
  WHERE _id = _user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE WHEN _block THEN 'User blocked successfully' ELSE 'User unblocked successfully' END,
    'userId', _user_id,
    'blocked', _block
  );
END;
$$;

/**
 * Delete user (soft delete - removes from all companies)
 * This is a soft delete that removes user from all companies
 * For hard delete, use audit.soft_delete pattern
 *
 * @param _user_id TEXT - User ID
 * Returns: JSONB object with success message
 */
CREATE OR REPLACE FUNCTION users.delete(_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
  v_deleted_count INTEGER;
BEGIN
  -- Validation
  IF _user_id IS NULL OR _user_id = '' THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  -- Check if user exists
  SELECT * INTO v_user FROM users WHERE _id = _user_id;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not found: %', _user_id;
  END IF;

  -- Remove user from all companies (soft delete)
  DELETE FROM user_companies WHERE user_id = _user_id;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Optionally: Mark user as deleted or inactive
  UPDATE users
  SET verified = false
  WHERE _id = _user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User deleted successfully',
    'userId', _user_id,
    'companiesRemoved', v_deleted_count
  );
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION users.get_by_company IS 'Get all users for a specific company with their roles';
COMMENT ON FUNCTION users.get_stats IS 'Get user statistics (total, verified, recent, etc.)';
COMMENT ON FUNCTION users.get_by_id IS 'Get user by ID';
COMMENT ON FUNCTION users.get_all IS 'Get all users (system-wide, admin only)';
COMMENT ON FUNCTION users.toggle_block IS 'Block or unblock a user';
COMMENT ON FUNCTION users.delete IS 'Delete user (removes from all companies)';
