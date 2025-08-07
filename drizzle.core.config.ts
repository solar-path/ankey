import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/api/db/schemas/core/*.drizzle.ts',
  out: './src/api/db/migrations/core',
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'ankey_core'}`,
  },
  verbose: true,
  strict: true,
});