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
  _company_id TEXT,
  _user_id TEXT,
  _title TEXT,
  _description TEXT DEFAULT NULL,
  _code TEXT DEFAULT NULL,
  _version TEXT DEFAULT NULL,
  _status TEXT DEFAULT 'draft'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_user_uuid UUID;
  v_orgchart_id UUID;
  v_orgchart RECORD;
  v_next_version NUMERIC;
  v_version_text TEXT;
  v_metadata JSONB;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

  -- Lookup user UUID from _id (TEXT)
  SELECT id INTO v_user_uuid
  FROM users
  WHERE _id = _user_id;

  IF v_user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not found: %', _user_id;
  END IF;

  -- Validate status
  IF _status NOT IN ('draft', 'pending_approval', 'approved', 'revoked') THEN
    RAISE EXCEPTION 'Invalid status. Must be one of: draft, pending_approval, approved, revoked';
  END IF;

  -- Auto-calculate next version if not provided
  IF _version IS NULL THEN
    SELECT COALESCE(MAX((metadata->>'version')::NUMERIC), 0) + 0.1
    INTO v_next_version
    FROM orgcharts
    WHERE company_id = v_company_uuid AND type = 'orgchart';

    v_version_text := v_next_version::TEXT;
  ELSE
    v_version_text := _version;
  END IF;

  -- Build metadata JSONB (keeping for backwards compatibility)
  v_metadata := jsonb_build_object(
    'description', _description,
    'code', _code,
    'version', v_version_text
  );

  -- Generate ID
  v_orgchart_id := gen_random_uuid();

  -- Insert orgchart
  INSERT INTO orgcharts (
    id, company_id, type, title, description, code, version, metadata,
    status, level, sort_order, created_at, updated_at
  ) VALUES (
    v_orgchart_id, v_company_uuid, 'orgchart', _title, _description, _code, v_version_text, v_metadata,
    _status, 0, 0, NOW(), NOW()
  ) RETURNING * INTO v_orgchart;

  -- Audit logging
  PERFORM audit.log_action(
    _user_id,           -- TEXT ID, не UUID
    'CREATE',
    'orgcharts',
    v_orgchart_id::TEXT,
    v_company_uuid,
    NULL,
    row_to_json(v_orgchart)::JSONB,
    NULL, NULL, NULL,
    'Orgchart created: ' || _title
  );

  RETURN jsonb_build_object(
    'id', v_orgchart.id,
    'companyId', v_orgchart.company_id,
    'type', v_orgchart.type,
    'title', v_orgchart.title,
    'description', v_orgchart.description,
    'code', v_orgchart.code,
    'version', v_orgchart.version,
    'metadata', v_orgchart.metadata,
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
  _company_id TEXT,
  _user_id TEXT,
  _parent_id UUID,
  _title TEXT,
  _description TEXT DEFAULT NULL,
  _code TEXT DEFAULT NULL,
  _headcount INTEGER DEFAULT 0,
  _charter_mission TEXT DEFAULT NULL,
  _charter_objectives TEXT[] DEFAULT NULL,
  _charter_responsibilities TEXT[] DEFAULT NULL,
  _charter_kpis TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_user_uuid UUID;
  v_department_id UUID;
  v_head_position_id UUID;
  v_parent_level INT;
  v_department RECORD;
  v_head_position RECORD;
  v_metadata JSONB;
  v_charter_data JSONB;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

  -- Lookup user UUID from _id (TEXT)
  SELECT id INTO v_user_uuid
  FROM users
  WHERE _id = _user_id;

  IF v_user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not found: %', _user_id;
  END IF;

  -- Get parent level
  SELECT level INTO v_parent_level FROM orgcharts WHERE id = _parent_id;

  IF v_parent_level IS NULL THEN
    RAISE EXCEPTION 'Parent not found';
  END IF;

  -- Build metadata JSONB
  v_metadata := jsonb_build_object(
    'description', _description,
    'code', _code
  );

  -- Build charter_data JSONB
  v_charter_data := jsonb_build_object(
    'mission', _charter_mission,
    'objectives', COALESCE(to_jsonb(_charter_objectives), '[]'::jsonb),
    'responsibilities', COALESCE(to_jsonb(_charter_responsibilities), '[]'::jsonb),
    'kpis', COALESCE(to_jsonb(_charter_kpis), '[]'::jsonb)
  );

  -- Generate IDs
  v_department_id := gen_random_uuid();
  v_head_position_id := gen_random_uuid();

  -- Insert department WITHOUT head_position_id first (to avoid FK constraint violation)
  INSERT INTO orgcharts (
    id, company_id, type, title, metadata, parent_id,
    headcount, headcount_filled, headcount_unfilled, charter_data,
    level, sort_order, created_at, updated_at
  ) VALUES (
    v_department_id, v_company_uuid, 'department', _title, v_metadata, _parent_id,
    _headcount, 0, _headcount, v_charter_data,
    v_parent_level + 1, 0, NOW(), NOW()
  );

  -- Auto-create head position
  INSERT INTO orgcharts (
    id, company_id, type, title, parent_id, is_vacant,
    level, sort_order, created_at, updated_at
  ) VALUES (
    v_head_position_id, v_company_uuid, 'position',
    'Head of ' || _title, v_department_id, TRUE,
    v_parent_level + 2, 0, NOW(), NOW()
  ) RETURNING * INTO v_head_position;

  -- Now update department with head_position_id
  UPDATE orgcharts
  SET head_position_id = v_head_position_id,
      updated_at = NOW()
  WHERE id = v_department_id
  RETURNING * INTO v_department;

  -- Audit logging
  PERFORM audit.log_action(
    _user_id,           -- TEXT ID, не UUID
    'CREATE',
    'orgcharts',
    v_department_id::TEXT,
    v_company_uuid,
    NULL,
    row_to_json(v_department)::JSONB,
    NULL, NULL, NULL,
    'Department created: ' || _title
  );

  RETURN jsonb_build_object(
    'department', jsonb_build_object(
      'id', v_department.id,
      'companyId', v_department.company_id,
      'type', v_department.type,
      'title', v_department.title,
      'metadata', v_department.metadata,
      'parentId', v_department.parent_id,
      'headPositionId', v_department.head_position_id,
      'headcount', v_department.headcount,
      'headcountFilled', v_department.headcount_filled,
      'headcountUnfilled', v_department.headcount_unfilled,
      'charterData', v_department.charter_data,
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
  _company_id TEXT,
  _user_id TEXT,
  _parent_id UUID,
  _title TEXT,
  _description TEXT DEFAULT NULL,
  _salary_min INTEGER DEFAULT NULL,
  _salary_max INTEGER DEFAULT NULL,
  _salary_currency TEXT DEFAULT 'USD',
  _salary_frequency TEXT DEFAULT 'annual',
  _job_summary TEXT DEFAULT NULL,
  _job_responsibilities TEXT[] DEFAULT NULL,
  _job_requirements TEXT[] DEFAULT NULL,
  _job_qualifications TEXT[] DEFAULT NULL,
  _job_benefits TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_user_uuid UUID;
  v_position_id UUID;
  v_parent_level INT;
  v_position RECORD;
  v_metadata JSONB;
  v_compensation_data JSONB;
  v_job_description_data JSONB;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

  -- Lookup user UUID from _id (TEXT)
  SELECT id INTO v_user_uuid
  FROM users
  WHERE _id = _user_id;

  IF v_user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not found: %', _user_id;
  END IF;

  SELECT level INTO v_parent_level FROM orgcharts WHERE id = _parent_id;

  IF v_parent_level IS NULL THEN
    RAISE EXCEPTION 'Parent department not found';
  END IF;

  -- Build metadata JSONB
  v_metadata := jsonb_build_object(
    'description', _description
  );

  -- Build compensation_data JSONB
  v_compensation_data := jsonb_build_object(
    'salary_min', _salary_min,
    'salary_max', _salary_max,
    'currency', _salary_currency,
    'frequency', _salary_frequency
  );

  -- Build job_description_data JSONB
  v_job_description_data := jsonb_build_object(
    'summary', _job_summary,
    'responsibilities', COALESCE(to_jsonb(_job_responsibilities), '[]'::jsonb),
    'requirements', COALESCE(to_jsonb(_job_requirements), '[]'::jsonb),
    'qualifications', COALESCE(to_jsonb(_job_qualifications), '[]'::jsonb),
    'benefits', COALESCE(to_jsonb(_job_benefits), '[]'::jsonb)
  );

  v_position_id := gen_random_uuid();

  INSERT INTO orgcharts (
    id, company_id, type, title, metadata, parent_id,
    compensation_data, job_description_data, is_vacant,
    level, sort_order, created_at, updated_at
  ) VALUES (
    v_position_id, v_company_uuid, 'position', _title, v_metadata, _parent_id,
    v_compensation_data, v_job_description_data, TRUE,
    v_parent_level + 1, 0, NOW(), NOW()
  ) RETURNING * INTO v_position;

  -- Audit logging
  PERFORM audit.log_action(
    _user_id,           -- TEXT ID, не UUID
    'CREATE',
    'orgcharts',
    v_position_id::TEXT,
    v_company_uuid,
    NULL,
    row_to_json(v_position)::JSONB,
    NULL, NULL, NULL,
    'Position created: ' || _title
  );

  RETURN jsonb_build_object(
    'id', v_position.id,
    'companyId', v_position.company_id,
    'type', v_position.type,
    'title', v_position.title,
    'metadata', v_position.metadata,
    'parentId', v_position.parent_id,
    'compensationData', v_position.compensation_data,
    'jobDescriptionData', v_position.job_description_data,
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
  _company_id TEXT,
  _acting_user_id TEXT,
  _position_id UUID,
  _user_id TEXT,
  _appointee_fullname TEXT,
  _appointee_email TEXT,
  _reports_to_position_id UUID DEFAULT NULL,
  _job_offer_salary INTEGER DEFAULT NULL,
  _job_offer_start_date TIMESTAMP DEFAULT NULL,
  _job_offer_benefits TEXT[] DEFAULT NULL,
  _job_offer_conditions TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_acting_user_uuid UUID;
  v_user_uuid UUID;
  v_position RECORD;
  v_orgchart_id UUID;
  v_appointment_data JSONB;
  v_job_offer JSONB;
  v_history_id UUID;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

  -- Lookup acting user UUID from _id (TEXT)
  SELECT id INTO v_acting_user_uuid
  FROM users
  WHERE _id = _acting_user_id;

  IF v_acting_user_uuid IS NULL THEN
    RAISE EXCEPTION 'Acting user not found: %', _acting_user_id;
  END IF;

  -- Lookup appointee user UUID from _id (TEXT)
  SELECT id INTO v_user_uuid
  FROM users
  WHERE _id = _user_id;

  IF v_user_uuid IS NULL THEN
    RAISE EXCEPTION 'Appointee user not found: %', _user_id;
  END IF;

  -- Check if position exists and is vacant
  SELECT * INTO v_position FROM orgcharts WHERE id = _position_id AND type = 'position';

  IF v_position.id IS NULL THEN
    RAISE EXCEPTION 'Position not found';
  END IF;

  IF v_position.is_vacant = FALSE THEN
    RAISE EXCEPTION 'Position is already filled';
  END IF;

  -- Get orgchart_id (root parent)
  SELECT id INTO v_orgchart_id
  FROM orgcharts
  WHERE company_id = v_company_uuid AND type = 'orgchart' AND parent_id IS NULL
  LIMIT 1;

  -- Build job_offer JSONB
  v_job_offer := jsonb_build_object(
    'salary', _job_offer_salary,
    'start_date', EXTRACT(EPOCH FROM _job_offer_start_date)::BIGINT * 1000,
    'benefits', COALESCE(to_jsonb(_job_offer_benefits), '[]'::jsonb),
    'conditions', COALESCE(to_jsonb(_job_offer_conditions), '[]'::jsonb)
  );

  -- Build appointment_data JSONB
  v_appointment_data := jsonb_build_object(
    'user_id', _user_id,
    'fullname', _appointee_fullname,
    'email', _appointee_email,
    'appointed_at', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
    'reports_to_position_id', _reports_to_position_id::TEXT,
    'job_offer', v_job_offer
  );

  -- Update position with appointment (JSONB + legacy columns)
  UPDATE orgcharts
  SET
    appointee_user_id = v_user_uuid,
    appointee_fullname = _appointee_fullname,
    appointee_email = _appointee_email,
    is_vacant = FALSE,
    appointed_at = NOW(),
    appointment_data = v_appointment_data,
    updated_at = NOW()
  WHERE id = _position_id
  RETURNING * INTO v_position;

  -- Create appointment history record
  INSERT INTO orgchart_appointment_history (
    company_id, orgchart_id, position_id, user_id,
    fullname, email, reports_to_position_id, job_offer_data,
    appointed_at, created_at, updated_at
  ) VALUES (
    v_company_uuid, v_orgchart_id, _position_id, v_user_uuid,
    _appointee_fullname, _appointee_email, _reports_to_position_id, v_job_offer,
    NOW(), NOW(), NOW()
  ) RETURNING id INTO v_history_id;

  -- Update parent department headcount
  UPDATE orgcharts
  SET
    headcount_filled = headcount_filled + 1,
    headcount_unfilled = GREATEST(headcount_unfilled - 1, 0),
    updated_at = NOW()
  WHERE id = v_position.parent_id AND type IN ('department', 'division', 'unit');

  -- Audit logging
  PERFORM audit.log_action(
    _acting_user_id,    -- TEXT ID, не UUID
    'CREATE',
    'orgchart_appointment_history',
    v_history_id::TEXT,
    v_company_uuid,
    NULL,
    v_appointment_data,
    NULL, NULL, NULL,
    'Appointment created for position: ' || v_position.title || ', user: ' || _appointee_fullname
  );

  RETURN jsonb_build_object(
    'id', v_position.id,
    'appointmentData', v_position.appointment_data,
    'isVacant', v_position.is_vacant,
    'historyId', v_history_id
  );
END;
$$;

-- ============================================
-- 5. REMOVE APPOINTMENT
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.remove_appointment(
  _company_id TEXT,
  _acting_user_id TEXT,
  _position_id UUID,
  _end_reason TEXT DEFAULT 'resigned'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_acting_user_uuid UUID;
  v_position RECORD;
  v_old_appointment_data JSONB;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

  -- Lookup acting user UUID from _id (TEXT)
  SELECT id INTO v_acting_user_uuid
  FROM users
  WHERE _id = _acting_user_id;

  IF v_acting_user_uuid IS NULL THEN
    RAISE EXCEPTION 'Acting user not found: %', _acting_user_id;
  END IF;
  SELECT * INTO v_position FROM orgcharts WHERE id = _position_id AND type = 'position';

  IF v_position.id IS NULL THEN
    RAISE EXCEPTION 'Position not found';
  END IF;

  IF v_position.is_vacant = TRUE THEN
    RAISE EXCEPTION 'Position is already vacant';
  END IF;

  -- Save old appointment data for audit
  v_old_appointment_data := v_position.appointment_data;

  -- Update appointment history to mark as ended
  UPDATE orgchart_appointment_history
  SET
    ended_at = NOW(),
    end_reason = _end_reason,
    updated_at = NOW()
  WHERE position_id = _position_id
    AND user_id = v_position.appointee_user_id
    AND ended_at IS NULL;

  -- Clear position appointment (JSONB + legacy columns)
  UPDATE orgcharts
  SET
    appointee_user_id = NULL,
    appointee_fullname = NULL,
    appointee_email = NULL,
    is_vacant = TRUE,
    appointed_at = NULL,
    appointment_data = NULL,
    updated_at = NOW()
  WHERE id = _position_id;

  -- Update parent department headcount
  UPDATE orgcharts
  SET
    headcount_filled = GREATEST(headcount_filled - 1, 0),
    headcount_unfilled = headcount_unfilled + 1,
    updated_at = NOW()
  WHERE id = v_position.parent_id AND type IN ('department', 'division', 'unit');

  -- Audit logging
  PERFORM audit.log_action(
    _acting_user_id,    -- TEXT ID, не UUID
    'DELETE',
    'orgcharts',
    _position_id::TEXT,
    v_company_uuid,
    v_old_appointment_data,
    NULL,
    NULL, NULL, NULL,
    'Appointment removed from position: ' || v_position.title || ', reason: ' || _end_reason
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Appointment removed',
    'endReason', _end_reason
  );
END;
$$;

-- ============================================
-- 6. GET ORGCHART TREE
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.get_tree(_company_id TEXT, _orgchart_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_tree JSONB;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

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
    WHERE id = _orgchart_id AND company_id = v_company_uuid

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
    WHERE o.company_id = v_company_uuid
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      '_id',
        CASE type
          WHEN 'orgchart' THEN 'orgchart_' || id::TEXT
          WHEN 'department' THEN 'department_' || id::TEXT
          WHEN 'position' THEN 'position_' || id::TEXT
          WHEN 'appointment' THEN 'appointment_' || id::TEXT
          ELSE id::TEXT
        END,
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
      'hasChildren', EXISTS(
        SELECT 1 FROM orgcharts children
        WHERE children.parent_id = org_tree.id
        AND children.company_id = v_company_uuid
      ),
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
CREATE OR REPLACE FUNCTION orgchart.get_all_orgcharts(_company_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_orgcharts JSONB;
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
  WHERE company_id = v_company_uuid AND type = 'orgchart';

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
-- 11. DUPLICATE ORGCHART
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.duplicate_orgchart(
  _company_id TEXT,
  _orgchart_id UUID,
  _new_title TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_source_orgchart RECORD;
  v_new_orgchart_id UUID;
  v_new_version NUMERIC;
  v_version_text TEXT;
  v_title TEXT;
  v_new_orgchart RECORD;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

  -- Get source orgchart
  SELECT * INTO v_source_orgchart
  FROM orgcharts
  WHERE id = _orgchart_id AND company_id = v_company_uuid AND type = 'orgchart';

  IF v_source_orgchart.id IS NULL THEN
    RAISE EXCEPTION 'Source orgchart not found';
  END IF;

  -- Calculate next version
  SELECT COALESCE(MAX(version::NUMERIC), 0) + 0.1
  INTO v_new_version
  FROM orgcharts
  WHERE company_id = v_company_uuid AND type = 'orgchart';

  v_version_text := v_new_version::TEXT;

  -- Determine title
  IF _new_title IS NOT NULL THEN
    v_title := _new_title;
  ELSE
    v_title := v_source_orgchart.title || ' (Copy)';
  END IF;

  -- Generate new ID
  v_new_orgchart_id := gen_random_uuid();

  -- Create new orgchart with same properties
  INSERT INTO orgcharts (
    id, company_id, type, title, description, code, version,
    status, level, sort_order, created_at, updated_at
  ) VALUES (
    v_new_orgchart_id,
    v_company_uuid,
    'orgchart',
    v_title,
    v_source_orgchart.description,
    v_source_orgchart.code,
    v_version_text,
    'draft', -- Always create duplicates as draft
    0,
    0,
    NOW(),
    NOW()
  ) RETURNING * INTO v_new_orgchart;

  -- TODO: In the future, we could also duplicate the entire tree structure (departments, positions)
  -- For now, we just duplicate the root orgchart

  RETURN jsonb_build_object(
    'id', v_new_orgchart.id,
    'companyId', v_new_orgchart.company_id,
    'type', v_new_orgchart.type,
    'title', v_new_orgchart.title,
    'description', v_new_orgchart.description,
    'code', v_new_orgchart.code,
    'version', v_new_orgchart.version,
    'status', v_new_orgchart.status,
    'level', v_new_orgchart.level,
    'sortOrder', v_new_orgchart.sort_order,
    'createdAt', EXTRACT(EPOCH FROM v_new_orgchart.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_new_orgchart.updated_at)::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
-- ============================================
-- 12. GET APPOINTMENT HISTORY FOR POSITION
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.get_appointment_history(_position_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_history JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'userId', user_id,
      'fullname', fullname,
      'email', email,
      'reportsToPositionId', reports_to_position_id,
      'jobOfferData', job_offer_data,
      'appointedAt', EXTRACT(EPOCH FROM appointed_at)::BIGINT * 1000,
      'endedAt', EXTRACT(EPOCH FROM ended_at)::BIGINT * 1000,
      'endReason', end_reason,
      'createdAt', EXTRACT(EPOCH FROM created_at)::BIGINT * 1000
    )
    ORDER BY appointed_at DESC
  ) INTO v_history
  FROM orgchart_appointment_history
  WHERE position_id = _position_id;

  RETURN COALESCE(v_history, '[]'::JSONB);
END;
$$;

-- ============================================
-- 13. GET DIRECT REPORTS (Hierarchical Reporting)
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.get_direct_reports(_position_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reports JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'title', o.title,
      'isVacant', o.is_vacant,
      'appointmentData', o.appointment_data,
      'createdAt', EXTRACT(EPOCH FROM o.created_at)::BIGINT * 1000
    )
    ORDER BY o.title
  ) INTO v_reports
  FROM orgcharts o
  WHERE o.type = 'position'
    AND o.is_vacant = FALSE
    AND (o.appointment_data->>'reports_to_position_id')::UUID = _position_id;

  RETURN COALESCE(v_reports, '[]'::JSONB);
END;
$$;

-- ============================================
-- 14. GET REPORTING CHAIN (Position -> Manager -> Director -> ...)
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.get_reporting_chain(_position_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_chain JSONB;
BEGIN
  WITH RECURSIVE reporting_chain AS (
    -- Base case: start with the given position
    SELECT
      o.id,
      o.title,
      o.type,
      o.appointment_data,
      (o.appointment_data->>'reports_to_position_id')::UUID AS reports_to_id,
      1 AS depth
    FROM orgcharts o
    WHERE o.id = _position_id

    UNION ALL

    -- Recursive case: get the manager
    SELECT
      o.id,
      o.title,
      o.type,
      o.appointment_data,
      (o.appointment_data->>'reports_to_position_id')::UUID AS reports_to_id,
      rc.depth + 1
    FROM orgcharts o
    INNER JOIN reporting_chain rc ON o.id = rc.reports_to_id
    WHERE rc.depth < 20  -- Prevent infinite loops
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'type', type,
      'appointmentData', appointment_data,
      'reportsToId', reports_to_id,
      'depth', depth
    )
    ORDER BY depth
  ) INTO v_chain
  FROM reporting_chain;

  RETURN COALESCE(v_chain, '[]'::JSONB);
END;
$$;

-- ============================================
-- 15. TRANSFER APPOINTMENT (Move user to different position)
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.transfer_appointment(
  _company_id TEXT,
  _acting_user_id TEXT,
  _from_position_id UUID,
  _to_position_id UUID,
  _transfer_reason TEXT DEFAULT 'transferred',
  _new_reports_to_position_id UUID DEFAULT NULL,
  _new_job_offer_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_acting_user_uuid UUID;
  v_from_position RECORD;
  v_to_position RECORD;
  v_user_id UUID;
  v_user_text_id TEXT;
  v_fullname TEXT;
  v_email TEXT;
  v_appointment_data JSONB;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

  -- Lookup acting user UUID from _id (TEXT)
  SELECT id INTO v_acting_user_uuid
  FROM users
  WHERE _id = _acting_user_id;

  IF v_acting_user_uuid IS NULL THEN
    RAISE EXCEPTION 'Acting user not found: %', _acting_user_id;
  END IF;
  -- Get source position
  SELECT * INTO v_from_position
  FROM orgcharts
  WHERE id = _from_position_id AND type = 'position';

  IF v_from_position.id IS NULL THEN
    RAISE EXCEPTION 'Source position not found';
  END IF;

  IF v_from_position.is_vacant = TRUE THEN
    RAISE EXCEPTION 'Source position is vacant';
  END IF;

  -- Get destination position
  SELECT * INTO v_to_position
  FROM orgcharts
  WHERE id = _to_position_id AND type = 'position';

  IF v_to_position.id IS NULL THEN
    RAISE EXCEPTION 'Destination position not found';
  END IF;

  IF v_to_position.is_vacant = FALSE THEN
    RAISE EXCEPTION 'Destination position is already filled';
  END IF;

  -- Extract user info from source position
  v_user_id := v_from_position.appointee_user_id;
  v_fullname := v_from_position.appointee_fullname;
  v_email := v_from_position.appointee_email;

  -- Get user TEXT ID
  SELECT _id INTO v_user_text_id
  FROM users
  WHERE id = v_user_id;

  -- Remove from old position
  PERFORM orgchart.remove_appointment(
    _company_id,
    _acting_user_id,
    _from_position_id,
    _transfer_reason
  );

  -- Create appointment at new position
  PERFORM orgchart.create_appointment(
    _company_id,
    _acting_user_id,
    _to_position_id,
    v_user_text_id,
    v_fullname,
    v_email,
    COALESCE(_new_reports_to_position_id, (v_from_position.appointment_data->>'reports_to_position_id')::UUID),
    (COALESCE(_new_job_offer_data, v_from_position.appointment_data->'job_offer')->>'salary')::INTEGER,
    to_timestamp((COALESCE(_new_job_offer_data, v_from_position.appointment_data->'job_offer')->>'start_date')::BIGINT / 1000),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_new_job_offer_data, v_from_position.appointment_data->'job_offer')->'benefits'))::TEXT[],
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_new_job_offer_data, v_from_position.appointment_data->'job_offer')->'conditions'))::TEXT[]
  );

  -- Audit logging
  PERFORM audit.log_action(
    _acting_user_id,    -- TEXT ID, не UUID
    'UPDATE',
    'orgcharts',
    _to_position_id::TEXT,
    v_company_uuid,
    NULL,
    jsonb_build_object(
      'action', 'transfer',
      'fromPositionId', _from_position_id,
      'toPositionId', _to_position_id,
      'userId', v_user_id,
      'reason', _transfer_reason
    ),
    NULL, NULL, NULL,
    'Appointment transferred from ' || v_from_position.title || ' to ' || v_to_position.title
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Appointment transferred',
    'fromPositionId', _from_position_id,
    'toPositionId', _to_position_id,
    'userId', v_user_id
  );
END;
$$;

-- ============================================
-- 16. UPDATE JOB OFFER FOR CURRENT APPOINTMENT
-- ============================================
CREATE OR REPLACE FUNCTION orgchart.update_job_offer(
  _company_id TEXT,
  _acting_user_id TEXT,
  _position_id UUID,
  _job_offer_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_acting_user_uuid UUID;
  v_position RECORD;
  v_old_appointment_data JSONB;
  v_new_appointment_data JSONB;
BEGIN
  -- Lookup company UUID from _id (TEXT)
  SELECT id INTO v_company_uuid
  FROM companies
  WHERE _id = _company_id;

  IF v_company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', _company_id;
  END IF;

  -- Lookup acting user UUID from _id (TEXT)
  SELECT id INTO v_acting_user_uuid
  FROM users
  WHERE _id = _acting_user_id;

  IF v_acting_user_uuid IS NULL THEN
    RAISE EXCEPTION 'Acting user not found: %', _acting_user_id;
  END IF;
  -- Get position
  SELECT * INTO v_position
  FROM orgcharts
  WHERE id = _position_id AND type = 'position';

  IF v_position.id IS NULL THEN
    RAISE EXCEPTION 'Position not found';
  END IF;

  IF v_position.is_vacant = TRUE THEN
    RAISE EXCEPTION 'Position is vacant';
  END IF;

  -- Save old data for audit
  v_old_appointment_data := v_position.appointment_data;

  -- Update job_offer in appointment_data
  v_new_appointment_data := v_position.appointment_data || jsonb_build_object('job_offer', _job_offer_data);

  -- Update position
  UPDATE orgcharts
  SET
    appointment_data = v_new_appointment_data,
    updated_at = NOW()
  WHERE id = _position_id;

  -- Update appointment history
  UPDATE orgchart_appointment_history
  SET
    job_offer_data = _job_offer_data,
    updated_at = NOW()
  WHERE position_id = _position_id
    AND user_id = v_position.appointee_user_id
    AND ended_at IS NULL;

  -- Audit logging
  PERFORM audit.log_action(
    _acting_user_id,    -- TEXT ID, не UUID
    'UPDATE',
    'orgcharts',
    _position_id::TEXT,
    v_company_uuid,
    v_old_appointment_data,
    v_new_appointment_data,
    NULL, NULL, NULL,
    'Job offer updated for position: ' || v_position.title
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Job offer updated',
    'appointmentData', v_new_appointment_data
  );
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION orgchart.create_orgchart(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Create root organizational chart';
COMMENT ON FUNCTION orgchart.create_department(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT[], TEXT[], TEXT[]) IS 'Create department (auto-creates head position)';
COMMENT ON FUNCTION orgchart.create_position(TEXT, TEXT, UUID, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT[], TEXT[]) IS 'Create position within department';
COMMENT ON FUNCTION orgchart.create_appointment(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, UUID, INTEGER, TIMESTAMP, TEXT[], TEXT[]) IS 'Appoint user to position';
COMMENT ON FUNCTION orgchart.remove_appointment(TEXT, TEXT, UUID, TEXT) IS 'Remove appointment from position';
COMMENT ON FUNCTION orgchart.get_tree(TEXT, UUID) IS 'Get complete orgchart tree with all descendants';
COMMENT ON FUNCTION orgchart.update_node(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER, INTEGER, TEXT) IS 'Update any node (orgchart/department/position)';
COMMENT ON FUNCTION orgchart.delete_node(UUID, BOOLEAN) IS 'Delete node (with optional cascade)';
COMMENT ON FUNCTION orgchart.get_all_orgcharts(TEXT) IS 'Get all orgcharts for company';
COMMENT ON FUNCTION orgchart.update_status(UUID, TEXT) IS 'Update orgchart status (approval workflow)';
COMMENT ON FUNCTION orgchart.duplicate_orgchart(TEXT, UUID, TEXT) IS 'Duplicate orgchart with auto-incremented version';
COMMENT ON FUNCTION orgchart.get_appointment_history(UUID) IS 'Get appointment history for a position';
COMMENT ON FUNCTION orgchart.get_direct_reports(UUID) IS 'Get direct reports for a position (hierarchical reporting)';
COMMENT ON FUNCTION orgchart.get_reporting_chain(UUID) IS 'Get full reporting chain from position to top';
COMMENT ON FUNCTION orgchart.transfer_appointment(TEXT, TEXT, UUID, UUID, TEXT, UUID, JSONB) IS 'Transfer appointment from one position to another';
COMMENT ON FUNCTION orgchart.update_job_offer(TEXT, TEXT, UUID, JSONB) IS 'Update job offer for current appointment';
