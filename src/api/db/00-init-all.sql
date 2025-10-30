-- ============================================
-- MASTER INITIALIZATION SCRIPT
-- ============================================
-- Применяет все схемы и функции в правильном порядке
--
-- Usage:
--   psql -d ankey -f 00-init-all.sql
--
-- или с указанием connection string:
--   psql postgresql://localhost:5432/ankey -f 00-init-all.sql

\echo '=========================================='
\echo 'Ankey Database Initialization'
\echo '=========================================='
\echo ''

-- ============================================
-- 1. AUDIT LOGGING SYSTEM (First!)
-- ============================================
\echo '1. Installing Audit Logging System...'
\i audit.definition.sql
\i audit.functions.sql
\i audit.triggers.sql
\echo '   ✓ Audit system installed'
\echo ''

-- ============================================
-- 2. AUTH MODULE
-- ============================================
\echo '2. Installing Auth Module...'
\i auth.definition.sql
\i auth.functions.sql
\echo '   ✓ Auth module installed'
\echo ''

-- ============================================
-- 3. COMPANY MODULE
-- ============================================
\echo '3. Installing Company Module...'
\i company.definition.sql
\i company.functions.sql
\echo '   ✓ Company module installed'
\echo ''

-- ============================================
-- 4. INQUIRY MODULE
-- ============================================
\echo '4. Installing Inquiry Module...'
\i inquiry.definition.sql
\i inquiry.functions.sql
\echo '   ✓ Inquiry module installed'
\echo ''

-- ============================================
-- 5. ORGCHART MODULE
-- ============================================
\echo '5. Installing OrgChart Module...'
\i orgchart.definition.sql
\i orgchart.functions.sql
\echo '   ✓ OrgChart module installed'
\echo ''

-- ============================================
-- 6. DOA (DELEGATION OF AUTHORITY) MODULE
-- ============================================
\echo '6. Installing DoA Module...'
\i doa.definition.sql
\i doa.functions.sql
\echo '   ✓ DoA module installed'
\echo ''

-- ============================================
-- 7. TASK MODULE
-- ============================================
\echo '7. Installing Task Module...'
\i task.definition.sql
\i task.functions.sql
\echo '   ✓ Task module installed'
\echo ''

-- ============================================
-- 8. REFERENCE DATA MODULE
-- ============================================
\echo '8. Installing Reference Data Module...'
\i reference.definition.sql
\i reference.functions.sql
\echo '   ✓ Reference data module installed'
\echo '   ℹ Run: bun run scripts/seed-reference-data.ts to populate data'
\echo ''

-- ============================================
-- 9. USERS MODULE
-- ============================================
\echo '9. Installing Users Module...'
\i users.functions.sql
\echo '   ✓ Users module installed'
\echo ''

-- ============================================
-- 10. APPLY AUDIT TRIGGERS
-- ============================================
\echo '10. Applying audit triggers to existing tables...'

-- Companies
DROP TRIGGER IF EXISTS audit_companies_trigger ON companies;
CREATE TRIGGER audit_companies_trigger
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- User companies
DROP TRIGGER IF EXISTS audit_user_companies_trigger ON user_companies;
CREATE TRIGGER audit_user_companies_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_companies
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- Users (важные изменения)
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OF verified, two_factor_enabled, password ON users
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- Inquiries
DROP TRIGGER IF EXISTS audit_inquiries_trigger ON inquiries;
CREATE TRIGGER audit_inquiries_trigger
  AFTER INSERT OR UPDATE OR DELETE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- Orgcharts
DROP TRIGGER IF EXISTS audit_orgcharts_trigger ON orgcharts;
CREATE TRIGGER audit_orgcharts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orgcharts
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- Orgchart approvals
DROP TRIGGER IF EXISTS audit_orgchart_approvals_trigger ON orgchart_approvals;
CREATE TRIGGER audit_orgchart_approvals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orgchart_approvals
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- Approval matrices
DROP TRIGGER IF EXISTS audit_approval_matrices_trigger ON approval_matrices;
CREATE TRIGGER audit_approval_matrices_trigger
  AFTER INSERT OR UPDATE OR DELETE ON approval_matrices
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- Approval workflows
DROP TRIGGER IF EXISTS audit_approval_workflows_trigger ON approval_workflows;
CREATE TRIGGER audit_approval_workflows_trigger
  AFTER INSERT OR UPDATE OR DELETE ON approval_workflows
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- Tasks
DROP TRIGGER IF EXISTS audit_tasks_trigger ON tasks;
CREATE TRIGGER audit_tasks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

\echo '   ✓ Audit triggers applied'
\echo ''

-- ============================================
-- 11. VERIFY INSTALLATION
-- ============================================
\echo '11. Verifying installation...'
\echo ''

-- Count schemas
\echo '   Schemas:'
SELECT '     - ' || nspname AS " " FROM pg_namespace
WHERE nspname IN ('auth', 'company', 'inquiry', 'orgchart', 'doa', 'task', 'audit')
ORDER BY nspname;

\echo ''
\echo '   Tables:'
SELECT '     - ' || schemaname || '.' || tablename AS " "
FROM pg_tables
WHERE schemaname IN ('public', 'audit')
  AND tablename IN ('users', 'sessions', 'companies', 'user_companies', 'inquiries', 'orgcharts', 'orgchart_approvals', 'approval_matrices', 'approval_workflows', 'tasks', 'countries', 'industries', 'log', 'soft_deletes', 'sessions', 'reports')
ORDER BY schemaname, tablename;

\echo ''
\echo '   Functions:'
SELECT '     - ' || schemaname || '.' || routinename AS " "
FROM information_schema.routines
WHERE schemaname IN ('auth', 'company', 'inquiry', 'orgchart', 'doa', 'task', 'audit')
  AND routinename NOT LIKE 'update_%_updated_at'
  AND routinename NOT LIKE 'set_%'
ORDER BY schemaname, routinename
LIMIT 30;

\echo ''
\echo '=========================================='
\echo '✓ Database initialization complete!'
\echo '=========================================='
\echo ''
\echo 'Next steps:'
\echo '  1. Configure pg_cron for scheduled jobs (optional)'
\echo '  2. Set up database connection in .env'
\echo '  3. Test with: SELECT auth.get_2fa_status(''test_user'');'
\echo ''
