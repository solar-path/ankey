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

// Check if database exists
export async function checkDatabaseExists(databaseName: string): Promise<boolean> {
  const adminConnectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/postgres`
  const adminClient = postgres(adminConnectionString)

  try {
    const result = await adminClient`
      SELECT 1 FROM pg_database WHERE datname = ${databaseName}
    `
    await adminClient.end()
    return result.length > 0
  } catch (error) {
    console.error(`Error checking database ${databaseName}:`, error)
    await adminClient.end()
    return false
  }
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
    return false
  }
}

// Seed tenant database with initial owner
export async function seedTenantDatabase(
  tenantDatabase: string,
  ownerData: TenantOwnerData
): Promise<SeedResult> {
  const tenantDb = createTenantConnection(tenantDatabase)

  try {
    // Check if users already exist
    const existingUsers = await tenantDb.select().from(tenantSchema.users).limit(1)

    if (existingUsers.length > 0) {
      console.log(`Database ${tenantDatabase} already has users, skipping seed`)
      return { success: true, ownerId: existingUsers[0].id }
    }

    // Create tenant owner
    const [owner] = await tenantDb
      .insert(tenantSchema.users)
      .values({
        email: ownerData.email,
        fullName: ownerData.fullName,
        passwordHash: ownerData.passwordHash,
        isActive: true,
        emailVerified: true,
        isApproved: true,
        approvedAt: new Date(),
      })
      .returning()

    // Create basic roles
    const roles = [
      { name: 'Admin', description: 'Full system access', isSystem: true },
      { name: 'Manager', description: 'Department management access', isSystem: true },
      { name: 'User', description: 'Basic user access', isSystem: true },
    ]

    const insertedRoles = await tenantDb.insert(tenantSchema.roles).values(roles).returning()

    // Assign Admin role to owner
    const adminRole = insertedRoles.find(r => r.name === 'Admin')
    if (adminRole) {
      await tenantDb.insert(tenantSchema.userRoles).values({
        userId: owner.id,
        roleId: adminRole.id,
      })
    }

    // Create basic permissions
    const permissions = [
      // User management
      { name: 'users.read', resource: 'users', action: 'read', description: 'View users' },
      { name: 'users.create', resource: 'users', action: 'create', description: 'Create users' },
      { name: 'users.update', resource: 'users', action: 'update', description: 'Update users' },
      { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },
      // Role management
      { name: 'roles.read', resource: 'roles', action: 'read', description: 'View roles' },
      { name: 'roles.create', resource: 'roles', action: 'create', description: 'Create roles' },
      { name: 'roles.update', resource: 'roles', action: 'update', description: 'Update roles' },
      { name: 'roles.delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
      // Settings
      {
        name: 'settings.read',
        resource: 'settings',
        action: 'read',
        description: 'View settings',
      },
      {
        name: 'settings.update',
        resource: 'settings',
        action: 'update',
        description: 'Update settings',
      },
    ]

    const insertedPermissions = await tenantDb
      .insert(tenantSchema.permissions)
      .values(permissions)
      .returning()

    // Assign all permissions to Admin role
    if (adminRole) {
      const rolePermissions = insertedPermissions.map(perm => ({
        roleId: adminRole.id,
        permissionId: perm.id,
      }))

      await tenantDb.insert(tenantSchema.rolePermissions).values(rolePermissions)
    }

    console.log(`✅ Tenant database ${tenantDatabase} seeded successfully`)
    return { success: true, ownerId: owner.id }
  } catch (error) {
    console.error(`Failed to seed tenant database ${tenantDatabase}:`, error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
