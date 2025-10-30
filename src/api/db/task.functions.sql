-- ============================================
-- TASK MODULE - PostgreSQL Functions
-- ============================================
-- All business logic for tasks is in PostgreSQL

CREATE SCHEMA IF NOT EXISTS task;

-- ============================================
-- 1. INITIALIZE DEFAULT REVIEW TASKS FOR NEW COMPANY
-- ============================================
CREATE OR REPLACE FUNCTION task.initialize_review_tasks(
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
  v_document_names TEXT[] := ARRAY[
    'Department Charter',
    'Job Description',
    'Job Offer',
    'Employment Contract',
    'Termination Notice',
    'Organizational Chart'
  ];
  v_document_type TEXT;
  v_document_name TEXT;
  v_task_id UUID;
  v_task_text_id TEXT;
  v_matrix_id UUID;
  v_created_tasks JSONB := '[]'::JSONB;
  v_idx INT := 1;
BEGIN
  -- Create review task for each document type's DoA matrix
  FOREACH v_document_type IN ARRAY v_document_types
  LOOP
    v_document_name := v_document_names[v_idx];
    v_idx := v_idx + 1;

    -- Get the matrix ID for this document type
    SELECT id INTO v_matrix_id
    FROM approval_matrices
    WHERE company_id = _company_id
      AND document_type = v_document_type
      AND is_active = true
    LIMIT 1;

    IF v_matrix_id IS NOT NULL THEN
      v_task_id := gen_random_uuid();
      v_task_text_id := 'task_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || v_task_id::TEXT;

      INSERT INTO tasks (
        id, _id, type, company_id, creator_id,
        title, description, task_type, priority,
        assignees, deadline, completed,
        entity_type, entity_id,
        metadata,
        created_at, updated_at
      ) VALUES (
        v_task_id,
        v_task_text_id,
        'review_task',
        _company_id,
        _owner_user_id,
        'Review DoA Matrix: ' || v_document_name,
        'Please review and approve the Delegation of Authority matrix for ' || v_document_name || '. This defines who needs to approve ' || LOWER(v_document_name) || ' documents in your organization.',
        'review_doa_matrix',
        'high',
        jsonb_build_array(
          jsonb_build_object(
            'type', 'user',
            'id', _owner_user_id,
            'name', 'Owner'
          )
        ),
        NOW() + INTERVAL '30 days', -- 30 days deadline
        false,
        'approval_matrix',
        v_matrix_id::TEXT,
        jsonb_build_object(
          'documentType', v_document_type,
          'matrixId', v_matrix_id
        ),
        NOW(),
        NOW()
      );

      -- Add to result array
      v_created_tasks := v_created_tasks || jsonb_build_object(
        '_id', v_task_text_id,
        'id', v_task_id,
        'documentType', v_document_type,
        'matrixId', v_matrix_id
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Review tasks initialized',
    'tasks', v_created_tasks
  );
END;
$$;

-- ============================================
-- 2. CREATE TASK
-- ============================================
CREATE OR REPLACE FUNCTION task.create_task(
  _company_id UUID,
  _creator_id TEXT,
  _title TEXT,
  _description TEXT,
  _assignees JSONB,
  _deadline TIMESTAMP DEFAULT NULL,
  _task_type TEXT DEFAULT 'manual',
  _priority TEXT DEFAULT 'medium',
  _approvers JSONB DEFAULT '[]'::JSONB,
  _attachments JSONB DEFAULT '[]'::JSONB,
  _workflow_id UUID DEFAULT NULL,
  _entity_type TEXT DEFAULT NULL,
  _entity_id TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_task_id UUID;
  v_task_text_id TEXT;
  v_type TEXT;
BEGIN
  v_task_id := gen_random_uuid();
  v_task_text_id := 'task_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || v_task_id::TEXT;

  -- Determine task type based on task_type
  v_type := CASE
    WHEN _task_type IN ('approval_request', 'approval_response') THEN 'approval_task'
    WHEN _task_type = 'review_doa_matrix' THEN 'review_task'
    ELSE 'manual_task'
  END;

  INSERT INTO tasks (
    id, _id, type, company_id, creator_id,
    title, description, task_type, priority,
    assignees, approvers, attachments, deadline,
    completed, workflow_id, entity_type, entity_id,
    metadata, created_at, updated_at
  ) VALUES (
    v_task_id,
    v_task_text_id,
    v_type,
    _company_id,
    _creator_id,
    _title,
    _description,
    _task_type,
    _priority,
    _assignees,
    _approvers,
    _attachments,
    _deadline,
    false,
    _workflow_id,
    _entity_type,
    _entity_id,
    _metadata,
    NOW(),
    NOW()
  );

  RETURN jsonb_build_object(
    '_id', v_task_text_id,
    'id', v_task_id,
    'type', v_type,
    'companyId', _company_id,
    'creatorId', _creator_id,
    'title', _title,
    'description', _description,
    'taskType', _task_type,
    'priority', _priority,
    'assignees', _assignees,
    'approvers', _approvers,
    'attachments', _attachments,
    'deadline', EXTRACT(EPOCH FROM _deadline)::BIGINT * 1000,
    'completed', false,
    'workflowId', _workflow_id,
    'entityType', _entity_type,
    'entityId', _entity_id,
    'metadata', _metadata,
    'createdAt', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 3. GET USER TASKS
-- ============================================
CREATE OR REPLACE FUNCTION task.get_user_tasks(
  _user_id TEXT,
  _company_id TEXT,
  _include_completed BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_uuid UUID;
  v_tasks JSONB;
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
      'creatorId', creator_id,
      'title', title,
      'description', description,
      'taskType', task_type,
      'priority', priority,
      'assignees', assignees,
      'approvers', approvers,
      'attachments', attachments,
      'deadline', EXTRACT(EPOCH FROM deadline)::BIGINT * 1000,
      'completed', completed,
      'completedAt', EXTRACT(EPOCH FROM completed_at)::BIGINT * 1000,
      'approvalStatus', approval_status,
      'workflowId', workflow_id,
      'entityType', entity_type,
      'entityId', entity_id,
      'documentType', document_type,
      'metadata', metadata,
      'createdAt', EXTRACT(EPOCH FROM created_at)::BIGINT * 1000,
      'updatedAt', EXTRACT(EPOCH FROM updated_at)::BIGINT * 1000
    )
    ORDER BY
      completed ASC,
      CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      deadline ASC NULLS LAST,
      created_at DESC
  ) INTO v_tasks
  FROM tasks
  WHERE company_id = v_company_uuid
    AND (
      -- User is in assignees
      assignees @> jsonb_build_array(jsonb_build_object('id', _user_id))
      OR assignees @> jsonb_build_array(jsonb_build_object('userId', _user_id))
      -- Or user is in approvers
      OR approvers @> jsonb_build_array(jsonb_build_object('userId', _user_id))
      -- Or user is creator
      OR creator_id = _user_id
    )
    AND (_include_completed = true OR completed = false);

  RETURN COALESCE(v_tasks, '[]'::JSONB);
END;
$$;

-- ============================================
-- 4. UPDATE TASK
-- ============================================
CREATE OR REPLACE FUNCTION task.update_task(
  _task_id UUID,
  _title TEXT DEFAULT NULL,
  _description TEXT DEFAULT NULL,
  _assignees JSONB DEFAULT NULL,
  _approvers JSONB DEFAULT NULL,
  _deadline TIMESTAMP DEFAULT NULL,
  _priority TEXT DEFAULT NULL,
  _completed BOOLEAN DEFAULT NULL,
  _approval_status TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_task RECORD;
BEGIN
  UPDATE tasks
  SET
    title = COALESCE(_title, title),
    description = COALESCE(_description, description),
    assignees = COALESCE(_assignees, assignees),
    approvers = COALESCE(_approvers, approvers),
    deadline = COALESCE(_deadline, deadline),
    priority = COALESCE(_priority, priority),
    completed = COALESCE(_completed, completed),
    approval_status = COALESCE(_approval_status, approval_status),
    metadata = COALESCE(_metadata, metadata),
    updated_at = NOW()
  WHERE id = _task_id;

  SELECT * INTO v_task FROM tasks WHERE id = _task_id;

  IF v_task.id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  RETURN jsonb_build_object(
    '_id', v_task._id,
    'id', v_task.id,
    'type', v_task.type,
    'companyId', v_task.company_id,
    'creatorId', v_task.creator_id,
    'title', v_task.title,
    'description', v_task.description,
    'taskType', v_task.task_type,
    'priority', v_task.priority,
    'assignees', v_task.assignees,
    'approvers', v_task.approvers,
    'attachments', v_task.attachments,
    'deadline', EXTRACT(EPOCH FROM v_task.deadline)::BIGINT * 1000,
    'completed', v_task.completed,
    'completedAt', EXTRACT(EPOCH FROM v_task.completed_at)::BIGINT * 1000,
    'approvalStatus', v_task.approval_status,
    'workflowId', v_task.workflow_id,
    'entityType', v_task.entity_type,
    'entityId', v_task.entity_id,
    'metadata', v_task.metadata,
    'createdAt', EXTRACT(EPOCH FROM v_task.created_at)::BIGINT * 1000,
    'updatedAt', EXTRACT(EPOCH FROM v_task.updated_at)::BIGINT * 1000
  );
END;
$$;

-- ============================================
-- 5. COMPLETE TASK
-- ============================================
CREATE OR REPLACE FUNCTION task.complete_task(_task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE tasks
  SET completed = true, updated_at = NOW()
  WHERE id = _task_id;

  RETURN task.update_task(_task_id);
END;
$$;

-- ============================================
-- 6. DELETE TASK
-- ============================================
CREATE OR REPLACE FUNCTION task.delete_task(_task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM tasks WHERE id = _task_id;

  RETURN jsonb_build_object('success', TRUE, 'message', 'Task deleted successfully');
END;
$$;

-- ============================================
-- 7. GET PENDING TASKS
-- ============================================
CREATE OR REPLACE FUNCTION task.get_pending_tasks(
  _user_id TEXT,
  _company_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN task.get_user_tasks(_user_id, _company_id, false);
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION task.initialize_review_tasks IS 'Initialize review tasks for DoA matrices when a company is created';
COMMENT ON FUNCTION task.create_task IS 'Create a new task';
COMMENT ON FUNCTION task.get_user_tasks IS 'Get all tasks for a user in a company';
COMMENT ON FUNCTION task.update_task IS 'Update a task';
COMMENT ON FUNCTION task.complete_task IS 'Mark a task as completed';
COMMENT ON FUNCTION task.delete_task IS 'Delete a task';
COMMENT ON FUNCTION task.get_pending_tasks IS 'Get pending (incomplete) tasks for a user';
