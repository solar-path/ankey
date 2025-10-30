-- ============================================
-- COMPANY MODULE - PostgreSQL Functions
-- ============================================
-- All business logic for company management is in PostgreSQL
-- Hono API serves as a thin gateway layer

CREATE SCHEMA IF NOT EXISTS company;

-- ============================================
-- 1. CREATE COMPANY
-- ============================================
CREATE OR REPLACE FUNCTION company.create_company(
  _user_id TEXT,
  _type TEXT,
  _title TEXT,
  _logo TEXT DEFAULT NULL,
  _website TEXT DEFAULT NULL,
  _business_id TEXT DEFAULT NULL,
  _tax_id TEXT DEFAULT NULL,
  _residence TEXT DEFAULT NULL,
  _industry TEXT DEFAULT NULL,
  _contact JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_id UUID;
  v_company_text_id TEXT;
  v_user_company_id UUID;
BEGIN
  -- Generate UUIDs
  v_company_id := gen_random_uuid();
  v_company_text_id := 'company_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || v_company_id::TEXT;

  -- Insert company
  INSERT INTO companies (
    id, _id, type, title, logo, website, business_id, tax_id,
    residence, industry, contact, created_at, updated_at
  ) VALUES (
    v_company_id, v_company_text_id, _type, _title, _logo, _website,
    _business_id, _tax_id, _residence, _industry, _contact, NOW(), NOW()
  );

  -- For workspace companies, create user_company association with owner role
  IF _type = 'workspace' THEN
    v_user_company_id := gen_random_uuid();

    INSERT INTO user_companies (
      id, _id, type, user_id, company_id, role, joined_at, created_at
    ) VALUES (
      v_user_company_id,
      'uc_' || _user_id || '_' || v_company_id::TEXT,
      'user_company',
      _user_id,
      v_company_id,
      'owner',
      NOW(),
      NOW()
    );
  END IF;

  -- Return created company
  RETURN jsonb_build_object(
    '_id', v_company_text_id,
    'id', v_company_id,
    'type', _type,
    'title', _title,
    'logo', _logo,
    'website', _website,
    'businessId', _business_id,
    'taxId', _tax_id,
    'residence', _residence,
    'industry', _industry,
    'contact', _contact,
    'createdAt', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 2. GET USER COMPANIES
-- ============================================
CREATE OR REPLACE FUNCTION company.get_user_companies(_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_companies JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      '_id', c._id,
      'id', c.id,
      'type', c.type,
      'title', c.title,
      'logo', c.logo,
      'website', c.website,
      'businessId', c.business_id,
      'taxId', c.tax_id,
      'residence', c.residence,
      'industry', c.industry,
      'contact', c.contact,
      'settings', c.settings,
      'createdAt', EXTRACT(EPOCH FROM c.created_at)::BIGINT * 1000,
      'updatedAt', EXTRACT(EPOCH FROM c.updated_at)::BIGINT * 1000,
      'role', uc.role
    )
  ) INTO v_companies
  FROM user_companies uc
  JOIN companies c ON c.id = uc.company_id
  WHERE uc.user_id = _user_id;

  RETURN COALESCE(v_companies, '[]'::JSONB);
END;
$$;

-- ============================================
-- 3. GET COMPANY BY ID
-- ============================================
CREATE OR REPLACE FUNCTION company.get_company_by_id(_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company RECORD;
BEGIN
  SELECT * INTO v_company FROM companies WHERE id = _company_id;

  IF v_company.id IS NULL THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  RETURN jsonb_build_object(
    '_id', v_company._id,
    'id', v_company.id,
    'type', v_company.type,
    'title', v_company.title,
    'logo', v_company.logo,
    'website', v_company.website,
    'businessId', v_company.business_id,
    'taxId', v_company.tax_id,
    'residence', v_company.residence,
    'industry', v_company.industry,
    'contact', v_company.contact,
    'settings', v_company.settings,
    'createdAt', EXTRACT(EPOCH FROM v_company.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_company.updated_at)::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 4. UPDATE COMPANY
-- ============================================
CREATE OR REPLACE FUNCTION company.update_company(
  _company_id UUID,
  _title TEXT DEFAULT NULL,
  _logo TEXT DEFAULT NULL,
  _website TEXT DEFAULT NULL,
  _business_id TEXT DEFAULT NULL,
  _tax_id TEXT DEFAULT NULL,
  _residence TEXT DEFAULT NULL,
  _industry TEXT DEFAULT NULL,
  _contact JSONB DEFAULT NULL,
  _settings JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company RECORD;
BEGIN
  UPDATE companies
  SET
    title = COALESCE(_title, title),
    logo = COALESCE(_logo, logo),
    website = COALESCE(_website, website),
    business_id = COALESCE(_business_id, business_id),
    tax_id = COALESCE(_tax_id, tax_id),
    residence = COALESCE(_residence, residence),
    industry = COALESCE(_industry, industry),
    contact = COALESCE(_contact, contact),
    settings = COALESCE(_settings, settings),
    updated_at = NOW()
  WHERE id = _company_id;

  -- Get updated company
  SELECT * INTO v_company FROM companies WHERE id = _company_id;

  IF v_company.id IS NULL THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  RETURN jsonb_build_object(
    '_id', v_company._id,
    'id', v_company.id,
    'type', v_company.type,
    'title', v_company.title,
    'logo', v_company.logo,
    'website', v_company.website,
    'businessId', v_company.business_id,
    'taxId', v_company.tax_id,
    'residence', v_company.residence,
    'industry', v_company.industry,
    'contact', v_company.contact,
    'settings', v_company.settings,
    'createdAt', EXTRACT(EPOCH FROM v_company.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_company.updated_at)::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 5. DELETE COMPANY
-- ============================================
CREATE OR REPLACE FUNCTION company.delete_company(_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Delete user_company associations (cascade should handle this)
  DELETE FROM user_companies WHERE company_id = _company_id;

  -- Delete company
  DELETE FROM companies WHERE id = _company_id;

  RETURN jsonb_build_object('success', TRUE, 'message', 'Company deleted successfully');
END;
$$;

-- ============================================
-- 6. CHECK USER ACCESS TO COMPANY
-- ============================================
CREATE OR REPLACE FUNCTION company.has_access(_user_id TEXT, _company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_companies
  WHERE user_id = _user_id AND company_id = _company_id;

  RETURN jsonb_build_object('hasAccess', v_count > 0);
END;
$$;

-- ============================================
-- 7. GET USER ROLE IN COMPANY
-- ============================================
CREATE OR REPLACE FUNCTION company.get_user_role(_user_id TEXT, _company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM user_companies
  WHERE user_id = _user_id AND company_id = _company_id
  LIMIT 1;

  RETURN jsonb_build_object('role', v_role);
END;
$$;

-- ============================================
-- 8. GET COMPANY MEMBERS
-- ============================================
CREATE OR REPLACE FUNCTION company.get_company_members(_company_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_members JSONB;
  v_uuid UUID;
BEGIN
  -- Validation
  IF _company_id IS NULL OR _company_id = '' THEN
    RAISE EXCEPTION 'Company ID is required';
  END IF;

  -- Extract UUID from _id if needed (e.g., 'company_1234_uuid' -> 'uuid')
  BEGIN
    IF _company_id LIKE 'company_%' THEN
      v_uuid := SPLIT_PART(_company_id, '_', 3)::UUID;
    ELSE
      v_uuid := _company_id::UUID;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid company ID format: %', _company_id;
  END;

  SELECT jsonb_agg(
    jsonb_build_object(
      'userId', u._id,
      'email', u.email,
      'fullname', u.fullname,
      'avatar', u.profile->'avatar',
      'phone', u.profile->'phone',
      'address', u.profile->'address',
      'city', u.profile->'city',
      'state', u.profile->'state',
      'zipCode', u.profile->'zipCode',
      'country', u.profile->'country',
      'role', uc.role,
      'joinedAt', EXTRACT(EPOCH FROM uc.joined_at)::BIGINT * 1000
    )
    ORDER BY
      CASE uc.role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 3
      END,
      uc.joined_at
  ) INTO v_members
  FROM user_companies uc
  JOIN users u ON u._id = uc.user_id
  WHERE uc.company_id = v_uuid;

  RETURN COALESCE(v_members, '[]'::JSONB);
END;
$$;

-- ============================================
-- 9. ADD MEMBER TO COMPANY
-- ============================================
CREATE OR REPLACE FUNCTION company.add_member(
  _company_id UUID,
  _user_id TEXT,
  _role TEXT DEFAULT 'member'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_existing_count INT;
  v_user_company_id UUID;
BEGIN
  -- Check if already member
  SELECT COUNT(*) INTO v_existing_count
  FROM user_companies
  WHERE user_id = _user_id AND company_id = _company_id;

  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'User is already a member of this company';
  END IF;

  -- Add member
  v_user_company_id := gen_random_uuid();

  INSERT INTO user_companies (
    id, _id, type, user_id, company_id, role, joined_at, created_at
  ) VALUES (
    v_user_company_id,
    'uc_' || _user_id || '_' || _company_id::TEXT,
    'user_company',
    _user_id,
    _company_id,
    _role,
    NOW(),
    NOW()
  );

  RETURN jsonb_build_object('success', TRUE, 'message', 'Member added successfully');
END;
$$;

-- ============================================
-- 10. REMOVE MEMBER FROM COMPANY
-- ============================================
CREATE OR REPLACE FUNCTION company.remove_member(_company_id UUID, _user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
  v_owner_count INT;
BEGIN
  -- Get member role
  SELECT role INTO v_role
  FROM user_companies
  WHERE user_id = _user_id AND company_id = _company_id;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'User is not a member of this company';
  END IF;

  -- If owner, check if there's another owner
  IF v_role = 'owner' THEN
    SELECT COUNT(*) INTO v_owner_count
    FROM user_companies
    WHERE company_id = _company_id AND role = 'owner';

    IF v_owner_count = 1 THEN
      RAISE EXCEPTION 'Cannot remove the last owner. Transfer ownership first.';
    END IF;
  END IF;

  -- Remove member
  DELETE FROM user_companies
  WHERE user_id = _user_id AND company_id = _company_id;

  RETURN jsonb_build_object('success', TRUE, 'message', 'Member removed successfully');
END;
$$;

-- ============================================
-- 11. UPDATE MEMBER ROLE
-- ============================================
CREATE OR REPLACE FUNCTION company.update_member_role(
  _company_id UUID,
  _user_id TEXT,
  _new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_role TEXT;
  v_owner_count INT;
BEGIN
  -- Get current role
  SELECT role INTO v_old_role
  FROM user_companies
  WHERE user_id = _user_id AND company_id = _company_id;

  IF v_old_role IS NULL THEN
    RAISE EXCEPTION 'User is not a member of this company';
  END IF;

  -- If demoting from owner, check if there's another owner
  IF v_old_role = 'owner' AND _new_role != 'owner' THEN
    SELECT COUNT(*) INTO v_owner_count
    FROM user_companies
    WHERE company_id = _company_id AND role = 'owner';

    IF v_owner_count = 1 THEN
      RAISE EXCEPTION 'Cannot demote the last owner. Promote another user first.';
    END IF;
  END IF;

  -- Update role
  UPDATE user_companies
  SET role = _new_role
  WHERE user_id = _user_id AND company_id = _company_id;

  RETURN jsonb_build_object('success', TRUE, 'message', 'Role updated successfully');
END;
$$;

-- ============================================
-- 12. TRANSFER OWNERSHIP
-- ============================================
CREATE OR REPLACE FUNCTION company.transfer_ownership(
  _company_id UUID,
  _current_owner_id TEXT,
  _new_owner_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_role TEXT;
  v_new_member_exists BOOLEAN;
BEGIN
  -- Verify current owner
  SELECT role INTO v_current_role
  FROM user_companies
  WHERE user_id = _current_owner_id AND company_id = _company_id;

  IF v_current_role != 'owner' THEN
    RAISE EXCEPTION 'Current user is not the owner';
  END IF;

  -- Verify new owner is a member
  SELECT EXISTS(
    SELECT 1 FROM user_companies
    WHERE user_id = _new_owner_id AND company_id = _company_id
  ) INTO v_new_member_exists;

  IF NOT v_new_member_exists THEN
    RAISE EXCEPTION 'New owner is not a member of this company';
  END IF;

  -- Demote current owner to admin
  UPDATE user_companies
  SET role = 'admin'
  WHERE user_id = _current_owner_id AND company_id = _company_id;

  -- Promote new owner
  UPDATE user_companies
  SET role = 'owner'
  WHERE user_id = _new_owner_id AND company_id = _company_id;

  RETURN jsonb_build_object('success', TRUE, 'message', 'Ownership transferred successfully');
END;
$$;

-- ============================================
-- 13. HAS PERMISSION
-- ============================================
CREATE OR REPLACE FUNCTION company.has_permission(
  _user_id TEXT,
  _company_id UUID,
  _required_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_role TEXT;
  v_has_permission BOOLEAN;
BEGIN
  SELECT role INTO v_user_role
  FROM user_companies
  WHERE user_id = _user_id AND company_id = _company_id;

  IF v_user_role IS NULL THEN
    v_has_permission := FALSE;
  ELSE
    -- Role hierarchy: owner=3, admin=2, member=1
    v_has_permission := CASE
      WHEN v_user_role = 'owner' THEN 3
      WHEN v_user_role = 'admin' THEN 2
      WHEN v_user_role = 'member' THEN 1
      ELSE 0
    END >= CASE
      WHEN _required_role = 'owner' THEN 3
      WHEN _required_role = 'admin' THEN 2
      WHEN _required_role = 'member' THEN 1
      ELSE 0
    END;
  END IF;

  RETURN jsonb_build_object('hasPermission', v_has_permission);
END;
$$;

-- ============================================
-- INDEXES (if not already created)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);
CREATE INDEX IF NOT EXISTS idx_companies_residence ON companies(residence);
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_role ON user_companies(role);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION company.create_company IS 'Create a new company (workspace/supplier/customer)';
COMMENT ON FUNCTION company.get_user_companies IS 'Get all companies for a user';
COMMENT ON FUNCTION company.get_company_by_id IS 'Get company details by ID';
COMMENT ON FUNCTION company.update_company IS 'Update company information';
COMMENT ON FUNCTION company.delete_company IS 'Delete company and all associations';
COMMENT ON FUNCTION company.has_access IS 'Check if user has access to company';
COMMENT ON FUNCTION company.get_user_role IS 'Get user role in company';
COMMENT ON FUNCTION company.get_company_members IS 'Get all members of a company';
COMMENT ON FUNCTION company.add_member IS 'Add a member to company';
COMMENT ON FUNCTION company.remove_member IS 'Remove member from company';
COMMENT ON FUNCTION company.update_member_role IS 'Update member role';
COMMENT ON FUNCTION company.transfer_ownership IS 'Transfer company ownership';
COMMENT ON FUNCTION company.has_permission IS 'Check if user has required permission level';
