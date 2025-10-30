/**
 * Supabase Permissions Setup for Custom Schemas
 *
 * This script grants necessary permissions for all custom schemas
 * to work with Supabase's PostgREST API and authentication system.
 *
 * Schemas:
 * - audit: Audit logging system
 * - auth: Authentication functions
 * - company: Company management
 * - orgchart: Organizational charts (with JSONB optimization)
 * - doa: Delegation of Authority matrices
 * - inquiry: Contact form submissions
 * - task: Task management
 * - reference: Reference data (countries, industries)
 * - users: User management functions
 *
 * Usage in Supabase:
 * 1. Run this script in Supabase SQL Editor after running migrations
 * 2. Add these schemas to "Exposed schemas" in API Settings:
 *    Dashboard → Settings → API → Exposed schemas
 *    Add: audit,auth,company,orgchart,doa,inquiry,task,reference,users
 *
 * Client usage example:
 *   const { data } = await supabase.rpc('create_orgchart', {...}, { schema: 'orgchart' })
 */

-- ============================================================================
-- GRANT PERMISSIONS FOR: audit schema
-- ============================================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA audit TO anon, authenticated, service_role;

-- Grant permissions on all existing tables
GRANT ALL ON ALL TABLES IN SCHEMA audit TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA audit TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA audit TO postgres, anon, authenticated, service_role;

-- Grant permissions on future tables (default privileges)
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;


-- ============================================================================
-- GRANT PERMISSIONS FOR: auth schema
-- ============================================================================

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;


-- ============================================================================
-- GRANT PERMISSIONS FOR: company schema
-- ============================================================================

GRANT USAGE ON SCHEMA company TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA company TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA company TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA company TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA company GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA company GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA company GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;


-- ============================================================================
-- GRANT PERMISSIONS FOR: orgchart schema
-- ============================================================================

GRANT USAGE ON SCHEMA orgchart TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA orgchart TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA orgchart TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA orgchart TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA orgchart GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA orgchart GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA orgchart GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;


-- ============================================================================
-- GRANT PERMISSIONS FOR: doa schema
-- ============================================================================

GRANT USAGE ON SCHEMA doa TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA doa TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA doa TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA doa TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA doa GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA doa GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA doa GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;


-- ============================================================================
-- GRANT PERMISSIONS FOR: inquiry schema
-- ============================================================================

GRANT USAGE ON SCHEMA inquiry TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA inquiry TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA inquiry TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA inquiry TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA inquiry GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA inquiry GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA inquiry GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;


-- ============================================================================
-- GRANT PERMISSIONS FOR: task schema
-- ============================================================================

GRANT USAGE ON SCHEMA task TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA task TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA task TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA task TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA task GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA task GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA task GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;


-- ============================================================================
-- GRANT PERMISSIONS FOR: reference schema
-- ============================================================================

GRANT USAGE ON SCHEMA reference TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA reference TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA reference TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA reference TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA reference GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA reference GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA reference GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;


-- ============================================================================
-- GRANT PERMISSIONS FOR: users schema
-- ============================================================================

GRANT USAGE ON SCHEMA users TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA users TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA users TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA users TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA users GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA users GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA users GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;


-- ============================================================================
-- GRANT PERMISSIONS FOR: public schema (default tables)
-- ============================================================================

-- Public schema should already have proper permissions, but ensure they're set
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify permissions are set correctly:

-- Check schema privileges
-- SELECT schema_name, schema_owner FROM information_schema.schemata WHERE schema_name IN ('audit', 'auth', 'company', 'orgchart', 'doa', 'inquiry', 'task', 'reference', 'users');

-- Check function/routine access
-- SELECT routine_schema, routine_name, routine_type FROM information_schema.routines WHERE routine_schema IN ('audit', 'auth', 'company', 'orgchart', 'doa', 'inquiry', 'task', 'reference', 'users') ORDER BY routine_schema, routine_name;

-- Check table access
-- SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('audit', 'auth', 'company', 'orgchart', 'doa', 'inquiry', 'task', 'reference', 'users', 'public') ORDER BY table_schema, table_name;
