#!/usr/bin/env bun

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { config } from 'dotenv'

config()

async function main() {
  const tenantName = process.env.TENANT_NAME || process.argv[2]

  if (!tenantName) {
    console.error('Please provide a tenant name via TENANT_NAME env var or as an argument')
    process.exit(1)
  }

  const connectionString = `postgresql://${process.env.DB_USER || 'ali'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${tenantName}`

  const migrationClient = postgres(connectionString, {
    max: 1,
  })

  const db = drizzle(migrationClient)

  console.log(`Running migrations for tenant: ${tenantName}...`)

  await migrate(db, { migrationsFolder: './src/api/db/migrations/tenant' })

  console.log(`Tenant ${tenantName} migrations completed!`)

  await migrationClient.end()
}

main().catch(err => {
  console.error('Migration failed!')
  console.error(err)
  process.exit(1)
})
