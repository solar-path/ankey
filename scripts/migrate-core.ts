#!/usr/bin/env bun

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { config } from 'dotenv'

config()

async function main() {
  const connectionString = `postgresql://${process.env.DB_USER || 'ali'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'ankey_core'}`

  const migrationClient = postgres(connectionString, {
    max: 1,
  })

  const db = drizzle(migrationClient)

  console.log('Running core migrations...')

  await migrate(db, { migrationsFolder: './src/api/db/migrations/core' })

  console.log('Core migrations completed!')

  await migrationClient.end()
}

main().catch(err => {
  console.error('Migration failed!')
  console.error(err)
  process.exit(1)
})
