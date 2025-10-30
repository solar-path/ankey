/**
 * Drop Script - Reset database to clean state
 *
 * WARNING: This will DELETE ALL DATA in the database!
 * Use only for development/testing.
 */

import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'ankey',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
});

async function drop() {
  const client = await pool.connect();

  try {
    console.log('Starting database drop...\n');
    console.log('WARNING: This will DELETE ALL DATA!\n');

    // Start transaction
    await client.query('BEGIN');

    // Drop all tables (CASCADE will handle dependencies)
    console.log('Dropping tables...');

    const tables = [
      'sessions',
      'tasks',
      'approval_workflows',
      'approval_matrices',
      'orgchart_appointment_history',
      'orgchart_approvals',
      'orgcharts',
      'inquiries',
      'user_companies',
      'companies',
      'users',
      'audit_log',
      // Reference tables
      'countries',
      'industries',
    ];

    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`   - Dropped table: ${table}`);
      } catch (error: any) {
        console.log(`   - Table ${table} not found or already dropped`);
      }
    }

    // Drop schemas
    console.log('\nDropping schemas...');

    const schemas = ['audit', 'orgchart'];

    for (const schema of schemas) {
      try {
        await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        console.log(`   - Dropped schema: ${schema}`);
      } catch (error: any) {
        console.log(`   - Schema ${schema} not found or already dropped`);
      }
    }

    // Drop custom types
    console.log('\nDropping custom types...');

    const types = ['user_role', 'company_type'];

    for (const type of types) {
      try {
        await client.query(`DROP TYPE IF EXISTS ${type} CASCADE`);
        console.log(`   - Dropped type: ${type}`);
      } catch (error: any) {
        console.log(`   - Type ${type} not found or already dropped`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log('\nDatabase dropped successfully!');
    console.log('All tables, schemas, and types have been removed.\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Drop failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run drop
drop().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
