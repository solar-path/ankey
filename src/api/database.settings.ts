import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as coreSchema from './db/schemas/core.drizzle'
import * as tenantSchema from './db/schemas/tenant.drizzle'
import type { TenantOwnerData, SeedResult } from '@/shared'

// Singleton instance for core database connection
let coreDbInstance: ReturnType<typeof drizzle> | null = null

// Core database connection
export function createCoreConnection() {
  // Return existing instance if available
  if (coreDbInstance) {
    return coreDbInstance
  }

  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. Please check your .env file.`
    )
  }

  const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  console.log(
    `Connecting to core database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  )

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  coreDbInstance = drizzle(client, { schema: coreSchema })
  return coreDbInstance
}

// Tenant database connection
export function createTenantConnection(tenantDatabase: string) {
  const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${tenantDatabase}`

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  return drizzle(client, { schema: tenantSchema })
}

// Create a new tenant database
export async function createTenantDatabase(tenantDatabase: string): Promise<boolean> {
  const adminConnectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/postgres`
  const adminClient = postgres(adminConnectionString)

  try {
    // Create database
    await adminClient.unsafe(`CREATE DATABASE "${tenantDatabase}"`)
    console.log(`Database ${tenantDatabase} created successfully`)

    // Close admin connection
    await adminClient.end()

    return true
  } catch (error: any) {
    console.error(`Failed to create database ${tenantDatabase}:`, error)
    if (error.code !== '42P04') {
      // Database already exists
      throw error
    }
    return false
  }
}

// Run tenant migrations
export async function runTenantMigrations(tenantDatabase: string): Promise<boolean> {
  const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${tenantDatabase}`
  
  const migrationClient = postgres(connectionString, {
    max: 1,
  })
  
  try {
    const db = drizzle(migrationClient, { schema: tenantSchema })
    
    console.log(`Running migrations for ${tenantDatabase}...`)
    
    await migrate(db, { migrationsFolder: './src/api/db/migrations/tenant' })
    
    console.log(`Migrations completed for ${tenantDatabase}`)
    
    await migrationClient.end()
    return true
  } catch (error) {
    console.error(`Migration failed for ${tenantDatabase}:`, error)
    await migrationClient.end()
    throw error
  }
}

// Seed tenant database with default data
export async function seedTenantDatabase(
  tenantDatabase: string,
  ownerData: TenantOwnerData
): Promise<SeedResult> {
  const db = createTenantConnection(tenantDatabase)

  try {
    // Create default roles
    const adminRole = await db
      .insert(tenantSchema.roles)
      .values({
        name: 'Administrator',
        description: 'Full system access',
        isSystem: true,
      })
      .returning()

    await db.insert(tenantSchema.roles).values({
      name: 'User',
      description: 'Basic user access',
      isSystem: true,
    })

    // Create owner user
    const owner = await db
      .insert(tenantSchema.users)
      .values({
        email: ownerData.email,
        fullName: ownerData.fullName,
        passwordHash: ownerData.passwordHash,
        emailVerified: true,
        isApproved: true,
        isActive: true,
      })
      .returning()

    // Assign admin role to owner
    await db.insert(tenantSchema.userRoles).values({
      userId: owner[0].id as string,
      roleId: adminRole[0].id as string,
    })

    console.log(`Tenant database ${tenantDatabase} seeded successfully`)
    return { success: true, ownerId: owner[0].id }
  } catch (error) {
    console.error(`Failed to seed tenant database ${tenantDatabase}:`, error)
    return { success: false, error }
  }
}
