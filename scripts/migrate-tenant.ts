import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const tenantName = process.env.TENANT_NAME || process.argv[2];
  
  if (!tenantName) {
    console.error('Please provide a tenant name via TENANT_NAME env var or as an argument');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'ali',
    password: process.env.DB_PASSWORD || 'password',
    database: tenantName,
  });

  await client.connect();

  const db = drizzle(client);

  console.log(`Running migrations for tenant: ${tenantName}...`);
  
  await migrate(db, { migrationsFolder: './src/api/db/migrations/tenant' });
  
  console.log(`Tenant ${tenantName} migrations completed!`);
  
  await client.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});