-- ============================================
-- INQUIRY MODULE - PostgreSQL Functions
-- ============================================
-- All business logic for inquiry management is in PostgreSQL
-- Hono API serves as a thin gateway layer

CREATE SCHEMA IF NOT EXISTS inquiry;

-- ============================================
-- 1. CREATE INQUIRY
-- ============================================
CREATE OR REPLACE FUNCTION inquiry.create_inquiry(
  _name TEXT,
  _email TEXT,
  _message TEXT,
  _company TEXT DEFAULT NULL,
  _phone TEXT DEFAULT NULL,
  _attachments JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inquiry_id UUID;
  v_inquiry_text_id TEXT;
  v_inquiry RECORD;
BEGIN
  -- Generate IDs
  v_inquiry_id := gen_random_uuid();
  v_inquiry_text_id := 'inquiry_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' ||
                       substring(v_inquiry_id::TEXT from 1 for 9);

  -- Insert inquiry
  INSERT INTO inquiries (
    id, _id, type, name, email, company, phone, message,
    attachments, status, created_at, updated_at
  ) VALUES (
    v_inquiry_id,
    v_inquiry_text_id,
    'inquiry',
    _name,
    _email,
    _company,
    _phone,
    _message,
    _attachments,
    'pending',
    NOW(),
    NOW()
  ) RETURNING * INTO v_inquiry;

  RETURN jsonb_build_object(
    '_id', v_inquiry._id,
    'id', v_inquiry.id,
    'type', v_inquiry.type,
    'name', v_inquiry.name,
    'email', v_inquiry.email,
    'company', v_inquiry.company,
    'phone', v_inquiry.phone,
    'message', v_inquiry.message,
    'attachments', v_inquiry.attachments,
    'status', v_inquiry.status,
    'response', v_inquiry.response,
    'createdAt', EXTRACT(EPOCH FROM v_inquiry.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_inquiry.updated_at)::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 2. GET INQUIRY BY ID
-- ============================================
CREATE OR REPLACE FUNCTION inquiry.get_inquiry_by_id(_inquiry_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inquiry RECORD;
BEGIN
  SELECT * INTO v_inquiry
  FROM inquiries
  WHERE _id = _inquiry_id OR id::TEXT = _inquiry_id;

  IF v_inquiry.id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    '_id', v_inquiry._id,
    'id', v_inquiry.id,
    'type', v_inquiry.type,
    'name', v_inquiry.name,
    'email', v_inquiry.email,
    'company', v_inquiry.company,
    'phone', v_inquiry.phone,
    'message', v_inquiry.message,
    'attachments', v_inquiry.attachments,
    'status', v_inquiry.status,
    'response', v_inquiry.response,
    'createdAt', EXTRACT(EPOCH FROM v_inquiry.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_inquiry.updated_at)::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 3. UPDATE INQUIRY STATUS
-- ============================================
CREATE OR REPLACE FUNCTION inquiry.update_status(
  _inquiry_id TEXT,
  _status TEXT,
  _response TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inquiry RECORD;
BEGIN
  -- Validate status
  IF _status NOT IN ('pending', 'in-progress', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'Invalid status. Must be one of: pending, in-progress, resolved, closed';
  END IF;

  -- Update inquiry
  UPDATE inquiries
  SET
    status = _status,
    response = COALESCE(_response, response),
    updated_at = NOW()
  WHERE _id = _inquiry_id OR id::TEXT = _inquiry_id
  RETURNING * INTO v_inquiry;

  IF v_inquiry.id IS NULL THEN
    RAISE EXCEPTION 'Inquiry not found';
  END IF;

  RETURN jsonb_build_object(
    '_id', v_inquiry._id,
    'id', v_inquiry.id,
    'type', v_inquiry.type,
    'name', v_inquiry.name,
    'email', v_inquiry.email,
    'company', v_inquiry.company,
    'phone', v_inquiry.phone,
    'message', v_inquiry.message,
    'attachments', v_inquiry.attachments,
    'status', v_inquiry.status,
    'response', v_inquiry.response,
    'createdAt', EXTRACT(EPOCH FROM v_inquiry.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_inquiry.updated_at)::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 4. GET ALL INQUIRIES (Admin)
-- ============================================
CREATE OR REPLACE FUNCTION inquiry.get_all_inquiries(
  _status TEXT DEFAULT NULL,
  _limit INT DEFAULT 50,
  _offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inquiries JSONB;
  v_total INT;
BEGIN
  -- Get total count
  IF _status IS NOT NULL THEN
    SELECT COUNT(*) INTO v_total
    FROM inquiries
    WHERE status = _status;
  ELSE
    SELECT COUNT(*) INTO v_total
    FROM inquiries;
  END IF;

  -- Get inquiries
  IF _status IS NOT NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        '_id', i._id,
        'id', i.id,
        'type', i.type,
        'name', i.name,
        'email', i.email,
        'company', i.company,
        'phone', i.phone,
        'message', i.message,
        'attachments', i.attachments,
        'status', i.status,
        'response', i.response,
        'createdAt', EXTRACT(EPOCH FROM i.created_at)::BIGINT * 1000,
        'updatedAt', EXTRACT(EPOCH FROM i.updated_at)::BIGINT * 1000
      )
      ORDER BY i.created_at DESC
    ) INTO v_inquiries
    FROM (
      SELECT * FROM inquiries
      WHERE status = _status
      ORDER BY created_at DESC
      LIMIT _limit OFFSET _offset
    ) i;
  ELSE
    SELECT jsonb_agg(
      jsonb_build_object(
        '_id', i._id,
        'id', i.id,
        'type', i.type,
        'name', i.name,
        'email', i.email,
        'company', i.company,
        'phone', i.phone,
        'message', i.message,
        'attachments', i.attachments,
        'status', i.status,
        'response', i.response,
        'createdAt', EXTRACT(EPOCH FROM i.created_at)::BIGINT * 1000,
        'updatedAt', EXTRACT(EPOCH FROM i.updated_at)::BIGINT * 1000
      )
      ORDER BY i.created_at DESC
    ) INTO v_inquiries
    FROM (
      SELECT * FROM inquiries
      ORDER BY created_at DESC
      LIMIT _limit OFFSET _offset
    ) i;
  END IF;

  RETURN jsonb_build_object(
    'inquiries', COALESCE(v_inquiries, '[]'::JSONB),
    'total', v_total,
    'limit', _limit,
    'offset', _offset
  );
END;
$$;

-- ============================================
-- 5. GET INQUIRIES BY EMAIL
-- ============================================
CREATE OR REPLACE FUNCTION inquiry.get_inquiries_by_email(_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inquiries JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      '_id', i._id,
      'id', i.id,
      'type', i.type,
      'name', i.name,
      'email', i.email,
      'company', i.company,
      'phone', i.phone,
      'message', i.message,
      'attachments', i.attachments,
      'status', i.status,
      'response', i.response,
      'createdAt', EXTRACT(EPOCH FROM i.created_at)::BIGINT * 1000,
      'updatedAt', EXTRACT(EPOCH FROM i.updated_at)::BIGINT * 1000
    )
    ORDER BY i.created_at DESC
  ) INTO v_inquiries
  FROM inquiries i
  WHERE i.email = _email;

  RETURN COALESCE(v_inquiries, '[]'::JSONB);
END;
$$;

-- ============================================
-- 6. DELETE INQUIRY
-- ============================================
CREATE OR REPLACE FUNCTION inquiry.delete_inquiry(_inquiry_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_deleted BOOLEAN;
BEGIN
  DELETE FROM inquiries
  WHERE _id = _inquiry_id OR id::TEXT = _inquiry_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted THEN
    RETURN jsonb_build_object('success', TRUE, 'message', 'Inquiry deleted successfully');
  ELSE
    RAISE EXCEPTION 'Inquiry not found';
  END IF;
END;
$$;

-- ============================================
-- 7. GET INQUIRY STATISTICS
-- ============================================
CREATE OR REPLACE FUNCTION inquiry.get_statistics()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total INT;
  v_pending INT;
  v_in_progress INT;
  v_resolved INT;
  v_closed INT;
  v_today INT;
  v_this_week INT;
  v_this_month INT;
BEGIN
  -- Total counts
  SELECT COUNT(*) INTO v_total FROM inquiries;
  SELECT COUNT(*) INTO v_pending FROM inquiries WHERE status = 'pending';
  SELECT COUNT(*) INTO v_in_progress FROM inquiries WHERE status = 'in-progress';
  SELECT COUNT(*) INTO v_resolved FROM inquiries WHERE status = 'resolved';
  SELECT COUNT(*) INTO v_closed FROM inquiries WHERE status = 'closed';

  -- Time-based counts
  SELECT COUNT(*) INTO v_today
  FROM inquiries
  WHERE created_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO v_this_week
  FROM inquiries
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

  SELECT COUNT(*) INTO v_this_month
  FROM inquiries
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

  RETURN jsonb_build_object(
    'total', v_total,
    'byStatus', jsonb_build_object(
      'pending', v_pending,
      'inProgress', v_in_progress,
      'resolved', v_resolved,
      'closed', v_closed
    ),
    'byTime', jsonb_build_object(
      'today', v_today,
      'thisWeek', v_this_week,
      'thisMonth', v_this_month
    )
  );
END;
$$;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries__id ON inquiries(_id);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION inquiry.create_inquiry IS 'Create a new inquiry from contact form';
COMMENT ON FUNCTION inquiry.get_inquiry_by_id IS 'Get inquiry details by ID';
COMMENT ON FUNCTION inquiry.update_status IS 'Update inquiry status and optionally add response';
COMMENT ON FUNCTION inquiry.get_all_inquiries IS 'Get all inquiries with pagination (admin)';
COMMENT ON FUNCTION inquiry.get_inquiries_by_email IS 'Get all inquiries for specific email';
COMMENT ON FUNCTION inquiry.delete_inquiry IS 'Delete inquiry by ID';
COMMENT ON FUNCTION inquiry.get_statistics IS 'Get inquiry statistics for dashboard';
