/**
 * Setup Supabase Permissions Script
 *
 * Grants necessary permissions for all custom schemas to work with Supabase
 *
 * Usage:
 *   SUPABASE_DB_URL="postgresql://..." bun run src/api/db/setup-supabase-permissions.ts
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase connection string from environment
const connectionStringRaw = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionStringRaw) {
  console.error('❌ Error: SUPABASE_DB_URL environment variable is required');
  console.error('');
  console.error('Usage:');
  console.error('  SUPABASE_DB_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...pooler.supabase.com:6543/postgres" bun run src/api/db/setup-supabase-permissions.ts');
  process.exit(1);
}

// TypeScript assertion: connectionString is definitely string here (process.exit(1) prevents undefined)
const connectionString: string = connectionStringRaw;
const pool = new Pool({ connectionString });

async function setupPermissions() {
  const client = await pool.connect();

  try {
    console.log('🔐 Setting up Supabase permissions...\n');
    console.log('📦 Connection:', connectionString.replace(/:[^:@]+@/, ':****@'));
    console.log('');

    // Read permissions SQL file
    const permissionsFile = join(__dirname, 'supabase-permissions.sql');
    const sql = readFileSync(permissionsFile, 'utf-8');

    console.log('Executing permissions script...');
    await client.query(sql);

    console.log('✅ Permissions setup completed!\n');

    // Verify schemas exist
    console.log('🔍 Verifying schemas...');
    const schemaResult = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name IN ('audit', 'auth', 'company', 'orgchart', 'doa', 'inquiry', 'task', 'reference', 'users')
      ORDER BY schema_name
    `);

    console.log(`   Found ${schemaResult.rows.length} custom schemas:`);
    schemaResult.rows.forEach(row => {
      console.log(`   ✓ ${row.schema_name}`);
    });
    console.log('');

    // Count functions in each schema
    console.log('🔍 Verifying functions...');
    const functionResult = await client.query(`
      SELECT routine_schema, COUNT(*) as function_count
      FROM information_schema.routines
      WHERE routine_schema IN ('audit', 'auth', 'company', 'orgchart', 'doa', 'inquiry', 'task', 'reference', 'users')
      GROUP BY routine_schema
      ORDER BY routine_schema
    `);

    console.log(`   Found functions in ${functionResult.rows.length} schemas:`);
    functionResult.rows.forEach(row => {
      console.log(`   ✓ ${row.routine_schema}: ${row.function_count} functions`);
    });
    console.log('');

    console.log('─────────────────────────────────────');
    console.log('✅ Setup complete!\n');
    console.log('🔧 Next steps:');
    console.log('   1. Open Supabase Dashboard → Settings → API');
    console.log('   2. Find "Exposed schemas" section');
    console.log('   3. Add these schemas (comma-separated):');
    console.log('      audit,auth,company,orgchart,doa,inquiry,task,reference,users');
    console.log('   4. Click Save');
    console.log('');
    console.log('📚 Your functions are now ready to be called from the client!');
    console.log('   Example:');
    console.log('   const { data } = await supabase.rpc(');
    console.log('     "create_orgchart",');
    console.log('     { _company_id: "...", _user_id: "...", _title: "..." },');
    console.log('     { schema: "orgchart" }');
    console.log('   )');
    console.log('');

  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupPermissions().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
