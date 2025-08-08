#!/usr/bin/env bun

import { config } from 'dotenv'
import postgres from 'postgres'

// Load environment variables from .env file
config()

async function dropCoreDatabase() {
  console.log('=�  Starting core database drop...')
  console.log('�  WARNING: This will permanently delete ALL data in the core database!')

  try {
    // Validate required environment variables
    const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}. Please check your .env file.`
      )
    }

    const dbName = process.env.DB_NAME
    const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/postgres`

    console.log(`Connecting to PostgreSQL server: ${process.env.DB_HOST}:${process.env.DB_PORT}`)

    // Connect to postgres database (not the target database)
    const sql = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    })

    try {
      console.log(`= Terminating active connections to database: ${dbName}`)

      // Terminate all connections to the target database
      await sql`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = ${dbName!}
          AND pid <> pg_backend_pid()
      `

      console.log(`=� Dropping database: ${dbName}`)

      // Drop the database
      await sql.unsafe(`DROP DATABASE IF EXISTS ${dbName}`)

      console.log(` Database ${dbName} dropped successfully!`)

      // Optionally recreate the empty database
      console.log(`<� Recreating empty database: ${dbName}`)
      await sql.unsafe(`CREATE DATABASE ${dbName}`)

      console.log(` Empty database ${dbName} created successfully!`)
    } finally {
      // Close the connection
      await sql.end()
    }

    console.log('')
    console.log('<� Core database drop completed successfully!')
    console.log('')
    console.log('=� Next steps:')
    console.log('   1. Run: bun run db:push:core  (to recreate schema)')
    console.log('   2. Run: bun run seed         (to seed initial data)')
    console.log('')
  } catch (error) {
    console.error('L Database drop failed:', error)
    process.exit(1)
  }
}

// Confirmation prompt for safety
const args = process.argv.slice(2)
const forceFlag = args.includes('--force') || args.includes('-f')

if (!forceFlag) {
  console.log('�  This script will permanently delete the core database!')
  console.log('=� To proceed, run with --force flag:')
  console.log('   bun scripts/drop-core.ts --force')
  console.log('')
  process.exit(0)
}

// Run the drop operation
dropCoreDatabase().catch(console.error)
