/**
 * Deploy to Supabase Script
 *
 * Automatically deploys all migrations to Supabase database
 *
 * Usage:
 *   SUPABASE_DB_URL="postgresql://..." bun run src/api/db/deploy-to-supabase.ts
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
  console.error('  SUPABASE_DB_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...pooler.supabase.com:6543/postgres" bun run src/api/db/deploy-to-supabase.ts');
  process.exit(1);
}

// TypeScript assertion: connectionString is definitely string here (process.exit(1) prevents undefined)
const connectionString: string = connectionStringRaw;
const pool = new Pool({ connectionString });

// Migration files in correct order
const migrations = [
  // 1. Foundation - Audit system
  'audit.definition.sql',
  'audit.functions.sql',

  // 2. Core tables
  'auth.definition.sql',
  'company.definition.sql',

  // 3. Core functions
  'auth.functions.sql',
  'company.functions.sql',

  // 4-7. Business modules
  'inquiry.definition.sql',
  'inquiry.functions.sql',
  'orgchart.definition.sql',
  'orgchart.functions.sql',
  'doa.definition.sql',
  'doa.functions.sql',
  'task.definition.sql',
  'task.functions.sql',

  // 8-10. Reference and utilities
  'reference.definition.sql',
  'reference.functions.sql',
  'users.functions.sql',

  // 11. Triggers (MUST BE LAST)
  'audit.triggers.sql',
];

async function deploy() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting Supabase deployment...\n');
    console.log('📦 Connection:', connectionString.replace(/:[^:@]+@/, ':****@'));
    console.log('');

    let successCount = 0;
    let failCount = 0;

    for (const file of migrations) {
      try {
        console.log(`Running: ${file}`);
        const filePath = join(__dirname, file);
        const sql = readFileSync(filePath, 'utf-8');

        await client.query(sql);
        console.log(`   ✅ SUCCESS: ${file}\n`);
        successCount++;
      } catch (error: any) {
        console.error(`   ❌ FAILED: ${file}`);
        console.error(`   Error: ${error.message}\n`);
        failCount++;

        // Ask user if they want to continue on error
        if (failCount > 0) {
          console.log('⚠️  Migration failed. This might be because:');
          console.log('   - The migration was already applied');
          console.log('   - There is a dependency issue');
          console.log('   - There is a syntax error\n');

          // For now, continue with other migrations
          console.log('Continuing with remaining migrations...\n');
        }
      }
    }

    console.log('─────────────────────────────────────');
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📝 Total: ${migrations.length}`);
    console.log('─────────────────────────────────────\n');

    if (failCount === 0) {
      console.log('✅ All migrations completed successfully!\n');
      console.log('🔧 Next steps:');
      console.log('   1. Run permissions setup:');
      console.log('      SUPABASE_DB_URL="..." bun run src/api/db/setup-supabase-permissions.ts');
      console.log('   2. Add schemas to "Exposed schemas" in Supabase Dashboard:');
      console.log('      audit,auth,company,orgchart,doa,inquiry,task,reference,users');
      console.log('');
    } else {
      console.log('⚠️  Some migrations failed. Please check the errors above.');
      console.log('   You may need to manually fix issues in Supabase SQL Editor.');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

deploy().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
