-- ============================================
-- AUDIT LOGGING SYSTEM - Functions
-- ============================================
-- Функции для работы с аудит-логами

-- ============================================
-- 1. LOG ACTION
-- ============================================
-- Универсальная функция для логирования любых действий
CREATE OR REPLACE FUNCTION audit.log_action(
  _user_id TEXT,
  _action TEXT,
  _table_name TEXT,
  _record_id TEXT,
  _company_id UUID DEFAULT NULL,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL,
  _ip_address INET DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _request_id UUID DEFAULT NULL,
  _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
BEGIN
  -- Get user details
  SELECT email INTO v_user_email FROM users WHERE _id = _user_id;

  -- Get user role in company (if applicable)
  IF _company_id IS NOT NULL THEN
    SELECT role INTO v_user_role
    FROM user_companies
    WHERE user_id = _user_id AND company_id = _company_id;
  END IF;

  -- Insert audit log
  INSERT INTO audit_log (
    user_id, user_email, user_role,
    action, table_name, record_id, company_id,
    old_values, new_values,
    ip_address, user_agent, request_id, notes
  ) VALUES (
    _user_id, v_user_email, v_user_role,
    _action, _table_name, _record_id, _company_id,
    _old_values, _new_values,
    _ip_address, _user_agent, _request_id, _notes
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ============================================
-- 2. SOFT DELETE
-- ============================================
-- Мягкое удаление с сохранением данных
CREATE OR REPLACE FUNCTION audit.soft_delete(
  _table_name TEXT,
  _record_id TEXT,
  _deleted_by TEXT,
  _data_snapshot JSONB,
  _company_id UUID DEFAULT NULL,
  _permanent_delete_after_days INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_soft_delete_id UUID;
  v_permanent_delete_at TIMESTAMP;
BEGIN
  -- Calculate permanent deletion date
  IF _permanent_delete_after_days IS NOT NULL THEN
    v_permanent_delete_at := NOW() + INTERVAL '1 day' * _permanent_delete_after_days;
  END IF;

  -- Insert soft delete record
  INSERT INTO audit_soft_deletes (
    table_name, record_id, deleted_by, data_snapshot, company_id, permanent_delete_at
  ) VALUES (
    _table_name, _record_id, _deleted_by, _data_snapshot, _company_id, v_permanent_delete_at
  )
  ON CONFLICT (table_name, record_id) DO UPDATE
  SET
    deleted_by = EXCLUDED.deleted_by,
    deleted_at = NOW(),
    data_snapshot = EXCLUDED.data_snapshot,
    restored = FALSE,
    restored_by = NULL,
    restored_at = NULL,
    permanent_delete_at = EXCLUDED.permanent_delete_at
  RETURNING id INTO v_soft_delete_id;

  -- Log the deletion
  PERFORM audit.log_action(
    _deleted_by,
    'DELETE',
    _table_name,
    _record_id,
    _company_id,
    _data_snapshot,  -- old_values
    NULL,            -- new_values
    NULL,            -- ip_address
    NULL,            -- user_agent
    NULL,            -- request_id
    'Soft delete - data preserved in audit.soft_deletes'
  );

  RETURN v_soft_delete_id;
END;
$$;

-- ============================================
-- 3. RESTORE SOFT DELETED
-- ============================================
-- Восстановление мягко удаленной записи
CREATE OR REPLACE FUNCTION audit.restore_soft_deleted(
  _table_name TEXT,
  _record_id TEXT,
  _restored_by TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_data_snapshot JSONB;
  v_company_id UUID;
BEGIN
  -- Get deleted record
  SELECT data_snapshot, company_id INTO v_data_snapshot, v_company_id
  FROM audit_soft_deletes
  WHERE table_name = _table_name
    AND record_id = _record_id
    AND restored = FALSE;

  IF v_data_snapshot IS NULL THEN
    RAISE EXCEPTION 'Record not found in soft deletes: %.%', _table_name, _record_id;
  END IF;

  -- Mark as restored
  UPDATE audit_soft_deletes
  SET restored = TRUE,
      restored_by = _restored_by,
      restored_at = NOW()
  WHERE table_name = _table_name
    AND record_id = _record_id;

  -- Log the restoration
  PERFORM audit.log_action(
    _restored_by,
    'RESTORE',
    _table_name,
    _record_id,
    v_company_id,
    NULL,            -- old_values
    v_data_snapshot, -- new_values
    NULL,            -- ip_address
    NULL,            -- user_agent
    NULL,            -- request_id
    'Restored from soft delete'
  );

  RETURN v_data_snapshot;
END;
$$;

-- ============================================
-- 4. TRACK SESSION
-- ============================================
-- Создание новой сессии с логированием
CREATE OR REPLACE FUNCTION audit.track_session_start(
  _user_id TEXT,
  _user_email TEXT,
  _session_token TEXT,
  _login_ip INET DEFAULT NULL,
  _login_user_agent TEXT DEFAULT NULL,
  _login_method TEXT DEFAULT 'password'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Insert session
  INSERT INTO audit_sessions (
    user_id, user_email, session_token,
    login_ip, login_user_agent, login_method,
    last_activity_at
  ) VALUES (
    _user_id, _user_email, _session_token,
    _login_ip, _login_user_agent, _login_method,
    NOW()
  )
  RETURNING id INTO v_session_id;

  -- Log login action
  PERFORM audit.log_action(
    _user_id,
    'LOGIN',
    'sessions',
    v_session_id::TEXT,
    NULL,  -- company_id
    NULL,  -- old_values
    jsonb_build_object(
      'session_id', v_session_id,
      'login_method', _login_method,
      'user_agent', _login_user_agent
    ),
    _login_ip,
    _login_user_agent,
    NULL,  -- request_id
    'User logged in'
  );

  RETURN v_session_id;
END;
$$;

-- ============================================
-- 5. END SESSION
-- ============================================
-- Завершение сессии с логированием
CREATE OR REPLACE FUNCTION audit.track_session_end(
  _session_token TEXT,
  _logout_reason TEXT DEFAULT 'manual'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- Get session
  SELECT * INTO v_session
  FROM audit_sessions
  WHERE session_token = _session_token
    AND status = 'active';

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'Active session not found';
  END IF;

  -- Update session
  UPDATE audit_sessions
  SET logout_at = NOW(),
      logout_reason = _logout_reason,
      status = 'expired'
  WHERE id = v_session.id;

  -- Log logout action
  PERFORM audit.log_action(
    v_session.user_id,
    'LOGOUT',
    'sessions',
    v_session.id::TEXT,
    NULL,  -- company_id
    NULL,  -- old_values
    jsonb_build_object(
      'logout_reason', _logout_reason,
      'session_duration_minutes', EXTRACT(EPOCH FROM (NOW() - v_session.login_at)) / 60
    ),
    NULL,  -- ip_address
    NULL,  -- user_agent
    NULL,  -- request_id
    'User logged out'
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'session_id', v_session.id,
    'duration_minutes', EXTRACT(EPOCH FROM (NOW() - v_session.login_at)) / 60
  );
END;
$$;

-- ============================================
-- 6. UPDATE SESSION ACTIVITY
-- ============================================
-- Обновление последней активности в сессии
CREATE OR REPLACE FUNCTION audit.update_session_activity(
  _session_token TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE audit_sessions
  SET last_activity_at = NOW(),
      actions_count = actions_count + 1
  WHERE session_token = _session_token
    AND status = 'active';
END;
$$;

-- ============================================
-- 7. GET AUDIT TRAIL
-- ============================================
-- Получение аудит-трейла для записи
CREATE OR REPLACE FUNCTION audit.get_audit_trail(
  _table_name TEXT,
  _record_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_logs JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'action', action,
      'user_id', user_id,
      'user_email', user_email,
      'user_role', user_role,
      'old_values', old_values,
      'new_values', new_values,
      'created_at', EXTRACT(EPOCH FROM created_at)::BIGINT * 1000,
      'ip_address', ip_address::TEXT,
      'notes', notes
    ) ORDER BY created_at DESC
  ) INTO v_logs
  FROM audit_log
  WHERE table_name = _table_name
    AND record_id = _record_id;

  RETURN COALESCE(v_logs, '[]'::JSONB);
END;
$$;

-- ============================================
-- 8. GET USER ACTIVITY
-- ============================================
-- Получение активности пользователя за период
CREATE OR REPLACE FUNCTION audit.get_user_activity(
  _user_id TEXT,
  _from_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
  _to_date TIMESTAMP DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_activity JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_actions', COUNT(*),
    'actions_by_type', jsonb_object_agg(action, action_count),
    'recent_actions', jsonb_agg(recent_action)
  ) INTO v_activity
  FROM (
    SELECT
      action,
      COUNT(*) as action_count,
      jsonb_build_object(
        'action', action,
        'table_name', table_name,
        'record_id', record_id,
        'created_at', EXTRACT(EPOCH FROM created_at)::BIGINT * 1000
      ) as recent_action
    FROM audit_log
    WHERE user_id = _user_id
      AND created_at BETWEEN _from_date AND _to_date
    GROUP BY action, table_name, record_id, created_at
    ORDER BY created_at DESC
    LIMIT 100
  ) subq
  GROUP BY action, action_count;

  RETURN COALESCE(v_activity, '{}'::JSONB);
END;
$$;

-- ============================================
-- 9. GENERATE SOC REPORT
-- ============================================
-- Генерация SOC отчета за период
CREATE OR REPLACE FUNCTION audit.generate_soc_report(
  _report_type TEXT,
  _period_start TIMESTAMP,
  _period_end TIMESTAMP,
  _generated_by TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_report_id UUID;
  v_report_data JSONB;
BEGIN
  -- Collect report data
  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'start', _period_start,
      'end', _period_end
    ),
    'statistics', jsonb_build_object(
      'total_actions', COUNT(*),
      'unique_users', COUNT(DISTINCT user_id),
      'failed_logins', COUNT(*) FILTER (WHERE action = 'LOGIN_FAILED'),
      'data_changes', COUNT(*) FILTER (WHERE action IN ('CREATE', 'UPDATE', 'DELETE')),
      'suspicious_activities', COUNT(*) FILTER (WHERE action = 'DELETE' OR notes LIKE '%suspicious%')
    ),
    'actions_by_type', (
      SELECT jsonb_object_agg(action, count)
      FROM (
        SELECT action, COUNT(*) as count
        FROM audit_log
        WHERE created_at BETWEEN _period_start AND _period_end
        GROUP BY action
      ) action_counts
    ),
    'top_users', (
      SELECT jsonb_agg(user_data ORDER BY action_count DESC)
      FROM (
        SELECT
          jsonb_build_object(
            'user_id', user_id,
            'user_email', user_email,
            'action_count', COUNT(*)
          ) as user_data,
          COUNT(*) as action_count
        FROM audit_log
        WHERE created_at BETWEEN _period_start AND _period_end
        GROUP BY user_id, user_email
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) top_users_data
    ),
    'deleted_records', (
      SELECT COUNT(*)
      FROM audit_soft_deletes
      WHERE deleted_at BETWEEN _period_start AND _period_end
    ),
    'restored_records', (
      SELECT COUNT(*)
      FROM audit_soft_deletes
      WHERE restored = TRUE
        AND restored_at BETWEEN _period_start AND _period_end
    )
  ) INTO v_report_data
  FROM audit_log
  WHERE created_at BETWEEN _period_start AND _period_end;

  -- Save report
  INSERT INTO audit_reports (
    report_type, report_period_start, report_period_end,
    generated_by, data
  ) VALUES (
    _report_type, _period_start, _period_end,
    _generated_by, v_report_data
  )
  RETURNING id INTO v_report_id;

  RETURN jsonb_build_object(
    'report_id', v_report_id,
    'report_type', _report_type,
    'data', v_report_data
  );
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION audit.log_action IS 'Universal function to log any user action or data change';
COMMENT ON FUNCTION audit.soft_delete IS 'Soft delete record with data snapshot preservation';
COMMENT ON FUNCTION audit.restore_soft_deleted IS 'Restore soft deleted record';
COMMENT ON FUNCTION audit.track_session_start IS 'Create new session with audit logging';
COMMENT ON FUNCTION audit.track_session_end IS 'End session with logout logging';
COMMENT ON FUNCTION audit.update_session_activity IS 'Update last activity timestamp for session';
COMMENT ON FUNCTION audit.get_audit_trail IS 'Get complete audit trail for a specific record';
COMMENT ON FUNCTION audit.get_user_activity IS 'Get user activity summary for a period';
COMMENT ON FUNCTION audit.generate_soc_report IS 'Generate SOC compliance report for a period';
