import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'ali',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ankey_core',
  })

  await client.connect()

  const db = drizzle(client)

  console.log('Running core migrations...')

  await migrate(db, { migrationsFolder: './src/api/db/migrations/core' })

  console.log('Core migrations completed!')

  await client.end()
}

main().catch(err => {
  console.error('Migration failed!')
  console.error(err)
  process.exit(1)
})
