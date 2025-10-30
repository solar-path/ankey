-- ============================================
-- DOA MODULE - PostgreSQL Functions
-- ============================================
-- All business logic for DoA (Delegation of Authority) is in PostgreSQL

CREATE SCHEMA IF NOT EXISTS doa;

-- ============================================
-- 1. INITIALIZE DEFAULT DOA MATRICES FOR NEW COMPANY
-- ============================================
CREATE OR REPLACE FUNCTION doa.initialize_default_matrices(
  _company_id UUID,
  _owner_user_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_document_types TEXT[] := ARRAY[
    'department_charter',
    'job_description',
    'job_offer',
    'employment_contract',
    'termination_notice',
    'orgchart'
  ];
  v_document_type TEXT;
  v_matrix_id UUID;
  v_matrix_text_id TEXT;
  v_created_matrices JSONB := '[]'::JSONB;
BEGIN
  -- Create default approval matrix for each document type
  FOREACH v_document_type IN ARRAY v_document_types
  LOOP
    v_matrix_id := gen_random_uuid();
    v_matrix_text_id := 'matrix_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || v_matrix_id::TEXT;

    INSERT INTO approval_matrices (
      id, _id, type, company_id, name, description,
      document_type, status, is_active, currency,
      approval_blocks, created_by, created_at, updated_at,
      effective_from, effective_to
    ) VALUES (
      v_matrix_id,
      v_matrix_text_id,
      'approval_matrix',
      _company_id,
      'Default ' || REPLACE(v_document_type, '_', ' ') || ' Approval',
      'Default approval matrix for ' || v_document_type || ' - requires owner approval',
      v_document_type,
      'active',
      true,
      'USD',
      jsonb_build_array(
        jsonb_build_object(
          'level', 1,
          'order', 1,
          'approvers', jsonb_build_array(_owner_user_id),
          'requiresAll', true,
          'minApprovals', 1
        )
      ),
      _owner_user_id,
      NOW(),
      NOW(),
      NOW(),  -- effective_from = created_at
      NULL    -- effective_to = unlimited
    );

    -- Add to result array
    v_created_matrices := v_created_matrices || jsonb_build_object(
      '_id', v_matrix_text_id,
      'id', v_matrix_id,
      'documentType', v_document_type
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Default DoA matrices initialized',
    'matrices', v_created_matrices
  );
END;
$$;

-- ============================================
-- 2. CREATE APPROVAL MATRIX
-- ============================================
CREATE OR REPLACE FUNCTION doa.create_matrix(
  _company_id UUID,
  _name TEXT,
  _document_type TEXT,
  _approval_blocks JSONB,
  _created_by TEXT,
  _description TEXT DEFAULT NULL,
  _min_amount DECIMAL DEFAULT NULL,
  _max_amount DECIMAL DEFAULT NULL,
  _currency TEXT DEFAULT 'USD',
  _is_active BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_matrix_id UUID;
  v_matrix_text_id TEXT;
BEGIN
  v_matrix_id := gen_random_uuid();
  v_matrix_text_id := 'matrix_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || v_matrix_id::TEXT;

  INSERT INTO approval_matrices (
    id, _id, type, company_id, name, description,
    document_type, status, is_active, min_amount, max_amount,
    currency, approval_blocks, created_by, created_at, updated_at
  ) VALUES (
    v_matrix_id,
    v_matrix_text_id,
    'approval_matrix',
    _company_id,
    _name,
    _description,
    _document_type,
    'active',
    _is_active,
    _min_amount,
    _max_amount,
    _currency,
    _approval_blocks,
    _created_by,
    NOW(),
    NOW()
  );

  RETURN jsonb_build_object(
    '_id', v_matrix_text_id,
    'id', v_matrix_id,
    'type', 'approval_matrix',
    'companyId', _company_id,
    'name', _name,
    'description', _description,
    'documentType', _document_type,
    'status', 'active',
    'isActive', _is_active,
    'minAmount', _min_amount,
    'maxAmount', _max_amount,
    'currency', _currency,
    'approvalBlocks', _approval_blocks,
    'createdBy', _created_by,
    'createdAt', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 3. GET MATRICES FOR COMPANY
-- ============================================
CREATE OR REPLACE FUNCTION doa.get_matrices(_company_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_matrices JSONB;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      '_id', _id,
      'id', id,
      'type', type,
      'companyId', company_id,
      'name', name,
      'description', description,
      'documentType', document_type,
      'status', status,
      'isActive', is_active,
      'minAmount', min_amount,
      'maxAmount', max_amount,
      'currency', currency,
      'approvalBlocks', approval_blocks,
      'createdBy', created_by,
      'createdAt', EXTRACT(EPOCH FROM created_at)::BIGINT * 1000,
      'updatedAt', EXTRACT(EPOCH FROM updated_at)::BIGINT * 1000,
      'effectiveFrom', CASE WHEN effective_from IS NOT NULL
        THEN EXTRACT(EPOCH FROM effective_from)::BIGINT * 1000
        ELSE NULL END,
      'effectiveTo', CASE WHEN effective_to IS NOT NULL
        THEN EXTRACT(EPOCH FROM effective_to)::BIGINT * 1000
        ELSE NULL END
    )
    ORDER BY document_type, created_at DESC
  ) INTO v_matrices
  FROM approval_matrices
  WHERE company_id = v_company_uuid;

  RETURN COALESCE(v_matrices, '[]'::JSONB);
END;
$$;

-- ============================================
-- 4. GET SINGLE MATRIX BY ID
-- ============================================
CREATE OR REPLACE FUNCTION doa.get_matrix(
  _company_id TEXT,
  _matrix_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_matrix RECORD;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

  -- Get matrix by _id (text ID)
  SELECT * INTO v_matrix
  FROM approval_matrices
  WHERE company_id = v_company_uuid
    AND _id = _matrix_id;

  IF v_matrix.id IS NULL THEN
    RAISE EXCEPTION 'Matrix not found: %', _matrix_id;
  END IF;

  RETURN jsonb_build_object(
    '_id', v_matrix._id,
    'id', v_matrix.id,
    'type', v_matrix.type,
    'companyId', v_matrix.company_id,
    'name', v_matrix.name,
    'description', v_matrix.description,
    'documentType', v_matrix.document_type,
    'status', v_matrix.status,
    'isActive', v_matrix.is_active,
    'minAmount', v_matrix.min_amount,
    'maxAmount', v_matrix.max_amount,
    'currency', v_matrix.currency,
    'approvalBlocks', v_matrix.approval_blocks,
    'createdBy', v_matrix.created_by,
    'createdAt', EXTRACT(EPOCH FROM v_matrix.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_matrix.updated_at)::BIGINT * 1000,
    'effectiveFrom', CASE WHEN v_matrix.effective_from IS NOT NULL
      THEN EXTRACT(EPOCH FROM v_matrix.effective_from)::BIGINT * 1000
      ELSE NULL END,
    'effectiveTo', CASE WHEN v_matrix.effective_to IS NOT NULL
      THEN EXTRACT(EPOCH FROM v_matrix.effective_to)::BIGINT * 1000
      ELSE NULL END
  );
END;
$$;

-- ============================================
-- 5. GET ACTIVE MATRIX FOR DOCUMENT TYPE
-- ============================================
CREATE OR REPLACE FUNCTION doa.get_active_matrix_for_type(
  _company_id UUID,
  _document_type TEXT,
  _amount DECIMAL DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_matrix RECORD;
BEGIN
  -- Find active matrix for document type
  -- If amount is provided, check amount thresholds
  SELECT * INTO v_matrix
  FROM approval_matrices
  WHERE company_id = _company_id
    AND document_type = _document_type
    AND status = 'active'
    AND is_active = true
    AND (
      _amount IS NULL
      OR (
        (min_amount IS NULL OR _amount >= min_amount)
        AND (max_amount IS NULL OR _amount <= max_amount)
      )
    )
  ORDER BY
    -- Prefer matrices with specific amount ranges
    CASE WHEN min_amount IS NOT NULL OR max_amount IS NOT NULL THEN 0 ELSE 1 END,
    created_at DESC
  LIMIT 1;

  IF v_matrix.id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    '_id', v_matrix._id,
    'id', v_matrix.id,
    'type', v_matrix.type,
    'companyId', v_matrix.company_id,
    'name', v_matrix.name,
    'description', v_matrix.description,
    'documentType', v_matrix.document_type,
    'status', v_matrix.status,
    'isActive', v_matrix.is_active,
    'minAmount', v_matrix.min_amount,
    'maxAmount', v_matrix.max_amount,
    'currency', v_matrix.currency,
    'approvalBlocks', v_matrix.approval_blocks,
    'createdBy', v_matrix.created_by,
    'createdAt', EXTRACT(EPOCH FROM v_matrix.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_matrix.updated_at)::BIGINT * 1000,
    'effectiveFrom', CASE WHEN v_matrix.effective_from IS NOT NULL
      THEN EXTRACT(EPOCH FROM v_matrix.effective_from)::BIGINT * 1000
      ELSE NULL END,
    'effectiveTo', CASE WHEN v_matrix.effective_to IS NOT NULL
      THEN EXTRACT(EPOCH FROM v_matrix.effective_to)::BIGINT * 1000
      ELSE NULL END
  );
END;
$$;

-- ============================================
-- 6. UPDATE MATRIX
-- ============================================
CREATE OR REPLACE FUNCTION doa.update_matrix(
  _company_id TEXT,
  _matrix_id TEXT,
  _name TEXT DEFAULT NULL,
  _description TEXT DEFAULT NULL,
  _approval_blocks JSONB DEFAULT NULL,
  _is_active BOOLEAN DEFAULT NULL,
  _status TEXT DEFAULT NULL,
  _min_amount DECIMAL DEFAULT NULL,
  _max_amount DECIMAL DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_matrix RECORD;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

  UPDATE approval_matrices
  SET
    name = COALESCE(_name, name),
    description = COALESCE(_description, description),
    approval_blocks = COALESCE(_approval_blocks, approval_blocks),
    is_active = COALESCE(_is_active, is_active),
    status = COALESCE(_status, status),
    min_amount = COALESCE(_min_amount, min_amount),
    max_amount = COALESCE(_max_amount, max_amount),
    updated_at = NOW()
  WHERE company_id = v_company_uuid
    AND _id = _matrix_id;

  SELECT * INTO v_matrix
  FROM approval_matrices
  WHERE company_id = v_company_uuid
    AND _id = _matrix_id;

  IF v_matrix.id IS NULL THEN
    RAISE EXCEPTION 'Matrix not found: %', _matrix_id;
  END IF;

  RETURN jsonb_build_object(
    '_id', v_matrix._id,
    'id', v_matrix.id,
    'type', v_matrix.type,
    'companyId', v_matrix.company_id,
    'name', v_matrix.name,
    'description', v_matrix.description,
    'documentType', v_matrix.document_type,
    'status', v_matrix.status,
    'isActive', v_matrix.is_active,
    'minAmount', v_matrix.min_amount,
    'maxAmount', v_matrix.max_amount,
    'currency', v_matrix.currency,
    'approvalBlocks', v_matrix.approval_blocks,
    'createdBy', v_matrix.created_by,
    'createdAt', EXTRACT(EPOCH FROM v_matrix.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_matrix.updated_at)::BIGINT * 1000,
    'effectiveFrom', CASE WHEN v_matrix.effective_from IS NOT NULL
      THEN EXTRACT(EPOCH FROM v_matrix.effective_from)::BIGINT * 1000
      ELSE NULL END,
    'effectiveTo', CASE WHEN v_matrix.effective_to IS NOT NULL
      THEN EXTRACT(EPOCH FROM v_matrix.effective_to)::BIGINT * 1000
      ELSE NULL END
  );
END;
$$;

-- ============================================
-- 7. DELETE MATRIX
-- ============================================
CREATE OR REPLACE FUNCTION doa.delete_matrix(
  _company_id TEXT,
  _matrix_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

  DELETE FROM approval_matrices
  WHERE company_id = v_company_uuid
    AND _id = _matrix_id;

  RETURN jsonb_build_object('success', TRUE, 'message', 'Matrix deleted successfully');
END;
$$;

-- ============================================
-- INDEXES (if not already created in definition)
-- ============================================
-- Already defined in doa.definition.sql

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION doa.initialize_default_matrices IS 'Initialize default DoA matrices for a new company';
COMMENT ON FUNCTION doa.create_matrix IS 'Create a new approval matrix';
COMMENT ON FUNCTION doa.get_matrices IS 'Get all approval matrices for a company';
COMMENT ON FUNCTION doa.get_matrix IS 'Get a single approval matrix by ID';
COMMENT ON FUNCTION doa.get_active_matrix_for_type IS 'Get active matrix for a document type (with optional amount filtering)';
COMMENT ON FUNCTION doa.update_matrix IS 'Update an approval matrix';
COMMENT ON FUNCTION doa.delete_matrix IS 'Delete an approval matrix';
