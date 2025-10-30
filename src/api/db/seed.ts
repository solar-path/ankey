/**
 * Seed Script - Initialize database with test user
 *
 * Creates only the test user for development/testing
 */

import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'ankey',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Starting database seed...\n');

    // Start transaction
    await client.query('BEGIN');

    // CREATE TEST USER
    console.log('Creating test user...');

    const userId = '277fd489-3f9b-49c2-a193-8b868160adee';
    const userTextId = 'user_1761660791_f9356b64-3579-479f-b99f-6575655b9a7f';

    await client.query(`
      INSERT INTO users (
        id, _id, email, password, fullname, verified,
        two_factor_enabled, type, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        id = EXCLUDED.id,
        _id = EXCLUDED._id,
        password = EXCLUDED.password,
        fullname = EXCLUDED.fullname,
        verified = EXCLUDED.verified,
        updated_at = NOW()
    `, [
      userId,
      userTextId,
      'itgroup.luck@gmail.com',
      'a0878028cd43a3a00b15834ce4a18e363d803b5be86b8a8a1aa91f6f1c039138', // password: "M1r@nd@32" (SHA256)
      'Assanali Tungat',
      true,
      false,
      'user'
    ]);

    console.log('   - User created: itgroup.luck@gmail.com');
    console.log('   - Password: M1r@nd@32');

    // Commit transaction
    await client.query('COMMIT');

    console.log('\nDatabase seeded successfully!\n');
    console.log('Summary:');
    console.log('   - User: itgroup.luck@gmail.com');
    console.log('   - Password: M1r@nd@32\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seed
seed().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
