import { defineConfig } from 'drizzle-kit';

const tenantName = process.env.TENANT_NAME || 'tenant_template';

export default defineConfig({
  schema: './src/api/db/schemas/tenant/*.drizzle.ts',
  out: './src/api/db/migrations/tenant',
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${tenantName}`,
  },
  verbose: true,
  strict: true,
});