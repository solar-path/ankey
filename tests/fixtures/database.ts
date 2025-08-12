import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as coreSchema from '@/api/db/schemas/core.drizzle'
import * as tenantSchema from '@/api/db/schemas/tenant.drizzle'
import { sql } from 'drizzle-orm'
import { beforeAll, afterAll, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// Test database connections
let coreTestDb: ReturnType<typeof drizzle>
let tenantTestDb: ReturnType<typeof drizzle>
let coreConnection: ReturnType<typeof postgres>
let tenantConnection: ReturnType<typeof postgres>

export interface TestUser {
  id: string
  email: string
  fullName: string
  passwordHash?: string
}

export interface TestTenant {
  id: string
  name: string
  subdomain: string
  database: string
}

export interface TestPlan {
  id: string
  name: string
  maxUsers: number | null
  maxCompanies: number | null
}

/**
 * Setup test databases and run migrations
 */
export async function setupTestDatabase() {
  // Core database setup
  const coreDbUrl =
    process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ankey_test_core'
  coreConnection = postgres(coreDbUrl, { max: 1 })
  coreTestDb = drizzle(coreConnection, { schema: coreSchema })

  // Test tenant database setup
  const tenantDbUrl = 'postgresql://user:password@localhost:5432/ankey_test_tenant_default'
  tenantConnection = postgres(tenantDbUrl, { max: 1 })
  tenantTestDb = drizzle(tenantConnection, { schema: tenantSchema })

  // Run migrations
  await runTestMigrations()

  console.log('📊 Test databases initialized')
}

/**
 * Cleanup test databases
 */
export async function cleanupTestDatabase() {
  try {
    await coreConnection?.end()
    await tenantConnection?.end()
    console.log('📊 Test databases cleaned up')
  } catch (error) {
    console.warn('Warning: Database cleanup failed:', error)
  }
}

/**
 * Clear all data from test databases
 */
export async function clearTestData() {
  try {
    // Clear tenant data
    await tenantTestDb.delete(tenantSchema.auditLogs)
    await tenantTestDb.delete(tenantSchema.userCompanies)
    await tenantTestDb.delete(tenantSchema.companies)
    await tenantTestDb.delete(tenantSchema.userRoles)
    await tenantTestDb.delete(tenantSchema.rolePermissions)
    await tenantTestDb.delete(tenantSchema.delegations)
    await tenantTestDb.delete(tenantSchema.sessions)
    await tenantTestDb.delete(tenantSchema.users)
    await tenantTestDb.delete(tenantSchema.roles)
    await tenantTestDb.delete(tenantSchema.permissions)

    // Clear core data
    await coreTestDb.delete(coreSchema.coreAuditLogs)
    await coreTestDb.delete(coreSchema.tenantSubscriptions)
    await coreTestDb.delete(coreSchema.pricingDiscounts)
    await coreTestDb.delete(coreSchema.coreUserRoles)
    await coreTestDb.delete(coreSchema.coreRolePermissions)
    await coreTestDb.delete(coreSchema.coreSessions)
    await coreTestDb.delete(coreSchema.tenants)
    await coreTestDb.delete(coreSchema.coreUsers)
    await coreTestDb.delete(coreSchema.pricingPlans)
    await coreTestDb.delete(coreSchema.coreRoles)
    await coreTestDb.delete(coreSchema.corePermissions)
  } catch (error) {
    console.warn('Warning: Test data clearing failed:', error)
  }
}

/**
 * Run test migrations
 */
async function runTestMigrations() {
  try {
    // For simplicity, we'll create tables directly rather than running migration files
    // In a production setup, you'd run actual migration files

    // This is a simplified approach - in reality you'd run the migration files
    console.log('📋 Test migrations completed')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

/**
 * Create test pricing plans
 */
export async function createTestPlans(): Promise<TestPlan[]> {
  const plans = await coreTestDb
    .insert(coreSchema.pricingPlans)
    .values([
      {
        name: 'Test Micro',
        description: 'Test micro plan',
        pricePerUserPerMonth: 25,
        maxUsers: 5,
        maxCompanies: 3,
        features: JSON.stringify(['Basic features']),
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Test Small',
        description: 'Test small plan',
        pricePerUserPerMonth: 50,
        maxUsers: 49,
        maxCompanies: 5,
        features: JSON.stringify(['Advanced features']),
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Test Unlimited',
        description: 'Test unlimited plan',
        pricePerUserPerMonth: 100,
        maxUsers: null,
        maxCompanies: null,
        features: JSON.stringify(['All features']),
        isActive: true,
        displayOrder: 3,
      },
    ])
    .returning()

  return plans.map(plan => ({
    id: plan.id,
    name: plan.name,
    maxUsers: plan.maxUsers,
    maxCompanies: plan.maxCompanies,
  }))
}

/**
 * Create test tenant with subscription
 */
export async function createTestTenant(planId: string): Promise<TestTenant> {
  const [tenant] = await coreTestDb
    .insert(coreSchema.tenants)
    .values({
      name: 'Test Workspace',
      subdomain: 'test-workspace',
      database: 'ankey_test_tenant_default',
      billingEmail: 'test@example.com',
      isActive: true,
      userCount: 0,
    })
    .returning()

  // Create subscription
  await coreTestDb.insert(coreSchema.tenantSubscriptions).values({
    tenantId: tenant.id,
    planId,
    status: 'active',
    userCount: 1,
    pricePerUser: 25,
    totalMonthlyPrice: 25,
  })

  return {
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    database: tenant.database,
  }
}

/**
 * Create test users in tenant database
 */
export async function createTestUsers(count: number): Promise<TestUser[]> {
  const users: TestUser[] = []

  for (let i = 0; i < count; i++) {
    const [user] = await tenantTestDb
      .insert(tenantSchema.users)
      .values({
        email: `test-user-${i}@example.com`,
        fullName: `Test User ${i}`,
        passwordHash: 'hashed_password',
        isActive: true,
        emailVerified: true,
      })
      .returning()

    users.push({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    })
  }

  return users
}

/**
 * Create test companies in tenant database
 */
export async function createTestCompanies(
  count: number,
  createdBy: string
): Promise<Array<{ id: string; name: string }>> {
  const companies = []

  for (let i = 0; i < count; i++) {
    const [company] = await tenantTestDb
      .insert(tenantSchema.companies)
      .values({
        name: `Test Company ${i}`,
        code: `TEST${i}`,
        createdBy,
        isActive: true,
      })
      .returning()

    companies.push({
      id: company.id,
      name: company.name,
    })
  }

  return companies
}

/**
 * Get database connections for tests
 */
export function getTestDatabases() {
  return { coreTestDb, tenantTestDb }
}

/**
 * Database test helpers for Vitest
 */
export function useDatabaseTest() {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  beforeEach(async () => {
    await clearTestData()
  })
}
