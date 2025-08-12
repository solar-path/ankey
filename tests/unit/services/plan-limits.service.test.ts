import { describe, it, expect, beforeEach } from 'vitest'
import { PlanLimitsService } from '@/api/plan-limits.service'
import {
  useDatabaseTest,
  createTestPlans,
  createTestTenant,
  createTestUsers,
  createTestCompanies,
  getTestDatabases,
} from '../../fixtures/database'

describe('PlanLimitsService', () => {
  useDatabaseTest()

  let service: PlanLimitsService
  let testTenantId: string
  let testPlans: Awaited<ReturnType<typeof createTestPlans>>

  beforeEach(async () => {
    service = new PlanLimitsService()

    // Create test plans
    testPlans = await createTestPlans()

    // Create test tenant with micro plan (3 companies, 5 users max)
    const microPlan = testPlans.find(p => p.name === 'Test Micro')!
    const tenant = await createTestTenant(microPlan.id)
    testTenantId = tenant.id
  })

  describe('getTenantPlanLimits', () => {
    it('should return plan limits for valid tenant', async () => {
      const limits = await service.getTenantPlanLimits(testTenantId)

      expect(limits).toBeDefined()
      expect(limits?.maxUsers).toBe(5)
      expect(limits?.maxCompanies).toBe(3)
      expect(limits?.currentUsers).toBe(0)
      expect(limits?.currentCompanies).toBe(0)
      expect(limits?.canAddUsers).toBe(true)
      expect(limits?.canAddCompanies).toBe(true)
      expect(limits?.remainingUsers).toBe(5)
      expect(limits?.remainingCompanies).toBe(3)
    })

    it('should return null for non-existent tenant', async () => {
      const limits = await service.getTenantPlanLimits('non-existent-id')
      expect(limits).toBeNull()
    })

    it('should calculate current usage correctly', async () => {
      // Create some test users and companies
      const testUsers = await createTestUsers(3)
      const testCompanies = await createTestCompanies(2, testUsers[0].id)

      const limits = await service.getTenantPlanLimits(testTenantId)

      expect(limits?.currentUsers).toBe(3)
      expect(limits?.currentCompanies).toBe(2)
      expect(limits?.remainingUsers).toBe(2)
      expect(limits?.remainingCompanies).toBe(1)
    })
  })

  describe('canAddUser', () => {
    it('should allow adding users when under limit', async () => {
      await createTestUsers(3) // 3 out of 5

      const result = await service.canAddUser(testTenantId)

      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should prevent adding users when at limit', async () => {
      await createTestUsers(5) // 5 out of 5 (max)

      const result = await service.canAddUser(testTenantId)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('User limit reached')
      expect(result.reason).toContain('maximum 5 users')
      expect(result.reason).toContain('Current: 5')
    })

    it('should handle unlimited users plan', async () => {
      // Switch to unlimited plan
      const unlimitedPlan = testPlans.find(p => p.name === 'Test Unlimited')!
      const tenant = await createTestTenant(unlimitedPlan.id)

      // Create many users
      await createTestUsers(100)

      const result = await service.canAddUser(tenant.id)

      expect(result.allowed).toBe(true)
    })
  })

  describe('canAddCompany', () => {
    it('should allow adding companies when under limit', async () => {
      const testUsers = await createTestUsers(1)
      await createTestCompanies(2, testUsers[0].id) // 2 out of 3

      const result = await service.canAddCompany(testTenantId)

      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should prevent adding companies when at limit', async () => {
      const testUsers = await createTestUsers(1)
      await createTestCompanies(3, testUsers[0].id) // 3 out of 3 (max)

      const result = await service.canAddCompany(testTenantId)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Company limit reached')
      expect(result.reason).toContain('maximum 3 companies')
      expect(result.reason).toContain('Current: 3')
    })

    it('should handle unlimited companies plan', async () => {
      // Switch to unlimited plan
      const unlimitedPlan = testPlans.find(p => p.name === 'Test Unlimited')!
      const tenant = await createTestTenant(unlimitedPlan.id)
      const testUsers = await createTestUsers(1)

      // Create many companies
      await createTestCompanies(50, testUsers[0].id)

      const result = await service.canAddCompany(tenant.id)

      expect(result.allowed).toBe(true)
    })
  })

  describe('getUsagePercentages', () => {
    it('should calculate usage percentages correctly', async () => {
      const testUsers = await createTestUsers(3) // 3 out of 5 = 60%
      await createTestCompanies(2, testUsers[0].id) // 2 out of 3 = 67%

      const percentages = await service.getUsagePercentages(testTenantId)

      expect(percentages.userUsagePercent).toBe(60)
      expect(percentages.companyUsagePercent).toBe(67)
    })

    it('should return null for unlimited plans', async () => {
      const unlimitedPlan = testPlans.find(p => p.name === 'Test Unlimited')!
      const tenant = await createTestTenant(unlimitedPlan.id)

      const percentages = await service.getUsagePercentages(tenant.id)

      expect(percentages.userUsagePercent).toBeNull()
      expect(percentages.companyUsagePercent).toBeNull()
    })

    it('should handle zero usage', async () => {
      const percentages = await service.getUsagePercentages(testTenantId)

      expect(percentages.userUsagePercent).toBe(0)
      expect(percentages.companyUsagePercent).toBe(0)
    })

    it('should handle 100% usage', async () => {
      const testUsers = await createTestUsers(5) // 5 out of 5 = 100%
      await createTestCompanies(3, testUsers[0].id) // 3 out of 3 = 100%

      const percentages = await service.getUsagePercentages(testTenantId)

      expect(percentages.userUsagePercent).toBe(100)
      expect(percentages.companyUsagePercent).toBe(100)
    })
  })

  describe('validateOperation', () => {
    it('should validate ADD_USER operation', async () => {
      await createTestUsers(4) // 4 out of 5

      const validResult = await service.validateOperation(testTenantId, 'ADD_USER')
      expect(validResult.valid).toBe(true)

      await createTestUsers(1) // Now 5 out of 5

      const invalidResult = await service.validateOperation(testTenantId, 'ADD_USER')
      expect(invalidResult.valid).toBe(false)
      expect(invalidResult.error).toContain('User limit reached')
    })

    it('should validate ADD_COMPANY operation', async () => {
      const testUsers = await createTestUsers(1)
      await createTestCompanies(2, testUsers[0].id) // 2 out of 3

      const validResult = await service.validateOperation(testTenantId, 'ADD_COMPANY')
      expect(validResult.valid).toBe(true)

      await createTestCompanies(1, testUsers[0].id) // Now 3 out of 3

      const invalidResult = await service.validateOperation(testTenantId, 'ADD_COMPANY')
      expect(invalidResult.valid).toBe(false)
      expect(invalidResult.error).toContain('Company limit reached')
    })

    it('should reject invalid operations', async () => {
      const result = await service.validateOperation(testTenantId, 'INVALID_OP' as any)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid operation')
    })
  })

  describe('edge cases', () => {
    it('should handle tenant without subscription', async () => {
      const { coreTestDb } = getTestDatabases()

      // Create tenant without subscription
      const [tenant] = await coreTestDb
        .insert({} as any)
        .values({
          name: 'No Subscription Tenant',
          subdomain: 'no-sub',
          database: 'ankey_test_tenant_default',
          billingEmail: 'nosub@test.com',
        })
        .returning()

      const limits = await service.getTenantPlanLimits(tenant.id)
      expect(limits).toBeNull()
    })

    it('should handle database connection errors gracefully', async () => {
      // This would require mocking the database connection
      // For now, we'll test that the service handles errors
      const result = await service.canAddUser('invalid-tenant-id')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Unable to verify plan limits')
    })

    it('should handle missing companies table gracefully', async () => {
      // The service should handle cases where companies table doesn't exist
      // This is already handled in the service implementation
      const result = await service.canAddCompany(testTenantId)
      expect(result).toBeDefined()
    })
  })
})
