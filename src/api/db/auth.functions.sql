-- ============================================
-- AUTHENTICATION MODULE - PostgreSQL Functions
-- ============================================
-- All business logic for authentication is in PostgreSQL
-- Hono API serves as a thin gateway layer

-- ============================================
-- CREATE SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS auth;

-- ============================================
-- 1. SIGN UP
-- ============================================
CREATE OR REPLACE FUNCTION auth.signup(
  _email TEXT,
  _password TEXT,
  _fullname TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id TEXT;
  v_verification_code TEXT;
  v_hashed_password TEXT;
  v_existing_count INT;
BEGIN
  -- Check if user already exists
  SELECT COUNT(*) INTO v_existing_count
  FROM users
  WHERE email = _email AND type = 'user';

  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- Generate verification code
  v_verification_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  -- Hash password (in production, use pgcrypto extension)
  v_hashed_password := encode(digest(_password, 'sha256'), 'hex');

  -- Create user ID
  v_user_id := 'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || gen_random_uuid()::TEXT;

  -- Insert user
  INSERT INTO users (
    _id, type, email, password, fullname, verified,
    verification_code, created_at, updated_at
  ) VALUES (
    v_user_id, 'user', _email, v_hashed_password, _fullname, FALSE,
    v_verification_code, EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT
  );

  RETURN jsonb_build_object(
    'message', 'User created successfully. Please check your email for verification code.',
    'userId', v_user_id,
    'verificationCode', v_verification_code -- Remove in production, send via email
  );
END;
$$;

-- ============================================
-- 2. VERIFY ACCOUNT
-- ============================================
CREATE OR REPLACE FUNCTION auth.verify_account(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_count INT;
BEGIN
  -- Find and verify user
  UPDATE users
  SET verified = TRUE,
      verification_code = NULL,
      updated_at = NOW()
  WHERE verification_code = _code AND type = 'user';

  GET DIAGNOSTICS v_user_count = ROW_COUNT;

  IF v_user_count = 0 THEN
    RAISE EXCEPTION 'Invalid verification code';
  END IF;

  RETURN jsonb_build_object('message', 'Account verified successfully');
END;
$$;

-- ============================================
-- 3. SIGN IN
-- ============================================
CREATE OR REPLACE FUNCTION auth.signin(
  _email TEXT,
  _password TEXT,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
  v_hashed_password TEXT;
  v_session_id TEXT;
  v_token TEXT;
  v_expires_at BIGINT;
  v_audit_session_id UUID;
  v_ip INET;
BEGIN
  -- Hash provided password
  v_hashed_password := encode(digest(_password, 'sha256'), 'hex');

  -- Find user
  SELECT * INTO v_user
  FROM users
  WHERE email = _email AND type = 'user' AND password = v_hashed_password;

  -- Log failed login attempt
  IF v_user._id IS NULL THEN
    -- Convert IP to INET type
    BEGIN
      v_ip := _ip_address::INET;
    EXCEPTION WHEN OTHERS THEN
      v_ip := NULL;
    END;

    -- Log failed login
    PERFORM audit.log_action(
      NULL,  -- No user_id for failed login
      'LOGIN_FAILED',
      'users',
      _email,  -- Use email as record_id
      NULL,
      NULL,
      jsonb_build_object('email', _email, 'reason', 'invalid_credentials'),
      v_ip,
      _user_agent,
      NULL,
      'Failed login attempt for: ' || _email
    );

    RAISE EXCEPTION 'Invalid email or password';
  END IF;

  -- Check if verified
  IF v_user.verified = FALSE THEN
    RAISE EXCEPTION 'Please verify your account first';
  END IF;

  -- Check if 2FA is enabled
  IF v_user.two_factor_enabled = TRUE THEN
    RETURN jsonb_build_object(
      'requires2FA', TRUE,
      'user', jsonb_build_object(
        'email', v_user.email,
        'fullname', v_user.fullname
      )
    );
  END IF;

  -- Create session
  v_session_id := 'session_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || gen_random_uuid()::TEXT;
  v_token := gen_random_uuid()::TEXT || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  v_expires_at := EXTRACT(EPOCH FROM NOW())::BIGINT + (7 * 24 * 60 * 60 * 1000); -- 7 days

  INSERT INTO sessions (_id, type, user_id, token, expires_at, created_at)
  VALUES (v_session_id, 'session', v_user._id, v_token, v_expires_at, EXTRACT(EPOCH FROM NOW())::BIGINT);

  -- Convert IP to INET type
  BEGIN
    v_ip := _ip_address::INET;
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;

  -- Track session start with audit logging
  SELECT audit.track_session_start(
    v_user._id,
    v_user.email,
    v_token,
    v_ip,
    _user_agent,
    'password'
  ) INTO v_audit_session_id;

  -- Set user context for subsequent operations in this transaction
  PERFORM audit.set_user_context(v_user._id);

  RETURN jsonb_build_object(
    'requires2FA', FALSE,
    'user', jsonb_build_object(
      '_id', v_user._id,
      'email', v_user.email,
      'fullname', v_user.fullname,
      'verified', v_user.verified,
      'profile', COALESCE(v_user.profile, '{}'::JSONB),
      'created_at', v_user.created_at
    ),
    'session', jsonb_build_object(
      'token', v_token,
      'expiresAt', v_expires_at
    )
  );
END;
$$;

-- ============================================
-- 4. VERIFY SESSION
-- ============================================
CREATE OR REPLACE FUNCTION auth.verify_session(_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session RECORD;
  v_user RECORD;
BEGIN
  -- Find session
  SELECT * INTO v_session
  FROM sessions
  WHERE token = _token AND type = 'session';

  IF v_session._id IS NULL THEN
    RAISE EXCEPTION 'Invalid session';
  END IF;

  -- Check expiration
  IF v_session.expires_at < EXTRACT(EPOCH FROM NOW())::BIGINT THEN
    DELETE FROM sessions WHERE _id = v_session._id;
    RAISE EXCEPTION 'Session expired';
  END IF;

  -- Get user
  SELECT * INTO v_user
  FROM users
  WHERE _id = v_session.user_id;

  RETURN jsonb_build_object(
    'user', jsonb_build_object(
      '_id', v_user._id,
      'email', v_user.email,
      'fullname', v_user.fullname,
      'verified', v_user.verified,
      'profile', COALESCE(v_user.profile, '{}'::JSONB),
      'created_at', v_user.created_at
    ),
    'session', jsonb_build_object(
      'token', v_session.token,
      'expiresAt', v_session.expires_at
    )
  );
END;
$$;

-- ============================================
-- 5. SIGN OUT
-- ============================================
CREATE OR REPLACE FUNCTION auth.signout(_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Track session end with audit logging
  BEGIN
    v_result := audit.track_session_end(_token, 'manual');
  EXCEPTION WHEN OTHERS THEN
    -- If audit tracking fails, still allow logout
    v_result := jsonb_build_object('success', TRUE);
  END;

  -- Delete from sessions table
  DELETE FROM sessions WHERE token = _token AND type = 'session';

  RETURN jsonb_build_object('message', 'Signed out successfully', 'audit', v_result);
END;
$$;

-- ============================================
-- 6. VERIFY 2FA
-- ============================================
CREATE OR REPLACE FUNCTION auth.verify_2fa(_email TEXT, _token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
  v_session_id TEXT;
  v_session_token TEXT;
  v_expires_at BIGINT;
BEGIN
  -- Find user
  SELECT * INTO v_user
  FROM users
  WHERE email = _email AND type = 'user';

  IF v_user._id IS NULL THEN
    RAISE EXCEPTION 'Invalid credentials';
  END IF;

  -- Validate token (in production, use proper TOTP validation)
  IF LENGTH(_token) != 6 THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  -- Create session
  v_session_id := 'session_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || gen_random_uuid()::TEXT;
  v_session_token := gen_random_uuid()::TEXT || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  v_expires_at := EXTRACT(EPOCH FROM NOW())::BIGINT + (7 * 24 * 60 * 60 * 1000);

  INSERT INTO sessions (_id, type, user_id, token, expires_at, created_at)
  VALUES (v_session_id, 'session', v_user._id, v_session_token, v_expires_at, EXTRACT(EPOCH FROM NOW())::BIGINT);

  RETURN jsonb_build_object(
    'user', jsonb_build_object(
      '_id', v_user._id,
      'email', v_user.email,
      'fullname', v_user.fullname,
      'verified', v_user.verified,
      'profile', COALESCE(v_user.profile, '{}'::JSONB),
      'created_at', v_user.created_at
    ),
    'session', jsonb_build_object(
      'token', v_session_token,
      'expiresAt', v_expires_at
    )
  );
END;
$$;

-- ============================================
-- 7. FORGOT PASSWORD
-- ============================================
CREATE OR REPLACE FUNCTION auth.forgot_password(_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reset_token TEXT;
  v_reset_token_expiry BIGINT;
BEGIN
  v_reset_token := gen_random_uuid()::TEXT || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  v_reset_token_expiry := EXTRACT(EPOCH FROM NOW())::BIGINT + (60 * 60 * 1000); -- 1 hour

  UPDATE users
  SET reset_token = v_reset_token,
      reset_token_expiry = v_reset_token_expiry,
      updated_at = NOW()
  WHERE email = _email AND type = 'user';

  -- Don't reveal if user exists
  RETURN jsonb_build_object(
    'message', 'If an account exists, a reset link will be sent',
    'resetToken', v_reset_token -- Remove in production, send via email
  );
END;
$$;

-- ============================================
-- 8. UPDATE PROFILE
-- ============================================
CREATE OR REPLACE FUNCTION auth.update_profile(
  _user_id TEXT,
  _fullname TEXT DEFAULT NULL,
  _dob TEXT DEFAULT NULL,
  _gender TEXT DEFAULT NULL,
  _avatar TEXT DEFAULT NULL,
  _phone TEXT DEFAULT NULL,
  _address TEXT DEFAULT NULL,
  _city TEXT DEFAULT NULL,
  _state TEXT DEFAULT NULL,
  _zip_code TEXT DEFAULT NULL,
  _country TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
  v_old_user RECORD;
  v_profile JSONB;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- Get current user (for old values)
  SELECT * INTO v_old_user FROM users WHERE _id = _user_id;

  IF v_old_user._id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Build profile JSON
  v_profile := COALESCE(v_old_user.profile, '{}'::JSONB);

  IF _dob IS NOT NULL THEN
    v_profile := jsonb_set(v_profile, '{dob}', to_jsonb(_dob));
  END IF;

  IF _gender IS NOT NULL THEN
    v_profile := jsonb_set(v_profile, '{gender}', to_jsonb(_gender));
  END IF;

  IF _avatar IS NOT NULL THEN
    v_profile := jsonb_set(v_profile, '{avatar}', to_jsonb(_avatar));
  END IF;

  IF _phone IS NOT NULL THEN
    v_profile := jsonb_set(v_profile, '{phone}', to_jsonb(_phone));
  END IF;

  IF _address IS NOT NULL THEN
    v_profile := jsonb_set(v_profile, '{address}', to_jsonb(_address));
  END IF;

  IF _city IS NOT NULL THEN
    v_profile := jsonb_set(v_profile, '{city}', to_jsonb(_city));
  END IF;

  IF _state IS NOT NULL THEN
    v_profile := jsonb_set(v_profile, '{state}', to_jsonb(_state));
  END IF;

  IF _zip_code IS NOT NULL THEN
    v_profile := jsonb_set(v_profile, '{zipCode}', to_jsonb(_zip_code));
  END IF;

  IF _country IS NOT NULL THEN
    v_profile := jsonb_set(v_profile, '{country}', to_jsonb(_country));
  END IF;

  -- Update user
  UPDATE users
  SET fullname = COALESCE(_fullname, fullname),
      profile = v_profile,
      updated_at = NOW()
  WHERE _id = _user_id;

  -- Get updated user
  SELECT * INTO v_user FROM users WHERE _id = _user_id;

  -- Prepare audit log values
  v_old_values := jsonb_build_object(
    'fullname', v_old_user.fullname,
    'profile', v_old_user.profile
  );

  v_new_values := jsonb_build_object(
    'fullname', v_user.fullname,
    'profile', v_user.profile
  );

  -- Log profile update action
  PERFORM audit.log_action(
    _user_id,                    -- user who made the change
    'UPDATE',                    -- action type
    'users',                     -- table name
    _user_id,                    -- record id (self-update)
    NULL,                        -- company_id (users are global)
    v_old_values,                -- old values
    v_new_values,                -- new values
    NULL,                        -- ip_address (not available in this context)
    NULL,                        -- user_agent (not available in this context)
    NULL,                        -- request_id
    'User profile updated'       -- notes
  );

  RETURN jsonb_build_object(
    '_id', v_user._id,
    'email', v_user.email,
    'fullname', v_user.fullname,
    'verified', v_user.verified,
    'profile', v_user.profile,
    'createdAt', EXTRACT(EPOCH FROM v_user.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_user.updated_at)::BIGINT * 1000,
    'twoFactorEnabled', v_user.two_factor_enabled
  );
END;
$$;

-- ============================================
-- 9. CHANGE PASSWORD
-- ============================================
CREATE OR REPLACE FUNCTION auth.change_password(
  _user_id TEXT,
  _current_password TEXT,
  _new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
  v_current_hashed TEXT;
  v_new_hashed TEXT;
BEGIN
  -- Get user
  SELECT * INTO v_user FROM users WHERE _id = _user_id;

  IF v_user._id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify current password
  v_current_hashed := encode(digest(_current_password, 'sha256'), 'hex');

  IF v_user.password != v_current_hashed THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;

  -- Hash new password
  v_new_hashed := encode(digest(_new_password, 'sha256'), 'hex');

  -- Update password
  UPDATE users
  SET password = v_new_hashed,
      updated_at = NOW()
  WHERE _id = _user_id;

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

-- ============================================
-- 10. SETUP 2FA
-- ============================================
CREATE OR REPLACE FUNCTION auth.setup_2fa(_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
  v_secret TEXT;
BEGIN
  -- Get user
  SELECT * INTO v_user FROM users WHERE _id = _user_id;

  IF v_user._id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_user.two_factor_enabled = TRUE THEN
    RAISE EXCEPTION '2FA is already enabled';
  END IF;

  -- Generate secret (in production, use proper TOTP secret generation)
  v_secret := encode(gen_random_bytes(20), 'base32');

  -- Save secret
  UPDATE users
  SET two_factor_secret = v_secret,
      updated_at = NOW()
  WHERE _id = _user_id;

  RETURN jsonb_build_object('secret', v_secret);
END;
$$;

-- ============================================
-- 11. ENABLE 2FA
-- ============================================
CREATE OR REPLACE FUNCTION auth.enable_2fa(_user_id TEXT, _token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Get user
  SELECT * INTO v_user FROM users WHERE _id = _user_id;

  IF v_user._id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_user.two_factor_secret IS NULL THEN
    RAISE EXCEPTION '2FA setup not initiated. Please start setup first.';
  END IF;

  IF v_user.two_factor_enabled = TRUE THEN
    RAISE EXCEPTION '2FA is already enabled';
  END IF;

  -- Validate token (in production, use proper TOTP validation)
  IF LENGTH(_token) != 6 THEN
    RAISE EXCEPTION 'Invalid verification code';
  END IF;

  -- Enable 2FA
  UPDATE users
  SET two_factor_enabled = TRUE,
      updated_at = NOW()
  WHERE _id = _user_id;

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

-- ============================================
-- 12. DISABLE 2FA
-- ============================================
CREATE OR REPLACE FUNCTION auth.disable_2fa(_user_id TEXT, _token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Get user
  SELECT * INTO v_user FROM users WHERE _id = _user_id;

  IF v_user._id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_user.two_factor_enabled = FALSE THEN
    RAISE EXCEPTION '2FA is not enabled';
  END IF;

  -- Validate token (in production, use proper TOTP validation)
  IF LENGTH(_token) != 6 THEN
    RAISE EXCEPTION 'Invalid verification code';
  END IF;

  -- Disable 2FA
  UPDATE users
  SET two_factor_enabled = FALSE,
      two_factor_secret = NULL,
      updated_at = NOW()
  WHERE _id = _user_id;

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

-- ============================================
-- 13. GET 2FA STATUS
-- ============================================
CREATE OR REPLACE FUNCTION auth.get_2fa_status(_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Get user
  SELECT * INTO v_user FROM users WHERE _id = _user_id;

  IF v_user._id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN jsonb_build_object(
    'enabled', COALESCE(v_user.two_factor_enabled, FALSE),
    'required', FALSE,
    'deadline', NULL
  );
END;
$$;

-- ============================================
-- 14. INVITE USER
-- ============================================
CREATE OR REPLACE FUNCTION auth.invite_user(
  _email TEXT,
  _company_ids TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id TEXT;
  v_invitation_code TEXT;
  v_invitation_expiry BIGINT;
  v_existing_user RECORD;
  v_is_new_user BOOLEAN;
  v_temp_password TEXT;
  v_hashed_password TEXT;
  v_company_id TEXT;
BEGIN
  -- Check if user exists
  SELECT * INTO v_existing_user
  FROM users
  WHERE email = _email AND type = 'user';

  v_is_new_user := (v_existing_user._id IS NULL);

  -- Generate invitation code
  v_invitation_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  v_invitation_expiry := EXTRACT(EPOCH FROM NOW())::BIGINT + (24 * 60 * 60 * 1000);

  IF v_is_new_user THEN
    -- Create new user
    v_user_id := 'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || gen_random_uuid()::TEXT;
    v_temp_password := gen_random_uuid()::TEXT;
    v_hashed_password := encode(digest(v_temp_password, 'sha256'), 'hex');

    INSERT INTO users (
      _id, type, email, password, fullname, verified,
      invitation_token, invitation_expiry, created_at, updated_at
    ) VALUES (
      v_user_id, 'user', _email, v_hashed_password, SPLIT_PART(_email, '@', 1),
      FALSE, v_invitation_code, v_invitation_expiry,
      EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT
    );
  ELSE
    -- Update existing user
    v_user_id := v_existing_user._id;

    UPDATE users
    SET invitation_token = v_invitation_code,
        invitation_expiry = v_invitation_expiry,
        updated_at = NOW()
    WHERE _id = v_user_id;
  END IF;

  -- Associate with companies
  IF _company_ids IS NOT NULL THEN
    FOREACH v_company_id IN ARRAY _company_ids
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM user_companies
        WHERE user_id = v_user_id AND company_id = v_company_id
      ) THEN
        INSERT INTO user_companies (
          _id, type, user_id, company_id, role, created_at
        ) VALUES (
          'user_company_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || gen_random_uuid()::TEXT,
          'user_company', v_user_id, v_company_id, 'member',
          EXTRACT(EPOCH FROM NOW())::BIGINT
        );
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'message', CASE
      WHEN v_is_new_user THEN 'User invited successfully.'
      ELSE 'Invitation sent to existing user.'
    END,
    'userId', v_user_id,
    'invitationCode', v_invitation_code,
    'isNewUser', v_is_new_user
  );
END;
$$;

-- ============================================
-- 15. ACCEPT INVITATION
-- ============================================
CREATE OR REPLACE FUNCTION auth.accept_invitation(
  _email TEXT,
  _invitation_code TEXT,
  _new_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
  v_hashed_password TEXT;
BEGIN
  SELECT * INTO v_user
  FROM users
  WHERE email = _email AND type = 'user';

  IF v_user._id IS NULL THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  IF v_user.invitation_token != _invitation_code THEN
    RAISE EXCEPTION 'Invalid invitation code';
  END IF;

  IF v_user.invitation_expiry IS NULL OR v_user.invitation_expiry < EXTRACT(EPOCH FROM NOW())::BIGINT THEN
    RAISE EXCEPTION 'Invitation code has expired';
  END IF;

  IF _new_password IS NOT NULL THEN
    v_hashed_password := encode(digest(_new_password, 'sha256'), 'hex');

    UPDATE users
    SET password = v_hashed_password,
        verified = TRUE,
        invitation_token = NULL,
        invitation_expiry = NULL,
        updated_at = NOW()
    WHERE _id = v_user._id;
  ELSE
    UPDATE users
    SET verified = TRUE,
        invitation_token = NULL,
        invitation_expiry = NULL,
        updated_at = NOW()
    WHERE _id = v_user._id;
  END IF;

  RETURN jsonb_build_object(
    'message', 'Invitation accepted successfully.',
    'user', jsonb_build_object(
      '_id', v_user._id,
      'email', v_user.email,
      'fullname', v_user.fullname
    )
  );
END;
$$;

-- ============================================
-- 16. GET USER BY EMAIL
-- ============================================
CREATE OR REPLACE FUNCTION auth.get_user_by_email(_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT * INTO v_user
  FROM users
  WHERE email = _email AND type = 'user';

  IF v_user._id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    '_id', v_user._id,
    'email', v_user.email,
    'fullname', v_user.fullname,
    'verified', v_user.verified,
    'created_at', v_user.created_at
  );
END;
$$;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE type = 'user';
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_code) WHERE verification_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_invitation ON users(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token) WHERE type = 'session';
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at) WHERE type = 'session';
CREATE INDEX IF NOT EXISTS idx_user_companies_user ON user_companies(user_id) WHERE type = 'user_company';
CREATE INDEX IF NOT EXISTS idx_user_companies_company ON user_companies(company_id) WHERE type = 'user_company';
