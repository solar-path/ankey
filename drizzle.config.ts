import { defineConfig } from 'drizzle-kit';

// Determine which schema to use based on environment variable
const isCore = process.env.DRIZZLE_SCHEMA === 'core';
const isTenant = process.env.DRIZZLE_SCHEMA === 'tenant';

// Default to all schemas if not specified
const schema = isCore 
  ? './src/api/db/schemas/core.drizzle.ts'
  : isTenant 
    ? './src/api/db/schemas/tenant.drizzle.ts'
    : './src/api/db/schemas/*.drizzle.ts';

// Determine database name
const dbName = isTenant 
  ? (process.env.TENANT_NAME || 'tenant_template')
  : (process.env.DB_NAME || 'ankey_core');

// Determine output directory
const outDir = isCore 
  ? './src/api/db/migrations/core'
  : isTenant 
    ? './src/api/db/migrations/tenant'
    : './src/api/db/migrations';

export default defineConfig({
  schema,
  out: outDir,
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${dbName}`,
  },
  verbose: true,
  strict: true,
});
