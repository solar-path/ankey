-- ============================================
-- AUDIT LOGGING SYSTEM - Automatic Triggers
-- ============================================
-- Триггеры для автоматического логирования изменений

-- ============================================
-- GENERIC AUDIT TRIGGER FUNCTION
-- ============================================
-- Универсальная функция-триггер для логирования изменений
CREATE OR REPLACE FUNCTION audit.trigger_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id TEXT;
  v_company_id UUID;
  v_record_id TEXT;
  v_action TEXT;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- Determine action
  IF (TG_OP = 'INSERT') THEN
    v_action := 'CREATE';
    v_record_id := COALESCE(NEW._id, NEW.id::TEXT);
    v_new_values := row_to_json(NEW)::JSONB;
    v_old_values := NULL;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'UPDATE';
    v_record_id := COALESCE(NEW._id, NEW.id::TEXT);
    v_old_values := row_to_json(OLD)::JSONB;
    v_new_values := row_to_json(NEW)::JSONB;
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'DELETE';
    v_record_id := COALESCE(OLD._id, OLD.id::TEXT);
    v_old_values := row_to_json(OLD)::JSONB;
    v_new_values := NULL;
  END IF;

  -- Try to get user_id from various sources
  BEGIN
    v_user_id := current_setting('app.user_id', TRUE);
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  -- Try to get company_id from record or session
  BEGIN
    IF TG_OP = 'DELETE' THEN
      v_company_id := OLD.company_id;
    ELSE
      v_company_id := NEW.company_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_company_id := NULL;
  END;

  -- Log the action
  PERFORM audit.log_action(
    v_user_id,
    v_action,
    TG_TABLE_NAME,
    v_record_id,
    v_company_id,
    v_old_values,
    v_new_values,
    NULL,  -- ip_address - можно получить из session
    NULL,  -- user_agent - можно получить из session
    NULL,  -- request_id
    'Automatic trigger: ' || TG_OP || ' on ' || TG_TABLE_NAME
  );

  -- Return appropriate value
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================
-- APPLY TRIGGERS TO TABLES
-- ============================================

-- Companies table
DROP TRIGGER IF EXISTS audit_companies_trigger ON companies;
CREATE TRIGGER audit_companies_trigger
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- User companies table
DROP TRIGGER IF EXISTS audit_user_companies_trigger ON user_companies;
CREATE TRIGGER audit_user_companies_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_companies
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- Users table (только для важных изменений)
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OF verified, two_factor_enabled, password ON users
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- Inquiries table
DROP TRIGGER IF EXISTS audit_inquiries_trigger ON inquiries;
CREATE TRIGGER audit_inquiries_trigger
  AFTER INSERT OR UPDATE OR DELETE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- Orgcharts table
DROP TRIGGER IF EXISTS audit_orgcharts_trigger ON orgcharts;
CREATE TRIGGER audit_orgcharts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orgcharts
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- Orgchart approvals table
DROP TRIGGER IF EXISTS audit_orgchart_approvals_trigger ON orgchart_approvals;
CREATE TRIGGER audit_orgchart_approvals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orgchart_approvals
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- TODO: Добавить триггеры для других таблиц по мере их создания:
-- - tasks (when task module is created)
-- - doa_matrices (when DOA module is created)

-- ============================================
-- HELPER FUNCTION TO SET USER CONTEXT
-- ============================================
-- Функция для установки текущего пользователя в контексте сессии
CREATE OR REPLACE FUNCTION audit.set_user_context(_user_id TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM set_config('app.user_id', _user_id, FALSE);
END;
$$;

-- ============================================
-- HELPER FUNCTION TO CLEAR USER CONTEXT
-- ============================================
CREATE OR REPLACE FUNCTION audit.clear_user_context()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM set_config('app.user_id', '', FALSE);
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION audit.trigger_audit_log IS 'Generic trigger function to automatically log all data changes';
COMMENT ON FUNCTION audit.set_user_context IS 'Set current user ID in session context for audit logging';
COMMENT ON FUNCTION audit.clear_user_context IS 'Clear user context from session';
