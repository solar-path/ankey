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
 * @param _company_id UUID - Company ID
 * Returns: JSONB array of users with their roles
 */
CREATE OR REPLACE FUNCTION users.get_by_company(_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validation
  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Company ID is required';
  END IF;

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
      'created_at', EXTRACT(EPOCH FROM u.created_at)::BIGINT * 1000,
      'two_factor_enabled', u.two_factor_enabled
    ) AS user_data,
    u.created_at AS created_at_ts
    FROM users u
    INNER JOIN user_companies uc ON uc.user_id = u._id
    WHERE uc.company_id = _company_id
  ) subquery;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

/**
 * Get user statistics for a company
 * Returns counts of total, verified, unverified users, etc.
 *
 * @param _company_id UUID - Company ID (optional, NULL for system-wide stats)
 * Returns: JSONB object with statistics
 */
CREATE OR REPLACE FUNCTION users.get_stats(_company_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total INTEGER;
  v_verified INTEGER;
  v_unverified INTEGER;
  v_recent_30d INTEGER;
  v_with_2fa INTEGER;
BEGIN
  IF _company_id IS NULL THEN
    -- System-wide statistics
    SELECT COUNT(*) INTO v_total FROM users;
    SELECT COUNT(*) INTO v_verified FROM users WHERE verified = TRUE;
    SELECT COUNT(*) INTO v_unverified FROM users WHERE verified = FALSE;
    SELECT COUNT(*) INTO v_recent_30d FROM users WHERE created_at >= NOW() - INTERVAL '30 days';
    SELECT COUNT(*) INTO v_with_2fa FROM users WHERE two_factor_enabled = TRUE;
  ELSE
    -- Company-specific statistics
    SELECT COUNT(DISTINCT u.id) INTO v_total
    FROM users u
    INNER JOIN user_companies uc ON uc.user_id = u._id
    WHERE uc.company_id = _company_id;

    SELECT COUNT(DISTINCT u.id) INTO v_verified
    FROM users u
    INNER JOIN user_companies uc ON uc.user_id = u._id
    WHERE uc.company_id = _company_id AND u.verified = TRUE;

    SELECT COUNT(DISTINCT u.id) INTO v_unverified
    FROM users u
    INNER JOIN user_companies uc ON uc.user_id = u._id
    WHERE uc.company_id = _company_id AND u.verified = FALSE;

    SELECT COUNT(DISTINCT u.id) INTO v_recent_30d
    FROM users u
    INNER JOIN user_companies uc ON uc.user_id = u._id
    WHERE uc.company_id = _company_id AND u.created_at >= NOW() - INTERVAL '30 days';

    SELECT COUNT(DISTINCT u.id) INTO v_with_2fa
    FROM users u
    INNER JOIN user_companies uc ON uc.user_id = u._id
    WHERE uc.company_id = _company_id AND u.two_factor_enabled = TRUE;
  END IF;

  RETURN jsonb_build_object(
    'total', COALESCE(v_total, 0),
    'verified', COALESCE(v_verified, 0),
    'unverified', COALESCE(v_unverified, 0),
    'recent_30d', COALESCE(v_recent_30d, 0),
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
    'created_at', EXTRACT(EPOCH FROM u.created_at)::BIGINT * 1000,
    'two_factor_enabled', u.two_factor_enabled
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
      'created_at', EXTRACT(EPOCH FROM u.created_at)::BIGINT * 1000,
      'two_factor_enabled', u.two_factor_enabled
    ) AS user_data,
    u.created_at AS created_at_ts
    FROM users u
  ) subquery;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION users.get_by_company IS 'Get all users for a specific company with their roles';
COMMENT ON FUNCTION users.get_stats IS 'Get user statistics (total, verified, recent, etc.)';
COMMENT ON FUNCTION users.get_by_id IS 'Get user by ID';
COMMENT ON FUNCTION users.get_all IS 'Get all users (system-wide, admin only)';
