-- ============================================
-- ORGCHART MODULE - PostgreSQL Functions
-- ============================================
-- All business logic for organizational charts is in PostgreSQL
-- Supports hierarchical structure: OrgChart -> Department -> Position -> Appointment

CREATE SCHEMA IF NOT EXISTS orgchart;

-- ============================================
-- 1. CREATE ORGCHART (Root level)
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.create_orgchart(
  _company_id UUID,
  _title TEXT,
  _description TEXT DEFAULT NULL,
  _code TEXT DEFAULT NULL,
  _version TEXT DEFAULT '1.0',
  _status TEXT DEFAULT 'draft'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_orgchart_id UUID;
  v_orgchart RECORD;
BEGIN
  -- Validate status
  IF _status NOT IN ('draft', 'pending_approval', 'approved', 'revoked') THEN
    RAISE EXCEPTION 'Invalid status. Must be one of: draft, pending_approval, approved, revoked';
  END IF;

  -- Generate ID
  v_orgchart_id := gen_random_uuid();

  -- Insert orgchart
  INSERT INTO orgcharts (
    id, company_id, type, title, description, code, version,
    status, level, sort_order, created_at, updated_at
  ) VALUES (
    v_orgchart_id, _company_id, 'orgchart', _title, _description,
    _code, _version, _status, 0, 0, NOW(), NOW()
  ) RETURNING * INTO v_orgchart;

  RETURN jsonb_build_object(
    'id', v_orgchart.id,
    'companyId', v_orgchart.company_id,
    'type', v_orgchart.type,
    'title', v_orgchart.title,
    'description', v_orgchart.description,
    'code', v_orgchart.code,
    'version', v_orgchart.version,
    'status', v_orgchart.status,
    'level', v_orgchart.level,
    'sortOrder', v_orgchart.sort_order,
    'createdAt', EXTRACT(EPOCH FROM v_orgchart.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_orgchart.updated_at)::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 2. CREATE DEPARTMENT
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.create_department(
  _company_id UUID,
  _parent_id UUID,
  _title TEXT,
  _description TEXT DEFAULT NULL,
  _code TEXT DEFAULT NULL,
  _headcount INTEGER DEFAULT 0,
  _charter TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_department_id UUID;
  v_head_position_id UUID;
  v_parent_level INT;
  v_department RECORD;
  v_head_position RECORD;
BEGIN
  -- Get parent level
  SELECT level INTO v_parent_level FROM orgcharts WHERE id = _parent_id;

  IF v_parent_level IS NULL THEN
    RAISE EXCEPTION 'Parent not found';
  END IF;

  -- Generate IDs
  v_department_id := gen_random_uuid();
  v_head_position_id := gen_random_uuid();

  -- Insert department
  INSERT INTO orgcharts (
    id, company_id, type, title, description, code, parent_id,
    headcount, headcount_filled, headcount_unfilled, charter,
    level, sort_order, head_position_id, created_at, updated_at
  ) VALUES (
    v_department_id, _company_id, 'department', _title, _description,
    _code, _parent_id, _headcount, 0, _headcount, _charter,
    v_parent_level + 1, 0, v_head_position_id, NOW(), NOW()
  ) RETURNING * INTO v_department;

  -- Auto-create head position
  INSERT INTO orgcharts (
    id, company_id, type, title, parent_id, is_vacant,
    level, sort_order, created_at, updated_at
  ) VALUES (
    v_head_position_id, _company_id, 'position',
    'Head of ' || _title, v_department_id, TRUE,
    v_parent_level + 2, 0, NOW(), NOW()
  ) RETURNING * INTO v_head_position;

  RETURN jsonb_build_object(
    'department', jsonb_build_object(
      'id', v_department.id,
      'companyId', v_department.company_id,
      'type', v_department.type,
      'title', v_department.title,
      'description', v_department.description,
      'code', v_department.code,
      'parentId', v_department.parent_id,
      'headPositionId', v_department.head_position_id,
      'headcount', v_department.headcount,
      'headcountFilled', v_department.headcount_filled,
      'headcountUnfilled', v_department.headcount_unfilled,
      'charter', v_department.charter,
      'level', v_department.level,
      'sortOrder', v_department.sort_order,
      'createdAt', EXTRACT(EPOCH FROM v_department.created_at)::BIGINT * 1000,
      'updatedAt', EXTRACT(EPOCH FROM v_department.updated_at)::BIGINT * 1000
    ),
    'headPosition', jsonb_build_object(
      'id', v_head_position.id,
      'title', v_head_position.title,
      'isVacant', v_head_position.is_vacant
    )
  );
END;
$$;

-- ============================================
-- 3. CREATE POSITION
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.create_position(
  _company_id UUID,
  _parent_id UUID,
  _title TEXT,
  _description TEXT DEFAULT NULL,
  _salary_min INTEGER DEFAULT NULL,
  _salary_max INTEGER DEFAULT NULL,
  _job_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_position_id UUID;
  v_parent_level INT;
  v_position RECORD;
BEGIN
  SELECT level INTO v_parent_level FROM orgcharts WHERE id = _parent_id;

  IF v_parent_level IS NULL THEN
    RAISE EXCEPTION 'Parent department not found';
  END IF;

  v_position_id := gen_random_uuid();

  INSERT INTO orgcharts (
    id, company_id, type, title, description, parent_id,
    salary_min, salary_max, job_description, is_vacant,
    level, sort_order, created_at, updated_at
  ) VALUES (
    v_position_id, _company_id, 'position', _title, _description, _parent_id,
    _salary_min, _salary_max, _job_description, TRUE,
    v_parent_level + 1, 0, NOW(), NOW()
  ) RETURNING * INTO v_position;

  RETURN jsonb_build_object(
    'id', v_position.id,
    'companyId', v_position.company_id,
    'type', v_position.type,
    'title', v_position.title,
    'description', v_position.description,
    'parentId', v_position.parent_id,
    'salaryMin', v_position.salary_min,
    'salaryMax', v_position.salary_max,
    'jobDescription', v_position.job_description,
    'isVacant', v_position.is_vacant,
    'level', v_position.level,
    'sortOrder', v_position.sort_order,
    'createdAt', EXTRACT(EPOCH FROM v_position.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_position.updated_at)::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 4. CREATE APPOINTMENT
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.create_appointment(
  _company_id UUID,
  _position_id UUID,
  _user_id UUID,
  _appointee_fullname TEXT,
  _appointee_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_position RECORD;
BEGIN
  -- Check if position exists and is vacant
  SELECT * INTO v_position FROM orgcharts WHERE id = _position_id AND type = 'position';

  IF v_position.id IS NULL THEN
    RAISE EXCEPTION 'Position not found';
  END IF;

  IF v_position.is_vacant = FALSE THEN
    RAISE EXCEPTION 'Position is already filled';
  END IF;

  -- Update position with appointment
  UPDATE orgcharts
  SET
    appointee_user_id = _user_id,
    appointee_fullname = _appointee_fullname,
    appointee_email = _appointee_email,
    is_vacant = FALSE,
    appointed_at = NOW(),
    updated_at = NOW()
  WHERE id = _position_id
  RETURNING * INTO v_position;

  -- Update parent department headcount
  UPDATE orgcharts
  SET
    headcount_filled = headcount_filled + 1,
    headcount_unfilled = headcount_unfilled - 1,
    updated_at = NOW()
  WHERE id = v_position.parent_id AND type = 'department';

  RETURN jsonb_build_object(
    'id', v_position.id,
    'appointeeUserId', v_position.appointee_user_id,
    'appointeeFullname', v_position.appointee_fullname,
    'appointeeEmail', v_position.appointee_email,
    'isVacant', v_position.is_vacant,
    'appointedAt', EXTRACT(EPOCH FROM v_position.appointed_at)::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 5. REMOVE APPOINTMENT
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.remove_appointment(_position_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_position RECORD;
BEGIN
  SELECT * INTO v_position FROM orgcharts WHERE id = _position_id AND type = 'position';

  IF v_position.id IS NULL THEN
    RAISE EXCEPTION 'Position not found';
  END IF;

  -- Update position
  UPDATE orgcharts
  SET
    appointee_user_id = NULL,
    appointee_fullname = NULL,
    appointee_email = NULL,
    is_vacant = TRUE,
    appointed_at = NULL,
    updated_at = NOW()
  WHERE id = _position_id;

  -- Update parent department headcount
  UPDATE orgcharts
  SET
    headcount_filled = headcount_filled - 1,
    headcount_unfilled = headcount_unfilled + 1,
    updated_at = NOW()
  WHERE id = v_position.parent_id AND type = 'department';

  RETURN jsonb_build_object('success', TRUE, 'message', 'Appointment removed');
END;
$$;

-- ============================================
-- 6. GET ORGCHART TREE
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.get_tree(_company_id UUID, _orgchart_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tree JSONB;
BEGIN
  WITH RECURSIVE org_tree AS (
    -- Root node
    SELECT
      id, company_id, type, title, description, code, version, status,
      parent_id, head_position_id, headcount, headcount_filled, headcount_unfilled,
      charter, salary_min, salary_max, job_description,
      appointee_user_id, appointee_fullname, appointee_email,
      is_vacant, appointed_at, level, sort_order, created_at, updated_at,
      ARRAY[id] AS path
    FROM orgcharts
    WHERE id = _orgchart_id AND company_id = _company_id

    UNION ALL

    -- Children
    SELECT
      o.id, o.company_id, o.type, o.title, o.description, o.code, o.version, o.status,
      o.parent_id, o.head_position_id, o.headcount, o.headcount_filled, o.headcount_unfilled,
      o.charter, o.salary_min, o.salary_max, o.job_description,
      o.appointee_user_id, o.appointee_fullname, o.appointee_email,
      o.is_vacant, o.appointed_at, o.level, o.sort_order, o.created_at, o.updated_at,
      ot.path || o.id
    FROM orgcharts o
    INNER JOIN org_tree ot ON o.parent_id = ot.id
    WHERE o.company_id = _company_id
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'companyId', company_id,
      'type', type,
      'title', title,
      'description', description,
      'code', code,
      'version', version,
      'status', status,
      'parentId', parent_id,
      'headPositionId', head_position_id,
      'headcount', headcount,
      'headcountFilled', headcount_filled,
      'headcountUnfilled', headcount_unfilled,
      'charter', charter,
      'salaryMin', salary_min,
      'salaryMax', salary_max,
      'jobDescription', job_description,
      'appointeeUserId', appointee_user_id,
      'appointeeFullname', appointee_fullname,
      'appointeeEmail', appointee_email,
      'isVacant', is_vacant,
      'appointedAt', CASE WHEN appointed_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM appointed_at)::BIGINT * 1000
        ELSE NULL END,
      'level', level,
      'sortOrder', sort_order,
      'path', path,
      'createdAt', EXTRACT(EPOCH FROM created_at)::BIGINT * 1000,
      'updatedAt', EXTRACT(EPOCH FROM updated_at)::BIGINT * 1000
    )
    ORDER BY level, sort_order
  ) INTO v_tree
  FROM org_tree;

  RETURN COALESCE(v_tree, '[]'::JSONB);
END;
$$;

-- ============================================
-- 7. UPDATE NODE
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.update_node(
  _node_id UUID,
  _title TEXT DEFAULT NULL,
  _description TEXT DEFAULT NULL,
  _code TEXT DEFAULT NULL,
  _version TEXT DEFAULT NULL,
  _status TEXT DEFAULT NULL,
  _headcount INTEGER DEFAULT NULL,
  _charter TEXT DEFAULT NULL,
  _salary_min INTEGER DEFAULT NULL,
  _salary_max INTEGER DEFAULT NULL,
  _job_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_node RECORD;
BEGIN
  UPDATE orgcharts
  SET
    title = COALESCE(_title, title),
    description = COALESCE(_description, description),
    code = COALESCE(_code, code),
    version = COALESCE(_version, version),
    status = COALESCE(_status, status),
    headcount = COALESCE(_headcount, headcount),
    charter = COALESCE(_charter, charter),
    salary_min = COALESCE(_salary_min, salary_min),
    salary_max = COALESCE(_salary_max, salary_max),
    job_description = COALESCE(_job_description, job_description),
    updated_at = NOW()
  WHERE id = _node_id
  RETURNING * INTO v_node;

  IF v_node.id IS NULL THEN
    RAISE EXCEPTION 'Node not found';
  END IF;

  RETURN jsonb_build_object(
    'id', v_node.id,
    'type', v_node.type,
    'title', v_node.title,
    'description', v_node.description,
    'updatedAt', EXTRACT(EPOCH FROM v_node.updated_at)::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 8. DELETE NODE
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.delete_node(_node_id UUID, _cascade BOOLEAN DEFAULT FALSE)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_node RECORD;
  v_child_count INT;
BEGIN
  SELECT * INTO v_node FROM orgcharts WHERE id = _node_id;

  IF v_node.id IS NULL THEN
    RAISE EXCEPTION 'Node not found';
  END IF;

  -- Check for children
  SELECT COUNT(*) INTO v_child_count FROM orgcharts WHERE parent_id = _node_id;

  IF v_child_count > 0 AND _cascade = FALSE THEN
    RAISE EXCEPTION 'Cannot delete node with children. Use cascade option or delete children first.';
  END IF;

  -- Delete (CASCADE will handle children if foreign key is set)
  IF _cascade THEN
    DELETE FROM orgcharts WHERE id IN (
      WITH RECURSIVE descendants AS (
        SELECT id FROM orgcharts WHERE id = _node_id
        UNION ALL
        SELECT o.id FROM orgcharts o
        INNER JOIN descendants d ON o.parent_id = d.id
      )
      SELECT id FROM descendants
    );
  ELSE
    DELETE FROM orgcharts WHERE id = _node_id;
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'message', 'Node deleted');
END;
$$;

-- ============================================
-- 9. GET ALL ORGCHARTS FOR COMPANY
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.get_all_orgcharts(_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_orgcharts JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'code', code,
      'version', version,
      'status', status,
      'createdAt', EXTRACT(EPOCH FROM created_at)::BIGINT * 1000,
      'updatedAt', EXTRACT(EPOCH FROM updated_at)::BIGINT * 1000
    )
    ORDER BY created_at DESC
  ) INTO v_orgcharts
  FROM orgcharts
  WHERE company_id = _company_id AND type = 'orgchart';

  RETURN COALESCE(v_orgcharts, '[]'::JSONB);
END;
$$;

-- ============================================
-- 10. UPDATE STATUS (for approval workflow)
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.update_status(_orgchart_id UUID, _status TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF _status NOT IN ('draft', 'pending_approval', 'approved', 'revoked') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE orgcharts
  SET status = _status, updated_at = NOW()
  WHERE id = _orgchart_id AND type = 'orgchart';

  RETURN jsonb_build_object('success', TRUE, 'status', _status);
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION orgchart.create_orgchart IS 'Create root organizational chart';
COMMENT ON FUNCTION orgchart.create_department IS 'Create department (auto-creates head position)';
COMMENT ON FUNCTION orgchart.create_position IS 'Create position within department';
COMMENT ON FUNCTION orgchart.create_appointment IS 'Appoint user to position';
COMMENT ON FUNCTION orgchart.remove_appointment IS 'Remove appointment from position';
COMMENT ON FUNCTION orgchart.get_tree IS 'Get complete orgchart tree with all descendants';
COMMENT ON FUNCTION orgchart.update_node IS 'Update any node (orgchart/department/position)';
COMMENT ON FUNCTION orgchart.delete_node IS 'Delete node (with optional cascade)';
COMMENT ON FUNCTION orgchart.get_all_orgcharts IS 'Get all orgcharts for company';
COMMENT ON FUNCTION orgchart.update_status IS 'Update orgchart status (approval workflow)';
