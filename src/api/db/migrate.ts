/**
 * Migration Script - Run all database migrations
 *
 * Executes SQL files in the correct order to set up database schema
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'ankey',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
});

// SQL files in execution order (based on 00-init-all.sql)
const migrations = [
  // 1. Foundation - Audit system (schema and functions only)
  'audit.definition.sql',
  'audit.functions.sql',

  // 2. Core - Auth module (creates users, sessions tables)
  'auth.definition.sql',

  // 3. Core - Company module (creates companies, user_companies tables)
  'company.definition.sql',

  // 4. Core functions (after all core tables created)
  'auth.functions.sql',
  'company.functions.sql',

  // 5. Inquiry module
  'inquiry.definition.sql',
  'inquiry.functions.sql',

  // 6. OrgChart module
  'orgchart.definition.sql',
  'orgchart.functions.sql',

  // 7. DoA module (creates approval_matrices, approval_workflows)
  'doa.definition.sql',
  'doa.functions.sql',

  // 8. Task module (depends on approval_workflows from DoA)
  'task.definition.sql',
  'task.functions.sql',

  // 9. Reference data
  'reference.definition.sql',
  'reference.functions.sql',

  // 10. Users functions
  'users.functions.sql',

  // 11. Audit triggers (MUST be last - after all tables are created)
  'audit.triggers.sql',
];

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting database migration...\n');

    for (const file of migrations) {
      const filePath = join(__dirname, file);

      try {
        console.log(`Running: ${file}`);
        const sql = readFileSync(filePath, 'utf-8');

        // Execute the SQL file
        await client.query(sql);

        console.log(`   - SUCCESS: ${file}\n`);
      } catch (error: any) {
        console.error(`   - FAILED: ${file}`);
        console.error(`   Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('Migration completed successfully!');
    console.log(`Total files executed: ${migrations.length}\n`);

  } catch (error) {
    console.error('\nMigration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
