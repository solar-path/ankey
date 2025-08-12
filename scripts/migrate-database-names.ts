import { createCoreConnection } from '../src/api/database.settings'
import { tenants } from '../src/api/db/schemas/core.drizzle'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'

async function migrateDatabaseNames() {
  console.log('🔄 Starting database name migration...')

  const db = createCoreConnection()

  // Get all tenants with ankey_ prefix in database name
  const tenantList = await db.select().from(tenants).where(eq(tenants.isActive, true))

  const adminConnectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/postgres`
  const adminClient = postgres(adminConnectionString)

  try {
    for (const tenant of tenantList) {
      const oldDatabaseName = tenant.database

      // Skip if database name doesn't have ankey_ prefix
      if (!oldDatabaseName.startsWith('ankey_')) {
        console.log(`✓ Skipping ${oldDatabaseName} - already in correct format`)
        continue
      }

      const newDatabaseName = oldDatabaseName.replace('ankey_', '')

      console.log(`📊 Migrating ${oldDatabaseName} → ${newDatabaseName}`)

      try {
        // Check if new database name already exists
        const checkResult = await adminClient`
          SELECT 1 FROM pg_database WHERE datname = ${newDatabaseName}
        `

        if (checkResult.length > 0) {
          console.log(`⚠️  Database ${newDatabaseName} already exists, skipping rename`)
          continue
        }

        // Rename the database
        await adminClient.unsafe(
          `ALTER DATABASE "${oldDatabaseName}" RENAME TO "${newDatabaseName}"`
        )

        // Update tenant record
        await db
          .update(tenants)
          .set({
            database: newDatabaseName,
            updatedAt: new Date(),
          })
          .where(eq(tenants.id, tenant.id))

        console.log(`✅ Successfully migrated ${oldDatabaseName} → ${newDatabaseName}`)
      } catch (error: any) {
        console.error(`❌ Failed to migrate ${oldDatabaseName}:`, error.message)

        // If database doesn't exist, just update the record
        if (error.code === '3D000') {
          console.log(`📝 Database ${oldDatabaseName} doesn't exist, updating record only`)
          await db
            .update(tenants)
            .set({
              database: newDatabaseName,
              updatedAt: new Date(),
            })
            .where(eq(tenants.id, tenant.id))

          console.log(`✅ Updated tenant record for ${newDatabaseName}`)
        }
      }
    }

    console.log('✅ Database name migration completed')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await adminClient.end()
  }
}

// Run migration
migrateDatabaseNames().catch(console.error)
