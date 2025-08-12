import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { services } from '../src/api/db/schemas/services.drizzle'

async function migrateServices() {
  const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

  const migrationClient = postgres(connectionString, {
    max: 1,
  })

  try {
    const db = drizzle(migrationClient)

    console.log('🔄 Running services migrations...')

    await migrate(db, { migrationsFolder: './src/api/db/migrations/services' })

    console.log('✅ Services migrations completed')

    // Seed initial services data
    console.log('🌱 Seeding services data...')

    const serviceData = [
      {
        name: 'Educational Portal',
        slug: 'edu',
        description: 'Educational resources and learning management platform',
        baseUrl: 'http://edu.localhost:3000',
        maxUsers: 10000,
      },
      {
        name: 'Hunt Portal',
        slug: 'hunt',
        description: 'Job hunting and career development platform',
        baseUrl: 'http://hunt.localhost:3000',
        maxUsers: 5000,
      },
      {
        name: 'Shop Portal',
        slug: 'shop',
        description: 'E-commerce and online shopping platform',
        baseUrl: 'http://shop.localhost:3000',
        maxUsers: 15000,
      },
      {
        name: 'Swap Portal',
        slug: 'swap',
        description: 'Document and file sharing platform',
        baseUrl: 'http://swap.localhost:3000',
        maxUsers: 8000,
      },
    ]

    await db.insert(services).values(serviceData).onConflictDoNothing()

    console.log('✅ Services seeding completed')

    await migrationClient.end()
  } catch (error) {
    console.error('❌ Services migration/seeding failed:', error)
    await migrationClient.end()
    process.exit(1)
  }
}

migrateServices()
